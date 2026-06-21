<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSettingsStore, type Lang } from '@/stores/settings'

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()

const CERT_NAMES: Record<string, string> = {
  'saa-c03': 'SAA-C03', 'sap-c02': 'SAP-C02', 'clf-c02': 'CLF-C02',
  'dva-c02': 'DVA-C02', 'soa-c02': 'SOA-C02', 'dop-c02': 'DOP-C02',
  'aif-c01': 'AIF-C01', 'ans-c01': 'ANS-C01', 'das-c01': 'DAS-C01',
  'dea-c01': 'DEA-C01', 'mla-c01': 'MLA-C01', 'mls-c01': 'MLS-C01',
  'scs-c02': 'SCS-C02',
}

const LANGS = ['ja', 'en', 'zh'] as const

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

// Home link target: /ja/ or /zh/ or / depending on current language
const homeLink = computed(() => {
  const lang = settingsStore.lang
  return lang === 'en' ? '/' : `/${lang}/`
})

function switchLang(newLang: Lang) {
  settingsStore.setLang(newLang)
  const currentLang = route.params.lang as string | undefined
  const currentPath = route.fullPath

  let newPath: string
  if (currentLang) {
    const prefix = `/${currentLang}`
    const rest = currentPath.startsWith(prefix) ? currentPath.slice(prefix.length) || '/' : currentPath
    newPath = newLang === 'en' ? rest : `/${newLang}${rest === '/' ? '' : rest}`
  } else {
    newPath = newLang === 'en' ? currentPath : `/${newLang}${currentPath === '/' ? '' : currentPath}`
  }

  router.push(newPath)
}
</script>

<template>
  <header class="bg-slate-900 text-white shadow-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
      <!-- Logo -->
      <RouterLink :to="homeLink" class="flex items-center gap-2 font-bold text-lg shrink-0">
        <img src="/app-icon.png" class="w-7 h-7 rounded-lg" alt="" />
        <span>{{ siteTitle }}</span>
      </RouterLink>

      <!-- Breadcrumb (center, only on practice pages) -->
      <nav v-if="breadcrumb" class="hidden sm:flex items-center text-sm mx-4 min-w-0">
        <span class="text-slate-300 truncate">{{ breadcrumb }}</span>
      </nav>

      <!-- Language switcher -->
      <div class="flex items-center gap-1 shrink-0">
        <button
          v-for="lang in LANGS"
          :key="lang"
          @click="switchLang(lang)"
          class="px-2.5 py-1 rounded text-xs font-semibold transition-colors uppercase"
          :class="
            settingsStore.lang === lang
              ? 'bg-white text-slate-900'
              : 'text-slate-300 hover:text-white'
          "
        >
          {{ lang }}
        </button>
      </div>
    </div>
  </header>
</template>
