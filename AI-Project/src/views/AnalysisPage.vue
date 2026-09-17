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

        <!-- 战绩 tab -->
        <div v-if="activeTab === 'history'" class="tab-pane">
          <div class="card history-tab">
            <div class="pane-header">
              <h3>近期战绩</h3>
              <button v-if="(matchHistoryData.home?.matchList?.length || matchHistoryData.away?.matchList?.length) && !loading.history" class="refresh-btn" @click="fetchMatchHistory" aria-label="刷新">
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

            <div v-else-if="!matchHistoryData.home?.matchList?.length && !matchHistoryData.away?.matchList?.length" class="empty-state">
              <svg class="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke-linecap="round" />
              </svg>
              <span class="empty-text">暂无近期战绩数据</span>
              <button class="retry-btn" @click="fetchMatchHistory">重新加载</button>
            </div>

            <template v-else>
              <!-- 主队战绩 -->
              <section v-if="matchHistoryData.home?.matchList?.length" class="team-history-block">
                <h4 class="team-title">
                  <span class="team-badge home">{{ matchInfo.homeName?.slice(0, 1) || '主' }}</span>
                  <span>{{ matchInfo.homeName || '主队' }} 近期战绩</span>
                </h4>

                <div v-if="matchHistoryData.home?.statistics && Object.keys(matchHistoryData.home.statistics).length" class="stats-summary">
                  <div class="stat-item">
                    <div class="stat-num">{{ matchHistoryData.home.statistics.matchCnt ?? '-' }}</div>
                    <div class="stat-label">场次</div>
                  </div>
                  <div class="stat-item win">
                    <div class="stat-num">{{ matchHistoryData.home.statistics.winMatchCnt ?? '-' }}</div>
                    <div class="stat-label">胜</div>
                  </div>
                  <div class="stat-item draw">
                    <div class="stat-num">{{ matchHistoryData.home.statistics.drawMatchCnt ?? '-' }}</div>
                    <div class="stat-label">平</div>
                  </div>
                  <div class="stat-item loss">
                    <div class="stat-num">{{ matchHistoryData.home.statistics.lossMatchCnt ?? '-' }}</div>
                    <div class="stat-label">负</div>
                  </div>
                  <div v-if="matchHistoryData.home.statistics.goalsForWin !== undefined" class="stat-item">
                    <div class="stat-num">{{ matchHistoryData.home.statistics.goalsForWin }}</div>
                    <div class="stat-label">进球</div>
                  </div>
                  <div v-if="matchHistoryData.home.statistics.goalsAgainst !== undefined" class="stat-item">
                    <div class="stat-num">{{ matchHistoryData.home.statistics.goalsAgainst }}</div>
                    <div class="stat-label">失球</div>
                  </div>
                  <div v-if="matchHistoryData.home.statistics.points !== undefined" class="stat-item">
                    <div class="stat-num">{{ matchHistoryData.home.statistics.points }}</div>
                    <div class="stat-label">积分</div>
                  </div>
                </div>

                <ul class="history-list">
                  <li v-for="(m, i) in matchHistoryData.home.matchList" :key="m.matchId || m.id || i" class="history-item">
                    <div class="history-meta">
                      <span class="history-league">{{ m.league || m.competitionName || '-' }}</span>
                      <span class="history-date">{{ formatHistoryTime(m) }}</span>
                    </div>
                    <div class="history-body">
                      <div class="history-team home">
                        <span class="team-name">{{ m.homeTeam || m.homeName || '-' }}</span>
                      </div>
                      <div class="history-score">
                        {{ getHistoryScoreText(m) }}
                      </div>
                      <div class="history-team away">
                        <span class="team-name">{{ m.awayTeam || m.awayName || '-' }}</span>
                      </div>
                    </div>
                    <div v-if="m.result" class="history-result" :class="getResultClass(m.result)">{{ m.result }}</div>
                  </li>
                </ul>
              </section>

              <!-- 客队战绩 -->
              <section v-if="matchHistoryData.away?.matchList?.length" class="team-history-block">
                <h4 class="team-title">
                  <span class="team-badge away">{{ matchInfo.awayName?.slice(0, 1) || '客' }}</span>
                  <span>{{ matchInfo.awayName || '客队' }} 近期战绩</span>
                </h4>

                <div v-if="matchHistoryData.away?.statistics && Object.keys(matchHistoryData.away.statistics).length" class="stats-summary">
                  <div class="stat-item">
                    <div class="stat-num">{{ matchHistoryData.away.statistics.matchCnt ?? '-' }}</div>
                    <div class="stat-label">场次</div>
                  </div>
                  <div class="stat-item win">
                    <div class="stat-num">{{ matchHistoryData.away.statistics.winMatchCnt ?? '-' }}</div>
                    <div class="stat-label">胜</div>
                  </div>
                  <div class="stat-item draw">
                    <div class="stat-num">{{ matchHistoryData.away.statistics.drawMatchCnt ?? '-' }}</div>
                    <div class="stat-label">平</div>
                  </div>
                  <div class="stat-item loss">
                    <div class="stat-num">{{ matchHistoryData.away.statistics.lossMatchCnt ?? '-' }}</div>
                    <div class="stat-label">负</div>
                  </div>
                  <div v-if="matchHistoryData.away.statistics.goalsForWin !== undefined" class="stat-item">
                    <div class="stat-num">{{ matchHistoryData.away.statistics.goalsForWin }}</div>
                    <div class="stat-label">进球</div>
                  </div>
                  <div v-if="matchHistoryData.away.statistics.goalsAgainst !== undefined" class="stat-item">
                    <div class="stat-num">{{ matchHistoryData.away.statistics.goalsAgainst }}</div>
                    <div class="stat-label">失球</div>
                  </div>
                  <div v-if="matchHistoryData.away.statistics.points !== undefined" class="stat-item">
                    <div class="stat-num">{{ matchHistoryData.away.statistics.points }}</div>
                    <div class="stat-label">积分</div>
                  </div>
                </div>

                <ul class="history-list">
                  <li v-for="(m, i) in matchHistoryData.away.matchList" :key="m.matchId || m.id || i" class="history-item">
                    <div class="history-meta">
                      <span class="history-league">{{ m.league || m.competitionName || '-' }}</span>
                      <span class="history-date">{{ formatHistoryTime(m) }}</span>
                    </div>
                    <div class="history-body">
                      <div class="history-team home">
                        <span class="team-name">{{ m.homeTeam || m.homeName || '-' }}</span>
                      </div>
                      <div class="history-score">
                        {{ getHistoryScoreText(m) }}
                      </div>
                      <div class="history-team away">
                        <span class="team-name">{{ m.awayTeam || m.awayName || '-' }}</span>
                      </div>
                    </div>
                    <div v-if="m.result" class="history-result" :class="getResultClass(m.result)">{{ m.result }}</div>
                  </li>
                </ul>
              </section>
            </template>
          </div>
        </div>

        <!-- 排名 tab -->
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
                      <th>场</th>
                      <th>胜</th>
                      <th>平</th>
                      <th>负</th>
                      <th>进</th>
                      <th>失</th>
                      <th>净</th>
                      <th class="col-points">积分</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, idx) in filteredRanking" :key="idx" :class="{ 'highlight': isHighlightTeam(row) }">
                      <td class="col-rank">{{ row.ranking }}</td>
                      <td class="col-team">
                        <div class="team-cell">
                          <img v-if="row.teamLogoUrl" :src="row.teamLogoUrl" :alt="row.teamAbbrCnName" class="team-logo-sm" @error="onImgError" />
                          <span>{{ row.teamAbbrCnName || row.teamAbbrEnName || '-' }}</span>
                        </div>
                      </td>
                      <td>{{ row.totalLegCnt ?? '-' }}</td>
                      <td>{{ row.winCnt ?? '-' }}</td>
                      <td>{{ row.drawCnt ?? '-' }}</td>
                      <td>{{ row.lossCnt ?? '-' }}</td>
                      <td>{{ row.goalsForWin ?? '-' }}</td>
                      <td>{{ row.goalsAgainst ?? '-' }}</td>
                      <td :class="{ 'diff-positive': (row.goalDifference ?? 0) > 0, 'diff-negative': (row.goalDifference ?? 0) < 0 }">
                        {{ formatGoalDiff(row.goalDifference) }}
                      </td>
                      <td class="col-points points">{{ row.points ?? '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </div>
        </div>

        <!-- 必发 tab -->
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
              </div>

              <div class="bifa-bar-wrap">
                <div class="bifa-bar">
                  <div
                    v-for="(seg, idx) in bifaSegments"
                    :key="idx"
                    class="bifa-seg"
                    :class="['seg-' + seg.side]"
                    :style="{ flex: seg.amount, background: seg.color }"
                  >
                    <span v-if="(seg.proportion || 0) > 8" class="bifa-seg-label">
                      {{ seg.sideLabel }} {{ seg.proportion?.toFixed(1) }}%
                    </span>
                  </div>
                </div>
              </div>

              <ul class="bifa-list">
                <li
                  v-for="(item, idx) in bifaData"
                  :key="idx"
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

        <!-- 情报 tab -->
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
import { ref, computed, onMounted, onUnmounted,watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { formatDisplayTime } from '@/utils/dateUtils'
import { matchApi } from '@/api/analisis'
import type { RecentMatch, XgData, SimilarMatch, OddsRecord, TeamXgStats } from '@/api/analisis'

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

// 进行中的请求控制器（用于组件卸载时统一 abort，避免 tab 切换时叠加旧请求）
// 每项 [AbortController, timeoutHandle]
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
const loadedTabs = ref(new Set<string>()) // 记录已加载的标签页

// 从路由获取比赛ID
const matchId = computed(() => route.params.matchId as string)

// 加载状态
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

// 数据状态
const recentMatches = ref<RecentMatch[]>([])
const xgData = ref<XgData>({
  home: null,
  away: null,
  all: null
})
const similarMatches = ref<SimilarMatch[]>([])
const oddsHistory = ref<OddsRecord[]>([])
const oddsAnalysis = ref('赔率变化分析...')

// 战绩数据(主队/客队近期战绩 + 统计)
const matchHistoryData = ref<import('@/api/analisis').MatchHistoryResponse>({
  home: { matchList: [], statistics: {} },
  away: { matchList: [], statistics: {} }
})

// 排名数据(数组,按 tableType 过滤)
const rankingData = ref<import('@/api/analisis').RankingItem[]>([])
const activeRankingType = ref<'total' | 'home' | 'away'>('total')

// 必发数据
const bifaData = ref<import('@/api/analisis').BifaTrendItem[]>([])

// 情报数据(纯字符串)
const intelligenceContent = ref('')

// 计算属性
// 队伍基础信息(供战绩/排名等 tab 使用)
const matchInfo = computed(() => ({
  homeName: matchData.value?.homeTeam || '',
  awayName: matchData.value?.awayTeam || ''
}))

// 排名数据按 tableType 过滤
const filteredRanking = computed(() => {
  if (!Array.isArray(rankingData.value)) return []
  const list = rankingData.value.filter((r) => r && r.tableType === activeRankingType.value)
  // 按 ranking 字段升序排序
  return list.slice().sort((a, b) => (a.ranking ?? 0) - (b.ranking ?? 0))
})

// 必发总交易额
const totalBifaAmount = computed(() => {
  if (!Array.isArray(bifaData.value) || bifaData.value.length === 0) return 0
  return bifaData.value.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
})

// 必发三方占比(主/和/客)
const bifaSegments = computed(() => {
  const total = totalBifaAmount.value
  // 由于后端可能返回多条不同时间的相同 side 数据,这里按 side 汇总
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
      amount: amount > 0 ? amount : 0.0001, // 防止 flex: 0 出现 NaN
      proportion: total > 0 ? (amount / total) * 100 : 0,
      color: getSideColor(s)
    }
  })
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

  // 移动端 tab-header 是横向滚动的:把激活项自动滚到可视区域中央,
  // 避免出现"激活态在边缘被截断"或"看不到激活的是哪个"
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
  } catch (e) {
    /* 静默:即便失败也不影响 tab 切换 */
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

// API 调用方法
const fetchRecentMatches = async () => {
  const signal = newAbortSignal()
  try {
    loading.value.recent = true
    const response = await matchApi.getRecentMatches(matchId.value, { signal: signal.signal })
    // apiClient 拦截器已 unwrap,response 直接是 RecentMatch[];用 unknown 转换以保留兜底分支
    const r = response as unknown
    if (Array.isArray(r)) {
      recentMatches.value = r as RecentMatch[]
    } else if (Array.isArray((r as { data?: unknown })?.data)) {
      // 兜底：兼容部分接口返回 { data: [...] }
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
    // 关键修复：apiClient 拦截器在 code === 0 时直接返回 data 字段本体，
    // 之前误读为 response.data（导致 xG 整页白屏）。
    const response = await matchApi.getXgData(matchId.value, { signal: signal.signal })

    // 兜底：兼容不同后端返回结构（XgData / { data: XgData } / [] 等）
    let payload: any = response
    if (payload && typeof payload === 'object' && !Array.isArray(payload) && payload.data && typeof payload.data === 'object') {
      payload = payload.data
    }

    const safeTeam = (team: unknown): TeamXgStats | null => {
      if (team && typeof team === 'object') {
        return team as TeamXgStats
      }
      return null
    }

    xgData.value = {
      home: safeTeam(payload?.home),
      away: safeTeam(payload?.away),
      all: safeTeam(payload?.all)
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

    // 兜底：兼容 { history: [] } / 直接返回数组 / 其它形态，避免历史接口白屏
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

// ============ 新增 4 个 tab 的 fetch 函数 ============

// 1. 战绩 tab
const fetchMatchHistory = async () => {
  const signal = newAbortSignal()
  try {
    loading.value.history = true
    const response = await matchApi.getMatchHistory(matchId.value, { signal: signal.signal })

    // 兜底：兼容 { home: {...}, away: {...} } / { data: {...} } / null
    const emptyTeam = { matchList: [], statistics: {} }
    const r = response as unknown
    let payload: any = null
    if (r && typeof r === 'object' && !Array.isArray(r)) {
      if ('home' in r || 'away' in r) {
        payload = r
      } else if ((r as { data?: unknown }).data && typeof (r as { data?: unknown }).data === 'object') {
        payload = (r as { data: any }).data
      }
    }

    if (payload) {
      const home = payload.home && typeof payload.home === 'object' ? payload.home : emptyTeam
      const away = payload.away && typeof payload.away === 'object' ? payload.away : emptyTeam
      matchHistoryData.value = {
        home: {
          matchList: Array.isArray(home.matchList) ? home.matchList : [],
          statistics: home.statistics && typeof home.statistics === 'object' ? home.statistics : {}
        },
        away: {
          matchList: Array.isArray(away.matchList) ? away.matchList : [],
          statistics: away.statistics && typeof away.statistics === 'object' ? away.statistics : {}
        }
      }
    } else {
      matchHistoryData.value = { home: emptyTeam, away: emptyTeam }
    }
  } catch (error) {
    if (!isAborted(error)) {
      console.error('获取战绩失败:', error)
      matchHistoryData.value = { home: { matchList: [], statistics: {} }, away: { matchList: [], statistics: {} } }
      ElMessage.error('获取战绩失败，请稍后重试')
    }
  } finally {
    loading.value.history = false
    releaseSignal(signal)
  }
}

// 2. 排名 tab
const fetchMatchTable = async () => {
  const signal = newAbortSignal()
  try {
    loading.value.table = true
    const response = await matchApi.getMatchTable(matchId.value, { signal: signal.signal })

    // 兜底：兼容数组 / { data: [...] } / { tableList: [...] } / { list: [...] }
    let list: any[] = []
    const r = response as unknown
    if (r) {
      if (Array.isArray(r)) {
        list = r
      } else if (Array.isArray((r as { data?: unknown }).data)) {
        list = (r as { data: any[] }).data
      } else if (Array.isArray((r as { tableList?: unknown }).tableList)) {
        list = (r as { tableList: any[] }).tableList
      } else if (Array.isArray((r as { list?: unknown }).list)) {
        list = (r as { list: any[] }).list
      }
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

// 3. 必发 tab
const fetchBifaTrend = async () => {
  const signal = newAbortSignal()
  try {
    loading.value.bifa = true
    const response = await matchApi.getBifaTrendLatest(matchId.value, { signal: signal.signal })

    // 兜底：兼容数组 / { data: [...] } / { list: [...] } / { trend: [...] }
    let list: any[] = []
    const r = response as unknown
    if (r) {
      if (Array.isArray(r)) {
        list = r
      } else if (Array.isArray((r as { data?: unknown }).data)) {
        list = (r as { data: any[] }).data
      } else if (Array.isArray((r as { list?: unknown }).list)) {
        list = (r as { list: any[] }).list
      } else if (Array.isArray((r as { trend?: unknown }).trend)) {
        list = (r as { trend: any[] }).trend
      }
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

// 4. 情报 tab
const fetchIntelligence = async () => {
  const signal = newAbortSignal()
  try {
    loading.value.intelligence = true
    const response = await matchApi.getIntelligenceData(matchId.value, { signal: signal.signal })

    // 后端可能返回 string / { data: string } / 其它
    let text = ''
    const r = response as unknown
    if (typeof r === 'string') {
      text = r
    } else if (r && typeof r === 'object') {
      const obj = r as { data?: unknown; content?: unknown; text?: unknown }
      if (typeof obj.data === 'string') {
        text = obj.data
      } else if (typeof obj.content === 'string') {
        text = obj.content
      } else if (typeof obj.text === 'string') {
        text = obj.text
      }
    }
    intelligenceContent.value = text || ''
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

// ============ 新增 4 个 tab 的辅助函数 ============

// 战绩 - 比赛时间展示(m.matchDate 优先,否则 m.matchTime)
const formatHistoryTime = (m: any) => {
  if (!m) return '-'
  const raw = m.matchDate || m.matchTime || ''
  // 优先尝试将完整时间拆成 date + time 两段;否则整体作为 date
  const parts = String(raw).split(' ')
  if (parts.length >= 2) {
    return formatDisplayTime(parts[0] || '', parts[1] || '')
  }
  return formatDisplayTime(String(raw), '')
}

// 战绩 - 格式化比分(支持 score 字符串 / homeScore+awayScore / scoreDetail)
const getHistoryScoreText = (m: any) => {
  if (!m) return '-'
  if (typeof m.score === 'string' && m.score.trim()) return m.score
  if (typeof m.homeScore === 'number' && typeof m.awayScore === 'number') {
    return `${m.homeScore}-${m.awayScore}`
  }
  if (typeof m.homeScoreHalf === 'number' && typeof m.awayScoreHalf === 'number' && typeof m.homeScore === 'number') {
    return `${m.homeScore}-${m.awayScore}`
  }
  return '-'
}

// 战绩 - 比赛结果分类(胜/平/负)
const getResultClass = (result: string) => {
  if (!result) return ''
  const r = result.toLowerCase()
  if (r.includes('胜') || r.includes('win') || r === 'w') return 'result-win'
  if (r.includes('平') || r.includes('draw') || r === 'd') return 'result-draw'
  if (r.includes('负') || r.includes('loss') || r.includes('lose') || r === 'l') return 'result-loss'
  return ''
}

// 排名 - 格式化净胜球(添加 +/-)
const formatGoalDiff = (v: any) => {
  if (v === undefined || v === null || v === '') return '-'
  const n = Number(v)
  if (isNaN(n)) return String(v)
  if (n > 0) return `+${n}`
  return String(n)
}

// 排名 - 高亮当前比赛的两支队伍
const isHighlightTeam = (row: any) => {
  if (!row) return false
  const names = [
    row.teamAbbrCnName,
    row.teamAbbrEnName,
    row.teamName,
    row.teamAbbr
  ].filter(Boolean)
  const homeName = (matchInfo.value.homeName || '').trim()
  const awayName = (matchInfo.value.awayName || '').trim()
  return names.some((n) => n && (n === homeName || n === awayName))
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

// 必发 - 格式化金额(支持科学计数 / 字符串数字)
const formatBifaAmount = (v: any) => {
  if (v === undefined || v === null || v === '') return '0'
  const n = Number(v)
  if (isNaN(n)) return String(v)
  if (n >= 100000000) return (n / 100000000).toFixed(2) + '亿'
  if (n >= 10000) return (n / 10000).toFixed(2) + '万'
  return n.toFixed(0)
}

// 必发 - 格式化时间(毫秒字符串 -> yyyy-MM-dd HH:mm)
const formatBifaTime = (v: any) => {
  if (!v) return '-'
  let ts = Number(v)
  if (isNaN(ts)) {
    ts = Date.parse(String(v))
  }
  if (isNaN(ts) || ts <= 0) return String(v)
  // 如果时间戳在秒级,转为毫秒
  if (ts < 1e12) ts = ts * 1000
  const d = new Date(ts)
  if (isNaN(d.getTime())) return String(v)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 必发 - 单项占比
const getBifaProportion = (item: any) => {
  const total = totalBifaAmount.value
  if (!total) return 0
  const amt = Number(item?.amount) || 0
  return Number(((amt / total) * 100).toFixed(1))
}

// tab 是否处于 loading 状态(模板中无法用 as 类型断言,通过方法封装)
const isTabLoading = (tabId: string) => {
  const l = loading.value as unknown as Record<string, unknown>
  return Boolean(l?.[tabId])
}

// img 加载失败时隐藏(模板中无法写 as 类型断言,通过方法封装)
const onImgError = (event: Event) => {
  const target = event?.target as HTMLImageElement | null
  if (target) target.style.display = 'none'
}

// 生命周期
onMounted(() => {
  // 初始加载第一个标签页的数据
  loadTabData(activeTab.value)

  // 监听窗口大小变化，优化移动端体验
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  // 组件卸载时统一 abort 所有进行中的请求
  // 拷贝一份再清空，避免边遍历边删除导致的索引问题
  const list = pendingControllers.slice()
  pendingControllers.length = 0
  list.forEach(([c]) => {
    try { c.abort() } catch { /* noop */ }
  })
  list.forEach(([, t]) => clearTimeout(t))
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
  position: relative;
}

.analysis-tabs .tabs-header {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  /* position: sticky; */
  top: 73px;
  z-index: 10;
  backdrop-filter: blur(10px);
  /* 移动端：横向滑动 + 隐藏滚动条 */
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.analysis-tabs .tabs-header::-webkit-scrollbar {
  display: none;
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
  white-space: nowrap;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-state .empty-icon {
  color: #cbd5e1;
  opacity: 0.85;
}

.empty-state .empty-text {
  font-size: 14px;
  color: #94a3b8;
}

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

.retry-btn:active {
  transform: translateY(0);
}

.muted {
  color: #94a3b8;
  font-size: 13px;
  font-weight: normal;
  margin-left: 6px;
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

  /* 移动端：改为胶囊分段控件 + 横向滑动 */
  .analysis-tabs .tabs-header {
    background: transparent;
    border-bottom: none;
    padding: 4px;
    border-radius: 14px;
    background: #f1f5f9;
    gap: 4px;
    margin: 0 4px;
    /* 横向滑动支持 */
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  .analysis-tabs .tabs-header::-webkit-scrollbar {
    display: none;
  }

  .analysis-tabs .tabs-header .tab-item {
    flex: 0 0 auto;          /* 不要 flex:1,改为按内容自动宽度 */
    min-width: 72px;
    padding: 9px 14px;
    font-size: 13px;
    border-radius: 10px;
    color: #6c757d;
    transition: background 0.25s ease, color 0.25s ease, transform 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }

  /* 移动端 tab：圆角胶囊高亮(用 active 自身做背景,不再用底部下划线) */
  .analysis-tabs .tabs-header .tab-item.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
    font-weight: 600;
    box-shadow: 0 4px 10px rgba(102, 126, 234, 0.28);
  }
  .analysis-tabs .tabs-header .tab-item.active::after {
    display: none;
  }

  .analysis-tabs .tabs-header .tab-item:active {
    transform: scale(0.96);
  }

  /* 移动端取消 text-align:center + max-width:50 限制 */
  .analysis-tabs .tabs-header .tab-item .tab-label {
    display: inline-block;
    max-width: none;
    margin: 0;
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

  /* 暗色模式：移动端胶囊分段容器要更深一点的底色 */
  @media (max-width: 768px) {
    .analysis-tabs .tabs-header {
      background: #1a202c;
      border-bottom: none;
    }
  }

  .analysis-tabs .tabs-header .tab-item {
    color: #a0aec0;
  }

  .analysis-tabs .tabs-header .tab-item.active {
    color: #667eea;
  }

  /* 暗色模式移动端 active 文字应为白色 */
  @media (max-width: 768px) {
    .analysis-tabs .tabs-header .tab-item.active {
      color: #ffffff;
    }
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

/* ===================== 战绩 tab 样式 ===================== */
.history-tab {
  padding: 20px;
}
.team-history-block {
  margin-bottom: 24px;
}
.team-history-block:last-child {
  margin-bottom: 0;
}
.team-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 12px;
}
.team-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: white;
  font-size: 13px;
  font-weight: 600;
}
.team-badge.home {
  background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
}
.team-badge.away {
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
}
.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: 8px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 14px;
}
.stat-item {
  text-align: center;
  padding: 6px 4px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}
.stat-item .stat-num {
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
  line-height: 1.2;
}
.stat-item .stat-label {
  font-size: 11px;
  color: #6c757d;
  margin-top: 2px;
}
.stat-item.win .stat-num { color: #ef4444; }
.stat-item.draw .stat-num { color: #10b981; }
.stat-item.loss .stat-num { color: #3b82f6; }

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.history-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border-radius: 10px;
  border: 1px solid #e9ecef;
  position: relative;
}
.history-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6c757d;
}
.history-league {
  font-weight: 500;
  color: #4a5568;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 65%;
}
.history-date {
  font-size: 11px;
  white-space: nowrap;
}
.history-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
.history-score {
  font-size: 14px;
  font-weight: 700;
  color: #667eea;
  padding: 2px 10px;
  background: white;
  border-radius: 6px;
  flex-shrink: 0;
}
.history-result {
  align-self: flex-start;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}
.history-result.result-win { background: #fee2e2; color: #ef4444; }
.history-result.result-draw { background: #d1fae5; color: #10b981; }
.history-result.result-loss { background: #dbeafe; color: #3b82f6; }

/* ===================== 排名 tab 样式 ===================== */
.table-tab {
  padding: 20px;
}
.ranking-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  padding: 4px;
  background: #f1f5f9;
  border-radius: 10px;
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
}
.ranking-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 540px;
}
.ranking-table thead th {
  background: #f8f9fa;
  color: #6c757d;
  font-weight: 500;
  font-size: 12px;
  padding: 10px 6px;
  text-align: center;
  border-bottom: 1px solid #e9ecef;
  white-space: nowrap;
}
.ranking-table tbody td {
  padding: 10px 6px;
  text-align: center;
  border-bottom: 1px solid #f1f5f9;
  color: #1a202c;
}
.ranking-table tbody tr:hover {
  background: #f8f9fa;
}
.ranking-table tbody tr.highlight {
  background: linear-gradient(90deg, rgba(102,126,234,0.08) 0%, rgba(118,75,162,0.05) 100%);
}
.ranking-table tbody tr.highlight td {
  font-weight: 600;
  color: #667eea;
}
.col-rank {
  width: 50px;
  font-weight: 600;
}
.col-team {
  text-align: left !important;
  min-width: 100px;
}
.team-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}
.team-logo-sm {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.col-points {
  font-weight: 700;
  color: #667eea;
}
.ranking-table .points {
  color: #667eea;
}
.diff-positive { color: #ef4444; font-weight: 600; }
.diff-negative { color: #3b82f6; font-weight: 600; }

/* ===================== 必发 tab 样式 ===================== */
.bifa-tab {
  padding: 20px;
}
.bifa-summary {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.bifa-total-card {
  flex: 1;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  text-align: center;
  box-shadow: 0 4px 12px rgba(102,126,234,0.25);
}
.bifa-total-label {
  font-size: 12px;
  opacity: 0.85;
  margin-bottom: 6px;
}
.bifa-total-value {
  font-size: 22px;
  font-weight: 700;
}
.bifa-bar-wrap {
  margin-bottom: 16px;
}
.bifa-bar {
  display: flex;
  width: 100%;
  height: 36px;
  border-radius: 8px;
  overflow: hidden;
  background: #f1f5f9;
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
}
.bifa-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bifa-item {
  display: grid;
  grid-template-columns: 50px 1fr 1fr 80px;
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
  font-weight: 600;
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
.intelligence-tab {
  padding: 20px;
}
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

/* 8 个 tab 时调整 tab 字体大小和间距 */
@media (min-width: 769px) {
  .analysis-tabs .tabs-header .tab-item {
    padding: 14px 4px;
    font-size: 13px;
  }
}

/* 移动端进一步压缩 */
@media (max-width: 480px) {
  .bifa-item {
    grid-template-columns: 40px 1fr 1fr;
  }
  .bifa-item .bifa-time {
    grid-column: 1 / -1;
    text-align: right;
    border-top: 1px dashed #e9ecef;
    padding-top: 6px;
    margin-top: 4px;
  }
  .stats-summary {
    grid-template-columns: repeat(3, 1fr);
  }
  .ranking-table {
    min-width: 460px;
    font-size: 12px;
  }
}
</style>