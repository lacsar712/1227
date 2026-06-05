<template>
  <header class="app-header">
    <div class="header-inner">
      <router-link to="/" class="logo">
        <el-icon :size="28"><ShoppingBag /></el-icon>
        <span>优选商城</span>
      </router-link>
      <div class="nav-search">
        <el-input
          v-model="keyword"
          placeholder="搜索商品"
          clearable
          class="search-input"
          @keyup.enter="onSearch"
        >
          <template #append>
            <el-button :icon="Search" @click="onSearch">搜索</el-button>
          </template>
        </el-input>
      </div>
      <nav class="nav-links">
        <router-link to="/" class="nav-item">首页</router-link>
        <router-link to="/products" class="nav-item">商品</router-link>
        <template v-if="userStore.isLoggedIn">
          <router-link to="/cart" class="nav-item cart-link">
            <el-badge :value="cartCount" :max="99" :hidden="cartCount === 0">
              <el-icon :size="22"><ShoppingCart /></el-icon>
            </el-badge>
            <span>购物车</span>
          </router-link>
          <el-dropdown trigger="click" @command="handleUserCommand">
            <span class="user-dropdown">
              <el-avatar :size="32">{{ userStore.user?.nickname?.[0] || 'U' }}</el-avatar>
              <span class="username">{{ userStore.user?.nickname || userStore.user?.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="orders">我的订单</el-dropdown-item>
                <el-dropdown-item command="address">收货地址</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <router-link to="/login" class="nav-item">登录</router-link>
          <router-link to="/register" class="nav-item">注册</router-link>
        </template>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search, ShoppingBag, ShoppingCart, ArrowDown } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { useCartStore } from '@/stores/cart';

const router = useRouter();
const userStore = useUserStore();
const cartStore = useCartStore();
const cartCount = computed(() => cartStore.count?.value ?? 0);
const keyword = ref('');

onMounted(async () => {
  if (userStore.isLoggedIn) {
    await userStore.fetchUser();
    await cartStore.fetchCart();
  }
});

function onSearch() {
  if (!keyword.value.trim()) {
    router.push('/products');
  } else {
    router.push({ path: '/products', query: { keyword: keyword.value } });
  }
}

function handleUserCommand(cmd) {
  if (cmd === 'logout') {
    userStore.logout();
    cartStore.clear();
    router.push('/');
  } else if (cmd === 'profile') {
    router.push('/profile');
  } else if (cmd === 'orders') {
    router.push('/orders');
  } else if (cmd === 'address') {
    router.push('/profile/address');
  }
}
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  z-index: 1000;
}
.header-inner {
  max-width: 1280px;
  margin: 0 auto;
  height: 100%;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 32px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: #6366f1;
  flex-shrink: 0;
}
.logo:hover {
  color: #4f46e5;
}
.nav-search {
  flex: 1;
  max-width: 480px;
}
.search-input {
  --el-input-border-radius: 24px;
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
}
.nav-item {
  font-size: 15px;
  color: #475569;
  transition: color 0.2s;
}
.nav-item:hover {
  color: #6366f1;
}
.cart-link {
  display: flex;
  align-items: center;
  gap: 6px;
}
.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
}
.user-dropdown:hover {
  background: #f1f5f9;
}
.username {
  font-size: 14px;
  color: #334155;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}
@media (max-width: 768px) {
  .nav-search { display: none; }
  .username { display: none; }
}
</style>
