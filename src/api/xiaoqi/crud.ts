/**
 * RuoYi 标准五接口 CRUD 工厂
 * GET /list（分页）、GET /{id}、POST、PUT、DELETE /{ids}
 */
import type { HttpRequestConfig } from 'uview-plus/libs/luch-request/index';
import type { BaseVo, PageQuery, PageResult } from './types';
import { del, get, post, put } from '@/utils/request';

export function createCrudApi<T extends BaseVo>(basePath: string) {
  return {
    /** 分页查询（R<PageResult<T>> 包装，不传 params 返回全部） */
    list(params?: PageQuery, config?: HttpRequestConfig) {
      return get<PageResult<T>>(`${basePath}/list`, { params, ...config });
    },
    /** 详情 */
    detail(id: number | string) {
      return get<T>(`${basePath}/${id}`);
    },
    /** 新增 */
    add(data: Partial<T>) {
      return post<void>(`${basePath}`, { data });
    },
    /** 修改 */
    update(data: Partial<T> & { id: number | string }) {
      return put<void>(`${basePath}`, { data });
    },
    /** 删除（支持批量） */
    remove(ids: Array<number | string> | number | string) {
      const idsStr = Array.isArray(ids) ? ids.join(',') : String(ids);
      return del<void>(`${basePath}/${idsStr}`);
    },
  };
}
