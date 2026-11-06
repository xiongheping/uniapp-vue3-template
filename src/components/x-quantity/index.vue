<template>
  <view class="xq">
    <button class="xq__btn" hover-class="xq__btn--hover" :hover-start-time="0" @tap="emit('decrease')">
      −
    </button>
    <text class="xq__val">
      {{ text || modelValue }}
    </text>
    <button class="xq__btn" hover-class="xq__btn--hover" :hover-start-time="0" @tap="emit('increase')">
      +
    </button>
  </view>
</template>

<script setup lang="ts">
/**
 * 数量步进器：+/- 按钮，中间展示数值（text 优先于 modelValue）
 */
interface Props {
  modelValue?: number;
  /** 直接展示文案（如库存 18/30 粒） */
  text?: string;
}

const _props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  text: '',
});

const emit = defineEmits<{ decrease: []; increase: [] }>();
</script>

<style lang="scss" scoped>
.xq {
  display: inline-flex;
  gap: 28rpx;
  align-items: center;
  padding: 12rpx 24rpx;
  background: var(--color-fill-light);
  border-radius: 24rpx;
}

.xq__btn {
  width: 64rpx;
  height: 64rpx;
  font-size: var(--fs-body);
  line-height: 1;
  color: var(--color-primary);
  background: var(--color-card);
  border: 2rpx solid var(--color-fill);
  border-radius: 16rpx;
  transition: opacity var(--dur-normal) var(--ease-out), transform var(--dur-fast) var(--ease-out);
}

.xq__btn--hover {
  opacity: 0.85;
  transform: scale(0.94);
}

.xq__val {
  min-width: 112rpx;
  font-size: var(--fs-body);
  font-weight: 700;
  color: var(--color-text);
  text-align: center;
}
</style>
