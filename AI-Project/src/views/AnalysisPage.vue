<template>
  <div class="analysis-page">
    <div class="page-header">
      <button class="back-btn" @click="goBack" aria-label="返回">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        <span>返回</span>
      </button>
      <h1 class="page-title">比赛分析</h1>
    </div>

    <!-- 比赛基本信息 -->
    <div class="match-basic-info card">
      <div class="teams">
        <div class="team home-team">
          <div class="team-info">
            <div class="team-name" :title="matchData.homeTeam">{{ truncateText(matchData.homeTeam, 10) }}</div>
            <div v-if="matchData.homeTeamRank" class="team-rank">[{{ matchData.homeTeamRank }}]</div>
          </div>
        </div>
        <div class="vs">VS</div>
        <div class="team away-team">
          <div class="team-info">
            <div class="team-name" :title="matchData.awayTeam">{{ truncateText(matchData.awayTeam, 10) }}</div>
            <div v-if="matchData.awayTeamRank" class="team-rank">[{{ matchData.awayTeamRank }}]</div>
          </div>
        </div>
      </div>
      <div class="match-meta">
        <span class="league">{{ matchData.league }}</span>
        <span class="match-time">{{ formatMatchTime(matchData.fullMatchTime) }}</span>
      </div>
    </div>

    <!-- 标签页区域 -->
    <div class="analysis-tabs card">
      <div class="tabs-header">
        <div 
          v-for="tab in tabs" 
          :key="tab.id" 
          :class="['tab-item', { active: activeTab === tab.id, loading: loading[tab.id] }]"
          @click="switchTab(tab.id)"
          :aria-label="tab.label"
          role="tab"
          :aria-selected="activeTab === tab.id"
        >
          <span class="tab-label">{{ tab.label }}</span>
          <span v-if="loading[tab.id]" class="tab-loading-indicator"></span>
        </div>
      </div>

      <div class="tab-content" :key="activeTab">
        <!-- 最近比赛信息 -->
        <div v-if="activeTab === 'recent'" class="tab-pane">
          <div class="pane-header">
            <h3>历史交锋</h3>
            <button v-if="recentMatches.length > 0" class="refresh-btn" @click="fetchRecentMatches" aria-label="刷新">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            </button>
          </div>
          
          <div class="recent-teams">
            <!-- 主队最近比赛 -->
            <div class="team-section">
              <h4 class="team-section-title">{{ matchData.homeTeam }} 最近比赛</h4>
              <div class="match-list">
                <div v-if="loading.recent" class="loading-state">
                  <div class="loading-spinner"></div>
                  <span>加载中...</span>
                </div>
                <div v-else-if="filteredHomeRecentMatches.length === 0" class="empty-state">
                  <span>暂无数据</span>
                </div>
                <div v-else>
                  <div 
                    v-for="match in filteredHomeRecentMatches" 
                    :key="match.id" 
                    class="recent-match-item"
                    :class="getMatchItemClass(match)"
                  >
                    <div class="match-header">
                      <span class="league">{{ match.league }}</span>
                      <span class="time">{{ formatDate(match.matchDate) }}</span>
                    </div>
                    <div class="match-result">
                      <span class="team home">{{ truncateText(match.homeTeam, 8) }}</span>
                      <span :class="getScoreClass(match)">
                        {{ parseScore(match.score).home }} - {{ parseScore(match.score).away }}
                      </span>
                      <span class="team away">{{ truncateText(match.awayTeam, 8) }}</span>
                    </div>
                    <div class="match-outcome">
                      <span :class="getOutcomeClass(match)">
                        {{ getMatchOutcome(match) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 客队最近比赛 -->
            <div class="team-section">
              <h4 class="team-section-title">{{ matchData.awayTeam }} 最近比赛</h4>
              <div class="match-list">
                <div v-if="loading.recent" class="loading-state">
                  <div class="loading-spinner"></div>
                  <span>加载中...</span>
                </div>
                <div v-else-if="filteredAwayRecentMatches.length === 0" class="empty-state">
                  <span>暂无数据</span>
                </div>
                <div v-else>
                  <div 
                    v-for="match in filteredAwayRecentMatches" 
                    :key="match.id" 
                    class="recent-match-item"
                    :class="getMatchItemClass(match)"
                  >
                    <div class="match-header">
                      <span class="league">{{ match.league }}</span>
                      <span class="time">{{ formatDate(match.matchDate) }}</span>
                    </div>
                    <div class="match-result">
                      <span class="team home">{{ truncateText(match.homeTeam, 8) }}</span>
                      <span :class="getScoreClass(match)">
                        {{ parseScore(match.score).home }} - {{ parseScore(match.score).away }}
                      </span>
                      <span class="team away">{{ truncateText(match.awayTeam, 8) }}</span>
                    </div>
                    <div class="match-outcome">
                      <span :class="getOutcomeClass(match)">
                        {{ getMatchOutcome(match) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- xG数据 -->
        <div v-if="activeTab === 'xg'" class="tab-pane">
          <div class="pane-header">
            <h3>预期进球(xG)分析</h3>
          </div>
          
          <div v-if="loading.xg" class="loading-state">
            <div class="loading-spinner"></div>
            <span>加载中...</span>
          </div>
          
          <div v-else-if="!xgData.home && !xgData.away" class="empty-state">
            <span>暂无数据</span>
          </div>
          
          <div v-else class="xg-content">
            <!-- xG对比图 -->
            <div class="xg-comparison">
              <div class="xg-team home">
                <div class="team-header">
                  <div class="team-name">{{ xgData.home?.teamName || matchData.homeTeam }}</div>
                  <div class="xg-value">{{ (xgData.home?.xg || 0).toFixed(2) }}</div>
                </div>
                <div class="xg-bar-container">
                  <div 
                    class="xg-bar" 
                    :style="{ width: homeXgPercent + '%' }"
                    :title="`xG: ${(xgData.home?.xg || 0).toFixed(2)}`"
                  >
                    <div class="xg-label">{{ homeXgPercent.toFixed(1) }}%</div>
                  </div>
                </div>
              </div>
              
              <div class="xg-vs">VS</div>
              
              <div class="xg-team away">
                <div class="team-header">
                  <div class="team-name">{{ xgData.away?.teamName || matchData.awayTeam }}</div>
                  <div class="xg-value">{{ (xgData.away?.xg || 0).toFixed(2) }}</div>
                </div>
                <div class="xg-bar-container">
                  <div 
                    class="xg-bar" 
                    :style="{ width: awayXgPercent + '%' }"
                    :title="`xG: ${(xgData.away?.xg || 0).toFixed(2)}`"
                  >
                    <div class="xg-label">{{ awayXgPercent.toFixed(1) }}%</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 详细数据卡片 -->
            <div class="xg-details">
              <div class="detail-category">
                <h4 class="category-title">基本战绩对比</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="label">比赛场次</span>
                    <div class="values">
                      <span class="value home">{{ xgData.home?.matches || 0 }}</span>
                      <span class="value away">{{ xgData.away?.matches || 0 }}</span>
                    </div>
                  </div>
                  <div class="detail-item">
                    <span class="label">胜/平/负</span>
                    <div class="values">
                      <span class="value home">
                        {{ xgData.home?.wins || 0 }}/{{ xgData.home?.draws || 0 }}/{{ xgData.home?.loses || 0 }}
                      </span>
                      <span class="value away">
                        {{ xgData.away?.wins || 0 }}/{{ xgData.away?.draws || 0 }}/{{ xgData.away?.loses || 0 }}
                      </span>
                    </div>
                  </div>
                  <div class="detail-item">
                    <span class="label">实际进球/失球</span>
                    <div class="values">
                      <span class="value home">{{ xgData.home?.goals || 0 }}/{{ xgData.home?.ga || 0 }}</span>
                      <span class="value away">{{ xgData.away?.goals || 0 }}/{{ xgData.away?.ga || 0 }}</span>
                    </div>
                  </div>
                  <div class="detail-item">
                    <span class="label">净胜球</span>
                    <div class="values">
                      <span class="value home">{{ xgData.home?.goalDifference || 0 }}</span>
                      <span class="value away">{{ xgData.away?.goalDifference || 0 }}</span>
                    </div>
                  </div>
                  <div class="detail-item">
                    <span class="label">积分</span>
                    <div class="values">
                      <span class="value home">{{ xgData.home?.points || 0 }}</span>
                      <span class="value away">{{ xgData.away?.points || 0 }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="detail-category">
                <h4 class="category-title">预期数据对比</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="label">预期进球(xG)</span>
                    <div class="values">
                      <span class="value home">{{ (xgData.home?.xg || 0).toFixed(2) }}</span>
                      <span class="value away">{{ (xgData.away?.xg || 0).toFixed(2) }}</span>
                    </div>
                  </div>
                  <div class="detail-item">
                    <span class="label">非点球xG</span>
                    <div class="values">
                      <span class="value home">{{ (xgData.home?.npxG || 0).toFixed(2) }}</span>
                      <span class="value away">{{ (xgData.away?.npxG || 0).toFixed(2) }}</span>
                    </div>
                  </div>
                  <div class="detail-item">
                    <span class="label">预期失球(xGA)</span>
                    <div class="values">
                      <span class="value home">{{ (xgData.home?.xga || 0).toFixed(2) }}</span>
                      <span class="value away">{{ (xgData.away?.xga || 0).toFixed(2) }}</span>
                    </div>
                  </div>
                  <div class="detail-item">
                    <span class="label">xG净胜球</span>
                    <div class="values">
                      <span class="value home">{{ ((xgData.home?.xg || 0) - (xgData.home?.xga || 0)).toFixed(2) }}</span>
                      <span class="value away">{{ ((xgData.away?.xg || 0) - (xgData.away?.xga || 0)).toFixed(2) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 相似比赛 -->
        <div v-if="activeTab === 'similar'" class="tab-pane">
          <div class="pane-header">
            <h3>相似盘口比赛</h3>
            <button v-if="similarMatches.length > 0" class="refresh-btn" @click="fetchSimilarMatches" aria-label="刷新">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            </button>
          </div>
          
          <div v-if="loading.similar" class="loading-state">
            <div class="loading-spinner"></div>
            <span>加载中...</span>
          </div>
          
          <div v-else-if="similarMatches.length === 0" class="empty-state">
            <span>暂无相似比赛数据</span>
          </div>
          
          <div v-else class="similar-list">
            <div 
              v-for="match in similarMatches" 
              :key="match.id" 
              class="similar-match-item"
              :class="getSimilarMatchClass(match)"
            >
              <div class="match-header">
                <span class="league">{{ match.league }}</span>
                <span class="time">{{ formatDate(match.matchDate) }}</span>
              </div>
              <div class="match-content">
                <div class="teams">
                  <span class="team home" :title="match.homeTeam">{{ truncateText(match.homeTeam, 10) }}</span>
                  <span class="score">{{ match.score }}</span>
                  <span class="team away" :title="match.awayTeam">{{ truncateText(match.awayTeam, 10) }}</span>
                </div>
                <div class="odds-info">
                  <div class="odds-values">
                    <span class="odds-item">主: {{ match.h }}</span>
                    <span class="odds-item">平: {{ match.d }}</span>
                    <span class="odds-item">客: {{ match.a }}</span>
                  </div>
                  <div class="match-result">
                    <span :class="getMatchResultClass(match)">
                      {{ getMatchResult(match) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 赔率变化 -->
        <div v-if="activeTab === 'odds'" class="tab-pane">
          <div class="pane-header">
            <h3>赔率变化趋势</h3>
            <button v-if="oddsHistory.length > 0" class="refresh-btn" @click="fetchOddsHistory" aria-label="刷新">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            </button>
          </div>

          <!-- 最新赔率概览 -->
          <div v-if="latestOdds" class="current-odds card">
            <h4>最新赔率</h4>
            <div class="odds-display">
              <div class="odds-type home">
                <span class="odds-label">主胜</span>
                <span class="odds-value">{{ latestOdds.h }}</span>
              </div>
              <div class="odds-type draw">
                <span class="odds-label">平局</span>
                <span class="odds-value">{{ latestOdds.d }}</span>
              </div>
              <div class="odds-type away">
                <span class="odds-label">客胜</span>
                <span class="odds-value">{{ latestOdds.a }}</span>
              </div>
            </div>
          </div>

          <!-- 赔率变化表格 -->
          <div class="odds-history">
            <h4>赔率变化记录</h4>
            <div class="scrollable-table">
              <table class="odds-table">
                <thead>
                  <tr>
                    <th>更新时间</th>
                    <th>主胜</th>
                    <th>平局</th>
                    <th>客胜</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(record, index) in oddsHistory" :key="record.id">
                    <td>
                      <div class="time-cell">
                        <div class="date">{{ formatOddsDate(record.updateDate) }}</div>
                        <div class="time">{{ record.updateTime }}</div>
                      </div>
                    </td>
                    <td :class="{ 'changed': index > 0 && record.h !== oddsHistory[index - 1].h }">
                      {{ record.h }}
                    </td>
                    <td :class="{ 'changed': index > 0 && record.d !== oddsHistory[index - 1].d }">
                      {{ record.d }}
                    </td>
                    <td :class="{ 'changed': index > 0 && record.a !== oddsHistory[index - 1].a }">
                      {{ record.a }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted,watch, nextTick } from 'vue'
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
  { id: 'odds', label: '赔率变化' }
]

const activeTab = ref('recent')
const loadedTabs = ref(new Set<string>()) // 记录已加载的标签页

// 从路由获取比赛ID
const matchId = computed(() => route.params.matchId as string)

// 加载状态
const loading = ref({
  recent: false,
  xg: false,
  similar: false,
  intelligence: false,
  odds: false
})

// 数据状态
const recentMatches = ref<RecentMatch[]>([])
const xgData = ref<XgData>({
  home: null,
  away: null,
  all: null
})
const similarMatches = ref<SimilarMatch[]>([])
const intelligenceData = ref('')
const oddsHistory = ref<OddsRecord[]>([])
const oddsAnalysis = ref('赔率变化分析...')

// 计算属性
const latestOdds = computed(() => {
  if (oddsHistory.value.length === 0) return null
  return oddsHistory.value[oddsHistory.value.length - 1]
})

const homeXgPercent = computed(() => {
  const homeXg = xgData.value.home?.xg || 0
  const awayXg = xgData.value.away?.xg || 0
  const total = homeXg + awayXg
  return total > 0 ? (homeXg / total) * 100 : 50
})

const awayXgPercent = computed(() => {
  const homeXg = xgData.value.home?.xg || 0
  const awayXg = xgData.value.away?.xg || 0
  const total = homeXg + awayXg
  return total > 0 ? (awayXg / total) * 100 : 50
})

const filteredHomeRecentMatches = computed(() => {
  return recentMatches.value
    .filter(match => 
      match.homeTeam === matchData.value.homeTeam ||
      match.awayTeam === matchData.value.homeTeam
    )
    .slice(0, 5)
})

const filteredAwayRecentMatches = computed(() => {
  return recentMatches.value
    .filter(match => 
      match.homeTeam === matchData.value.awayTeam ||
      match.awayTeam === matchData.value.awayTeam
    )
    .slice(0, 5)
})

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
    return date.toLocaleDateString('zh-CN', { 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(',', '')
  } catch (e) {
    return dateString
  }
}

const formatOddsDate = (dateString: string) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', { 
      month: '2-digit', 
      day: '2-digit'
    })
  } catch (e) {
    return dateString
  }
}

const parseScore = (score: string) => {
  if (!score) return { home: 0, away: 0 }
  const [home, away] = score.split('-').map(s => parseInt(s.trim()) || 0)
  return { home, away }
}

const truncateText = (text: string, maxLength: number) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

// 比赛相关方法
const getMatchOutcome = (match: RecentMatch) => {
  const score = parseScore(match.score)
  const isHomeTeam = match.homeTeam === matchData.value.homeTeam || 
                     match.awayTeam === matchData.value.homeTeam
  
  if (isHomeTeam) {
    if (score.home > score.away && match.homeTeam.includes(matchData.value.homeTeam)) return '胜'
    if (score.home < score.away && match.awayTeam.includes(matchData.value.homeTeam)) return '胜'
    if (score.home === score.away) return '平'
    return '负'
  } else {
    if (score.home > score.away && match.homeTeam.includes(matchData.value.awayTeam)) return '胜'
    if (score.home < score.away && match.awayTeam.includes(matchData.value.awayTeam)) return '胜'
    if (score.home === score.away) return '平'
    return '负'
  }
}

const getScoreClass = (match: RecentMatch) => {
  const outcome = getMatchOutcome(match)
  return {
    'score': true,
    'score-win': outcome === '胜',
    'score-draw': outcome === '平',
    'score-lose': outcome === '负'
  }
}

const getOutcomeClass = (match: RecentMatch) => {
  const outcome = getMatchOutcome(match)
  return {
    'outcome': true,
    'outcome-win': outcome === '胜',
    'outcome-draw': outcome === '平',
    'outcome-lose': outcome === '负'
  }
}

const getMatchItemClass = (match: RecentMatch) => {
  const outcome = getMatchOutcome(match)
  return {
    'win': outcome === '胜',
    'draw': outcome === '平',
    'lose': outcome === '负'
  }
}

const getMatchResult = (match: SimilarMatch) => {
  const score = parseScore(match.score)
  if (score.home > score.away) return '主胜'
  if (score.home < score.away) return '客胜'
  return '平局'
}

const getMatchResultClass = (match: SimilarMatch) => {
  const result = getMatchResult(match)
  return {
    'result': true,
    'result-home': result === '主胜',
    'result-draw': result === '平局',
    'result-away': result === '客胜'
  }
}

const getSimilarMatchClass = (match: SimilarMatch) => {
  const result = getMatchResult(match)
  return {
    'home-win': result === '主胜',
    'draw': result === '平局',
    'away-win': result === '客胜'
  }
}

// 标签页切换
const switchTab = async (tabId: string) => {
  if (activeTab.value === tabId) return
  
  activeTab.value = tabId
  await nextTick()
  
  // 滚动到顶部
  const contentEl = document.querySelector('.tab-content')
  if (contentEl) {
    contentEl.scrollTop = 0
  }
  
  // 加载数据
  loadTabData(tabId)
}

// 数据加载
const loadTabData = async (tabId: string) => {
  // 如果已经加载过，不再重复加载
  if (loadedTabs.value.has(tabId)) return
  
  switch (tabId) {
    case 'recent':
      await fetchRecentMatches()
      loadedTabs.value.add('recent')
      break
    case 'xg':
      await fetchXgData()
      loadedTabs.value.add('xg')
      break
    case 'similar':
      await fetchSimilarMatches()
      loadedTabs.value.add('similar')
      break
    case 'odds':
      await fetchOddsHistory()
      loadedTabs.value.add('odds')
      break
  }
}

// API 调用方法
const fetchRecentMatches = async () => {
  try {
    loading.value.recent = true
    const response = await matchApi.getRecentMatches(matchId.value)
    recentMatches.value = response
  } catch (error) {
    console.error('获取近期战绩失败:', error)
    recentMatches.value = []
    // 可以在这里添加错误提示
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

const fetchOddsHistory = async () => {
  try {
    loading.value.odds = true
    const response = await matchApi.getOddsHistory(matchId.value)
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
  // 初始加载第一个标签页的数据
  loadTabData(activeTab.value)
  
  // 监听窗口大小变化，优化移动端体验
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const handleResize = () => {
  // 可以在这里处理响应式布局的调整
}
</script>

<style scoped>
/* 将所有的 SCSS 语法转换为纯 CSS */
.analysis-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
  position: relative;
}

.analysis-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 240px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 0;
}

/* 卡片通用样式 */
.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
  overflow: hidden;
}

/* 页面头部 */
.page-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn svg {
  transition: transform 0.3s ease;
}

.back-btn:hover {
  transform: translateX(-2px);
}

.back-btn:hover svg {
  transform: translateX(-2px);
}

.back-btn:active {
  transform: translateX(0);
}

.page-title {
  flex: 1;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  text-align: center;
}

/* 比赛基本信息 */
.match-basic-info {
  margin: 0 16px 16px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.match-basic-info .teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.match-basic-info .team {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.match-basic-info .team.home-team {
  text-align: right;
}

.match-basic-info .team.away-team {
  text-align: left;
}

.match-basic-info .team-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.match-basic-info .team-name {
  font-size: 18px;
  font-weight: 600;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.match-basic-info .team-rank {
  font-size: 12px;
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.match-basic-info .vs {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  padding: 0 8px;
}

.match-basic-info .match-meta {
  display: flex;
  justify-content: center;
  gap: 16px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

/* 标签页 */
.analysis-tabs {
  margin: 0 16px 16px;
  min-height: 400px;
}

.analysis-tabs .tabs-header {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  position: sticky;
  top: 73px;
  z-index: 10;
  backdrop-filter: blur(10px);
}

.analysis-tabs .tabs-header .tab-item {
  flex: 1;
  text-align: center;
  padding: 14px 8px;
  font-size: 14px;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  user-select: none;
}

.analysis-tabs .tabs-header .tab-item:hover {
  background: rgba(0, 0, 0, 0.02);
}

.analysis-tabs .tabs-header .tab-item.active {
  color: #667eea;
  font-weight: 500;
}

.analysis-tabs .tabs-header .tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px 2px 0 0;
}

.analysis-tabs .tabs-header .tab-item.loading .tab-label {
  opacity: 0.7;
}

.analysis-tabs .tabs-header .tab-item.loading .tab-loading-indicator {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border: 2px solid #e9ecef;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.tab-content {
  padding: 20px;
  max-height: calc(100vh - 250px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 通用面板样式 */
.tab-pane .pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tab-pane .pane-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.tab-pane .pane-header .refresh-btn {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-pane .pane-header .refresh-btn:hover {
  background: #e9ecef;
  transform: rotate(180deg);
}

.tab-pane .pane-header .refresh-btn svg {
  display: block;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #6c757d;
}

.loading-state .loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

.loading-state span {
  font-size: 14px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #adb5bd;
  font-size: 14px;
}

/* 最近比赛样式 */
.recent-teams .team-section {
  margin-bottom: 24px;
}

.recent-teams .team-section:last-child {
  margin-bottom: 0;
}

.recent-teams .team-section-title {
  font-size: 16px;
  font-weight: 500;
  color: #495057;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f8f9fa;
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recent-match-item {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.recent-match-item.win {
  border-color: #52c41a;
  background: linear-gradient(135deg, rgba(82, 196, 26, 0.1) 0%, rgba(82, 196, 26, 0.05) 100%);
}

.recent-match-item.draw {
  border-color: #faad14;
  background: linear-gradient(135deg, rgba(250, 173, 20, 0.1) 0%, rgba(250, 173, 20, 0.05) 100%);
}

.recent-match-item.lose {
  border-color: #ff4d4f;
  background: linear-gradient(135deg, rgba(255, 77, 79, 0.1) 0%, rgba(255, 77, 79, 0.05) 100%);
}

.recent-match-item .match-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 11px;
  color: #6c757d;
}

.recent-match-item .match-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.recent-match-item .match-result .team {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-match-item .match-result .team.home {
  text-align: left;
  padding-right: 8px;
}

.recent-match-item .match-result .team.away {
  text-align: right;
  padding-left: 8px;
}

.recent-match-item .match-result .score {
  flex-shrink: 0;
  font-size: 16px;
  font-weight: 600;
  padding: 0 8px;
  min-width: 60px;
  text-align: center;
}

.recent-match-item .match-result .score.score-win {
  color: #52c41a;
}

.recent-match-item .match-result .score.score-draw {
  color: #faad14;
}

.recent-match-item .match-result .score.score-lose {
  color: #ff4d4f;
}

.recent-match-item .match-outcome {
  text-align: center;
}

.recent-match-item .match-outcome .outcome {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.recent-match-item .match-outcome .outcome.outcome-win {
  background: #52c41a;
  color: white;
}

.recent-match-item .match-outcome .outcome.outcome-draw {
  background: #faad14;
  color: white;
}

.recent-match-item .match-outcome .outcome.outcome-lose {
  background: #ff4d4f;
  color: white;
}

/* xG数据样式 */
.xg-content .xg-comparison {
  margin-bottom: 24px;
}

.xg-content .xg-comparison .xg-team .team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.xg-content .xg-comparison .xg-team .team-header .team-name {
  font-size: 14px;
  font-weight: 500;
  color: #495057;
}

.xg-content .xg-comparison .xg-team .team-header .xg-value {
  font-size: 16px;
  font-weight: 600;
  color: #667eea;
}

.xg-content .xg-comparison .xg-team.home .xg-bar-container {
  direction: rtl;
}

.xg-content .xg-comparison .xg-bar-container {
  height: 24px;
  background: #e9ecef;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.xg-content .xg-comparison .xg-bar {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 1s ease;
  position: relative;
}

.xg-content .xg-comparison .xg-bar .xg-label {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.xg-content .xg-comparison .xg-team.home .xg-bar .xg-label {
  right: 8px;
}

.xg-content .xg-comparison .xg-team.away .xg-bar .xg-label {
  left: 8px;
}

.xg-content .xg-comparison .xg-vs {
  text-align: center;
  margin: 12px 0;
  color: #adb5bd;
  font-weight: 600;
  font-size: 14px;
}

.xg-content .xg-details .detail-category {
  margin-bottom: 20px;
}

.xg-content .xg-details .detail-category:last-child {
  margin-bottom: 0;
}

.xg-content .xg-details .detail-category .category-title {
  font-size: 15px;
  font-weight: 500;
  color: #495057;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f8f9fa;
}

.xg-content .xg-details .detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.xg-content .xg-details .detail-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
}

.xg-content .xg-details .detail-item .label {
  display: block;
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 6px;
}

.xg-content .xg-details .detail-item .values {
  display: flex;
  justify-content: space-between;
}

.xg-content .xg-details .detail-item .values .value {
  font-size: 13px;
  font-weight: 500;
  color: #495057;
}

.xg-content .xg-details .detail-item .values .value.home {
  color: #667eea;
}

.xg-content .xg-details .detail-item .values .value.away {
  color: #764ba2;
}

/* 相似比赛样式 */
.similar-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.similar-match-item {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.similar-match-item.home-win {
  border-color: #52c41a;
  background: linear-gradient(135deg, rgba(82, 196, 26, 0.1) 0%, rgba(82, 196, 26, 0.05) 100%);
}

.similar-match-item.draw {
  border-color: #faad14;
  background: linear-gradient(135deg, rgba(250, 173, 20, 0.1) 0%, rgba(250, 173, 20, 0.05) 100%);
}

.similar-match-item.away-win {
  border-color: #ff4d4f;
  background: linear-gradient(135deg, rgba(255, 77, 79, 0.1) 0%, rgba(255, 77, 79, 0.05) 100%);
}

.similar-match-item .match-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 11px;
  color: #6c757d;
}

.similar-match-item .match-content .teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.similar-match-item .match-content .teams .team {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.similar-match-item .match-content .teams .team.home {
  text-align: left;
  padding-right: 8px;
}

.similar-match-item .match-content .teams .team.away {
  text-align: right;
  padding-left: 8px;
}

.similar-match-item .match-content .teams .score {
  flex-shrink: 0;
  font-size: 18px;
  font-weight: 600;
  padding: 0 8px;
  min-width: 60px;
  text-align: center;
}

.similar-match-item .match-content .odds-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.similar-match-item .match-content .odds-info .odds-values {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6c757d;
}

.similar-match-item .match-content .odds-info .odds-values .odds-item {
  background: white;
  padding: 4px 8px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.similar-match-item .match-content .odds-info .match-result .result {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.similar-match-item .match-content .odds-info .match-result .result.result-home {
  background: #52c41a;
  color: white;
}

.similar-match-item .match-content .odds-info .match-result .result.result-draw {
  background: #faad14;
  color: white;
}

.similar-match-item .match-content .odds-info .match-result .result.result-away {
  background: #ff4d4f;
  color: white;
}

/* 赔率样式 */
.current-odds {
  padding: 16px;
  margin-bottom: 20px;
}

.current-odds h4 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 500;
  color: #495057;
}

.current-odds .odds-display {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.current-odds .odds-display .odds-type {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: #f8f9fa;
}

.current-odds .odds-display .odds-type.home {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(102, 126, 234, 0.05) 100%);
}

.current-odds .odds-display .odds-type.draw {
  background: linear-gradient(135deg, rgba(250, 173, 20, 0.1) 0%, rgba(250, 173, 20, 0.05) 100%);
}

.current-odds .odds-display .odds-type.away {
  background: linear-gradient(135deg, rgba(118, 75, 162, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.current-odds .odds-display .odds-type .odds-label {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 4px;
}

.current-odds .odds-display .odds-type .odds-value {
  font-size: 18px;
  font-weight: 600;
}

.current-odds .odds-display .odds-type.home .odds-value {
  color: #667eea;
}

.current-odds .odds-display .odds-type.draw .odds-value {
  color: #faad14;
}

.current-odds .odds-display .odds-type.away .odds-value {
  color: #764ba2;
}

.odds-history .scrollable-table {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 0 -20px;
  padding: 0 20px;
}

.odds-history .odds-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 500px;
}

.odds-history .odds-table th,
.odds-history .odds-table td {
  padding: 12px 8px;
  text-align: center;
  border-bottom: 1px solid #e9ecef;
}

.odds-history .odds-table th {
  background: #f8f9fa;
  font-weight: 500;
  color: #495057;
  font-size: 13px;
  position: sticky;
  top: 0;
  z-index: 1;
}

.odds-history .odds-table td {
  font-size: 14px;
  color: #6c757d;
}

.odds-history .odds-table td.changed {
  background: #fff7e6;
  color: #fa8c16;
  font-weight: 500;
  position: relative;
}

.odds-history .odds-table td.changed::before {
  content: '↕';
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
}

.odds-history .odds-table td .time-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.odds-history .odds-table td .time-cell .date {
  font-size: 13px;
  font-weight: 500;
}

.odds-history .odds-table td .time-cell .time {
  font-size: 11px;
  color: #adb5bd;
}

.odds-history .odds-table tr:hover {
  background: #f8f9fa;
}

/* 动画 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式调整 - 768px */
@media (max-width: 768px) {
  .analysis-page::before {
    height: 200px;
  }
  
  .page-header {
    padding: 12px 16px;
  }
  
  .back-btn {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .back-btn svg {
    width: 14px;
    height: 14px;
  }
  
  .page-title {
    font-size: 16px;
  }
  
  .match-basic-info {
    margin: 0 12px 12px;
    padding: 16px;
  }
  
  .match-basic-info .team-name {
    font-size: 16px;
    max-width: 100px;
  }
  
  .match-basic-info .vs {
    font-size: 12px;
  }
  
  .match-basic-info .match-meta {
    font-size: 12px;
  }
  
  .analysis-tabs {
    margin: 0 12px 12px;
  }
  
  .analysis-tabs .tabs-header .tab-item {
    padding: 12px 4px;
    font-size: 13px;
  }
  
  .analysis-tabs .tabs-header .tab-item .tab-label {
    display: block;
    max-width: 60px;
    margin: 0 auto;
  }
  
  .tab-content {
    padding: 16px;
    max-height: calc(100vh - 220px);
  }
  
  .tab-pane .pane-header {
    margin-bottom: 16px;
  }
  
  .tab-pane .pane-header h3 {
    font-size: 16px;
  }
  
  .recent-match-item,
  .similar-match-item {
    padding: 10px;
  }
  
  .current-odds .odds-display {
    flex-direction: column;
    gap: 8px;
  }
  
  .current-odds .odds-display .odds-type {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
  }
  
  .current-odds .odds-display .odds-type .odds-label {
    margin-bottom: 0;
  }
  
  .odds-history .odds-table {
    min-width: 400px;
  }
  
  .odds-history .odds-table th,
  .odds-history .odds-table td {
    padding: 10px 6px;
    font-size: 12px;
  }
}

/* 响应式调整 - 480px */
@media (max-width: 480px) {
  .match-basic-info .team-name {
    font-size: 14px;
    max-width: 80px;
  }
  
  .match-basic-info .team-rank {
    font-size: 10px;
  }
  
  .analysis-tabs .tabs-header .tab-item {
    font-size: 12px;
    padding: 10px 2px;
  }
  
  .recent-match-item .match-result .score {
    font-size: 14px;
    min-width: 50px;
  }
  
  .similar-match-item .match-content .teams .score {
    font-size: 16px;
    min-width: 50px;
  }
  
  .xg-content .detail-grid {
    grid-template-columns: 1fr;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .back-btn,
  .tab-item,
  .refresh-btn,
  .recent-match-item,
  .similar-match-item {
    min-height: 44px;
  }
  
  .back-btn,
  .tab-item {
    touch-action: manipulation;
  }
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .analysis-page {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }
  
  .analysis-page::before {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }
  
  .card {
    background: #2d3748;
    color: #e2e8f0;
  }
  
  .page-header {
    background: rgba(45, 55, 72, 0.95);
    border-bottom-color: #4a5568;
  }
  
  .page-title {
    color: #e2e8f0;
  }
  
  .match-basic-info {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  .analysis-tabs .tabs-header {
    background: #1a202c;
    border-bottom-color: #4a5568;
  }
  
  .analysis-tabs .tabs-header .tab-item {
    color: #a0aec0;
  }
  
  .analysis-tabs .tabs-header .tab-item.active {
    color: #667eea;
  }
  
  .tab-pane .pane-header h3 {
    color: #e2e8f0;
  }
  
  .recent-match-item,
  .similar-match-item,
  .detail-item,
  .odds-type {
    background: #1a202c;
  }
  
  .odds-history .odds-table th {
    background: #1a202c;
    color: #e2e8f0;
  }
  
  .odds-history .odds-table td {
    color: #a0aec0;
  }
  
  .odds-history .odds-table td.changed {
    background: #2d3748;
    color: #fa8c16;
  }
  
  .odds-history .odds-table tr:hover {
    background: #1a202c;
  }
}
</style>