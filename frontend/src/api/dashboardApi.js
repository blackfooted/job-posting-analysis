const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

async function requestDashboard(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`)

  if (!response.ok) {
    throw new Error(`Dashboard API request failed: ${response.status}`)
  }

  return response.json()
}

export function fetchDashboardSummary() {
  return requestDashboard('/api/dashboard/summary')
}

export function fetchDashboardCharts() {
  return requestDashboard('/api/dashboard/charts')
}

export function fetchDashboardComparison() {
  return requestDashboard('/api/dashboard/comparison')
}
