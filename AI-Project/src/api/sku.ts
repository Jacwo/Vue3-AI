import apiClient from './index'
import type { CustomRequestConfig } from './index'

// 商品状态枚举
export type SkuStatus = 0 | 1 // 0: 下架, 1: 上架

// 商品分类
export interface Category {
  id: string
  name: string
  parentId?: string
  level: number
}

// 商品数据类型
export interface Sku {
  id?: string
  skuCode: string
  skuName: string
  categoryId: string
  categoryName?: string
  price: number
  costPrice?: number
  stock: number
  status: SkuStatus
  description?: string
  images?: string[]
  specs?: Record<string, any>
  createTime?: string
  updateTime?: string
}

// 商品表单数据（提交表单用）
export interface SkuFormData {
  id?: string
  skuCode: string
  skuName: string
  categoryId: string
  price: number
  costPrice?: number
  stock: number
  status: SkuStatus
  description?: string
  images?: string[]
  specs?: Record<string, any>
}

// 商品列表查询参数
export interface SkuListQuery {
  pageNum?: number
  pageSize?: number
  status?: SkuStatus
  categoryId?: string
  skuName?: string
  skuCode?: string
}

// 商品列表响应
export interface SkuListResponse {
  data: Sku[]
  total: number
  pageNum: number
  pageSize: number
}

// 批量删除请求
export interface BatchDeleteRequest {
  ids: string[]
}

// 状态修改请求
export interface StatusChangeRequest {
  status: SkuStatus
}

// 库存操作请求
export interface StockOperationRequest {
  quantity: number
  remark?: string
}

export const skuApi = {
  // 分页查询商品列表（支持 status/category 筛选）
  getSkuList(query: SkuListQuery, config?: CustomRequestConfig) {
    return apiClient.get<SkuListResponse>('/api/sku/list', {
      ...config,
      params: query
    })
  },

  // 根据ID查询商品详情
  getSkuById(id: string, config?: CustomRequestConfig) {
    return apiClient.get<Sku>(`/api/sku/${id}`, config)
  },

  // 根据SKU编码查询
  getSkuByCode(skuCode: string, config?: CustomRequestConfig) {
    return apiClient.get<Sku>(`/api/sku/code/${skuCode}`, config)
  },

  // 新增商品
  createSku(data: SkuFormData, config?: CustomRequestConfig) {
    return apiClient.post<Sku>('/api/sku', data, config)
  },

  // 修改商品
  updateSku(id: string, data: SkuFormData, config?: CustomRequestConfig) {
    return apiClient.put<Sku>(`/api/sku/${id}`, data, config)
  },

  // 删除商品
  deleteSku(id: string, config?: CustomRequestConfig) {
    return apiClient.delete(`/api/sku/${id}`, config)
  },

  // 批量删除商品
  batchDeleteSku(data: BatchDeleteRequest, config?: CustomRequestConfig) {
    return apiClient.delete('/api/sku/batch', {
      ...config,
      data
    })
  },

  // 修改商品状态（上架/下架）
  updateSkuStatus(id: string, data: StatusChangeRequest, config?: CustomRequestConfig) {
    return apiClient.patch(`/api/sku/${id}/status`, data, config)
  },

  // 扣减库存
  deductStock(id: string, data: StockOperationRequest, config?: CustomRequestConfig) {
    return apiClient.patch(`/api/sku/${id}/stock/deduct`, data, config)
  },

  // 增加库存
  addStock(id: string, data: StockOperationRequest, config?: CustomRequestConfig) {
    return apiClient.patch(`/api/sku/${id}/stock/add`, data, config)
  }
}