import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

// 格式化比赛时间
export const formatMatchTime = (dateString: string, timeString: string): string => {
  if (!dateString || !timeString) return '时间未知'
  try {
    const dateTime = `${dateString} ${timeString}`
    return dayjs(dateTime).format('YYYY-MM-DD HH:mm')
  } catch (error) {
    console.error('格式化时间失败:', error)
    return `${dateString} ${timeString}`
  }
}

// 格式化显示时间
export const formatDisplayTime = (dateString: string, timeString: string): string => {
  if (!dateString || !timeString) return '时间未知'
  
  try {
    const dateTime = `${dateString} ${timeString}`
    const date = dayjs(dateTime)
    const now = dayjs()
    
    // 检查日期是否有效
    if (!date.isValid()) {
      return `${dateString} ${timeString}`
    }
    
    if (date.isSame(now, 'day')) {
      return `今天 ${timeString}`
    }
    
    if (date.isSame(now.add(1, 'day'), 'day')) {
      return `明天 ${timeString}`
    }
    
    if (date.isSame(now.add(2, 'day'), 'day')) {
      return `后天 ${timeString}`
    }
    
    return date.format('MM-DD HH:mm')
  } catch (error) {
    console.error('格式化显示时间失败:', error)
    return `${dateString} ${timeString}`
  }
}

// 检查比赛是否已开始
export const isMatchStarted = (dateString: string, timeString: string): boolean => {
  if (!dateString || !timeString) return false
  
  try {
    const matchTime = dayjs(`${dateString} ${timeString}`)
    if (!matchTime.isValid()) return false
    return dayjs().isAfter(matchTime)
  } catch (error) {
    console.error('检查比赛开始时间失败:', error)
    return false
  }
}

// 获取比赛倒计时
export const getMatchCountdown = (dateString: string, timeString: string): string => {
  if (!dateString || !timeString) return '时间未知'
  
  try {
    const matchTime = dayjs(`${dateString} ${timeString}`)
    if (!matchTime.isValid()) return '时间未知'
    
    const now = dayjs()
    const diffMinutes = matchTime.diff(now, 'minute')
    
    if (diffMinutes <= 0) {
      return '已开始'
    }
    
    if (diffMinutes < 60) {
      return `${diffMinutes}分钟后`
    }
    
    const diffHours = Math.floor(diffMinutes / 60)
    const remainingMinutes = diffMinutes % 60
    
    if (diffHours < 24) {
      return `${diffHours}小时${remainingMinutes > 0 ? `${remainingMinutes}分钟` : ''}后`
    }
    
    const diffDays = Math.floor(diffHours / 24)
    const remainingHours = diffHours % 24
    
    return `${diffDays}天${remainingHours > 0 ? `${remainingHours}小时` : ''}后`
  } catch (error) {
    console.error('计算倒计时失败:', error)
    return '时间未知'
  }
}