<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRunStore } from '@/stores/run'
import type { Equipment } from '@/types'

const runStore = useRunStore()
const visible = ref(false)
const newItem = ref<Equipment | null>(null)
const onEquipCallback = ref<(() => void) | null>(null)
const onStoreCallback = ref<(() => void) | null>(null)
const onDiscardCallback = ref<(() => void) | null>(null)

const currentItem = computed(() => {
  if (!newItem.value || !runStore.state) return null
  return runStore.state.equippedItems[newItem.value.slot] ?? null
})

const qualityLabel: Record<string, string> = {
  mortal: '凡品', spirit: '灵品', rare: '珍品', supreme: '极品', immortal: '仙品'
}
const qualityClass: Record<string, string> = {
  mortal: 'quality-mortal', spirit: 'quality-spirit', rare: 'quality-rare',
  supreme: 'quality-supreme', immortal: 'quality-immortal'
}

function show(item: Equipment, onEquip: () => void, onStore: () => void, onDiscard: () => void) {
  newItem.value = item
  onEquipCallback.value = onEquip
  onStoreCallback.value = onStore
  onDiscardCallback.value = onDiscard
  visible.value = true
}

function hide() {
  visible.value = false
}

function doEquip() { onEquipCallback.value?.(); hide() }
function doStore() { onStoreCallback.value?.(); hide() }
function doDiscard() { onDiscardCallback.value?.(); hide() }

defineExpose({ show, hide })
</script>

<template>
  <Teleport to="body">
    <div v-if="visible && newItem" class="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
      <div class="w-[400px] max-w-[95vw] rounded-lg border border-[var(--c-accent)] bg-[var(--c-bg-panel)] p-6">
        <div class="mb-2 text-center">
          <span class="text-xs" :class="qualityClass[newItem.quality]">{{ qualityLabel[newItem.quality] }}</span>
        </div>
        <h2 class="mb-2 text-center text-lg font-bold" :class="qualityClass[newItem.quality]">{{ newItem.name }}</h2>

        <!-- 词缀 -->
        <div class="mb-3 space-y-1">
          <div v-for="affix in newItem.affixes" :key="affix.id" class="text-center text-xs text-[var(--c-text-dim)]">
            {{ affix.name }}：{{ affix.description }}
          </div>
        </div>

        <!-- 对比 -->
        <div v-if="currentItem" class="mb-4 rounded border border-[var(--c-border)] bg-[var(--c-bg)] p-2 text-center text-xs">
          <span class="text-[var(--c-text-dim)]">替换：</span>
          <span :class="qualityClass[currentItem.quality]">{{ currentItem.name }}</span>
        </div>

        <!-- 按钮 -->
        <div class="flex gap-2">
          <button class="btn primary flex-1" @click="doEquip">装备</button>
          <button class="btn flex-1" @click="doStore">存仓库</button>
          <button class="btn danger flex-1" @click="doDiscard">分解</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
