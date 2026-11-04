<template>
  <view class="xsw" :class="{ 'xsw--on': checked, 'xsw--mini': mini }" @tap="toggle">
    <view class="xsw__dot" />
  </view>
</template>

<script setup lang="ts">
/**
 * 开关
 */
interface Props {
  checked?: boolean;
  mini?: boolean;
}

const props = withDefaults(defineProps<Props>(), { checked: false, mini: false });

const emit = defineEmits<{ 'update:checked': [value: boolean]; 'change': [value: boolean] }>();

function toggle() {
  const next = !props.checked;
  emit('update:checked', next);
  emit('change', next);
}
</script>

<style lang="scss" scoped>
.xsw {
  position: relative;
  display: inline-block;
  flex-shrink: 0;
  width: 88rpx;
  height: 48rpx;
  background: var(--color-fill);
  border-radius: 24rpx;
  transition: background 0.2s;
}

.xsw__dot {
  position: absolute;
  top: 4rpx;
  left: 4rpx;
  width: 40rpx;
  height: 40rpx;
  background: #ffffff;
  border-radius: 50%;
  transition: transform 0.2s;
}

.xsw--on {
  background: var(--color-primary);

  .xsw__dot {
    transform: translateX(40rpx);
  }
}

.xsw--mini {
  width: 72rpx;
  height: 40rpx;

  .xsw__dot {
    width: 32rpx;
    height: 32rpx;
  }

  &.xsw--on .xsw__dot {
    transform: translateX(32rpx);
  }
}
</style>
