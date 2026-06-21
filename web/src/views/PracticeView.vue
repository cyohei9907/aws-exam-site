<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchChapter, checkAnswer } from '@/api/client'
import type { Question, CheckResult } from '@/api/client'
import { useExamStore } from '@/stores/exam'
import { useSettingsStore } from '@/stores/settings'
import QuestionOption from '@/components/QuestionOption.vue'
import AppDownloadBanner from '@/components/AppDownloadBanner.vue'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

const route = useRoute()
const router = useRouter()
const examStore = useExamStore()
const settingsStore = useSettingsStore()
const certId = route.params.certId as string
const chapterId = parseInt(route.params.chapterId as string)
const lang = computed(() => settingsStore.lang)

const loading = ref(true)
const loadError = ref<string | null>(null)
const premiumRequired = ref(false)
const checkingAnswer = ref(false)
const analysisVisible = ref(false)

// Timer: counts up in seconds
const elapsedSeconds = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

const formattedTime = computed(() => {
  const m = Math.floor(elapsedSeconds.value / 60).toString().padStart(2, '0')
  const s = (elapsedSeconds.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

onMounted(async () => {
  // Start timer
  timerInterval = setInterval(() => {
    elapsedSeconds.value++
  }, 1000)

  // Load questions
  try {
    const questions = await fetchChapter(certId, chapterId, lang.value)
    examStore.initExam(certId, chapterId, questions)
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      'code' in err &&
      (err as { code?: string }).code === 'premium_required'
    ) {
      premiumRequired.value = true
      if (timerInterval !== null) {
        clearInterval(timerInterval)
        timerInterval = null
      }
    } else {
      loadError.value =
        err instanceof Error ? err.message : '問題の読み込みに失敗しました。'
    }
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (timerInterval !== null) {
    clearInterval(timerInterval)
    timerInterval = null
  }
})

// ─── Current question data ────────────────────────────────────────────────────

const currentQuestion = computed(() => examStore.currentQuestion)
const currentAnswer = computed(() =>
  examStore.answers.get(currentQuestion.value?.id ?? ''),
)
const isMultiple = computed(() => currentQuestion.value?.type === 'multiple')
const isChecked = computed(() => currentAnswer.value?.checked ?? false)
const progressPct = computed(() =>
  examStore.totalQuestions > 0
    ? Math.round((examStore.answeredCount / examStore.totalQuestions) * 100)
    : 0,
)

// ─── Option state ─────────────────────────────────────────────────────────────

function getOptionState(
  label: string,
): 'normal' | 'selected' | 'correct' | 'wrong' | 'correct-unselected' {
  const answer = currentAnswer.value
  if (!answer) return 'normal'
  const selected = answer.selected.includes(label)
  const result = answer.checkResult
  if (!answer.checked) {
    return selected ? 'selected' : 'normal'
  }
  // checked
  const isCorrect = result?.correct_answers.includes(label) ?? false
  if (isCorrect && selected) return 'correct'
  if (!isCorrect && selected) return 'wrong'
  if (isCorrect && !selected) return 'correct-unselected'
  return 'normal'
}

// ─── Nav dot helpers ─────────────────────────────────────────────────────────

function getNavDotClass(index: number): string {
  const q = examStore.questions[index]
  if (!q) return 'bg-gray-200'
  const answer = examStore.answers.get(q.id)
  const isCurrent = index === examStore.currentIndex
  if (isCurrent) return 'bg-blue-500 ring-2 ring-blue-300'
  if (!answer || !answer.checked) return 'bg-gray-200 hover:bg-gray-300'
  return answer.checkResult?.correct ? 'bg-green-500' : 'bg-red-500'
}

// ─── Actions ─────────────────────────────────────────────────────────────────

async function handleCheck() {
  if (!currentQuestion.value) return
  const answer = currentAnswer.value
  if (!answer || answer.selected.length === 0 || answer.checked) return
  checkingAnswer.value = true
  try {
    const result = await checkAnswer(
      certId,
      chapterId,
      currentQuestion.value.id,
      answer.selected,
      lang.value,
    )
    examStore.setCheckResult(currentQuestion.value.id, result)
    analysisVisible.value = true
  } finally {
    checkingAnswer.value = false
  }
}

function handleNext() {
  analysisVisible.value = false
  if (examStore.currentIndex === examStore.totalQuestions - 1) {
    // Last question
    if (examStore.isFinished) {
      router.push('/results')
    }
  } else {
    examStore.next()
  }
}

function handlePrev() {
  analysisVisible.value = false
  examStore.prev()
}

function handleNavDot(index: number) {
  analysisVisible.value = false
  examStore.goTo(index)
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-6">
    <!-- Premium required state -->
    <AppDownloadBanner :show="premiumRequired" />

    <!-- Loading state -->
    <div v-if="loading && !premiumRequired" class="flex justify-center py-20">
      <div
        class="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"
      ></div>
    </div>

    <!-- Error state -->
    <div v-else-if="loadError" class="text-center py-20 text-red-600">{{ loadError }}</div>

    <!-- Practice UI -->
    <div v-else-if="!premiumRequired && !loading" class="flex gap-6">
      <!-- Left sidebar: question nav -->
      <aside class="hidden lg:block w-48 shrink-0">
        <div class="bg-white rounded-xl p-4 shadow-sm sticky top-20">
          <div class="text-xs text-gray-500 mb-3 font-semibold">問題一覧</div>
          <div class="grid grid-cols-5 gap-1.5">
            <button
              v-for="(q, i) in examStore.questions"
              :key="q.id"
              @click="handleNavDot(i)"
              :class="[
                'w-7 h-7 rounded-full text-xs font-medium transition-colors text-white',
                getNavDotClass(i),
              ]"
            >
              {{ i + 1 }}
            </button>
          </div>
          <!-- Score summary -->
          <div class="mt-4 pt-4 border-t text-xs text-gray-500 space-y-1">
            <div class="flex justify-between">
              <span>正解</span>
              <span class="text-green-600 font-semibold">{{ examStore.correctCount }}</span>
            </div>
            <div class="flex justify-between">
              <span>不正解</span>
              <span class="text-red-600 font-semibold">{{ examStore.wrongCount }}</span>
            </div>
            <div class="flex justify-between">
              <span>未回答</span>
              <span class="text-gray-600 font-semibold">{{ examStore.unansweredCount }}</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main content -->
      <div class="flex-1 min-w-0">
        <!-- Progress bar + header -->
        <div class="bg-white rounded-xl p-4 shadow-sm mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-gray-600">
              第 {{ examStore.currentIndex + 1 }} 問 / {{ examStore.totalQuestions }}
            </span>
            <span class="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
              ⏱ {{ formattedTime }}
            </span>
          </div>
          <Progress :model-value="progressPct" class="h-2" />
        </div>

        <!-- Question card -->
        <div v-if="currentQuestion" class="bg-white rounded-xl p-6 shadow-sm">
          <!-- Multiple/single tag -->
          <div class="flex items-center gap-2 mb-4">
            <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
              {{ isMultiple ? '複数選択' : '単一選択' }}
            </span>
            <span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {{ currentQuestion.difficulty }}
            </span>
          </div>

          <!-- Question stem -->
          <p class="text-gray-900 text-base leading-relaxed mb-6 whitespace-pre-wrap">
            {{ currentQuestion.translation.stem }}
          </p>

          <!-- Options -->
          <div class="space-y-2">
            <QuestionOption
              v-for="[label, text] in Object.entries(currentQuestion.translation.options)"
              :key="label"
              :label="label"
              :text="text"
              :state="getOptionState(label)"
              :disabled="isChecked || checkingAnswer"
              @select="examStore.selectOption(currentQuestion!.id, label, isMultiple)"
            />
          </div>

          <!-- Analysis (shown after check) -->
          <div
            v-if="isChecked && analysisVisible"
            class="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg"
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="text-amber-700 font-semibold text-sm">解説</span>
            </div>
            <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {{ currentAnswer?.checkResult?.analysis }}
            </p>
          </div>

          <!-- Action buttons -->
          <div class="flex items-center justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              @click="handlePrev"
              :disabled="examStore.currentIndex === 0"
            >
              ← 前へ
            </Button>

            <Button
              v-if="!isChecked"
              @click="handleCheck"
              :disabled="!currentAnswer || currentAnswer.selected.length === 0 || checkingAnswer"
              class="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {{ checkingAnswer ? '確認中...' : '答え合わせ' }}
            </Button>
            <span
              v-else
              class="text-sm font-semibold"
              :class="
                currentAnswer?.checkResult?.correct ? 'text-green-600' : 'text-red-600'
              "
            >
              {{ currentAnswer?.checkResult?.correct ? '✓ 正解' : '✗ 不正解' }}
            </span>

            <Button
              @click="handleNext"
              :class="
                examStore.currentIndex === examStore.totalQuestions - 1
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : ''
              "
            >
              {{
                examStore.currentIndex === examStore.totalQuestions - 1 ? '結果を見る' : '次へ →'
              }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
