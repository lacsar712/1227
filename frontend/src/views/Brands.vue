<template>
  <div class="brands-page page-container">
    <h1 class="page-title">品牌馆</h1>
    <p class="page-subtitle">精选优质品牌，发现更多好物</p>

    <div v-loading="loading" class="brands-grid">
      <template v-if="!loading">
        <router-link
          v-for="brand in brands"
          :key="brand.id"
          :to="`/brand/${brand.slug}`"
          class="brand-card"
        >
          <div class="brand-header">
            <div class="brand-logo">
              <span v-if="!brand.logo" class="brand-initial">{{ brand.name[0] }}</span>
              <img v-else :src="brand.logo" :alt="brand.name" />
            </div>
            <div class="brand-meta">
              <h3 class="brand-name">{{ brand.name }}</h3>
              <div class="brand-info">
                <span v-if="brand.country" class="brand-country">
                  <el-icon><Location /></el-icon>
                  {{ brand.country }}
                </span>
                <span v-if="brand.established_year" class="brand-year">
                  创立于 {{ brand.established_year }}
                </span>
              </div>
            </div>
          </div>
          <p class="brand-desc">{{ brand.description }}</p>
          <div class="brand-footer">
            <span class="product-count">
              <el-icon><Goods /></el-icon>
              {{ brand.product_count || 0 }} 件商品
            </span>
            <span class="enter-brand">
              进入品牌馆
              <el-icon><ArrowRight /></el-icon>
            </span>
          </div>
        </router-link>
        <el-empty v-if="!brands.length" description="暂无品牌" />
      </template>
    </div>

    <div v-if="total > filters.limit" class="pagination-wrap">
      <el-pagination
        v-model:current-page="filters.page"
        :page-size="filters.limit"
        :total="total"
        layout="prev, pager, next"
        @current-change="load"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Location, Goods, ArrowRight } from '@element-plus/icons-vue';
import { brandsApi } from '@/api';

const brands = ref([]);
const total = ref(0);
const loading = ref(true);

const filters = reactive({
  page: 1,
  limit: 6
});

onMounted(() => {
  load();
});

async function load() {
  loading.value = true;
  try {
    const res = await brandsApi.list({
      page: filters.page,
      limit: filters.limit
    });
    brands.value = res.list || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page-subtitle {
  color: var(--color-text-muted);
  font-size: 16px;
  margin-top: -8px;
  margin-bottom: 32px;
}

.brands-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  min-height: 400px;
}

.brand-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.brand-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 32px rgba(99, 102, 241, 0.12);
}

.brand-header {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.brand-logo {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.brand-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.brand-initial {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
}

.brand-meta {
  flex: 1;
  min-width: 0;
}

.brand-name {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px;
  color: var(--color-text);
}

.brand-info {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.brand-country,
.brand-year {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.brand-desc {
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 20px;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.brand-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.product-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--color-primary);
  font-weight: 500;
}

.enter-brand {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--color-text-muted);
  transition: color 0.2s;
}

.brand-card:hover .enter-brand {
  color: var(--color-primary);
}

.pagination-wrap {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .brands-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .brand-card {
    padding: 20px;
  }

  .brand-logo {
    width: 60px;
    height: 60px;
    border-radius: 12px;
  }

  .brand-initial {
    font-size: 26px;
  }

  .brand-name {
    font-size: 18px;
  }
}
</style>
