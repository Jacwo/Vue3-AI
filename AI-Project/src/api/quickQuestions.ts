import apiClient from './index'
import type { CustomRequestConfig } from './index'

// 同步响应类型定义
export interface GuestResponse {
  questionName: string[]
  
}

export const guestApi = {
  // 同步比赛信息
  getGuestAsk(config?: CustomRequestConfig) {
    return apiClient.post<GuestResponse>('/api/ai/guest/ask', config)
  }
}