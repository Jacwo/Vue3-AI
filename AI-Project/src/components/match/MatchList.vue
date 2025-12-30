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
      </div>
    </div>

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

    <div v-else class="matches">
      <div v-if="!filteredMatches || filteredMatches.length === 0" class="no-filtered-matches">
        <p>没有匹配的比赛</p>
      </div>
      
      <MatchCard
        v-else
        v-for="match in filteredMatches"
        :key="match.id"
        :match="match"
        @analyze="handleAnalyze"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { matchApi } from '@/api/match'
import type { Match } from '@/types/match'
import MatchCard from './MatchCard.vue'

const matches = ref<Match[]>([])
const loading = ref(false)
const error = ref<string>('')
const selectedLeague = ref('')

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

const handleAnalyze = (matchId: number) => {
  console.log('分析比赛:', matchId)
  emit('analyze-match', matchId)
}

const emit = defineEmits<{
  'analyze-match': [matchId: number]
}>()

onMounted(() => {
  fetchMatches()
})
</script>

<style scoped>
.match-list {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 10px;
}

.filters select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.filters button {
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.filters button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
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

.matches {
  display: grid;
  gap: 15px;
}
</style>