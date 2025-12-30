import { defineStore } from 'pinia'

export const useLoadingStore = defineStore('loading', {
  state: () => ({
    isLoading: false,
    loadingText: '加载中...'
  }),
  
  actions: {
    showLoading(text?: string) {
      this.isLoading = true
      if (text) {
        this.loadingText = text
      }
    },
    
    hideLoading() {
      this.isLoading = false
      this.loadingText = '加载中...'
    }
  }
})