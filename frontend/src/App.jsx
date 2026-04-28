import { useEffect, useState } from 'react'
import './App.css'
import {
  fetchDashboardCharts,
  fetchDashboardSummary,
} from './api/dashboardApi'

function App() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [charts, setCharts] = useState(null)
  const [chartsLoading, setChartsLoading] = useState(true)
  const [chartsError, setChartsError] = useState('')

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

    async function loadCharts() {
      try {
        const result = await fetchDashboardCharts()

        if (!isMounted) {
          return
        }

        if (result.error) {
          setChartsError(
            result.error.message || 'Failed to load dashboard charts.',
          )
          return
        }

        setCharts(result.data)
      } catch (requestError) {
        if (isMounted) {
          setChartsError(
            requestError.message || 'Failed to load dashboard charts.',
          )
        }
      } finally {
        if (isMounted) {
          setChartsLoading(false)
        }
      }
    }

    loadSummary()
    loadCharts()

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

      <section className="charts" aria-label="Dashboard charts">
        <h2>Dashboard Charts</h2>

        {chartsLoading && <p>Loading dashboard charts...</p>}

        {!chartsLoading && chartsError && <p className="error">{chartsError}</p>}

        {!chartsLoading && !chartsError && charts && (
          <div className="chart-groups">
            <ChartList title="산업 분포" items={charts.industry_distribution} />
            <ChartList title="직무 분포" items={charts.position_distribution} />
            <ChartList title="상위 역량" items={charts.top_competencies} />
            <ChartList title="상위 기술/툴" items={charts.top_skills} />
          </div>
        )}
      </section>
    </main>
  )
}

function ChartList({ title, items = [] }) {
  return (
    <article className="chart-list">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p>No data</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.name}>
              <span>{item.name}</span>
              <strong>{item.count}</strong>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

export default App

