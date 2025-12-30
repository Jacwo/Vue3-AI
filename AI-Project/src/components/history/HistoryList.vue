<template>
  <div class="history-list">
    <div class="list-header">
      <h2>历史分析记录</h2>
      <div class="header-actions">
        <div class="search-box">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索比赛、球队或分析内容..."
            @input="onSearch"
            class="search-input"
          />
          <button class="search-btn" @click="refreshHistory">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </button>
        </div>
        <div class="filter-controls">
          <select v-model="filters.resultType" @change="applyFilters" class="filter-select">
            <option value="all">所有结果</option>
            <option value="home">主胜</option>
            <option value="away">客胜</option>
            <option value="draw">平局</option>
          </select>
          <button @click="exportHistory" class="export-btn" :disabled="loading">
            导出
          </button>
          <button @click="refreshHistory" :disabled="loading" class="refresh-btn">
            {{ loading ? '加载中...' : '刷新' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div v-if="stats && !loading" class="stats-cards">
      <div class="stat-card total">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">总记录数</div>
      </div>
      <div class="stat-card home-win">
        <div class="stat-value">{{ stats.homeWins }} <span class="stat-percent">{{ stats.homeWinRate.toFixed(1) }}%</span></div>
        <div class="stat-label">主胜</div>
      </div>
      <div class="stat-card draw">
        <div class="stat-value">{{ stats.draws }} <span class="stat-percent">{{ stats.drawRate.toFixed(1) }}%</span></div>
        <div class="stat-label">平局</div>
      </div>
      <div class="stat-card away-win">
        <div class="stat-value">{{ stats.awayWins }} <span class="stat-percent">{{ stats.awayWinRate.toFixed(1) }}%</span></div>
        <div class="stat-label">客胜</div>
      </div>
      <div class="stat-card accuracy">
        <div class="stat-value">{{ stats.aiAccuracy.toFixed(1) }}%</div>
        <div class="stat-label">AI准确率</div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>加载历史记录中...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>加载失败: {{ error }}</p>
      <button @click="refreshHistory">重试</button>
    </div>

    <div v-else-if="!filteredRecords || filteredRecords.length === 0" class="no-records">
      <p v-if="searchKeyword">没有找到匹配的记录</p>
      <p v-else>暂无历史记录</p>
      <button @click="refreshHistory" class="refresh-btn">刷新</button>
    </div>

    <div v-else class="records-container">
      <div class="records-header">
        <div class="records-count">
          共 {{ paginatedRecords.length }} 条记录，当前第 {{ currentPage }} 页
        </div>
        <div class="pagination-controls">
          <select v-model="pageSize" @change="onPageSizeChange" class="page-size-select">
            <option value="10">10 条/页</option>
            <option value="20">20 条/页</option>
            <option value="50">50 条/页</option>
            <option value="100">100 条/页</option>
          </select>
          <div class="pagination">
            <button 
              @click="prevPage" 
              :disabled="currentPage === 1"
              class="page-btn"
            >
              上一页
            </button>
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            <button 
              @click="nextPage" 
              :disabled="currentPage === totalPages"
              class="page-btn"
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      <div class="records-list">
        <HistoryCard
          v-for="record in paginatedRecords"
          :key="record.id"
          :record="record"
          @view-detail="onViewDetail"
          @delete="onDeleteRecord"
        />
      </div>

      <div class="records-footer">
        <div class="batch-actions" v-if="selectedRecords.length > 0">
          <span>已选择 {{ selectedRecords.length }} 条记录</span>
          <button @click="deleteSelected" class="batch-delete-btn">
            批量删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { historyApi } from '@/api/history'
import type { HistoryRecord } from '@/types/history'
import { filterHistoryRecords, calculateHistoryStats } from '@/utils/historyUtils'
import HistoryCard from './HistoryCard.vue'

// Props 和 Emits
const emit = defineEmits<{
  'view-detail': [id: string]
}>()

// 响应式数据
const historyRecords = ref<HistoryRecord[]>([])
const loading = ref(false)
const error = ref<string>('')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const selectedRecords = ref<string[]>([])
const filters = ref({
  resultType: 'all' as 'all' | 'home' | 'away' | 'draw',
  startDate: '',
  endDate: '',
  teamName: ''
})

// 计算属性
const stats = computed(() => {
  return calculateHistoryStats(historyRecords.value)
})

const filteredRecords = computed(() => {
  return filterHistoryRecords(historyRecords.value, {
    teamName: filters.value.teamName,
    startDate: filters.value.startDate,
    endDate: filters.value.endDate,
    resultType: filters.value.resultType,
    searchKeyword: searchKeyword.value
  })
})

const totalPages = computed(() => {
  return Math.ceil(filteredRecords.value.length / pageSize.value)
})

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRecords.value.slice(start, end)
})

// 方法
const fetchHistory = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await historyApi.getHistoryList({
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      searchKeyword: searchKeyword.value,
      matchResult: filters.value.resultType === 'all' ? undefined : filters.value.resultType,
      startDate: filters.value.startDate,
      endDate: filters.value.endDate,
      teamName: filters.value.teamName
    })
    
    historyRecords.value = response.list || []
    console.log('获取到的历史记录:', historyRecords.value)
    
    if (historyRecords.value.length === 0 && searchKeyword.value) {
      error.value = '没有找到匹配的记录'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败'
    console.error('获取历史记录失败:', err)
    historyRecords.value = []
  } finally {
    loading.value = false
  }
}

const refreshHistory = () => {
  currentPage.value = 1
  fetchHistory()
}

const onSearch = () => {
  currentPage.value = 1
  fetchHistory()
}

const applyFilters = () => {
  currentPage.value = 1
  fetchHistory()
}

const onPageSizeChange = () => {
  currentPage.value = 1
  fetchHistory()
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const onViewDetail = (id: string) => {
  emit('view-detail', id)
}

const onDeleteRecord = async (id: string) => {
  if (confirm('确定要删除这条记录吗？')) {
    try {
      await historyApi.deleteHistory(id)
      // 从列表中移除
      historyRecords.value = historyRecords.value.filter(record => record.id !== id)
      // 从选中列表中移除
      selectedRecords.value = selectedRecords.value.filter(selectedId => selectedId !== id)
    } catch (err) {
      console.error('删除记录失败:', err)
      alert('删除失败')
    }
  }
}

const deleteSelected = async () => {
  if (selectedRecords.value.length === 0) return
  
  if (confirm(`确定要删除选中的 ${selectedRecords.value.length} 条记录吗？`)) {
    try {
      await historyApi.deleteBatchHistory(selectedRecords.value)
      // 从列表中移除
      historyRecords.value = historyRecords.value.filter(
        record => !selectedRecords.value.includes(record.id)
      )
      selectedRecords.value = []
    } catch (err) {
      console.error('批量删除失败:', err)
      alert('批量删除失败')
    }
  }
}

const exportHistory = async () => {
  try {
    const blob = await historyApi.exportHistory({
      searchKeyword: searchKeyword.value,
      matchResult: filters.value.resultType === 'all' ? undefined : filters.value.resultType
    })
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `历史分析记录_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('导出失败:', err)
    alert('导出失败')
  }
}

onMounted(() => {
  fetchHistory()
})
</script>

<style scoped>
.history-list {
  padding: 24px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.list-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.3s;
}

.search-box:focus-within {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.search-input {
  padding: 8px 12px;
  border: none;
  outline: none;
  flex: 1;
  min-width: 200px;
  font-size: 14px;
}

.search-btn {
  padding: 8px 12px;
  background: #fafafa;
  border: none;
  border-left: 1px solid #d9d9d9;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.search-btn:hover {
  background: #f0f0f0;
  color: #1890ff;
}

.filter-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  color: #333;
  outline: none;
  cursor: pointer;
  transition: border-color 0.3s;
}

.filter-select:hover {
  border-color: #1890ff;
}

.export-btn, .refresh-btn {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn:hover, .refresh-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.export-btn:disabled, .refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  text-align: center;
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-card.total {
  border-top: 4px solid #1890ff;
}

.stat-card.home-win {
  border-top: 4px solid #1890ff;
}

.stat-card.draw {
  border-top: 4px solid #fa8c16;
}

.stat-card.away-win {
  border-top: 4px solid #52c41a;
}

.stat-card.accuracy {
  border-top: 4px solid #722ed1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.stat-percent {
  font-size: 14px;
  color: #666;
  font-weight: normal;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 60px 20px;
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

.error {
  text-align: center;
  padding: 60px 20px;
  color: #f5222d;
}

.error button {
  margin-top: 16px;
  padding: 8px 20px;
  background: #f5222d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.no-records {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.no-records .refresh-btn {
  margin-top: 16px;
  padding: 8px 20px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

/* 记录列表 */
.records-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.records-count {
  color: #666;
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-size-select {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  font-size: 14px;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: #1890ff;
  color: #1890ff;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}

.records-list {
  margin-bottom: 24px;
}

.records-footer {
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.batch-delete-btn {
  padding: 8px 20px;
  background: #fff2f0;
  color: #f5222d;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.batch-delete-btn:hover {
  background: #ffccc7;
}

@media (max-width: 768px) {
  .history-list {
    padding: 16px;
  }
  
  .list-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    width: 100%;
  }
  
  .filter-controls {
    flex-wrap: wrap;
  }
  
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .records-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .pagination-controls {
    flex-direction: column;
    gap: 12px;
  }
}
</style>