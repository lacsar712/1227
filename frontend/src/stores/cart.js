import { computed } from 'vue';
import { useStore } from 'vuex';
import { cartApi } from '@/api';

export const cartModule = {
  namespaced: true,
  state: () => ({
    items: []
  }),
  getters: {
    count(state) {
      return state.items.reduce((s, i) => s + i.quantity, 0);
    },
    total(state) {
      return state.items.reduce(
        (s, i) => s + (i.product?.price || 0) * i.quantity,
        0
      );
    }
  },
  mutations: {
    SET_ITEMS(state, items) {
      state.items = items;
    },
    CLEAR_ITEMS(state) {
      state.items = [];
    }
  },
  actions: {
    async fetchCart({ commit }) {
      try {
        const items = await cartApi.list();
        commit('SET_ITEMS', items);
        return items;
      } catch {
        commit('SET_ITEMS', []);
        return [];
      }
    },
    async add({ dispatch }, { productId, quantity = 1 }) {
      await cartApi.add({ product_id: productId, quantity });
      await dispatch('fetchCart');
    },
    async updateQuantity({ dispatch }, { itemId, quantity }) {
      await cartApi.updateQuantity(itemId, quantity);
      await dispatch('fetchCart');
    },
    async remove({ dispatch }, { itemId }) {
      await cartApi.remove(itemId);
      await dispatch('fetchCart');
    },
    async clear({ commit }) {
      await cartApi.clear();
      commit('CLEAR_ITEMS');
    }
  }
};

export function useCartStore() {
  const store = useStore();

  const items = computed(() => store.state.cart.items);
  const count = computed(() => store.getters['cart/count']);
  const total = computed(() => store.getters['cart/total']);

  const fetchCart = () => store.dispatch('cart/fetchCart');
  const add = (productId, quantity = 1) =>
    store.dispatch('cart/add', { productId, quantity });
  const updateQuantity = (itemId, quantity) =>
    store.dispatch('cart/updateQuantity', { itemId, quantity });
  const remove = (itemId) => store.dispatch('cart/remove', { itemId });
  const clear = () => store.dispatch('cart/clear');

  return { items, count, total, fetchCart, add, updateQuantity, remove, clear };
}

