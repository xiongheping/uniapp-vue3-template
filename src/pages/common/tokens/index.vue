<template>
  <x-page>
    <x-nav-bar title="Design Tokens" />

    <!-- 🎨 色彩（原型 25：色板 + 变量名 + 值） -->
    <x-card>
      <view class="tk-card-title">
        🎨 色彩
      </view>
      <view
        v-for="(c, i) in colors"
        :key="c.name"
        class="tk-row"
        :class="{ 'tk-row--last': i === colors.length - 1 }"
      >
        <view class="tk-swatch" :style="{ background: c.hex }" />
        <view class="tk-row__grow">
          <view class="tk-row__t1">
            {{ c.name }}
          </view>
          <view class="tk-row__t2">
            {{ c.value }}
          </view>
        </view>
      </view>
    </x-card>

    <!-- 📐 尺寸与间距 -->
    <x-card>
      <view class="tk-card-title">
        📐 尺寸与间距
      </view>
      <x-field
        v-for="(f, i) in sizing"
        :key="f.k"
        :label="f.k"
        :value="f.v"
        :last="i === sizing.length - 1"
      />
    </x-card>

    <!-- 🌗 阴影 / 层级 / 动效 -->
    <x-card>
      <view class="tk-card-title">
        🌗 阴影 / 层级 / 动效
      </view>
      <x-field
        v-for="(f, i) in effects"
        :key="f.k"
        :label="f.k"
        :value="f.v"
        :last="i === effects.length - 1"
      />
    </x-card>

    <!-- 🌙 暗黑映射 -->
    <x-card>
      <view class="tk-card-title">
        🌙 暗黑映射
      </view>
      <text class="tk-dark">
        {{ darkText }}
      </text>
    </x-card>
  </x-page>
</template>

<script setup lang="ts">
/**
 * Design Tokens（原型 25）：色彩 / 尺寸间距 / 阴影层级动效 / 暗黑映射
 * 展示型参考页，文案与色值 1:1 取自原型
 */
const colors = [
  { name: '--color-primary', value: '#4F7CFF', hex: '#4F7CFF' },
  { name: '--color-danger', value: '#FA5151', hex: '#FA5151' },
  { name: '--color-warning', value: '#FFA940', hex: '#FFA940' },
  { name: '--color-success', value: '#52C41A', hex: '#52C41A' },
  { name: '--color-text-secondary', value: '#6B7590 · 对比度 4.8:1 ✓', hex: '#6B7590' },
];

const sizing = [
  { k: '--radius-card', v: '16px' },
  { k: '--min-touch', v: '44dp（长辈 60dp）' },
  { k: '--font-body', v: '14px / caption 12px' },
  { k: '--space-1..8', v: '4 / 8 / 12 / 16 / 20 / 24 / 32 / 40' },
  { k: '--icon-sm/md/lg', v: '16 / 20 / 24' },
  { k: '--safe-bottom', v: 'env(safe-area-inset-bottom)' },
];

const effects = [
  { k: '--shadow-card', v: '0 1px 3px rgba(20,30,60,.04)' },
  { k: '--z-tabbar / sticky / fab / modal / toast', v: '15 / 10 / 16 / 25 / 30' },
  { k: '--motion-fast / base', v: '150ms / 240ms ease-out' },
];

const darkText = [
  '--color-bg: #12141A',
  '--color-card: #1C2029',
  '--color-border: #2A2F3A',
  '--color-text: #F0F2F6',
  '--color-text-secondary: #8A93A5',
  '--color-note-bg / --color-tag-* 均单独定义',
  '--color-plan-bg / --color-plan-hot-bg / --color-matrix-border / --color-prd-bg 单独定义',
].join('\n');
</script>

<style lang="scss" scoped>
/* 原型 25 规格：卡标题 12px/700；色彩行 32px 色块 + t1 12px + t2 12px；暗映射 12px/1.9 */
.tk-card-title {
  margin-bottom: 16rpx;
  font-size: 24rpx;
  font-weight: 700;
}

.tk-row {
  display: flex;
  gap: 20rpx;
  align-items: center;
  min-height: 96rpx;
  padding: 22rpx 0;
  border-bottom: 2rpx solid var(--color-divider);
}

.tk-row--last {
  border-bottom: none;
}

.tk-swatch {
  flex-shrink: 0;
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
}

.tk-row__grow {
  flex: 1;
  min-width: 0;
}

.tk-row__t1 {
  font-size: 24rpx;
  font-weight: 600;
  color: var(--color-text);
}

.tk-row__t2 {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: var(--color-text-sub);
}

.tk-dark {
  display: block;
  font-size: 24rpx;
  line-height: 1.9;
  color: #5b6478;
}
</style>
