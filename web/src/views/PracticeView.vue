<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchChapter } from '@/api/client'
import type { Question } from '@/api/client'
import { useExamStore } from '@/stores/exam'
import { useSettingsStore } from '@/stores/settings'
import QuestionOption from '@/components/QuestionOption.vue'
import RubyText from '@/components/RubyText.vue'
import type { Lang } from '@/stores/settings'
import AppDownloadBanner from '@/components/AppDownloadBanner.vue'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { usePageSEO } from '@/composables/usePageSEO'

const route = useRoute()
const router = useRouter()
const examStore = useExamStore()
const settingsStore = useSettingsStore()
const certId = route.params.certId as string
const chapterId = parseInt(route.params.chapterId as string)
const lang = computed(() => settingsStore.lang)
const furigana = computed(() => settingsStore.lang === 'ja' && settingsStore.furigana)

// ─── SEO ─────────────────────────────────────────────────────────────────────
const CERT_NAMES_SEO: Record<string, { ja: string; en: string; zh: string }> = {
  'saa-c03': { ja: 'ソリューションアーキテクト アソシエイト', en: 'Solutions Architect Associate', zh: '解决方案架构师助理' },
  'sap-c02': { ja: 'ソリューションアーキテクト プロフェッショナル', en: 'Solutions Architect Professional', zh: '解决方案架构师专业级' },
  'clf-c02': { ja: 'クラウドプラクティショナー', en: 'Cloud Practitioner', zh: '云从业者' },
  'dva-c02': { ja: 'デベロッパー アソシエイト', en: 'Developer Associate', zh: '开发人员助理' },
  'soa-c02': { ja: 'SysOps アドミニストレーター', en: 'SysOps Administrator', zh: 'SysOps 管理员' },
  'dop-c02': { ja: 'DevOps エンジニア プロフェッショナル', en: 'DevOps Engineer Professional', zh: 'DevOps 工程师专业级' },
  'aif-c01': { ja: 'AI プラクティショナー', en: 'AI Practitioner', zh: 'AI 从业者' },
  'aip-c01': { ja: '生成 AI デベロッパー プロフェッショナル', en: 'Generative AI Developer Professional', zh: '生成式 AI 开发人员专业级' },
  'ans-c01': { ja: '高度なネットワーキング 専門知識', en: 'Advanced Networking Specialty', zh: '高级网络专项认证' },
  'dea-c01': { ja: 'データエンジニア アソシエイト', en: 'Data Engineer Associate', zh: '数据工程师助理' },
  'mla-c01': { ja: 'ML エンジニア アソシエイト', en: 'ML Engineer Associate', zh: '机器学习工程师助理' },
  'scs-c02': { ja: 'セキュリティ 専門知識', en: 'Security Specialty', zh: '安全专项认证' },
}

usePageSEO(() => {
  const l = lang.value
  const name = CERT_NAMES_SEO[certId]?.[l] ?? certId.toUpperCase()
  const code = certId.toUpperCase()
  if (l === 'en') {
    return {
      title: `${code} Chapter ${chapterId} — ${name} Practice | AWS Exam Prep`,
      description: `Practice ${code} ${name} Chapter ${chapterId} questions in exam format. Detailed explanations included for every answer.`,
    }
  } else if (l === 'zh') {
    return {
      title: `${code} 第${chapterId}章 — ${name} 练习题 | AWS认证备考`,
      description: `以考试形式作答 ${code} ${name} 第${chapterId}章练习题，每题附详细解析，快速掌握AWS认证考试要点。`,
    }
  }
  return {
    title: `${code} 第${chapterId}章 — ${name} 練習問題 | AWS認定試験対策`,
    description: `AWS ${code} ${name}の第${chapterId}章を本番形式で学習。全問に解説付きで苦手分野を克服できます。`,
  }
})

// ─── i18n ────────────────────────────────────────────────────────────────────
const ui = computed(() => {
  const l = lang.value
  return {
    questionList:  l === 'en' ? 'Questions'      : l === 'zh' ? '题目列表'   : '問題一覧',
    correct:       l === 'en' ? 'Correct'        : l === 'zh' ? '正确'       : '正解',
    wrong:         l === 'en' ? 'Incorrect'      : l === 'zh' ? '错误'       : '不正解',
    unanswered:    l === 'en' ? 'Unanswered'     : l === 'zh' ? '未作答'     : '未回答',
    multiple:      l === 'en' ? 'Multiple Choice': l === 'zh' ? '多选'       : '複数選択',
    single:        l === 'en' ? 'Single Choice'  : l === 'zh' ? '单选'       : '単一選択',
    explanation:   l === 'en' ? 'Explanation'    : l === 'zh' ? '解析'       : '解説',
    prev:          l === 'en' ? '← Prev'         : l === 'zh' ? '← 上一题'  : '← 前へ',
    next:          l === 'en' ? 'Next →'         : l === 'zh' ? '下一题 →'  : '次へ →',
    checkAnswer:   l === 'en' ? 'Check Answer'   : l === 'zh' ? '确认答案'   : '答え合わせ',
    resultCorrect: l === 'en' ? '✓ Correct'      : l === 'zh' ? '✓ 正确'    : '✓ 正解',
    resultWrong:   l === 'en' ? '✗ Incorrect'    : l === 'zh' ? '✗ 错误'    : '✗ 不正解',
    viewResults:   l === 'en' ? 'View Results'   : l === 'zh' ? '查看结果'   : '結果を見る',
    questionLabel: l === 'en' ? 'Q'              : l === 'zh' ? '题'         : '問',
    of:            l === 'en' ? '/'              : l === 'zh' ? '/'          : '/',
    furigana:      l === 'en' ? 'Furigana'       : l === 'zh' ? '假名注音'   : 'ふりがな',
    studyMode:     l === 'en' ? 'Study mode'     : l === 'zh' ? '背题模式'   : '暗記モード',
    answerIs:      l === 'en' ? 'Answer'         : l === 'zh' ? '正确答案'   : '正解',
  }
})

const LANGS: { id: Lang; label: string }[] = [
  { id: 'ja', label: '日本語' },
  { id: 'en', label: 'EN' },
  { id: 'zh', label: '中文' },
]

// ─── State ────────────────────────────────────────────────────────────────────
const loading = ref(true)
const loadError = ref<string | null>(null)
const premiumRequired = ref(false)
const analysisVisible = ref(false)

const elapsedSeconds = computed(() => examStore.elapsedSeconds)
let timerInterval: ReturnType<typeof setInterval> | null = null

const formattedTime = computed(() => {
  const m = Math.floor(elapsedSeconds.value / 60).toString().padStart(2, '0')
  const s = (elapsedSeconds.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

// ─── Load questions ────────────────────────────────────────────────────────────
async function loadQuestions(currentLang: string, resetExam = true): Promise<Question[] | null> {
  try {
    return await fetchChapter(certId, chapterId, currentLang, currentLang === 'ja' && settingsStore.furigana)
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      'code' in err &&
      (err as { code?: string }).code === 'premium_required'
    ) {
      if (resetExam) {
        premiumRequired.value = true
        if (timerInterval !== null) { clearInterval(timerInterval); timerInterval = null }
      }
    } else if (resetExam) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load questions.'
    }
    return null
  }
}

// ?q=N jumps to question N. N is the position in this chapter (1-based, as in
// the sidebar); a number beyond the chapter length is matched against the
// question number printed in the stem ("Q83. ...").
function indexFromQuery(): number | null {
  const n = parseInt(String(route.query.q ?? ''), 10)
  if (!Number.isFinite(n) || n < 1) return null
  if (n <= examStore.questions.length) return n - 1
  const i = examStore.questions.findIndex((q) => q.translation?.stem.startsWith(`Q${n}.`))
  return i >= 0 ? i : null
}

onMounted(async () => {
  timerInterval = setInterval(() => examStore.elapsedSeconds++, 1000)
  // A language switch re-mounts this view (different route prefix); keep the
  // running session (answers, position, timer) when it is the same chapter.
  const resume = history.state?.keepExam === true
    && examStore.certId === certId && examStore.chapterId === chapterId
    && examStore.questions.length > 0
  const qs = await loadQuestions(lang.value, !resume)
  if (qs) {
    if (resume) examStore.updateTranslations(qs)
    else examStore.initExam(certId, chapterId, qs)
    const idx = indexFromQuery()
    if (idx !== null) examStore.goTo(idx)
    if (resume) analysisVisible.value = currentAnswer.value?.checked ?? false
  }
  loading.value = false
})

// Keep ?q= in the address bar in sync with the current question
watch(() => examStore.currentIndex, (i) => {
  if (loading.value || premiumRequired.value) return
  const q = String(i + 1)
  if (route.query.q !== q) router.replace({ query: { ...route.query, q } })
})

// React to manual edits of ?q= while on the page
watch(() => route.query.q, () => {
  if (loading.value) return
  const idx = indexFromQuery()
  if (idx !== null && idx !== examStore.currentIndex) {
    analysisVisible.value = false
    examStore.goTo(idx)
  }
})

function switchLang(l: Lang) {
  if (l === lang.value) return
  const base = route.path.replace(/^\/(ja|zh)(?=\/|$)/, '') || '/'
  const path = l === 'en' ? base : `/${l}${base}`
  router.replace({ path, query: { ...route.query, q: String(examStore.currentIndex + 1) }, state: { keepExam: true } })
}

async function toggleFurigana() {
  settingsStore.setFurigana(!settingsStore.furigana)
  const qs = await loadQuestions(lang.value, false)
  if (qs) examStore.updateTranslations(qs)
}

onUnmounted(() => {
  if (timerInterval !== null) { clearInterval(timerInterval); timerInterval = null }
})

// Reload translations (keep answers/position) when user switches language
watch(lang, async (newLang) => {
  if (premiumRequired.value || loading.value) return
  const qs = await loadQuestions(newLang, false)
  if (qs) examStore.updateTranslations(qs)
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
  // Study mode: highlight the correct option(s), no answering
  if (studyMode.value) {
    return currentQuestion.value?.correct_answers.includes(label) ? 'correct-unselected' : 'normal'
  }
  const answer = currentAnswer.value
  if (!answer) return 'normal'
  const selected = answer.selected.includes(label)
  const result = answer.checkResult
  if (!answer.checked) return selected ? 'selected' : 'normal'
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
function handleCheck() {
  if (!currentQuestion.value) return
  const answer = currentAnswer.value
  if (!answer || answer.selected.length === 0 || answer.checked) return
  examStore.checkQuestion(currentQuestion.value.id, answer.selected)
  analysisVisible.value = true
}

const studyMode = computed(() => settingsStore.studyMode)
const isLast = computed(() => examStore.currentIndex === examStore.totalQuestions - 1)

function toggleStudyMode() {
  settingsStore.setStudyMode(!settingsStore.studyMode)
  analysisVisible.value = currentAnswer.value?.checked ?? false
}

// ←/→ move between questions (handy when memorising); ignored while typing
function onKeydown(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
  if (e.key === 'ArrowRight' && !isLast.value) { handleNext() }
  else if (e.key === 'ArrowLeft') { handlePrev() }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

function handleNext() {
  analysisVisible.value = false
  if (examStore.currentIndex === examStore.totalQuestions - 1) {
    if (examStore.isFinished) router.push('/results')
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
    <!-- Premium required -->
    <AppDownloadBanner :show="premiumRequired" />

    <!-- Loading -->
    <div v-if="loading && !premiumRequired" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="text-center py-20 text-red-600">{{ loadError }}</div>

    <!-- Practice UI -->
    <div v-else-if="!premiumRequired && !loading" class="flex gap-6">

      <!-- Left sidebar: question nav -->
      <aside class="hidden lg:block w-48 shrink-0">
        <div class="bg-white rounded-xl p-4 shadow-sm sticky top-20">
          <div class="text-xs text-gray-500 mb-3 font-semibold">{{ ui.questionList }}</div>
          <div class="grid grid-cols-5 gap-1.5">
            <button
              v-for="(q, i) in examStore.questions"
              :key="q.id"
              @click="handleNavDot(i)"
              :class="['w-7 h-7 rounded-full text-xs font-medium transition-colors text-white', getNavDotClass(i)]"
            >
              {{ i + 1 }}
            </button>
          </div>
          <!-- Score summary -->
          <div class="mt-4 pt-4 border-t text-xs text-gray-500 space-y-1">
            <div class="flex justify-between">
              <span>{{ ui.correct }}</span>
              <span class="text-green-600 font-semibold">{{ examStore.correctCount }}</span>
            </div>
            <div class="flex justify-between">
              <span>{{ ui.wrong }}</span>
              <span class="text-red-600 font-semibold">{{ examStore.wrongCount }}</span>
            </div>
            <div class="flex justify-between">
              <span>{{ ui.unanswered }}</span>
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
              {{ ui.questionLabel }} {{ examStore.currentIndex + 1 }} {{ ui.of }} {{ examStore.totalQuestions }}
            </span>
            <div class="flex items-center gap-2 flex-wrap justify-end">
              <button
                @click="toggleStudyMode"
                :aria-pressed="studyMode"
                :class="['text-xs px-2 py-1 rounded-md border transition-colors',
                  studyMode ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50']"
              >{{ ui.studyMode }}</button>
              <button
                v-if="lang === 'ja'"
                @click="toggleFurigana"
                :aria-pressed="settingsStore.furigana"
                :class="['text-xs px-2 py-1 rounded-md border transition-colors',
                  settingsStore.furigana ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50']"
              >{{ ui.furigana }}</button>
              <div class="inline-flex rounded-md border border-gray-300 overflow-hidden text-xs" role="group" aria-label="Language">
                <button
                  v-for="l in LANGS"
                  :key="l.id"
                  @click="switchLang(l.id)"
                  :aria-pressed="lang === l.id"
                  :class="['px-2 py-1 transition-colors', lang === l.id ? 'bg-slate-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50']"
                >{{ l.label }}</button>
              </div>
              <span class="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                ⏱ {{ formattedTime }}
              </span>
            </div>
          </div>
          <Progress :model-value="progressPct" class="h-2" />
        </div>

        <!-- Question card -->
        <div v-if="currentQuestion" class="bg-white rounded-xl p-6 shadow-sm">
          <!-- Type + difficulty tags -->
          <div class="flex items-center gap-2 mb-4">
            <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
              {{ isMultiple ? ui.multiple : ui.single }}
            </span>
            <span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {{ currentQuestion.difficulty }}
            </span>
          </div>

          <!-- Question stem -->
          <p class="text-gray-900 text-base mb-6 whitespace-pre-wrap">
            <RubyText :text="currentQuestion.translation.stem" :segs="furigana ? currentQuestion.ruby?.stem : undefined" />
          </p>

          <!-- Options -->
          <div class="space-y-2">
            <QuestionOption
              v-for="[label, text] in Object.entries(currentQuestion.translation.options)"
              :key="label"
              :label="label"
              :text="text"
              :ruby="furigana ? currentQuestion.ruby?.options[label] : undefined"
              :state="getOptionState(label)"
              :disabled="isChecked || studyMode"
              @select="examStore.selectOption(currentQuestion!.id, label, isMultiple)"
            />
          </div>

          <!-- Analysis -->
          <div
            v-if="studyMode || (isChecked && analysisVisible)"
            class="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg"
          >
            <div class="text-amber-700 font-semibold text-sm mb-2">{{ ui.explanation }}</div>
            <p class="text-sm text-gray-700 whitespace-pre-wrap">
              <RubyText
                :text="currentQuestion.translation.analysis || currentAnswer?.checkResult?.analysis || ''"
                :segs="furigana ? currentQuestion.ruby?.analysis : undefined"
              />
            </p>
          </div>

          <!-- Action buttons -->
          <div class="flex items-center justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              @click="handlePrev"
              :disabled="examStore.currentIndex === 0"
            >
              {{ ui.prev }}
            </Button>

            <span v-if="studyMode" class="text-sm font-semibold text-green-700">
              {{ ui.answerIs }}: {{ currentQuestion.correct_answers.join(', ') }}
            </span>
            <Button
              v-else-if="!isChecked"
              @click="handleCheck"
              :disabled="!currentAnswer || currentAnswer.selected.length === 0"
              class="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {{ ui.checkAnswer }}
            </Button>
            <span
              v-else
              class="text-sm font-semibold"
              :class="currentAnswer?.checkResult?.correct ? 'text-green-600' : 'text-red-600'"
            >
              {{ currentAnswer?.checkResult?.correct ? ui.resultCorrect : ui.resultWrong }}
            </span>

            <Button
              @click="handleNext"
              :disabled="studyMode && isLast"
              :class="isLast && !studyMode ? 'bg-green-600 hover:bg-green-700 text-white' : ''"
            >
              {{ isLast && !studyMode ? ui.viewResults : ui.next }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
