import { computed } from 'vue';
import { useStore } from 'vuex';

export const confirmModule = {
  namespaced: true,
  state: () => ({
    visible: false,
    config: {
      title: '确认操作',
      message: '确定要执行此操作吗？',
      confirmText: '确定',
      cancelText: '取消',
      type: 'warning' // warning | danger | info
    },
    // 不放在 state 里，避免序列化
    _resolveFn: null
  }),
  mutations: {
    SET_VISIBLE(state, visible) {
      state.visible = visible;
    },
    SET_CONFIG(state, config) {
      state.config = { ...state.config, ...config };
    },
    SET_RESOLVE(state, fn) {
      state._resolveFn = fn;
    }
  },
  actions: {
    show({ commit, state }, options = {}) {
      const type = ['warning', 'danger', 'info'].includes(options.type) ? options.type : 'warning';
      commit('SET_CONFIG', {
        title: options.title ?? '确认操作',
        message: options.message ?? '确定要执行此操作吗？',
        confirmText: options.confirmText ?? '确定',
        cancelText: options.cancelText ?? '取消',
        type
      });
      commit('SET_VISIBLE', true);
      return new Promise((resolve) => {
        commit('SET_RESOLVE', resolve);
      });
    },
    confirm({ commit, state }) {
      if (state._resolveFn) state._resolveFn(true);
      commit('SET_VISIBLE', false);
      commit('SET_RESOLVE', null);
    },
    cancel({ commit, state }) {
      if (state._resolveFn) state._resolveFn(false);
      commit('SET_VISIBLE', false);
      commit('SET_RESOLVE', null);
    }
  }
};

export function useConfirmStore() {
  const store = useStore();

  const visible = computed(() => store.state.confirm.visible);
  const config = computed(() => store.state.confirm.config);

  const show = (options) => store.dispatch('confirm/show', options);
  const confirm = () => store.dispatch('confirm/confirm');
  const cancel = () => store.dispatch('confirm/cancel');

  return { visible, config, show, confirm, cancel };
}

