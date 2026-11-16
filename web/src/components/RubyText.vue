<script setup lang="ts">
import type { RubySeg } from '@/api/client'

// Renders text with optional furigana. `segs` (from the API) wins over `text`
// when present; tuples become <ruby>kanji<rt>reading</rt></ruby>.
defineProps<{ text: string; segs?: RubySeg[] }>()
</script>

<template>
  <span v-if="segs && segs.length" class="ruby-text leading-loose"><template v-for="(s, i) in segs" :key="i"><template v-if="typeof s === 'string'">{{ s }}</template><ruby v-else>{{ s[0] }}<rp>(</rp><rt>{{ s[1] }}</rt><rp>)</rp></ruby></template></span>
  <span v-else class="leading-relaxed">{{ text }}</span>
</template>

<style scoped>
.ruby-text ruby rt {
  font-size: 0.5em;
  color: rgb(100 116 139);
  font-weight: 400;
  user-select: none;
}
</style>
