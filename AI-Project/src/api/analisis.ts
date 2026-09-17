// src/api/analisis.ts
import apiClient from './index'
import type { CustomRequestConfig } from './index'

// =====================================================================
// 历史交锋 tab (POST /api/match/history/data/{matchId})
// =====================================================================
export interface RecentMatch {
  id: string
  league: string
  matchDate: string
  homeTeam: string
  awayTeam: string
  score: string
  result?: string
}

// =====================================================================
// xG 数据 tab (POST /api/match/xg/data/{matchId})
// =====================================================================
export interface TeamXgStats {
  id: number
  flag: string        // 'home' | 'away' | 'all'
  number: number
  team: string        // 球队英文名
  teamName: string    // 球队中文名
  matches: number
  wins: number
  draws: number
  loses: number
  goals: number
  ga: number
  points: number
  ppda: number
  ppdaAllowed: number
  deep: number
  deepAllowed: number
  npxGD: number
  npxG: number
  xpts: number
  xga: number
  xg: number
  npxGA: number
  goalDifference: number
}

export interface XgData {
  home: TeamXgStats | null
  away: TeamXgStats | null
  all: TeamXgStats | null
}

// =====================================================================
// 相似比赛 tab (POST /api/match/similar/data/{matchId})
// =====================================================================
export interface SimilarMatch {
  id: string
  league: string
  matchDate: string
  homeTeam: string
  awayTeam: string
  score: string
  h: string
  d: string
  a: string
}

// =====================================================================
// 情报数据 tab (POST /api/match/information/data/{matchId}) -> string
// =====================================================================
export type IntelligenceContent = string

// =====================================================================
// 赔率变化 tab (POST /api/match/odds/data/{matchId})
// =====================================================================
export interface OddsRecord {
  createTime: string
  deleted: number
  id: string
  a: string
  d: string
  h: string
  hf: string
  goalLine: string
  matchId: string
  updateDate: string
  updateTime: string
}

export interface OddsHistoryResponse {
  history: OddsRecord[]
}

// =====================================================================
// 战绩 tab (POST /api/match/history/{matchId})
// 响应: { home: { matchList, statistics }, away: { matchList, statistics } }
// =====================================================================

/** 单场历史比赛(后端实际字段) */
export interface HistoryMatch {
  awayTeamFullCourtGoalCnt: string       // 客队全场进球数字符串
  awayTeamId: number                     // 客队ID
  awayTeamShortName: string              // 客队名(中文)
  fullCourtGoal: string                  // 全场比分,如 "2:0"
  halfTimeGoal: string                   // 半场比分,如 "1:0"
  homeMatchResult: string                // 比赛结果文本(主视角)
  homeTeamFullCourtGoalCnt: string       // 主队全场进球数字符串
  homeTeamId: number                     // 主队ID
  homeTeamShortName: string              // 主队名(中文)
  matchDate: string                      // 比赛日期 "YYYY-MM-DD"
  matchId: number                        // 比赛ID
  seasonId: number                       // 赛季ID
  sportteryAwayTeamId: number            // 竞彩客队ID
  sportteryHomeTeamId: number            // 竞彩主队ID
  sportteryMatchId: number
  sportteryTournamentId: number
  teamMatchResult: 'home' | 'draw' | 'away' | ''  // 本球队结果(球队视角)
  totalTeamFullCourtGoalCnt: number
  tournamentId: number                   // 联赛ID
  tournamentShortName: string            // 联赛名,如 "S联赛"
  uniformAwayTeamId: number
  uniformHomeTeamId: number
  uniformLeagueId: number
  winningTeam: 'home' | 'draw' | 'away' | ''  // 赢球方
}

/** 球队战绩统计 */
export interface HistoryStatistics {
  drawMatchCnt: number        // 平场数
  drawProbability: string     // 平率 "20%"
  goalCnt: number             // 进球数
  lossGoalCnt: number         // 失球数
  lossGoalMatchCnt: number    // 输球场数
  lossProbability: string     // 输率 "20%"
  netGoal: number             // 净胜球
  sportteryTeamId: number
  teamId: number              // 球队ID
  teamShortName: string       // 球队名(中文)
  totalLegCnt: number         // 总场数
  uniformTeamId: number
  winGoalMatchCnt: number     // 胜场数
  winProbability: string      // 胜率 "60%"
}

/** 主队或客队战绩数据 */
export interface TeamHistory {
  matchList: HistoryMatch[]
  statistics: HistoryStatistics
}

/** 战绩接口整体响应 */
export interface MatchHistoryResponse {
  home: TeamHistory
  away: TeamHistory
}

// =====================================================================
// 排名 tab (GET /api/match/table/{matchId})
// 响应: 数组, 每个对象含 tableType: 'home' / 'away' / 'total'
// =====================================================================
export type RankingTableType = 'home' | 'away' | 'total'

export interface RankingItem {
  id: number
  leagueId: number
  seasonId: number
  phaseId: number
  phaseName: string | null
  groupId: number
  groupName: string | null
  uniformTeamId: number
  teamAbbrCnName: string     // 球队中文简称, 如 "皇马"
  ranking: number            // 排名
  totalLegCnt: number        // 场次
  points: number             // 积分
  winGoalMatchCnt: number    // 胜场
  drawMatchCnt: number       // 平场
  lossGoalMatchCnt: number   // 负场
  goalCnt: number            // 进球
  lossGoalCnt: number        // 失球
  netGoal: number            // 净胜球
  winProbability: string     // 胜率 "67%"
  tableType: RankingTableType  // 排名类型: 总/主/客
  phaseBeginDate: string | null
  phaseEndDate: string | null
  status: number
  createdTime: string
  updatedTime: string
}

export type MatchTableResponse = RankingItem[]

// =====================================================================
// 必发 tab (POST /api/bifa/trend/latest/{matchId})
// 响应: 数组, side: '主' / '和' / '客', amount 为字符串数字, dataTime 为毫秒时间戳
// =====================================================================
export type BifaSideLabel = '主' | '和' | '客'

export interface BifaTrendItem {
  id: number
  matchId: string
  crawlTime: string          // 抓取时间 "2026-09-17T16:51:46"
  side: BifaSideLabel        // '主' | '和' | '客'
  amount: string             // 金额(字符串数字),如 "280.16"
  dataTime: string           // 数据时间毫秒戳字符串,如 "1789611430000"
}

export type BifaTrendResponse = BifaTrendItem[]

// =====================================================================
// API 调用
// =====================================================================
export const matchApi = {
  // 历史交锋
  getRecentMatches(matchId: string, config?: CustomRequestConfig) {
    return apiClient.post<unknown>(`/api/match/history/data/${matchId}`, {}, config)
  },

  // xG 数据
  getXgData(matchId: string, config?: CustomRequestConfig) {
    return apiClient.post<XgData>(`/api/match/xg/data/${matchId}`, {}, config)
  },

  // 相似比赛
  getSimilarMatches(matchId: string, config?: CustomRequestConfig) {
    return apiClient.post<unknown>(`/api/match/similar/data/${matchId}`, {}, config)
  },

  // 情报数据(返回 string)
  getIntelligenceData(matchId: string, config?: CustomRequestConfig) {
    return apiClient.post<unknown>(`/api/match/information/data/${matchId}`, {}, config)
  },

  // 赔率变化
  getOddsHistory(matchId: string, config?: CustomRequestConfig) {
    return apiClient.post<OddsHistoryResponse>(`/api/match/odds/data/${matchId}`, {}, config)
  },

  // 战绩
  getMatchHistory(matchId: string, config?: CustomRequestConfig) {
    return apiClient.post<MatchHistoryResponse>(`/api/match/history/${matchId}`, {}, config)
  },

  // 排名
  getMatchTable(matchId: string, config?: CustomRequestConfig) {
    return apiClient.get<MatchTableResponse>(`/api/match/table/${matchId}`, config)
  },

  // 必发
  getBifaTrendLatest(matchId: string, config?: CustomRequestConfig) {
    return apiClient.post<BifaTrendResponse>(`/api/bifa/trend/latest/${matchId}`, {}, config)
  },
}
