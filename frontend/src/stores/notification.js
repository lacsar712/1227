import { computed } from 'vue';
import { useStore } from 'vuex';
import { notificationsApi } from '@/api';

export const notificationModule = {
  namespaced: true,
  state: () => ({
    list: [],
    total: 0,
    unreadCount: 0,
    page: 1,
    limit: 10
  }),
  getters: {
    unreadList(state) {
      return state.list.filter((n) => !n.is_read);
    }
  },
  mutations: {
    SET_LIST(state, list) {
      state.list = list;
    },
    SET_TOTAL(state, total) {
      state.total = total;
    },
    SET_UNREAD_COUNT(state, count) {
      state.unreadCount = count;
    },
    SET_PAGE(state, page) {
      state.page = page;
    },
    MARK_READ(state, id) {
      const item = state.list.find((n) => n.id === id);
      if (item) {
        item.is_read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    MARK_ALL_READ(state) {
      state.list.forEach((n) => (n.is_read = true));
      state.unreadCount = 0;
    },
    DECREMENT_UNREAD(state) {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    }
  },
  actions: {
    async fetchNotifications({ commit, state }, params = {}) {
      try {
        const data = await notificationsApi.list({
          page: params.page || state.page,
          limit: params.limit || state.limit,
          type: params.type,
          is_read: params.is_read
        });
        commit('SET_LIST', data.list);
        commit('SET_TOTAL', data.total);
        commit('SET_UNREAD_COUNT', data.unread_count);
        if (params.page) commit('SET_PAGE', params.page);
        return data;
      } catch {
        commit('SET_LIST', []);
        commit('SET_TOTAL', 0);
        return { list: [], total: 0, unread_count: 0 };
      }
    },
    async fetchUnreadCount({ commit }) {
      try {
        const data = await notificationsApi.unreadCount();
        commit('SET_UNREAD_COUNT', data.unread_count);
        return data.unread_count;
      } catch {
        return 0;
      }
    },
    async markRead({ commit }, id) {
      try {
        await notificationsApi.markRead(id);
        commit('MARK_READ', id);
        return true;
      } catch {
        return false;
      }
    },
    async markAllRead({ commit }) {
      try {
        await notificationsApi.markAllRead();
        commit('MARK_ALL_READ');
        return true;
      } catch {
        return false;
      }
    }
  }
};

export function useNotificationStore() {
  const store = useStore();

  const list = computed(() => store.state.notification.list);
  const total = computed(() => store.state.notification.total);
  const unreadCount = computed(() => store.state.notification.unreadCount);
  const page = computed(() => store.state.notification.page);
  const limit = computed(() => store.state.notification.limit);
  const unreadList = computed(() => store.getters['notification/unreadList']);

  const fetchNotifications = (params) =>
    store.dispatch('notification/fetchNotifications', params);
  const fetchUnreadCount = () =>
    store.dispatch('notification/fetchUnreadCount');
  const markRead = (id) => store.dispatch('notification/markRead', id);
  const markAllRead = () => store.dispatch('notification/markAllRead');

  return {
    list,
    total,
    unreadCount,
    page,
    limit,
    unreadList,
    fetchNotifications,
    fetchUnreadCount,
    markRead,
    markAllRead
  };
}
