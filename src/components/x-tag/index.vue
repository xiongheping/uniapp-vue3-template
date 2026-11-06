<template>
  <text class="xt" :class="`xt--${type}`">
    <slot />
  </text>
</template>

<script setup lang="ts">
/**
 * 标签：red / orange / green / blue / gray / purple
 */
interface Props {
  type?: string;
}

withDefaults(defineProps<Props>(), { type: 'gray' });
</script>

<style lang="scss" scoped>
.xt {
  flex-shrink: 0;
  padding: 6rpx 16rpx;
  font-size: var(--fs-caption);
  font-weight: 600;
  white-space: nowrap;
  border-radius: 10rpx;

  &.xt--red {
    color: #d93025;
    background: #ffe5e5;
  }

  &.xt--orange {
    color: #c77700;
    background: #fff0db;
  }

  &.xt--green {
    color: #2e7d32;
    background: #e4f5e4;
  }

  &.xt--blue {
    color: #3d5af1;
    background: #e6edff;
  }

  &.xt--gray {
    color: #7b8494;
    background: #eef0f5;
  }

  &.xt--purple {
    color: #7b3ff2;
    background: #f0e6ff;
  }
}
</style>
