<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1>找回密码</h1>
      <p class="subtitle">输入注册邮箱，我们将发送重置链接</p>
      <el-form :model="form" class="auth-form">
        <el-form-item>
          <el-input v-model="form.email" placeholder="注册邮箱" size="large" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="submit">
            发送重置链接
          </el-button>
        </el-form-item>
        <div class="links">
          <router-link to="/login">返回登录</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { authApi } from '@/api';

const loading = ref(false);
const form = reactive({ email: '' });

async function submit() {
  if (!form.email) {
    ElMessage.warning('请输入邮箱');
    return;
  }
  loading.value = true;
  try {
    const data = await authApi.forgotPassword({ email: form.email });
    ElMessage.success(data.message || '已发送，请查收邮件');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
}
.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 48px 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
}
.auth-card h1 { font-size: 28px; font-weight: 700; margin: 0 0 8px; }
.subtitle { color: #64748b; margin: 0 0 32px; }
.auth-form :deep(.el-form-item) { margin-bottom: 20px; }
.submit-btn { width: 100%; height: 44px; }
.links { margin-top: 16px; font-size: 14px; }
.links a { color: #6366f1; }
</style>
