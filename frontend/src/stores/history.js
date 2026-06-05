import { computed } from 'vue';
import { useStore } from 'vuex';
import { browseHistoryApi } from '@/api';

const MAX_HISTORY = 50;
const STORAGE_KEY = 'browse_history';

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveLocal(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-MAX_HISTORY)));
  } catch {
    // ignore
  }
}

function deduplicate(items) {
  const seen = new Map();
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    const key = item.product_id || item.id;
    if (!seen.has(key)) {
      seen.set(key, item);
    } else {
      const existing = seen.get(key);
      const itemTime = new Date(item.viewed_at || item.viewedAt);
      const existingTime = new Date(existing.viewed_at || existing.viewedAt);
      if (itemTime > existingTime) {
        seen.set(key, item);
      }
    }
  }
  return Array.from(seen.values()).sort(
    (a, b) =>
      new Date(b.viewed_at || b.viewedAt) - new Date(a.viewed_at || a.viewedAt)
  );
}

export const historyModule = {
  namespaced: true,
  state: () => ({
    items: []
  }),
  getters: {
    groupedItems(state) {
      const groups = { today: [], yesterday: [], earlier: [] };
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 86400000);

      for (const item of state.items) {
        const viewDate = new Date(item.viewed_at || item.viewedAt);
        const dayStart = new Date(
          viewDate.getFullYear(),
          viewDate.getMonth(),
          viewDate.getDate()
        );

        if (dayStart.getTime() === today.getTime()) {
          groups.today.push(item);
        } else if (dayStart.getTime() === yesterday.getTime()) {
          groups.yesterday.push(item);
        } else {
          groups.earlier.push(item);
        }
      }
      return groups;
    },
    count(state) {
      return state.items.length;
    }
  },
  mutations: {
    SET_ITEMS(state, items) {
      state.items = items;
    },
    ADD_ITEM(state, item) {
      const existingIndex = state.items.findIndex(
        (i) => (i.product_id || i.product?.id || i.id) === (item.product_id || item.id)
      );

      if (existingIndex !== -1) {
        state.items.splice(existingIndex, 1);
      }

      state.items.unshift(item);

      if (state.items.length > MAX_HISTORY) {
        state.items = state.items.slice(0, MAX_HISTORY);
      }
    },
    REMOVE_ITEM(state, productId) {
      state.items = state.items.filter(
        (i) => (i.product_id || i.product?.id || i.id) !== productId
      );
    },
    CLEAR_ITEMS(state) {
      state.items = [];
    }
  },
  actions: {
    async load({ commit, rootGetters }) {
      const isLoggedIn = rootGetters['user/isLoggedIn'];

      if (isLoggedIn) {
        try {
          const localItems = loadLocal();
          if (localItems.length > 0) {
            await browseHistoryApi.sync(localItems);
            localStorage.removeItem(STORAGE_KEY);
          }
          const serverItems = await browseHistoryApi.list();
          const items = deduplicate(serverItems || []);
          commit('SET_ITEMS', items);
        } catch {
          const items = deduplicate(loadLocal());
          commit('SET_ITEMS', items);
        }
      } else {
        const items = deduplicate(loadLocal());
        commit('SET_ITEMS', items);
      }
    },

    async add({ commit, rootGetters, state }, product) {
      if (!product) return;

      const productId = product.id;
      const isLoggedIn = rootGetters['user/isLoggedIn'];

      const item = {
        product_id: productId,
        product: product,
        viewed_at: new Date().toISOString()
      };

      commit('ADD_ITEM', item);

      const localItems = deduplicate(
        state.items.map((i) => ({
          product_id: i.product_id || i.product?.id,
          viewed_at: i.viewed_at || i.viewedAt
        }))
      );
      saveLocal(localItems);

      if (isLoggedIn) {
        try {
          await browseHistoryApi.add(productId);
        } catch {
          // ignore, will sync on next load
        }
      }
    },

    async remove({ commit, rootGetters, state }, productId) {
      commit('REMOVE_ITEM', productId);

      const localItems = deduplicate(
        state.items.map((i) => ({
          product_id: i.product_id || i.product?.id,
          viewed_at: i.viewed_at || i.viewedAt
        }))
      );
      saveLocal(localItems);

      if (rootGetters['user/isLoggedIn']) {
        try {
          await browseHistoryApi.remove(productId);
        } catch {
          // ignore
        }
      }
    },

    async clear({ commit, rootGetters }) {
      commit('CLEAR_ITEMS');
      localStorage.removeItem(STORAGE_KEY);

      if (rootGetters['user/isLoggedIn']) {
        try {
          await browseHistoryApi.clear();
        } catch {
          // ignore
        }
      }
    },

    async syncIfNeeded({ rootGetters }) {
      if (!rootGetters['user/isLoggedIn']) return;

      const localItems = loadLocal();
      if (localItems.length === 0) return;

      try {
        await browseHistoryApi.sync(localItems);
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }
};

export function useHistoryStore() {
  const store = useStore();

  const items = computed(() => store.state.history.items);
  const groupedItems = computed(() => store.getters['history/groupedItems']);
  const count = computed(() => store.getters['history/count']);

  const load = () => store.dispatch('history/load');
  const add = (product) => store.dispatch('history/add', product);
  const remove = (productId) => store.dispatch('history/remove', productId);
  const clear = () => store.dispatch('history/clear');
  const syncIfNeeded = () => store.dispatch('history/syncIfNeeded');

  return { items, groupedItems, count, load, add, remove, clear, syncIfNeeded };
}
