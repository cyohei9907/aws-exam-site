import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import CertView from '@/views/CertView.vue'
import PracticeView from '@/views/PracticeView.vue'
import ResultView from '@/views/ResultView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/practice', redirect: '/#certs' },
    { path: '/cert/:certId', component: CertView },
    { path: '/cert/:certId/chapter/:chapterId', component: PracticeView },
    { path: '/results', component: ResultView },
  ],
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth', top: 72 }
    }
    return { top: 0 }
  },
})

export default router
