/**
 * 物品管理：/app/xq/item、/app/xq/item/category、/app/xq/item/image、/app/xq/item/reminder/plan
 *
 * 业务动作来自后端 XqItemBizController（归档/回收站/批量/提醒），
 * 与生成的 CRUD 控制器路径不重叠。
 */
import type { BaseVo, PageQuery, PageResult } from '../types';
import { del, get, post, put } from '@/utils/request';
import { biz, createCrudApi } from '../crud';

export interface ItemVo extends BaseVo {
  userId: number | string;
  familyId?: number | string;
  categoryId: number | string;
  itemName: string;
  /** 归一化名称（判重用） */
  normalizedName?: string;
  brand?: string;
  productionDate?: string;
  /** 到期日 */
  dueDate?: string;
  quantity?: number;
  unit?: string;
  /** 存放位置 */
  location?: string;
  /** 可见范围 0仅自己 1家人 */
  visibleScope?: number;
  /** 状态 0在用 1已用完 2已扔 3回收站 */
  status?: number;
  /** 来源 0手动 1拍照 2扫码 3小票 */
  source?: number;
  /** 是否药品 0否 1是 */
  isMedication?: number;
  /** 到期提醒提前天数 */
  expiryReminderDays?: number;
  mainImage?: string;
  remark?: string;
  /** 归档时间 */
  archiveTime?: string;
  /** 移入回收站时间 */
  recycleTime?: string;
  createTime?: string;
  updateTime?: string;
}

export interface ItemCategoryVo extends BaseVo {
  familyId?: number | string;
  userId?: number | string;
  categoryName: string;
  icon?: string;
  sort?: number;
  /** 是否系统内置 0 否 1 是 */
  isSystem?: number;
  status?: number;
}

export interface ItemImageVo extends BaseVo {
  itemId: number | string;
  imageUrl: string;
  /** 主图 0 否 1 是 */
  isPrimary?: number;
  sort?: number;
}

export interface ItemReminderPlanVo extends BaseVo {
  itemId: number | string;
  /** 提醒类型（Integer 字典值） */
  remindType?: number;
  remindDays?: number;
  remindDate?: string;
  status?: number;
  sentTime?: string;
}

/** 物品列表查询条件（后端 XqItemController#list） */
export interface ItemListQuery extends PageQuery {
  /** 名称或品牌关键字 */
  keyword?: string;
  categoryId?: number | string;
  /** 分组 expired/expiring/safe/archived/recycle/all */
  group?: string;
  /** 排序 expireAsc/expireDesc/createDesc/nameAsc */
  sortBy?: string;
}

export const ItemApi = {
  ...createCrudApi<ItemVo>('/app/xq/item'),

  /** 物品分页（支持关键字/分组/排序，服务端过滤） */
  query(params?: ItemListQuery) {
    return get<PageResult<ItemVo>>('/app/xq/item/list', biz({ params }));
  },

  /** 归档：archiveType 0 已用完 / 1 已扔 */
  archive(id: number | string, archiveType: 0 | 1 = 0) {
    return put<void>(`/app/xq/item/${id}/archive`, biz({ params: { archiveType } }));
  },

  /** 从归档恢复 */
  restoreArchived(id: number | string) {
    return put<void>(`/app/xq/item/${id}/restore`, biz());
  },

  /** 顺延到期日 */
  renew(id: number | string, days: number) {
    return put<void>(`/app/xq/item/${id}/renew`, biz({ data: { days } }));
  },

  /** 更新数量 */
  updateQuantity(id: number | string, quantity: number) {
    return put<void>(`/app/xq/item/${id}/quantity`, biz({ data: { quantity } }));
  },

  /** 移入回收站 */
  moveToRecycle(id: number | string) {
    return put<void>(`/app/xq/item/${id}/recycle`, biz());
  },

  /** 回收站分页 */
  recycleList(params?: PageQuery) {
    return get<PageResult<ItemVo>>('/app/xq/item/recycle/list', biz({ params }));
  },

  /** 回收站恢复 */
  recycleRestore(id: number | string) {
    return put<void>(`/app/xq/item/${id}/recycle/restore`, biz());
  },

  /** 彻底删除 */
  purge(id: number | string) {
    return del<void>(`/app/xq/item/${id}/recycle/purge`, biz());
  },

  /** 归档分页：type 0 已用完 / 1 已扔，空为全部 */
  archiveList(params?: PageQuery & { type?: 0 | 1 }) {
    return get<PageResult<ItemVo>>('/app/xq/item/archive/list', biz({ params }));
  },

  /** 批量归档 */
  batchArchive(ids: Array<number | string>, archiveType: 0 | 1 = 0) {
    return post<number>('/app/xq/item/batch/archive', biz({ data: { ids, archiveType } }));
  },

  /** 批量改位置 */
  batchLocation(ids: Array<number | string>, location: string) {
    return post<number>('/app/xq/item/batch/update-location', biz({ data: { ids, location } }));
  },

  /** 批量改提醒 */
  batchReminder(ids: Array<number | string>, days: number) {
    return post<number>('/app/xq/item/batch/update-reminder', biz({ data: { ids, days } }));
  },

  /** 物品的提醒计划 */
  reminderPlans(id: number | string) {
    return get<ItemReminderPlanVo[]>(`/app/xq/item/${id}/reminder-plan/list`, biz());
  },

  /** 开关提醒计划 */
  toggleReminder(planId: number | string, enabled: boolean) {
    return put<void>(`/app/xq/item/reminder-plan/${planId}/toggle`, biz({ params: { enabled } }));
  },

  category: createCrudApi<ItemCategoryVo>('/app/xq/item/category'),
  image: createCrudApi<ItemImageVo>('/app/xq/item/image'),
  reminderPlan: createCrudApi<ItemReminderPlanVo>('/app/xq/item/reminder/plan'),
};
