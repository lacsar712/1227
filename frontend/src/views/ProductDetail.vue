<template>
  <div class="page-container" v-loading="loading">
    <template v-if="!loading && product">
      <div class="product-detail">
        <div class="gallery">
          <img :src="product.image || placeholderImg" :alt="product.name" />
        </div>
        <div class="info">
          <h1>{{ product.name }}</h1>
          <p class="desc">{{ product.description }}</p>
          <div class="price-box">
            <span class="price">¥{{ product.price }}</span>
            <span class="orig" v-if="product.original_price">¥{{ product.original_price }}</span>
            <span class="discount" v-if="product.original_price">
              省{{ Math.round((1 - product.price / product.original_price) * 100) }}%
            </span>
          </div>
          <div class="meta">已售 {{ product.sales_count || 0 }} 件 · 库存 {{ product.stock }} 件</div>
          <div class="quantity-row">
            <span>数量</span>
            <el-input-number v-model="quantity" :min="1" :max="product.stock" />
          </div>
          <div class="actions">
            <el-button type="primary" size="large" @click="addToCart" :disabled="!userStore.isLoggedIn">
              <el-icon><ShoppingCart /></el-icon>
              加入购物车
            </el-button>
            <el-button size="large" @click="buyNow" :disabled="!userStore.isLoggedIn">
              立即购买
            </el-button>
          </div>
          <el-alert v-if="!userStore.isLoggedIn" type="info" show-icon :closable="false" style="margin-top: 16px">
            请先 <router-link to="/login">登录</router-link> 后加入购物车或购买
          </el-alert>
        </div>
      </div>
    </template>
    <el-empty v-else-if="!loading && !product" description="商品不存在" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ShoppingCart } from '@element-plus/icons-vue';
import { productsApi } from '@/api';
import { useUserStore } from '@/stores/user';
import { useCartStore } from '@/stores/cart';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const cartStore = useCartStore();

const product = ref(null);
const loading = ref(true);
const quantity = ref(1);
const placeholderImg = '/images/products/placeholder-600x600.png';

onMounted(async () => {
  try {
    product.value = await productsApi.detail(route.params.id);
  } catch {
    product.value = null;
  } finally {
    loading.value = false;
  }
});

async function addToCart() {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  try {
    await cartStore.add(product.value.id, quantity.value);
    ElMessage.success('已加入购物车');
  } catch (e) {
    // message shown by interceptor
  }
}

function buyNow() {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  addToCart().then(() => {
    router.push('/checkout');
  });
}
</script>

<style scoped>
.product-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  padding: 32px 0;
}
.gallery {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.gallery img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}
.info h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 16px;
}
.desc {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 24px;
}
.price-box {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
}
.price { font-size: 32px; font-weight: 700; color: #ef4444; }
.orig { font-size: 16px; color: #94a3b8; text-decoration: line-through; }
.discount {
  background: #fef2f2;
  color: #ef4444;
  font-size: 14px;
  padding: 2px 8px;
  border-radius: 4px;
}
.meta { color: #64748b; font-size: 14px; margin-bottom: 24px; }
.quantity-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.actions { display: flex; gap: 12px; }
@media (max-width: 768px) {
  .product-detail { grid-template-columns: 1fr; }
}
</style>
