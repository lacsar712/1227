import { computed } from 'vue';
import { useStore } from 'vuex';
import { pointsApi } from '@/api';

export const pointsModule = {
  namespaced: true,
  state: () => ({
    account: null,
    transactions: [],
    products: [],
    records: [],
    loading: false
  }),
  getters: {
    balance: (state) => state.account?.balance || 0,
    totalEarned: (state) => state.account?.total_earned || 0,
    totalSpent: (state) => state.account?.total_spent || 0
  },
  mutations: {
    SET_ACCOUNT(state, account) {
      state.account = account;
    },
    SET_TRANSACTIONS(state, transactions) {
      state.transactions = transactions;
    },
    SET_PRODUCTS(state, products) {
      state.products = products;
    },
    SET_RECORDS(state, records) {
      state.records = records;
    },
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
    UPDATE_BALANCE(state, balance) {
      if (state.account) {
        state.account.balance = balance;
      }
    }
  },
  actions: {
    async fetchAccount({ commit }) {
      try {
        const data = await pointsApi.getAccount();
        commit('SET_ACCOUNT', data);
        return data;
      } catch (err) {
        console.error('Fetch points account error:', err);
        return null;
      }
    },
    async fetchTransactions({ commit }, params = {}) {
      commit('SET_LOADING', true);
      try {
        const data = await pointsApi.getTransactions(params);
        commit('SET_TRANSACTIONS', data.list || []);
        return data;
      } catch (err) {
        console.error('Fetch points transactions error:', err);
        return null;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async fetchProducts({ commit }, params = {}) {
      commit('SET_LOADING', true);
      try {
        const data = await pointsApi.getProducts(params);
        commit('SET_PRODUCTS', data || []);
        return data;
      } catch (err) {
        console.error('Fetch points products error:', err);
        return null;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async redeemProduct({ commit, dispatch }, productId) {
      try {
        const result = await pointsApi.redeem(productId);
        if (result.balance !== undefined) {
          commit('UPDATE_BALANCE', result.balance);
        }
        dispatch('fetchAccount');
        return result;
      } catch (err) {
        console.error('Redeem product error:', err);
        throw err;
      }
    },
    async fetchRecords({ commit }, params = {}) {
      commit('SET_LOADING', true);
      try {
        const data = await pointsApi.getRecords(params);
        commit('SET_RECORDS', data.list || []);
        return data;
      } catch (err) {
        console.error('Fetch redeem records error:', err);
        return null;
      } finally {
        commit('SET_LOADING', false);
      }
    }
  }
};

export function usePointsStore() {
  const store = useStore();

  const account = computed(() => store.state.points.account);
  const balance = computed(() => store.getters['points/balance']);
  const totalEarned = computed(() => store.getters['points/totalEarned']);
  const totalSpent = computed(() => store.getters['points/totalSpent']);
  const transactions = computed(() => store.state.points.transactions);
  const products = computed(() => store.state.points.products);
  const records = computed(() => store.state.points.records);
  const loading = computed(() => store.state.points.loading);

  const fetchAccount = () => store.dispatch('points/fetchAccount');
  const fetchTransactions = (params) => store.dispatch('points/fetchTransactions', params);
  const fetchProducts = (params) => store.dispatch('points/fetchProducts', params);
  const redeemProduct = (productId) => store.dispatch('points/redeemProduct', productId);
  const fetchRecords = (params) => store.dispatch('points/fetchRecords', params);

  return {
    account,
    balance,
    totalEarned,
    totalSpent,
    transactions,
    products,
    records,
    loading,
    fetchAccount,
    fetchTransactions,
    fetchProducts,
    redeemProduct,
    fetchRecords
  };
}
