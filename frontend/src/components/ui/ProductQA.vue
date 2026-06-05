<template>
  <div class="product-qa">
    <div class="qa-header">
      <h3 class="qa-title">
        <el-icon><ChatDotRound /></el-icon>
        问大家
      </h3>
      <div class="qa-stats" v-if="total > 0">
        共 {{ total }} 条问答
      </div>
    </div>

    <div class="ask-section" v-if="userStore.isLoggedIn">
      <el-input
        v-model="questionContent"
        type="textarea"
        :rows="3"
        placeholder="对商品有疑问？向商家提问吧..."
        maxlength="500"
        show-word-limit
        @keydown.ctrl.enter="submitQuestion"
      />
      <div class="ask-actions">
        <span class="ask-tip">按 Ctrl + Enter 快速提交</span>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!questionContent.trim()"
          @click="submitQuestion"
        >
          <el-icon><Promotion /></el-icon>
          提交问题
        </el-button>
      </div>
    </div>

    <div class="login-prompt" v-else>
      <el-alert type="info" show-icon :closable="false">
        请先 <router-link to="/login">登录</router-link> 后提问
      </el-alert>
    </div>

    <div class="qa-list" v-loading="loading">
      <template v-if="!loading && questions.length > 0">
        <div
          v-for="q in questions"
          :key="q.id"
          class="qa-item"
          :class="{ 'answered': q.status === 'answered' }"
        >
          <div class="question-header">
            <div class="user-info">
              <div class="avatar">
                <img v-if="q.user.avatar" :src="q.user.avatar" :alt="q.user.nickname" />
                <span v-else>{{ q.user.nickname.charAt(0) }}</span>
              </div>
              <div class="user-meta">
                <span class="username">{{ q.user.nickname }}</span>
                <span class="question-time">{{ formatTime(q.created_at) }}</span>
              </div>
            </div>
            <el-tag
              :type="q.status === 'answered' ? 'success' : 'warning'"
              size="small"
              effect="light"
            >
              {{ q.status === 'answered' ? '已回答' : '待回答' }}
            </el-tag>
          </div>

          <div class="question-content">
            <span class="q-label">Q</span>
            <p>{{ q.content }}</p>
          </div>

          <div class="answer-section" v-if="q.status === 'answered' && q.answer">
            <div class="answer-header">
              <el-icon><OfficeBuilding /></el-icon>
              <span class="answer-label">商家回复</span>
              <span class="answer-time">{{ formatTime(q.answered_at) }}</span>
            </div>
            <div class="answer-content">
              <span class="a-label">A</span>
              <p>{{ q.answer }}</p>
            </div>
          </div>
        </div>
      </template>

      <el-empty
        v-else-if="!loading && questions.length === 0"
        description="暂无问答，快来提问吧！"
        :image-size="120"
      >
        <template #description>
          <div class="empty-desc">
            <p class="empty-title">还没有人提问</p>
            <p class="empty-subtitle">成为第一个提问的人，了解更多商品信息</p>
          </div>
        </template>
      </el-empty>
    </div>

    <div v-if="total > pageSize" class="pagination-wrap">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { ChatDotRound, Promotion, OfficeBuilding } from '@element-plus/icons-vue';
import { questionsApi } from '@/api';
import { useUserStore } from '@/stores/user';

const props = defineProps({
  productId: {
    type: [Number, String],
    required: true
  }
});

const userStore = useUserStore();

const questions = ref([]);
const total = ref(0);
const loading = ref(false);
const submitting = ref(false);
const questionContent = ref('');

const pageSize = 10;
const currentPage = ref(1);

async function loadQuestions() {
  if (!props.productId) return;

  loading.value = true;
  try {
    const res = await questionsApi.list(props.productId, {
      page: currentPage.value,
      limit: pageSize
    });
    questions.value = res.list || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
}

async function submitQuestion() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后提问');
    return;
  }

  const content = questionContent.value.trim();
  if (!content) {
    ElMessage.warning('问题内容不能为空');
    return;
  }

  if (content.length > 500) {
    ElMessage.warning('问题内容不能超过500字');
    return;
  }

  submitting.value = true;
  try {
    const newQuestion = await questionsApi.create(props.productId, { content });
    questions.value.unshift(newQuestion);
    total.value += 1;
    questionContent.value = '';
    ElMessage.success('提问成功，等待商家回复');
  } finally {
    submitting.value = false;
  }
}

function handlePageChange(page) {
  currentPage.value = page;
  loadQuestions();
}

function formatTime(time) {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

watch(() => props.productId, () => {
  currentPage.value = 1;
  loadQuestions();
});

onMounted(() => {
  loadQuestions();
});
</script>

<style scoped>
.product-qa {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.qa-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.qa-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--color-text);
}

.qa-title .el-icon {
  color: var(--color-primary);
  font-size: 20px;
}

.qa-stats {
  font-size: 14px;
  color: var(--color-text-muted);
}

.ask-section {
  margin-bottom: 24px;
}

.ask-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.ask-tip {
  font-size: 12px;
  color: var(--color-text-muted);
}

.login-prompt {
  margin-bottom: 24px;
}

.qa-list {
  min-height: 200px;
}

.qa-item {
  padding: 20px 0;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s;
}

.qa-item:last-child {
  border-bottom: none;
}

.qa-item:hover {
  background: #fafbfc;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

.question-time {
  font-size: 12px;
  color: var(--color-text-muted);
}

.question-content {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.q-label {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.question-content p {
  flex: 1;
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--color-text);
}

.answer-section {
  margin-left: 34px;
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
}

.answer-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.answer-header .el-icon {
  color: #10b981;
  font-size: 16px;
}

.answer-label {
  font-size: 14px;
  font-weight: 600;
  color: #10b981;
}

.answer-time {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-left: auto;
}

.answer-content {
  display: flex;
  gap: 10px;
}

.a-label {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.answer-content p {
  flex: 1;
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text);
}

.empty-desc {
  text-align: center;
}

.empty-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text);
  margin: 0 0 8px;
}

.empty-subtitle {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0;
}

.pagination-wrap {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .product-qa {
    padding: 16px;
  }

  .answer-section {
    margin-left: 0;
    padding: 12px;
  }

  .qa-title {
    font-size: 16px;
  }

  .ask-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
}
</style>
