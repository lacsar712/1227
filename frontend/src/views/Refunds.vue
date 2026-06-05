<template>
  <div class="page-container">
    <h1 class="page-title">售后管理</h1>
    <div class="filter-bar">
      <el-radio-group v-model="statusFilter" @change="load">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button value="pending">待处理</el-radio-button>
        <el-radio-button value="approved">已通过</el-radio-button>
        <el-radio-button value="rejected">已拒绝</el-radio-button>
        <el-radio-button value="completed">已完成</el-radio-button>
        <el-radio-button value="cancelled">已取消</el-radio-button>
      </el-radio-group>
    </div>
    <div v-loading="loading" class="refunds-list">
      <template v-if="!loading">
        <div v-for="refund in refunds" :key="refund.id" class="refund-card">
          <div class="refund-header">
            <div class="refund-no">售后单号：{{ refund.refund_no }}</div>
            <div class="refund-type" :class="refund.type">
              {{ typeText[refund.type] }}
            </div>
            <span class="status" :class="refund.status">{{ statusText[refund.status] }}</span>
          </div>
          <div class="refund-body">
            <div class="item-row">
              <img :src="refund.product_image || placeholderImg" :alt="refund.product_name" />
              <div class="item-info">
                <div class="name">{{ refund.product_name }}</div>
                <div class="meta">¥{{ refund.price }} × {{ refund.quantity }} = ¥{{ refund.amount }}</div>
                <div class="reason">售后原因：{{ refund.reason }}</div>
              </div>
            </div>
          </div>
          <div class="refund-footer">
            <div class="info">
              <span>申请时间：{{ formatDate(refund.created_at) }}</span>
              <span v-if="refund.processed_at">处理时间：{{ formatDate(refund.processed_at) }}</span>
              <span v-if="refund.reject_reason" class="reject-reason">拒绝原因：{{ refund.reject_reason }}</span>
            </div>
            <div class="actions">
              <el-button
                v-if="refund.status === 'pending'"
                type="danger"
                plain
                size="small"
                @click="cancelRefund(refund.id)"
              >
                取消申请
              </el-button>
              <el-button
                v-if="refund.status === 'approved'"
                type="success"
                size="small"
                @click="completeRefund(refund.id)"
              >
                确认完成
              </el-button>
              <router-link :to="`/refund/${refund.id}`">
                <el-button size="small">查看详情</el-button>
              </router-link>
            </div>
          </div>
        </div>
        <el-empty v-if="!refunds.length" description="暂无售后记录" />
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
import { refundsApi } from '@/api';

const confirm = useConfirm();

const loading = ref(true);
const refunds = ref([]);
const total = ref(0);
const page = ref(1);
const statusFilter = ref('');
const placeholderImg = '/images/products/placeholder-80x80.png';

const typeText = {
  return: '退货',
  exchange: '换货'
};

const statusText = {
  pending: '待处理',
  approved: '已通过',
  rejected: '已拒绝',
  completed: '已完成',
  cancelled: '已取消'
};

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const res = await refundsApi.list({
      page: page.value,
      limit: 10,
      status: statusFilter.value || undefined
    });
    refunds.value = res.list || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
}

async function cancelRefund(id) {
  const ok = await confirm({ title: '取消申请', message: '确定要取消该售后申请吗？', type: 'warning' });
  if (!ok) return;
  await refundsApi.cancel(id);
  ElMessage.success('已取消');
  load();
}

async function completeRefund(id) {
  const ok = await confirm({ title: '确认完成', message: '确认售后已处理完成？', type: 'success' });
  if (!ok) return;
  await refundsApi.complete(id);
  ElMessage.success('已完成');
  load();
}
</script>

<style scoped>
.filter-bar { margin-bottom: 24px; }
.refunds-list { display: flex; flex-direction: column; gap: 16px; }
.refund-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.refund-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: #f8fafc;
  font-size: 14px;
}
.refund-no { flex: 1; }
.refund-type {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.refund-type.return { background: #fef2f2; color: #dc2626; }
.refund-type.exchange { background: #eff6ff; color: #2563eb; }
.status.pending { color: #f59e0b; font-weight: 500; }
.status.approved { color: #22c55e; font-weight: 500; }
.status.rejected { color: #ef4444; font-weight: 500; }
.status.completed { color: #22c55e; font-weight: 500; }
.status.cancelled { color: #94a3b8; font-weight: 500; }
.refund-body { padding: 16px 24px; }
.item-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
}
.item-row img { width: 70px; height: 70px; object-fit: cover; border-radius: 8px; }
.item-info { flex: 1; }
.item-info .name { font-weight: 500; margin-bottom: 4px; }
.item-info .meta { font-size: 13px; color: #64748b; margin-bottom: 4px; }
.item-info .reason { font-size: 13px; color: #475569; }
.refund-footer {
  padding: 16px 24px;
  border-top: 1px solid #f1f5f9;
}
.refund-footer .info {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 12px;
}
.refund-footer .reject-reason { color: #ef4444; }
.refund-footer .actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.pagination-wrap { margin-top: 24px; display: flex; justify-content: center; }
</style>
