<template>
  <view
    class="xc"
    :class="{ 'xc--flat': flat, 'xc--highlight': highlight, 'x-tap': pressable }"
    :hover-class="pressable ? 'x-tap--hover' : 'none'"
    :hover-start-time="0"
    :hover-stop-propagation="true"
  >
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
  /** 高亮卡：2px 主色描边（原型 11「接下来」/ 06 任务卡） */
  highlight?: boolean;
  /** 整卡可点：按压态背景反馈 */
  pressable?: boolean;
}

withDefaults(defineProps<Props>(), { flat: false, highlight: false, pressable: false });
</script>

<style lang="scss" scoped>
.xc {
  box-sizing: border-box;
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

.xc--highlight {
  border: 4rpx solid var(--color-primary);
}
</style>
