import type {
  HttpError,
  HttpRequestAbstract,
  HttpRequestConfig,
  HttpResponse,
} from 'uview-plus/libs/luch-request/index';
import { useUserStore } from '@/store';
import { clearToken, getToken, TokenPrefix } from '@/utils/auth';
import storage from '@/utils/storage';
import { showMessage } from './status';

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

/** 重登标记：并发请求同时 401 时只跳转一次 */
let redirecting = false;

/**
 * 登录态失效：清令牌与用户态，回登录页
 * C 端为单令牌（无 refresh），30 天到期后必须重新登录
 */
const forceReLogin = () => {
  clearToken();
  try {
    useUserStore().resetInfo();
  }
  catch {
    // store 尚未初始化（如 App 启动期），忽略
  }
  if (redirecting) {
    return;
  }
  redirecting = true;
  uni.reLaunch({
    url: `/pages/common/login/index?redirect=${encodeURIComponent('/pages/tab/home/index')}`,
    complete: () => {
      redirecting = false;
    },
  });
};

function requestInterceptors(http: HttpRequestAbstract) {
  /**
   * 请求拦截
   * @param {object} http
   */
  http.interceptors.request.use(
    (config: HttpRequestConfig) => {
      // 初始化请求拦截器时，会执行此方法，此时data为undefined，赋予默认{}
      config.data = config.data || {};
      // 自定义参数
      const custom = config?.custom;

      // 是否需要设置 token（登录 / 游客 / 验证码等匿名接口用 custom.auth = false 跳过）
      const skipAuth = custom?.auth === false;
      if (getToken() && !skipAuth) {
        // ruoyi-member JWT：Authorization: Bearer <accessToken>
        config.header = config.header || {};
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
   * 响应拦截：R<T> 统一处理
   */
  http.interceptors.response.use((response: HttpResponse) => {
    const data = response.data;
    const config = response.config;
    const custom = config?.custom;

    // 隐藏 loading
    if (custom?.loading) {
      uni.hideLoading();
    }

    // 未登录 / 令牌过期：R.code = 401
    if (data && data.code === 401) {
      if (custom?.auth !== false) {
        forceReLogin();
      }
      return Promise.reject(data);
    }

    // 请求成功则返回结果
    if (data && data.code === 200) {
      return response || {};
    }

    // 如果没有显式定义 custom.toast === false，默认对报错 toast 提示
    if (custom?.toast !== false) {
      uni.$u.toast(data?.msg || '操作失败');
    }

    // 请求失败则抛出错误（透出后端提示语）
    return Promise.reject(data);
  }, (response: HttpError) => {
    const custom = response.config?.custom;

    // 隐藏 loading
    if (custom?.loading) {
      uni.hideLoading();
    }

    const body = response.data;
    const backendMsg = body?.msg;

    // HTTP 401：令牌失效
    if (response.statusCode === 401) {
      if (custom?.auth !== false) {
        forceReLogin();
      }
      return Promise.reject(body || response);
    }

    // 如果没有显式定义 custom.toast === false，默认对报错 toast 提示
    if (custom?.toast !== false) {
      const message = backendMsg || (response.statusCode ? showMessage(response.statusCode) : '网络连接异常，请稍后再试');
      uni.$u.toast(message);
    }

    // 透出后端提示语，便于调用方用 error?.msg / error?.message 读取真实原因
    const msg = backendMsg || (response.statusCode ? showMessage(response.statusCode) : '网络连接异常，请稍后再试');
    (response as any).msg = msg;
    (response as any).message = msg;

    return Promise.reject(response);
  });
}

export { requestInterceptors, responseInterceptors };
