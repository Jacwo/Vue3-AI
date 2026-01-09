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

export interface UserInfo {
  id: string
  phone: string
  userName: string
  avatar: string
  gender: number
  status: string
  createTime: string
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
  
  // 获取用户信息
  getUserInfo(config?: CustomRequestConfig) {
    return apiClient.get<UserInfo>('/api/user/info', config)
  },
  
  // 更新用户信息
  updateUserInfo(data: Partial<UserInfo>, config?: CustomRequestConfig) {
    return apiClient.post<UserInfo>('/api/user/update', data, config)
  }
}