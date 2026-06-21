<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  text: string
  state: 'normal' | 'selected' | 'correct' | 'wrong' | 'correct-unselected'
  disabled: boolean
}>()

const emit = defineEmits<{ (e: 'select'): void }>()

const stateClasses = computed(() => {
  const base = props.disabled ? 'cursor-default' : ''

  switch (props.state) {
    case 'normal':
      return [
        base,
        props.disabled
          ? 'bg-white border-2 border-gray-200'
          : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer',
      ]
    case 'selected':
      return [base, 'bg-blue-50 border-2 border-blue-500 text-blue-800']
    case 'correct':
      return [base, 'bg-green-50 border-2 border-green-500 text-green-800']
    case 'wrong':
      return [base, 'bg-red-50 border-2 border-red-500 text-red-800']
    case 'correct-unselected':
      return [base, 'bg-green-50 border-2 border-green-400 text-green-700']
    default:
      return [base]
  }
})
</script>

<template>
  <div
    @click="!disabled && emit('select')"
    :class="stateClasses"
    class="w-full rounded-lg p-4 flex items-start gap-3 transition-colors text-left"
  >
    <span class="font-bold text-sm w-6 shrink-0">{{ label }}.</span>
    <span class="flex-1 text-sm leading-relaxed">{{ text }}</span>
    <span
      v-if="state === 'correct' || state === 'correct-unselected'"
      class="text-green-600 shrink-0"
    >✓</span>
    <span v-if="state === 'wrong'" class="text-red-600 shrink-0">✗</span>
  </div>
</template>
