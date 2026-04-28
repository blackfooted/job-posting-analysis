const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

async function requestPostings(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options)

  if (!response.ok) {
    throw new Error(`Postings API request failed: ${response.status}`)
  }

  return response.json()
}

export function fetchPostings() {
  return requestPostings('/api/postings')
}

export function fetchPosting(postingId) {
  return requestPostings(`/api/postings/${postingId}`)
}

export function createPosting(payload) {
  return requestPostings('/api/postings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export function updatePosting(postingId, payload) {
  return requestPostings(`/api/postings/${postingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export function deletePosting(postingId) {
  return requestPostings(`/api/postings/${postingId}`, {
    method: 'DELETE',
  })
}
