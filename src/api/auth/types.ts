/**
 * 认证相关类型（对接 ruoyi-xiaoqi-app OAuth2 授权服务器）
 */
import type { ITokenResponse } from '@/utils/request/types';

/** 令牌响应 */
export type TokenRes = ITokenResponse;

/** 会员信息（GET /c/user/me） */
export interface MemberInfo {
  memberId: number | string;
  /** 脱敏手机号，如 138****1234 */
  phone: string;
  nickname: string;
  avatar: string;
  /** 是否游客账号 */
  guest: boolean;
  /** 注册方式：0 手机号 1 微信 2 Apple 3 游客 */
  registerType: number;
}
