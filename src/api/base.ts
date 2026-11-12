/**
 * 接口基地址
 *
 * C 端只有一个后端进程：ruoyi-member-server（默认 8085）
 * - ruoyi-member 模块：/app/auth/**、/app/member/**、/app/client/**
 * - ruoyi-xiaoqi-app 模块：/app/xq/**（业务 CRUD）
 * 两者共用同一套 HS256 JWT（Authorization: Bearer <accessToken>）
 *
 * H5 开发态开启代理时走同源相对路径（/app 由 vite 转发），小程序 / App 端直连。
 */
const API_ORIGIN = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085';

let useProxy = false;
// #ifdef H5
useProxy = import.meta.env.VITE_APP_PROXY === 'true';
// #endif

/** 认证 / 资料接口基地址 */
export const MEMBER_BASE = useProxy ? '' : API_ORIGIN;

/** 业务接口基地址（同一进程，预留独立部署时覆盖） */
export const BIZ_BASE = MEMBER_BASE;
