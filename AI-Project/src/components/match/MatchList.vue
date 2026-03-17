<template>
  <div class="match-list">
    <div class="header">
      <h2>今日比赛</h2>
      <div class="filters">
        <select v-model="selectedLeague" @change="filterMatches">
          <option value="">所有联赛</option>
          <option v-for="league in leagues" :key="league" :value="league">
            {{ league }}
          </option>
        </select>
        <button @click="refreshMatches" :disabled="loading">
          {{ loading ? '加载中...' : '刷新' }}
        </button>
        
        <!-- 移动端简化折叠控制 -->
        <!-- <div class="collapse-controls" v-if="Object.keys(sortedGroups).length > 0">
          <button @click="toggleAllGroups(false)" class="collapse-btn" title="全部展开">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
            </svg>
          </button>
          <button @click="toggleAllGroups(true)" class="collapse-btn" title="全部折叠">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/>
            </svg>
          </button>
        </div> -->
      </div>
    </div>

    <div class="matches-container">
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载比赛数据中...</p>
      </div>

      <div v-else-if="error" class="error">
        <svg viewBox="0 0 24 24" width="24" height="24" style="fill: #ff4d4f; margin-bottom: 8px;">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <p>加载失败: {{ error }}</p>
        <button @click="fetchMatches">重试</button>
      </div>

      <div v-else-if="!matches || matches.length === 0" class="no-matches">
        <svg viewBox="0 0 24 24" width="48" height="48" style="fill: #d9d9d9; margin-bottom: 16px;">
          <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
        </svg>
        <p>暂无比赛数据</p>
      </div>

      <div v-else class="matches-content">
        <!-- 显示按周几分组后的比赛 -->
        <template v-if="groupedMatches && Object.keys(groupedMatches).length > 0">
          <div v-for="(group, day) in sortedGroups" :key="day" class="match-day-group">
            <div class="group-header" @click="toggleGroup(day)">
              <div class="group-header-main">
                <span class="collapse-icon" :class="{ 'collapsed': collapsedGroups[day] }">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                  </svg>
                </span>
                <div class="group-title">
                  <h3>{{ day }}</h3>
                  <div class="group-meta">
                    <span class="match-count">{{ group.length }} 场</span>
                    <!-- 单关比赛数量统计 -->
                    <span class="single-count" v-if="countSingleMatchesInGroup(group) > 0">
                      <span class="single-tag-mini">单</span>
                      {{ countSingleMatchesInGroup(group) }}
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="group-stats">
                <span class="stat-item status-open" v-if="countStatusMatches(group, '2') > 0">
                  {{ countStatusMatches(group, '2') }}可选
                </span>
                <span class="stat-item status-live" v-if="countStatusMatches(group, '4') > 0">
                  {{ countStatusMatches(group, '4') }}进行中
                </span>
              </div>
            </div>
            
            <!-- 折叠内容 -->
            <div class="group-content" :class="{ 'collapsed': collapsedGroups[day] }">
              <div class="group-matches">
                <template v-if="!filteredMatches || filteredMatches.length === 0">
                  <div class="no-filtered-matches">
                    <p>没有匹配的比赛</p>
                  </div>
                </template>
                <template v-else>
                  <MatchCard
                    v-for="match in filterMatchesInGroup(group)"
                    :key="match.id"
                    :match="match"
                    @analyze="handleAnalyze"
                  />
                </template>
              </div>
            </div>
          </div>
        </template>
        
        <div v-else class="no-filtered-matches">
          <p>没有匹配的比赛</p>
        </div>
        
        <!-- 底部提示 -->
        <div v-if="Object.keys(sortedGroups).length > 0" class="list-footer">
          <p>共 {{ totalMatches }} 场比赛</p>
        </div>
      </div>
    </div>
    
    <!-- 分析抽屉 - 移动端全屏 -->
    <Drawer
      v-model:visible="showAnalysisDrawer"
      :title="drawerTitle"
      :width="isMobile ? '100%' : '60%'"
      :placement="isMobile ? 'bottom' : 'right'"
      :height="isMobile ? '90%' : undefined"
      @close="handleDrawerClose"
    >
      <MatchAnalysisDrawer
        v-if="showAnalysisDrawer && selectedMatch"
        :match="selectedMatch"
      />
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { matchApi } from '@/api/match'
import type { Match } from '@/types/match'
import MatchCard from './MatchCard.vue'
import Drawer from '@/components/common/Drawer.vue'
import MatchAnalysisDrawer from '../analysis/MatchAnalysisDrawer.vue'

const matches = ref<Match[]>([])
const loading = ref(false)
const error = ref<string>('')
const selectedLeague = ref('')

// 抽屉相关状态
const showAnalysisDrawer = ref(false)
const selectedMatch = ref<Match | null>(null)

// 折叠状态管理
const collapsedGroups = ref<Record<string, boolean>>({})

// 移动端检测
const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 获取所有联赛
const leagues = computed(() => {
  if (!matches.value || matches.value.length === 0) return []
  return Array.from(new Set(matches.value.map(match => match.league).filter(Boolean)))
})

// 筛选比赛
const filteredMatches = computed(() => {
  if (!matches.value || matches.value.length === 0) return []
  
  if (!selectedLeague.value) return matches.value
  
  return matches.value.filter(match => {
    return match?.league === selectedLeague.value
  })
})

// 总比赛数
const totalMatches = computed(() => {
  return filteredMatches.value.length
})

// 抽屉标题
const drawerTitle = computed(() => {
  if (!selectedMatch.value) return '比赛分析'
  return `${selectedMatch.value.homeTeam} vs ${selectedMatch.value.awayTeam}`
})

// 按周几分组比赛
const groupedMatches = computed(() => {
  const groups: Record<string, Match[]> = {}
  
  filteredMatches.value.forEach(match => {
    const day = match.matchNumStr.substring(0, 2)
    
    if (!groups[day]) {
      groups[day] = []
    }
    
    groups[day].push(match)
  })
  
  Object.keys(groups).forEach(day => {
    groups[day].sort((a, b) => {
      const aNum = parseInt(a.matchNumStr.substring(2)) || 0
      const bNum = parseInt(b.matchNumStr.substring(2)) || 0
      return aNum - bNum
    })
  })
  
  return groups
})

// 按周一到周日顺序排序的分组
// 按从今天开始的周序排序分组
const sortedGroups = computed(() => {
  // 获取今天是周几（0-6，0是周日）
  const today = new Date().getDay()
  
  // 创建从今天开始的周序数组
  const createWeekOrder = (startDay) => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const order = []
    for (let i = 0; i < 7; i++) {
      order.push(days[(startDay + i) % 7])
    }
    return order
  }
  
  const dayOrder = createWeekOrder(today)
  const sorted = {}
  
  // 首先按从今天开始的周序添加已有的分组
  dayOrder.forEach(day => {
    if (groupedMatches.value[day]) {
      sorted[day] = groupedMatches.value[day]
    }
  })
  
  // 然后添加不在dayOrder中的其他分组（如具体日期）
  Object.keys(groupedMatches.value).forEach(day => {
    if (!dayOrder.includes(day) && !sorted[day]) {
      sorted[day] = groupedMatches.value[day]
    }
  })
  
  return sorted
})

// 筛选分组内的比赛
const filterMatchesInGroup = (group: Match[]) => {
  return group
}

// 统计分组内单关比赛数量
const countSingleMatchesInGroup = (group: Match[]) => {
  return group.filter(match => match.isSingleMatch).length
}

// 统计分组内指定状态的比赛数量
const countStatusMatches = (group: Match[], status: string) => {
  return group.filter(match => match.status === status).length
}

// 切换单个分组折叠状态
const toggleGroup = (day: string) => {
  if (collapsedGroups.value[day] === undefined) {
    collapsedGroups.value[day] = true
  } else {
    collapsedGroups.value[day] = !collapsedGroups.value[day]
  }
}

// 全部折叠或展开
const toggleAllGroups = (collapse: boolean) => {
  Object.keys(sortedGroups.value).forEach(day => {
    collapsedGroups.value[day] = collapse
  })
}

// 当分组变化时，初始化折叠状态
watch(sortedGroups, (newGroups) => {
  Object.keys(newGroups).forEach(day => {
    if (collapsedGroups.value[day] === undefined) {
      collapsedGroups.value[day] = false
    }
  })
}, { immediate: true })

const fetchMatches = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const data = await matchApi.getMatchList()
    matches.value = Array.isArray(data) ? data : []
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败'
    console.error('获取比赛列表失败:', err)
    matches.value = []
  } finally {
    loading.value = false
  }
}

const refreshMatches = () => {
  fetchMatches()
}

const filterMatches = () => {
  // 筛选逻辑已通过计算属性实现
}

// 处理分析按钮点击
const handleAnalyze = (match: Match) => {
  selectedMatch.value = match
  showAnalysisDrawer.value = true
}

// 处理抽屉关闭
const handleDrawerClose = () => {
  selectedMatch.value = null
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  fetchMatches()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.match-list {
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background: #f5f5f5;
}

/* 头部样式优化 */
.header {
  padding: 12px 16px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 8px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header h2 {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.filters {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.filters select {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  color: #333;
  -webkit-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 36px;
}

.filters button {
  padding: 10px 16px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.2);
}

.filters button:disabled {
  background: #ccc;
  box-shadow: none;
  cursor: not-allowed;
}

/* 折叠控制按钮 - 移动端优化 */
.collapse-controls {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.collapse-btn {
  padding: 8px;
  background: white;
  color: #666;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  min-height: 36px;
}

.collapse-btn svg {
  fill: #666;
}

.collapse-btn:hover {
  background: #f5f5f5;
}

/* 比赛容器 - 移动端滚动优化 */
.matches-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  position: relative;
  -webkit-overflow-scrolling: touch;
  padding: 0 8px 8px;
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误状态 */
.error, .no-matches, .no-filtered-matches {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.error button {
  margin-top: 16px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

/* 比赛内容区域 */
.matches-content {
  padding-bottom: 8px;
}

/* 按天分组样式 - 移动端优化 */
.match-day-group {
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.match-day-group:active {
  transform: scale(0.99);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: white;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  min-height: 56px;
}

.group-header-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.collapse-icon {
  flex-shrink: 0;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
}

.collapse-icon svg {
  fill: #1890ff;
}

.collapse-icon.collapsed {
  transform: rotate(-90deg);
}

.group-title {
  flex: 1;
  min-width: 0;
}

.group-header h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.match-count {
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 10px;
}

/* 单关比赛统计 */
.single-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #ff4d4f;
}

.single-tag-mini {
  display: inline-block;
  width: 14px;
  height: 14px;
  background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
  color: white;
  font-size: 10px;
  border-radius: 2px;
  text-align: center;
  line-height: 14px;
  font-weight: bold;
  box-shadow: 0 1px 2px rgba(255, 77, 79, 0.2);
}

/* 分组状态统计 */
.group-stats {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  margin-left: 8px;
}

.stat-item {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.stat-item.status-open {
  background: rgba(82, 196, 26, 0.1);
  color: #52c41a;
  border: 1px solid rgba(82, 196, 26, 0.2);
}

.stat-item.status-live {
  background: rgba(245, 34, 45, 0.1);
  color: #f5222d;
  border: 1px solid rgba(245, 34, 45, 0.2);
}

/* 分组内容 */
.group-content {
  /* max-height: 5000px; */
  overflow: hidden;
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
  opacity: 1;
}

.group-content.collapsed {
  max-height: 0;
  opacity: 0;
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
}

.group-matches {
  padding: 0;
}

.group-matches .match-card {
  margin-bottom: 1px;
}

.group-matches .match-card:last-child {
  margin-bottom: 0;
}

/* 列表底部 */
.list-footer {
  text-align: center;
  padding: 16px;
  color: #999;
  font-size: 14px;
  margin-top: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.list-footer p {
  margin: 0;
}

/* 触摸优化 */
@media (hover: none) and (pointer: coarse) {
  .group-header:active {
    background-color: #f5f5f5;
  }
  
  .filters select:active,
  .filters button:active,
  .collapse-btn:active {
    transform: scale(0.98);
  }
}

/* 响应式设计 - 移动端优化 */
@media (max-width: 768px) {
  .match-list {
    padding: 0;
  }
  
  .header {
    padding: 12px;
    margin-bottom: 8px;
  }
  
  .header h2 {
    font-size: 20px;
    margin-bottom: 12px;
  }
  
  .filters {
    gap: 8px;
  }
  
  .filters select {
    order: 1;
    width: 100%;
  }
  
  .filters button {
    order: 2;
    flex: 1;
    min-width: 0;
  }
  
  .collapse-controls {
    order: 3;
    width: 100%;
    justify-content: center;
    margin: 8px 0 0 0;
  }
  
  .group-header {
    padding: 12px;
  }
  
  .group-header h3 {
    font-size: 15px;
  }
  
  .group-meta {
    flex-wrap: wrap;
  }
  
  .group-stats {
    margin-top: 4px;
    justify-content: flex-start;
  }
  
  .matches-container {
    padding: 0 8px 8px;
  }
  
  /* 移动端优化滚动 */
  .matches-container::-webkit-scrollbar {
    width: 4px;
  }
  
  .matches-container::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .matches-container::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
  }
}

/* 超小屏幕优化 */
@media (max-width: 320px) {
  .group-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .group-stats {
    width: 100%;
    justify-content: flex-start;
  }
  
  .filters button {
    font-size: 13px;
    padding: 10px 12px;
  }
}

/* 平板优化 */
@media (min-width: 769px) and (max-width: 1024px) {
  .match-list {
    padding: 16px;
  }
  
  .header {
    padding: 16px 20px;
  }
  
  .filters {
    gap: 12px;
  }
  
  .filters select {
    min-width: 150px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .match-list {
    background: #141414;
  }
  
  .header,
  .match-day-group,
  .list-footer {
    background: #1f1f1f;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  .header h2,
  .group-header h3 {
    color: #e6e6e6;
  }
  
  .filters select {
    background: #262626;
    border-color: #434343;
    color: #e6e6e6;
  }
  
  .collapse-btn {
    background: #262626;
    border-color: #434343;
    color: #e6e6e6;
  }
  
  .collapse-btn svg {
    fill: #e6e6e6;
  }
  
  .match-count {
    background: #262626;
    color: #a6a6a6;
  }
  
  .list-footer {
    color: #8c8c8c;
  }
}
</style>