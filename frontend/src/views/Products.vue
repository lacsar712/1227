<template>
  <div class="products-page page-container">
    <h1 class="page-title">商品列表</h1>
    <div class="products-layout">
      <aside class="sidebar">
        <el-card shadow="never">
          <template #header>商品分类</template>
          <div class="category-list">
            <div
              v-for="cat in categories"
              :key="cat.id"
              :class="['cat-item', { active: filters.category_id === cat.id }]"
              @click="setCategory(cat.id)"
            >
              {{ cat.name }}
            </div>
          </div>
        </el-card>
        <el-card shadow="never" style="margin-top: 16px">
          <template #header>价格区间</template>
          <div class="price-filter">
            <el-input v-model="filters.min_price" placeholder="最低价" size="small" />
            <span>-</span>
            <el-input v-model="filters.max_price" placeholder="最高价" size="small" />
            <el-button type="primary" size="small" @click="applyPrice">确定</el-button>
          </div>
        </el-card>
      </aside>
      <main class="main">
        <div class="toolbar">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索商品"
            clearable
            style="width: 240px"
            @keyup.enter="search"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-select v-model="filters.sort" placeholder="排序" style="width: 140px" @change="search">
            <el-option label="最新上架" value="newest" />
            <el-option label="价格从低到高" value="price_asc" />
            <el-option label="价格从高到低" value="price_desc" />
            <el-option label="销量优先" value="sales" />
          </el-select>
          <el-button type="primary" @click="search">搜索</el-button>
        </div>
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
            <el-empty v-if="!products.length" description="暂无商品" />
          </template>
        </div>
        <div class="pagination-wrap">
          <el-pagination
            v-model:current-page="filters.page"
            :page-size="filters.limit"
            :total="total"
            layout="prev, pager, next"
            @current-change="load"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Search } from '@element-plus/icons-vue';
import { categoriesApi, productsApi } from '@/api';

const route = useRoute();
const categories = ref([]);
const products = ref([]);
const total = ref(0);
const loading = ref(true);
const placeholderImg = '/images/products/placeholder-400x400.png';

const filters = reactive({
  keyword: '',
  category_id: '',
  min_price: '',
  max_price: '',
  sort: 'newest',
  page: 1,
  limit: 12
});

onMounted(async () => {
  categories.value = await categoriesApi.list();
  filters.keyword = route.query.keyword || '';
  filters.category_id = route.query.category_id || '';
  await load();
});

watch(() => route.query, (q) => {
  filters.keyword = q.keyword || '';
  filters.category_id = q.category_id || '';
  load();
});

async function load() {
  loading.value = true;
  try {
    const params = {
      page: filters.page,
      limit: filters.limit,
      sort: filters.sort
    };
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.category_id) params.category_id = filters.category_id;
    if (filters.min_price) params.min_price = filters.min_price;
    if (filters.max_price) params.max_price = filters.max_price;
    const res = await productsApi.list(params);
    products.value = res.list || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
}

function setCategory(id) {
  filters.category_id = filters.category_id === id ? '' : id;
  filters.page = 1;
  load();
}

function applyPrice() {
  filters.page = 1;
  load();
}

function search() {
  filters.page = 1;
  load();
}

function discount(p) {
  if (!p.original_price || p.original_price <= p.price) return 0;
  return Math.round((1 - p.price / p.original_price) * 100);
}
</script>

<style scoped>
.products-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 24px;
}
.sidebar {
  height: fit-content;
  position: sticky;
  top: 80px;
}
.category-list .cat-item {
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}
.cat-item:hover { background: #f1f5f9; }
.cat-item.active {
  background: #eef2ff;
  color: #6366f1;
  font-weight: 500;
}
.price-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}
.price-filter .el-input { flex: 1; }
.toolbar {
  display: flex;
  gap: 12px;
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: all 0.2s;
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
.product-img img { width: 100%; height: 100%; object-fit: cover; }
.product-badge {
  position: absolute;
  top: 8px; left: 8px;
  background: #ef4444;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}
.product-info { padding: 16px; }
.product-info h3 {
  font-size: 15px;
  font-weight: 500;
  margin: 0 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.price-row { display: flex; gap: 8px; align-items: baseline; }
.price { font-size: 18px; font-weight: 700; color: #ef4444; }
.orig { font-size: 13px; color: #94a3b8; text-decoration: line-through; }
.pagination-wrap {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}
@media (max-width: 768px) {
  .products-layout { grid-template-columns: 1fr; }
  .sidebar { position: static; }
  .products-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
