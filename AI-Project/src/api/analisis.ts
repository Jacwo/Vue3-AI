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

export const matchApi = {
  // 获取近期战绩
  getRecentMatches(matchId: string, config?: CustomRequestConfig) {
    return apiClient.post<RecentMatch[]>(`/api/match/history/data/${matchId}`, {}, config)
  },

  // 获取 xG 数据
  getXgData(matchId: string, config?: CustomRequestConfig) {
    return apiClient.post<{ data: XgData }>(`/api/match/xg/data/${matchId}`, {}, config)
  },

  // 获取相似比赛
  getSimilarMatches(matchId: string, config?: CustomRequestConfig) {
    return apiClient.post<SimilarMatch[]>(`/api/match/similar/data/${matchId}`, {}, config)
  },

  // 获取情报数据
  getIntelligenceData(matchId: string, config?: CustomRequestConfig) {
    return apiClient.post<string>(`/api/match/information/data/${matchId}`, {}, config)
  },

  // 获取赔率变化（如果需要的话）
  getOddsHistory(matchId: string, config?: CustomRequestConfig) {
    // 假设有这个接口，如果没有可以先注释掉
    return apiClient.post<OddsHistoryResponse>(`/api/match/odds/data/${matchId}`, {}, config)
  }
}