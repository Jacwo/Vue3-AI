import apiClient from './index'
import type { CustomRequestConfig } from './index'

// 专题类型枚举
export type TopicType = 'HOT_LEAGUE' | 'MAJOR_EVENT'

// 专题状态（0禁用、1启用）
export type TopicStatus = 0 | 1

// 专题数据类型
export interface Topic {
  id?: string
  topicName: string
  topicDesc: string
  imageUrl: string
  displaySort: number
  status: TopicStatus
  topicType: TopicType
  createTime?: string
  updateTime?: string
}

// 专题表单数据（提交表单用）
export interface TopicFormData {
  id?: string
  topicName: string
  topicDesc: string
  imageUrl: string
  displaySort: number
  status: TopicStatus
  topicType: TopicType
}

// 专题列表响应
export interface TopicListResponse {
  data: Topic[]
  total: number
}

// 批量添加热门比赛请求
export interface BatchAddHotMatchesRequest {
  matchIds: number[]
}

export const topicApi = {
  // 保存专题（新增/编辑）
  saveTopic(data: TopicFormData, config?: CustomRequestConfig) {
    return apiClient.post<Topic>('/api/admin/topic/save', data, config)
  },

  // 查询专题列表
  getTopicList(topicType: TopicType, config?: CustomRequestConfig) {
    return apiClient.post<TopicListResponse>(`/api/admin/topic/list/${topicType}`, {}, config)
  },

  // 批量添加热门比赛
  batchAddHotMatches(matchIds: number[], config?: CustomRequestConfig) {
    return apiClient.post<any>('/api/admin/topic/hot-match/batch-add', {
      matchIds
    }, config)
  }
}
