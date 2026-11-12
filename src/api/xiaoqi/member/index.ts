/**
 * 会员相关
 * 来源：ruoyi-xiaoqi-app /app/xq/member/order、subscription、user/alias、user/setting
 * 枚举一律为 Integer 字典值（0/1 布尔语义），与后端 VO 保持一致
 *
 * 会员方案/订阅/取消订单/自动续费来自 XqMemberBizController；
 * 下单金额由服务端按 planId 回查，前端不再传 amount。
 */
import type { BaseVo } from '../types';
import { get, post } from '@/utils/request';
import { biz, createCrudApi } from '../crud';

/** 会员方案 */
export interface MemberTierVo extends BaseVo {
  planCode: string;
  planName: string;
  /** 方案类型（Integer 字典值） */
  planType?: number;
  price: number;
  originalPrice?: number;
  durationDays?: number;
  memberCount?: number;
  /** 权益 JSON 字符串 */
  featuresJson?: string;
  sort?: number;
  status?: number;
}

export interface MemberOrderVo extends BaseVo {
  orderNo: string;
  userId: number | string;
  planId: number | string;
  planName?: string;
  amount?: number;
  /** 支付渠道（Integer 字典值） */
  payChannel?: number;
  /** 支付状态（Integer 字典值） */
  payStatus?: number;
  payTime?: string;
  transactionId?: string;
  nextBillingTime?: string;
  /** 自动续费 0 关 1 开 */
  autoRenew?: number;
}

export interface MemberSubscriptionVo extends BaseVo {
  userId: number | string;
  planId: number | string;
  orderId?: number | string;
  startTime?: string;
  endTime?: string;
  status?: number;
  autoRenew?: number;
}

export interface MemberUserAliasVo extends BaseVo {
  userId: number | string;
  familyId: number | string;
  originalName: string;
  aliasName: string;
  categoryId?: number | string;
  status?: number;
}

export interface MemberUserSettingVo extends BaseVo {
  userId: number | string;
  /** 长辈模式 0 关 1 开 */
  elderMode?: number;
  /** 主题（Integer 字典值） */
  theme?: number;
  language?: string;
  /** 默认可见范围 */
  defaultVisibleScope?: number;
  defaultAdvanceDays?: number;
}

export const MemberApi = {
  order: createCrudApi<MemberOrderVo>('/app/xq/member/order'),
  subscription: createCrudApi<MemberSubscriptionVo>('/app/xq/member/subscription'),
  userAlias: createCrudApi<MemberUserAliasVo>('/app/xq/member/user/alias'),
  userSetting: createCrudApi<MemberUserSettingVo>('/app/xq/member/user/setting'),

  /** 在售会员方案 */
  tiers() {
    return get<MemberTierVo[]>('/app/xq/member/tier/list', biz());
  },

  /** 当前有效订阅，非会员返回 null */
  currentSubscription() {
    return get<MemberSubscriptionVo | null>('/app/xq/member/subscription', biz());
  },

  /** 创建订单（服务端定价），返回订单号 */
  createOrder(data: { planId: number | string; payChannel?: number; autoRenew?: number }) {
    return post<string>('/app/xq/member/order', biz({ data }));
  },

  /** 按订单号查详情 */
  orderByNo(orderNo: string) {
    return get<MemberOrderVo>(`/app/xq/member/order/no/${orderNo}`, biz());
  },

  /** 取消订单（仅待支付） */
  cancelOrder(orderNo: string) {
    return post<void>(`/app/xq/member/order/${orderNo}/cancel`, biz());
  },

  /** 开关自动续费 */
  switchAutoRenew(autoRenew: boolean) {
    return post<void>('/app/xq/member/subscription/auto-renew', biz({ data: { autoRenew } }));
  },
};
