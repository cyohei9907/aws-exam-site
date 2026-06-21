<script setup lang="ts">
import { computed } from 'vue'
import { ProgressRoot, ProgressIndicator } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  modelValue?: number
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
})

const indicatorStyle = computed(() => ({
  transform: `translateX(-${100 - (props.modelValue ?? 0)}%)`,
}))
</script>

<template>
  <ProgressRoot
    :model-value="modelValue"
    :class="cn('relative h-4 w-full overflow-hidden rounded-full bg-secondary', props.class)"
  >
    <ProgressIndicator
      class="h-full w-full flex-1 bg-primary transition-all"
      :style="indicatorStyle"
    />
  </ProgressRoot>
</template>
