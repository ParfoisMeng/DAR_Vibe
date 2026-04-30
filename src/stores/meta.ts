import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MetaData, Equipment } from '@/types'
import { defaultMeta } from '@/types'

const STORAGE_KEY = 'dar_vibe_meta'
const SAVE_VERSION = 1

export const useMetaStore = defineStore('meta', () => {
  const data = ref<MetaData>(loadFromStorage())

  // ── 持久化读写 ────────────────────────
  function loadFromStorage(): MetaData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return defaultMeta()
      const parsed = JSON.parse(raw)
      return { ...defaultMeta(), ...parsed }
    } catch {
      return defaultMeta()
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ _v: SAVE_VERSION, ...data.value }))
  }

  function reload() {
    data.value = loadFromStorage()
  }

  // ── 存档管理 ────────────────────────
  function exportSaveCode(): string {
    save()
    const json = localStorage.getItem(STORAGE_KEY) ?? '{}'
    return btoa(unescape(encodeURIComponent(json)))
  }

  function importSaveCode(code: string): { success: boolean; error?: string } {
    try {
      const json = decodeURIComponent(escape(atob(code.trim())))
      const parsed = JSON.parse(json)
      if (typeof parsed !== 'object') return { success: false, error: '存档格式错误' }
      localStorage.setItem(STORAGE_KEY, json)
      reload()
      return { success: true }
    } catch {
      return { success: false, error: '存档码无效' }
    }
  }

  function clearAll() {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('dar_vibe_run_snapshot')
    data.value = defaultMeta()
  }

  // ── 业务操作 ────────────────────────
  function finishRun(daoYunEarned: number, victory: boolean, discoveredSynergyIds: string[], lootItems: Equipment[]) {
    data.value.totalRuns++
    const bonus = victory ? Math.floor(daoYunEarned * 1.2) : daoYunEarned
    data.value.totalDaoYun += bonus

    // 发现新协同
    for (const sid of discoveredSynergyIds) {
      if (!data.value.discoveredSynergies.includes(sid)) {
        data.value.discoveredSynergies.push(sid)
      }
    }

    // 装备入库（上限20）
    for (const item of lootItems) {
      if (data.value.warehouse.length < 20) {
        data.value.warehouse.push(item)
      }
    }

    save()
  }

  function addDiscoveredSynergy(synergyId: string) {
    if (!data.value.discoveredSynergies.includes(synergyId)) {
      data.value.discoveredSynergies.push(synergyId)
      save()
    }
  }

  // ── Computed ────────────────────────
  const isFirstEver = computed(() => data.value.discoveredSynergies.length === 0)

  return {
    data,
    save,
    reload,
    exportSaveCode,
    importSaveCode,
    clearAll,
    finishRun,
    addDiscoveredSynergy,
    isFirstEver,
  }
})
