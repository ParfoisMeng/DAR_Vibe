<script setup lang="ts">
import { ref } from 'vue'
import { useRunStore } from '@/stores/run'
import { useMetaStore } from '@/stores/meta'

const runStore = useRunStore()
const metaStore = useMetaStore()
const visible = ref(false)
const victory = ref(false)
const blameContext = ref('')
const blameDetail = ref('')

function show(v: boolean, ctx = '', detail = '') {
  victory.value = v
  blameContext.value = ctx
  blameDetail.value = detail
  visible.value = true
}

function hide() {
  visible.value = false
}

function restart() {
  // 结算 Run
  if (runStore.state) {
    const synIds = runStore.state.activeSynergies.map(s => s.id)
    const loot = Object.values(runStore.state.equippedItems).filter(Boolean) as any[]
    metaStore.finishRun(runStore.state.daoYun, victory.value, synIds, loot)
  }
  runStore.endRun()
  hide()
}

defineExpose({ show, hide })
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
      <div class="w-[480px] max-w-[95vw] rounded-lg border border-[var(--c-accent)] bg-[var(--c-bg-panel)] p-6 text-center">
        <h2 class="mb-2 text-2xl font-bold" :class="victory ? 'text-[var(--c-loot)]' : 'text-[var(--c-hp)]'">
          {{ victory ? '✨ 飞升成功！' : '💀 道消身殒' }}
        </h2>

        <div v-if="runStore.state" class="mb-4 space-y-1 text-sm text-[var(--c-text-dim)]">
          <div>战斗次数：{{ runStore.state.combatCount }}</div>
          <div>协同触发：{{ runStore.state.synergyTriggerCount }}</div>
          <div>道韵获得：{{ runStore.state.daoYun }}</div>
        </div>

        <!-- Build 路径 -->
        <div v-if="runStore.state && runStore.state.skillTree.length > 0" class="mb-4">
          <h3 class="mb-1 text-xs font-bold text-[var(--c-accent)]">修炼路径</h3>
          <div class="flex flex-wrap justify-center gap-1">
            <span v-for="node in runStore.state.skillTree" :key="node.id"
              class="rounded bg-[var(--c-bg)] px-2 py-0.5 text-xs text-[var(--c-text-dim)]">
              {{ node.name }}
            </span>
          </div>
        </div>

        <!-- 死亡归因 -->
        <div v-if="!victory && blameContext" class="mb-4 rounded border border-[var(--c-hp)] bg-[var(--c-bg)] p-3 text-left text-xs">
          <div class="font-bold text-[var(--c-hp)]">{{ blameContext }}</div>
          <div class="text-[var(--c-text-dim)]">{{ blameDetail }}</div>
        </div>

        <!-- 天机时刻历史 -->
        <div v-if="runStore.state && runStore.state.heavenlyMomentHistory.length > 0" class="mb-4">
          <h3 class="mb-1 text-xs font-bold text-[var(--c-accent)]">天机时刻记录</h3>
          <div class="text-xs text-[var(--c-text-dim)]">
            <span v-for="(h, i) in runStore.state.heavenlyMomentHistory" :key="i">
              {{ h }}{{ i < runStore.state.heavenlyMomentHistory.length - 1 ? ' → ' : '' }}
            </span>
          </div>
        </div>

        <button class="btn primary" @click="restart">重新开始</button>
      </div>
    </div>
  </Teleport>
</template>
