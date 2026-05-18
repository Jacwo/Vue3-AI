<template>
  <div class="sku-manage-container">
    <div class="page-header">
      <h1>商品管理</h1>
    </div>

    <!-- 搜索筛选区域 -->
    <div class="filter-section">
      <el-form :inline="true" :model="queryForm" class="filter-form">
        <el-form-item label="分类">
          <el-select v-model="queryForm.category" placeholder="全部分类" clearable @change="fetchSkuList">
            <el-option label="VIP会员" :value="1" />
            <el-option label="道具" :value="2" />
            <el-option label="服务" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部状态" clearable @change="fetchSkuList">
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
            <el-option label="售罄" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchSkuList">查询</el-button>
          <el-button @click="handleResetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 操作区域 -->
    <div class="action-bar">
      <el-button type="primary" @click="handleAdd">新增商品</el-button>
      <el-button type="danger" :disabled="!selectedRows.length" @click="handleBatchDelete">
        批量删除{{ selectedRows.length ? `(${selectedRows.length})` : '' }}
      </el-button>
    </div>

    <!-- 商品列表表格 -->
    <div class="table-section">
      <el-table
        :data="skuList"
        stripe
        style="width: 100%"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="skuCode" label="SKU编码" min-width="130" />
        <el-table-column prop="name" label="商品名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="categoryName" label="分类" width="100" />
        <el-table-column prop="priceYuan" label="价格" width="100" align="right">
          <template #default="{ row }">
            ¥{{ row.priceYuan || (row.price / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="originalPriceYuan" label="原价" width="100" align="right">
          <template #default="{ row }">
            <span v-if="row.originalPrice" class="original-price">
              ¥{{ row.originalPriceYuan || (row.originalPrice / 100).toFixed(2) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ row.statusName || statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="validDays" label="有效天数" width="90" align="center">
          <template #default="{ row }">
            {{ row.validDays ? row.validDays + '天' : '永久' }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="160">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑商品' : '新增商品'"
      width="640px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="SKU编码" prop="skuCode">
          <el-input v-model="formData.skuCode" placeholder="请输入SKU编码" :disabled="isEdit" maxlength="64" />
        </el-form-item>
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入商品名称" maxlength="128" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="formData.category" placeholder="请选择分类" style="width: 100%">
            <el-option label="VIP会员" :value="1" />
            <el-option label="道具" :value="2" />
            <el-option label="服务" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格(分)" prop="price">
          <el-input-number v-model="formData.price" :min="1" :step="100" style="width: 100%" />
          <span class="form-tip">≈ ¥{{ (formData.price / 100).toFixed(2) }}</span>
        </el-form-item>
        <el-form-item label="原价(分)" prop="originalPrice">
          <el-input-number v-model="formData.originalPrice" :min="0" :step="100" style="width: 100%" />
          <span v-if="formData.originalPrice" class="form-tip">≈ ¥{{ (formData.originalPrice / 100).toFixed(2) }}</span>
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="formData.stock" :min="0" :step="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="有效天数" prop="validDays">
          <el-input-number v-model="formData.validDays" :min="0" :step="1" style="width: 100%" />
          <span class="form-tip">0表示永久</span>
        </el-form-item>
        <el-form-item label="限购数量" prop="limitPerUser">
          <el-input-number v-model="formData.limitPerUser" :min="0" :step="1" style="width: 100%" />
          <span class="form-tip">0表示不限购</span>
        </el-form-item>
        <el-form-item label="排序权重" prop="sortOrder">
          <el-input-number v-model="formData.sortOrder" :min="0" :step="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="虚拟商品" prop="virtualFlag">
          <el-radio-group v-model="formData.virtualFlag">
            <el-radio :value="1">虚拟</el-radio>
            <el-radio :value="0">实物</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="主图URL" prop="mainImage">
          <el-input v-model="formData.mainImage" placeholder="请输入主图URL" />
        </el-form-item>
        <el-form-item label="商品描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入商品描述" maxlength="512" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitForm" :loading="formLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { skuApi, type Sku, type SkuListQuery, type SkuCreateData, type SkuUpdateData, type SkuStatus } from '@/api/sku'

// 查询参数
const queryForm = reactive<SkuListQuery>({
  status: undefined,
  category: undefined
})

// 列表数据
const skuList = ref<Sku[]>([])
const loading = ref(false)

// 多选
const selectedRows = ref<Sku[]>([])

// 表单相关
const formDialogVisible = ref(false)
const formLoading = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive({
  id: undefined as number | undefined,
  skuCode: '',
  name: '',
  description: '',
  category: 1 as 1 | 2 | 3,
  price: 100,
  originalPrice: 0,
  stock: 0,
  status: 1 as SkuStatus,
  validDays: 0,
  limitPerUser: 0,
  sortOrder: 0,
  virtualFlag: 1,
  mainImage: ''
})

const formRules = reactive<FormRules>({
  skuCode: [{ required: true, message: '请输入SKU编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }]
})

// 状态标签
const statusLabel = (status: SkuStatus) => {
  const map: Record<number, string> = { 0: '下架', 1: '上架', 2: '售罄' }
  return map[status] || '未知'
}

const statusTagType = (status: SkuStatus) => {
  const map: Record<number, string> = { 0: 'info', 1: 'success', 2: 'warning' }
  return map[status] || 'info'
}

// 格式化时间
const formatTime = (time?: string) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

// 获取商品列表
const fetchSkuList = async () => {
  loading.value = true
  try {
    const res = await skuApi.getSkuList(queryForm)
    skuList.value = res || []
  } catch (error: any) {
    ElMessage.error(error.message || '获取商品列表失败')
    skuList.value = []
  } finally {
    loading.value = false
  }
}

// 重置查询
const handleResetQuery = () => {
  queryForm.status = undefined
  queryForm.category = undefined
  fetchSkuList()
}

// 多选
const handleSelectionChange = (rows: Sku[]) => {
  selectedRows.value = rows
}

// 重置表单
const resetFormData = () => {
  formData.id = undefined
  formData.skuCode = ''
  formData.name = ''
  formData.description = ''
  formData.category = 1
  formData.price = 100
  formData.originalPrice = 0
  formData.stock = 0
  formData.status = 1
  formData.validDays = 0
  formData.limitPerUser = 0
  formData.sortOrder = 0
  formData.virtualFlag = 1
  formData.mainImage = ''
  isEdit.value = false
}

// 新增
const handleAdd = () => {
  resetFormData()
  formDialogVisible.value = true
}

// 编辑
const handleEdit = (row: Sku) => {
  isEdit.value = true
  formData.id = row.id
  formData.skuCode = row.skuCode
  formData.name = row.name
  formData.description = row.description || ''
  formData.category = row.category
  formData.price = row.price
  formData.originalPrice = row.originalPrice || 0
  formData.stock = row.stock
  formData.status = row.status
  formData.validDays = row.validDays || 0
  formData.limitPerUser = row.limitPerUser || 0
  formData.sortOrder = row.sortOrder || 0
  formData.virtualFlag = row.virtualFlag ?? 1
  formData.mainImage = row.mainImage || ''
  formDialogVisible.value = true
}

// 提交表单
const handleSubmitForm = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  formLoading.value = true
  try {
    if (isEdit.value && formData.id) {
      const updateData: SkuUpdateData = {
        id: formData.id,
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        price: formData.price,
        originalPrice: formData.originalPrice || undefined,
        stock: formData.stock,
        status: formData.status,
        validDays: formData.validDays,
        limitPerUser: formData.limitPerUser,
        sortOrder: formData.sortOrder,
        virtualFlag: formData.virtualFlag,
        mainImage: formData.mainImage || undefined
      }
      await skuApi.updateSku(updateData)
      ElMessage.success('修改成功')
    } else {
      const createData: SkuCreateData = {
        skuCode: formData.skuCode,
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        price: formData.price,
        originalPrice: formData.originalPrice || undefined,
        stock: formData.stock,
        status: formData.status,
        validDays: formData.validDays,
        limitPerUser: formData.limitPerUser,
        sortOrder: formData.sortOrder,
        virtualFlag: formData.virtualFlag,
        mainImage: formData.mainImage || undefined
      }
      await skuApi.createSku(createData)
      ElMessage.success('新增成功')
    }
    formDialogVisible.value = false
    fetchSkuList()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    formLoading.value = false
  }
}

// 删除
const handleDelete = (row: Sku) => {
  ElMessageBox.confirm(`确认删除商品「${row.name}」？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await skuApi.deleteSku(row.id)
      ElMessage.success('删除成功')
      fetchSkuList()
    } catch (error: any) {
      ElMessage.error(error.message || '删除失败')
    }
  }).catch(() => {})
}

// 批量删除
const handleBatchDelete = () => {
  ElMessageBox.confirm(`确认批量删除选中的 ${selectedRows.value.length} 个商品？`, '批量删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const ids = selectedRows.value.map(r => r.id)
      await skuApi.batchDeleteSku(ids)
      ElMessage.success('批量删除成功')
      fetchSkuList()
    } catch (error: any) {
      ElMessage.error(error.message || '批量删除失败')
    }
  }).catch(() => {})
}

// 初始化
onMounted(() => {
  fetchSkuList()
})
</script>

<style scoped>
.sku-manage-container {
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
}

.filter-section {
  background: white;
  padding: 20px 20px 0;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
}

.action-bar {
  margin-bottom: 16px;
  display: flex;
  gap: 10px;
}

.table-section {
  background: white;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.original-price {
  color: #999;
  text-decoration: line-through;
}

.form-tip {
  margin-left: 8px;
  color: #999;
  font-size: 12px;
}

@media (max-width: 768px) {
  .sku-manage-container {
    padding: 10px;
  }

  .page-header h1 {
    font-size: 18px;
  }

  .filter-section {
    padding: 12px 12px 0;
  }

  .filter-form :deep(.el-form-item) {
    margin-right: 0;
    width: 100%;
  }

  .filter-form :deep(.el-form-item .el-input),
  .filter-form :deep(.el-form-item .el-select) {
    width: 100% !important;
  }

  .table-section {
    padding: 10px;
  }

  .table-section :deep(.el-table) {
    min-width: 1000px;
    font-size: 12px;
  }

  .table-section :deep(.el-table__cell) {
    padding: 8px 4px;
  }
}

@media (max-width: 480px) {
  .sku-manage-container {
    padding: 8px;
  }

  .page-header h1 {
    font-size: 16px;
  }

  .table-section :deep(.el-table) {
    min-width: 800px;
    font-size: 11px;
  }

  .table-section :deep(.el-table__cell) {
    padding: 6px 2px;
  }
}
</style>
