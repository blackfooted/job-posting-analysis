import { useEffect, useState } from 'react'
import './App.css'
import {
  fetchDashboardCharts,
  fetchDashboardComparison,
  fetchDashboardSummary,
} from './api/dashboardApi'
import {
  createPosting,
  deletePosting,
  fetchPosting,
  fetchPostingAnalysis,
  fetchPostings,
  updatePosting,
} from './api/postingsApi'
import { fetchReviewItems, updateReviewItem } from './api/reviewItemsApi'

const postingFormValidationMessages = {
  company: '회사명을 입력하세요.',
  position: '포지션을 입력하세요.',
  duties: '담당 업무를 입력하세요.',
  requirements: '자격 요건을 입력하세요.',
  raw_text: '원문을 입력하세요.',
}

function App() {
  const reviewItemsPageSize = 15
  const initialPostingForm = {
    company: '',
    position: '',
    duties: '',
    requirements: '',
    preferred: '',
    tools: '',
    experience: '',
    employment_type: '',
    work_type: '',
    industry_memo: '',
    raw_text: '',
  }
  const [activePage, setActivePage] = useState('dashboard')
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)
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
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const [isEditingPosting, setIsEditingPosting] = useState(false)
  const [createFormState, setCreateFormState] = useState(initialPostingForm)
  const [editFormState, setEditFormState] = useState(initialPostingForm)
  const [createFormErrors, setCreateFormErrors] = useState({})
  const [editFormErrors, setEditFormErrors] = useState({})
  const [postingCreateLoading, setPostingCreateLoading] = useState(false)
  const [postingCreateError, setPostingCreateError] = useState('')
  const [postingCreateMessage, setPostingCreateMessage] = useState('')
  const [selectedPosting, setSelectedPosting] = useState(null)
  const [selectedPostingLoading, setSelectedPostingLoading] = useState(false)
  const [selectedPostingError, setSelectedPostingError] = useState('')
  const [selectedPostingAnalysis, setSelectedPostingAnalysis] = useState(null)
  const [selectedPostingAnalysisLoading, setSelectedPostingAnalysisLoading] =
    useState(false)
  const [selectedPostingAnalysisError, setSelectedPostingAnalysisError] =
    useState('')
  const [deletingPostingId, setDeletingPostingId] = useState(null)
  const [postingDeleteError, setPostingDeleteError] = useState('')
  const [reviewItems, setReviewItems] = useState([])
  const [reviewItemsPageInfo, setReviewItemsPageInfo] = useState({
    page: 1,
    size: 15,
    total: 0,
  })
  const [reviewItemsLoading, setReviewItemsLoading] = useState(true)
  const [reviewItemsError, setReviewItemsError] = useState('')
  const [savingReviewItemId, setSavingReviewItemId] = useState(null)
  const [reviewItemSaveError, setReviewItemSaveError] = useState('')
  const [reviewItemSaveMessage, setReviewItemSaveMessage] = useState('')
  const [selectedReviewItemIds, setSelectedReviewItemIds] = useState([])
  const [reviewItemDrafts, setReviewItemDrafts] = useState({})
  const [isBulkSavingReviewItems, setIsBulkSavingReviewItems] = useState(false)
  const [bulkReviewItemSaveMessage, setBulkReviewItemSaveMessage] =
    useState('')
  const [bulkReviewItemSaveError, setBulkReviewItemSaveError] = useState('')
  const [reviewItemsStatusFilter, setReviewItemsStatusFilter] = useState('')
  const [reviewItemsFieldTypeFilter, setReviewItemsFieldTypeFilter] =
    useState('')
  const [reviewItemsDictionaryApplyFilter, setReviewItemsDictionaryApplyFilter] =
    useState('')
  const [reviewItemsKeywordFilter, setReviewItemsKeywordFilter] = useState('')

  async function loadSummary(shouldUpdate = () => true) {
    setLoading(true)
    setError('')

    try {
      const result = await fetchDashboardSummary()

      if (!shouldUpdate()) {
        return
      }

      if (result.error) {
        setError(result.error.message || 'Failed to load dashboard summary.')
        return
      }

      setSummary(result.data)
    } catch (requestError) {
      if (shouldUpdate()) {
        setError(requestError.message || 'Failed to load dashboard summary.')
      }
    } finally {
      if (shouldUpdate()) {
        setLoading(false)
      }
    }
  }

  async function loadCharts(shouldUpdate = () => true) {
    setChartsLoading(true)
    setChartsError('')

    try {
      const result = await fetchDashboardCharts()

      if (!shouldUpdate()) {
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
      if (shouldUpdate()) {
        setChartsError(
          requestError.message || 'Failed to load dashboard charts.',
        )
      }
    } finally {
      if (shouldUpdate()) {
        setChartsLoading(false)
      }
    }
  }

  async function loadComparison(shouldUpdate = () => true) {
    setComparisonLoading(true)
    setComparisonError('')

    try {
      const result = await fetchDashboardComparison()

      if (!shouldUpdate()) {
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
      if (shouldUpdate()) {
        setComparisonError(
          requestError.message || 'Failed to load dashboard comparison.',
        )
      }
    } finally {
      if (shouldUpdate()) {
        setComparisonLoading(false)
      }
    }
  }

  async function loadPostings(shouldUpdate = () => true) {
    setPostingsLoading(true)
    setPostingsError('')

    try {
      const result = await fetchPostings()

      if (!shouldUpdate()) {
        return
      }

      if (result.error) {
        setPostingsError(result.error.message || 'Failed to load postings.')
        return
      }

      setPostings(result.data || [])
    } catch (requestError) {
      if (shouldUpdate()) {
        setPostingsError(requestError.message || 'Failed to load postings.')
      }
    } finally {
      if (shouldUpdate()) {
        setPostingsLoading(false)
      }
    }
  }

  useEffect(() => {
    let isMounted = true

    loadSummary(() => isMounted)
    loadCharts(() => isMounted)
    loadComparison(() => isMounted)
    loadPostings(() => isMounted)
    loadReviewItemsPage(1, () => isMounted)

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!isNavigationOpen) {
      return undefined
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isNavigationOpen])

  async function handleViewPostingDetail(postingId) {
    setSelectedPosting(null)
    setSelectedPostingError('')
    setSelectedPostingAnalysis(null)
    setSelectedPostingAnalysisError('')
    setPostingDeleteError('')
    setSelectedPostingLoading(true)
    setSelectedPostingAnalysisLoading(true)

    try {
      const { detailResult, analysisResult, analysisError } =
        await fetchPostingDetailAndAnalysis(postingId)

      if (detailResult.error) {
        setSelectedPostingError(
          detailResult.error.message || 'Failed to load posting detail.',
        )
        return
      }

      setSelectedPosting(detailResult.data)
      setEditFormState(_postingToForm(detailResult.data, initialPostingForm))
      setEditFormErrors({})
      setIsCreateFormOpen(false)
      setIsEditingPosting(false)
      setPostingCreateError('')
      setPostingCreateMessage('')
      applyPostingAnalysisResult(analysisResult, analysisError)
    } catch (requestError) {
      setSelectedPostingError(
        requestError.message || 'Failed to load posting detail.',
      )
    } finally {
      setSelectedPostingLoading(false)
      setSelectedPostingAnalysisLoading(false)
    }
  }

  function handlePostingFormChange(event) {
    const { name, value } = event.target
    setCreateFormState((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
    clearPostingFieldError(setCreateFormErrors, name)
  }

  function handleEditPostingFormChange(event) {
    const { name, value } = event.target
    setEditFormState((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
    clearPostingFieldError(setEditFormErrors, name)
  }

  function handleOpenCreateForm() {
    setIsCreateFormOpen(true)
    setIsEditingPosting(false)
    setCreateFormState(initialPostingForm)
    setCreateFormErrors({})
    setPostingCreateError('')
    setPostingCreateMessage('')
  }

  function handleCancelCreatePosting() {
    setIsCreateFormOpen(false)
    setCreateFormState(initialPostingForm)
    setCreateFormErrors({})
    setPostingCreateError('')
    setPostingCreateMessage('')
  }

  async function handleCreatePosting(event) {
    event.preventDefault()
    setPostingCreateError('')
    setPostingCreateMessage('')

    const validationErrors = validatePostingForm(createFormState)

    if (hasPostingFormErrors(validationErrors)) {
      setCreateFormErrors(validationErrors)
      return
    }

    setCreateFormErrors({})
    setPostingCreateLoading(true)

    try {
      const result = await createPosting(createFormState)

      if (result.error) {
        setPostingCreateError(
          result.error.message || 'Failed to create posting.',
        )
        return
      }

      await loadPostings()
      setCreateFormState(initialPostingForm)
      setCreateFormErrors({})
      setIsCreateFormOpen(false)
      setPostingCreateMessage('공고가 저장되었습니다.')
    } catch (requestError) {
      setPostingCreateError(
        requestError.message || 'Failed to create posting.',
      )
    } finally {
      setPostingCreateLoading(false)
    }
  }

  async function handleUpdatePosting(event) {
    event.preventDefault()
    if (!selectedPosting) {
      return
    }

    setPostingCreateError('')
    setPostingCreateMessage('')

    const validationErrors = validatePostingForm(editFormState)

    if (hasPostingFormErrors(validationErrors)) {
      setEditFormErrors(validationErrors)
      return
    }

    setEditFormErrors({})
    setPostingCreateLoading(true)

    try {
      const result = await updatePosting(selectedPosting.id, editFormState)

      if (result.error) {
        setPostingCreateError(
          result.error.message || 'Failed to update posting.',
        )
        return
      }

      setSelectedPostingAnalysisLoading(true)
      const [{ detailResult, analysisResult, analysisError }] =
        await Promise.all([
          fetchPostingDetailAndAnalysis(selectedPosting.id),
          loadPostings(),
        ])

      if (detailResult.error) {
        setSelectedPostingError(
          detailResult.error.message || 'Failed to load posting detail.',
        )
        return
      }

      setSelectedPosting(detailResult.data)
      setEditFormState(_postingToForm(detailResult.data, initialPostingForm))
      setEditFormErrors({})
      applyPostingAnalysisResult(analysisResult, analysisError)
      setIsEditingPosting(false)
      setPostingCreateMessage('공고가 수정되었습니다.')
    } catch (requestError) {
      setPostingCreateError(
        requestError.message || 'Failed to update posting.',
      )
    } finally {
      setPostingCreateLoading(false)
      setSelectedPostingAnalysisLoading(false)
    }
  }

  async function handleDeletePosting() {
    if (!selectedPosting) {
      return
    }

    setPostingDeleteError('')

    const shouldDelete = window.confirm('선택한 공고를 삭제하시겠습니까?')

    if (!shouldDelete) {
      return
    }

    setDeletingPostingId(selectedPosting.id)

    try {
      const result = await deletePosting(selectedPosting.id)

      if (result.error) {
        setPostingDeleteError(result.error.message || '공고 삭제에 실패했습니다.')
        return
      }

      await loadPostings()
      setSelectedPosting(null)
      setSelectedPostingAnalysis(null)
      setSelectedPostingAnalysisError('')
      setIsEditingPosting(false)
      setEditFormState(initialPostingForm)
      setEditFormErrors({})
      setPostingDeleteError('')
    } catch (requestError) {
      setPostingDeleteError(requestError.message || '공고 삭제에 실패했습니다.')
    } finally {
      setDeletingPostingId(null)
    }
  }

  async function refreshSelectedPosting(postingId) {
    const detailResult = await fetchPosting(postingId)

    if (detailResult.error) {
      setSelectedPostingError(
        detailResult.error.message || 'Failed to load posting detail.',
      )
      return
    }

    setSelectedPosting(detailResult.data)
    setEditFormState(_postingToForm(detailResult.data, initialPostingForm))
  }

  async function fetchPostingDetailAndAnalysis(postingId) {
    const [detailResult, analysisOutcome] = await Promise.all([
      fetchPosting(postingId),
      fetchPostingAnalysis(postingId)
        .then((analysisResult) => ({ analysisResult, analysisError: null }))
        .catch((analysisError) => ({ analysisResult: null, analysisError })),
    ])

    return {
      detailResult,
      analysisResult: analysisOutcome.analysisResult,
      analysisError: analysisOutcome.analysisError,
    }
  }

  function applyPostingAnalysisResult(analysisResult, analysisError) {
    if (analysisError) {
      setSelectedPostingAnalysis(null)
      setSelectedPostingAnalysisError(
        analysisError.message || '분석 결과를 불러오지 못했습니다.',
      )
      return
    }

    if (analysisResult?.error) {
      setSelectedPostingAnalysis(null)
      setSelectedPostingAnalysisError(
        analysisResult.error.message || '분석 결과를 불러오지 못했습니다.',
      )
      return
    }

    setSelectedPostingAnalysis(analysisResult?.data || null)
    setSelectedPostingAnalysisError('')
  }

  function handleEditPosting() {
    setIsEditingPosting(true)
    setIsCreateFormOpen(false)
    setEditFormState(_postingToForm(selectedPosting, initialPostingForm))
    setEditFormErrors({})
    setPostingCreateError('')
    setPostingCreateMessage('')
    setPostingDeleteError('')
  }

  function handleCancelEditPosting() {
    setIsEditingPosting(false)
    setEditFormErrors({})
    setPostingCreateError('')
    setPostingCreateMessage('')
    setPostingDeleteError('')
  }

  async function loadReviewItemsPage(
    page,
    shouldUpdate = () => true,
    filters = {
      status: reviewItemsStatusFilter,
      fieldType: reviewItemsFieldTypeFilter,
      dictionaryApply: reviewItemsDictionaryApplyFilter,
      keyword: reviewItemsKeywordFilter,
    },
  ) {
    setReviewItemsLoading(true)
    setReviewItemsError('')

    try {
      const result = await fetchReviewItems({
        page,
        size: reviewItemsPageSize,
        status: filters.status,
        fieldType: filters.fieldType,
        dictionaryApply: filters.dictionaryApply,
        keyword: filters.keyword,
      })

      if (!shouldUpdate()) {
        return
      }

      if (result.error) {
        setReviewItemsError(
          result.error.message || 'Failed to load review items.',
        )
        return
      }

      const nextReviewItems = result.data?.items || []
      setReviewItems(nextReviewItems)
      setReviewItemDrafts(createReviewItemDrafts(nextReviewItems))
      setSelectedReviewItemIds([])
      setReviewItemsPageInfo({
        page: result.data?.page || page,
        size: result.data?.size || reviewItemsPageSize,
        total: result.data?.total || 0,
      })
    } catch (requestError) {
      if (shouldUpdate()) {
        setReviewItemsError(
          requestError.message || 'Failed to load review items.',
        )
      }
    } finally {
      if (shouldUpdate()) {
        setReviewItemsLoading(false)
      }
    }
  }

  async function handleSaveReviewItem(reviewItemId) {
    if (isBulkSavingReviewItems) {
      return
    }

    const payload = getReviewItemSavePayload(reviewItemId)
    setSavingReviewItemId(reviewItemId)
    setReviewItemSaveError('')
    setReviewItemSaveMessage('')
    setBulkReviewItemSaveMessage('')
    setBulkReviewItemSaveError('')

    try {
      const result = await updateReviewItem(reviewItemId, payload)

      if (result.error) {
        setReviewItemSaveMessage('')
        setReviewItemSaveError(
          result.error.message || 'Failed to save review item.',
        )
        return
      }

      await loadReviewItemsPage(reviewItemsPageInfo.page)
      setReviewItemSaveMessage('정제 항목이 저장되었습니다.')
    } catch (requestError) {
      setReviewItemSaveMessage('')
      setReviewItemSaveError(
        requestError.message || 'Failed to save review item.',
      )
    } finally {
      setSavingReviewItemId(null)
    }
  }

  async function handleRefreshDashboard() {
    await Promise.all([loadSummary(), loadCharts(), loadComparison()])
  }

  function handleSearchReviewItems() {
    setReviewItemSaveMessage('')
    setReviewItemSaveError('')
    setBulkReviewItemSaveMessage('')
    setBulkReviewItemSaveError('')
    setSelectedReviewItemIds([])
    loadReviewItemsPage(1)
  }

  function handleResetReviewItemFilters() {
    setReviewItemSaveMessage('')
    setReviewItemSaveError('')
    setBulkReviewItemSaveMessage('')
    setBulkReviewItemSaveError('')
    setSelectedReviewItemIds([])
    const resetFilters = {
      status: '',
      fieldType: '',
      dictionaryApply: '',
      keyword: '',
    }

    setReviewItemsStatusFilter('')
    setReviewItemsFieldTypeFilter('')
    setReviewItemsDictionaryApplyFilter('')
    setReviewItemsKeywordFilter('')
    loadReviewItemsPage(1, () => true, resetFilters)
  }

  function handleReviewItemFilterChange(setFilterValue, value) {
    clearReviewItemListMessages()
    setFilterValue(value)
  }

  function handleReviewItemDraftChange(reviewItemId, fieldName, value) {
    setReviewItemDrafts((currentDrafts) => ({
      ...currentDrafts,
      [reviewItemId]: {
        ...currentDrafts[reviewItemId],
        [fieldName]: value,
      },
    }))
  }

  function handleToggleReviewItemSelection(reviewItemId) {
    setSelectedReviewItemIds((currentIds) =>
      currentIds.includes(reviewItemId)
        ? currentIds.filter((id) => id !== reviewItemId)
        : [...currentIds, reviewItemId],
    )
  }

  function clearReviewItemListMessages() {
    setReviewItemSaveMessage('')
    setReviewItemSaveError('')
    setBulkReviewItemSaveMessage('')
    setBulkReviewItemSaveError('')
    setSelectedReviewItemIds([])
  }

  async function handleBulkSaveReviewItems() {
    if (
      selectedReviewItemIds.length === 0 ||
      reviewItemsLoading ||
      savingReviewItemId !== null
    ) {
      return
    }

    setIsBulkSavingReviewItems(true)
    setReviewItemSaveError('')
    setReviewItemSaveMessage('')
    setBulkReviewItemSaveMessage('')
    setBulkReviewItemSaveError('')

    let successCount = 0
    let failureCount = 0

    for (const reviewItemId of selectedReviewItemIds) {
      try {
        const result = await updateReviewItem(
          reviewItemId,
          getReviewItemSavePayload(reviewItemId),
        )

        if (result.error) {
          failureCount += 1
        } else {
          successCount += 1
        }
      } catch {
        failureCount += 1
      }
    }

    await loadReviewItemsPage(reviewItemsPageInfo.page)

    if (successCount > 0 && failureCount === 0) {
      setBulkReviewItemSaveMessage('선택한 정제 항목이 저장되었습니다.')
    } else if (successCount > 0 && failureCount > 0) {
      setBulkReviewItemSaveError(
        `일부 정제 항목 저장에 실패했습니다. 성공 ${successCount}건 / 실패 ${failureCount}건`,
      )
    } else {
      setBulkReviewItemSaveError('선택한 정제 항목 저장에 실패했습니다.')
    }

    setIsBulkSavingReviewItems(false)
  }

  function getReviewItemSavePayload(reviewItemId) {
    const draft = reviewItemDrafts[reviewItemId] || {}
    const approvedValue = (draft.approved_value || '').trim()

    return {
      approved_value: approvedValue === '' ? null : approvedValue,
      status: draft.status || 'unconfirmed',
      dictionary_apply: draft.dictionary_apply ? 1 : 0,
    }
  }

  const navigationItems = [
    { id: 'dashboard', label: '대시보드' },
    { id: 'postings', label: '개별 공고 분석' },
    { id: 'reviewItems', label: '데이터 정제 관리' },
    { id: 'aiRecommendations', label: 'AI 추천 관리' },
  ]
  const activePageLabel =
    navigationItems.find((item) => item.id === activePage)?.label || ''

  function handleNavigationClick(pageId) {
    setActivePage(pageId)
    setIsNavigationOpen(false)
  }

  const reviewItemsTotalPages =
    reviewItemsPageInfo.size > 0
      ? Math.ceil(reviewItemsPageInfo.total / reviewItemsPageInfo.size)
      : 0
  const isReviewItemsFirstPage = reviewItemsPageInfo.page <= 1
  const isReviewItemsLastPage =
    reviewItemsTotalPages === 0 ||
    reviewItemsPageInfo.page >= reviewItemsTotalPages
  const isDashboardRefreshing = loading || chartsLoading || comparisonLoading

  return (
    <div className="app">
      <header className="mobile-header">
        <button
          type="button"
          className="hamburger-button"
          aria-label="Open navigation"
          aria-expanded={isNavigationOpen}
          onClick={() => setIsNavigationOpen((isOpen) => !isOpen)}
        >
          <span />
          <span />
          <span />
        </button>
        <strong>{activePageLabel}</strong>
      </header>

      {isNavigationOpen && (
        <button
          type="button"
          className="navigation-backdrop"
          aria-label="Close navigation"
          onClick={() => setIsNavigationOpen(false)}
        />
      )}

      <aside
        className={`lnb ${isNavigationOpen ? 'is-open' : ''}`}
        aria-label="Primary navigation"
      >
        <nav>
          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`lnb-button ${
                activePage === item.id ? 'is-active' : ''
              }`}
              onClick={() => handleNavigationClick(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="app-content">
        {activePage === 'dashboard' && (
          <>
            <div className="dashboard-header">
              <h1>Dashboard Summary</h1>
              <button
                type="button"
                onClick={handleRefreshDashboard}
                disabled={isDashboardRefreshing}
              >
                {isDashboardRefreshing ? '새로고침 중...' : '새로고침'}
              </button>
            </div>

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

              {!chartsLoading && chartsError && (
                <p className="error">{chartsError}</p>
              )}

              {!chartsLoading && !chartsError && charts && (
                <div className="chart-groups">
                  <ChartList
                    title="산업 분포"
                    items={charts.industry_distribution}
                  />
                  <ChartList
                    title="직무 분포"
                    items={charts.position_distribution}
                  />
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
          </>
        )}

        {activePage === 'postings' && (
          <>
            <div className="posting-page-header">
              <h1>개별 공고 분석</h1>
              <button type="button" onClick={handleOpenCreateForm}>
                신규등록
              </button>
            </div>

            <section className="postings" aria-label="Postings">
              <h2>Postings</h2>

              {postingsLoading && <p>Loading postings...</p>}

              {!postingsLoading && postingsError && (
                <p className="error">{postingsError}</p>
              )}

              {!postingsLoading && !postingsError && (
                <PostingsTable
                  items={postings}
                  onViewDetail={handleViewPostingDetail}
                />
              )}
            </section>

            {isCreateFormOpen && (
              <section className="posting-create" aria-label="Create posting">
                <h2>신규 공고 등록</h2>
                <p className="form-note">모든 필드를 입력한 뒤 저장하세요.</p>

                {postingCreateError && (
                  <p className="error">{postingCreateError}</p>
                )}

                {postingCreateMessage && <p>{postingCreateMessage}</p>}

                <PostingForm
                  errors={createFormErrors}
                  form={createFormState}
                  isSaving={postingCreateLoading}
                  submitLabel="등록"
                  onCancel={handleCancelCreatePosting}
                  onChange={handlePostingFormChange}
                  onSubmit={handleCreatePosting}
                />
              </section>
            )}

            <section className="posting-detail" aria-label="Posting detail">
              <h2>Posting Detail</h2>

              {!selectedPostingLoading &&
                !selectedPostingError &&
                !selectedPosting && (
                  <p>공고를 선택하면 상세 정보가 표시됩니다.</p>
                )}

              {selectedPostingLoading && <p>Loading posting detail...</p>}

              {!selectedPostingLoading && selectedPostingError && (
                <p className="error">{selectedPostingError}</p>
              )}

              {!selectedPostingLoading &&
                !selectedPostingError &&
                selectedPosting &&
                !isEditingPosting && (
                  <>
                    <div className="posting-detail-actions">
                      <button type="button" onClick={handleEditPosting}>
                        수정
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={handleDeletePosting}
                        disabled={deletingPostingId === selectedPosting.id}
                      >
                        삭제
                      </button>
                    </div>
                    {postingDeleteError && (
                      <p className="error">{postingDeleteError}</p>
                    )}
                    <PostingDetail posting={selectedPosting} />
                    <PostingAnalysisDetail
                      analysis={selectedPostingAnalysis}
                      isLoading={selectedPostingAnalysisLoading}
                      error={selectedPostingAnalysisError}
                    />
                  </>
                )}

              {!selectedPostingLoading &&
                !selectedPostingError &&
                selectedPosting &&
                isEditingPosting && (
                  <div className="posting-edit">
                    <p className="form-note">
                      공고 수정 시 전체 재분류가 발생하며 기존 정제 항목과
                      confirmed 값이 초기화될 수 있습니다.
                    </p>

                    {postingCreateError && (
                      <p className="error">{postingCreateError}</p>
                    )}

                    {postingCreateMessage && <p>{postingCreateMessage}</p>}

                    <PostingForm
                      errors={editFormErrors}
                      form={editFormState}
                      isSaving={postingCreateLoading}
                      submitLabel="수정 저장"
                      onCancel={handleCancelEditPosting}
                      onChange={handleEditPostingFormChange}
                      onSubmit={handleUpdatePosting}
                    />
                  </div>
                )}
            </section>
          </>
        )}

        {activePage === 'reviewItems' && (
          <section className="review-items" aria-label="Review management">
            <h1>데이터 정제 관리</h1>

            <div className="review-items-filters">
              <label>
                <span>Status</span>
                <select
                  value={reviewItemsStatusFilter}
                  onChange={(event) =>
                    handleReviewItemFilterChange(
                      setReviewItemsStatusFilter,
                      event.target.value,
                    )
                  }
                >
                  <option value="">전체</option>
                  <option value="unconfirmed">unconfirmed</option>
                  <option value="confirmed">confirmed</option>
                </select>
              </label>
              <label>
                <span>Field type</span>
                <select
                  value={reviewItemsFieldTypeFilter}
                  onChange={(event) =>
                    handleReviewItemFilterChange(
                      setReviewItemsFieldTypeFilter,
                      event.target.value,
                    )
                  }
                >
                  <option value="">전체</option>
                  <option value="industry">industry</option>
                  <option value="domain">domain</option>
                  <option value="position">position</option>
                  <option value="skill">skill</option>
                  <option value="competency">competency</option>
                </select>
              </label>
              <label>
                <span>Dictionary apply</span>
                <select
                  value={reviewItemsDictionaryApplyFilter}
                  onChange={(event) =>
                    handleReviewItemFilterChange(
                      setReviewItemsDictionaryApplyFilter,
                      event.target.value,
                    )
                  }
                >
                  <option value="">전체</option>
                  <option value="0">미반영</option>
                  <option value="1">반영</option>
                </select>
              </label>
              <label>
                <span>Keyword</span>
                <input
                  type="search"
                  value={reviewItemsKeywordFilter}
                  onChange={(event) =>
                    handleReviewItemFilterChange(
                      setReviewItemsKeywordFilter,
                      event.target.value,
                    )
                  }
                  placeholder="raw_value 또는 approved_value 검색"
                />
              </label>
              <button
                type="button"
                onClick={handleSearchReviewItems}
                disabled={reviewItemsLoading}
              >
                조회
              </button>
              <button
                type="button"
                onClick={handleResetReviewItemFilters}
                disabled={reviewItemsLoading}
              >
                초기화
              </button>
            </div>

            <p className="page-info">
              Page {reviewItemsPageInfo.page} / Size {reviewItemsPageInfo.size}{' '}
              / Total {reviewItemsPageInfo.total}
            </p>

            {reviewItemsLoading && <p>Loading review items...</p>}

            {!reviewItemsLoading && reviewItemsError && (
              <p className="error">{reviewItemsError}</p>
            )}

            {reviewItemSaveError && (
              <p className="error">{reviewItemSaveError}</p>
            )}

            {reviewItemSaveMessage && (
              <p className="success-message">{reviewItemSaveMessage}</p>
            )}

            {bulkReviewItemSaveMessage && (
              <p className="bulk-save-message is-success">
                {bulkReviewItemSaveMessage}
              </p>
            )}

            {bulkReviewItemSaveError && (
              <p className="bulk-save-message is-error">
                {bulkReviewItemSaveError}
              </p>
            )}

            {!reviewItemsLoading &&
              !reviewItemsError &&
              reviewItems.length === 0 && <p>No review items</p>}

            {!reviewItemsLoading &&
              !reviewItemsError &&
              reviewItems.length > 0 && (
                <>
                  <div className="review-items-table-actions">
                    <button
                      type="button"
                      onClick={handleBulkSaveReviewItems}
                      disabled={
                        selectedReviewItemIds.length === 0 ||
                        reviewItemsLoading ||
                        isBulkSavingReviewItems ||
                        savingReviewItemId !== null
                      }
                    >
                      저장
                    </button>
                  </div>
                  <ReviewItemsTable
                    drafts={reviewItemDrafts}
                    isBulkSaving={isBulkSavingReviewItems}
                    items={reviewItems}
                    onDraftChange={handleReviewItemDraftChange}
                    onToggleSelection={handleToggleReviewItemSelection}
                    selectedReviewItemIds={selectedReviewItemIds}
                  />
                </>
              )}

            <div className="review-items-pagination">
              <button
                type="button"
                onClick={() => {
                  clearReviewItemListMessages()
                  loadReviewItemsPage(reviewItemsPageInfo.page - 1)
                }}
                disabled={
                  reviewItemsLoading ||
                  isBulkSavingReviewItems ||
                  isReviewItemsFirstPage
                }
              >
                이전
              </button>
              <button
                type="button"
                onClick={() => {
                  clearReviewItemListMessages()
                  loadReviewItemsPage(reviewItemsPageInfo.page + 1)
                }}
                disabled={
                  reviewItemsLoading ||
                  isBulkSavingReviewItems ||
                  isReviewItemsLastPage
                }
              >
                다음
              </button>
            </div>
          </section>
        )}

        {activePage === 'aiRecommendations' && (
          <section
            className="placeholder-page"
            aria-label="AI recommendation management"
          >
            <h1>AI 추천 관리</h1>
            <p>AI 추천 관리는 후속 단계에서 제공됩니다.</p>
          </section>
        )}
      </main>
    </div>
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

function PostingsTable({ items = [], onViewDetail }) {
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
            <th>상세</th>
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
              <td>
                <button
                  type="button"
                  className="detail-button"
                  onClick={() => onViewDetail(item.id)}
                >
                  상세 보기
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PostingForm({
  errors = {},
  form,
  isSaving,
  submitLabel,
  onCancel,
  onChange,
  onSubmit,
}) {
  const fields = [
    ['company', '회사명', 'input'],
    ['position', '포지션', 'input'],
    ['duties', '담당 업무', 'textarea'],
    ['requirements', '자격 요건', 'textarea'],
    ['preferred', '우대 사항 (선택)', 'textarea'],
    ['tools', '기술/툴 (선택)', 'textarea'],
    ['experience', '경력 (선택)', 'input'],
    ['employment_type', '고용 형태 (선택)', 'input'],
    ['work_type', '근무 형태 (선택)', 'input'],
    ['industry_memo', '산업 메모 (선택)', 'textarea'],
    ['raw_text', '원문', 'textarea'],
  ]

  return (
    <form className="posting-create-form" onSubmit={onSubmit}>
      {hasPostingFormErrors(errors) && (
        <p className="form-validation-summary">필수 입력값을 확인하세요.</p>
      )}

      {fields.map(([name, label, control]) => (
        <label key={name}>
          <span>{label}</span>
          {control === 'textarea' ? (
            <textarea
              name={name}
              value={form[name]}
              onChange={onChange}
              className={errors[name] ? 'has-validation-error' : undefined}
              aria-invalid={errors[name] ? 'true' : undefined}
            />
          ) : (
            <input
              name={name}
              type="text"
              value={form[name]}
              onChange={onChange}
              className={errors[name] ? 'has-validation-error' : undefined}
              aria-invalid={errors[name] ? 'true' : undefined}
            />
          )}
          {errors[name] && (
            <span className="field-validation-error">{errors[name]}</span>
          )}
        </label>
      ))}
      <div className="posting-create-actions">
        <button type="submit" disabled={isSaving}>
          {isSaving ? '저장 중...' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={isSaving}>
          취소
        </button>
      </div>
    </form>
  )
}

function ReviewItemsTable({
  drafts = {},
  isBulkSaving,
  items = [],
  onDraftChange,
  onToggleSelection,
  selectedReviewItemIds = [],
}) {
  return (
    <div className="review-items-table-wrap">
      <table className="review-items-table">
        <thead>
          <tr>
            <th className="select-column">선택</th>
            <th>회사명</th>
            <th>포지션</th>
            <th>분류</th>
            <th>원문 표현</th>
            <th>대표값</th>
            <th>상태</th>
            <th>사전 반영</th>
            <th>생성일시</th>
            <th>수정일시</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const draft = drafts[item.id] || createReviewItemDraft(item)
            const isSelected = selectedReviewItemIds.includes(item.id)

            return (
              <tr
                key={item.id || `${item.field_type}-${item.raw_value}-${index}`}
              >
                <td className="select-column">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    aria-label="정제 항목 선택"
                    onChange={() => onToggleSelection(item.id)}
                    disabled={isBulkSaving}
                  />
                </td>
                <td className="text-cell">{formatValue(item.company)}</td>
                <td className="text-cell">{formatValue(item.position)}</td>
                <td>{formatReviewItemFieldType(item.field_type)}</td>
                <td className="text-cell long-text-cell">
                  {formatValue(item.raw_value)}
                </td>
                <td className="text-cell">
                  <input
                    type="text"
                    name="approved_value"
                    value={draft.approved_value}
                    aria-label="approved_value"
                    onChange={(event) =>
                      onDraftChange(
                        item.id,
                        'approved_value',
                        event.target.value,
                      )
                    }
                  />
                </td>
                <td>
                  <span
                    className={`status-badge status-badge-${
                      item.status || 'unconfirmed'
                    }`}
                  >
                    {formatReviewItemStatus(item.status)}
                  </span>
                  <select
                    name="status"
                    value={draft.status}
                    aria-label="status"
                    onChange={(event) =>
                      onDraftChange(item.id, 'status', event.target.value)
                    }
                  >
                    <option value="unconfirmed">unconfirmed</option>
                    <option value="confirmed">confirmed</option>
                  </select>
                </td>
                <td>
                  <label className="dictionary-apply-control">
                    <input
                      type="checkbox"
                      name="dictionary_apply"
                      checked={draft.dictionary_apply}
                      aria-label="dictionary_apply"
                      onChange={(event) =>
                        onDraftChange(
                          item.id,
                          'dictionary_apply',
                          event.target.checked,
                        )
                      }
                    />
                    <span>사전 반영</span>
                  </label>
                </td>
                <td className="date-cell">{formatValue(item.created_at)}</td>
                <td className="date-cell">{formatValue(item.updated_at)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function PostingDetail({ posting }) {
  const detailItems = [
    ['회사명', posting.company],
    ['포지션', posting.position],
    ['담당 업무', posting.duties],
    ['자격 요건', posting.requirements],
    ['우대 사항', posting.preferred],
    ['기술/툴', posting.tools],
    ['경력', posting.experience],
    ['고용 형태', posting.employment_type],
    ['근무 형태', posting.work_type],
    ['산업 메모', posting.industry_memo],
    ['원문', posting.raw_text],
    ['생성일', posting.created_at],
    ['수정일', posting.updated_at],
  ]

  return (
    <dl className="posting-detail-list">
      {detailItems.map(([label, value]) => (
        <div key={label} className="posting-detail-item">
          <dt>{label}</dt>
          <dd>{formatValue(value)}</dd>
        </div>
      ))}
    </dl>
  )
}

function PostingAnalysisDetail({ analysis, isLoading, error }) {
  const analysisItems = [
    ['산업 카테고리', analysis?.industry_category],
    ['도메인 카테고리', analysis?.domain_category],
    ['직무 카테고리', analysis?.position_category],
    ['기술/툴', formatList(analysis?.extracted_skills)],
    ['역량', formatList(analysis?.extracted_competencies)],
    ['미확정 항목 수', analysis?.unconfirmed_count],
    ['분석일시', analysis?.analyzed_at],
  ]

  return (
    <section className="posting-analysis-detail" aria-label="Posting analysis">
      <h3>분석 결과</h3>

      {isLoading && <p>분석 결과를 불러오는 중...</p>}

      {!isLoading && error && <p className="error">{error}</p>}

      {!isLoading && !error && (
        <dl className="posting-detail-list">
          {analysisItems.map(([label, value]) => (
            <div key={label} className="posting-detail-item">
              <dt>{label}</dt>
              <dd>{formatValue(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}

function formatValue(value) {
  return value === null || value === undefined || value === '' ? '-' : value
}

function formatList(value) {
  return Array.isArray(value) && value.length > 0 ? value.join(', ') : '-'
}

function formatReviewItemStatus(status) {
  return status === 'confirmed' ? '확정' : '미확인'
}

function formatReviewItemFieldType(fieldType) {
  const fieldTypeLabels = {
    industry: '산업',
    domain: '도메인',
    position: '직무',
    skill: '기술/툴',
    competency: '역량',
  }

  return fieldTypeLabels[fieldType] || formatValue(fieldType)
}

function createReviewItemDrafts(items = []) {
  return items.reduce((drafts, item) => {
    drafts[item.id] = createReviewItemDraft(item)
    return drafts
  }, {})
}

function createReviewItemDraft(item) {
  return {
    approved_value: item.approved_value || '',
    status: item.status || 'unconfirmed',
    dictionary_apply: item.dictionary_apply === 1,
  }
}

function _postingToForm(posting, initialPostingForm) {
  return Object.keys(initialPostingForm).reduce((form, field) => {
    form[field] = posting?.[field] || ''
    return form
  }, {})
}

function validatePostingForm(form) {
  return Object.keys(postingFormValidationMessages).reduce((errors, field) => {
    const value = form[field]

    if (typeof value !== 'string' || value.trim() === '') {
      errors[field] = postingFormValidationMessages[field]
    }

    return errors
  }, {})
}

function hasPostingFormErrors(errors) {
  return Object.keys(errors).length > 0
}

function clearPostingFieldError(setErrors, fieldName) {
  setErrors((currentErrors) => {
    if (!currentErrors[fieldName]) {
      return currentErrors
    }

    const nextErrors = { ...currentErrors }
    delete nextErrors[fieldName]
    return nextErrors
  })
}

export default App

