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
  padding: 16px 12px;
  background-color: #f8f9fa;
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .history-view {
    padding: 12px 8px;
  }
}

@media (max-width: 480px) {
  .history-view {
    padding: 8px 4px;
  }
}

/* 移动端安全区域适配（针对有刘海屏的设备） */
@supports (padding: max(0px)) {
  .history-view {
    padding-left: max(12px, env(safe-area-inset-left));
    padding-right: max(12px, env(safe-area-inset-right));
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }
}

/* 触摸优化 */
@media (hover: none) and (pointer: coarse) {
  .history-view {
    /* 增加触摸目标尺寸 */
    --touch-target-min: 44px;
    
    /* 优化滚动性能 */
    -webkit-overflow-scrolling: touch;
  }
}

/* 防止移动端缩放 */
@media screen and (max-width: 768px) {
  .history-view {
    /* 防止双击缩放 */
    touch-action: manipulation;
    
    /* 优化字体渲染 */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

/* 横屏适配 */
@media screen and (orientation: landscape) and (max-height: 500px) {
  .history-view {
    padding: 8px 12px;
    min-height: auto;
  }
}

/* 高DPI屏幕优化 */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .history-view {
    /* 在高DPI设备上可以添加微调 */
    border-width: 0.5px;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .history-view {
    background-color: #121212;
    color: #e0e0e0;
  }
}
</style>