<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'

const route = useRoute()
const settingsStore = useSettingsStore()

const CERT_NAMES: Record<string, string> = {
  'saa-c03': 'SAA-C03',
  'sap-c02': 'SAP-C02',
  'clf-c02': 'CLF-C02',
  'dva-c02': 'DVA-C02',
  'soa-c02': 'SOA-C02',
  'dop-c02': 'DOP-C02',
  'aif-c01': 'AIF-C01',
  'ans-c01': 'ANS-C01',
  'das-c01': 'DAS-C01',
  'dea-c01': 'DEA-C01',
  'mla-c01': 'MLA-C01',
  'mls-c01': 'MLS-C01',
  'scs-c02': 'SCS-C02',
}

const LANGS = ['ja', 'en', 'zh'] as const

const breadcrumb = computed(() => {
  const certId = route.params.certId as string | undefined
  const chapterId = route.params.chapterId as string | undefined

  if (!certId) return null

  const certName = CERT_NAMES[certId] ?? certId

  if (chapterId) {
    return `${certName} / Ch.${chapterId}`
  }
  return certName
})
</script>

<template>
  <header class="bg-slate-900 text-white shadow-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
      <!-- Logo -->
      <RouterLink to="/" class="flex items-center gap-2 font-bold text-lg shrink-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-6 h-6 text-blue-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        </svg>
        <span>AWS 認定試験 練習</span>
      </RouterLink>

      <!-- Nav / Breadcrumb (center) -->
      <nav class="hidden sm:flex items-center gap-6 text-sm mx-4 min-w-0">
        <RouterLink
          v-if="!breadcrumb"
          to="/#certs"
          class="text-slate-300 hover:text-white transition-colors font-medium"
        >
          {{ settingsStore.lang === 'en' ? 'Practice' : settingsStore.lang === 'zh' ? '练习' : '練習' }}
        </RouterLink>
        <a
          v-if="!breadcrumb"
          href="https://apps.apple.com/app/id[placeholder]"
          target="_blank"
          class="text-slate-300 hover:text-white transition-colors font-medium"
        >
          iOS App
        </a>
        <span v-if="breadcrumb" class="text-slate-300 truncate">{{ breadcrumb }}</span>
      </nav>

      <!-- Language switcher -->
      <div class="flex items-center gap-1 shrink-0">
        <button
          v-for="lang in LANGS"
          :key="lang"
          @click="settingsStore.setLang(lang)"
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
