<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { CombatLogEntry } from '@/types'

const logs = ref<CombatLogEntry[]>([])
const containerEl = ref<HTMLElement | null>(null)

function clearLogs() {
  logs.value = []
}

function appendLog(entry: CombatLogEntry) {
  logs.value.push(entry)
  nextTick(() => {
    if (containerEl.value) {
      containerEl.value.scrollTop = containerEl.value.scrollHeight
    }
  })
}

async function playLogs(entries: CombatLogEntry[], intervalMs = 120) {
  for (const entry of entries) {
    appendLog(entry)
    await new Promise(r => setTimeout(r, intervalMs))
  }
}

const logClass: Record<string, string> = {
  normal: 'log-normal',
  crit: 'log-crit',
  synergy: 'log-synergy',
  boss: 'log-boss',
  system: 'log-system',
  loot: 'log-loot',
}

defineExpose({ clearLogs, appendLog, playLogs })
</script>

<template>
  <div
    ref="containerEl"
    class="flex-1 overflow-y-auto border-b border-[var(--c-border)] p-3 text-sm leading-relaxed"
  >
    <div
      v-for="(log, i) in logs"
      :key="i"
      :class="logClass[log.type] || 'log-normal'"
      class="fade-in"
    >
      {{ log.text }}
    </div>
    <div v-if="logs.length === 0" class="text-center text-[var(--c-text-dim)]">
      等待战斗开始...
    </div>
  </div>
</template>
