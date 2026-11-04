<template>
  <view class="xnb" :style="{ color: navColor }">
    <view class="xnb__status" />
    <view class="xnb__bar">
      <view class="xnb__side">
        <slot name="left">
          <view v-if="back" class="xnb__back" @tap="handleBack">
            <x-icon :name="back === 'close' ? 'x' : 'arrow-l'" :size="44" :color="navColor" />
          </view>
        </slot>
      </view>
      <text class="xnb__title">
        {{ title }}
      </text>
      <view class="xnb__side xnb__side--right">
        <slot name="right">
          <view v-if="rightIcon" class="xnb__act" @tap="emit('right')">
            <x-icon :name="rightIcon" :size="40" :color="navColor" />
          </view>
          <text v-else-if="rightText" class="xnb__act-text" @tap="emit('right')">
            {{ rightText }}
          </text>
        </slot>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from '@/hooks';

/**
 * 导航栏：标题 + 返回/关闭 + 右侧操作（文字或图标）
 */
interface Props {
  title?: string;
  /** back='back' 返回箭头 / 'close' 关闭叉 / false 隐藏（用 #left 自定义） */
  back?: boolean | 'back' | 'close';
  rightIcon?: string;
  rightText?: string;
}

const _props = withDefaults(defineProps<Props>(), {
  title: '',
  back: 'back' as const,
  rightIcon: '',
  rightText: '',
});

const emit = defineEmits<{ right: [] }>();
const { isDark } = useTheme();

const navColor = computed<string>(() => (isDark.value ? '#F0F2F6' : '#1A2233'));

function handleBack() {
  uni.navigateBack({
    fail: () => {
      uni.redirectTo({ url: '/pages/tab/home/index' });
    },
  });
}
</script>

<style lang="scss" scoped>
.xnb {
  background: var(--color-bg);
}

.xnb__status {
  height: var(--status-bar-height, 40rpx);
}

.xnb__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 88rpx;
  padding: 0 24rpx;
}

.xnb__side {
  display: flex;
  align-items: center;
  min-width: 80rpx;
}

.xnb__back {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 72rpx;
  min-height: 72rpx;
}

.xnb__title {
  max-width: 50%;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--fs-nav);
  font-weight: 700;
  white-space: nowrap;
}

.xnb__side--right {
  justify-content: flex-end;
}

.xnb__act {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 72rpx;
  min-height: 72rpx;
}

.xnb__act-text {
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--color-primary);
}
</style>
