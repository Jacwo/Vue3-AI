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
        
        <!-- 添加全部折叠/展开按钮 -->
        <div class="collapse-controls" v-if="Object.keys(sortedGroups).length > 0">
          <button @click="toggleAllGroups(false)" class="collapse-btn">
            全部展开
          </button>
          <button @click="toggleAllGroups(true)" class="collapse-btn">
            全部折叠
          </button>
        </div>
      </div>
    </div>

    <div class="matches-container">
      <div v-if="loading" class="loading">
        <p>加载比赛数据中...</p>
      </div>

      <div v-else-if="error" class="error">
        <p>加载失败: {{ error }}</p>
        <button @click="fetchMatches">重试</button>
      </div>

      <div v-else-if="!matches || matches.length === 0" class="no-matches">
        <p>暂无比赛数据</p>
      </div>

      <div v-else class="matches-content">
        <!-- 显示按周几分组后的比赛 -->
        <template v-if="groupedMatches && Object.keys(groupedMatches).length > 0">
          <div v-for="(group, day) in sortedGroups" :key="day" class="match-day-group">
            <div class="group-header" @click="toggleGroup(day)">
              <div class="group-header-left">
                <span class="collapse-icon" :class="{ 'collapsed': collapsedGroups[day] }">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                  </svg>
                </span>
                <h3>{{ day }}</h3>
                <span class="match-count">{{ group.length }} 场比赛</span>
                <!-- 单关比赛数量统计 -->
                <span class="single-count" v-if="countSingleMatchesInGroup(group) > 0">
                  <span class="single-tag-mini">单</span>
                  {{ countSingleMatchesInGroup(group) }}
                </span>
              </div>
              
              <div class="group-stats">
                <span class="stat-item status-open" v-if="countStatusMatches(group, '2') > 0">
                  可投 {{ countStatusMatches(group, '2') }}
                </span>
                <span class="stat-item status-live" v-if="countStatusMatches(group, '4') > 0">
                  进行中 {{ countStatusMatches(group, '4') }}
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
    
    <!-- 分析抽屉 -->
    <Drawer
      v-model:visible="showAnalysisDrawer"
      :title="drawerTitle"
      width="60%"
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
import { ref, computed, onMounted, watch } from 'vue'
import { matchApi } from '@/api/match'
import type { Match } from '@/types/match'
import MatchCard from './MatchCard.vue'
import Drawer from '@/components/common/Drawer.vue' // 引入抽屉组件
import MatchAnalysisDrawer from '../analysis/MatchAnalysisDrawer.vue' // 引入分析组件

const matches = ref<Match[]>([])
const loading = ref(false)
const error = ref<string>('')
const selectedLeague = ref('')

// 抽屉相关状态
const showAnalysisDrawer = ref(false)
const selectedMatch = ref<Match | null>(null)

// 折叠状态管理
const collapsedGroups = ref<Record<string, boolean>>({})

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
    // 确保 match.league 存在
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
    // 提取周几信息（前2个字符），如"周三"
    const day = match.matchNumStr.substring(0, 2)
    
    if (!groups[day]) {
      groups[day] = []
    }
    
    groups[day].push(match)
  })
  
  // 对每个分组内的比赛按编号排序
  Object.keys(groups).forEach(day => {
    groups[day].sort((a, b) => {
      // 提取数字部分进行比较
      const aNum = parseInt(a.matchNumStr.substring(2)) || 0
      const bNum = parseInt(b.matchNumStr.substring(2)) || 0
      return aNum - bNum
    })
  })
  
  return groups
})

// 按周一到周日顺序排序的分组
const sortedGroups = computed(() => {
  const dayOrder = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const sorted: Record<string, Match[]> = {}
  
  dayOrder.forEach(day => {
    if (groupedMatches.value[day]) {
      sorted[day] = groupedMatches.value[day]
    }
  })
  
  // 如果还有其他不在顺序中的周几，添加到后面
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
  // 如果不存在，初始化为true（折叠）
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

// 当分组变化时，初始化折叠状态（默认全部展开）
watch(sortedGroups, (newGroups) => {
  Object.keys(newGroups).forEach(day => {
    if (collapsedGroups.value[day] === undefined) {
      // 默认展开所有分组
      collapsedGroups.value[day] = false
    }
  })
}, { immediate: true })

const fetchMatches = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const data = await matchApi.getMatchList()
    // 确保 data 是数组
    matches.value = Array.isArray(data) ? data : []
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败'
    console.error('获取比赛列表失败:', err)
    matches.value = [] // 出错时清空数组
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
  fetchMatches()
})
</script>

<style scoped>
.match-list {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-shrink: 0; /* 防止header被压缩 */
}

.filters {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filters select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  min-width: 120px;
}

.filters button {
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.filters button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* 折叠控制按钮 */
.collapse-controls {
  display: flex;
  gap: 8px;
  margin-left: 10px;
}

.collapse-btn {
  padding: 6px 12px;
  background-color: #f0f0f0;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.collapse-btn:hover {
  background-color: #e0e0e0;
}

/* 比赛容器 - 添加滚动 */
.matches-container {
  flex: 1;
  overflow-y: auto;
  min-height: 0; /* 重要：允许内容在flex容器中滚动 */
  position: relative;
}

.loading, .error, .no-matches, .no-filtered-matches {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error button {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* 比赛内容区域 */
.matches-content {
  padding-bottom: 20px;
}

/* 按天分组样式 */
.match-day-group {
  margin-bottom: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  transition: all 0.3s ease;
}

.match-day-group:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.group-header:hover {
  background-color: #f5f5f5;
}

.group-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.collapse-icon {
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
}

.collapse-icon svg {
  fill: #666;
}

.collapse-icon.collapsed {
  transform: rotate(-90deg);
}

.group-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  user-select: none;
}

.match-count {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
  user-select: none;
}

/* 单关比赛统计 */
.single-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #ff4d4f;
  user-select: none;
}

.single-tag-mini {
  display: inline-block;
  width: 14px;
  height: 14px;
  background: #ff4d4f;
  color: white;
  font-size: 10px;
  border-radius: 2px;
  text-align: center;
  line-height: 14px;
  font-weight: bold;
}

/* 分组状态统计 */
.group-stats {
  display: flex;
  gap: 8px;
}

.stat-item {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  user-select: none;
}

.stat-item.status-open {
  background-color: rgba(82, 196, 26, 0.1);
  color: #52c41a;
  border: 1px solid rgba(82, 196, 26, 0.3);
}

.stat-item.status-live {
  background-color: rgba(245, 34, 45, 0.1);
  color: #f5222d;
  border: 1px solid rgba(245, 34, 45, 0.3);
}

/* 分组内容 */
.group-content {
  max-height: 5000px; /* 设置一个足够大的值，支持动画效果 */
  overflow: hidden;
  transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
  opacity: 1;
}

.group-content.collapsed {
  max-height: 0;
  opacity: 0;
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
}

.group-matches {
  padding: 12px;
}

.group-matches .match-card {
  margin-bottom: 8px;
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
  border-top: 1px solid #f0f0f0;
  margin-top: 20px;
  background: #fafafa;
  border-radius: 4px;
}

.list-footer p {
  margin: 0;
}

/* 自定义滚动条样式 */
.matches-container::-webkit-scrollbar {
  width: 6px;
}

.matches-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.matches-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.matches-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .filters {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .group-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .group-header-left {
    width: 100%;
    justify-content: space-between;
  }
  
  .group-stats {
    width: 100%;
    justify-content: flex-start;
  }
  
  .collapse-controls {
    margin-left: 0;
    margin-top: 8px;
    width: 100%;
    justify-content: flex-start;
  }
  
  .match-list {
    padding: 12px;
  }
}
</style>