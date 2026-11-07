/**
 * 业务接口公共类型（对接 /xiaoqi/** 资源服务器保护路径）
 */
import type { IPageResult } from '@/utils/request/types';

/** RuoYi 分页查询参数 */
export interface PageQuery {
  pageNum?: number;
  pageSize?: number;
  orderByColumn?: string;
  isAsc?: 'asc' | 'desc';
  [key: string]: any;
}

/** 分页结果 */
export type PageResult<T> = IPageResult<T>;

/** 所有业务 VO 的基础字段 */
export interface BaseVo {
  id?: number | string;
  createTime?: string;
  updateTime?: string;
  [key: string]: any;
}
