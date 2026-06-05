<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">我的足迹</h1>
      <el-button
        v-if="items.length > 0"
        type="danger"
        plain
        @click="handleClearAll"
      >
        清空足迹
      </el-button>
    </div>

    <div v-loading="loading" class="history-content">
      <template v-if="!loading && items.length > 0">
        <div v-if="groupedItems.today.length > 0" class="history-group">
          <div class="group-header">
            <span class="group-title">今天</span>
            <span class="group-count">{{ groupedItems.today.length }} 件商品</span>
          </div>
          <div class="product-grid">
            <div
              v-for="item in groupedItems.today"
              :key="item.product_id || item.product?.id"
              class="product-card"
            >
              <div class="card-content" @click="goToProduct(item)">
                <div class="product-image">
                  <img
                    :src="getProductImage(item)"
                    :alt="getProductName(item)"
                    loading="lazy"
                  />
                </div>
                <div class="product-info">
                  <h3 class="product-name">{{ getProductName(item) }}</h3>
                  <p class="product-desc">{{ getProductDesc(item) }}</p>
                  <div class="product-price">
                    <span class="price">¥{{ getProductPrice(item) }}</span>
                  </div>
                </div>
              </div>
              <button
                class="remove-btn"
                @click.stop="handleRemove(item)"
                title="移除"
              >
                <el-icon><Close /></el-icon>
              </button>
              <div class="view-time">{{ formatViewTime(item.viewed_at || item.viewedAt) }}</div>
            </div>
          </div>
        </div>

        <div v-if="groupedItems.yesterday.length > 0" class="history-group">
          <div class="group-header">
            <span class="group-title">昨天</span>
            <span class="group-count">{{ groupedItems.yesterday.length }} 件商品</span>
          </div>
          <div class="product-grid">
            <div
              v-for="item in groupedItems.yesterday"
              :key="item.product_id || item.product?.id"
              class="product-card"
            >
              <div class="card-content" @click="goToProduct(item)">
                <div class="product-image">
                  <img
                    :src="getProductImage(item)"
                    :alt="getProductName(item)"
                    loading="lazy"
                  />
                </div>
                <div class="product-info">
                  <h3 class="product-name">{{ getProductName(item) }}</h3>
                  <p class="product-desc">{{ getProductDesc(item) }}</p>
                  <div class="product-price">
                    <span class="price">¥{{ getProductPrice(item) }}</span>
                  </div>
                </div>
              </div>
              <button
                class="remove-btn"
                @click.stop="handleRemove(item)"
                title="移除"
              >
                <el-icon><Close /></el-icon>
              </button>
              <div class="view-time">{{ formatViewTime(item.viewed_at || item.viewedAt) }}</div>
            </div>
          </div>
        </div>

        <div v-if="groupedItems.earlier.length > 0" class="history-group">
          <div class="group-header">
            <span class="group-title">更早</span>
            <span class="group-count">{{ groupedItems.earlier.length }} 件商品</span>
          </div>
          <div class="product-grid">
            <div
              v-for="item in groupedItems.earlier"
              :key="item.product_id || item.product?.id"
              class="product-card"
            >
              <div class="card-content" @click="goToProduct(item)">
                <div class="product-image">
                  <img
                    :src="getProductImage(item)"
                    :alt="getProductName(item)"
                    loading="lazy"
                  />
                </div>
                <div class="product-info">
                  <h3 class="product-name">{{ getProductName(item) }}</h3>
                  <p class="product-desc">{{ getProductDesc(item) }}</p>
                  <div class="product-price">
                    <span class="price">¥{{ getProductPrice(item) }}</span>
                  </div>
                </div>
              </div>
              <button
                class="remove-btn"
                @click.stop="handleRemove(item)"
                title="移除"
              >
                <el-icon><Close /></el-icon>
              </button>
              <div class="view-time">{{ formatViewTime(item.viewed_at || item.viewedAt) }}</div>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="!loading">
        <div class="empty-state">
          <div class="empty-icon">
            <el-icon :size="64" color="#cbd5e1"><Clock /></el-icon>
          </div>
          <h3 class="empty-title">暂无浏览记录</h3>
          <p class="empty-desc">快去发现心仪的好物吧</p>
          <el-button type="primary" size="large" @click="goShopping">
            逛一逛
          </el-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Close, Clock } from '@element-plus/icons-vue';
import { useHistoryStore } from '@/stores/history';

const router = useRouter();
const historyStore = useHistoryStore();

const loading = ref(true);
const placeholderImg = '/images/products/placeholder-600x600.png';

const { items, groupedItems } = historyStore;

onMounted(async () => {
  try {
    await historyStore.load();
  } finally {
    loading.value = false;
  }
});

function getProductId(item) {
  return item.product_id || item.product?.id || item.id;
}

function getProductName(item) {
  return item.product?.name || item.name || '商品名称';
}

function getProductDesc(item) {
  const desc = item.product?.description || item.description || '';
  return desc.length > 50 ? desc.substring(0, 50) + '...' : desc;
}

function getProductImage(item) {
  return item.product?.image || item.image || placeholderImg;
}

function getProductPrice(item) {
  const price = item.product?.price || item.price || 0;
  return Number(price).toFixed(2);
}

function formatViewTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return '刚刚浏览';
  if (minutes < 60) return `${minutes}分钟前浏览`;
  if (hours < 24) return `${hours}小时前浏览`;

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${month}月${day}日 ${hour}:${minute} 浏览`;
}

function goToProduct(item) {
  const productId = getProductId(item);
  if (productId) {
    router.push(`/product/${productId}`);
  }
}

function goShopping() {
  router.push('/products');
}

async function handleRemove(item) {
  const productId = getProductId(item);
  try {
    await ElMessageBox.confirm('确定要移除这条浏览记录吗？', '移除足迹', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await historyStore.remove(productId);
    ElMessage.success('已移除');
  } catch {
    // 用户取消
  }
}

async function handleClearAll() {
  try {
    await ElMessageBox.confirm('确定要清空所有浏览记录吗？此操作不可恢复。', '清空足迹', {
      confirmButtonText: '确定清空',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await historyStore.clear();
    ElMessage.success('已清空浏览足迹');
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.history-content {
  min-height: 400px;
}

.history-group {
  margin-bottom: 32px;
}

.group-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
  padding-left: 4px;
}

.group-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
}

.group-count {
  font-size: 13px;
  color: var(--color-text-muted);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.product-card {
  position: relative;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow);
  transition: all 0.2s ease;
  cursor: pointer;
}

.product-card:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}

.card-content {
  display: flex;
  flex-direction: column;
}

.product-image {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f8fafc;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.product-info {
  padding: 12px 16px 16px;
}

.product-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 6px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 42px;
}

.product-desc {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0 0 8px;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.product-price {
  display: flex;
  align-items: baseline;
}

.price {
  font-size: 18px;
  font-weight: 700;
  color: #ef4444;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 20;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  opacity: 0;
  transition: all 0.2s ease;
  padding: 0;
}

.product-card:hover .remove-btn {
  opacity: 1;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.9);
  transform: scale(1.1);
}

.view-time {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 11px;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 8px;
  border-radius: 10px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 24px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 8px;
}

.empty-desc {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0 0 32px;
}

@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .product-name {
    font-size: 14px;
    min-height: 40px;
  }

  .price {
    font-size: 16px;
  }

  .remove-btn {
    opacity: 1;
  }

  .empty-state {
    padding: 60px 16px;
  }
}
</style>
