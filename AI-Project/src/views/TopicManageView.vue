<template>
  <div class="topic-manage-container">
    <div class="page-header">
      <h1>专题配置</h1>
      <div class="header-actions">
        <el-button v-if="activeTab === 'MAJOR_EVENT'" type="primary" @click="handleAdd">新增专题</el-button>
        <el-button v-if="activeTab === 'HOT_LEAGUE'" type="success" @click="handleOpenBatchAdd">
          批量添加热门比赛
        </el-button>
      </div>
    </div>

    <!-- Tab 切换 -->
    <div class="tab-section">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="热门赛事" name="HOT_LEAGUE" />
        <el-tab-pane label="重大赛事" name="MAJOR_EVENT" />
      </el-tabs>
    </div>

    <!-- 热门比赛列表（HOT_LEAGUE Tab）-->
    <div v-if="activeTab === 'HOT_LEAGUE'" class="table-section">
      <el-table
        :data="hotMatchList"
        stripe
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="league" label="联赛" min-width="100" />
        <el-table-column label="比赛" min-width="200">
          <template #default="scope">
            {{ scope.row.homeTeam }} vs {{ scope.row.awayTeam }}
          </template>
        </el-table-column>
        <el-table-column prop="matchTime" label="比赛时间" width="120" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getMatchStatusType(scope.row.status)">
              {{ scope.row.matchStatusName || scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="主队排名" width="100" align="center">
          <template #default="scope">
            {{ scope.row.homeTeamRank || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="客队排名" width="100" align="center">
          <template #default="scope">
            {{ scope.row.awayTeamRank || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="danger" size="small" @click="handleRemoveHotMatch(scope.row)">
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 专题列表（MAJOR_EVENT Tab）-->
    <div v-if="activeTab === 'MAJOR_EVENT'" class="table-section">
      <el-table
        :data="topicList"
        stripe
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="topicName" label="专题名称" min-width="140" />
        <el-table-column prop="topicDesc" label="描述" min-width="200">
          <template #default="scope">
            <span :title="scope.row.topicDesc">
              {{ scope.row.topicDesc.length > 50 ? scope.row.topicDesc.substring(0, 50) + '...' : scope.row.topicDesc }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="图片预览" width="100" align="center">
          <template #default="scope">
            <img
              v-if="scope.row.imageUrl"
              :src="scope.row.imageUrl"
              :alt="scope.row.topicName"
              class="image-preview"
              @error="handleImageError"
            />
            <span v-else class="image-placeholder">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="displaySort" label="排序" width="100" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleEdit(scope.row)">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 专题表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form
        :model="topicForm"
        :rules="formRules"
        ref="topicFormRef"
        label-width="100px"
      >
        <el-form-item label="专题类型" prop="topicType">
          <el-select v-model="topicForm.topicType" :disabled="!!topicForm.id">
            <el-option label="热门赛事" value="HOT_LEAGUE" />
            <el-option label="重大赛事" value="MAJOR_EVENT" />
          </el-select>
        </el-form-item>
        <el-form-item label="专题名称" prop="topicName">
          <el-input v-model="topicForm.topicName" placeholder="请输入专题名称" />
        </el-form-item>
        <el-form-item label="专题描述" prop="topicDesc">
          <el-input
            v-model="topicForm.topicDesc"
            type="textarea"
            placeholder="请输入专题描述"
            :rows="4"
          />
        </el-form-item>
        <el-form-item label="图片地址" prop="imageUrl">
          <el-input v-model="topicForm.imageUrl" placeholder="请输入图片地址" />
          <div v-if="topicForm.imageUrl" class="image-preview-container">
            <img
              :src="topicForm.imageUrl"
              alt="预览"
              class="image-preview-large"
              @error="handleImageError"
            />
          </div>
        </el-form-item>
        <el-form-item label="显示排序" prop="displaySort">
          <el-input-number v-model="topicForm.displaySort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="topicForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量添加热门比赛对话框 -->
    <el-dialog v-model="batchAddDialogVisible" title="批量添加热门比赛" width="700px">
      <div v-loading="batchAddLoading" class="batch-add-container">
        <div v-if="todayMatches.length === 0" class="empty-state">
          <p>今天暂无比赛</p>
        </div>
        <div v-else>
          <p class="batch-add-title">请选择要添加为热门比赛的比赛：</p>
          <el-checkbox-group v-model="selectedMatchIds" class="match-list">
            <div v-for="match in todayMatches" :key="match.id" class="match-item">
              <el-checkbox :value="match.id">
                <span class="match-info">
                  <span class="league">{{ match.league }}</span>
                  <span class="teams">{{ match.homeTeam }} vs {{ match.awayTeam }}</span>
                  <span class="time">{{ match.matchTime }}</span>
                </span>
              </el-checkbox>
            </div>
          </el-checkbox-group>
        </div>
      </div>
      <template #footer>
        <el-button @click="batchAddDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleConfirmBatch"
          :loading="batchConfirmLoading"
          :disabled="selectedMatchIds.length === 0"
        >
          确定 (已选{{ selectedMatchIds.length }}场)
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElForm } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { topicApi, type Topic, type TopicFormData, type TopicType } from '@/api/topic'
import { matchApi, type Match } from '@/api/match'

// 状态管理
const activeTab = ref<TopicType>('HOT_LEAGUE')
const topicList = ref<Topic[]>([])
const hotMatchList = ref<Match[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = computed(() => (topicForm.value.id ? '编辑专题' : '新增专题'))
const submitLoading = ref(false)
const topicFormRef = ref<FormInstance>()

// 表单数据
const topicForm = ref<TopicFormData>({
  topicName: '',
  topicDesc: '',
  imageUrl: '',
  displaySort: 0,
  status: 1,
  topicType: 'MAJOR_EVENT'
})

// 表单验证规则
const formRules: any = {
  topicName: [
    { required: true, message: '请输入专题名称', trigger: 'blur' },
    { min: 1, max: 50, message: '专题名称长度应为1-50个字符', trigger: 'blur' }
  ],
  topicDesc: [
    { required: true, message: '请输入专题描述', trigger: 'blur' },
    { min: 1, max: 500, message: '专题描述长度应为1-500个字符', trigger: 'blur' }
  ],
  imageUrl: [
    { required: true, message: '请输入图片地址', trigger: 'blur' }
  ],
  displaySort: [
    { required: true, message: '请输入显示排序', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 批量添加相关
const batchAddDialogVisible = ref(false)
const batchAddLoading = ref(false)
const batchConfirmLoading = ref(false)
const todayMatches = ref<Match[]>([])
const selectedMatchIds = ref<number[]>([])

// 获取专题列表
const fetchTopicList = async () => {
  loading.value = true
  try {
    const response: any = await topicApi.getTopicList(activeTab.value)
    topicList.value = (response?.data || response) || []
  } catch (error: any) {
    ElMessage.error(error.message || '获取专题列表失败')
    topicList.value = []
  } finally {
    loading.value = false
  }
}

// 获取热门比赛列表
const fetchHotMatches = async () => {
  loading.value = true
  try {
    const response: any = await topicApi.getHotMatches()
    const matchIds = (response?.data || response?.matchIds || response) || []

    // 如果获取到的是matchIds，需要调用比赛详情接口获取详细信息
    if (Array.isArray(matchIds) && matchIds.length > 0) {
      const matches: Match[] = []
      for (const matchId of matchIds) {
        try {
          const match = await matchApi.getMatchDetail(matchId)
          if (match) {
            matches.push(match)
          }
        } catch (error) {
          console.error(`获取比赛 ${matchId} 详情失败:`, error)
        }
      }
      hotMatchList.value = matches
    } else {
      hotMatchList.value = []
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取热门比赛列表失败')
    hotMatchList.value = []
  } finally {
    loading.value = false
  }
}

// Tab 切换
const handleTabChange = () => {
  if (activeTab.value === 'HOT_LEAGUE') {
    fetchHotMatches()
  } else {
    fetchTopicList()
  }
}

// 打开新增对话框
const handleAdd = () => {
  topicForm.value = {
    topicName: '',
    topicDesc: '',
    imageUrl: '',
    displaySort: 0,
    status: 1,
    topicType: activeTab.value as TopicType
  }
  topicFormRef.value?.clearValidate()
  dialogVisible.value = true
}

// 打开编辑对话框
const handleEdit = (row: Topic) => {
  topicForm.value = {
    id: row.id,
    topicName: row.topicName,
    topicDesc: row.topicDesc,
    imageUrl: row.imageUrl,
    displaySort: row.displaySort,
    status: row.status,
    topicType: row.topicType
  }
  topicFormRef.value?.clearValidate()
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!topicFormRef.value) return

  await topicFormRef.value.validate(async (valid) => {
    if (!valid) return

    submitLoading.value = true
    try {
      await topicApi.saveTopic(topicForm.value)
      const message = topicForm.value.id ? '编辑成功' : '新增成功'
      ElMessage.success(message)
      dialogVisible.value = false
      fetchTopicList()
    } catch (error: any) {
      ElMessage.error(error.message || '保存失败')
    } finally {
      submitLoading.value = false
    }
  })
}

// 打开批量添加对话框
const handleOpenBatchAdd = async () => {
  batchAddLoading.value = true
  selectedMatchIds.value = []
  try {
    todayMatches.value = await matchApi.getTodayMatches()
    batchAddDialogVisible.value = true
  } catch (error: any) {
    ElMessage.error(error.message || '获取今日比赛失败')
  } finally {
    batchAddLoading.value = false
  }
}

// 确认批量添加
const handleConfirmBatch = async () => {
  if (selectedMatchIds.value.length === 0) {
    ElMessage.warning('请至少选择一场比赛')
    return
  }

  batchConfirmLoading.value = true
  try {
    await topicApi.batchAddHotMatches(selectedMatchIds.value)
    ElMessage.success(`成功添加 ${selectedMatchIds.value.length} 场热门比赛`)
    batchAddDialogVisible.value = false
    fetchHotMatches()
  } catch (error: any) {
    ElMessage.error(error.message || '批量添加失败')
  } finally {
    batchConfirmLoading.value = false
  }
}

// 移除热门比赛
const handleRemoveHotMatch = (match: Match) => {
  ElMessage.warning('移除功能需要后端支持对应接口')
}

// 获取比赛状态标签类型
const getMatchStatusType = (status: string): string => {
  const statusMap: Record<string, string> = {
    '未开赛': 'info',
    '进行中': 'warning',
    '已结束': 'success',
    '延期': 'danger'
  }
  return statusMap[status] || 'info'
}

// 处理图片加载错误
const handleImageError = (event: any) => {
  event.target.style.display = 'none'
}

// 初始化
onMounted(() => {
  fetchHotMatches()
})
</script>

<style scoped>
.topic-manage-container {
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tab-section {
  margin-bottom: 20px;
  background: white;
  padding: 10px;
  border-radius: 4px;
}

.table-section {
  background: white;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.image-preview {
  width: 60px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}

.image-placeholder {
  color: #999;
}

.image-preview-container {
  margin-top: 10px;
  text-align: center;
}

.image-preview-large {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
}

.batch-add-container {
  padding: 10px 0;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.batch-add-title {
  margin-bottom: 15px;
  font-weight: 500;
  color: #333;
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.match-item {
  padding: 10px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.match-item:hover {
  background-color: #f5f7fa;
}

.match-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 15px;
}

.league {
  font-weight: 500;
  color: #333;
  min-width: 60px;
}

.teams {
  flex: 1;
  color: #666;
}

.time {
  color: #999;
  font-size: 12px;
  white-space: nowrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .topic-manage-container {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-header h1 {
    font-size: 18px;
    width: 100%;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .el-button {
    flex: 1;
    min-width: 120px;
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

  .image-preview {
    width: 50px;
    height: 35px;
  }

  .match-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .time {
    margin-left: 0;
  }
}

@media (max-width: 480px) {
  .topic-manage-container {
    padding: 8px;
  }

  .page-header h1 {
    font-size: 16px;
  }

  .header-actions .el-button {
    width: 100%;
  }

  .table-section :deep(.el-table) {
    min-width: 600px;
    font-size: 11px;
  }

  .table-section :deep(.el-table__cell) {
    padding: 6px 2px;
  }

  .image-preview {
    width: 45px;
    height: 30px;
  }
}
</style>
