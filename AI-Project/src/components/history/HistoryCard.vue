<template>
  <div class="history-card" :class="{ 'accuracy-correct': isPredictionCorrect, 'accuracy-incorrect': !isPredictionCorrect && aiPrediction }">
    <div class="card-header">
      <div class="match-info">
        <span class="teams">{{ record.homeTeam }} vs {{ record.awayTeam }}</span>
        <span class="match-time">{{ formatMatchTime(record.matchTime) }}</span>
      </div>
      <div class="result-info">
        <span class="match-result" :class="getResultClass(parsedResult.winner)">
          {{ parsedResult.resultText }}
        </span>
        <span v-if="aiPrediction" class="prediction-accuracy" :class="isPredictionCorrect ? 'correct' : 'incorrect'">
          {{ isPredictionCorrect ? '✅ 预测正确' : '❌ 预测错误' }}
        </span>
      </div>
    </div>
    
    <div class="card-content">
      <div class="odds-section">
        <div class="odds-row">
          <span class="odds-label">主胜:</span>
          <span class="odds-value" :style="{ color: getOddsColor(record.homeWin) }">
            {{ formatOdds(record.homeWin) }}
          </span>
          <span class="odds-label">平:</span>
          <span class="odds-value" :style="{ color: getOddsColor(record.draw) }">
            {{ formatOdds(record.draw) }}
          </span>
          <span class="odds-label">客胜:</span>
          <span class="odds-value" :style="{ color: getOddsColor(record.awayWin) }">
            {{ formatOdds(record.awayWin) }}
          </span>
        </div>
      </div>
      
      <div class="analysis-section">
        <div class="analysis-preview">
          <h4>AI预测分析</h4>
          <div class="markdown-preview" v-html="aiAnalysisPreview"></div>
          <button class="view-detail-btn" @click="emit('view-detail', record.matchId)">
            查看详情 →
          </button>
        </div>
      </div>
    </div>
    
    <div class="card-footer">
      <span class="create-time">记录时间: {{ formatCreateTime(record.createTime) }}</span>
      <div class="actions">
        <button class="action-btn view-btn" @click="emit('view-detail', record.matchId)">
          查看
        </button>
        <button class="action-btn delete-btn" @click="emit('delete', record.matchId)">
          删除
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HistoryRecord } from '@/types/history'
import { formatHistoryMatchTime, parseMatchResult, checkAnalysisAccuracy, getHistoryOddsColor } from '@/utils/historyUtils'
import { renderMarkdown, extractSummary } from '@/utils/markdownUtils'

interface Props {
  record: HistoryRecord
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'view-detail': [id: string]
  'delete': [id: string]
}>()

// 解析比赛结果
const parsedResult = computed(() => {
  return parseMatchResult(props.record.matchResult)
})

// 检查AI预测准确性
const accuracyInfo = computed(() => {
  return checkAnalysisAccuracy(props.record)
})

const aiPrediction = computed(() => accuracyInfo.value.aiPrediction)
const isPredictionCorrect = computed(() => accuracyInfo.value.isCorrect)

// AI分析预览
const aiAnalysisPreview = computed(() => {
  if (!props.record.aiAnalysis) return '<p>暂无分析</p>'
  const summary = extractSummary(props.record.aiAnalysis, 100)
  return renderMarkdown(summary)
})

// 方法
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

const formatCreateTime = (createTime: string | Date): string => {
  if (!createTime) return '未知'
  
  try {
    const date = typeof createTime === 'string' ? new Date(createTime) : createTime
    return date.toLocaleDateString('zh-CN')
  } catch (error) {
    return String(createTime)
  }
}
</script>

<style scoped>
.history-card {
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 20px;
  background: white;
  transition: all 0.3s ease;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.history-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.history-card.accuracy-correct {
  border-left: 4px solid #52c41a;
}

.history-card.accuracy-incorrect {
  border-left: 4px solid #f5222d;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.match-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.teams {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.match-time {
  font-size: 13px;
  color: #666;
}

.result-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.match-result {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.match-result.result-home-win {
  background-color: #e6f7ff;
  color: #1890ff;
}

.match-result.result-away-win {
  background-color: #f6ffed;
  color: #52c41a;
}

.match-result.result-draw {
  background-color: #fff7e6;
  color: #fa8c16;
}

.prediction-accuracy {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.prediction-accuracy.correct {
  background-color: #f6ffed;
  color: #52c41a;
}

.prediction-accuracy.incorrect {
  background-color: #fff2f0;
  color: #f5222d;
}

.card-content {
  margin-bottom: 16px;
}

.odds-section {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #fafafa;
  border-radius: 8px;
}

.odds-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 16px;
}

.odds-label {
  font-size: 13px;
  color: #666;
}

.odds-value {
  font-size: 16px;
  font-weight: 600;
  min-width: 40px;
  text-align: center;
}

.analysis-section {
  margin-top: 16px;
}

.analysis-preview {
  position: relative;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.analysis-preview h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 15px;
}

.markdown-preview {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  max-height: 60px;
  overflow: hidden;
  position: relative;
}

.markdown-preview::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: linear-gradient(transparent, #f8f9fa);
}

.view-detail-btn {
  position: absolute;
  right: 16px;
  bottom: 16px;
  background: none;
  border: none;
  color: #1890ff;
  cursor: pointer;
  font-size: 13px;
  padding: 0;
  transition: color 0.2s;
}

.view-detail-btn:hover {
  color: #096dd9;
  text-decoration: underline;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.create-time {
  font-size: 12px;
  color: #999;
}

.actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn {
  background-color: #1890ff;
  color: white;
}

.view-btn:hover {
  background-color: #096dd9;
}

.delete-btn {
  background-color: #fff2f0;
  color: #f5222d;
  border: 1px solid #ffccc7;
}

.delete-btn:hover {
  background-color: #ffccc7;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .result-info {
    align-items: flex-start;
  }
  
  .odds-row {
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 12px;
  }
  
  .card-footer {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>