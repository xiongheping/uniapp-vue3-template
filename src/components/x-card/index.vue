<template>
  <view class="xc" :class="{ 'xc--flat': flat }">
    <slot />
  </view>
</template>

<script setup lang="ts">
/**
 * 卡片容器
 */
interface Props {
  /** 无内边距平铺（列表/头图用） */
  flat?: boolean;
}

withDefaults(defineProps<Props>(), { flat: false });
</script>

<style lang="scss" scoped>
.xc {
  padding: 28rpx;
  margin-bottom: 24rpx;
  background: var(--color-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.xc--flat {
  padding: 0;
  overflow: hidden;
}
</style>
