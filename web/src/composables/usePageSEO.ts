import { watchEffect, onUnmounted } from 'vue'

interface SEOMeta {
  title: string
  description: string
}

function upsertMeta(attr: string, val: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${val}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, val)
    document.head.appendChild(el)
  }
  el.content = content
}

export function usePageSEO(getMeta: () => SEOMeta) {
  const stop = watchEffect(() => {
    const { title, description } = getMeta()
    document.title = title
    upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
  })
  onUnmounted(stop)
}
