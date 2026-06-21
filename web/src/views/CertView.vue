<template>
  <div class="max-w-7xl mx-auto px-4 py-8">

    <!-- Breadcrumb -->
    <nav class="text-sm text-slate-500 mb-6 flex items-center gap-1.5">
      <button class="hover:text-slate-800 transition-colors" @click="router.push('/')">
        {{ lang === 'en' ? 'Home' : lang === 'zh' ? '主页' : 'ホーム' }}
      </button>
      <span>/</span>
      <span class="text-slate-800 font-medium">{{ certName }}</span>
    </nav>

    <!-- Loading skeleton -->
    <template v-if="loading">
      <div class="h-8 w-64 bg-slate-200 rounded animate-pulse mb-2" />
      <div class="h-5 w-32 bg-slate-100 rounded animate-pulse mb-8" />
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div v-for="n in 12" :key="n" class="h-24 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    </template>

    <!-- Error -->
    <div v-else-if="error" class="text-red-500 py-8 text-center">{{ error }}</div>

    <!-- Cert not found -->
    <div v-else-if="!certInfo" class="text-slate-500 py-8 text-center">
      {{ lang === 'en' ? 'Certification not found.' : lang === 'zh' ? '未找到认证。' : '認定が見つかりません。' }}
    </div>

    <!-- Loaded -->
    <template v-else>
      <!-- Header -->
      <div class="mb-8 flex items-center gap-5">
        <CertBadge
          :cert-id="certId"
          :level="(CERT_LEVELS[certId] as any)"
          :size="80"
          class="shrink-0 drop-shadow-md"
        />
        <div>
          <span :class="['text-xs font-semibold px-2.5 py-0.5 rounded-full border mb-2 inline-block', LEVEL_COLORS[CERT_LEVELS[certId]]]">
            {{ CERT_LEVELS[certId] }}
          </span>
          <h1 class="text-2xl sm:text-3xl font-bold text-slate-900">{{ certName }}</h1>
          <p class="text-slate-500 mt-1">
            {{ certInfo.total }}{{ lang === 'zh' ? '道题' : lang === 'en' ? ' questions' : '問の問題' }}
          </p>
        </div>
      </div>

      <!-- App-only banner (cert with no free chapters) -->
      <div v-if="certIsAppOnly(certId)" class="mb-8">
        <div class="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl p-6">
          <div class="flex flex-col sm:flex-row sm:items-center gap-5">
            <div class="flex-1">
              <p class="font-bold text-lg">
                {{ lang === 'en' ? 'iOS App Only' : lang === 'zh' ? '仅限 iOS 应用' : 'iOSアプリ限定' }}
              </p>
              <p class="text-slate-300 text-sm mt-1 leading-relaxed">
                {{ lang === 'en'
                  ? 'This certification has fewer questions and is available exclusively in the iOS app. Download the app to practice all questions.'
                  : lang === 'zh'
                  ? '该认证题目较少，不在网页端免费开放。请下载 iOS 应用练习所有题目。'
                  : 'この認定は問題数が少ないため、iOSアプリ限定です。アプリをダウンロードして全問題を練習しましょう。' }}
              </p>
            </div>
            <a
              href="https://apps.apple.com/app/id6773379862"
              target="_blank"
              class="inline-flex items-center gap-2.5 bg-white text-slate-900 font-semibold px-5 py-3 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              {{ lang === 'en' ? 'Download on App Store' : lang === 'zh' ? '从 App Store 下载' : 'App Store でダウンロード' }}
            </a>
          </div>
        </div>
      </div>

      <!-- Chapter section title (only for certs that have free chapters) -->
      <h2 v-if="!certIsAppOnly(certId)" class="text-lg font-semibold text-slate-700 mb-4">
        {{ lang === 'en' ? 'Select Chapter' : lang === 'zh' ? '选择章节' : '章を選択' }}
      </h2>

      <!-- Chapter grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div
          v-for="ch in certInfo.chapters"
          :key="ch.chapter"
          class="rounded-xl border p-4 flex flex-col gap-2 transition-all cursor-pointer"
          :class="isFreeChapter(certId, ch.chapter)
            ? 'border-slate-200 bg-white hover:shadow-md hover:border-blue-300'
            : 'border-slate-100 bg-slate-50 hover:border-slate-200'"
          @click="handleChapterClick(ch.chapter)"
        >
          <p class="text-sm font-semibold text-slate-800">
            <template v-if="lang === 'en'">Chapter {{ ch.chapter }}</template>
            <template v-else>第{{ ch.chapter }}章</template>
          </p>
          <p class="text-xs text-slate-500">
            {{ ch.count }}{{ lang === 'zh' ? '题' : lang === 'en' ? ' questions' : '問' }}
          </p>
          <div class="mt-auto">
            <span
              v-if="isFreeChapter(certId, ch.chapter)"
              class="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full"
            >
              {{ lang === 'en' ? 'Free' : lang === 'zh' ? '免费' : '無料' }}
            </span>
            <span v-else class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              🔒 {{ lang === 'en' ? 'App only' : lang === 'zh' ? '仅限APP' : 'アプリ限定' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Download prompt (shown when locked chapter clicked) -->
      <div v-if="showDownloadPrompt" class="mt-6" data-download-banner>
        <AppDownloadBanner :show="true" />
      </div>
    </template>
  </div>

</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { fetchCerts, type CertInfo } from '@/api/client'
import { useSettingsStore } from '@/stores/settings'
import AppDownloadBanner from '@/components/AppDownloadBanner.vue'
import CertBadge from '@/components/CertBadge.vue'
import { usePageSEO } from '@/composables/usePageSEO'

// ─── Store / Router / Route ───────────────────────────────────────────────────
const router = useRouter()
const route = useRoute()
const settings = useSettingsStore()
const lang = computed(() => settings.lang)

const certId = route.params.certId as string

// ─── Static data ─────────────────────────────────────────────────────────────
const CERT_DISPLAY: Record<string, { en: string; ja: string; zh: string }> = {
  'saa-c03': { en: 'Solutions Architect Associate', ja: 'ソリューションアーキテクト アソシエイト', zh: '解决方案架构师 - 助理' },
  'sap-c02': { en: 'Solutions Architect Professional', ja: 'ソリューションアーキテクト プロフェッショナル', zh: '解决方案架构师 - 专业级' },
  'clf-c02': { en: 'Cloud Practitioner', ja: 'クラウドプラクティショナー', zh: '云从业者' },
  'dva-c02': { en: 'Developer Associate', ja: 'デベロッパー アソシエイト', zh: '开发人员 - 助理' },
  'soa-c02': { en: 'SysOps Administrator Associate', ja: 'SysOps アドミニストレーター アソシエイト', zh: 'SysOps 管理员 - 助理' },
  'dop-c02': { en: 'DevOps Engineer Professional', ja: 'DevOps エンジニア プロフェッショナル', zh: 'DevOps 工程师 - 专业级' },
  'aif-c01': { en: 'AI Practitioner', ja: 'AI プラクティショナー', zh: 'AI 从业者' },
  'ans-c01': { en: 'Advanced Networking Specialty', ja: '高度なネットワーキング 専門知識', zh: '高级网络 - 专项认证' },
  'das-c01': { en: 'Data Analytics Specialty', ja: 'データ分析 専門知識', zh: '数据分析 - 专项认证' },
  'dea-c01': { en: 'Data Engineer Associate', ja: 'データエンジニア アソシエイト', zh: '数据工程师 - 助理' },
  'mla-c01': { en: 'Machine Learning Engineer Associate', ja: 'ML エンジニア アソシエイト', zh: '机器学习工程师 - 助理' },
  'mls-c01': { en: 'Machine Learning Specialty', ja: '機械学習 専門知識', zh: '机器学习 - 专项认证' },
  'scs-c02': { en: 'Security Specialty', ja: 'セキュリティ 専門知識', zh: '安全 - 专项认证' },
}

const CERT_LEVELS: Record<string, string> = {
  'saa-c03': 'Associate', 'sap-c02': 'Professional', 'clf-c02': 'Foundational',
  'dva-c02': 'Associate', 'soa-c02': 'Associate',    'dop-c02': 'Professional',
  'aif-c01': 'Foundational', 'ans-c01': 'Specialty', 'das-c01': 'Specialty',
  'dea-c01': 'Associate', 'mla-c01': 'Associate',    'mls-c01': 'Specialty',
  'scs-c02': 'Specialty',
}

const LEVEL_COLORS: Record<string, string> = {
  'Foundational': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Associate':    'bg-blue-100 text-blue-700 border-blue-200',
  'Professional': 'bg-purple-100 text-purple-700 border-purple-200',
  'Specialty':    'bg-orange-100 text-orange-700 border-orange-200',
}

const FREE_CHAPTERS: Record<string, number[]> = {
  'saa-c03': [1, 2, 3, 4, 5],
  'sap-c02': [1, 2, 3],
  'clf-c02': [1, 2, 3], 'dva-c02': [1, 2, 3], 'dop-c02': [1, 2, 3], 'aif-c01': [1, 2, 3],
  'soa-c02': [], 'ans-c01': [], 'dea-c01': [], 'mla-c01': [],
  'mls-c01': [], 'das-c01': [], 'scs-c02': [],
}

// Per-cert attractive SEO titles (3-language)
const CERT_SEO_TITLES: Record<string, { ja: string; en: string; zh: string }> = {
  'saa-c03': {
    ja: 'AWS SAA-C03 ソリューションアーキテクト アソシエイト — 1,389問 無料練習問題',
    en: 'AWS SAA-C03 Solutions Architect Associate — 1,389 Free Practice Questions',
    zh: 'AWS SAA-C03 解决方案架构师助理 — 1,389道免费练习题',
  },
  'sap-c02': {
    ja: 'AWS SAP-C02 ソリューションアーキテクト プロフェッショナル — 748問 練習問題',
    en: 'AWS SAP-C02 Solutions Architect Professional — 748 Practice Questions',
    zh: 'AWS SAP-C02 解决方案架构师专业级 — 748道练习题',
  },
  'clf-c02': {
    ja: 'AWS CLF-C02 クラウドプラクティショナー — 1,087問 無料練習問題',
    en: 'AWS CLF-C02 Cloud Practitioner — 1,087 Free Practice Questions',
    zh: 'AWS CLF-C02 云从业者 — 1,087道免费练习题',
  },
  'dva-c02': {
    ja: 'AWS DVA-C02 デベロッパー アソシエイト — 1,251問 無料練習問題',
    en: 'AWS DVA-C02 Developer Associate — 1,251 Free Practice Questions',
    zh: 'AWS DVA-C02 开发人员助理 — 1,251道免费练习题',
  },
  'soa-c02': {
    ja: 'AWS SOA-C02 SysOps アドミニストレーター — 469問 iOSアプリ全問学習',
    en: 'AWS SOA-C02 SysOps Administrator Associate — 469 Questions | Full Access on iOS',
    zh: 'AWS SOA-C02 SysOps 管理员助理 — 469道题目 | iOS应用全题解锁',
  },
  'dop-c02': {
    ja: 'AWS DOP-C02 DevOps エンジニア プロフェッショナル — 632問 練習問題',
    en: 'AWS DOP-C02 DevOps Engineer Professional — 632 Practice Questions',
    zh: 'AWS DOP-C02 DevOps 工程师专业级 — 632道练习题',
  },
  'aif-c01': {
    ja: 'AWS AIF-C01 AI プラクティショナー — 528問 練習問題',
    en: 'AWS AIF-C01 AI Practitioner — 528 Practice Questions',
    zh: 'AWS AIF-C01 AI 从业者 — 528道练习题',
  },
  'ans-c01': {
    ja: 'AWS ANS-C01 高度なネットワーキング 専門知識 — 289問 iOSアプリ全問学習',
    en: 'AWS ANS-C01 Advanced Networking Specialty — 289 Questions | iOS App',
    zh: 'AWS ANS-C01 高级网络专项认证 — 289道题目 | iOS应用全题解锁',
  },
  'dea-c01': {
    ja: 'AWS DEA-C01 データエンジニア アソシエイト — 240問 iOSアプリ全問学習',
    en: 'AWS DEA-C01 Data Engineer Associate — 240 Questions | iOS App',
    zh: 'AWS DEA-C01 数据工程师助理 — 240道题目 | iOS应用全题解锁',
  },
  'mla-c01': {
    ja: 'AWS MLA-C01 ML エンジニア アソシエイト — 91問 iOSアプリ全問学習',
    en: 'AWS MLA-C01 Machine Learning Engineer Associate — 91 Questions | iOS App',
    zh: 'AWS MLA-C01 机器学习工程师助理 — 91道题目 | iOS应用全题解锁',
  },
  'scs-c02': {
    ja: 'AWS SCS-C02 セキュリティ 専門知識 — 286問 iOSアプリ全問学習',
    en: 'AWS SCS-C02 Security Specialty — 286 Questions | iOS App',
    zh: 'AWS SCS-C02 安全专项认证 — 286道题目 | iOS应用全题解锁',
  },
}

usePageSEO(() => {
  const l = lang.value
  const titles = CERT_SEO_TITLES[certId]
  const title = titles?.[l] ?? `AWS ${certId.toUpperCase()} ${certName.value}`
  const total = certInfo.value?.total
  const hasFree = !certIsAppOnly(certId)
  let description = ''
  if (l === 'en') {
    description = total
      ? hasFree
        ? `${total.toLocaleString()} practice questions for the ${certId.toUpperCase()} exam. Free chapters available in the browser. Detailed explanations for every answer. Unlock all questions in the iOS app.`
        : `${total.toLocaleString()} practice questions for the ${certId.toUpperCase()} exam. Available exclusively in the iOS app with AI explanations, offline access, and progress tracking.`
      : `Practice questions for the ${certId.toUpperCase()} AWS certification exam.`
  } else if (l === 'zh') {
    description = total
      ? hasFree
        ? `${certId.toUpperCase()} 认证备考练习题共 ${total.toLocaleString()} 道，含免费章节，每题附详细解析。下载 iOS 应用解锁全部题目。`
        : `${certId.toUpperCase()} 认证备考练习题共 ${total.toLocaleString()} 道，仅限 iOS 应用，附 AI 解析、离线学习及进度追踪功能。`
      : `AWS ${certId.toUpperCase()} 认证考试练习题。`
  } else {
    description = total
      ? hasFree
        ? `${certId.toUpperCase()} 試験対策の練習問題 ${total.toLocaleString()} 問。無料チャプターでブラウザからすぐ解答・解説付きで学習。iOSアプリで全問挑戦できます。`
        : `${certId.toUpperCase()} 試験対策の練習問題 ${total.toLocaleString()} 問はiOSアプリ限定。AI解説・オフライン学習・進捗管理機能付き。`
      : `AWS ${certId.toUpperCase()} 認定試験の練習問題。`
  }
  return { title, description }
})

function isFreeChapter(cId: string, chapter: number): boolean {
  const list = FREE_CHAPTERS[cId]
  if (list === undefined) return false
  return list.includes(chapter)
}

function certIsAppOnly(cId: string): boolean {
  return (FREE_CHAPTERS[cId] ?? []).length === 0
}

// ─── State ────────────────────────────────────────────────────────────────────
const certInfo = ref<CertInfo | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const showDownloadPrompt = ref(false)

// ─── Computed ─────────────────────────────────────────────────────────────────
const certName = computed(() => {
  const display = CERT_DISPLAY[certId]
  if (!display) return certId.toUpperCase()
  return display[lang.value] ?? display.en
})

// ─── Chapter click ────────────────────────────────────────────────────────────
function handleChapterClick(chapter: number) {
  if (isFreeChapter(certId, chapter)) {
    router.push(`/cert/${certId}/chapter/${chapter}`)
  } else {
    showDownloadPrompt.value = true
    // Scroll to banner
    setTimeout(() => {
      document.querySelector('[data-download-banner]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 50)
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const certs = await fetchCerts()
    certInfo.value = certs.find(c => c.cert_id === certId) ?? null
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load certification'
  } finally {
    loading.value = false
  }
})
</script>
