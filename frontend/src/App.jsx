import { useEffect, useState } from 'react'
import './App.css'
import {
  fetchDashboardCharts,
  fetchDashboardComparison,
  fetchDashboardSummary,
} from './api/dashboardApi'
import {
  applyAiRecommendationItems,
  createAiRecommendationRun,
  fetchAiRecommendationHistory,
  fetchAiRecommendationHistoryDetail,
  fetchAiRecommendationCategoryCandidates,
  updateAiRecommendationCategoryCandidate,
} from './api/aiRecommendationsApi'
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
  const aiRecommendationHistoryPageSize = 10
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
  const [isRemovingReviewItems, setIsRemovingReviewItems] = useState(false)
  const [reviewItemRemoveMessage, setReviewItemRemoveMessage] = useState('')
  const [reviewItemRemoveError, setReviewItemRemoveError] = useState('')
  const [reviewItemsStatusFilter, setReviewItemsStatusFilter] = useState('')
  const [reviewItemsFieldTypeFilter, setReviewItemsFieldTypeFilter] =
    useState('')
  const [reviewItemsDictionaryApplyFilter, setReviewItemsDictionaryApplyFilter] =
    useState('')
  const [reviewItemsKeywordFilter, setReviewItemsKeywordFilter] = useState('')
  const [selectedAiPostingId, setSelectedAiPostingId] = useState('')
  const [aiRecommendation, setAiRecommendation] = useState(null)
  const [aiRecommendationLoading, setAiRecommendationLoading] = useState(false)
  const [aiRecommendationError, setAiRecommendationError] = useState('')
  const [aiPostingsLoadRequested, setAiPostingsLoadRequested] = useState(false)
  const [aiRecommendationHistory, setAiRecommendationHistory] = useState([])
  const [aiRecommendationHistoryLoading, setAiRecommendationHistoryLoading] =
    useState(false)
  const [aiRecommendationHistoryError, setAiRecommendationHistoryError] =
    useState('')
  const [
    aiRecommendationHistoryPagination,
    setAiRecommendationHistoryPagination,
  ] = useState({
    page: 1,
    size: aiRecommendationHistoryPageSize,
    total: 0,
    total_pages: 0,
  })
  const [
    aiRecommendationHistoryDetail,
    setAiRecommendationHistoryDetail,
  ] = useState(null)
  const [
    aiRecommendationHistoryDetailLoading,
    setAiRecommendationHistoryDetailLoading,
  ] = useState(false)
  const [
    aiRecommendationHistoryDetailError,
    setAiRecommendationHistoryDetailError,
  ] = useState('')
  const [
    selectedAiRecommendationHistoryRunId,
    setSelectedAiRecommendationHistoryRunId,
  ] = useState(null)
  const [
    aiRecommendationCompareRunIds,
    setAiRecommendationCompareRunIds,
  ] = useState([])
  const [
    aiRecommendationCompareDetails,
    setAiRecommendationCompareDetails,
  ] = useState([])
  const [
    aiRecommendationCompareLoading,
    setAiRecommendationCompareLoading,
  ] = useState(false)
  const [aiRecommendationCompareError, setAiRecommendationCompareError] =
    useState('')
  const [aiRecommendationCompareMessage, setAiRecommendationCompareMessage] =
    useState('')
  const [aiRecommendationApplySelections, setAiRecommendationApplySelections] =
    useState({})
  const [
    aiRecommendationApplyLoadingRunId,
    setAiRecommendationApplyLoadingRunId,
  ] = useState(null)
  const [aiRecommendationApplyError, setAiRecommendationApplyError] =
    useState('')
  const [aiRecommendationApplyResult, setAiRecommendationApplyResult] =
    useState(null)
  const [aiCategoryCandidates, setAiCategoryCandidates] = useState([])
  const [aiCategoryCandidatePagination, setAiCategoryCandidatePagination] =
    useState(null)
  const [aiCategoryCandidatePage, setAiCategoryCandidatePage] = useState(1)
  const [aiCategoryCandidateStatusFilter, setAiCategoryCandidateStatusFilter] =
    useState('')
  const [aiCategoryCandidateTypeFilter, setAiCategoryCandidateTypeFilter] =
    useState('')
  const [aiCategoryCandidateLoading, setAiCategoryCandidateLoading] =
    useState(false)
  const [aiCategoryCandidateError, setAiCategoryCandidateError] = useState('')
  const [aiCategoryCandidateMessage, setAiCategoryCandidateMessage] =
    useState('')
  const [aiCategoryCandidateUpdatingId, setAiCategoryCandidateUpdatingId] =
    useState(null)

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

  useEffect(() => {
    if (
      activePage !== 'aiRecommendations' ||
      postingsLoading ||
      postings.length > 0 ||
      aiPostingsLoadRequested
    ) {
      return
    }

    setAiPostingsLoadRequested(true)
    loadPostings()
  }, [activePage, postings.length, postingsLoading, aiPostingsLoadRequested])

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
    setReviewItemRemoveMessage('')
    setReviewItemRemoveError('')

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
    setReviewItemRemoveMessage('')
    setReviewItemRemoveError('')
    setSelectedReviewItemIds([])
    loadReviewItemsPage(1)
  }

  function handleResetReviewItemFilters() {
    setReviewItemSaveMessage('')
    setReviewItemSaveError('')
    setBulkReviewItemSaveMessage('')
    setBulkReviewItemSaveError('')
    setReviewItemRemoveMessage('')
    setReviewItemRemoveError('')
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
    setReviewItemRemoveMessage('')
    setReviewItemRemoveError('')
    setSelectedReviewItemIds([])
  }

  async function handleBulkSaveReviewItems() {
    if (
      selectedReviewItemIds.length === 0 ||
      reviewItemsLoading ||
      savingReviewItemId !== null ||
      isRemovingReviewItems
    ) {
      return
    }

    setIsBulkSavingReviewItems(true)
    setReviewItemSaveError('')
    setReviewItemSaveMessage('')
    setBulkReviewItemSaveMessage('')
    setBulkReviewItemSaveError('')
    setReviewItemRemoveMessage('')
    setReviewItemRemoveError('')

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

  async function handleRemoveReviewItems() {
    if (
      selectedReviewItemIds.length === 0 ||
      reviewItemsLoading ||
      isBulkSavingReviewItems
    ) {
      return
    }

    const shouldRemove = window.confirm('선택한 정제 항목을 제외하시겠습니까?')

    if (!shouldRemove) {
      return
    }

    setIsRemovingReviewItems(true)
    setReviewItemSaveError('')
    setReviewItemSaveMessage('')
    setBulkReviewItemSaveMessage('')
    setBulkReviewItemSaveError('')
    setReviewItemRemoveMessage('')
    setReviewItemRemoveError('')

    let successCount = 0
    let failureCount = 0

    for (const reviewItemId of selectedReviewItemIds) {
      try {
        const draft = reviewItemDrafts[reviewItemId] || {}
        const approvedValue = (draft.approved_value || '').trim()
        const result = await updateReviewItem(reviewItemId, {
          approved_value: approvedValue === '' ? null : approvedValue,
          status: 'removed',
          dictionary_apply: 0,
        })

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
      setReviewItemRemoveMessage('선택한 정제 항목을 제외했습니다.')
    } else if (successCount > 0 && failureCount > 0) {
      setReviewItemRemoveError(
        `일부 정제 항목 제외에 실패했습니다. 성공 ${successCount}건 / 실패 ${failureCount}건`,
      )
    } else {
      setReviewItemRemoveError('선택한 정제 항목 제외에 실패했습니다.')
    }

    setIsRemovingReviewItems(false)
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

  function resetAiRecommendationHistory() {
    setAiRecommendationHistory([])
    setAiRecommendationHistoryError('')
    setAiRecommendationHistoryLoading(false)
    setAiRecommendationHistoryPagination({
      page: 1,
      size: aiRecommendationHistoryPageSize,
      total: 0,
      total_pages: 0,
    })
  }

  function resetAiRecommendationHistoryDetail() {
    setAiRecommendationHistoryDetail(null)
    setAiRecommendationHistoryDetailError('')
    setAiRecommendationHistoryDetailLoading(false)
    setSelectedAiRecommendationHistoryRunId(null)
  }

  function resetAiRecommendationHistoryCompare() {
    setAiRecommendationCompareRunIds([])
    setAiRecommendationCompareDetails([])
    setAiRecommendationCompareLoading(false)
    setAiRecommendationCompareError('')
    setAiRecommendationCompareMessage('')
  }

  function resetAiRecommendationApplyState() {
    setAiRecommendationApplySelections({})
    setAiRecommendationApplyLoadingRunId(null)
    setAiRecommendationApplyError('')
    setAiRecommendationApplyResult(null)
  }

  function resetAiCategoryCandidateState() {
    setAiCategoryCandidates([])
    setAiCategoryCandidatePagination(null)
    setAiCategoryCandidatePage(1)
    setAiCategoryCandidateStatusFilter('')
    setAiCategoryCandidateTypeFilter('')
    setAiCategoryCandidateLoading(false)
    setAiCategoryCandidateError('')
    setAiCategoryCandidateMessage('')
    setAiCategoryCandidateUpdatingId(null)
  }

  function handleAiRecommendationApplyToggle(runId, item) {
    const runKey = String(runId)
    setAiRecommendationApplyError('')
    setAiRecommendationApplyResult(null)
    setAiRecommendationApplySelections((currentSelections) => {
      const currentRunSelections = currentSelections[runKey] || {}
      const nextRunSelections = { ...currentRunSelections }

      if (nextRunSelections[item.source_path]) {
        delete nextRunSelections[item.source_path]
      } else {
        nextRunSelections[item.source_path] = item
      }

      return {
        ...currentSelections,
        [runKey]: nextRunSelections,
      }
    })
  }

  async function handleAiRecommendationApply(runId) {
    const runKey = String(runId)
    const selectedItems = Object.values(
      aiRecommendationApplySelections[runKey] || {},
    )

    if (selectedItems.length === 0 || aiRecommendationApplyLoadingRunId) {
      return
    }

    setAiRecommendationApplyLoadingRunId(runId)
    setAiRecommendationApplyError('')
    setAiRecommendationApplyResult(null)

    try {
      const result = await applyAiRecommendationItems(runId, selectedItems)

      if (result.error) {
        setAiRecommendationApplyError(
          result.error.message || '선택 항목 반영 중 오류가 발생했습니다.',
        )
        return
      }

      await fetchSelectedAiRecommendationHistory(
        selectedAiPostingId,
        aiRecommendationHistoryPagination?.page || 1,
      )

      if (selectedAiRecommendationHistoryRunId === runId) {
        await fetchSelectedAiRecommendationHistoryDetail(runId)
      }

      if (
        aiRecommendationCompareDetails.some(
          (detail) => detail?.run?.id === runId,
        )
      ) {
        setAiRecommendationCompareDetails([])
        setAiRecommendationCompareMessage(
          '반영 후 비교 결과를 초기화했습니다. 다시 비교를 실행하세요.',
        )
      }

      setAiRecommendationApplySelections((currentSelections) => ({
        ...currentSelections,
        [runKey]: {},
      }))
      setAiRecommendationApplyResult(result.data || null)
    } catch (requestError) {
      setAiRecommendationApplyError(
        requestError.message || '선택 항목 반영 중 오류가 발생했습니다.',
      )
    } finally {
      setAiRecommendationApplyLoadingRunId(null)
    }
  }

  async function handleAiCategoryCandidateUpdate(candidateId, status, note) {
    if (aiCategoryCandidateUpdatingId) {
      return
    }

    setAiCategoryCandidateUpdatingId(candidateId)
    setAiCategoryCandidateError('')

    try {
      const result = await updateAiRecommendationCategoryCandidate(candidateId, {
        status,
        note,
      })

      if (result.error) {
        setAiCategoryCandidateError(
          result.error.message ||
            '산업/도메인/직무 후보 상태 변경 중 오류가 발생했습니다.',
        )
        return
      }

      setAiCategoryCandidateMessage('후보 상태가 저장되었습니다.')
      await fetchSelectedAiCategoryCandidates(
        selectedAiPostingId,
        aiCategoryCandidatePage,
      )
    } catch (requestError) {
      setAiCategoryCandidateError(
        requestError.message ||
          '산업/도메인/직무 후보 상태 변경 중 오류가 발생했습니다.',
      )
    } finally {
      setAiCategoryCandidateUpdatingId(null)
    }
  }

  async function fetchSelectedAiRecommendationHistory(postingId, page = 1) {
    if (!postingId) {
      resetAiRecommendationHistory()
      return
    }

    setAiRecommendationHistoryLoading(true)
    setAiRecommendationHistoryError('')

    try {
      const result = await fetchAiRecommendationHistory(postingId, {
        page,
        size: aiRecommendationHistoryPageSize,
      })

      if (result.error) {
        setAiRecommendationHistory([])
        setAiRecommendationHistoryPagination({
          page,
          size: aiRecommendationHistoryPageSize,
          total: 0,
          total_pages: 0,
        })
        setAiRecommendationHistoryError(
          result.error.message || 'AI 추천 이력을 불러오지 못했습니다.',
        )
        return
      }

      setAiRecommendationHistory(result.data?.items || [])
      setAiRecommendationHistoryPagination(
        result.data?.pagination || {
          page,
          size: aiRecommendationHistoryPageSize,
          total: 0,
          total_pages: 0,
        },
      )
    } catch (requestError) {
      setAiRecommendationHistory([])
      setAiRecommendationHistoryPagination({
        page,
        size: aiRecommendationHistoryPageSize,
        total: 0,
        total_pages: 0,
      })
      setAiRecommendationHistoryError(
        requestError.message || 'AI 추천 이력을 불러오지 못했습니다.',
      )
    } finally {
      setAiRecommendationHistoryLoading(false)
    }
  }

  async function fetchSelectedAiRecommendationHistoryDetail(runId) {
    if (!runId) {
      resetAiRecommendationHistoryDetail()
      return
    }

    setSelectedAiRecommendationHistoryRunId(runId)
    setAiRecommendationHistoryDetailLoading(true)
    setAiRecommendationHistoryDetailError('')
    setAiRecommendationApplyError('')
    setAiRecommendationApplyResult(null)

    try {
      const result = await fetchAiRecommendationHistoryDetail(runId)

      if (result.error) {
        setAiRecommendationHistoryDetail(null)
        setAiRecommendationHistoryDetailError(
          result.error.message ||
            'AI 추천 이력 상세를 불러오지 못했습니다.',
        )
        return
      }

      setAiRecommendationHistoryDetail(result.data || null)
    } catch (requestError) {
      setAiRecommendationHistoryDetail(null)
      setAiRecommendationHistoryDetailError(
        requestError.message || 'AI 추천 이력 상세를 불러오지 못했습니다.',
      )
    } finally {
      setAiRecommendationHistoryDetailLoading(false)
    }
  }

  async function fetchSelectedAiCategoryCandidates(
    postingId,
    page = 1,
    status = aiCategoryCandidateStatusFilter,
    categoryType = aiCategoryCandidateTypeFilter,
  ) {
    if (!postingId) {
      resetAiCategoryCandidateState()
      return
    }

    setAiCategoryCandidateLoading(true)
    setAiCategoryCandidateError('')

    try {
      const result = await fetchAiRecommendationCategoryCandidates(postingId, {
        page,
        size: 10,
        status: status || undefined,
        categoryType: categoryType || undefined,
      })

      if (result.error) {
        setAiCategoryCandidates([])
        setAiCategoryCandidatePagination(null)
        setAiCategoryCandidateError(
          result.error.message ||
            '산업/도메인/직무 후보 목록을 불러오지 못했습니다.',
        )
        return
      }

      setAiCategoryCandidates(result.data?.items || [])
      setAiCategoryCandidatePagination(result.data?.pagination || null)
    } catch (requestError) {
      setAiCategoryCandidates([])
      setAiCategoryCandidatePagination(null)
      setAiCategoryCandidateError(
        requestError.message ||
          '산업/도메인/직무 후보 목록을 불러오지 못했습니다.',
      )
    } finally {
      setAiCategoryCandidateLoading(false)
    }
  }

  function handleAiCategoryCandidateStatusFilterChange(value) {
    setAiCategoryCandidateStatusFilter(value)
    setAiCategoryCandidatePage(1)
    setAiCategoryCandidateMessage('')
    setAiCategoryCandidateError('')

    if (selectedAiPostingId) {
      fetchSelectedAiCategoryCandidates(
        selectedAiPostingId,
        1,
        value,
        aiCategoryCandidateTypeFilter,
      )
    }
  }

  function handleAiCategoryCandidateTypeFilterChange(value) {
    setAiCategoryCandidateTypeFilter(value)
    setAiCategoryCandidatePage(1)
    setAiCategoryCandidateMessage('')
    setAiCategoryCandidateError('')

    if (selectedAiPostingId) {
      fetchSelectedAiCategoryCandidates(
        selectedAiPostingId,
        1,
        aiCategoryCandidateStatusFilter,
        value,
      )
    }
  }

  function handleAiCategoryCandidatePageChange(page) {
    setAiCategoryCandidatePage(page)
    setAiCategoryCandidateMessage('')
    setAiCategoryCandidateError('')

    if (selectedAiPostingId) {
      fetchSelectedAiCategoryCandidates(selectedAiPostingId, page)
    }
  }

  function handleAiRecommendationCompareToggle(runId) {
    setAiRecommendationCompareError('')
    setAiRecommendationCompareDetails([])

    if (aiRecommendationCompareRunIds.includes(runId)) {
      setAiRecommendationCompareMessage('')
      setAiRecommendationCompareRunIds((currentRunIds) =>
        currentRunIds.filter((id) => id !== runId),
      )
      return
    }

    if (aiRecommendationCompareRunIds.length >= 2) {
      setAiRecommendationCompareMessage(
        '비교는 최대 2개 이력까지만 선택할 수 있습니다.',
      )
      return
    }

    setAiRecommendationCompareMessage('')
    setAiRecommendationCompareRunIds((currentRunIds) => [
      ...currentRunIds,
      runId,
    ])
  }

  async function fetchAiRecommendationCompareDetails(runIds) {
    if (runIds.length !== 2) {
      setAiRecommendationCompareMessage('비교할 추천 이력 2개를 선택하세요.')
      setAiRecommendationCompareDetails([])
      return
    }

    setAiRecommendationCompareLoading(true)
    setAiRecommendationCompareError('')
    setAiRecommendationCompareMessage('')

    try {
      const results = await Promise.all(
        runIds.map((runId) => fetchAiRecommendationHistoryDetail(runId)),
      )

      const failedResult = results.find((result) => result.error)

      if (failedResult) {
        setAiRecommendationCompareDetails([])
        setAiRecommendationCompareError(
          failedResult.error.message ||
            'AI 추천 이력 비교 정보를 불러오지 못했습니다.',
        )
        return
      }

      setAiRecommendationCompareDetails(
        results.map((result) => result.data).filter(Boolean),
      )
    } catch (requestError) {
      setAiRecommendationCompareDetails([])
      setAiRecommendationCompareError(
        requestError.message ||
          'AI 추천 이력 비교 정보를 불러오지 못했습니다.',
      )
    } finally {
      setAiRecommendationCompareLoading(false)
    }
  }

  function handleAiRecommendationCompareClick() {
    fetchAiRecommendationCompareDetails(aiRecommendationCompareRunIds)
  }

  function handleAiPostingChange(event) {
    const postingId = event.target.value
    setSelectedAiPostingId(postingId)
    setAiRecommendation(null)
    setAiRecommendationError('')
    setAiRecommendationLoading(false)
    resetAiRecommendationHistory()
    resetAiRecommendationHistoryDetail()
    resetAiRecommendationHistoryCompare()
    resetAiRecommendationApplyState()
    resetAiCategoryCandidateState()

    if (postingId) {
      fetchSelectedAiRecommendationHistory(postingId, 1)
      fetchSelectedAiCategoryCandidates(postingId, 1)
    }
  }

  async function handleFetchAiRecommendation() {
    if (!selectedAiPostingId || aiRecommendationLoading) {
      return
    }

    setAiRecommendationLoading(true)
    setAiRecommendationError('')

    try {
      const result = await createAiRecommendationRun(selectedAiPostingId)

      if (result.error) {
        setAiRecommendation(null)
        setAiRecommendationError(
          result.error.message || 'AI 추천 결과를 불러오지 못했습니다.',
        )
        return
      }

      setAiRecommendation(result.data || null)
      resetAiRecommendationHistoryDetail()
      resetAiRecommendationHistoryCompare()
      resetAiRecommendationApplyState()
      await fetchSelectedAiRecommendationHistory(selectedAiPostingId, 1)
    } catch (requestError) {
      setAiRecommendation(null)
      setAiRecommendationError(
        requestError.message || 'AI 추천 결과를 불러오지 못했습니다.',
      )
    } finally {
      setAiRecommendationLoading(false)
    }
  }

  function handleAiRecommendationHistoryPageChange(page) {
    if (!selectedAiPostingId || aiRecommendationHistoryLoading) {
      return
    }

    resetAiRecommendationHistoryDetail()
    resetAiRecommendationHistoryCompare()
    resetAiRecommendationApplyState()
    fetchSelectedAiRecommendationHistory(selectedAiPostingId, page)
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
                  <option value="unconfirmed">미확인</option>
                  <option value="confirmed">확정</option>
                  <option value="removed">제외</option>
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

            {reviewItemRemoveMessage && (
              <p className="bulk-save-message is-success">
                {reviewItemRemoveMessage}
              </p>
            )}

            {reviewItemRemoveError && (
              <p className="bulk-save-message is-error">
                {reviewItemRemoveError}
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
                        isRemovingReviewItems ||
                        savingReviewItemId !== null
                      }
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      className="danger-action-button"
                      onClick={handleRemoveReviewItems}
                      disabled={
                        selectedReviewItemIds.length === 0 ||
                        reviewItemsLoading ||
                        isBulkSavingReviewItems ||
                        isRemovingReviewItems
                      }
                    >
                      제외
                    </button>
                  </div>
                  <ReviewItemsTable
                    drafts={reviewItemDrafts}
                    isActionRunning={
                      isBulkSavingReviewItems || isRemovingReviewItems
                    }
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
                  isRemovingReviewItems ||
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
                  isRemovingReviewItems ||
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
            className="ai-recommendations"
            aria-label="AI recommendation management"
          >
            <h1>AI 추천 관리</h1>
            <div className="ai-recommendation-notice">
              <p>AI 추천 조회는 버튼을 눌렀을 때만 실행됩니다.</p>
              <p>
                OpenAI 모드에서는 추천 실행 결과가 이력에 저장될 수
                있으며, 자동 확정되거나 정제 항목에 자동 반영되지는
                않습니다.
              </p>
              <p>
                Mock 모드에서는 추천 결과를 화면에 표시하지만 이력에는
                저장하지 않습니다.
              </p>
            </div>

            <div className="ai-recommendation-controls">
              <label>
                <span>공고 선택</span>
                <select
                  value={selectedAiPostingId}
                  onChange={handleAiPostingChange}
                  disabled={postingsLoading || postings.length === 0}
                >
                  <option value="">공고를 선택하세요</option>
                  {postings.map((posting) => (
                    <option key={posting.id} value={posting.id}>
                      {posting.company} / {posting.position}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={handleFetchAiRecommendation}
                disabled={!selectedAiPostingId || aiRecommendationLoading}
              >
                AI 추천 조회
              </button>
            </div>

            {postingsLoading && <p>공고 목록을 불러오는 중입니다.</p>}

            {!postingsLoading && postingsError && (
              <p className="error">{postingsError}</p>
            )}

            {!postingsLoading &&
              !postingsError &&
              postings.length === 0 && <p>추천을 조회할 공고가 없습니다.</p>}

            {selectedAiPostingId && (
              <AiRecommendationHistoryList
                items={aiRecommendationHistory}
                pagination={aiRecommendationHistoryPagination}
                isLoading={aiRecommendationHistoryLoading}
                error={aiRecommendationHistoryError}
                selectedRunId={selectedAiRecommendationHistoryRunId}
                selectedCompareRunIds={aiRecommendationCompareRunIds}
                isDetailLoading={aiRecommendationHistoryDetailLoading}
                isCompareLoading={aiRecommendationCompareLoading}
                onPageChange={handleAiRecommendationHistoryPageChange}
                onDetailClick={fetchSelectedAiRecommendationHistoryDetail}
                onCompareToggle={handleAiRecommendationCompareToggle}
              />
            )}

            {selectedAiPostingId && (
              <AiRecommendationHistoryCompare
                selectedRunIds={aiRecommendationCompareRunIds}
                details={aiRecommendationCompareDetails}
                isLoading={aiRecommendationCompareLoading}
                error={aiRecommendationCompareError}
                message={aiRecommendationCompareMessage}
                applySelections={aiRecommendationApplySelections}
                applyLoadingRunId={aiRecommendationApplyLoadingRunId}
                onApplyToggle={handleAiRecommendationApplyToggle}
                onApply={handleAiRecommendationApply}
                onCompareClick={handleAiRecommendationCompareClick}
              />
            )}

            {selectedAiPostingId && (
              <AiRecommendationHistoryDetail
                detail={aiRecommendationHistoryDetail}
                isLoading={aiRecommendationHistoryDetailLoading}
                error={aiRecommendationHistoryDetailError}
                applySelections={aiRecommendationApplySelections}
                applyLoadingRunId={aiRecommendationApplyLoadingRunId}
                onApplyToggle={handleAiRecommendationApplyToggle}
                onApply={handleAiRecommendationApply}
              />
            )}

            {selectedAiPostingId && (
              <AiRecommendationApplyResult
                result={aiRecommendationApplyResult}
                error={aiRecommendationApplyError}
              />
            )}

            {aiRecommendationLoading && (
              <p>AI 추천 결과를 불러오는 중입니다.</p>
            )}

            {!aiRecommendationLoading && aiRecommendationError && (
              <p className="error">{aiRecommendationError}</p>
            )}

            {!aiRecommendationLoading &&
              !aiRecommendationError &&
              !aiRecommendation && (
                <p>공고를 선택한 뒤 AI 추천 조회 버튼을 눌러주세요.</p>
              )}

            {!aiRecommendationLoading &&
              !aiRecommendationError &&
              aiRecommendation && (
                <AiRecommendationResult result={aiRecommendation} />
              )}

            {selectedAiPostingId && (
              <AiCategoryCandidateList
                items={aiCategoryCandidates}
                pagination={aiCategoryCandidatePagination}
                isLoading={aiCategoryCandidateLoading}
                error={aiCategoryCandidateError}
                message={aiCategoryCandidateMessage}
                statusFilter={aiCategoryCandidateStatusFilter}
                typeFilter={aiCategoryCandidateTypeFilter}
                updatingId={aiCategoryCandidateUpdatingId}
                onPageChange={handleAiCategoryCandidatePageChange}
                onStatusFilterChange={handleAiCategoryCandidateStatusFilterChange}
                onTypeFilterChange={handleAiCategoryCandidateTypeFilterChange}
                onUpdate={handleAiCategoryCandidateUpdate}
              />
            )}
          </section>
        )}
      </main>
    </div>
  )
}

function AiRecommendationResult({ result }) {
  const recommendation = result?.recommendation || {}

  return (
    <div className="ai-recommendation-result">
      <div className="ai-recommendation-source">
        <h2>추천 대상 공고</h2>
        <dl className="ai-meta-list">
          <div>
            <dt>회사명</dt>
            <dd>{formatValue(result?.source?.company)}</dd>
          </div>
          <div>
            <dt>포지션</dt>
            <dd>{formatValue(result?.source?.position)}</dd>
          </div>
        </dl>
      </div>

      <div className="ai-recommendation-card-grid">
        <AiRecommendationCard
          title="산업 추천"
          item={recommendation.industry_category}
        />
        <AiRecommendationCard
          title="대표 도메인 추천"
          item={recommendation.primary_domain_category}
        />
        <AiRecommendationCard
          title="직무 추천"
          item={recommendation.position_category}
        />
      </div>

      <AiRecommendationList
        title="기술/도구"
        items={recommendation.skills}
      />
      <AiRecommendationList
        title="역량"
        items={recommendation.competencies}
      />
      <AiReviewCandidateList
        items={recommendation.review_item_candidates}
      />
      <AiRecommendationRunMeta run={result?.run} meta={result?.meta} />
      <AiRecommendationMeta meta={result?.meta} />
    </div>
  )
}

function AiCategoryCandidateList({
  items = [],
  pagination,
  isLoading,
  error,
  message,
  statusFilter,
  typeFilter,
  updatingId,
  onPageChange,
  onStatusFilterChange,
  onTypeFilterChange,
  onUpdate,
}) {
  const [drafts, setDrafts] = useState({})

  useEffect(() => {
    const nextDrafts = items.reduce((acc, item) => {
      acc[item.id] = {
        status: item.status || 'pending',
        note: item.note || '',
      }
      return acc
    }, {})
    setDrafts(nextDrafts)
  }, [items])

  function updateDraft(candidateId, field, value) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [candidateId]: {
        ...currentDrafts[candidateId],
        [field]: value,
      },
    }))
  }

  return (
    <section className="ai-category-candidates">
      <div className="ai-category-candidates-header">
        <h2>산업/도메인/직무 후보 목록</h2>
      </div>

      <div className="ai-category-candidate-filters">
        <label>
          <span>상태</span>
          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
          >
            <option value="">전체</option>
            <option value="pending">검토 대기</option>
            <option value="accepted">후보 채택</option>
            <option value="rejected">제외</option>
          </select>
        </label>
        <label>
          <span>항목 유형</span>
          <select
            value={typeFilter}
            onChange={(event) => onTypeFilterChange(event.target.value)}
          >
            <option value="">전체</option>
            <option value="industry">산업</option>
            <option value="domain">도메인</option>
            <option value="position">직무</option>
          </select>
        </label>
      </div>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      <div className="ai-category-candidate-table-wrap">
        <table className="ai-category-candidate-table">
          <thead>
            <tr>
              <th>후보 ID</th>
              <th>항목 유형</th>
              <th>추천값</th>
              <th>확신도</th>
              <th>판단 근거</th>
              <th>상태</th>
              <th>생성 시각</th>
              <th>검토 시각</th>
              <th>메모</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="10">
                  {isLoading
                    ? '산업/도메인/직무 후보 목록을 불러오는 중입니다.'
                    : '산업/도메인/직무 후보가 없습니다.'}
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const draft = drafts[item.id] || {
                  status: item.status || 'pending',
                  note: item.note || '',
                }

                return (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{formatAiCategoryType(item.category_type)}</td>
                    <td>{formatValue(item.recommended_value)}</td>
                    <td>{formatValue(item.confidence)}</td>
                    <td>{formatValue(item.reason)}</td>
                    <td>
                      <span
                        className={`ai-category-candidate-status-badge ai-category-candidate-status-${item.status}`}
                      >
                        {formatAiCategoryCandidateStatus(item.status)}
                      </span>
                    </td>
                    <td>{formatValue(item.created_at)}</td>
                    <td>{formatValue(item.reviewed_at)}</td>
                    <td>
                      <textarea
                        value={draft.note}
                        onChange={(event) =>
                          updateDraft(item.id, 'note', event.target.value)
                        }
                        rows="2"
                      />
                    </td>
                    <td className="ai-category-candidate-actions">
                      <select
                        value={draft.status}
                        onChange={(event) =>
                          updateDraft(item.id, 'status', event.target.value)
                        }
                      >
                        <option value="pending">검토 대기</option>
                        <option value="accepted">후보 채택</option>
                        <option value="rejected">제외</option>
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdate(item.id, draft.status, draft.note)
                        }
                        disabled={updatingId === item.id || isLoading}
                      >
                        상태 저장
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="ai-category-candidate-pagination">
        <button
          type="button"
          disabled={!pagination || pagination.page <= 1 || isLoading}
          onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
        >
          이전
        </button>
        <span>
          {pagination?.page || 0} / {pagination?.total_pages || 0}
        </span>
        <button
          type="button"
          disabled={
            !pagination ||
            pagination.page >= (pagination.total_pages || 0) ||
            isLoading
          }
          onClick={() =>
            onPageChange(Math.min(
              pagination.total_pages || 1,
              (pagination.page || 1) + 1,
            ))
          }
        >
          다음
        </button>
      </div>
    </section>
  )
}

function AiRecommendationCard({ title, item = {} }) {
  const normalizedItem = item || {}

  return (
    <article className="ai-recommendation-card">
      <h3>{title}</h3>
      <dl className="ai-recommendation-detail-list">
        <div>
          <dt>값</dt>
          <dd>{formatValue(normalizedItem.value)}</dd>
        </div>
        <div>
          <dt>확신도</dt>
          <dd>{formatValue(normalizedItem.confidence)}</dd>
        </div>
        <div>
          <dt>판단 근거</dt>
          <dd>{formatValue(normalizedItem.reason)}</dd>
        </div>
      </dl>
    </article>
  )
}

function AiRecommendationList({ title, items = [] }) {
  return (
    <section className="ai-recommendation-list">
      <h2>{title}</h2>
      {items.length === 0 ? (
        <p>추천 항목이 없습니다.</p>
      ) : (
        <div className="ai-recommendation-item-list">
          {items.map((item, index) => (
            <AiRecommendationCard
              key={`${title}-${item.value || index}`}
              title={formatValue(item.value)}
              item={item}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function AiReviewCandidateList({ items = [] }) {
  return (
    <section className="ai-recommendation-list">
      <h2>검토 후보</h2>
      {items.length === 0 ? (
        <p>검토 후보가 없습니다.</p>
      ) : (
        <div className="ai-review-candidate-list">
          {items.map((item, index) => (
            <article
              className="ai-review-candidate"
              key={`${item.field_type}-${item.raw_value}-${index}`}
            >
              <dl className="ai-recommendation-detail-list">
                <div>
                  <dt>항목 유형</dt>
                  <dd>{formatAiFieldType(item.field_type)}</dd>
                </div>
                <div>
                  <dt>원문값</dt>
                  <dd>{formatValue(item.raw_value)}</dd>
                </div>
                <div>
                  <dt>제안값</dt>
                  <dd>{formatValue(item.suggested_value)}</dd>
                </div>
                <div>
                  <dt>확신도</dt>
                  <dd>{formatValue(item.confidence)}</dd>
                </div>
                <div>
                  <dt>판단 근거</dt>
                  <dd>{formatValue(item.reason)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function AiRecommendationMeta({ meta = {} }) {
  const savedValue =
    meta.saved === null || meta.saved === undefined ? null : String(meta.saved)

  return (
    <section className="ai-recommendation-meta">
      <h2>실행 정보</h2>
      <dl className="ai-meta-list">
        <div>
          <dt>실행 모드</dt>
          <dd>{formatValue(meta.mode)}</dd>
        </div>
        <div>
          <dt>저장 여부</dt>
          <dd>{formatValue(savedValue)}</dd>
        </div>
        <div>
          <dt>모델</dt>
          <dd>{formatValue(meta.model)}</dd>
        </div>
        <div>
          <dt>프롬프트 버전</dt>
          <dd>{formatValue(meta.prompt_version)}</dd>
        </div>
        <div>
          <dt>생성 시각</dt>
          <dd>{formatValue(meta.generated_at)}</dd>
        </div>
      </dl>
    </section>
  )
}

function AiRecommendationRunMeta({ run = null, meta = {} }) {
  const isSaved = meta?.saved === true

  return (
    <section className="ai-recommendation-run-meta">
      <div className="ai-recommendation-run-meta-heading">
        <h2>이력 저장 상태</h2>
        <span
          className={
            isSaved
              ? 'ai-recommendation-saved-badge'
              : 'ai-recommendation-unsaved-badge'
          }
        >
          {isSaved ? '저장됨' : '저장 안 됨'}
        </span>
      </div>
      <dl className="ai-meta-list">
        {run && (
          <>
            <div>
              <dt>이력 ID</dt>
              <dd>{formatValue(run.id)}</dd>
            </div>
            <div>
              <dt>생성 시각</dt>
              <dd>{formatValue(run.created_at)}</dd>
            </div>
          </>
        )}
        <div>
          <dt>실행 모드</dt>
          <dd>{formatValue(meta?.mode)}</dd>
        </div>
        <div>
          <dt>모델</dt>
          <dd>{formatValue(meta?.model)}</dd>
        </div>
        <div>
          <dt>프롬프트 버전</dt>
          <dd>{formatValue(meta?.prompt_version)}</dd>
        </div>
      </dl>
    </section>
  )
}

function AiRecommendationHistoryList({
  items = [],
  pagination = {},
  isLoading = false,
  error = '',
  selectedRunId = null,
  selectedCompareRunIds = [],
  isDetailLoading = false,
  isCompareLoading = false,
  onPageChange,
  onDetailClick,
  onCompareToggle,
}) {
  const currentPage = pagination?.page || 1
  const totalPages = pagination?.total_pages || 0
  const totalItems = pagination?.total || 0
  const isFirstPage = currentPage <= 1
  const isLastPage = totalPages === 0 || currentPage >= totalPages

  return (
    <section className="ai-recommendation-history">
      <div className="ai-recommendation-history-header">
        <div>
          <h2>최근 추천 이력</h2>
          <p>추천 실행 이력의 metadata만 표시합니다.</p>
        </div>
        <span>{totalItems}건</span>
      </div>

      {isLoading && <p>AI 추천 이력을 불러오는 중입니다.</p>}

      {!isLoading && error && <p className="error">{error}</p>}

      {!isLoading && !error && items.length === 0 && (
        <p className="ai-recommendation-history-empty">
          아직 저장된 AI 추천 이력이 없습니다.
        </p>
      )}

      {!isLoading && !error && items.length > 0 && (
        <div className="ai-recommendation-history-table-wrap">
          <table className="ai-recommendation-history-table">
            <thead>
              <tr>
                <th>이력 ID</th>
                <th>모델</th>
                <th>프롬프트 버전</th>
                <th>실행 상태</th>
                <th>반영 상태</th>
                <th>생성 시각</th>
                <th>비교</th>
                <th>상세</th>
              </tr>
            </thead>
            <tbody>
              {items.map((run) => (
                <tr
                  key={run.id}
                  className={
                    selectedRunId === run.id
                      ? 'ai-recommendation-history-row-selected'
                      : selectedCompareRunIds.includes(run.id)
                        ? 'ai-recommendation-history-row-compare-selected'
                      : undefined
                  }
                >
                  <td>{formatValue(run.id)}</td>
                  <td>{formatValue(run.model)}</td>
                  <td>{formatValue(run.prompt_version)}</td>
                  <td>
                    <span className="ai-recommendation-status-badge">
                      {formatAiRunStatus(run.status)}
                    </span>
                  </td>
                  <td>
                    <span className="ai-recommendation-applied-status-badge">
                      {formatAiAppliedStatus(run.applied_status)}
                    </span>
                  </td>
                  <td>{formatValue(run.created_at)}</td>
                  <td>
                    <label className="ai-recommendation-history-compare-check">
                      <input
                        type="checkbox"
                        checked={selectedCompareRunIds.includes(run.id)}
                        onChange={() => onCompareToggle(run.id)}
                        disabled={isCompareLoading}
                      />
                      <span>비교 선택</span>
                    </label>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="ai-recommendation-history-detail-button"
                      onClick={() => onDetailClick(run.id)}
                      disabled={isDetailLoading && selectedRunId === run.id}
                    >
                      {isDetailLoading && selectedRunId === run.id
                        ? '조회 중'
                        : '상세 보기'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="ai-recommendation-history-pagination">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isLoading || isFirstPage}
        >
          이전
        </button>
        <span>
          {currentPage} / {totalPages || 1}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLoading || isLastPage}
        >
          다음
        </button>
      </div>
    </section>
  )
}

function AiRecommendationHistoryCompare({
  selectedRunIds = [],
  details = [],
  isLoading = false,
  error = '',
  message = '',
  applySelections = {},
  applyLoadingRunId = null,
  onApplyToggle,
  onApply,
  onCompareClick,
}) {
  const canCompare = selectedRunIds.length === 2
  const shouldShowCompare = !isLoading && !error && details.length === 2

  return (
    <section className="ai-recommendation-history-compare">
      <div className="ai-recommendation-compare-heading">
        <div>
          <h2>추천 이력 비교</h2>
          <p>저장된 이력 2개를 선택해 추천 요약을 좌우로 비교합니다.</p>
        </div>
        <span>{selectedRunIds.length} / 2 선택</span>
      </div>

      <div className="ai-recommendation-compare-controls">
        <button
          type="button"
          onClick={onCompareClick}
          disabled={!canCompare || isLoading}
        >
          선택한 이력 비교
        </button>
        {!canCompare && <p>비교할 추천 이력 2개를 선택하세요.</p>}
        {message && <p>{message}</p>}
      </div>

      {isLoading && <p>추천 이력 비교 정보를 불러오는 중입니다.</p>}

      {!isLoading && error && <p className="error">{error}</p>}

      {shouldShowCompare && (
        <div className="ai-recommendation-compare-grid">
          {details.map((detail, index) => (
            <AiRecommendationCompareCard
              key={detail?.run?.id || `compare-${index}`}
              detail={detail}
              applySelections={applySelections}
              applyLoadingRunId={applyLoadingRunId}
              onApplyToggle={onApplyToggle}
              onApply={onApply}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function AiRecommendationCompareCard({
  detail = {},
  applySelections = {},
  applyLoadingRunId = null,
  onApplyToggle,
  onApply,
}) {
  const run = detail?.run || {}
  const source = detail?.source || {}
  const recommendation = detail?.recommendation || {}
  const runId = run?.id
  const selectedItems = applySelections[String(runId)] || {}
  const selectableItems = getSelectableAiRecommendationApplyItems(recommendation)

  return (
    <article className="ai-recommendation-compare-card">
      <h3>이력 {formatValue(run.id)}</h3>

      <dl className="ai-meta-list">
        <div>
          <dt>생성 시각</dt>
          <dd>{formatValue(run.created_at)}</dd>
        </div>
        <div>
          <dt>실행 모드</dt>
          <dd>{formatValue(run.mode)}</dd>
        </div>
        <div>
          <dt>모델</dt>
          <dd>{formatValue(run.model)}</dd>
        </div>
        <div>
          <dt>프롬프트 버전</dt>
          <dd>{formatValue(run.prompt_version)}</dd>
        </div>
        <div>
          <dt>실행 상태</dt>
          <dd>{formatAiRunStatus(run.status)}</dd>
        </div>
        <div>
          <dt>반영 상태</dt>
          <dd>{formatAiAppliedStatus(run.applied_status)}</dd>
        </div>
        <div>
          <dt>회사</dt>
          <dd>{formatValue(source.company)}</dd>
        </div>
        <div>
          <dt>직무</dt>
          <dd>{formatValue(source.position)}</dd>
        </div>
      </dl>

      <div className="ai-recommendation-compare-values">
        <div>
          <h4>산업</h4>
          <p>{formatValue(getCategoryValue(recommendation.industry_category))}</p>
        </div>
        <div>
          <h4>대표 도메인</h4>
          <p>
            {formatValue(
              getCategoryValue(recommendation.primary_domain_category),
            )}
          </p>
        </div>
        <div>
          <h4>직무 분류</h4>
          <p>{formatValue(getCategoryValue(recommendation.position_category))}</p>
        </div>
        <div>
          <h4>기술/도구</h4>
          <p>{formatValue(getRecommendationItemValues(recommendation.skills))}</p>
        </div>
        <div>
          <h4>역량</h4>
          <p>
            {formatValue(
              getRecommendationItemValues(recommendation.competencies),
            )}
          </p>
        </div>
        <div>
          <h4>검토 후보</h4>
          <p>
            {formatValue(
              getReviewCandidateValues(
                recommendation.review_item_candidates,
              ),
            )}
          </p>
        </div>
      </div>

      <AiRecommendationApplyPanel
        runId={runId}
        items={selectableItems}
        selectedItems={selectedItems}
        isLoading={applyLoadingRunId === runId}
        buttonLabel="이 이력의 선택 항목 반영"
        onToggle={onApplyToggle}
        onApply={onApply}
      />
    </article>
  )
}

function getCategoryValue(category = {}) {
  return category?.value || ''
}

function getRecommendationItemValues(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return ''
  }

  return items
    .map((item) => item?.value)
    .filter(Boolean)
    .join(', ')
}

function getReviewCandidateValues(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return ''
  }

  return items
    .map((item) => item?.suggested_value || item?.raw_value)
    .filter(Boolean)
    .join(', ')
}

function AiRecommendationApplyPanel({
  runId,
  items = [],
  selectedItems = {},
  isLoading = false,
  buttonLabel = '선택 항목 반영',
  onToggle,
  onApply,
}) {
  const selectedCount = Object.keys(selectedItems || {}).length

  return (
    <section className="ai-recommendation-apply-panel">
      <h3>정제 항목 선택 반영</h3>
      {items.length === 0 ? (
        <p>반영 가능한 기술/도구 또는 역량 항목이 없습니다.</p>
      ) : (
        <div className="ai-recommendation-apply-list">
          {items.map((entry) => (
            <label
              className="ai-recommendation-apply-item"
              key={entry.source_path}
            >
              <input
                type="checkbox"
                checked={Boolean(selectedItems?.[entry.source_path])}
                onChange={() => onToggle(runId, entry.payload)}
                disabled={isLoading}
              />
              <span>
                <strong>{formatValue(entry.label)}</strong>
                <small>{entry.categoryLabel}</small>
              </span>
            </label>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => onApply(runId)}
        disabled={selectedCount === 0 || isLoading}
      >
        {isLoading ? '반영 중입니다' : buttonLabel}
      </button>
    </section>
  )
}

function AiRecommendationApplyResult({ result = null, error = '' }) {
  if (!result && !error) {
    return null
  }

  const appliedItems = result?.applied_items || []
  const skippedItems = result?.skipped_items || []

  return (
    <section className="ai-recommendation-apply-result">
      <h2>선택 반영 결과</h2>
      {error && <p className="error">{error}</p>}
      {result && (
        <>
          <dl className="ai-meta-list">
            <div>
              <dt>이력 ID</dt>
              <dd>{formatValue(result?.run?.id)}</dd>
            </div>
            <div>
              <dt>반영 상태</dt>
              <dd>{formatAiAppliedStatus(result?.run?.applied_status)}</dd>
            </div>
            <div>
              <dt>반영 완료</dt>
              <dd>{appliedItems.length}건</dd>
            </div>
            <div>
              <dt>반영 제외</dt>
              <dd>{skippedItems.length}건</dd>
            </div>
          </dl>

          <AiRecommendationApplyResultList
            title="반영 항목"
            items={appliedItems}
          />
          <AiRecommendationApplyResultList
            title="제외 항목"
            items={skippedItems}
          />
        </>
      )}
    </section>
  )
}

function AiRecommendationApplyResultList({ title, items = [] }) {
  return (
    <div className="ai-recommendation-apply-result-list">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p>없음</p>
      ) : (
        <ul>
          {items.map((item, index) => (
            <li key={`${item.source_path}-${index}`}>
              <strong>{formatValue(item.suggested_value || item.raw_value)}</strong>
              <span>
                {formatAiFieldType(item.field_type)} ·{' '}
                {formatAiApplyAction(item.action)}
              </span>
              {item.reason && <em>{item.reason}</em>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function getSelectableAiRecommendationApplyItems(recommendation = {}) {
  const skillItems = (recommendation.skills || [])
    .map((item, index) =>
      createApplyItemEntry({
        sourcePath: `skills[${index}]`,
        fieldType: 'skill',
        rawValue: item?.value,
        suggestedValue: item?.value,
        categoryLabel: '기술/도구',
      }),
    )
    .filter(Boolean)

  const competencyItems = (recommendation.competencies || [])
    .map((item, index) =>
      createApplyItemEntry({
        sourcePath: `competencies[${index}]`,
        fieldType: 'competency',
        rawValue: item?.value,
        suggestedValue: item?.value,
        categoryLabel: '역량',
      }),
    )
    .filter(Boolean)

  const candidateItems = (recommendation.review_item_candidates || [])
    .map((item, index) => {
      if (!['skill', 'competency'].includes(item?.field_type)) {
        return null
      }

      return createApplyItemEntry({
        sourcePath: `review_item_candidates[${index}]`,
        fieldType: item.field_type,
        rawValue: item.raw_value,
        suggestedValue: item.suggested_value,
        categoryLabel: `검토 후보 · ${formatAiFieldType(item.field_type)}`,
      })
    })
    .filter(Boolean)

  return [...skillItems, ...competencyItems, ...candidateItems]
}

function createApplyItemEntry({
  sourcePath,
  fieldType,
  rawValue,
  suggestedValue,
  categoryLabel,
}) {
  const normalizedRawValue = rawValue || suggestedValue || ''
  const normalizedSuggestedValue = suggestedValue || rawValue || ''

  if (!normalizedRawValue && !normalizedSuggestedValue) {
    return null
  }

  return {
    source_path: sourcePath,
    label: normalizedSuggestedValue || normalizedRawValue,
    categoryLabel,
    payload: {
      source_path: sourcePath,
      field_type: fieldType,
      raw_value: normalizedRawValue,
      suggested_value: normalizedSuggestedValue,
    },
  }
}

function AiRecommendationHistoryDetail({
  detail = null,
  isLoading = false,
  error = '',
  applySelections = {},
  applyLoadingRunId = null,
  onApplyToggle,
  onApply,
}) {
  const run = detail?.run || null
  const source = detail?.source || {}
  const recommendation = detail?.recommendation || {}
  const skills = recommendation.skills || []
  const competencies = recommendation.competencies || []
  const reviewItemCandidates = recommendation.review_item_candidates || []
  const runId = run?.id
  const selectedItems = applySelections[String(runId)] || {}
  const selectableItems = getSelectableAiRecommendationApplyItems(recommendation)

  return (
    <section className="ai-recommendation-history-detail">
      <h2>저장된 추천 이력 상세</h2>

      {isLoading && <p>AI 추천 이력 상세를 불러오는 중입니다.</p>}

      {!isLoading && error && <p className="error">{error}</p>}

      {!isLoading && !error && !detail && (
        <p className="ai-recommendation-history-detail-empty">
          상세를 확인할 추천 이력을 선택하세요.
        </p>
      )}

      {!isLoading && !error && detail && (
        <>
          <div className="ai-recommendation-history-detail-meta">
            <dl className="ai-meta-list">
              <div>
                <dt>이력 ID</dt>
                <dd>{formatValue(run?.id)}</dd>
              </div>
              <div>
                <dt>생성 시각</dt>
                <dd>{formatValue(run?.created_at)}</dd>
              </div>
              <div>
                <dt>실행 모드</dt>
                <dd>{formatValue(run?.mode)}</dd>
              </div>
              <div>
                <dt>모델</dt>
                <dd>{formatValue(run?.model)}</dd>
              </div>
              <div>
                <dt>프롬프트 버전</dt>
                <dd>{formatValue(run?.prompt_version)}</dd>
              </div>
              <div>
                <dt>실행 상태</dt>
                <dd>{formatAiRunStatus(run?.status)}</dd>
              </div>
              <div>
                <dt>반영 상태</dt>
                <dd>{formatAiAppliedStatus(run?.applied_status)}</dd>
              </div>
              <div>
                <dt>회사</dt>
                <dd>{formatValue(source?.company)}</dd>
              </div>
              <div>
                <dt>직무</dt>
                <dd>{formatValue(source?.position)}</dd>
              </div>
            </dl>
          </div>

          <div className="ai-recommendation-history-detail-card-grid">
            <article className="ai-recommendation-history-detail-card">
              <h3>산업</h3>
              <dl className="ai-recommendation-detail-list">
                <div>
                  <dt>값</dt>
                  <dd>
                    {formatValue(recommendation.industry_category?.value)}
                  </dd>
                </div>
                <div>
                  <dt>확신도</dt>
                  <dd>
                    {formatValue(
                      recommendation.industry_category?.confidence,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>판단 근거</dt>
                  <dd>
                    {formatValue(recommendation.industry_category?.reason)}
                  </dd>
                </div>
              </dl>
            </article>

            <article className="ai-recommendation-history-detail-card">
              <h3>대표 도메인</h3>
              <dl className="ai-recommendation-detail-list">
                <div>
                  <dt>값</dt>
                  <dd>
                    {formatValue(
                      recommendation.primary_domain_category?.value,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>확신도</dt>
                  <dd>
                    {formatValue(
                      recommendation.primary_domain_category?.confidence,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>판단 근거</dt>
                  <dd>
                    {formatValue(
                      recommendation.primary_domain_category?.reason,
                    )}
                  </dd>
                </div>
              </dl>
            </article>

            <article className="ai-recommendation-history-detail-card">
              <h3>직무 분류</h3>
              <dl className="ai-recommendation-detail-list">
                <div>
                  <dt>값</dt>
                  <dd>
                    {formatValue(recommendation.position_category?.value)}
                  </dd>
                </div>
                <div>
                  <dt>확신도</dt>
                  <dd>
                    {formatValue(
                      recommendation.position_category?.confidence,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>판단 근거</dt>
                  <dd>
                    {formatValue(recommendation.position_category?.reason)}
                  </dd>
                </div>
              </dl>
            </article>
          </div>

          <section className="ai-recommendation-history-detail-list">
            <h3>기술/도구</h3>
            {skills.length === 0 ? (
              <p>추천 항목이 없습니다.</p>
            ) : (
              <div className="ai-recommendation-history-detail-item-list">
                {skills.map((item, index) => (
                  <article
                    className="ai-recommendation-history-detail-card"
                    key={`history-skill-${item.value || index}`}
                  >
                    <h4>{formatValue(item.value)}</h4>
                    <dl className="ai-recommendation-detail-list">
                      <div>
                        <dt>확신도</dt>
                        <dd>{formatValue(item.confidence)}</dd>
                      </div>
                      <div>
                        <dt>판단 근거</dt>
                        <dd>{formatValue(item.reason)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="ai-recommendation-history-detail-list">
            <h3>역량</h3>
            {competencies.length === 0 ? (
              <p>추천 항목이 없습니다.</p>
            ) : (
              <div className="ai-recommendation-history-detail-item-list">
                {competencies.map((item, index) => (
                  <article
                    className="ai-recommendation-history-detail-card"
                    key={`history-competency-${item.value || index}`}
                  >
                    <h4>{formatValue(item.value)}</h4>
                    <dl className="ai-recommendation-detail-list">
                      <div>
                        <dt>확신도</dt>
                        <dd>{formatValue(item.confidence)}</dd>
                      </div>
                      <div>
                        <dt>판단 근거</dt>
                        <dd>{formatValue(item.reason)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="ai-recommendation-history-detail-list">
            <h3>검토 후보</h3>
            {reviewItemCandidates.length === 0 ? (
              <p>검토 후보가 없습니다.</p>
            ) : (
              <div className="ai-recommendation-history-detail-item-list">
                {reviewItemCandidates.map((item, index) => (
                  <article
                    className="ai-recommendation-history-detail-card"
                    key={`history-review-candidate-${
                      item.raw_value || index
                    }`}
                  >
                    <dl className="ai-recommendation-detail-list">
                      <div>
                        <dt>항목 유형</dt>
                        <dd>{formatAiFieldType(item.field_type)}</dd>
                      </div>
                      <div>
                        <dt>원문값</dt>
                        <dd>{formatValue(item.raw_value)}</dd>
                      </div>
                      <div>
                        <dt>제안값</dt>
                        <dd>{formatValue(item.suggested_value)}</dd>
                      </div>
                      <div>
                        <dt>확신도</dt>
                        <dd>{formatValue(item.confidence)}</dd>
                      </div>
                      <div>
                        <dt>판단 근거</dt>
                        <dd>{formatValue(item.reason)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </section>

          <AiRecommendationApplyPanel
            runId={runId}
            items={selectableItems}
            selectedItems={selectedItems}
            isLoading={applyLoadingRunId === runId}
            buttonLabel="선택 항목 반영"
            onToggle={onApplyToggle}
            onApply={onApply}
          />
        </>
      )}
    </section>
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
  isActionRunning,
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
                    disabled={isActionRunning}
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
                    <option value="removed">removed</option>
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
  if (status === 'confirmed') {
    return '확정'
  }
  if (status === 'removed') {
    return '제외'
  }
  return '미확인'
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

function formatAiRunStatus(status) {
  if (status === 'succeeded') {
    return '성공'
  }
  if (status === 'failed') {
    return '실패'
  }
  return formatValue(status)
}

function formatAiAppliedStatus(status) {
  if (status === 'not_applied') {
    return '미반영'
  }
  if (status === 'partially_applied') {
    return '일부 반영'
  }
  if (status === 'applied') {
    return '반영 완료'
  }
  return formatValue(status)
}

function formatAiFieldType(fieldType) {
  const fieldTypeLabels = {
    industry: '산업',
    domain: '도메인',
    position: '직무',
    skill: '기술/도구',
    competency: '역량',
  }

  return fieldTypeLabels[fieldType] || formatValue(fieldType)
}

function formatAiApplyAction(action) {
  const actionLabels = {
    created_review_item: '정제 항목 생성',
    updated_existing_review_item: '기존 항목 갱신',
    existing_confirmed_reused: '기존 확정 항목 유지',
    skipped_removed_history: '제외 이력으로 미반영',
  }

  return actionLabels[action] || formatValue(action)
}

function formatAiCategoryType(categoryType) {
  if (categoryType === 'industry') return '산업'
  if (categoryType === 'domain') return '도메인'
  if (categoryType === 'position') return '직무'
  return categoryType || '-'
}

function formatAiCategoryCandidateStatus(status) {
  if (status === 'pending') return '검토 대기'
  if (status === 'accepted') return '후보 채택'
  if (status === 'rejected') return '제외'
  return status || '-'
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

