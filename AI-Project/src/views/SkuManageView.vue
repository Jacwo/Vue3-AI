<template>
  <div class="sku-manage-container">
    <div class="page-header">
      <h1>商品管理</h1>
    </div>

    <!-- 搜索筛选区域 -->
    <div class="filter-section">
      <el-form :inline="true" :model="queryForm" class="filter-form">
        <el-form-item label="商品名称">
          <el-input v-model="queryForm.skuName" placeholder="请输入商品名称" clearable @clear="handleSearch" />
        </el-form-item>
        <el-form-item label="SKU编码">
          <el-input v-model="queryForm.skuCode" placeholder="请输入SKU编码" clearable @clear="handleSearch" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="queryForm.categoryId" placeholder="全部分类" clearable @change="handleSearch">
            <el-option v-for="cat in categoryList" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部状态" clearable @change="handleSearch">
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleResetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 操作区域 -->
    <div class="action-bar">
      <el-button type="primary" @click="handleAdd">新增商品</el-button>
      <el-button type="danger" :disabled="!selectedIds.length" @click="handleBatchDelete">
        批量删除{{ selectedIds.length ? `(${selectedIds.length})` : '' }}
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
        <el-table-column prop="skuName" label="商品名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="categoryName" label="分类" width="120" />
        <el-table-column prop="price" label="价格" width="100" align="right">
          <template #default="{ row }">
            ¥{{ (row.price / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="90" align="center" />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="160">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button
              link
              :type="row.status === 1 ? 'warning' : 'success'"
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '下架' : '上架' }}
            </el-button>
            <el-button link type="primary" size="small" @click="handleStockOper(row, 'add')">加库存</el-button>
            <el-button link type="warning" size="small" @click="handleStockOper(row, 'deduct')">减库存</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryForm.pageNum"
          v-model:page-size="queryForm.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑商品' : '新增商品'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
        <el-form-item label="SKU编码" prop="skuCode">
          <el-input v-model="formData.skuCode" placeholder="请输入SKU编码" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="商品名称" prop="skuName">
          <el-input v-model="formData.skuName" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="formData.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="cat in categoryList" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格(元)" prop="price">
          <el-input-number v-model="formData.priceYuan" :min="0.01" :precision="2" :step="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="成本价(元)" prop="costPrice">
          <el-input-number v-model="formData.costPriceYuan" :min="0" :precision="2" :step="1" style="width: 100%" />
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
        <el-form-item label="描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入商品描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitForm" :loading="formLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 库存操作对话框 -->
    <el-dialog v-model="stockDialogVisible" :title="stockDialogTitle" width="400px">
      <el-form :model="stockForm" label-width="80px">
        <el-form-item label="商品名称">
          <span>{{ stockForm.skuName }}</span>
        </el-form-item>
        <el-form-item label="当前库存">
          <span>{{ stockForm.currentStock }}</span>
        </el-form-item>
        <el-form-item label="操作数量">
          <el-input-number v-model="stockForm.quantity" :min="1" :max="99999" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="stockForm.remark" placeholder="请输入备注（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stockDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmStock" :loading="stockLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { skuApi, type Sku, type SkuListQuery, type SkuFormData } from '@/api/sku'

// 分类列表（可根据实际接口替换）
const categoryList = ref([
  { id: '1', name: '积分包', level: 1 },
  { id: '2', name: '会员卡', level: 1 },
  { id: '3', name: '其他', level: 1 }
])

// 查询参数
const queryForm = reactive<SkuListQuery>({
  pageNum: 1,
  pageSize: 10,
  skuName: '',
  skuCode: '',
  categoryId: '',
  status: undefined
})

// 列表数据
const skuList = ref<Sku[]>([])
const loading = ref(false)
const total = ref(0)

// 多选
const selectedIds = ref<string[]>([])

// 表单相关
const formDialogVisible = ref(false)
const formLoading = ref(false)
const isEdit = ref(false)
const editId = ref('')
const formRef = ref<FormInstance>()

const formData = reactive<{
  skuCode: string
  skuName: string
  categoryId: string
  priceYuan: number
  costPriceYuan: number
  stock: number
  status: 0 | 1
  description: string
}>({
  skuCode: '',
  skuName: '',
  categoryId: '',
  priceYuan: 0.01,
  costPriceYuan: 0,
  stock: 0,
  status: 1,
  description: ''
})

const formRules = reactive<FormRules>({
  skuCode: [{ required: true, message: '请输入SKU编码', trigger: 'blur' }],
  skuName: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  priceYuan: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }]
})

// 库存操作相关
const stockDialogVisible = ref(false)
const stockLoading = ref(false)
const stockType = ref<'add' | 'deduct'>('add')
const stockForm = reactive({
  skuId: '',
  skuName: '',
  currentStock: 0,
  quantity: 1,
  remark: ''
})

const stockDialogTitle = computed(() => stockType.value === 'add' ? '增加库存' : '扣减库存')

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
    skuList.value = res.data || []
    total.value = res.total || 0
  } catch (error: any) {
    ElMessage.error(error.message || '获取商品列表失败')
    skuList.value = []
  } finally {
    loading.value = false
  }
}

// 查询
const handleSearch = () => {
  queryForm.pageNum = 1
  fetchSkuList()
}

// 重置查询
const handleResetQuery = () => {
  queryForm.skuName = ''
  queryForm.skuCode = ''
  queryForm.categoryId = ''
  queryForm.status = undefined
  queryForm.pageNum = 1
  fetchSkuList()
}

// 分页
const handleSizeChange = () => {
  queryForm.pageNum = 1
  fetchSkuList()
}

const handlePageChange = () => {
  fetchSkuList()
}

// 多选
const handleSelectionChange = (rows: Sku[]) => {
  selectedIds.value = rows.map(r => r.id!).filter(Boolean)
}

// 重置表单
const resetFormData = () => {
  formData.skuCode = ''
  formData.skuName = ''
  formData.categoryId = ''
  formData.priceYuan = 0.01
  formData.costPriceYuan = 0
  formData.stock = 0
  formData.status = 1
  formData.description = ''
  isEdit.value = false
  editId.value = ''
}

// 新增
const handleAdd = () => {
  resetFormData()
  formDialogVisible.value = true
}

// 编辑
const handleEdit = (row: Sku) => {
  isEdit.value = true
  editId.value = row.id!
  formData.skuCode = row.skuCode
  formData.skuName = row.skuName
  formData.categoryId = row.categoryId
  formData.priceYuan = row.price ? row.price / 100 : 0
  formData.costPriceYuan = row.costPrice ? row.costPrice / 100 : 0
  formData.stock = row.stock
  formData.status = row.status
  formData.description = row.description || ''
  formDialogVisible.value = true
}

// 提交表单
const handleSubmitForm = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  formLoading.value = true
  try {
    const submitData: SkuFormData = {
      skuCode: formData.skuCode,
      skuName: formData.skuName,
      categoryId: formData.categoryId,
      price: Math.round(formData.priceYuan * 100), // 元转分
      costPrice: Math.round(formData.costPriceYuan * 100),
      stock: formData.stock,
      status: formData.status,
      description: formData.description
    }

    if (isEdit.value) {
      await skuApi.updateSku(editId.value, submitData)
      ElMessage.success('修改成功')
    } else {
      await skuApi.createSku(submitData)
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
  ElMessageBox.confirm(`确认删除商品「${row.skuName}」？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await skuApi.deleteSku(row.id!)
      ElMessage.success('删除成功')
      fetchSkuList()
    } catch (error: any) {
      ElMessage.error(error.message || '删除失败')
    }
  }).catch(() => {})
}

// 批量删除
const handleBatchDelete = () => {
  ElMessageBox.confirm(`确认批量删除选中的 ${selectedIds.value.length} 个商品？`, '批量删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await skuApi.batchDeleteSku({ ids: selectedIds.value })
      ElMessage.success('批量删除成功')
      fetchSkuList()
    } catch (error: any) {
      ElMessage.error(error.message || '批量删除失败')
    }
  }).catch(() => {})
}

// 切换状态（上架/下架）
const handleToggleStatus = (row: Sku) => {
  const newStatus = row.status === 1 ? 0 : 1
  const action = newStatus === 1 ? '上架' : '下架'
  ElMessageBox.confirm(`确认将商品「${row.skuName}」${action}？`, '状态变更确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await skuApi.updateSkuStatus(row.id!, { status: newStatus as 0 | 1 })
      ElMessage.success(`${action}成功`)
      fetchSkuList()
    } catch (error: any) {
      ElMessage.error(error.message || `${action}失败`)
    }
  }).catch(() => {})
}

// 库存操作
const handleStockOper = (row: Sku, type: 'add' | 'deduct') => {
  stockType.value = type
  stockForm.skuId = row.id!
  stockForm.skuName = row.skuName
  stockForm.currentStock = row.stock
  stockForm.quantity = 1
  stockForm.remark = ''
  stockDialogVisible.value = true
}

// 确认库存操作
const handleConfirmStock = async () => {
  if (stockForm.quantity < 1) {
    ElMessage.error('操作数量不能小于1')
    return
  }
  if (stockType.value === 'deduct' && stockForm.quantity > stockForm.currentStock) {
    ElMessage.error('扣减数量不能超过当前库存')
    return
  }

  stockLoading.value = true
  try {
    const params = { quantity: stockForm.quantity, remark: stockForm.remark }
    if (stockType.value === 'add') {
      await skuApi.addStock(stockForm.skuId, params)
      ElMessage.success('增加库存成功')
    } else {
      await skuApi.deductStock(stockForm.skuId, params)
      ElMessage.success('扣减库存成功')
    }
    stockDialogVisible.value = false
    fetchSkuList()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    stockLoading.value = false
  }
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

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
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
    min-width: 900px;
    font-size: 12px;
  }

  .table-section :deep(.el-table__cell) {
    padding: 8px 4px;
  }

  .pagination-wrapper {
    flex-wrap: wrap;
    justify-content: center;
  }

  .pagination-wrapper :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
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
    min-width: 700px;
    font-size: 11px;
  }

  .table-section :deep(.el-table__cell) {
    padding: 6px 2px;
  }
}
</style>
