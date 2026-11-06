<template>
  <view class="xcl x-tap" :class="{ 'xcl--last': last }" hover-class="x-tap--hover" :hover-start-time="0" @tap="emit('click')">
    <view v-if="icon" class="xcl__ico" :style="{ background: icoBg(tone) }">
      <x-icon :name="icon" :size="40" :color="icoColor(tone)" />
    </view>
    <view class="x-flex-1">
      <view class="xcl__t1 x-ellipsis">
        {{ title }}
      </view>
      <view v-if="subtitle" class="xcl__t2 x-ellipsis">
        {{ subtitle }}
      </view>
    </view>
    <x-tag v-if="tag" :type="tagType">
      {{ tag }}
    </x-tag>
    <x-icon v-if="chevron" name="chev-r" :size="32" color="#C0C6D2" />
  </view>
</template>

<script setup lang="ts">
/**
 * 列表行：图标 + 标题/副标题 + 右侧标签 + 箭头
 */
interface Props {
  icon?: string;
  title: string;
  subtitle?: string;
  tag?: string;
  tagType?: string;
  /** 图标底色 tone：red / orange / green / gray / purple */
  tone?: string;
  chevron?: boolean;
  last?: boolean;
}

withDefaults(defineProps<Props>(), {
  icon: '',
  subtitle: '',
  tag: '',
  tagType: 'gray',
  tone: '',
  chevron: false,
  last: false,
});

const emit = defineEmits<{ click: [] }>();

const TONE_BG: Record<string, string> = {
  red: '#FFEDED',
  orange: '#FFF4E5',
  green: '#EAF8E8',
  purple: '#F0E6FF',
};
const TONE_FG: Record<string, string> = {
  red: '#D93025',
  orange: '#C77700',
  green: '#2E7D32',
  purple: '#7B3FF2',
};

function icoBg(tone: string) {
  return tone && TONE_BG[tone] ? TONE_BG[tone] : 'var(--color-primary-soft)';
}

function icoColor(tone: string) {
  return tone && TONE_FG[tone] ? TONE_FG[tone] : '#4F7CFF';
}
</script>

<style lang="scss" scoped>
.xcl {
  display: flex;
  gap: 20rpx;
  align-items: center;
  min-height: var(--h-touch);
  padding: 22rpx 0;
  border-bottom: 2rpx solid var(--color-divider);
}

.xcl--last {
  border-bottom: none;
}

.xcl__ico {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 80rpx;
  height: 80rpx;
  border-radius: 24rpx;
}

.xcl__t1 {
  font-size: var(--fs-body);
  font-weight: 600;
  color: var(--color-text);
}

.xcl__t2 {
  margin-top: 4rpx;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}
</style>
