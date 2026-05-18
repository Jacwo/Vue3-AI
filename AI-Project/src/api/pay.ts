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

// 订单状态响应
export interface OrderStatusResponse {
  /** 商户订单号 */
  orderNo: string
  /** 微信支付订单号 */
  transactionId: string
  /** 订单状态：0-待支付 1-支付成功 2-支付失败 3-已关闭 4-已退款 */
  status: number
  /** 状态名称 */
  statusName: string
  /** 交易状态（微信返回） */
  tradeState: string
  /** 交易状态描述 */
  tradeStateDesc: string
  /** 是否支付成功 */
  paid: boolean
  /** 订单金额（分） */
  amount: number
  /** 支付成功时间 */
  payTime: string
}

export const payApi = {
  // 创建微信Native支付订单
  createWxNativeOrder(data: PayOrderRequest, config?: CustomRequestConfig) {
    return apiClient.post<any, PayOrderResponse>('/api/pay/wx/native/create', data, config)
  },
  // 查询订单状态
  getOrderStatus(orderNo: string, config?: CustomRequestConfig) {
    return apiClient.get<any, OrderStatusResponse>(`/api/pay/wx/order/${orderNo}/status`, config)
  }
}
