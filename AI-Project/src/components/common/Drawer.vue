<template>
  <transition name="drawer">
    <div v-if="visible" class="drawer-overlay" @click="handleOverlayClick">
      <div class="drawer-container" :style="{ width }" @click.stop>
        <div class="drawer-header">
          <slot name="header">
            <div class="drawer-title">
              {{ title }}
              <button class="drawer-close" @click="close">
                <span>×</span>
              </button>
            </div>
          </slot>
        </div>
        
        <div class="drawer-body">
          <slot></slot>
        </div>
        
        <div v-if="$slots.footer" class="drawer-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  visible: boolean
  title?: string
  width?: string
  closeOnClickOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '',
  width: '50%',
  closeOnClickOverlay: true
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  close: []
}>()

const close = () => {
  emit('update:visible', false)
  emit('close')
}

const handleOverlayClick = () => {
  if (props.closeOnClickOverlay) {
    close()
  }
}

// ESC 键关闭
const handleEscKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.visible) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscKey)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey)
})
</script>

<style scoped>
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.3s ease;
}

.drawer-container {
  height: 100%;
  background: white;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
}

.drawer-header {
  padding: 20px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.drawer-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drawer-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.drawer-close:hover {
  background: #f5f5f5;
  color: #666;
}

.drawer-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.drawer-footer {
  padding: 16px 20px;
  border-top: 1px solid #e8e8e8;
  flex-shrink: 0;
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .drawer-container {
    width: 100% !important;
  }
}
</style>