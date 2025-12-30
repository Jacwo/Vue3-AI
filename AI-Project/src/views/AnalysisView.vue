<template>
  <div class="analysis-view">
    <MatchAnalysis :match-id="route.params.matchId" />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import MatchAnalysis from '@/components/analysis/MatchAnalysis.vue'

const route = useRoute()
</script>

<style scoped>
.analysis-view {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}
</style>