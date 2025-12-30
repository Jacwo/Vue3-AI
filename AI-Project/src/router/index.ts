import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('../views/HistoryView.vue')
    },
    {
      path: '/history/:id',
      name: 'history-detail',
      component: () => import('../views/HistoryDetailView.vue')
    },
    {
      path: '/analysis/:id',
      name: 'analysis',
      component: () => import('../views/AnalysisView.vue')
    },
    {
      path: '/tool',
      name: 'tool',
      component: () => import('../views/ToolView.vue')
    }
  ]
})

export default router