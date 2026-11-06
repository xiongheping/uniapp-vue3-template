import type { MessageRecord } from './types';
import { defineStore } from 'pinia';
import storage from '@/utils/storage';

/** 消息列表持久化键 */
const MESSAGE_LIST_KEY = 'message_list';

/** 内置演示消息（与用药计划 mock 数据对齐；真实项目由提醒服务推送生成） */
function seedMessages(): MessageRecord[] {
  return [
    {
      id: 'm1',
      level: 'P0',
      group: 'must',
      title: '该吃药了：布洛芬 1 粒',
      body: '20:00 · P0 必达 · 点击进入打卡页',
      sub: '早间 08:00 · 早餐后 · 剩余库存 18 粒',
      icon: 'pill',
      time: '08:00',
      read: false,
      path: '/pages/med/checkin/index?planId=p1&doseId=d1',
    },
    {
      id: 'm2',
      level: 'P1',
      group: 'digest',
      title: '今日摘要：2 件物品需要留意',
      body: '感冒灵颗粒已过期 · 面膜 3 天后到期',
      sub: '感冒灵颗粒已过期 · 面膜 3 天后到期',
      icon: 'chart',
      swipeable: true,
      time: '09:00',
      read: false,
      path: '/pages/tab/home/index',
    },
    {
      id: 'm3',
      level: 'P2',
      group: 'digest',
      title: '每周报告：按时服药 6/7 天',
      body: '连续打卡 6 天，比上周多 2 天',
      sub: '连续打卡 6 天，比上周多 2 天',
      icon: 'check',
      swipeable: true,
      time: '昨天',
      read: true,
    },
    {
      id: 'm4',
      level: 'P2',
      group: 'history',
      title: '昨日漏服提醒：维生素 C',
      body: '昨晚 21:00 未打卡，可补登或标记跳过',
      sub: '昨晚 21:00 未打卡，可补登或标记跳过',
      icon: 'clock',
      time: '昨天',
      read: false,
      path: '/pages/med/plan/index?planId=p1',
    },
  ];
}

const useMessageStore = defineStore('message', {
  state: () => ({
    list: (storage.get(MESSAGE_LIST_KEY) || seedMessages()) as MessageRecord[],
  }),
  getters: {
    /** P0 必达列表（服药提醒，不受频控与免打扰合并） */
    mustList(state): MessageRecord[] {
      return state.list.filter(msg => msg.level === 'P0');
    },

    /** P1 / P2 列表（摘要、报告、兜底） */
    digestList(state): MessageRecord[] {
      return state.list.filter(msg => msg.level !== 'P0');
    },

    /** P0 未读（消息页主卡 badge；首页 Tab 显示总未读） */
    unreadP0(state): number {
      return state.list.filter(msg => msg.level === 'P0' && !msg.read).length;
    },

    /** 总未读 */
    unreadTotal(state): number {
      return state.list.filter(msg => !msg.read).length;
    },
  },
  actions: {
    persist() {
      storage.setJSON(MESSAGE_LIST_KEY, this.list);
    },

    /** 标为已读 */
    markRead(id: string) {
      const target = this.list.find(msg => msg.id === id);
      if (target && !target.read) {
        target.read = true;
        this.persist();
      }
    },

    /** 全部已读 */
    readAll() {
      this.list.forEach((msg) => {
        msg.read = true;
      });
      this.persist();
    },

    /** 删除单条 */
    remove(id: string) {
      this.list = this.list.filter(msg => msg.id !== id);
      this.persist();
    },

    /** 清空并恢复初始消息（强确认删除数据后调用） */
    reset() {
      this.list = seedMessages();
      this.persist();
    },
  },
  persist: true,
});

export default useMessageStore;
