<template>
  <view
    class="xch x-tap-scale"
    :class="{ 'xch--on': active, 'xch--small': small }"
    hover-class="x-tap-scale--hover"
    :hover-start-time="0"
    @tap="emit('click')"
  >
    <x-icon v-if="icon" :name="icon" :size="26" :color="active ? '#ffffff' : '#5B6478'" />
    <text>{{ text }}<slot /></text>
  </view>
</template>

<script setup lang="ts">
/**
 * 胶囊筛选 / 选择
 */
interface Props {
  text?: string;
  icon?: string;
  active?: boolean;
  small?: boolean;
}

withDefaults(defineProps<Props>(), {
  text: '',
  icon: '',
  active: false,
  small: false,
});

const emit = defineEmits<{ click: [] }>();
</script>

<style lang="scss" scoped>
.xch {
  display: inline-flex;
  flex-shrink: 0;
  gap: 12rpx;
  align-items: center;
  min-height: 76rpx;
  padding: 0 28rpx;
  font-size: var(--fs-sub);
  color: #5b6478;
  white-space: nowrap;
  background: var(--color-card);
  border: 2rpx solid var(--color-border);
  border-radius: var(--radius-pill);
  transition:
    background-color var(--dur-normal) var(--ease-out),
    border-color var(--dur-normal) var(--ease-out),
    color var(--dur-normal) var(--ease-out);
}

.xch--small {
  min-height: 64rpx;
  padding: 0 24rpx;
  font-size: var(--fs-caption);
}

.xch--on {
  font-weight: 600;
  color: #ffffff;
  background: var(--color-primary);
  border-color: var(--color-primary);
}
</style>
