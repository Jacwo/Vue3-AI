import apiClient from './index'
import type { CustomRequestConfig } from './index'

// 商品状态：0-下架 1-上架 2-售罄
export type SkuStatus = 0 | 1 | 2

// 商品分类：1-VIP会员 2-道具 3-服务
export type SkuCategory = 1 | 2 | 3

// 商品数据类型（后端响应）
export interface Sku {
  id: number
  skuCode: string
  name: string
  description?: string
  category: SkuCategory
  categoryName?: string
  price: number
  priceYuan?: string
  originalPrice?: number
  originalPriceYuan?: string
  stock: number
  status: SkuStatus
  statusName?: string
  mainImage?: string
  validDays?: number
  sortOrder?: number
  limitPerUser?: number
  virtualFlag?: number
  createTime?: string
  updateTime?: string
}

// 新增商品请求参数
export interface SkuCreateData {
  skuCode: string
  name: string
  description?: string
  category: SkuCategory
  price: number
  originalPrice?: number
  stock?: number
  limitPerUser?: number
  mainImage?: string
  validDays?: number
  virtualFlag?: number
  status?: SkuStatus
  sortOrder?: number
}

// 修改商品请求参数
export interface SkuUpdateData {
  id: number
  name?: string
  description?: string
  category?: SkuCategory
  price?: number
  originalPrice?: number
  stock?: number
  limitPerUser?: number
  mainImage?: string
  validDays?: number
  virtualFlag?: number
  status?: SkuStatus
  sortOrder?: number
}

// 商品列表查询参数
export interface SkuListQuery {
  status?: SkuStatus
  category?: SkuCategory
}

export const skuApi = {
  // 查询商品列表
  getSkuList(query?: SkuListQuery, config?: CustomRequestConfig) {
    return apiClient.get('/api/sku/list', {
      ...config,
      params: query
    }) as Promise<Sku[]>
  },

  // 根据ID查询商品详情
  getSkuById(id: number, config?: CustomRequestConfig) {
    return apiClient.get(`/api/sku/${id}`, config) as Promise<Sku>
  },

  // 根据SKU编码查询
  getSkuByCode(skuCode: string, config?: CustomRequestConfig) {
    return apiClient.get(`/api/sku/code/${skuCode}`, config) as Promise<Sku>
  },

  // 新增商品
  createSku(data: SkuCreateData, config?: CustomRequestConfig) {
    return apiClient.post('/api/sku', data, config) as Promise<Sku>
  },

  // 修改商品
  updateSku(data: SkuUpdateData, config?: CustomRequestConfig) {
    return apiClient.put('/api/sku', data, config) as Promise<Sku>
  },

  // 删除商品
  deleteSku(id: number, config?: CustomRequestConfig) {
    return apiClient.delete(`/api/sku/${id}`, config) as Promise<any>
  },

  // 批量删除商品
  batchDeleteSku(ids: number[], config?: CustomRequestConfig) {
    return apiClient.delete('/api/sku/batch', {
      ...config,
      data: ids
    }) as Promise<any>
  }
}
