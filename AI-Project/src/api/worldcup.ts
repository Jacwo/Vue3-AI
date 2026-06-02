import apiClient from './index'
import type { CustomRequestConfig } from './index'

// 接口返回的单条分组记录
export interface GroupTeamItem {
  id: number
  groupName: string
  teamRank: number
  teamName: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  createTime: string
  updateTime: string
}

// 前端使用的分组数据格式: { 'A组': ['墨西哥', '加拿大', ...], ... }
export type WorldCupGroupsMap = Record<string, string[]>

export const worldcupApi = {
  /** 获取世界杯分组数据，返回按组名归并的 Record<string, string[]> */
  async getGroups(config?: CustomRequestConfig): Promise<WorldCupGroupsMap> {
    const list = await apiClient.get<GroupTeamItem[]>('/api/worldcup/groups', config) as unknown as GroupTeamItem[]
    const result: WorldCupGroupsMap = {}
    for (const item of list) {
      const arr = result[item.groupName]
      if (arr) {
        arr.push(item.teamName)
      } else {
        result[item.groupName] = [item.teamName]
      }
    }
    return result
  }
}
