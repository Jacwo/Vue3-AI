<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <div class="app-header">
      <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />
      <div class="app-title">
        <h1>xx分析助手</h1>
        <p class="subtitle">专业的xx比赛分析与预测</p>
      </div>
    </div>

    <div class="wrapper">
      <nav>
        <RouterLink to="/">比赛列表</RouterLink>
        <RouterLink to="/history">历史记录</RouterLink>
      </nav>
    </div>
  </header>

  <main>
    <RouterView />
  </main>
</template>

<style scoped>
header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 0;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}

.app-title {
  text-align: left;
}

.app-title h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: bold;
}

.subtitle {
  margin: 5px 0 0;
  opacity: 0.9;
  font-size: 1.1rem;
}

.logo {
  display: block;
  filter: brightness(0) invert(1);
}

nav {
  width: 100%;
  font-size: 1rem;
  text-align: center;
  margin-top: 1rem;
}

nav a {
  display: inline-block;
  padding: 0.5rem 1.5rem;
  color: white;
  text-decoration: none;
  border-radius: 20px;
  margin: 0 10px;
  transition: all 0.3s ease;
}

nav a:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

nav a.router-link-exact-active {
  background-color: rgba(255, 255, 255, 0.2);
  font-weight: bold;
}

main {
  max-width: 1200px;
  margin: 0 auto;
}

@media (min-width: 1024px) {
  header {
    padding: 2rem;
  }

  .app-header {
    justify-content: flex-start;
    padding-left: 2rem;
  }

  nav {
    text-align: left;
    padding-left: 2rem;
  }
}
</style>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
}
</style>