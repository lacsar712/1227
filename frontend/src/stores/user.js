import { computed } from 'vue';
import { useStore } from 'vuex';
import { authApi } from '@/api';

export const userModule = {
  namespaced: true,
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: null,
    points: null
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
    },
    SET_POINTS(state, points) {
      state.points = points;
    },
    UPDATE_POINTS_BALANCE(state, balance) {
      if (state.points) {
        state.points.balance = balance;
      }
    }
  },
  actions: {
    async fetchUser({ state, commit }) {
      if (!state.token) return null;
      try {
        const data = await authApi.getMe();
        const user = {
          id: data.id,
          username: data.username,
          email: data.email,
          nickname: data.nickname,
          phone: data.phone
        };
        commit('SET_USER', user);
        if (data.points) {
          commit('SET_POINTS', data.points);
        }
        return data;
      } catch {
        commit('SET_TOKEN', '');
        commit('SET_USER', null);
        commit('SET_POINTS', null);
        localStorage.removeItem('token');
        return null;
      }
    },
    setAuth({ commit }, { token, user, points }) {
      commit('SET_TOKEN', token);
      commit('SET_USER', user);
      if (points) {
        commit('SET_POINTS', points);
      }
      if (token) localStorage.setItem('token', token);
      else localStorage.removeItem('token');
    },
    logout({ commit }) {
      commit('SET_TOKEN', '');
      commit('SET_USER', null);
      commit('SET_POINTS', null);
      localStorage.removeItem('token');
    }
  }
};

export function useUserStore() {
  const store = useStore();

  const token = computed(() => store.state.user.token);
  const user = computed(() => store.state.user.user);
  const isLoggedIn = computed(() => store.getters['user/isLoggedIn']);
  const points = computed(() => store.state.user.points);
  const pointsBalance = computed(() => store.state.user.points?.balance || 0);

  const fetchUser = () => store.dispatch('user/fetchUser');
  const setAuth = (tok, u, pts) => store.dispatch('user/setAuth', { token: tok, user: u, points: pts });
  const logout = () => store.dispatch('user/logout');

  return { token, user, isLoggedIn, points, pointsBalance, fetchUser, setAuth, logout };
}

