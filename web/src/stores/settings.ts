import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Lang = 'ja' | 'en' | 'zh'

export const useSettingsStore = defineStore('settings', () => {
  const lang = ref<Lang>((localStorage.getItem('lang') as Lang) ?? 'ja')

  function setLang(newLang: Lang) {
    lang.value = newLang
    localStorage.setItem('lang', newLang)
  }

  return { lang, setLang }
})
