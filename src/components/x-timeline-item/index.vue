<template>
  <view class="xtl">
    <text class="xtl__time">
      {{ time }}
    </text>
    <view class="xtl__axis">
      <view class="xtl__dot" :class="`xtl__dot--${state}`" />
      <view v-if="line" class="xtl__line" />
    </view>
    <view class="xtl__card">
      <slot />
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 时间轴节点：时间 + 圆点（on/done/missed）+ 内容卡
 */
interface Props {
  time?: string;
  /** '' 默认灰点 / on 当前高亮 / done 已完成 / missed 错过 */
  state?: string;
  /** 是否绘制连接线 */
  line?: boolean;
}

withDefaults(defineProps<Props>(), {
  time: '',
  state: '',
  line: true,
});
</script>

<style lang="scss" scoped>
.xtl {
  display: flex;
  gap: 24rpx;
}

.xtl__time {
  flex-shrink: 0;
  width: 104rpx;
  padding-top: 28rpx;
  font-size: var(--fs-sub);
  font-weight: 700;
  color: var(--color-text);
  text-align: right;
}

.xtl__axis {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  padding-top: 40rpx;
}

.xtl__dot {
  width: 20rpx;
  height: 20rpx;
  background: var(--color-fill);
  border-radius: 50%;

  &--on {
    background: var(--color-primary);
    box-shadow: 0 0 0 8rpx #e6edff;
  }

  &--done {
    background: var(--color-success);
  }

  &--missed {
    background: var(--color-danger-strong);
  }
}

.xtl__line {
  flex: 1;
  width: 4rpx;
  margin-top: 8rpx;
  background: var(--color-border);
}

.xtl__card {
  flex: 1;
  min-width: 0;
  margin-bottom: 20rpx;
}
</style>
