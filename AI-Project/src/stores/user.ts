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
            const response = await userApi.getUserInfo()
            userInfo.value = response.data
            localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
            return true
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