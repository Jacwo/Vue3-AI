import axios from 'axios'
import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

// 基础响应接口
export interface BaseResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp?: number
}

// 扩展配置接口
export interface CustomRequestConfig extends AxiosRequestConfig {
  showLoading?: boolean
  showError?: boolean
  retryCount?: number
  rawResponse?: boolean // 是否返回原始响应
}

// 创建axios实例
const apiClient = axios.create({
  baseURL: '/foot', // 使用代理后的路径
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const customConfig = config as InternalAxiosRequestConfig & CustomRequestConfig
    
    // 显示loading
    if (customConfig.showLoading !== false) {
      // showLoading()
    }
    
    // 添加token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加时间戳防止缓存
    if (config.method?.toLowerCase() === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      }
    }
    
    return config
  },
  (error) => {
    // hideLoading()
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse<BaseResponse>) => {
    // hideLoading()
    
    const customConfig = response.config as CustomRequestConfig
       // 如果是流式响应，直接返回整个 response 对象
    if (response.headers['content-type']?.includes('text/event-stream')) {
      return response
    }
    // 如果配置了返回原始响应，直接返回
    if (customConfig.rawResponse) {
      return response.data
    }
    
    const { code, data, message } = response.data
    
    // 根据后端数据结构调整，假设 code 0 表示成功
    if (code === 0) {
      return data
    } else {
      // 业务错误处理
      if (customConfig.showError !== false) {
        // showErrorMessage(message || '操作失败')
        console.error('API Business Error:', message)
      }
      return Promise.reject(new Error(message || '操作失败'))
    }
  },
  (error) => {
    // hideLoading()
    
    const customConfig = error.config as CustomRequestConfig
    
    // 重试逻辑
    if (error.code === 'ECONNABORTED' && !customConfig.retryCount) {
      const retryCount = customConfig.retryCount || 3
      if (retryCount > 0) {
        customConfig.retryCount = retryCount - 1
        return apiClient(customConfig)
      }
    }
    
    // 错误处理
    if (customConfig.showError !== false) {
      let errorMessage = '请求失败'
      
      if (error.response) {
        const responseData = error.response.data as BaseResponse
        
        // 优先使用后端返回的错误信息
        if (responseData && responseData.message) {
          errorMessage = responseData.message
        } else {
          switch (error.response.status) {
            case 400:
              errorMessage = '请求参数错误'
              break
            case 401:
              errorMessage = '登录已过期，请重新登录'
              localStorage.removeItem('token')
              sessionStorage.removeItem('token')
              window.location.href = '/login'
              break
            case 403:
              errorMessage = '没有权限访问'
              break
            case 404:
              errorMessage = '请求的资源不存在'
              break
            case 500:
              errorMessage = '服务器内部错误'
              break
            case 502:
              errorMessage = '网关错误'
              break
            case 503:
              errorMessage = '服务不可用'
              break
            case 504:
              errorMessage = '网关超时'
              break
            default:
              errorMessage = `请求错误: ${error.response.status}`
          }
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = '请求超时，请检查网络连接'
      } else if (error.message === 'Network Error') {
        errorMessage = '网络错误，请检查网络连接'
      }
      
      // showErrorMessage(errorMessage)
      console.error('API Error:', errorMessage)
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
export type { BaseResponse }