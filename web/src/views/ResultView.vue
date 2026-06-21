<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useExamStore } from '@/stores/exam'
import { useSettingsStore } from '@/stores/settings'
import AppDownloadBanner from '@/components/AppDownloadBanner.vue'
import { Button } from '@/components/ui/button'

const router = useRouter()
const examStore = useExamStore()
const settingsStore = useSettingsStore()

onMounted(() => {
  if (examStore.totalQuestions === 0) {
    router.push('/')
  }
})

// ─── Localization ─────────────────────────────────────────────────────────────

const lang = computed(() => settingsStore.lang as 'ja' | 'en' | 'zh')

const t = computed(() => {
  const map = {
    ja: {
      title: '練習結果',
      correct: '正解',
      wrong: '不正解',
      unanswered: '未回答',
      questionNum: '#',
      questionCol: '問題',
      resultCol: '結果',
      yourAnswer: '回答',
      correctAnswer: '正解',
      tryAgain: 'もう一度',
      backToHome: '試験選択に戻る',
      correctLabel: '✓ 正解',
      wrongLabel: '✗ 不正解',
      unansweredLabel: '–',
    },
    en: {
      title: 'Results',
      correct: 'Correct',
      wrong: 'Incorrect',
      unanswered: 'Unanswered',
      questionNum: '#',
      questionCol: 'Question',
      resultCol: 'Result',
      yourAnswer: 'Your Answer',
      correctAnswer: 'Correct Answer',
      tryAgain: 'Try Again',
      backToHome: 'Back to Exam Selection',
      correctLabel: '✓ Correct',
      wrongLabel: '✗ Incorrect',
      unansweredLabel: '–',
    },
    zh: {
      title: '练习结果',
      correct: '正确',
      wrong: '错误',
      unanswered: '未作答',
      questionNum: '#',
      questionCol: '题目',
      resultCol: '结果',
      yourAnswer: '你的答案',
      correctAnswer: '正确答案',
      tryAgain: '再来一次',
      backToHome: '返回考试选择',
      correctLabel: '✓ 正确',
      wrongLabel: '✗ 错误',
      unansweredLabel: '–',
    },
  }
  return map[lang.value]
})

// ─── Score calculation ────────────────────────────────────────────────────────

const scorePercent = computed(() =>
  examStore.totalQuestions > 0
    ? Math.round((examStore.correctCount / examStore.totalQuestions) * 100)
    : 0,
)

const scoreCircleClass = computed(() => {
  const pct = scorePercent.value
  if (pct >= 80) return 'border-green-500 text-green-700'
  if (pct >= 60) return 'border-yellow-500 text-yellow-700'
  return 'border-red-500 text-red-700'
})

// ─── Per-question table rows ──────────────────────────────────────────────────

interface ResultRow {
  index: number
  stem: string
  resultLabel: string
  resultClass: string
  rowClass: string
  yourAnswer: string
  correctAnswer: string
}

const resultRows = computed<ResultRow[]>(() =>
  examStore.questions.map((q, i) => {
    const answer = examStore.answers.get(q.id)
    const stem =
      q.translation.stem.length > 60
        ? q.translation.stem.slice(0, 60) + '…'
        : q.translation.stem

    if (!answer || !answer.checked) {
      return {
        index: i + 1,
        stem,
        resultLabel: t.value.unansweredLabel,
        resultClass: 'text-gray-400',
        rowClass: '',
        yourAnswer: '–',
        correctAnswer: answer?.checkResult?.correct_answers.join(', ') ?? '–',
      }
    }

    const isCorrect = answer.checkResult?.correct ?? false
    return {
      index: i + 1,
      stem,
      resultLabel: isCorrect ? t.value.correctLabel : t.value.wrongLabel,
      resultClass: isCorrect ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold',
      rowClass: isCorrect ? 'bg-green-50' : 'bg-red-50',
      yourAnswer: answer.selected.join(', ') || '–',
      correctAnswer: answer.checkResult?.correct_answers.join(', ') ?? '–',
    }
  }),
)

// ─── Navigation ──────────────────────────────────────────────────────────────

function handleTryAgain() {
  const certId = examStore.certId
  const chapterId = examStore.chapterId
  router.push(`/cert/${certId}/chapter/${chapterId}`)
}

function handleBackToHome() {
  router.push('/')
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <!-- Title -->
    <h1 class="text-2xl font-bold text-gray-900 text-center mb-2">{{ t.title }}</h1>

    <!-- Score circle -->
    <div class="flex justify-center my-8">
      <div
        :class="[
          'w-40 h-40 rounded-full flex flex-col items-center justify-center border-8 shadow-lg',
          scoreCircleClass,
        ]"
      >
        <span class="text-3xl font-bold">{{ examStore.correctCount }}</span>
        <span class="text-lg text-gray-400">/{{ examStore.totalQuestions }}</span>
        <span class="text-lg font-semibold mt-1">{{ scorePercent }}%</span>
      </div>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-3 gap-4 mb-8">
      <div class="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <div class="text-2xl font-bold text-green-700">{{ examStore.correctCount }}</div>
        <div class="text-sm text-green-600 mt-1">{{ t.correct }}</div>
      </div>
      <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
        <div class="text-2xl font-bold text-red-700">{{ examStore.wrongCount }}</div>
        <div class="text-sm text-red-600 mt-1">{{ t.wrong }}</div>
      </div>
      <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
        <div class="text-2xl font-bold text-gray-700">{{ examStore.unansweredCount }}</div>
        <div class="text-sm text-gray-500 mt-1">{{ t.unanswered }}</div>
      </div>
    </div>

    <!-- Per-question table -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200">
              <th class="px-3 py-3 text-left text-xs font-semibold text-gray-500 w-10">
                {{ t.questionNum }}
              </th>
              <th class="px-3 py-3 text-left text-xs font-semibold text-gray-500">
                {{ t.questionCol }}
              </th>
              <th class="px-3 py-3 text-left text-xs font-semibold text-gray-500 w-28">
                {{ t.resultCol }}
              </th>
              <th class="px-3 py-3 text-left text-xs font-semibold text-gray-500 w-24">
                {{ t.yourAnswer }}
              </th>
              <th class="px-3 py-3 text-left text-xs font-semibold text-gray-500 w-24">
                {{ t.correctAnswer }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="row in resultRows"
              :key="row.index"
              :class="[row.rowClass, 'transition-colors']"
            >
              <td class="px-3 py-3 text-gray-400 font-mono text-xs">{{ row.index }}</td>
              <td class="px-3 py-3 text-gray-700 leading-snug">{{ row.stem }}</td>
              <td class="px-3 py-3" :class="row.resultClass">{{ row.resultLabel }}</td>
              <td class="px-3 py-3 text-gray-600 font-mono text-xs">{{ row.yourAnswer }}</td>
              <td class="px-3 py-3 text-gray-600 font-mono text-xs">{{ row.correctAnswer }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
      <Button
        @click="handleTryAgain"
        class="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto px-8"
      >
        {{ t.tryAgain }}
      </Button>
      <Button
        variant="outline"
        @click="handleBackToHome"
        class="w-full sm:w-auto px-8"
      >
        {{ t.backToHome }}
      </Button>
    </div>

    <!-- App download banner -->
    <AppDownloadBanner :show="true" />
  </div>
</template>
