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
      <!-- 初始欢迎状态 -->
      <div v-if="messages.length === 0" class="welcome-screen">
        <div class="quick-questions">
          <h4>猜你想问</h4>
          <div v-if="quickQuestionsLoading" class="questions-loading">
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <div v-else class="question-chips">
            <button 
              v-for="(question, index) in quickQuestions" 
              :key="index"
              @click="selectQuickQuestion(question)"
              class="question-chip"
            >
              {{ question }}
            </button>
          </div>
        </div>
      </div>

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
              <!-- 使用span元素逐步显示字符，实现打字机效果 -->
              <span 
                v-for="(char, index) in currentResponse" 
                :key="index"
                class="typing-char"
                :style="{ animationDelay: `${index * 30}ms` }"
              >
                {{ char }}
              </span>
              <span v-if="isStreaming" class="typing-cursor"></span>
            </div>
          </div>
        </div>
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
import { fetchQuickQuestions } from '@/api/quickQuestions'

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

// 打字机效果显示
const startTypingEffect = () => {
  stopTypingEffect()
  
  currentPosition = 0
  currentResponse.value = ''
  
  // 使用定时器模拟打字机效果
  typingInterval = window.setInterval(() => {
    if (currentPosition < fullResponse.length) {
      currentResponse.value += fullResponse[currentPosition]
      currentPosition++
      scrollToBottom()
    } else {
      stopTypingEffect()
      // 打字完成，添加到消息历史
      messages.value.push({
        role: 'assistant',
        content: fullResponse,
        timestamp: Date.now()
      })
      isStreaming.value = false
      fullResponse = ''
      currentResponse.value = ''
    }
  }, 30) // 30ms 打一个字，可以调整速度
}

const stopTypingEffect = () => {
  if (typingInterval) {
    clearInterval(typingInterval)
    typingInterval = null
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
  stopTypingEffect()
  
  if (abortController) {
    abortController()
    abortController = null
  }
  
  // 如果有部分响应，保存为消息
  if (fullResponse && fullResponse.length > 0) {
    messages.value.push({
      role: 'assistant',
      content: fullResponse + (currentResponse.value ? ' (已中断)' : ''),
      timestamp: Date.now()
    })
  } else if (currentResponse.value) {
    messages.value.push({
      role: 'assistant',
      content: currentResponse.value + ' (已中断)',
      timestamp: Date.now()
    })
  }
  
  isStreaming.value = false
  fullResponse = ''
  currentResponse.value = ''
}

const clearChat = () => {
  if (isStreaming.value) {
    if (!confirm('正在生成内容，确定要清空吗？')) return
    stopStreaming()
  }
  
  messages.value = []
  currentResponse.value = ''
  fullResponse = ''
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
}

// 加载猜你想问
const loadQuickQuestions = async () => {
  quickQuestionsLoading.value = true
  try {
    // 调用后端接口获取猜你想问
    const questions = await fetchQuickQuestions()
    quickQuestions.value = questions
  } catch (error) {
    console.error('Failed to load quick questions:', error)
    // 如果接口失败，使用默认问题
    quickQuestions.value = [
      '曼联 vs 利物浦 近期状态分析',
      '曼城对阵阿森纳的赔率预测',
      '皇马巴萨历史交锋记录',
      '欧冠决赛关键球员伤停情况',
      '英超保级球队战意分析'
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
  stopTypingEffect()
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

.quick-questions {
  max-width: 800px;
  width: 100%;
  margin-top: 40px;
}

.quick-questions h4 {
  margin: 0 0 16px 0;
  color: #1a1a1a;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

.questions-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.loading-dots {
  display: flex;
  gap: 8px;
}

.loading-dots span {
  width: 12px;
  height: 12px;
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
    transform: translateY(-10px);
    opacity: 1;
  }
}

.question-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.question-chip {
  padding: 12px 20px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  color: #5fab8c;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.question-chip:hover {
  background: #f0f9f5;
  border-color: #5fab8c;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(95, 171, 140, 0.1);
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

/* 打字机效果的特殊样式 */
.typing-char {
  opacity: 0;
  animation: typeIn 0.1s forwards;
}

@keyframes typeIn {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
}

.input-container.centered {
  position: absolute;
  bottom: 24px;
  left: 24px;
  right: 24px;
  background: transparent;
  border: none;
  padding: 0;
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
  background: #ff6b6b;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-header {
    padding: 12px 16px;
  }
  
  .messages-container {
    padding: 0;
  }
  
  .messages-container.has-messages {
    padding: 16px;
  }
  
  .welcome-screen {
    padding: 24px 16px;
  }
  
  .question-chips {
    flex-direction: column;
    align-items: stretch;
  }
  
  .input-container {
    padding: 0 16px;
  }
  
  .input-container.centered {
    left: 16px;
    right: 16px;
    bottom: 16px;
  }
  
  .input-container.active {
    padding: 16px;
  }
  
  .input-bottom-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .input-actions {
    position: static;
    margin-top: 12px;
    justify-content: flex-end;
  }
  
  .message {
    gap: 12px;
  }
  
  .message-content {
    max-width: calc(100% - 48px);
  }
}
</style>