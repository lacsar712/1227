import { createStore } from 'vuex';
import { userModule } from '@/stores/user';
import { cartModule } from '@/stores/cart';
import { confirmModule } from '@/stores/confirm';
import { notificationModule } from '@/stores/notification';

const store = createStore({
  modules: {
    user: userModule,
    cart: cartModule,
    confirm: confirmModule,
    notification: notificationModule
  },
  plugins: [
    (store) => {
      // 应用初始化时确保确认框不显示，避免访问首页等场景误弹出
      store.commit('confirm/SET_VISIBLE', false);
    }
  ]
});

export default store;

