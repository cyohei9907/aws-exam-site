<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { fetchCerts, type CertInfo } from '@/api/client'
import { useSettingsStore } from '@/stores/settings'
import { usePageSEO } from '@/composables/usePageSEO'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen, Award, Globe, Zap, CheckCircle, Lock, Download,
  ChevronRight, BarChart3, Smartphone,
} from 'lucide-vue-next'
import CertBadge from '@/components/CertBadge.vue'

const router = useRouter()
const settings = useSettingsStore()
const lang = computed(() => settings.lang)

// ─── i18n ────────────────────────────────────────────────────────────────────
const t = computed(() => ({
  hero_title:     { ja: 'AWS認定試験を無料で練習', en: 'Free AWS Certification Practice', zh: '免费 AWS 认证备考练习' }[lang.value],
  hero_sub:       { ja: '7,441問以上・13種の認定資格・3言語対応。ブラウザですぐに始められます。', en: 'Over 7,441 questions across 13 AWS certifications in 3 languages. Start right in your browser.', zh: '超过 7,441 题，覆盖 13 种 AWS 认证，支持 3 种语言。直接在浏览器中开始练习。' }[lang.value],
  hero_cta:       { ja: '無料で練習を始める', en: 'Start Free Practice', zh: '免费开始练习' }[lang.value],
  hero_app:       { ja: 'iOS アプリを見る', en: 'View iOS App', zh: '查看 iOS 应用' }[lang.value],
  stats_q:        { ja: '収録問題数', en: 'Questions', zh: '题目总数' }[lang.value],
  stats_cert:     { ja: '対応認定資格', en: 'Certifications', zh: '认证种类' }[lang.value],
  stats_lang:     { ja: '対応言語', en: 'Languages', zh: '支持语言' }[lang.value],
  stats_free:     { ja: '無料公開中', en: 'Free Access', zh: '免费开放' }[lang.value],
  feat_title:     { ja: 'このサービスの特徴', en: 'Why Use This Service', zh: '服务特点' }[lang.value],
  feat1_t:        { ja: '豊富な問題数', en: 'Rich Question Bank', zh: '丰富题库' }[lang.value],
  feat1_d:        { ja: '各認定試験の過去問を厳選。本番に近い形式で出題されます。', en: 'Carefully curated questions for each exam, presented in a format close to the real test.', zh: '精选各认证考试真题，以接近真实考试的格式出题。' }[lang.value],
  feat2_t:        { ja: '詳細な解説', en: 'Detailed Explanations', zh: '详细解析' }[lang.value],
  feat2_d:        { ja: '正解・不正解に関わらず、全問に解説付き。苦手分野を素早く把握できます。', en: 'Every question includes an explanation. Identify your weak areas quickly.', zh: '每道题均附有解析，无论正误，帮助快速识别薄弱环节。' }[lang.value],
  feat3_t:        { ja: '多言語サポート', en: 'Multilingual Support', zh: '多语言支持' }[lang.value],
  feat3_d:        { ja: '日本語・英語・中国語に対応。母国語で学習することで理解が深まります。', en: 'Japanese, English, and Chinese supported. Learn in your native language for deeper understanding.', zh: '支持日语、英语、中文。用母语学习，加深理解。' }[lang.value],
  feat4_t:        { ja: 'スマホアプリでさらに学習', en: 'More with iOS App', zh: 'iOS 应用深度学习' }[lang.value],
  feat4_d:        { ja: 'iOSアプリでは全問題・AI解説・オフライン学習など上位機能が使えます。', en: 'The iOS app unlocks all questions, AI explanations, offline access, and more.', zh: 'iOS 应用解锁全部题目、AI 解析、离线学习等高级功能。' }[lang.value],
  how_title:      { ja: '使い方', en: 'How It Works', zh: '使用流程' }[lang.value],
  how1_t:         { ja: '認定を選ぶ', en: 'Pick a Certification', zh: '选择认证' }[lang.value],
  how1_d:         { ja: '13種の認定資格から目標の試験を選択します。', en: 'Choose your target exam from 13 AWS certifications.', zh: '从 13 种 AWS 认证中选择目标考试。' }[lang.value],
  how2_t:         { ja: '無料章で練習', en: 'Practice Free Chapters', zh: '练习免费章节' }[lang.value],
  how2_d:         { ja: 'ブラウザ上で無料チャプターの問題を解き、解説で実力を伸ばします。', en: 'Solve free chapter questions in the browser and learn from explanations.', zh: '在浏览器中解答免费章节题目，通过解析提升实力。' }[lang.value],
  how3_t:         { ja: 'アプリで全問挑戦', en: 'Unlock All in the App', zh: '应用解锁全题' }[lang.value],
  how3_d:         { ja: 'より多くの問題を解くにはiOSアプリをダウンロード。AI解説も利用できます。', en: 'Download the iOS app to access all questions and AI-powered explanations.', zh: '下载 iOS 应用以获取全部题目和 AI 解析功能。' }[lang.value],
  cert_title:     { ja: '対応認定資格一覧', en: 'Supported Certifications', zh: '支持的认证列表' }[lang.value],
  cert_q:         { ja: '問', en: 'q', zh: '题' }[lang.value],
  cert_free:      { ja: '無料あり', en: 'Free tiers', zh: '含免费题' }[lang.value],
  cert_start:     { ja: '練習を始める', en: 'Start Practice', zh: '开始练习' }[lang.value],
  app_title:      { ja: 'iOSアプリで本格学習', en: 'Level Up with the iOS App', zh: 'iOS 应用深度学习' }[lang.value],
  app_sub:        { ja: 'ウェブ版では一部の問題を無料公開しています。全問題・AI解説・オフライン学習などの全機能はiOSアプリでご利用ください。', en: 'The web version offers free access to select questions. Get all questions, AI explanations, offline access and more in the iOS app.', zh: '网页版免费开放部分题目。iOS 应用提供全部题目、AI 解析、离线学习等完整功能。' }[lang.value],
  app_dl:         { ja: 'App Store からダウンロード', en: 'Download on the App Store', zh: '从 App Store 下载' }[lang.value],
  app_f1:         { ja: '全7,441問以上', en: 'All 7,441+ questions', zh: '全部 7,441+ 题' }[lang.value],
  app_f2:         { ja: 'AI による日本語解説', en: 'AI-powered explanations', zh: 'AI 智能解析' }[lang.value],
  app_f3:         { ja: 'オフライン学習対応', en: 'Offline access', zh: '离线学习支持' }[lang.value],
  app_f4:         { ja: '学習進捗トラッキング', en: 'Progress tracking', zh: '学习进度追踪' }[lang.value],
  app_f5:         { ja: 'ブックマーク・間隔復習', en: 'Bookmarks & spaced repetition', zh: '收藏与间隔重复' }[lang.value],
  app_f6:         { ja: '模擬試験モード (65問)', en: 'Mock exam mode (65 questions)', zh: '模拟考试模式 (65题)' }[lang.value],
  free_label:     { ja: '無料', en: 'Free', zh: '免费' }[lang.value],
  locked_label:   { ja: 'アプリ限定', en: 'App only', zh: '应用专属' }[lang.value],
}))

// ─── Static data ─────────────────────────────────────────────────────────────
// Preferred display order. Certs not returned by the API are silently skipped.
const PREFERRED_ORDER = [
  'saa-c03', 'sap-c02', 'clf-c02', 'dva-c02', 'soa-c02', 'dop-c02',
  'aif-c01', 'ans-c01', 'das-c01', 'dea-c01', 'mla-c01', 'mls-c01', 'scs-c02',
]

const CERT_DISPLAY: Record<string, Record<string, string>> = {
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
  'dva-c02': 'Associate', 'soa-c02': 'Associate', 'dop-c02': 'Professional',
  'aif-c01': 'Foundational', 'ans-c01': 'Specialty', 'das-c01': 'Specialty',
  'dea-c01': 'Associate', 'mla-c01': 'Associate', 'mls-c01': 'Specialty',
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

usePageSEO(() => {
  const l = lang.value
  return {
    title: l === 'en'
      ? 'Free AWS Certification Practice | 7,000+ Questions · 11 Exam Types'
      : l === 'zh'
      ? 'AWS 认证考试免费练习题库 | 7,000+题 · 11种认证'
      : 'AWS認定試験 無料練習問題集 | SAA・CLF・DVAなど11種類対応',
    description: l === 'en'
      ? 'Practice for AWS certifications with 7,000+ questions across 11 exam types (SAA-C03, CLF-C02, DVA-C02 and more). Free chapters available. Japanese, English, and Chinese supported.'
      : l === 'zh'
      ? 'AWS认证练习题库，覆盖SAA-C03、CLF-C02、DVA-C02等11种认证，共7,000+题，支持日语、英语、中文，含免费章节，iOS应用解锁全题+AI解析。'
      : 'AWS認定試験11種の練習問題集。SAA-C03・CLF-C02・DVA-C02など7,000問以上。無料チャプターをブラウザで今すぐ解答・解説付き。iOSアプリで全問+AI解説。',
  }
})
function isAppOnly(certId: string): boolean {
  return (FREE_CHAPTERS[certId] ?? []).length === 0
}
function freeChapterCount(certId: string): number {
  return (FREE_CHAPTERS[certId] ?? []).length
}

// ─── State ────────────────────────────────────────────────────────────────────
const certs = ref<CertInfo[]>([])
const loadingCerts = ref(true)

// Only show certs that actually have data in the API, in preferred order
const orderedCerts = computed(() => {
  const available = new Set(certs.value.map(c => c.cert_id))
  return PREFERRED_ORDER.filter(id => available.has(id))
})

function certTotal(certId: string): number | null {
  return certs.value.find(c => c.cert_id === certId)?.total ?? null
}

function scrollToCerts() {
  document.getElementById('certs')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// App-only download modal
const downloadModalCert = ref<string | null>(null)

function handleCertClick(certId: string) {
  if (isAppOnly(certId)) {
    downloadModalCert.value = certId
  } else {
    router.push('/cert/' + certId)
  }
}

onMounted(async () => {
  try { certs.value = await fetchCerts() } catch { /* silently ignore */ }
  finally { loadingCerts.value = false }
})
</script>

<template>
  <!-- ═══ HERO ═══════════════════════════════════════════════════════════════ -->
  <section class="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white">
    <!-- grid pattern overlay -->
    <div class="absolute inset-0 opacity-10"
      style="background-image: linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px);background-size:40px 40px" />

    <div class="relative max-w-5xl mx-auto px-6 py-24 text-center">
      <!-- badge -->
      <span class="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-sm text-white/90 px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
        <Award :size="14" />
        AWS Certification Practice
      </span>

      <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
        {{ t.hero_title }}
      </h1>
      <p class="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
        {{ t.hero_sub }}
      </p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button
          size="lg"
          class="bg-[#FF9900] hover:bg-[#e88a00] text-slate-900 font-bold px-8 text-base h-12 shadow-lg"
          @click="scrollToCerts"
        >
          {{ t.hero_cta }} <ChevronRight :size="18" class="ml-1" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          class="border-white/40 text-white bg-white/10 hover:bg-white/20 font-semibold px-8 text-base h-12"
          as="a"
          href="https://apps.apple.com/app/id6773379862"
          target="_blank"
        >
          <Smartphone :size="16" class="mr-2" />{{ t.hero_app }}
        </Button>
      </div>
    </div>
  </section>

  <!-- ═══ STATS BAR ══════════════════════════════════════════════════════════ -->
  <section class="bg-white border-b border-slate-100">
    <div class="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
      <div>
        <div class="text-3xl font-extrabold text-slate-900">7,441+</div>
        <div class="text-sm text-slate-500 mt-1">{{ t.stats_q }}</div>
      </div>
      <div>
        <div class="text-3xl font-extrabold text-slate-900">{{ orderedCerts.length }}</div>
        <div class="text-sm text-slate-500 mt-1">{{ t.stats_cert }}</div>
      </div>
      <div>
        <div class="text-3xl font-extrabold text-slate-900">3</div>
        <div class="text-sm text-slate-500 mt-1">{{ t.stats_lang }}</div>
      </div>
      <div>
        <div class="text-3xl font-extrabold text-emerald-600">{{ lang === 'zh' ? '免费' : lang === 'en' ? 'Free' : '無料' }}</div>
        <div class="text-sm text-slate-500 mt-1">{{ t.stats_free }}</div>
      </div>
    </div>
  </section>

  <!-- ═══ FEATURES ═══════════════════════════════════════════════════════════ -->
  <section class="bg-slate-50 py-20 px-6">
    <div class="max-w-5xl mx-auto">
      <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-12">
        {{ t.feat_title }}
      </h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="(feat, i) in [
          { icon: BookOpen,    color: 'text-blue-600',   bg: 'bg-blue-50',   title: t.feat1_t, desc: t.feat1_d },
          { icon: BarChart3,   color: 'text-emerald-600', bg: 'bg-emerald-50', title: t.feat2_t, desc: t.feat2_d },
          { icon: Globe,       color: 'text-purple-600', bg: 'bg-purple-50', title: t.feat3_t, desc: t.feat3_d },
          { icon: Smartphone,  color: 'text-orange-600', bg: 'bg-orange-50', title: t.feat4_t, desc: t.feat4_d },
        ]" :key="i" class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-3">
          <div :class="['w-11 h-11 rounded-xl flex items-center justify-center', feat.bg]">
            <component :is="feat.icon" :size="22" :class="feat.color" />
          </div>
          <div class="font-semibold text-slate-800">{{ feat.title }}</div>
          <div class="text-sm text-slate-500 leading-relaxed">{{ feat.desc }}</div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ HOW IT WORKS ═══════════════════════════════════════════════════════ -->
  <section class="bg-white py-20 px-6">
    <div class="max-w-5xl mx-auto">
      <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-12">
        {{ t.how_title }}
      </h2>
      <div class="relative flex flex-col lg:flex-row gap-0 lg:gap-0">
        <!-- connector line (desktop only) -->
        <div class="hidden lg:block absolute top-10 left-[calc(16.67%+1px)] right-[calc(16.67%+1px)] h-0.5 bg-slate-200 z-0" />

        <div v-for="(step, i) in [
          { n: '1', icon: Award,        title: t.how1_t, desc: t.how1_d },
          { n: '2', icon: CheckCircle,  title: t.how2_t, desc: t.how2_d },
          { n: '3', icon: Download,     title: t.how3_t, desc: t.how3_d },
        ]" :key="i" class="relative z-10 flex-1 flex flex-col items-center text-center px-6 pb-10 lg:pb-0">
          <div class="w-20 h-20 rounded-full bg-slate-900 text-white flex flex-col items-center justify-center mb-4 shadow-lg">
            <component :is="step.icon" :size="28" />
          </div>
          <div class="font-bold text-slate-800 text-lg mb-2">{{ step.title }}</div>
          <div class="text-sm text-slate-500 leading-relaxed max-w-xs">{{ step.desc }}</div>
          <!-- mobile connector arrow -->
          <div v-if="i < 2" class="lg:hidden text-slate-300 text-2xl mt-4">↓</div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ CERT LIST ══════════════════════════════════════════════════════════ -->
  <section id="certs" class="bg-slate-50 py-20 px-6">
    <div class="max-w-5xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <h2 class="text-2xl sm:text-3xl font-bold text-slate-900">{{ t.cert_title }}</h2>
        <Button variant="outline" class="self-start sm:self-auto" @click="scrollToCerts">
          {{ t.cert_start }} <ChevronRight :size="16" class="ml-1" />
        </Button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loadingCerts" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="n in 13" :key="n"
          class="h-36 rounded-2xl bg-slate-200 animate-pulse" />
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="certId in orderedCerts"
          :key="certId"
          class="group bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md cursor-pointer transition-all flex flex-col gap-3"
          :class="isAppOnly(certId) ? 'hover:border-slate-200' : 'hover:border-blue-200'"
          @click="handleCertClick(certId)"
        >
          <!-- Badge + cert ID row -->
          <div class="flex items-center gap-3">
            <CertBadge
              :cert-id="certId"
              :level="(CERT_LEVELS[certId] as any)"
              :size="56"
              class="shrink-0 drop-shadow"
            />
            <div class="min-w-0">
              <span class="text-[11px] font-mono font-bold text-slate-400 tracking-widest uppercase block">
                {{ certId.toUpperCase() }}
              </span>
              <div class="font-semibold text-slate-800 leading-snug group-hover:text-blue-700 transition-colors text-sm mt-0.5">
                {{ CERT_DISPLAY[certId]?.[lang] ?? CERT_DISPLAY[certId]?.en }}
              </div>
            </div>
          </div>

          <!-- Stats row -->
          <div class="flex items-center justify-between text-xs border-t border-slate-50 pt-2">
            <span class="text-slate-400">
              {{ certTotal(certId)?.toLocaleString() ?? '—' }} {{ t.cert_q }}
            </span>
            <span
              v-if="freeChapterCount(certId) > 0"
              class="flex items-center gap-1 text-emerald-600 font-semibold"
            >
              <CheckCircle :size="12" />
              {{ freeChapterCount(certId) }} {{ t.cert_free }}
            </span>
            <span v-else class="flex items-center gap-1 text-slate-400 font-medium">
              <Lock :size="12" />
              {{ t.locked_label }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ APP PROMO ══════════════════════════════════════════════════════════ -->
  <section class="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-20 px-6 overflow-hidden">
    <div class="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">

      <!-- Left: text -->
      <div class="flex-1 min-w-0">
        <span class="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-sm px-3 py-1 rounded-full mb-6">
          <Zap :size="13" /> iOS App
        </span>
        <h2 class="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
          {{ t.app_title }}
        </h2>
        <p class="text-slate-300 text-base leading-relaxed mb-8">
          {{ t.app_sub }}
        </p>

        <ul class="space-y-3 mb-10">
          <li v-for="f in [t.app_f1, t.app_f2, t.app_f3, t.app_f4, t.app_f5, t.app_f6]"
            :key="f" class="flex items-center gap-2.5 text-sm text-slate-200"
          >
            <CheckCircle :size="16" class="text-emerald-400 shrink-0" />
            {{ f }}
          </li>
        </ul>

        <a
          href="https://apps.apple.com/app/id6773379862"
          target="_blank"
          class="inline-flex items-center gap-3 bg-white text-slate-900 font-semibold px-6 py-3.5 rounded-xl hover:bg-slate-100 transition-colors shadow-lg"
        >
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <div class="text-left leading-tight">
            <div class="text-xs opacity-70">{{ lang === 'ja' ? 'ダウンロード' : lang === 'zh' ? '下载于' : 'Download on the' }}</div>
            <div class="text-base font-bold">App Store</div>
          </div>
        </a>
      </div>

      <!-- Right: real app screenshots -->
      <div class="flex gap-3 overflow-x-auto pb-2 shrink-0 snap-x snap-mandatory">
        <img
          v-for="n in [1,2,3,4]"
          :key="n"
          :src="`/screenshots/screen${n}.png`"
          :alt="`App screenshot ${n}`"
          class="h-72 sm:h-80 w-auto rounded-2xl shadow-2xl object-cover shrink-0 snap-start select-none"
          draggable="false"
        />
      </div>
    </div>
  </section>

  <!-- ═══ APP-ONLY DOWNLOAD MODAL ══════════════════════════════════════════════ -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="downloadModalCert"
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        @click.self="downloadModalCert = null"
      >
        <div class="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
          <!-- Cert identity -->
          <div class="flex items-center gap-4 mb-5">
            <CertBadge
              :cert-id="downloadModalCert"
              :level="(CERT_LEVELS[downloadModalCert] as any)"
              :size="60"
              class="shrink-0"
            />
            <div>
              <p class="text-xs font-mono text-slate-400 tracking-widest uppercase">
                {{ downloadModalCert.toUpperCase() }}
              </p>
              <p class="font-bold text-slate-900 text-sm leading-snug mt-0.5">
                {{ CERT_DISPLAY[downloadModalCert]?.[lang] ?? CERT_DISPLAY[downloadModalCert]?.en }}
              </p>
            </div>
          </div>

          <!-- Lock message -->
          <div class="flex items-start gap-3 bg-slate-50 rounded-xl p-4 mb-6">
            <Lock :size="18" class="text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p class="font-semibold text-slate-800 text-sm">
                {{ lang === 'ja' ? 'iOSアプリ限定' : lang === 'zh' ? '仅限 iOS 应用' : 'iOS App Only' }}
              </p>
              <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                {{ lang === 'ja'
                  ? 'この認定の問題数が少ないため、ウェブでの無料公開は行っていません。iOSアプリからすべての問題を練習できます。'
                  : lang === 'zh'
                  ? '该认证题目较少，不在网页端免费开放。请下载 iOS 应用练习全部题目。'
                  : 'This certification has fewer questions and is not available for free on the web. Download the iOS app to practice all questions.' }}
              </p>
            </div>
          </div>

          <!-- App Store button -->
          <a
            href="https://apps.apple.com/app/id6773379862"
            target="_blank"
            class="flex items-center justify-center gap-3 bg-slate-900 text-white font-semibold px-5 py-3 rounded-xl hover:bg-slate-800 transition-colors w-full mb-3"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            {{ lang === 'ja' ? 'App Store からダウンロード' : lang === 'zh' ? '从 App Store 下载' : 'Download on the App Store' }}
          </a>
          <button
            @click="downloadModalCert = null"
            class="w-full text-sm text-slate-400 hover:text-slate-600 py-2 transition-colors"
          >
            {{ lang === 'ja' ? '閉じる' : lang === 'zh' ? '关闭' : 'Close' }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ═══ FOOTER ═══════════════════════════════════════════════════════════════ -->
  <footer class="bg-slate-900 border-t border-slate-800 py-10 px-6">
    <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2.5">
        <img src="/app-icon.png" class="w-7 h-7 rounded-lg" alt="" />
        <span class="text-white font-semibold text-sm">AWS 認定試験 練習</span>
      </div>
      <p class="text-slate-500 text-sm">© 2026 <a href="https://cyohei.net" target="_blank" class="hover:text-slate-300 transition-colors">cyohei.net</a></p>
    </div>
  </footer>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.18s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
