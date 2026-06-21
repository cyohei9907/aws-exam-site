const BASE_URL = '/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChapterMeta {
  chapter: number
  count: number
  version: string
  is_free: boolean
}

export interface CertInfo {
  cert_id: string
  total: number
  chapters: ChapterMeta[]
}

export interface QuestionTranslation {
  stem: string
  options: Record<string, string>
  analysis: string
}

export interface Question {
  id: string
  cert_id: string
  type: string
  num_options: number
  difficulty: string
  chapter: number
  correct_answers: string[]
  translation: QuestionTranslation
}

export interface CheckResult {
  correct: boolean
  correct_answers: string[]
  analysis: string
}

// ─── Error types ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    return res.json() as Promise<T>
  }

  let message = `HTTP ${res.status}`
  try {
    const body = (await res.json()) as { message?: string; error?: string }
    message = body.message ?? body.error ?? message
  } catch {
    // ignore JSON parse failure — keep generic message
  }

  throw new ApiError(message, undefined, res.status)
}

// ─── Public API functions ─────────────────────────────────────────────────────

/**
 * GET /api/certs
 * Returns the list of all available certifications with chapter metadata.
 */
export async function fetchCerts(): Promise<CertInfo[]> {
  const res = await fetch(`${BASE_URL}/certs`)
  return handleResponse<CertInfo[]>(res)
}

/**
 * GET /api/certs/{certId}/chapters/{chapterId}?lang={lang}
 * Returns questions for the given chapter.
 * Throws ApiError with code 'premium_required' on 403.
 */
export async function fetchChapter(
  certId: string,
  chapterId: number,
  lang: string,
): Promise<Question[]> {
  const res = await fetch(
    `${BASE_URL}/certs/${encodeURIComponent(certId)}/chapters/${chapterId}?lang=${encodeURIComponent(lang)}`,
  )

  if (res.status === 403) {
    throw new ApiError('このチャプターは有料プランが必要です。', 'premium_required', 403)
  }

  return handleResponse<Question[]>(res)
}

