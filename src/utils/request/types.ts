// RuoYi 统一响应体 R<T>
export interface IResponse<T = any> {
  code: number | string;
  msg: string;
  data: T;
}

// 分页响应（R<PageResult<T>>）
export interface IPageResult<T = any> {
  rows: T[];
  total: number;
}

// OAuth2 令牌端点响应（非 R 包装，原生 JSON）
export interface ITokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

/** 判断响应体是否为 OAuth2 令牌响应（/oauth2/token 专用） */
export function isTokenResponse(data: any): data is ITokenResponse {
  return !!data && typeof data === 'object' && 'access_token' in data;
}
