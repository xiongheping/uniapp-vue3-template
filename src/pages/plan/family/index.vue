<template>
  <x-page :tab="tabPath">
    <view class="fa-status" />
    <view class="fa-hdr">
      <view class="x-flex-1">
        <view class="fa-hdr__h1">
          妈妈的计划
        </view>
        <view class="fa-hdr__sub">
          {{ dateText }}
        </view>
      </view>
      <view class="fa-lock">
        <x-icon name="users" :size="28" color="#7B8494" />
        <text>家人共享</text>
      </view>
    </view>

    <view class="fa-banner">
      <x-icon name="eye" :size="32" color="#2C3E7A" />
      <view class="x-flex-1">
        <view class="fa-banner__title">
          你正在查看妈妈共享的计划
        </view>
        <view class="fa-banner__sub">
          可以帮忙打卡；名称、时段等设置由她本人修改。
        </view>
      </view>
    </view>

    <view class="fa-hero">
      <view class="fa-hero__top">
        <view class="fa-hero__date">
          今天 {{ doneCount }} / {{ totalCount }} 项
          <text class="fa-hero__pct">
            {{ percent }}%
          </text>
        </view>
        <view class="fa-hero__acts">
          <view class="fa-hero__btn" aria-label="统计与历史" @tap="notReady('统计与历史')">
            <x-icon name="more" :size="32" color="#FFFFFF" />
          </view>
        </view>
      </view>
      <view class="fa-hero__bar">
        <view class="fa-hero__bar-in" :style="{ width: `${percent}%` }" />
      </view>
    </view>

    <view class="fa-next">
      <view class="fa-next__eyebrow">
        <view class="fa-next__tag">
          <x-icon name="clock" :size="28" color="#4F7CFF" />
          <text>接下来 · 12:00</text>
        </view>
        <view class="fa-count">
          <x-icon name="clock" :size="28" color="#3A2600" />
          <text>还有 2 小时</text>
        </view>
      </view>
      <view class="fa-next__body">
        <view class="fa-next__ico" :style="{ background: pill.bg }">
          <x-icon :name="pill.icon" :size="48" :color="pill.fg" />
        </view>
        <view class="x-flex-1">
          <view class="fa-next__t1">
            二甲双胍 1 片
          </view>
          <view class="fa-next__t2">
            午餐后 · 由妈妈设置
          </view>
        </view>
      </view>
      <view class="fa-acts">
        <view class="fa-btn fa-btn--primary" @tap="checkin('二甲双胍 1 片')">
          <x-icon name="check" :size="28" color="#FFFFFF" />
          <text>代为打卡</text>
        </view>
        <view class="fa-btn fa-btn--ghost" @tap="later">
          <text>稍后 15 分</text>
        </view>
      </view>
    </view>

    <view class="fa-donegroup" @tap="notReady('展开已完成')">
      <view class="fa-donegroup__text">
        <view class="fa-donegroup__b">
          <x-icon name="check" :size="28" color="#2E7D32" />
          <text>已完成 {{ doneCount }} 项</text>
        </view>
        <text>：用药 08:00 · 测血压 08:30</text>
      </view>
      <view class="fa-donegroup__exp">
        <text>展开</text>
        <x-icon name="chev-d" :size="28" color="#7B8494" />
      </view>
    </view>

    <view class="fa-card fa-card--health">
      <view class="fa-card__hd">
        <view class="fa-card__ico" :style="{ background: health.bg }">
          <x-icon :name="health.icon" :size="48" :color="health.fg" />
        </view>
        <view class="fa-card__time">
          <text>20:00</text>
          <text class="fa-card__kicker">
            血压
          </text>
        </view>
        <view class="x-flex-1">
          <view class="fa-card__t1">
            测血压 · 记录数值
          </view>
          <view class="fa-card__meta">
            每天 2 次 · 由妈妈设置
          </view>
        </view>
        <view class="fa-card__more" aria-label="管理计划" @tap.stop="openManage">
          <x-icon name="more" :size="32" color="#8A93A5" />
        </view>
      </view>
      <view class="fa-acts">
        <view class="fa-btn fa-btn--primary" @tap="checkin('测血压')">
          <x-icon name="check" :size="28" color="#FFFFFF" />
          <text>代为打卡</text>
        </view>
        <view class="fa-btn fa-btn--ghost" @tap="later">
          <text>稍后 15 分</text>
        </view>
      </view>
    </view>

    <x-sheet v-model:show="manageShow" title="血压计划" sub="家人共享 · 仅可查看与代打卡">
      <view class="fa-menu">
        <view class="fa-menu__item" @tap="onManage('history')">
          <x-icon name="history" :size="32" color="#6B7590" />
          <text>查看打卡历史</text>
        </view>
        <view class="fa-menu__item fa-menu__item--danger" @tap="onManage('unfollow')">
          <x-icon name="x" :size="32" color="#D93025" />
          <text>取消关注</text>
        </view>
      </view>
      <template #footer>
        <x-button type="link" text="取消" @click="manageShow = false" />
      </template>
    </x-sheet>
  </x-page>
</template>

<script setup lang="ts">
import type { PlanKind } from '@/mock/plan';
import { planKind } from '@/mock/plan';
import { cnDate } from '@/utils/date';

/**
 * 原型 P8：家人共享视角（只读 + 可代打卡）
 * 代打卡会在记录里标注「由家人代打卡」，设置项归创建者
 */
const tabPath = '/pages/tab/plan/index';
const dateText = cnDate();
const doneCount = 2;
const totalCount = 4;
const percent = 50;

const pill = planKind('medication' as PlanKind);
const health = planKind('health' as PlanKind);

const manageShow = ref<boolean>(false);

function openManage() {
  manageShow.value = true;
}

function onManage(key: string) {
  manageShow.value = false;
  if (key === 'unfollow') {
    uni.showToast({ title: '已取消关注（演示）', icon: 'none' });
    return;
  }
  notReady('打卡历史');
}

function checkin(title: string) {
  uni.showToast({ title: `已代为打卡：${title}`, icon: 'none' });
}

function later() {
  uni.showToast({ title: '15 分钟后再提醒', icon: 'none' });
}

function notReady(label: string) {
  uni.showToast({ title: `${label}（演示页暂未接入）`, icon: 'none' });
}
</script>

<style lang="scss" scoped>
/* 原型 P8 为全屏页，需自行让出状态栏高度（无 x-nav-bar） */
.fa-status {
  height: var(--status-bar-height, 40rpx);
}

.fa-hdr {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
  padding: 8rpx 0 20rpx;
}

.fa-hdr__h1 {
  font-size: var(--fs-h1);
  font-weight: 700;
  color: var(--color-text);
}

.fa-hdr__sub {
  margin-top: 6rpx;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}

.fa-lock {
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

.fa-banner {
  display: flex;
  gap: 20rpx;
  align-items: flex-start;
  padding: 24rpx 28rpx;
  margin-bottom: 24rpx;
  font-size: 26rpx;
  line-height: 1.6;
  color: #2c3e7a;
  background: #f0f5ff;
  border: 2rpx solid #d6e2ff;
  border-radius: 28rpx;
}

.fa-banner__title {
  display: flex;
  gap: 12rpx;
  align-items: center;
  font-weight: 700;
}

.fa-banner__sub {
  margin-top: 6rpx;
  font-size: 24rpx;
  opacity: 0.9;
}

/* 今日进度 */
.fa-hero {
  position: relative;
  padding: 32rpx 36rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
  color: #ffffff;
  background: linear-gradient(135deg, #4f7cff, #7b5cff);
  border-radius: 40rpx;

  &::after {
    position: absolute;
    top: -120rpx;
    right: -100rpx;
    width: 320rpx;
    height: 320rpx;
    content: '';
    background: rgb(255 255 255 / 6%);
    border-radius: 50%;
  }
}

.fa-hero__top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.fa-hero__date {
  font-size: 28rpx;
  font-weight: 700;
}

.fa-hero__pct {
  margin-left: 12rpx;
  font-size: 24rpx;
  font-weight: 600;
  opacity: 0.8;
}

.fa-hero__acts {
  display: flex;
  gap: 12rpx;
  align-items: center;
  margin: -12rpx -16rpx -12rpx 0;
}

.fa-hero__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  background: rgb(255 255 255 / 14%);
  border-radius: 20rpx;
}

.fa-hero__bar {
  position: relative;
  z-index: 1;
  height: 12rpx;
  margin-top: 24rpx;
  overflow: hidden;
  background: rgb(255 255 255 / 22%);
  border-radius: 6rpx;
}

.fa-hero__bar-in {
  height: 100%;
  background: #ffffff;
  border-radius: 6rpx;
}

/* 接下来 */
.fa-next {
  position: relative;
  padding: 32rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  background: #ffffff;
  border: 4rpx solid #4f7cff;
  border-radius: 36rpx;
  box-shadow: 0 12rpx 48rpx rgb(79 124 255 / 14%);

  &::before {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 10rpx;
    content: '';
    background: linear-gradient(180deg, #4f7cff, #7b5cff);
  }
}

.fa-next__eyebrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.fa-next__tag {
  display: flex;
  gap: 10rpx;
  align-items: center;
  font-size: 22rpx;
  font-weight: 700;
  color: #4f7cff;
  letter-spacing: 0.6rpx;
}

.fa-count {
  display: inline-flex;
  gap: 6rpx;
  align-items: center;
  padding: 6rpx 16rpx;
  font-size: 22rpx;
  font-weight: 700;
  color: #3a2600;
  background: #ffd666;
  border-radius: 16rpx;
}

.fa-next__body {
  display: flex;
  gap: 24rpx;
  align-items: center;
  margin-bottom: 24rpx;
}

.fa-next__ico {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 96rpx;
  height: 96rpx;
  border-radius: 28rpx;
}

.fa-next__t1 {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--color-text);
}

.fa-next__t2 {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #8a93a5;
}

/* 双按钮 */
.fa-acts {
  display: flex;
  gap: 12rpx;
}

.fa-btn {
  box-sizing: border-box;
  display: flex;
  gap: 8rpx;
  align-items: center;
  justify-content: center;
  min-height: 88rpx;
  font-size: 26rpx;
  font-weight: 600;
  border-radius: 24rpx;

  &--primary {
    flex: 1;
    color: #ffffff;
    background: var(--color-primary);
  }

  &--ghost {
    flex: 0 0 auto;
    padding: 0 28rpx;
    color: #8a93a5;
    background: #ffffff;
    border: 2rpx solid #e4e8f0;
  }
}

/* 已完成摘要 */
.fa-donegroup {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 96rpx;
  padding: 16rpx 28rpx;
  margin-bottom: 20rpx;
  font-size: 24rpx;
  color: #7b8494;
  background: #fafbfd;
  border: 2rpx dashed #d9dee8;
  border-radius: 24rpx;
}

.fa-donegroup__text {
  flex: 1;
  min-width: 0;
}

.fa-donegroup__b {
  display: inline-flex;
  gap: 10rpx;
  align-items: center;
  font-weight: 700;
  color: #2e7d32;
}

.fa-donegroup__exp {
  display: inline-flex;
  flex-shrink: 0;
  gap: 6rpx;
  align-items: center;
  margin-left: 12rpx;
  font-weight: 600;
}

/* 计划卡 */
.fa-card {
  padding: 28rpx;
  margin-bottom: 20rpx;
  background: #ffffff;
  border-left: 8rpx solid #4f7cff;
  border-radius: 32rpx;
  box-shadow: 0 2rpx 6rpx rgb(20 30 60 / 4%);

  &--health {
    border-left-color: #d93025;
  }
}

.fa-card__hd {
  display: flex;
  gap: 20rpx;
  align-items: center;
  margin-bottom: 20rpx;
}

.fa-card__ico {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 76rpx;
  height: 76rpx;
  border-radius: 22rpx;
}

.fa-card__time {
  flex-shrink: 0;
  min-width: 96rpx;
  font-size: 32rpx;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--color-text);
}

.fa-card__kicker {
  display: block;
  margin-top: -2rpx;
  font-size: 20rpx;
  font-weight: 600;
  color: #8a93a5;
}

.fa-card__t1 {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--color-text);
}

.fa-card__meta {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #8a93a5;
}

.fa-card__more {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  margin: -8rpx -12rpx -8rpx 0;
  border-radius: 24rpx;
}

/* 管理菜单 */
.fa-menu {
  overflow: hidden;
}

.fa-menu__item {
  display: flex;
  gap: 16rpx;
  align-items: center;
  min-height: 104rpx;
  padding: 0 8rpx;
  font-size: var(--fs-body);
  color: var(--color-text);
  border-bottom: 2rpx solid var(--color-divider);

  &:last-child {
    border-bottom: none;
  }

  &--danger {
    color: var(--color-danger);
  }
}
</style>
