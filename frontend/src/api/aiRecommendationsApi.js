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
