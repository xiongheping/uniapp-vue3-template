// 引入配置
import type { HttpRequestConfig, HttpResponse } from 'uview-plus/libs/luch-request/index';
import type { IResponse } from './types';
import Request from 'uview-plus/libs/luch-request/index';
import { MEMBER_BASE } from '@/api/base';
import { requestInterceptors, responseInterceptors } from './interceptors';

const http = new Request();

// 引入拦截器配置
export function setupRequest() {
  http.setConfig((defaultConfig: HttpRequestConfig) => {
    /* 默认指向 ruoyi-member-server（认证 / 资料），业务接口按需覆盖 baseURL */
    defaultConfig.baseURL = MEMBER_BASE;
    return defaultConfig;
  });
  requestInterceptors(http);
  responseInterceptors(http);
}

export function request<T = any>(config: HttpRequestConfig): Promise<T> {
  return new Promise((resolve, reject) => {
    http.request(config).then((res: HttpResponse<IResponse<T>>) => {
      const { data } = res.data;
      resolve(data as T);
    }).catch((err: any) => {
      console.error('[ err ] >', err);
      reject(err);
    });
  });
}

export function get<T = any>(url: string, config?: HttpRequestConfig): Promise<T> {
  return request({ ...config, url, method: 'GET' });
}

export function post<T = any>(url: string, config?: HttpRequestConfig): Promise<T> {
  return request({ ...config, url, method: 'POST' });
}

export function put<T = any>(url: string, config?: HttpRequestConfig): Promise<T> {
  return request({ ...config, url, method: 'PUT' });
}

export function del<T = any>(url: string, config?: HttpRequestConfig): Promise<T> {
  return request({ ...config, url, method: 'DELETE' });
}

export function upload<T = any>(url: string, config?: HttpRequestConfig): Promise<T> {
  return request({ ...config, url, method: 'UPLOAD' });
}

export function download<T = any>(url: string, config?: HttpRequestConfig): Promise<T> {
  return request({ ...config, url, method: 'DOWNLOAD' });
}

export default setupRequest;
