import { useEffect, useState } from 'react'
import './App.css'
import {
  fetchDashboardCharts,
  fetchDashboardComparison,
  fetchDashboardSummary,
} from './api/dashboardApi'
import { fetchPostings } from './api/postingsApi'

function App() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [charts, setCharts] = useState(null)
  const [chartsLoading, setChartsLoading] = useState(true)
  const [chartsError, setChartsError] = useState('')
  const [comparison, setComparison] = useState(null)
  const [comparisonLoading, setComparisonLoading] = useState(true)
  const [comparisonError, setComparisonError] = useState('')
  const [postings, setPostings] = useState([])
  const [postingsLoading, setPostingsLoading] = useState(true)
  const [postingsError, setPostingsError] = useState('')

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

    async function loadComparison() {
      try {
        const result = await fetchDashboardComparison()

        if (!isMounted) {
          return
        }

        if (result.error) {
          setComparisonError(
            result.error.message || 'Failed to load dashboard comparison.',
          )
          return
        }

        setComparison(result.data)
      } catch (requestError) {
        if (isMounted) {
          setComparisonError(
            requestError.message || 'Failed to load dashboard comparison.',
          )
        }
      } finally {
        if (isMounted) {
          setComparisonLoading(false)
        }
      }
    }

    async function loadPostings() {
      try {
        const result = await fetchPostings()

        if (!isMounted) {
          return
        }

        if (result.error) {
          setPostingsError(result.error.message || 'Failed to load postings.')
          return
        }

        setPostings(result.data || [])
      } catch (requestError) {
        if (isMounted) {
          setPostingsError(requestError.message || 'Failed to load postings.')
        }
      } finally {
        if (isMounted) {
          setPostingsLoading(false)
        }
      }
    }

    loadSummary()
    loadCharts()
    loadComparison()
    loadPostings()

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

      <section className="comparison" aria-label="Dashboard comparison">
        <h2>Dashboard Comparison</h2>

        {comparisonLoading && <p>Loading dashboard comparison...</p>}

        {!comparisonLoading && comparisonError && (
          <p className="error">{comparisonError}</p>
        )}

        {!comparisonLoading && !comparisonError && comparison && (
          <ComparisonTable items={comparison} />
        )}
      </section>

      <section className="postings" aria-label="Postings">
        <h2>Postings</h2>

        {postingsLoading && <p>Loading postings...</p>}

        {!postingsLoading && postingsError && (
          <p className="error">{postingsError}</p>
        )}

        {!postingsLoading && !postingsError && (
          <PostingsTable items={postings} />
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

function ComparisonTable({ items = [] }) {
  if (items.length === 0) {
    return <p>No data</p>
  }

  return (
    <div className="comparison-table-wrap">
      <table className="comparison-table">
        <thead>
          <tr>
            <th>회사명</th>
            <th>포지션</th>
            <th>산업 카테고리</th>
            <th>도메인 카테고리</th>
            <th>직무 카테고리</th>
            <th>기술/툴</th>
            <th>역량</th>
            <th>미확정 항목 수</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.company}-${item.position}-${index}`}>
              <td>{formatValue(item.company)}</td>
              <td>{formatValue(item.position)}</td>
              <td>{formatValue(item.industry_category)}</td>
              <td>{formatValue(item.domain_category)}</td>
              <td>{formatValue(item.position_category)}</td>
              <td>{formatList(item.extracted_skills)}</td>
              <td>{formatList(item.extracted_competencies)}</td>
              <td>{formatValue(item.unconfirmed_count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PostingsTable({ items = [] }) {
  if (items.length === 0) {
    return <p>No postings</p>
  }

  return (
    <div className="postings-table-wrap">
      <table className="postings-table">
        <thead>
          <tr>
            <th>회사명</th>
            <th>포지션</th>
            <th>고용 형태</th>
            <th>근무 형태</th>
            <th>생성일</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id || `${item.company}-${item.position}-${index}`}>
              <td>{formatValue(item.company)}</td>
              <td>{formatValue(item.position)}</td>
              <td>{formatValue(item.employment_type)}</td>
              <td>{formatValue(item.work_type)}</td>
              <td>{formatValue(item.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatValue(value) {
  return value === null || value === undefined || value === '' ? '-' : value
}

function formatList(value) {
  return Array.isArray(value) && value.length > 0 ? value.join(', ') : '-'
}

export default App

