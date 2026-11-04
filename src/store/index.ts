import type { App } from 'vue';
import { createPinia } from 'pinia';
// pinia 持久化插件
import { createPersistedState } from 'pinia-plugin-persistedstate';

// 导入子模块
import useAppStore from './modules/app';
import useItemStore from './modules/item';
import useMedicineStore from './modules/medicine';
import useMessageStore from './modules/message';
import useSettingStore from './modules/setting';
import useUserStore from './modules/user';

// 安装pinia状态管理插件
function setupStore(app: App) {
  const store = createPinia();

  const piniaPersist = createPersistedState({
    storage: {
      getItem: uni.getStorageSync,
      setItem: uni.setStorageSync,
    },
  });
  store.use(piniaPersist);

  app.use(store);
}

// 导出模块
export {
  useAppStore,
  useItemStore,
  useMedicineStore,
  useMessageStore,
  useSettingStore,
  useUserStore,
};
export default setupStore;
