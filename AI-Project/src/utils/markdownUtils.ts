import MarkdownIt from 'markdown-it'
import type { MarkdownItOptions } from 'markdown-it'

// 创建 Markdown 渲染器实例
const createMarkdownRenderer = (options?: MarkdownItOptions) => {
  const md = new MarkdownIt({
    html: true,        // 允许 HTML 标签
    linkify: true,     // 自动链接 URL
    typographer: true, // 印刷样式替换
    breaks: true,      // 将换行符转换为 <br>
    ...options
  })
  
  return md
}

// 默认渲染器
const defaultRenderer = createMarkdownRenderer()

// 渲染 Markdown 到 HTML
export const renderMarkdown = (markdown: string): string => {
  if (!markdown) return ''
  return defaultRenderer.render(markdown)
}

// 清理和格式化 Markdown 内容
export const cleanMarkdownContent = (content: string): string => {
  if (!content) return ''
  
  // 移除多余的空行和空格
  return content
    .replace(/\n\s*\n\s*\n/g, '\n\n')  // 将多个空行压缩为两个空行
    .trim()
}

// 从 Markdown 中提取摘要
export const extractSummary = (markdown: string, maxLength: number = 200): string => {
  if (!markdown) return ''
  
  // 移除 Markdown 语法和标签
  const plainText = markdown
    .replace(/[#*`]/g, '')  // 移除标题标记、强调和代码标记
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // 移除链接，保留文本
    .replace(/\n/g, ' ')  // 将换行符替换为空格
    .trim()
  
  // 截取指定长度
  if (plainText.length <= maxLength) return plainText
  return plainText.substring(0, maxLength) + '...'
}

// 解析比赛分析的 Markdown 内容，提取结构化信息
export interface ParsedAnalysis {
  summary: string
  prediction?: string
  confidence?: number
  keyPoints: string[]
  recommendations: string[]
  fullContent: string
}

export const parseAnalysisMarkdown = (markdown: string): ParsedAnalysis => {
  const result: ParsedAnalysis = {
    summary: '',
    keyPoints: [],
    recommendations: [],
    fullContent: markdown
  }
  
  if (!markdown) return result
  
  try {
    // 提取预测信息
    const predictionMatch = markdown.match(/预测比分.*?(\d+-\d+)/)
    if (predictionMatch) {
      result.prediction = predictionMatch[1]
    }
    
    // 提取置信度/概率
    const confidenceMatch = markdown.match(/(\d+)%/)
    if (confidenceMatch) {
      result.confidence = parseInt(confidenceMatch[1]) / 100
    }
    
    // 提取关键点（从列表或标题中）
    const lines = markdown.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // 提取关键因素
      if (line.includes('关键因素') || line.includes('关键点') || line.includes('分析')) {
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j].trim()
          if (nextLine && (nextLine.startsWith('-') || nextLine.startsWith('*') || nextLine.match(/^\d+\./))) {
            const cleanLine = nextLine.replace(/^[-*]\s*|\d+\.\s*/, '').trim()
            if (cleanLine) result.keyPoints.push(cleanLine)
          }
        }
      }
      
      // 提取推荐
      if (line.includes('推荐') || line.includes('建议') || line.includes('结论')) {
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j].trim()
          if (nextLine && (nextLine.startsWith('-') || nextLine.startsWith('*') || nextLine.match(/^\d+\./))) {
            const cleanLine = nextLine.replace(/^[-*]\s*|\d+\.\s*/, '').trim()
            if (cleanLine) result.recommendations.push(cleanLine)
          }
        }
      }
    }
    
    // 生成摘要
    result.summary = extractSummary(markdown)
    
  } catch (error) {
    console.error('解析 Markdown 分析内容失败:', error)
  }
  
  return result
}

// 导出所有函数
export default {
  createMarkdownRenderer,
  renderMarkdown,
  cleanMarkdownContent,
  extractSummary,
  parseAnalysisMarkdown
}