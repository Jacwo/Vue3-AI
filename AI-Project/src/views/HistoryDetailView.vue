<template>
  <div class="history-detail">
    <div class="detail-header">
      <button class="back-btn" @click="goBack">← 返回列表</button>
      <h2>历史记录详情</h2>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>加载记录详情中...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>加载失败: {{ error }}</p>
      <button @click="fetchDetail">重试</button>
    </div>

    <div v-else-if="record" class="detail-content">
      <!-- 比赛基本信息 -->
      <div class="match-basic-info">
        <div class="match-header">
          <h3>{{ record.homeTeam }} vs {{ record.awayTeam }}</h3>
          <div class="match-meta">
            <span class="match-time">{{ formatMatchTime(record.matchTime) }}</span>
            <span class="match-id">比赛ID: {{ record.matchId }}</span>
            <span class="record-id">记录ID: {{ record.id }}</span>
          </div>
        </div>

        <div class="match-result-section">
          <div class="result-display">
            <span class="result-label">比赛结果</span>
            <span class="result-value" :class="getResultClass(parsedResult.winner)">
              {{ parsedResult.resultText }}
            </span>
          </div>
          <div class="odds-display">
            <div class="odds-item">
              <span>主胜:</span>
              <span :style="{ color: getOddsColor(record.homeWin) }">
                {{ formatOdds(record.homeWin) }}
              </span>
            </div>
            <div class="odds-item">
              <span>平:</span>
              <span :style="{ color: getOddsColor(record.draw) }">
                {{ formatOdds(record.draw) }}
              </span>
            </div>
            <div class="odds-item">
              <span>客胜:</span>
              <span :style="{ color: getOddsColor(record.awayWin) }">
                {{ formatOdds(record.awayWin) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- AI分析准确性 -->
      <div class="accuracy-section">
        <h4>AI分析准确性</h4>
        <div class="accuracy-details">
          <div class="accuracy-item">
            <span class="accuracy-label">AI预测:</span>
            <span class="accuracy-value">
              {{ getPredictionText(accuracyInfo.aiPrediction) || '未给出明确预测' }}
              <span v-if="accuracyInfo.confidence > 0" class="confidence">
                (置信度: {{ (accuracyInfo.confidence * 100).toFixed(1) }}%)
              </span>
            </span>
          </div>
          <div class="accuracy-item">
            <span class="accuracy-label">实际结果:</span>
            <span class="accuracy-value">
              {{ getPredictionText(accuracyInfo.actualResult) }}
            </span>
          </div>
          <div class="accuracy-item">
            <span class="accuracy-label">准确性:</span>
            <span class="accuracy-value" :class="accuracyInfo.isCorrect ? 'correct' : 'incorrect'">
              {{ accuracyInfo.resultComparison }}
            </span>
          </div>
        </div>
      </div>

      <!-- AI预测分析 -->
      <div class="analysis-section">
        <h4>AI预测分析</h4>
        <div v-if="record.aiAnalysis" class="analysis-content">
          <MarkdownViewer :content="record.aiAnalysis" />
        </div>
        <div v-else class="no-content">
          <p>暂无AI分析内容</p>
        </div>
      </div>

      <!-- 赛后分析 -->
      <div class="analysis-section">
        <h4>赛后分析</h4>
        <div v-if="record.afterMatchAnalysis" class="analysis-content">
          <MarkdownViewer :content="record.afterMatchAnalysis" />
        </div>
        <div v-else class="no-content">
          <p>暂无赛后分析内容</p>
        </div>
      </div>

      <!-- 元信息 -->
      <div class="meta-section">
        <h4>记录信息</h4>
        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-label">创建时间:</span>
            <span class="meta-value">{{ formatCreateTime(record.createTime) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">记录ID:</span>
            <span class="meta-value">{{ record.id }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">比赛ID:</span>
            <span class="meta-value">{{ record.matchId }}</span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="action-btn print-btn" @click="printDetail">
          打印
        </button>
        <button class="action-btn copy-btn" @click="copyDetail">
          复制内容
        </button>
        <button class="action-btn delete-btn" @click="deleteRecord">
          删除记录
        </button>
      </div>
    </div>

    <div v-else class="no-record">
      <p>未找到对应的历史记录</p>
      <button @click="goBack">返回列表</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { historyApi } from '@/api/history'
import type { HistoryRecord } from '@/types/history'
import { 
  formatHistoryMatchTime, 
  parseMatchResult, 
  checkAnalysisAccuracy, 
  getHistoryOddsColor 
} from '@/utils/historyUtils'
import MarkdownViewer from '@/components/common/MarkdownViewer.vue'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const error = ref('')
const record = ref<HistoryRecord | null>(null)

// 获取记录ID - 修正：应该是 id 而不是 matchId
const recordId = computed(() => {
  return route.params.id as string
})

// 解析比赛结果
const parsedResult = computed(() => {
  if (!record.value) return parseMatchResult('')
  return parseMatchResult(record.value.matchResult)
})

// AI分析准确性
const accuracyInfo = computed(() => {
  if (!record.value) return {
    isCorrect: false,
    aiPrediction: null,
    actualResult: 'draw' as const,
    confidence: 0,
    resultComparison: ''
  }
  return checkAnalysisAccuracy(record.value)
})

const fetchDetail = async () => {
  if (!recordId.value) {
    console.error('未找到记录ID')
    error.value = '未找到记录ID'
    return
  }
  
  console.log('开始获取历史记录详情，ID:', recordId.value)
  loading.value = true
  error.value = ''
  
  try {
    const response = await historyApi.getHistoryDetail(recordId.value)
    console.log('API返回数据:', response)
    
    // 根据实际API响应结构调整
    if (response && response.data) {
      // 如果API返回 { code: 0, data: {...}, message: 'success' }
      record.value = response.data
    } else if (response && typeof response === 'object') {
      // 如果直接返回记录对象
      record.value = response as HistoryRecord
    } else {
      console.error('API返回的数据结构不符合预期:', response)
      error.value = '数据格式错误'
    }
  } catch (err) {
    console.error('获取历史记录详情失败:', err)
    error.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const formatMatchTime = (matchTime: string | Date) => {
  return formatHistoryMatchTime(matchTime)
}

const formatOdds = (odds: string | null): string => {
  if (!odds) return '-'
  return parseFloat(odds).toFixed(2)
}

const getOddsColor = (odds: string | null): string => {
  return getHistoryOddsColor(odds)
}

const getResultClass = (winner: string): string => {
  const classMap: Record<string, string> = {
    'home': 'result-home-win',
    'away': 'result-away-win',
    'draw': 'result-draw'
  }
  return classMap[winner] || ''
}

const getPredictionText = (prediction: string | null): string => {
  const map: Record<string, string> = {
    'home': '主胜',
    'away': '客胜',
    'draw': '平局'
  }
  return prediction ? map[prediction] || prediction : ''
}

const formatCreateTime = (createTime: string | Date): string => {
  if (!createTime) return '未知'
  
  try {
    const date = typeof createTime === 'string' ? new Date(createTime) : createTime
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return String(createTime)
  }
}

const printDetail = () => {
  window.print()
}

const copyDetail = async () => {
  if (!record.value) return
  
  const content = `
比赛: ${record.value.homeTeam} vs ${record.value.awayTeam}
比赛时间: ${formatMatchTime(record.value.matchTime)}
比赛结果: ${parsedResult.value.resultText}

AI预测分析:
${record.value.aiAnalysis}

赛后分析:
${record.value.afterMatchAnalysis}
  `.trim()
  
  try {
    await navigator.clipboard.writeText(content)
    alert('内容已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败，请手动复制')
  }
}

const deleteRecord = async () => {
  if (!record.value || !confirm('确定要删除这条记录吗？')) return
  
  try {
    await historyApi.deleteHistory(record.value.id)
    alert('删除成功')
    router.back()
  } catch (err) {
    console.error('删除记录失败:', err)
    alert('删除失败')
  }
}

onMounted(() => {
  console.log('HistoryDetailView mounted, route params:', route.params)
  fetchDetail()
})
</script>

<style scoped>
.history-detail {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.back-btn {
  background: none;
  border: none;
  color: #1890ff;
  cursor: pointer;
  font-size: 16px;
  padding: 8px;
  margin-right: 16px;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #096dd9;
  text-decoration: underline;
}

.detail-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.loading, .error, .no-record {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  margin: 0 auto 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error button, .no-record button {
  margin-top: 16px;
  padding: 8px 20px;
  background: #f5222d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.no-record button {
  background: #1890ff;
}

.detail-content {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.match-basic-info {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e8e8e8;
}

.match-header {
  margin-bottom: 20px;
}

.match-header h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.match-meta {
  display: flex;
  gap: 16px;
  color: #666;
  font-size: 14px;
}

.match-result-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.result-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-label {
  font-size: 14px;
  color: #666;
}

.result-value {
  font-size: 28px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  display: inline-block;
}

.result-home-win {
  background-color: #e6f7ff;
  color: #1890ff;
}

.result-away-win {
  background-color: #f6ffed;
  color: #52c41a;
}

.result-draw {
  background-color: #fff7e6;
  color: #fa8c16;
}

.odds-display {
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
}

.odds-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #fafafa;
  border-radius: 6px;
}

.odds-item span:first-child {
  color: #666;
  font-size: 14px;
}

.odds-item span:last-child {
  font-size: 18px;
  font-weight: 600;
}

.accuracy-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e8e8e8;
}

.accuracy-section h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.accuracy-details {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.accuracy-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 8px;
}

.accuracy-label {
  min-width: 80px;
  color: #666;
  font-size: 14px;
}

.accuracy-value {
  flex: 1;
  color: #333;
  font-size: 16px;
}

.accuracy-value.correct {
  color: #52c41a;
  font-weight: 600;
}

.accuracy-value.incorrect {
  color: #f5222d;
  font-weight: 600;
}

.confidence {
  font-size: 14px;
  color: #666;
  margin-left: 8px;
}

.analysis-section {
  margin-bottom: 32px;
}

.analysis-section h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.analysis-content {
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.no-content {
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px dashed #e8e8e8;
  text-align: center;
  color: #999;
}

.meta-section {
  margin-bottom: 32px;
}

.meta-section h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 6px;
}

.meta-label {
  font-size: 12px;
  color: #666;
}

.meta-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding-top: 24px;
  border-top: 1px solid #e8e8e8;
}

.action-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.print-btn {
  background: #fafafa;
  color: #333;
  border: 1px solid #d9d9d9;
}

.print-btn:hover {
  background: #f0f0f0;
  border-color: #bfbfbf;
}

.copy-btn {
  background: #1890ff;
  color: white;
}

.copy-btn:hover {
  background: #096dd9;
}

.delete-btn {
  background: #fff2f0;
  color: #f5222d;
  border: 1px solid #ffccc7;
}

.delete-btn:hover {
  background: #ffccc7;
}

@media (max-width: 768px) {
  .history-detail {
    padding: 16px;
  }
  
  .detail-content {
    padding: 20px;
  }
  
  .match-result-section {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .result-value {
    font-size: 24px;
  }
  
  .meta-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>