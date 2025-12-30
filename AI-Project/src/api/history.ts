import apiClient from './index'
import type { CustomRequestConfig } from './index'
import type { 
  HistoryRecord, 
  HistoryListParams, 
  HistoryListResponse,
  HistoryDetailResponse,
  MatchResultStats,
  AnalysisAccuracy 
} from '@/types/history'

export const historyApi = {
  // 获取历史记录列表
    getHistoryList(params?: HistoryListParams, config?: CustomRequestConfig) {
    return apiClient.post<HistoryListResponse>('/api/analysis/history/list', params, config)
  },
  
  // 获取历史记录详情
  getHistoryDetail(matchId: string, config?: CustomRequestConfig) {
    return apiClient.get<HistoryDetailResponse>(`/api/analysis/history/${matchId}`, config)
  },
  
  // 删除历史记录
  deleteHistory(id: string, config?: CustomRequestConfig) {
    return apiClient.delete(`/analysis/history/${id}`, config)
  },
  
  // 批量删除历史记录
  deleteBatchHistory(ids: string[], config?: CustomRequestConfig) {
    return apiClient.post('/analysis/history/batch-delete', { ids }, config)
  },
  
  // 搜索历史记录
  searchHistory(keyword: string, config?: CustomRequestConfig) {
    return apiClient.get<HistoryListResponse>('/analysis/history/search', {
      params: { keyword },
      ...config,
    })
  },
  
  // 获取统计信息
  getHistoryStats(params?: {
    startDate?: string
    endDate?: string
  }, config?: CustomRequestConfig) {
    return apiClient.get<MatchResultStats>('/analysis/history/stats', {
      params,
      ...config,
    })
  },
  
  // 获取分析准确度统计
  getAnalysisAccuracy(params?: {
    startDate?: string
    endDate?: string
  }, config?: CustomRequestConfig) {
    return apiClient.get<AnalysisAccuracy>('/analysis/history/accuracy', {
      params,
      ...config,
    })
  },
  
  // 导出历史记录
  exportHistory(params?: HistoryListParams, config?: CustomRequestConfig) {
    return apiClient.get('/analysis/history/export', {
      params,
      responseType: 'blob',
      ...config,
    })
  },
  
  // 创建新的历史记录
  createHistoryRecord(data: Partial<HistoryRecord>, config?: CustomRequestConfig) {
    return apiClient.post<HistoryRecord>('/analysis/history', data, config)
  },
  
  // 更新历史记录
  updateHistoryRecord(id: string, data: Partial<HistoryRecord>, config?: CustomRequestConfig) {
    return apiClient.put<HistoryRecord>(`/analysis/history/${id}`, data, config)
  },
  
  // 按比赛获取历史记录
  getHistoryByMatch(matchId: string, config?: CustomRequestConfig) {
    return apiClient.get<HistoryRecord[]>(`/analysis/history/match/${matchId}`, config)
  },
}