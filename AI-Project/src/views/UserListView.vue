<template>
  <div class="user-list-container">
    <div class="page-header">
      <h1>用户列表</h1>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <el-input
        v-model="searchQuery"
        placeholder="搜索用户名或手机号"
        clearable
        style="width: 200px"
      />
      <el-select
        v-model="statusFilter"
        placeholder="筛选状态"
        clearable
        style="width: 150px; margin-left: 10px"
      >
        <el-option label="全部" value="" />
        <el-option label="活跃" value="active" />
        <el-option label="禁用" value="disabled" />
      </el-select>
      <el-button type="primary" @click="handleSearch" style="margin-left: 10px">搜索</el-button>
      <el-button @click="handleReset" style="margin-left: 5px">重置</el-button>
    </div>

    <!-- 用户列表表格 -->
    <div class="table-section">
      <el-table
        :data="userList"
        stripe
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="id" label="用户ID" width="180" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="userName" label="用户名" width="120" />
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            {{ row.gender === 0 ? '女' : row.gender === 1 ? '男' : '未知' }}
          </template>
        </el-table-column>
        <el-table-column prop="point" label="积分" width="100" />
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '活跃' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="signToday" label="今日签到" width="100">
          <template #default="{ row }">
            <el-tag :type="row.signToday ? 'success' : 'info'">
              {{ row.signToday ? '已签到' : '未签到' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isAdmin" label="管理员" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isAdmin ? 'danger' : 'info'">
              {{ row.isAdmin ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-section">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { userApi, type UserListItem } from '@/api/user'

// 数据
const userList = ref<UserListItem[]>([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 格式化时间
const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN')
}

// 获取用户列表
const fetchUserList = async () => {
  loading.value = true
  try {
    const response = await userApi.getUserList({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      search: searchQuery.value,
      status: statusFilter.value
    })

    userList.value = response.data
    total.value = response.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchUserList()
}

// 重置
const handleReset = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  currentPage.value = 1
  fetchUserList()
}

// 分页变化
const handlePageChange = () => {
  fetchUserList()
}

// 初始化
onMounted(() => {
  fetchUserList()
})
</script>

<style scoped>
.user-list-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
}

.search-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.table-section {
  margin-bottom: 20px;
  background: white;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.pagination-section {
  display: flex;
  justify-content: center;
  padding: 15px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .user-list-container {
    padding: 10px;
  }

  .search-section {
    flex-direction: column;
    align-items: stretch;
  }

  .search-section :deep(.el-input),
  .search-section :deep(.el-select),
  .search-section :deep(.el-button) {
    width: 100%;
  }

  .page-header h1 {
    font-size: 18px;
  }
}
</style>
