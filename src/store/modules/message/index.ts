import type { MessageGroup, MessageLevel, MessageRecord } from './types';
import type { NotificationVo } from '@/api/xiaoqi/notify';
import { defineStore } from 'pinia';
import { NotifyApi } from '@/api/xiaoqi/notify';
import { isLogin } from '@/utils/auth';
import storage from '@/utils/storage';

/** 消息列表持久化键 */
const MESSAGE_LIST_KEY = 'message_list';

/**
 * 后端字典映射（xq_notification 表注释）
 * priority：0 P0必达 / 1 P1 / 2 P2
 * notify_type：0 服药 / 1 物品摘要 / 2 系统 / 3 会员 / 4 家庭邀请 / 5 库存不足
 * related_type：0 物品 / 1 用药计划 / 2 用药记录 / 3 家庭邀请 / 4 会员订单 / 5 反馈 / 6 版本
 */
const PRIORITY_LEVEL: Record<number, MessageLevel> = { 0: 'P0', 1: 'P1', 2: 'P2' };
const NOTIFY_GROUP: Record<number, MessageGroup> = { 0: 'must', 1: 'digest', 2: 'digest', 3: 'history', 4: 'history', 5: 'digest' };
const NOTIFY_ICON: Record<number, string> = { 0: 'pill', 1: 'chart', 2: 'msg', 3: 'crown', 4: 'users', 5: 'package' };

/** 时间列转列表展示文案：今天显示 HH:mm，昨天显示「昨天」，更早显示 M/D */
function toTimeText(createTime?: string): string {
  if (!createTime) {
    return '';
  }
  const text = createTime.replace('T', ' ').slice(0, 19);
  const date = new Date(text.replace(/-/g, '/'));
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return text.slice(11, 16);
  }
  if (date.toDateString() === new Date(today.getTime() - 86400000).toDateString()) {
    return '昨天';
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/** 关联业务跳转路径（仅映射已存在的页面） */
function toPath(vo: NotificationVo): string | undefined {
  if (vo.relatedId === undefined || vo.relatedId === null) {
    return undefined;
  }
  switch (vo.relatedType) {
    case 0:
      return `/pages/item/detail/index?id=${vo.relatedId}`;
    case 1:
      return `/pages/med/plan/index?planId=${vo.relatedId}`;
    case 2:
      return `/pages/med/checkin/index?recordId=${vo.relatedId}`;
    default:
      return undefined;
  }
}

/** 后端消息 → 本地消息模型 */
function fromCloud(vo: NotificationVo): MessageRecord {
  const group = NOTIFY_GROUP[vo.notifyType ?? 2] || 'history';
  return {
    id: String(vo.id),
    level: PRIORITY_LEVEL[vo.priority ?? 2] || 'P2',
    group,
    title: vo.title,
    body: vo.content,
    sub: vo.content,
    icon: NOTIFY_ICON[vo.notifyType ?? 2] || 'bell',
    // 摘要类支持左滑删除，P0 必达不支持
    swipeable: group !== 'must',
    time: toTimeText(vo.createTime),
    read: vo.isRead === 1,
    path: toPath(vo),
  };
}

/** fetchList 进行中的请求（并发去重；超时自动作废重建，防止挂起阻塞后续刷新） */
const FETCH_LIST_TASK_TTL = 8000;
let fetchListTask: Promise<void> | null = null;
let fetchListTaskAt = 0;

const useMessageStore = defineStore('message', {
  state: () => ({
    list: (storage.get(MESSAGE_LIST_KEY) || []) as MessageRecord[],
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

    /** P0 未读（消息 tab 角标口径） */
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

    /** 是否走云端（有令牌即请求 /app/xq/notification） */
    isCloudMode(): boolean {
      return isLogin();
    },

    /**
     * 拉取云端消息列表（GET /app/xq/notification/list）
     * 云端数据覆盖本地；失败静默，保留本地缓存
     */
    fetchList(): Promise<void> {
      if (!this.isCloudMode()) {
        return Promise.resolve();
      }
      // 并发去重：进行中的 task 直接复用；超过 TTL 视为挂起，作废重建
      if (fetchListTask && Date.now() - fetchListTaskAt < FETCH_LIST_TASK_TTL) {
        return fetchListTask;
      }
      fetchListTaskAt = Date.now();
      fetchListTask = (async () => {
        try {
          const res = await NotifyApi.notification.list({ pageNum: 1, pageSize: 200 }, { custom: { toast: false } as any });
          this.list = (res.rows || []).map(fromCloud);
          this.persist();
        }
        catch (error) {
          console.warn('notification fetchList failed:', error);
        }
        finally {
          fetchListTask = null;
        }
      })();
      return fetchListTask;
    },

    /** 标为已读：本地即时生效 + 云端同步（PUT /app/xq/notification/{id}/read） */
    markRead(id: string) {
      const target = this.list.find(msg => msg.id === id);
      if (target && !target.read) {
        target.read = true;
        this.persist();
        if (this.isCloudMode() && /^\d+$/.test(id)) {
          NotifyApi.read(id).catch((error: any) => console.warn('notification markRead failed:', error));
        }
      }
    },

    /** 全部已读：本地置位 + 云端一次批量（PUT /app/xq/notification/read-all） */
    readAll() {
      const unread = this.list.filter(msg => !msg.read);
      if (!unread.length) {
        return;
      }
      unread.forEach((msg) => {
        msg.read = true;
      });
      this.persist();
      if (!this.isCloudMode()) {
        return;
      }
      NotifyApi.readAll().catch((error: any) => console.warn('notification readAll failed:', error));
    },

    /** 删除单条：本地移除 + 云端删除（DELETE /app/xq/notification/{ids}） */
    remove(id: string) {
      this.list = this.list.filter(msg => msg.id !== id);
      this.persist();
      if (this.isCloudMode() && /^\d+$/.test(id)) {
        NotifyApi.notification.remove([id]).catch((error: any) => console.warn('notification remove failed:', error));
      }
    },

    /** 清空本地消息（「删除全部数据」后调用；再次进入消息页会重新拉取云端） */
    reset() {
      this.list = [];
      this.persist();
    },
  },
  persist: true,
});

export default useMessageStore;
