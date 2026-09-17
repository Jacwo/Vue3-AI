<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import defaultAvatar from '@/assets/logo.png'

const router = useRouter()
const userStore = useUserStore()

// 用户信息
const userInfo = ref<any>(null)

// 加载用户信息
const loadUserInfo = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=/profile')
    return
  }

  // 优先用本地缓存,渲染不阻塞
  let info = userStore.userInfo
  userInfo.value = info

  // 进入页面后主动拉一次完整用户信息(含 vipExpireTime/isVip 等字段)
  // - 防止 iOS Safari 因日期解析或登录响应不完整导致会员信息缺失
  // - 兼容 localStorage 缓存为旧版本字段不全的情况
  try {
    const ok = await userStore.fetchUserInfo()
    if (ok && userStore.userInfo) {
      userInfo.value = userStore.userInfo
    }
  } catch (e) {
    // 静默失败,本地缓存继续展示
    console.warn('获取最新用户信息失败,使用本地缓存:', e)
  }
}

// 退出登录
const handleLogout = async () => {
  await userStore.logout()
  router.push('/login')
}

// 跳转开通会员
const goVip = () => {
  router.push('/subscription')
}

// 格式化手机号中间四位为 *
const formatPhone = (phone: string) => {
  if (!phone || phone.length !== 11) return phone || '未设置'
  return phone.slice(0, 3) + '****' + phone.slice(7)
}

// 兼容 iOS Safari 的日期解析（iOS Safari 严格遵循 ISO 8601，不支持 'YYYY-MM-DD HH:mm:ss' 这种空格分隔的格式）
// 支持：ISO 字符串 / 时间戳(毫秒/秒) / 数字 / 'YYYY-MM-DD HH:mm:ss' / 'YYYY/MM/DD HH:mm:ss' / 中文格式等
const parseDateSafe = (input: string | number | null | undefined): Date | null => {
  if (input === null || input === undefined || input === '') return null

  // 数字时间戳
  if (typeof input === 'number') {
    const ts = input < 1e12 ? input * 1000 : input
    const d = new Date(ts)
    return isNaN(d.getTime()) ? null : d
  }

  const str = String(input).trim()
  if (!str) return null

  // 纯数字字符串(时间戳)
  if (/^\d+$/.test(str)) {
    const n = Number(str)
    const ts = n < 1e12 ? n * 1000 : n
    const d = new Date(ts)
    return isNaN(d.getTime()) ? null : d
  }

  // 1) 把斜杠和空格统一替换成短横线+T, 然后交给 Date
  const isoLike = str.replace(/\//g, '-').replace(' ', 'T')
  let d = new Date(isoLike)
  if (!isNaN(d.getTime())) return d

  // 2) 兜底: 手动解析常见 'YYYY-MM-DD HH:mm:ss' / 'YYYY-MM-DDTHH:mm:ss' 格式
  //    iOS Safari 严格模式下对某些写法仍会 NaN,手动构造可确保兼容
  const m = str.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/)
  if (m) {
    const parsed = new Date(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4] || 0),
      Number(m[5] || 0),
      Number(m[6] || 0)
    )
    if (!isNaN(parsed.getTime())) return parsed
  }

  // 3) 最后尝试原始字符串
  d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

// 格式化 VIP 到期时间
const formatVipExpire = (time: string) => {
  if (!time) return ''
  const d = parseDateSafe(time)
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// VIP 剩余天数
const vipDaysLeft = (time: string) => {
  if (!time) return 0
  const target = parseDateSafe(time)
  if (!target) return 0
  const now = Date.now()
  const diff = target.getTime() - now
  if (diff <= 0) return 0
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// 是否为有效 VIP（开启状态 + 未过期）
const isVipActive = (info: any) => {
  if (!info?.isVip) return false
  if (!info?.vipExpireTime) return false
  const t = parseDateSafe(info.vipExpireTime)
  if (!t) return false
  return t.getTime() > Date.now()
}

// 格式化注册时间(容错:iOS Safari + 各种后端格式)
const formatCreateTime = (time: string | undefined | null) => {
  if (!time) return '未知'
  const d = parseDateSafe(time)
  if (!d) return '未知'
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

onMounted(() => {
  loadUserInfo()
})
</script>

<template>
  <div class="profile-page">
    <!-- 顶部 Hero 区域 -->
    <div class="hero-card">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <div class="avatar-wrap">
          <div class="avatar-ring">
            <img :src="userInfo?.avatar || defaultAvatar" alt="头像" class="avatar-img" />
          </div>
          <div
            class="avatar-badge"
            :class="{ 'badge-admin': userInfo?.isAdmin, 'badge-vip': !userInfo?.isAdmin && isVipActive(userInfo) }"
            v-if="userInfo?.isAdmin || (!userInfo?.isAdmin && isVipActive(userInfo))"
          >
            <svg v-if="!userInfo?.isAdmin" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: -1px; margin-right: 2px;">
              <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 17l-6.3 4.4L8 14 2 9.4h7.6z"/>
            </svg>
            {{ userInfo?.isAdmin ? '管理员' : 'VIP会员' }}
          </div>
        </div>

        <div class="user-meta">
          <h2 class="user-name">{{ userInfo?.userName || '未设置' }}</h2>
          <p class="user-id">ID: {{ userInfo?.id || '未知' }}</p>
        </div>

        <!-- 积分卡片直接放在 hero 头部，让关键信息更醒目 -->
        <div class="points-card">
          <div class="points-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M6 3h12l3 6-9 12L3 9l3-6z" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>
              <path d="M3 9h18M9.5 3L6 9l3 12M14.5 3L18 9l-3 12" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="points-card-info">
            <span class="points-card-label">我的积分</span>
            <span class="points-card-value">
              <span class="points-num">{{ userInfo?.point ?? 0 }}</span>
              <span class="points-suffix">分</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- VIP / 会员状态卡片 -->
    <div
      class="vip-card"
      :class="{ 'vip-card-active': isVipActive(userInfo), 'vip-card-inactive': !isVipActive(userInfo) }"
    >
      <div class="vip-card-bg"></div>
      <div class="vip-card-content">
        <div class="vip-card-left">
          <div class="vip-card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 17l-6.3 4.4L8 14 2 9.4h7.6z"/>
            </svg>
          </div>
          <div class="vip-card-text">
            <div class="vip-card-title">
              <template v-if="isVipActive(userInfo)">
                <span class="vip-card-name">尊享 VIP 会员</span>
                <span class="vip-card-tag">已开通</span>
              </template>
              <template v-else>
                <span class="vip-card-name">暂未开通 VIP</span>
                <span class="vip-card-tag vip-card-tag-muted">未开通</span>
              </template>
            </div>
            <div class="vip-card-desc">
              <template v-if="isVipActive(userInfo)">
                到期时间 <span class="vip-card-highlight">{{ formatVipExpire(userInfo.vipExpireTime) }}</span>
                <span class="vip-card-days">剩余 {{ vipDaysLeft(userInfo.vipExpireTime) }} 天</span>
              </template>
              <template v-else>
                解锁更多专享功能 / 数据分析 / 比赛订阅
              </template>
            </div>
          </div>
        </div>
        <button class="vip-card-btn" @click="goVip">
          {{ isVipActive(userInfo) ? '续费会员' : '开通会员' }}
        </button>
      </div>
    </div>

    <!-- 基本信息 -->
    <div class="section-card">
      <div class="section-title">
        <span class="section-dot"></span>
        <span>基本信息</span>
      </div>

      <div class="info-list">
        <div class="info-row">
          <div class="info-left">
            <span class="info-icon icon-phone">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0122 16.92z" stroke="#667eea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="info-label">手机号</span>
          </div>
          <span class="info-value">{{ formatPhone(userInfo?.phone) }}</span>
        </div>

        <div class="info-row">
          <div class="info-left">
            <span class="info-icon icon-user">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="#667eea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="#667eea" stroke-width="2"/>
              </svg>
            </span>
            <span class="info-label">昵称</span>
          </div>
          <span class="info-value">{{ userInfo?.userName || '未设置' }}</span>
        </div>

        <div class="info-row">
          <div class="info-left">
            <span class="info-icon icon-time">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#667eea" stroke-width="2"/>
                <path d="M12 6v6l4 2" stroke="#667eea" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </span>
            <span class="info-label">注册时间</span>
          </div>
          <span class="info-value">{{ formatCreateTime(userInfo?.createTime) }}</span>
        </div>
      </div>
    </div>

    <!-- 退出按钮 -->
    <div class="logout-wrap">
      <button @click="handleLogout" class="logout-btn">退出登录</button>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 20px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ========== Hero 区域 ========== */
.hero-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 28px 24px;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.25);
  color: #fff;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.18) 0, transparent 40%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.14) 0, transparent 45%);
  pointer-events: none;
}

.hero-content {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 20px;
  align-items: center;
}

/* 头像 */
.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.avatar-ring {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.4));
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  border: 2px solid #fff;
}

.avatar-badge {
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  background: #f59e0b;
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  display: inline-flex;
  align-items: center;
}

.avatar-badge.badge-vip {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.35);
}

/* 用户信息 */
.user-meta {
  min-width: 0;
}

.user-name {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.user-id {
  margin: 0;
  font-size: 13px;
  opacity: 0.85;
}

/* 积分卡片（在 hero 内） */
.points-card {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.25);
  padding: 10px 14px;
  border-radius: 14px;
  backdrop-filter: blur(8px);
}

.points-card-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #fbbf24, #f97316);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(249, 115, 22, 0.4);
}

.points-card-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.points-card-label {
  font-size: 11px;
  opacity: 0.85;
}

.points-card-value {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  color: #fff;
}

.points-num {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.points-suffix {
  font-size: 12px;
  opacity: 0.9;
  margin-left: 2px;
}

/* ========== VIP 卡片 ========== */
.vip-card {
  position: relative;
  border-radius: 16px;
  padding: 20px 22px;
  overflow: hidden;
  color: #fff;
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.18);
}

.vip-card-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.vip-card-active {
  background: linear-gradient(120deg, #f59e0b 0%, #ef4444 50%, #db2777 100%);
}

.vip-card-active .vip-card-bg {
  background:
    radial-gradient(circle at 15% 20%, rgba(255, 255, 255, 0.25) 0, transparent 45%),
    radial-gradient(circle at 90% 80%, rgba(255, 255, 255, 0.18) 0, transparent 50%);
}

.vip-card-inactive {
  background: linear-gradient(120deg, #475569 0%, #334155 60%, #1e293b 100%);
  box-shadow: 0 8px 20px rgba(30, 41, 59, 0.18);
}

.vip-card-inactive .vip-card-bg {
  background:
    radial-gradient(circle at 90% 10%, rgba(255, 255, 255, 0.1) 0, transparent 40%);
}

.vip-card-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.vip-card-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.vip-card-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fde68a;
}

.vip-card-inactive .vip-card-icon {
  background: rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
}

.vip-card-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.vip-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.vip-card-name {
  font-size: 17px;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.vip-card-tag {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}

.vip-card-tag-muted {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.18);
  color: #e2e8f0;
}

.vip-card-desc {
  font-size: 13px;
  opacity: 0.92;
  line-height: 1.5;
}

.vip-card-highlight {
  font-weight: 700;
  color: #fff8e1;
  margin-left: 4px;
}

.vip-card-days {
  display: inline-block;
  margin-left: 10px;
  font-size: 11px;
  background: rgba(0, 0, 0, 0.18);
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}

.vip-card-btn {
  flex-shrink: 0;
  background: #fff;
  color: #b91c1c;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.vip-card-inactive .vip-card-btn {
  color: #1e293b;
  background: linear-gradient(135deg, #fde68a, #f59e0b);
  color: #7c2d12;
}

.vip-card-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
}

/* ========== 通用区段卡片 ========== */
.section-card {
  background: #fff;
  border-radius: 16px;
  padding: 22px 24px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 18px;
}

.section-dot {
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: linear-gradient(180deg, #667eea, #764ba2);
}

/* ========== 信息行 ========== */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #f8fafc;
  border-radius: 12px;
  transition: background 0.2s;
}

.info-row:hover {
  background: #f1f5f9;
}

.info-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(102, 126, 234, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-label {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

.info-value {
  color: #1f2937;
  font-size: 15px;
  font-weight: 600;
}

/* ========== 退出按钮 ========== */
.logout-wrap {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.logout-btn {
  padding: 12px 60px;
  background: #fff;
  color: #ef4444;
  border: 1px solid #fecaca;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.08);
}

.logout-btn:hover {
  background: #fef2f2;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.18);
}

/* ========== 响应式 ========== */
@media (max-width: 767px) {
  .profile-page {
    padding: 16px 14px 32px;
  }

  .hero-card {
    padding: 22px 18px;
  }

  .hero-content {
    grid-template-columns: auto 1fr;
    gap: 16px;
  }

  .points-card {
    grid-column: 1 / -1;
    justify-self: stretch;
  }

  .avatar-ring {
    width: 72px;
    height: 72px;
  }

  .user-name {
    font-size: 18px;
  }

  .points-num {
    font-size: 20px;
  }

  .section-card {
    padding: 18px 16px;
  }

  .info-row {
    padding: 12px 14px;
  }

  .vip-card {
    padding: 16px;
  }

  .vip-card-icon {
    width: 44px;
    height: 44px;
  }

  .vip-card-name {
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .hero-content {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .avatar-wrap {
    margin: 0 auto;
  }

  .user-meta {
    text-align: center;
  }

  .vip-card-content {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .vip-card-btn {
    width: 100%;
  }
}
</style>
