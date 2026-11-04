import type {
  ArchiveMode,
  ItemCategory,
  ItemDraft,
  ItemRecord,
  ItemStats,
  ItemView,
  MergeResult,
  MergeStrategy,
} from './types';
import { defineStore } from 'pinia';
import { diffDays, today } from '@/utils/date';
import storage from '@/utils/storage';

/** 物品列表持久化键 */
const ITEM_LIST_KEY = 'item_list';

/** 分类清单（确认页 chips / 图标映射共用） */
export const CATEGORIES: { key: ItemCategory; label: string; icon: string }[] = [
  { key: 'drug', label: '药品', icon: 'pill' },
  { key: 'skin', label: '护肤', icon: 'droplet' },
  { key: 'food', label: '食品', icon: 'cookie' },
  { key: 'other', label: '其他', icon: 'package' },
];

/** 临期窗口（天）：0~30 天视为临期 */
const EXPIRING_WINDOW = 30;

/** 游客模式标记键（登录页「先逛逛」写入） */
const GUEST_KEY = 'guest_mode';

function nowId(): string {
  return `i${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

const useItemStore = defineStore('item', {
  state: () => ({
    list: (storage.getJSON(ITEM_LIST_KEY) || []) as ItemRecord[],
    keyword: '',
    selectedIds: [] as string[],
  }),
  getters: {
    /** 在用物品（含无到期日），按到期日升序；关键字过滤 */
    filtered(state): ItemView[] {
      const kw = state.keyword.trim().toLowerCase();
      return state.list
        .filter(it => it.status === 'active')
        .filter(it => (kw ? `${it.name}${it.location || ''}`.toLowerCase().includes(kw) : true))
        .map(it => ({ ...it, dueDays: it.dueDate ? diffDays(it.dueDate) : Number.POSITIVE_INFINITY }))
        .sort((a, b) => a.dueDays - b.dueDays);
    },

    /** 已过期（dueDays < 0） */
    expiredList(): ItemView[] {
      return this.filtered.filter(it => it.dueDays < 0);
    },

    /** 临期中（0 ~ 30 天） */
    expiringList(): ItemView[] {
      return this.filtered.filter(it => it.dueDays >= 0 && it.dueDays <= EXPIRING_WINDOW);
    },

    /** 安全（> 30 天） */
    safeList(): ItemView[] {
      return this.filtered.filter(it => it.dueDays > EXPIRING_WINDOW);
    },

    /** 首页 / 我的页统计 */
    stats(state): ItemStats {
      const count = (status: ItemRecord['status']) =>
        state.list.filter(it => it.status === status).length;
      return {
        active: count('active'),
        expiring: this.expiringList.length,
        expired: this.expiredList.length,
        used: count('used'),
        thrown: count('thrown'),
        trashed: count('trashed'),
      };
    },

    /** 游客物品数（合并页「本机 N 件」） */
    guestCount(state): number {
      return state.list.filter(it => it.guest === true).length;
    },

    selectedCount(state): number {
      return state.selectedIds.length;
    },
  },
  actions: {
    persist() {
      storage.setJSON(ITEM_LIST_KEY, this.list);
    },

    findItem(id: string): ItemRecord | null {
      return this.list.find(it => it.id === id) || null;
    },

    /**
     * 新增物品：未登录 / 游客模式下打 guest 标记，登录后参与合并
     */
    addItem(draft: ItemDraft): ItemRecord {
      const record: ItemRecord = {
        ...draft,
        id: nowId(),
        status: 'active',
        guest: storage.get(GUEST_KEY) === true,
        createdAt: today(),
        updatedAt: today(),
      };
      this.list.unshift(record);
      this.persist();
      return record;
    },

    /**
     * 更新物品（部分字段）；字段变更刷新 updatedAt
     */
    updateItem(id: string, patch: Partial<ItemDraft> & Partial<ItemRecord>) {
      const target = this.list.find(it => it.id === id);
      if (!target) {
        return;
      }
      Object.assign(target, patch, { updatedAt: today() });
      this.persist();
    },

    /**
     * 批量归档：标记已用完（记录使用天数）或移到已扔
     */
    archive(ids: string[], mode: ArchiveMode) {
      const idSet = new Set(ids);
      this.list.forEach((it) => {
        if (!idSet.has(it.id) || it.status !== 'active') {
          return;
        }
        it.status = mode;
        it.archivedAt = today();
        it.updatedAt = today();
        if (mode === 'used') {
          const base = it.createdAt || today();
          it.usedDays = Math.max(0, -diffDays(base));
        }
      });
      this.persist();
    },

    /** 恢复到在用（归档 / 回收站均可恢复） */
    restore(ids: string[]) {
      const idSet = new Set(ids);
      this.list.forEach((it) => {
        if (idSet.has(it.id)) {
          it.status = 'active';
          it.archivedAt = undefined;
          it.usedDays = undefined;
          it.trashedAt = undefined;
          it.updatedAt = today();
        }
      });
      this.persist();
    },

    /** 移入回收站（30 天保留期，到期彻底删除） */
    moveToTrash(ids: string[]) {
      const idSet = new Set(ids);
      this.list.forEach((it) => {
        if (idSet.has(it.id)) {
          it.status = 'trashed';
          it.trashedAt = today();
          it.updatedAt = today();
        }
      });
      this.persist();
    },

    /** 彻底删除（仅在回收站内提供，需二次确认） */
    deleteForever(ids: string[]) {
      const idSet = new Set(ids);
      this.list = this.list.filter(it => !idSet.has(it.id));
      this.selectedIds = this.selectedIds.filter(id => !idSet.has(id));
      this.persist();
    },

    /** 延期 N 天 */
    postpone(id: string, days: number) {
      const target = this.findItem(id);
      if (!target || !target.dueDate) {
        return;
      }
      const base = new Date(`${target.dueDate.replace(/-/g, '/')} 00:00:00`).getTime();
      const next = new Date(base + days * 86400000);
      target.dueDate = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
      target.updatedAt = today();
      this.persist();
    },

    /** 批量管理：单选 / 取消 */
    toggleSelect(id: string) {
      const index = this.selectedIds.indexOf(id);
      if (index > -1) {
        this.selectedIds.splice(index, 1);
      }
      else {
        this.selectedIds.push(id);
      }
    },

    clearSelection() {
      this.selectedIds = [];
    },

    /**
     * 游客数据合并（原型 26 / 备份恢复共用）
     * - merge：按名称判重，命中合并（数量取 max、可见范围取更严格方），缺到期日计待确认
     * - cloud / local：全部按来源写入，本机新增项保留
     */
    mergeGuest(items: Partial<ItemRecord>[], strategy: MergeStrategy): MergeResult {
      let mergedCount = 0;
      let conflictCount = 0;
      let pendingCount = 0;

      items.forEach((raw) => {
        const name = String(raw.name || '').trim();
        if (!name) {
          conflictCount += 1;
          return;
        }
        const matched = this.list.find(it => it.name === name && it.status === 'active');
        const incoming: ItemRecord = {
          id: nowId(),
          name,
          category: raw.category || 'other',
          qty: Number(raw.qty) || 1,
          location: raw.location,
          produceDate: raw.produceDate,
          dueDate: raw.dueDate,
          remindDays: raw.remindDays,
          visibility: raw.visibility || 'self',
          isDrug: raw.isDrug,
          status: 'active',
          guest: false,
          createdAt: today(),
          updatedAt: today(),
        };

        if (strategy === 'merge' && matched) {
          mergedCount += 1;
          matched.qty = Math.max(matched.qty, incoming.qty);
          matched.updatedAt = today();
          // 可见范围取更严格方（仅自己 > 家人）
          if (matched.visibility === 'family' && incoming.visibility === 'self') {
            matched.visibility = 'self';
          }
        }
        else {
          this.list.unshift(incoming);
        }
        if (!incoming.dueDate) {
          pendingCount += 1;
        }
      });

      this.persist();
      return { mergedCount, conflictCount, pendingCount, total: items.length };
    },
  },
  persist: true,
});

export default useItemStore;
