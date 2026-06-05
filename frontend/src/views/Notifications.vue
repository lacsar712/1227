<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">消息通知</h1>
      <el-button
        v-if="unreadCount > 0"
        type="primary"
        plain
        @click="handleMarkAllRead"
      >
        全部标记已读
      </el-button>
    </div>
    <div class="filter-bar">
      <el-radio-group v-model="typeFilter" @change="load">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button value="order_paid">支付成功</el-radio-button>
        <el-radio-button value="order_shipped">发货提醒</el-radio-button>
        <el-radio-button value="order_cancelled">订单取消</el-radio-button>
        <el-radio-button value="order_completed">订单完成</el-radio-button>
        <el-radio-button value="after_sale">售后进度</el-radio-button>
        <el-radio-button value="system">系统通知</el-radio-button>
      </el-radio-group>
      <el-radio-group v-model="readFilter" @change="load">
        <el-radio-button value="">全部状态</el-radio-button>
        <el-radio-button value="false">未读</el-radio-button>
        <el-radio-button value="true">已读</el-radio-button>
      </el-radio-group>
    </div>
    <div v-loading="loading" class="notifications-list">
      <template v-if="!loading">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-card"
          :class="{ unread: !notification.is_read }"
          @click="handleCardClick(notification)"
        >
          <div class="notification-icon" :class="notification.type">
            <el-icon :size="20">
              <component :is="notificationIcons[notification.type]" />
            </el-icon>
          </div>
          <div class="notification-content">
            <div class="notification-header">
              <span class="notification-title">{{ notification.title }}</span>
              <span class="notification-time">{{ formatTime(notification.createdAt || notification.created_at) }}</span>
            </div>
            <div class="notification-body">{{ notification.content }}</div>
            <div class="notification-footer">
              <span class="notification-type">{{ typeLabels[notification.type] }}</span>
              <el-button
                v-if="!notification.is_read"
                type="primary"
                link
                size="small"
                @click.stop="handleMarkRead(notification.id)"
              >
                标记已读
              </el-button>
            </div>
          </div>
          <div v-if="!notification.is_read" class="unread-dot"></div>
        </div>
        <el-empty v-if="!notifications.length" description="暂无消息" />
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
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  Wallet,
  Truck,
  Close,
  CircleCheck,
  Service,
  Bell
} from '@element-plus/icons-vue';
import { useNotificationStore } from '@/stores/notification';

const router = useRouter();
const notificationStore = useNotificationStore();

const loading = ref(true);
const notifications = ref([]);
const total = ref(0);
const page = ref(1);
const typeFilter = ref('');
const readFilter = ref('');

const unreadCount = computed(() => notificationStore.unreadCount?.value ?? 0);

const notificationIcons = {
  order_paid: Wallet,
  order_shipped: Truck,
  order_cancelled: Close,
  order_completed: CircleCheck,
  after_sale: Service,
  system: Bell
};

const typeLabels = {
  order_paid: '订单通知',
  order_shipped: '物流通知',
  order_cancelled: '订单通知',
  order_completed: '订单通知',
  after_sale: '售后通知',
  system: '系统通知'
};

onMounted(async () => {
  await notificationStore.fetchUnreadCount();
  load();
});

async function load() {
  loading.value = true;
  try {
    const params = { page: page.value, limit: 10 };
    if (typeFilter.value) params.type = typeFilter.value;
    if (readFilter.value !== '') params.is_read = readFilter.value;
    const data = await notificationStore.fetchNotifications(params);
    notifications.value = data.list || [];
    total.value = data.total || 0;
  } finally {
    loading.value = false;
  }
}

function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString();
}

function handleCardClick(notification) {
  if (notification.related_type === 'order' && notification.related_id) {
    if (!notification.is_read) {
      notificationStore.markRead(notification.id);
    }
    router.push(`/order/${notification.related_id}`);
  }
}

async function handleMarkRead(id) {
  await notificationStore.markRead(id);
  load();
}

async function handleMarkAllRead() {
  await notificationStore.markAllRead();
  ElMessage.success('已全部标记为已读');
  load();
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}
.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.notification-card {
  position: relative;
  display: flex;
  gap: 16px;
  padding: 20px 24px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
}
.notification-card:hover {
  border-color: #6366f1;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
  transform: translateY(-1px);
}
.notification-card.unread {
  background: linear-gradient(to right, #f0f4ff 0%, #ffffff 60%);
  border-color: #c7d2fe;
}
.notification-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #64748b;
}
.notification-icon.order_paid {
  background: #dcfce7;
  color: #16a34a;
}
.notification-icon.order_shipped {
  background: #dbeafe;
  color: #2563eb;
}
.notification-icon.order_cancelled {
  background: #fee2e2;
  color: #dc2626;
}
.notification-icon.order_completed {
  background: #d1fae5;
  color: #059669;
}
.notification-icon.after_sale {
  background: #fef3c7;
  color: #d97706;
}
.notification-icon.system {
  background: #f3e8ff;
  color: #9333ea;
}
.notification-content {
  flex: 1;
  min-width: 0;
}
.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.notification-title {
  font-weight: 600;
  font-size: 15px;
  color: #1e293b;
}
.notification-time {
  font-size: 12px;
  color: #94a3b8;
  flex-shrink: 0;
}
.notification-body {
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 12px;
}
.notification-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.notification-type {
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
}
.unread-dot {
  position: absolute;
  top: 20px;
  right: 24px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  flex-shrink: 0;
}
.pagination-wrap {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}
</style>
