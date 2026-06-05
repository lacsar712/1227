<template>
  <div class="page-container" v-loading="loading">
    <template v-if="!loading && product">
      <div class="product-detail">
        <div class="gallery">
          <img :src="product.image || placeholderImg" :alt="product.name" />
          <div class="flash-tag" v-if="product.flash_sale">
            <span class="fire">🔥</span>
            限时秒杀中
          </div>
        </div>
        <div class="info">
          <h1>{{ product.name }}</h1>
          <router-link
            v-if="product.Brand"
            :to="`/brand/${product.Brand.slug}`"
            class="brand-link"
          >
            <div class="brand-info">
              <div class="brand-mini-logo">
                <span v-if="!product.Brand.logo">{{ product.Brand.name[0] }}</span>
                <img v-else :src="product.Brand.logo" :alt="product.Brand.name" />
              </div>
              <span class="brand-name">{{ product.Brand.name }}</span>
              <el-icon class="arrow-icon"><ArrowRight /></el-icon>
            </div>
          </router-link>
          <p class="desc">{{ product.description }}</p>

          <div class="flash-sale-box" v-if="product.flash_sale">
            <div class="flash-header">
              <span class="flash-label">限时秒杀</span>
              <CountdownTimer
                :target-time="product.flash_sale.end_time"
                prefix="距结束"
                :show-days="false"
                @end="refreshFlashSale"
              />
            </div>
            <div class="flash-price-box">
              <span class="flash-price">¥{{ product.flash_sale.sale_price }}</span>
              <span class="flash-orig">¥{{ product.price }}</span>
              <span class="flash-discount">
                省{{ Math.round((1 - product.flash_sale.sale_price / product.price) * 100) }}%
              </span>
            </div>
            <div class="flash-stock-row">
              <div class="flash-stock-bar">
                <div class="flash-stock-progress" :style="{ width: flashStockPercent + '%' }"></div>
              </div>
              <span class="flash-stock-text">
                已抢 {{ flashSoldPercent }}% · 仅剩 {{ product.flash_sale.stock }} 件
              </span>
            </div>
            <el-alert type="warning" show-icon :closable="false" class="flash-alert">
              秒杀商品数量有限，每个账号限购 1 件
            </el-alert>
          </div>

          <div class="price-box" v-else>
            <span class="price">¥{{ product.price }}</span>
            <span class="orig" v-if="product.original_price">¥{{ product.original_price }}</span>
            <span class="discount" v-if="product.original_price">
              省{{ Math.round((1 - product.price / product.original_price) * 100) }}%
            </span>
          </div>

          <div class="meta">已售 {{ product.sales_count || 0 }} 件 · 库存 {{ product.stock }} 件</div>
          <div class="quantity-row">
            <span>数量</span>
            <el-input-number
              v-model="quantity"
              :min="1"
              :max="maxQuantity"
              :disabled="isFlashSaleDisabled"
            />
          </div>
          <div class="actions">
            <el-button
              type="primary"
              size="large"
              :class="{ 'flash-btn': product.flash_sale }"
              @click="addToCart"
              :disabled="!userStore.isLoggedIn || isFlashSaleDisabled"
            >
              <el-icon><ShoppingCart /></el-icon>
              {{ product.flash_sale ? '立即抢购' : '加入购物车' }}
            </el-button>
            <el-button
              size="large"
              @click="buyNow"
              :disabled="!userStore.isLoggedIn || isFlashSaleDisabled"
            >
              立即购买
            </el-button>
          </div>
          <el-alert
            v-if="product.flash_sale && isFlashSaleDisabled"
            type="error"
            show-icon
            :closable="false"
            style="margin-top: 16px"
          >
            {{ flashSaleDisabledReason }}
          </el-alert>
          <el-alert v-if="!userStore.isLoggedIn" type="info" show-icon :closable="false" style="margin-top: 16px">
            请先 <router-link to="/login">登录</router-link> 后加入购物车或购买
          </el-alert>
        </div>
      </div>

      <div class="product-tabs">
        <el-tabs v-model="activeTab" type="border-card">
          <el-tab-pane label="商品详情" name="detail">
            <div class="detail-content">
              <div class="detail-section">
                <h3 class="section-title">商品介绍</h3>
                <p class="detail-desc">{{ product.description }}</p>
              </div>
              <div class="detail-section" v-if="product.specs">
                <h3 class="section-title">规格参数</h3>
                <div class="specs-grid">
                  <div v-for="(value, key) in product.specs" :key="key" class="spec-item">
                    <span class="spec-label">{{ key }}</span>
                    <span class="spec-value">{{ value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="问大家" name="qa">
            <ProductQA :product-id="product.id" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </template>
    <el-empty v-else-if="!loading && !product" description="商品不存在" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ShoppingCart, ArrowRight } from '@element-plus/icons-vue';
import { productsApi } from '@/api';
import { useUserStore } from '@/stores/user';
import { useCartStore } from '@/stores/cart';
import { useHistoryStore } from '@/stores/history';
import CountdownTimer from '@/components/ui/CountdownTimer.vue';
import ProductQA from '@/components/ui/ProductQA.vue';

const activeTab = ref('detail');

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const cartStore = useCartStore();
const historyStore = useHistoryStore();

const product = ref(null);
const loading = ref(true);
const quantity = ref(1);
const placeholderImg = '/images/products/placeholder-600x600.png';

const maxQuantity = computed(() => {
  if (product.value?.flash_sale) {
    return Math.min(1, product.value.flash_sale.stock, product.value.stock);
  }
  return product.value?.stock || 1;
});

const flashSoldPercent = computed(() => {
  if (!product.value?.flash_sale) return 0;
  const orig = product.value.flash_sale.original_stock || 0;
  const stock = product.value.flash_sale.stock || 0;
  if (orig <= 0) return 0;
  return Math.round(((orig - stock) / orig) * 100);
});

const flashStockPercent = computed(() => 100 - flashSoldPercent.value);

const isFlashSaleDisabled = computed(() => {
  if (!product.value?.flash_sale) return false;
  const fs = product.value.flash_sale;
  const now = Date.now();
  const startTime = new Date(fs.start_time).getTime();
  const endTime = new Date(fs.end_time).getTime();
  if (startTime > now) return true;
  if (endTime <= now) return true;
  if (fs.stock <= 0) return true;
  return false;
});

const flashSaleDisabledReason = computed(() => {
  if (!product.value?.flash_sale) return '';
  const fs = product.value.flash_sale;
  const now = Date.now();
  const startTime = new Date(fs.start_time).getTime();
  const endTime = new Date(fs.end_time).getTime();
  if (startTime > now) return '秒杀活动尚未开始';
  if (endTime <= now) return '秒杀活动已结束';
  if (fs.stock <= 0) return '秒杀商品已售罄';
  return '';
});

async function refreshFlashSale() {
  try {
    product.value = await productsApi.detail(route.params.id);
  } catch {
    // ignore
  }
}

onMounted(async () => {
  if (route.query.tab === 'qa') {
    activeTab.value = 'qa';
  }
  try {
    product.value = await productsApi.detail(route.params.id);
    if (product.value) {
      historyStore.add(product.value);
    }
  } catch {
    product.value = null;
  } finally {
    loading.value = false;
  }
});

watch(activeTab, (newTab) => {
  if (newTab === 'qa') {
    router.replace({ query: { tab: 'qa' } });
  } else {
    router.replace({ query: {} });
  }
});

async function addToCart() {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  if (isFlashSaleDisabled.value) {
    ElMessage.warning(flashSaleDisabledReason.value);
    return;
  }
  try {
    const flashSaleId = product.value.flash_sale ? product.value.flash_sale.id : null;
    await cartStore.add(product.value.id, quantity.value, flashSaleId);
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
  if (isFlashSaleDisabled.value) {
    ElMessage.warning(flashSaleDisabledReason.value);
    return;
  }
  const flashSaleId = product.value.flash_sale ? product.value.flash_sale.id : null;
  const directItem = {
    id: `direct_${product.value.id}_${Date.now()}`,
    product_id: product.value.id,
    quantity: quantity.value,
    flash_sale_id: flashSaleId,
    price: flashSaleId ? product.value.flash_sale.sale_price : product.value.price,
    effective_price: flashSaleId ? product.value.flash_sale.sale_price : product.value.price,
    product: {
      id: product.value.id,
      name: product.value.name,
      image: product.value.image,
      price: product.value.price,
      description: product.value.description,
      stock: product.value.stock,
      status: product.value.status
    },
    flash_sale: product.value.flash_sale || null
  };
  try {
    sessionStorage.setItem('checkout_direct_items', JSON.stringify([directItem]));
  } catch {
    // ignore
  }
  router.push('/checkout');
}
</script>

<style scoped>
.product-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  padding: 32px 0;
}

.product-tabs {
  margin-top: 32px;
}

.product-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.product-tabs :deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 500;
  height: 50px;
  line-height: 50px;
}

.product-tabs :deep(.el-tabs__item.is-active) {
  color: var(--color-primary);
}

.product-tabs :deep(.el-tabs__active-bar) {
  background-color: var(--color-primary);
}

.product-tabs :deep(.el-tab-pane) {
  padding: 24px;
}

.detail-content {
  min-height: 200px;
}

.detail-section {
  margin-bottom: 32px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px;
  color: var(--color-text);
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.detail-desc {
  font-size: 15px;
  line-height: 1.8;
  color: var(--color-text-muted);
  margin: 0;
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.spec-item {
  display: flex;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  gap: 12px;
}

.spec-label {
  font-size: 14px;
  color: var(--color-text-muted);
  flex-shrink: 0;
  width: 80px;
}

.spec-value {
  font-size: 14px;
  color: var(--color-text);
  font-weight: 500;
  flex: 1;
}
.gallery {
  position: relative;
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

.flash-tag {
  position: absolute;
  top: 16px;
  left: 16px;
  background: linear-gradient(135deg, #ef4444, #f97316);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 10;
}

.flash-tag .fire {
  font-size: 16px;
}

.info h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 12px;
}

.brand-link {
  display: inline-block;
  margin-bottom: 16px;
}

.brand-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px 8px 8px;
  background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%);
  border-radius: 24px;
  transition: all 0.2s ease;
}

.brand-info:hover {
  background: linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%);
  transform: translateX(2px);
}

.brand-mini-logo {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.brand-mini-logo span {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}

.brand-mini-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.brand-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
}

.arrow-icon {
  color: var(--color-primary);
  font-size: 14px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.brand-info:hover .arrow-icon {
  opacity: 1;
}

.desc {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 24px;
}

.flash-sale-box {
  background: linear-gradient(135deg, #fef2f2 0%, #fff 100%);
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.flash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.flash-label {
  background: linear-gradient(135deg, #ef4444, #f97316);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
}

.flash-price-box {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 12px;
}

.flash-price {
  font-size: 36px;
  font-weight: 800;
  color: #ef4444;
}

.flash-orig {
  font-size: 16px;
  color: #94a3b8;
  text-decoration: line-through;
}

.flash-discount {
  background: #ef4444;
  color: #fff;
  font-size: 13px;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.flash-stock-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.flash-stock-bar {
  flex: 1;
  height: 8px;
  background: #fecaca;
  border-radius: 4px;
  overflow: hidden;
}

.flash-stock-progress {
  height: 100%;
  background: linear-gradient(90deg, #f97316, #ef4444);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.flash-stock-text {
  font-size: 13px;
  color: #ef4444;
  font-weight: 600;
  white-space: nowrap;
}

.flash-alert {
  margin-top: 12px;
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

.flash-btn {
  background: linear-gradient(135deg, #ef4444, #f97316) !important;
  border: none !important;
}

.flash-btn:hover {
  opacity: 0.9;
}

@media (max-width: 768px) {
  .product-detail { grid-template-columns: 1fr; }
  .flash-price { font-size: 28px; }

  .product-tabs :deep(.el-tab-pane) {
    padding: 16px;
  }

  .specs-grid {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 16px;
  }
}
</style>
