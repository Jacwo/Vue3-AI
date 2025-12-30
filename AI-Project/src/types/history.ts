// 历史记录接口
export interface HistoryRecord {
  id: string
  matchId: string
  homeTeam: string
  awayTeam: string
  matchTime: string | Date
  homeWin: string | null
  draw: string | null
  awayWin: string | null
  aiAnalysis: string  // Markdown 格式
  matchResult: string // 例如 "2-1" 表示主队2:1客队
  afterMatchAnalysis: string  // Markdown 格式
  createTime: string | Date
}

// 历史记录列表参数
export interface HistoryListParams {
  pageNo?: number
  pageSize?: number
  startDate?: string
  endDate?: string
  teamName?: string
  matchResult?: string
  searchKeyword?: string
}

// 历史记录列表响应
export interface HistoryListResponse {
  list: HistoryRecord[]
  total: number
  page: number
  pageSize: number
}

// 历史记录详情响应
export interface HistoryDetailResponse {
  record: HistoryRecord
  matchInfo?: {
    league?: string
    matchStatusName?: string
    matchNumStr?: string
  }
}

// 比赛结果统计
export interface MatchResultStats {
  total: number
  homeWins: number
  draws: number
  awayWins: number
  winRate: number
  averageGoals: number
}

// 分析准确度统计
export interface AnalysisAccuracy {
  total: number
  correct: number
  accuracyRate: number
  avgConfidence: number
}