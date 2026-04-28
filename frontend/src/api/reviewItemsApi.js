const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

async function requestReviewItems(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options)

  if (!response.ok) {
    throw new Error(`Review items API request failed: ${response.status}`)
  }

  return response.json()
}

export function fetchReviewItems({
  page = 1,
  size = 15,
  status = '',
  fieldType = '',
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  if (status) {
    params.set('status', status)
  }

  if (fieldType) {
    params.set('field_type', fieldType)
  }

  return requestReviewItems(`/api/review-items?${params.toString()}`)
}

export function updateReviewItem(reviewItemId, payload) {
  return requestReviewItems(`/api/review-items/${reviewItemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}
