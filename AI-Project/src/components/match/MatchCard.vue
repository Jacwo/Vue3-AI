<template>
  <div class="match-card" :class="getStatusClass(matchData.status)">
    <div class="match-header">
      <span class="match-num">{{ matchData.matchNumStr || '未知编号' }}</span>
      <span class="league">{{ matchData.league }}</span>
      <span class="status">{{ getStatusText(matchData.status) }}</span>
    </div>
    
    <div class="match-time">
      {{ formatMatchTime(matchData.fullMatchTime) }}
    </div>
    
    <div class="match-content">
      <div class="team home-team">
        <div class="team-name">{{ matchData.homeTeam }}</div>
        <div class="team-id" v-if="matchData.homeTeamId">ID: {{ matchData.homeTeamId }}</div>
      </div>
      
      <div class="vs">VS</div>
      
      <div class="team away-team">
        <div class="team-name">{{ matchData.awayTeam }}</div>
        <div class="team-id" v-if="matchData.awayTeamId">ID: {{ matchData.awayTeamId }}</div>
      </div>
    </div>
    
    <div class="odds-info" v-if="hasOdds">
      <div class="odds">
        <div class="odds-item">
          <span class="odds-label">主胜</span>
          <span class="odds-value" :style="{ color: getOddsColor(matchData.odds.home) }">
            {{ formatOdds(matchData.odds.home) }}
          </span>
        </div>
        <div class="odds-item">
          <span class="odds-label">平</span>
          <span class="odds-value" :style="{ color: getOddsColor(matchData.odds.draw) }">
            {{ formatOdds(matchData.odds.draw) }}
          </span>
        </div>
        <div class="odds-item">
          <span class="odds-label">客胜</span>
          <span class="odds-value" :style="{ color: getOddsColor(matchData.odds.away) }">
            {{ formatOdds(matchData.odds.away) }}
          </span>
        </div>
      </div>
    </div>
    
    <div class="no-odds" v-else>
      赔率暂未公布
    </div>
    
    <div class="match-actions">
      <button 
        class="analyze-btn" 
        @click="onAnalyze" 
        :disabled="!canAnalyze"
        :title="!canAnalyze ? '赔率未公布或比赛未开售' : '分析比赛'"
      >
        {{ analyzing ? '分析中...' : '分析比赛' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Match } from '@/api/match'
import { formatDisplayTime } from '@/utils/dateUtils'
import { 
  getMatchStatusText, 
  isMatchAnalyzable, 
  formatOdds, 
  getOddsColor 
} from '@/utils/matchUtils'

interface Props {
  match?: Match
}

const props = defineProps<Props>()

const analyzing = ref(false)

// 调试：打印传入的props
onMounted(() => {
  console.log('MatchCard mounted, props.match:', props.match)
  console.log('props.match.odds:', props.match?.odds)
  console.log('props.match.odds?.home:', props.match?.odds?.home)
})

// 监听props变化
watch(() => props.match, (newMatch) => {
  console.log('MatchCard: match props changed:', newMatch)
  console.log('New match odds:', newMatch?.odds)
  console.log('New match odds.home:', newMatch?.odds?.home)
}, { deep: true })

// 创建一个安全的match数据对象
const matchData = computed(() => {
  const defaultMatch: Match = {
    id: 0,
    league: '未知联赛',
    homeTeam: '未知主队',
    awayTeam: '未知客队',
    odds: {
      home: null,
      draw: null,
      away: null,
    },
    matchTime: '',
    fullMatchTime: '',
    status: '1',
    matchStatus: '1',
    matchStatusName: '未知状态',
    matchNumStr: '',
    homeTeamId: '',
    awayTeamId: '',
    leagueId: '',
    backColor: '',
  }
  
  console.log('MatchCard: Creating matchData, props.match:', props.match)
  
  if (!props.match) {
    console.warn('MatchCard: 传入的match为undefined或null')
    return defaultMatch
  }
  
  // 确保odds对象存在且结构正确
  const safeOdds = props.match.odds || defaultMatch.odds
  
  // 确保odds的每个属性都存在
  const completeOdds = {
    home: safeOdds.home !== undefined ? safeOdds.home : null,
    draw: safeOdds.draw !== undefined ? safeOdds.draw : null,
    away: safeOdds.away !== undefined ? safeOdds.away : null,
  }
  
  console.log('MatchCard: Created completeOdds:', completeOdds)
  
  const safeMatch = {
    ...defaultMatch,
    ...props.match,
    odds: completeOdds,
  }
  
  console.log('MatchCard: Final matchData:', {
    id: safeMatch.id,
    league: safeMatch.league,
    odds: safeMatch.odds,
    hasOdds: checkOddsComplete(safeMatch.odds)
  })
  
  return safeMatch
})

// 辅助函数：检查赔率是否完整
const checkOddsComplete = (odds: any): boolean => {
  if (!odds || typeof odds !== 'object') {
    console.log('checkOddsComplete: odds is not an object', odds)
    return false
  }
  
  const result = odds.home !== null && 
    odds.home !== undefined && 
    odds.draw !== null && 
    odds.draw !== undefined && 
    odds.away !== null && 
    odds.away !== undefined
  
  console.log('checkOddsComplete result:', result, 'for odds:', odds)
  return result
}

// 计算属性
const hasOdds = computed(() => {
  console.log('hasOdds computed called, odds:', matchData.value.odds)
  return checkOddsComplete(matchData.value.odds)
})

const canAnalyze = computed(() => {
  const result = isMatchAnalyzable(matchData.value)
  console.log('canAnalyze computed:', result, 'for match:', matchData.value.id)
  return result
})

// 方法
const getStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    '1': 'status-pending',
    '2': 'status-open',
    '3': 'status-closed',
    '4': 'status-live',
    '5': 'status-finished',
    '6': 'status-cancelled',
  }
  return classMap[status] || ''
}

const getStatusText = (status: string) => {
  return getMatchStatusText(status)
}

const formatMatchTime = (fullTime: string | undefined) => {
  if (!fullTime) return '时间未知'
  
  try {
    // 确保字符串格式正确
    if (fullTime.includes(' ')) {
      const [dateString, timeString] = fullTime.split(' ')
      return formatDisplayTime(dateString, timeString)
    } else {
      // 如果没有空格，尝试其他格式
      return fullTime
    }
  } catch (error) {
    console.error('格式化时间失败:', error)
    return fullTime || '时间未知'
  }
}

const emit = defineEmits<{
  analyze: [matchId: number]
}>()

const onAnalyze = async () => {
  if (!canAnalyze.value) {
    console.log('无法分析比赛:', matchData.value.id, 'canAnalyze:', canAnalyze.value)
    return
  }
  
  analyzing.value = true
  try {
    console.log('开始分析比赛:', matchData.value.id)
    emit('analyze', matchData.value.id)
  } finally {
    analyzing.value = false
  }
}
</script>

<style scoped>
.match-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  background: white;
  transition: all 0.3s ease;
}

.match-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* 状态样式 */
.match-card.status-pending {
  border-left: 4px solid #faad14;
}

.match-card.status-open {
  border-left: 4px solid #52c41a;
}

.match-card.status-closed {
  border-left: 4px solid #d9d9d9;
}

.match-card.status-live {
  border-left: 4px solid #f5222d;
}

.match-card.status-finished {
  border-left: 4px solid #1890ff;
}

.match-card.status-cancelled {
  border-left: 4px solid #d9d9d9;
  opacity: 0.6;
}

.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.match-num {
  font-size: 12px;
  color: #666;
  font-weight: bold;
}

.league {
  font-weight: bold;
  color: #333;
}

.status {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f5f5f5;
  color: #666;
}

.match-time {
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
}

.match-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.team {
  flex: 1;
  text-align: center;
}

.team-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
}

.team-id {
  font-size: 11px;
  color: #999;
}

.vs {
  color: #999;
  font-size: 14px;
  margin: 0 16px;
}

.odds-info {
  margin-bottom: 16px;
}

.odds {
  display: flex;
  justify-content: space-around;
  background: #fafafa;
  border-radius: 6px;
  padding: 8px;
}

.odds-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.odds-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.odds-value {
  font-size: 16px;
  font-weight: bold;
}

.no-odds {
  text-align: center;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;
  color: #999;
  margin-bottom: 16px;
}

.match-actions {
  text-align: center;
}

.analyze-btn {
  padding: 8px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.analyze-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.analyze-btn:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
  opacity: 0.6;
}
</style>