<template>
  <div class="home">
    <MatchList @analyze-match="handleAnalyzeMatch" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import MatchList from '@/components/match/MatchList.vue'

const router = useRouter()

const handleAnalyzeMatch = (matchId: number) => {
  router.push(`/analysis/${matchId}`)
}
</script>

<style scoped>
.home {
  padding: 20px;
}
</style>