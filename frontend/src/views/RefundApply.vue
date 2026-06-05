<template>
  <div class="page-container">
    <h1 class="page-title">申请售后</h1>
    <div v-loading="loading" class="refund-apply">
      <el-card shadow="never" v-if="orderInfo">
        <template #header>
          <div class="card-header">
            <span>订单号：{{ orderInfo.order_no }}</span>
            <span>订单金额：¥{{ orderInfo.total_amount }}</span>
          </div>
        </template>

        <div class="section">
          <h4>选择商品</h4>
          <el-alert
            v-if="allItemsRefunded"
            type="info"
            :closable="false"
            show-icon
            title="该订单商品已全部申请售后"
            description="您订单中的所有商品都已提交过售后申请，每个商品仅可申请一次售后。"
            class="alert-tip"
          />
          <div class="items-list">
            <div
              v-for="item in items"
              :key="item.id"
              class="item-card"
              :class="{ active: selectedItemId === item.id, disabled: item.has_refund }"
              @click="selectItem(item)"
            >
              <el-radio
                :model-value="selectedItemId"
                :label="item.id"
                :disabled="item.has_refund"
                class="item-radio"
              />
              <img :src="item.product_image || placeholderImg" :alt="item.product_name" />
              <div class="item-info">
                <div class="name">{{ item.product_name }}</div>
                <div class="meta">¥{{ item.price }} × {{ item.quantity }} = ¥{{ item.subtotal }}</div>
                <div v-if="item.has_refund" class="refunded-tag">已申请售后</div>
              </div>
            </div>
          </div>
        </div>

        <el-divider v-if="selectedItem" />

        <div class="section" v-if="selectedItem">
          <h4>选择售后类型</h4>
          <el-radio-group v-model="form.type" class="type-group">
            <el-radio-button value="return">
              <el-icon><Service /></el-icon>
              <span>退货退款</span>
            </el-radio-button>
            <el-radio-button value="exchange">
              <el-icon><RefreshRight /></el-icon>
              <span>换货</span>
            </el-radio-button>
          </el-radio-group>
        </div>

        <el-divider v-if="selectedItem" />

        <div class="section" v-if="selectedItem">
          <h4>填写售后原因</h4>
          <el-form :model="form" label-width="100px" class="refund-form">
            <el-form-item
              label="售后原因"
              prop="reason"
              :rules="[{ required: true, message: '请选择售后原因', trigger: 'change' }]"
            >
              <el-select v-model="form.reason" placeholder="请选择售后原因" class="full-width">
                <el-option label="商品质量问题" value="商品质量问题" />
                <el-option label="商品与描述不符" value="商品与描述不符" />
                <el-option label="发错货/漏发货" value="发错货/漏发货" />
                <el-option label="商品损坏" value="商品损坏" />
                <el-option label="不想要了/拍错了" value="不想要了/拍错了" />
                <el-option label="其他原因" value="其他原因" />
              </el-select>
            </el-form-item>
            <el-form-item label="详细描述" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="4"
                placeholder="请详细描述您的问题，以便我们更好地为您处理..."
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>
          </el-form>
        </div>

        <div class="actions" v-if="selectedItem || allItemsRefunded">
          <el-button @click="goBack">返回</el-button>
          <el-button
            v-if="selectedItem"
            type="primary"
            :disabled="!canSubmit"
            @click="submit"
          >
            提交申请
          </el-button>
        </div>
      </el-card>
      <el-empty v-else-if="!loading" description="没有可申请售后的订单" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Service, RefreshRight } from '@element-plus/icons-vue';
import { refundsApi } from '@/api';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const orderInfo = ref(null);
const items = ref([]);
const selectedItemId = ref(null);
const placeholderImg = '/images/products/placeholder-80x80.png';

const form = reactive({
  type: 'return',
  reason: '',
  description: ''
});

const selectedItem = computed(() => {
  return items.value.find((i) => i.id === selectedItemId.value);
});

const canSubmit = computed(() => {
  return selectedItem.value && form.reason && form.type;
});

const allItemsRefunded = computed(() => {
  return items.value.length > 0 && items.value.every((i) => i.has_refund);
});

onMounted(async () => {
  const orderId = route.query.order_id;
  if (!orderId) {
    ElMessage.error('请从订单详情页进入申请售后');
    loading.value = false;
    return;
  }
  try {
    const res = await refundsApi.getApplicableItems(orderId);
    orderInfo.value = res.order;
    items.value = res.items;
    if (res.items.length === 1 && !res.items[0].has_refund) {
      selectedItemId.value = res.items[0].id;
    }
  } catch {
    items.value = [];
  } finally {
    loading.value = false;
  }
});

function selectItem(item) {
  if (item.has_refund) return;
  selectedItemId.value = item.id;
}

function goBack() {
  if (route.query.order_id) {
    router.push(`/order/${route.query.order_id}`);
  } else {
    router.back();
  }
}

async function submit() {
  if (!canSubmit.value) return;
  try {
    const res = await refundsApi.apply({
      order_id: route.query.order_id,
      order_item_id: selectedItemId.value,
      type: form.type,
      reason: form.reason,
      description: form.description
    });
    ElMessage.success('售后申请提交成功');
    router.push(`/refund/${res.id}`);
  } catch (err) {
    // Error already handled by interceptor
  }
}
</script>

<style scoped>
.refund-apply { max-width: 720px; }
.card-header {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}
.section h4 { margin: 0 0 16px; font-size: 16px; }
.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.item-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.item-card:hover:not(.disabled) {
  border-color: #a5b4fc;
  background: #f5f3ff;
}
.item-card.active {
  border-color: #6366f1;
  background: #eef2ff;
}
.item-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f8fafc;
}
.item-radio { margin-right: 8px; }
.item-card img { width: 70px; height: 70px; object-fit: cover; border-radius: 8px; }
.item-info { flex: 1; }
.item-info .name { font-weight: 500; margin-bottom: 4px; }
.item-info .meta { font-size: 13px; color: #64748b; }
.refunded-tag {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 8px;
  background: #fef3c7;
  color: #d97706;
  border-radius: 4px;
  font-size: 12px;
}
.type-group { display: flex; gap: 12px; }
.type-group .el-radio-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border-radius: 12px;
}
.full-width { width: 100%; }
.refund-form { margin-top: 16px; }
.actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.alert-tip {
  margin-bottom: 16px;
}
</style>
