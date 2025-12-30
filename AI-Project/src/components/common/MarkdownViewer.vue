<template>
  <div class="markdown-viewer" :class="{ 'dark-mode': darkMode }" v-html="renderedContent"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import markdownUtils from '@/utils/markdownUtils'

interface Props {
  content: string
  darkMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  darkMode: false,
  content: ''
})

const renderedContent = computed(() => {
  if (!props.content) return '<p>暂无内容</p>'
  
  try {
    const cleanedContent = markdownUtils.cleanMarkdownContent(props.content)
    return markdownUtils.renderMarkdown(cleanedContent)
  } catch (error) {
    console.error('渲染 Markdown 失败:', error)
    return '<p>内容渲染失败</p>'
  }
})
</script>