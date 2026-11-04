<template>
  <view class="xpg">
    <view class="xpg__bar" :style="{ width: `${Math.min(100, Math.max(2, percent))}%`, background: color() }" />
  </view>
</template>

<script setup lang="ts">
/**
 * 进度条：percent 0~100；tone=life 时按生命阶段取色
 */
interface Props {
  percent: number;
  tone?: '' | 'life';
}

const props = withDefaults(defineProps<Props>(), { tone: '' });

function color(): string {
  if (props.tone === 'life') {
    const p = props.percent;
    if (p >= 85) {
      return '#D93025';
    }
    if (p >= 60) {
      return '#C77700';
    }
    return '#2E7D32';
  }
  return '#4F7CFF';
}
</script>

<style lang="scss" scoped>
.xpg {
  height: 16rpx;
  overflow: hidden;
  background: var(--color-fill);
  border-radius: 8rpx;
}

.xpg__bar {
  height: 100%;
  border-radius: 8rpx;
  transition: width 0.3s;
}
</style>
