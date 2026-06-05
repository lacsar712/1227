import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (res) => {
    const { code, message, data } = res.data;
    if (code === 0) return data;
    ElMessage.error(message || '请求失败');
    return Promise.reject(new Error(message));
  },
  (err) => {
    const msg = err.response?.data?.message || err.message || '网络异常';
    if (err.response?.status === 401) {
      try {
        const store = useUserStore();
        store.logout();
      } catch (_) {}
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else {
      ElMessage.error(msg);
    }
    return Promise.reject(err);
  }
);

export default api;
