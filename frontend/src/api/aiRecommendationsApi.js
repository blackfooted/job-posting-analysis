const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

async function requestAiRecommendations(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options)
  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result?.error?.message || 'AI 추천 결과를 불러오지 못했습니다.',
    )
  }

  return result
}

export function fetchAiRecommendation(postingId) {
  return requestAiRecommendations(
    `/api/ai-recommendations/postings/${postingId}`,
  )
}

export function createAiRecommendationRun(postingId) {
  return requestAiRecommendations(
    `/api/ai-recommendations/postings/${postingId}/runs`,
    {
      method: 'POST',
    },
  )
}

export function fetchAiRecommendationHistory(
  postingId,
  { page = 1, size = 10 } = {},
) {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  return requestAiRecommendations(
    `/api/ai-recommendations/postings/${postingId}/history?${searchParams.toString()}`,
  )
}

export function fetchAiRecommendationHistoryDetail(runId) {
  return requestAiRecommendations(`/api/ai-recommendations/history/${runId}`)
}

export function applyAiRecommendationItems(runId, items) {
  return requestAiRecommendations(
    `/api/ai-recommendations/history/${runId}/apply`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    },
  )
}

export function createAiRecommendationCategoryCandidates(runId, items) {
  return requestAiRecommendations(
    `/api/ai-recommendations/history/${runId}/category-candidates`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    },
  )
}

export function fetchAiRecommendationCategoryCandidates(
  postingId,
  { page = 1, size = 10, status, categoryType } = {},
) {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  if (status) {
    searchParams.append('status', status)
  }

  if (categoryType) {
    searchParams.append('category_type', categoryType)
  }

  return requestAiRecommendations(
    `/api/ai-recommendations/postings/${postingId}/category-candidates?${searchParams.toString()}`,
  )
}

export function updateAiRecommendationCategoryCandidate(candidateId, payload) {
  return requestAiRecommendations(
    `/api/ai-recommendations/category-candidates/${candidateId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  )
}
