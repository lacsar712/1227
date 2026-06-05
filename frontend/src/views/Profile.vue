<template>
  <div class="page-container">
    <h1 class="page-title">个人中心</h1>
    
    <el-card shadow="never" class="profile-card">
      <div class="profile-header">
        <el-avatar :size="80">{{ userStore.user?.nickname?.[0] || 'U' }}</el-avatar>
        <div class="profile-info">
          <h2>{{ userStore.user?.nickname || userStore.user?.username }}</h2>
          <p>{{ userStore.user?.email }}</p>
        </div>
      </div>
      <el-divider />
      <div class="quick-links">
        <router-link to="/orders" class="link-item">
          <el-icon :size="24"><Document /></el-icon>
          <span>我的订单</span>
        </router-link>
        <router-link to="/profile/address" class="link-item">
          <el-icon :size="24"><Location /></el-icon>
          <span>收货地址</span>
        </router-link>
        <router-link to="/cart" class="link-item">
          <el-icon :size="24"><ShoppingCart /></el-icon>
          <span>购物车</span>
        </router-link>
        <router-link to="/points-mall" class="link-item">
          <el-icon :size="24"><Gift /></el-icon>
          <span>积分商城</span>
        </router-link>
      </div>
    </el-card>

    <el-card shadow="never" class="points-card">
      <div class="points-header">
        <div class="points-title">
          <el-icon :size="20" color="#f59e0b"><Wallet /></el-icon>
          <span>我的积分</span>
        </div>
        <router-link to="/points-mall" class="go-mall">
          去兑换
          <el-icon><ArrowRight /></el-icon>
        </router-link>
      </div>
      <div class="points-balance-section">
        <div class="balance-item main">
          <p class="label">当前积分</p>
          <p class="value">{{ formatNumber(pointsStore.balance.value) }}</p>
        </div>
        <div class="balance-item">
          <p class="label">累计获得</p>
          <p class="value earned">{{ formatNumber(pointsStore.totalEarned.value) }}</p>
        </div>
        <div class="balance-item">
          <p class="label">累计消耗</p>
          <p class="value spent">{{ formatNumber(pointsStore.totalSpent.value) }}</p>
        </div>
      </div>
      <el-divider />
      
      <div class="points-tabs">
        <el-tabs v-model="activeTab" class="small-tabs">
          <el-tab-pane label="积分流水" name="transactions" />
          <el-tab-pane label="兑换记录" name="records" />
        </el-tabs>
      </div>

      <div class="points-list" v-loading="pointsStore.loading.value">
        <template v-if="activeTab === 'transactions'">
          <div
            v-for="item in pointsStore.transactions.value"
            :key="item.id"
            class="transaction-item"
          >
            <div class="transaction-icon" :class="item.type">
              <el-icon v-if="item.type === 'earn'"><TrendCharts /></el-icon>
              <el-icon v-else><Minus /></el-icon>
            </div>
            <div class="transaction-info">
              <p class="transaction-desc">{{ item.description }}</p>
              <p class="transaction-time">{{ formatTime(item.created_at) }}</p>
            </div>
            <div class="transaction-amount" :class="item.type">
              {{ item.type === 'earn' ? '+' : '-' }}{{ formatNumber(item.amount) }}
            </div>
          </div>
          <el-empty
            v-if="!pointsStore.loading.value && pointsStore.transactions.value.length === 0"
            description="暂无积分流水"
            :image-size="80"
          />
        </template>

        <template v-if="activeTab === 'records'">
          <div
            v-for="item in pointsStore.records.value"
            :key="item.id"
            class="record-item"
          >
            <img :src="item.PointsProduct?.image" class="record-image" />
            <div class="record-info">
              <p class="record-name">{{ item.product_name }}</p>
              <p class="record-time">{{ formatTime(item.created_at) }}</p>
              <p v-if="item.coupon_code" class="record-coupon">
                兑换码：<span class="code">{{ item.coupon_code }}</span>
              </p>
            </div>
            <div class="record-amount">
              -{{ formatNumber(item.points_spent) }}
            </div>
          </div>
          <el-empty
            v-if="!pointsStore.loading.value && pointsStore.records.value.length === 0"
            description="暂无兑换记录"
            :image-size="80"
          />
        </template>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Document, Location, ShoppingCart, Gift, Wallet, ArrowRight, TrendCharts, Minus } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { usePointsStore } from '@/stores/points';

const userStore = useUserStore();
const pointsStore = usePointsStore();
const activeTab = ref('transactions');

function formatNumber(num) {
  return Number(num).toLocaleString();
}

function formatTime(time) {
  if (!time) return '';
  const date = new Date(time);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function loadData() {
  await userStore.fetchUser();
  await pointsStore.fetchAccount();
  await pointsStore.fetchTransactions({ limit: 20 });
  await pointsStore.fetchRecords({ limit: 20 });
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.profile-card {
  max-width: 800px;
  margin-bottom: 24px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
}

.profile-info h2 {
  font-size: 22px;
  margin: 0 0 8px;
}

.profile-info p {
  margin: 0;
  color: #64748b;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.link-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 16px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.2s;
}

.link-item:hover {
  background: #eef2ff;
  color: #6366f1;
}

.points-card {
  max-width: 800px;
}

.points-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.points-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.go-mall {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #6366f1;
}

.go-mall:hover {
  color: #4f46e5;
}

.points-balance-section {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 24px;
  padding: 8px 0;
}

.balance-item {
  text-align: center;
}

.balance-item.main {
  text-align: left;
}

.balance-item .label {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 8px;
}

.balance-item .value {
  font-size: 32px;
  font-weight: 700;
  margin: 0;
  color: #f59e0b;
}

.balance-item:not(.main) .value {
  font-size: 20px;
}

.balance-item .value.earned {
  color: #10b981;
}

.balance-item .value.spent {
  color: #ef4444;
}

.points-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.points-tabs :deep(.el-tabs__item) {
  font-size: 14px;
  height: 40px;
  line-height: 40px;
}

.points-list {
  max-height: 400px;
  overflow-y: auto;
}

.transaction-item,
.record-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #f1f5f9;
}

.transaction-item:last-child,
.record-item:last-child {
  border-bottom: none;
}

.transaction-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.transaction-icon.earn {
  background: #d1fae5;
  color: #10b981;
}

.transaction-icon.spend {
  background: #fee2e2;
  color: #ef4444;
}

.transaction-info {
  flex: 1;
  min-width: 0;
}

.transaction-desc {
  font-size: 14px;
  margin: 0 0 4px;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transaction-time {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.transaction-amount {
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.transaction-amount.earn {
  color: #10b981;
}

.transaction-amount.spend {
  color: #ef4444;
}

.record-image {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.record-info {
  flex: 1;
  min-width: 0;
}

.record-name {
  font-size: 14px;
  margin: 0 0 4px;
  color: #1e293b;
  font-weight: 500;
}

.record-time {
  font-size: 12px;
  color: #94a3b8;
  margin: 0 0 4px;
}

.record-coupon {
  font-size: 12px;
  color: #6366f1;
  margin: 0;
}

.record-coupon .code {
  font-weight: 600;
  letter-spacing: 1px;
}

.record-amount {
  font-size: 16px;
  font-weight: 600;
  color: #ef4444;
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .quick-links {
    grid-template-columns: repeat(2, 1fr);
  }

  .points-balance-section {
    grid-template-columns: 1fr;
    gap: 16px;
    text-align: center;
  }

  .balance-item.main {
    text-align: center;
  }

  .balance-item .value {
    font-size: 28px;
  }
}
</style>
