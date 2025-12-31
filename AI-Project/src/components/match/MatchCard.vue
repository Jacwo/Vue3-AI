<template>
  <div class="match-card" :class="getStatusClass(match.status)">
    <div class="match-header">
      <div class="match-info">
        <span class="match-num">{{ match.matchNumStr }}</span>
        <span class="single-tag" v-if="isSingleMatch">单</span>
        <span class="league">{{ match.league }}</span>
      </div>
      <div class="match-time">
        {{ formatMatchTime(match.fullMatchTime) }}
      </div>
    </div>
    
    <div class="team-matchup">
      <div class="team home-team">
        <div class="team-name">{{ match.homeTeam }}</div>
        <div class="team-rank" v-if="match.homeTeamRank">[{{ match.homeTeamRank }}] {{ match.league }}</div>
      </div>
      
      <div class="vs">VS</div>
      
      <div class="team away-team">
        <div class="team-name">{{ match.awayTeam }}</div>
        <div class="team-rank" v-if="match.awayTeamRank">[{{ match.awayTeamRank }}] {{ match.league }}</div>
      </div>
    </div>
    
    <div class="odds-section">
      <!-- 单关赔率 -->
      <div class="odds-row" v-if="isSingleMatch && hasOdds">
        <div class="odds-label">
          <button 
            class="analyze-btn" 
            @click="onAnalyze" 
            :disabled="analyzing"
          >
            {{ analyzing ? '分析中...' : '分析' }}
          </button>
        </div>
        <div class="odds-item">
          <span>胜</span>
          <span class="odds-value">{{ formatOdds(match.odds.home) }}</span>
        </div>
        <div class="odds-item">
          <span>平</span>
          <span class="odds-value">{{ formatOdds(match.odds.draw) }}</span>
        </div>
        <div class="odds-item">
          <span>负</span>
          <span class="odds-value">{{ formatOdds(match.odds.away) }}</span>
        </div>
      </div>
      
      <!-- 普通赔率（非单关时显示） -->
      <div class="odds-row" v-if="!isSingleMatch && hasOdds">
        <div class="odds-label">
          <button 
            class="analyze-btn" 
            @click="onAnalyze" 
            :disabled="analyzing"
          >
            {{ analyzing ? '分析中...' : '分析' }}
          </button>
        </div>
        <div class="odds-item">
          <span>胜</span>
          <span class="odds-value" :style="{ color: getOddsColor(match.odds.home) }">
            {{ formatOdds(match.odds.home) }}
          </span>
        </div>
        <div class="odds-item">
          <span>平</span>
          <span class="odds-value" :style="{ color: getOddsColor(match.odds.draw) }">
            {{ formatOdds(match.odds.draw) }}
          </span>
        </div>
        <div class="odds-item">
          <span>负</span>
          <span class="odds-value" :style="{ color: getOddsColor(match.odds.away) }">
            {{ formatOdds(match.odds.away) }}
          </span>
        </div>
      </div>
      
      <!-- 让球赔率 -->
      <div class="odds-row" v-if="hasHandicapOdds">
        <div class="odds-label">
          <span v-if="match.odds.goalLine !== null">让{{ formatGoalLine(match.odds.goalLine) }}</span>
        </div>
        <div class="odds-item">
          <span>胜</span>
          <span class="odds-value" :style="{ color: getOddsColor(match.odds.hhome) }">
            {{ formatOdds(match.odds.hhome) }}
          </span>
        </div>
        <div class="odds-item">
          <span>平</span>
          <span class="odds-value" :style="{ color: getOddsColor(match.odds.hdraw) }">
            {{ formatOdds(match.odds.hdraw) }}
          </span>
        </div>
        <div class="odds-item">
          <span>负</span>
          <span class="odds-value" :style="{ color: getOddsColor(match.odds.haway) }">
            {{ formatOdds(match.odds.haway) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Match } from '@/api/match'
import { formatDisplayTime } from '@/utils/dateUtils'
import { 
  getMatchStatusText, 
  formatOdds, 
  getOddsColor 
} from '@/utils/matchUtils'

interface Props {
  match: Match
}

const props = defineProps<Props>()

// const emit = defineEmits<{
//   analyze: [matchId: number]
// }>()

const emit = defineEmits<{
  analyze: [match: Match]
}>()

const analyzing = ref(false)

// 计算属性
const hasOdds = computed(() => {
  const odds = props.match.odds
  return odds.home !== null && odds.draw !== null && odds.away !== null
})

const hasHandicapOdds = computed(() => {
  const odds = props.match.odds
  return odds.hhome !== null && odds.hdraw !== null && odds.haway !== null
})

const isSingleMatch = computed(() => {
  return props.match.isSingleMatch || false
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

const formatMatchTime = (fullTime: string) => {
  const [dateString, timeString] = fullTime.split(' ')
  return formatDisplayTime(dateString, timeString)
}

const formatGoalLine = (goalLine: number | null): string => {
  if (goalLine === null) return ''
  if (goalLine > 0) return `${goalLine}`
  return goalLine.toString()
}

const onAnalyze = async () => {
  analyzing.value = true
  try {
    emit('analyze', props.match)
  } finally {
    analyzing.value = false
  }
}
</script>

<style scoped>
.match-card {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 10px 12px;
  background: white;
  margin-bottom: 8px;
}

.match-card:last-child {
  margin-bottom: 0;
}

/* 状态样式 */
.match-card.status-pending {
  border-left: 3px solid #faad14;
}

.match-card.status-open {
  border-left: 3px solid #52c41a;
}

.match-card.status-closed {
  border-left: 3px solid #d9d9d9;
}

.match-card.status-live {
  border-left: 3px solid #f5222d;
}

.match-card.status-finished {
  border-left: 3px solid #1890ff;
}

.match-card.status-cancelled {
  border-left: 3px solid #d9d9d9;
  opacity: 0.7;
}

/* 顶部信息 */
.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px dashed #f0f0f0;
  position: relative;
}

.match-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.match-num {
  font-size: 13px;
  font-weight: bold;
  color: #1890ff;
  background: #f0f8ff;
  padding: 2px 6px;
  border-radius: 3px;
  position: relative;
}

.single-tag {
  position: absolute;
  top: -6px;
  left: 0;
  font-size: 10px;
  color: #fff;
  background: #ff4d4f;
  padding: 1px 3px;
  border-radius: 2px;
  font-weight: bold;
  transform: translateX(-50%);
}

.league {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.match-time {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

/* 球队对阵 */
.team-matchup {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.team {
  flex: 1;
  padding: 4px 0;
}

.home-team {
  text-align: left;
}

.away-team {
  text-align: right;
}

.team-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.team-rank {
  font-size: 11px;
  color: #666;
}

.vs {
  color: #999;
  font-size: 12px;
  margin: 0 12px;
  font-weight: 500;
}

/* 赔率区域 */
.odds-section {
  margin-bottom: 8px;
}

.odds-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  background: #fafafa;
  border-radius: 4px;
  overflow: hidden;
}

.odds-label {
  width: 48px;
  text-align: center;
  font-size: 12px;
  color: #666;
  padding: 6px 4px;
  background: #f5f5f5;
  border-right: 1px solid #e8e8e8;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 分析按钮样式 */
.analyze-btn {
  width: 100%;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 4px 0;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.analyze-btn:hover:not(:disabled) {
  background: #40a9ff;
  transform: translateY(-1px);
}

.analyze-btn:disabled {
  background: #8c8c8c;
  cursor: not-allowed;
  opacity: 0.6;
}

.odds-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 4px;
  border-right: 1px solid #f0f0f0;
}

.odds-item:last-child {
  border-right: none;
}

.odds-item span:first-child {
  font-size: 11px;
  color: #666;
  margin-bottom: 2px;
}

.odds-value {
  font-size: 15px;
  font-weight: bold;
  color: #333;
}
</style>