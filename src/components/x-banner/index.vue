<template>
  <view class="xbn" :class="type ? `xbn--${type}` : ''">
    <view class="x-flex-1">
      {{ text }}
    </view>
    <text v-if="action" class="xbn__act" @tap="emit('action')">
      {{ action }}
    </text>
  </view>
</template>

<script setup lang="ts">
/**
 * 横幅提醒：默认警示红 / blue
 */
interface Props {
  text: string;
  action?: string;
  type?: '' | 'blue' | 'red';
}

withDefaults(defineProps<Props>(), {
  action: '',
  type: '',
});

const emit = defineEmits<{ action: [] }>();
</script>

<style lang="scss" scoped>
.xbn {
  display: flex;
  gap: 20rpx;
  align-items: center;
  padding: 24rpx;
  margin-bottom: 20rpx;
  font-size: var(--fs-sub);
  line-height: 1.5;
  color: #8c1d18;
  background: #ffeded;
  border-radius: 24rpx;
}

.xbn--blue {
  color: #2c3e7a;
  background: #f0f5ff;
}

.xbn__act {
  flex-shrink: 0;
  font-size: var(--fs-sub);
  font-weight: 700;
  color: var(--color-danger);
  white-space: nowrap;
}
</style>
