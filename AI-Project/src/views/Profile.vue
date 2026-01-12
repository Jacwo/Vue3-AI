<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

// 用户信息
const userInfo = ref<any>(null)

// 编辑模式
const isEditing = ref(false)
const editForm = ref({
  nickname: '',
  avatar: ''
})

// 加载用户信息
const loadUserInfo = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=/profile')
    return
  }

  if (userStore.userInfo) {
    userInfo.value = userStore.userInfo
    editForm.value = {
      nickname: userStore.userInfo.userName || '',
      avatar: userStore.userInfo.avatar || ''
    }
  } else {
    await userStore.fetchUserInfo()
    userInfo.value = userStore.userInfo
    if (userStore.userInfo) {
      editForm.value = {
        nickname: userStore.userInfo.userName || '',
        avatar: userStore.userInfo.avatar || ''
      }
    }
  }
}

// 进入编辑模式
const enterEditMode = () => {
  isEditing.value = true
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
  editForm.value = {
    nickname: userInfo.value?.nickname || '',
    avatar: userInfo.value?.avatar || ''
  }
}

// 保存修改
const saveEdit = async () => {
  try {
    const success = await userStore.updateUser(editForm.value)
    if (success) {
      isEditing.value = false
      await loadUserInfo()
    }
  } catch (error) {
    console.error('保存失败:', error)
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    // await ElMessageBox.confirm(
    //   '确定要退出登录吗？',
    //   '提示',
    //   {
    //     confirmButtonText: '确定',
    //     cancelButtonText: '取消',
    //     type: 'warning'
    //   }
    // )
    
    await userStore.logout()
    router.push('/login')
  } catch {
    // 用户取消
  }
}

// 加载数据
onMounted(() => {
  loadUserInfo()
})
</script>

<template>
  <div class="profile-container">
    <div class="profile-card">
      <!-- 头部 -->
      <div class="profile-header">
        <h2>个人中心</h2>
        <!-- <button v-if="!isEditing" @click="enterEditMode" class="edit-btn">
          编辑资料
        </button> -->
      </div>

      <!-- 用户信息 -->
      <div class="profile-content">
        <!-- 头像区域 -->
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <img 
              :src="isEditing ? editForm.avatar : (userInfo?.avatar || '/assets/logo.png')" 
              alt="头像"
              class="avatar"
            />
            <div v-if="isEditing" class="avatar-upload">
              <input type="text" v-model="editForm.avatar" placeholder="输入头像URL" class="avatar-input" />
            </div>
          </div>
        </div>

        <!-- 基本信息 -->
        <div class="info-section">
          <div class="info-item">
            <span class="info-label">手机号</span>
            <span class="info-value">{{ userInfo?.phone || '未设置' }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">昵称</span>
            <div v-if="!isEditing" class="info-value">{{ userInfo?.userName || '未设置' }}</div>
            <input v-else v-model="editForm.nickname" type="text" class="edit-input" placeholder="请输入昵称" />
          </div>

          <div class="info-item">
            <span class="info-label">注册时间</span>
            <span class="info-value">{{ userInfo?.createTime ? new Date(userInfo.createTime).toLocaleDateString() : '未知' }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">用户ID</span>
            <span class="info-value">{{ userInfo?.id || '未知' }}</span>
          </div>
        </div>

        <!-- 编辑按钮 -->
        <div v-if="isEditing" class="edit-buttons">
          <button @click="saveEdit" class="save-btn">保存修改</button>
          <button @click="cancelEdit" class="cancel-btn">取消</button>
        </div>

        <!-- 操作按钮 -->
        <div v-else class="action-buttons">
          <button @click="handleLogout" class="logout-btn">
            退出登录
          </button>
        </div>
      </div>
    </div>

    <!-- 功能卡片 -->
    <div class="feature-cards">
      <div class="feature-card">
        <div class="feature-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#667eea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3>我的分析记录</h3>
        <p>查看历史比赛分析记录</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#667eea" stroke-width="2"/>
            <path d="M19.4 15C17.8662 17.7503 15.043 19.5 12 19.5C8.95705 19.5 6.13375 17.7503 4.6 15C4.6 15 7.5 15 12 15C16.5 15 19.4 15 19.4 15Z" stroke="#667eea" stroke-width="2"/>
            <path d="M19.4 9C17.8662 6.24969 15.043 4.5 12 4.5C8.95705 4.5 6.13375 6.24969 4.6 9C4.6 9 7.5 9 12 9C16.5 9 19.4 9 19.4 9Z" stroke="#667eea" stroke-width="2"/>
          </svg>
        </div>
        <h3>AI对话历史</h3>
        <p>查看与AI助手的对话记录</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#667eea" stroke-width="2"/>
            <path d="M12 6V12L16 14" stroke="#667eea" stroke-width="2"/>
          </svg>
        </div>
        <h3>使用统计</h3>
        <p>查看您的使用情况统计</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.profile-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.profile-header h2 {
  color: #333;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.edit-btn {
  padding: 8px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.profile-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-section {
  margin-bottom: 30px;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.avatar-upload {
  position: absolute;
  bottom: 0;
  right: 0;
  background: white;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar-input {
  width: 200px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.info-section {
  width: 100%;
  max-width: 500px;
  margin-bottom: 30px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px 20px;
  background: #fafafa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.info-item:hover {
  background: #f5f5f5;
}

.info-label {
  min-width: 80px;
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.info-value {
  flex: 1;
  color: #333;
  font-size: 16px;
  font-weight: 500;
}

.edit-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.edit-input:focus {
  border-color: #667eea;
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.edit-buttons {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.save-btn, .cancel-btn {
  padding: 12px 30px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.save-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.cancel-btn {
  background: #f0f0f0;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
}

.action-buttons {
  margin-top: 30px;
}

.logout-btn {
  padding: 12px 40px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: #ff5252;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
}

/* 功能卡片 */
.feature-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.feature-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.feature-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-card h3 {
  color: #333;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
}

.feature-card p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 767px) {
  .profile-container {
    padding: 15px;
  }

  .profile-card {
    padding: 20px;
  }

  .profile-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .profile-header h2 {
    font-size: 20px;
  }

  .edit-btn {
    width: 100%;
  }

  .avatar {
    width: 100px;
    height: 100px;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .info-label {
    min-width: auto;
  }

  .edit-buttons {
    width: 100%;
  }

  .save-btn, .cancel-btn {
    flex: 1;
  }

  .feature-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 375px) {
  .profile-card {
    padding: 15px;
  }

  .edit-buttons {
    flex-direction: column;
  }
}
</style>