import type { Match } from '@/types/match'

// 赔率接口
export interface Odds {
  home: number | null
  draw: number | null
  away: number | null
}

// 检查赔率是否完整
export const isOddsComplete = (odds: Odds | null | undefined): boolean => {
  if (!odds) return false
  
  return odds.home !== null && 
    odds.draw !== null && 
    odds.away !== null
}

// 获取赔率字符串表示
export const getOddsString = (odds: Odds | null | undefined): string => {
  if (!isOddsComplete(odds)) return '赔率未公布'
  
  return `主胜:${odds!.home!.toFixed(2)} | 平:${odds!.draw!.toFixed(2)} | 客胜:${odds!.away!.toFixed(2)}`
}

// 计算赔率平均值
export const getAverageOdds = (odds: Odds | null | undefined): number | null => {
  if (!isOddsComplete(odds)) return null
  
  const home = odds!.home!
  const draw = odds!.draw!
  const away = odds!.away!
  
  return (home + draw + away) / 3
}

// 计算赔率差值（波动性）
export const getOddsVolatility = (odds: Odds | null | undefined): number | null => {
  if (!isOddsComplete(odds)) return null
  
  const avg = getAverageOdds(odds)!
  const home = odds!.home!
  const draw = odds!.draw!
  const away = odds!.away!
  
  const variance = ((home - avg) ** 2 + (draw - avg) ** 2 + (away - avg) ** 2) / 3
  return Math.sqrt(variance)
}

// 检查赔率是否异常（例如某个赔率明显过高或过低）
export const isOddsAbnormal = (odds: Odds | null | undefined): boolean => {
  if (!isOddsComplete(odds)) return false
  
  const home = odds!.home!
  const draw = odds!.draw!
  const away = odds!.away!
  
  // 检查是否有赔率超过10（可能异常）
  if (home > 10 || draw > 10 || away > 10) return true
  
  // 检查赔率是否太低（小于1.1）
  if (home < 1.1 || draw < 1.1 || away < 1.1) return true
  
  // 检查赔率差异是否过大
  const max = Math.max(home, draw, away)
  const min = Math.min(home, draw, away)
  
  return (max / min) > 5
}

// 获取最可能的结果（最低赔率）
export const getMostProbableResult = (odds: Odds | null | undefined): string | null => {
  if (!isOddsComplete(odds)) return null
  
  const home = odds!.home!
  const draw = odds!.draw!
  const away = odds!.away!
  
  if (home <= draw && home <= away) return 'home'
  if (draw <= home && draw <= away) return 'draw'
  return 'away'
}

// 将结果字符串转换为中文
export const getResultText = (result: string | null): string => {
  if (!result) return '未知'
  
  const resultMap: Record<string, string> = {
    'home': '主胜',
    'draw': '平局',
    'away': '客胜'
  }
  
  return resultMap[result] || result
}