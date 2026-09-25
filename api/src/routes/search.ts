import { FastifyPluginAsync, FastifyReply } from 'fastify';
import { loadManifest, loadChapter, QuestionTranslation } from '../lib/gcs';

// ─── Free chapters policy ─────────────────────────────────────────────────────
// Mirrors chapters.ts (the content-access list, incl. Ch.1 previews). Search
// only ever scans free chapters, so locked/app-only content can never leak.
const FREE_CHAPTERS: Record<string, number[]> = {
  'saa-c03': [1, 2, 3, 4, 5],
  'sap-c02': [1, 2, 3],
  'clf-c02': [1, 2, 3],
  'dva-c02': [1, 2, 3],
  'dop-c02': [1, 2, 3],
  'aif-c01': [1, 2, 3],
  'soa-c02': [1],
  'ans-c01': [1],
  'dea-c01': [1],
  'mla-c01': [],
  'mls-c01': [],
  'das-c01': [],
  'scs-c02': [1],
};

type Lang = 'ja' | 'en' | 'zh';

interface SearchQuery {
  q?: string;
  lang?: string;
  limit?: string;
  cert?: string;
}

// ─── Lightweight per-IP rate limiter (no extra dependency) ─────────────────────
// Search scans in-memory cached questions, but the first hit per cert loads a
// few GCS files, so we cap request rate per client at 30 requests / minute.
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 30;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_MAX;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of rateBuckets) if (now > b.resetAt) rateBuckets.delete(ip);
}, RATE_WINDOW_MS).unref?.();

// ─── Matching ──────────────────────────────────────────────────────────────────

function matches(t: QuestionTranslation | undefined, needle: string): boolean {
  if (!t) return false;
  if (t.stem?.toLowerCase().includes(needle)) return true;
  if (t.analysis?.toLowerCase().includes(needle)) return true;
  for (const opt of Object.values(t.options ?? {})) {
    if (opt.toLowerCase().includes(needle)) return true;
  }
  return false;
}

// ─── Shared search implementation ───────────────────────────────────────────────
// `scopeCertId` null → search every cert's free chapters; otherwise just that cert.
// Returns a Fastify reply (validation errors) or the result payload.
async function runSearch(
  scopeCertId: string | null,
  rawQuery: SearchQuery,
  ip: string,
  reply: FastifyReply,
) {
  if (rateLimited(ip)) {
    return reply.code(429).send({ code: 'rate_limited', message: 'Too many searches. Please wait a moment.' });
  }

  const q = (rawQuery.q ?? '').trim();
  if (q.length < 2) {
    return reply.code(400).send({ code: 'query_too_short', message: 'Query must be at least 2 characters' });
  }

  const rawLang = rawQuery.lang ?? 'ja';
  if (!['ja', 'en', 'zh'].includes(rawLang)) {
    return reply.code(400).send({ code: 'invalid_lang', message: 'lang must be ja, en, or zh' });
  }
  const lang = rawLang as Lang;
  const limit = Math.min(Math.max(parseInt(rawQuery.limit ?? '20', 10) || 20, 1), 50);
  const needle = q.toLowerCase();

  const manifest = await loadManifest();

  // Resolve which certs to scan.
  let certIds: string[];
  if (scopeCertId && scopeCertId !== 'all') {
    if (!manifest.certs.some((c) => c.cert_id === scopeCertId)) {
      return reply.code(404).send({ code: 'cert_not_found', message: 'Unknown certification' });
    }
    certIds = [scopeCertId];
  } else {
    certIds = manifest.certs.map((c) => c.cert_id);
  }

  // Build (certId, chapter) targets from free chapters that exist in the manifest.
  const targets: Array<{ certId: string; chapter: number }> = [];
  for (const certId of certIds) {
    const cert = manifest.certs.find((c) => c.cert_id === certId);
    const freeList = FREE_CHAPTERS[certId] ?? [];
    for (const ch of cert?.chapters ?? []) {
      if (freeList.includes(ch.chapter)) targets.push({ certId, chapter: ch.chapter });
    }
  }

  const results: unknown[] = [];
  let total = 0;
  for (const { certId, chapter } of targets) {
    let questions;
    try {
      questions = await loadChapter(certId, chapter);
    } catch {
      continue; // one bad chapter shouldn't fail the whole search
    }
    for (const question of questions) {
      const translation = question[lang] ?? question.en ?? question.ja;
      if (!matches(translation, needle)) continue;
      total += 1;
      if (results.length < limit) {
        results.push({
          id: question.id,
          cert_id: question.cert_id,
          type: question.type,
          num_options: question.num_options,
          difficulty: question.difficulty,
          chapter: question.chapter,
          correct_answers: question.correct_answers,
          translation: translation
            ? { stem: translation.stem, options: translation.options, analysis: translation.analysis }
            : null,
        });
      }
    }
  }

  return reply.send({ results, total, query: q, lang });
}

// ─── Route plugin ─────────────────────────────────────────────────────────────

const searchRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/search?q=&lang=&limit=&cert=<optional>  (cross-cert by default)
  fastify.get<{ Querystring: SearchQuery }>('/search', (request, reply) =>
    runSearch(request.query.cert ?? null, request.query, request.ip, reply),
  );

  // GET /api/certs/:certId/search?q=&lang=&limit=  (scoped to one cert)
  fastify.get<{ Params: { certId: string }; Querystring: SearchQuery }>(
    '/certs/:certId/search',
    (request, reply) => runSearch(request.params.certId, request.query, request.ip, reply),
  );
};

export default searchRoutes;
