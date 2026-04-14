<template>
  <div class="home">
    <!-- 公告栏 -->
    <div class="announcement-banner">
      <div class="announcement-left">
        <div class="announcement-icon">📢</div>
        <div class="announcement-content">
          <strong>公告：</strong>更多内容请访问微信小程序 <span class="highlight">AI足球智能体</span>
          <p class="scan-tip">扫描右侧二维码体验小程序</p>
        </div>
      </div>
      <div class="qrcode-container">
        <img src="/mini.jpg" alt="AI足球智能体小程序码" class="mini-qrcode" />
        <span class="qrcode-label">微信扫一扫</span>
      </div>
    </div>

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

/* 公告栏样式 */
.announcement-banner {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-left: 4px solid #667eea;
  border-radius: 8px;
  padding: 15px 20px;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
  animation: slideIn 0.5s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.announcement-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.announcement-icon {
  font-size: 24px;
  flex-shrink: 0;
  animation: pulse 2s ease infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.announcement-content {
  color: #333;
  font-size: 15px;
  line-height: 1.6;
}

.announcement-content strong {
  color: #667eea;
  font-weight: 600;
}

.scan-tip {
  margin-top: 5px;
  font-size: 13px;
  color: #666;
}

.highlight {
  color: #764ba2;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 二维码容器 */
.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.mini-qrcode {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: white;
  padding: 5px;
  transition: transform 0.3s ease;
}

.mini-qrcode:hover {
  transform: scale(1.05);
}

.qrcode-label {
  font-size: 12px;
  color: #667eea;
  font-weight: 500;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .announcement-banner {
    flex-direction: column;
    padding: 15px;
    margin-bottom: 20px;
    gap: 15px;
  }

  .announcement-left {
    width: 100%;
  }

  .announcement-icon {
    font-size: 20px;
  }

  .announcement-content {
    font-size: 14px;
  }

  .scan-tip {
    font-size: 12px;
  }

  .qrcode-container {
    width: 100%;
  }

  .mini-qrcode {
    width: 120px;
    height: 120px;
  }
}

/* 平板适配 */
@media (min-width: 768px) and (max-width: 1023px) {
  .announcement-banner {
    padding: 14px 18px;
  }
}
</style>