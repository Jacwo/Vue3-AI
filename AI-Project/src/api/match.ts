import apiClient from './index'
import type { CustomRequestConfig, BaseResponse } from './index'

// 后端返回的原始比赛数据结构
export interface RawMatch {
  matchId: number
  awayTeamAbbName: string
  awayTeamAllName: string
  awayTeamId: string
  backColor: string
  homeTeamAbbName: string
  homeTeamAllName: string
  homeTeamId: string
  leagueAbbName: string
  leagueAllName: string
  leagueId: string
  matchDate: string
  matchNum: number
  matchNumStr: string
  matchStatus: string
  matchStatusName: string
  matchTime: string
  sectionsNo1: string
  sectionsNo999: string
  awayWin: string | null
  draw: string | null
  homeWin: string | null
  hawayWin: string | null
  hdraw: string | null
  hhomeWin: string | null
  goalLine: string | null
  isSingleMatch:boolean | false

}

// 前端使用的比赛数据结构
export interface Match {
  id: number
  league: string
  homeTeam: string
  awayTeam: string
  odds: {
    home: number | null
    draw: number | null
    away: number | null
    hhome: number | null
    hdraw: number | null
    haway: number | null
    goalLine:string | null
  }
  matchTime: string
  fullMatchTime: string // 完整日期时间
  status: string
  matchStatus: string
  matchStatusName: string
  matchNumStr: string
  homeTeamId: string
  awayTeamId: string
  leagueId: string
  backColor: string
  isSingleMatch:boolean
}

// 列表参数
export interface MatchListParams {
  league?: string
  date?: string
  page?: number
  pageSize?: number
}

// 比赛列表响应
export interface MatchListResponse {
  list: Match[]
  total: number
  page: number
  pageSize: number
}

// 分析请求参数
export interface AnalysisRequest {
  matchId: number
  analysisType?: string
  includeHistory?: boolean
  includeStats?: boolean
}

// 分析结果
export interface AnalysisResult {
  timestamp: number
  aiAnalysis: string
}

// 转换原始数据到前端数据
const transformMatch = (raw: RawMatch): Match => {
  return {
    id: raw.matchId,
    league: raw.leagueAllName || raw.leagueAbbName,
    homeTeam: raw.homeTeamAllName || raw.homeTeamAbbName,
    awayTeam: raw.awayTeamAllName || raw.awayTeamAbbName,
    odds: {
      home: raw.homeWin ? parseFloat(raw.homeWin) : null,
      draw: raw.draw ? parseFloat(raw.draw) : null,
      away: raw.awayWin ? parseFloat(raw.awayWin) : null,
      hhome: raw.hhomeWin ? parseFloat(raw.hhomeWin) : null,
      hdraw: raw.hdraw ? parseFloat(raw.hdraw) : null,
      haway: raw.hawayWin ? parseFloat(raw.hawayWin) : null,
      goalLine: raw.goalLine ? raw.goalLine : null,
    },
    matchTime: raw.matchTime,
    fullMatchTime: `${raw.matchDate} ${raw.matchTime}`,
    status: raw.matchStatus,
    matchStatus: raw.matchStatus,
    matchStatusName: raw.matchStatusName,
    matchNumStr: raw.matchNumStr,
    homeTeamId: raw.homeTeamId,
    awayTeamId: raw.awayTeamId,
    leagueId: raw.leagueId,
    backColor: raw.backColor,
    isSingleMatch: raw.isSingleMatch
  }
}

// 转换比赛数组
const transformMatches = (rawMatches: RawMatch[]): Match[] => {
  return rawMatches.map(transformMatch)
}

export const matchApi = {
  // 获取比赛列表
  getMatchList(params?: MatchListParams, config?: CustomRequestConfig) {
    return apiClient.get<RawMatch[]>('/api/match/list', {
      params,
      ...config,
    }).then((rawMatches: RawMatch[]) => {
      // 转换数据格式
      return transformMatches(rawMatches)
    })
  },
  
  // 获取比赛列表（原始数据）
  getMatchListRaw(params?: MatchListParams, config?: CustomRequestConfig) {
    return apiClient.get<RawMatch[]>('/match/list', {
      params,
      ...config,
    })
  },
  
  // 获取比赛分析
  getMatchAnalysis(matchId: number, data?: AnalysisRequest, config?: CustomRequestConfig) {
    return apiClient.post<AnalysisResult>(`/api/match/analysis/${matchId}`, data, config)
  },
  
  // 获取比赛详情
  getMatchDetail(matchId: number, config?: CustomRequestConfig) {
    return apiClient.get<RawMatch>(`/api/match/${matchId}`, config).then((rawMatch: RawMatch) => {
      // 转换数据格式
      return transformMatch(rawMatch)
    })
  },
  
  // 获取比赛详情（原始数据）
  getMatchDetailRaw(matchId: number, config?: CustomRequestConfig) {
    return apiClient.get<RawMatch>(`/match/${matchId}`, config)
  },
  
  // 批量获取分析结果
  getBatchAnalysis(matchIds: number[], config?: CustomRequestConfig) {
    return apiClient.post<Record<number, AnalysisResult>>('/match/analysis/batch', {
      matchIds,
    }, config)
  },
  
  // 按状态获取比赛列表
  getMatchesByStatus(status: string, config?: CustomRequestConfig) {
    return apiClient.get<RawMatch[]>('/match/list', {
      params: { status },
      ...config,
    }).then((rawMatches: RawMatch[]) => {
      return transformMatches(rawMatches)
    })
  },
  
  // 按联赛获取比赛列表
  getMatchesByLeague(leagueId: string, config?: CustomRequestConfig) {
    return apiClient.get<RawMatch[]>('/match/list', {
      params: { leagueId },
      ...config,
    }).then((rawMatches: RawMatch[]) => {
      return transformMatches(rawMatches)
    })
  },
  
  // 获取今天的比赛
  getTodayMatches(config?: CustomRequestConfig) {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    return apiClient.get<RawMatch[]>('/match/list', {
      params: { date: today },
      ...config,
    }).then((rawMatches: RawMatch[]) => {
      return transformMatches(rawMatches)
    })
  },
}