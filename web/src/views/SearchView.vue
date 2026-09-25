<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { useSettingsStore } from '@/stores/settings'
import { searchQuestions, ApiError, type Question } from '@/api/client'

const route = useRoute()
const router = useRouter()
const settings = useSettingsStore()
const lang = computed(() => settings.lang)

// Full trilingual cert names (mirrors PracticeView's SEO map).
const CERT_NAMES: Record<string, { ja: string; en: string; zh: string }> = {
  'saa-c03': { ja: 'ソリューションアーキテクト アソシエイト', en: 'Solutions Architect Associate', zh: '解决方案架构师助理' },
  'sap-c02': { ja: 'ソリューションアーキテクト プロフェッショナル', en: 'Solutions Architect Professional', zh: '解决方案架构师专业级' },
  'clf-c02': { ja: 'クラウドプラクティショナー', en: 'Cloud Practitioner', zh: '云从业者' },
  'dva-c02': { ja: 'デベロッパー アソシエイト', en: 'Developer Associate', zh: '开发人员助理' },
  'soa-c02': { ja: 'SysOps アドミニストレーター アソシエイト', en: 'SysOps Administrator Associate', zh: 'SysOps 管理员助理' },
  'dop-c02': { ja: 'DevOps エンジニア プロフェッショナル', en: 'DevOps Engineer Professional', zh: 'DevOps 工程师专业级' },
  'aif-c01': { ja: 'AI プラクティショナー', en: 'AI Practitioner', zh: 'AI 从业者' },
  'ans-c01': { ja: '高度なネットワーキング 専門知識', en: 'Advanced Networking Specialty', zh: '高级网络专业知识' },
  'dea-c01': { ja: 'データエンジニア アソシエイト', en: 'Data Engineer Associate', zh: '数据工程师助理' },
  'mla-c01': { ja: 'ML エンジニア アソシエイト', en: 'ML Engineer Associate', zh: 'ML 工程师助理' },
  'scs-c02': { ja: 'セキュリティ 専門知識', en: 'Security Specialty', zh: '安全专业知识' },
}

const t = (ja: string, en: string, zh: string) => (lang.value === 'en' ? en : lang.value === 'zh' ? zh : ja)
const certCode = (id: string) => id.toUpperCase()
const certName = (id: string) => CERT_NAMES[id]?.[lang.value] ?? id.toUpperCase()

// ── State ──────────────────────────────────────────────────────────────────────
const input = ref((route.query.q as string) ?? '')
const scopeCert = computed(() => (route.query.cert as string) || '')
const results = ref<Question[]>([])
const total = ref(0)
const loading = ref(false)
const errorCode = ref<string | null>(null)
const expanded = ref<Set<string>>(new Set())
const searched = ref(false)

function toggle(id: string) {
  const next = new Set(expanded.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expanded.value = next
}

// ── Highlight ────────────────────────────────────────────────────────────────
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}
function highlight(text: string): string {
  const q = input.value.trim()
  const safe = escapeHtml(text)
  if (q.length < 2) return safe
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return safe.replace(new RegExp(escaped, 'gi'), (m) => `<mark class="bg-yellow-200 text-slate-900 rounded px-0.5">${m}</mark>`)
}

// ── Fetch ────────────────────────────────────────────────────────────────────
async function runSearch() {
  const q = input.value.trim()
  errorCode.value = null
  if (q.length < 2) {
    results.value = []
    total.value = 0
    searched.value = false
    return
  }
  loading.value = true
  searched.value = true
  try {
    const res = await searchQuestions(q, lang.value, { cert: scopeCert.value || undefined, limit: 30 })
    results.value = res.results
    total.value = res.total
  } catch (e) {
    results.value = []
    total.value = 0
    errorCode.value = e instanceof ApiError ? e.code ?? 'error' : 'error'
  } finally {
    loading.value = false
  }
}

const debouncedSearch = useDebounceFn(runSearch, 300)

// Keep the URL query in sync (shareable), then search.
function onInput() {
  const q = input.value.trim()
  const query: Record<string, string> = {}
  if (q) query.q = q
  if (scopeCert.value) query.cert = scopeCert.value
  router.replace({ path: route.path, query })
  debouncedSearch()
}

// Open the question's chapter in practice mode (free chapters only). Question
// ids are cert-wide indices, not per-chapter positions, so we land on the
// chapter's practice view rather than guessing an exact position.
function openInPractice(r: Question) {
  const prefix = lang.value === 'en' ? '' : `/${lang.value}`
  router.push(`${prefix}/cert/${r.cert_id}/chapter/${r.chapter}`)
}

onMounted(runSearch)
watch(lang, runSearch)
watch(() => route.query.cert, runSearch)
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 mb-5">
      {{ t('検索結果', 'Search Results', '搜索结果') }}
    </h1>

    <!-- Search box -->
    <div class="relative mb-3">
      <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
      </svg>
      <input
        v-model="input"
        type="search"
        :placeholder="t('問題をキーワード検索…', 'Search questions by keyword…', '按关键字搜索题目…')"
        class="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none text-slate-900"
        @input="onInput"
      />
    </div>

    <!-- Scope + disclosure -->
    <div class="flex flex-wrap items-center gap-2 text-sm text-slate-500 mb-6">
      <span v-if="scopeCert" class="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-full">
        {{ t('絞り込み', 'Within', '范围') }}: {{ certCode(scopeCert) }}
        <button class="hover:text-slate-900" @click="router.replace({ path: route.path, query: input.trim() ? { q: input.trim() } : {} })">✕</button>
      </span>
      <span v-else>{{ t('すべての試験', 'All certifications', '全部认证') }}</span>
      <span>·</span>
      <span>{{ t('検索結果は無料チャプターの問題のみを対象としています。', 'Search covers free-chapter questions only.', '搜索仅涵盖免费章节的题目。') }}</span>
    </div>

    <!-- States -->
    <div v-if="input.trim().length > 0 && input.trim().length < 2" class="text-slate-500 py-8 text-center">
      {{ t('2文字以上入力してください。', 'Type at least 2 characters.', '请输入至少 2 个字符。') }}
    </div>

    <div v-else-if="loading" class="py-10 flex justify-center">
      <div class="w-6 h-6 border-2 border-slate-300 border-t-orange-500 rounded-full animate-spin" />
    </div>

    <div v-else-if="errorCode === 'rate_limited'" class="rounded-xl bg-orange-50 border border-orange-200 text-orange-700 px-4 py-6 text-center">
      {{ t('検索が多すぎます。少し待ってからお試しください。', 'Too many searches. Please wait a moment and try again.', '搜索过于频繁，请稍候再试。') }}
    </div>

    <div v-else-if="errorCode" class="text-red-500 py-8 text-center">
      {{ t('検索に失敗しました。', 'Search failed.', '搜索失败。') }}
    </div>

    <div v-else-if="!searched" class="text-slate-400 py-12 text-center">
      {{ t('キーワードを入力して問題を検索。', 'Enter a keyword to search questions.', '输入关键字搜索题目。') }}
    </div>

    <div v-else-if="results.length === 0" class="text-slate-500 py-12 text-center">
      {{ t('該当する問題が見つかりませんでした。', 'No matching questions found.', '未找到匹配的题目。') }}
    </div>

    <template v-else>
      <p class="text-sm text-slate-500 mb-4">
        {{ total }}{{ t(' 件の結果', ' results', ' 条结果') }}
        <span v-if="total > results.length" class="text-slate-400">（{{ t('上位', 'showing top', '显示前') }} {{ results.length }}）</span>
      </p>

      <div class="space-y-4">
        <div
          v-for="r in results"
          :key="r.id"
          class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <!-- chips -->
          <div class="flex flex-wrap items-center gap-2 mb-3">
            <span class="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">{{ certCode(r.cert_id) }}</span>
            <span class="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
              {{ t('チャプター', 'Chapter', '章节') }} {{ r.chapter }}
            </span>
            <span class="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              {{ r.type === 'multiple' ? t('複数選択', 'Multiple', '多选') : t('単一選択', 'Single', '单选') }}
            </span>
            <span
              class="text-xs px-2 py-0.5 rounded"
              :class="r.difficulty === 'hard' ? 'bg-red-50 text-red-600' : r.difficulty === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'"
            >
              {{ r.difficulty === 'hard' ? t('難', 'Hard', '难') : r.difficulty === 'medium' ? t('中', 'Medium', '中') : t('易', 'Easy', '易') }}
            </span>
            <span class="text-xs text-slate-400 ml-auto">{{ certName(r.cert_id) }}</span>
          </div>

          <!-- stem -->
          <p class="text-slate-800 leading-relaxed" v-html="highlight(r.translation?.stem ?? '')" />

          <!-- actions -->
          <div class="flex items-center gap-4 mt-3">
            <button class="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1" @click="toggle(r.id)">
              <span>{{ expanded.has(r.id) ? '▲' : '▼' }}</span>
              {{ expanded.has(r.id) ? t('閉じる', 'Collapse', '收起') : t('詳細を見る', 'Show detail', '查看详情') }}
            </button>
            <button class="text-sm text-emerald-600 hover:text-emerald-800 font-medium inline-flex items-center gap-1" @click="openInPractice(r)">
              {{ t('練習で開く', 'Open in practice', '在练习中打开') }} ›
            </button>
          </div>

          <!-- expanded detail -->
          <div v-if="expanded.has(r.id)" class="mt-4 pt-4 border-t border-slate-100 space-y-2">
            <div
              v-for="(text, letter) in r.translation?.options ?? {}"
              :key="letter"
              class="flex gap-3 rounded-lg px-3 py-2 border"
              :class="r.correct_answers.includes(letter) ? 'bg-emerald-50 border-emerald-200' : 'border-slate-100'"
            >
              <span
                class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                :class="r.correct_answers.includes(letter) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'"
              >{{ letter }}</span>
              <span class="text-sm text-slate-700 leading-relaxed" v-html="highlight(text)" />
              <span v-if="r.correct_answers.includes(letter)" class="ml-auto text-emerald-600 shrink-0">✓</span>
            </div>

            <p class="text-sm font-semibold text-slate-700 pt-2">
              {{ t('正解', 'Correct answer', '正确答案') }}: {{ r.correct_answers.join(', ') }}
            </p>
            <div v-if="r.translation?.analysis" class="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-3">
              <span class="font-semibold text-slate-700">{{ t('解説', 'Explanation', '解析') }}: </span>
              <span v-html="highlight(r.translation.analysis)" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
