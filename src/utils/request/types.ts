// RuoYi 统一响应体 R<T>
export interface IResponse<T = any> {
  code: number | string;
  msg: string;
  data: T;
}

// 分页响应（R<PageResult<T>>，后端 org.dromara.common.core.domain.PageResult）
export interface IPageResult<T = any> {
  rows: T[];
  total: number;
}
