<template>
  <div class="brand-detail-page page-container" v-loading="loading">
    <template v-if="!loading && brand">
      <div class="brand-hero">
        <div class="brand-logo-large">
          <span v-if="!brand.logo" class="brand-initial-large">{{ brand.name[0] }}</span>
          <img v-else :src="brand.logo" :alt="brand.name" />
        </div>
        <div class="brand-info">
          <h1 class="brand-title">{{ brand.name }}</h1>
          <div class="brand-tags">
            <span v-if="brand.country" class="brand-tag">
              <el-icon><Location /></el-icon>
              {{ brand.country }}
            </span>
            <span v-if="brand.established_year" class="brand-tag">
              <el-icon><Calendar /></el-icon>
              创立于 {{ brand.established_year }}
            </span>
            <span class="brand-tag">
              <el-icon><Goods /></el-icon>
              {{ brand.product_count || 0 }} 件商品
            </span>
          </div>
          <p class="brand-description">{{ brand.description }}</p>
          <div class="brand-actions">
            <a v-if="brand.website" :href="brand.website" target="_blank" rel="noopener noreferrer" class="brand-link">
              <el-icon><Link /></el-icon>
              官方网站
            </a>
          </div>
        </div>
      </div>

      <div v-if="brand.story" class="brand-story">
        <h2 class="section-title">品牌故事</h2>
        <div class="story-content">
          <p>{{ brand.story }}</p>
        </div>
      </div>

      <div class="brand-products">
        <div class="products-header">
          <h2 class="section-title">品牌商品</h2>
          <el-select v-model="filters.sort" placeholder="排序" style="width: 140px" @change="loadProducts">
            <el-option label="最新上架" value="newest" />
            <el-option label="价格从低到高" value="price_asc" />
            <el-option label="价格从高到低" value="price_desc" />
            <el-option label="销量优先" value="sales" />
          </el-select>
        </div>

        <div v-loading="productsLoading" class="products-grid">
          <template v-if="!productsLoading">
            <router-link
              v-for="p in products"
              :key="p.id"
              :to="`/product/${p.id}`"
              class="product-card"
            >
              <div class="product-img">
                <img :src="p.image || placeholderImg" :alt="p.name" />
                <div class="product-badge" v-if="p.flash_sale">🔥 秒杀中</div>
                <div class="product-badge" v-else-if="p.original_display_price">省{{ discount(p) }}%</div>
              </div>
              <div class="product-info">
                <h3>{{ p.name }}</h3>
                <div class="price-row">
                  <span class="price" :class="{ 'flash-price': p.flash_sale }">¥{{ p.display_price || p.price }}</span>
                  <span class="orig" v-if="p.original_display_price || p.original_price">¥{{ p.original_display_price || p.original_price }}</span>
                </div>
              </div>
            </router-link>
            <el-empty v-if="!products.length" description="暂无商品" />
          </template>
        </div>

        <div v-if="productsTotal > filters.limit" class="pagination-wrap">
          <el-pagination
            v-model:current-page="filters.page"
            :page-size="filters.limit"
            :total="productsTotal"
            layout="prev, pager, next"
            @current-change="loadProducts"
          />
        </div>
      </div>
    </template>
    <el-empty v-else-if="!loading && !brand" description="品牌不存在" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Location, Calendar, Goods, Link } from '@element-plus/icons-vue';
import { brandsApi } from '@/api';

const route = useRoute();
const brand = ref(null);
const products = ref([]);
const productsTotal = ref(0);
const loading = ref(true);
const productsLoading = ref(true);
const placeholderImg = '/images/products/placeholder-400x400.png';

const filters = reactive({
  page: 1,
  limit: 12,
  sort: 'newest'
});

onMounted(() => {
  loadBrand();
});

watch(() => route.params.slug, () => {
  filters.page = 1;
  loadBrand();
});

async function loadBrand() {
  loading.value = true;
  try {
    brand.value = await brandsApi.detail(route.params.slug);
    loadProducts();
  } catch {
    brand.value = null;
  } finally {
    loading.value = false;
  }
}

async function loadProducts() {
  if (!brand.value) return;

  productsLoading.value = true;
  try {
    const res = await brandsApi.products(route.params.slug, {
      page: filters.page,
      limit: filters.limit,
      sort: filters.sort
    });
    products.value = res.list || [];
    productsTotal.value = res.total || 0;
  } finally {
    productsLoading.value = false;
  }
}

function discount(p) {
  const orig = p.original_display_price || p.original_price || 0;
  const curr = p.display_price || p.price || 0;
  if (orig <= 0 || curr >= orig) return 0;
  return Math.round((1 - curr / orig) * 100);
}
</script>

<style scoped>
.brand-hero {
  background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
  border-radius: 20px;
  padding: 40px;
  display: flex;
  gap: 32px;
  align-items: flex-start;
  margin-bottom: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.brand-logo-large {
  width: 140px;
  height: 140px;
  border-radius: 24px;
  background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.2);
}

.brand-logo-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.brand-initial-large {
  font-size: 60px;
  font-weight: 700;
  color: #fff;
}

.brand-info {
  flex: 1;
  min-width: 0;
}

.brand-title {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 16px;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.brand-tags {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.brand-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #f1f5f9;
  border-radius: 20px;
  font-size: 14px;
  color: var(--color-text-muted);
}

.brand-description {
  font-size: 15px;
  line-height: 1.8;
  color: var(--color-text-muted);
  margin: 0 0 20px;
  max-width: 800px;
}

.brand-actions {
  display: flex;
  gap: 12px;
}

.brand-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 8px;
  font-size: 14px;
  transition: opacity 0.2s;
}

.brand-link:hover {
  opacity: 0.9;
}

.brand-story {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 20px;
  color: var(--color-text);
}

.story-content p {
  font-size: 15px;
  line-height: 2;
  color: var(--color-text-muted);
  margin: 0;
  text-indent: 2em;
}

.brand-products {
  background: transparent;
}

.products-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  min-height: 300px;
}

.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.2s;
  display: block;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
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
  gap: 8px;
  align-items: baseline;
}

.price {
  font-size: 18px;
  font-weight: 700;
  color: #ef4444;
}

.price.flash-price {
  font-size: 20px;
  font-weight: 800;
  background: linear-gradient(135deg, #ef4444, #f97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.orig {
  font-size: 13px;
  color: #94a3b8;
  text-decoration: line-through;
}

.pagination-wrap {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .brand-hero {
    flex-direction: column;
    padding: 24px;
    gap: 20px;
  }

  .brand-logo-large {
    width: 100px;
    height: 100px;
    border-radius: 16px;
  }

  .brand-initial-large {
    font-size: 44px;
  }

  .brand-title {
    font-size: 26px;
  }

  .brand-story {
    padding: 24px;
  }

  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .products-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
