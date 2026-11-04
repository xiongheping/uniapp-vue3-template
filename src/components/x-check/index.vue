<template>
  <view class="xck" :class="{ 'xck--on': checked }">
    <x-icon v-if="checked" name="check" :size="24" color="#ffffff" />
  </view>
</template>

<script setup lang="ts">
/**
 * 复选框（批量管理勾选）
 */
interface Props {
  checked?: boolean;
}

withDefaults(defineProps<Props>(), { checked: false });
</script>

<style lang="scss" scoped>
.xck {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44rpx;
  height: 44rpx;
  background: var(--color-card);
  border: 3rpx solid var(--color-fill);
  border-radius: 14rpx;
}

.xck--on {
  background: var(--color-primary);
  border-color: var(--color-primary);
}
</style>
