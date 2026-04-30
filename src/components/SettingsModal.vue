<script setup lang="ts">
import { ref } from 'vue'
import { useMetaStore } from '@/stores/meta'

const emit = defineEmits<{ close: [] }>()
const metaStore = useMetaStore()

const importCode = ref('')
const importMsg = ref('')
const exportCode = ref('')

function doExport() {
  exportCode.value = metaStore.exportSaveCode()
  navigator.clipboard?.writeText(exportCode.value)
}

function doImport() {
  if (!importCode.value.trim()) return
  const res = metaStore.importSaveCode(importCode.value)
  importMsg.value = res.success ? '✅ 导入成功！' : `❌ ${res.error}`
}

function doClear() {
  if (confirm('确认清空所有存档？此操作不可恢复！')) {
    metaStore.clearAll()
    emit('close')
    location.reload()
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" @click.self="emit('close')">
    <div class="w-96 rounded-lg border border-[var(--c-border)] bg-[var(--c-bg-panel)] p-6">
      <h2 class="mb-4 text-lg font-bold text-[var(--c-accent)]">⚙ 存档管理</h2>

      <!-- 导出 -->
      <div class="mb-4">
        <button class="btn w-full" @click="doExport">导出存档码</button>
        <textarea
          v-if="exportCode"
          :value="exportCode"
          readonly
          class="mt-2 w-full rounded border border-[var(--c-border)] bg-[var(--c-bg)] p-2 text-xs text-[var(--c-text-dim)]"
          rows="3"
        />
      </div>

      <!-- 导入 -->
      <div class="mb-4">
        <textarea
          v-model="importCode"
          placeholder="粘贴存档码..."
          class="w-full rounded border border-[var(--c-border)] bg-[var(--c-bg)] p-2 text-xs text-[var(--c-text)]"
          rows="3"
        />
        <button class="btn mt-2 w-full" @click="doImport">导入存档码</button>
        <p v-if="importMsg" class="mt-1 text-xs" :class="importMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'">
          {{ importMsg }}
        </p>
      </div>

      <!-- 危险区 -->
      <div class="mb-4 border-t border-[var(--c-border)] pt-4">
        <button class="btn danger w-full" @click="doClear">清空所有存档</button>
      </div>

      <button class="btn w-full" @click="emit('close')">关闭</button>
    </div>
  </div>
</template>
