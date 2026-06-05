<template>
  <div class="page-container">
    <h1 class="page-title">每日签到</h1>

    <el-card shadow="never" class="checkin-card">
      <div class="checkin-header">
        <div class="consecutive-info">
          <div class="consecutive-days">
            <span class="number">{{ consecutiveDays }}</span>
            <span class="label">连续签到</span>
          </div>
          <div class="reward-preview" v-if="!checkedInToday && todayReward">
            <p class="reward-text">
              今日签到可获得
              <span class="reward-amount">+{{ todayReward.amount }}</span>
              积分
            </p>
            <p class="reward-desc">{{ todayReward.description }}</p>
          </div>
          <div class="already-checked" v-else-if="checkedInToday">
            <el-icon :size="24" color="#10b981"><CircleCheck /></el-icon>
            <span>今日已签到</span>
          </div>
        </div>
        <el-button
          type="primary"
          size="large"
          :loading="loading"
          :disabled="checkedInToday"
          @click="handleCheckIn"
          class="checkin-btn"
        >
          {{ checkedInToday ? '已签到' : '立即签到' }}
        </el-button>
      </div>

      <el-divider />

      <div class="calendar-header">
        <el-button
          :icon="ArrowLeft"
          circle
          size="small"
          @click="prevMonth"
        />
        <span class="month-title">{{ currentYear }}年{{ currentMonth + 1 }}月</span>
        <el-button
          :icon="ArrowRight"
          circle
          size="small"
          @click="nextMonth"
        />
      </div>

      <div class="calendar-weekdays">
        <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
      </div>

      <div class="calendar-grid">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="calendar-day"
          :class="{
            'other-month': !day.currentMonth,
            'checked': day.checked,
            'today': day.isToday,
            'special': day.isSpecial
          }"
        >
          <span class="day-number">{{ day.date }}</span>
          <el-icon v-if="day.checked" class="checked-icon" :size="16">
            <CircleCheck />
          </el-icon>
          <span v-if="day.rewardAmount" class="reward-tag">
            +{{ day.rewardAmount }}
          </span>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="rewards-card">
      <h3 class="card-title">签到奖励规则</h3>
      <div class="rewards-list">
        <div
          v-for="reward in rewardsList"
          :key="reward.day"
          class="reward-item"
          :class="{ 'active': isRewardActive(reward.day) }"
        >
          <div class="reward-day">第{{ reward.day }}天</div>
          <div class="reward-badge">
            <el-icon :size="20"><GoldMedal /></el-icon>
          </div>
          <div class="reward-points">+{{ reward.amount }}</div>
          <div class="reward-label">积分</div>
        </div>
      </div>
      <p class="rewards-note">
        <el-icon :size="14"><InfoFilled /></el-icon>
        连续签到7天为一个周期，中断后重新开始计算
      </p>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  GoldMedal,
  InfoFilled
} from '@element-plus/icons-vue';
import { useCheckInStore } from '@/stores/checkIn';

const router = useRouter();
const checkInStore = useCheckInStore();

const {
  loading,
  checkedInToday,
  consecutiveDays,
  todayReward,
  monthRecords,
  rewards,
  fetchStatus,
  performCheckIn,
  fetchRewards
} = checkInStore;

const currentDate = new Date();
const currentYear = ref(currentDate.getFullYear());
const currentMonth = ref(currentDate.getMonth());

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

const rewardsList = computed(() => rewards.value || [
  { day: 1, amount: 10 },
  { day: 2, amount: 15 },
  { day: 3, amount: 20 },
  { day: 4, amount: 25 },
  { day: 5, amount: 30 },
  { day: 6, amount: 40 },
  { day: 7, amount: 50 }
]);

const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const checkedMap = {};
  monthRecords.value.forEach((record) => {
    checkedMap[record.date] = record;
  });

  const days = [];
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: prevMonthLastDay - i,
      currentMonth: false,
      checked: false,
      isToday: false,
      isSpecial: false
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const record = checkedMap[dateStr];
    const isSpecial = record && record.consecutive_days % 7 === 0;

    days.push({
      date: i,
      currentMonth: true,
      checked: !!record,
      isToday: dateStr === todayStr,
      isSpecial,
      rewardAmount: record?.reward_amount || 0
    });
  }

  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: i,
      currentMonth: false,
      checked: false,
      isToday: false,
      isSpecial: false
    });
  }

  return days;
});

function isRewardActive(day) {
  const currentDayInCycle = ((consecutiveDays.value) % 7) + 1;
  if (checkedInToday.value) {
    return day <= currentDayInCycle;
  }
  return day < currentDayInCycle;
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
}

async function handleCheckIn() {
  if (checkedInToday.value || loading.value) return;

  try {
    const result = await performCheckIn();
    if (result.code === 0) {
      ElMessage.success(result.data?.message || '签到成功！');
    } else {
      ElMessage.warning(result.message || '签到失败');
    }
  } catch (err) {
    ElMessage.error('签到失败，请稍后重试');
  }
}

async function loadData() {
  await fetchStatus({
    year: currentYear.value,
    month: currentMonth.value
  });
  await fetchRewards();
}

watch([currentYear, currentMonth], () => {
  fetchStatus({
    year: currentYear.value,
    month: currentMonth.value
  });
});

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.checkin-card {
  max-width: 800px;
  margin-bottom: 24px;
}

.checkin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.consecutive-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 32px;
}

.consecutive-days {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 32px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 16px;
  color: white;
  min-width: 120px;
}

.consecutive-days .number {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
}

.consecutive-days .label {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 4px;
}

.reward-preview {
  flex: 1;
}

.reward-text {
  font-size: 18px;
  margin: 0 0 8px;
  color: #1e293b;
}

.reward-amount {
  font-size: 24px;
  font-weight: 700;
  color: #f59e0b;
}

.reward-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.already-checked {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #10b981;
  font-weight: 500;
}

.checkin-btn {
  min-width: 140px;
  height: 48px;
  font-size: 16px;
  border-radius: 24px;
}

.calendar-header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  margin-bottom: 20px;
}

.month-title {
  font-size: 18px;
  font-weight: 600;
  min-width: 120px;
  text-align: center;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  padding: 8px 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  position: relative;
  transition: all 0.2s;
  background: #f8fafc;
}

.calendar-day.other-month {
  background: transparent;
  color: #cbd5e1;
}

.calendar-day.today {
  background: #eef2ff;
  border: 2px solid #6366f1;
}

.calendar-day.checked {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.calendar-day.checked.today {
  border-color: #10b981;
}

.calendar-day.special {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.day-number {
  font-size: 16px;
  font-weight: 500;
}

.checked-icon {
  color: #10b981;
  margin-top: 2px;
}

.reward-tag {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 10px;
  color: #f59e0b;
  font-weight: 600;
}

.rewards-card {
  max-width: 800px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 20px;
  color: #1e293b;
}

.rewards-list {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.reward-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.reward-item.active {
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border-color: #6366f1;
}

.reward-day {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 8px;
}

.reward-badge {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fef3c7;
  border-radius: 50%;
  color: #f59e0b;
  margin-bottom: 8px;
}

.reward-item.active .reward-badge {
  background: #6366f1;
  color: white;
}

.reward-points {
  font-size: 18px;
  font-weight: 700;
  color: #f59e0b;
}

.reward-item.active .reward-points {
  color: #6366f1;
}

.reward-label {
  font-size: 12px;
  color: #94a3b8;
}

.rewards-note {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
  margin: 0;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.rewards-note .el-icon {
  color: #6366f1;
}

@media (max-width: 600px) {
  .checkin-header {
    flex-direction: column;
    align-items: stretch;
  }

  .consecutive-info {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .checkin-btn {
    width: 100%;
  }

  .rewards-list {
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
  }

  .reward-item {
    padding: 12px 4px;
  }

  .reward-badge {
    width: 32px;
    height: 32px;
  }

  .reward-points {
    font-size: 14px;
  }
}
</style>
