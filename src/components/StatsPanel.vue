<script setup lang="ts">
import { computed } from 'vue'
import { useRunStore } from '@/stores/run'

const runStore = useRunStore()
const s = computed(() => runStore.state?.stats)
const state = computed(() => runStore.state)

const hpPct = computed(() => s.value ? Math.round((s.value.hp / s.value.maxHp) * 100) : 0)
const shieldPct = computed(() => s.value ? Math.min(100, Math.round((s.value.shield / s.value.maxHp) * 100)) : 0)
const siPct = computed(() => s.value ? s.value.swordIntent : 0)

const zoneNames = ['北荒边境', '幽冥古道', 'Boss']
const zoneName = computed(() => {
  const z = state.value?.currentZone ?? 0
  return zoneNames[z] ?? `区域${z + 1}`
})

const qualityClass: Record<string, string> = {
  mortal: 'quality-mortal',
  spirit: 'quality-spirit',
  rare: 'quality-rare',
  supreme: 'quality-supreme',
  immortal: 'quality-immortal',
}
</script>

<template>
  <div v-if="s && state" class="flex flex-1 flex-col overflow-y-auto p-3 text-sm">
    <h3 class="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--c-accent)]">修炼状态</h3>

    <!-- HP 条 -->
    <div class="mb-1 flex items-center justify-between text-xs">
      <span>根基</span>
      <span>{{ s.hp }} / {{ s.maxHp }}</span>
    </div>
    <div class="mb-2 h-2 overflow-hidden rounded-full bg-[var(--c-bg)]">
      <div class="h-full rounded-full bg-[var(--c-hp)] transition-all duration-300" :style="{ width: hpPct + '%' }" />
    </div>

    <!-- 护盾条 -->
    <div class="mb-1 flex items-center justify-between text-xs">
      <span>护盾</span>
      <span>{{ s.shield }}</span>
    </div>
    <div class="mb-2 h-2 overflow-hidden rounded-full bg-[var(--c-bg)]">
      <div class="h-full rounded-full bg-[var(--c-shield)] transition-all duration-300" :style="{ width: shieldPct + '%' }" />
    </div>

    <!-- 剑意条 -->
    <div class="mb-1 flex items-center justify-between text-xs">
      <span>剑意</span>
      <span>{{ s.swordIntent }} / 100</span>
    </div>
    <div class="mb-3 h-2 overflow-hidden rounded-full bg-[var(--c-bg)]">
      <div class="h-full rounded-full bg-[var(--c-si)] transition-all duration-300" :style="{ width: siPct + '%' }" />
    </div>

    <!-- 属性数值 -->
    <div class="space-y-1 border-t border-[var(--c-border)] pt-2 text-xs">
      <div class="flex justify-between"><span class="text-[var(--c-text-dim)]">攻击</span><span>{{ s.atk }}</span></div>
      <div class="flex justify-between"><span class="text-[var(--c-text-dim)]">攻速</span><span>{{ s.atkSpeed.toFixed(2) }}</span></div>
      <div class="flex justify-between"><span class="text-[var(--c-text-dim)]">暴击</span><span>{{ (s.critRate * 100).toFixed(1) }}%</span></div>
      <div class="flex justify-between"><span class="text-[var(--c-text-dim)]">减伤</span><span>{{ (s.dmgReduce * 100).toFixed(1) }}%</span></div>
      <div class="flex justify-between"><span class="text-[var(--c-text-dim)]">幸运</span><span>{{ (s.luckDrop * 100).toFixed(1) }}%</span></div>
    </div>

    <!-- 装备槽 -->
    <h3 class="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-[var(--c-accent)]">装备</h3>
    <div class="space-y-1 text-xs">
      <div v-for="slot in (['weapon', 'armor', 'ring'] as const)" :key="slot"
        class="rounded border border-[var(--c-border)] bg-[var(--c-bg)] px-2 py-1">
        <span class="text-[var(--c-text-dim)]">{{ { weapon: '武器', armor: '护甲', ring: '戒指' }[slot] }}：</span>
        <span v-if="state.equippedItems[slot]" :class="qualityClass[state.equippedItems[slot]!.quality]">
          {{ state.equippedItems[slot]!.name }}
        </span>
        <span v-else class="text-[var(--c-text-dim)]">空</span>
      </div>
    </div>

    <!-- 道途 -->
    <div class="mt-4 space-y-1 border-t border-[var(--c-border)] pt-2 text-xs">
      <div class="flex justify-between"><span class="text-[var(--c-text-dim)]">区域</span><span>{{ zoneName }}</span></div>
      <div class="flex justify-between"><span class="text-[var(--c-text-dim)]">战斗</span><span>{{ state.combatCount }}</span></div>
      <div class="flex justify-between"><span class="text-[var(--c-text-dim)]">道韵</span><span>{{ state.daoYun }}</span></div>
    </div>
  </div>
</template>
