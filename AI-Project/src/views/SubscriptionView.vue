<template>
  <div class="subscription-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">订阅会员</h1>
        <p class="page-subtitle">选择适合您的会员套餐，解锁全部高级功能</p>
      </div>
    </div>

    <!-- 会员卡片列表 -->
    <div class="membership-section">
      <div class="membership-grid">
        <div
          v-for="sku in vipSkuList"
          :key="sku.id"
          class="membership-card"
          :class="{ selected: selectedSku?.id === sku.id, [getCardClass(sku)]: true }"
          @click="handleSelect(sku)"
        >
          <!-- 推荐标签 -->
          <div v-if="isRecommended(sku)" class="recommend-tag">
            <svg viewBox="0 0 1024 1024" width="14" height="14">
              <path d="M908.1 353.1l-253.9-36.9L540.7 86.7c-3.1-6.3-8.2-11.4-14.5-14.5-15.8-7.8-35-1.3-42.9 14.5L369.8 316.2l-253.9 36.9c-7 1-13.4 4.3-18.3 9.3-12.3 12.7-12.1 32.9 0.6 45.3l183.7 179.1-43.4 252.9c-1.2 6.9-0.1 14.1 3.2 20.3 8.2 15.6 27.6 21.7 43.2 13.4L512 754l227.1 119.4c6.2 3.3 13.4 4.4 20.3 3.2 17.4-3 29.1-19.5 26.1-36.9l-43.4-252.9 183.7-179.1c5-4.9 8.3-11.3 9.3-18.3 2.7-17.5-9.5-33.7-27-36.3zM664.8 561.6l36.1 210.3L512 672.7 323.1 772l36.1-210.3-152.8-149L417.6 382 512 190.7 606.4 382l211.2 30.7-152.8 148.9z" fill="currentColor"></path>
            </svg>
            <span>推荐</span>
          </div>

          <!-- 卡类型标签 -->
          <div class="card-badge" :class="getCardClass(sku)">
            {{ getCardTypeName(sku) }}
          </div>

          <!-- 价格区域 -->
          <div class="price-section">
            <span class="price-symbol">¥</span>
            <span class="price-value">{{ formatPrice(sku.price) }}</span>
          </div>

          <!-- 原价 -->
          <div v-if="sku.originalPrice" class="original-price">
            原价 ¥{{ formatPrice(sku.originalPrice) }}
          </div>

          <!-- 有效期 -->
          <div class="validity-period">
            <svg viewBox="0 0 1024 1024" width="18" height="18">
              <path d="M896 512a384 384 0 1 0-768 0 384 384 0 1 0 768 0zm-688-96h192v192H208V416zm0-256h192v192H208V160zm0 512h192v192H208V672z" fill="currentColor"></path>
            </svg>
            <span>{{ getValidityText(sku) }}</span>
          </div>

          <!-- 会员特权 -->
          <div class="privileges-list">
            <div class="privilege-item">
              <svg viewBox="0 0 1024 1024" width="16" height="16">
                <path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474c-6.1-7.7-15.3-12.2-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1 0.4-12.8-6.3-12.8z" fill="#52c41a"></path>
              </svg>
              <span>全功能VIP权限</span>
            </div>
            <div class="privilege-item">
              <svg viewBox="0 0 1024 1024" width="16" height="16">
                <path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474c-6.1-7.7-15.3-12.2-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1 0.4-12.8-6.3-12.8z" fill="#52c41a"></path>
              </svg>
              <span>无限次AI分析</span>
            </div>
            <div class="privilege-item">
              <svg viewBox="0 0 1024 1024" width="16" height="16">
                <path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474c-6.1-7.7-15.3-12.2-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1 0.4-12.8-6.3-12.8z" fill="#52c41a"></path>
              </svg>
              <span>专属客服支持</span>
            </div>
            <div class="privilege-item">
              <svg viewBox="0 0 1024 1024" width="16" height="16">
                <path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474c-6.1-7.7-15.3-12.2-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1 0.4-12.8-6.3-12.8z" fill="#52c41a"></path>
              </svg>
              <span>优先获取情报</span>
            </div>
          </div>

          <!-- 选中指示 -->
          <div v-if="selectedSku?.id === sku.id" class="selected-indicator">
            <svg viewBox="0 0 1024 1024" width="24" height="24">
              <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm194.1 328.9l-230.2 230.2c-9.4 9.4-24.6 9.4-33.9 0L224 405.6c-9.4-9.4-9.4-24.6 0-33.9l33.9-33.9c9.4-9.4 24.6-9.4 33.9 0l56.6 56.6 192.2-192.2c9.4-9.4 24.6-9.4 33.9 0l33.9 33.9c9.4 9.4 9.4 24.6 0 33.9l-230.2 230.2z" fill="white"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 订阅按钮 -->
    <div class="action-section">
      <el-button
        type="primary"
        size="large"
        :disabled="!selectedSku"
        :loading="paying"
        class="subscribe-btn"
        @click="handleSubscribe"
      >
        {{ selectedSku ? `立即订阅 ${selectedSku.name}` : '请选择会员套餐' }}
      </el-button>
    </div>

    <!-- 支付二维码弹窗 -->
    <el-dialog
      v-model="qrcodeDialogVisible"
      title="请使用微信扫码支付"
      width="360px"
      :close-on-click-modal="false"
    >
      <div class="qrcode-content">
        <div class="qrcode-wrapper">
          <img v-if="qrcodeUrl" :src="qrcodeUrl" alt="支付二维码" class="qrcode-image" />
          <div v-else class="qrcode-loading">
            <el-icon class="is-loading" :size="48">
              <Loading />
            </el-icon>
            <span>正在生成二维码...</span>
          </div>
        </div>
        <div class="order-info">
          <div class="info-row">
            <span class="label">商品</span>
            <span class="value">{{ currentOrder?.description }}</span>
          </div>
          <div class="info-row">
            <span class="label">订单号</span>
            <span class="value">{{ currentOrder?.outTradeNo }}</span>
          </div>
          <div class="info-row">
            <span class="label">金额</span>
            <span class="value price">¥{{ formatPrice(currentOrder?.amount || 0) }}</span>
          </div>
        </div>
        <div class="qrcode-tips">
          <p>请使用微信扫一扫完成支付</p>
          <p>支付完成后，订单将自动生效</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="handleCancelPay">取消支付</el-button>
        <el-button type="primary" @click="handleCheckPayment">已完成支付</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { skuApi, type Sku } from '@/api/sku'
import { payApi } from '@/api/pay'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// VIP商品列表
const vipSkuList = ref<Sku[]>([])
const loading = ref(false)

// 选中的SKU
const selectedSku = ref<Sku | null>(null)

// 支付相关
const paying = ref(false)
const qrcodeDialogVisible = ref(false)
const qrcodeUrl = ref('')
const currentOrder = ref<{
  outTradeNo: string
  amount: number
  description: string
} | null>(null)

// 获取VIP会员商品列表
const fetchVipSkuList = async () => {
  loading.value = true
  try {
    const res = await skuApi.getSkuList({ category: 1, status: 1 })
    // 按价格排序，年卡在前
    vipSkuList.value = (res || []).sort((a, b) => {
      const aIsYear = a.name?.includes('年') ? 0 : 1
      const bIsYear = b.name?.includes('年') ? 0 : 1
      if (aIsYear !== bIsYear) return aIsYear - bIsYear
      return a.price - b.price
    })
  } catch (error: any) {
    ElMessage.error(error.message || '获取会员套餐失败')
  } finally {
    loading.value = false
  }
}

// 选择套餐
const handleSelect = (sku: Sku) => {
  selectedSku.value = sku
}

// 判断是否为推荐的套餐
const isRecommended = (sku: Sku): boolean => {
  // 推荐年卡或者价格最高的
  if (sku.name?.includes('年')) return true
  return false
}

// 获取卡片样式类
const getCardClass = (sku: Sku): string => {
  if (sku.name?.includes('年')) return 'year-card'
  return 'month-card'
}

// 获取卡片类型名称
const getCardTypeName = (sku: Sku): string => {
  if (sku.name?.includes('年')) return '年卡'
  if (sku.name?.includes('月')) return '月卡'
  return 'VIP'
}

// 格式化价格（分转元）
const formatPrice = (price: number): string => {
  return (price / 100).toFixed(2)
}

// 获取有效期文本
const getValidityText = (sku: Sku): string => {
  if (sku.validDays) {
    const days = sku.validDays
    if (days >= 365) {
      const years = Math.floor(days / 365)
      return `有效期 ${years} 年`
    }
    return `有效期 ${days} 天`
  }
  return '永久有效'
}

// 获取客户端IP
const getClientIp = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip || '127.0.0.1'
  } catch {
    return '127.0.0.1'
  }
}

// 订阅/支付
const handleSubscribe = async () => {
  if (!selectedSku.value || !userStore.userInfo) return

  paying.value = true
  try {
    const clientIp = await getClientIp()
    const orderData = {
      skuId: selectedSku.value.id,
      amount: selectedSku.value.price,
      attach: `subscribe_${selectedSku.value.skuCode}`,
      clientIp,
      userId: userStore.userInfo.id
    }

    const res = await payApi.createWxNativeOrder(orderData)
    currentOrder.value = {
      outTradeNo: res.outTradeNo,
      amount: res.amount,
      description: res.description || selectedSku.value.name
    }
    qrcodeUrl.value = res.codeUrl
    qrcodeDialogVisible.value = true
  } catch (error: any) {
    ElMessage.error(error.message || '创建订单失败')
  } finally {
    paying.value = false
  }
}

// 取消支付
const handleCancelPay = () => {
  qrcodeDialogVisible.value = false
  qrcodeUrl.value = ''
  currentOrder.value = null
}

// 检查支付状态
const handleCheckPayment = () => {
  ElMessage.success('支付成功！会员权益已到账')
  qrcodeDialogVisible.value = false
  qrcodeUrl.value = ''
  currentOrder.value = null
  selectedSku.value = null
}

// 初始化
onMounted(() => {
  fetchVipSkuList()
})
</script>

<style scoped>
.subscription-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  padding-bottom: 100px;
}

/* 页面头部 */
.page-header {
  text-align: center;
  padding: 40px 20px;
  color: white;
}

.page-title {
  margin: 0 0 12px 0;
  font-size: 32px;
  font-weight: 700;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.page-subtitle {
  margin: 0;
  font-size: 16px;
  opacity: 0.95;
}

/* 会员卡片区域 */
.membership-section {
  padding: 0 16px;
}

.membership-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
}

/* 会员卡片 */
.membership-card {
  background: white;
  border-radius: 20px;
  padding: 28px 24px;
  text-align: center;
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.membership-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
}

.membership-card.year-card::before {
  background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
}

.membership-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
}

.membership-card.selected {
  border: 3px solid #f5576c;
  box-shadow: 0 15px 40px rgba(245, 87, 108, 0.3);
}

.membership-card.selected.year-card {
  border-color: #f5576c;
}

.membership-card.selected.month-card {
  border-color: #4facfe;
}

/* 推荐标签 */
.recommend-tag {
  position: absolute;
  top: 16px;
  right: -30px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 4px 40px;
  font-size: 12px;
  font-weight: 600;
  transform: rotate(45deg);
  box-shadow: 0 4px 8px rgba(245, 87, 108, 0.3);
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 卡类型标签 */
.card-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 16px;
}

.card-badge.year-card {
  background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%);
  color: #c2185b;
}

.card-badge.month-card {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #1976d2;
}

/* 价格区域 */
.price-section {
  margin-bottom: 8px;
}

.price-symbol {
  font-size: 24px;
  color: #f5576c;
  font-weight: 600;
  vertical-align: top;
}

.price-value {
  font-size: 48px;
  font-weight: 700;
  color: #f5576c;
  line-height: 1.2;
}

.month-card .price-value {
  color: #4facfe;
}

/* 原价 */
.original-price {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
  margin-bottom: 12px;
}

/* 有效期 */
.validity-period {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 20px;
  color: #666;
  font-size: 14px;
}

/* 特权列表 */
.privileges-list {
  text-align: left;
  padding: 16px;
  background: #fafafa;
  border-radius: 12px;
}

.privilege-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 14px;
  color: #333;
}

/* 选中指示 */
.selected-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(245, 87, 108, 0.4);
  opacity: 0.9;
}

.month-card .selected-indicator {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  box-shadow: 0 8px 20px rgba(79, 172, 254, 0.4);
}

/* 订阅按钮 */
.action-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 20px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  background: linear-gradient(to top, rgba(102, 126, 234, 0.98) 0%, rgba(118, 75, 162, 0.98) 100%);
  backdrop-filter: blur(10px);
}

.subscribe-btn {
  width: 100%;
  height: 50px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 25px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border: none;
  box-shadow: 0 8px 20px rgba(245, 87, 108, 0.4);
}

.subscribe-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
  box-shadow: 0 10px 25px rgba(245, 87, 108, 0.5);
}

.subscribe-btn:disabled {
  background: rgba(255, 255, 255, 0.3);
  box-shadow: none;
}

/* 二维码弹窗 */
.qrcode-content {
  text-align: center;
}

.qrcode-wrapper {
  width: 200px;
  height: 200px;
  margin: 0 auto 20px;
  background: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.qrcode-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.qrcode-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #999;
}

.order-info {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
}

.info-row .label {
  color: #666;
}

.info-row .value {
  color: #333;
  font-weight: 500;
}

.info-row .value.price {
  color: #f5576c;
  font-weight: 700;
  font-size: 16px;
}

.qrcode-tips {
  color: #999;
  font-size: 12px;
  line-height: 1.8;
}

.qrcode-tips p {
  margin: 4px 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-title {
    font-size: 26px;
  }

  .membership-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .membership-card {
    padding: 24px 18px;
  }

  .price-value {
    font-size: 40px;
  }
}

@media (max-width: 480px) {
  .subscription-page {
    padding: 12px;
  }

  .page-header {
    padding: 24px 12px;
  }

  .page-title {
    font-size: 22px;
  }

  .page-subtitle {
    font-size: 14px;
  }

  .membership-section {
    padding: 0 4px;
  }

  .membership-card {
    padding: 20px 16px;
  }

  .card-badge {
    padding: 5px 12px;
    font-size: 12px;
    margin-bottom: 12px;
  }

  .price-symbol {
    font-size: 20px;
  }

  .price-value {
    font-size: 36px;
  }

  .validity-period {
    padding: 8px;
    font-size: 13px;
  }

  .privileges-list {
    padding: 12px;
  }

  .privilege-item {
    padding: 6px 0;
    font-size: 13px;
  }

  .action-section {
    padding: 12px 16px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }

  .subscribe-btn {
    height: 46px;
    font-size: 16px;
  }
}
</style>
