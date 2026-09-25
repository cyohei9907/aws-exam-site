import { Storage } from '@google-cloud/storage';

export const BUCKET_NAME = 'aws-storage-iosapp-497614';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const storage = new Storage(); // uses Application Default Credentials
const bucket = storage.bucket(BUCKET_NAME);

// In-memory cache
const cache = new Map<string, { data: unknown; expiresAt: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CertManifest {
  cert_id: string;
  total: number;
  chapters: Array<{ chapter: number; count: number; version: string }>;
}

export interface Manifest {
  version: string;
  generated_at: string;
  certs: CertManifest[];
}

export interface QuestionTranslation {
  stem: string;
  options: Record<string, string>;
  analysis: string;
  references?: string[];
}

export interface Question {
  id: string;
  cert_id: string;
  type: string;
  correct_answers: string[];
  num_options: number;
  difficulty: string;
  chapter: number;
  created_at?: string;
  updated_at?: string;
  en?: QuestionTranslation;
  ja?: QuestionTranslation;
  zh?: QuestionTranslation;
}

// ─── Loader functions ─────────────────────────────────────────────────────────

export async function loadManifest(): Promise<Manifest> {
  const CACHE_KEY = 'manifest';

  const cached = getCached<Manifest>(CACHE_KEY);
  if (cached) return cached;

  const file = bucket.file('questions/manifest.json');
  const [contents] = await file.download();
  const manifest: Manifest = JSON.parse(contents.toString('utf-8'));

  setCache(CACHE_KEY, manifest);
  return manifest;
}

export async function loadChapter(certId: string, chapterId: number): Promise<Question[]> {
  const CACHE_KEY = `${certId}:${chapterId}`;

  const cached = getCached<Question[]>(CACHE_KEY);
  if (cached) return cached;

  const filePath = `questions/${certId}/chapter_${chapterId}.json`;
  const file = bucket.file(filePath);
  const [contents] = await file.download();
  const questions: Question[] = JSON.parse(contents.toString('utf-8'));

  setCache(CACHE_KEY, questions);
  return questions;
}

// ─── Generic JSON helpers (used by the embeddings pipeline) ─────────────────────

/**
 * Download and parse a JSON object at an arbitrary bucket path.
 * Returns null when the object does not exist (404) so callers can treat a
 * missing file as a non-fatal "not built yet" state.
 */
export async function downloadJsonIfExists<T>(gcsPath: string): Promise<T | null> {
  try {
    const [contents] = await bucket.file(gcsPath).download();
    return JSON.parse(contents.toString('utf-8')) as T;
  } catch (err) {
    if ((err as { code?: number })?.code === 404) return null;
    throw err;
  }
}

/** Serialize `data` to JSON and upload it to `gcsPath` (overwrites). */
export async function uploadJson(gcsPath: string, data: unknown): Promise<void> {
  await bucket.file(gcsPath).save(JSON.stringify(data), {
    contentType: 'application/json',
  });
}
