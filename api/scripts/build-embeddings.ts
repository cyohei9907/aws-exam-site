// ─── One-time embedding precompute ──────────────────────────────────────────────
// Embeds every FREE-chapter question (per available language) with Qwen
// text-embedding-v3 and writes compact per-language vector files to GCS:
//
//   gs://<bucket>/questions/embeddings/v3/{ja,en,zh}.json   (array of {id,cert_id,chapter,e})
//   gs://<bucket>/questions/embeddings/v3/meta.json         ({model,dims,built_at,counts})
//
// `e` is base64 of a little-endian Float32Array(1024).
//
// Run (from the api/ package):
//   DASHSCOPE_API_KEY=$(gcloud secrets versions access latest \
//     --secret=awsexam-qwen-api-key --project=iosapp-497614) \
//     pnpm run build:embeddings
//
// Flags: --force / FORCE=1 rebuilds languages even if an up-to-date file exists.

import {
  loadManifest,
  loadChapter,
  uploadJson,
  downloadJsonIfExists,
  BUCKET_NAME,
  Question,
  QuestionTranslation,
} from '../src/lib/gcs';
import { embedTextsWithUsage, EMBEDDING_MODEL, EMBEDDING_DIMS } from '../src/lib/embeddings';

// Free chapters policy — mirrors api/src/routes/search.ts. Search + embeddings
// only ever cover these, so locked/app-only content can never leak.
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
const LANGS: Lang[] = ['ja', 'en', 'zh'];
const OUT_PREFIX = 'questions/embeddings/v3';
const BATCH = 10; // DashScope batch cap
const MAX_TEXT_CHARS = 8000; // safety cap per input (well under model token limit)
const MAX_EMBEDDINGS = 20000; // cost guard: abort if scoping looks wrong
const FORCE = process.argv.includes('--force') || process.env.FORCE === '1';

interface Item {
  id: string;
  cert_id: string;
  chapter: number;
  text: string;
}
interface StoredRecord {
  id: string;
  cert_id: string;
  chapter: number;
  e: string;
}

function buildText(t: QuestionTranslation): string {
  const options = Object.values(t.options ?? {}).join('\n');
  const text = [t.stem ?? '', options, t.analysis ?? '']
    .filter((s) => s && s.trim())
    .join('\n');
  return text.length > MAX_TEXT_CHARS ? text.slice(0, MAX_TEXT_CHARS) : text;
}

// Float32Array (little-endian) → base64.
function encodeVec(vec: number[]): string {
  const f32 = Float32Array.from(vec);
  return Buffer.from(f32.buffer, f32.byteOffset, f32.byteLength).toString('base64');
}

async function main() {
  if (!process.env.DASHSCOPE_API_KEY) {
    console.error(
      'ERROR: DASHSCOPE_API_KEY not set. Run with:\n' +
        '  DASHSCOPE_API_KEY=$(gcloud secrets versions access latest ' +
        '--secret=awsexam-qwen-api-key --project=iosapp-497614) pnpm run build:embeddings',
    );
    process.exit(1);
  }

  const startedAt = new Date().toISOString();
  console.log(`[build-embeddings] model=${EMBEDDING_MODEL} dims=${EMBEDDING_DIMS} force=${FORCE}`);
  console.log(`[build-embeddings] target gs://${BUCKET_NAME}/${OUT_PREFIX}/`);

  const manifest = await loadManifest();

  // ── Gather items per language from free chapters present in the manifest ──────
  const items: Record<Lang, Item[]> = { ja: [], en: [], zh: [] };
  let loadedChapters = 0;
  for (const cert of manifest.certs) {
    const free = FREE_CHAPTERS[cert.cert_id] ?? [];
    for (const chMeta of cert.chapters) {
      if (!free.includes(chMeta.chapter)) continue;
      let questions: Question[];
      try {
        questions = await loadChapter(cert.cert_id, chMeta.chapter);
      } catch (err) {
        console.warn(`  ! failed to load ${cert.cert_id} ch${chMeta.chapter}: ${(err as Error).message}`);
        continue;
      }
      loadedChapters += 1;
      for (const question of questions) {
        for (const lang of LANGS) {
          const tr = question[lang];
          if (!tr) continue;
          const text = buildText(tr);
          if (!text) continue;
          items[lang].push({
            id: question.id,
            cert_id: question.cert_id,
            chapter: question.chapter,
            text,
          });
        }
      }
      console.log(
        `  loaded ${cert.cert_id} ch${chMeta.chapter} (${questions.length} q) ` +
          `→ totals ja:${items.ja.length} en:${items.en.length} zh:${items.zh.length}`,
      );
    }
  }

  const totalEmbeddings = items.ja.length + items.en.length + items.zh.length;
  console.log(
    `[build-embeddings] free chapters loaded: ${loadedChapters}; embeddings to compute: ` +
      `${totalEmbeddings} (ja:${items.ja.length} en:${items.en.length} zh:${items.zh.length})`,
  );

  if (totalEmbeddings > MAX_EMBEDDINGS) {
    console.error(
      `ABORT: ${totalEmbeddings} embeddings exceeds guard ${MAX_EMBEDDINGS}. ` +
        'Free-chapter scoping is likely wrong — refusing to run.',
    );
    process.exit(1);
  }

  // Preliminary meta doubles as an early write-access check.
  await uploadJson(`${OUT_PREFIX}/meta.json`, {
    model: EMBEDDING_MODEL,
    dims: EMBEDDING_DIMS,
    status: 'building',
    started_at: startedAt,
  });

  const counts: Record<Lang, number> = { ja: 0, en: 0, zh: 0 };
  let totalCalls = 0;
  let totalTokens = 0;

  for (const lang of LANGS) {
    const list = items[lang];
    counts[lang] = list.length;
    if (list.length === 0) {
      console.log(`[${lang}] no items — skipping`);
      continue;
    }

    // Resumable-ish: skip a language whose file already matches the item count.
    if (!FORCE) {
      const existing = await downloadJsonIfExists<StoredRecord[]>(`${OUT_PREFIX}/${lang}.json`);
      if (existing && existing.length === list.length) {
        console.log(`[${lang}] already built (${existing.length} records) — skipping (use --force to rebuild)`);
        continue;
      }
    }

    console.log(`[${lang}] embedding ${list.length} items in batches of ${BATCH}…`);
    const records: StoredRecord[] = new Array(list.length);
    for (let i = 0; i < list.length; i += BATCH) {
      const slice = list.slice(i, i + BATCH);
      const { vectors, usage } = await embedTextsWithUsage(slice.map((it) => it.text));
      for (let j = 0; j < slice.length; j++) {
        const vec = vectors[j];
        if (vec.length !== EMBEDDING_DIMS) {
          throw new Error(
            `Unexpected embedding dim ${vec.length} (expected ${EMBEDDING_DIMS}) for ${slice[j].id}`,
          );
        }
        records[i + j] = {
          id: slice[j].id,
          cert_id: slice[j].cert_id,
          chapter: slice[j].chapter,
          e: encodeVec(vec),
        };
      }
      totalCalls += usage.calls;
      totalTokens += usage.totalTokens;
      const done = Math.min(i + BATCH, list.length);
      if (done % 200 === 0 || done >= list.length) {
        console.log(`  [${lang}] ${done}/${list.length} (calls:${totalCalls} tokens:${totalTokens})`);
      }
    }

    await uploadJson(`${OUT_PREFIX}/${lang}.json`, records);
    console.log(`[${lang}] wrote gs://${BUCKET_NAME}/${OUT_PREFIX}/${lang}.json (${records.length} records)`);
  }

  const builtAt = new Date().toISOString();
  await uploadJson(`${OUT_PREFIX}/meta.json`, {
    model: EMBEDDING_MODEL,
    dims: EMBEDDING_DIMS,
    built_at: builtAt,
    counts,
  });

  console.log('─'.repeat(64));
  console.log('[build-embeddings] DONE');
  console.log(`  counts: ja:${counts.ja} en:${counts.en} zh:${counts.zh}`);
  console.log(`  total embed API calls: ${totalCalls}`);
  console.log(`  total tokens: ${totalTokens}`);
  console.log(`  wrote: gs://${BUCKET_NAME}/${OUT_PREFIX}/{ja,en,zh}.json + meta.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
