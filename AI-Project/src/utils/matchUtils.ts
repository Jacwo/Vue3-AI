import type { Match } from '@/types/match'

// 获取比赛状态文本
export const getMatchStatusText = (status: string | undefined): string => {
  if (!status) return '未知状态'
  
  const statusMap: Record<string, string> = {
    '1': '待开售',
    '2': '已开售',
    '3': '已截止',
    '4': '进行中',
    '5': '已结束',
    '6': '已取消',
  }
  return statusMap[status] || status
}

// 检查比赛是否可分析（已开售且赔率不为空）
export const isMatchAnalyzable = (match: Match): boolean => {
  if (!match) {
    console.warn('isMatchAnalyzable: match为undefined或null')
    return false
  }
  
  // 首先检查比赛状态
  const isOpen = match.status === '2'
  if (!isOpen) {
    console.log(`比赛 ${match.id} 未开售，状态为: ${match.status}`)
    return false
  }
  
  // 检查 odds 对象是否存在
  if (!match.odds) {
    console.log(`比赛 ${match.id} 没有odds对象`)
    return false
  }
  
  // 检查每个赔率值是否都不为null
  const hasOdds = 
    match.odds.home !== null && 
    match.odds.draw !== null && 
    match.odds.away !== null
  
  if (!hasOdds) {
    console.log(`比赛 ${match.id} 赔率不完整:`, match.odds)
  }
  
  return hasOdds
}

// 格式化赔率显示
export const formatOdds = (odds: number | null | undefined): string => {
  if (odds === null || odds === undefined) return '-'
  return odds.toFixed(2)
}

// 获取赔率颜色（根据值大小）
export const getOddsColor = (odds: number | null | undefined): string => {
  if (odds === null || odds === undefined) return '#999'
  
  if (odds < 1.5) return '#f5222d' // 红色 - 低赔率
  if (odds < 2.5) return '#fa8c16' // 橙色 - 中等赔率
  if (odds < 4.0) return '#52c41a' // 绿色 - 较高赔率
  return '#1890ff' // 蓝色 - 高赔率
}

// 检查比赛是否有赔率（比isMatchAnalyzable宽松，不要求状态为已开售）
export const hasOdds = (match: Match): boolean => {
  if (!match || !match.odds) return false
  
  return match.odds.home !== null && 
    match.odds.draw !== null && 
    match.odds.away !== null
}

// 获取比赛建议颜色（根据赔率）
export const getMatchSuggestionColor = (match: Match): string => {
  if (!hasOdds(match)) return '#999'
  
  const { home, draw, away } = match.odds
  
  // 找出最低赔率
  const minOdds = Math.min(home || Infinity, draw || Infinity, away || Infinity)
  
  // 根据最低赔率判断
  if (minOdds < 1.3) return '#ff4d4f' // 极低赔率，高风险
  if (minOdds < 1.8) return '#fa8c16' // 低赔率，中高风险
  if (minOdds < 2.5) return '#52c41a' // 中等赔率，中低风险
  return '#1890ff' // 高赔率，高风险高回报
}