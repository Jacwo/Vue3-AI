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

      <!-- 渲染 Markdown 内容 -->
      <div class="markdown-container">
        <MarkdownViewer :content="analysisData" />
      </div>
      
    
      
      <div class="analysis-footer">
        <p class="update-time" v-if="analysisTimestamp">
          分析时间: {{ formatTimestamp(analysisTimestamp) }}
        </p>
        <button class="copy-btn" @click="copyAnalysis">
          复制分析结果
        </button>
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
    const response = await matchApi.getMatchAnalysis(props.match.id)
    console.log(response)
     analysisData.value = response.aiAnalysis
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
  return formatMatchTime(fullTime.split(' ')[0], fullTime.split(' ')[1] || '')
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

const copyAnalysis = async () => {
  try {
    await navigator.clipboard.writeText(analysisData.value)
    alert('分析结果已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败，请手动复制')
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

.markdown-container {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
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

.analysis-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid #eaeaea;
  flex-shrink: 0;
}

.update-time {
  color: #999;
  font-size: 14px;
  margin: 0;
}

.copy-btn {
  padding: 8px 16px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: #3da914;
}
</style>