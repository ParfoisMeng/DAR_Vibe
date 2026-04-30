<script setup lang="ts">
import { ref } from 'vue'

export interface ActionChoice {
  label: string
  onClick: () => void
  primary?: boolean
  disabled?: boolean
}

const title = ref('')
const narrative = ref('')
const choices = ref<ActionChoice[]>([])
const locked = ref(false)

function setAction(t: string, n: string, c: ActionChoice[]) {
  title.value = t
  narrative.value = n
  choices.value = c
  locked.value = false
}

function lockActions() {
  locked.value = true
}

function waitContinue(label = '继续'): Promise<void> {
  return new Promise(resolve => {
    setAction('', '', [{ label, onClick: () => { lockActions(); resolve() }, primary: true }])
  })
}

defineExpose({ setAction, lockActions, waitContinue })
</script>

<template>
  <div class="border-t border-[var(--c-border)] bg-[var(--c-bg-panel)] p-4">
    <div v-if="title" class="mb-1 text-sm font-bold text-[var(--c-accent)]">{{ title }}</div>
    <div v-if="narrative" class="mb-3 text-sm text-[var(--c-text-dim)]">{{ narrative }}</div>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="(c, i) in choices"
        :key="i"
        class="btn"
        :class="{ primary: c.primary }"
        :disabled="locked || c.disabled"
        @click="c.onClick"
      >
        {{ c.label }}
      </button>
    </div>
  </div>
</template>
