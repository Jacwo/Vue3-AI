import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi, type UserInfo } from '@/api/user'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
    // 状态
    const token = ref<string>('')
    const userInfo = ref<UserInfo | null>(null)
    const isLoggedIn = computed(() => !!token.value)

    // 从 localStorage 恢复状态
    const initFromStorage = () => {
        const savedToken = localStorage.getItem('token')
        const savedUserInfo = localStorage.getItem('userInfo')

        if (savedToken) {
            token.value = savedToken
        }

        if (savedUserInfo) {
            userInfo.value = JSON.parse(savedUserInfo)
        }
    }

    // 发送验证码
    const sendSms = async (phone: string): Promise<boolean> => {

        const response = await userApi.sendSms({ phone })

        if(response){
            return true;
        }
        return false

    }

    // 登录
    const login = async (phone: string, code: string): Promise<boolean> => {

        const response = await userApi.login({ phone, code }) as any
        console.log(response)
        // 响应拦截器已经返回了 data
        token.value = response.token
        userInfo.value = response.userInfo

        // 保存到 localStorage
        localStorage.setItem('token', token.value)
        localStorage.setItem('userInfo', JSON.stringify(userInfo.value))

        // 如果登录响应里没有 vipExpireTime/isVip,主动拉一次完整用户信息(iOS Safari 等场景下避免断章)
        const baseInfo: any = response.userInfo || {}
        if (baseInfo.vipExpireTime === undefined || baseInfo.isVip === undefined) {
            // 异步刷新,不阻塞登录返回
            fetchUserInfo().catch(() => { /* 静默失败 */ })
        }

        ElMessage.success('登录成功')
        return true

    }

    // 退出登录
    const logout = async (): Promise<boolean> => {
        try {
            await userApi.logout()
        } catch (error) {
            // 即使API失败也清除本地状态
        } finally {
            // 清除本地状态
            token.value = ''
            userInfo.value = null
            localStorage.removeItem('token')
            localStorage.removeItem('userInfo')
            ElMessage.success('已退出登录')
        }
        return true
    }

    // 获取用户信息
    const fetchUserInfo = async (): Promise<boolean> => {
        try {
            const response = await userApi.getUserInfo() as any
            // 兼容两种响应结构:
            //   1) 拦截器已 unwrap -> 直接是 UserInfo
            //   2) 后端直接返回 UserInfo -> 同上
            //   3) 旧结构 { data: UserInfo } -> 兜底取 .data
            const data = response?.data && typeof response.data === 'object' && !('token' in response.data)
                ? response.data
                : response
            if (data && typeof data === 'object' && (data as any).id !== undefined) {
                userInfo.value = data
                localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
                return true
            }
            return false
        } catch (error) {
            return false
        }
    }

    // 更新用户信息
    const updateUser = async (data: Partial<UserInfo>): Promise<boolean> => {
        try {
            const response = await userApi.updateUserInfo(data)
            userInfo.value = { ...userInfo.value, ...response.data } as UserInfo
            localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
            ElMessage.success('更新成功')
            return true
        } catch (error: any) {
            ElMessage.error(error.response?.data?.message || '更新失败')
            return false
        }
    }

    return {
        token,
        userInfo,
        isLoggedIn,
        initFromStorage,
        sendSms,
        login,
        logout,
        fetchUserInfo,
        updateUser
    }
})