<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { isMobile } from '@/utils/device'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 表单数据
const loginForm = ref({
  phone: '',
  code: ''
})

// 验证规则
const rules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { pattern: /^\d{4}$/, message: '验证码为4位数字', trigger: 'blur' }
  ]
}

// 验证码相关
const isSending = ref(false)
const countdown = ref(0)
const countdownInterval = ref<number | null>(null)

// 移动端检测
const mobileMode = ref(isMobile())

// 监听窗口变化
const handleResize = () => {
  mobileMode.value = isMobile()
}

// 发送验证码
const sendCode = async () => {
  try {
    // 验证手机号
    if (!loginForm.value.phone || !/^1[3-9]\d{9}$/.test(loginForm.value.phone)) {
      showMessage('error', '请输入正确的手机号')
      return
    }

    isSending.value = true
    const success = await userStore.sendSms(loginForm.value.phone)
    
    if (success) {
      showMessage('success', '验证码发送成功')
      // 开始倒计时
      countdown.value = 60
      countdownInterval.value = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0 && countdownInterval.value) {
          clearInterval(countdownInterval.value)
          countdownInterval.value = null
        }
      }, 1000)
    }
  } catch (error: any) {
    console.log(error.message)
    showMessage('error', error.message || '发送验证码失败')
  } finally {
    isSending.value = false
  }
}

// 登录
const handleLogin = async () => {
  try {
    const success = await userStore.login(loginForm.value.phone, loginForm.value.code)
    if (success) {
      showMessage('success', '登录成功')
      // 跳转到目标页面或首页
      const redirect = route.query.redirect as string || '/profile'
      router.push(redirect)
    }
  } catch (error: any) {
    showMessage('error', error.message || '登录失败')
  }
}

// 键盘事件处理
const handleKeyPress = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    // 如果验证码框为空，发送验证码
    if (!loginForm.value.code && loginForm.value.phone) {
      sendCode()
    } else if (loginForm.value.phone && loginForm.value.code) {
      handleLogin()
    }
  }
}

// 输入框聚焦优化
const focusInput = (field: 'phone' | 'code') => {
  const input = document.getElementById(field)
  if (input && mobileMode.value) {
    // 移动端延迟聚焦，避免键盘弹出问题
    setTimeout(() => {
      input.focus()
    }, 100)
  }
}

// 清理倒计时
const clearCountdown = () => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
    countdownInterval.value = null
  }
}

// 防止iOS缩放
const preventZoom = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (mobileMode.value && target.tagName === 'INPUT') {
    target.style.fontSize = '16px' // 防止iOS缩放
  }
}

// 监听表单变化
watch(() => loginForm.value.phone, (newVal) => {
  // 自动格式化手机号（增加空格）
  if (mobileMode.value && newVal.length === 11 && !newVal.includes(' ')) {
   // loginForm.value.phone = newVal.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3')
  }
})

// 自定义消息提示函数 - 使用强化的样式
const showMessage = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
  // 先清除所有现有的消息，防止重叠
  const existingMessages = document.querySelectorAll('.el-message')
  existingMessages.forEach(msg => {
    if (msg.parentNode) {
      msg.parentNode.removeChild(msg)
    }
  })
  
  // 创建一个自定义容器来放置消息
  const messageContainer = document.createElement('div')
  messageContainer.className = 'login-message-container'
  
  // 使用原生样式创建消息框，避免Element Plus样式冲突
  const messageElement = document.createElement('div')
  messageElement.className = `login-message login-message-${type}`
  
  // 添加图标
  const icon = document.createElement('span')
  icon.className = 'login-message-icon'
  
  // 根据类型设置图标
  switch(type) {
    case 'success':
      icon.innerHTML = '✓'
      break
    case 'error':
      icon.innerHTML = '✕'
      break
    case 'warning':
      icon.innerHTML = '!'
      break
    case 'info':
      icon.innerHTML = 'i'
      break
  }
  
  const text = document.createElement('span')
  text.className = 'login-message-text'
  text.textContent = message
  
  messageElement.appendChild(icon)
  messageElement.appendChild(text)
  messageContainer.appendChild(messageElement)
  
  // 添加到body
  document.body.appendChild(messageContainer)
  
  // 显示动画
  setTimeout(() => {
    messageElement.style.opacity = '1'
    messageElement.style.transform = 'translate(-50%, 0)'
  }, 10)
  
  // 3秒后自动移除
  setTimeout(() => {
    messageElement.style.opacity = '0'
    messageElement.style.transform = 'translate(-50%, -20px)'
    setTimeout(() => {
      if (messageContainer.parentNode) {
        document.body.removeChild(messageContainer)
      }
    }, 300)
  }, 3000)
}

// 清理
onMounted(() => {
  // 如果已登录，跳转到个人中心
  if (userStore.isLoggedIn) {
    router.push('/profile')
  }
  
  // 添加事件监听
  window.addEventListener('resize', handleResize)
  document.addEventListener('touchstart', preventZoom, { passive: true })
  
  // 初始检测
  handleResize()
  
  // 自动聚焦手机号输入框（移动端延迟）
  if (!mobileMode.value) {
    const phoneInput = document.getElementById('phone')
    phoneInput?.focus()
  } else {
    setTimeout(() => {
      const phoneInput = document.getElementById('phone')
      phoneInput?.focus()
    }, 300)
  }
})

// 清理计时器
import { onUnmounted } from 'vue'
onUnmounted(() => {
  clearCountdown()
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('touchstart', preventZoom)
})
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>手机验证码登录</h2>
        <p>欢迎使用足球分析助手</p>
      </div>

      <div class="login-form">
        <div class="form-group">
          <label for="phone">手机号</label>
          <input
            id="phone"
            v-model="loginForm.phone"
            type="tel"
            inputmode="numeric"
            pattern="[0-9]*"
            placeholder="请输入手机号"
            maxlength="13"
            class="form-input"
            @focus="focusInput('phone')"
            @keypress="handleKeyPress"
            autocapitalize="off"
            autocomplete="tel"
          />
        </div>

        <div class="form-group">
          <label for="code">验证码</label>
          <div class="code-input-group">
            <input
              id="code"
              v-model="loginForm.code"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              placeholder="请输入4位验证码"
              maxlength="4"
              class="form-input code-input"
              @focus="focusInput('code')"
              @keypress="handleKeyPress"
              autocapitalize="off"
              autocomplete="one-time-code"
            />
            <button
              :disabled="isSending || countdown > 0"
              @click="sendCode"
              @touchstart.prevent="sendCode"
              class="send-code-btn"
              :class="{ 
                'disabled': isSending || countdown > 0,
                'mobile': mobileMode
              }"
            >
              <span v-if="isSending" class="btn-text">发送中</span>
              <span v-else-if="countdown > 0" class="btn-text">{{ countdown }}s</span>
              <span v-else class="btn-text">获取验证码</span>
            </button>
          </div>
        </div>

        <button
          @click="handleLogin"
          @touchstart.prevent="handleLogin"
          :disabled="!loginForm.phone || !loginForm.code"
          class="login-btn"
          :class="{ 
            'disabled': !loginForm.phone || !loginForm.code,
            'mobile': mobileMode
          }"
        >
          登录
        </button>

        <div class="login-footer">
          <p>登录即表示您同意我们的
            <a href="#" class="link">服务协议</a>
            和
            <a href="#" class="link">隐私政策</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  min-height: 100dvh; /* 动态视口高度，考虑移动端浏览器UI */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  -webkit-tap-highlight-color: transparent; /* 移除移动端点击高亮 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  position: relative;
  z-index: 1;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 20px;
  padding: 32px 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  animation: slideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-sizing: border-box;
  position: relative;
  z-index: 2;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h2 {
  color: #1a1a1a;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.3;
}

.login-header p {
  color: #666;
  font-size: 15px;
  line-height: 1.4;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 10px;
  color: #333;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.2;
}

.form-input {
  width: 100%;
  height: 56px;
  padding: 0 18px;
  border: 1.5px solid #e1e5e9;
  border-radius: 12px;
  font-size: 17px;
  transition: all 0.25s ease;
  background: #f8f9fa;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.form-input:focus {
  border-color: #667eea;
  background: white;
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
  transform: translateY(-1px);
}

.form-input::placeholder {
  color: #999;
  font-size: 16px;
}

.code-input-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.code-input {
  flex: 1;
  min-width: 0; /* 防止flex溢出 */
}

.send-code-btn {
  min-width: 112px;
  height: 56px;
  padding: 0 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  flex-shrink: 0;
  touch-action: manipulation;
  position: relative;
  overflow: hidden;
}

.send-code-btn:active:not(.disabled) {
  transform: scale(0.98);
}

.send-code-btn:not(.disabled)::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%);
  transform-origin: 50% 50%;
}

.send-code-btn:not(.disabled):active::after {
  animation: ripple 0.6s ease-out;
}

.send-code-btn:hover:not(.disabled) {
  opacity: 0.95;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.25);
}

.send-code-btn.disabled {
  background: linear-gradient(135deg, #cccccc 0%, #aaaaaa 100%);
  cursor: not-allowed;
  opacity: 0.7;
}

.send-code-btn.mobile {
  min-width: 100px;
  padding: 0 12px;
}

.btn-text {
  display: inline-block;
  transform: translateZ(0); /* 开启GPU加速 */
}

.login-btn {
  width: 100%;
  height: 56px;
  margin-top: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  touch-action: manipulation;
  position: relative;
  overflow: hidden;
}

.login-btn:active:not(.disabled) {
  transform: scale(0.98);
}

.login-btn:not(.disabled)::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%);
  transform-origin: 50% 50%;
}

.login-btn:not(.disabled):active::after {
  animation: ripple 0.6s ease-out;
}

.login-btn:hover:not(.disabled) {
  opacity: 0.95;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.login-btn.disabled {
  background: linear-gradient(135deg, #cccccc 0%, #aaaaaa 100%);
  cursor: not-allowed;
  opacity: 0.7;
}

.login-btn.mobile {
  height: 52px;
}

.login-footer {
  margin-top: 28px;
  text-align: center;
  color: #8a8a8a;
  font-size: 13px;
  line-height: 1.5;
  padding: 0 4px;
}

.login-footer .link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.login-footer .link:active {
  color: #764ba2;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  100% {
    transform: scale(20, 20);
    opacity: 0;
  }
}

/* 移动端优化 */
@media (max-width: 767px) {
  .login-container {
    padding: 12px;
    align-items: flex-start;
    padding-top: max(20px, env(safe-area-inset-top));
    padding-bottom: max(20px, env(safe-area-inset-bottom));
  }

  .login-card {
    padding: 28px 20px;
    margin-top: max(20px, 5vh);
    border-radius: 18px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .login-header {
    margin-bottom: 28px;
  }

  .login-header h2 {
    font-size: 22px;
  }

  .login-header p {
    font-size: 14px;
  }

  .form-input {
    height: 52px;
    font-size: 16px;
    padding: 0 16px;
  }

  .form-input:focus {
    transform: translateY(0);
  }

  .send-code-btn {
    height: 52px;
    font-size: 14px;
    min-width: 104px;
  }

  .login-btn {
    height: 52px;
    font-size: 16px;
  }
}

/* 小屏幕手机优化 */
@media (max-width: 375px) {
  .login-card {
    padding: 24px 18px;
    margin-top: 10px;
  }

  .login-header {
    margin-bottom: 24px;
  }

  .login-header h2 {
    font-size: 20px;
  }

  .code-input-group {
    flex-direction: column;
    gap: 12px;
  }

  .code-input {
    width: 100%;
  }

  .send-code-btn {
    width: 100%;
    min-width: auto;
    height: 48px;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-input {
    height: 50px;
  }
}

/* 超小屏幕 */
@media (max-width: 320px) {
  .login-card {
    padding: 20px 16px;
  }
  
  .login-header h2 {
    font-size: 19px;
  }
}

/* 横屏优化 */
@media (orientation: landscape) and (max-height: 500px) {
  .login-container {
    align-items: flex-start;
    padding-top: 10px;
    min-height: auto;
  }

  .login-card {
    margin-top: 0;
    padding: 20px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-input {
    height: 48px;
  }

  .send-code-btn,
  .login-btn {
    height: 48px;
  }
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .login-card {
    background: #1a1a1a;
  }

  .login-header h2 {
    color: #ffffff;
  }

  .login-header p {
    color: #aaaaaa;
  }

  .form-group label {
    color: #dddddd;
  }

  .form-input {
    background: #2a2a2a;
    border-color: #444;
    color: #ffffff;
  }

  .form-input:focus {
    background: #333;
  }

  .form-input::placeholder {
    color: #777;
  }

  .login-footer {
    color: #999;
  }

  .login-footer .link {
    color: #8a9bff;
  }
}

/* 防止iOS输入框内阴影 */
input {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

/* 优化滚动体验 */
.login-container {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 防止长按弹出菜单 */
button, input {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}
</style>

<style>
/* 完全自定义的消息提示样式，避免Element Plus样式冲突 */
.login-message-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 99999;
  display: flex;
  justify-content: center;
}

.login-message {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translate(-50%, -20px);
  opacity: 0;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.4;
  text-align: center;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  max-width: 90%;
  min-width: 280px;
  display: flex;
  align-items: center;
  gap: 10px;
  pointer-events: auto;
  z-index: 100000 !important;
}

.login-message-success {
  background: rgba(103, 194, 58, 0.95);
  color: white;
  border: 1px solid rgba(103, 194, 58, 0.3);
}

.login-message-error {
  background: rgba(245, 108, 108, 0.95);
  color: white;
  border: 1px solid rgba(245, 108, 108, 0.3);
}

.login-message-warning {
  background: rgba(230, 162, 60, 0.95);
  color: white;
  border: 1px solid rgba(230, 162, 60, 0.3);
}

.login-message-info {
  background: rgba(144, 147, 153, 0.95);
  color: white;
  border: 1px solid rgba(144, 147, 153, 0.3);
}

.login-message-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.login-message-text {
  flex: 1;
  word-break: break-word;
}

/* 移动端消息样式 */
@media (max-width: 768px) {
  .login-message {
    top: 60px;
    min-width: 260px;
    max-width: 85%;
    padding: 12px 16px;
    font-size: 14px;
    border-radius: 10px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
  
  .login-message-icon {
    width: 18px;
    height: 18px;
    font-size: 13px;
  }
}

/* 小屏幕手机 */
@media (max-width: 375px) {
  .login-message {
    top: 50px;
    min-width: 240px;
    padding: 10px 14px;
    font-size: 13px;
  }
}

/* 横屏优化 */
@media (orientation: landscape) and (max-height: 500px) {
  .login-message {
    top: 10px;
  }
}

/* 键盘弹出时 */
@media (max-height: 400px) {
  .login-message {
    top: 5px;
    max-width: 80%;
  }
}

/* 强制覆盖Element Plus样式 */
.el-message {
  display: none !important;
}

.el-message-box {
  z-index: 99999 !important;
}
</style>