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

    <!-- 错误提示横幅 -->
    <transition name="slide-down">
      <div v-if="showError" class="error-banner">
        <svg class="error-icon" viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <span class="error-text">{{ errorMessage }}</span>
        <button @click="clearError" class="error-close">×</button>
      </div>
    </transition>

    <!-- 聊天消息区域 -->
    <div
      ref="messagesContainer"
      class="messages-container"
      :class="{ 'has-messages': messages.length > 0 }"
    >
      <!-- 消息列表 -->
      <div v-if="messages.length > 0" class="messages-list">
        <div v-for="message in messages" :key="message.id" class="message-wrapper">
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
                <button @click="regenerateResponse(message.id)" class="action-btn small" :disabled="isStreaming">
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
              <div v-if="streamingMessage" class="typing-container">
                <div class="typing-content" v-html="formatMessage(streamingMessage)"></div>
                <span v-if="isStreaming" class="typing-cursor"></span>
              </div>
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

    <!-- 猜你想问区域 - 支持折叠 -->
    <div 
      v-if="  !isStreaming && quickQuestions.length > 0" 
      class="quick-questions-fixed"
      :class="{ 'collapsed': isQuickQuestionsCollapsed }"
    >
      <div 
        class="quick-questions-header"
        @click="toggleQuickQuestions"
      >
        <div class="quick-questions-title">
          <svg class="question-icon" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <h4>猜你想问</h4>
          <div class="collapse-indicator">
            <svg class="collapse-icon" viewBox="0 0 24 24">
              <path v-if="isQuickQuestionsCollapsed" d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
              <path v-else d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/>
            </svg>
          </div>
        </div>
        <button 
          v-if="!isQuickQuestionsCollapsed"
          @click.stop="refreshQuickQuestions" 
          class="refresh-btn"
          :disabled="quickQuestionsLoading"
        >
          <svg class="refresh-icon" viewBox="0 0 24 24">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
          <span class="refresh-text">换一批</span>
        </button>
      </div>
      
      <div 
        v-if="!isQuickQuestionsCollapsed"
        class="quick-questions-content"
      >
        <div v-if="quickQuestionsLoading" class="questions-loading">
          <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <div v-else class="questions-scroll-container">
          <div class="question-chips">
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
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

interface Message extends ChatMessage {
  id: string // 添加唯一ID
  thinking?: string // 深度思考过程
  timestamp?: number
}

// 响应式数据
const messages = ref<Message[]>([])
const userInput = ref('')
const isStreaming = ref(false)
const streamingMessage = ref('')
const useDeepThinking = ref(false)
const inputTokens = ref(0)
const messagesContainer = ref<HTMLElement>()
const inputArea = ref<HTMLTextAreaElement>()

// 猜你想问相关
const quickQuestions = ref<string[]>([])
const quickQuestionsLoading = ref(false)
const isQuickQuestionsCollapsed = ref(false)
let abortController: (() => void) | null = null

// 错误处理相关
const errorMessage = ref('')
const showError = ref(false)

// 打字机效果相关
let accumulatedChunks: string[] = []
let typingTimeout: number | null = null
let lastTypingTime = 0
const TYPING_SPEED = 10 // 字符/ms，数值越小越快

// 生成唯一ID
const generateId = (): string => {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

// 初始化 Markdown 渲染器
const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (str: string, lang: string): string => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`
      } catch (err) {
        console.error('Highlight error:', err)
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
})

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

// 使用 markdown-it 渲染 Markdown（更健壮、性能更好）
const formatMessage = (content: string): string => {
  if (!content) return ''

  try {
    // 使用 markdown-it 渲染，自动处理所有 Markdown 语法
    return md.render(content)
  } catch (err) {
    console.error('Markdown render error:', err)
    // 降级处理：返回转义后的纯文本
    const escapedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
    return `<p>${escapedContent}</p>`
  }
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

// 优化打字机效果
const processTypingChunk = () => {
  if (accumulatedChunks.length === 0) {
    typingTimeout = null
    return
  }
  
  const now = Date.now()
  const timeDiff = now - lastTypingTime
  
  // 根据时间差调整显示速度
  const speed = Math.max(5, Math.min(20, 50 - timeDiff / 10))
  
  const chunk = accumulatedChunks.shift() || ''
  streamingMessage.value += chunk
  
  // 更新最后打字时间
  lastTypingTime = now
  
  // 立即滚动到底部
  scrollToBottom()
  
  // 如果有更多内容，继续处理
  if (accumulatedChunks.length > 0) {
    typingTimeout = window.setTimeout(processTypingChunk, speed)
  } else {
    typingTimeout = null
  }
}

const addTypingChunk = (chunk: string) => {
  // 将大块分割成小字符组，提供更流畅的体验
  const chunks = []
  let currentChunk = ''
  
  for (let i = 0; i < chunk.length; i++) {
    const char = chunk[i]
    if (char) {
      currentChunk += char

      // 根据字符类型调整块大小
      if (char.match(/[\n。！？；]/) || currentChunk.length >= 3) {
        chunks.push(currentChunk)
        currentChunk = ''
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk)
  }
  
  // 添加到累积块中
  accumulatedChunks.push(...chunks)
  
  // 如果没有正在进行的打字效果，启动一个
  if (!typingTimeout && accumulatedChunks.length > 0) {
    lastTypingTime = Date.now()
    processTypingChunk()
  }
}

const stopTypingEffect = () => {
  if (typingTimeout) {
    clearTimeout(typingTimeout)
    typingTimeout = null
  }
  accumulatedChunks = []
  streamingMessage.value = ''
}

const handleSend = async () => {
  if (!canSend.value) return

  const userMessage = userInput.value.trim()
  if (!userMessage) return

  // 添加用户消息
  const userMsg: Message = {
    id: generateId(),
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
    deepThinking: useDeepThinking.value
  }

  isStreaming.value = true
  streamingMessage.value = ''
  stopTypingEffect()
  accumulatedChunks = []

  try {
    // 使用新的流式 API
    abortController = await streamChatSSE(
      requestData,
      // 实时显示每个字符
      (chunk: string) => {
        addTypingChunk(chunk)
      },
      (error) => {
        console.error('Stream error:', error)
        handleError(error) // 使用新的错误处理函数
        stopTypingEffect()
        if (streamingMessage.value) {
          messages.value.push({
            id: generateId(),
            role: 'assistant',
            content: streamingMessage.value,
            timestamp: Date.now()
          })
        } else {
          messages.value.push({
            id: generateId(),
            role: 'assistant',
            content: '生成过程中出现错误，请重试。',
            timestamp: Date.now()
          })
        }
        streamingMessage.value = ''
        isStreaming.value = false
        abortController = null
      },
      () => {
        console.log('Stream completed')
        // 确保所有累积块都被处理完
        if (accumulatedChunks.length > 0) {
          setTimeout(() => {
            if (streamingMessage.value) {
              messages.value.push({
                id: generateId(),
                role: 'assistant',
                content: streamingMessage.value,
                timestamp: Date.now()
              })
            }
            streamingMessage.value = ''
            isStreaming.value = false
            abortController = null
            scrollToBottom()
          }, 100)
        } else if (streamingMessage.value) {
          messages.value.push({
            id: generateId(),
            role: 'assistant',
            content: streamingMessage.value,
            timestamp: Date.now()
          })
          streamingMessage.value = ''
          isStreaming.value = false
          abortController = null
          scrollToBottom()
        }
      }
    )
  } catch (error) {
    console.error('Chat error:', error)
    isStreaming.value = false
    abortController = null
    streamingMessage.value = ''
    stopTypingEffect()
  }
}

const stopStreaming = () => {
  stopTypingEffect()
  
  if (abortController) {
    abortController()
    abortController = null
  }
  
  // 如果有部分响应，保存为消息
  if (streamingMessage.value) {
    messages.value.push({
      id: generateId(),
      role: 'assistant',
      content: streamingMessage.value + ' (已中断)',
      timestamp: Date.now()
    })
  }
  
  isStreaming.value = false
  streamingMessage.value = ''
}

// 错误处理函数
const handleError = (error: Error) => {
  let message = '发生未知错误，请重试'

  if (error.name === 'AbortError') {
    message = '请求已取消'
  } else if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
    message = '网络连接失败，请检查您的网络设置'
  } else if (error.message.includes('timeout')) {
    message = '请求超时，请稍后重试'
  } else if (error.message.includes('401')) {
    message = '身份验证失败，请重新登录'
  } else if (error.message.includes('429')) {
    message = '请求过于频繁，请稍后再试'
  } else if (error.message.includes('500')) {
    message = '服务器错误，请稍后重试'
  }

  errorMessage.value = message
  showError.value = true

  // 3秒后自动隐藏
  setTimeout(() => {
    showError.value = false
  }, 3000)
}

const clearError = () => {
  showError.value = false
  errorMessage.value = ''
}

const clearChat = () => {
  if (isStreaming.value) {
    if (!confirm('AI 正在生成回复，确定要停止并清空对话吗？')) {
      return
    }
    stopStreaming()
  }

  if (messages.value.length > 0) {
    if (!confirm('确定要清空所有对话记录吗？此操作不可恢复。')) {
      return
    }
  }

  messages.value = []
  streamingMessage.value = ''
  localStorage.removeItem(STORAGE_KEY)
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

const regenerateResponse = async (messageId: string) => {
  if (isStreaming.value) {
    stopStreaming()
  }

  // 找到要重新生成的消息
  const messageIndex = messages.value.findIndex(m => m.id === messageId)
  if (messageIndex === -1) return

  const messageToRegenerate = messages.value[messageIndex]
  if (messageToRegenerate?.role !== 'assistant') return

  // 找到要重新生成的消息对应的用户消息
  const userMessageIndex = messageIndex - 1
  if (userMessageIndex < 0 || messages.value[userMessageIndex]?.role !== 'user') return

  // 移除该助手消息
  messages.value.splice(messageIndex, 1)

  // 重新发送对应的用户消息
  const userMessage = messages.value[userMessageIndex]?.content
  if (!userMessage) return

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

const toggleQuickQuestions = () => {
  isQuickQuestionsCollapsed.value = !isQuickQuestionsCollapsed.value
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
    quickQuestions.value = question.data.questionName || []
    if (quickQuestions.value.length === 0) {
      // 如果接口失败或返回空，使用默认问题
      quickQuestions.value = [
        '曼联 vs 利物浦 近期状态分析',
        '如何提高团队开发效率？',
        'Vue3 和 React 有什么区别？',
        '什么是微服务架构？',
        '如何学习深度学习？'
      ]
    }
  } catch (error) {
    console.error('Failed to load quick questions:', error)
    // 如果接口失败，使用默认问题
    quickQuestions.value = [
      '曼联 vs 利物浦 近期状态分析',
      '如何提高团队开发效率？',
      'Vue3 和 React 有什么区别？',
      '什么是微服务架构？',
      '如何学习深度学习？'
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

// ============= 消息持久化 =============
const STORAGE_KEY = 'ai-chat-messages'

// 保存消息到 localStorage
const saveMessages = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.value))
  } catch (err) {
    console.error('Failed to save messages:', err)
  }
}

// 加载历史消息
const loadMessages = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        messages.value = parsed
        nextTick(() => {
          scrollToBottom()
        })
      }
    }
  } catch (err) {
    console.error('Failed to load messages:', err)
  }
}

// 监听消息变化，自动保存
watch(messages, () => {
  saveMessages()
}, { deep: true })

// 生命周期钩子
onMounted(() => {
  loadMessages() // 先加载历史消息
  loadQuickQuestions()
  scrollToBottom()
  autoResize()

  // 监听页面卸载，保存消息
  window.addEventListener('beforeunload', saveMessages)
})

onUnmounted(() => {
  saveMessages()
  window.removeEventListener('beforeunload', saveMessages)
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

/* 猜你想问 - 支持折叠 */
.quick-questions-fixed {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e0e0e0;
  z-index: 9;
  margin-top: auto;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.quick-questions-fixed.collapsed {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(224, 224, 224, 0.5);
}

.quick-questions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.quick-questions-header:hover {
  background-color: rgba(245, 247, 250, 0.5);
}

.quick-questions-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.question-icon {
  width: 18px;
  height: 18px;
  fill: #5fab8c;
  transition: transform 0.3s ease;
}

.quick-questions-fixed.collapsed .question-icon {
  transform: rotate(90deg);
}

.quick-questions-title h4 {
  margin: 0;
  color: #1a1a1a;
  font-size: 14px;
  font-weight: 600;
}

.collapse-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-left: 4px;
  opacity: 0.6;
  transition: opacity 0.2s ease, transform 0.3s ease;
}

.quick-questions-header:hover .collapse-indicator {
  opacity: 1;
}

.collapse-icon {
  width: 16px;
  height: 16px;
  fill: #666;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #f5f7fa;
  color: #5fab8c;
  border: 1px solid #d0e6dd;
  border-radius: 16px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.refresh-btn:hover:not(:disabled) {
  background: #e8f4f0;
  transform: translateY(-1px);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  width: 14px;
  height: 14px;
  fill: currentColor;
}

.quick-questions-content {
  max-height: 300px;
  overflow: hidden;
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}

.quick-questions-fixed.collapsed .quick-questions-content {
  max-height: 0;
  opacity: 0;
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

/* 问题横向滚动容器 */
.questions-scroll-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch; /* 移动端滚动优化 */
  padding: 0 16px 16px;
  margin-right: -16px; /* 抵消容器的padding */
  padding-right: 16px;
}

.questions-scroll-container::-webkit-scrollbar {
  height: 4px;
}

.questions-scroll-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 2px;
}

.questions-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(95, 171, 140, 0.3);
  border-radius: 2px;
}

.question-chips {
  display: flex;
  gap: 8px;
  width: max-content; /* 确保内容不会换行 */
  padding-bottom: 8px;
}

.question-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%);
  border: 1px solid #e0e0ff;
  border-radius: 20px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
  min-height: 40px;
  font-weight: 500;
}

.question-chip:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
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
  padding: 14px 18px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  max-width: calc(100% - 52px);
  position: relative;
  word-wrap: break-word;
  transition: all 0.3s ease;
}

/* 用户消息 - 现代渐变 */
.user-message .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 18px 18px 4px 18px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  color: white;
}

.user-message .message-content:hover {
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  transform: translateY(-1px);
}

/* AI 消息 - 柔和卡片 */
.assistant-message .message-content {
  background: white;
  border-radius: 18px 18px 18px 4px;
  border-left: 3px solid #5fab8c;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.assistant-message .message-content:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
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
  word-wrap: break-word;
  font-size: 15px;
  min-height: 20px;
}

.typing-container {
  position: relative;
  min-height: 24px;
}

.typing-content {
  opacity: 1;
}

/* Markdown 样式增强 */
.message-text :deep(h1),
.message-text :deep(h2),
.message-text :deep(h3) {
  margin: 1em 0 0.5em 0;
  font-weight: 600;
  line-height: 1.3;
}

.message-text :deep(h1) {
  font-size: 1.5em;
  border-bottom: 2px solid #5fab8c;
  padding-bottom: 0.3em;
}

.message-text :deep(h2) {
  font-size: 1.3em;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 0.3em;
}

.message-text :deep(h3) {
  font-size: 1.1em;
}

.message-text :deep(strong) {
  font-weight: 600;
  color: #333;
}

.message-text :deep(em) {
  font-style: italic;
}

.message-text :deep(del) {
  text-decoration: line-through;
  color: #999;
}

.message-text :deep(.inline-code) {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9em;
  color: #e74c3c;
}

.user-message .message-text :deep(.inline-code) {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.message-text :deep(pre) {
  background: #282c34;
  color: #abb2bf;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9em;
  line-height: 1.5;
  position: relative;
}

.message-text :deep(pre)::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #e74c3c, #3498db, #2ecc71);
  border-radius: 8px 8px 0 0;
}

.message-text :deep(pre code) {
  background: none;
  padding: 0;
  color: inherit;
  font-family: inherit;
}

/* 语法高亮颜色 */
.message-text :deep(.language-javascript) .keyword { color: #e06c75; }
.message-text :deep(.language-javascript) .function { color: #61afef; }
.message-text :deep(.language-javascript) .string { color: #98c379; }
.message-text :deep(.language-javascript) .number { color: #d19a66; }
.message-text :deep(.language-javascript) .comment { color: #5c6370; }

.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 8px 0 8px 20px;
  padding-left: 20px;
}

.message-text :deep(li) {
  margin: 4px 0;
  line-height: 1.5;
}

.message-text :deep(blockquote) {
  border-left: 4px solid #5fab8c;
  margin: 12px 0;
  padding: 8px 16px;
  background: #f8f9fa;
  color: #666;
  font-style: italic;
}

.message-text :deep(a) {
  color: #5fab8c;
  text-decoration: none;
  border-bottom: 1px solid rgba(95, 171, 140, 0.3);
  transition: all 0.2s ease;
}

.message-text :deep(a:hover) {
  color: #4285f4;
  border-bottom-color: #4285f4;
}

.message-text :deep(.markdown-image) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 12px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-text :deep(hr) {
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 24px 0;
}

.message-text :deep(.markdown-table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 0.9em;
}

.message-text :deep(.markdown-table th),
.message-text :deep(.markdown-table td) {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  text-align: left;
}

.message-text :deep(.markdown-table th) {
  background: #f5f7fa;
  font-weight: 600;
  color: #333;
}

.message-text :deep(.markdown-table tr:nth-child(even)) {
  background: #fafafa;
}

.message-text :deep(p) {
  margin: 8px 0;
  line-height: 1.6;
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

/* 打字机光标效果 - 优化版 */
.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background: #5fab8c;
  margin-left: 2px;
  vertical-align: middle;
  animation: typingBlink 1s ease-in-out infinite;
  animation-delay: 0.5s;
}

@keyframes typingBlink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
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
  border: 2px solid #e8e8e8;
  border-radius: 24px;
  padding: 12px 20px;
  background: #fafafa;
  transition: all 0.3s ease;
  position: relative;
}

.input-container.centered .input-border {
  border: 2px solid #e8f4f0;
  background: white;
  box-shadow: 0 4px 20px rgba(95, 171, 140, 0.1);
}

.input-border:focus-within {
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.message-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 15px;
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
    position: sticky;
    bottom: 0;
    background: white;
    border-top: 1px solid #e0e0e0;
    border-bottom: none;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  }
  
  .refresh-text {
    display: none;
  }
  
  .refresh-btn {
    padding: 8px;
  }
  
  .question-chips {
    gap: 6px;
  }
  
  .question-chip {
    padding: 8px 14px;
    font-size: 13px;
    min-height: 36px;
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
  .question-chip {
    padding: 6px 12px;
    font-size: 12px;
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
    padding: 12px 20px;
  }
  
  .refresh-text {
    display: inline; /* 平板端显示文字 */
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
  
  .quick-questions-fixed.collapsed {
    padding: 8px 12px;
  }
  
  .quick-questions-fixed:not(.collapsed) {
    max-height: 200px;
  }
  
  .question-chip {
    padding: 6px 10px;
    min-height: 32px;
  }
}

/* ============= 错误提示横幅 ============= */
.error-banner {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  position: relative;
  z-index: 100;
}

.error-icon {
  flex-shrink: 0;
}

.error-text {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.error-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 24px;
  line-height: 1;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.error-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 滑动动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

/* ============= 移动端增强优化 ============= */

/* 安全区域适配 */
@supports (padding: max(0px)) {
  .chat-header {
    padding-top: max(16px, env(safe-area-inset-top));
  }

  .input-container {
    padding-bottom: max(20px, env(safe-area-inset-bottom));
  }
}

/* 移动端基础优化 */
@media (max-width: 768px) {
  .ai-chat-container {
    font-size: 15px;
  }

  .user-message .message-content,
  .assistant-message .message-content {
    padding: 12px 16px;
    font-size: 15px; /* 防止 iOS 自动缩放 */
    max-width: 85%;
  }

  .message-avatar {
    width: 36px;
    height: 36px;
  }

  .chat-header {
    padding: 12px 16px;
  }

  .model-details h3 {
    font-size: 16px;
  }

  .message-input {
    font-size: 16px; /* 防止 iOS 自动缩放 */
  }

  .input-border {
    padding: 10px 16px;
  }

  .send-btn {
    min-height: 44px; /* iOS 触摸标准 */
  }

  .question-chip {
    padding: 8px 14px;
    font-size: 13px;
  }

  /* 优化消息操作按钮 */
  .message-actions {
    gap: 6px;
  }

  .action-btn {
    padding: 6px 10px;
    font-size: 12px;
  }
}

/* 小屏手机优化 */
@media (max-width: 480px) {
  .user-message .message-content,
  .assistant-message .message-content {
    font-size: 14px;
    padding: 10px 14px;
  }

  .message-time {
    font-size: 11px;
  }

  .question-chip {
    padding: 6px 12px;
    font-size: 12px;
  }
}

/* 键盘弹出优化 */
@media (max-height: 600px) {
  .welcome-screen {
    display: none !important;
  }

  .quick-questions-fixed {
    max-height: 120px;
    overflow-y: auto;
  }

  .messages-container {
    max-height: calc(100vh - 200px);
  }

  .chat-header {
    padding: 10px 16px;
  }
}

/* 横屏优化 */
@media (orientation: landscape) and (max-height: 500px) {
  .chat-header {
    padding: 8px 16px;
  }

  .model-details h3 {
    font-size: 14px;
  }

  .quick-questions-fixed {
    display: none;
  }

  .welcome-screen {
    padding: 16px;
  }

  .welcome-content h2 {
    font-size: 20px;
  }
}

/* 触摸优化 */
@media (hover: none) {
  .user-message .message-content:active,
  .assistant-message .message-content:active {
    transform: scale(0.98);
  }

  .question-chip:active {
    transform: scale(0.95);
  }

  .send-btn:active {
    transform: scale(0.92);
  }
}
</style>