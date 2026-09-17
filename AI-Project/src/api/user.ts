import apiClient from './index'
import type { CustomRequestConfig } from './index'

// 接口响应类型定义
export interface LoginRequest {
  phone: string
  code: string
}

export interface LoginResponse {
  token: string
  userInfo: UserInfo
}

// 后端 UserInfoDto 返回字段(Jackson 序列化 LocalDateTime 为 'YYYY-MM-DDTHH:mm:ss')
export interface UserInfo {
  id: string
  phone: string
  userName: string
  avatar?: string
  gender: number
  status: string
  createTime: string
  point?: number
  signToday?: boolean
  isAdmin?: boolean
  isVip?: boolean
  vipExpireTime?: string
  lastLoginTime?: string
  hasRenamed?: boolean
}

export interface UserListItem {
  id: string
  phone: string
  userName: string
  gender: number
  point: number
  createTime: string
  status: string
  signToday: boolean
  isAdmin: boolean
  isVip: boolean
  vipExpireTime: string
  lastLoginTime: string
}

export interface UserListResponse {
  data: UserListItem[]
  total: number
  pageNum: number
  pageSize: number
}

export interface SendSmsRequest {
  phone: string
}

export interface SendSmsResponse {
  success: boolean
  message: string
}

export interface LogoutResponse {
  success: boolean
  message: string
}

export const userApi = {
  // 发送验证码
  sendSms(data: SendSmsRequest, config?: CustomRequestConfig) {
    return apiClient.post<SendSmsResponse>('/api/sms/send', data, config)
  },

  // 登录
  login(data: LoginRequest, config?: CustomRequestConfig) {
    return apiClient.post<LoginResponse>('/api/user/login', data, config)
  },

  // 退出登录
  logout(config?: CustomRequestConfig) {
    return apiClient.post<LogoutResponse>('/api/user/logout', config)
  },

  // 获取用户信息(POST /api/user/info,body: { id: string })
  // 注意：后端 UserInfoDto 中 vipExpireTime / lastLoginTime 为 LocalDateTime,
  //       Jackson 默认序列化为 'YYYY-MM-DDTHH:mm:ss',前端 parseDateSafe 已兼容
  getUserInfo(data: { id: string }, config?: CustomRequestConfig) {
    return apiClient.post<UserInfo>('/api/user/info', data, config)
  },

  // 更新用户信息
  updateUserInfo(data: Partial<UserInfo>, config?: CustomRequestConfig) {
    return apiClient.post<UserInfo>('/api/user/update', data, config)
  },

  // 获取用户列表
  getUserList(data?: any, config?: CustomRequestConfig) {
    return apiClient.post('/api/user/list', data || {}, config) as Promise<UserListItem[]>
  },

  // 发放积分
  addPoint(data: { userId: string; point: number }, config?: CustomRequestConfig) {
    return apiClient.post('/api/user/point/add', data, config) as Promise<any>
  },

  // 开通会员
  openVip(data: { userId: string; vipType: number }, config?: CustomRequestConfig) {
    return apiClient.post('/api/vip/open', data, config) as Promise<any>
  },

  // 获取在线用户
  getOnlineUsers(config?: CustomRequestConfig) {
    return apiClient.get('/api/user/online', config) as Promise<Record<string, OnlineUser>>
  }
}

export interface OnlineUser {
  userId: string
  userName: string
  phone: string
  lastAccessTime: string
}