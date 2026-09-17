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

  let info = userStore.userInfo
  if (!info) {
    await userStore.fetchUserInfo()
    info = userStore.userInfo
  }

  userInfo.value = info
}

// 退出登录
const handleLogout = async () => {
  await userStore.logout()
  router.push('/login')
}

// 跳转到历史记录
const goHistory = () => {
  router.push('/history')
}

// 跳转到比赛数据
const goMatches = () => {
  router.push('/matches')
}

// 跳转到积分充值
const goCredits = () => {
  router.push('/credits')
}

// 格式化手机号中间四位为 *
const formatPhone = (phone: string) => {
  if (!phone || phone.length !== 11) return phone || '未设置'
  return phone.slice(0, 3) + '****' + phone.slice(7)
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
          <div class="avatar-badge" v-if="userInfo?.isAdmin">管理员</div>
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
          <button class="points-charge-btn" @click="goCredits">充值</button>
        </div>
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
          <span class="info-value">{{ userInfo?.createTime ? new Date(userInfo.createTime).toLocaleDateString() : '未知' }}</span>
        </div>
      </div>
    </div>

    <!-- 快捷功能 -->
    <div class="section-card">
      <div class="section-title">
        <span class="section-dot"></span>
        <span>快捷功能</span>
      </div>

      <div class="quick-grid">
        <div class="quick-item" @click="goHistory">
          <div class="quick-icon icon-grad-purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="quick-label">我的分析记录</span>
          <span class="quick-desc">历史比赛分析</span>
        </div>

        <div class="quick-item" @click="goMatches">
          <div class="quick-icon icon-grad-blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="#fff" stroke-width="2"/>
              <path d="M3 10h18M8 4v16" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="quick-label">比赛数据</span>
          <span class="quick-desc">查看实时比赛</span>
        </div>

        <div class="quick-item" @click="goCredits">
          <div class="quick-icon icon-grad-amber">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="quick-label">积分充值</span>
          <span class="quick-desc">获取更多积分</span>
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

.points-charge-btn {
  background: #fff;
  color: #764ba2;
  border: none;
  padding: 7px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.points-charge-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
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

/* ========== 快捷功能 ========== */
.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 14px;
  background: #f8fafc;
  border-radius: 14px;
  cursor: pointer;
  transition: transform 0.25s, box-shadow 0.25s, background 0.25s;
  text-align: center;
}

.quick-item:hover {
  transform: translateY(-3px);
  background: #fff;
  box-shadow: 0 10px 24px rgba(102, 126, 234, 0.15);
}

.quick-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.icon-grad-purple {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.icon-grad-blue {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.icon-grad-amber {
  background: linear-gradient(135deg, #fbbf24, #f97316);
}

.quick-label {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
}

.quick-desc {
  font-size: 12px;
  color: #94a3b8;
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

  .quick-grid {
    grid-template-columns: 1fr 1fr;
  }

  .quick-item:last-child {
    grid-column: 1 / -1;
  }

  .info-row {
    padding: 12px 14px;
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

  .quick-grid {
    grid-template-columns: 1fr;
  }

  .quick-item:last-child {
    grid-column: auto;
  }
}
</style>
