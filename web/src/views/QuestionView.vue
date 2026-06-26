<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchChapter, type Question } from '@/api/client'
import { useSettingsStore } from '@/stores/settings'
import { Button } from '@/components/ui/button'

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()

const lang = computed(() => settingsStore.lang)
const certId = computed(() => route.params.certId as string)
const chapterId = computed(() => parseInt(route.params.chapterId as string))
const position = computed(() => parseInt(route.params.position as string))

const loading = ref(true)
const loadError = ref<string | null>(null)
const premiumRequired = ref(false)
const questions = ref<Question[]>([])
const showAnswer = ref(false)

const question = computed(() => questions.value[position.value - 1] ?? null)
const total = computed(() => questions.value.length)

const langPath = computed(() => lang.value === 'en' ? '' : `/${lang.value}`)
const chapterPath = computed(() => `${langPath.value}/cert/${certId.value}/chapter/${chapterId.value}`)
const prevPath = computed(() => `${langPath.value}/cert/${certId.value}/chapter/${chapterId.value}/question/${position.value - 1}`)
const nextPath = computed(() => `${langPath.value}/cert/${certId.value}/chapter/${chapterId.value}/question/${position.value + 1}`)

async function load() {
  loading.value = true
  loadError.value = null
  premiumRequired.value = false
  try {
    questions.value = await fetchChapter(certId.value, chapterId.value, lang.value)
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string }
    if (err?.code === 'premium_required') {
      premiumRequired.value = true
    } else {
      loadError.value = err?.message ?? 'Failed to load'
    }
  } finally {
    loading.value = false
  }
}

watch(lang, load)
watch(position, () => { showAnswer.value = false })
onMounted(load)
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
    </div>

    <div v-else-if="premiumRequired" class="text-center py-20 space-y-4">
      <p class="text-slate-600">
        {{ lang === 'en' ? 'This chapter is available in the iOS app.' : lang === 'zh' ? '此章节需下载 iOS 应用。' : 'このチャプターはiOSアプリで利用できます。' }}
      </p>
      <a href="https://apps.apple.com/app/id6773379862" target="_blank" rel="noopener"
        class="inline-block bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-700 transition-colors">
        Download iOS App
      </a>
    </div>

    <div v-else-if="loadError" class="text-center py-20 text-red-500">{{ loadError }}</div>

    <div v-else-if="!question" class="text-center py-20 text-slate-400">
      {{ lang === 'en' ? `Question ${position} not found.` : lang === 'zh' ? `第 ${position} 题不存在。` : `Q${position} は見つかりません。` }}
    </div>

    <template v-else>
      <!-- Breadcrumb -->
      <nav class="text-sm text-slate-500 mb-5 flex items-center gap-1.5 flex-wrap">
        <RouterLink :to="langPath + '/'" class="hover:text-blue-600 transition-colors">
          {{ lang === 'en' ? 'Home' : lang === 'zh' ? '主页' : 'ホーム' }}
        </RouterLink>
        <span>/</span>
        <RouterLink :to="`${langPath}/cert/${certId}`" class="hover:text-blue-600 transition-colors">
          {{ certId.toUpperCase() }}
        </RouterLink>
        <span>/</span>
        <RouterLink :to="chapterPath" class="hover:text-blue-600 transition-colors">
          Ch.{{ chapterId }}
        </RouterLink>
        <span>/</span>
        <span class="text-slate-700 font-medium">Q{{ position }}</span>
      </nav>

      <!-- Question card -->
      <div class="bg-white rounded-xl shadow-sm p-6 mb-4">
        <div class="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
          <span class="text-sm text-slate-500">
            {{ lang === 'en' ? `Question ${position} of ${total}` : lang === 'zh' ? `第 ${position} / ${total} 题` : `第 ${position} / ${total} 問` }}
          </span>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full"
            :class="question.type === 'multiple' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'">
            {{ question.type === 'multiple'
              ? (lang === 'en' ? 'Multi-select' : lang === 'zh' ? '多选' : '複数選択')
              : (lang === 'en' ? 'Single choice' : lang === 'zh' ? '单选' : '単一選択') }}
          </span>
        </div>

        <p class="text-base leading-relaxed text-slate-900 mb-6 whitespace-pre-wrap">{{ question.translation.stem }}</p>

        <ul class="space-y-2.5 mb-6">
          <li
            v-for="[key, text] in Object.entries(question.translation.options)"
            :key="key"
            class="flex items-start gap-3 p-3 rounded-lg border transition-colors"
            :class="showAnswer && question.correct_answers.includes(key)
              ? 'border-green-400 bg-green-50'
              : 'border-slate-200'"
          >
            <span class="font-mono font-bold text-slate-500 shrink-0 w-5 text-sm">{{ key }}</span>
            <span class="text-sm text-slate-800 flex-1 leading-relaxed">{{ text }}</span>
            <span v-if="showAnswer && question.correct_answers.includes(key)" class="shrink-0 text-green-600 font-bold">✓</span>
          </li>
        </ul>

        <Button v-if="!showAnswer" @click="showAnswer = true" class="w-full bg-blue-600 hover:bg-blue-700 text-white">
          {{ lang === 'en' ? 'Show Answer & Explanation' : lang === 'zh' ? '显示答案与解析' : '答えと解説を表示' }}
        </Button>

        <div v-else class="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-3">
          <p class="font-semibold text-amber-800 text-sm">
            {{ lang === 'en' ? 'Correct Answer' : lang === 'zh' ? '正确答案' : '正解' }}:
            {{ question.correct_answers.join(', ') }}
          </p>
          <div class="border-t border-amber-200 pt-3">
            <p class="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5">
              {{ lang === 'en' ? 'Explanation' : lang === 'zh' ? '解析' : '解説' }}
            </p>
            <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{{ question.translation.analysis }}</p>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex items-center gap-3">
        <Button variant="outline" class="flex-1" :disabled="position <= 1" @click="router.push(prevPath)">
          {{ lang === 'en' ? '← Prev' : lang === 'zh' ? '← 上题' : '← 前' }}
        </Button>
        <RouterLink :to="chapterPath" class="text-sm text-slate-500 hover:text-blue-600 transition-colors shrink-0">
          {{ lang === 'en' ? 'Chapter' : lang === 'zh' ? '章节' : '章一覧' }}
        </RouterLink>
        <Button class="flex-1" :disabled="total > 0 && position >= total" @click="router.push(nextPath)">
          {{ lang === 'en' ? 'Next →' : lang === 'zh' ? '下题 →' : '次 →' }}
        </Button>
      </div>
    </template>
  </div>
</template>
