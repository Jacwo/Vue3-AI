<template>
  <div class="match-data-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-title">
        <h1>比赛数据</h1>
        <p class="subtitle">实时比赛列表 · 点击球队名查询历史 AI 预测</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="fetchMatchList" :loading="loading">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 比赛列表 -->
    <div class="match-list-section">
      <div class="section-header">
        <div class="section-title">
          <span class="section-dot"></span>
          <span>比赛列表</span>
          <el-tag size="small" type="info" round>{{ matchList.length }} 场</el-tag>
        </div>
      </div>

      <!-- PC 端表格 -->
      <div class="table-section pc-only">
        <el-table :data="matchList" stripe style="width: 100%" v-loading="loading" empty-text="暂无比赛数据">
          <el-table-column prop="matchNumStr" label="场次" width="80" align="center" />
          <el-table-column prop="league" label="联赛" min-width="110" />
          <el-table-column label="比赛" min-width="200">
            <template #default="scope">
              <div class="team-match">
                <span class="team-cell team-link" @click="queryHistoryByTeam(scope.row.homeTeam, scope.row, 'home')">
                  {{ scope.row.homeTeam }}
                </span>
                <span class="vs">vs</span>
                <span class="team-cell team-link" @click="queryHistoryByTeam(scope.row.awayTeam, scope.row, 'away')">
                  {{ scope.row.awayTeam }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="赔率(主/平/客)" width="170" align="center">
            <template #default="scope">
              <div class="odds-cell">
                <span class="odds-value odds-home">{{ formatOdds(scope.row.odds?.home) }}</span>
                <span class="odds-sep">/</span>
                <span class="odds-value odds-draw">{{ formatOdds(scope.row.odds?.draw) }}</span>
                <span class="odds-sep">/</span>
                <span class="odds-value odds-away">{{ formatOdds(scope.row.odds?.away) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="matchTime" label="比赛时间" width="110" align="center" />
          <el-table-column label="状态" width="90" align="center">
            <template #default="scope">
              <el-tag :type="getMatchStatusType(scope.row.matchStatusName, scope.row.status)" size="small">
                {{ scope.row.matchStatusName || scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="单关" width="70" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.isSingleMatch" type="danger" size="small" effect="dark">单关</el-tag>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 移动端比赛列表（单行紧凑布局） -->
      <div class="mobile-history mobile-only" v-loading="loading">
        <div v-if="matchList.length === 0" class="empty-state">暂无比赛数据</div>
        <div v-for="match in matchList" :key="match.id" class="match-row">
          <div class="mr-main">
            <span class="mr-league">{{ match.league }}</span>
            <span class="mr-teams">
              <span class="mr-team team-link" @click="queryHistoryByTeam(match.homeTeam, match, 'home')">
                {{ match.homeTeam }}
              </span>
              <span class="mr-vs">vs</span>
              <span class="mr-team team-link" @click="queryHistoryByTeam(match.awayTeam, match, 'away')">
                {{ match.awayTeam }}
              </span>
            </span>
            <span class="mr-status">
              <el-tag
                v-if="match.isSingleMatch"
                type="danger"
                size="small"
                effect="dark"
                round
              >单关</el-tag>
              <el-tag :type="getMatchStatusType(match.matchStatusName, match.status)" size="small" round>
                {{ match.matchStatusName || match.status }}
              </el-tag>
            </span>
          </div>
          <div class="mr-sub">
            <span class="mr-meta">{{ match.matchNumStr }} · {{ match.matchTime }}</span>
            <span class="mr-odds" v-if="hasOdds(match)">
              {{ formatOdds(match.odds?.home) }}/{{ formatOdds(match.odds?.draw) }}/{{ formatOdds(match.odds?.away) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史预测抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="drawerTitle"
      :size="drawerSize"
      class="history-drawer"
      @close="clearHistory"
    >
      <el-empty
        v-if="historyList.length === 0 && !historyLoading"
        description="未查询到相关历史预测"
        :image-size="100"
      />

      <!-- PC 端历史预测表格 -->
      <div v-if="historyList.length > 0" class="table-section pc-only" v-loading="historyLoading">
        <el-table :data="historyRows" stripe style="width: 100%" empty-text="暂无历史预测">
          <el-table-column label="比赛" min-width="220">
            <template #default="scope">
              <div class="team-match">
                <span class="team-cell team-link" @click="queryHistoryByTeam(scope.row.homeTeam, undefined, 'home')">
                  {{ scope.row.homeTeam }}
                </span>
                <span class="vs">vs</span>
                <span class="team-cell team-link" @click="queryHistoryByTeam(scope.row.awayTeam, undefined, 'away')">
                  {{ scope.row.awayTeam }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="比赛时间" width="150" align="center">
            <template #default="scope">
              {{ formatDateTime(scope.row.matchTime) }}
            </template>
          </el-table-column>
          <el-table-column label="历史比分" width="130" align="center">
            <template #default="scope">
              <div v-if="scope.row.resultInfo" class="history-result">
                <span class="history-score">
                  {{ scope.row.resultInfo.homeScore }}:{{ scope.row.resultInfo.awayScore }}
                </span>
                <el-tag size="small" :type="getResultTagTypeByWinner(scope.row.resultInfo.winner)" round>
                  {{ scope.row.resultInfo.resultText }}
                </el-tag>
              </div>
              <span v-else class="history-not-finished">未结束</span>
            </template>
          </el-table-column>
          <el-table-column label="赔率(主/平/客)" width="180" align="center">
            <template #default="scope">
              <div class="odds-cell">
                <span class="odds-value odds-home">{{ scope.row.homeWin || '-' }}</span>
                <span class="odds-sep">/</span>
                <span class="odds-value odds-draw">{{ scope.row.draw || '-' }}</span>
                <span class="odds-sep">/</span>
                <span class="odds-value odds-away">{{ scope.row.awayWin || '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="AI比分" width="90" align="center">
            <template #default="scope">
              <span class="score-text">{{ scope.row.aiScore || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="胜平负" width="110" align="center">
            <template #default="scope">
              <el-tag size="small" :type="getResultTagType(scope.row.aiResult)" round>
                {{ scope.row.aiResult || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="让球" width="120" align="center">
            <template #default="scope">
              <el-tag size="small" type="warning" round>
                {{ scope.row.aiLetResult || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="半全场" width="110" align="center">
            <template #default="scope">
              {{ scope.row.aiHalfFull || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="总球数" width="90" align="center">
            <template #default="scope">
              <span class="goals-text">{{ scope.row.aiTotalGoals || '-' }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 移动端历史预测（单行紧凑布局） -->
      <div v-if="historyList.length > 0" class="mobile-history mobile-only" v-loading="historyLoading">
        <div
          v-for="(item, index) in historyRows"
          :key="index"
          class="history-row"
        >
          <div class="hr-main">
            <span class="hr-teams">
              <span
                class="hr-team team-link"
                :class="{ 'team-query-highlight': item.homeTeam === currentQueryTeam }"
                @click="queryHistoryByTeam(item.homeTeam, undefined, 'home')"
              >
                {{ item.homeTeam }}
              </span>
              <span v-if="item.resultInfo" class="hr-score" :class="'hr-score-' + item.resultInfo.winner">
                {{ item.resultInfo.homeScore }}:{{ item.resultInfo.awayScore }}
              </span>
              <span v-else class="hr-score hr-score-none">vs</span>
              <span
                class="hr-team team-link"
                :class="{ 'team-query-highlight': item.awayTeam === currentQueryTeam }"
                @click="queryHistoryByTeam(item.awayTeam, undefined, 'away')"
              >
                {{ item.awayTeam }}
              </span>
            </span>
            <span class="hr-ai">
              <span class="hr-ai-score">{{ item.aiScore || '-' }}</span>
              <el-tag size="small" :type="getResultTagType(item.aiResult)" round effect="light">
                {{ item.aiResult || '-' }}
              </el-tag>
            </span>
          </div>
          <div class="hr-sub">
            <span class="hr-time">{{ formatDateTime(item.matchTime) }}</span>
            <span class="hr-odds" v-if="item.homeWin || item.draw || item.awayWin">
              {{ item.homeWin || '-' }}/{{ item.draw || '-' }}/{{ item.awayWin || '-' }}
            </span>
            <span class="hr-extra">
              让{{ item.aiLetResult || '-' }} · 半{{ item.aiHalfFull || '-' }} · 球{{ item.aiTotalGoals || '-' }}
            </span>
          </div>
        </div>
      </div>
    </el-drawer>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { matchApi, type Match, type TeamAnalysisHistory } from '@/api/match'

// 状态管理
const matchList = ref<Match[]>([])
const loading = ref(false)

// 历史预测查询（点击球队名触发）
const currentQueryTeam = ref('')
const historyList = ref<TeamAnalysisHistory[]>([])
const historyLoading = ref(false)
const historySearched = ref(false)

// 历史预测抽屉
const drawerVisible = ref(false)
const isMobile = computed(() => window.innerWidth < 768)
const drawerSize = computed(() => (isMobile.value ? '94%' : '660px'))
const drawerTitle = computed(() => {
  const team = currentQueryTeam.value || '球队'
  return `${team} · 历史预测（${historyList.value.length} 条）`
})

// 获取比赛列表
const fetchMatchList = async () => {
  loading.value = true
  try {
    const data = await matchApi.getMatchList()
    matchList.value = Array.isArray(data) ? data : []
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : '获取比赛数据失败')
    matchList.value = []
  } finally {
    loading.value = false
  }
}

// 计算一条历史记录与当前比赛赔率的接近程度（越小越接近，-1 表示无赔率数据）
const oddsDistance = (item: TeamAnalysisHistory, currentOdds: Match['odds']): number => {
  const oh = parseFloat(item.homeWin)
  const od = parseFloat(item.draw)
  const oa = parseFloat(item.awayWin)
  let dist = 0
  let count = 0
  if (!isNaN(oh) && currentOdds.home != null) { dist += Math.abs(oh - currentOdds.home); count++ }
  if (!isNaN(od) && currentOdds.draw != null) { dist += Math.abs(od - currentOdds.draw); count++ }
  if (!isNaN(oa) && currentOdds.away != null) { dist += Math.abs(oa - currentOdds.away); count++ }
  return count === 0 ? -1 : dist
}

// 按赔率接近度排序（无赔率数据的排最后）
const sortHistoryByOdds = (list: TeamAnalysisHistory[], currentOdds: Match['odds']): TeamAnalysisHistory[] => {
  return [...list].sort((a, b) => {
    const distA = oddsDistance(a, currentOdds)
    const distB = oddsDistance(b, currentOdds)
    if (distA === -1 && distB === -1) return 0
    if (distA === -1) return 1
    if (distB === -1) return -1
    return distA - distB
  })
}

// 按球队名查询历史预测（点击主队/客队名称触发）
// sourceMatch：被点击球队所在的比赛（用于按赔率接近度排序）
// side：被点击的是主队还是客队（点主队传 homeTeam 参数，点客队传 awayTeam 参数）
const queryHistoryByTeam = async (
  teamName: string,
  sourceMatch?: Match,
  side?: 'home' | 'away'
) => {
  if (!teamName) return
  currentQueryTeam.value = teamName
  historyLoading.value = true
  historySearched.value = true
  drawerVisible.value = true
  try {
    // 点主队传 homeTeam 参数，点客队传 awayTeam 参数
    const data = side === 'away'
      ? await matchApi.getTeamAnalysisHistory(undefined, teamName)
      : await matchApi.getTeamAnalysisHistory(teamName)
    let list: TeamAnalysisHistory[] = Array.isArray(data) ? data : []
    // 有当前比赛赔率时，按赔率接近度排序
    const currentOdds = sourceMatch?.odds
    if (currentOdds && list.length > 0) {
      list = sortHistoryByOdds(list, currentOdds)
    }
    historyList.value = list
    if (historyList.value.length === 0) {
      ElMessage.info(`「${teamName}」暂无历史预测记录`)
    }
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : '查询历史预测失败')
    historyList.value = []
  } finally {
    historyLoading.value = false
  }
}

// 清空历史查询
const clearHistory = () => {
  currentQueryTeam.value = ''
  historyList.value = []
  historySearched.value = false
}

// 解析历史比赛结果（兼容 "2-1" 和 "2:1" 两种格式；无法解析返回 null）
const parseMatchResult = (result: string): {
  homeScore: number
  awayScore: number
  winner: 'home' | 'away' | 'draw'
  resultText: string
} | null => {
  if (!result) return null
  const m = result.trim().match(/(\d+)\s*[:：-]\s*(\d+)/)
  if (!m) return null
  const homeScore = parseInt(m[1])
  const awayScore = parseInt(m[2])
  let winner: 'home' | 'away' | 'draw' = 'draw'
  let resultText = '平局'
  if (homeScore > awayScore) {
    winner = 'home'
    resultText = '主胜'
  } else if (homeScore < awayScore) {
    winner = 'away'
    resultText = '客胜'
  }
  return { homeScore, awayScore, winner, resultText }
}

// 历史结果标签类型
const getResultTagTypeByWinner = (winner: 'home' | 'away' | 'draw'): string => {
  if (winner === 'home') return 'danger'
  if (winner === 'away') return 'success'
  return 'warning'
}

// 历史记录行（附带解析后的比赛结果）
const historyRows = computed(() => {
  return historyList.value.map((item) => ({
    ...item,
    resultInfo: parseMatchResult(item.matchResult)
  }))
})

// 格式化时间
const formatDateTime = (time: string): string => {
  if (!time) return '-'
  const str = time.replace('T', ' ')
  return str.length > 16 ? str.substring(0, 16) : str
}

// 预测结果标签类型
const getResultTagType = (result: string): string => {
  if (!result) return 'info'
  if (result.includes('胜')) return 'success'
  if (result.includes('负')) return 'danger'
  if (result.includes('平')) return 'warning'
  return 'info'
}

// 格式化赔率
const formatOdds = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '-'
  return value.toFixed(2)
}

// 是否有赔率数据
const hasOdds = (match: Match): boolean => {
  const o = match.odds
  return !!(o && (o.home !== null || o.draw !== null || o.away !== null))
}

// 获取比赛状态标签类型
const getMatchStatusType = (name: string, status: string): string => {
  const statusMap: Record<string, string> = {
    '未开赛': 'info',
    '进行中': 'warning',
    '已结束': 'success',
    '延期': 'danger'
  }
  if (name && statusMap[name]) return statusMap[name]
  if (status === '2') return 'info'
  if (status === '4') return 'warning'
  return 'info'
}

// 初始化
onMounted(() => {
  fetchMatchList()
})
</script>

<style scoped>
.match-data-container {
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
  background: #f5f7fa;
  min-height: 100vh;
}

/* ========== 页面头部 ========== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
  background: #fff;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.page-title h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(90deg, #1a1a2e, #409eff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: #909399;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

/* ========== 区块标题 ========== */
/* 历史预测抽屉 */
.history-drawer .el-drawer__header {
  margin-bottom: 0;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f2f5;
  font-weight: 700;
  color: #1a1a2e;
}

.history-drawer .el-drawer__body {
  padding: 16px;
  background: #f7f9fc;
  overflow-y: auto;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}

.section-dot {
  width: 4px;
  height: 16px;
  border-radius: 2px;
  background: linear-gradient(180deg, #409eff, #79bbff);
}

/* ========== 表格区域 ========== */
.table-section {
  background: white;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table-section :deep(.el-table__header th) {
  background: #f5f7fa;
  color: #606266;
  font-weight: 600;
}

.text-muted {
  color: #bbb;
}

.team-match {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.team-cell {
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.score-text {
  font-weight: 700;
  color: #409eff;
}

.goals-text {
  font-weight: 600;
  color: #e6a23c;
}

/* ========== 历史比分展示 ========== */
.history-result {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.history-score {
  font-weight: 700;
  font-size: 14px;
  color: #1a1a2e;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
}

.history-not-finished {
  font-size: 12px;
  color: #c0c4cc;
}

/* 当前查询球队高亮 */
.team-query-highlight {
  color: #409eff !important;
  font-weight: 700;
}

/* ========== 赔率展示 ========== */
.odds-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
}

.odds-value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.odds-home {
  color: #f56c6c;
}

.odds-draw {
  color: #909399;
}

.odds-away {
  color: #67c23a;
}

.odds-sep {
  color: #c0c4cc;
  font-size: 12px;
}

.odds-line {
  color: #e6a23c;
  font-weight: 600;
  font-size: 13px;
}

/* ========== 显示控制 ========== */
.pc-only {
  display: block;
}

.mobile-only {
  display: none;
}

/* ========== 移动端比赛列表（单行紧凑布局） ========== */
.match-row {
  background: #fff;
  border-radius: 10px;
  padding: 10px 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f2f5;
}

.mr-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mr-league {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: #409eff;
  background: rgba(64, 158, 255, 0.08);
  border: 1px solid #d9ecff;
  border-radius: 6px;
  padding: 1px 6px;
}

.mr-teams {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.mr-team {
  font-size: 14px;
  font-weight: 700;
  color: #303133;
  max-width: 110px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mr-vs {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: #c0c4cc;
}

.mr-status {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.mr-sub {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed #f0f2f5;
  font-size: 11px;
  color: #909399;
  flex-wrap: wrap;
}

.mr-meta {
  flex-shrink: 0;
}

.mr-odds {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  color: #606266;
  flex-shrink: 0;
}

/* ========== 移动端历史预测（单行紧凑布局） ========== */
.mobile-history {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-row {
  background: #fff;
  border-radius: 10px;
  padding: 10px 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f2f5;
}

.hr-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.hr-teams {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.hr-team {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hr-score {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 800;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  padding: 1px 7px;
  border-radius: 6px;
  min-width: 34px;
  text-align: center;
}

.hr-score-home {
  background: rgba(245, 108, 108, 0.12);
  color: #f56c6c;
}

.hr-score-away {
  background: rgba(103, 194, 58, 0.12);
  color: #67c23a;
}

.hr-score-draw {
  background: rgba(230, 162, 60, 0.14);
  color: #e6a23c;
}

.hr-score-none {
  background: #f4f4f5;
  color: #c0c4cc;
  font-weight: 600;
}

.hr-ai {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.hr-ai-score {
  font-size: 13px;
  font-weight: 700;
  color: #409eff;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
}

.hr-sub {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed #f0f2f5;
  font-size: 11px;
  color: #909399;
  flex-wrap: wrap;
}

.hr-time {
  flex-shrink: 0;
}

.hr-odds {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  color: #606266;
  flex-shrink: 0;
}

.hr-extra {
  color: #b0b8c4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vs {
  flex-shrink: 0;
  font-size: 12px;
  color: #c0c4cc;
  font-weight: 600;
}

.team-link {
  color: #409eff;
  cursor: pointer;
  transition: color 0.2s;
}

.team-link:hover {
  color: #79bbff;
  text-decoration: underline;
}

.empty-state {
  text-align: center;
  padding: 48px 16px;
  color: #999;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pc-only {
    display: none;
  }

  .mobile-only {
    display: flex;
  }

  .match-data-container {
    padding: 10px;
    background: #f5f7fa;
  }

  .page-header {
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
  }

  .page-header h1 {
    font-size: 18px;
  }

  .header-actions {
    width: 100%;
  }

  .table-section {
    padding: 10px;
  }
}

@media (max-width: 480px) {
  .match-data-container {
    padding: 8px;
  }

  .page-header h1 {
    font-size: 16px;
  }

  .hr-team {
    max-width: 80px;
    font-size: 12px;
  }

  .hr-extra {
    width: 100%;
  }

  .mr-team {
    max-width: 90px;
    font-size: 13px;
  }
}
</style>
