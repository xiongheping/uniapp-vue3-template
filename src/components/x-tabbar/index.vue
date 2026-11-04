<template>
  <view class="xtb x-safe-bottom">
    <view
      v-for="item in TAB_BAR_LIST"
      :key="item.path"
      class="xtb__tab"
      :class="{ on: item.path === active }"
      @tap="onTap(item.path)"
    >
      <view class="xtb__ico-wrap">
        <x-icon :name="item.icon" :size="44" :color="item.path === active ? '#4F7CFF' : '#6B7590'" />
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
import { switchTabPath, TAB_BAR_LIST } from '@/router/tab-bar';
import { useMessageStore } from '@/store';

/**
 * 自定义底部导航（原生 tabBar 已移除）
 * 4 tab：首页 / 用药 / 消息 / 我的；角标口径见 tab-bar.ts
 */
interface Props {
  /** 当前激活 tab 路径 */
  active: string;
}

const props = defineProps<Props>();
const messageStore = useMessageStore();

function badgeCount(type: BadgeType): number {
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
  height: 120rpx;
  padding-bottom: env(safe-area-inset-bottom, 0);
  background: var(--color-card);
  border-top: 2rpx solid var(--color-divider);
}

.xtb__tab {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4rpx;
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
  font-size: 20rpx;
  color: var(--color-text-sub);
}

.xtb__tab.on .xtb__text {
  font-weight: 600;
  color: var(--color-primary);
}
</style>
