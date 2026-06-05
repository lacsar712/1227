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
                <div class="product-badge" v-if="p.original_price">省{{ discount(p) }}%</div>
              </div>
              <div class="product-info">
                <h3>{{ p.name }}</h3>
                <div class="price-row">
                  <span class="price">¥{{ p.price }}</span>
                  <span class="orig" v-if="p.original_price">¥{{ p.original_price }}</span>
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
import { categoriesApi, productsApi } from '@/api';

const categories = ref([]);
const products = ref([]);
const loading = ref(true);
const placeholderImg = '/images/products/placeholder-400x400.png';

onMounted(async () => {
  try {
    const [cats, res] = await Promise.all([
      categoriesApi.list(),
      productsApi.list({ limit: 8 })
    ]);
    categories.value = cats;
    products.value = res.list || [];
  } finally {
    loading.value = false;
  }
});

function discount(p) {
  if (!p.original_price || p.original_price <= p.price) return 0;
  return Math.round((1 - p.price / p.original_price) * 100);
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
.orig { font-size: 13px; color: #94a3b8; text-decoration: line-through; }
.more-wrap {
  text-align: center;
  margin-top: 32px;
}
@media (max-width: 768px) {
  .hero-content h1 { font-size: 28px; }
  .products-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
}
</style>
