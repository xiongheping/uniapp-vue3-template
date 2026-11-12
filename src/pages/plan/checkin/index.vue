<template>
  <x-page :padded="false">
    <x-nav-bar :title="meta.title" back="close">
      <template #right>
        <view class="pl-lock">
          <x-icon name="lock" :size="28" color="#7B8494" />
          <text>仅你可见</text>
        </view>
      </template>
    </x-nav-bar>

    <view class="pl-body">
      <view class="pl-hero">
        <view class="pl-hero__ico" :style="{ background: meta.bg }">
          <x-icon :name="meta.icon" :size="88" :color="meta.fg" />
        </view>
        <view class="pl-hero__title">
          {{ meta.headline }}
        </view>
        <view class="pl-hero__sub">
          {{ meta.sub }}
        </view>
        <view v-if="isMed" class="pl-hero__tag">
          <x-tag type="blue">
            感冒发烧 · 第 5/7 天
          </x-tag>
        </view>

        <view class="pl-qty">
          <view class="pl-qty__btn" aria-label="减少" hover-class="pl-qty__btn--hover" :hover-start-time="0" @tap="stepQty(-1)">
            <x-icon name="minus" :size="32" color="#4F7CFF" />
          </view>
          <view class="pl-qty__val">
            <input
              class="pl-qty__num"
              type="number"
              :value="String(qty)"
              :maxlength="4"
              @input="onQtyInput"
              @blur="onQtyBlur"
            >
            <text class="pl-qty__unit">
              {{ meta.unit }}
            </text>
            <x-icon name="chev-d" :size="28" color="#8FB0FF" />
          </view>
          <view class="pl-qty__btn" aria-label="增加" hover-class="pl-qty__btn--hover" :hover-start-time="0" @tap="stepQty(1)">
            <x-icon name="plus" :size="32" color="#4F7CFF" />
          </view>
        </view>
        <view v-if="!isMed" class="pl-hero__hint">
          点数字可直接输入
        </view>
      </view>

      <view class="pl-cta" hover-class="pl-cta--hover" :hover-start-time="0" @tap="checkin">
        <x-icon name="check" :size="32" color="#FFFFFF" />
        <text>{{ ctaText }}</text>
      </view>

      <view class="pl-ghostrow">
        <view class="pl-ghost" :class="{ 'pl-ghost--disabled': laterLeft === 0 }" @tap="later">
          <text>稍后 15 分钟 · 还可稍后 {{ laterLeft }} 次</text>
        </view>
        <view class="pl-ghost pl-ghost--muted" @tap="skip">
          <text>跳过本次</text>
        </view>
      </view>

      <!-- 喝水：今日记录 -->
      <x-card v-if="!isMed" class="pl-record">
        <view class="pl-record__title">
          今日喝水记录
        </view>
        <view v-for="row in waterRows" :key="row.time" class="pl-record__row" :class="{ 'pl-record__row--last': row.status === 'todo' }">
          <text class="pl-record__tm" :class="`pl-record__tm--${row.status}`">
            {{ row.time }}
          </text>
          <view class="x-flex-1">
            <view class="pl-record__t1" :class="`pl-record__t1--${row.status}`">
              {{ row.text }}
            </view>
          </view>
          <x-tag :type="row.status === 'done' ? 'green' : 'gray'">
            {{ row.status === 'done' ? '✓' : row.status === 'doing' ? '待打卡' : '未开始' }}
          </x-tag>
        </view>
      </x-card>

      <!-- 用药：说明书原文 -->
      <view v-else class="pl-manual">
        <view class="pl-manual__title">
          <x-icon name="file-text" :size="28" color="#4A2E8C" />
          <text>说明书原文</text>
        </view>
        <view class="pl-manual__body">
          “口服。成人，一次 1 粒，一日 2 次。”
        </view>
      </view>
    </view>

    <view v-if="snackShow" class="pl-snack">
      <x-icon :name="snackIcon" :size="28" color="#FFFFFF" />
      <text class="pl-snack__text">
        {{ snackText }}
      </text>
      <view class="pl-snack__undo" @tap="undo">
        <x-icon name="undo" :size="28" color="#8FB0FF" />
        <text>撤销 · {{ undoSeconds }}s</text>
      </view>
      <view :key="snackKey" class="pl-snack__bar" :class="{ 'pl-snack__bar--60': undoSeconds === 60 }" />
    </view>
  </x-page>
</template>

<script setup lang="ts">
/**
 * 原型 P6 / P6b：计划打卡（?kind=water|medication）
 * 撤销窗口：喝水 30s / 用药 60s；跳过不计连续天数
 */
interface WaterRow {
  time: string;
  text: string;
  status: 'done' | 'doing' | 'todo';
}

const isMed = ref<boolean>(false);
const qty = ref<number>(300);
const laterLeft = ref<number>(3);

const waterRows = ref<WaterRow[]>([
  { time: '08:02', text: '300ml', status: 'done' },
  { time: '10:00', text: '300ml · 进行中', status: 'doing' },
  { time: '12:00', text: '300ml · 午饭后', status: 'todo' },
]);

const meta = computed(() => (isMed.value
  ? {
      title: '晚间用药',
      headline: '该吃药了',
      sub: '布洛芬缓释胶囊 · 晚餐后 30 分钟',
      cta: '我已服用',
      unit: '粒',
      icon: 'pill',
      fg: '#C77700',
      bg: '#FFF4E5',
    }
  : {
      title: '喝水',
      headline: '该喝水了',
      sub: '今天第 2 / 6 杯 · 已完成 300 / 1800ml',
      cta: '我已喝了',
      unit: 'ml',
      icon: 'droplet',
      fg: '#1677FF',
      bg: '#E6F4FF',
    }));

/** "我已喝了 300ml" / "我已服用 1 粒"：整串拼接，避免插值间的空格被模板裁剪 */
const ctaText = computed<string>(() => (isMed.value
  ? `${meta.value.cta} ${qty.value} ${meta.value.unit}`
  : `${meta.value.cta} ${qty.value}${meta.value.unit}`));

const snackShow = ref<boolean>(true);
const snackText = ref<string>('已记录 10:02 喝水 300ml');
const snackIcon = ref<string>('check');
const snackKey = ref<number>(0);
const undoSeconds = ref<number>(30);
let snackTimer: ReturnType<typeof setTimeout> | null = null;

onLoad((options) => {
  isMed.value = String(options?.kind || '') === 'medication';
  if (isMed.value) {
    qty.value = 1;
    undoSeconds.value = 60;
    snackText.value = '已记录 20:02 服用 1 粒';
  }
  startSnackTimer();
});

onUnload(() => {
  if (snackTimer) {
    clearTimeout(snackTimer);
  }
});

function nowText(): string {
  const date = new Date();
  const h = `${date.getHours()}`.padStart(2, '0');
  const m = `${date.getMinutes()}`.padStart(2, '0');
  return `${h}:${m}`;
}

function showSnack(text: string, icon = 'check') {
  snackText.value = text;
  snackIcon.value = icon;
  snackShow.value = true;
  snackKey.value += 1;
  startSnackTimer();
}

function startSnackTimer() {
  if (snackTimer) {
    clearTimeout(snackTimer);
  }
  snackTimer = setTimeout(() => {
    snackShow.value = false;
  }, undoSeconds.value * 1000);
}

function doseText(value: number): string {
  return isMed.value ? `${value} 粒` : `${value}ml`;
}

function checkin() {
  if (!isMed.value) {
    const current = waterRows.value.find(item => item.status === 'doing');
    if (current) {
      current.status = 'done';
      current.time = nowText();
      current.text = `${qty.value}ml`;
    }
  }
  showSnack(`已记录 ${nowText()} ${isMed.value ? '服用' : '喝水'} ${doseText(qty.value)}`);
}

function stepQty(delta: number) {
  const next = qty.value + delta * (isMed.value ? 1 : 50);
  if (next < (isMed.value ? 1 : 50)) {
    return;
  }
  qty.value = next;
}

/** 数量输入：输入过程只接受正整数，失焦时再夹到下限 */
function onQtyInput(e: { detail: { value: string } }) {
  const next = Number.parseInt(e.detail.value, 10);
  if (!Number.isNaN(next) && next > 0) {
    qty.value = next;
  }
}

function onQtyBlur() {
  const min = isMed.value ? 1 : 50;
  if (qty.value < min) {
    qty.value = min;
  }
}

function later() {
  if (laterLeft.value === 0) {
    uni.showToast({ title: '本次已不能稍后', icon: 'none' });
    return;
  }
  laterLeft.value -= 1;
  uni.showToast({ title: '15 分钟后再提醒你', icon: 'none' });
}

function skip() {
  if (!isMed.value) {
    const current = waterRows.value.find(item => item.status === 'doing');
    if (current) {
      current.status = 'todo';
      current.text = `${qty.value}ml · 已跳过`;
    }
  }
  showSnack(`已跳过 ${nowText()} 本次 · 不计连续天数`, 'x');
}

function undo() {
  if (!isMed.value) {
    const last = waterRows.value[1];
    if (last) {
      last.status = 'doing';
      last.time = '10:00';
      last.text = '300ml · 进行中';
    }
  }
  snackShow.value = false;
  if (snackTimer) {
    clearTimeout(snackTimer);
  }
  uni.showToast({ title: '已撤销', icon: 'none' });
}
</script>

<style lang="scss" scoped>
.pl-body {
  padding: 0 32rpx 48rpx;
}

.pl-lock {
  display: flex;
  gap: 6rpx;
  align-items: center;
  padding: 6rpx 18rpx;
  font-size: 22rpx;
  font-weight: 600;
  color: #7b8494;
  white-space: nowrap;
  background: #f0f2f6;
  border-radius: 16rpx;
}

/* 打卡头图 */
.pl-hero {
  position: relative;
  padding: 48rpx 36rpx;
  margin-bottom: 28rpx;
  overflow: hidden;
  text-align: center;
  background: linear-gradient(160deg, #f2f6ff, #fafbff);
  border-radius: 40rpx;

  &::before {
    position: absolute;
    top: -140rpx;
    right: -100rpx;
    width: 360rpx;
    height: 360rpx;
    content: '';
    background: radial-gradient(circle, rgb(79 124 255 / 10%), transparent 70%);
    border-radius: 50%;
  }
}

.pl-hero__ico {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 144rpx;
  height: 144rpx;
  margin: 0 auto 24rpx;
  border-radius: 44rpx;
}

.pl-hero__title {
  position: relative;
  z-index: 1;
  margin-bottom: 12rpx;
  font-size: 38rpx;
  font-weight: 700;
  color: var(--color-text);
}

.pl-hero__sub {
  position: relative;
  z-index: 1;
  font-size: 26rpx;
  color: #6b7590;
}

.pl-hero__tag {
  position: relative;
  z-index: 1;
  margin-top: 16rpx;
}

.pl-hero__hint {
  position: relative;
  z-index: 1;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #8a93a5;
}

/* 数量步进 */
.pl-qty {
  position: relative;
  z-index: 1;
  display: inline-flex;
  gap: 32rpx;
  align-items: center;
  margin: 28rpx 0 8rpx;
}

.pl-qty__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  background: #ffffff;
  border: 2rpx solid #d9dee8;
  border-radius: 24rpx;

  &--hover {
    background: #f7f9ff;
  }
}

.pl-qty__val {
  display: inline-flex;
  gap: 12rpx;
  align-items: center;
  min-height: 88rpx;
  padding: 16rpx 28rpx;
  background: #ffffff;
  border: 3rpx solid #e4ecff;
  border-radius: 28rpx;
}

.pl-qty__num {
  width: 140rpx;
  min-width: 140rpx;
  height: 64rpx;
  font-size: 44rpx;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 64rpx;
  color: var(--color-primary);
  text-align: center;
}

.pl-qty__unit {
  font-size: 24rpx;
  font-weight: 600;
  color: #8a93a5;
}

/* 主按钮 */
.pl-cta {
  display: flex;
  gap: 16rpx;
  align-items: center;
  justify-content: center;
  min-height: 112rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: #ffffff;
  background: var(--color-primary);
  border-radius: 28rpx;

  &--hover {
    opacity: 0.9;
  }
}

.pl-ghostrow {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}

.pl-ghost {
  box-sizing: border-box;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 88rpx;
  padding: 0 12rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--color-primary);
  text-align: center;
  background: #ffffff;
  border: 2rpx solid var(--color-primary);
  border-radius: 24rpx;

  &--muted {
    color: #8a93a5;
    border-color: #e4e8f0;
  }

  &--disabled {
    color: #b0b7c3;
    border-color: #e4e8f0;
  }
}

/* 今日记录 */
.pl-record {
  margin-top: 32rpx;
}

.pl-record__title {
  margin-bottom: 16rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: var(--color-text);
}

.pl-record__row {
  display: flex;
  gap: 20rpx;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 2rpx solid var(--color-divider);

  &--last {
    border-bottom: none;
  }
}

.pl-record__tm {
  flex-shrink: 0;
  min-width: 96rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: var(--color-primary);

  &--doing {
    color: #8a93a5;
  }

  &--todo {
    color: #b0b7c3;
  }
}

.pl-record__t1 {
  font-size: 26rpx;
  color: var(--color-text);

  &--doing {
    color: #8a93a5;
  }

  &--todo {
    color: #b0b7c3;
  }
}

/* 说明书原文 */
.pl-manual {
  padding: 28rpx;
  margin-top: 32rpx;
  background: #f8f4ff;
  border: 2rpx solid #e4d9ff;
  border-radius: 28rpx;
}

.pl-manual__title {
  display: flex;
  gap: 12rpx;
  align-items: center;
  margin-bottom: 12rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: #4a2e8c;
}

.pl-manual__body {
  font-size: 26rpx;
  line-height: 1.7;
  color: #4a2e8c;
}

/* 打卡反馈条 */
.pl-snack {
  position: fixed;
  right: 32rpx;
  bottom: calc(96rpx + env(safe-area-inset-bottom, 0px));
  left: 32rpx;
  z-index: 30;
  display: flex;
  gap: 16rpx;
  align-items: center;
  padding: 28rpx 32rpx 34rpx;
  overflow: hidden;
  font-size: 26rpx;
  color: #ffffff;
  background: rgb(20 30 60 / 94%);
  border-radius: 28rpx;
}

.pl-snack__text {
  flex: 1;
}

.pl-snack__undo {
  display: flex;
  flex-shrink: 0;
  gap: 8rpx;
  align-items: center;
  min-height: 88rpx;
  font-weight: 700;
  color: #8fb0ff;
}

.pl-snack__bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 84%;
  height: 6rpx;
  background: #8fb0ff;
  animation: pl-bar-shrink 30s linear forwards;

  &--60 {
    animation-duration: 60s;
  }
}

@keyframes pl-bar-shrink {
  from {
    width: 84%;
  }

  to {
    width: 0;
  }
}
</style>
