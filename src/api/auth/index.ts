/**
 * 认证接口（ruoyi-member 模块，服务端口 8085）
 *
 * 全部路径均取自 Controller 实际注解，未按文档推测：
 * - MemberAuthController      @RequestMapping("/app/auth")
 *   POST /app/auth/sms-code   发送验证码 {phone, clientId?}
 *   POST /app/auth/login      手机号+验证码登录 {phone, code, clientId?}
 *   POST /app/auth/guest      游客登录 {deviceId, clientId?}
 *   POST /app/auth/register   游客补手机号转注册 {phone, code, nickname?, clientId?}（需登录）
 *   POST /app/auth/logout     登出（吊销当前 jti）
 * - MemberWxXcxAuthController @RequestMapping("/app/auth/wx")
 *   POST /app/auth/wx/xcx/login  {code, clientId}（均必填）
 * - MemberWxWebAuthController @RequestMapping("/app/auth/wx/web")
 *   GET  /app/auth/wx/web/auth-url
 *   POST /app/auth/wx/web/callback {code, state, clientId}
 * - MemberUserController      @RequestMapping("/app/member")
 *   GET  /app/member/profile
 *   PUT  /app/member/profile   {nickname?, avatar?}
 * - MemberSysClientController @RequestMapping("/app/client")
 *   GET  /app/client/{clientId}
 *
 * 统一出参 R<T>；令牌为自签 HS256，单令牌无 refresh（有效期 30 天）。
 * 认证方式：Authorization: Bearer <accessToken>。
 */
import type { HttpRequestConfig } from 'uview-plus/libs/luch-request/index';
import type { ClientInfo, MemberInfo, ProfileBo, TokenRes, WxWebAuthUrl } from './types';
import { BIZ_CLIENT_ID } from '@/utils/auth';
import { get, post, put } from '@/utils/request';

/** 匿名接口配置：不带令牌、失败由调用方处理提示 */
function anon(): HttpRequestConfig {
  return { custom: { auth: false, toast: false, repeatSubmit: false } as any };
}

/** 发送短信验证码（60s 限流一次；data 为验证码，仅后端开启回显时返回） */
export const sendSmsCode = (phone: string) =>
  post<string>('/app/auth/sms-code', { data: { phone, clientId: BIZ_CLIENT_ID }, ...anon() });

/** 短信验证码登录（首次自动注册） */
export const tokenBySms = (phone: string, smsCode: string) =>
  post<TokenRes>('/app/auth/login', { data: { phone, code: smsCode, clientId: BIZ_CLIENT_ID }, ...anon() });

/** 游客登录（按设备号复用或创建游客账号） */
export const tokenByGuest = (deviceId: string) =>
  post<TokenRes>('/app/auth/guest', { data: { deviceId, clientId: BIZ_CLIENT_ID }, ...anon() });

/** 游客补手机号转注册（会员ID 不变，需带令牌） */
export const registerByPhone = (phone: string, code: string, nickname?: string) =>
  post<TokenRes>('/app/auth/register', { data: { phone, code, nickname, clientId: BIZ_CLIENT_ID } });

/** 微信小程序登录（code 为 uni.login 获取的临时凭证，clientId 必填） */
export const tokenByWechat = (code: string) =>
  post<TokenRes>('/app/auth/wx/xcx/login', { data: { code, clientId: BIZ_CLIENT_ID }, ...anon() });

/** 微信网站扫码：获取授权地址（state 由后端生成并存入 Redis，一次性消费） */
export const wxWebAuthUrl = () =>
  get<WxWebAuthUrl>('/app/auth/wx/web/auth-url', { ...anon() });

/** 微信网站扫码：code + state 换令牌 */
export const wxWebCallback = (code: string, state: string) =>
  post<TokenRes>('/app/auth/wx/web/callback', { data: { code, state, clientId: BIZ_CLIENT_ID }, ...anon() });

/** 退出登录（当前令牌立即失效） */
export const logout = () => post<void>('/app/auth/logout');

/** 当前会员资料 */
export const me = () => get<MemberInfo>('/app/member/profile');

/** 修改资料（昵称 / 头像） */
export const updateProfile = (bo: ProfileBo) => put<void>('/app/member/profile', { data: bo });

/** 客户端元信息（白名单接口，不含 secret） */
export const clientInfo = (clientId: string = BIZ_CLIENT_ID) =>
  get<ClientInfo>(`/app/client/${clientId}`, { ...anon() });
