// api/streamApi.ts
import apiClient from './index'
import type { CustomRequestConfig } from './index'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  stream?: boolean
  deepThinking?: boolean
  temperature?: number
  maxTokens?: number
}

// 打字机流式响应类型
export interface StreamResponse {
  content: string
  is_end?: boolean
  error?: string
  [key: string]: any
}

// 流式聊天 API - 专为打字机效果设计
export const streamChat = async (
  requestData: ChatRequest,
  onData: (content: string) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
): Promise<() => void> => {
  const controller = new AbortController()
  const signal = controller.signal

  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // 构建完整的 URL，注意 baseURL 已经在 apiClient 中设置
    const baseURL = apiClient.defaults.baseURL || ''
    const url = `${baseURL}/api/stream/chat`

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...requestData,
        stream: true,
      }),
      signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    if (!response.body) {
      throw new Error('No response body')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let accumulatedText = ''

    const processChunk = async () => {
      try {
        const { done, value } = await reader.read()
        
        if (done) {
          // 确保所有缓冲数据都被处理
          if (buffer.trim()) {
            const lines = buffer.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ') && line.trim() !== 'data: ') {
                const dataStr = line.slice(6).trim()
                if (dataStr && dataStr !== '[DONE]') {
                  accumulatedText += dataStr
                  onData(dataStr) // 发送最后一个片段
                }
              }
            }
          }
          
          onComplete?.()
          return
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim() === '') continue
          
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim()
            
            // 检查是否结束
            if (dataStr === '[DONE]') {
              onComplete?.()
              return
            }
            
            // 处理数据（假设后端返回的是纯文本内容）
            if (dataStr) {
              accumulatedText += dataStr
              onData(dataStr) // 实时发送每个字符/词汇
            }
          }
        }

        // 继续读取下一个 chunk
        processChunk()
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Stream aborted')
          return
        }
        onError?.(error as Error)
      }
    }

    processChunk()

    // 返回中止函数
    return () => {
      controller.abort()
      reader?.releaseLock()
    }
  } catch (error) {
    onError?.(error as Error)
    throw error
  }
}

// 简化版本 - 只处理纯文本流
export const streamChatSimple = async (
  requestData: ChatRequest,
  onData: (text: string) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
): Promise<() => void> => {
  const controller = new AbortController()
  
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const baseURL = apiClient.defaults.baseURL || ''
    const response = await fetch(`${baseURL}/api/stream/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...requestData,
        stream: true,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    if (!response.body) {
      throw new Error('No response body')
    }

    const reader = response.body.getReader()
    // 使用正确的 UTF-8 解码器
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let incompleteLine = ''

    const readStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            console.log('Stream finished, remaining buffer:', buffer)
            
            // 处理剩余缓冲区
            if (buffer.trim()) {
              const lines = buffer.split('\n')
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const text = line.slice(6).trim()
                  if (text === '[DONE]') {
                    continue
                  }
                  if (text) {
                    onData(text)
                  }
                }
              }
            }
            
            // 处理不完整的行
            if (incompleteLine && incompleteLine.startsWith('data: ')) {
              const text = incompleteLine.slice(6).trim()
              if (text && text !== '[DONE]') {
                onData(text)
              }
            }
            
            onComplete?.()
            break
          }

          // 解码数据，确保使用正确的编码
          const chunkText = decoder.decode(value, { stream: true })
          console.log('Received chunk:', chunkText, 'raw bytes:', value)
          
          buffer += chunkText
          
          // 按行分割，但要小心可能跨chunk的断行
          const lines = buffer.split('\n')
          
          // 保留最后一行（可能不完整）
          buffer = lines.pop() || ''
          
          // 处理完整的行
          for (const line of lines) {
            if (line.trim() === '') continue
            
            if (line.startsWith('data: ')) {
              const text = line.slice(6).trim()
              
              if (text === '[DONE]') {
                onComplete?.()
                return
              }
              
              if (text) {
                console.log('Processing text:', text, 'length:', text.length, 'char code:', text.charCodeAt(0))
                onData(text)
              }
            }
          }
        }
      } catch (error) {
        console.error('Stream read error:', error)
        if (error.name !== 'AbortError') {
          onError?.(error as Error)
        }
      } finally {
        reader.releaseLock()
      }
    }

    readStream()

    return () => {
      controller.abort()
      // 确保释放 reader
      if (reader) {
        reader.releaseLock()
      }
    }
  } catch (error) {
    console.error('Stream request error:', error)
    onError?.(error as Error)
    throw error
  }
}


// 在 streamApi.ts 中添加这个函数
export const streamChatSSE = async (
  requestData: ChatRequest,
  onData: (text: string) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
): Promise<() => void> => {
  const controller = new AbortController()
  
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const baseURL = apiClient.defaults.baseURL || ''
    const response = await fetch(`${baseURL}/api/stream/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...requestData,
        stream: true,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    if (!response.body) {
      throw new Error('No response body')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    
    const readStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            // 处理剩余的缓冲数据
            if (buffer.trim()) {
              const lines = buffer.split('\n')
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const text = line.slice(6).trim()
                  if (text && text !== '[DONE]') {
                    onData(text)
                  }
                }
              }
            }
            onComplete?.()
            break
          }

          // 解码并处理数据
          const chunk = decoder.decode(value)
          console.log('Raw chunk received:', chunk)
          
          buffer += chunk
          
          // 按行处理完整的事件
          const lines = buffer.split('\n')
          
          // 保持最后一行（可能不完整）在缓冲区中
          buffer = lines.pop() || ''
          
          for (const line of lines) {
            if (line.trim() === '') continue
            
            if (line.startsWith('data: ')) {
              const text = line.slice(6).trim()
              
              if (text === '[DONE]') {
                onComplete?.()
                return
              }
              
              if (text) {
                console.log('SSE event text:', text, 'length:', text.length)
                onData(text)
              }
            }
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('SSE stream error:', error)
          onError?.(error as Error)
        }
      } finally {
        reader.releaseLock()
      }
    }

    readStream()

    return () => {
      controller.abort()
      if (reader) {
        reader.releaseLock()
      }
    }
  } catch (error) {
    console.error('Stream request error:', error)
    onError?.(error as Error)
    throw error
  }
}

// 备选方案：直接处理文本流
export const streamChatText = async (
  requestData: ChatRequest,
  onData: (text: string) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
): Promise<() => void> => {
  const controller = new AbortController()
  
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const baseURL = apiClient.defaults.baseURL || ''
    const response = await fetch(`${baseURL}/api/stream/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...requestData,
        stream: true,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    if (!response.body) {
      throw new Error('No response body')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let accumulatedText = ''
    let inDataSection = false

    const readStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            if (accumulatedText) {
              onData(accumulatedText)
            }
            onComplete?.()
            break
          }

          // 解码数据
          const chunk = decoder.decode(value, { stream: true })
          accumulatedText += chunk
          
          // 尝试提取数据部分
          const lines = accumulatedText.split('\n')
          accumulatedText = lines.pop() || ''
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]') {
                onComplete?.()
                return
              }
              if (data) {
                onData(data)
              }
            }
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Text stream error:', error)
          onError?.(error as Error)
        }
      } finally {
        reader.releaseLock()
      }
    }

    readStream()

    return () => {
      controller.abort()
    }
  } catch (error) {
    onError?.(error as Error)
    throw error
  }
}

// 非流式聊天 API（备用）
export const chat = async (requestData: ChatRequest, config?: CustomRequestConfig) => {
  return apiClient.post('/api/chat', {
    ...requestData,
    stream: false,
  }, {
    showLoading: true,
    ...config,
  })
}

// 获取对话历史
export const getChatHistory = async (chatId?: string, config?: CustomRequestConfig) => {
  const params = chatId ? { chatId } : {}
  return apiClient.get('/api/chat/history', { params, ...config })
}

// 保存对话
export const saveChat = async (
  messages: ChatMessage[], 
  title?: string, 
  config?: CustomRequestConfig
) => {
  return apiClient.post('/api/chat/save', { messages, title }, config)
}

// 删除对话
export const deleteChat = async (chatId: string, config?: CustomRequestConfig) => {
  return apiClient.delete(`/api/chat/${chatId}`, config)
}

export default {
  streamChat,
  streamChatSimple,
  chat,
  getChatHistory,
  saveChat,
  deleteChat,
}