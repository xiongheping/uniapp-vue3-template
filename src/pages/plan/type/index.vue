<template>
  <x-page>
    <x-nav-bar title="添加计划" />

    <x-note type="blue" class="pl-note">
      选一个类型，我们帮你预填好频率和时段，你只改数字就行。
    </x-note>

    <view class="pl-grid">
      <view v-for="item in PLAN_TEMPLATES" :key="item.key" class="pl-tpl" @tap="pick(item.key)">
        <text v-if="item.tag" class="pl-tpl__tag">
          {{ item.tag }}
        </text>
        <view class="pl-tpl__ico" :style="{ background: planKind(item.key).bg }">
          <x-icon :name="planKind(item.key).icon" :size="48" :color="planKind(item.key).fg" />
        </view>
        <text class="pl-tpl__name">
          {{ item.name }}
        </text>
        <text v-for="(line, index) in item.desc" :key="index" class="pl-tpl__desc">
          {{ line }}
        </text>
      </view>
    </view>

    <view class="pl-custom" @tap="pick('custom')">
      <view class="pl-custom__ico">
        <x-icon name="plus" :size="32" color="#8A93A5" />
      </view>
      <view class="x-flex-1">
        <view class="pl-custom__name">
          <text>自定义计划</text>
          <text class="pl-custom__badge">
            兜底选项
          </text>
        </view>
        <view class="pl-custom__desc">
          模板没覆盖就用它：滴眼药水、遛弯、通风……
        </view>
      </view>
      <x-icon name="chev-r" :size="32" color="#C0C6D2" />
    </view>

    <x-note type="blue" class="pl-note pl-note--last">
      <view class="pl-note__row">
        <x-icon name="bell" :size="32" color="#4F7CFF" />
        <view class="x-flex-1">
          <text>提醒分两档：</text>
          <text class="pl-note__b">
            到点强提醒
          </text>
          <text>（用药、血压必开，不可关）；</text>
          <text class="pl-note__b">
            温和提醒
          </text>
          <text>（喝水等，每天最多 2 条，可在设置里关）。</text>
        </view>
      </view>
    </x-note>
  </x-page>
</template>

<script setup lang="ts">
import type { PlanKind } from '@/mock/plan';
import { PLAN_TEMPLATES, planKind } from '@/mock/plan';

/**
 * 原型 P3：添加计划 · 选择类型（6 个模板 + 降权后的自定义入口）
 */
function pick(key: PlanKind) {
  uni.navigateTo({ url: `/pages/plan/create/index?type=${key}` });
}
</script>

<style lang="scss" scoped>
.pl-note {
  &--last {
    margin-top: 28rpx;
  }
}

.pl-note__row {
  display: flex;
  gap: 20rpx;
  align-items: flex-start;
}

.pl-note__b {
  font-weight: 700;
}

.pl-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-top: 8rpx;
}

.pl-tpl {
  position: relative;
  box-sizing: border-box;
  width: calc(50% - 10rpx);
  padding: 28rpx 24rpx;
  text-align: center;
  background: #ffffff;
  border: 3rpx solid #e4e8f0;
  border-radius: 32rpx;
}

.pl-tpl__tag {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  padding: 2rpx 12rpx;
  font-size: 18rpx;
  font-weight: 700;
  color: #2e7d32;
  background: #e6f7e6;
  border-radius: 12rpx;
}

.pl-tpl__ico {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  margin: 0 auto 16rpx;
  border-radius: 26rpx;
}

.pl-tpl__name {
  display: block;
  margin-bottom: 6rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: var(--color-text);
}

.pl-tpl__desc {
  display: block;
  font-size: 22rpx;
  line-height: 1.4;
  color: #8a93a5;
}

.pl-custom {
  display: flex;
  gap: 24rpx;
  align-items: center;
  min-height: 128rpx;
  padding: 24rpx 28rpx;
  margin-top: 20rpx;
  background: #ffffff;
  border: 2rpx solid #eef0f5;
  border-radius: 28rpx;
}

.pl-custom__ico {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 76rpx;
  height: 76rpx;
  color: #8a93a5;
  background: #f5f7fb;
  border-radius: 22rpx;
}

.pl-custom__name {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  align-items: center;
  margin-bottom: 4rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: #5b6478;
}

.pl-custom__badge {
  padding: 2rpx 12rpx;
  font-size: 18rpx;
  font-weight: 700;
  color: #7b8494;
  background: #eef0f5;
  border-radius: 10rpx;
}

.pl-custom__desc {
  font-size: 22rpx;
  line-height: 1.5;
  color: #a0a8b8;
}
</style>
