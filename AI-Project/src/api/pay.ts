import apiClient from './index'
import type { CustomRequestConfig } from './index'

// 支付订单请求参数
export interface PayOrderRequest {
  /** 商品SKU ID */
  skuId: number
  /** 订单金额（单位：分） */
  amount: number
  /** 附加数据 */
  attach?: string
  /** 用户ID */
  userId: string
}

// 支付订单响应
export interface PayOrderResponse {
  /** 商户订单号 */
  outTradeNo: string
  /** 二维码链接 */
  codeUrl: string
  /** 订单金额（单位：分） */
  amount: number
  /** 商品描述 */
  description: string
}

export const payApi = {
  // 创建微信Native支付订单
  createWxNativeOrder(data: PayOrderRequest, config?: CustomRequestConfig) {
    return apiClient.post<any, PayOrderResponse>('/api/pay/wx/native/create', data, config)
  }
}
