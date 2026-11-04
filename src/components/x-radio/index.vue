<template>
  <view class="xr" :class="{ 'xr--on': checked }" />
</template>

<script setup lang="ts">
/**
 * 单选圆点
 */
interface Props {
  checked?: boolean;
}

withDefaults(defineProps<Props>(), { checked: false });
</script>

<style lang="scss" scoped>
.xr {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44rpx;
  height: 44rpx;
  border: 4rpx solid var(--color-fill);
  border-radius: 50%;
}

.xr--on {
  border-color: var(--color-primary);

  &::after {
    width: 24rpx;
    height: 24rpx;
    content: '';
    background: var(--color-primary);
    border-radius: 50%;
  }
}
</style>
