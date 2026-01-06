<template>
  <div class="ai-chat-container">
    <!-- 聊天头部 -->
    <div class="chat-header">
      <div class="model-info">
        <div class="logo">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div class="model-details">
          <h3>AI助手</h3>
        </div>
      </div>
      <div class="header-actions">
        <button 
          @click="clearChat" 
          class="action-btn secondary"
          :disabled="isStreaming"
        >
          <svg class="icon" viewBox="0 0 24 24">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          清空对话
        </button>
        <button @click="exportChat" class="action-btn secondary">
          <svg class="icon" viewBox="0 0 24 24">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
          导出
        </button>
      </div>
    </div>

    <!-- 聊天消息区域 -->
    <div 
      ref="messagesContainer" 
      class="messages-container"
      :class="{ 'has-messages': messages.length > 0 }"
    >
      <!-- 消息列表 -->
      <div v-if="messages.length > 0" class="messages-list">
        <div v-for="(message, index) in messages" :key="index" class="message-wrapper">
          <div 
            :class="[
              'message',
              message.role === 'user' ? 'user-message' : 'assistant-message'
            ]"
          >
            <div class="message-avatar">
              <div v-if="message.role === 'user'" class="avatar user-avatar">
                <svg viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div v-else class="avatar ai-avatar">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="message-role">
                  {{ message.role === 'user' ? '用户' : 'AI专家' }}
                </span>
                <span class="message-time">
                  {{ formatTime(message.timestamp) }}
                </span>
              </div>
              <div class="message-text" v-html="formatMessage(message.content)"></div>
              
              <div v-if="message.role === 'assistant' && message.thinking" class="thinking-content">
                <details>
                  <summary class="thinking-header">
                    <svg class="thinking-icon" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                    </svg>
                    <span>深度思考过程</span>
                  </summary>
                  <div class="thinking-text">{{ message.thinking }}</div>
                </details>
              </div>
              
              <div v-if="message.role === 'assistant'" class="message-actions">
                <button @click="copyMessage(message.content)" class="action-btn small">
                  <svg class="icon small" viewBox="0 0 24 24">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2z"/>
                  </svg>
                  复制
                </button>
                <button @click="regenerateResponse(index)" class="action-btn small" :disabled="isStreaming">
                  <svg class="icon small" viewBox="0 0 24 24">
                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                  </svg>
                  重新生成
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 流式生成时的打字机效果 -->
      <div v-if="isStreaming" class="message-wrapper">
        <div class="message assistant-message">
          <div class="message-avatar">
            <div class="avatar ai-avatar">
              <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="message-role">AI专家</span>
              <span class="message-time">正在输入...</span>
            </div>
            <div class="message-text">
              {{ currentResponse }}
              <span v-if="isStreaming" class="typing-cursor"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 没有消息时的欢迎屏幕 -->
      <div v-if="messages.length === 0" class="welcome-screen">
        <div class="welcome-content">
          <h2>欢迎使用 AI 助手</h2>
          <p>随时向我提问，我将尽力为您解答</p>
        </div>
      </div>
    </div>

    <!-- 猜你想问区域 - 固定在输入框上方 -->
    <div v-if="!isStreaming && quickQuestions.length > 0" class="quick-questions-fixed">
      <div class="quick-questions-header">
        <div class="quick-questions-title">
          <svg class="question-icon" viewBox="0 0 24 24">
            <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
          </svg>
          <h4>快速提问</h4>
        </div>
        <button 
          @click="refreshQuickQuestions" 
          class="refresh-btn"
          :disabled="quickQuestionsLoading"
          title="换一批"
        >
          <svg class="refresh-icon" viewBox="0 0 24 24" :class="{ 'loading': quickQuestionsLoading }">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
      </div>
      
      <div v-if="quickQuestionsLoading" class="questions-loading">
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <div v-else class="questions-grid">
        <button 
          v-for="(question, index) in quickQuestions" 
          :key="index"
          @click="selectQuickQuestion(question)"
          class="question-card"
        >
          <div class="question-content">
            <svg class="question-mark-icon" viewBox="0 0 24 24">
              <path d="M15.07 11.25l-.9.92C13.45 12.89 13 13.5 13 15h-2v-.5c0-1.11.45-2.11 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25zM13 19h-2v-2h2v2zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
            <span class="question-text">{{ question }}</span>
          </div>
          <div class="question-arrow">
            <svg viewBox="0 0 24 24">
              <path d="M10 17l5-5-5-5v10z"/>
            </svg>
          </div>
        </button>
      </div>
    </div>

    <!-- 输入区域 -->
    <div 
      class="input-container" 
      :class="{ 'centered': messages.length === 0, 'active': messages.length > 0 }"
    >
      <div class="input-wrapper">
        <div class="input-area">
          <div class="input-border">
            <textarea
              ref="inputArea"
              v-model="userInput"
              @keydown.enter.exact.prevent="handleSend"
              @keydown.enter.shift.exact.prevent="userInput += '\n'"
              placeholder="有什么问题想问我吗？"
              :disabled="isStreaming"
              rows="1"
              class="message-input"
              @input="autoResize"
            ></textarea>
            
            <div class="input-actions">
              <button 
                @click="stopStreaming" 
                v-if="isStreaming" 
                class="send-btn stop-btn"
              >
                <svg class="icon" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z"/>
                </svg>
                停止
              </button>
              <button 
                @click="handleSend" 
                :disabled="!canSend" 
                class="send-btn primary"
              >
                <svg class="icon" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
                <span class="btn-text">发送</span>
              </button>
            </div>
          </div>
          
          <!-- 左下角选项 -->
          <div class="input-bottom-options">
            <div 
              class="deep-thinking-option"
              :class="{ 'active': useDeepThinking }"
              @click="useDeepThinking = !useDeepThinking"
            >
              <div class="thinking-toggle">
                <div class="thinking-toggle-track">
                  <div class="thinking-toggle-thumb"></div>
                </div>
                <span>深度思考模式</span>
              </div>
              <div v-if="inputTokens > 0" class="token-info-bottom">
                预计消耗: {{ inputTokens }} tokens
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { streamChatSSE, type ChatMessage, type ChatRequest } from '@/api/streamApi'
import { guestApi } from '@/api/quickQuestions'

interface Message extends ChatMessage {
  thinking?: string // 深度思考过程
  timestamp?: number
}

// 响应式数据
const messages = ref<Message[]>([])
const userInput = ref('')
const isStreaming = ref(false)
const currentResponse = ref('')
const useDeepThinking = ref(false)
const inputTokens = ref(0)
const messagesContainer = ref<HTMLElement>()
const inputArea = ref<HTMLTextAreaElement>()

// 猜你想问相关
const quickQuestions = ref<string[]>([])
const quickQuestionsLoading = ref(false)
let abortController: (() => void) | null = null

// 打字机效果相关
let typingInterval: number | null = null
let fullResponse = ''
let currentPosition = 0

// 计算属性
const canSend = computed(() => {
  return userInput.value.trim().length > 0 && !isStreaming.value
})

// 方法
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const formatMessage = (content: string) => {
  if (!content) return ''
  
  // 处理 Markdown 和格式化
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/\n/g, '<br>')
}

const formatTime = (timestamp?: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const autoResize = () => {
  const textarea = inputArea.value
  if (textarea) {
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }
}

const handleSend = async () => {
  if (!canSend.value) return

  const userMessage = userInput.value.trim()
  if (!userMessage) return

  // 添加用户消息
  const userMsg: Message = {
    role: 'user',
    content: userMessage,
    timestamp: Date.now()
  }
  messages.value.push(userMsg)
  
  // 清空输入框
  userInput.value = ''
  autoResize()
  
  // 滚动到底部
  scrollToBottom()

  // 构建请求数据
  const requestData: ChatRequest = {
    messages: [...messages.value.map(msg => ({
      role: msg.role,
      content: msg.content
    }))],
    stream: true,
    deepThinking: useDeepThinking.value
  }

  isStreaming.value = true
  currentResponse.value = ''

  try {
    // 使用新的流式 API
    abortController = await streamChatSSE(
      requestData,
      // 实时显示每个字符
      (chunk: string) => {
        console.log('Received chunk:', chunk)
        currentResponse.value += chunk
        scrollToBottom()
      },
      (error) => {
        console.error('Stream error:', error)
        if (currentResponse.value) {
          messages.value.push({
            role: 'assistant',
            content: currentResponse.value,
            timestamp: Date.now()
          })
        } else {
          messages.value.push({
            role: 'assistant',
            content: '生成过程中出现错误，请重试。',
            timestamp: Date.now()
          })
        }
        currentResponse.value = ''
        isStreaming.value = false
        abortController = null
      },
      () => {
        console.log('Stream completed')
        if (currentResponse.value) {
          messages.value.push({
            role: 'assistant',
            content: currentResponse.value,
            timestamp: Date.now()
          })
        }
        currentResponse.value = ''
        isStreaming.value = false
        abortController = null
        scrollToBottom()
      }
    )
  } catch (error) {
    console.error('Chat error:', error)
    isStreaming.value = false
    abortController = null
    currentResponse.value = ''
  }
}

const stopStreaming = () => {
  if (abortController) {
    abortController()
    abortController = null
  }
  
  // 如果有部分响应，保存为消息
  if (currentResponse.value) {
    messages.value.push({
      role: 'assistant',
      content: currentResponse.value + ' (已中断)',
      timestamp: Date.now()
    })
  }
  
  isStreaming.value = false
  fullResponse = ''
  currentResponse.value = ''
  
  // 重新加载猜你想问
  loadQuickQuestions()
}

const clearChat = () => {
  if (isStreaming.value) {
    if (!confirm('正在生成内容，确定要清空吗？')) return
    stopStreaming()
  }
  
  messages.value = []
  currentResponse.value = ''
  fullResponse = ''
  
  // 清空后重新加载猜你想问
  loadQuickQuestions()
}

const copyMessage = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    // 可以添加一个短暂的提示，而不是alert
    const copyBtn = event?.target as HTMLElement
    if (copyBtn) {
      const originalText = copyBtn.textContent
      copyBtn.textContent = '已复制'
      setTimeout(() => {
        if (copyBtn) {
          copyBtn.textContent = originalText
        }
      }, 2000)
    }
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const regenerateResponse = async (messageIndex: number) => {
  if (isStreaming.value) {
    stopStreaming()
  }

  // 移除当前助手消息及其之前的用户消息
  const messageToRegenerate = messages.value[messageIndex]
  if (messageToRegenerate.role !== 'assistant') return

  // 找到要重新生成的消息对应的用户消息
  const userMessageIndex = messageIndex - 1
  if (userMessageIndex < 0 || messages.value[userMessageIndex].role !== 'user') return

  // 移除该助手消息
  messages.value.splice(messageIndex, 1)
  
  // 重新发送对应的用户消息
  const userMessage = messages.value[userMessageIndex].content
  userInput.value = userMessage
  await nextTick()
  handleSend()
}

const exportChat = () => {
  const chatText = messages.value.map(msg => {
    const role = msg.role === 'user' ? '用户' : 'AI助手'
    return `【${role}】${msg.timestamp ? ` (${formatTime(msg.timestamp)})` : ''}\n${msg.content}\n${msg.thinking ? `\n深度思考：\n${msg.thinking}\n` : ''}\n`
  }).join('\n---\n\n')
  
  const blob = new Blob([chatText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `deepseek-chat-${Date.now()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const selectQuickQuestion = (question: string) => {
  userInput.value = question
  autoResize()
  // 滚动到输入框
  nextTick(() => {
    inputArea.value?.focus()
  })
}

const refreshQuickQuestions = async () => {
  await loadQuickQuestions()
}

// 加载猜你想问
const loadQuickQuestions = async () => {
  quickQuestionsLoading.value = true
  try {
    // 调用后端接口获取猜你想问
    const question = await guestApi.getGuestAsk()
    console.log(question)
    quickQuestions.value = question.questionName || []
    if (quickQuestions.value.length === 0) {
      // 如果接口失败或返回空，使用默认问题
      quickQuestions.value = [
        '曼联 vs 利物浦 近期状态分析'
      ]
    }
  } catch (error) {
    console.error('Failed to load quick questions:', error)
    // 如果接口失败，使用默认问题
    quickQuestions.value = [
      '曼联 vs 利物浦 近期状态分析'
    ]
  } finally {
    quickQuestionsLoading.value = false
  }
}

// 监听输入变化计算 tokens
watch(userInput, (newVal) => {
  // 简单估算：中文字符算2个token，英文字符算1个
  inputTokens.value = Math.ceil(newVal.length * 1.3)
})

// 监听深度思考模式变化
watch(useDeepThinking, (newVal) => {
  if (newVal) {
    console.log('深度思考模式已开启')
  } else {
    console.log('深度思考模式已关闭')
  }
})

// 生命周期钩子
onMounted(() => {
  loadQuickQuestions()
  scrollToBottom()
  autoResize()
})

onUnmounted(() => {
  stopStreaming()
})
</script>

<style scoped>
.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}

.model-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #5fab8c 0%, #4285f4 100%);
  border-radius: 8px;
  color: white;
}

.model-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.model-details h3 {
  margin: 0;
  color: #1a1a1a;
  font-size: 18px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  color: #5fab8c;
  border: 1px solid #d0e6dd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.action-btn.secondary {
  color: #666;
  border-color: #e0e0e0;
}

.action-btn:hover:not(:disabled) {
  background: #f5f7fa;
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.icon.small {
  width: 14px;
  height: 14px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  scroll-behavior: smooth;
  position: relative;
  -webkit-overflow-scrolling: touch; /* 移动端滚动优化 */
}

.messages-container.has-messages {
  padding: 24px;
}

.welcome-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px 24px;
  text-align: center;
  animation: fadeIn 0.5s ease;
}

.welcome-content {
  max-width: 600px;
}

.welcome-content h2 {
  margin: 0 0 12px 0;
  color: #1a1a1a;
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #5fab8c 0%, #4285f4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-content p {
  margin: 0;
  color: #666;
  font-size: 16px;
  line-height: 1.6;
}

/* 猜你想问 - 固定在输入框上方 */
.quick-questions-fixed {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(95, 171, 140, 0.1);
  border-bottom: 1px solid rgba(95, 171, 140, 0.1);
  padding: 20px;
  z-index: 9;
  margin-top: auto;
  box-shadow: 0 -8px 32px rgba(95, 171, 140, 0.08);
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.quick-questions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.quick-questions-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.question-icon {
  width: 20px;
  height: 20px;
  fill: #5fab8c;
}

.quick-questions-title h4 {
  margin: 0;
  color: #1a1a1a;
  font-size: 15px;
  font-weight: 600;
  background: linear-gradient(135deg, #5fab8c 0%, #4285f4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #f0f9f5 0%, #e8f0fe 100%);
  color: #5fab8c;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.refresh-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #e0f0ea 0%, #d0e0f8 100%);
  transform: rotate(90deg);
  box-shadow: 0 4px 12px rgba(95, 171, 140, 0.15);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  width: 18px;
  height: 18px;
  fill: currentColor;
  transition: transform 0.3s ease;
}

.refresh-icon.loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.questions-loading {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.loading-dots {
  display: flex;
  gap: 8px;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  background: #5fab8c;
  border-radius: 50%;
  animation: loading 1.4s ease-in-out infinite;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes loading {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

/* 网格布局替代滚动布局 */
.questions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.question-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: white;
  border: 1px solid rgba(95, 171, 140, 0.15);
  border-radius: 12px;
  color: #1a1a1a;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  width: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.question-card:hover {
  transform: translateY(-2px);
  border-color: rgba(95, 171, 140, 0.3);
  box-shadow: 0 8px 24px rgba(95, 171, 140, 0.12);
  background: linear-gradient(135deg, rgba(95, 171, 140, 0.02) 0%, rgba(66, 133, 244, 0.02) 100%);
}

.question-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.question-mark-icon {
  width: 20px;
  height: 20px;
  fill: #5fab8c;
  flex-shrink: 0;
}

.question-text {
  line-height: 1.5;
  font-weight: 500;
  color: #333;
}

.question-arrow {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(95, 171, 140, 0.1);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.question-card:hover .question-arrow {
  background: rgba(95, 171, 140, 0.2);
  transform: translateX(4px);
}

.question-arrow svg {
  width: 16px;
  height: 16px;
  fill: #5fab8c;
}

.messages-list {
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.message-wrapper {
  margin-bottom: 24px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message {
  display: flex;
  gap: 16px;
}

.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
}

.user-avatar {
  background: linear-gradient(135deg, #5fab8c 0%, #4285f4 100%);
}

.ai-avatar {
  background: linear-gradient(135deg, #f0f9f5 0%, #e8f0fe 100%);
  color: #5fab8c;
}

.avatar svg {
  width: 20px;
  height: 20px;
  fill: white;
}

.ai-avatar svg {
  fill: #5fab8c;
}

.message-content {
  flex: 1;
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  max-width: calc(100% - 52px);
  position: relative;
}

.user-message .message-content {
  background: linear-gradient(135deg, #5fab8c 0%, #4285f4 100%);
  color: white;
}

.assistant-message .message-content {
  border-left: 3px solid #5fab8c;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.message-role {
  font-weight: 600;
  font-size: 14px;
}

.user-message .message-role {
  color: rgba(255, 255, 255, 0.9);
}

.assistant-message .message-role {
  color: #5fab8c;
}

.message-time {
  font-size: 12px;
  color: #999;
}

.user-message .message-time {
  color: rgba(255, 255, 255, 0.7);
}

.message-text {
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 15px;
  min-height: 20px;
}

.user-message .message-text {
  color: white;
}

.message-text :deep(code) {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9em;
}

.user-message .message-text :deep(code) {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.message-text :deep(strong) {
  font-weight: 600;
}

.message-text :deep(em) {
  font-style: italic;
}

.message-text :deep(pre) {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
}

.message-text :deep(pre code) {
  background: none;
  padding: 0;
}

.thinking-content {
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.thinking-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #5fab8c;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
}

.thinking-icon {
  width: 16px;
  height: 16px;
  fill: #5fab8c;
}

.thinking-text {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  margin-top: 8px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.message-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.user-message .message-actions {
  border-top-color: rgba(255, 255, 255, 0.2);
}

.action-btn.small {
  padding: 6px 12px;
  font-size: 12px;
  background: #f5f7fa;
  color: #666;
  border: 1px solid #e0e0e0;
}

.user-message .action-btn.small {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
}

.action-btn.small:hover:not(:disabled) {
  background: #e8f0fe;
  color: #4285f4;
}

/* 打字机光标效果 */
.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background: #5fab8c;
  margin-left: 2px;
  vertical-align: middle;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 输入区域样式 */
.input-container {
  padding: 0 24px;
  background: white;
  border-top: 1px solid #e0e0e0;
  position: relative;
  z-index: 10;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.input-container.centered {
  position: static;
  background: transparent;
  border: none;
  padding: 16px 24px 24px;
}

.input-container.active {
  padding: 20px 24px;
  background: white;
  border-top: 1px solid #e0e0e0;
  position: static;
}

.input-wrapper {
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.input-area {
  position: relative;
}

.input-border {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px 16px;
  background: white;
  transition: all 0.3s ease;
  position: relative;
}

.input-container.centered .input-border {
  border: 2px solid #e8f4f0;
  background: white;
  box-shadow: 0 4px 20px rgba(95, 171, 140, 0.1);
}

.input-border:focus-within {
  border-color: #5fab8c;
  box-shadow: 0 0 0 3px rgba(95, 171, 140, 0.1);
}

.message-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 16px;
  line-height: 1.5;
  resize: none;
  background: transparent;
  max-height: 120px;
  overflow-y: auto;
  font-family: inherit;
}

.message-input:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.message-input::placeholder {
  color: #999;
}

.input-actions {
  position: absolute;
  right: 16px;
  bottom: 12px;
  display: flex;
  gap: 8px;
}

.send-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  background: #5fab8c;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-height: 36px;
}

.send-btn.primary {
  background: linear-gradient(135deg, #5fab8c 0%, #4285f4 100%);
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(95, 171, 140, 0.3);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stop-btn {
  animation: pulse 2s infinite;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%);
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 107, 107, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 107, 107, 0);
  }
}

.stop-btn:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.btn-text {
  display: inline-block;
}

/* 左下角选项 */
.input-bottom-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding: 0 4px;
}

.deep-thinking-option {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.deep-thinking-option:hover {
  background: #f5f7fa;
}

.deep-thinking-option.active .thinking-toggle-thumb {
  transform: translateX(18px);
  background: #5fab8c;
}

.thinking-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.thinking-toggle-track {
  width: 40px;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  position: relative;
  transition: all 0.3s ease;
}

.deep-thinking-option.active .thinking-toggle-track {
  background: rgba(95, 171, 140, 0.2);
}

.thinking-toggle-thumb {
  width: 16px;
  height: 16px;
  background: #999;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: all 0.3s ease;
}

.thinking-toggle span {
  color: #666;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s ease;
}

.deep-thinking-option.active .thinking-toggle span {
  color: #5fab8c;
}

.token-info-bottom {
  color: #999;
  font-size: 13px;
  font-weight: 500;
}

/* 滚动条样式 */
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* 移动端响应式设计 */
@media (max-width: 768px) {
  .ai-chat-container {
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  
  .chat-header {
    padding: 12px 16px;
    position: sticky;
    top: 0;
  }
  
  .header-actions {
    gap: 8px;
  }
  
  .action-btn {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .action-btn span:not(.icon) {
    display: none; /* 移动端只显示图标 */
  }
  
  .action-btn .icon {
    margin-right: 0;
  }
  
  .model-details h3 {
    font-size: 16px;
  }
  
  .messages-container {
    padding: 0;
    flex: 1;
    min-height: 0; /* 修复flex布局中的滚动问题 */
  }
  
  .messages-container.has-messages {
    padding: 16px;
  }
  
  .welcome-screen {
    padding: 24px 16px;
  }
  
  .welcome-content h2 {
    font-size: 24px;
  }
  
  .welcome-content p {
    font-size: 14px;
  }
  
  .quick-questions-fixed {
    padding: 16px;
  }
  
  .questions-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .question-card {
    padding: 14px;
  }
  
  .question-content {
    gap: 10px;
  }
  
  .quick-questions-title h4 {
    font-size: 14px;
  }
  
  .input-container {
    padding: 0 16px;
    position: sticky;
    bottom: 0;
    background: white;
    z-index: 10;
  }
  
  .input-container.centered {
    padding: 12px 16px 16px;
  }
  
  .input-container.active {
    padding: 16px;
  }
  
  .input-bottom-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-top: 8px;
  }
  
  .input-actions {
    position: static;
    margin-top: 12px;
    justify-content: flex-end;
  }
  
  .send-btn {
    padding: 10px 20px;
    width: 100%;
    justify-content: center;
  }
  
  .btn-text {
    display: inline;
  }
  
  .message {
    gap: 12px;
  }
  
  .avatar {
    width: 32px;
    height: 32px;
  }
  
  .message-content {
    max-width: calc(100% - 48px);
    padding: 12px;
  }
  
  .message-actions {
    flex-wrap: wrap;
  }
  
  .action-btn.small {
    padding: 4px 8px;
    font-size: 11px;
  }
  
  .token-info-bottom {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .question-card {
    padding: 12px;
  }
  
  .question-text {
    font-size: 13px;
  }
  
  .message-text {
    font-size: 14px;
  }
  
  .message-role {
    font-size: 13px;
  }
  
  .message-time {
    font-size: 11px;
  }
  
  .thinking-header {
    font-size: 13px;
  }
  
  .thinking-text {
    font-size: 13px;
  }
}

/* 平板设备适配 */
@media (min-width: 769px) and (max-width: 1024px) {
  .chat-header {
    padding: 14px 20px;
  }
  
  .messages-container.has-messages {
    padding: 20px;
  }
  
  .input-container {
    padding: 0 20px;
  }
  
  .input-container.centered {
    padding: 16px 20px 20px;
  }
  
  .input-container.active {
    padding: 16px 20px;
  }
  
  .quick-questions-fixed {
    padding: 16px 20px;
  }
  
  .questions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 修复移动端键盘弹出时的布局问题 */
@media (max-height: 600px) {
  .welcome-screen {
    padding: 16px;
  }
  
  .welcome-content h2 {
    font-size: 20px;
    margin-bottom: 8px;
  }
  
  .welcome-content p {
    font-size: 13px;
  }
  
  .quick-questions-fixed {
    padding: 12px;
  }
  
  .question-card {
    padding: 10px;
    min-height: auto;
  }
}
</style>