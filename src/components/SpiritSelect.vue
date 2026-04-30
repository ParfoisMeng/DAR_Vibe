<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRunStore } from '@/stores/run'
import { useMetaStore } from '@/stores/meta'
import type { SpiritRoot } from '@/types'
import SettingsModal from './SettingsModal.vue'

const runStore = useRunStore()
const metaStore = useMetaStore()

const showSettings = ref(false)
const hasResume = ref(false)
const resumeInfo = ref('')

const spirits: { root: SpiritRoot; name: string; desc: string; emoji: string }[] = [
  { root: 'sword', name: '剑灵根', desc: '锋芒毕露，以剑意为核心', emoji: '⚔️' },
  // Phase 1 Week 3 将添加更多灵根
]

onMounted(() => {
  const snapshot = runStore.loadSnapshot()
  if (snapshot) {
    hasResume.value = true
    const zoneNames = ['北荒边境', '幽冥古道', 'Boss']
    const zName = zoneNames[snapshot.currentZone] ?? `区域${snapshot.currentZone + 1}`
    resumeInfo.value = `灵根：${snapshot.spiritRoot} | 区域：${zName} | 战斗：${snapshot.combatCount}次`
  }
})

function selectSpiritRoot(root: SpiritRoot) {
  runStore.startNewRun(root)
}

function resumeRun() {
  runStore.resumeRun()
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-[var(--c-bg)] px-4">
    <h1 class="mb-2 text-4xl font-bold text-[var(--c-accent)]">问道无界</h1>
    <p class="mb-8 text-[var(--c-text-dim)]">选择你的灵根，踏入修仙之旅</p>

    <!-- 灵根选择 -->
    <div class="mb-6 flex gap-4">
      <button
        v-for="s in spirits"
        :key="s.root"
        class="btn primary w-48 py-6 text-center"
        @click="selectSpiritRoot(s.root)"
      >
        <div class="text-3xl">{{ s.emoji }}</div>
        <div class="mt-2 text-lg font-bold">{{ s.name }}</div>
        <div class="mt-1 text-xs text-[var(--c-text-dim)]">{{ s.desc }}</div>
      </button>
    </div>

    <!-- 续局 -->
    <div v-if="hasResume" class="mb-6 rounded-lg border border-[var(--c-accent)] bg-[var(--c-bg-panel)] p-4 text-center">
      <button class="btn primary mb-2" @click="resumeRun">继续上局</button>
      <div class="text-xs text-[var(--c-text-dim)]">{{ resumeInfo }}</div>
    </div>

    <!-- 存档管理 -->
    <button class="text-sm text-[var(--c-text-dim)] underline hover:text-[var(--c-accent)]" @click="showSettings = true">
      ⚙ 存档管理
    </button>

    <SettingsModal v-if="showSettings" @close="showSettings = false" />
  </div>
</template>
