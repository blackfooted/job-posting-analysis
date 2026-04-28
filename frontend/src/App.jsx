import { useEffect, useState } from 'react'
import './App.css'
import { fetchDashboardSummary } from './api/dashboardApi'

function App() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadSummary() {
      try {
        const result = await fetchDashboardSummary()

        if (!isMounted) {
          return
        }

        if (result.error) {
          setError(result.error.message || 'Failed to load dashboard summary.')
          return
        }

        setSummary(result.data)
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message || 'Failed to load dashboard summary.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadSummary()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <main className="app">
      <h1>Dashboard Summary</h1>

      {loading && <p>Loading dashboard summary...</p>}

      {!loading && error && <p className="error">{error}</p>}

      {!loading && !error && summary && (
        <section className="summary-grid" aria-label="Dashboard summary">
          <article>
            <span>전체 공고 수</span>
            <strong>{summary.total_postings}</strong>
          </article>
          <article>
            <span>산업 카테고리 수</span>
            <strong>{summary.total_industry_categories}</strong>
          </article>
          <article>
            <span>도메인 카테고리 수</span>
            <strong>{summary.total_domain_categories}</strong>
          </article>
          <article>
            <span>직무 카테고리 수</span>
            <strong>{summary.total_position_categories}</strong>
          </article>
          <article>
            <span>미확정 정제 항목 수</span>
            <strong>{summary.total_unconfirmed_items}</strong>
          </article>
        </section>
      )}
    </main>
  )
}

export default App
