<template>
  <div class="match-analysis">
    <div class="analysis-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h2>比赛分析</h2>
      <div class="match-info">
        <span>{{ matchInfo.homeTeam }} vs {{ matchInfo.awayTeam }}</span>
        <span class="league">{{ matchInfo.league }}</span>
      </div>
      <div class="match-time" v-if="matchInfo.fullMatchTime">
        {{ formatTime(matchInfo.fullMatchTime) }}
      </div>
    </div>

    <div v-if="loading" class="loading">
      <p>正在分析比赛数据...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>分析失败: {{ error }}</p>
      <button @click="fetchAnalysis">重试</button>
    </div>

    <div v-else-if="analysisData" class="analysis-content">
      <!-- 渲染 Markdown 内容 -->
      <MarkdownViewer :content="analysisData" class="analysis-markdown" />
      
      <!-- 分析元信息 -->
      <!-- <div v-if="parsedAnalysis.summary" class="analysis-meta">
        <div class="meta-section">
          <h4>分析摘要</h4>
          <p>{{ parsedAnalysis.summary }}</p>
        </div>
        
        <div v-if="parsedAnalysis.prediction" class="meta-section">
          <h4>预测结果</h4>
          <p class="prediction-highlight">{{ parsedAnalysis.prediction }}</p>
        </div>
        
        <div v-if="parsedAnalysis.keyPoints.length > 0" class="meta-section">
          <h4>关键要点</h4>
          <ul class="key-points">
            <li v-for="(point, index) in parsedAnalysis.keyPoints" :key="index">
              {{ point }}
            </li>
          </ul>
        </div>
      </div> -->
      
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { matchApi } from '@/api/match'
import type { Match } from '@/types/match'
import { formatMatchTime } from '@/utils/dateUtils'
import { parseAnalysisMarkdown } from '@/utils/markdownUtils'
import MarkdownViewer from '@/components/common/MarkdownViewer.vue'

interface Props {
  matchId: string | number
}

const props = defineProps<Props>()

const router = useRouter()
const loading = ref(false)
const error = ref('')
const matchInfo = ref<Partial<Match>>({})
const analysisData = ref<string>('')
const analysisTimestamp = ref<number>(0)

const fetchMatchInfo = async () => {
  try {
    const data = await matchApi.getMatchDetail(Number(props.matchId))
    matchInfo.value = data
  } catch (err) {
    console.error('获取比赛详情失败:', err)
  }
}

const fetchAnalysis = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await matchApi.getMatchAnalysis(Number(props.matchId))
    
    // 根据后端返回的数据结构处理
    if (typeof response === 'string') {
      analysisData.value = response
    } else if (response && typeof response === 'object') {
      // 如果返回的是对象，提取 markdown 内容
      if (response.data && typeof response.data === 'string') {
        analysisData.value = response.data
      } else if (typeof response === 'string') {
        analysisData.value = response
      }
      
      // 如果有时间戳
      if (response.timestamp) {
        analysisTimestamp.value = response.timestamp
      }
    }
    
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

const goBack = () => {
  router.back()
}

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

onMounted(() => {
  fetchMatchInfo()
  fetchAnalysis()
})
</script>

<style scoped>
.match-analysis {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.analysis-header {
  margin-bottom: 30px;
  text-align: center;
  position: relative;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.back-btn {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: #667eea;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  padding: 8px 16px;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: #5a6fd8;
  transform: translateY(-50%) translateX(-4px);
}

.match-info {
  margin: 10px 0;
  color: #333;
  font-size: 18px;
}

.league {
  margin-left: 10px;
  padding: 4px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.match-time {
  color: #666;
  font-size: 14px;
  margin-top: 5px;
}

.loading, .error {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 12px;
  margin-top: 20px;
  color: #666;
}

.error button {
  margin-top: 15px;
  padding: 10px 20px;
  background: #f5222d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.error button:hover {
  background: #d9363e;
}

.analysis-content {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
}

.analysis-markdown {
  margin-bottom: 30px;
  padding-bottom: 30px;
  border-bottom: 1px solid #eaeaea;
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
  font-size: 18px;
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
}

.update-time {
  color: #999;
  font-size: 14px;
  margin: 0;
}

.copy-btn {
  padding: 8px 20px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.copy-btn:hover {
  background: #3da914;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .match-analysis {
    padding: 10px;
  }
  
  .analysis-header {
    padding: 15px;
  }
  
  .back-btn {
    position: relative;
    left: 0;
    top: 0;
    transform: none;
    margin-bottom: 15px;
  }
  
  .analysis-content {
    padding: 15px;
  }
  
  .analysis-footer {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
}
</style>