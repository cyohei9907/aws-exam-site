<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()

// Header search — routes to the search page on submit.
const searchTerm = ref('')
const searchPlaceholder = computed(() => ({
  ja: '問題をキーワード検索…',
  en: 'Search questions…',
  zh: '搜索题目…',
}[settingsStore.lang]))

function submitSearch() {
  const q = searchTerm.value.trim()
  if (q.length < 2) return
  const prefix = settingsStore.lang === 'en' ? '' : `/${settingsStore.lang}`
  router.push(`${prefix}/search?q=${encodeURIComponent(q)}`)
}

const CERT_NAMES: Record<string, string> = {
  'saa-c03': 'SAA-C03', 'sap-c02': 'SAP-C02', 'clf-c02': 'CLF-C02',
  'dva-c02': 'DVA-C02', 'soa-c02': 'SOA-C02', 'dop-c02': 'DOP-C02',
  'aif-c01': 'AIF-C01', 'ans-c01': 'ANS-C01', 'das-c01': 'DAS-C01',
  'dea-c01': 'DEA-C01', 'mla-c01': 'MLA-C01', 'mls-c01': 'MLS-C01',
  'scs-c02': 'SCS-C02',
}

const breadcrumb = computed(() => {
  const certId = route.params.certId as string | undefined
  const chapterId = route.params.chapterId as string | undefined
  if (!certId) return null
  const certName = CERT_NAMES[certId] ?? certId
  return chapterId ? `${certName} / Ch.${chapterId}` : certName
})

const siteTitle = computed(() => ({
  ja: 'AWS 認定試験 練習',
  en: 'AWS Exam Practice',
  zh: 'AWS 认证备考',
}[settingsStore.lang]))

const homeLink = computed(() => {
  const lang = settingsStore.lang
  return lang === 'en' ? '/' : `/${lang}/`
})
</script>

<template>
  <header class="bg-slate-900 text-white shadow-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
      <!-- Logo -->
      <RouterLink :to="homeLink" class="flex items-center gap-2 font-bold text-lg shrink-0">
        <img src="/app-icon.png" class="w-7 h-7 rounded-lg" alt="" />
        <span>{{ siteTitle }}</span>
      </RouterLink>

      <!-- Breadcrumb (only on practice pages) -->
      <nav v-if="breadcrumb" class="flex items-center text-sm mx-4 min-w-0">
        <span class="text-slate-300 truncate">{{ breadcrumb }}</span>
      </nav>

      <!-- Search (persistent) -->
      <form class="relative ml-auto w-40 sm:w-64 shrink-0" role="search" @submit.prevent="submitSearch">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          v-model="searchTerm"
          type="search"
          :placeholder="searchPlaceholder"
          :aria-label="searchPlaceholder"
          class="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm placeholder-slate-400 border border-slate-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
        />
      </form>
    </div>
  </header>
</template>
