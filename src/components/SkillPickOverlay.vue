<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRunStore } from '@/stores/run'
import type { SkillNode } from '@/types'
import { drawSkillCandidates } from '@/data/skills'

const runStore = useRunStore()
const visible = ref(false)
const candidates = ref<SkillNode[]>([])
const onPickCallback = ref<((node: SkillNode) => void) | null>(null)

const skillTree = computed(() => runStore.state?.skillTree ?? [])

// Build 简览标签
const buildTags = computed(() => {
  const tags: Record<string, number> = {}
  for (const node of skillTree.value) {
    for (const t of node.synergyTags) {
      tags[t] = (tags[t] || 0) + 1
    }
  }
  return Object.entries(tags).sort((a, b) => b[1] - a[1])
})

function show(onPick: (node: SkillNode) => void) {
  if (!runStore.state) return
  const existingIds = runStore.state.skillTree.map(n => n.id)
  candidates.value = drawSkillCandidates(3, runStore.state.spiritRoot, existingIds)
  onPickCallback.value = onPick
  visible.value = true
}

function hide() {
  visible.value = false
}

function pick(node: SkillNode) {
  onPickCallback.value?.(node)
  hide()
}

defineExpose({ show, hide })
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
      <div class="w-[600px] max-w-[95vw] rounded-lg border border-[var(--c-accent)] bg-[var(--c-bg-panel)] p-6">
        <h2 class="mb-1 text-center text-lg font-bold text-[var(--c-accent)]">择法</h2>
        <p class="mb-4 text-center text-xs text-[var(--c-text-dim)]">选择一门功法修炼</p>

        <!-- Build 简览 -->
        <div v-if="buildTags.length > 0" class="mb-4 flex flex-wrap gap-1 justify-center">
          <span v-for="[tag, count] in buildTags" :key="tag"
            class="rounded-full bg-[var(--c-bg)] px-2 py-0.5 text-xs text-[var(--c-text-dim)]">
            {{ tag }} ×{{ count }}
          </span>
        </div>

        <!-- 候选卡片 -->
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="node in candidates"
            :key="node.id"
            class="rounded-lg border border-[var(--c-border)] bg-[var(--c-bg-card)] p-4 text-left transition hover:border-[var(--c-accent)] hover:bg-[var(--c-bg)]"
            @click="pick(node)"
          >
            <div class="mb-1 text-sm font-bold text-[var(--c-text)]">{{ node.name }}</div>
            <div class="mb-2 text-xs italic text-[var(--c-text-dim)]">{{ node.flavorText }}</div>
            <div class="text-xs text-[var(--c-text-dim)]">{{ node.description }}</div>
            <div v-if="node.synergyCount > 0" class="mt-2 text-xs text-[var(--c-synergy)]">
              相关协同：{{ node.synergyCount }}
            </div>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
