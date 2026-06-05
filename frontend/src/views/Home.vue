<template>
  <div class="home-page">
    <section class="hero">
      <div class="hero-content">
        <h1>品质生活，触手可及</h1>
        <p>精选好物，畅享购物新体验</p>
        <router-link to="/products">
          <el-button type="primary" size="large" round>立即选购</el-button>
        </router-link>
      </div>
    </section>

    <section class="flash-sale-section" v-if="flashSaleList.length">
      <div class="page-container">
        <div class="flash-header">
          <div class="flash-title">
            <span class="flash-icon">🔥</span>
            <h2 class="section-title">限时秒杀</h2>
          </div>
          <router-link to="/flash-sale" class="flash-more">
            查看更多
            <el-icon><ArrowRight /></el-icon>
          </router-link>
        </div>
        <div class="flash-grid">
          <div
            v-for="item in flashSaleList"
            :key="item.id"
            class="flash-item"
          >
            <router-link :to="`/product/${item.product_id}`" class="flash-link">
              <div class="flash-img">
                <img :src="item.product?.image || placeholderImg" :alt="item.name" />
                <div class="flash-badge">秒杀</div>
              </div>
              <div class="flash-info">
                <div class="flash-price-row">
                  <span class="flash-price">¥{{ item.sale_price }}</span>
                  <span class="flash-orig">¥{{ item.original_price }}</span>
                </div>
                <div class="flash-stock">
                  <span>仅剩 {{ item.stock }} 件</span>
                </div>
                <div class="flash-timer">
                  <CountdownTimer :target-time="item.end_time" prefix="距结束" :show-days="false" />
                </div>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <section class="categories-section">
      <div class="page-container">
        <h2 class="section-title">热门分类</h2>
        <div class="categories-grid">
          <router-link
            v-for="cat in categories"
            :key="cat.id"
            :to="`/products?category_id=${cat.id}`"
            class="category-card"
          >
            <div class="cat-icon">{{ cat.name[0] }}</div>
            <span>{{ cat.name }}</span>
          </router-link>
        </div>
      </div>
    </section>
    <section class="products-section">
      <div class="page-container">
        <h2 class="section-title">精选推荐</h2>
        <div v-loading="loading" class="products-grid">
          <template v-if="!loading">
            <router-link
              v-for="p in products"
              :key="p.id"
              :to="`/product/${p.id}`"
              class="product-card"
            >
              <div class="product-img">
                <img :src="p.image || placeholderImg" :alt="p.name" />
                <div class="product-badge" v-if="p.flash_sale">
                  <span class="fire">🔥</span>
                  秒杀中
                </div>
                <div class="product-badge discount-badge" v-else-if="p.original_display_price">
                  省{{ discount(p) }}%
                </div>
              </div>
              <div class="product-info">
                <h3>{{ p.name }}</h3>
                <div class="price-row">
                  <span class="price" :class="{ 'flash-price-tag': p.flash_sale }">¥{{ p.display_price }}</span>
                  <span class="orig" v-if="p.original_display_price">¥{{ p.original_display_price }}</span>
                </div>
              </div>
            </router-link>
          </template>
        </div>
        <div class="more-wrap">
          <router-link to="/products">
            <el-button>查看更多</el-button>
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ArrowRight } from '@element-plus/icons-vue';
import { categoriesApi, productsApi, flashSalesApi } from '@/api';
import CountdownTimer from '@/components/ui/CountdownTimer.vue';

const categories = ref([]);
const products = ref([]);
const flashSaleList = ref([]);
const loading = ref(true);
const placeholderImg = '/images/products/placeholder-400x400.png';

onMounted(async () => {
  try {
    const [cats, res, flashRes] = await Promise.all([
      categoriesApi.list(),
      productsApi.list({ limit: 8 }),
      flashSalesApi.homeList(4)
    ]);
    categories.value = cats;
    products.value = res.list || [];
    flashSaleList.value = flashRes || [];
  } finally {
    loading.value = false;
  }
});

function discount(p) {
  const orig = p.original_display_price || p.original_price || 0;
  const curr = p.display_price || p.price || 0;
  if (orig <= 0 || curr >= orig) return 0;
  return Math.round((1 - curr / orig) * 100);
}
</script>

<style scoped>
.hero {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  padding: 80px 24px 100px;
  text-align: center;
  color: #fff;
}
.hero-content h1 {
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 16px;
  letter-spacing: -0.02em;
}
.hero-content p {
  font-size: 18px;
  opacity: 0.9;
  margin: 0 0 32px;
}

.flash-sale-section {
  padding: 48px 0;
  background: linear-gradient(180deg, #fef2f2 0%, #fff 100%);
  margin-top: -40px;
  position: relative;
  z-index: 10;
}

.flash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.flash-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flash-icon {
  font-size: 28px;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.flash-more {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ef4444;
  font-weight: 500;
  text-decoration: none;
  font-size: 14px;
}

.flash-more:hover {
  opacity: 0.8;
}

.flash-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.flash-item {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(239,68,68,0.1);
  transition: all 0.2s ease;
}

.flash-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(239,68,68,0.2);
}

.flash-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.flash-img {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f8fafc;
}

.flash-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.flash-item:hover .flash-img img {
  transform: scale(1.05);
}

.flash-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: linear-gradient(135deg, #ef4444, #f97316);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
}

.flash-info {
  padding: 12px;
}

.flash-price-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 6px;
}

.flash-price {
  font-size: 20px;
  font-weight: 700;
  color: #ef4444;
}

.flash-orig {
  font-size: 12px;
  color: #94a3b8;
  text-decoration: line-through;
}

.flash-stock {
  font-size: 12px;
  color: #f97316;
  font-weight: 500;
  margin-bottom: 8px;
}

.flash-timer {
  padding: 6px;
  background: #fef2f2;
  border-radius: 6px;
  display: flex;
  justify-content: center;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 24px;
  color: #1e293b;
}
.categories-section {
  padding: 48px 0;
}
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}
.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: all 0.2s ease;
}
.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(99,102,241,0.15);
}
.cat-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
}
.products-section {
  padding-bottom: 64px;
}
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
  min-height: 200px;
}
.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: all 0.2s ease;
  display: block;
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}
.product-img {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
}
.product-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.product-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #ef4444;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 3px;
}

.product-badge.discount-badge {
  background: #f97316;
}

.fire {
  font-size: 13px;
}

.product-info {
  padding: 16px;
}
.product-info h3 {
  font-size: 15px;
  font-weight: 500;
  margin: 0 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.price { font-size: 18px; font-weight: 700; color: #ef4444; }
.price.flash-price-tag {
  color: #ef4444;
  font-weight: 800;
}
.orig { font-size: 13px; color: #94a3b8; text-decoration: line-through; }
.more-wrap {
  text-align: center;
  margin-top: 32px;
}
@media (max-width: 768px) {
  .hero-content h1 { font-size: 28px; }
  .products-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .flash-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
}
</style>
