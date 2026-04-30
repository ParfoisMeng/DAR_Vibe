<script setup lang="ts">
import { ref, onMounted, getCurrentInstance } from 'vue'
import { useRunStore } from '@/stores/run'
import { useGameFlow } from '@/composables/useGameFlow'
import type {
  CombatLogExpose,
  ActionAreaExpose,
  HeavenlyMomentExpose,
  SkillPickExpose,
  EventExpose,
  LootExpose,
  RunEndExpose,
} from '@/composables/useGameFlow'

const runStore = useRunStore()

// 获取兄弟组件引用（通过 parent 的 $refs）
function getRef<T>(name: string): T | null {
  const instance = getCurrentInstance()
  const parent = instance?.parent
  if (!parent?.refs) return null
  return (parent.refs[name] as any) ?? null
}

const { runFlow, resumeFlow } = useGameFlow({
  combatLog: () => getRef<CombatLogExpose>('combatLogRef'),
  actionArea: () => getRef<ActionAreaExpose>('actionAreaRef'),
  hmOverlay: () => getRef<HeavenlyMomentExpose>('hmOverlayRef'),
  skillPick: () => getRef<SkillPickExpose>('skillPickRef'),
  eventOverlay: () => getRef<EventExpose>('eventOverlayRef'),
  lootOverlay: () => getRef<LootExpose>('lootOverlayRef'),
  runEnd: () => getRef<RunEndExpose>('runEndRef'),
})

onMounted(async () => {
  // 判断是续局还是新局
  if (runStore.state && runStore.hasSnapshot()) {
    // 从续局进入
    await resumeFlow()
  } else {
    // 新局
    await runFlow()
  }
})
</script>

<template>
  <!-- 无渲染组件 -->
</template>
