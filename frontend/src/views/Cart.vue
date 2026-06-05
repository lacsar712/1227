<template>
  <div class="page-container">
    <h1 class="page-title">购物车</h1>
    <div v-loading="loading">
      <template v-if="!loading && cartItems.length">
        <template v-if="validItems.length">
          <div class="cart-section-title">可购买商品 ({{ validItems.length }})</div>
          <div class="cart-list">
            <div v-for="item in validItems" :key="item.id" class="cart-item" :class="{ 'flash-item': item.flash_sale }">
              <div class="item-img">
                <img :src="item.product?.image || placeholderImg" :alt="item.product?.name" />
                <div class="flash-badge" v-if="item.flash_sale">🔥 秒杀</div>
              </div>
              <div class="item-info">
                <router-link :to="`/product/${item.product_id}`" class="item-name">
                  {{ item.product?.name }}
                  <span class="flash-tag" v-if="item.flash_sale">限时秒杀</span>
                </router-link>
                <div class="item-price">
                  <span class="current-price">¥{{ item.effective_price }}</span>
                  <span class="orig-price" v-if="item.effective_price < item.product?.price">¥{{ item.product?.price }}</span>
                </div>
              </div>
              <div class="item-quantity">
                <el-input-number
                  :model-value="item.quantity"
                  :min="1"
                  :max="item.flash_sale ? 1 : (item.product?.stock || 99)"
                  :disabled="!!item.flash_sale"
                  @update:model-value="(v) => updateQty(item.id, v)"
                />
              </div>
              <div class="item-subtotal">¥{{ ((item.effective_price || 0) * item.quantity).toFixed(2) }}</div>
              <el-button type="danger" text @click="removeItem(item.id)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </template>

        <template v-if="expiredItems.length">
          <div class="cart-section-title expired-title">已失效商品 ({{ expiredItems.length }})</div>
          <div class="cart-list expired-list">
            <div v-for="item in expiredItems" :key="item.id" class="cart-item expired-item">
              <div class="item-img">
                <img :src="item.product?.image || placeholderImg" :alt="item.product?.name" />
              </div>
              <div class="item-info">
                <router-link :to="`/product/${item.product_id}`" class="item-name">
                  {{ item.product?.name }}
                </router-link>
                <div class="expired-reason">
                  <el-icon><Warning /></el-icon>
                  {{ item.is_flash_sale_expired ? '秒杀活动已结束' : '商品已下架' }}
                </div>
              </div>
              <div class="item-quantity">
                <el-input-number :model-value="item.quantity" :min="1" :max="1" disabled />
              </div>
              <div class="item-subtotal">-</div>
              <el-button type="danger" text @click="removeItem(item.id)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </template>
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
import { Delete, Warning } from '@element-plus/icons-vue';
import { useCartStore } from '@/stores/cart';

const router = useRouter();
const cartStore = useCartStore();
const cartItems = computed(() => cartStore.items?.value ?? []);
const validItems = computed(() => cartStore.validItems?.value ?? []);
const expiredItems = computed(() => cartStore.expiredItems?.value ?? []);
const cartTotal = computed(() => cartStore.total?.value ?? 0);
const loading = ref(true);
const placeholderImg = '/images/products/placeholder-200x200.png';

function goCheckout() {
  if (validItems.value.length === 0) {
    return;
  }
  router.push('/checkout');
}

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
</script>

<style scoped>
.cart-section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 24px 0 12px;
  color: #1e293b;
}
.cart-section-title.expired-title {
  color: #94a3b8;
}
.cart-list {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.cart-list.expired-list {
  background: #f8fafc;
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
.cart-item.flash-item {
  background: linear-gradient(90deg, #fef2f2 0%, #fff 30%);
}
.cart-item.expired-item {
  opacity: 0.6;
}
.item-img {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}
.item-img img { width: 100%; height: 100%; object-fit: cover; }
.flash-badge {
  position: absolute;
  top: 4px;
  left: 4px;
  background: linear-gradient(135deg, #ef4444, #f97316);
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 600;
}
.item-name {
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.item-name:hover { color: #6366f1; }
.flash-tag {
  background: #fef2f2;
  color: #ef4444;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}
.item-price {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.current-price { color: #ef4444; font-weight: 700; font-size: 16px; }
.orig-price { color: #94a3b8; font-size: 13px; text-decoration: line-through; }
.expired-reason {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #f59e0b;
  font-size: 13px;
}
.item-subtotal { font-weight: 600; font-size: 16px; color: #1e293b; }
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
