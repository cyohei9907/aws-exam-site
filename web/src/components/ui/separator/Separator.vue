<script setup lang="ts">
import { computed } from 'vue'
import { SeparatorRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  orientation: 'horizontal',
  decorative: true,
})

const classes = computed(() =>
  cn(
    'shrink-0 bg-border',
    props.orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
    props.class
  )
)
</script>

<template>
  <SeparatorRoot
    :orientation="orientation"
    :decorative="decorative"
    :class="classes"
  />
</template>
