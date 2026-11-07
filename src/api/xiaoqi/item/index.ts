/**
 * 物品管理：/xiaoqi/item、/xiaoqi/item/category、/xiaoqi/item/image、/xiaoqi/item/reminder/plan
 */
import type { BaseVo } from '../types';
import { createCrudApi } from '../crud';

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
  /** 是否系统内置 */
  isSystem?: boolean;
  status?: string | number;
}

export interface ItemImageVo extends BaseVo {
  itemId: number | string;
  imageUrl: string;
  isPrimary?: boolean;
  sort?: number;
}

export interface ItemReminderPlanVo extends BaseVo {
  itemId: number | string;
  /** 提醒类型 */
  remindType?: string;
  remindDays?: number;
  remindDate?: string;
  status?: string | number;
  sentTime?: string;
}

export const ItemApi = {
  ...createCrudApi<ItemVo>('/xiaoqi/item'),
  category: createCrudApi<ItemCategoryVo>('/xiaoqi/item/category'),
  image: createCrudApi<ItemImageVo>('/xiaoqi/item/image'),
  reminderPlan: createCrudApi<ItemReminderPlanVo>('/xiaoqi/item/reminder/plan'),
};
