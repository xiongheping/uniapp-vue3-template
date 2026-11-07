import type { HttpRequestConfig } from 'uview-plus/libs/luch-request/index';
/**
 * 认证接口：OAuth2 令牌端点 + 会员信息
 *
 * 后端：ruoyi-xiaoqi-app（Spring Authorization Server）
 * - 小程序客户端 client_id = xq-miniapp（public，无需 client_secret）
 * - /oauth2/token 请求体为 form-urlencoded，响应为原生 OAuth2 JSON（非 R 包装）
 * - /c/** 为资源服务器保护路径，需 Authorization: Bearer <JWT>
 */
import type { MemberInfo, TokenRes } from './types';
import { CLIENT_ID } from '@/utils/auth';
import { get, post } from '@/utils/request';

/** 将参数对象序列化为 form-urlencoded */
function form(params: Record<string, string | number>) {
  return Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
}

/** 令牌端点公共配置：匿名 + form 表单 + 失败不全局 toast（由调用方处理） */
function tokenConfig(data: string): HttpRequestConfig {
  return {
    data: data as any,
    header: { 'Content-Type': 'application/x-www-form-urlencoded' },
    custom: { auth: false, toast: false, repeatSubmit: false } as any,
  };
}

/** 发送短信验证码（60s 限流一次；data 为验证码，仅后端开启回显时返回） */
export const sendSmsCode = (phone: string) =>
  get<string>('/app/auth/code/sms-code', { params: { phone } });

/** 短信验证码登录（首次自动注册） */
export const tokenBySms = (phone: string, smsCode: string, countryCode = '+86') =>
  post<TokenRes>('/app/auth/login', tokenConfig(form({ grant_type: 'sms', client_id: CLIENT_ID, phone, sms_code: smsCode, country_code: countryCode })));

/** 微信登录（code 为 wx.login 获取的临时凭证） */
export const tokenByWechat = (socialCode: string) =>
  post<TokenRes>('/app/auth/wx/xcx/login', tokenConfig(form({ grant_type: 'wechat', client_id: CLIENT_ID, social_code: socialCode })));

/** 游客登录（按设备号复用或创建游客账号） */
export const tokenByGuest = (deviceId: string) =>
  post<TokenRes>('/app/auth/guest', tokenConfig(form({ grant_type: 'guest', client_id: CLIENT_ID, device_id: deviceId })));

/** 刷新令牌 */
export const refreshToken = (refreshToken: string) =>
  post<TokenRes>('/oauth2/token', tokenConfig(form({ grant_type: 'refresh_token', client_id: CLIENT_ID, refresh_token: refreshToken })));

/** 退出登录（吊销当前 jti，令牌即时失效） */
export const logout = () => post<void>('/c/auth/logout');

/** 获取当前会员信息 */
export const me = () => get<MemberInfo>('/c/user/me');
