import { FastifyPluginAsync, FastifyReply } from 'fastify';
import { loadManifest, loadChapter, QuestionTranslation, Question } from '../lib/gcs';
import { embedTexts, normalize } from '../lib/embeddings';
import * as vectorStore from '../lib/vectorStore';

// ─── Free chapters policy ─────────────────────────────────────────────────────
// Mirrors chapters.ts (the content-access list, incl. Ch.1 previews). Search
// only ever scans free chapters, so locked/app-only content can never leak.
const FREE_CHAPTERS: Record<string, number[]> = {
  'saa-c03': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
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
  mode?: string; // 'keyword' (default) | 'semantic'
}

// Shape returned for a single hit (shared by keyword and semantic paths).
function toResult(question: Question, lang: Lang, score?: number) {
  const translation = question[lang] ?? question.en ?? question.ja;
  return {
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
    ...(score !== undefined ? { score } : {}),
  };
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
  const mode = rawQuery.mode === 'semantic' ? 'semantic' : 'keyword';

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

  // ── Semantic mode ────────────────────────────────────────────────────────────
  if (mode === 'semantic') {
    const certScope = scopeCertId && scopeCertId !== 'all' ? scopeCertId : null;
    return runSemantic(certScope, q, lang, limit, reply);
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
        results.push(toResult(question, lang));
      }
    }
  }

  return reply.send({ results, total, query: q, lang });
}

// ─── Semantic search implementation ─────────────────────────────────────────────
// Embeds the query, ranks it against the precomputed free-chapter vectors, then
// hydrates each hit's full question. Falls back to 503 `semantic_unavailable`
// (never keyword) when the provider key or the embedding index is missing, so the
// client can decide to retry in keyword mode.
async function runSemantic(
  certScope: string | null,
  q: string,
  lang: Lang,
  limit: number,
  reply: FastifyReply,
) {
  if (!process.env.DASHSCOPE_API_KEY) {
    return reply.code(503).send({ code: 'semantic_unavailable', message: 'Semantic search is not configured.' });
  }

  let available = false;
  try {
    available = await vectorStore.hasLang(lang);
  } catch {
    available = false;
  }
  if (!available) {
    return reply.code(503).send({ code: 'semantic_unavailable', message: 'Semantic index is unavailable.' });
  }

  // Embed + normalize the query.
  let queryVec: Float32Array;
  try {
    const [raw] = await embedTexts([q]);
    if (!raw) throw new Error('empty embedding response');
    queryVec = normalize(raw);
  } catch (err) {
    reply.log.error({ err }, 'semantic query embedding failed');
    return reply.code(503).send({ code: 'semantic_unavailable', message: 'Embedding provider error.' });
  }

  const hits = await vectorStore.semanticSearch(lang, queryVec, { cert: certScope, limit });

  // Hydrate: load each distinct chapter once, then map hits back in score order.
  const chapterKeys = new Set(hits.map((h) => `${h.cert_id}:${h.chapter}`));
  const byId = new Map<string, Question>();
  for (const key of chapterKeys) {
    const [certId, chapterStr] = key.split(':');
    try {
      const questions = await loadChapter(certId, parseInt(chapterStr, 10));
      for (const question of questions) byId.set(question.id, question);
    } catch {
      continue; // a bad chapter shouldn't fail the whole search
    }
  }

  const results = [];
  for (const h of hits) {
    const question = byId.get(h.id);
    if (!question) continue; // hit not found in current data → skip
    results.push(toResult(question, lang, Math.round(h.score * 10000) / 10000));
  }

  return reply.send({ results, total: results.length, query: q, lang, mode: 'semantic' });
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
