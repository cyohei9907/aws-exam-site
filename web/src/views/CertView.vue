<template>
  <div class="max-w-7xl mx-auto px-4 py-8">

    <!-- Breadcrumb -->
    <nav class="text-sm text-slate-500 mb-6 flex items-center gap-1.5">
      <button class="hover:text-slate-800 transition-colors" @click="router.push('/')">
        {{ lang === 'en' ? 'Home' : lang === 'zh' ? '主页' : 'ホーム' }}
      </button>
      <span>/</span>
      <span class="text-slate-800 font-medium">
        {{ certName }}
      </span>
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
      <div class="mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900">{{ certName }}</h1>
        <p class="text-slate-500 mt-1">
          {{ certInfo.total }}{{ lang === 'zh' ? '道题' : lang === 'en' ? ' questions' : '問の問題' }}
        </p>
      </div>

      <!-- Chapter section title -->
      <h2 class="text-lg font-semibold text-slate-700 mb-4">
        {{ lang === 'en' ? 'Select Chapter' : lang === 'zh' ? '选择章节' : '章を選択' }}
      </h2>

      <!-- Chapter grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div
          v-for="ch in certInfo.chapters"
          :key="ch.chapter"
          class="rounded-xl border p-4 flex flex-col gap-2 transition-all"
          :class="isFreeChapter(certId, ch.chapter)
            ? 'border-slate-200 bg-white cursor-pointer hover:shadow-md hover:border-blue-300'
            : 'border-slate-100 bg-slate-50 cursor-default opacity-70'"
          @click="isFreeChapter(certId, ch.chapter) && router.push(`/cert/${certId}/chapter/${ch.chapter}`)"
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
            <span
              v-else
              class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full"
            >
              🔒 {{ lang === 'en' ? 'App only' : lang === 'zh' ? '仅限APP' : 'アプリ限定' }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>

  <AppDownloadBanner :show="true" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { fetchCerts, type CertInfo } from '@/api/client'
import { useSettingsStore } from '@/stores/settings'
import AppDownloadBanner from '@/components/AppDownloadBanner.vue'

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

const FREE_CHAPTERS: Record<string, number[]> = {
  'saa-c03': [1, 2, 3, 4, 5, 6, 7, 8],
  'sap-c02': [1, 2, 3],
}

function isFreeChapter(cId: string, chapter: number): boolean {
  const list = FREE_CHAPTERS[cId]
  if (list) return list.includes(chapter)
  return chapter === 1
}

// ─── State ────────────────────────────────────────────────────────────────────
const certInfo = ref<CertInfo | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// ─── Computed ─────────────────────────────────────────────────────────────────
const certName = computed(() => {
  const display = CERT_DISPLAY[certId]
  if (!display) return certId.toUpperCase()
  return display[lang.value] ?? display.en
})

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
