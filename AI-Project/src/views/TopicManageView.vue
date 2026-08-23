<template>
  <div class="topic-manage-container">
    <div class="page-header">
      <h1>专题配置</h1>
      <div class="header-actions">
        <el-button v-if="activeTab === 'MAJOR_EVENT'" type="primary" @click="handleAdd">新增专题</el-button>
        <el-button v-if="activeTab === 'HOT_MATCH'" type="success" @click="handleOpenBatchAdd">
          批量添加热门比赛
        </el-button>
      </div>
    </div>

    <!-- Tab 切换 -->
    <div class="tab-section">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="热门比赛" name="HOT_MATCH" />
        <el-tab-pane label="重大赛事" name="MAJOR_EVENT" />
      </el-tabs>
    </div>

    <!-- 热门比赛列表（HOT_LEAGUE Tab）-->
    <div v-if="activeTab === 'HOT_MATCH'" class="table-section pc-only">
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

    <!-- 热门比赛移动端卡片 -->
    <div v-if="activeTab === 'HOT_MATCH'" class="mobile-cards mobile-only" v-loading="loading">
      <div v-if="hotMatchList.length === 0" class="empty-state">暂无热门比赛</div>
      <div v-for="match in hotMatchList" :key="match.id" class="match-card">
        <div class="card-header">
          <div class="card-league">{{ match.league }}</div>
          <el-tag :type="getMatchStatusType(match.status)" size="small" round>
            {{ match.matchStatusName || match.status }}
          </el-tag>
        </div>
        <div class="card-teams">
          <span class="team-name">{{ match.homeTeam }}</span>
          <span class="vs">vs</span>
          <span class="team-name">{{ match.awayTeam }}</span>
        </div>
        <div class="card-meta">
          <div class="meta-item">
            <span class="meta-label">比赛时间</span>
            <span class="meta-value">{{ match.matchTime }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">主队排名</span>
            <span class="meta-value">{{ match.homeTeamRank || '-' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">客队排名</span>
            <span class="meta-value">{{ match.awayTeamRank || '-' }}</span>
          </div>
        </div>
        <div class="card-actions">
          <el-button type="danger" size="small" plain round @click="handleRemoveHotMatch(match)">
            移除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 专题列表（MAJOR_EVENT Tab）-->
    <div v-if="activeTab === 'MAJOR_EVENT'" class="table-section pc-only">
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
        <el-table-column label="专题图片" width="80" align="center">
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
        <el-table-column label="轮播图" width="80" align="center">
          <template #default="scope">
            <img
              v-if="scope.row.carouselImageUrl"
              :src="scope.row.carouselImageUrl"
              :alt="'轮播-' + scope.row.topicName"
              class="image-preview"
              @error="handleImageError"
            />
            <span v-else class="image-placeholder">-</span>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="170" align="center">
          <template #default="scope">
            {{ scope.row.startDate ? formatTime(scope.row.startDate) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="结束时间" width="170" align="center">
          <template #default="scope">
            {{ scope.row.endDate ? formatTime(scope.row.endDate) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="displaySort" label="排序" width="80" align="center" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleEdit(scope.row)">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 专题列表移动端卡片 -->
    <div v-if="activeTab === 'MAJOR_EVENT'" class="mobile-cards mobile-only" v-loading="loading">
      <div v-if="topicList.length === 0" class="empty-state">暂无专题</div>
      <div v-for="topic in topicList" :key="topic.id" class="topic-card">
        <div class="card-header">
          <div class="card-title">
            <span class="topic-name">{{ topic.topicName }}</span>
            <el-tag :type="topic.status === 1 ? 'success' : 'info'" size="small" round>
              {{ topic.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </div>
        </div>
        <div class="card-images" v-if="topic.imageUrl || topic.carouselImageUrl">
          <img
            v-if="topic.imageUrl"
            :src="topic.imageUrl"
            :alt="topic.topicName"
            class="card-image"
            @error="handleImageError"
          />
          <img
            v-if="topic.carouselImageUrl"
            :src="topic.carouselImageUrl"
            :alt="'轮播-' + topic.topicName"
            class="card-image"
            @error="handleImageError"
          />
        </div>
        <div class="card-desc" :title="topic.topicDesc">
          {{ topic.topicDesc }}
        </div>
        <div class="card-meta">
          <div class="meta-item">
            <span class="meta-label">开始时间</span>
            <span class="meta-value">{{ topic.startDate ? formatTime(topic.startDate) : '-' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">结束时间</span>
            <span class="meta-value">{{ topic.endDate ? formatTime(topic.endDate) : '-' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">排序</span>
            <span class="meta-value">{{ topic.displaySort }}</span>
          </div>
        </div>
        <div class="card-actions">
          <el-button type="primary" size="small" plain round @click="handleEdit(topic)">
            编辑
          </el-button>
        </div>
      </div>
    </div>

    <!-- 专题表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" :width="isMobile ? '95%' : '600px'" :close-on-click-modal="false">
      <el-scrollbar>
        <el-form
          :model="topicForm"
          :rules="formRules"
          ref="topicFormRef"
          label-width="120px"
          class="topic-form"
        >
          <el-form-item label="专题类型" prop="topicType">
            <el-select v-model="topicForm.topicType">
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
              :rows="3"
            />
          </el-form-item>
          <el-form-item label="图片地址" prop="imageUrl">
            <el-input v-model="topicForm.imageUrl" placeholder="请输入专题展示图片地址" />
            <div v-if="topicForm.imageUrl" class="image-preview-container">
              <div class="preview-title">专题图片预览：</div>
              <img
                :src="topicForm.imageUrl"
                alt="预览"
                class="image-preview-large"
                @error="handleImageError"
              />
            </div>
          </el-form-item>
          <el-form-item label="轮播图片URL" prop="carouselImageUrl">
            <el-input v-model="topicForm.carouselImageUrl" placeholder="请输入轮播图片URL（可选）" />
            <div v-if="topicForm.carouselImageUrl" class="image-preview-container">
              <div class="preview-title">轮播图片预览：</div>
              <img
                :src="topicForm.carouselImageUrl"
                alt="轮播预览"
                class="image-preview-large"
                @error="handleImageError"
              />
            </div>
          </el-form-item>
          <el-form-item label="开始时间" prop="startDate">
            <el-date-picker
              v-model="topicForm.startDate"
              type="datetime"
              placeholder="请选择开始时间（可选）"
              :default-time="new Date(2000, 0, 1, 0, 0, 0)"
            />
          </el-form-item>
          <el-form-item label="结束时间" prop="endDate">
            <el-date-picker
              v-model="topicForm.endDate"
              type="datetime"
              placeholder="请选择结束时间（可选）"
              :default-time="new Date(2000, 0, 1, 23, 59, 59)"
            />
          </el-form-item>
          <el-form-item label="显示排序" prop="displaySort">
            <el-input-number v-model="topicForm.displaySort" :min="0" :max="9999" />
          </el-form-item>
          <el-form-item label="是否跳转" prop="jump">
            <el-radio-group v-model="topicForm.jump">
              <el-radio :value="1">是</el-radio>
              <el-radio :value="0">否</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="topicForm.status">
              <el-radio :value="1">启用</el-radio>
              <el-radio :value="0">禁用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </el-scrollbar>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量添加热门比赛对话框 -->
    <el-dialog v-model="batchAddDialogVisible" title="批量添加热门比赛" :width="isMobile ? '95%' : '700px'" :close-on-click-modal="false">
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
import { ElMessage, ElMessageBox, ElForm } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { topicApi, type Topic, type TopicFormData, type TopicType } from '@/api/topic'
import { matchApi, type Match } from '@/api/match'

// 响应式判断（移动端）
const isMobile = computed(() => window.innerWidth < 768)

// 状态管理
const activeTab = ref<TopicType>('HOT_MATCH')
const topicList = ref<Topic[]>([])
const hotMatchList = ref<Match[]>([])
const loading = ref(false)
// 存储 matchId -> HotMatchRecord.id 的映射
const matchIdToRecordId = ref<Map<number, number | string>>(new Map())
const dialogVisible = ref(false)
const dialogTitle = computed(() => (topicForm.value.id ? '编辑专题' : '新增专题'))
const submitLoading = ref(false)
const topicFormRef = ref<FormInstance>()

// 表单数据
const topicForm = ref<TopicFormData>({
  topicName: '',
  topicDesc: '',
  imageUrl: '',
  carouselImageUrl: '',
  displaySort: 0,
  status: 1,
  topicType: 'MAJOR_EVENT',
  startDate: null,
  endDate: null,
  jump: 1
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

// 获取重大赛事列表（合并 MAJOR_EVENT + HOT_LEAGUE）
const fetchMajorEventList = async () => {
  loading.value = true
  try {
    const [majorRes, hotRes] = await Promise.all([
      topicApi.getTopicList('MAJOR_EVENT'),
      topicApi.getTopicList('HOT_LEAGUE')
    ])
    const majorList = ((majorRes as any)?.data || majorRes) || []
    const hotList = ((hotRes as any)?.data || hotRes) || []
    topicList.value = [...majorList, ...hotList]
  } catch (error: any) {
    ElMessage.error(error.message || '获取重大赛事列表失败')
    topicList.value = []
  } finally {
    loading.value = false
  }
}

// 获取热门比赛列表
const fetchHotMatches = async () => {
  loading.value = true
  matchIdToRecordId.value.clear()
  try {
    const response: any = await topicApi.getHotMatches()
    // 获取响应中的数据数组（后端返回的是 HotMatchRecord 数组）
    const hotMatchRecords = response?.data || response || []

    // 从热门比赛记录中提取matchId，然后调用比赛详情接口获取详细信息
    if (Array.isArray(hotMatchRecords) && hotMatchRecords.length > 0) {
      const matches: Match[] = []
      for (const record of hotMatchRecords) {
        // 保存 matchId -> record.id 的映射
        matchIdToRecordId.value.set(record.matchId, record.id)
        try {
          const matchId = record.matchId
          const match = await matchApi.getMatchDetail(matchId)
          if (match) {
            matches.push(match)
          }
        } catch (error) {
          console.error(`获取比赛 ${record.matchId} 详情失败:`, error)
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
  if (activeTab.value === 'HOT_MATCH') {
    fetchHotMatches()
  } else {
    fetchMajorEventList()
  }
}

// 打开新增对话框
const handleAdd = () => {
  topicForm.value = {
    topicName: '',
    topicDesc: '',
    imageUrl: '',
    carouselImageUrl: '',
    displaySort: 0,
    status: 1,
    topicType: activeTab.value as TopicType,
    startDate: null,
    endDate: null,
    jump: 1
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
    carouselImageUrl: row.carouselImageUrl || '',
    displaySort: row.displaySort,
    status: row.status,
    topicType: row.topicType,
    startDate: row.startDate ? new Date(row.startDate) : null,
    endDate: row.endDate ? new Date(row.endDate) : null,
    jump: row.jump ?? 1
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
      fetchMajorEventList()
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
const handleRemoveHotMatch = async (match: Match) => {
  try {
    await ElMessageBox.confirm(
      `确定要移除热门比赛 "${match.homeTeam} vs ${match.awayTeam}" 吗？`,
      '确认移除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const recordId = matchIdToRecordId.value.get(match.id)
    if (!recordId) {
      ElMessage.error('移除失败：未找到记录ID')
      return
    }
    await topicApi.deleteHotMatch(recordId)
    ElMessage.success('移除成功')
    fetchHotMatches() // 刷新列表
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '移除失败')
    }
  }
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

// 格式化时间
const formatTime = (time: string | Date | null | undefined): string => {
  if (!time) return '-'
  try {
    const date = new Date(time)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return '-'
  }
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

.preview-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.image-preview-large {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
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

/* ========== 显示控制 ========== */
.pc-only {
  display: block;
}

.mobile-only {
  display: none;
}

/* ========== 移动端卡片 ========== */
.mobile-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.match-card,
.topic-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
}

.match-card:active,
.topic-card:active {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.card-league {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-title {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.topic-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 10px;
  background: #f7f8fa;
  border-radius: 8px;
}

.team-name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vs {
  flex-shrink: 0;
  font-size: 12px;
  color: #c0c4cc;
  font-weight: 600;
}

.card-images {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.card-image {
  width: 90px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.card-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
  margin-bottom: 10px;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .pc-only {
    display: none;
  }

  .mobile-only {
    display: flex;
  }

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

  .tab-section {
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

  /* 移动端表单：label 置顶 */
  .topic-form :deep(.el-form-item) {
    display: block;
    margin-bottom: 16px;
  }

  .topic-form :deep(.el-form-item__label) {
    display: block;
    text-align: left;
    width: 100% !important;
    padding: 0 0 4px;
    line-height: 1.4;
  }

  .topic-form :deep(.el-form-item__content) {
    margin-left: 0 !important;
    width: 100%;
  }

  .topic-form :deep(.el-input),
  .topic-form :deep(.el-select),
  .topic-form :deep(.el-input-number),
  .topic-form :deep(.el-date-editor) {
    width: 100% !important;
  }

  /* 批量添加对话框比赛卡片适配 */
  .match-list {
    max-height: 50vh;
  }

  .match-info {
    flex-direction: row;
    align-items: center;
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

  .image-preview {
    width: 45px;
    height: 30px;
  }

  .card-images {
    flex-direction: column;
  }

  .card-image {
    width: 100%;
    height: 120px;
  }
}
</style>
