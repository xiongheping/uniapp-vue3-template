<template>
  <view class="xnt" :class="type ? `xnt--${type}` : ''">
    <slot />
  </view>
</template>

<script setup lang="ts">
/**
 * 提示便签：默认警示黄 / blue / green / red / purple
 */
interface Props {
  type?: '' | 'blue' | 'green' | 'red' | 'purple';
}

withDefaults(defineProps<Props>(), { type: '' });
</script>

<style lang="scss" scoped>
.xnt {
  padding: 20rpx 24rpx;
  margin-bottom: 20rpx;
  font-size: var(--fs-sub);
  line-height: 1.6;
  color: var(--color-note-text);
  background: var(--color-note-bg);
  border-left: 6rpx solid var(--color-note-bar);
  border-radius: 16rpx;

  &.xnt--blue {
    color: var(--color-note-blue-text);
    background: var(--color-note-blue-bg);
    border-left-color: var(--color-primary);
  }

  &.xnt--green {
    color: var(--color-note-green-text);
    background: var(--color-note-green-bg);
    border-left-color: var(--color-note-green-bar);
  }

  &.xnt--red {
    color: var(--color-note-red-text);
    background: var(--color-note-red-bg);
    border-left-color: var(--color-danger-strong);
  }

  &.xnt--purple {
    color: var(--color-note-purple-text);
    background: var(--color-note-purple-bg);
    border-left-color: var(--color-note-purple-bar);
  }
}
</style>
