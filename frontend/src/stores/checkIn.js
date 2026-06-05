import { computed } from 'vue';
import { useStore } from 'vuex';
import { checkInApi } from '@/api';

export const checkInModule = {
  namespaced: true,
  state: () => ({
    status: null,
    history: [],
    rewards: [],
    loading: false
  }),
  getters: {
    checkedInToday: (state) => state.status?.checked_in_today || false,
    consecutiveDays: (state) => state.status?.consecutive_days || 0,
    todayReward: (state) => state.status?.today_reward || null,
    monthRecords: (state) => state.status?.month_records || []
  },
  mutations: {
    SET_STATUS(state, status) {
      state.status = status;
    },
    SET_HISTORY(state, history) {
      state.history = history;
    },
    SET_REWARDS(state, rewards) {
      state.rewards = rewards;
    },
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
    UPDATE_CHECKED_IN(state, { checkedIn, consecutiveDays, record }) {
      if (state.status) {
        state.status.checked_in_today = checkedIn;
        state.status.consecutive_days = consecutiveDays;
        state.status.today_reward = null;
        if (record) {
          const exists = state.status.month_records.find(
            (r) => r.date === record.check_in_date
          );
          if (!exists) {
            state.status.month_records.push({
              date: record.check_in_date,
              consecutive_days: record.consecutive_days,
              reward_type: record.reward_type,
              reward_amount: record.reward_amount
            });
          }
        }
      }
    }
  },
  actions: {
    async fetchStatus({ commit }, params) {
      commit('SET_LOADING', true);
      try {
        const data = await checkInApi.getStatus(params);
        commit('SET_STATUS', data);
        return data;
      } catch (err) {
        console.error('Fetch check-in status error:', err);
        return null;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async performCheckIn({ commit, dispatch }) {
      commit('SET_LOADING', true);
      try {
        const result = await checkInApi.checkIn();
        if (result) {
          commit('UPDATE_CHECKED_IN', {
            checkedIn: true,
            consecutiveDays: result.reward.consecutive_days,
            record: result.record
          });
          dispatch('points/fetchAccount', null, { root: true });
          dispatch('points/fetchTransactions', { limit: 5 }, { root: true });
        }
        return { code: 0, data: result };
      } catch (err) {
        console.error('Check-in error:', err);
        throw err;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async fetchHistory({ commit }, params = {}) {
      commit('SET_LOADING', true);
      try {
        const data = await checkInApi.getHistory(params);
        commit('SET_HISTORY', data.list || []);
        return data;
      } catch (err) {
        console.error('Fetch check-in history error:', err);
        return null;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async fetchRewards({ commit }) {
      try {
        const data = await checkInApi.getRewards();
        commit('SET_REWARDS', data.rewards || []);
        return data;
      } catch (err) {
        console.error('Fetch check-in rewards error:', err);
        return null;
      }
    }
  }
};

export function useCheckInStore() {
  const store = useStore();

  const status = computed(() => store.state.checkIn.status);
  const checkedInToday = computed(() => store.getters['checkIn/checkedInToday']);
  const consecutiveDays = computed(() => store.getters['checkIn/consecutiveDays']);
  const todayReward = computed(() => store.getters['checkIn/todayReward']);
  const monthRecords = computed(() => store.getters['checkIn/monthRecords']);
  const history = computed(() => store.state.checkIn.history);
  const rewards = computed(() => store.state.checkIn.rewards);
  const loading = computed(() => store.state.checkIn.loading);

  const fetchStatus = (params) => store.dispatch('checkIn/fetchStatus', params);
  const performCheckIn = () => store.dispatch('checkIn/performCheckIn');
  const fetchHistory = (params) => store.dispatch('checkIn/fetchHistory', params);
  const fetchRewards = () => store.dispatch('checkIn/fetchRewards');

  return {
    status,
    checkedInToday,
    consecutiveDays,
    todayReward,
    monthRecords,
    history,
    rewards,
    loading,
    fetchStatus,
    performCheckIn,
    fetchHistory,
    fetchRewards
  };
}
