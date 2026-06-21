<script setup lang="ts">
import { computed } from 'vue'

type Level = 'Foundational' | 'Associate' | 'Professional' | 'Specialty'

const props = withDefaults(defineProps<{
  certId: string
  level: Level
  size?: number
}>(), { size: 72 })

const PALETTE: Record<Level, { top: string; mid: string; bottom: string }> = {
  Foundational: { top: '#3FB1A8', mid: '#2A8A82', bottom: '#1D6560' },
  Associate:    { top: '#2B83CB', mid: '#1F6FBA', bottom: '#154E8A' },
  Professional: { top: '#344063', mid: '#232E45', bottom: '#151D2E' },
  Specialty:    { top: '#E04347', mid: '#C8373C', bottom: '#921A1E' },
}

const SHORT_LABEL: Record<string, { line1: string; line2?: string }> = {
  'saa-c03': { line1: 'Solutions', line2: 'Architect' },
  'sap-c02': { line1: 'Solutions', line2: 'Architect' },
  'clf-c02': { line1: 'Cloud', line2: 'Practitioner' },
  'dva-c02': { line1: 'Developer' },
  'soa-c02': { line1: 'SysOps' },
  'dop-c02': { line1: 'DevOps' },
  'aif-c01': { line1: 'AI', line2: 'Practitioner' },
  'ans-c01': { line1: 'Networking' },
  'das-c01': { line1: 'Data', line2: 'Analytics' },
  'dea-c01': { line1: 'Data', line2: 'Engineer' },
  'mla-c01': { line1: 'ML Engineer' },
  'mls-c01': { line1: 'Machine', line2: 'Learning' },
  'scs-c02': { line1: 'Security' },
}

const LEVEL_SHORT: Record<Level, string> = {
  Foundational: 'Foundational',
  Associate:    'Associate',
  Professional: 'Professional',
  Specialty:    'Specialty',
}

const palette  = computed(() => PALETTE[props.level])
const label    = computed(() => SHORT_LABEL[props.certId] ?? { line1: props.certId })
const gradId   = computed(() => `bg-${props.certId}`)
const shadowId = computed(() => `sh-${props.certId}`)
const textY1   = computed(() => label.value.line2 ? 57 : 62)
const levelY   = computed(() => label.value.line2 ? 81 : 74)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    :aria-label="`AWS ${level} Certification`"
  >
    <defs>
      <linearGradient :id="gradId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   :stop-color="palette.top" />
        <stop offset="55%"  :stop-color="palette.mid" />
        <stop offset="100%" :stop-color="palette.bottom" />
      </linearGradient>
      <filter :id="shadowId" x="-15%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.22)" />
      </filter>
    </defs>

    <!-- Hexagon body (pointy-top, 6 vertices) -->
    <polygon
      points="50,5 92,27.5 92,72.5 50,95 8,72.5 8,27.5"
      :fill="`url(#${gradId})`"
      :filter="`url(#${shadowId})`"
    />

    <!-- Inner highlight ring -->
    <polygon
      points="50,10 87,30.5 87,69.5 50,90 13,69.5 13,30.5"
      fill="none"
      stroke="rgba(255,255,255,0.20)"
      stroke-width="1.2"
    />

    <!-- AWS wordmark -->
    <text
      x="50" y="31"
      text-anchor="middle"
      font-family="'Arial Black', 'Impact', Arial, sans-serif"
      font-size="13"
      font-weight="900"
      fill="white"
      letter-spacing="1.5"
    >AWS</text>

    <!-- AWS smile arc + arrows -->
    <path d="M 34,37 Q 50,47 66,37" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" />
    <polygon points="32,35 32,40 28,37.5" fill="white" />
    <polygon points="68,35 68,40 72,37.5" fill="white" />

    <!-- Cert name line 1 -->
    <text
      x="50" :y="textY1"
      text-anchor="middle"
      font-family="Arial, sans-serif"
      font-size="9.5"
      font-weight="700"
      fill="rgba(255,255,255,0.95)"
    >{{ label.line1 }}</text>

    <!-- Cert name line 2 -->
    <text
      v-if="label.line2"
      x="50" :y="textY1 + 11"
      text-anchor="middle"
      font-family="Arial, sans-serif"
      font-size="9.5"
      font-weight="700"
      fill="rgba(255,255,255,0.95)"
    >{{ label.line2 }}</text>

    <!-- Level label -->
    <text
      x="50" :y="levelY"
      text-anchor="middle"
      font-family="Arial, sans-serif"
      font-size="6.5"
      fill="rgba(255,255,255,0.65)"
    >{{ LEVEL_SHORT[level] }}</text>
  </svg>
</template>
