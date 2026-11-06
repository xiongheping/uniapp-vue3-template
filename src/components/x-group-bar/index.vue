<template>
  <view class="xgb">
    <text class="xgb__title">
      {{ title }}
    </text>
    <text v-if="more" class="xgb__more x-tap-opacity" hover-class="x-tap-opacity--hover" :hover-start-time="0" @tap="emit('more')">
      {{ more }}
    </text>
  </view>
</template>

<script setup lang="ts">
/**
 * 分组标题条：左侧标题 + 右侧「查看全部 ›」
 */
interface Props {
  title: string;
  more?: string;
}

withDefaults(defineProps<Props>(), { more: '' });

const emit = defineEmits<{ more: [] }>();
</script>

<style lang="scss" scoped>
.xgb {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 20rpx;
  margin: 24rpx 0 16rpx;
  font-size: var(--fs-sub);
  font-weight: 700;
  color: #3d5af1;
  background: #e9eef8;
  border-radius: 16rpx;
}

.xgb__more {
  font-weight: 600;
}
</style>
