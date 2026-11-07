/**
 * 会员相关：/xiaoqi/member/order、subscription、user/alias、user/setting
 */
import type { BaseVo } from '../types';
import { createCrudApi } from '../crud';

export interface MemberOrderVo extends BaseVo {
  orderNo: string;
  userId: number | string;
  planId: number | string;
  planName?: string;
  amount?: number;
  payChannel?: string;
  /** 支付状态 */
  payStatus?: string | number;
  payTime?: string;
  transactionId?: string;
  nextBillingTime?: string;
  autoRenew?: boolean;
}

export interface MemberSubscriptionVo extends BaseVo {
  userId: number | string;
  planId: number | string;
  orderId?: number | string;
  startTime?: string;
  endTime?: string;
  status?: string | number;
  autoRenew?: boolean;
}

export interface MemberUserAliasVo extends BaseVo {
  userId: number | string;
  familyId: number | string;
  originalName: string;
  aliasName: string;
  categoryId?: number | string;
  status?: string | number;
}

export interface MemberUserSettingVo extends BaseVo {
  userId: number | string;
  /** 长辈模式 */
  elderMode?: boolean;
  theme?: string;
  language?: string;
  defaultVisibleScope?: string;
  defaultAdvanceDays?: number;
}

export const MemberApi = {
  order: createCrudApi<MemberOrderVo>('/xiaoqi/member/order'),
  subscription: createCrudApi<MemberSubscriptionVo>('/xiaoqi/member/subscription'),
  userAlias: createCrudApi<MemberUserAliasVo>('/xiaoqi/member/user/alias'),
  userSetting: createCrudApi<MemberUserSettingVo>('/xiaoqi/member/user/setting'),
};
