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
import type { ItemCategoryVo, ItemVo } from '@/api/xiaoqi/item';
import { defineStore } from 'pinia';
import { ItemApi } from '@/api';
import { isLogin } from '@/utils/auth';
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

/* ==================== 云端映射（XqItemController /app/xq/item） ==================== */

/** 云端状态：0在用 1已用完 2已扔 3回收站 */
const CLOUD_VISIBLE: Record<ItemRecord['visibility'], number> = { self: 0, family: 1 };
const STATUS_TO_CLOUD: Record<ItemRecord['status'], number> = { active: 0, used: 1, thrown: 2, trashed: 3 };
const STATUS_FROM_CLOUD: Record<number, ItemRecord['status']> = { 0: 'active', 1: 'used', 2: 'thrown', 3: 'trashed' };

/** 云端分类缓存：categoryId ↔ 本地分类 key 的桥接依赖 categoryName 与本地 CATEGORIES label 一致（系统内置分类） */
const categoryCache: { list: ItemCategoryVo[]; loading: Promise<void> | null } = { list: [], loading: null };

/** 拉取分类表（并发去重；失败静默，映射回退 other / 本地兜底） */
function loadCategoryCache(): Promise<void> {
  if (!categoryCache.loading) {
    categoryCache.loading = ItemApi.category.list(undefined, { custom: { toast: false } as any })
      .then((res) => {
        categoryCache.list = res.rows || [];
      })
      .catch((error) => {
        console.warn('item category cache failed:', error);
      })
      .finally(() => {
        categoryCache.loading = null;
      });
  }
  return categoryCache.loading;
}

function categoryKeyById(categoryId?: number | string): ItemCategory {
  if (categoryId === undefined || categoryId === null) {
    return 'other';
  }
  const vo = categoryCache.list.find(c => String(c.id) === String(categoryId));
  return vo ? (CATEGORIES.find(local => local.label === vo.categoryName)?.key || 'other') : 'other';
}

function categoryIdByKey(key: ItemCategory): number | string | undefined {
  const label = CATEGORIES.find(c => c.key === key)?.label;
  if (!label) {
    return undefined;
  }
  return categoryCache.list.find(c => c.categoryName === label)?.id;
}

/** XqItemVo → 本地 ItemRecord */
function fromCloud(vo: ItemVo): ItemRecord {
  const created = vo.createTime?.slice(0, 10) || today();
  const archived = vo.archiveTime?.slice(0, 10);
  return {
    id: String(vo.id),
    name: vo.itemName,
    category: categoryKeyById(vo.categoryId),
    cloudCategoryId: vo.categoryId,
    qty: Number(vo.quantity) || 0,
    location: vo.location || undefined,
    produceDate: vo.productionDate || undefined,
    dueDate: vo.dueDate || undefined,
    // 后端为单档提前提醒天数，本地多档 UI 取首档存取
    remindDays: vo.expiryReminderDays != null ? [vo.expiryReminderDays] : [],
    visibility: vo.visibleScope === 0 ? 'self' : 'family',
    isDrug: vo.isMedication === 1,
    status: STATUS_FROM_CLOUD[vo.status ?? 0] || 'active',
    guest: false,
    createdAt: created,
    updatedAt: vo.updateTime?.slice(0, 10) || created,
    archivedAt: archived,
    trashedAt: vo.recycleTime?.slice(0, 10),
    usedDays: archived && created ? Math.max(0, diffDays(archived) - diffDays(created)) : undefined,
  };
}

/** 本地记录/草稿 → XqItemBo（后端 edit 校验 categoryId/itemName 必填，须传全量） */
function toCloudBo(it: Partial<ItemRecord> & Partial<ItemDraft>): Partial<ItemVo> {
  return {
    // 显式选择的云端分类 id 优先（自定义分类名无法桥接本地 label）
    categoryId: it.cloudCategoryId ?? (it.category ? categoryIdByKey(it.category) : undefined),
    itemName: it.name,
    // 判重用归一化名称；后端 insertBy 当前未自动生成（NOT NULL），前端兜底传入
    normalizedName: it.name ? it.name.trim().toLowerCase() : undefined,
    productionDate: it.produceDate,
    dueDate: it.dueDate,
    quantity: it.qty,
    location: it.location,
    visibleScope: it.visibility ? CLOUD_VISIBLE[it.visibility] : undefined,
    isMedication: it.isDrug === undefined ? undefined : (it.isDrug ? 1 : 0),
    // 后端为单档提前提醒天数，多档 UI 取首档
    expiryReminderDays: Array.isArray(it.remindDays) ? it.remindDays[0] : undefined,
    status: it.status ? STATUS_TO_CLOUD[it.status] : undefined,
  };
}

/** fetchList 进行中的请求（并发去重；超时自动作废重建，防止挂起阻塞后续刷新） */
let fetchListTask: Promise<void> | null = null;
let fetchListTaskAt = 0;
const FETCH_LIST_TASK_TTL = 15000;

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
    /** 云端模式：有令牌即走 /app/xq/item（游客账号同样云端保存）；无令牌降级本地模式 */
    isCloudMode(): boolean {
      return isLogin();
    },

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
    /**
     * 拉取云端物品列表（XqItemController GET /app/xq/item/list）。
     * 云端数据覆盖本地（登录前新增的本地游客条目保留，待合并流程上传）；失败静默，保持本地数据。
     */
    fetchList(): Promise<void> {
      if (!this.isCloudMode) {
        return Promise.resolve();
      }
      // 并发去重：进行中的 task 直接复用；超过 TTL 视为挂起，作废重建
      if (fetchListTask && Date.now() - fetchListTaskAt < FETCH_LIST_TASK_TTL) {
        return fetchListTask;
      }
      fetchListTaskAt = Date.now();
      fetchListTask = (async () => {
        try {
          await loadCategoryCache();
          const res = await ItemApi.list({ pageNum: 1, pageSize: 500 });
          const remote = (res.rows || []).map(fromCloud);
          const localGuest = this.list.filter(it => it.guest === true);
          this.list = [...remote, ...localGuest];
          this.persist();
        }
        catch (error) {
          console.warn('item fetchList failed:', error);
        }
        finally {
          fetchListTask = null;
        }
      })();
      return fetchListTask;
    },

    /**
     * 云端更新单个条目（fire-and-forget）：仅同步有后端 id 的条目，全量字段（edit 校验必填），
     * 失败静默（请求拦截器已 toast），下次 fetchList 以云端为准
     */
    syncUpdate(id: string) {
      if (!this.isCloudMode || !/^\d+$/.test(id)) {
        return;
      }
      const target = this.list.find(it => it.id === id);
      if (!target) {
        return;
      }
      const bo = toCloudBo(target);
      if (bo.categoryId === undefined) {
        console.warn(`item cloud sync skipped (categoryId missing): ${target.name}`);
        return;
      }
      ItemApi.update({ id, ...bo }).catch(error => console.warn('item cloud sync failed:', error));
    },

    persist() {
      storage.setJSON(ITEM_LIST_KEY, this.list);
    },

    findItem(id: string): ItemRecord | null {
      return this.list.find(it => it.id === id) || null;
    },

    /**
     * 新增物品：云端模式直接上传（成功后 fetchList 换取后端 id）；
     * 本地模式打 guest 标记，登录后参与合并
     */
    addItem(draft: ItemDraft): ItemRecord {
      const record: ItemRecord = {
        ...draft,
        id: nowId(),
        status: 'active',
        guest: !this.isCloudMode,
        createdAt: today(),
        updatedAt: today(),
      };
      this.list.unshift(record);
      this.persist();
      if (this.isCloudMode) {
        const bo = toCloudBo(record);
        if (bo.categoryId === undefined) {
          console.warn(`item cloud add skipped (categoryId missing): ${record.name}`);
          return record;
        }
        ItemApi.add(bo)
          .then(() => this.fetchList())
          .catch(error => console.warn('item cloud add failed:', error));
      }
      return record;
    },

    /**
     * 更新物品（部分字段）；字段变更刷新 updatedAt，云端模式同步 PUT
     */
    updateItem(id: string, patch: Partial<ItemDraft> & Partial<ItemRecord>) {
      const target = this.list.find(it => it.id === id);
      if (!target) {
        return;
      }
      Object.assign(target, patch, { updatedAt: today() });
      this.persist();
      this.syncUpdate(id);
    },

    /**
     * 批量归档：标记已用完（记录使用天数）或移到已扔
     */
    archive(ids: string[], mode: ArchiveMode) {
      const idSet = new Set(ids);
      const changed: string[] = [];
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
        changed.push(it.id);
      });
      this.persist();
      // 归档走服务端状态流转（同时写 xq_item_archive_log），不再走整条 update
      if (this.isCloudMode) {
        const archiveType = mode === 'used' ? 0 : 1;
        changed.filter(id => /^\d+$/.test(id)).forEach((id) => {
          ItemApi.archive(id, archiveType).catch(error => console.warn('item archive failed:', error));
        });
      }
    },

    /** 恢复到在用（归档 / 回收站均可恢复） */
    restore(ids: string[]) {
      const idSet = new Set(ids);
      const changed: Array<{ id: string; wasTrashed: boolean }> = [];
      this.list.forEach((it) => {
        if (idSet.has(it.id)) {
          const wasTrashed = it.status === 'trashed';
          it.status = 'active';
          it.archivedAt = undefined;
          it.usedDays = undefined;
          it.trashedAt = undefined;
          it.updatedAt = today();
          changed.push({ id: it.id, wasTrashed });
        }
      });
      this.persist();
      if (this.isCloudMode) {
        changed.filter(item => /^\d+$/.test(item.id)).forEach((item) => {
          const request = item.wasTrashed ? ItemApi.recycleRestore(item.id) : ItemApi.restoreArchived(item.id);
          request.catch(error => console.warn('item restore failed:', error));
        });
      }
    },

    /** 移入回收站（30 天保留期，到期彻底删除） */
    moveToTrash(ids: string[]) {
      const idSet = new Set(ids);
      const changed: string[] = [];
      this.list.forEach((it) => {
        if (idSet.has(it.id)) {
          it.status = 'trashed';
          it.trashedAt = today();
          it.updatedAt = today();
          changed.push(it.id);
        }
      });
      this.persist();
      if (this.isCloudMode) {
        changed.filter(id => /^\d+$/.test(id)).forEach((id) => {
          ItemApi.moveToRecycle(id).catch(error => console.warn('item trash failed:', error));
        });
      }
    },

    /** 彻底删除（仅在回收站内提供，需二次确认） */
    deleteForever(ids: string[]) {
      const idSet = new Set(ids);
      const removed = this.list.filter(it => idSet.has(it.id) && /^\d+$/.test(it.id)).map(it => it.id);
      this.list = this.list.filter(it => !idSet.has(it.id));
      this.selectedIds = this.selectedIds.filter(id => !idSet.has(id));
      this.persist();
      if (this.isCloudMode && removed.length) {
        // 服务端彻底删除走回收站 purge，会写归档日志；不能走通用 DELETE
        removed.forEach((id) => {
          ItemApi.purge(id).catch(error => console.warn('item purge failed:', error));
        });
      }
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
      if (this.isCloudMode && /^\d+$/.test(id)) {
        ItemApi.renew(id, days).catch(error => console.warn('item renew failed:', error));
      }
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
     * 云端模式：可上传条目调 POST /app/xq/item，成功后移除本地副本并 fetchList 以云端为准；
     * 上传失败或分类缺失的条目保留本地（仍带 guest 标记），可再次合并
     */
    mergeGuest(items: Partial<ItemRecord>[], strategy: MergeStrategy): MergeResult {
      let mergedCount = 0;
      let conflictCount = 0;
      let pendingCount = 0;

      /** cloud 模式待上传任务：成功后按 id 移除本地副本 */
      const uploads: { id: string; bo: Partial<ItemVo> }[] = [];

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
          guest: this.isCloudMode,
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
          this.syncUpdate(matched.id);
        }
        else {
          this.list.unshift(incoming);
          if (this.isCloudMode) {
            const bo = toCloudBo(incoming);
            if (bo.categoryId === undefined) {
              console.warn(`merge upload skipped (categoryId missing): ${name}`);
            }
            else {
              uploads.push({ id: incoming.id, bo });
            }
          }
        }
        if (!incoming.dueDate) {
          pendingCount += 1;
        }
      });

      if (uploads.length) {
        Promise.allSettled(
          uploads.map(u => ItemApi.add(u.bo).then(() => u.id)),
        ).then((results) => {
          const okIds = new Set(
            results
              .filter(r => r.status === 'fulfilled')
              .map(r => (r as PromiseFulfilledResult<string>).value),
          );
          if (okIds.size) {
            this.list = this.list.filter(it => !okIds.has(it.id));
            this.persist();
          }
          this.fetchList();
        });
      }

      this.persist();
      return { mergedCount, conflictCount, pendingCount, total: items.length };
    },
  },
  persist: true,
});

export default useItemStore;
