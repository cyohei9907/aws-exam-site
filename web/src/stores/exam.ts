import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Question, CheckResult } from '@/api/client'

export interface AnswerRecord {
  questionId: string
  selected: string[]
  checkResult: CheckResult | null
  checked: boolean
}

export const useExamStore = defineStore('exam', () => {
  const certId = ref<string>('')
  const chapterId = ref<number>(0)
  const questions = ref<Question[]>([])
  const currentIndex = ref<number>(0)
  const answers = ref<Map<string, AnswerRecord>>(new Map())
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const currentQuestion = computed(() => questions.value[currentIndex.value] ?? null)
  const totalQuestions = computed(() => questions.value.length)
  const answeredCount = computed(() => {
    let count = 0
    for (const rec of answers.value.values()) {
      if (rec.checked) count++
    }
    return count
  })
  const correctCount = computed(() => {
    let count = 0
    for (const rec of answers.value.values()) {
      if (rec.checked && rec.checkResult?.correct) count++
    }
    return count
  })
  const wrongCount = computed(() => {
    let count = 0
    for (const rec of answers.value.values()) {
      if (rec.checked && rec.checkResult && !rec.checkResult.correct) count++
    }
    return count
  })
  const unansweredCount = computed(() => totalQuestions.value - answeredCount.value)
  const isFinished = computed(
    () => answeredCount.value === totalQuestions.value && totalQuestions.value > 0
  )

  function initExam(newCertId: string, newChapterId: number, qs: Question[]) {
    certId.value = newCertId
    chapterId.value = newChapterId
    questions.value = qs
    currentIndex.value = 0
    answers.value = new Map()
    error.value = null
  }

  function selectOption(questionId: string, option: string, isMultiple: boolean) {
    const existing = answers.value.get(questionId) ?? {
      questionId,
      selected: [],
      checkResult: null,
      checked: false,
    }
    if (existing.checked) return // already checked, no changes
    let selected = [...existing.selected]
    if (isMultiple) {
      const idx = selected.indexOf(option)
      if (idx >= 0) selected.splice(idx, 1)
      else selected.push(option)
    } else {
      selected = [option]
    }
    answers.value.set(questionId, { ...existing, selected })
  }

  function setCheckResult(questionId: string, result: CheckResult) {
    const existing = answers.value.get(questionId)
    if (!existing) return
    answers.value.set(questionId, { ...existing, checkResult: result, checked: true })
  }

  // Local (offline) answer check — no backend call
  function checkQuestion(questionId: string, selected: string[]): void {
    const q = questions.value.find((q) => q.id === questionId)
    if (!q) return
    const sortedSelected = [...selected].sort()
    const sortedCorrect = [...q.correct_answers].sort()
    const correct =
      sortedSelected.length === sortedCorrect.length &&
      sortedSelected.every((ans, i) => ans === sortedCorrect[i])
    setCheckResult(questionId, {
      correct,
      correct_answers: q.correct_answers,
      analysis: q.translation?.analysis ?? '',
    })
  }

  function updateTranslations(qs: Question[]) {
    questions.value = qs
    // Preserve currentIndex and answers — only swap translated text
  }

  function goTo(index: number) {
    if (index >= 0 && index < questions.value.length) {
      currentIndex.value = index
    }
  }

  function next() {
    if (currentIndex.value < questions.value.length - 1) {
      currentIndex.value++
    }
  }

  function prev() {
    if (currentIndex.value > 0) {
      currentIndex.value--
    }
  }

  function reset() {
    certId.value = ''
    chapterId.value = 0
    questions.value = []
    currentIndex.value = 0
    answers.value = new Map()
    loading.value = false
    error.value = null
  }

  return {
    certId,
    chapterId,
    questions,
    currentIndex,
    answers,
    loading,
    error,
    currentQuestion,
    totalQuestions,
    answeredCount,
    correctCount,
    wrongCount,
    unansweredCount,
    isFinished,
    initExam,
    updateTranslations,
    selectOption,
    setCheckResult,
    checkQuestion,
    goTo,
    next,
    prev,
    reset,
  }
})
