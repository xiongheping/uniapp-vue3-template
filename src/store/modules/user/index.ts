import type { UserState } from './types';
import { defineStore } from 'pinia';
import { AuthApi } from '@/api';
import { clearToken, setTokens } from '@/utils/auth';

/** 游客账号 storage 标记（「先逛逛」写入，与 mine 页判定共用） */
export const GUEST_MODE_KEY = 'guest_mode';

/** 生成并持久化设备号（游客登录用） */
export function getOrCreateDeviceId(): string {
  let deviceId = uni.getStorageSync('xq-device-id') as string;
  if (!deviceId) {
    deviceId = `wx-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    uni.setStorageSync('xq-device-id', deviceId);
  }
  return deviceId;
}

const useUserStore = defineStore('user', {
  state: (): UserState => ({
    memberId: '',
    phone: '',
    nickname: '',
    avatar: '',
    guest: false,
    registerType: -1,
  }),
  getters: {
    userInfo(state: UserState): UserState {
      return { ...state };
    },
    /** 是否已拉取到会员信息 */
    hasInfo(state: UserState): boolean {
      return !!state.memberId;
    },
  },
  actions: {
    // 设置用户的信息
    setInfo(partial: Partial<UserState>) {
      this.$patch(partial);
    },
    // 重置用户信息
    resetInfo() {
      this.$reset();
    },
    /** 登录成功后统一落令牌 */
    applyToken(res: { access_token: string; refresh_token?: string }) {
      setTokens(res.access_token, res.refresh_token);
    },
    /** 短信验证码登录（首次自动注册） */
    async smsLogin(phone: string, smsCode: string) {
      const res = await AuthApi.tokenBySms(phone, smsCode);
      this.applyToken(res);
      await this.fetchInfo();
      return res;
    },
    /** 微信登录：uni.login 拿 code 换令牌 */
    wechatLogin() {
      return new Promise((resolve, reject) => {
        uni.login({
          provider: 'weixin',
          success: async (result: UniApp.LoginRes) => {
            if (!result.code) {
              reject(new Error(result.errMsg || '微信登录失败'));
              return;
            }
            try {
              const res = await AuthApi.tokenByWechat(result.code);
              this.applyToken(res);
              await this.fetchInfo();
              resolve(res);
            }
            catch (error) {
              reject(error);
            }
          },
          fail: (err: any) => {
            console.error(`wechat login error: ${err}`);
            reject(err);
          },
        });
      });
    },
    /** 游客登录：按设备号复用或创建游客账号 */
    async guestLogin() {
      const res = await AuthApi.tokenByGuest(getOrCreateDeviceId());
      this.applyToken(res);
      await this.fetchInfo();
      uni.setStorageSync(GUEST_MODE_KEY, true);
      return res;
    },
    /** 拉取当前会员信息 */
    async fetchInfo() {
      const info = await AuthApi.me();
      this.setInfo({
        memberId: info.memberId,
        phone: info.phone,
        nickname: info.nickname,
        avatar: info.avatar,
        guest: info.guest,
        registerType: info.registerType,
      });
      return info;
    },
    /** 退出登录：吊销令牌 + 清空本地状态 */
    async logout() {
      try {
        await AuthApi.logout();
      }
      catch (error) {
        // 后端登出失败不阻塞本地清理
        console.warn('logout api error:', error);
      }
      this.resetInfo();
      clearToken();
      uni.removeStorageSync(GUEST_MODE_KEY);
    },
  },
  persist: true,
});

export default useUserStore;
