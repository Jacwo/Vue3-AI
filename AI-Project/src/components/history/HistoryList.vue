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
          <button @click="refreshHistory" :disabled="loading" class="refresh-btn">
            {{ loading ? '加载中...' : '刷新' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 全局统计区域 -->
    <div v-if="globalStats || statsLoading" class="stats-container">
      <!-- 统计头部 -->
      <div class="stats-header">
        <h3 class="stats-title">
          <svg viewBox="0 0 24 24" width="20" height="20" class="stats-icon">
            <path fill="currentColor" d="M16,11V3H8v6H2v12h20V11H16z M10,5h4v14h-4V5z M4,11h4v8H4V11z M20,19h-4v-6h4V19z"/>
          </svg>
          全局统计数据
        </h3>
      </div>

      <!-- 加载状态 -->
      <div v-if="statsLoading" class="stats-loading">
        <div class="mini-spinner"></div>
        <span>加载统计数据...</span>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="statsError" class="stats-error">
        <span>{{ statsError }}</span>
        <button @click="fetchGlobalStats" class="retry-stats-btn">重试</button>
      </div>

      <!-- 统计卡片网格 -->
      <div v-else class="stats-grid">
        <!-- 总记录数 -->
        <div class="stat-card featured total">
          <div class="stat-icon-wrapper blue">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M19,19H5V5h14V19z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ globalStats?.total || 0 }}</div>
            <div class="stat-label">总记录数</div>
          </div>
        </div>

        <!-- 主胜统计 -->
        <div class="stat-card home-win">
          <div class="stat-icon-wrapper blue">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M12,2l-5.5,9h11L12,2z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value-group">
              <span class="stat-value">{{ globalStats?.homeWins || 0 }}</span>
              <span class="stat-percent">{{ calculatePercentage(globalStats?.homeWins, globalStats?.total) }}%</span>
            </div>
            <div class="stat-label">主胜场次</div>
            <div class="stat-progress">
              <div
                class="stat-progress-bar blue"
                :style="{ width: calculatePercentage(globalStats?.homeWins, globalStats?.total) + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- 平局统计 -->
        <div class="stat-card draw">
          <div class="stat-icon-wrapper orange">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M5,13h14v-2H5V13z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value-group">
              <span class="stat-value">{{ globalStats?.draws || 0 }}</span>
              <span class="stat-percent">{{ calculatePercentage(globalStats?.draws, globalStats?.total) }}%</span>
            </div>
            <div class="stat-label">平局场次</div>
            <div class="stat-progress">
              <div
                class="stat-progress-bar orange"
                :style="{ width: calculatePercentage(globalStats?.draws, globalStats?.total) + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- 客胜统计 -->
        <div class="stat-card away-win">
          <div class="stat-icon-wrapper green">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M7,15l5,5l5-5H7z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value-group">
              <span class="stat-value">{{ globalStats?.awayWins || 0 }}</span>
              <span class="stat-percent">{{ calculatePercentage(globalStats?.awayWins, globalStats?.total) }}%</span>
            </div>
            <div class="stat-label">客胜场次</div>
            <div class="stat-progress">
              <div
                class="stat-progress-bar green"
                :style="{ width: calculatePercentage(globalStats?.awayWins, globalStats?.total) + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- AI准确率 -->
        <div class="stat-card featured accuracy">
          <div class="stat-icon-wrapper purple">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M10,17l-5-5l1.41-1.41L10,14.17l7.59-7.59L19,8L10,17z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ (globalStats?.aiAccuracy || 0).toFixed(1) }}%</div>
            <div class="stat-label">AI预测准确率</div>
          </div>
        </div>
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

    <div v-else-if="!historyRecords || historyRecords.length === 0" class="no-records">
      <p v-if="searchKeyword">没有找到匹配的记录</p>
      <p v-else>暂无历史记录</p>
      <button @click="refreshHistory" class="refresh-btn">刷新</button>
    </div>

    <div v-else class="records-container">
      <div class="records-header">
        <div class="records-count">
          共 {{ totalRecords }} 条记录，当前第 {{ currentPage }} 页/共 {{ totalPages }} 页
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
          v-for="record in historyRecords"
          :key="record.id"
          :record="record"
          @view-detail="onViewDetail"
        />
      </div>

      <div v-if="totalPages > 1" class="pagination-footer">
        <div class="pagination">
          <button 
            @click="prevPage" 
            :disabled="currentPage === 1"
            class="page-btn"
          >
            上一页
          </button>
          <span class="page-info">第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { historyApi } from '@/api/history'
import type { HistoryRecord, HistoryListResponse } from '@/types/history'
import { calculateHistoryStats } from '@/utils/historyUtils'
import HistoryCard from './HistoryCard.vue'

// Props 和 Emits
const emit = defineEmits<{
  'view-detail': [id: string]
}>()

// 响应式数据
const historyRecords = ref<HistoryRecord[]>([])
const totalRecords = ref(0) // 新增：总记录数
const loading = ref(false)
const error = ref<string>('')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10) // 默认改为10条每页
const globalStats = ref<ReturnType<typeof calculateHistoryStats> | null>(null) // 全局统计
const statsLoading = ref(false) // 统计加载状态
const statsError = ref<string>('') // 统计错误信息

const filters = ref({
  resultType: 'all' as 'all' | 'home' | 'away' | 'draw',
  startDate: '',
  endDate: '',
  teamName: ''
})

// 计算属性 - 总页数使用后端返回的total计算
const totalPages = computed(() => {
  return Math.ceil(totalRecords.value / pageSize.value)
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

    historyRecords.value = response.data.list || []
    totalRecords.value = response.data.total || 0 // 从后端获取总记录数
    
    console.log('获取到的历史记录:', {
      list: historyRecords.value.length,
      total: totalRecords.value,
      currentPage: currentPage.value,
      pageSize: pageSize.value,
      totalPages: totalPages.value
    })

    if (historyRecords.value.length === 0 && searchKeyword.value) {
      error.value = '没有找到匹配的记录'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败'
    console.error('获取历史记录失败:', err)
    historyRecords.value = []
    totalRecords.value = 0
  } finally {
    loading.value = false
  }
}

// 获取全局统计数据（获取所有记录进行计算）
const fetchGlobalStats = async () => {
  statsLoading.value = true
  statsError.value = ''

  try {
    // 获取所有历史记录（使用大的pageSize）
    const response = await historyApi.getHistoryList({
      pageNo: 1,
      pageSize: 9999, // 获取所有记录
      searchKeyword: searchKeyword.value,
      matchResult: filters.value.resultType === 'all' ? undefined : filters.value.resultType,
      startDate: filters.value.startDate,
      endDate: filters.value.endDate,
      teamName: filters.value.teamName
    })

    const allRecords = response.data.list || []

    // 使用工具函数计算统计数据
    if (allRecords.length > 0) {
      globalStats.value = calculateHistoryStats(allRecords)
    } else {
      globalStats.value = null
    }

    console.log('全局统计数据:', {
      total: allRecords.length,
      stats: globalStats.value
    })
  } catch (err) {
    statsError.value = err instanceof Error ? err.message : '获取统计数据失败'
    console.error('获取统计数据失败:', err)
    globalStats.value = null
  } finally {
    statsLoading.value = false
  }
}

const refreshHistory = async () => {
  currentPage.value = 1
  await Promise.all([
    fetchHistory(),
    fetchGlobalStats()
  ])
}

const onSearch = () => {
  currentPage.value = 1
  fetchHistory()
}

const applyFilters = async () => {
  currentPage.value = 1
  await fetchHistory()
  await fetchGlobalStats()
}

const onPageSizeChange = () => {
  currentPage.value = 1
  fetchHistory()
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchHistory()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchHistory()
  }
}

const onViewDetail = (id: string) => {
  emit('view-detail', id)
}

// 计算百分比
const calculatePercentage = (part: number | undefined, total: number | undefined): string => {
  if (!part || !total || total === 0) return '0.0'
  return ((part / total) * 100).toFixed(1)
}

onMounted(async () => {
  await fetchHistory()
  await fetchGlobalStats()
})
</script>

<style scoped>



/* 样式部分保持不变，只添加底部分页样式 */
.pagination-footer {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: center;
}

.pagination-footer .pagination {
  display: flex;
  align-items: center;
  gap: 12px;
}
.history-list {
  padding: 24px;
  background-color: #f8f9fa;
  min-height: 100vh;
  max-width: 100%;
  overflow-x: hidden;
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

/* 统计容器 */
.stats-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.2);
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.stats-icon {
  color: rgba(255, 255, 255, 0.9);
}

/* 统计加载和错误状态 */
.stats-loading,
.stats-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: white;
  font-size: 14px;
  text-align: center;
  flex-wrap: wrap;
}

.mini-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.retry-stats-btn {
  padding: 6px 16px;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.retry-stats-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

/* 统计卡片 */
.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, currentColor, transparent);
  opacity: 0;
  transition: opacity 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-card:hover::before {
  opacity: 1;
}

/* 移动端触摸反馈 */
@media (hover: none) {
  .stat-card:active {
    transform: scale(0.98);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }
}

/* 突出显示的卡片 */
.stat-card.featured {
  grid-column: span 2;
  background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%);
}

/* 图标包装器 */
.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s;
}

.stat-card:hover .stat-icon-wrapper {
  transform: scale(1.1) rotate(5deg);
}

.stat-icon-wrapper.blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-icon-wrapper.orange {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.stat-icon-wrapper.green {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.stat-icon-wrapper.purple {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #764ba2;
}

/* 统计内容 */
.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value-group {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  line-height: 1;
}

.stat-card.featured .stat-value {
  font-size: 40px;
}

.stat-percent {
  font-size: 16px;
  color: #666;
  font-weight: 500;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-detail {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

/* 进度条 */
.stat-progress {
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 8px;
}

.stat-progress-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}

.stat-progress-bar.blue {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.stat-progress-bar.orange {
  background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
}

.stat-progress-bar.green {
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
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
  padding: 2px;
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
  display: flex;
  flex-direction: column;
  gap: 0;
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
    padding: 12px;
  }

  .list-header {
    flex-direction: column;
    align-items: stretch;
    margin-bottom: 16px;
  }

  .list-header h2 {
    font-size: 20px;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .search-box {
    width: 100%;
  }

  .search-input {
    font-size: 16px; /* 防止 iOS Safari 自动缩放 */
  }

  .filter-controls {
    flex-direction: column;
    width: 100%;
  }

  .filter-select {
    width: 100%;
  }

  .stats-container {
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 16px;
  }

  .stats-header {
    margin-bottom: 16px;
  }

  .stats-title {
    font-size: 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
    gap: 12px;
  }

  .stat-card.featured {
    grid-column: span 1;
  }

  .stat-icon-wrapper {
    width: 44px;
    height: 44px;
  }

  .stat-value {
    font-size: 28px;
  }

  .stat-card.featured .stat-value {
    font-size: 32px;
  }

  .stat-percent {
    font-size: 14px;
  }

  .stat-label {
    font-size: 13px;
  }

  /* 记录列表优化 */
  .records-container {
    padding: 12px;
    border-radius: 8px;
  }

  .records-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    margin-bottom: 16px;
  }

  .records-count {
    font-size: 13px;
    text-align: center;
  }

  .pagination-controls {
    flex-direction: column;
    gap: 12px;
  }

  .page-size-select {
    width: 100%;
  }

  .pagination {
    justify-content: center;
    width: 100%;
  }

  .page-btn {
    flex: 1;
    max-width: 120px;
  }

  .pagination-footer {
    margin-top: 16px;
    padding-top: 16px;
  }
}

@media (max-width: 480px) {
  .history-list {
    padding: 8px;
  }

  .list-header h2 {
    font-size: 18px;
  }

  .stats-container {
    padding: 12px;
  }

  .stats-title {
    font-size: 15px;
  }

  .stats-grid {
    gap: 10px;
  }

  .stat-card {
    padding: 12px;
    gap: 10px;
  }

  .stat-icon-wrapper {
    width: 40px;
    height: 40px;
  }

  .stat-value {
    font-size: 24px;
  }

  .stat-card.featured .stat-value {
    font-size: 28px;
  }

  .stat-percent {
    font-size: 13px;
  }

  .stat-label {
    font-size: 12px;
  }

  .records-container {
    padding: 8px;
  }

  .filter-select,
  .page-size-select {
    font-size: 14px;
    padding: 8px 10px;
  }

  .page-btn {
    font-size: 13px;
    padding: 8px 12px;
  }

  .page-info {
    font-size: 13px;
  }

  /* 移动端触摸优化 */
  .refresh-btn,
  .page-btn,
  .retry-stats-btn {
    min-height: 44px; /* iOS 推荐的最小触摸目标 */
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
  }

  /* 优化加载状态 */
  .stats-loading,
  .stats-error {
    padding: 30px 16px;
    font-size: 13px;
  }

  .loading {
    padding: 40px 16px;
  }

  .no-records {
    padding: 40px 16px;
    font-size: 14px;
  }
}

/* 横屏优化 */
@media (max-width: 768px) and (orientation: landscape) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-card.featured {
    grid-column: span 1;
  }
}
</style>