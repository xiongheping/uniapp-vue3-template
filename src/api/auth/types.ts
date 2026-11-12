/**
 * 认证相关类型
 *
 * 来源：ruoyi-member 模块
 * - 令牌：org.dromara.common.security.jwt.token.MemberTokenVo（驼峰字段）
 * - 资料：org.dromara.member.domain.vo.MemberProfileVo
 * - 客户端：org.dromara.member.domain.vo.MemberSysClientVo
 */

/** 令牌响应（POST /app/auth/login 等，R<MemberTokenVo>） */
export interface TokenRes {
  /** 访问令牌，请求头 Authorization: Bearer <accessToken> */
  accessToken: string;
  /** 固定 Bearer */
  tokenType: string;
  /** 有效期（秒），C 端 30 天 */
  expiresIn: number;
  /** 会员ID */
  memberId: number | string;
  /** 是否游客 */
  isGuest: boolean;
  /** 客户端ID */
  clientId?: string;
}

/** 会员资料（GET /app/member/profile） */
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
  /** 状态 */
  status?: number;
  lastLoginTime?: string;
  createTime?: string;
}

/** 资料修改入参（PUT /app/member/profile） */
export interface ProfileBo {
  nickname?: string;
  avatar?: string;
}

/** 客户端元信息（GET /app/client/{clientId}，不含 secret） */
export interface ClientInfo {
  clientId: string;
  deviceType: string;
  grantTypes: string[];
  /** 0 正常 1 停用 */
  status: string;
}

/** 微信网站扫码授权地址（GET /app/auth/wx/web/auth-url） */
export interface WxWebAuthUrl {
  authUrl: string;
  /** 一次性 state，回调时原样带回 */
  state: string;
}
