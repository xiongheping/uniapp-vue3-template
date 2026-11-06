<template>
  <x-page>
    <view class="elder-head">
      <text class="elder-head__h1">
        {{ nickname }}，你好
      </text>
      <text class="elder-head__sub">
        {{ cnDate() }}
      </text>
    </view>

    <!-- 下一剂：大字号 + 单一大按钮 -->
    <view class="elder-card elder-card--hero">
      <view class="elder-row">
        <text class="elder-emoji">
          💊
        </text>
        <view class="x-flex-1">
          <view class="elder-t1">
            {{ nextTitle }}
          </view>
          <view class="elder-t2">
            {{ nextSub }}
          </view>
        </view>
      </view>
      <view class="elder-btn">
        <x-button :text="nextEntry ? '✓ 我已经吃了' : '查看今天吃药'" @click="handleTake" />
      </view>
    </view>

    <!-- 临期提醒 -->
    <view class="elder-card x-tap-bg" hover-class="x-tap--hover" :hover-start-time="0" @tap="gotoHome">
      <view class="elder-row">
        <text class="elder-emoji">
          ⚠️
        </text>
        <view class="x-flex-1">
          <view class="elder-t1">
            有 {{ expiringCount }} 样东西快到期
          </view>
          <view class="elder-t2 elder-t2--warn">
            {{ expiringTip }}
          </view>
        </view>
        <text class="elder-more">
          看看 ›
        </text>
      </view>
    </view>

    <!-- 拍照添加 -->
    <view class="elder-card elder-card--center x-tap-bg" hover-class="x-tap--hover" :hover-start-time="0" @tap="gotoAdd">
      <text class="elder-emoji">
        📷
      </text>
      <view class="elder-t1">
        拍一下 · 添加新物品
      </view>
      <view class="elder-t2">
        把药盒上的日期对准框内
      </view>
    </view>

    <view class="elder-call">
      <x-button large text="联系家人帮忙" icon="phone" @click="callFamily" />
    </view>
    <text class="elder-tip">
      点击后：向小雨 / 父亲推送「需要协助」+ 一键拨号
    </text>

    <!-- 长辈模式退出 -->
    <view class="elder-exit x-tap-opacity" hover-class="x-tap-opacity--hover" :hover-start-time="0" @tap="exitElder">
      <text>退出长辈模式</text>
    </view>
  </x-page>
</template>

<script setup lang="ts">
import { HOME_PATH } from '@/router';
import { useItemStore, useMedicineStore, useSettingStore } from '@/store';
import { cnDate } from '@/utils/date';

/**
 * 长辈模式（原型 24）
 * 字号 16px 起、单列大卡片、单一大按钮；导航简化为 3 项（当前复用全局 tabbar）
 */
const settingStore = useSettingStore();
const medicineStore = useMedicineStore();
const itemStore = useItemStore();

const nickname = computed<string>(() => settingStore.nickname || '小明');

const nextEntry = computed(() => medicineStore.pendingEntries[0] || null);

const nextTitle = computed<string>(() => {
  const entry = nextEntry.value;
  if (!entry) {
    return '今天没有要吃的药';
  }
  return `${entry.time}：${entry.name} ${entry.amount || ''}`.trim();
});

const nextSub = computed<string>(() => {
  const entry = nextEntry.value;
  if (!entry) {
    return '点下面按钮可以看看今天的记录';
  }
  return `${entry.afterMeal || '按计划服用'} · 还没吃`;
});

const expiringCount = computed<number>(() => itemStore.stats.expiring + itemStore.stats.expired);

const expiringTip = computed<string>(() => {
  const first = itemStore.expiringList[0];
  if (!first) {
    return '暂时都还安全';
  }
  return `${first.name}还剩 ${first.dueDays} 天 · 要尽快用`;
});

function handleTake() {
  if (!nextEntry.value) {
    uni.navigateTo({ url: '/pages/tab/medicine/index' });
    return;
  }
  medicineStore.take(nextEntry.value.planId, nextEntry.value.doseId);
  uni.showToast({ title: '已记录，做得很好', icon: 'none' });
}

function gotoHome() {
  uni.redirectTo({ url: HOME_PATH });
}

function gotoAdd() {
  uni.navigateTo({ url: '/pages/item/add/index?method=camera' });
}

function callFamily() {
  uni.showModal({
    title: '联系家人',
    content: '将向小雨、父亲推送「需要协助」，并可直接拨号。',
    confirmText: '推送并拨号',
    success: ({ confirm }) => {
      if (confirm) {
        uni.makePhoneCall({ phoneNumber: '13800001234', fail: () => {} });
      }
    },
  });
}

function exitElder() {
  settingStore.setElder(false);
  uni.navigateBack();
}
</script>

<style lang="scss" scoped>
.elder-head {
  padding: 16rpx 8rpx 12rpx;
}

.elder-head__h1 {
  display: block;
  /* 原型 24 问候行内联 font-size:26px（=52rpx，内联覆盖 .h1 类级 22px），勿改回 44rpx */
  font-size: 52rpx;
  font-weight: 700;
  color: var(--color-text);
}

.elder-head__sub {
  display: block;
  margin-top: 8rpx;
  font-size: 32rpx;
  color: var(--color-text-sub);
}

.elder-card {
  padding: 36rpx;
  margin-bottom: 24rpx;
  background: var(--color-card);
  border-radius: 28rpx;
  box-shadow: var(--shadow-card);
}

.elder-card--hero {
  border: 5rpx solid var(--color-primary);
}

.elder-card--center {
  text-align: center;
}

.elder-card--center .elder-emoji {
  font-size: 80rpx;
}

.elder-card--center .elder-t1 {
  margin-top: 12rpx;
  font-size: 36rpx;
}

.elder-row {
  display: flex;
  gap: 24rpx;
  align-items: center;
}

.elder-emoji {
  font-size: 68rpx;
  line-height: 1;
}

.elder-t1 {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--color-text);
}

.elder-t2 {
  margin-top: 8rpx;
  font-size: 32rpx;
  color: var(--color-text-sub);
}

.elder-t2--warn {
  color: #c77700;
}

.elder-more {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--color-primary);
}

.elder-btn {
  margin-top: 28rpx;
}

.elder-call {
  margin-top: 8rpx;
}

.elder-tip {
  display: block;
  margin-top: 16rpx;
  /* 原型 .elder .sub{font-size:16px!important} 覆盖行内 13px → 16px=32rpx */
  font-size: 32rpx;
  color: var(--color-text-sub);
  text-align: center;
}

.elder-exit {
  padding: 40rpx 0 24rpx;
  font-size: 28rpx;
  color: var(--color-text-mute);
  text-align: center;
}
</style>
