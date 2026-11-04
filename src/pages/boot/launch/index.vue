<template>
  <x-page :padded="false" bg="linear-gradient(160deg, var(--color-primary), var(--color-primary-2))">
    <view class="launch">
      <view class="launch__logo">
        📦
      </view>
      <view class="launch__name">
        小七管家
      </view>
      <view class="launch__slogan">
        拍一下，管住家里每一件东西
      </view>
      <view class="launch__badge">
        🔒 数据默认只存在你手机里
      </view>
      <view class="launch__version">
        v1.0.0
      </view>
    </view>
  </x-page>
</template>

<script setup lang="ts">
import { HOME_PATH, LOGIN_PATH } from '@/router';
import { isLogin } from '@/utils/auth';

// 「已看过引导」持久化标记（与 pages/boot/guide/index.vue 保持一致）
const GUIDE_KEY = 'guide_seen';
// 游客模式标记（与 store/modules/item 的 guest 判定对应）
const GUEST_KEY = 'guest_mode';

onLoad(() => {
  // 冷启动短暂停留（约 1.5s）后按原型逻辑分流：引导在登录前
  setTimeout(() => {
    if (uni.getStorageSync(GUIDE_KEY) !== true) {
      uni.redirectTo({ url: '/pages/boot/guide/index' });
      return;
    }
    const isGuest = uni.getStorageSync(GUEST_KEY) === true;
    // 已登录或游客可直接进首页，其余进登录页
    uni.redirectTo({ url: isLogin() || isGuest ? HOME_PATH : LOGIN_PATH });
  }, 1500);
});
</script>

<style lang="scss" scoped>
.launch {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: #ffffff;
  text-align: center;
}

.launch__logo {
  margin-bottom: 32rpx;
  font-size: 160rpx;
  line-height: 1;
}

.launch__name {
  margin-bottom: 16rpx;
  font-size: 56rpx;
  font-weight: 700;
}

.launch__slogan {
  font-size: var(--fs-body);
  opacity: 0.9;
}

.launch__badge {
  padding: 8rpx 24rpx;
  margin-top: 32rpx;
  font-size: var(--fs-caption);
  background: rgb(255 255 255 / 18%);
  border-radius: 24rpx;
}

.launch__version {
  margin-top: 104rpx;
  font-size: var(--fs-mini);
  opacity: 0.7;
}
</style>
