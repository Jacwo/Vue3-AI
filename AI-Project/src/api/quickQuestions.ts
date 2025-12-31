// @/api/quickQuestions.ts
export const fetchQuickQuestions = async (): Promise<string[]> => {
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 这里可以替换为真实的API调用
  return [
    '如何学习编程？',
    '帮我写一个Python函数',
    '解释一下量子计算',
    '制定一个学习计划'
  ];
};