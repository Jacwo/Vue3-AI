import apiClient from './index'
import type { CustomRequestConfig } from './index'
import type {
  HistoryRecord,
  HistoryListParams,
  HistoryListResponse
} from '@/types/history'

export const historyApi = {
  // 获取历史记录列表
  getHistoryList(params?: HistoryListParams, config?: CustomRequestConfig) {
    return apiClient.post<HistoryListResponse>('/api/analysis/history/list', params, config)
  },

  // 获取历史记录详情
  getHistoryDetail(matchId: string, config?: CustomRequestConfig) {
    return apiClient.get<HistoryRecord>(`/api/analysis/history/${matchId}`, config)
  },
}