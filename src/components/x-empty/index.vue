<template>
  <view class="xe">
    <view v-if="emoji" class="xe__emoji">
      {{ emoji }}
    </view>
    <view v-else-if="icon" class="xe__ico">
      <x-icon :name="icon" :size="72" color="#B0B7C3" />
    </view>
    <view class="xe__title">
      {{ title }}
    </view>
    <view v-if="sub" class="xe__sub">
      {{ sub }}
    </view>
    <view v-if="$slots.action" class="xe__action">
      <slot name="action" />
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 空态：emoji / 图标 + 标题 + 说明 + 操作（四要素齐备）
 */
interface Props {
  title: string;
  sub?: string;
  emoji?: string;
  icon?: string;
}

withDefaults(defineProps<Props>(), {
  sub: '',
  emoji: '',
  icon: '',
});
</script>

<style lang="scss" scoped>
.xe {
  padding: 100rpx 60rpx;
  text-align: center;
}

.xe__emoji {
  font-size: 120rpx;
  line-height: 1.1;
  opacity: 0.72;
}

.xe__ico {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 140rpx;
  height: 140rpx;
  margin: 0 auto;
  background: var(--color-fill);
  border-radius: 40rpx;
}

.xe__title {
  margin-top: 24rpx;
  font-size: var(--fs-title);
  font-weight: 700;
  color: var(--color-text);
}

.xe__sub {
  margin-top: 12rpx;
  font-size: var(--fs-sub);
  line-height: 1.7;
  color: var(--color-text-sub);
}

.xe__action {
  margin-top: 32rpx;
}
</style>
