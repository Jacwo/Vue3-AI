import { ElMessage } from 'element-plus' // 如果你使用了 Element Plus

// 全局错误提示
export const showErrorMessage = (message: string) => {
  // 使用你喜欢的UI库的提示组件
  console.error('Error:', message)
  // ElMessage.error(message)
  
  // 或者使用原生的 alert
  // alert(message)
}

// 全局成功提示
export const showSuccessMessage = (message: string) => {
  // ElMessage.success(message)
  console.log('Success:', message)
}