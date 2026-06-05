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
      return state.items.reduce((s, i) => {
        const price = i.effective_price !== undefined ? i.effective_price : (i.product?.price || 0);
        return s + price * i.quantity;
      }, 0);
    },
    validItems(state) {
      return state.items.filter(i => !i.is_flash_sale_expired);
    },
    expiredItems(state) {
      return state.items.filter(i => i.is_flash_sale_expired);
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
    async add({ dispatch }, { productId, quantity = 1, flashSaleId = null }) {
      const data = { product_id: productId, quantity };
      if (flashSaleId) {
        data.flash_sale_id = flashSaleId;
      }
      await cartApi.add(data);
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
  const validItems = computed(() => store.getters['cart/validItems']);
  const expiredItems = computed(() => store.getters['cart/expiredItems']);

  const fetchCart = () => store.dispatch('cart/fetchCart');
  const add = (productId, quantity = 1, flashSaleId = null) =>
    store.dispatch('cart/add', { productId, quantity, flashSaleId });
  const updateQuantity = (itemId, quantity) =>
    store.dispatch('cart/updateQuantity', { itemId, quantity });
  const remove = (itemId) => store.dispatch('cart/remove', { itemId });
  const clear = () => store.dispatch('cart/clear');

  return { items, count, total, validItems, expiredItems, fetchCart, add, updateQuantity, remove, clear };
}

