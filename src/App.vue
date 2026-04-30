<script setup lang="ts">
import { useRunStore } from '@/stores/run'
import SpiritSelect from '@/components/SpiritSelect.vue'
import GameView from '@/components/GameView.vue'

const runStore = useRunStore()
</script>

<template>
  <SpiritSelect v-if="!runStore.isRunning" />
  <GameView v-else />
</template>
