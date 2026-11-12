<template>
  <view class="xtb x-safe-bottom">
    <view
      v-for="item in TAB_BAR_LIST"
      :key="item.path"
      class="xtb__tab x-tap-opacity"
      :class="{ on: item.path === active }"
      hover-class="x-tap-opacity--hover"
      :hover-start-time="0"
      @tap="onTap(item.path)"
    >
      <view class="xtb__ico-wrap">
        <x-icon :name="item.icon" :size="tabIconSize" :color="item.path === active ? '#4F7CFF' : '#6B7590'" />
        <view v-if="badgeCount(item.badge) > 0" class="xtb__badge">
          {{ badgeCount(item.badge) }}
        </view>
      </view>
      <text class="xtb__text">
        {{ item.text }}
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { BadgeType } from '@/store/modules/message/types';
import { computed } from 'vue';
import { switchTabPath, TAB_BAR_LIST } from '@/router/tab-bar';
import { useMessageStore, useSettingStore } from '@/store';

/**
 * 自定义底部导航（原生 tabBar 已移除）
 * 4 tab：首页 / 计划 / 消息 / 我的；角标口径见 tab-bar.ts
 * elder 模式放大（原型 .elder .tab 13px / .tab-ico 28px）
 */
interface Props {
  /** 当前激活 tab 路径 */
  active: string;
}

const props = defineProps<Props>();
const messageStore = useMessageStore();
const settingStore = useSettingStore();

/** tab 图标：常规 48rpx（原型 .li lg），elder 56rpx（原型 28px） */
const tabIconSize = computed<number>(() => (settingStore.isElder ? 56 : 48));

function badgeCount(type: BadgeType): number {
  if (type === 'none') {
    return 0;
  }
  return type === 'p0' ? messageStore.unreadP0 : messageStore.unreadTotal;
}

function onTap(path: string) {
  if (path !== props.active) {
    switchTabPath(path);
  }
}
</script>

<style lang="scss" scoped>
.xtb {
  display: flex;
  flex-shrink: 0;
  height: var(--h-tabbar);
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom, 0px));
  background: var(--color-card);
  border-top: 2rpx solid var(--color-tabbar-border);
}

.xtb__tab {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8rpx;
  align-items: center;
  justify-content: center;
  min-height: 88rpx;
}

.xtb__ico-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.xtb__badge {
  position: absolute;
  top: -4rpx;
  right: -18rpx;
  padding: 2rpx 10rpx;
  font-size: 18rpx;
  font-weight: 600;
  color: #ffffff;
  background: var(--color-danger-strong);
  border-radius: 16rpx;
}

.xtb__text {
  font-size: var(--fs-tab);
  color: var(--color-text-sub);
}

.xtb__tab.on .xtb__text {
  font-weight: 600;
  color: var(--color-primary);
}
</style>
