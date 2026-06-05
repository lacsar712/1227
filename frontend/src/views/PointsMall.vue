<template>
  <div class="page-container points-mall">
    <div class="mall-header">
      <div class="balance-card">
        <div class="balance-info">
          <p class="label">我的积分</p>
          <p class="balance">{{ formatNumber(balance) }}</p>
          <p class="tip">消费1元累积1积分</p>
        </div>
        <div class="balance-actions">
          <router-link to="/profile" class="action-link">
            <el-icon><Wallet /></el-icon>
            <span>查看详情</span>
          </router-link>
        </div>
      </div>
    </div>

    <div class="filter-tabs">
      <el-tabs v-model="activeTab" class="product-tabs">
        <el-tab-pane label="全部" name="" />
        <el-tab-pane label="优惠券" name="coupon" />
        <el-tab-pane label="虚拟权益" name="virtual" />
        <el-tab-pane label="实物周边" name="physical" />
      </el-tabs>
    </div>

    <div class="products-grid" v-loading="loading">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="product-card"
      >
        <div class="product-image">
          <img :src="product.image" :alt="product.name" />
          <el-tag
            v-if="product.stock <= 0"
            type="info"
            class="sold-out-tag"
          >
            已兑完
          </el-tag>
          <el-tag
            v-else-if="product.stock < 10"
            type="warning"
            class="stock-tag"
          >
            仅剩{{ product.stock }}件
          </el-tag>
        </div>
        <div class="product-info">
          <h3 class="product-name">{{ product.name }}</h3>
          <p class="product-desc">{{ product.description }}</p>
          <div class="product-footer">
            <div class="price-info">
              <span class="points">{{ formatNumber(product.points_required) }}</span>
              <span class="points-label">积分</span>
              <span v-if="product.original_value" class="original-price">
                ¥{{ product.original_value }}
              </span>
            </div>
            <el-button
              type="primary"
              size="small"
              :disabled="product.stock <= 0 || balance < product.points_required"
              :loading="redeemingId === product.id"
              @click="handleRedeem(product)"
            >
              {{ product.stock <= 0 ? '已兑完' : (balance < product.points_required ? '积分不足' : '立即兑换') }}
            </el-button>
          </div>
        </div>
      </div>

      <el-empty
        v-if="!loading && filteredProducts.length === 0"
        description="暂无兑换商品"
      />
    </div>

    <el-dialog
      v-model="redeemDialogVisible"
      title="确认兑换"
      width="400px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedProduct" class="redeem-confirm">
        <div class="product-preview">
          <img :src="selectedProduct.image" :alt="selectedProduct.name" />
          <div class="product-brief">
            <h4>{{ selectedProduct.name }}</h4>
            <p class="points-cost">
              <span class="points">{{ formatNumber(selectedProduct.points_required) }}</span>
              <span class="label">积分</span>
            </p>
          </div>
        </div>
        <el-divider />
        <div class="balance-info-row">
          <span>当前积分：</span>
          <span class="current-balance">{{ formatNumber(balance) }}</span>
        </div>
        <div class="balance-info-row">
          <span>兑换后积分：</span>
          <span class="after-balance">
            {{ formatNumber(balance - selectedProduct.points_required) }}
          </span>
        </div>
      </div>
      <template #footer>
        <el-button @click="redeemDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="redeeming" @click="confirmRedeem">
          确认兑换
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="successDialogVisible"
      title="兑换成功"
      width="400px"
    >
      <div class="success-content">
        <el-icon class="success-icon" color="#67c23a" :size="64">
          <CircleCheck />
        </el-icon>
        <p class="success-text">恭喜您，兑换成功！</p>
        <div v-if="redeemResult" class="result-info">
          <p v-if="redeemResult.product?.coupon_code" class="coupon-code">
            兑换码：<span class="code">{{ redeemResult.product.coupon_code }}</span>
          </p>
          <p v-if="redeemResult.product?.expiry_date" class="expiry">
            有效期至：{{ formatDate(redeemResult.product.expiry_date) }}
          </p>
        </div>
      </div>
      <template #footer>
        <el-button @click="successDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="goToProfile">查看我的积分</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Wallet, CircleCheck } from '@element-plus/icons-vue';
import { usePointsStore } from '@/stores/points';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const pointsStore = usePointsStore();
const userStore = useUserStore();

const activeTab = ref('');
const loading = ref(false);
const redeeming = ref(false);
const redeemingId = ref(null);
const redeemDialogVisible = ref(false);
const successDialogVisible = ref(false);
const selectedProduct = ref(null);
const redeemResult = ref(null);

const balance = computed(() => pointsStore.balance.value);
const products = computed(() => pointsStore.products.value);

const filteredProducts = computed(() => {
  if (!activeTab.value) return products.value;
  return products.value.filter(p => p.type === activeTab.value);
});

function formatNumber(num) {
  return Number(num).toLocaleString();
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('zh-CN');
}

async function loadData() {
  loading.value = true;
  try {
    if (userStore.isLoggedIn.value) {
      await pointsStore.fetchAccount();
    }
    await pointsStore.fetchProducts();
  } finally {
    loading.value = false;
  }
}

function handleRedeem(product) {
  if (!userStore.isLoggedIn.value) {
    ElMessage.warning('请先登录');
    router.push('/login');
    return;
  }
  if (product.stock <= 0) {
    ElMessage.warning('商品已兑完');
    return;
  }
  if (balance.value < product.points_required) {
    ElMessage.warning('积分不足');
    return;
  }
  selectedProduct.value = product;
  redeemDialogVisible.value = true;
}

async function confirmRedeem() {
  if (!selectedProduct.value) return;
  
  redeeming.value = true;
  redeemingId.value = selectedProduct.value.id;
  
  try {
    const result = await pointsStore.redeemProduct(selectedProduct.value.id);
    redeemResult.value = result;
    redeemDialogVisible.value = false;
    successDialogVisible.value = true;
    await pointsStore.fetchProducts();
  } catch (err) {
    ElMessage.error(err.message || '兑换失败');
  } finally {
    redeeming.value = false;
    redeemingId.value = null;
  }
}

function goToProfile() {
  successDialogVisible.value = false;
  router.push('/profile');
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.points-mall {
  max-width: 1200px;
  margin: 0 auto;
}

.mall-header {
  margin-bottom: 24px;
}

.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 32px;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.balance-info .label {
  font-size: 14px;
  opacity: 0.9;
  margin: 0 0 8px;
}

.balance-info .balance {
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 8px;
  line-height: 1.2;
}

.balance-info .tip {
  font-size: 13px;
  opacity: 0.8;
  margin: 0;
}

.balance-actions .action-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  color: #fff;
  font-size: 14px;
  backdrop-filter: blur(10px);
}

.balance-actions .action-link:hover {
  background: rgba(255, 255, 255, 0.3);
}

.filter-tabs {
  background: #fff;
  border-radius: 12px;
  padding: 0 16px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.product-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.product-tabs :deep(.el-tabs__item) {
  font-size: 15px;
  height: 56px;
  line-height: 56px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.product-image {
  position: relative;
  width: 100%;
  padding-top: 75%;
  overflow: hidden;
  background: #f8fafc;
}

.product-image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sold-out-tag,
.stock-tag {
  position: absolute;
  top: 12px;
  right: 12px;
}

.product-info {
  padding: 16px;
}

.product-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 16px;
  line-height: 1.5;
  height: 40px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-info {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.price-info .points {
  font-size: 22px;
  font-weight: 700;
  color: #f59e0b;
}

.price-info .points-label {
  font-size: 13px;
  color: #64748b;
}

.price-info .original-price {
  font-size: 13px;
  color: #94a3b8;
  text-decoration: line-through;
  margin-left: 8px;
}

.redeem-confirm .product-preview {
  display: flex;
  gap: 16px;
  align-items: center;
}

.redeem-confirm .product-preview img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
}

.redeem-confirm .product-brief h4 {
  margin: 0 0 8px;
  font-size: 16px;
}

.redeem-confirm .points-cost {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.redeem-confirm .points-cost .points {
  font-size: 24px;
  font-weight: 700;
  color: #f59e0b;
}

.redeem-confirm .points-cost .label {
  font-size: 14px;
  color: #64748b;
}

.balance-info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.balance-info-row .current-balance {
  font-weight: 600;
  color: #f59e0b;
}

.balance-info-row .after-balance {
  font-weight: 600;
  color: #64748b;
}

.success-content {
  text-align: center;
  padding: 24px 0;
}

.success-content .success-icon {
  margin-bottom: 16px;
}

.success-content .success-text {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px;
}

.result-info .coupon-code {
  font-size: 15px;
  margin: 8px 0;
}

.result-info .coupon-code .code {
  font-weight: 700;
  color: #6366f1;
  letter-spacing: 2px;
}

.result-info .expiry {
  font-size: 14px;
  color: #64748b;
  margin: 8px 0 0;
}

@media (max-width: 640px) {
  .balance-card {
    padding: 24px 20px;
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .balance-info .balance {
    font-size: 36px;
  }

  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .product-name {
    font-size: 14px;
  }

  .price-info .points {
    font-size: 18px;
  }
}
</style>
