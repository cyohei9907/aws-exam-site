// ─── In-memory semantic vector store ────────────────────────────────────────────
// Loads the precomputed per-language embedding files from GCS on first use and
// keeps them in memory (pre-normalized) for fast cosine (= dot) top-k search.
//
// Source files (produced by scripts/build-embeddings.ts):
//   gs://<bucket>/questions/embeddings/v3/{ja,en,zh}.json
// Each is a JSON array of { id, cert_id, chapter, e } where `e` is base64 of a
// little-endian Float32Array(1024). Only FREE-chapter questions are embedded, so
// semantic results can never leak locked content.

import { downloadJsonIfExists } from './gcs';
import { normalize, dot } from './embeddings';

type Lang = 'ja' | 'en' | 'zh';
const LANGS: Lang[] = ['ja', 'en', 'zh'];
const EMB_PREFIX = 'questions/embeddings/v3';

interface StoredRecord {
  id: string;
  cert_id: string;
  chapter: number;
  e: string; // base64(Float32Array little-endian)
}

interface VectorEntry {
  id: string;
  cert_id: string;
  chapter: number;
  vec: Float32Array; // normalized
}

export interface SemanticHit {
  id: string;
  cert_id: string;
  chapter: number;
  score: number;
}

let store: Map<Lang, VectorEntry[]> | null = null;
let loadingPromise: Promise<Map<Lang, VectorEntry[]>> | null = null;

// base64 → Float32Array. Copy into a fresh, 4-byte-aligned ArrayBuffer so the
// typed-array view is always valid. Little-endian, matching the writer and every
// platform Node runs this service on (x64/arm64).
function decodeVec(b64: string): Float32Array {
  const buf = Buffer.from(b64, 'base64');
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  return new Float32Array(ab);
}

async function loadAll(): Promise<Map<Lang, VectorEntry[]>> {
  const map = new Map<Lang, VectorEntry[]>();
  for (const lang of LANGS) {
    const records = await downloadJsonIfExists<StoredRecord[]>(`${EMB_PREFIX}/${lang}.json`);
    if (!records) continue; // file absent → that language stays unavailable (non-fatal)
    const entries: VectorEntry[] = new Array(records.length);
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      entries[i] = {
        id: r.id,
        cert_id: r.cert_id,
        chapter: r.chapter,
        vec: normalize(decodeVec(r.e)),
      };
    }
    map.set(lang, entries);
  }
  return map;
}

async function ensureLoaded(): Promise<Map<Lang, VectorEntry[]>> {
  if (store) return store;
  if (!loadingPromise) {
    loadingPromise = loadAll()
      .then((m) => {
        store = m;
        return m;
      })
      .catch((err) => {
        loadingPromise = null; // let a later request retry
        throw err;
      });
  }
  return loadingPromise;
}

/**
 * Eagerly load the embedding files at startup. Non-fatal: logs and returns even
 * when the files are missing or GCS is unreachable (semantic search then 503s
 * until they exist).
 */
export async function warm(): Promise<void> {
  try {
    const m = await ensureLoaded();
    const counts = LANGS.map((l) => `${l}:${m.get(l)?.length ?? 0}`).join(' ');
    console.log(`[vectorStore] warmed (${counts})`);
  } catch (err) {
    console.warn(
      `[vectorStore] warm failed — semantic search will be unavailable until fixed: ${(err as Error).message}`,
    );
  }
}

/** Whether a given language has a loaded, non-empty vector set. */
export async function hasLang(lang: Lang): Promise<boolean> {
  try {
    const m = await ensureLoaded();
    return (m.get(lang)?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Top-`limit` cosine matches for `queryVec` (which MUST be normalized) within a
 * language, optionally filtered to a single cert. Returns hits sorted by
 * descending score.
 */
export async function semanticSearch(
  lang: Lang,
  queryVec: Float32Array,
  opts: { cert?: string | null; limit: number },
): Promise<SemanticHit[]> {
  const m = await ensureLoaded();
  const entries = m.get(lang);
  if (!entries || entries.length === 0) return [];

  const cert = opts.cert && opts.cert !== 'all' ? opts.cert : null;
  const limit = Math.max(1, opts.limit);

  const scored: SemanticHit[] = [];
  for (const e of entries) {
    if (cert && e.cert_id !== cert) continue;
    scored.push({ id: e.id, cert_id: e.cert_id, chapter: e.chapter, score: dot(queryVec, e.vec) });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
