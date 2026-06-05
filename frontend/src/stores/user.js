import { computed } from 'vue';
import { useStore } from 'vuex';
import { authApi } from '@/api';

export const userModule = {
  namespaced: true,
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: null
  }),
  getters: {
    isLoggedIn(state) {
      return !!state.token;
    }
  },
  mutations: {
    SET_TOKEN(state, token) {
      state.token = token;
    },
    SET_USER(state, user) {
      state.user = user;
    }
  },
  actions: {
    async fetchUser({ state, commit }) {
      if (!state.token) return null;
      try {
        const user = await authApi.getMe();
        commit('SET_USER', user);
        return user;
      } catch {
        commit('SET_TOKEN', '');
        commit('SET_USER', null);
        localStorage.removeItem('token');
        return null;
      }
    },
    setAuth({ commit }, { token, user }) {
      commit('SET_TOKEN', token);
      commit('SET_USER', user);
      if (token) localStorage.setItem('token', token);
      else localStorage.removeItem('token');
    },
    logout({ commit }) {
      commit('SET_TOKEN', '');
      commit('SET_USER', null);
      localStorage.removeItem('token');
    }
  }
};

export function useUserStore() {
  const store = useStore();

  const token = computed(() => store.state.user.token);
  const user = computed(() => store.state.user.user);
  const isLoggedIn = computed(() => store.getters['user/isLoggedIn']);

  const fetchUser = () => store.dispatch('user/fetchUser');
  const setAuth = (tok, u) => store.dispatch('user/setAuth', { token: tok, user: u });
  const logout = () => store.dispatch('user/logout');

  return { token, user, isLoggedIn, fetchUser, setAuth, logout };
}

