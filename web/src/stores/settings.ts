import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Lang = 'ja' | 'en' | 'zh'

export const useSettingsStore = defineStore('settings', () => {
  const lang = ref<Lang>((localStorage.getItem('lang') as Lang) ?? 'en')

  // Show hiragana readings above kanji in Japanese mode (default on)
  const furigana = ref<boolean>(localStorage.getItem('furigana') !== '0')

  function setFurigana(on: boolean) {
    furigana.value = on
    localStorage.setItem('furigana', on ? '1' : '0')
  }

  function setLang(newLang: Lang) {
    lang.value = newLang
    localStorage.setItem('lang', newLang)
  }

  return { lang, setLang, furigana, setFurigana }
})
