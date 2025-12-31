// 原始API返回的比赛数据类型
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
  isSigleMatch: boolean | false
}

// 前端使用的比赛数据类型
export interface Match {
  id: number
  league: string
  homeTeam: string
  awayTeam: string
  odds: Odds
  matchTime: string
  fullMatchTime: string
  status: string
  matchStatus: string
  matchStatusName: string
  matchNumStr: string
  homeTeamId: string
  awayTeamId: string
  leagueId: string
  backColor: string
  isSigleMatch: boolean
}

export interface Odds {
  home: number | null
  draw: number | null
  away: number | null
  hhome: number | null
  hdraw: number | null
  haway: number | null
  goalLine: string | null
}

export interface MatchListParams {
  league?: string
  date?: string
  page?: number
  pageSize?: number
  status?: string
  leagueId?: string
}

export interface AnalysisParams {
  matchId: number
  analysisType?: string
  includeHistory?: boolean
  includeStats?: boolean
}

export interface AnalysisResponse {
  success: boolean
  data: AnalysisData
  message?: string
}

export type AnalysisData = string


// API响应基础结构
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp?: number
}