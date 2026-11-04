<template>
  <x-page :padded="false">
    <view class="guide">
      <view class="guide__top">
        <text v-if="current < slides.length - 1" class="guide__skip" @tap="finish">
          跳过
        </text>
      </view>

      <swiper class="guide__swiper" :current="current" :duration="260" @change="onChange">
        <swiper-item v-for="(slide, index) in slides" :key="index">
          <view class="slide">
            <view class="slide__emoji">
              {{ slide.emoji }}
            </view>
            <view class="slide__title">
              {{ slide.title }}
            </view>
            <view v-if="!slide.lines" class="slide__body">
              {{ slide.body }}
            </view>
            <view v-else class="slide__body slide__body--list">
              <view v-for="(line, li) in slide.lines" :key="li" class="slide__line">
                {{ line }}
              </view>
            </view>
            <view class="slide__dots">
              <view v-for="(_, di) in slides" :key="di" class="slide__dot" :class="{ on: di === index }" />
            </view>
          </view>
        </swiper-item>
      </swiper>

      <view class="guide__footer">
        <x-button :text="current === slides.length - 1 ? '开始使用' : '下一步'" @click="next" />
      </view>
    </view>
  </x-page>
</template>

<script setup lang="ts">
import { LOGIN_PATH } from '@/router';

// 「已看过引导」持久化标记键名（与 pages/boot/launch/index.vue 保持一致）
const GUIDE_KEY = 'guide_seen';

interface GuideSlide {
  emoji: string;
  title: string;
  body?: string;
  lines?: string[];
}

const slides: GuideSlide[] = [
  {
    emoji: '📷',
    title: '拍一下，AI 帮你读效期',
    body: '对准包装上的效期位置，自动识别生产与到期日。识别不准时随时手动修正。',
  },
  {
    emoji: '⏰',
    title: '快到期时，我会告诉你',
    body: '临期物品合并成每天 1 条摘要推送。服药提醒单独走，不会被合并漏掉。',
  },
  {
    emoji: '🔐',
    title: '你的数据，只属于你',
    lines: [
      '✓ 数据默认只存在你的手机里',
      '✓ 用药记录默认仅自己可见',
      '✓ 敏感数据单独授权，可随时撤回',
      '✓ 一键删除全部数据，无需理由',
    ],
  },
];

const current = ref(0);

function onChange(e: UniHelper.SwiperOnChangeEvent) {
  current.value = e.detail.current;
}

function next() {
  if (current.value < slides.length - 1) {
    current.value += 1;
    return;
  }
  finish();
}

function finish() {
  // 完成或跳过后写入「已看过引导」标记，然后进入登录页
  uni.setStorageSync(GUIDE_KEY, true);
  uni.redirectTo({ url: LOGIN_PATH });
}
</script>

<style lang="scss" scoped>
.guide {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.guide__top {
  display: flex;
  justify-content: flex-end;
  padding: calc(var(--status-bar-height) + 24rpx) 32rpx 0;
}

.guide__skip {
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--color-primary);
}

.guide__swiper {
  flex: 1;
}

.slide {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 48rpx;
  text-align: center;
}

.slide__emoji {
  margin: 40rpx 0;
  font-size: 144rpx;
  line-height: 1;
}

.slide__title {
  margin-bottom: 20rpx;
  font-size: var(--fs-h1);
  font-weight: 700;
  color: var(--color-text);
}

.slide__body {
  font-size: var(--fs-body);
  line-height: 1.7;
  color: var(--color-text-sub);
}

.slide__body--list {
  width: 100%;
  line-height: 1.9;
  text-align: left;
}

.slide__line {
  font-size: var(--fs-body);
  color: var(--color-text-sub);
}

.slide__dots {
  display: flex;
  gap: 12rpx;
  justify-content: center;
  margin: 56rpx 0;
}

.slide__dot {
  width: 12rpx;
  height: 12rpx;
  background: var(--color-disabled-bg);
  border-radius: 6rpx;
}

.slide__dot.on {
  width: 36rpx;
  background: var(--color-primary);
}

.guide__footer {
  padding: 24rpx 32rpx calc(48rpx + var(--safe-bottom));
}
</style>
