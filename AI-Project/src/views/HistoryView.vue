<template>
  <div class="history-view">
    <HistoryList @view-detail="onViewDetail" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import HistoryList from '@/components/history/HistoryList.vue'

const router = useRouter()

const onViewDetail = (id: string) => {
  router.push(`/history/${id}`)
}
</script>

<style scoped>
.history-view {
  padding: 20px;
  background-color: #f8f9fa;
  min-height: 100vh;
}
</style>