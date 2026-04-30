<script setup lang="ts">
import { ref } from 'vue'
import { useRunStore } from '@/stores/run'
import type { HeavenlyMoment, HeavenlyMomentOption } from '@/types'

const runStore = useRunStore()
const visible = ref(false)
const moment = ref<HeavenlyMoment | null>(null)
const onPickCallback = ref<((opt: HeavenlyMomentOption) => void) | null>(null)

function show(hm: HeavenlyMoment, onPick: (opt: HeavenlyMomentOption) => void) {
  moment.value = hm
  onPickCallback.value = onPick
  visible.value = true
}

function hide() {
  visible.value = false
  moment.value = null
}

function checkCondition(opt: HeavenlyMomentOption): boolean {
  if (!opt.condition || !runStore.state) return true
  const s = runStore.state.stats
  const c = opt.condition
  switch (c.key) {
    case 'swordIntent': return s.swordIntent >= (c.minValue ?? 0)
    case 'shieldPct': return s.maxHp > 0 && (s.shield / s.maxHp) >= (c.minValue ?? 0)
    case 'hasSkillTag': return runStore.state.skillTree.some(n => n.synergyTags.includes(c.tag ?? ''))
    default: return true
  }
}

function getCurrentValue(opt: HeavenlyMomentOption): string {
  if (!opt.condition || !runStore.state) return ''
  const s = runStore.state.stats
  const c = opt.condition
  switch (c.key) {
    case 'swordIntent': return `${s.swordIntent}`
    case 'shieldPct': return `${Math.round((s.shield / s.maxHp) * 100)}%`
    case 'hasSkillTag': return runStore.state.skillTree.some(n => n.synergyTags.includes(c.tag ?? '')) ? '✓' : '✗'
    default: return ''
  }
}

function pickOption(opt: HeavenlyMomentOption) {
  if (!checkCondition(opt)) return
  if (opt.spiritRootExclusive && runStore.state?.spiritRoot !== opt.spiritRootExclusive) return
  onPickCallback.value?.(opt)
  hide()
}

defineExpose({ show, hide })
</script>

<template>
  <Teleport to="body">
    <div v-if="visible && moment" class="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
      <div class="w-[520px] max-w-[95vw] rounded-lg border border-[var(--c-accent)] bg-[var(--c-bg-panel)] p-6">
        <h2 class="mb-2 text-center text-lg font-bold text-[var(--c-accent)]">{{ moment.title }}</h2>
        <p class="mb-4 text-center text-sm text-[var(--c-text-dim)]">{{ moment.narrative }}</p>

        <div class="space-y-2">
          <button
            v-for="(opt, i) in moment.options"
            :key="i"
            class="w-full rounded border p-3 text-left transition"
            :class="checkCondition(opt) && (!opt.spiritRootExclusive || runStore.state?.spiritRoot === opt.spiritRootExclusive)
              ? 'border-[var(--c-accent)] bg-[var(--c-bg-card)] hover:bg-[var(--c-bg)] cursor-pointer'
              : 'border-[var(--c-border)] bg-[var(--c-bg)] opacity-40 cursor-not-allowed'"
            :disabled="!checkCondition(opt) || (!!opt.spiritRootExclusive && runStore.state?.spiritRoot !== opt.spiritRootExclusive)"
            @click="pickOption(opt)"
          >
            <div class="text-sm font-bold">{{ opt.label }}</div>
            <div class="text-xs text-[var(--c-text-dim)]">{{ opt.description }}</div>
            <div v-if="opt.condition" class="mt-1 text-xs"
              :class="checkCondition(opt) ? 'text-green-400' : 'text-red-400'">
              {{ opt.condition.displayText }} · 当前：{{ getCurrentValue(opt) }}
              {{ checkCondition(opt) ? '✓' : '✗' }}
            </div>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
