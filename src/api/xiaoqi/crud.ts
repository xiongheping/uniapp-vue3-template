/**
 * RuoYi 标准五接口 CRUD 工厂
 *
 * 对应 ruoyi-xiaoqi-app（RuoYi-Vue-Plus/ruoyi-xiaoqi/ruoyi-xiaoqi-app）各 Controller，
 * 前缀 /app/xq/**，随 ruoyi-member-server 一起启动（同进程、同一 HS256 JWT）：
 * GET /list（分页）、GET /{id}、POST、PUT、DELETE /{ids}
 *
 * 基地址统一走 BIZ_BASE。
 */
import type { HttpRequestConfig } from 'uview-plus/libs/luch-request/index';
import type { BaseVo, PageQuery, PageResult } from './types';
import { del, get, post, put } from '@/utils/request';
import { BIZ_BASE } from '../base';

/** 注入业务服务基地址，调用方可再次覆盖 */
export function biz(config?: HttpRequestConfig): HttpRequestConfig {
  return { baseURL: BIZ_BASE, ...config };
}

export function createCrudApi<T extends BaseVo>(basePath: string) {
  return {
    /** 分页查询（R<PageResult<T>> 包装） */
    list(params?: PageQuery, config?: HttpRequestConfig) {
      return get<PageResult<T>>(`${basePath}/list`, biz({ params, ...config }));
    },
    /** 详情 */
    detail(id: number | string, config?: HttpRequestConfig) {
      return get<T>(`${basePath}/${id}`, biz(config));
    },
    /** 新增 */
    add(data: Partial<T>, config?: HttpRequestConfig) {
      return post<void>(`${basePath}`, biz({ data, ...config }));
    },
    /** 修改 */
    update(data: Partial<T> & { id: number | string }, config?: HttpRequestConfig) {
      return put<void>(`${basePath}`, biz({ data, ...config }));
    },
    /** 删除（支持批量） */
    remove(ids: Array<number | string> | number | string, config?: HttpRequestConfig) {
      const idsStr = Array.isArray(ids) ? ids.join(',') : String(ids);
      return del<void>(`${basePath}/${idsStr}`, biz(config));
    },
  };
}
