<template>
  <div class="user-list-container">
    <div class="page-header">
      <h1>用户列表</h1>
      <p class="total-text">共 {{ total }} 个用户</p>
    </div>

    <!-- 用户列表表格 -->
    <div class="table-section">
      <el-table
        :data="userList"
        stripe
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="phone" label="手机号" min-width="110" />
        <el-table-column prop="userName" label="用户名" min-width="120" />
        <el-table-column prop="point" label="积分" width="100" align="center" :formatter="pointFormatter" />
        <el-table-column prop="createTime" label="注册时间" min-width="160" :formatter="timeFormatter" />
        <el-table-column prop="signToday" label="签到" width="100" align="center" :formatter="signTodayFormatter" />
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleAddPoint(scope.row)">
              发放积分
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 发放积分对话框 -->
    <el-dialog v-model="pointDialogVisible" title="发放积分" width="400px">
      <el-form :model="pointForm" label-width="80px">
        <el-form-item label="用户">
          <span>{{ pointForm.userName }} ({{ pointForm.phone }})</span>
        </el-form-item>
        <el-form-item label="积分数">
          <el-input-number v-model="pointForm.point" :min="1" :max="10000" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pointDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmAddPoint" :loading="pointLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { userApi, type UserListItem } from '@/api/user'

// 数据
const userList = ref<UserListItem[]>([])
const loading = ref(false)
const total = ref(0)

// 发放积分相关
const pointDialogVisible = ref(false)
const pointLoading = ref(false)
const pointForm = ref({
  userId: '',
  phone: '',
  userName: '',
  point: 10
})

// 格式化积分
const pointFormatter = (row: UserListItem) => {
  return row.point || 0
}

// 格式化时间
const timeFormatter = (row: UserListItem) => {
  return new Date(row.createTime).toLocaleString('zh-CN')
}

// 格式化今日签到
const signTodayFormatter = (row: UserListItem) => {
  return row.signToday ? '✓ 已签到' : '未签到'
}

// 获取用户列表
const fetchUserList = async () => {
  loading.value = true
  try {
    const response = await userApi.getUserList({})

    userList.value = response || []
    total.value = response?.length || 0
  } catch (error: any) {
    ElMessage.error(error.message || '获取用户列表失败')
    userList.value = []
  } finally {
    loading.value = false
  }
}

// 打开发放积分对话框
const handleAddPoint = (row: UserListItem) => {
  pointForm.value = {
    userId: row.id,
    phone: row.phone,
    userName: row.userName,
    point: 10
  }
  pointDialogVisible.value = true
}

// 确认发放积分
const handleConfirmAddPoint = async () => {
  if (!pointForm.value.point || pointForm.value.point < 1) {
    ElMessage.error('请输入有效的积分数')
    return
  }

  pointLoading.value = true
  try {
    await userApi.addPoint({
      userId: pointForm.value.userId,
      point: pointForm.value.point
    })
    ElMessage.success(`成功发放 ${pointForm.value.point} 积分`)
    pointDialogVisible.value = false
    fetchUserList()
  } catch (error: any) {
    ElMessage.error(error.message || '发放积分失败')
  } finally {
    pointLoading.value = false
  }
}

// 初始化
onMounted(() => {
  fetchUserList()
})
</script>

<style scoped>
.user-list-container {
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
}

.total-text {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.table-section {
  background: white;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 768px) {
  .user-list-container {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .page-header h1 {
    font-size: 18px;
  }

  .table-section {
    overflow-x: auto;
  }

  .table-section :deep(.el-table) {
    min-width: 800px;
    font-size: 12px;
  }

  .table-section :deep(.el-table__cell) {
    padding: 8px 4px;
  }

  .table-section :deep(.el-button--link) {
    padding: 0;
  }
}

@media (max-width: 480px) {
  .user-list-container {
    padding: 8px;
  }

  .page-header h1 {
    font-size: 16px;
  }

  .table-section :deep(.el-table) {
    min-width: 600px;
    font-size: 11px;
  }

  .table-section :deep(.el-table__cell) {
    padding: 6px 2px;
  }
}
</style>
