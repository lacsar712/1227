<template>
  <div class="page-container">
    <h1 class="page-title">我的订单</h1>
    <div class="filter-bar">
      <el-radio-group v-model="statusFilter" @change="load">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button value="pending">待支付</el-radio-button>
        <el-radio-button value="paid">待发货</el-radio-button>
        <el-radio-button value="shipped">待收货</el-radio-button>
        <el-radio-button value="completed">已完成</el-radio-button>
        <el-radio-button value="cancelled">已取消</el-radio-button>
      </el-radio-group>
    </div>
    <div v-loading="loading" class="orders-list">
      <template v-if="!loading">
        <div v-for="order in orders" :key="order.id" class="order-card">
          <div class="order-header">
            <span>订单号：{{ order.order_no }}</span>
            <span class="status" :class="order.status">{{ statusText[order.status] }}</span>
          </div>
          <div class="order-body">
            <router-link
              v-for="item in order.OrderItems"
              :key="item.id"
              :to="`/product/${item.product_id}`"
              class="order-item"
            >
              <img :src="item.product_image || placeholderImg" :alt="item.product_name" />
              <div class="item-info">
                <div class="name">{{ item.product_name }}</div>
                <div class="meta">¥{{ item.price }} × {{ item.quantity }}</div>
              </div>
            </router-link>
          </div>
          <div class="order-footer">
            <span class="total">合计：¥{{ order.total_amount }}</span>
            <div class="actions">
              <router-link v-if="order.status === 'pending'" :to="`/order/${order.id}`">
                <el-button type="primary" size="small">去支付</el-button>
              </router-link>
              <el-button
                v-if="['pending', 'paid'].includes(order.status)"
                type="danger"
                plain
                size="small"
                @click="cancelOrder(order.id)"
              >
                取消订单
              </el-button>
              <router-link :to="`/order/${order.id}`">
                <el-button size="small">查看详情</el-button>
              </router-link>
            </div>
          </div>
        </div>
        <el-empty v-if="!orders.length" description="暂无订单" />
      </template>
    </div>
    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="page"
        :page-size="10"
        :total="total"
        layout="prev, pager, next"
        @current-change="load"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useConfirm } from '@/composables/useConfirm';
import { ordersApi } from '@/api';

const confirm = useConfirm();

const loading = ref(true);
const orders = ref([]);
const total = ref(0);
const page = ref(1);
const statusFilter = ref('');
const placeholderImg = '/images/products/placeholder-80x80.png';

const statusText = {
  pending: '待支付',
  paid: '待发货',
  shipped: '待收货',
  completed: '已完成',
  cancelled: '已取消'
};

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const res = await ordersApi.list({
      page: page.value,
      limit: 10,
      status: statusFilter.value || undefined
    });
    orders.value = res.list || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
}

async function cancelOrder(id) {
  const ok = await confirm({ title: '取消订单', message: '确定要取消该订单吗？', type: 'warning' });
  if (!ok) return;
  await ordersApi.cancel(id);
  ElMessage.success('已取消');
  load();
}
</script>

<style scoped>
.filter-bar { margin-bottom: 24px; }
.orders-list { display: flex; flex-direction: column; gap: 16px; }
.order-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.order-header {
  display: flex;
  justify-content: space-between;
  padding: 16px 24px;
  background: #f8fafc;
  font-size: 14px;
}
.status.pending { color: #f59e0b; }
.status.paid { color: #6366f1; }
.status.completed { color: #22c55e; }
.status.cancelled { color: #94a3b8; }
.order-body { padding: 16px 24px; }
.order-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
  text-decoration: none;
  color: inherit;
}
.order-item:last-child { border-bottom: none; }
.order-item img { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; }
.item-info .name { font-weight: 500; }
.item-info .meta { font-size: 13px; color: #64748b; }
.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #f1f5f9;
}
.total { font-weight: 600; }
.actions { display: flex; gap: 8px; }
.pagination-wrap { margin-top: 24px; display: flex; justify-content: center; }
</style>
