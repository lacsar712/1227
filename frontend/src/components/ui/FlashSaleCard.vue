<template>
  <div class="flash-sale-card" :class="{ 'is-upcoming': isUpcoming }">
    <router-link :to="`/product/${flashSale.product_id}`" class="card-link">
      <div class="card-image">
        <img :src="flashSale.product?.image || placeholderImg" :alt="flashSale.name" />
        <div class="flash-badge" v-if="isOngoing">
          <span class="fire-icon">🔥</span>
          秒杀中
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
            type="danger"
            size="small"
            class="buy-btn"
            :disabled="!isOngoing || flashSale.stock <= 0"
            @click.stop="handleBuy"
          >
            {{ isOngoing ? (flashSale.stock > 0 ? '立即抢购' : '已售罄') : '提醒我' }}
          </el-button>
        </div>
      </div>
    </router-link>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ElMessage } from 'element-plus';
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

.is-upcoming .sale-price {
  color: #6366f1;
}

.is-upcoming .stock-progress {
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
}

.is-upcoming .stock-text {
  color: #6366f1;
}
</style>
