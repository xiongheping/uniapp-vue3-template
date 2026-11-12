<template>
  <view class="xf" :class="{ 'xf--last': last }" @tap="emit('click')">
    <view class="xf__k">
      <x-icon v-if="icon" :name="icon" :size="28" :color="iconColor" />
      <text>{{ label }}</text>
    </view>
    <view class="xf__v-wrap">
      <slot>
        <text class="xf__v" :class="{ [`xf__v--${tone}`]: !!tone }">
          {{ value }}
        </text>
      </slot>
      <x-icon v-if="chevron" name="chev-r" :size="28" color="#C0C6D2" />
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 键值行：label + value / 自定义内容（开关等）+ 箭头
 */
interface Props {
  label: string;
  value?: string;
  /** 值色调：primary / purple / orange */
  tone?: string;
  icon?: string;
  /** label 前置图标颜色 */
  iconColor?: string;
  chevron?: boolean;
  last?: boolean;
}

withDefaults(defineProps<Props>(), {
  value: '',
  tone: '',
  icon: '',
  iconColor: '#6B7590',
  chevron: false,
  last: false,
});

const emit = defineEmits<{ click: [] }>();
</script>

<style lang="scss" scoped>
.xf {
  display: flex;
  gap: 16rpx;
  align-items: center;
  justify-content: space-between;
  min-height: var(--h-cell);
  padding: 26rpx 0;
  font-size: var(--fs-body);
  border-bottom: 2rpx solid var(--color-divider);
}

.xf--last {
  border-bottom: none;
}

.xf__k {
  display: flex;
  gap: 8rpx;
  align-items: center;
  font-weight: 500;
  color: var(--color-text);
}

.xf__v-wrap {
  display: flex;
  gap: 8rpx;
  align-items: center;
  min-width: 0;
}

.xf__v {
  font-size: 26rpx;
  color: var(--color-text-sub);
  text-align: right;
}

.xf__v--primary {
  font-weight: 600;
  color: var(--color-primary);
}

.xf__v--purple {
  font-weight: 600;
  color: #7b3ff2;
}

.xf__v--orange {
  font-weight: 600;
  color: var(--color-warning-text);
}
</style>
