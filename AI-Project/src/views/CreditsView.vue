<template>
  <div class="credits-page">
    <!-- 顶部导航栏 -->
    <div class="top-nav">
      <button class="back-btn" @click="goBack">
        <svg viewBox="0 0 1024 1024" width="24" height="24">
          <path d="M671.968 912c-12.288 0-24.576-4.672-33.952-14.048L286.048 545.984c-18.752-18.72-18.752-49.12 0-67.872l351.968-352c18.752-18.752 49.12-18.752 67.872 0 18.752 18.72 18.752 49.12 0 67.872L387.872 512.032l318.016 318.016c18.752 18.752 18.752 49.12 0 67.872C696.544 907.328 684.256 912 671.968 912z" fill="currentColor"/>
        </svg>
      </button>
      <span class="nav-title">积分充值</span>
      <div class="nav-placeholder"></div>
    </div>

    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">
          <svg viewBox="0 0 1024 1024" width="48" height="48">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" fill="#FFD700"></path>
            <path d="M512 140c-205.4 0-372 166.6-372 372s166.6 372 372 372 372-166.6 372-372-166.6-372-372-372zm0 684c-172.3 0-312-139.7-312-312s139.7-312 312-312 312 139.7 312 312-139.7 312-312 312z" fill="#FFA500"></path>
            <path d="M512 364c-81.7 0-148 66.3-148 148s66.3 148 148 148 148-66.3 148-148-66.3-148-148-148zm0 236c-48.5 0-88-39.5-88-88s39.5-88 88-88 88 39.5 88 88-39.5 88-88 88z" fill="#FFD700"></path>
          </svg>
        </div>
        <h1 class="page-title">积分充值</h1>
        <p class="page-subtitle">解锁更多精彩功能，获取专业足球分析</p>
      </div>
    </div>

    <!-- 积分说明卡片 -->
    <div class="info-card">
      <div class="card-header">
        <svg viewBox="0 0 1024 1024" width="24" height="24">
          <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" fill="currentColor"></path>
          <path d="M464 336a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z" fill="currentColor"></path>
        </svg>
        <h3>积分说明</h3>
      </div>
      <div class="info-content">
        <div class="info-item">
          <span class="info-icon">✨</span>
          <span class="info-text">积分可用于解锁比赛分析、情报等高级功能</span>
        </div>
        <div class="info-item">
          <span class="info-icon">🎯</span>
          <span class="info-text">每次查看AI分析消耗1积分</span>
        </div>
        <div class="info-item">
          <span class="info-icon">💎</span>
          <span class="info-text">充值越多，单价越优惠</span>
        </div>
      </div>
    </div>

    <!-- 积分套餐 -->
    <div class="packages-section">
      <h2 class="section-title">选择套餐</h2>

      <div class="packages-grid">
        <!-- 基础套餐 -->
        <div class="package-card basic">
          <div class="package-badge">基础版</div>
          <div class="package-icon">
            <svg viewBox="0 0 1024 1024" width="48" height="48">
              <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z" fill="url(#gradient1)"></path>
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#4facfe;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#00f2fe;stop-opacity:1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div class="package-credits">
            <span class="credits-range">99</span>
            <span class="credits-label">积分</span>
          </div>
          <div class="package-price">
            <span class="price-symbol">¥</span>
            <span class="price-value">9.9</span>
          </div>
          <div class="package-features">
            <div class="feature-item">
              <svg viewBox="0 0 1024 1024" width="16" height="16">
                <path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474c-6.1-7.7-15.3-12.2-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1 0.4-12.8-6.3-12.8z" fill="#52c41a"></path>
              </svg>
              <span>查看99次AI分析</span>
            </div>
          </div>
          <div class="package-value">
            <span class="value-text">约 ¥0.10/次</span>
          </div>
        </div>

        <!-- 超值套餐（推荐） -->
        <div class="package-card premium recommended">
          <div class="recommend-tag">
            <svg viewBox="0 0 1024 1024" width="14" height="14">
              <path d="M908.1 353.1l-253.9-36.9L540.7 86.7c-3.1-6.3-8.2-11.4-14.5-14.5-15.8-7.8-35-1.3-42.9 14.5L369.8 316.2l-253.9 36.9c-7 1-13.4 4.3-18.3 9.3-12.3 12.7-12.1 32.9 0.6 45.3l183.7 179.1-43.4 252.9c-1.2 6.9-0.1 14.1 3.2 20.3 8.2 15.6 27.6 21.7 43.2 13.4L512 754l227.1 119.4c6.2 3.3 13.4 4.4 20.3 3.2 17.4-3 29.1-19.5 26.1-36.9l-43.4-252.9 183.7-179.1c5-4.9 8.3-11.3 9.3-18.3 2.7-17.5-9.5-33.7-27-36.3zM664.8 561.6l36.1 210.3L512 672.7 323.1 772l36.1-210.3-152.8-149L417.6 382 512 190.7 606.4 382l211.2 30.7-152.8 148.9z" fill="currentColor"></path>
            </svg>
            <span>推荐</span>
          </div>
          <div class="package-badge">超值版</div>
          <div class="package-icon">
            <svg viewBox="0 0 1024 1024" width="56" height="56">
              <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z" fill="url(#gradient2)"></path>
              <defs>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div class="package-credits">
            <span class="credits-range">999</span>
            <span class="credits-label">积分</span>
          </div>
          <div class="package-price">
            <span class="price-symbol">¥</span>
            <span class="price-value">59</span>
          </div>
          <div class="package-features">
            <div class="feature-item">
              <svg viewBox="0 0 1024 1024" width="16" height="16">
                <path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474c-6.1-7.7-15.3-12.2-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1 0.4-12.8-6.3-12.8z" fill="#52c41a"></path>
              </svg>
              <span>查看999次AI分析</span>
            </div>
            <div class="feature-item highlight">
              <svg viewBox="0 0 1024 1024" width="16" height="16">
                <path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474c-6.1-7.7-15.3-12.2-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1 0.4-12.8-6.3-12.8z" fill="#f5576c"></path>
              </svg>
              <span>专属客服支持</span>
            </div>
          </div>
          <div class="package-value">
            <span class="value-text">仅 ¥0.06/次</span>
            <span class="save-badge">省40%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 联系我 -->
    <div class="contact-section">
      <div class="contact-card">
        <div class="contact-header">
          <div class="contact-icon">
            <svg viewBox="0 0 1024 1024" width="32" height="32">
              <path d="M351.909 330.635c-23.273 0-42.775 19.502-42.775 42.775s19.502 42.775 42.775 42.775c23.273 0 42.775-19.502 42.775-42.775s-19.502-42.775-42.775-42.775zM583.588 330.635c-23.273 0-42.775 19.502-42.775 42.775s19.502 42.775 42.775 42.775c23.273 0 42.775-19.502 42.775-42.775s-19.502-42.775-42.775-42.775z" fill="#52C41A"></path>
              <path d="M935.384 573.288c0-154.83-154.83-279.945-340.078-279.945-190.149 0-344.979 125.115-344.979 279.945 0 154.83 154.83 279.945 344.979 279.945 40.001 0 77.227-6.701 112.003-17.853l104.851 53.576-29.401-96.75c70.526-53.576 152.625-124.264 152.625-218.918z m-429.304-39.151c-14.552 0-26.9-11.498-26.9-26.9s12.348-27.75 26.9-27.75c17.852 0 30.201 12.348 30.201 27.75-0.001 15.402-12.349 26.9-30.201 26.9z m190.149 0c-14.552 0-26.9-11.498-26.9-26.9s11.498-27.75 26.9-27.75c17.852 0 30.201 12.348 30.201 27.75s-12.349 26.9-30.201 26.9z" fill="#52C41A"></path>
              <path d="M351.909 303.735c26.049 0 49.322 11.498 65.626 29.351-78.927 26.9-140.278 75.527-177.504 137.728-5.801-2.55-11.498-3.401-17.852-3.401-26.9 0-48.471 21.571-48.471 48.471s21.571 48.471 48.471 48.471c26.9 0 48.471-21.571 48.471-48.471 0-3.401-0.85-6.801-1.7-10.201 29.351-66.476 98.75-128.678 198.049-153.1 30.201-7.651 61.375-11.498 93.399-11.498 20.721 0 40.851 1.7 60.131 4.251-21.571-110.653-123.414-192.751-247.679-192.751-139.428 0-252.629 96.75-252.629 215.518 0 65.626 35.776 124.264 92.55 162.34L139.907 635.49l72.227-38.301c22.421 7.651 46.545 12.348 70.526 17.852 5.801-17.852 13.453-35.776 24.951-51.221-109.801-25.2-187.599-100.451-187.599-188.449 0.001-112.003 107.252-204.249 231.897-204.249z" fill="#52C41A"></path>
            </svg>
          </div>
          <h2>联系我获取积分</h2>
        </div>
        <p class="contact-desc">添加微信好友，即时获取积分，享受专业服务</p>

        <div class="qrcode-container">
          <div class="qrcode-wrapper">
            <img :src="qrcodeUrl" alt="个人微信二维码" class="personal-qrcode" @error="handleQrcodeError" />
            <div class="qrcode-overlay">
              <p class="scan-text">扫码添加微信</p>
            </div>
          </div>
        </div>

        <div class="contact-tips">
          <div class="tip-item">
            <span class="tip-number">1</span>
            <span class="tip-text">扫描上方二维码添加微信</span>
          </div>
          <div class="tip-item">
            <span class="tip-number">2</span>
            <span class="tip-text">告知需要充值的积分档位</span>
          </div>
          <div class="tip-item">
            <span class="tip-number">3</span>
            <span class="tip-text">完成支付后立即到账</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部说明 -->
    <div class="footer-note">
      <p>💡 温馨提示：积分永久有效，不设使用期限</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const qrcodeUrl = ref('/me.png')

const goBack = () => {
  router.back()
}

const handleQrcodeError = (e: Event) => {
  const target = e.target as HTMLImageElement
  // 如果图片加载失败，显示占位图
  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7miornnoHlt6XkvZzlj7fvvIxtZS5qcGc8L3RleHQ+PC9zdmc+'
}
</script>

<style scoped>
.credits-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-bottom: 40px;
  padding-bottom: calc(40px + env(safe-area-inset-bottom));
}

/* 顶部导航栏 */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  padding-top: calc(12px + env(safe-area-inset-top));
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.back-btn:active {
  transform: scale(0.95);
}

.nav-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.nav-placeholder {
  width: 40px;
}

/* 页面头部 */
.page-header {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
  padding: 48px 20px 40px;
  text-align: center;
  color: white;
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.header-content {
  position: relative;
  z-index: 1;
}

.header-icon {
  margin-bottom: 20px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
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

/* 信息卡片 */
.info-card {
  margin: -20px 16px 24px;
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 2;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  color: #667eea;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.info-item:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.info-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.info-text {
  font-size: 15px;
  color: #333;
  line-height: 1.5;
}

/* 套餐区域 */
.packages-section {
  padding: 0 16px 32px;
}

.section-title {
  margin: 0 0 24px 0;
  font-size: 24px;
  font-weight: 600;
  color: white;
  text-align: center;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.packages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

/* 套餐卡片 */
.package-card {
  background: white;
  border-radius: 20px;
  padding: 32px 24px;
  text-align: center;
  position: relative;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.package-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
}

.package-card.premium::before {
  background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
}

.package-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
}

.package-card.recommended {
  border: 2px solid #f5576c;
  box-shadow: 0 15px 40px rgba(245, 87, 108, 0.3);
}

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

.package-badge {
  display: inline-block;
  padding: 6px 16px;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #1976d2;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 20px;
}

.package-card.premium .package-badge {
  background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%);
  color: #c2185b;
}

.package-icon {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.package-card.recommended .package-icon {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.package-credits {
  margin-bottom: 12px;
}

.credits-range {
  font-size: 48px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: block;
  line-height: 1.2;
}

.package-card.premium .credits-range {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.credits-label {
  font-size: 16px;
  color: #666;
  font-weight: 500;
}

.package-price {
  margin-bottom: 24px;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
}

.price-symbol {
  font-size: 24px;
  color: #f5576c;
  font-weight: 600;
  vertical-align: top;
}

.price-value {
  font-size: 42px;
  font-weight: 700;
  color: #f5576c;
}

.package-features {
  text-align: left;
  margin-bottom: 20px;
  padding: 20px;
  background: #fafafa;
  border-radius: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.feature-item.highlight {
  color: #f5576c;
  font-weight: 600;
}

.package-value {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.value-text {
  font-size: 14px;
  color: #666;
}

.save-badge {
  padding: 4px 12px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

/* 联系区域 */
.contact-section {
  padding: 0 16px 32px;
}

.contact-card {
  background: white;
  border-radius: 20px;
  padding: 32px 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.contact-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.contact-icon {
  animation: float 3s ease-in-out infinite;
}

.contact-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.contact-desc {
  text-align: center;
  color: #666;
  font-size: 15px;
  margin: 0 0 32px 0;
}

.qrcode-container {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}

.qrcode-wrapper {
  position: relative;
  width: 220px;
  height: 220px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(82, 196, 26, 0.2);
  transition: all 0.3s ease;
}

.qrcode-wrapper:hover {
  transform: scale(1.05);
  box-shadow: 0 16px 40px rgba(82, 196, 26, 0.3);
}

.personal-qrcode {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.qrcode-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(82, 196, 26, 0.95), transparent);
  padding: 12px;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.qrcode-wrapper:hover .qrcode-overlay {
  transform: translateY(0);
}

.scan-text {
  margin: 0;
  color: white;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

.contact-tips {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.tip-item:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.15);
}

.tip-number {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #52C41A 0%, #3da914 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
}

.tip-text {
  font-size: 15px;
  color: #333;
  line-height: 1.5;
}

/* 底部说明 */
.footer-note {
  text-align: center;
  padding: 24px 20px;
  color: white;
}

.footer-note p {
  margin: 8px 0;
  font-size: 14px;
  opacity: 0.9;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-title {
    font-size: 26px;
  }

  .packages-grid {
    grid-template-columns: 1fr;
  }

  .package-card {
    padding: 24px 18px;
  }

  .package-card:hover {
    transform: translateY(-5px);
  }

  .credits-range {
    font-size: 38px;
  }

  .price-value {
    font-size: 34px;
  }

  .qrcode-wrapper {
    width: 180px;
    height: 180px;
  }

  .info-card {
    margin: -20px 12px 20px;
    padding: 20px;
  }

  .packages-section {
    padding: 0 12px 24px;
  }

  .contact-section {
    padding: 0 12px 24px;
  }

  .contact-card {
    padding: 24px 18px;
  }
}

@media (max-width: 480px) {
  .top-nav {
    padding: 10px 12px;
    padding-top: calc(10px + env(safe-area-inset-top));
  }

  .back-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .nav-title {
    font-size: 16px;
  }

  .nav-placeholder {
    width: 36px;
  }

  .page-header {
    padding: 30px 16px 28px;
  }

  .header-icon svg {
    width: 40px;
    height: 40px;
  }

  .page-title {
    font-size: 22px;
  }

  .page-subtitle {
    font-size: 13px;
  }

  .section-title {
    font-size: 18px;
    margin-bottom: 16px;
  }

  .info-card {
    margin: -16px 10px 16px;
    padding: 16px;
    border-radius: 14px;
  }

  .card-header h3 {
    font-size: 16px;
  }

  .info-content {
    gap: 12px;
  }

  .info-item {
    padding: 10px;
    border-radius: 10px;
  }

  .info-icon {
    font-size: 20px;
  }

  .info-text {
    font-size: 13px;
  }

  .packages-section {
    padding: 0 10px 20px;
  }

  .package-card {
    padding: 20px 16px;
    border-radius: 16px;
  }

  .package-badge {
    padding: 5px 12px;
    font-size: 12px;
    margin-bottom: 16px;
  }

  .package-icon svg {
    width: 40px !important;
    height: 40px !important;
  }

  .package-card.premium .package-icon svg {
    width: 48px !important;
    height: 48px !important;
  }

  .credits-range {
    font-size: 32px;
  }

  .credits-label {
    font-size: 14px;
  }

  .package-price {
    padding: 12px;
    margin-bottom: 16px;
  }

  .price-symbol {
    font-size: 20px;
  }

  .price-value {
    font-size: 28px;
  }

  .package-features {
    padding: 14px;
    margin-bottom: 14px;
  }

  .feature-item {
    padding: 8px 0;
    font-size: 13px;
    gap: 8px;
  }

  .feature-item svg {
    width: 14px;
    height: 14px;
  }

  .package-value {
    padding-top: 12px;
    gap: 8px;
  }

  .value-text {
    font-size: 13px;
  }

  .save-badge {
    padding: 3px 10px;
    font-size: 11px;
  }

  .recommend-tag {
    top: 12px;
    right: -32px;
    padding: 3px 36px;
    font-size: 11px;
  }

  .contact-section {
    padding: 0 10px 20px;
  }

  .contact-card {
    padding: 20px 16px;
    border-radius: 16px;
  }

  .contact-header {
    gap: 10px;
    margin-bottom: 8px;
  }

  .contact-icon svg {
    width: 28px;
    height: 28px;
  }

  .contact-header h2 {
    font-size: 18px;
  }

  .contact-desc {
    font-size: 13px;
    margin-bottom: 24px;
  }

  .qrcode-container {
    margin-bottom: 24px;
  }

  .qrcode-wrapper {
    width: 160px;
    height: 160px;
    border-radius: 12px;
  }

  .contact-tips {
    gap: 12px;
  }

  .tip-item {
    padding: 12px;
    gap: 12px;
    border-radius: 10px;
  }

  .tip-number {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .tip-text {
    font-size: 13px;
  }

  .footer-note {
    padding: 20px 16px;
  }

  .footer-note p {
    font-size: 12px;
    margin: 6px 0;
  }
}

/* 超小屏幕 */
@media (max-width: 360px) {
  .page-title {
    font-size: 20px;
  }

  .credits-range {
    font-size: 28px;
  }

  .price-value {
    font-size: 24px;
  }

  .qrcode-wrapper {
    width: 140px;
    height: 140px;
  }

  .info-text,
  .feature-item,
  .tip-text {
    font-size: 12px;
  }
}

/* iOS 安全区域适配 */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .credits-page {
    padding-bottom: calc(40px + env(safe-area-inset-bottom));
  }
}
</style>
