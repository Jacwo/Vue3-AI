<template>
  <div class="user-list-container">
    <div class="page-header">
      <h1>用户管理</h1>
    </div>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="user-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="全部用户" name="all">
        <template #label>
          <span class="tab-label">
            <el-icon><User /></el-icon>
            全部用户
            <el-badge :value="total" :max="999" class="tab-badge" />
          </span>
        </template>
      </el-tab-pane>
      <el-tab-pane label="在线用户" name="online">
        <template #label>
          <span class="tab-label">
            <el-icon><Connection /></el-icon>
            在线用户
            <el-badge :value="onlineCount" :max="999" class="tab-badge" type="success" />
          </span>
        </template>
      </el-tab-pane>
    </el-tabs>

    <!-- 全部用户 - PC 表格 -->
    <div v-if="activeTab === 'all'" class="content-section">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名 / 手机号"
          clearable
          :prefix-icon="Search"
          class="search-input"
          @input="handleSearch"
        />
        <el-checkbox v-model="todayOnly" @change="handleSearch" class="today-check">
          仅看今日注册
        </el-checkbox>
        <span class="filter-count">找到 {{ filteredUserList.length }} 个用户</span>
      </div>

      <!-- PC 端表格 -->
      <div class="table-section pc-only">
        <el-table :data="filteredUserList" stripe style="width: 100%" v-loading="loading" empty-text="暂无匹配用户">
          <el-table-column prop="phone" label="手机号" min-width="120" />
          <el-table-column prop="userName" label="用户名" min-width="100" />
          <el-table-column prop="point" label="积分" width="90" align="center" :formatter="pointFormatter" />
          <el-table-column prop="createTime" label="注册时间" min-width="160" :formatter="timeFormatter" />
          <el-table-column prop="signToday" label="签到" width="90" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.signToday" type="success" size="small" effect="plain">已签到</el-tag>
              <el-tag v-else type="info" size="small" effect="plain">未签到</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="isVip" label="VIP" width="70" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.isVip" type="warning" size="small" effect="dark">VIP</el-tag>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="vipExpireTime" label="VIP到期" min-width="150">
            <template #default="scope">
              <span v-if="scope.row.isVip">{{ formatTime(scope.row.vipExpireTime) }}</span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" align="center" fixed="right">
            <template #default="scope">
              <el-button link type="primary" size="small" @click="handleAddPoint(scope.row)">发放积分</el-button>
              <el-button link type="success" size="small" @click="handleOpenVip(scope.row)">开通会员</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 移动端卡片 -->
      <div class="mobile-cards mobile-only" v-loading="loading">
        <div v-if="filteredUserList.length === 0" class="empty-state">暂无匹配用户</div>
        <div v-for="user in filteredUserList" :key="user.id" class="user-card">
          <div class="card-header">
            <div class="card-avatar">{{ (user.userName || user.phone).charAt(0) }}</div>
            <div class="card-user-info">
              <div class="card-name">
                {{ user.userName || '未设置' }}
                <el-tag v-if="user.isVip" type="warning" size="small" effect="dark" class="vip-tag-inline">VIP</el-tag>
              </div>
              <div class="card-phone">{{ user.phone }}</div>
            </div>
            <div class="card-status">
              <el-tag v-if="user.signToday" type="success" size="small" effect="plain" round>已签到</el-tag>
              <el-tag v-else type="info" size="small" effect="plain" round>未签到</el-tag>
            </div>
          </div>
          <div class="card-body">
            <div class="card-meta">
              <div class="meta-item">
                <span class="meta-label">积分</span>
                <span class="meta-value highlight">{{ user.point || 0 }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">注册时间</span>
                <span class="meta-value">{{ formatTime(user.createTime) }}</span>
              </div>
              <div class="meta-item" v-if="user.isVip">
                <span class="meta-label">VIP到期</span>
                <span class="meta-value">{{ formatTime(user.vipExpireTime) }}</span>
              </div>
            </div>
          </div>
          <div class="card-actions">
            <el-button type="primary" size="small" plain round @click="handleAddPoint(user)">发放积分</el-button>
            <el-button type="success" size="small" plain round @click="handleOpenVip(user)">开通会员</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 在线用户 -->
    <div v-if="activeTab === 'online'" class="content-section">
      <!-- PC 端表格 -->
      <div class="table-section pc-only">
        <el-table :data="onlineUserList" stripe style="width: 100%" v-loading="onlineLoading" empty-text="暂无在线用户">
          <el-table-column prop="userName" label="用户名" min-width="120" />
          <el-table-column prop="phone" label="手机号" min-width="120" />
          <el-table-column prop="lastAccessTime" label="最近活跃" min-width="160" :formatter="onlineTimeFormatter" />
          <el-table-column label="操作" width="160" align="center">
            <template #default="scope">
              <el-button link type="primary" size="small" @click="handleAddPointOnline(scope.row)">发放积分</el-button>
              <el-button link type="success" size="small" @click="handleOpenVipOnline(scope.row)">开通会员</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 移动端卡片 -->
      <div class="mobile-cards mobile-only" v-loading="onlineLoading">
        <div v-if="onlineUserList.length === 0" class="empty-state">暂无在线用户</div>
        <div v-for="user in onlineUserList" :key="user.userId" class="user-card online-card">
          <div class="card-header">
            <div class="card-avatar online-avatar">{{ (user.userName || user.phone).charAt(0) }}</div>
            <div class="card-user-info">
              <div class="card-name">{{ user.userName || '未设置' }}</div>
              <div class="card-phone">{{ user.phone }}</div>
            </div>
            <div class="online-dot" title="在线">
              <span class="dot"></span>
              在线
            </div>
          </div>
          <div class="card-body">
            <div class="card-meta">
              <div class="meta-item">
                <span class="meta-label">最近活跃</span>
                <span class="meta-value">{{ formatTime(user.lastAccessTime) }}</span>
              </div>
            </div>
          </div>
          <div class="card-actions">
            <el-button type="primary" size="small" plain round @click="handleAddPointOnline(user)">发放积分</el-button>
            <el-button type="success" size="small" plain round @click="handleOpenVipOnline(user)">开通会员</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 发放积分对话框 -->
    <el-dialog v-model="pointDialogVisible" title="发放积分" :width="isMobile ? '90%' : '400px'" :close-on-click-modal="false">
      <el-form :model="pointForm" label-width="70px">
        <el-form-item label="用户">
          <span class="dialog-user-info">{{ pointForm.userName }} ({{ pointForm.phone }})</span>
        </el-form-item>
        <el-form-item label="积分数">
          <el-input-number v-model="pointForm.point" :min="1" :max="10000" controls-position="right" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pointDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmAddPoint" :loading="pointLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 开通会员对话框 -->
    <el-dialog v-model="vipDialogVisible" title="开通会员" :width="isMobile ? '90%' : '400px'" :close-on-click-modal="false">
      <el-form :model="vipForm" label-width="80px">
        <el-form-item label="用户">
          <span class="dialog-user-info">{{ vipForm.userName }} ({{ vipForm.phone }})</span>
        </el-form-item>
        <el-form-item label="会员类型">
          <el-radio-group v-model="vipForm.vipType">
            <el-radio-button :value="1">月卡</el-radio-button>
            <el-radio-button :value="2">年卡</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="vipDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmOpenVip" :loading="vipLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Connection, Search } from '@element-plus/icons-vue'
import { userApi, type UserListItem, type OnlineUser } from '@/api/user'

// 响应式判断
const isMobile = computed(() => window.innerWidth < 768)

// 当前 Tab
const activeTab = ref('all')

// 全部用户数据
const allUserList = ref<UserListItem[]>([])
const loading = ref(false)
const total = ref(0)

// 搜索相关
const searchKeyword = ref('')
const todayOnly = ref(false)

// 今日日期字符串
const getTodayStr = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// 过滤后的用户列表
const filteredUserList = computed(() => {
  let list = allUserList.value

  // 仅看今日注册
  if (todayOnly.value) {
    const today = getTodayStr()
    list = list.filter(u => {
      const d = new Date(u.createTime)
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return ds === today
    })
  }

  // 关键词搜索（用户名 / 手机号）
  const kw = searchKeyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(u =>
      (u.userName || '').toLowerCase().includes(kw) ||
      (u.phone || '').includes(kw)
    )
  }

  return list
})

// 在线用户数据
const onlineUserList = ref<OnlineUser[]>([])
const onlineLoading = ref(false)
const onlineCount = ref(0)

// 发放积分相关
const pointDialogVisible = ref(false)
const pointLoading = ref(false)
const pointForm = ref({
  userId: '',
  phone: '',
  userName: '',
  point: 10
})

// 开通会员相关
const vipDialogVisible = ref(false)
const vipLoading = ref(false)
const vipForm = ref({
  userId: '',
  phone: '',
  userName: '',
  vipType: 1
})

// 格式化积分
const pointFormatter = (row: UserListItem) => {
  return row.point || 0
}

// 格式化时间
const timeFormatter = (row: UserListItem) => {
  return new Date(row.createTime).toLocaleString('zh-CN')
}

// 格式化在线用户时间
const onlineTimeFormatter = (row: OnlineUser) => {
  return new Date(row.lastAccessTime).toLocaleString('zh-CN')
}

// 格式化时间（通用）
const formatTime = (time: string | number) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

// 获取全部用户列表
const fetchUserList = async () => {
  loading.value = true
  try {
    const response = await userApi.getUserList({})
    allUserList.value = response || []
    total.value = response?.length || 0
  } catch (error: any) {
    ElMessage.error(error.message || '获取用户列表失败')
    allUserList.value = []
  } finally {
    loading.value = false
  }
}

// 获取在线用户列表
const fetchOnlineUsers = async () => {
  onlineLoading.value = true
  try {
    const res: any = await userApi.getOnlineUsers()
    onlineUserList.value = Object.values(res || {})
    onlineCount.value = onlineUserList.value.length
  } catch (error: any) {
    ElMessage.error(error.message || '获取在线用户失败')
    onlineUserList.value = []
    onlineCount.value = 0
  } finally {
    onlineLoading.value = false
  }
}

// Tab 切换
const handleTabChange = (tabName: string | number) => {
  if (tabName === 'online' && onlineUserList.value.length === 0 && !onlineLoading.value) {
    fetchOnlineUsers()
  }
}

// 搜索处理（空函数，computed 自动响应）
const handleSearch = () => {}

// 打开发放积分对话框 (全部用户)
const handleAddPoint = (row: UserListItem) => {
  pointForm.value = {
    userId: row.id,
    phone: row.phone,
    userName: row.userName,
    point: 10
  }
  pointDialogVisible.value = true
}

// 打开发放积分对话框 (在线用户)
const handleAddPointOnline = (row: OnlineUser) => {
  pointForm.value = {
    userId: row.userId,
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

// 打开开通会员对话框 (全部用户)
const handleOpenVip = (row: UserListItem) => {
  vipForm.value = {
    userId: row.id,
    phone: row.phone,
    userName: row.userName,
    vipType: 1
  }
  vipDialogVisible.value = true
}

// 打开开通会员对话框 (在线用户)
const handleOpenVipOnline = (row: OnlineUser) => {
  vipForm.value = {
    userId: row.userId,
    phone: row.phone,
    userName: row.userName,
    vipType: 1
  }
  vipDialogVisible.value = true
}

// 确认开通会员
const handleConfirmOpenVip = async () => {
  vipLoading.value = true
  try {
    await userApi.openVip({
      userId: vipForm.value.userId,
      vipType: vipForm.value.vipType
    })
    const vipTypeName = vipForm.value.vipType === 1 ? '月卡' : '年卡'
    ElMessage.success(`成功开通${vipTypeName}会员`)
    vipDialogVisible.value = false
    fetchUserList()
  } catch (error: any) {
    ElMessage.error(error.message || '开通会员失败')
  } finally {
    vipLoading.value = false
  }
}

// 初始化
onMounted(() => {
  fetchUserList()
})
</script>

<style scoped>
.user-list-container {
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
}

/* ========== Tabs ========== */
.user-tabs {
  margin-bottom: 4px;
}

.user-tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tab-badge {
  margin-left: 4px;
}

.tab-badge :deep(.el-badge__content) {
  font-size: 11px;
  height: 18px;
  line-height: 18px;
  padding: 0 6px;
}

/* ========== 搜索栏 ========== */
.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.search-input {
  width: 260px;
  flex-shrink: 0;
}

.today-check {
  flex-shrink: 0;
  margin-right: 0;
}

.filter-count {
  font-size: 13px;
  color: #909399;
  white-space: nowrap;
}

/* ========== 内容区域 ========== */
.content-section {
  min-height: 200px;
}

/* ========== PC 表格 ========== */
.table-section {
  background: #fff;
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.text-muted {
  color: #bbb;
}

/* ========== 移动端卡片 ========== */
.mobile-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 48px 16px;
  color: #999;
  font-size: 14px;
}

.user-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
}

.user-card:active {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.card-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.online-avatar {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.card-user-info {
  flex: 1;
  min-width: 0;
}

.card-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vip-tag-inline {
  flex-shrink: 0;
}

.card-phone {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.card-status {
  flex-shrink: 0;
}

.online-dot {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #67c23a;
  flex-shrink: 0;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #67c23a;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.card-body {
  margin-bottom: 10px;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  font-size: 11px;
  color: #aaa;
}

.meta-value {
  font-size: 13px;
  color: #555;
}

.meta-value.highlight {
  color: #e6a23c;
  font-weight: 600;
}

.card-actions {
  display: flex;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.card-actions .el-button {
  flex: 1;
  font-size: 13px;
}

/* ========== 对话框 ========== */
.dialog-user-info {
  color: #555;
  font-size: 14px;
}

/* ========== 显示控制 ========== */
.pc-only {
  display: block;
}

.mobile-only {
  display: none;
}

@media (max-width: 767px) {
  .pc-only {
    display: none;
  }

  .mobile-only {
    display: flex;
  }

  .user-list-container {
    padding: 10px;
  }

  .page-header h1 {
    font-size: 18px;
  }

  .search-bar {
    gap: 8px;
  }

  .search-input {
    width: 100%;
    flex-basis: 100%;
  }

  .filter-count {
    font-size: 12px;
  }

  .table-section {
    padding: 10px;
    border-radius: 8px;
  }

  .table-section :deep(.el-table) {
    font-size: 13px;
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

  .user-card {
    padding: 12px;
  }

  .card-avatar {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }

  .card-name {
    font-size: 14px;
  }

  .card-meta {
    gap: 8px 14px;
  }
}
</style>
