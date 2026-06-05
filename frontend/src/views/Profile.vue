<template>
  <div class="page-container">
    <h1 class="page-title">个人中心</h1>
    <el-card shadow="never" class="profile-card">
      <div class="profile-header">
        <el-avatar :size="80">{{ userStore.user?.nickname?.[0] || 'U' }}</el-avatar>
        <div class="profile-info">
          <h2>{{ userStore.user?.nickname || userStore.user?.username }}</h2>
          <p>{{ userStore.user?.email }}</p>
        </div>
      </div>
      <el-divider />
      <div class="quick-links">
        <router-link to="/orders" class="link-item">
          <el-icon :size="24"><Document /></el-icon>
          <span>我的订单</span>
        </router-link>
        <router-link to="/profile/address" class="link-item">
          <el-icon :size="24"><Location /></el-icon>
          <span>收货地址</span>
        </router-link>
        <router-link to="/cart" class="link-item">
          <el-icon :size="24"><ShoppingCart /></el-icon>
          <span>购物车</span>
        </router-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { Document, Location, ShoppingCart } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { onMounted } from 'vue';

const userStore = useUserStore();

onMounted(() => {
  userStore.fetchUser();
});
</script>

<style scoped>
.profile-card { max-width: 600px; }
.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
}
.profile-info h2 { font-size: 22px; margin: 0 0 8px; }
.profile-info p { margin: 0; color: #64748b; }
.quick-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.link-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 16px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.2s;
}
.link-item:hover {
  background: #eef2ff;
  color: #6366f1;
}
@media (max-width: 600px) {
  .quick-links { grid-template-columns: 1fr; }
}
</style>
