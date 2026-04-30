import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RunState, SpiritRoot, SkillNode, Equipment, Synergy } from '@/types'
import { createNewRun, pickSkillNode, equipItem, discardItem } from '@/engine/run'
import { calcCombat } from '@/engine/combat'
import type { Enemy } from '@/types'

const SNAPSHOT_KEY = 'dar_vibe_run_snapshot'

export const useRunStore = defineStore('run', () => {
  const state = ref<RunState | null>(null)
  const isRunning = computed(() => state.value !== null)

  // ── 快照（续局） ────────────────────────
  function saveSnapshot() {
    if (state.value) {
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(state.value))
    }
  }

  function loadSnapshot(): RunState | null {
    try {
      const raw = localStorage.getItem(SNAPSHOT_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  function clearSnapshot() {
    localStorage.removeItem(SNAPSHOT_KEY)
  }

  function hasSnapshot(): boolean {
    return localStorage.getItem(SNAPSHOT_KEY) !== null
  }

  // ── 游戏流程 ────────────────────────
  function startNewRun(spiritRoot: SpiritRoot) {
    state.value = createNewRun(spiritRoot)
    saveSnapshot()
  }

  function resumeRun() {
    const snapshot = loadSnapshot()
    if (snapshot) {
      state.value = snapshot
    }
  }

  function endRun() {
    clearSnapshot()
    state.value = null
  }

  // ── 功法选择 ────────────────────────
  function selectSkill(node: SkillNode): Synergy[] {
    if (!state.value) return []
    const result = pickSkillNode(state.value, node)
    state.value = result.newState
    saveSnapshot()
    return result.newSynergies
  }

  // ── 装备管理 ────────────────────────
  function equipItemToSlot(equip: Equipment) {
    if (!state.value) return
    state.value = equipItem(state.value, equip)
    saveSnapshot()
  }

  function discardItemFromInventory(instanceId: string) {
    if (!state.value) return
    state.value = discardItem(state.value, instanceId)
    saveSnapshot()
  }

  function storeItemToInventory(equip: Equipment) {
    if (!state.value) return
    state.value.inventory.push(equip)
    saveSnapshot()
  }

  // ── 战斗 ────────────────────────
  function runCombat(enemy: Enemy) {
    if (!state.value) return null
    const result = calcCombat(state.value.stats, enemy)
    // 更新状态
    state.value.stats.hp = result.playerHpRemain
    state.value.stats.shield = result.playerShieldRemain
    state.value.stats.swordIntent = Math.min(
      100,
      state.value.stats.swordIntent + result.swordIntentGain
    )
    state.value.combatCount++
    saveSnapshot()
    return result
  }

  // ── 区域/阶段推进 ────────────────────────
  function advanceZone() {
    if (!state.value) return
    state.value.currentZone++
    state.value.currentNodeIndex = 0
    saveSnapshot()
  }

  function advanceNode() {
    if (!state.value) return
    state.value.currentNodeIndex++
    saveSnapshot()
  }

  function setPhase(phase: RunState['phase']) {
    if (!state.value) return
    state.value.phase = phase
    saveSnapshot()
  }

  // ── 天机时刻 ────────────────────────
  function recordHeavenlyMoment(label: string) {
    if (!state.value) return
    state.value.heavenlyMomentHistory.push(label)
    saveSnapshot()
  }

  function applyStatChange(key: string, value: number) {
    if (!state.value) return
    const s = state.value.stats
    switch (key) {
      case 'atk': s.atk += value; break
      case 'atkPct': s.atk = Math.round(s.atk * (1 + value)); break
      case 'atkSpeed': s.atkSpeed = +(s.atkSpeed + value).toFixed(2); break
      case 'atkSpeedPct': s.atkSpeed = +(s.atkSpeed * (1 + value)).toFixed(2); break
      case 'critRate': s.critRate = Math.min(1, s.critRate + value); break
      case 'critDmg': s.critDmg += value; break
      case 'hp': s.hp = Math.min(s.maxHp, s.hp + value); break
      case 'maxHp': s.maxHp += value; s.hp = Math.min(s.maxHp, s.hp + value); break
      case 'maxHpPct': {
        const add = Math.round(s.maxHp * value)
        s.maxHp += add; s.hp += add; break
      }
      case 'shield': s.shield += value; break
      case 'shieldPct': s.shield = Math.round(s.maxHp * value); break
      case 'dmgReduce': s.dmgReduce = Math.min(0.8, s.dmgReduce + value); break
      case 'dodge': s.dodge = Math.min(0.5, s.dodge + value); break
      case 'swordIntent': s.swordIntent = Math.min(100, s.swordIntent + value); break
      case 'luckDrop': s.luckDrop += value; break
      case 'fateDest': s.fateDest += value; break
      case 'hpDamage': s.hp = Math.max(1, Math.round(s.hp * (1 - value))); break
      case 'materials':
        state.value.materials += value; break
      case 'daoYun':
        state.value.daoYun += value; break
    }
    saveSnapshot()
  }

  return {
    state,
    isRunning,
    // 快照
    saveSnapshot,
    loadSnapshot,
    clearSnapshot,
    hasSnapshot,
    // 流程
    startNewRun,
    resumeRun,
    endRun,
    // 功法
    selectSkill,
    // 装备
    equipItemToSlot,
    discardItemFromInventory,
    storeItemToInventory,
    // 战斗
    runCombat,
    // 推进
    advanceZone,
    advanceNode,
    setPhase,
    // 天机时刻
    recordHeavenlyMoment,
    applyStatChange,
  }
})
