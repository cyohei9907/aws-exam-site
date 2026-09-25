// ─── DashScope (Alibaba) embeddings ─────────────────────────────────────────────
// Qwen `text-embedding-v3` via the OpenAI-compatible endpoint. 1024-dim,
// multilingual (ja/en/zh) and cross-lingual. Used both by the one-time
// precompute script and by the live semantic-search query path.
//
// The API key is read from process.env.DASHSCOPE_API_KEY. In production the VM
// service must have this env var set (see infra/aws-exam.service). Never hardcode
// the key. Fetch it with:
//   gcloud secrets versions access latest --secret=awsexam-qwen-api-key --project=iosapp-497614

const ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings';
export const EMBEDDING_MODEL = 'text-embedding-v3';
export const EMBEDDING_DIMS = 1024;
const MAX_BATCH = 10; // DashScope batch cap we stay under
const REQUEST_TIMEOUT_MS = 30_000;

export interface EmbedUsage {
  /** Number of HTTP calls made to the embeddings endpoint. */
  calls: number;
  /** Total tokens billed (summed from the API `usage.total_tokens`). */
  totalTokens: number;
}

interface DashScopeEmbeddingResponse {
  data?: Array<{ embedding: number[]; index: number }>;
  usage?: { total_tokens?: number; prompt_tokens?: number };
}

function getApiKey(): string {
  const key = process.env.DASHSCOPE_API_KEY;
  if (!key) {
    throw new Error(
      'DASHSCOPE_API_KEY is not set. Semantic search / embeddings require the Qwen API key. ' +
        'Fetch it with: gcloud secrets versions access latest ' +
        '--secret=awsexam-qwen-api-key --project=iosapp-497614',
    );
  }
  return key;
}

function isTransientError(err: unknown): boolean {
  const e = err as { name?: string; status?: number };
  if (e?.name === 'AbortError') return true; // request timeout
  if (typeof e?.status === 'number') return e.status === 429 || e.status >= 500;
  return true; // network error / unknown → treat as transient
}

async function embedBatchOnce(texts: string[], apiKey: string): Promise<DashScopeEmbeddingResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const err = new Error(
        `DashScope embeddings HTTP ${res.status}: ${body.slice(0, 300)}`,
      ) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }
    return (await res.json()) as DashScopeEmbeddingResponse;
  } finally {
    clearTimeout(timer);
  }
}

// Embed a single batch (≤ MAX_BATCH). Retries once on transient failure.
async function embedBatch(texts: string[], apiKey: string): Promise<{ vectors: number[][]; tokens: number }> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const json = await embedBatchOnce(texts, apiKey);
      const data = json.data ?? [];
      if (data.length !== texts.length) {
        throw new Error(`DashScope returned ${data.length} embeddings for ${texts.length} inputs`);
      }
      // Restore input order using each item's `index`.
      const vectors: number[][] = new Array(texts.length);
      for (const d of data) vectors[d.index] = d.embedding;
      for (let i = 0; i < vectors.length; i++) {
        if (!vectors[i]) throw new Error(`DashScope response missing embedding at index ${i}`);
      }
      return { vectors, tokens: json.usage?.total_tokens ?? 0 };
    } catch (err) {
      lastErr = err;
      if (attempt === 0 && isTransientError(err)) {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

/**
 * Embed `texts` in input order, batching at ≤ MAX_BATCH per request.
 * Also returns aggregate call/token usage (used by the precompute script).
 */
export async function embedTextsWithUsage(
  texts: string[],
): Promise<{ vectors: number[][]; usage: EmbedUsage }> {
  if (texts.length === 0) return { vectors: [], usage: { calls: 0, totalTokens: 0 } };
  const apiKey = getApiKey();
  const vectors: number[][] = [];
  const usage: EmbedUsage = { calls: 0, totalTokens: 0 };
  for (let i = 0; i < texts.length; i += MAX_BATCH) {
    const batch = texts.slice(i, i + MAX_BATCH);
    const { vectors: v, tokens } = await embedBatch(batch, apiKey);
    vectors.push(...v);
    usage.calls += 1;
    usage.totalTokens += tokens;
  }
  return { vectors, usage };
}

/** Embed `texts` in input order. Returns one 1024-dim vector per input. */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  return (await embedTextsWithUsage(texts)).vectors;
}

// ─── Vector math ────────────────────────────────────────────────────────────────

/** L2-normalize a vector into a fresh Float32Array (zero vector stays zero). */
export function normalize(vec: number[] | Float32Array): Float32Array {
  const out = new Float32Array(vec.length);
  let norm = 0;
  for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm === 0) return out;
  for (let i = 0; i < vec.length; i++) out[i] = vec[i] / norm;
  return out;
}

/** Dot product. For already-normalized vectors this equals cosine similarity. */
export function dot(a: Float32Array | number[], b: Float32Array | number[]): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

/**
 * Cosine similarity of two vectors. Prefer normalizing once and using `dot`
 * in hot loops; this is the general-purpose form for arbitrary inputs.
 */
export function cosine(a: Float32Array | number[], b: Float32Array | number[]): number {
  let dotp = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dotp += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dotp / (Math.sqrt(na) * Math.sqrt(nb));
}
