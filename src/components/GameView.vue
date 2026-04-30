<script setup lang="ts">
import { ref } from 'vue'
import { useRunStore } from '@/stores/run'
import StatsPanel from './StatsPanel.vue'
import CombatLog from './CombatLog.vue'
import ActionArea from './ActionArea.vue'
import SkillTreePanel from './SkillTreePanel.vue'
import HeavenlyMomentOverlay from './HeavenlyMomentOverlay.vue'
import SkillPickOverlay from './SkillPickOverlay.vue'
import EventOverlay from './EventOverlay.vue'
import LootOverlay from './LootOverlay.vue'
import RunEndOverlay from './RunEndOverlay.vue'
import SettingsModal from './SettingsModal.vue'
import GameController from './GameController.vue'

const runStore = useRunStore()
const showSettings = ref(false)
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-[var(--c-bg)]">
    <!-- 左侧：状态面板 -->
    <aside class="flex w-56 flex-col border-r border-[var(--c-border)] bg-[var(--c-bg-panel)]">
      <StatsPanel />
    </aside>

    <!-- 中央：战斗日志 + 行动区 -->
    <main class="flex flex-1 flex-col">
      <CombatLog ref="combatLogRef" />
      <ActionArea ref="actionAreaRef" />
    </main>

    <!-- 右侧：功法树 + 协同 -->
    <aside class="flex w-56 flex-col border-l border-[var(--c-border)] bg-[var(--c-bg-panel)]">
      <div class="flex items-center justify-between border-b border-[var(--c-border)] px-3 py-2">
        <span class="text-sm font-bold text-[var(--c-accent)]">修炼信息</span>
        <button class="text-[var(--c-text-dim)] hover:text-[var(--c-accent)]" @click="showSettings = true" title="存档管理">⚙</button>
      </div>
      <SkillTreePanel />
    </aside>

    <!-- 弹层系统 -->
    <HeavenlyMomentOverlay ref="hmOverlayRef" />
    <SkillPickOverlay ref="skillPickRef" />
    <EventOverlay ref="eventOverlayRef" />
    <LootOverlay ref="lootOverlayRef" />
    <RunEndOverlay ref="runEndRef" />

    <!-- 协同触发 Toast -->
    <div id="synergy-toast" class="pointer-events-none fixed left-1/2 top-8 z-50 -translate-x-1/2 rounded-lg bg-[var(--c-synergy)] px-6 py-3 text-white opacity-0 shadow-lg transition-opacity duration-300">
    </div>

    <SettingsModal v-if="showSettings" @close="showSettings = false" />

    <!-- 游戏控制器（无渲染，纯逻辑） -->
    <GameController />
  </div>
</template>
