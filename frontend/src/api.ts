export type Word = {
  id: number
  term: string
  definition: string
  example?: string
  meanings?: string
  examples?: string
  wordRoot?: string
  similarWords?: string
  examTag?: string
  familiarity?: number
  nextReviewAt?: string
  createdAt?: string
  updatedAt?: string
}

type AuthResponse = { token: string; username: string }
export type VocabAnswerItem = {
  level: string
  prompt: string
  correctOption: string
  selectedOption: string
  correct: boolean
}

export type VocabAnalysisRequest = {
  score: number
  total: number
  timeUsedSeconds: number
  levelEstimate: string
  answers: VocabAnswerItem[]
}

export type VocabAnalysisResponse = { analysis: string }
export type StudyStats = { totalDays: number; streakDays: number; lastStudyDate?: string; todayCount: number }
export type StudyOverview = { stats: StudyStats; wordCount: number; dueCount: number }
export type StudyBehavior = {
  avgDurationMinutes: number
  preferredHour: number
  focusScore: number
  consistencyScore: number
  sessionsLast7Days: number
  todayMinutes: number
}
export type ImportResult = { importedCount: number; skippedCount: number }
export type TodayStudyResponse = { words: Word[]; todayCount: number }

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080'

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const contentType = res.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      try {
        const data = (await res.json()) as unknown
        const msg =
          typeof data === 'object' && data && 'message' in data && typeof (data as any).message === 'string'
            ? (data as any).message
            : JSON.stringify(data)
        throw new Error(msg || `请求失败: ${res.status}`)
      } catch {
        throw new Error(`请求失败: ${res.status}`)
      }
    }
    const message = await res.text()
    throw new Error(message || `请求失败: ${res.status}`)
  }
  return res.json()
}

async function upload<T>(path: string, formData: FormData, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const contentType = res.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      try {
        const data = (await res.json()) as unknown
        const msg =
          typeof data === 'object' && data && 'message' in data && typeof (data as any).message === 'string'
            ? (data as any).message
            : JSON.stringify(data)
        throw new Error(msg || `请求失败: ${res.status}`)
      } catch {
        throw new Error(`请求失败: ${res.status}`)
      }
    }
    const message = await res.text()
    throw new Error(message || `请求失败: ${res.status}`)
  }
  return res.json()
}

export const api = {
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    })
  },
  async login(username: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },
  async listWords(token: string, q?: string): Promise<Word[]> {
    const search = q ? `?q=${encodeURIComponent(q)}` : ''
    return request<Word[]>(`/api/words${search}`, { method: 'GET' }, token)
  },
  async createWord(
    token: string,
    payload: {
      term: string
      definition: string
      example?: string
      meanings?: string
      examples?: string
      wordRoot?: string
      similarWords?: string
      examTag?: string
    },
  ): Promise<Word> {
    return request<Word>('/api/words', { method: 'POST', body: JSON.stringify(payload) }, token)
  },
  async deleteWord(token: string, id: number): Promise<void> {
    await request<void>(`/api/words/${id}`, { method: 'DELETE' }, token)
  },
  async review(token: string, id: number, correct: boolean): Promise<Word> {
    return request<Word>(`/api/words/${id}/review`, { method: 'POST', body: JSON.stringify({ correct }) }, token)
  },
  async dueWords(token: string): Promise<Word[]> {
    return request<Word[]>('/api/words/due', { method: 'GET' }, token)
  },
  async incorrectWords(token: string): Promise<Word[]> {
    return request<Word[]>('/api/words/incorrect', { method: 'GET' }, token)
  },
  async analyzeVocab(token: string, payload: VocabAnalysisRequest): Promise<VocabAnalysisResponse> {
    return request<VocabAnalysisResponse>('/api/ai/vocab-analysis', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token)
  },
  async getStudyStats(token: string): Promise<StudyStats> {
    return request<StudyStats>('/api/study/stats', { method: 'GET' }, token)
  },
  async getStudyOverview(token: string): Promise<StudyOverview> {
    return request<StudyOverview>('/api/study/overview', { method: 'GET' }, token)
  },
  async getStudyBehavior(token: string): Promise<StudyBehavior> {
    return request<StudyBehavior>('/api/study/behavior', { method: 'GET' }, token)
  },
  async getTodayStudy(token: string, dailyTarget: number, newWordRatio: number, importAfter?: string): Promise<TodayStudyResponse> {
    const params = new URLSearchParams({
      dailyTarget: String(dailyTarget),
      newWordRatio: String(newWordRatio),
    })
    if (importAfter) {
      params.set('importAfter', importAfter)
    }
    return request<TodayStudyResponse>(`/api/study/today?${params.toString()}`, { method: 'GET' }, token)
  },
  async recordStudy(token: string): Promise<StudyStats> {
    return request<StudyStats>('/api/study/record', { method: 'POST' }, token)
  },
  async recordSession(token: string, startedAt: string, durationSeconds: number): Promise<void> {
    await request<void>('/api/study/session', {
      method: 'POST',
      body: JSON.stringify({ startedAt, durationSeconds }),
    }, token)
  },
  async importWords(token: string, file: File): Promise<ImportResult> {
    const formData = new FormData()
    formData.append('file', file)
    return upload<ImportResult>('/api/words/import', formData, token)
  },
}
