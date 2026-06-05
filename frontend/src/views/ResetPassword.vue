<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1>重置密码</h1>
      <p class="subtitle">请输入新密码</p>
      <el-form :model="form" class="auth-form">
        <el-form-item>
          <el-input v-model="form.token" placeholder="重置令牌（从邮件链接获取）" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="新密码（至少6位）" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="submit">
            重置密码
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
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { authApi } from '@/api';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const form = reactive({ token: '', password: '' });

onMounted(() => {
  form.token = route.query.token || '';
});

async function submit() {
  if (!form.token || !form.password) {
    ElMessage.warning('请填写完整');
    return;
  }
  if (form.password.length < 6) {
    ElMessage.warning('密码至少6位');
    return;
  }
  loading.value = true;
  try {
    await authApi.resetPassword(form);
    ElMessage.success('密码已重置');
    router.push('/login');
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
