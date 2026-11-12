/**
 * 认证工具：C 端单令牌（自签 HS256，有效期 30 天，无 refresh）
 * 存储于 uni storage，供请求拦截器与路由守卫使用
 *
 * 客户端ID：MemberTokenVo.clientId，取自 sys_client（app 客户端，见 script/sql/ry_vue.sql）
 */
export const BIZ_CLIENT_ID = import.meta.env.VITE_CLIENT_ID || '428a8310cd442757ae699df5d894f051';

const AccessTokenKey = 'xq-access-token';
export const TokenPrefix = 'Bearer ';

function isLogin(): boolean {
  return !!uni.getStorageSync(AccessTokenKey);
}

/** 获取 accessToken（请求头 Authorization: Bearer xxx） */
function getToken(): string {
  return (uni.getStorageSync(AccessTokenKey) as string) || '';
}

/** 写入令牌 */
function setToken(token: string) {
  uni.setStorageSync(AccessTokenKey, token);
}

/** 清除令牌（登出 / 401 重登） */
function clearToken() {
  uni.removeStorageSync(AccessTokenKey);
  // 清理历史版本遗留的 refresh_token
  uni.removeStorageSync('xq-refresh-token');
}

export { clearToken, getToken, isLogin, setToken };
