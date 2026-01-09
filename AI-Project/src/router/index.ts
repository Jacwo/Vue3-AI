import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        requiresAuth: true,
        title: '主页'
      }
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('../views/HistoryView.vue'),
      meta: {
        requiresAuth: true,
        title: '历史分析'
      }
    },
    {
      path: '/history/:id',
      name: 'history-detail',
      component: () => import('../views/HistoryDetailView.vue'),
      meta: {
        requiresAuth: true,
        title: '分析详情'
      }
    },
    {
      path: '/analysis/:id',
      name: 'analysis',
      component: () => import('../views/AnalysisView.vue'),
      meta: {
        requiresAuth: true,
        title: '分析'
      }
    },
    {
      path: '/tool',
      name: 'tool',
      component: () => import('../views/ToolView.vue'),
      meta: {
        requiresAuth: true,
        title: '小工具'
      }

    },
    {
      path: '/ai',
      name: 'ai-chat',
      component: () => import('../views/AiChat.vue'),
      meta: {
        requiresAuth: true,
        title: 'ai对话'
      }
    }, {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: {
        requiresAuth: false,
        title: '登录'
      }
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/views/Profile.vue'),
      meta: {
        requiresAuth: true,
        title: '个人中心'
      }
    }
  ]
})
// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  // 初始化用户状态
  if (!userStore.userInfo && localStorage.getItem('token')) {
    userStore.initFromStorage()
  }

  // 检查是否需要认证
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else if (to.path === '/login' && userStore.isLoggedIn) {
    // 如果已登录但访问登录页，重定向到个人中心
    next('/profile')
  } else {
    next()
  }
})
export default router