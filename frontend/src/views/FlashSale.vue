<template>
  <div class="flash-sale-page">
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">🔥</div>
          <div>
            <h1 class="header-title">限时秒杀</h1>
            <p class="header-subtitle">精选好物，限时特惠，先到先得</p>
          </div>
        </div>
        <div class="header-tabs">
          <div
            class="tab-item"
            :class="{ active: activeTab === 'ongoing' }"
            @click="activeTab = 'ongoing'"
          >
            正在进行
            <span class="tab-badge" v-if="ongoingList.length">{{ ongoingList.length }}</span>
          </div>
          <div
            class="tab-item"
            :class="{ active: activeTab === 'upcoming' }"
            @click="activeTab = 'upcoming'"
          >
            即将开始
            <span class="tab-badge" v-if="upcomingList.length">{{ upcomingList.length }}</span>
          </div>
        </div>
      </div>

      <div v-loading="loading" class="content-area">
        <div v-if="!loading && activeTab === 'ongoing'">
          <template v-if="ongoingList.length || soldOutList.length">
            <div v-if="ongoingList.length" class="sale-section">
              <div class="section-label">
                <span class="label-dot"></span>
                <span>热抢中</span>
              </div>
              <div class="sale-grid">
                <FlashSaleCard
                  v-for="item in ongoingList"
                  :key="item.id"
                  :flash-sale="item"
                  @refresh="fetchData"
                />
              </div>
            </div>
            <div v-if="soldOutList.length" class="sale-section sold-out-section">
              <div class="section-label">
                <span class="label-dot sold-out-dot"></span>
                <span>已售罄</span>
                <span class="label-hint">（活动仍在进行中，商品已抢光）</span>
              </div>
              <div class="sale-grid">
                <FlashSaleCard
                  v-for="item in soldOutList"
                  :key="item.id"
                  :flash-sale="item"
                  @refresh="fetchData"
                />
              </div>
            </div>
          </template>
          <el-empty v-else description="暂无进行中的秒杀活动" />
        </div>

        <div v-if="!loading && activeTab === 'upcoming'">
          <div v-if="upcomingList.length" class="sale-grid">
            <FlashSaleCard
              v-for="item in upcomingList"
              :key="item.id"
              :flash-sale="item"
              @refresh="fetchData"
            />
          </div>
          <el-empty v-else description="暂无即将开始的秒杀活动" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { flashSalesApi } from '@/api';
import FlashSaleCard from '@/components/ui/FlashSaleCard.vue';

const activeTab = ref('ongoing');
const loading = ref(true);
const ongoingList = ref([]);
const soldOutList = ref([]);
const upcomingList = ref([]);

async function fetchData() {
  try {
    const data = await flashSalesApi.list();
    ongoingList.value = data.ongoing || [];
    soldOutList.value = data.sold_out || [];
    upcomingList.value = data.upcoming || [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.flash-sale-page {
  min-height: calc(100vh - 200px);
  background: linear-gradient(180deg, #fef2f2 0%, #f8fafc 300px);
  padding-bottom: 64px;
}

.page-header {
  background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
  margin: 0 -24px;
  padding: 40px 24px 32px;
  color: #fff;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.header-icon {
  font-size: 48px;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.header-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}

.header-subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

.header-tabs {
  display: inline-flex;
  background: rgba(255,255,255,0.15);
  border-radius: 8px;
  padding: 4px;
  backdrop-filter: blur(10px);
}

.tab-item {
  padding: 8px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-item:hover {
  background: rgba(255,255,255,0.1);
}

.tab-item.active {
  background: #fff;
  color: #ef4444;
}

.tab-badge {
  background: rgba(0,0,0,0.2);
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
}

.tab-item.active .tab-badge {
  background: #ef4444;
  color: #fff;
}

.content-area {
  padding-top: 32px;
  min-height: 300px;
}

.sale-section {
  margin-bottom: 32px;
}

.sale-section:last-child {
  margin-bottom: 0;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.label-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ef4444, #f97316);
  animation: pulse 2s infinite;
}

.label-dot.sold-out-dot {
  background: #94a3b8;
  animation: none;
}

.label-hint {
  font-size: 13px;
  font-weight: 400;
  color: #94a3b8;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.sold-out-section .section-label {
  color: #64748b;
}

.sale-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

@media (max-width: 768px) {
  .page-header {
    margin: 0 -16px;
    padding: 24px 16px 20px;
  }

  .header-title {
    font-size: 24px;
  }

  .header-icon {
    font-size: 36px;
  }

  .sale-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>
