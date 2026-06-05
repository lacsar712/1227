<template>
  <div class="page-container" v-loading="loading">
    <template v-if="!loading && order">
      <div class="order-detail">
        <el-card shadow="never">
          <template #header>
            <span>订单号：{{ order.order_no }}</span>
            <span class="status" :class="order.status">{{ statusText[order.status] }}</span>
          </template>
          <div class="addr-section" v-if="order.Address">
            <h4>收货信息</h4>
            <p>{{ order.Address.receiver }} {{ order.Address.phone }}</p>
            <p>{{ order.Address.province }} {{ order.Address.city }} {{ order.Address.district }} {{ order.Address.detail }}</p>
          </div>
          <el-divider />
          <div class="items-section">
            <h4>商品清单</h4>
            <div v-for="item in order.OrderItems" :key="item.id" class="item-row">
              <img :src="item.product_image || placeholderImg" :alt="item.product_name" />
              <div class="item-info">
                <router-link :to="`/product/${item.product_id}`" class="name">{{ item.product_name }}</router-link>
                <div class="meta">¥{{ item.price }} × {{ item.quantity }} = ¥{{ item.subtotal }}</div>
              </div>
            </div>
          </div>
          <el-divider />
          <div class="total-row">
            订单合计：<span class="amount">¥{{ order.total_amount }}</span>
          </div>
          <div class="actions" v-if="order.status === 'pending'">
            <el-button type="primary" @click="pay">立即支付</el-button>
            <el-button type="danger" plain @click="cancel">取消订单</el-button>
          </div>
        </el-card>
      </div>
    </template>
    <el-empty v-else-if="!loading" description="订单不存在" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useConfirm } from '@/composables/useConfirm';
import { ordersApi } from '@/api';

const confirm = useConfirm();

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const order = ref(null);
const placeholderImg = '/images/products/placeholder-80x80.png';

const statusText = {
  pending: '待支付',
  paid: '待发货',
  shipped: '待收货',
  completed: '已完成',
  cancelled: '已取消'
};

onMounted(async () => {
  try {
    order.value = await ordersApi.detail(route.params.id);
  } catch {
    order.value = null;
  } finally {
    loading.value = false;
  }
});

async function pay() {
  await ordersApi.pay(order.value.id);
  ElMessage.success('支付成功');
  order.value = await ordersApi.detail(route.params.id);
}

async function cancel() {
  const ok = await confirm({ title: '取消订单', message: '确定要取消该订单吗？', type: 'warning' });
  if (!ok) return;
  await ordersApi.cancel(order.value.id);
  ElMessage.success('已取消');
  router.push('/orders');
}
</script>

<style scoped>
.order-detail { max-width: 720px; }
.status { float: right; font-weight: 500; }
.status.pending { color: #f59e0b; }
.status.completed { color: #22c55e; }
.addr-section h4, .items-section h4 { margin: 0 0 12px; font-size: 16px; }
.addr-section p { margin: 4px 0; color: #64748b; }
.item-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}
.item-row img { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; }
.item-info .name { font-weight: 500; display: block; margin-bottom: 4px; }
.item-info .name:hover { color: #6366f1; }
.item-info .meta { font-size: 13px; color: #64748b; }
.total-row { text-align: right; font-size: 18px; }
.amount { font-weight: 700; color: #ef4444; }
.actions { margin-top: 24px; display: flex; gap: 12px; }
</style>
