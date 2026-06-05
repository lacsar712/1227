<template>
  <div class="countdown-timer" :class="{ 'countdown-urgent': isUrgent }">
    <span v-if="prefix" class="countdown-prefix">{{ prefix }}</span>
    <div class="countdown-units">
      <span v-if="showDays" class="countdown-unit">
        <span class="countdown-num">{{ days }}</span>
        <span class="countdown-label">天</span>
      </span>
      <span class="countdown-unit">
        <span class="countdown-num">{{ hours }}</span>
        <span class="countdown-label">时</span>
      </span>
      <span class="countdown-sep">:</span>
      <span class="countdown-unit">
        <span class="countdown-num">{{ minutes }}</span>
        <span class="countdown-label">分</span>
      </span>
      <span class="countdown-sep">:</span>
      <span class="countdown-unit">
        <span class="countdown-num">{{ seconds }}</span>
        <span class="countdown-label">秒</span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  targetTime: {
    type: [Date, String, Number],
    required: true
  },
  prefix: {
    type: String,
    default: ''
  },
  showDays: {
    type: Boolean,
    default: true
  },
  urgentThreshold: {
    type: Number,
    default: 3600000
  }
});

const emit = defineEmits(['end', 'tick']);

const now = ref(Date.now());
let timer = null;

const targetTimestamp = computed(() => {
  const t = props.targetTime;
  if (t instanceof Date) return t.getTime();
  if (typeof t === 'string') return new Date(t).getTime();
  return t;
});

const diff = computed(() => Math.max(0, targetTimestamp.value - now.value));

const isUrgent = computed(() => diff.value > 0 && diff.value <= props.urgentThreshold);

const days = computed(() => Math.floor(diff.value / 86400000).toString().padStart(2, '0'));
const hours = computed(() => Math.floor((diff.value % 86400000) / 3600000).toString().padStart(2, '0'));
const minutes = computed(() => Math.floor((diff.value % 3600000) / 60000).toString().padStart(2, '0'));
const seconds = computed(() => Math.floor((diff.value % 60000) / 1000).toString().padStart(2, '0'));

function startTimer() {
  stopTimer();
  timer = setInterval(() => {
    now.value = Date.now();
    emit('tick', diff.value);
    if (diff.value <= 0) {
      stopTimer();
      emit('end');
    }
  }, 1000);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

watch(() => props.targetTime, () => {
  now.value = Date.now();
  if (targetTimestamp.value > now.value) {
    startTimer();
  }
}, { immediate: true });

onMounted(() => {
  if (targetTimestamp.value > now.value) {
    startTimer();
  }
});

onUnmounted(() => {
  stopTimer();
});
</script>

<style scoped>
.countdown-timer {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #1e293b;
}

.countdown-prefix {
  color: #64748b;
  font-size: 13px;
}

.countdown-units {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.countdown-unit {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  min-width: 28px;
}

.countdown-num {
  display: inline-block;
  background: #1e293b;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
  min-width: 28px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.countdown-label {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

.countdown-sep {
  font-weight: 700;
  color: #1e293b;
  padding: 0 2px;
}

.countdown-urgent .countdown-num {
  background: #ef4444;
  animation: pulse 1s infinite;
}

.countdown-urgent .countdown-prefix {
  color: #ef4444;
  font-weight: 600;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
