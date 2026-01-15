<template>
  <div class="analysis-page">
    <div class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1>比赛分析</h1>
    </div>

    <!-- 比赛基本信息 -->
    <div class="match-basic-info">
      <div class="teams">
        <div class="team home-team">
          <div class="team-name">{{ matchData.homeTeam }}</div>
          <div class="team-rank" v-if="matchData.homeTeamRank">[{{ matchData.homeTeamRank }}]</div>
        </div>
        <div class="vs">VS</div>
        <div class="team away-team">
          <div class="team-name">{{ matchData.awayTeam }}</div>
          <div class="team-rank" v-if="matchData.awayTeamRank">[{{ matchData.awayTeamRank }}]</div>
        </div>
      </div>
      <div class="match-meta">
        <span class="league">{{ matchData.league }}</span>
        <span class="match-time">{{ formatMatchTime(matchData.fullMatchTime) }}</span>
      </div>
    </div>

    <div class="analysis-tabs">
      <div class="tabs-header">
        <div v-for="tab in tabs" :key="tab.id" :class="['tab-item', { active: activeTab === tab.id }]"
          @click="switchTab(tab.id)">
          {{ tab.label }}
        </div>
      </div>

      <div class="tab-content">
        <!-- 最近比赛信息 -->
        <div v-if="activeTab === 'recent'" class="recent-matches">
          <h3>历史交锋</h3>
          <div class="recent-teams">
            <div class="recent-team">
              <div class="match-list">
                <div v-if="loading.recent">加载中...</div>
                <div v-else-if="!recentMatches.length">暂无数据</div>
                <div v-else v-for="match in filteredHomeRecentMatches" :key="match.id" class="recent-match-item">
                  <div class="match-info">
                    <span class="league">{{ match.league }}</span>
                    <span class="time">{{ formatDate(match.matchDate) }}</span>
                  </div>
                  <div class="match-result">
                    <span class="home">{{ match.homeTeam }}</span>
                    <span :class="getScoreClass(match.score, match.homeTeam, matchData.homeTeam)">
                      {{ parseScore(match.score).home }} - {{ parseScore(match.score).away }}
                    </span>
                    <span class="away">{{ match.awayTeam }}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- 在 xg-data 部分更新模板 -->
        <div v-if="activeTab === 'xg'" class="xg-data">
          <h3>预期进球(xG)分析</h3>
          <div v-if="loading.xg">加载中...</div>
          <div v-else-if="!xgData.home && !xgData.away">暂无数据</div>
          <div v-else>
            <!-- 基本数据对比 -->
            <div class="xg-stats">
              <div class="xg-team">
                <div class="team-name">{{ xgData.home?.teamName || matchData.homeTeam }}</div>
                <div class="xg-bar-container">
                  <div class="xg-bar" :style="{ width: homeXgPercent + '%' }"></div>
                  <div class="xg-value">{{ (xgData.home?.xg || 0).toFixed(2) }}</div>
                </div>
              </div>
              <div class="xg-vs">VS</div>
              <div class="xg-team">
                <div class="team-name">{{ xgData.away?.teamName || matchData.awayTeam }}</div>
                <div class="xg-bar-container">
                  <div class="xg-bar" :style="{ width: awayXgPercent + '%' }"></div>
                  <div class="xg-value">{{ (xgData.away?.xg || 0).toFixed(2) }}</div>
                </div>
              </div>
            </div>

            <!-- 详细数据 -->
            <div class="xg-details">
              <div class="detail-section">
                <h4>基本战绩对比</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="label">比赛场次:</span>
                    <span class="value">
                      主: {{ xgData.home?.matches || 0 }}
                      客: {{ xgData.away?.matches || 0 }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">胜/平/负:</span>
                    <span class="value">
                      主: {{ xgData.home?.wins || 0 }}/{{ xgData.home?.draws || 0 }}/{{
                        xgData.home?.loses || 0 }}
                      客: {{ xgData.away?.wins || 0 }}/{{ xgData.away?.draws || 0 }}/{{
                        xgData.away?.loses || 0 }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">实际进球/失球:</span>
                    <span class="value">
                      主: {{ xgData.home?.goals || 0 }}/{{ xgData.home?.ga || 0 }}
                      客: {{ xgData.away?.goals || 0 }}/{{ xgData.away?.ga || 0 }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">净胜球:</span>
                    <span class="value">
                      主: {{ xgData.home?.goalDifference || 0 }}
                      客: {{ xgData.away?.goalDifference || 0 }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">积分:</span>
                    <span class="value">
                      主: {{ xgData.home?.points || 0 }}
                      客: {{ xgData.away?.points || 0 }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h4>预期数据对比</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="label">预期进球(xG):</span>
                    <span class="value">
                      主: {{ (xgData.home?.xg || 0).toFixed(2) }}
                      客: {{ (xgData.away?.xg || 0).toFixed(2) }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">非点球xG:</span>
                    <span class="value">
                      主: {{ (xgData.home?.npxG || 0).toFixed(2) }}
                      客: {{ (xgData.away?.npxG || 0).toFixed(2) }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">预期失球(xGA):</span>
                    <span class="value">
                      主: {{ (xgData.home?.xga || 0).toFixed(2) }}
                      客: {{ (xgData.away?.xga || 0).toFixed(2) }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">非点球xGA:</span>
                    <span class="value">
                      主: {{ (xgData.home?.npxGA || 0).toFixed(2) }}
                      客: {{ (xgData.away?.npxGA || 0).toFixed(2) }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">xG净胜球:</span>
                    <span class="value">
                      主: {{ ((xgData.home?.xg || 0) - (xgData.home?.xga || 0)).toFixed(2) }}
                      客: {{ ((xgData.away?.xg || 0) - (xgData.away?.xga || 0)).toFixed(2) }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">非点球xG净胜球:</span>
                    <span class="value">
                      主: {{ (xgData.home?.npxGD || 0).toFixed(2) }}
                      客: {{ (xgData.away?.npxGD || 0).toFixed(2) }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">预期积分:</span>
                    <span class="value">
                      主: {{ (xgData.home?.xpts || 0).toFixed(2) }}
                      客: {{ (xgData.away?.xpts || 0).toFixed(2) }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h4>战术数据</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="label">进攻三区次数:</span>
                    <span class="value">
                      主: {{ xgData.home?.deep || 0 }}
                      客: {{ xgData.away?.deep || 0 }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">被进入进攻三区:</span>
                    <span class="value">
                      主: {{ xgData.home?.deepAllowed || 0 }}
                      客: {{ xgData.away?.deepAllowed || 0 }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">PPDA(传球防守强度):</span>
                    <span class="value">
                      主: {{ (xgData.home?.ppda || 0).toFixed(2) }}
                      客: {{ (xgData.away?.ppda || 0).toFixed(2) }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">被PPDA:</span>
                    <span class="value">
                      主: {{ (xgData.home?.ppdaAllowed || 0).toFixed(2) }}
                      客: {{ (xgData.away?.ppdaAllowed || 0).toFixed(2) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 同奖比赛信息 -->
        <div v-if="activeTab === 'similar'" class="similar-matches">
          <h3>相似盘口比赛</h3>
          <div v-if="loading.similar">加载中...</div>
          <div v-else-if="!similarMatches.length" class="no-data">暂无相似比赛数据</div>
          <div v-else class="similar-list">
            <div v-for="match in similarMatches" :key="match.id" class="similar-match-item">
              <div class="match-header">
                <span class="league">{{ match.league }}</span>
                <span class="time">{{ formatDate(match.matchDate) }}</span>
              </div>
              <div class="teams">
                <span class="home">{{ match.homeTeam }}</span>
                <span class="score">{{ match.score }}</span>
                <span class="away">{{ match.awayTeam }}</span>
              </div>
              <div class="odds-info">
                <span>主胜: {{ match.h }}</span>
                <span>平: {{ match.d }}</span>
                <span>客胜: {{ match.a }}</span>
                <span>
                  结果:
                  <span :class="getMatchResultClass(match.score, match.h, match.a)">
                    {{ getMatchResult(match.score, match.h, match.a) }}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 情报信息 -->
        <div v-if="activeTab === 'intelligence'" class="intelligence-info">
          <h3>情报分析</h3>
          <div v-if="loading.intelligence">加载中...</div>
          <div v-else-if="!intelligenceData" class="no-data">暂无情报数据</div>
          <div v-else class="intelligence-content">
            <pre>{{ intelligenceData }}</pre>
          </div>
        </div>

        <!-- 赔率变化信息 -->
        <div v-if="activeTab === 'odds'" class="odds-change">
          <h3>赔率变化趋势</h3>

          <div class="odds-header">
            <div class="odds-summary">
              <div class="summary-item">
                <span class="label">最新赔率</span>
                <div class="odds-values">
                  <span class="home-odds">主胜: {{ latestOdds?.h || '--' }}</span>
                  <span class="draw-odds">平: {{ latestOdds?.d || '--' }}</span>
                  <span class="away-odds">客胜: {{ latestOdds?.a || '--' }}</span>
                </div>
              </div>

            </div>
          </div>



          <div class="odds-details">
            <h4>详细赔率变化记录</h4>
            <div class="odds-table">
              <div class="table-header">
                <div class="cell">更新时间</div>
                <div class="cell">主胜</div>
                <div class="cell">平局</div>
                <div class="cell">客胜</div>
              </div>
              <div v-for="record in oddsHistory" :key="record.id" class="table-row">
                <div class="cell"> {{ record.updateDate }} {{ record.updateTime }}</div>
                <div class="cell" :class="{ 'changed': isOddsChanged(record.id, 'h') }">{{ record.h }}</div>
                <div class="cell" :class="{ 'changed': isOddsChanged(record.id, 'd') }">{{ record.d }}</div>
                <div class="cell" :class="{ 'changed': isOddsChanged(record.id, 'a') }">{{ record.a }}</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
// 修改 script 部分
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatDisplayTime } from '@/utils/dateUtils'
import { matchApi } from '@/api/analisis'
import type { RecentMatch, XgData, SimilarMatch, OddsRecord } from '@/api/analisis'

const route = useRoute()
const router = useRouter()

// 标签页配置
const tabs = [
  { id: 'recent', label: '历史交锋' },
  { id: 'xg', label: 'xG数据' },
  { id: 'similar', label: '相似比赛' },
  // { id: 'intelligence', label: '情报分析' },
  { id: 'odds', label: '赔率变化' }
]

const activeTab = ref('recent')

// 从路由获取比赛ID
const matchId = computed(() => route.params.matchId as string)
// 添加计算属性获取最新赔率
const latestOdds = computed(() => {
  if (oddsHistory.value.length === 0) return null
  return oddsHistory.value[oddsHistory.value.length - 1]
})

// 判断赔率是否发生变化的方法
const isOddsChanged = (recordId: string, oddsType: 'h' | 'd' | 'a') => {
  const index = oddsHistory.value.findIndex(r => r.id === recordId)
  if (index === 0) return false

  const currentRecord = oddsHistory.value[index]
  const prevRecord = oddsHistory.value[index - 1]

  return currentRecord[oddsType] !== prevRecord[oddsType]
}
// 从URL查询参数中获取比赛数据
const matchData = computed(() => {
  const league = route.query.league as string || '未知联赛'
  const homeTeam = route.query.homeTeam as string || '未知主队'
  const awayTeam = route.query.awayTeam as string || '未知客队'

  let fullMatchTime = route.query.matchTime as string || ''
  if (fullMatchTime) {
    fullMatchTime = fullMatchTime.replace('+', ' ')
    if (fullMatchTime.length === 16) {
      fullMatchTime += ':00'
    }
  } else {
    fullMatchTime = '未知时间'
  }

  return {
    homeTeam,
    awayTeam,
    league,
    fullMatchTime,
    homeTeamRank: '待获取',
    awayTeamRank: '待获取'
  }
})

// 加载状态
const loading = ref({
  recent: false,
  xg: false,
  similar: false,
  intelligence: false,
  odds: false
})

// 最近比赛数据
const recentMatches = ref<RecentMatch[]>([])

// xG数据
const xgData = ref<XgData>({
  home: null,
  away: null,
  all: null
})

// 同奖比赛数据
const similarMatches = ref<SimilarMatch[]>([])

// 情报数据
const intelligenceData = ref('')

// 赔率历史
const oddsHistory = ref<OddsRecord[]>([])
const oddsAnalysis = ref('赔率变化分析...')

// 计算属性
const filteredHomeRecentMatches = computed(() => {
  return recentMatches.value.filter(match =>
    match.homeTeam === matchData.value.homeTeam ||
    match.awayTeam === matchData.value.homeTeam
  ).slice(0, 5)
})

const filteredAwayRecentMatches = computed(() => {
  return recentMatches.value.filter(match =>
    match.homeTeam === matchData.value.awayTeam ||
    match.awayTeam === matchData.value.awayTeam
  ).slice(0, 5)
})

const homeXgPercent = computed(() => {
  const homeXg = xgData.value.home?.xG || 0
  const awayXg = xgData.value.away?.xG || 0
  const total = homeXg + awayXg
  return total > 0 ? (homeXg / total) * 100 : 50
})

const awayXgPercent = computed(() => {
  const homeXg = xgData.value.home?.xG || 0
  const awayXg = xgData.value.away?.xG || 0
  const total = homeXg + awayXg
  return total > 0 ? (awayXg / total) * 100 : 50
})

// 方法
const goBack = () => {
  router.back()
}

const formatMatchTime = (fullTime: string) => {
  const [dateString, timeString] = fullTime.split(' ')
  return formatDisplayTime(dateString, timeString)
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  } catch (e) {
    return dateString
  }
}

const parseScore = (score: string) => {
  if (!score) return { home: 0, away: 0 }
  const [home, away] = score.split('-').map(s => s.trim())
  return {
    home: parseInt(home) || 0,
    away: parseInt(away) || 0
  }
}

const getScoreClass = (score: string, teamName: string, targetTeam: string) => {
  if (!score || !teamName || !targetTeam) return 'score'
  const { home, away } = parseScore(score)

  const isHomeTeam = score.includes(targetTeam) ?
    (score.split('-')[0].includes(targetTeam) ? true : false) : false

  let result = 'draw'
  if (home > away) {
    result = 'home-win'
  } else if (home < away) {
    result = 'away-win'
  }

  if ((isHomeTeam && result === 'home-win') || (!isHomeTeam && result === 'away-win')) {
    return 'score win'
  } else if (result === 'draw') {
    return 'score draw'
  } else {
    return 'score lose'
  }
}

const getMatchResult = (score: string, homeOdds: string, awayOdds: string) => {
  if (!score) return '未知'
  const { home, away } = parseScore(score)

  if (home > away) return '主胜'
  if (home < away) return '客胜'
  return '平局'
}

const getMatchResultClass = (score: string, homeOdds: string, awayOdds: string) => {
  const result = getMatchResult(score, homeOdds, awayOdds)
  switch (result) {
    case '主胜': return 'result-home-win'
    case '客胜': return 'result-away-win'
    case '平局': return 'result-draw'
    default: return ''
  }
}

const switchTab = (tabId: string) => {
  activeTab.value = tabId
  loadTabData(tabId)
}

const loadTabData = async (tabId: string) => {
  switch (tabId) {
    case 'recent':
      if (recentMatches.value.length === 0) {
        await fetchRecentMatches()
      }
      break
    case 'xg':
      if (!xgData.value.home && !xgData.value.away) {
        await fetchXgData()
      }
      break
    case 'similar':
      if (similarMatches.value.length === 0) {
        await fetchSimilarMatches()
      }
      break
    case 'intelligence':
      if (!intelligenceData.value) {
        await fetchIntelligenceData()
      }
      break
    case 'odds':
      if (oddsHistory.value.length === 0) {
        await fetchOddsHistory()
      }
      break
  }
}

// 使用 API 客户端重构的方法
const fetchRecentMatches = async () => {
  try {
    loading.value.recent = true
    const response = await matchApi.getRecentMatches(matchId.value)
    console.log(response)
    recentMatches.value = response
  } catch (error) {
    console.error('获取近期战绩失败:', error)
    recentMatches.value = []
  } finally {
    loading.value.recent = false
  }
}

const fetchXgData = async () => {
  try {
    loading.value.xg = true
    const response = await matchApi.getXgData(matchId.value)
    xgData.value = response
  } catch (error) {
    console.error('获取xG数据失败:', error)
    xgData.value = { home: null, away: null, all: null }
  } finally {
    loading.value.xg = false
  }
}

const fetchSimilarMatches = async () => {
  try {
    loading.value.similar = true
    const response = await matchApi.getSimilarMatches(matchId.value)
    similarMatches.value = response
  } catch (error) {
    console.error('获取相似比赛失败:', error)
    similarMatches.value = []
  } finally {
    loading.value.similar = false
  }
}

const fetchIntelligenceData = async () => {
  try {
    loading.value.intelligence = true
    const response = await matchApi.getIntelligenceData(matchId.value)
    intelligenceData.value = response
  } catch (error) {
    console.error('获取情报数据失败:', error)
    intelligenceData.value = ''
  } finally {
    loading.value.intelligence = false
  }
}

const fetchOddsHistory = async () => {
  try {
    loading.value.odds = true
    // 如果接口存在
    const response = await matchApi.getOddsHistory(matchId.value)
    // oddsHistory.value = response.data.history
    // oddsAnalysis.value = response.data.analysis

    // 暂时使用模拟数据
    oddsHistory.value = response
  } catch (error) {
    console.error('获取赔率历史失败:', error)
    oddsHistory.value = []
    oddsAnalysis.value = '暂无赔率分析数据'
  } finally {
    loading.value.odds = false
  }
}

// 监听标签页变化
watch(activeTab, (newTab) => {
  loadTabData(newTab)
})

// 生命周期
onMounted(() => {
  loadTabData(activeTab.value)
})
</script>

<style scoped>
.analysis-page {
  padding: 12px;
  background: #f5f5f5;
  min-height: 100vh;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .analysis-page {
    padding: 8px;
  }
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 8px;
}

.back-btn {
  background: none;
  border: none;
  color: #1890ff;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 12px;
  margin-right: 16px;
  flex-shrink: 0;
}

.page-header h1 {
  font-size: 18px;
  color: #333;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .back-btn {
    padding: 6px 10px;
    margin-right: 12px;
    font-size: 13px;
  }
  
  .page-header h1 {
    font-size: 16px;
  }
}

.match-basic-info {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .match-basic-info {
    padding: 12px;
    border-radius: 6px;
  }
}

.match-basic-info .teams {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.team {
  flex: 1;
  text-align: center;
  min-width: 0; /* 允许文本溢出 */
}

.team-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 8px;
}

.team-rank {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  white-space: nowrap;
}

.vs {
  color: #999;
  font-size: 14px;
  margin: 0 12px;
  font-weight: bold;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .team-name {
    font-size: 14px;
    padding: 0 4px;
  }
  
  .vs {
    font-size: 12px;
    margin: 0 8px;
  }
  
  .team-rank {
    font-size: 11px;
  }
}

.match-meta {
  display: flex;
  justify-content: center;
  gap: 16px;
  font-size: 13px;
  color: #666;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .match-meta {
    font-size: 12px;
    gap: 12px;
  }
}

.analysis-tabs {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .analysis-tabs {
    border-radius: 6px;
  }
}

.tabs-header {
  display: flex;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch; /* iOS滚动平滑 */
  scrollbar-width: none; /* Firefox隐藏滚动条 */
}

.tabs-header::-webkit-scrollbar {
  display: none; /* Chrome隐藏滚动条 */
}

.tab-item {
  flex: 1;
  min-width: 80px;
  text-align: center;
  padding: 12px 4px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.tab-item:hover {
  background: #f0f0f0;
}

.tab-item.active {
  color: #1890ff;
  border-bottom: 2px solid #1890ff;
  background: white;
}

@media (max-width: 768px) {
  .tab-item {
    padding: 10px 4px;
    font-size: 12px;
    min-width: 70px;
  }
}

.tab-content {
  padding: 16px;
}

@media (max-width: 768px) {
  .tab-content {
    padding: 12px;
  }
}

.recent-matches h3,
.xg-data h3,
.similar-matches h3,
.intelligence-info h3,
.odds-change h3 {
  font-size: 15px;
  color: #333;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e8e8e8;
}

@media (max-width: 768px) {
  .recent-matches h3,
  .xg-data h3,
  .similar-matches h3,
  .intelligence-info h3,
  .odds-change h3 {
    font-size: 14px;
    margin-bottom: 10px;
  }
}

/* 最近比赛部分 */
.recent-teams {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.recent-team h4 {
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f0f0f0;
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recent-match-item {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 10px;
  background: #fafafa;
}

@media (max-width: 768px) {
  .recent-match-item {
    padding: 8px;
  }
}

.match-info {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #666;
  margin-bottom: 6px;
}

.match-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.match-result .home,
.match-result .away {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.match-result .home {
  text-align: left;
  padding-right: 8px;
}

.match-result .away {
  text-align: right;
  padding-left: 8px;
}

.match-result .score {
  font-weight: bold;
  padding: 0 8px;
  flex-shrink: 0;
  min-width: 60px;
  text-align: center;
}

.match-result .score.win {
  color: #52c41a;
}

.match-result .score.lose {
  color: #ff4d4f;
}

.match-result .score.draw {
  color: #faad14;
}

@media (max-width: 768px) {
  .match-info {
    font-size: 10px;
  }
  
  .match-result {
    font-size: 12px;
  }
  
  .match-result .score {
    min-width: 50px;
    padding: 0 4px;
  }
}

/* xG数据部分 */
.xg-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.xg-team {
  display: flex;
  align-items: center;
  gap: 12px;
}

.xg-team .team-name {
  min-width: 60px;
  text-align: left;
  font-size: 14px;
}

.xg-bar-container {
  position: relative;
  flex: 1;
  height: 32px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.xg-bar {
  height: 100%;
  background: linear-gradient(90deg, #1890ff, #73d13d);
  transition: width 0.3s;
}

.xg-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  font-size: 13px;
}

.xg-vs {
  text-align: center;
  color: #999;
  font-weight: bold;
  font-size: 14px;
  margin: 4px 0;
}

@media (max-width: 768px) {
  .xg-stats {
    gap: 12px;
  }
  
  .xg-team .team-name {
    font-size: 13px;
    min-width: 50px;
  }
  
  .xg-bar-container {
    height: 28px;
  }
  
  .xg-value {
    font-size: 12px;
  }
}

.xg-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-section {
  margin-bottom: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 12px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  padding-bottom: 6px;
  border-bottom: 1px solid #e8e8e8;
  color: #333;
  font-size: 14px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 10px;
}

@media (max-width: 768px) {
  .detail-section {
    padding: 10px;
    margin-bottom: 12px;
  }
  
  .detail-section h4 {
    font-size: 13px;
    margin-bottom: 10px;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}

.detail-item {
  display: flex;
  flex-direction: column;
  padding: 8px;
  background: #fafafa;
  border-radius: 4px;
  font-size: 12px;
}

.detail-item .label {
  font-weight: 500;
  color: #666;
  margin-bottom: 4px;
}

.detail-item .value {
  color: #333;
  line-height: 1.4;
  word-break: break-word;
}

@media (max-width: 768px) {
  .detail-item {
    padding: 6px;
    font-size: 11px;
  }
}

/* 同奖比赛部分 */
.similar-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.similar-match-item {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 10px;
  background: #fafafa;
}

.similar-match-item .match-header {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #666;
  margin-bottom: 6px;
}

.similar-match-item .teams {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
}

.similar-match-item .home,
.similar-match-item .away {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.similar-match-item .home {
  text-align: left;
  padding-right: 8px;
}

.similar-match-item .away {
  text-align: right;
  padding-left: 8px;
}

.similar-match-item .score {
  font-weight: bold;
  padding: 0 8px;
  flex-shrink: 0;
  min-width: 60px;
  text-align: center;
}

.similar-match-item .odds-info {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #666;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 6px;
  border-top: 1px dashed #e8e8e8;
}

@media (max-width: 768px) {
  .similar-match-item {
    padding: 8px;
  }
  
  .similar-match-item .match-header {
    font-size: 10px;
  }
  
  .similar-match-item .teams {
    font-size: 12px;
  }
  
  .similar-match-item .score {
    min-width: 50px;
    padding: 0 4px;
  }
  
  .similar-match-item .odds-info {
    font-size: 10px;
    gap: 6px;
  }
}

/* 情报信息部分 */
.intelligence-content {
  background: #fafafa;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #e8e8e8;
  max-height: 400px;
  overflow-y: auto;
}

.intelligence-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  line-height: 1.5;
  color: #333;
  font-size: 13px;
}

@media (max-width: 768px) {
  .intelligence-content {
    padding: 10px;
    font-size: 12px;
  }
}

/* 赔率变化部分 */
.odds-header {
  background: #fafafa;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
  border: 1px solid #e8e8e8;
}

.odds-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-item .label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.odds-values {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.odds-values span {
  flex: 1;
  text-align: center;
  font-weight: bold;
  font-size: 14px;
  padding: 6px;
  border-radius: 4px;
  background: #f0f0f0;
}

@media (max-width: 768px) {
  .odds-header {
    padding: 10px;
  }
  
  .odds-values {
    gap: 6px;
  }
  
  .odds-values span {
    font-size: 13px;
    padding: 5px;
  }
}

/* 赔率表格 */
.odds-table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 0 -16px;
  padding: 0 16px;
}

@media (max-width: 768px) {
  .odds-table-container {
    margin: 0 -12px;
    padding: 0 12px;
  }
}

.odds-table {
  min-width: 600px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 120px repeat(3, 1fr);
  min-width: 100%;
}

.cell {
  padding: 10px 6px;
  border-bottom: 1px solid #e8e8e8;
  text-align: center;
  font-size: 13px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-header .cell {
  background: #fafafa;
  font-weight: bold;
  color: #333;
}

.table-row:last-child .cell {
  border-bottom: none;
}

.changed {
  background: #fff7e6;
  color: #fa8c16;
  font-weight: bold;
}

@media (max-width: 768px) {
  .cell {
    padding: 8px 4px;
    font-size: 12px;
    min-height: 40px;
  }
  
  .odds-table {
    min-width: 500px;
  }
}

/* 通用样式 */
.no-data {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

.result-home-win {
  color: #52c41a;
  font-weight: bold;
}

.result-away-win {
  color: #ff4d4f;
  font-weight: bold;
}

.result-draw {
  color: #faad14;
  font-weight: bold;
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

@media (max-width: 768px) {
  .loading,
  .no-data {
    padding: 30px 16px;
    font-size: 13px;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .tab-item,
  .back-btn,
  .recent-match-item,
  .similar-match-item {
    min-height: 44px; /* 触摸设备最小点击区域 */
  }
  
  .match-result .score,
  .similar-match-item .score {
    min-width: 70px;
  }
}
</style>