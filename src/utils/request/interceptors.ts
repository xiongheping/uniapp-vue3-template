import type {
  HttpError,
  HttpRequestAbstract,
  HttpRequestConfig,
  HttpResponse,
} from 'uview-plus/libs/luch-request/index';
import { AuthApi } from '@/api';
import { useUserStore } from '@/store';
import { clearToken, getRefreshToken, getToken, TokenPrefix } from '@/utils/auth';
import storage from '@/utils/storage';
import { showMessage } from './status';
import { isTokenResponse } from './types';

// 重试队列，每一项将是一个待执行的函数形式
let requestQueue: (() => void)[] = [];

// 防止重复提交
const repeatSubmit = (config: HttpRequestConfig) => {
  const requestObj = {
    url: config.url,
    data: typeof config.data === 'object' ? JSON.stringify(config.data) : config.data,
    time: Date.now(),
  };
  const sessionObj = storage.getJSON('sessionObj');
  if (!sessionObj) {
    storage.setJSON('sessionObj', requestObj);
  }
  else {
    const s_url = sessionObj.url; // 请求地址
    const s_data = sessionObj.data; // 请求数据
    const s_time = sessionObj.time; // 请求时间
    const interval = 1000; // 间隔时间(ms)，小于此时间视为重复提交
    if (s_data === requestObj.data && requestObj.time - s_time < interval && s_url === requestObj.url) {
      const message = '数据正在处理，请勿重复提交';
      console.warn(`[${s_url}]: ${message}`);
      return Promise.reject(new Error(message));
    }
    else {
      storage.setJSON('sessionObj', requestObj);
    }
  }
};

// 是否正在刷新token的标记
let isRefreshing: boolean = false;

// 登录态彻底失效：清令牌与用户态，回登录页
const forceReLogin = () => {
  clearToken();
  useUserStore().resetInfo();
  uni.reLaunch({ url: `/pages/common/login/index?redirect=${encodeURIComponent('/pages/tab/home/index')}` });
};

// 用 refresh_token 静默续期，成功后重放队列
const refreshToken = async (http: HttpRequestAbstract, config: HttpRequestConfig) => {
  const oldRefreshToken = getRefreshToken();
  // 无 refresh_token 或已在刷新中，进入排队
  if (oldRefreshToken && !isRefreshing) {
    isRefreshing = true;
    try {
      const res = await AuthApi.refreshToken(oldRefreshToken);
      const { setTokens } = await import('@/utils/auth');
      setTokens(res.access_token, res.refresh_token);
      // 队列请求重放
      requestQueue.forEach(cb => cb());
      requestQueue = [];
      isRefreshing = false;
      // 重新执行本次请求
      return http.request(config);
    }
    catch {
      isRefreshing = false;
      requestQueue = [];
      forceReLogin();
      return Promise.reject(new Error('登录已失效'));
    }
  }

  if (isRefreshing) {
    return new Promise<HttpResponse<any>>((resolve) => {
      requestQueue.push(() => {
        resolve(http.request(config));
      });
    });
  }

  // 没有 refresh_token，直接重登
  forceReLogin();
  return Promise.reject(new Error('请先登录'));
};

function requestInterceptors(http: HttpRequestAbstract) {
  /**
   * 请求拦截
   * @param {object} http
   */
  http.interceptors.request.use(
    (config: HttpRequestConfig) => {
      // 可使用async await 做异步操作
      // 初始化请求拦截器时，会执行此方法，此时data为undefined，赋予默认{}
      config.data = config.data || {};
      // 自定义参数
      const custom = config?.custom;

      // 是否需要设置 token（登录/令牌等匿名接口用 custom.auth = false 跳过）
      const skipAuth = custom?.auth === false;
      if (getToken() && !skipAuth && config.header) {
        // OAuth2 资源服务器：Authorization: Bearer <JWT>
        config.header.Authorization = `${TokenPrefix}${getToken()}`;
      }

      // 是否显示 loading
      if (custom?.loading) {
        uni.showLoading({
          title: '加载中',
          mask: true,
        });
      }

      // 是否需要防止数据重复提交
      const isRepeatSubmit = custom?.repeatSubmit === false;
      if (!isRepeatSubmit && (config.method === 'POST' || config.method === 'UPLOAD')) {
        repeatSubmit(config);
      }
      return config;
    },
    (config: any) => // 可使用async await 做异步操作
      Promise.reject(config),
  );
}
function responseInterceptors(http: HttpRequestAbstract) {
  /**
   * 响应拦截
   * @param {object} http
   */
  http.interceptors.response.use((response: HttpResponse) => {
    /* 对响应成功做点什么 可使用async await 做异步操作 */
    const data = response.data;
    // 配置参数
    const config = response.config;
    // 自定义参数
    const custom = config?.custom;

    // OAuth2 令牌端点响应（{ access_token, ... }，非 R 包装），直接放行
    if (isTokenResponse(data)) {
      return response;
    }

    // 登录状态失效，静默续期后重放
    if (data.code === 401) {
      return refreshToken(http, config);
    }

    // 隐藏loading
    if (custom?.loading) {
      uni.hideLoading();
    }

    // 请求成功则返回结果
    if (data.code === 200) {
      return response || {};
    }

    // 如果没有显式定义custom的toast参数为false的话，默认对报错进行toast弹出提示
    if (custom?.toast !== false) {
      uni.$u.toast(data.msg || '操作失败');
    }

    // 请求失败则抛出错误
    return Promise.reject(data);
  }, (response: HttpError) => {
    // 自定义参数
    const custom = response.config?.custom;

    // 隐藏loading
    if (custom?.loading !== false) {
      uni.hideLoading();
    }

    // 令牌端点：错误体已统一为 R 结构（含 msg + RFC error_description），
    // 且不能走静默续期——否则 invalid_client 的 401 会误触发刷新逻辑
    const isTokenEndpoint = (response.config?.url || '').includes('/oauth2/token');
    const body = response.data;
    const backendMsg = body?.msg || body?.error_description;

    // HTTP 401（资源服务器返回的状态码）：同样走静默续期
    if (response.statusCode === 401 && !isTokenEndpoint) {
      return refreshToken(http, response.config);
    }

    // 如果没有显式定义custom的toast参数为false的话，默认对报错进行toast弹出提示
    if (custom?.toast !== false) {
      const message = backendMsg || (response.statusCode ? showMessage(response.statusCode) : '网络连接异常,请稍后再试!');
      uni.$u.toast(message);
    }

    // 透出后端提示语，便于调用方用 error?.msg / error?.message 读取真实原因
    if (backendMsg) {
      (response as any).msg = backendMsg;
      (response as any).message = backendMsg;
    }

    return Promise.reject(response);
  });
}

export { requestInterceptors, responseInterceptors };
