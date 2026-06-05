<template>
  <div class="page-container">
    <h1 class="page-title">购物车</h1>
    <div v-loading="loading">
      <template v-if="!loading && cartItems.length">
        <div class="cart-list">
          <div v-for="item in cartItems" :key="item.id" class="cart-item">
            <div class="item-img">
              <img :src="item.product?.image || placeholderImg" :alt="item.product?.name" />
            </div>
            <div class="item-info">
              <router-link :to="`/product/${item.product_id}`" class="item-name">
                {{ item.product?.name }}
              </router-link>
              <div class="item-price">¥{{ item.product?.price }}</div>
            </div>
            <div class="item-quantity">
              <el-input-number
                :model-value="item.quantity"
                :min="1"
                :max="item.product?.stock || 99"
                @update:model-value="(v) => updateQty(item.id, v)"
              />
            </div>
            <div class="item-subtotal">¥{{ ((item.product?.price || 0) * item.quantity).toFixed(2) }}</div>
            <el-button type="danger" text @click="removeItem(item.id)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
        <div class="cart-footer">
          <el-button @click="cartStore.clear" :disabled="!cartItems.length">清空购物车</el-button>
          <div class="total">
            合计：<span class="amount">¥{{ cartTotal.toFixed(2) }}</span>
            <el-button type="primary" size="large" @click="goCheckout">去结算</el-button>
          </div>
        </div>
      </template>
      <el-empty v-else-if="!loading" description="购物车是空的">
        <router-link to="/products"><el-button type="primary">去逛逛</el-button></router-link>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Delete } from '@element-plus/icons-vue';
import { useCartStore } from '@/stores/cart';

const router = useRouter();
const cartStore = useCartStore();
const cartItems = computed(() => cartStore.items?.value ?? []);
const cartTotal = computed(() => cartStore.total?.value ?? 0);
const loading = ref(true);
const placeholderImg = '/images/products/placeholder-200x200.png';

onMounted(async () => {
  await cartStore.fetchCart();
  loading.value = false;
});

async function updateQty(id, qty) {
  await cartStore.updateQuantity(id, qty);
}

async function removeItem(id) {
  await cartStore.remove(id);
}

function goCheckout() {
  router.push('/checkout');
}
</script>

<style scoped>
.cart-list {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.cart-item {
  display: grid;
  grid-template-columns: 80px 1fr 140px 100px 48px;
  gap: 24px;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}
.cart-item:last-child { border-bottom: none; }
.item-img {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}
.item-img img { width: 100%; height: 100%; object-fit: cover; }
.item-name {
  font-size: 16px;
  font-weight: 500;
  display: block;
  margin-bottom: 8px;
}
.item-name:hover { color: #6366f1; }
.item-price { color: #ef4444; font-weight: 600; }
.item-subtotal { font-weight: 600; font-size: 16px; }
.cart-footer {
  margin-top: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.total {
  display: flex;
  align-items: center;
  gap: 16px;
}
.amount { font-size: 20px; font-weight: 700; color: #ef4444; }
@media (max-width: 768px) {
  .cart-item {
    grid-template-columns: 60px 1fr;
    gap: 12px;
  }
  .item-quantity, .item-subtotal { grid-column: 2; }
}
</style>
