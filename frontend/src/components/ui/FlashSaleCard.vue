<template>
  <div class="flash-sale-card" :class="{ 'is-upcoming': isUpcoming, 'is-sold-out': isSoldOut }">
    <router-link :to="`/product/${flashSale.product_id}`" class="card-link">
      <div class="card-image">
        <img :src="flashSale.product?.image || placeholderImg" :alt="flashSale.name" />
        <div class="flash-badge" v-if="isOngoing">
          <span class="fire-icon">🔥</span>
          秒杀中
        </div>
        <div class="sold-out-badge" v-else-if="isSoldOut">
          已售罄
        </div>
        <div class="upcoming-badge" v-else>
          即将开始
        </div>
      </div>
      <div class="card-content">
        <h3 class="product-name">{{ flashSale.product?.name || flashSale.name }}</h3>
        <div class="price-row">
          <span class="sale-price">¥{{ flashSale.sale_price }}</span>
          <span class="orig-price">¥{{ flashSale.original_price }}</span>
          <span class="discount-tag">省{{ discountPercent }}%</span>
        </div>
        <div class="stock-row">
          <div class="stock-bar">
            <div class="stock-progress" :style="{ width: stockPercent + '%' }"></div>
          </div>
          <span class="stock-text">已抢 {{ soldPercent }}%</span>
        </div>
        <div class="timer-row" v-if="isOngoing">
          <CountdownTimer :target-time="flashSale.end_time" prefix="距结束" :show-days="false" @end="handleEnd" />
        </div>
        <div class="timer-row" v-else>
          <CountdownTimer :target-time="flashSale.start_time" prefix="距开始" :show-days="false" @end="handleEnd" />
        </div>
        <div class="action-row">
          <el-button
            :type="isUpcoming ? 'primary' : 'danger'"
            size="small"
            class="buy-btn"
            :class="{ 'remind-btn': isUpcoming, 'reminded': isReminded }"
            :disabled="isOngoing && flashSale.stock <= 0"
            @click.stop="handleAction"
          >
            <template v-if="isOngoing">
              {{ flashSale.stock > 0 ? '立即抢购' : '已售罄' }}
            </template>
            <template v-else-if="isUpcoming">
              <el-icon v-if="isReminded"><BellFilled /></el-icon>
              <el-icon v-else><Bell /></el-icon>
              {{ isReminded ? '已订阅' : '提醒我' }}
            </template>
          </el-button>
        </div>
      </div>
    </router-link>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Bell, BellFilled } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useCartStore } from '@/stores/cart';
import CountdownTimer from './CountdownTimer.vue';

const props = defineProps({
  flashSale: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['refresh']);

const router = useRouter();
const userStore = useUserStore();
const cartStore = useCartStore();
const placeholderImg = '/images/products/placeholder-400x400.png';

const startTime = computed(() => new Date(props.flashSale.start_time).getTime());
const endTime = computed(() => new Date(props.flashSale.end_time).getTime());

const isOngoing = computed(() => {
  const n = Date.now();
  return startTime.value <= n && endTime.value > n && props.flashSale.stock > 0;
});

const isUpcoming = computed(() => startTime.value > Date.now());

const isSoldOut = computed(() => {
  const n = Date.now();
  return startTime.value <= n && endTime.value > n && props.flashSale.stock <= 0;
});

const isReminded = ref(false);
let reminderTimer = null;

const discountPercent = computed(() => {
  const orig = props.flashSale.original_price || 0;
  const sale = props.flashSale.sale_price || 0;
  if (orig <= 0 || sale >= orig) return 0;
  return Math.round((1 - sale / orig) * 100);
});

const soldPercent = computed(() => {
  const orig = props.flashSale.original_stock || 0;
  const stock = props.flashSale.stock || 0;
  if (orig <= 0) return 0;
  return Math.round(((orig - stock) / orig) * 100);
});

const stockPercent = computed(() => 100 - soldPercent.value);

const REMINDER_KEY = 'flash_sale_reminders';

function getReminders() {
  try {
    return JSON.parse(localStorage.getItem(REMINDER_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveReminder(flashSaleId) {
  const reminders = getReminders();
  if (!reminders.includes(flashSaleId)) {
    reminders.push(flashSaleId);
    localStorage.setItem(REMINDER_KEY, JSON.stringify(reminders));
  }
}

function removeReminder(flashSaleId) {
  const reminders = getReminders().filter(id => id !== flashSaleId);
  localStorage.setItem(REMINDER_KEY, JSON.stringify(reminders));
}

function setupReminder() {
  if (!isUpcoming.value) return;

  const delay = startTime.value - Date.now();
  if (delay <= 0) return;

  reminderTimer = setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification('秒杀活动开始啦！', {
        body: `${props.flashSale.name} 秒杀活动已开始，快来抢购吧！`,
        icon: '/favicon.svg'
      });
    }
    ElMessage({
      message: `🔥 ${props.flashSale.name} 秒杀活动开始啦！`,
      type: 'success',
      duration: 5000,
      showClose: true
    });
    isReminded.value = false;
    removeReminder(props.flashSale.id);
    emit('refresh');
  }, delay);
}

function clearReminderTimer() {
  if (reminderTimer) {
    clearTimeout(reminderTimer);
    reminderTimer = null;
  }
}

async function handleAction() {
  if (isUpcoming.value) {
    if (!userStore.isLoggedIn) {
      router.push('/login');
      return;
    }

    if (isReminded.value) {
      isReminded.value = false;
      removeReminder(props.flashSale.id);
      clearReminderTimer();
      ElMessage.info('已取消提醒');
      return;
    }

    try {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    } catch (e) {
      // ignore
    }

    isReminded.value = true;
    saveReminder(props.flashSale.id);
    setupReminder();

    const startDate = new Date(startTime.value);
    const timeStr = startDate.toLocaleString('zh-CN', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    ElMessage.success(`已订阅提醒，${timeStr} 将通知您`);
    return;
  }

  await handleBuy();
}

function handleEnd() {
  emit('refresh');
}

async function handleBuy() {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }

  if (!isOngoing.value) {
    ElMessage.info('活动尚未开始');
    return;
  }

  if (props.flashSale.stock <= 0) {
    ElMessage.info('商品已售罄');
    return;
  }

  try {
    await cartStore.add(props.flashSale.product_id, 1, props.flashSale.id);
    ElMessage.success('已加入购物车');
  } catch (e) {
    // error handled by interceptor
  }
}

onMounted(() => {
  const reminders = getReminders();
  isReminded.value = reminders.includes(props.flashSale.id);
  if (isReminded.value && isUpcoming.value) {
    setupReminder();
  }
});

onUnmounted(() => {
  clearReminderTimer();
});

watch(() => props.flashSale.id, () => {
  const reminders = getReminders();
  isReminded.value = reminders.includes(props.flashSale.id);
  clearReminderTimer();
  if (isReminded.value && isUpcoming.value) {
    setupReminder();
  }
});
</script>

<style scoped>
.flash-sale-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: all 0.2s ease;
  position: relative;
}

.flash-sale-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(239,68,68,0.15);
}

.card-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.card-image {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f8fafc;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.flash-sale-card:hover .card-image img {
  transform: scale(1.05);
}

.flash-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: linear-gradient(135deg, #ef4444, #f97316);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.upcoming-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
}

.fire-icon {
  font-size: 14px;
}

.card-content {
  padding: 12px;
}

.product-name {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 8px;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 8px;
}

.sale-price {
  font-size: 20px;
  font-weight: 700;
  color: #ef4444;
}

.orig-price {
  font-size: 12px;
  color: #94a3b8;
  text-decoration: line-through;
}

.discount-tag {
  font-size: 11px;
  background: #fef2f2;
  color: #ef4444;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 600;
}

.stock-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.stock-bar {
  flex: 1;
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
}

.stock-progress {
  height: 100%;
  background: linear-gradient(90deg, #f97316, #ef4444);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.stock-text {
  font-size: 11px;
  color: #ef4444;
  font-weight: 600;
  white-space: nowrap;
}

.timer-row {
  margin-bottom: 12px;
  padding: 8px;
  background: #f8fafc;
  border-radius: 6px;
  display: flex;
  justify-content: center;
}

.action-row {
  display: flex;
  justify-content: center;
}

.buy-btn {
  width: 100%;
  font-weight: 600;
}

.buy-btn.remind-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.buy-btn.reminded {
  background: linear-gradient(135deg, #10b981, #059669) !important;
  border: none !important;
}

.flash-sale-card.is-sold-out {
  opacity: 0.8;
}

.flash-sale-card.is-sold-out .card-image::after {
  content: '已售罄';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 4px;
}

.sold-out-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: linear-gradient(135deg, #64748b, #475569);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
}

.is-upcoming .sale-price {
  color: #6366f1;
}

.is-upcoming .stock-progress {
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
}

.is-upcoming .stock-text {
  color: #6366f1;
}

.is-sold-out .sale-price {
  color: #94a3b8;
}

.is-sold-out .stock-progress {
  background: #94a3b8;
}

.is-sold-out .stock-text {
  color: #94a3b8;
}
</style>
