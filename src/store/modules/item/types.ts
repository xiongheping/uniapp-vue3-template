/**
 * 物品（效期管家）领域类型
 * 原型对应：07 首页 / 10 详情 / 19 归档 / 26 游客合并
 */

/** 物品分类 */
export type ItemCategory = 'drug' | 'skin' | 'food' | 'other';

/** 生命周期状态：在用 → 已用完 / 已扔 → 回收站（30 天）→ 彻底删除 */
export type ItemStatus = 'active' | 'used' | 'thrown' | 'trashed';

/** 可见范围：仅自己 / 家人 */
export type ItemVisibility = 'self' | 'family';

/** 批量归档方式：标记已用完 / 移到已扔 */
export type ArchiveMode = 'used' | 'thrown';

/** 游客数据合并策略（原型 26）：合并去重 / 以云端为准 / 以本机为准 */
export type MergeStrategy = 'merge' | 'cloud' | 'local';

/** 物品记录（归档组的原始行） */
export interface ItemRecord {
  id: string;
  name: string;
  category: ItemCategory;
  qty: number;
  /** 规格，如「1 盒 5 片」 */
  spec?: string;
  location?: string;
  /** 生产日期 YYYY-MM-DD */
  produceDate?: string;
  /** 到期日 YYYY-MM-DD */
  dueDate?: string;
  /** 提前提醒天数（7/3/0，0=当天） */
  remindDays?: number[];
  visibility: ItemVisibility;
  isDrug?: boolean;
  status: ItemStatus;
  /** 未登录游客添加的物品，登录后参与合并 */
  guest?: boolean;
  createdAt: string;
  updatedAt?: string;
  /** 归档时间（已用完 / 已扔） */
  archivedAt?: string;
  /** 从添加到用完的天数（归档组展示「用了 N 天」） */
  usedDays?: number;
  /** 移入回收站时间 */
  trashedAt?: string;
  photo?: string;
}

/** 新增 / 编辑物品的草稿载荷 */
export interface ItemDraft {
  name: string;
  category: ItemCategory;
  qty: number;
  location?: string;
  produceDate?: string;
  dueDate?: string;
  remindDays?: number[];
  visibility: ItemVisibility;
  isDrug?: boolean;
  spec?: string;
  photo?: string;
}

/** 分组浏览的行：在用组带到期天数（dueDays），归档组只有原始记录 */
export interface ItemView extends ItemRecord {
  /** 距到期日天数，负数=已过期；无到期日不进入在用分组 */
  dueDays: number;
}

/** 首页 / 我的页统计口径 */
export interface ItemStats {
  active: number;
  expiring: number;
  expired: number;
  used: number;
  thrown: number;
  trashed: number;
}

/** 合并结果（原型 26 / 备份恢复共用） */
export interface MergeResult {
  /** 判重命中后合并的数量 */
  mergedCount: number;
  /** 冲突待确认（缺日期等） */
  conflictCount: number;
  /** 待确认条数（缺日期计待确认） */
  pendingCount: number;
  /** 参与合并的总条数 */
  total: number;
}
