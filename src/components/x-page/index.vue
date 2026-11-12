<template>
  <view class="xp-root" :class="{ dark: isDark, elder: settingStore.isElder }" :style="rootStyle">
    <scroll-view class="xp-scroll" scroll-y>
      <view class="xp-body" :class="{ 'xp-body--padded': padded }" :style="bodyStyle">
        <slot />
      </view>
    </scroll-view>

    <view v-if="$slots.sticky" class="xp-sticky">
      <slot name="sticky" />
    </view>

    <x-tabbar v-if="tab" :active="tab" />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore, useSettingStore } from '@/store';

/**
 * 页面骨架：背景 + 内容区 + 吸底插槽 + 底部导航
 * dark / elder 模式通过根节点 class 下发设计令牌
 */
interface Props {
  /** 内容区是否带默认内边距 */
  padded?: boolean;
  /** 吸底条占位高度（px），有 sticky 插槽时传入避免遮挡 */
  reserve?: number;
  /** 自定义背景（渐变等） */
  bg?: string;
  /** 传入 tab 路径时渲染底部导航 */
  tab?: string;
}

const props = withDefaults(defineProps<Props>(), {
  padded: true,
  reserve: 0,
  bg: '',
  tab: '',
});

const appStore = useAppStore();
const settingStore = useSettingStore();

const isDark = computed<boolean>(() => appStore.getTheme === 'dark');

/** 真实状态栏高度（px）；>0 时以 CSS 变量透传（小程序端 --status-bar-height 的运行时注入点） */
const statusBarHeight = computed<number>(() => appStore.getSystemInfo?.statusBarHeight || 0);

const rootStyle = computed<string>(() => {
  const parts: string[] = [];
  if (props.bg) {
    parts.push(`background:${props.bg}`);
  }
  if (statusBarHeight.value > 0) {
    parts.push(`--status-bar-height:${statusBarHeight.value}px`);
  }
  return parts.join(';');
});

const bodyStyle = computed<string>(() =>
  props.reserve > 0 ? `padding-bottom:calc(${props.reserve * 2}rpx + env(safe-area-inset-bottom, 0px));` : '',
);
</script>

<style lang="scss" scoped>
.xp-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-bg);
}

.xp-scroll {
  flex: 1;
  min-height: 0;
}

.xp-body {
  min-height: 100%;
}

.xp-body--padded {
  padding: 24rpx 32rpx 32rpx;
}

.xp-sticky {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  /* 底部仅保留 iPhone 安全区，按钮贴屏幕最底边 */
  padding: 24rpx 32rpx env(safe-area-inset-bottom, 0);
  background: linear-gradient(to top, var(--color-bg) 75%, transparent);
}
</style>
