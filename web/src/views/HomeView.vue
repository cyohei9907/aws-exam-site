<template>
  <!-- Hero -->
  <div class="bg-gradient-to-br from-slate-900 to-slate-700 text-white py-16 px-4 text-center">
    <h1 class="text-4xl sm:text-5xl font-bold mb-4">AWS 認定試験 無料練習</h1>
    <p class="text-lg sm:text-xl text-slate-300 mb-8">
      <template v-if="lang === 'ja'">13種類のAWS認定試験を無料で練習できます</template>
      <template v-else-if="lang === 'en'">Practice AWS certification exams for free</template>
      <template v-else>免费练习 AWS 认证考试</template>
    </p>
    <div class="flex flex-wrap justify-center gap-3">
      <span class="bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full">
        7,441{{ lang === 'zh' ? '题' : lang === 'en' ? ' questions' : '問収録' }}
      </span>
      <span class="bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full">
        13{{ lang === 'en' ? ' exams' : '試験対応' }}
      </span>
      <span class="bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full">
        {{ lang === 'en' ? '3 languages' : lang === 'zh' ? '3种语言' : '3言語対応' }}
      </span>
    </div>
  </div>

  <!-- Cert list -->
  <div class="max-w-7xl mx-auto px-4 py-12">
    <h2 class="text-2xl font-bold text-slate-800 mb-6">
      <template v-if="lang === 'ja'">試験を選択</template>
      <template v-else-if="lang === 'en'">Select Exam</template>
      <template v-else>选择考试</template>
    </h2>

    <!-- Error -->
    <div v-if="certError" class="text-red-500 text-center py-8">{{ certError }}</div>

    <!-- Skeleton while loading -->
    <div v-else-if="loadingCerts" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="n in 13"
        :key="n"
        class="rounded-xl border border-slate-200 bg-slate-50 p-4 animate-pulse h-36"
      />
    </div>

    <!-- Cert grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <Card
        v-for="certId in CERT_ORDER"
        :key="certId"
        class="hover:shadow-md hover:border-blue-300 cursor-pointer transition-all"
        @click="router.push('/cert/' + certId)"
      >
        <CardHeader class="pb-2">
          <div class="flex items-start justify-between gap-2">
            <span class="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wide">
              {{ certId }}
            </span>
            <span
              class="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
              :class="LEVEL_COLORS[CERT_LEVELS[certId]]"
            >
              {{ CERT_LEVELS[certId] }}
            </span>
          </div>
          <CardTitle class="text-base leading-snug mt-1">
            {{ CERT_DISPLAY[certId]?.[lang] ?? CERT_DISPLAY[certId]?.en }}
          </CardTitle>
        </CardHeader>
        <CardContent class="pt-0">
          <p class="text-sm text-slate-500">
            {{ certTotal(certId) !== null ? certTotal(certId) : '...' }}{{ lang === 'zh' ? '题' : lang === 'en' ? ' questions' : '問' }}
          </p>
        </CardContent>
      </Card>
    </div>
  </div>

  <AppDownloadBanner :show="true" />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { fetchCerts, type CertInfo } from '@/api/client'
import { useSettingsStore } from '@/stores/settings'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import AppDownloadBanner from '@/components/AppDownloadBanner.vue'

// ─── Store / Router ───────────────────────────────────────────────────────────
const router = useRouter()
const settings = useSettingsStore()
const lang = computed(() => settings.lang)

// ─── Static data ─────────────────────────────────────────────────────────────
const CERT_ORDER = [
  'saa-c03', 'sap-c02', 'clf-c02', 'dva-c02', 'soa-c02', 'dop-c02',
  'aif-c01', 'ans-c01', 'das-c01', 'dea-c01', 'mla-c01', 'mls-c01', 'scs-c02',
]

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
  'dva-c02': 'Associate', 'soa-c02': 'Associate', 'dop-c02': 'Professional',
  'aif-c01': 'Foundational', 'ans-c01': 'Specialty', 'das-c01': 'Specialty',
  'dea-c01': 'Associate', 'mla-c01': 'Associate', 'mls-c01': 'Specialty',
  'scs-c02': 'Specialty',
}

const LEVEL_COLORS: Record<string, string> = {
  'Foundational': 'bg-green-100 text-green-700',
  'Associate': 'bg-blue-100 text-blue-700',
  'Professional': 'bg-purple-100 text-purple-700',
  'Specialty': 'bg-orange-100 text-orange-700',
}

// ─── State ────────────────────────────────────────────────────────────────────
const certs = ref<CertInfo[]>([])
const loadingCerts = ref(true)
const certError = ref<string | null>(null)

// ─── Helpers ──────────────────────────────────────────────────────────────────
function certTotal(certId: string): number | null {
  const found = certs.value.find(c => c.cert_id === certId)
  return found ? found.total : null
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    certs.value = await fetchCerts()
  } catch (e: unknown) {
    certError.value = e instanceof Error ? e.message : 'Failed to load certifications'
  } finally {
    loadingCerts.value = false
  }
})
</script>
