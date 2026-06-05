<template>
  <div class="page-container">
    <h1 class="page-title">确认订单</h1>
    <div v-loading="loading">
      <template v-if="!loading">
        <el-card shadow="never" class="section">
          <template #header>
            <span>收货地址</span>
            <el-button type="primary" text @click="showAddressForm = true">+ 新增地址</el-button>
          </template>
          <div v-if="addresses.length" class="address-list">
            <div
              v-for="addr in addresses"
              :key="addr.id"
              :class="['address-item', { active: form.address_id === addr.id }]"
              @click="form.address_id = addr.id"
            >
              <div class="addr-info">
                <span class="receiver">{{ addr.receiver }}</span>
                <span class="phone">{{ addr.phone }}</span>
                <span class="default" v-if="addr.is_default">默认</span>
              </div>
              <div class="addr-detail">{{ addr.province }} {{ addr.city }} {{ addr.district }} {{ addr.detail }}</div>
            </div>
          </div>
          <el-empty v-else description="暂无收货地址">
            <el-button type="primary" @click="showAddressForm = true">添加地址</el-button>
          </el-empty>
        </el-card>
        <el-card shadow="never" class="section">
          <template #header>支付方式</template>
          <el-radio-group v-model="form.payment_method">
            <el-radio value="alipay">支付宝</el-radio>
            <el-radio value="wechat">微信支付</el-radio>
            <el-radio value="bank">银行卡</el-radio>
          </el-radio-group>
        </el-card>
        <el-card shadow="never" class="section">
          <template #header>商品清单</template>
          <div class="order-items">
            <div v-for="item in cartItems" :key="item.id" class="order-item">
              <img :src="item.product?.image || placeholderImg" :alt="item.product?.name" />
              <div class="item-info">
                <div class="name">{{ item.product?.name }}</div>
                <div class="meta">¥{{ item.product?.price }} × {{ item.quantity }}</div>
              </div>
              <div class="subtotal">¥{{ ((item.product?.price || 0) * item.quantity).toFixed(2) }}</div>
            </div>
          </div>
          <el-input v-model="form.remark" placeholder="订单备注（选填）" type="textarea" :rows="2" class="remark" />
        </el-card>
        <div class="submit-bar">
          <div class="total">合计：<span>¥{{ cartTotal.toFixed(2) }}</span></div>
          <el-button type="primary" size="large" :loading="submitting" @click="submitOrder">
            提交订单
          </el-button>
        </div>
      </template>
    </div>
    <el-dialog v-model="showAddressForm" title="收货地址" width="500px" destroy-on-close @close="editingAddr = null">
      <el-form :model="addrForm" label-width="80px">
        <el-form-item label="收货人" required>
          <el-input v-model="addrForm.receiver" placeholder="请输入收货人" />
        </el-form-item>
        <el-form-item label="手机号" required>
          <el-input v-model="addrForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="省份" required>
          <el-input v-model="addrForm.province" placeholder="如：广东省" />
        </el-form-item>
        <el-form-item label="城市" required>
          <el-input v-model="addrForm.city" placeholder="如：深圳市" />
        </el-form-item>
        <el-form-item label="区县" required>
          <el-input v-model="addrForm.district" placeholder="如：南山区" />
        </el-form-item>
        <el-form-item label="详细地址" required>
          <el-input v-model="addrForm.detail" placeholder="街道、门牌号等" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="addrForm.is_default">设为默认地址</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddressForm = false">取消</el-button>
        <el-button type="primary" @click="saveAddress">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { addressesApi, ordersApi } from '@/api';
import { useCartStore } from '@/stores/cart';

const router = useRouter();
const cartStore = useCartStore();
const cartItems = computed(() => cartStore.items?.value ?? []);
const cartTotal = computed(() => cartStore.total?.value ?? 0);
const loading = ref(true);
const submitting = ref(false);
const addresses = ref([]);
const showAddressForm = ref(false);
const editingAddr = ref(null);
const placeholderImg = '/images/products/placeholder-100x100.png';

const form = reactive({
  address_id: null,
  payment_method: 'alipay',
  remark: ''
});

const addrForm = reactive({
  receiver: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  is_default: false
});

onMounted(async () => {
  await cartStore.fetchCart();
  if (!cartItems.value.length) {
    ElMessage.warning('购物车为空');
    router.push('/cart');
    return;
  }
  addresses.value = await addressesApi.list();
  const defaultAddr = addresses.value.find((a) => a.is_default);
  form.address_id = defaultAddr?.id || addresses.value[0]?.id;
  loading.value = false;
});

async function saveAddress() {
  if (!addrForm.receiver || !addrForm.phone || !addrForm.province || !addrForm.city || !addrForm.district || !addrForm.detail) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  try {
    if (editingAddr.value) {
      await addressesApi.update(editingAddr.value.id, addrForm);
      ElMessage.success('更新成功');
    } else {
      await addressesApi.create(addrForm);
      ElMessage.success('添加成功');
    }
    addresses.value = await addressesApi.list();
    showAddressForm.value = false;
    Object.assign(addrForm, { receiver: '', phone: '', province: '', city: '', district: '', detail: '', is_default: false });
  } catch (e) {}
}

async function submitOrder() {
  if (!form.address_id) {
    ElMessage.warning('请选择收货地址');
    return;
  }
  submitting.value = true;
  try {
    const order = await ordersApi.create(form);
    await cartStore.fetchCart();
    ElMessage.success('订单创建成功');
    router.push(`/order/${order.id}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.section { margin-bottom: 24px; }
.address-list { display: flex; flex-direction: column; gap: 12px; }
.address-item {
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.address-item:hover { border-color: #6366f1; }
.address-item.active { border-color: #6366f1; background: #eef2ff; }
.addr-info { display: flex; gap: 12px; align-items: center; margin-bottom: 8px; }
.receiver { font-weight: 600; }
.default { font-size: 12px; color: #6366f1; background: #eef2ff; padding: 2px 8px; border-radius: 4px; }
.addr-detail { color: #64748b; font-size: 14px; }
.order-items { margin-bottom: 16px; }
.order-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}
.order-item img { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; }
.item-info .name { font-weight: 500; }
.item-info .meta { font-size: 13px; color: #64748b; }
.subtotal { margin-left: auto; font-weight: 600; }
.remark { margin-top: 12px; }
.submit-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.submit-bar .total span { font-size: 24px; font-weight: 700; color: #ef4444; }
</style>
