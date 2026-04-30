<script setup lang="ts">
import { computed } from 'vue'
import { useRunStore } from '@/stores/run'
import { useMetaStore } from '@/stores/meta'
import { SYNERGIES_PHASE0 } from '@/data/synergies'

const runStore = useRunStore()
const metaStore = useMetaStore()

const skillTree = computed(() => runStore.state?.skillTree ?? [])
const synergies = computed(() => runStore.state?.activeSynergies ?? [])

const tierColor: Record<string, string> = {
  commonA: 'text-[var(--c-tier-commonA)]',
  commonB: 'text-[var(--c-tier-commonB)]',
  rare: 'text-[var(--c-tier-rare)]',
  epic: 'text-[var(--c-tier-epic)]',
}

// 天机图鉴
const journalEntries = computed(() => {
  const discovered = metaStore.data.discoveredSynergies
  return SYNERGIES_PHASE0.map(s => ({
    id: s.id,
    name: discovered.includes(s.id) ? s.journalName : '???',
    desc: discovered.includes(s.id) ? s.journalDesc : '尚未发现此天机…',
    discovered: discovered.includes(s.id),
    tier: s.tier,
  }))
})
</script>

<template>
  <div class="flex-1 overflow-y-auto p-3 text-sm">
    <!-- 已修炼功法 -->
    <h4 class="mb-2 text-xs font-bold text-[var(--c-accent)]">已修炼功法</h4>
    <div v-if="skillTree.length === 0" class="mb-4 text-xs text-[var(--c-text-dim)]">暂未修炼</div>
    <div v-else class="mb-4 space-y-1">
      <div v-for="node in skillTree" :key="node.id" class="rounded border border-[var(--c-border)] bg-[var(--c-bg)] px-2 py-1 text-xs">
        <div class="font-bold">{{ node.name }}</div>
        <div class="text-[var(--c-text-dim)]">{{ node.flavorText }}</div>
      </div>
    </div>

    <!-- 天机感应（协同） -->
    <h4 class="mb-2 text-xs font-bold text-[var(--c-accent)]">天机感应</h4>
    <div v-if="synergies.length === 0" class="mb-4 text-xs text-[var(--c-text-dim)]">暂无协同</div>
    <div v-else class="mb-4 space-y-1">
      <div v-for="syn in synergies" :key="syn.id" class="rounded border border-[var(--c-border)] bg-[var(--c-bg)] px-2 py-1 text-xs" :class="tierColor[syn.tier]">
        {{ syn.name }}
      </div>
    </div>

    <!-- 天机图鉴 -->
    <h4 class="mb-2 text-xs font-bold text-[var(--c-accent)]">天机图鉴</h4>
    <div class="space-y-1">
      <div v-for="entry in journalEntries" :key="entry.id"
        class="rounded border border-[var(--c-border)] bg-[var(--c-bg)] px-2 py-1 text-xs"
        :class="entry.discovered ? tierColor[entry.tier] : 'text-[var(--c-text-dim)]'"
      >
        <div class="font-bold">{{ entry.name }}</div>
        <div class="text-[var(--c-text-dim)]" style="font-size: 10px">{{ entry.desc }}</div>
      </div>
    </div>
  </div>
</template>
