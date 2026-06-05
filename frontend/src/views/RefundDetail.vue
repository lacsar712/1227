<template>
  <div class="page-container" v-loading="loading">
    <template v-if="!loading && refund">
      <div class="refund-detail">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>售后单号：{{ refund.refund_no }}</span>
              <div class="header-right">
                <span class="refund-type" :class="refund.type">
                  {{ typeText[refund.type] }}
                </span>
                <span class="status" :class="refund.status">{{ statusText[refund.status] }}</span>
              </div>
            </div>
          </template>

          <el-steps :active="stepActive" finish-status="success" class="timeline-steps">
            <el-step title="提交申请" :description="formatDate(refund.created_at)" />
            <el-step title="审核中" :description="refund.status === 'pending' ? '审核中' : '审核完成'" />
            <el-step title="处理中" :description="refund.status === 'approved' ? '处理中' : ''" />
            <el-step title="完成" :description="refund.status === 'completed' ? formatDate(refund.processed_at) : ''" />
          </el-steps>

          <el-divider />

          <div class="order-info">
            <h4>关联订单</h4>
            <router-link :to="`/order/${refund.order_id}`" class="order-link">
              订单号：{{ refund.Order?.order_no || '-' }}
            </router-link>
          </div>

          <el-divider />

          <div class="product-section">
            <h4>售后商品</h4>
            <div class="product-row">
              <img :src="refund.product_image || placeholderImg" :alt="refund.product_name" />
              <div class="product-info">
                <div class="name">{{ refund.product_name }}</div>
                <div class="meta">¥{{ refund.price }} × {{ refund.quantity }} = ¥{{ refund.amount }}</div>
              </div>
            </div>
          </div>

          <el-divider />

          <div class="refund-info">
            <h4>售后信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">售后类型：</span>
                <span>{{ typeText[refund.type] }}</span>
              </div>
              <div class="info-item">
                <span class="label">申请时间：</span>
                <span>{{ formatDate(refund.created_at) }}</span>
              </div>
              <div class="info-item full-width">
                <span class="label">售后原因：</span>
                <span>{{ refund.reason }}</span>
              </div>
              <div class="info-item full-width" v-if="refund.description">
                <span class="label">详细描述：</span>
                <span>{{ refund.description }}</span>
              </div>
              <div class="info-item full-width" v-if="refund.reject_reason">
                <span class="label">拒绝原因：</span>
                <span class="reject-text">{{ refund.reject_reason }}</span>
              </div>
              <div class="info-item" v-if="refund.processed_at">
                <span class="label">处理时间：</span>
                <span>{{ formatDate(refund.processed_at) }}</span>
              </div>
            </div>
          </div>

          <div class="actions" v-if="refund.status === 'pending'">
            <el-button type="success" @click="approveRefund">审核通过</el-button>
            <el-button type="danger" @click="showRejectDialog">审核拒绝</el-button>
            <el-button type="danger" plain @click="cancelRefund">取消申请</el-button>
          </div>
          <div class="actions" v-if="refund.status === 'approved'">
            <el-button type="success" @click="completeRefund">确认完成</el-button>
          </div>

          <el-dialog v-model="rejectDialogVisible" title="拒绝售后申请" width="400px">
            <el-form :model="rejectForm" label-width="80px">
              <el-form-item label="拒绝原因" prop="reject_reason" :rules="[{ required: true, message: '请填写拒绝原因', trigger: 'blur' }]">
                <el-input
                  v-model="rejectForm.reject_reason"
                  type="textarea"
                  :rows="4"
                  placeholder="请填写拒绝原因..."
                  maxlength="500"
                  show-word-limit
                />
              </el-form-item>
            </el-form>
            <template #footer>
              <el-button @click="rejectDialogVisible = false">取消</el-button>
              <el-button type="danger" @click="submitReject">确认拒绝</el-button>
            </template>
          </el-dialog>
        </el-card>
      </div>
    </template>
    <el-empty v-else-if="!loading" description="售后单不存在" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useConfirm } from '@/composables/useConfirm';
import { refundsApi } from '@/api';

const confirm = useConfirm();
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const refund = ref(null);
const placeholderImg = '/images/products/placeholder-80x80.png';
const rejectDialogVisible = ref(false);
const rejectForm = ref({ reject_reason: '' });

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

const stepActive = computed(() => {
  if (!refund.value) return 0;
  switch (refund.value.status) {
    case 'pending': return 1;
    case 'approved': return 2;
    case 'completed': return 4;
    case 'rejected': return 1;
    case 'cancelled': return 1;
    default: return 0;
  }
});

onMounted(async () => {
  try {
    refund.value = await refundsApi.detail(route.params.id);
  } catch {
    refund.value = null;
  } finally {
    loading.value = false;
  }
});

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
}

async function cancelRefund() {
  const ok = await confirm({ title: '取消申请', message: '确定要取消该售后申请吗？', type: 'warning' });
  if (!ok) return;
  await refundsApi.cancel(refund.value.id);
  ElMessage.success('已取消');
  router.push('/refunds');
}

async function completeRefund() {
  const ok = await confirm({ title: '确认完成', message: '确认售后已处理完成？', type: 'success' });
  if (!ok) return;
  await refundsApi.complete(refund.value.id);
  ElMessage.success('已完成');
  refund.value = await refundsApi.detail(route.params.id);
}

function showRejectDialog() {
  rejectForm.value = { reject_reason: '' };
  rejectDialogVisible.value = true;
}

async function approveRefund() {
  const ok = await confirm({ title: '审核通过', message: '确认审核通过该售后申请？', type: 'success' });
  if (!ok) return;
  await refundsApi.approve(refund.value.id);
  ElMessage.success('审核通过');
  refund.value = await refundsApi.detail(route.params.id);
}

async function submitReject() {
  if (!rejectForm.value.reject_reason.trim()) {
    ElMessage.warning('请填写拒绝原因');
    return;
  }
  const ok = await confirm({ title: '确认拒绝', message: '确认拒绝该售后申请？', type: 'warning' });
  if (!ok) return;
  await refundsApi.reject(refund.value.id, rejectForm.value);
  rejectDialogVisible.value = false;
  ElMessage.success('已拒绝');
  refund.value = await refundsApi.detail(route.params.id);
}
</script>

<style scoped>
.refund-detail { max-width: 720px; }
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
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
.timeline-steps { margin: 24px 0; }
.order-info h4, .product-section h4, .refund-info h4 { margin: 0 0 12px; font-size: 16px; }
.order-link { color: #6366f1; text-decoration: none; }
.order-link:hover { color: #4f46e5; }
.product-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
}
.product-row img { width: 70px; height: 70px; object-fit: cover; border-radius: 8px; }
.product-info .name { font-weight: 500; margin-bottom: 4px; }
.product-info .meta { font-size: 13px; color: #64748b; }
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.info-item { font-size: 14px; }
.info-item.full-width { grid-column: 1 / -1; }
.info-item .label { color: #64748b; }
.reject-text { color: #ef4444; }
.actions { margin-top: 24px; display: flex; gap: 12px; }
</style>
