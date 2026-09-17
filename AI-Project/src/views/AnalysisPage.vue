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

    <!-- 标签页区域（带模糊遮罩） -->
    <div class="analysis-tabs card">
      <div class="tabs-header">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-item', { active: activeTab === tab.id, loading: isTabLoading(tab.id) }]"
          @click="switchTab(tab.id)"
          :aria-label="tab.label"
          role="tab"
          :aria-selected="activeTab === tab.id"
        >
          <span class="tab-label">{{ tab.label }}</span>
          <span v-if="isTabLoading(tab.id)" class="tab-loading-indicator"></span>
        </div>
      </div>

      <div class="tab-content" :key="activeTab">
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
            <div class="team-section">
              <div class="match-list">
                <div v-if="loading.recent" class="loading-state">
                  <div class="loading-spinner"></div>
                  <span>加载中...</span>
                </div>
                <div v-else-if="recentMatches.length === 0" class="empty-state">
                  <span>暂无数据</span>
                </div>
                <div v-else>
                  <div
                    v-for="match in recentMatches"
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
            <svg class="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" stroke-linecap="round" />
            </svg>
            <span class="empty-text">暂无 xG 数据</span>
            <button class="retry-btn" @click="fetchXgData">重新加载</button>
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

                   <div class="detail-item">
                    <span class="label">ppda 对方半场每防守动作允许的传球次数，值越低表示前场压迫越强</span>
                    <div class="values">
                      <span class="value home">{{ (xgData.home?.ppda || 0) }}</span>
                      <span class="value away">{{ (xgData.away?.ppda || 0) }}</span>
                    </div>
                  </div>


                   <div class="detail-item">
                    <span class="label">ppdaAllowed 本方半场每防守动作允许的传球次数，反映对手的压迫强度</span>
                    <div class="values">
                      <span class="value home">{{ (xgData.home?.ppdaAllowed || 0) }}</span>
                      <span class="value away">{{ (xgData.away?.ppdaAllowed || 0) }}</span>
                    </div>
                  </div>


                   <div class="detail-item">
                    <span class="label">deep 进入对方禁区30米区域的传球次数</span>
                    <div class="values">
                      <span class="value home">{{ (xgData.home?.deep || 0) }}</span>
                      <span class="value away">{{ (xgData.away?.deep || 0) }}</span>
                    </div>
                  </div>

                   <div class="detail-item">
                    <span class="label">deepAllowed 被对手传入本方禁区30米区域的次数</span>
                    <div class="values">
                      <span class="value home">{{ (xgData.home?.deepAllowed || 0) }}</span>
                      <span class="value away">{{ (xgData.away?.deepAllowed || 0) }}</span>
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

        <!-- ===================== 战绩 tab ===================== -->
        <div v-if="activeTab === 'history'" class="tab-pane">
          <div class="card history-tab">
            <div class="pane-header">
              <h3>近期战绩</h3>
              <button v-if="historyHasData && !loading.history" class="refresh-btn" @click="fetchMatchHistory" aria-label="刷新">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
              </button>
            </div>

            <div v-if="loading.history" class="loading-state">
              <div class="loading-spinner"></div>
              <span>战绩加载中…</span>
            </div>

            <div v-else-if="!historyHasData" class="empty-state">
              <svg class="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke-linecap="round" />
              </svg>
              <span class="empty-text">暂无近期战绩数据</span>
              <button class="retry-btn" @click="fetchMatchHistory">重新加载</button>
            </div>

            <template v-else>
              <!-- 主队战绩 -->
              <section v-if="matchHistoryData?.home?.matchList?.length" class="team-history-block">
                <h4 class="team-title">
                  <span class="team-badge home">主</span>
                  <span>{{ matchHistoryData.home.statistics?.teamShortName || matchInfo.homeName }} 近期战绩</span>
                </h4>

                <div class="stats-summary">
                  <div class="stat-item">
                    <div class="stat-num">{{ matchHistoryData.home.statistics?.totalLegCnt ?? '-' }}</div>
                    <div class="stat-label">场次</div>
                  </div>
                  <div class="stat-item win">
                    <div class="stat-num">{{ matchHistoryData.home.statistics?.winGoalMatchCnt ?? '-' }}</div>
                    <div class="stat-label">胜</div>
                  </div>
                  <div class="stat-item draw">
                    <div class="stat-num">{{ matchHistoryData.home.statistics?.drawMatchCnt ?? '-' }}</div>
                    <div class="stat-label">平</div>
                  </div>
                  <div class="stat-item loss">
                    <div class="stat-num">{{ matchHistoryData.home.statistics?.lossGoalMatchCnt ?? '-' }}</div>
                    <div class="stat-label">负</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-num">{{ matchHistoryData.home.statistics?.goalCnt ?? '-' }}</div>
                    <div class="stat-label">进球</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-num">{{ matchHistoryData.home.statistics?.lossGoalCnt ?? '-' }}</div>
                    <div class="stat-label">失球</div>
                  </div>
                  <div class="stat-item highlight-stat">
                    <div class="stat-num">{{ matchHistoryData.home.statistics?.netGoal ?? '-' }}</div>
                    <div class="stat-label">净胜球</div>
                  </div>
                </div>

                <ul class="history-list">
                  <li
                    v-for="(m, i) in matchHistoryData.home.matchList"
                    :key="`home-${m.matchId}-${i}`"
                    class="history-item"
                    :class="getHistoryItemClass(m)"
                  >
                    <div class="history-meta">
                      <span class="history-league">{{ m.tournamentShortName }}</span>
                      <span class="history-date">{{ m.matchDate }}</span>
                    </div>
                    <div class="history-body">
                      <div class="history-team home">
                        <span class="team-name">{{ m.homeTeamShortName }}</span>
                      </div>
                      <div class="history-score">
                        <span class="score-full">{{ m.fullCourtGoal }}</span>
                        <span class="score-half">半场 {{ m.halfTimeGoal }}</span>
                      </div>
                      <div class="history-team away">
                        <span class="team-name">{{ m.awayTeamShortName }}</span>
                      </div>
                    </div>
                    <div class="history-result" :class="getHistoryResultClass(m.teamMatchResult)">
                      {{ teamResultText(m.teamMatchResult) }}
                    </div>
                  </li>
                </ul>
              </section>

              <!-- 客队战绩 -->
              <section v-if="matchHistoryData?.away?.matchList?.length" class="team-history-block">
                <h4 class="team-title">
                  <span class="team-badge away">客</span>
                  <span>{{ matchHistoryData.away.statistics?.teamShortName || matchInfo.awayName }} 近期战绩</span>
                </h4>

                <div class="stats-summary">
                  <div class="stat-item">
                    <div class="stat-num">{{ matchHistoryData.away.statistics?.totalLegCnt ?? '-' }}</div>
                    <div class="stat-label">场次</div>
                  </div>
                  <div class="stat-item win">
                    <div class="stat-num">{{ matchHistoryData.away.statistics?.winGoalMatchCnt ?? '-' }}</div>
                    <div class="stat-label">胜</div>
                  </div>
                  <div class="stat-item draw">
                    <div class="stat-num">{{ matchHistoryData.away.statistics?.drawMatchCnt ?? '-' }}</div>
                    <div class="stat-label">平</div>
                  </div>
                  <div class="stat-item loss">
                    <div class="stat-num">{{ matchHistoryData.away.statistics?.lossGoalMatchCnt ?? '-' }}</div>
                    <div class="stat-label">负</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-num">{{ matchHistoryData.away.statistics?.goalCnt ?? '-' }}</div>
                    <div class="stat-label">进球</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-num">{{ matchHistoryData.away.statistics?.lossGoalCnt ?? '-' }}</div>
                    <div class="stat-label">失球</div>
                  </div>
                  <div class="stat-item highlight-stat">
                    <div class="stat-num">{{ matchHistoryData.away.statistics?.netGoal ?? '-' }}</div>
                    <div class="stat-label">净胜球</div>
                  </div>
                </div>

                <ul class="history-list">
                  <li
                    v-for="(m, i) in matchHistoryData.away.matchList"
                    :key="`away-${m.matchId}-${i}`"
                    class="history-item"
                    :class="getHistoryItemClass(m)"
                  >
                    <div class="history-meta">
                      <span class="history-league">{{ m.tournamentShortName }}</span>
                      <span class="history-date">{{ m.matchDate }}</span>
                    </div>
                    <div class="history-body">
                      <div class="history-team home">
                        <span class="team-name">{{ m.homeTeamShortName }}</span>
                      </div>
                      <div class="history-score">
                        <span class="score-full">{{ m.fullCourtGoal }}</span>
                        <span class="score-half">半场 {{ m.halfTimeGoal }}</span>
                      </div>
                      <div class="history-team away">
                        <span class="team-name">{{ m.awayTeamShortName }}</span>
                      </div>
                    </div>
                    <div class="history-result" :class="getHistoryResultClass(m.teamMatchResult)">
                      {{ teamResultText(m.teamMatchResult) }}
                    </div>
                  </li>
                </ul>
              </section>
            </template>
          </div>
        </div>

        <!-- ===================== 排名 tab ===================== -->
        <div v-if="activeTab === 'table'" class="tab-pane">
          <div class="card table-tab">
            <div class="pane-header">
              <h3>联赛排名</h3>
              <button v-if="rankingData.length > 0 && !loading.table" class="refresh-btn" @click="fetchMatchTable" aria-label="刷新">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
              </button>
            </div>

            <div v-if="loading.table" class="loading-state">
              <div class="loading-spinner"></div>
              <span>排名加载中…</span>
            </div>

            <div v-else-if="rankingData.length === 0" class="empty-state">
              <svg class="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round" />
              </svg>
              <span class="empty-text">暂无排名数据</span>
              <button class="retry-btn" @click="fetchMatchTable">重新加载</button>
            </div>

            <template v-else>
              <div class="ranking-tabs">
                <button class="ranking-tab-btn" :class="{ active: activeRankingType === 'total' }" @click="activeRankingType = 'total'">总榜</button>
                <button class="ranking-tab-btn" :class="{ active: activeRankingType === 'home' }" @click="activeRankingType = 'home'">主场</button>
                <button class="ranking-tab-btn" :class="{ active: activeRankingType === 'away' }" @click="activeRankingType = 'away'">客场</button>
              </div>

              <div class="ranking-table-wrap">
                <table class="ranking-table">
                  <thead>
                    <tr>
                      <th class="col-rank">排名</th>
                      <th class="col-team">球队</th>
                      <th class="col-num">场</th>
                      <th class="col-num">胜</th>
                      <th class="col-num hide-on-mobile">平</th>
                      <th class="col-num hide-on-mobile">负</th>
                      <th class="col-num hide-on-mobile">进</th>
                      <th class="col-num hide-on-mobile">失</th>
                      <th class="col-num">净</th>
                      <th class="col-points">积分</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in filteredRanking" :key="row.id" :class="{ 'highlight': isHighlightTeam(row) }">
                      <td class="col-rank">
                        <span class="rank-num" :class="getRankClass(row.ranking)">{{ row.ranking }}</span>
                      </td>
                      <td class="col-team">
                        <span class="team-name-cell" :title="row.teamAbbrCnName">{{ row.teamAbbrCnName }}</span>
                      </td>
                      <td class="col-num">{{ row.totalLegCnt }}</td>
                      <td class="col-num col-win">{{ row.winGoalMatchCnt }}</td>
                      <td class="col-num hide-on-mobile">{{ row.drawMatchCnt }}</td>
                      <td class="col-num hide-on-mobile">{{ row.lossGoalMatchCnt }}</td>
                      <td class="col-num hide-on-mobile">{{ row.goalCnt }}</td>
                      <td class="col-num hide-on-mobile">{{ row.lossGoalCnt }}</td>
                      <td class="col-num" :class="{ 'diff-positive': row.netGoal > 0, 'diff-negative': row.netGoal < 0 }">
                        {{ formatGoalDiff(row.netGoal) }}
                      </td>
                      <td class="col-points points">{{ row.points }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="ranking-meta">
                <span>胜率: {{ winProbabilityText }}</span>
                <span class="meta-divider">·</span>
                <span>{{ filteredRanking.length }} 支球队</span>
              </div>
            </template>
          </div>
        </div>

        <!-- ===================== 必发 tab ===================== -->
        <div v-if="activeTab === 'bifa'" class="tab-pane">
          <div class="card bifa-tab">
            <div class="pane-header">
              <h3>必发交易趋势</h3>
              <button v-if="bifaData.length > 0 && !loading.bifa" class="refresh-btn" @click="fetchBifaTrend" aria-label="刷新">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
              </button>
            </div>

            <div v-if="loading.bifa" class="loading-state">
              <div class="loading-spinner"></div>
              <span>必发数据加载中…</span>
            </div>

            <div v-else-if="bifaData.length === 0" class="empty-state">
              <svg class="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 3v18h18" stroke-linecap="round" />
                <path d="M7 14l4-4 4 4 5-5" stroke-linejoin="round" />
              </svg>
              <span class="empty-text">暂无必发数据</span>
              <button class="retry-btn" @click="fetchBifaTrend">重新加载</button>
            </div>

            <template v-else>
              <div class="bifa-summary">
                <div class="bifa-total-card">
                  <div class="bifa-total-label">总交易额</div>
                  <div class="bifa-total-value">{{ formatBifaAmount(totalBifaAmount) }}</div>
                </div>
                <div class="bifa-stat-card">
                  <div class="bifa-stat-label">交易笔数</div>
                  <div class="bifa-stat-value">{{ bifaData.length }}</div>
                </div>
                <div class="bifa-stat-card">
                  <div class="bifa-stat-label">最后时间</div>
                  <div class="bifa-stat-value">{{ lastBifaTimeText }}</div>
                </div>
              </div>

              <div class="bifa-bar-wrap">
                <div class="bifa-bar">
                  <div
                    v-for="seg in bifaSegments"
                    :key="seg.side"
                    class="bifa-seg"
                    :class="['seg-' + seg.side]"
                    :style="{ flex: seg.amount }"
                  >
                    <span v-if="(seg.proportion || 0) > 8" class="bifa-seg-label">
                      {{ seg.sideLabel }} {{ seg.proportion?.toFixed(1) }}%
                    </span>
                  </div>
                </div>
                <div class="bifa-bar-legend">
                  <div
                    v-for="seg in bifaSegments"
                    :key="'lg-' + seg.side"
                    class="bifa-legend-item"
                  >
                    <span class="bifa-legend-dot" :style="{ background: seg.color }"></span>
                    <span class="bifa-legend-label">{{ seg.sideLabel }}</span>
                    <span class="bifa-legend-value">{{ seg.proportion?.toFixed(1) }}%</span>
                  </div>
                </div>
              </div>

              <ul class="bifa-list">
                <li
                  v-for="(item, idx) in bifaData"
                  :key="item.id || idx"
                  class="bifa-item"
                  :class="['side-' + normalizeSide(item.side)]"
                >
                  <div class="bifa-side">
                    <span class="side-tag" :class="['tag-' + normalizeSide(item.side)]">{{ item.side }}</span>
                  </div>
                  <div class="bifa-amount">{{ formatBifaAmount(item.amount) }}</div>
                  <div class="bifa-proportion">
                    <span>{{ getBifaProportion(item) }}%</span>
                    <div class="bifa-progress">
                      <div class="bifa-progress-bar" :style="{ width: getBifaProportion(item) + '%', background: getSideColor(normalizeSide(item.side)) }"></div>
                    </div>
                  </div>
                  <div class="bifa-time">{{ formatBifaTime(item.dataTime) }}</div>
                </li>
              </ul>
            </template>
          </div>
        </div>

        <!-- ===================== 情报 tab ===================== -->
        <div v-if="activeTab === 'intelligence'" class="tab-pane">
          <div class="card intelligence-tab">
            <div class="pane-header">
              <h3>赛前情报</h3>
              <button v-if="intelligenceContent && !loading.intelligence" class="refresh-btn" @click="fetchIntelligence" aria-label="刷新">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
              </button>
            </div>

            <div v-if="loading.intelligence" class="loading-state">
              <div class="loading-spinner"></div>
              <span>情报加载中…</span>
            </div>

            <div v-else-if="!intelligenceContent" class="empty-state">
              <svg class="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M4 4h16v16H4z" />
                <path d="M8 9h8M8 13h8M8 17h5" stroke-linecap="round" />
              </svg>
              <span class="empty-text">暂无情报内容</span>
              <button class="retry-btn" @click="fetchIntelligence">重新加载</button>
            </div>

            <div v-else class="intelligence-content">
              <pre class="intelligence-pre">{{ intelligenceContent }}</pre>
            </div>
          </div>
        </div>

        <!-- 赔率变化 -->
        <div v-if="activeTab === 'odds'" class="tab-pane">
          <div class="pane-header">
            <h3>赔率变化趋势</h3>
            <button v-if="oddsHistory.length > 0 && !loading.odds" class="refresh-btn" @click="fetchOddsHistory" aria-label="刷新">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            </button>
          </div>

          <div v-if="loading.odds" class="loading-state">
            <div class="loading-spinner"></div>
            <span>赔率数据加载中…</span>
          </div>

          <div v-else-if="oddsHistory.length === 0" class="empty-state">
            <svg class="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 3v18h18" stroke-linecap="round" />
              <path d="M7 14l4-4 4 4 5-5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="empty-text">{{ oddsAnalysis || '暂无赔率变化数据' }}</span>
            <button class="retry-btn" @click="fetchOddsHistory">重新加载</button>
          </div>

          <template v-else>
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
              <h4>赔率变化记录 <span class="muted">（共 {{ oddsHistory.length }} 条）</span></h4>
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
                    <tr v-for="(record, index) in oddsHistory" :key="record.id || `${record.updateTime}-${index}`">
                      <td>
                        <div class="time-cell">
                          <div class="date">{{ formatOddsDate(record.updateDate) }}</div>
                          <div class="time">{{ record.updateTime }}</div>
                        </div>
                      </td>
                      <td :class="{ 'changed': index > 0 && record.h !== oddsHistory[index - 1]?.h }">
                        {{ record.h }}
                      </td>
                      <td :class="{ 'changed': index > 0 && record.d !== oddsHistory[index - 1]?.d }">
                        {{ record.d }}
                      </td>
                      <td :class="{ 'changed': index > 0 && record.a !== oddsHistory[index - 1]?.a }">
                        {{ record.a }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { formatDisplayTime } from '@/utils/dateUtils'
import { matchApi } from '@/api/analisis'
import type {
  RecentMatch,
  XgData,
  SimilarMatch,
  OddsRecord,
  TeamXgStats,
  HistoryMatch,
  HistoryStatistics,
  MatchHistoryResponse,
  RankingItem,
  BifaTrendItem,
  RankingTableType
} from '@/api/analisis'

const route = useRoute()
const router = useRouter()

// 标签页配置
const tabs = [
  { id: 'recent', label: '历史交锋' },
  { id: 'xg', label: 'xG数据' },
  { id: 'similar', label: '相似比赛' },
  { id: 'history', label: '战绩' },
  { id: 'table', label: '排名' },
  { id: 'odds', label: '赔率变化' },
  { id: 'bifa', label: '必发' },
  { id: 'intelligence', label: '情报' }
]

// 进行中的请求控制器
const pendingControllers: Array<[AbortController, ReturnType<typeof setTimeout>]> = []

const newAbortSignal = (timeoutMs = 30000) => {
  const ctrl = new AbortController()
  const timer = setTimeout(() => {
    try { ctrl.abort() } catch { /* noop */ }
  }, timeoutMs)
  pendingControllers.push([ctrl, timer])
  return ctrl
}

const releaseSignal = (ctrl: AbortController) => {
  const idx = pendingControllers.findIndex(([c]) => c === ctrl)
  if (idx > -1) {
    const [, timer] = pendingControllers[idx]
    clearTimeout(timer)
    pendingControllers.splice(idx, 1)
  }
  try { ctrl.abort() } catch { /* noop */ }
}

const isAborted = (err: unknown) => {
  if (!err) return false
  const e = err as { name?: string; code?: string; message?: string }
  if (e.name === 'CanceledError' || e.code === 'ERR_CANCELED') return true
  if (e.message && /abort|cancel/i.test(e.message)) return true
  return false
}

const activeTab = ref('recent')
const loadedTabs = ref(new Set<string>())

const matchId = computed(() => route.params.matchId as string)

const loading = ref({
  recent: false,
  xg: false,
  similar: false,
  intelligence: false,
  odds: false,
  history: false,
  table: false,
  bifa: false
})

const recentMatches = ref<RecentMatch[]>([])
const xgData = ref<XgData>({
  home: null,
  away: null,
  all: null
})
const similarMatches = ref<SimilarMatch[]>([])
const oddsHistory = ref<OddsRecord[]>([])
const oddsAnalysis = ref('赔率变化分析...')

// 战绩数据 - 类型与后端完全一致
const matchHistoryData = ref<MatchHistoryResponse>({
  home: { matchList: [], statistics: {} as HistoryStatistics },
  away: { matchList: [], statistics: {} as HistoryStatistics }
})

// 排名数据 - 后端直接返回数组
const rankingData = ref<RankingItem[]>([])
const activeRankingType = ref<RankingTableType>('total')

// 必发数据
const bifaData = ref<BifaTrendItem[]>([])

// 情报(纯字符串)
const intelligenceContent = ref('')

// 队伍基础信息
const matchInfo = computed(() => ({
  homeName: matchData.value?.homeTeam || '',
  awayName: matchData.value?.awayTeam || ''
}))

// 战绩是否有可展示数据
const historyHasData = computed(() => {
  return !!(
    matchHistoryData.value?.home?.matchList?.length ||
    matchHistoryData.value?.away?.matchList?.length
  )
})

// 排名按 tableType 过滤 + 排序
const filteredRanking = computed(() => {
  if (!Array.isArray(rankingData.value)) return []
  return rankingData.value
    .filter((r) => r && r.tableType === activeRankingType.value)
    .slice()
    .sort((a, b) => (a.ranking ?? 0) - (b.ranking ?? 0))
})

// 当前榜首球队的胜率(用作 rangk-meta 展示)
const winProbabilityText = computed(() => {
  if (filteredRanking.value.length === 0) return '-'
  const top = filteredRanking.value[0]
  return top.winProbability || '-'
})

// 必发总交易额
const totalBifaAmount = computed(() => {
  if (!Array.isArray(bifaData.value) || bifaData.value.length === 0) return 0
  return bifaData.value.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
})

// 必发三项占比
const bifaSegments = computed(() => {
  const total = totalBifaAmount.value
  const map = new Map<string, number>()
  if (Array.isArray(bifaData.value)) {
    bifaData.value.forEach((item) => {
      const side = normalizeSide(item.side)
      map.set(side, (map.get(side) || 0) + (Number(item.amount) || 0))
    })
  }
  const sides: Array<'home' | 'draw' | 'away'> = ['home', 'draw', 'away']
  return sides.map((s) => {
    const amount = map.get(s) || 0
    return {
      side: s,
      sideLabel: s === 'home' ? '主' : s === 'draw' ? '和' : '客',
      amount: amount > 0 ? amount : 0.0001,
      proportion: total > 0 ? (amount / total) * 100 : 0,
      color: getSideColor(s)
    }
  })
})

// 必发最后一条的时间
const lastBifaTimeText = computed(() => {
  if (bifaData.value.length === 0) return '-'
  const last = bifaData.value.reduce((acc, cur) =>
    Number(cur.dataTime) > Number(acc.dataTime) ? cur : acc
  )
  return formatBifaTime(last.dataTime)
})

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

const matchData = computed(() => {
  const league = route.query.league as string || '未知联赛'
  const homeTeam = route.query.homeTeam as string || '未知主队'
  const awayTeam = route.query.awayTeam as string || '未知客队'
  const homeTeamRank = route.query.homeTeamRank as string || ''
  const awayTeamRank = route.query.awayTeamRank as string || ''
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
    homeTeamRank,
    awayTeamRank
  }
})

// 方法
const goBack = () => {
  router.back()
}

const formatMatchTime = (fullTime: string) => {
  const [dateString, timeString] = fullTime.split(' ')
  return formatDisplayTime(dateString || '', timeString || '')
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
  } catch {
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
  } catch {
    return dateString
  }
}

const parseScore = (score: string): { home: number; away: number } => {
  if (!score) return { home: 0, away: 0 }
  const parts = score.split(':')
  const home = parseInt((parts[0] || '').trim()) || 0
  const away = parseInt((parts[1] || '').trim()) || 0
  return { home, away }
}

const truncateText = (text: string, maxLength: number) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

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

// 标签切换
const switchTab = async (tabId: string) => {
  if (activeTab.value === tabId) return

  activeTab.value = tabId
  await nextTick()

  const contentEl = document.querySelector('.tab-content')
  if (contentEl) {
    contentEl.scrollTop = 0
  }

  try {
    const activeEl = document.querySelector(
      `.analysis-tabs .tabs-header .tab-item.active`
    ) as HTMLElement | null
    const headerEl = document.querySelector(
      '.analysis-tabs .tabs-header'
    ) as HTMLElement | null
    if (activeEl && headerEl && headerEl.scrollWidth > headerEl.clientWidth) {
      const targetLeft =
        activeEl.offsetLeft - headerEl.clientWidth / 2 + activeEl.clientWidth / 2
      headerEl.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: 'smooth'
      })
    }
  } catch {
    /* noop */
  }

  loadTabData(tabId)
}

const loadTabData = async (tabId: string) => {
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
    case 'history':
      await fetchMatchHistory()
      loadedTabs.value.add('history')
      break
    case 'table':
      await fetchMatchTable()
      loadedTabs.value.add('table')
      break
    case 'odds':
      await fetchOddsHistory()
      loadedTabs.value.add('odds')
      break
    case 'bifa':
      await fetchBifaTrend()
      loadedTabs.value.add('bifa')
      break
    case 'intelligence':
      await fetchIntelligence()
      loadedTabs.value.add('intelligence')
      break
  }
}

// ===== API 调用 =====

const fetchRecentMatches = async () => {
  const signal = newAbortSignal()
  try {
    loading.value.recent = true
    const response = await matchApi.getRecentMatches(matchId.value, { signal: signal.signal })
    const r = response as unknown
    if (Array.isArray(r)) {
      recentMatches.value = r as RecentMatch[]
    } else if (Array.isArray((r as { data?: unknown })?.data)) {
      recentMatches.value = (r as { data: RecentMatch[] }).data
    } else if (Array.isArray((r as { list?: unknown })?.list)) {
      recentMatches.value = (r as { list: RecentMatch[] }).list
    } else {
      recentMatches.value = []
    }
  } catch (error) {
    if (!isAborted(error)) {
      console.error('获取近期战绩失败:', error)
      ElMessage.error('获取近期战绩失败，请稍后重试')
      recentMatches.value = []
    }
  } finally {
    loading.value.recent = false
    releaseSignal(signal)
  }
}

const fetchXgData = async () => {
  const signal = newAbortSignal()
  try {
    loading.value.xg = true
    const response = await matchApi.getXgData(matchId.value, { signal: signal.signal })

    let payload: unknown = response
    if (
      payload &&
      typeof payload === 'object' &&
      !Array.isArray(payload) &&
      'data' in payload &&
      (payload as Record<string, unknown>).data &&
      typeof (payload as Record<string, unknown>).data === 'object'
    ) {
      payload = (payload as Record<string, unknown>).data
    }

    const safeTeam = (team: unknown): TeamXgStats | null => {
      if (team && typeof team === 'object') {
        return team as TeamXgStats
      }
      return null
    }

    const p = (payload as Record<string, unknown>) || {}
    xgData.value = {
      home: safeTeam(p.home),
      away: safeTeam(p.away),
      all: safeTeam(p.all)
    }
  } catch (error) {
    if (!isAborted(error)) {
      console.error('获取xG数据失败:', error)
      xgData.value = { home: null, away: null, all: null }
      ElMessage.error('获取 xG 数据失败，请稍后重试')
    }
  } finally {
    loading.value.xg = false
    releaseSignal(signal)
  }
}

const fetchSimilarMatches = async () => {
  const signal = newAbortSignal()
  try {
    loading.value.similar = true
    const response = await matchApi.getSimilarMatches(matchId.value, { signal: signal.signal })
    const r = response as unknown
    if (Array.isArray(r)) {
      similarMatches.value = r as SimilarMatch[]
    } else if (Array.isArray((r as { data?: unknown })?.data)) {
      similarMatches.value = (r as { data: SimilarMatch[] }).data
    } else if (Array.isArray((r as { list?: unknown })?.list)) {
      similarMatches.value = (r as { list: SimilarMatch[] }).list
    } else {
      similarMatches.value = []
    }
  } catch (error) {
    if (!isAborted(error)) {
      console.error('获取相似比赛失败:', error)
      similarMatches.value = []
      ElMessage.error('获取相似比赛失败，请稍后重试')
    }
  } finally {
    loading.value.similar = false
    releaseSignal(signal)
  }
}

const fetchOddsHistory = async () => {
  const signal = newAbortSignal()
  try {
    loading.value.odds = true
    const response = await matchApi.getOddsHistory(matchId.value, { signal: signal.signal })

    let list: OddsRecord[] = []
    const r = response as unknown
    if (r) {
      if (Array.isArray(r)) {
        list = r
      } else if (Array.isArray((r as { history?: unknown }).history)) {
        list = (r as { history: OddsRecord[] }).history
      } else if (Array.isArray((r as { data?: { history?: unknown } }).data?.history)) {
        list = ((r as { data: { history: OddsRecord[] } }).data).history
      } else if (Array.isArray((r as { data?: unknown }).data)) {
        list = (r as { data: OddsRecord[] }).data
      }
    }
    oddsHistory.value = list.filter(Boolean)
  } catch (error) {
    if (!isAborted(error)) {
      console.error('获取赔率历史失败:', error)
      oddsHistory.value = []
      oddsAnalysis.value = '暂无赔率分析数据'
      ElMessage.error('获取赔率历史失败，请稍后重试')
    }
  } finally {
    loading.value.odds = false
    releaseSignal(signal)
  }
}

// 1. 战绩 tab - POST /api/match/history/{matchId}
const fetchMatchHistory = async () => {
  const signal = newAbortSignal()
  try {
    loading.value.history = true
    const response = await matchApi.getMatchHistory(matchId.value, { signal: signal.signal })

    // apiClient 拦截器已 unwrap,response 形如 { home: {...}, away: {...} }
    // 仍保留对 { data: { ... } } 形态的兜底
    let payload: unknown = response
    if (
      payload &&
      typeof payload === 'object' &&
      'data' in payload
    ) {
      const inner = (payload as Record<string, unknown>).data
      if (
        inner &&
        typeof inner === 'object' &&
        ('home' in inner || 'away' in inner)
      ) {
        payload = inner
      }
    }

    const emptyTeam = () => ({
      matchList: [] as HistoryMatch[],
      statistics: {} as HistoryStatistics
    })

    if (payload && typeof payload === 'object' && ('home' in payload || 'away' in payload)) {
      const p = payload as Partial<MatchHistoryResponse>
      matchHistoryData.value = {
        home: p.home || emptyTeam(),
        away: p.away || emptyTeam()
      }
    } else {
      matchHistoryData.value = {
        home: emptyTeam(),
        away: emptyTeam()
      }
    }
  } catch (error) {
    if (!isAborted(error)) {
      console.error('获取战绩失败:', error)
      matchHistoryData.value = {
        home: { matchList: [], statistics: {} as HistoryStatistics },
        away: { matchList: [], statistics: {} as HistoryStatistics }
      }
      ElMessage.error('获取战绩失败，请稍后重试')
    }
  } finally {
    loading.value.history = false
    releaseSignal(signal)
  }
}

// 战绩 - 比赛结果文本(基于 teamMatchResult: home/draw/away)
const teamResultText = (r: string) => {
  if (r === 'home') return '胜'
  if (r === 'draw') return '平'
  if (r === 'away') return '负'
  return '-'
}

// 战绩 - 给列表项附加结果样式
const getHistoryItemClass = (m: HistoryMatch) => {
  const r = m.teamMatchResult
  if (r === 'home') return 'win'
  if (r === 'draw') return 'draw'
  if (r === 'away') return 'loss'
  return ''
}

const getHistoryResultClass = (r: string) => {
  if (r === 'home') return 'result-win'
  if (r === 'draw') return 'result-draw'
  if (r === 'away') return 'result-loss'
  return ''
}

// 2. 排名 tab - GET /api/match/table/{matchId}
const fetchMatchTable = async () => {
  const signal = newAbortSignal()
  try {
    loading.value.table = true
    const response = await matchApi.getMatchTable(matchId.value, { signal: signal.signal })

    // 后端直接返回数组
    let list: RankingItem[] = []
    if (Array.isArray(response)) {
      list = response
    } else if (Array.isArray((response as { data?: unknown })?.data)) {
      list = (response as { data: RankingItem[] }).data
    }
    rankingData.value = list.filter(Boolean)
  } catch (error) {
    if (!isAborted(error)) {
      console.error('获取排名失败:', error)
      rankingData.value = []
      ElMessage.error('获取排名失败，请稍后重试')
    }
  } finally {
    loading.value.table = false
    releaseSignal(signal)
  }
}

// 排名 - 格式化净胜球
const formatGoalDiff = (v: number | undefined | null) => {
  if (v === undefined || v === null) return '-'
  if (v > 0) return `+${v}`
  return String(v)
}

// 排名 - 高亮当前比赛的两支队伍
const isHighlightTeam = (row: RankingItem) => {
  const name = (row?.teamAbbrCnName || '').trim()
  if (!name) return false
  const homeName = (matchInfo.value.homeName || '').trim()
  const awayName = (matchInfo.value.awayName || '').trim()
  if (!homeName && !awayName) return false
  return name === homeName || name === awayName
}

// 排名 - 名次显示样式
const getRankClass = (rank: number) => {
  if (rank === 1) return 'rank-1'
  if (rank === 2) return 'rank-2'
  if (rank === 3) return 'rank-3'
  return ''
}

// 3. 必发 tab - POST /api/bifa/trend/latest/{matchId}
const fetchBifaTrend = async () => {
  const signal = newAbortSignal()
  try {
    loading.value.bifa = true
    const response = await matchApi.getBifaTrendLatest(matchId.value, { signal: signal.signal })

    let list: BifaTrendItem[] = []
    if (Array.isArray(response)) {
      list = response
    } else if (Array.isArray((response as { data?: unknown })?.data)) {
      list = (response as { data: BifaTrendItem[] }).data
    }
    bifaData.value = list.filter(Boolean)
  } catch (error) {
    if (!isAborted(error)) {
      console.error('获取必发数据失败:', error)
      bifaData.value = []
      ElMessage.error('获取必发数据失败，请稍后重试')
    }
  } finally {
    loading.value.bifa = false
    releaseSignal(signal)
  }
}

// 必发 - 归一化 side(主/和/客 -> home/draw/away)
const normalizeSide = (side: string): 'home' | 'draw' | 'away' => {
  if (!side) return 'home'
  const s = String(side).trim()
  if (s === '主' || s.toLowerCase() === 'home' || s.toLowerCase() === 'h') return 'home'
  if (s === '和' || s === '平' || s.toLowerCase() === 'draw' || s.toLowerCase() === 'd') return 'draw'
  if (s === '客' || s.toLowerCase() === 'away' || s.toLowerCase() === 'a') return 'away'
  return 'home'
}

// 必发 - 三方配色
const getSideColor = (side: 'home' | 'draw' | 'away') => {
  if (side === 'home') return '#ef4444'
  if (side === 'draw') return '#10b981'
  if (side === 'away') return '#3b82f6'
  return '#94a3b8'
}

// 必发 - 格式化金额
const formatBifaAmount = (v: number | string | undefined | null) => {
  if (v === undefined || v === null || v === '') return '0'
  const n = Number(v)
  if (isNaN(n)) return String(v)
  if (n >= 100000000) return (n / 100000000).toFixed(2) + '亿'
  if (n >= 10000) return (n / 10000).toFixed(2) + '万'
  return n.toFixed(0)
}

// 必发 - 毫秒时间戳字符串 -> yyyy-MM-dd HH:mm
const formatBifaTime = (v: string | number | undefined | null) => {
  if (!v) return '-'
  let ts = Number(v)
  if (isNaN(ts) || ts <= 0) return String(v)
  // 自动判断毫秒/秒:毫秒戳约 1e12 以上
  if (ts < 1e12) ts = ts * 1000
  const d = new Date(ts)
  if (isNaN(d.getTime())) return String(v)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 必发 - 单项占比
const getBifaProportion = (item: BifaTrendItem) => {
  const total = totalBifaAmount.value
  if (!total) return 0
  const amt = Number(item.amount) || 0
  return Number(((amt / total) * 100).toFixed(1))
}

// 4. 情报 tab - POST /api/match/information/data/{matchId}
const fetchIntelligence = async () => {
  const signal = newAbortSignal()
  try {
    loading.value.intelligence = true
    const response = await matchApi.getIntelligenceData(matchId.value, { signal: signal.signal })

    const r = response as unknown
    if (typeof r === 'string') {
      intelligenceContent.value = r
    } else {
      intelligenceContent.value = ''
    }
  } catch (error) {
    if (!isAborted(error)) {
      console.error('获取情报失败:', error)
      intelligenceContent.value = ''
      ElMessage.error('获取情报失败，请稍后重试')
    }
  } finally {
    loading.value.intelligence = false
    releaseSignal(signal)
  }
}

// tab 是否处于 loading 状态
const isTabLoading = (tabId: string) => {
  const l = loading.value as unknown as Record<string, unknown>
  return Boolean(l?.[tabId])
}

onMounted(() => {
  loadTabData(activeTab.value)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  const list = pendingControllers.slice()
  pendingControllers.length = 0
  list.forEach(([c]) => {
    try { c.abort() } catch { /* noop */ }
  })
  list.forEach(([, t]) => clearTimeout(t))
})

const handleResize = () => {
  /* noop */
}

</script>

<style scoped>
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

.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
  overflow: hidden;
}

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

.back-btn svg { transition: transform 0.3s ease; }
.back-btn:hover { transform: translateX(-2px); }
.back-btn:hover svg { transform: translateX(-2px); }
.back-btn:active { transform: translateX(0); }

.page-title {
  flex: 1;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  text-align: center;
}

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

.match-basic-info .team.home-team { text-align: right; }
.match-basic-info .team.away-team { text-align: left; }

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

.analysis-tabs {
  margin: 0 16px 16px;
  min-height: 400px;
  position: relative;
}

.analysis-tabs .tabs-header {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  top: 73px;
  z-index: 10;
  backdrop-filter: blur(10px);
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.analysis-tabs .tabs-header::-webkit-scrollbar { display: none; }

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
  white-space: nowrap;
}

.analysis-tabs .tabs-header .tab-item:hover { background: rgba(0, 0, 0, 0.02); }

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

.analysis-tabs .tabs-header .tab-item.loading .tab-label { opacity: 0.7; }

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

.tab-pane .pane-header .refresh-btn svg { display: block; }

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

.loading-state span { font-size: 14px; }

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #adb5bd;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-state .empty-icon { color: #cbd5e1; opacity: 0.85; }
.empty-state .empty-text { font-size: 14px; color: #94a3b8; }

.retry-btn {
  margin-top: 8px;
  padding: 8px 22px;
  border-radius: 999px;
  border: 1px solid #667eea;
  background: #fff;
  color: #667eea;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.retry-btn:hover {
  background: #667eea;
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.3);
}

.retry-btn:active { transform: translateY(0); }

.muted {
  color: #94a3b8;
  font-size: 13px;
  font-weight: normal;
  margin-left: 6px;
}

.recent-teams .team-section { margin-bottom: 24px; }
.recent-teams .team-section:last-child { margin-bottom: 0; }
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

.recent-match-item .match-result .team.home { text-align: left; padding-right: 8px; }
.recent-match-item .match-result .team.away { text-align: right; padding-left: 8px; }

.recent-match-item .match-result .score {
  flex-shrink: 0;
  font-size: 16px;
  font-weight: 600;
  padding: 0 8px;
  min-width: 60px;
  text-align: center;
}

.recent-match-item .match-result .score.score-win { color: #52c41a; }
.recent-match-item .match-result .score.score-draw { color: #faad14; }
.recent-match-item .match-result .score.score-lose { color: #ff4d4f; }

.recent-match-item .match-outcome { text-align: center; }

.recent-match-item .match-outcome .outcome {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.recent-match-item .match-outcome .outcome.outcome-win { background: #52c41a; color: white; }
.recent-match-item .match-outcome .outcome.outcome-draw { background: #faad14; color: white; }
.recent-match-item .match-outcome .outcome.outcome-lose { background: #ff4d4f; color: white; }

/* xG styles */
.xg-content .xg-comparison { margin-bottom: 24px; }
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

.xg-content .xg-comparison .xg-team.home .xg-bar-container { direction: rtl; }

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

.xg-content .xg-comparison .xg-team.home .xg-bar .xg-label { right: 8px; }
.xg-content .xg-comparison .xg-team.away .xg-bar .xg-label { left: 8px; }

.xg-content .xg-comparison .xg-vs {
  text-align: center;
  margin: 12px 0;
  color: #adb5bd;
  font-weight: 600;
  font-size: 14px;
}

.xg-content .xg-details .detail-category { margin-bottom: 20px; }
.xg-content .xg-details .detail-category:last-child { margin-bottom: 0; }

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

.xg-content .xg-details .detail-item .values .value.home { color: #667eea; }
.xg-content .xg-details .detail-item .values .value.away { color: #764ba2; }

/* similar styles */
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

.similar-match-item .match-content .teams .team.home { text-align: left; padding-right: 8px; }
.similar-match-item .match-content .teams .team.away { text-align: right; padding-left: 8px; }

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

.similar-match-item .match-content .odds-info .match-result .result.result-home { background: #52c41a; color: white; }
.similar-match-item .match-content .odds-info .match-result .result.result-draw { background: #faad14; color: white; }
.similar-match-item .match-content .odds-info .match-result .result.result-away { background: #ff4d4f; color: white; }

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

.current-odds .odds-display .odds-type.home .odds-value { color: #667eea; }
.current-odds .odds-display .odds-type.draw .odds-value { color: #faad14; }
.current-odds .odds-display .odds-type.away .odds-value { color: #764ba2; }

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

.odds-history .odds-table tr:hover { background: #f8f9fa; }

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ===================== 战绩 tab 样式(紧凑布局) ===================== */
.history-tab { padding: 16px; }

.team-history-block { margin-bottom: 22px; }
.team-history-block:last-child { margin-bottom: 0; }

.team-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 10px;
}

.team-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  color: white;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.team-badge.home { background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); }
.team-badge.away { background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); }

/* 战绩统计：横向7个数据点 */
.stats-summary {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  padding: 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  margin-bottom: 14px;
}

.stat-item {
  text-align: center;
  padding: 6px 2px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  min-width: 0;
}

.stat-item .stat-num {
  font-size: 16px;
  font-weight: 700;
  color: #1a202c;
  line-height: 1.2;
}

.stat-item .stat-label {
  font-size: 11px;
  color: #6c757d;
  margin-top: 2px;
  white-space: nowrap;
}

.stat-item.win .stat-num { color: #ef4444; }
.stat-item.draw .stat-num { color: #10b981; }
.stat-item.loss .stat-num { color: #3b82f6; }
.stat-item.highlight-stat .stat-num { color: #667eea; }

/* 战绩列表 - 紧凑卡片 */
.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 10px;
  border: 1px solid #e9ecef;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.history-item:active { transform: scale(0.99); }

.history-item.win {
  border-left: 3px solid #ef4444;
  background: linear-gradient(90deg, rgba(239,68,68,0.05) 0%, #f8f9fa 60%);
}

.history-item.draw {
  border-left: 3px solid #10b981;
  background: linear-gradient(90deg, rgba(16,185,129,0.05) 0%, #f8f9fa 60%);
}

.history-item.loss {
  border-left: 3px solid #3b82f6;
  background: linear-gradient(90deg, rgba(59,130,246,0.05) 0%, #f8f9fa 60%);
}

.history-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #6c757d;
  gap: 8px;
}

.history-league {
  font-weight: 500;
  color: #4a5568;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.history-date {
  font-size: 11px;
  white-space: nowrap;
  color: #94a3b8;
  flex-shrink: 0;
}

.history-body {
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-team {
  flex: 1;
  min-width: 0;
}

.history-team .team-name {
  font-size: 13px;
  color: #1a202c;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.history-team.home { text-align: left; }
.history-team.away { text-align: right; }

.history-score {
  font-size: 14px;
  font-weight: 700;
  color: #667eea;
  padding: 6px 10px;
  background: white;
  border-radius: 8px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  border: 1px solid #e9ecef;
  line-height: 1.2;
}

.history-score .score-full { font-size: 14px; font-weight: 700; }
.history-score .score-half { font-size: 10px; color: #94a3b8; font-weight: 500; }

.history-result {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.history-result.result-win { background: #fee2e2; color: #ef4444; }
.history-result.result-draw { background: #d1fae5; color: #10b981; }
.history-result.result-loss { background: #dbeafe; color: #3b82f6; }

/* ===================== 排名 tab 样式 ===================== */
.table-tab { padding: 16px; }

.ranking-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
  padding: 4px;
  background: #f1f5f9;
  border-radius: 12px;
}

.ranking-tab-btn {
  flex: 1;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.ranking-tab-btn:hover { color: #667eea; }
.ranking-tab-btn.active {
  background: white;
  color: #667eea;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.ranking-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 10px;
  border: 1px solid #e9ecef;
}

.ranking-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.ranking-table thead th {
  background: #f8f9fa;
  color: #6c757d;
  font-weight: 600;
  font-size: 12px;
  padding: 10px 6px;
  text-align: center;
  border-bottom: 1px solid #e9ecef;
  white-space: nowrap;
}

.ranking-table tbody td {
  padding: 9px 6px;
  text-align: center;
  border-bottom: 1px solid #f1f5f9;
  color: #1a202c;
}

.ranking-table tbody tr:last-child td { border-bottom: 0; }

.ranking-table tbody tr:hover { background: #f8f9fa; }

.ranking-table tbody tr.highlight {
  background: linear-gradient(90deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.05) 100%);
}

.ranking-table tbody tr.highlight td {
  font-weight: 600;
}

.ranking-table tbody tr.highlight .team-name-cell {
  color: #667eea;
}

.col-rank { width: 54px; }

.rank-num {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 12px;
  background: #f1f5f9;
  color: #6c757d;
}

.rank-num.rank-1 { background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%); color: white; }
.rank-num.rank-2 { background: linear-gradient(135deg, #c0c0c0 0%, #808080 100%); color: white; }
.rank-num.rank-3 { background: linear-gradient(135deg, #cd7f32 0%, #8b4513 100%); color: white; }

.col-team {
  text-align: left !important;
  min-width: 90px;
}

.team-name-cell {
  display: inline-block;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-num { min-width: 32px; }
.col-win { color: #ef4444; font-weight: 600; }

.col-points {
  font-weight: 700;
  color: #667eea;
  min-width: 38px;
}

.ranking-table .points { color: #667eea; }

.diff-positive { color: #ef4444; font-weight: 600; }
.diff-negative { color: #3b82f6; font-weight: 600; }

.ranking-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 12px;
  color: #94a3b8;
  justify-content: center;
}

.meta-divider { color: #cbd5e1; }

/* ===================== 必发 tab 样式 ===================== */
.bifa-tab { padding: 16px; }

.bifa-summary {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
}

.bifa-total-card {
  padding: 12px 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  text-align: center;
  box-shadow: 0 4px 12px rgba(102,126,234,0.25);
}

.bifa-total-label {
  font-size: 11px;
  opacity: 0.85;
  margin-bottom: 4px;
}

.bifa-total-value {
  font-size: 20px;
  font-weight: 700;
}

.bifa-stat-card {
  padding: 12px 8px;
  background: #f8fafc;
  border-radius: 12px;
  text-align: center;
  border: 1px solid #e9ecef;
}

.bifa-stat-label {
  font-size: 11px;
  color: #6c757d;
  margin-bottom: 4px;
}

.bifa-stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #1a202c;
}

.bifa-bar-wrap { margin-bottom: 16px; }

.bifa-bar {
  display: flex;
  width: 100%;
  height: 32px;
  border-radius: 8px;
  overflow: hidden;
  background: #f1f5f9;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
}

.bifa-seg {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 600;
  transition: flex 0.4s ease;
  min-width: 0;
}

.bifa-seg-label {
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  white-space: nowrap;
}

.bifa-bar-legend {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 10px;
}

.bifa-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6c757d;
}

.bifa-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.bifa-legend-label { font-weight: 500; }
.bifa-legend-value {
  margin-left: auto;
  font-weight: 700;
  color: #1a202c;
}

.bifa-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bifa-item {
  display: grid;
  grid-template-columns: 44px 1fr 1.2fr 92px;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 10px;
  border: 1px solid #e9ecef;
  font-size: 13px;
}

.side-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  color: white;
}

.side-tag.tag-home { background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); }
.side-tag.tag-draw { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); }
.side-tag.tag-away { background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); }

.bifa-side { display: flex; }

.bifa-amount {
  font-weight: 700;
  color: #1a202c;
  font-size: 14px;
}

.bifa-proportion {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.bifa-proportion span {
  font-size: 11px;
  color: #6c757d;
  font-weight: 500;
}

.bifa-progress {
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.bifa-progress-bar {
  height: 100%;
  transition: width 0.4s ease;
}

.bifa-time {
  font-size: 11px;
  color: #94a3b8;
  text-align: right;
  white-space: nowrap;
}

/* ===================== 情报 tab 样式 ===================== */
.intelligence-tab { padding: 16px; }

.intelligence-content {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  padding: 16px;
  border-left: 3px solid #667eea;
}

.intelligence-pre {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  line-height: 1.7;
  color: #1a202c;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ===================== 响应式 ===================== */
@media (min-width: 769px) {
  .analysis-tabs .tabs-header .tab-item {
    padding: 14px 4px;
    font-size: 13px;
  }
}

@media (max-width: 768px) {
  .analysis-page::before { height: 200px; }

  .page-header { padding: 12px 16px; }

  .back-btn {
    padding: 6px 12px;
    font-size: 13px;
  }

  .back-btn svg { width: 14px; height: 14px; }
  .page-title { font-size: 16px; }

  .match-basic-info {
    margin: 0 12px 12px;
    padding: 14px;
  }

  .match-basic-info .team-name {
    font-size: 15px;
    max-width: 100px;
  }

  .match-basic-info .vs { font-size: 12px; }
  .match-basic-info .match-meta { font-size: 12px; }

  .analysis-tabs { margin: 0 12px 12px; }

  .analysis-tabs .tabs-header {
    background: #f1f5f9;
    border-bottom: none;
    padding: 4px;
    border-radius: 14px;
    gap: 4px;
    margin: 0 4px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  .analysis-tabs .tabs-header::-webkit-scrollbar { display: none; }

  .analysis-tabs .tabs-header .tab-item {
    flex: 0 0 auto;
    min-width: 72px;
    padding: 9px 14px;
    font-size: 13px;
    border-radius: 10px;
    color: #6c757d;
    transition: background 0.25s ease, color 0.25s ease, transform 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .analysis-tabs .tabs-header .tab-item.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
    font-weight: 600;
    box-shadow: 0 4px 10px rgba(102, 126, 234, 0.28);
  }
  .analysis-tabs .tabs-header .tab-item.active::after { display: none; }
  .analysis-tabs .tabs-header .tab-item:active { transform: scale(0.96); }
  .analysis-tabs .tabs-header .tab-item .tab-label {
    display: inline-block;
    max-width: none;
    margin: 0;
  }

  .tab-content {
    padding: 14px;
    max-height: calc(100vh - 220px);
  }

  .tab-pane .pane-header { margin-bottom: 14px; }
  .tab-pane .pane-header h3 { font-size: 15px; }

  .recent-match-item,
  .similar-match-item { padding: 10px; }

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

  .current-odds .odds-display .odds-type .odds-label { margin-bottom: 0; }

  .odds-history .odds-table { min-width: 400px; }
  .odds-history .odds-table th,
  .odds-history .odds-table td {
    padding: 10px 6px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .match-basic-info .team-name {
    font-size: 14px;
    max-width: 80px;
  }

  .match-basic-info .team-rank { font-size: 10px; }

  .analysis-tabs .tabs-header .tab-item {
    font-size: 12px;
    padding: 8px 12px;
    min-width: 64px;
  }

  .recent-match-item .match-result .score {
    font-size: 14px;
    min-width: 50px;
  }

  .similar-match-item .match-content .teams .score {
    font-size: 16px;
    min-width: 50px;
  }

  .xg-content .detail-grid { grid-template-columns: 1fr; }

  /* 战绩：移动端统计 4 列 + 保留净胜球单独一行 */
  .stats-summary {
    grid-template-columns: repeat(4, 1fr);
    padding: 10px 8px;
    gap: 5px;
  }

  .stat-item { padding: 5px 1px; }
  .stat-item .stat-num { font-size: 14px; }
  .stat-item .stat-label { font-size: 10px; }

  .stat-item.highlight-stat {
    grid-column: span 2;
  }

  /* 战绩：移动端列表项压缩 */
  .history-item { padding: 8px 10px; }

  .history-team .team-name { font-size: 12px; }

  .history-score {
    padding: 4px 8px;
  }
  .history-score .score-full { font-size: 13px; }
  .history-score .score-half { font-size: 9px; }

  /* 排名：移动端隐藏次要列 */
  .hide-on-mobile { display: none !important; }
  .ranking-table { min-width: 380px; font-size: 12px; }
  .ranking-table thead th { padding: 8px 4px; font-size: 11px; }
  .ranking-table tbody td { padding: 8px 4px; }
  .rank-num { width: 22px; height: 22px; line-height: 22px; font-size: 11px; }
  .col-rank { width: 40px; }
  .team-name-cell { max-width: 88px; }

  /* 必发：移动端卡片 */
  .bifa-summary { grid-template-columns: 1fr 1fr; }
  .bifa-summary .bifa-total-card { grid-column: 1 / -1; }
  .bifa-total-value { font-size: 18px; }

  .bifa-item {
    grid-template-columns: 38px 1fr 1.4fr;
    gap: 8px;
    padding: 8px 10px;
  }
  .bifa-item .bifa-time {
    grid-column: 1 / -1;
    text-align: right;
    border-top: 1px dashed #e9ecef;
    padding-top: 6px;
    margin-top: 4px;
    font-size: 10px;
  }
  .bifa-amount { font-size: 13px; }

  /* 情报 */
  .intelligence-content { padding: 14px; }
  .intelligence-pre { font-size: 13px; }
}

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

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .analysis-page { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); }
  .analysis-page::before { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); }

  .card {
    background: #2d3748;
    color: #e2e8f0;
  }

  .page-header {
    background: rgba(45, 55, 72, 0.95);
    border-bottom-color: #4a5568;
  }

  .page-title { color: #e2e8f0; }
  .match-basic-info { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }

  .analysis-tabs .tabs-header {
    background: #1a202c;
    border-bottom-color: #4a5568;
  }

  @media (max-width: 768px) {
    .analysis-tabs .tabs-header {
      background: #1a202c;
      border-bottom: none;
    }
  }

  .analysis-tabs .tabs-header .tab-item { color: #a0aec0; }
  .analysis-tabs .tabs-header .tab-item.active { color: #667eea; }

  @media (max-width: 768px) {
    .analysis-tabs .tabs-header .tab-item.active { color: #ffffff; }
  }

  .tab-pane .pane-header h3 { color: #e2e8f0; }

  .recent-match-item,
  .similar-match-item,
  .detail-item,
  .odds-type { background: #1a202c; }

  /* 战绩暗色 */
  .stats-summary {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  }

  .stat-item {
    background: #2d3748;
    border-color: #4a5568;
  }

  .stat-item .stat-num { color: #e2e8f0; }
  .stat-item .stat-label { color: #a0aec0; }

  .history-item {
    background: #1a202c;
    border-color: #4a5568;
  }

  .history-item.win {
    background: linear-gradient(90deg, rgba(239,68,68,0.15) 0%, #1a202c 60%);
  }

  .history-item.draw {
    background: linear-gradient(90deg, rgba(16,185,129,0.15) 0%, #1a202c 60%);
  }

  .history-item.loss {
    background: linear-gradient(90deg, rgba(59,130,246,0.15) 0%, #1a202c 60%);
  }

  .history-team .team-name { color: #e2e8f0; }
  .history-league { color: #cbd5e0; }

  .history-score {
    background: #2d3748;
    border-color: #4a5568;
    color: #90cdf4;
  }

  .history-score .score-half { color: #a0aec0; }

  /* 排名暗色 */
  .ranking-tabs { background: #1a202c; }
  .ranking-tab-btn { color: #a0aec0; }
  .ranking-tab-btn.active {
    background: #2d3748;
    color: #90cdf4;
  }

  .ranking-table-wrap { border-color: #4a5568; }
  .ranking-table thead th {
    background: #1a202c;
    color: #a0aec0;
    border-bottom-color: #4a5568;
  }
  .ranking-table tbody td {
    color: #e2e8f0;
    border-bottom-color: #2d3748;
  }
  .ranking-table tbody tr:hover { background: #1a202c; }
  .ranking-table tbody tr.highlight {
    background: linear-gradient(90deg, rgba(102,126,234,0.2) 0%, rgba(118,75,162,0.1) 100%);
  }
  .ranking-table tbody tr.highlight .team-name-cell { color: #90cdf4; }
  .rank-num { background: #2d3748; color: #a0aec0; }
  .bifa-stat-card { background: #1a202c; border-color: #4a5568; }
  .bifa-stat-value { color: #e2e8f0; }

  .bifa-item {
    background: #1a202c;
    border-color: #4a5568;
  }
  .bifa-amount { color: #e2e8f0; }

  .odds-history .odds-table th {
    background: #1a202c;
    color: #e2e8f0;
  }
  .odds-history .odds-table td { color: #a0aec0; }
  .odds-history .odds-table td.changed {
    background: #2d3748;
    color: #fa8c16;
  }
  .odds-history .odds-table tr:hover { background: #1a202c; }

  .intelligence-content {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  }
  .intelligence-pre { color: #e2e8f0; }
}
</style>
