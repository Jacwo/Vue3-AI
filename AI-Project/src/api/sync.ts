import apiClient from './index'
import type { CustomRequestConfig } from './index'

// 同步响应类型定义
export interface SyncResponse {
  success: boolean
  message: string
  data?: any
  syncTime?: string
  totalCount?: number
  successCount?: number
}

export const syncApi = {
  // 同步比赛信息
  syncMatchData(config?: CustomRequestConfig) {
    return apiClient.get<SyncResponse>('/api/sync/match', config)
  },
  
  // 同步赔率信息
  syncHadListData(config?: CustomRequestConfig) {
    return apiClient.get<SyncResponse>('/api/sync/hadList', config)
  },
  
  // 同步同奖信息
  syncSimilarMatchData(config?: CustomRequestConfig) {
    return apiClient.get<SyncResponse>('/api/sync/similar/match', config)
  },
  
  // 同步历史交锋信息
  syncHistoryMatchData(config?: CustomRequestConfig) {
    return apiClient.get<SyncResponse>('/api/sync/history/match', config)
  },
  
  // 同步比赛结果信息
  syncMatchResultData(config?: CustomRequestConfig) {
    return apiClient.get<SyncResponse>('/api/sync/match/result', config)
  },
  
  // 赛后复盘分析
  afterMatchAnalysisData(config?: CustomRequestConfig) {
    return apiClient.get<SyncResponse>('/api/after/match/analysis', config)
  },
  
  // 批量同步所有数据
  syncAllData(config?: CustomRequestConfig) {
    return apiClient.get<SyncResponse>('/api/sync/all', config)
  },
  
  // 获取同步状态
  getSyncStatus(config?: CustomRequestConfig) {
    return apiClient.get<{
      lastSync: string
      nextSync: string
      isSyncing: boolean
      progress: number
    }>('/api/sync/status', config)
  },
  
  // 获取同步历史记录
  getSyncHistory(config?: CustomRequestConfig) {
    return apiClient.get<{
      total: number
      data: Array<{
        task: string
        status: string
        time: string
        message: string
      }>
    }>('/api/sync/history', config)
  }
}