<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="store.visible && (store.config.title || store.config.message)" class="confirm-overlay" @click.self="store.cancel">
        <div class="confirm-modal" role="dialog" aria-modal="true" :class="`confirm--${store.config.type || 'info'}`">
          <div class="confirm-icon-wrap">
            <el-icon v-if="(store.config.type || 'info') === 'warning'" :size="48" class="icon-warning">
              <WarningFilled />
            </el-icon>
            <el-icon v-else-if="(store.config.type || 'info') === 'danger'" :size="48" class="icon-danger">
              <CircleCloseFilled />
            </el-icon>
            <el-icon v-else :size="48" class="icon-info">
              <InfoFilled />
            </el-icon>
          </div>
          <h3 class="confirm-title">{{ store.config.title }}</h3>
          <p class="confirm-message">{{ store.config.message }}</p>
          <div class="confirm-actions">
            <button type="button" class="btn btn-ghost" @click="store.cancel">
              {{ store.config.cancelText }}
            </button>
            <button type="button" class="btn btn-primary" @click="store.confirm">
              {{ store.config.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { WarningFilled, CircleCloseFilled, InfoFilled } from '@element-plus/icons-vue';
import { useConfirmStore } from '@/stores/confirm';

const store = useConfirmStore();
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.confirm-modal {
  width: 100%;
  max-width: 400px;
  padding: 40px 32px;
  background: #fff;
  border-radius: 20px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  text-align: center;
  animation: modal-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.confirm-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  border-radius: 50%;
}

.confirm--warning .confirm-icon-wrap {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #d97706;
}

.confirm--danger .confirm-icon-wrap {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
}

.confirm--info .confirm-icon-wrap {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #2563eb;
}

.confirm-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px;
  letter-spacing: -0.02em;
}

.confirm-message {
  font-size: 15px;
  line-height: 1.6;
  color: #64748b;
  margin: 0 0 32px;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  min-width: 100px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 500;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-ghost {
  background: #f1f5f9;
  color: #475569;
}

.btn-ghost:hover {
  background: #e2e8f0;
  color: #334155;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
}

.confirm--danger .btn-primary {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
}

.confirm--danger .btn-primary:hover {
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
}

.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.2s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}
</style>
