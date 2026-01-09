<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'

const isMobileMenuOpen = ref(false)
const isMobile = ref(false)

const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) {
    isMobileMenuOpen.value = false
  }
}
const userStore = useUserStore()

onMounted(() => {
  userStore.initFromStorage()

  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// 退出登录
const handleLogout = async () => {
  await userStore.logout()
  closeMobileMenu()
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}
</script>

<template>
  <div class="app-container">
    <header>
      <div class="app-header">
        <div class="header-left">
          <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="60" height="60" />
          <div class="app-title">
            <h1>足球分析助手</h1>
            <p class="subtitle">专业的足球比赛分析与预测</p>
          </div>
        </div>
        
        <button 
          v-if="isMobile" 
          class="mobile-menu-btn"
          @click="toggleMobileMenu"
          :aria-expanded="isMobileMenuOpen"
          aria-label="导航菜单"
        >
          <span class="menu-icon" :class="{ 'open': isMobileMenuOpen }">
            <span class="menu-line"></span>
            <span class="menu-line"></span>
            <span class="menu-line"></span>
          </span>
        </button>
      </div>

      <div class="wrapper">
        <nav :class="{ 'mobile-open': isMobileMenuOpen }" v-show="!isMobile || isMobileMenuOpen">
          
          <RouterLink 
            to="/" 
            @click="closeMobileMenu"
            :class="{ 'mobile-link': isMobile }"
          >
            比赛列表
          </RouterLink>
          <RouterLink 
            to="/history" 
            @click="closeMobileMenu"
            :class="{ 'mobile-link': isMobile }"
          >
            历史记录
          </RouterLink>
          <RouterLink 
            to="/ai" 
            @click="closeMobileMenu"
            :class="{ 'mobile-link': isMobile }"
          >
            AI对话
          </RouterLink>
          <RouterLink 
            to="/tool" 
            @click="closeMobileMenu"
            :class="{ 'mobile-link': isMobile }"
          >
            小工具
          </RouterLink>
               <RouterLink 
            to="/profile" 
            @click="closeMobileMenu"
            :class="{ 'mobile-link': isMobile }"
          >
            个人中心
          </RouterLink>
        </nav>
      </div>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
/* 基础样式 */
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 0;
  position: sticky;
  top: 0;
  z-index: 1000;
}

/* 头部布局 */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  margin-bottom: 15px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.app-title {
  text-align: left;
}

.app-title h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: bold;
  line-height: 1.2;
}

.subtitle {
  margin: 5px 0 0;
  opacity: 0.9;
  font-size: 0.9rem;
}

.logo {
  display: block;
  filter: brightness(0) invert(1);
  flex-shrink: 0;
}

/* 移动端菜单按钮 */
.mobile-menu-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-icon {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 24px;
  height: 18px;
  position: relative;
  transition: all 0.3s ease;
}

.menu-line {
  display: block;
  width: 100%;
  height: 2px;
  background-color: white;
  border-radius: 1px;
  transition: all 0.3s ease;
}

.menu-icon.open .menu-line:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}

.menu-icon.open .menu-line:nth-child(2) {
  opacity: 0;
}

.menu-icon.open .menu-line:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}

/* 导航菜单 */
nav {
  display: flex;
  width: 100%;
  font-size: 1rem;
  text-align: center;
  padding: 0 20px;
}

nav a {
  display: inline-block;
  padding: 0.75rem 1.25rem;
  color: white;
  text-decoration: none;
  border-radius: 25px;
  margin: 0 8px;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  white-space: nowrap;
}

nav a:hover {
  background-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

nav a.router-link-exact-active {
  background-color: rgba(255, 255, 255, 0.25);
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 主要内容区域 */
main {
  flex: 1;
  width: 100%;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* 移动端特定样式 */
@media (max-width: 767px) {
  header {
    padding: 10px 0;
  }

  .app-header {
    padding: 0 15px;
    margin-bottom: 10px;
  }

  .app-title h1 {
    font-size: 1.4rem;
  }

  .subtitle {
    font-size: 0.8rem;
  }

  .logo {
    width: 50px;
    height: 50px;
  }

  .header-left {
    gap: 10px;
  }

  /* 移动端导航菜单 */
  nav {
    display: none;
    flex-direction: column;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 15px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 999;
  }

  nav.mobile-open {
    display: flex;
    animation: slideDown 0.3s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .mobile-link {
    display: block;
    width: 100%;
    margin: 8px 0 !important;
    padding: 14px 20px !important;
    text-align: left;
    border-radius: 12px !important;
    font-size: 1rem !important;
  }

  .mobile-link:hover {
    background-color: rgba(255, 255, 255, 0.2) !important;
  }

  .mobile-link.router-link-exact-active {
    background-color: rgba(255, 255, 255, 0.3) !important;
  }

  main {
    padding: 15px;
  }
}

/* 平板设备 */
@media (min-width: 768px) and (max-width: 1023px) {
  .app-header {
    padding: 0 30px;
  }

  .app-title h1 {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  nav {
    padding: 0 30px;
  }

  nav a {
    padding: 0.6rem 1.1rem;
    margin: 0 6px;
    font-size: 0.9rem;
  }

  main {
    padding: 25px 30px;
  }
}

/* 桌面设备 */
@media (min-width: 1024px) {
  header {
    padding: 1.5rem 2rem;
  }

  .app-header {
    padding: 0 2rem;
    justify-content: space-between;
  }

  .app-title h1 {
    font-size: 2.5rem;
  }

  .subtitle {
    font-size: 1.1rem;
  }

  .logo {
    width: 75px;
    height: 75px;
  }

  nav {
    text-align: left;
    padding: 0 2rem;
  }

  nav a {
    padding: 0.75rem 1.5rem;
    margin: 0 10px;
    font-size: 1rem;
  }

  .mobile-menu-btn {
    display: none;
  }
}

/* 超大屏幕 */
@media (min-width: 1400px) {
  .app-title h1 {
    font-size: 2.8rem;
  }

  .subtitle {
    font-size: 1.2rem;
  }

  nav a {
    padding: 0.85rem 1.75rem;
    margin: 0 12px;
    font-size: 1.05rem;
  }
}

/* 横屏模式优化 */
@media (max-height: 500px) and (orientation: landscape) {
  header {
    position: relative;
  }

  .app-header {
    margin-bottom: 5px;
  }

  .app-title h1 {
    font-size: 1.5rem;
  }

  nav a {
    padding: 0.5rem 1rem;
    margin: 0 5px;
  }
}
</style>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  nav a {
    padding: 0.85rem 1.25rem;
    min-height: 44px;
  }

  .mobile-link {
    min-height: 50px;
  }
}

/* 防止iOS缩放 */
input, select, textarea {
  font-size: 16px;
}
</style>