import type { MemberInfo } from '@/api/auth/types';

/**
 * 用户状态
 */
export interface UserState {
  memberId?: number | string;
  /** 脱敏手机号 */
  phone?: string;
  nickname?: string;
  avatar?: string;
  /** 是否游客账号 */
  guest?: boolean;
  /** 注册方式：0 手机号 1 微信 2 Apple 3 游客 */
  registerType?: number;
}

export type providerType
  = | 'weixin'
    | 'qq'
    | 'sinaweibo'
    | 'xiaomi'
    | 'apple'
    | 'univerify'
    | undefined;

export type { MemberInfo };
