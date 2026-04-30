<script setup lang="ts">
import { ref } from 'vue'
import type { GameEvent, EventChoice } from '@/types'

const visible = ref(false)
const event = ref<GameEvent | null>(null)
const onChooseCallback = ref<((choice: EventChoice) => void) | null>(null)

function show(ev: GameEvent, onChoose: (choice: EventChoice) => void) {
  event.value = ev
  onChooseCallback.value = onChoose
  visible.value = true
}

function hide() {
  visible.value = false
}

function choose(choice: EventChoice) {
  onChooseCallback.value?.(choice)
  hide()
}

defineExpose({ show, hide })
</script>

<template>
  <Teleport to="body">
    <div v-if="visible && event" class="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
      <div class="w-[480px] max-w-[95vw] rounded-lg border border-[var(--c-accent)] bg-[var(--c-bg-panel)] p-6">
        <h2 class="mb-2 text-center text-lg font-bold text-[var(--c-accent)]">{{ event.title }}</h2>
        <p class="mb-4 whitespace-pre-line text-sm text-[var(--c-text-dim)]">{{ event.description }}</p>

        <div class="space-y-2">
          <button
            v-for="(choice, i) in event.choices"
            :key="i"
            class="w-full rounded border border-[var(--c-border)] bg-[var(--c-bg-card)] p-3 text-left transition hover:border-[var(--c-accent)] hover:bg-[var(--c-bg)]"
            @click="choose(choice)"
          >
            <div class="text-sm font-bold">{{ choice.label }}</div>
            <div class="text-xs text-[var(--c-text-dim)]">{{ choice.description }}</div>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
