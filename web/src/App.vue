<script setup lang="ts">
import { onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'

// Remove the server-rendered question section once the SPA takes over.
// Googlebot indexes the SSR content from the initial HTML; real users see
// the interactive Vue UI instead.
onMounted(() => {
  document.getElementById('seo-questions')?.remove()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <AppHeader />
    <main class="flex-1">
      <RouterView />
    </main>
  </div>
</template>
