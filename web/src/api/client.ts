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
  score?: number // present on semantic results (cosine similarity, 0–1)
}

export type SearchMode = 'keyword' | 'semantic'

export interface CheckResult {
  correct: boolean
  correct_answers: string[]
  analysis: string
}

export interface SearchResponse {
  results: Question[]
  total: number
  query: string
  lang: string
  mode?: SearchMode
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

/**
 * GET /api/search?q=&lang=&limit=&cert=&mode=   (cross-cert)
 * GET /api/certs/{cert}/search?q=&lang=&limit=&mode=   (scoped to one cert)
 * Searches question stem / options / analysis within FREE chapters only.
 * `mode` selects keyword (default, substring) or semantic (vector) search.
 * Throws ApiError with code 'rate_limited' (429) when throttled, or
 * 'semantic_unavailable' (503) when semantic search is not available.
 */
export async function searchQuestions(
  query: string,
  lang: string,
  opts: { cert?: string; limit?: number; mode?: SearchMode } = {},
): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query, lang })
  if (opts.limit) params.set('limit', String(opts.limit))
  if (opts.mode) params.set('mode', opts.mode)

  const path =
    opts.cert && opts.cert !== 'all'
      ? `/certs/${encodeURIComponent(opts.cert)}/search`
      : '/search'

  const res = await fetch(`${BASE_URL}${path}?${params.toString()}`)

  if (res.status === 429) {
    throw new ApiError('検索が多すぎます。少し待ってからお試しください。', 'rate_limited', 429)
  }

  if (res.status === 503) {
    // Semantic index / provider unavailable — surface the code so the caller
    // can fall back to keyword search.
    let code = 'semantic_unavailable'
    try {
      const body = (await res.json()) as { code?: string }
      if (body.code) code = body.code
    } catch {
      // ignore parse failure — keep default code
    }
    throw new ApiError('Semantic search is temporarily unavailable.', code, 503)
  }

  return handleResponse<SearchResponse>(res)
}

