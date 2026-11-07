/**
 * 认证工具：OAuth2 双令牌（access_token + refresh_token）
 * 存储于 uni storage，供请求拦截器与路由守卫使用
 */
/** OAuth2 客户端ID：读取环境变量 CLIENT_ID（env/.env.*），缺失时回退内置默认值 */
export const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || 'xq-miniapp';

const AccessTokenKey = 'xq-access-token';
const RefreshTokenKey = 'xq-refresh-token';
export const TokenPrefix = 'Bearer ';

function isLogin(): boolean {
  return !!uni.getStorageSync(AccessTokenKey);
}

/** 获取 access_token（请求头 Authorization: Bearer xxx） */
function getToken(): string {
  return (uni.getStorageSync(AccessTokenKey) as string) || '';
}

/** 获取 refresh_token（401 时刷新用） */
function getRefreshToken(): string {
  return (uni.getStorageSync(RefreshTokenKey) as string) || '';
}

/** 仅更新 access_token */
function setToken(token: string) {
  uni.setStorageSync(AccessTokenKey, token);
}

/** 登录成功后同时写入双令牌 */
function setTokens(accessToken: string, refreshToken?: string) {
  uni.setStorageSync(AccessTokenKey, accessToken);
  if (refreshToken) {
    uni.setStorageSync(RefreshTokenKey, refreshToken);
  }
}

/** 清除全部令牌（登出/刷新失败） */
function clearToken() {
  uni.removeStorageSync(AccessTokenKey);
  uni.removeStorageSync(RefreshTokenKey);
}

export { clearToken, getRefreshToken, getToken, isLogin, setToken, setTokens };
