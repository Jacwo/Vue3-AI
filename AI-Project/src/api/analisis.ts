// src/api/matchApi.ts
import apiClient from './index'
import type { CustomRequestConfig } from './index'

// 最近比赛接口响应类型
export interface RecentMatch {
  id: string
  league: string
  matchDate: string
  homeTeam: string
  awayTeam: string
  score: string
  result?: string
}

// 单个球队的 xG 统计数据接口
export interface TeamXgStats {
  id: number          // 球队ID
  flag: string        // 主场/客场标识: 'home', 'away', 'all'
  number: number      // 未知编号（可能是球队编号或序号）
  team: string        // 球队英文名
  teamName: string    // 球队中文名
  matches: number     // 比赛场次
  wins: number        // 胜场
  draws: number       // 平场
  loses: number       // 负场
  goals: number       // 进球数
  ga: number          // 失球数 (Goals Against)
  points: number      // 积分
  ppda: number        // 传球防守强度 (Passes Allowed Per Defensive Action)
  ppdaAllowed: number // 被允许的传球防守强度
  deep: number        // 进攻三区次数 (进入对方禁区次数)
  deepAllowed: number // 被进入进攻三区次数
  npxGD: number       // 非点球预期进球净胜球 (Non-Penalty Expected Goal Difference)
  npxG: number        // 非点球预期进球 (Non-Penalty Expected Goals)
  xpts: number        // 预期积分 (Expected Points)
  xga: number         // 预期失球 (Expected Goals Against)
  xg: number          // 预期进球 (Expected Goals)
  npxGA: number       // 非点球预期失球 (Non-Penalty Expected Goals Against)
  goalDifference: number // 实际净胜球 (Goals Difference)
}

// xG 数据接口响应类型
export interface XgData {
  home: TeamXgStats | null
  away: TeamXgStats | null
  all: TeamXgStats | null
}

// 相似比赛接口响应类型
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

// 情报数据接口响应类型
export interface IntelligenceData {
  content: string
  analysis?: string
  risk?: string
}

// 赔率变化接口响应类型
export interface OddsRecord {
    createTime: string     // 创建时间
  deleted: number        // 是否删除 0:未删除
  id: string            // 记录ID
  a: string             // 客胜赔率
  d: string             // 平赔
  h: string             // 主胜赔率
  hf: string            // 热门标志: "1"主热, "-1"客热, "0"不变
  goalLine: string      // 让球盘口
  matchId: string       // 比赛ID
  updateDate: string    // 更新日期
  updateTime: string    // 更新时间
}

export interface OddsHistoryResponse {
  history: OddsRecord[]
}

// ============ 战绩 tab 相关类型 ============
// 单场历史比赛记录
export interface HistoryMatch {
  id?: string
  matchId?: string
  league?: string          // 联赛名
  matchDate?: string       // 比赛日期
  homeTeam?: string        // 主队
  awayTeam?: string        // 客队
  homeTeamId?: number
  awayTeamId?: number
  score?: string           // 比分(例如 "2-1")
  result?: string          // 比赛结果 胜/平/负
  homeScore?: number
  awayScore?: number
  // 兼容多种后端字段命名
  homeName?: string
  awayName?: string
  matchTime?: string
  competitionName?: string
  homeScoreHalf?: number
  awayScoreHalf?: number
}

// 球队战绩统计
export interface HistoryStatistics {
  matchCnt?: number        // 比赛场次
  winMatchCnt?: number     // 胜场
  drawMatchCnt?: number    // 平场
  lossMatchCnt?: number    // 负场
  goalsForWin?: number     // 进球
  goalsAgainst?: number    // 失球
  goalDiff?: number        // 净胜球
  winProbability?: number  // 胜率(0-100 或 0-1)
  avgGoals?: number        // 场均进球
  avgLosses?: number // 场均失球
  points?: number          // 积分
}

// 主队或客队战绩数据
export interface TeamHistory {
  matchList?: HistoryMatch[]
  statistics?: HistoryStatistics
}

// 战绩接口整体响应
export interface MatchHistoryResponse {
  home: TeamHistory
  away: TeamHistory
}

// ============ 排名 tab 相关类型 ============
// 单条联赛排名
export interface RankingItem {
  tableType: 'home' | 'away' | 'total'   // 主/客/总 排名类型
  ranking: number                          // 排名
  teamAbbrCnName?: string                  // 球队中文简称
  teamAbbrEnName?: string                  // 球队英文简称
  teamLogoUrl?: string                     // 队徽 URL
  leagueId?: number
  leagueName?: string                      // 联赛名
  totalLegCnt?: number                     // 总场次
  winCnt?: number                          // 胜场
  drawCnt?: number                         // 平场
  lossCnt?: number                         // 负场
  goalsForWin?: number                  // 进球
  goalsAgainst?: number                    // 失球
  goalDifference?: number                  // 净胜球
  points?: number                           // 积分
  // 兼容额外字段
  [key: string]: any
}

// 排名接口整体响应(后端可能直接返回数组,也可能包一层)
export type MatchTableResponse = RankingItem[] | { data: RankingItem[] } | { tableList: RankingItem[] } | { list: RankingItem[] }

// ============ 必发 tab 相关类型 ============
export type BifaSide = '主' | '和' | '客'

export interface BifaTrendItem {
  side: BifaSide | string                 // 主/和/客
  amount: number | string                 // 金额
  dataTime?: string | number               // 时间(毫秒时间戳字符串)
  proportion?: number | string            // 占比(可选)
  // 兼容额外字段
  [key: string]: any
}

// 必发趋势接口整体响应(可能直接返回数组)
export type BifaTrendResponse = BifaTrendItem[] | { data: BifaTrendItem[] } | { list: BifaTrendItem[] } | { trend: BifaTrendItem[] }

export const matchApi = {
  // 获取近期战绩
  getRecentMatches(matchId: string, config?: CustomRequestConfig) {
    return apiClient.post<RecentMatch[]>(`/api/match/history/data/${matchId}`, {}, config)
  },

  // 获取 xG 数据
  // 注意：apiClient 拦截器在 code === 0 时直接返回 data 字段本体，
  // 因此这里返回类型为 XgData，不再包一层 { data: XgData }
  getXgData(matchId: string, config?: CustomRequestConfig) {
    return apiClient.post<XgData>(`/api/match/xg/data/${matchId}`, {}, config)
  },

  // 获取相似比赛
  getSimilarMatches(matchId: string, config?: CustomRequestConfig) {
    return apiClient.post<SimilarMatch[]>(`/api/match/similar/data/${matchId}`, {}, config)
  },

  // 获取情报数据(返回 string 内容)
  getIntelligenceData(matchId: string, config?: CustomRequestConfig) {
    return apiClient.post<string>(`/api/match/information/data/${matchId}`, {}, config)
  },

  // 获取赔率变化（如果需要的话）
  getOddsHistory(matchId: string, config?: CustomRequestConfig) {
    // 假设有这个接口，如果没有可以先注释掉
    return apiClient.post<OddsHistoryResponse>(`/api/match/odds/data/${matchId}`, {}, config)
  },

  // ============ 新增 4 个 tab 的接口 ============

  // 1. 战绩 tab - POST /api/match/history/{matchId}
  // 返回 {home: {matchList, statistics}, away: {matchList, statistics}}
  getMatchHistory(matchId: string, config?: CustomRequestConfig) {
    return apiClient.post<MatchHistoryResponse>(`/api/match/history/${matchId}`, {}, config)
  },

  // 2. 排名 tab - GET /api/match/table/{matchId}
  // 返回排名数组(包含 tableType 字段: home/away/total)
  getMatchTable(matchId: string, config?: CustomRequestConfig) {
    return apiClient.get<MatchTableResponse>(`/api/match/table/${matchId}`, config)
  },

  // 3. 必发 tab - POST /api/bifa/trend/latest/{matchId}
  // 返回数组(包含 side: 主/和/客, amount, dataTime)
  getBifaTrendLatest(matchId: string, config?: CustomRequestConfig) {
    return apiClient.post<BifaTrendResponse>(`/api/bifa/trend/latest/${matchId}`, {}, config)
  },
}