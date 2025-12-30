import type { HistoryRecord } from '@/types/history'
import { formatDisplayTime, formatMatchTime } from './dateUtils'

// 解析比赛结果
export const parseMatchResult = (result: string): {
  homeScore: number
  awayScore: number
  winner: 'home' | 'away' | 'draw'
  resultText: string
  isDraw: boolean
  isHomeWin: boolean
  isAwayWin: boolean
} => {
  if (!result || !result.includes(':')) {
    return {
      homeScore: 0,
      awayScore: 0,
      winner: 'draw',
      resultText: '未结束',
      isDraw: true,
      isHomeWin: false,
      isAwayWin: false
    }
  }
  
  try {
    const [homeScoreStr, awayScoreStr] = result.split(':')
    const homeScore = parseInt(homeScoreStr.trim()) || 0
    const awayScore = parseInt(awayScoreStr.trim()) || 0
    
    let winner: 'home' | 'away' | 'draw' = 'draw'
    let resultText = ''
    
    if (homeScore > awayScore) {
      winner = 'home'
      resultText = `${homeScore}-${awayScore} 主胜`
    } else if (homeScore < awayScore) {
      winner = 'away'
      resultText = `${homeScore}-${awayScore} 客胜`
    } else {
      resultText = `${homeScore}-${awayScore} 平局`
    }
    
    return {
      homeScore,
      awayScore,
      winner,
      resultText,
      isDraw: winner === 'draw',
      isHomeWin: winner === 'home',
      isAwayWin: winner === 'away'
    }
  } catch (error) {
    console.error('解析比赛结果失败:', error, result)
    return {
      homeScore: 0,
      awayScore: 0,
      winner: 'draw',
      resultText: '解析失败',
      isDraw: true,
      isHomeWin: false,
      isAwayWin: false
    }
  }
}

// 从AI分析中提取预测结果
export const extractPredictionFromAI = (aiAnalysis: string): {
  prediction: 'home' | 'away' | 'draw' | null
  confidence: number
  probability?: {
    home: number
    draw: number
    away: number
  }
} => {
  if (!aiAnalysis) {
    return { prediction: null, confidence: 0 }
  }
  
  let prediction: 'home' | 'away' | 'draw' | null = null
  let confidence = 0
  
  // 简单关键词匹配
  const aiAnalysisLower = aiAnalysis.toLowerCase()
  
  // 检查主胜相关词
  if (aiAnalysisLower.includes('主胜') || 
      aiAnalysisLower.includes('主队胜') || 
      aiAnalysisLower.includes('主队赢') ||
      aiAnalysisLower.includes('home win')) {
    prediction = 'home'
  }
  // 检查客胜相关词
  else if (aiAnalysisLower.includes('客胜') || 
           aiAnalysisLower.includes('客队胜') || 
           aiAnalysisLower.includes('客队赢') ||
           aiAnalysisLower.includes('away win')) {
    prediction = 'away'
  }
  // 检查平局相关词
  else if (aiAnalysisLower.includes('平局') || 
           aiAnalysisLower.includes('打平') || 
           aiAnalysisLower.includes('平手') ||
           aiAnalysisLower.includes('draw')) {
    prediction = 'draw'
  }
  
  // 尝试提取置信度（从百分比）
  const confidenceMatch = aiAnalysis.match(/(\d+)%/g)
  if (confidenceMatch && confidenceMatch.length > 0) {
    const percentages = confidenceMatch.map(match => parseInt(match))
    confidence = Math.max(...percentages) / 100
  } else {
    // 如果没有明确的百分比，根据关键词判断置信度
    if (aiAnalysisLower.includes('高概率') || 
        aiAnalysisLower.includes('大概率') ||
        aiAnalysisLower.includes('非常可能')) {
      confidence = 0.8
    } else if (aiAnalysisLower.includes('可能') || 
               aiAnalysisLower.includes('有望')) {
      confidence = 0.6
    } else {
      confidence = 0.5
    }
  }
  
  return { prediction, confidence }
}

// 检查AI分析是否准确
export const checkAnalysisAccuracy = (record: HistoryRecord): {
  isCorrect: boolean
  aiPrediction: 'home' | 'away' | 'draw' | null
  actualResult: 'home' | 'away' | 'draw'
  confidence: number
  resultComparison: string
} => {
  const matchResult = parseMatchResult(record.matchResult)
  const { prediction: aiPrediction, confidence } = extractPredictionFromAI(record.aiAnalysis)
  
  const isCorrect = aiPrediction === matchResult.winner
  let resultComparison = ''
  
  if (aiPrediction === null) {
    resultComparison = 'AI未给出明确预测'
  } else if (isCorrect) {
    resultComparison = '✅ 预测正确'
  } else {
    resultComparison = '❌ 预测错误'
  }
  
  return {
    isCorrect,
    aiPrediction,
    actualResult: matchResult.winner,
    confidence,
    resultComparison
  }
}

// 格式化比赛时间
export const formatHistoryMatchTime = (matchTime: string | Date): string => {
  if (!matchTime) return '未知时间'
  
  try {
    if (typeof matchTime === 'string') {
      // 如果包含空格，说明已经有日期和时间
      if (matchTime.includes(' ')) {
        return formatDisplayTime(matchTime.split(' ')[0], matchTime.split(' ')[1] || '')
      }
      // 尝试解析为ISO字符串
      const date = new Date(matchTime)
      if (!isNaN(date.getTime())) {
        return date.toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    } else if (matchTime instanceof Date) {
      return matchTime.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    return String(matchTime)
  } catch (error) {
    console.error('格式化历史比赛时间失败:', error)
    return String(matchTime)
  }
}

// 获取赔率颜色
export const getHistoryOddsColor = (odds: string | null): string => {
  if (!odds) return '#999'
  
  const oddsNum = parseFloat(odds)
  if (isNaN(oddsNum)) return '#999'
  
  if (oddsNum < 1.5) return '#f5222d' // 红色 - 低赔率
  if (oddsNum < 2.5) return '#fa8c16' // 橙色 - 中等赔率
  if (oddsNum < 4.0) return '#52c41a' // 绿色 - 较高赔率
  return '#1890ff' // 蓝色 - 高赔率
}

// 过滤历史记录
export const filterHistoryRecords = (records: HistoryRecord[], filters: {
  teamName?: string
  startDate?: string
  endDate?: string
  resultType?: 'home' | 'away' | 'draw' | 'all'
  searchKeyword?: string
}): HistoryRecord[] => {
  return records.filter(record => {
    // 球队名称筛选
    if (filters.teamName) {
      const teamNameLower = filters.teamName.toLowerCase()
      if (!record.homeTeam.toLowerCase().includes(teamNameLower) && 
          !record.awayTeam.toLowerCase().includes(teamNameLower)) {
        return false
      }
    }
    
    // 日期范围筛选
    if (filters.startDate || filters.endDate) {
      const matchTime = new Date(record.matchTime)
      if (filters.startDate && matchTime < new Date(filters.startDate)) {
        return false
      }
      if (filters.endDate && matchTime > new Date(filters.endDate)) {
        return false
      }
    }
    
    // 结果类型筛选
    if (filters.resultType && filters.resultType !== 'all') {
      const result = parseMatchResult(record.matchResult)
      if (result.winner !== filters.resultType) {
        return false
      }
    }
    
    // 关键词搜索
    if (filters.searchKeyword) {
      const keyword = filters.searchKeyword.toLowerCase()
      const searchableText = `
        ${record.homeTeam}
        ${record.awayTeam}
        ${record.matchResult}
        ${record.aiAnalysis}
        ${record.afterMatchAnalysis}
      `.toLowerCase()
      
      if (!searchableText.includes(keyword)) {
        return false
      }
    }
    
    return true
  })
}

// 统计历史记录
export const calculateHistoryStats = (records: HistoryRecord[]): {
  total: number
  homeWins: number
  draws: number
  awayWins: number
  homeWinRate: number
  drawRate: number
  awayWinRate: number
  avgHomeGoals: number
  avgAwayGoals: number
  aiAccuracy: number
} => {
  if (records.length === 0) {
    return {
      total: 0,
      homeWins: 0,
      draws: 0,
      awayWins: 0,
      homeWinRate: 0,
      drawRate: 0,
      awayWinRate: 0,
      avgHomeGoals: 0,
      avgAwayGoals: 0,
      aiAccuracy: 0
    }
  }
  
  let homeWins = 0
  let draws = 0
  let awayWins = 0
  let totalHomeGoals = 0
  let totalAwayGoals = 0
  let correctPredictions = 0
  
  records.forEach(record => {
    const result = parseMatchResult(record.matchResult)
    
    if (result.isHomeWin) homeWins++
    else if (result.isAwayWin) awayWins++
    else draws++
    
    totalHomeGoals += result.homeScore
    totalAwayGoals += result.awayScore
    
    // 检查AI预测准确性
    const accuracy = checkAnalysisAccuracy(record)
    if (accuracy.isCorrect) correctPredictions++
  })
  
  const total = records.length
  const homeWinRate = (homeWins / total) * 100
  const drawRate = (draws / total) * 100
  const awayWinRate = (awayWins / total) * 100
  const avgHomeGoals = totalHomeGoals / total
  const avgAwayGoals = totalAwayGoals / total
  const aiAccuracy = (correctPredictions / total) * 100
  
  return {
    total,
    homeWins,
    draws,
    awayWins,
    homeWinRate,
    drawRate,
    awayWinRate,
    avgHomeGoals,
    avgAwayGoals,
    aiAccuracy
  }
}