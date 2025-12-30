<template>
  <div class="tool-view">
    <div class="header">
      <h2>数据同步工具</h2>
      <p>点击按钮触发对应的数据同步</p>
    </div>

    <div class="sync-buttons">
      <div class="sync-section">
        <h3>基础数据同步</h3>
        <div class="button-group">
          <button 
            class="sync-button" 
            :class="{ loading: loadingState.match }"
            @click="syncMatchData"
            :disabled="loadingState.match"
          >
            <span v-if="loadingState.match">同步中...</span>
            <span v-else>同步比赛信息</span>
          </button>
          
          <button 
            class="sync-button" 
            :class="{ loading: loadingState.hadlist }"
            @click="syncHadListData"
            :disabled="loadingState.hadlist"
          >
            <span v-if="loadingState.hadlist">同步中...</span>
            <span v-else>同步赔率信息</span>
          </button>
          
          <button 
            class="sync-button" 
            :class="{ loading: loadingState.similar }"
            @click="syncSimilarMatchData"
            :disabled="loadingState.similar"
          >
            <span v-if="loadingState.similar">同步中...</span>
            <span v-else>同步同奖信息</span>
          </button>
        </div>
      </div>

      <div class="sync-section">
        <h3>比赛数据同步</h3>
        <div class="button-group">
          <button 
            class="sync-button" 
            :class="{ loading: loadingState.history }"
            @click="syncHistoryMatchData"
            :disabled="loadingState.history"
          >
            <span v-if="loadingState.history">同步中...</span>
            <span v-else>同步历史交锋</span>
          </button>
          
          <button 
            class="sync-button" 
            :class="{ loading: loadingState.result }"
            @click="syncMatchResultData"
            :disabled="loadingState.result"
          >
            <span v-if="loadingState.result">同步中...</span>
            <span v-else>同步比赛结果</span>
          </button>
          
          <button 
            class="sync-button" 
            :class="{ loading: loadingState.analysis }"
            @click="afterMatchAnalysisData"
            :disabled="loadingState.analysis"
          >
            <span v-if="loadingState.analysis">同步中...</span>
            <span v-else>赛后复盘分析</span>
          </button>
        </div>
      </div>

      <div class="sync-section">
        <h3>批量操作</h3>
        <div class="button-group">
          <button 
            class="sync-button batch-button" 
            :class="{ loading: loadingState.all }"
            @click="syncAllData"
            :disabled="loadingState.all"
          >
            <span v-if="loadingState.all">批量同步中...</span>
            <span v-else>一键同步所有数据</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 结果展示 -->
    <div class="result-section" v-if="results.length > 0">
      <h3>同步结果</h3>
      <div class="result-list">
        <div 
          v-for="(result, index) in results" 
          :key="index"
          class="result-item"
          :class="result.status"
        >
          <div class="result-content">
            <span class="result-time">{{ formatTime(result.time) }}</span>
            <span class="result-action">{{ result.action }}</span>
            <span class="result-status">{{ result.status === 'success' ? '✅' : '❌' }}</span>
            <span class="result-message">{{ result.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { syncApi } from '@/api/sync'

// 加载状态
const loadingState = reactive({
  match: false,
  hadlist: false,
  similar: false,
  history: false,
  result: false,
  analysis: false,
  all: false
})

// 结果列表
const results = ref([])

// 同步函数封装
const executeSync = async (taskName, apiFunction, actionName) => {
  loadingState[taskName] = true
  
  try {
    const response = await apiFunction()
    const result = response
    
    if (result) {
      addResult(actionName, 'success', result.message || '同步成功')
    } else {
      addResult(actionName, 'error', result.message || '同步失败')
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || '请求失败'
    addResult(actionName, 'error', errorMsg)
  } finally {
    loadingState[taskName] = false
  }
}

// 同步比赛信息
const syncMatchData = () => {
  executeSync('match', syncApi.syncMatchData, '同步比赛信息')
}

// 同步赔率信息
const syncHadListData = () => {
  executeSync('hadlist', syncApi.syncHadListData, '同步赔率信息')
}

// 同步同奖信息
const syncSimilarMatchData = () => {
  executeSync('similar', syncApi.syncSimilarMatchData, '同步同奖信息')
}

// 同步历史交锋信息
const syncHistoryMatchData = () => {
  executeSync('history', syncApi.syncHistoryMatchData, '同步历史交锋')
}

// 同步比赛结果信息
const syncMatchResultData = () => {
  executeSync('result', syncApi.syncMatchResultData, '同步比赛结果')
}

// 赛后复盘分析
const afterMatchAnalysisData = () => {
  executeSync('analysis', syncApi.afterMatchAnalysisData, '赛后复盘分析')
}

// 批量同步所有数据
const syncAllData = async () => {
  if (loadingState.all) return
  
  loadingState.all = true
  
  try {
    const response = await syncApi.syncAllData()
    const result = response.data || response
    
    if (result.success) {
      addResult('批量同步所有数据', 'success', result.message || '批量同步成功')
    } else {
      addResult('批量同步所有数据', 'error', result.message || '批量同步失败')
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || '批量同步请求失败'
    addResult('批量同步所有数据', 'error', errorMsg)
  } finally {
    loadingState.all = false
  }
}

// 添加结果记录
const addResult = (action, status, message) => {
  results.value.unshift({
    time: new Date(),
    action,
    status,
    message
  })
  
  // 只保留最近10条记录
  if (results.value.length > 10) {
    results.value = results.value.slice(0, 10)
  }
}

// 格式化时间
const formatTime = (date) => {
  const d = new Date(date)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.tool-view {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
}

.header p {
  color: #666;
  font-size: 14px;
}

.sync-section {
  margin-bottom: 30px;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.sync-section h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.button-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.sync-button {
  padding: 12px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
}

.sync-button:hover:not(:disabled) {
  background: #40a9ff;
  transform: translateY(-1px);
}

.sync-button:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
  transform: none;
}

.sync-button.loading {
  background: #1890ff;
  opacity: 0.7;
}

.batch-button {
  background: #52c41a;
}

.batch-button:hover:not(:disabled) {
  background: #73d13d;
}

.batch-button.loading {
  background: #52c41a;
}

.result-section {
  margin-top: 30px;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.result-section h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
}

.result-list {
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  background: white;
  border-left: 4px solid #ccc;
}

.result-item.success {
  border-left-color: #52c41a;
  background: #f6ffed;
}

.result-item.error {
  border-left-color: #ff4d4f;
  background: #fff2f0;
}

.result-content {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.result-time {
  color: #999;
  min-width: 70px;
}

.result-action {
  color: #333;
  font-weight: 500;
  flex: 1;
}

.result-status {
  font-size: 14px;
}

.result-message {
  color: #666;
  flex: 2;
}

@media (max-width: 768px) {
  .tool-view {
    padding: 12px;
  }
  
  .button-group {
    grid-template-columns: 1fr;
  }
  
  .result-content {
    flex-wrap: wrap;
  }
}
</style>