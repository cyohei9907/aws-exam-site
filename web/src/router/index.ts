import { createRouter, createWebHistory, RouterView } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import CertView from '@/views/CertView.vue'
import PracticeView from '@/views/PracticeView.vue'
import QuestionView from '@/views/QuestionView.vue'
import ResultView from '@/views/ResultView.vue'
import { useSettingsStore } from '@/stores/settings'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Language-prefixed routes (/ja/... and /zh/...)
    {
      path: '/:lang(ja|zh)',
      component: RouterView,
      children: [
        { path: '', component: HomeView },
        { path: 'cert/:certId', component: CertView },
        { path: 'cert/:certId/chapter/:chapterId', component: PracticeView },
        { path: 'cert/:certId/chapter/:chapterId/question/:position', component: QuestionView },
        { path: 'results', component: ResultView },
      ],
    },
    // English default routes (no prefix)
    { path: '/', component: HomeView },
    { path: '/practice', redirect: '/#certs' },
    { path: '/cert/:certId', component: CertView },
    { path: '/cert/:certId/chapter/:chapterId', component: PracticeView },
    { path: '/cert/:certId/chapter/:chapterId/question/:position', component: QuestionView },
    { path: '/results', component: ResultView },
  ],
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth', top: 72 }
    }
    return { top: 0 }
  },
})

// Sync URL lang prefix → settings store; auto-detect browser language on first visit
router.beforeEach((to) => {
  const settings = useSettingsStore()
  const langParam = to.params.lang as string | undefined

  if (langParam === 'ja' || langParam === 'zh') {
    if (settings.lang !== langParam) settings.setLang(langParam)
    return
  }

  // English (no prefix): auto-detect on first visit
  if (!localStorage.getItem('lang')) {
    const browserLang = navigator.language.split('-')[0]
    if (browserLang === 'ja' || browserLang === 'zh') {
      localStorage.setItem('lang', browserLang)
      const suffix = to.fullPath === '/' ? '' : to.fullPath
      return `/${browserLang}${suffix}`
    }
    localStorage.setItem('lang', 'en')
  }

  if (settings.lang !== 'en') settings.setLang('en')
})

export default router
