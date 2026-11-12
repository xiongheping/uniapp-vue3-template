/**
 * 首页（C 端）
 *
 * 来源：ruoyi-xiaoqi-app XqHomeBizController
 * - GET /app/xq/home/digest      今日摘要（物品统计 / 未读 / AI 额度 / 服药进度 / 会员方案）
 * - GET /app/xq/home/item/list   按分组分页查物品（服务端分组，口径与首页 tile 一致）
 *
 * 摘要字段全部由后端实时聚合业务表，前端不再二次推算。
 */
import type { ItemVo } from '../item';
import type { PageQuery, PageResult } from '../types';
import { get } from '@/utils/request';
import { biz } from '../crud';

/** 首页摘要（后端 HomeDigestVo） */
export interface HomeDigestVo {
  /** 在用物品总数 */
  totalCount?: number;
  /** 已过期数量 */
  expiredCount?: number;
  /** 临期数量 */
  expiringCount?: number;
  /** 安全数量 */
  safeCount?: number;
  /** 已归档数量（已用完 + 已扔） */
  archivedCount?: number;
  /** 回收站数量 */
  recycleCount?: number;
  /** 未读消息数 */
  unreadCount?: number;
  /** AI 识别总额度（当月），无记录时为 null */
  aiQuotaTotal?: number | null;
  /** AI 识别已消耗额度（当月） */
  aiQuotaUsed?: number | null;
  /** AI 识别剩余额度（当月） */
  aiQuotaLeft?: number | null;
  /** 今日服药时段总数 */
  todayDoseTotal?: number;
  /** 今日已打卡时段数 */
  todayDoseDone?: number;
  /** 进行中的用药计划数 */
  medicationPlanCount?: number;
  /** 当前会员方案名称，非会员为 null */
  tierName?: string | null;
  /** 会员到期时间 */
  tierEndTime?: string | null;
}

/** 首页分组口径（与 HomeBizService#itemPage 的 group 取值一致） */
export type HomeItemGroup = 'expired' | 'expiring' | 'safe' | 'archived' | 'recycle' | 'all';

export interface HomeItemQuery extends PageQuery {
  group?: HomeItemGroup;
}

export const HomeApi = {
  /** 今日摘要 */
  digest() {
    return get<HomeDigestVo>('/app/xq/home/digest', biz());
  },

  /** 按分组分页查物品 */
  itemList(params?: HomeItemQuery) {
    return get<PageResult<ItemVo>>('/app/xq/home/item/list', biz({ params }));
  },
};
