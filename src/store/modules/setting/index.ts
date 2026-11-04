import type { AddMethod, SettingState } from './types';
import { defineStore } from 'pinia';
import storage from '@/utils/storage';

/** 设置持久化键 */
const SETTING_KEY = 'app_setting';

const DEFAULT_STATE: SettingState = {
  nickname: '小七',
  isElder: false,
  freqMode: 'standard',
  silentUntil: '23:00-07:00',
  quotaTotal: 10,
  quotaUsed: 0,
  quotaPreOccupied: 0,
  lastAddMethod: 'camera',
  plan: 'free',
  planExpireAt: '',
  autoRenew: false,
};

const useSettingStore = defineStore('setting', {
  state: (): SettingState => ({
    ...DEFAULT_STATE,
    ...(storage.getJSON(SETTING_KEY) || {}),
  }),
  getters: {
    /** 会员是否生效（会员 / 家庭组） */
    isMember(state): boolean {
      return state.plan !== 'free';
    },

    /** 剩余 AI 识别次数 */
    quotaLeft(state): number {
      return Math.max(0, state.quotaTotal - state.quotaUsed);
    },

    /** 额度文案：会员无限次，否则「剩余 N/M 次」（预占不计入展示） */
    quotaLeftText(state): string {
      if (this.isMember) {
        return 'AI 识别 · 会员无限次';
      }
      const left = Math.max(0, this.quotaLeft - state.quotaPreOccupied);
      return `本月剩余 ${left}/${state.quotaTotal} 次`;
    },
  },
  actions: {
    /** 部分字段更新（频控 / 会员 / 续费等） */
    patch(partial: Partial<SettingState>) {
      Object.assign(this, partial);
      storage.setJSON(SETTING_KEY, { ...this.$state });
    },

    /** 长辈模式开关 */
    setElder(value: boolean) {
      this.patch({ isElder: value });
    },

    /** 记录上次添加方式（用于降级与默认入口） */
    setLastAddMethod(method: AddMethod) {
      this.patch({ lastAddMethod: method });
    },

    /** 开始识别：预占 1 次（含预占口径，取消则释放） */
    preOccupyQuota() {
      this.patch({ quotaPreOccupied: this.quotaPreOccupied + 1 });
    },

    /** 确认保存：消耗预占的次数 */
    consumeQuota() {
      if (this.quotaPreOccupied <= 0) {
        return;
      }
      this.patch({
        quotaUsed: this.quotaUsed + 1,
        quotaPreOccupied: this.quotaPreOccupied - 1,
      });
    },

    /** 取消识别 / 失败：释放预占次数 */
    releaseQuota() {
      if (this.quotaPreOccupied <= 0) {
        return;
      }
      this.patch({ quotaPreOccupied: this.quotaPreOccupied - 1 });
    },

    /** 清空个人设置（强确认删除后调用） */
    reset() {
      this.$state = { ...DEFAULT_STATE };
      storage.setJSON(SETTING_KEY, { ...DEFAULT_STATE });
    },
  },
  persist: true,
});

export default useSettingStore;
