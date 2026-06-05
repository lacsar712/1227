<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1>注册</h1>
      <p class="subtitle">创建您的优选商城账号</p>
      <el-form ref="formRef" :model="form" :rules="rules" class="auth-form">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名（2-20字符）" size="large" />
        </el-form-item>
        <el-form-item prop="email">
          <el-input v-model="form.email" placeholder="邮箱" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码（至少6位）" size="large" show-password />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" placeholder="确认密码" size="large" show-password />
        </el-form-item>
        <el-form-item prop="nickname">
          <el-input v-model="form.nickname" placeholder="昵称（选填）" size="large" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="submit">
            注册
          </el-button>
        </el-form-item>
        <div class="links">
          <router-link to="/login">已有账号？立即登录</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { authApi } from '@/api';
import { useUserStore } from '@/stores/user';
import { z } from 'zod';

const router = useRouter();
const userStore = useUserStore();
const formRef = ref();
const loading = ref(false);

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  nickname: ''
});

const validatePass = (rule, value, callback) => {
  if (value !== form.password) callback(new Error('两次密码不一致'));
  else callback();
};

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名2-20字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式无效', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [{ validator: validatePass, trigger: 'blur' }]
};

async function submit() {
  await formRef.value?.validate().catch(() => {});
  loading.value = true;
  try {
    const data = await authApi.register({
      username: form.username,
      email: form.email,
      password: form.password,
      nickname: form.nickname || undefined
    });
    userStore.setAuth(data.token, data.user);
    ElMessage.success('注册成功');
    router.push('/');
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
.links a:hover { text-decoration: underline; }
</style>
