<template>
  <div class="match-analysis-drawer">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>正在分析比赛数据...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>分析失败: {{ error }}</p>
      <button @click="fetchAnalysis">重试</button>
    </div>

    <div v-else-if="analysisData" class="analysis-content">
      <!-- 比赛基本信息 -->
      <div class="match-header-info">
        <h3>{{ matchInfo.homeTeam }} vs {{ matchInfo.awayTeam }}</h3>
        <div class="match-meta">
          <span class="league">{{ matchInfo.league }}</span>
          <span class="match-time" v-if="matchInfo.fullMatchTime">
            {{ formatTime(matchInfo.fullMatchTime) }}
          </span>
          <span class="match-num" v-if="matchInfo.matchNumStr">
            场次: {{ matchInfo.matchNumStr }}
          </span>
        </div>
      </div>

      <!-- 渲染 Markdown 内容（带模糊效果） -->
      <div class="markdown-wrapper">
        <div class="markdown-container blurred">
          <MarkdownViewer :content="analysisData" />
        </div>

        <!-- 模糊遮罩层 -->
        <div class="drawer-blur-overlay">
          <div class="unlock-box">
            <div class="unlock-icon-drawer">
              <svg viewBox="0 0 1024 1024" width="50" height="50">
                <path d="M351.909 330.635c-23.273 0-42.775 19.502-42.775 42.775s19.502 42.775 42.775 42.775c23.273 0 42.775-19.502 42.775-42.775s-19.502-42.775-42.775-42.775zM583.588 330.635c-23.273 0-42.775 19.502-42.775 42.775s19.502 42.775 42.775 42.775c23.273 0 42.775-19.502 42.775-42.775s-19.502-42.775-42.775-42.775z" fill="#52C41A"></path>
                <path d="M935.384 573.288c0-154.83-154.83-279.945-340.078-279.945-190.149 0-344.979 125.115-344.979 279.945 0 154.83 154.83 279.945 344.979 279.945 40.001 0 77.227-6.701 112.003-17.853l104.851 53.576-29.401-96.75c70.526-53.576 152.625-124.264 152.625-218.918z m-429.304-39.151c-14.552 0-26.9-11.498-26.9-26.9s12.348-27.75 26.9-27.75c17.852 0 30.201 12.348 30.201 27.75-0.001 15.402-12.349 26.9-30.201 26.9z m190.149 0c-14.552 0-26.9-11.498-26.9-26.9s11.498-27.75 26.9-27.75c17.852 0 30.201 12.348 30.201 27.75s-12.349 26.9-30.201 26.9z" fill="#52C41A"></path>
                <path d="M351.909 303.735c26.049 0 49.322 11.498 65.626 29.351-78.927 26.9-140.278 75.527-177.504 137.728-5.801-2.55-11.498-3.401-17.852-3.401-26.9 0-48.471 21.571-48.471 48.471s21.571 48.471 48.471 48.471c26.9 0 48.471-21.571 48.471-48.471 0-3.401-0.85-6.801-1.7-10.201 29.351-66.476 98.75-128.678 198.049-153.1 30.201-7.651 61.375-11.498 93.399-11.498 20.721 0 40.851 1.7 60.131 4.251-21.571-110.653-123.414-192.751-247.679-192.751-139.428 0-252.629 96.75-252.629 215.518 0 65.626 35.776 124.264 92.55 162.34L139.907 635.49l72.227-38.301c22.421 7.651 46.545 12.348 70.526 17.852 5.801-17.852 13.453-35.776 24.951-51.221-109.801-25.2-187.599-100.451-187.599-188.449 0.001-112.003 107.252-204.249 231.897-204.249z" fill="#52C41A"></path>
              </svg>
            </div>

            <h4>查看完整 AI 分析</h4>
            <p class="unlock-tip">扫码查看本场比赛的详细分析和预测</p>

            <div class="mini-qrcode-wrapper">
              <img src="/mini.jpg" alt="AI足球智能体" class="drawer-qrcode" @error="handleQrcodeError" />
              <p class="scan-hint">微信扫一扫</p>
            </div>

            <div class="search-method">
              <span class="or-text">或搜索</span>
              <div class="mini-tag" @click="copyMiniProgramName">
                AI足球智能体
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { matchApi } from '@/api/match'
import type { Match } from '@/types/match'
import { formatMatchTime } from '@/utils/dateUtils'
import { parseAnalysisMarkdown } from '@/utils/markdownUtils'
import MarkdownViewer from '@/components/common/MarkdownViewer.vue'

interface Props {
  match: Match | null
}

const props = defineProps<Props>()

const loading = ref(false)
const error = ref('')
const matchInfo = ref<Partial<Match>>({})
const analysisData = ref<string>('')
const analysisTimestamp = ref<number>(0)

// 先定义 fetchAnalysis 函数，确保在 onMounted 之前被定义
const fetchAnalysis = async () => {
  if (!props.match?.id) return
  
  loading.value = true
  error.value = ''
  
  try {
    const response = await matchApi.getMatchAnalysis(props.match.id) as any
    console.log(response)

     analysisData.value =  response.aiAnalysis
     analysisTimestamp.value = response.timestamp
  } catch (err) {
    error.value = err instanceof Error ? err.message : '分析失败'
    console.error('获取分析结果失败:', err)
  } finally {
    loading.value = false
  }
}

// 解析 Markdown 内容
const parsedAnalysis = computed(() => {
  return parseAnalysisMarkdown(analysisData.value)
})

const formatTime = (fullTime: string) => {
  if (!fullTime) return ''
  const parts = fullTime.split(' ')
  return formatMatchTime(parts[0] || '', parts[1] || '')
}

const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 复制小程序名称
const copyMiniProgramName = () => {
  const miniProgramName = 'AI足球智能体'
  navigator.clipboard.writeText(miniProgramName).then(() => {
    alert(`小程序名称「${miniProgramName}」已复制到剪贴板！\n\n请打开微信搜索进入小程序查看完整分析`)
  }).catch(() => {
    alert('请在微信中搜索「AI足球智能体」小程序')
  })
}

// 处理二维码加载错误
const handleQrcodeError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
  const container = target.parentElement
  if (container) {
    const placeholder = document.createElement('div')
    placeholder.className = 'qrcode-error'
    placeholder.innerHTML = '<p>请在微信中搜索</p><p><strong>AI足球智能体</strong></p>'
    container.appendChild(placeholder)
  }
}

// 监听 match 变化
watch(() => props.match, (newMatch) => {
  if (newMatch) {
    matchInfo.value = { ...newMatch }
    fetchAnalysis() // 这里可以调用，因为 fetchAnalysis 已经定义了
  }
}, { immediate: true })

// 初始化时可以调用 fetchAnalysis，因为函数已经定义了
onMounted(() => {
  // 这里不需要再调用 fetchAnalysis，因为 watch 的 immediate: true 已经处理了
  // 但如果需要，可以在这里调用
  if (props.match) {
    matchInfo.value = { ...props.match }
  }
})
</script>

<style scoped>
.match-analysis-drawer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.match-header-info {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e8e8e8;
}

.match-header-info h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.match-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 14px;
}

.league {
  padding: 2px 8px;
  background: #1890ff;
  color: white;
  border-radius: 12px;
  font-weight: 500;
}

.match-time {
  color: #666;
}

.match-num {
  color: #999;
  font-size: 13px;
}

/* Markdown 容器包装 */
.markdown-wrapper {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.markdown-container {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
}

.markdown-container.blurred {
  filter: blur(6px);
  pointer-events: none;
  user-select: none;
}

/* Drawer 模糊遮罩层 */
.drawer-blur-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.unlock-box {
  text-align: center;
  padding: 32px 20px;
  max-width: 400px;
}

.unlock-icon-drawer {
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.unlock-box h4 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.unlock-tip {
  margin: 0 0 24px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.mini-qrcode-wrapper {
  margin-bottom: 20px;
}

.drawer-qrcode {
  width: 150px;
  height: 150px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(82, 196, 26, 0.2);
  border: 3px solid white;
  transition: all 0.3s ease;
}

.drawer-qrcode:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 28px rgba(82, 196, 26, 0.3);
}

.qrcode-error {
  width: 150px;
  height: 150px;
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 3px solid white;
  box-shadow: 0 8px 20px rgba(82, 196, 26, 0.2);
  margin: 0 auto;
}

.qrcode-error p {
  margin: 4px 0;
  color: #2e7d32;
  font-size: 13px;
}

.qrcode-error strong {
  font-size: 15px;
  color: #1b5e20;
}

.scan-hint {
  margin-top: 10px;
  font-size: 13px;
  color: #52C41A;
  font-weight: 500;
}

.search-method {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.or-text {
  font-size: 13px;
  color: #999;
}

.mini-tag {
  display: inline-block;
  padding: 10px 24px;
  background: linear-gradient(135deg, #52C41A 0%, #3da914 100%);
  color: white;
  font-size: 15px;
  font-weight: 600;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
}

.mini-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(82, 196, 26, 0.4);
}

.mini-tag:active {
  transform: translateY(0);
}

.loading, .error {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error button {
  margin-top: 15px;
  padding: 8px 16px;
  background: #f5222d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.error button:hover {
  background: #d9363e;
}

.analysis-meta {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.meta-section {
  margin-bottom: 20px;
}

.meta-section:last-child {
  margin-bottom: 0;
}

.meta-section h4 {
  color: #333;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 600;
}

.meta-section p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.prediction-highlight {
  color: #1890ff;
  font-weight: bold;
  font-size: 16px;
  padding: 8px 16px;
  background: #e6f7ff;
  border-radius: 6px;
  display: inline-block;
}

.key-points {
  list-style: none;
  padding: 0;
  margin: 0;
}

.key-points li {
  padding: 8px 0;
  color: #666;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  align-items: flex-start;
}

.key-points li:before {
  content: "•";
  color: #1890ff;
  font-weight: bold;
  margin-right: 10px;
  flex-shrink: 0;
}

.key-points li:last-child {
  border-bottom: none;
}

</style>