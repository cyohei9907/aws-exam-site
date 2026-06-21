<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'

defineProps<{
  show: boolean
}>()

const settingsStore = useSettingsStore()
const lang = computed(() => settingsStore.lang as 'ja' | 'en' | 'zh')

const text = computed(() => ({
  ja: {
    title: 'もっと練習したいですか?',
    body: 'iOS App で全 7,441 問・13 種類の試験を無制限に練習できます。',
    cta: 'App Store からダウンロード',
    locked: 'この章はアプリ限定です。',
  },
  en: {
    title: 'Want more practice?',
    body: 'Practice all 7,441 questions across 13 AWS certifications with the iOS app.',
    cta: 'Download on the App Store',
    locked: 'This chapter requires the iOS app.',
  },
  zh: {
    title: '想要更多练习吗？',
    body: '通过 iOS App 练习全部 7,441 道题，涵盖 13 种 AWS 认证。',
    cta: '从 App Store 下载',
    locked: '此章节仅限应用内使用。',
  },
}[lang.value]))
</script>

<template>
  <div
    v-if="show"
    class="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-6 my-6"
  >
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h3 class="font-bold text-lg leading-tight">{{ text?.title }}</h3>
        <p class="text-blue-100 text-sm mt-1 leading-relaxed">{{ text?.body }}</p>
      </div>
      <a
        href="https://apps.apple.com/app/id6773379862"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 bg-white text-blue-900 font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-colors mt-3 sm:mt-0 shrink-0"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          viewBox="0 0 814 1000"
          fill="currentColor"
        >
          <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 376.8 1.5 256.8 1.5 186.2c0-32.7 5.8-65.4 17.5-97.5 29.5-79.9 104.4-137.5 187.6-137.5 56.6 0 105.6 36.6 141.9 36.6 34.7 0 89.9-38.9 155.5-38.9 31.6 0 117.2 1.3 177.1 82.4zm-188.7-166.3c-13.7 59.1-44.5 106.5-74.9 131.9-30.4 25.4-71.8 45-111.8 45-1.3 0-2.6 0-3.9-.1-1.3-55.9 19.2-112.1 50.2-151.9 30.4-38.9 77.1-72.9 140.6-87.1 1.3 20.8-.2 42.2-0.2 62.2z" />
        </svg>
        {{ text?.cta }}
      </a>
    </div>
  </div>
</template>
