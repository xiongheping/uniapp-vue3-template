<template>
  <x-page tab="/pages/tab/message/index">
    <x-nav-bar :back="false" right-text="全部已读" @right="handleReadAll">
      <text class="msg-h1">
        消息
      </text>
    </x-nav-bar>

    <x-banner text="🔔 通知权限未开启，可能漏提醒" action="去开启 ›" @action="handleOpenNotify" />

    <x-note type="blue">
      🌙 免打扰 {{ silentText }} · 服药提醒不受此限制。当前 badge 为 P0 未读数。
    </x-note>

    <!-- P0 必达 -->
    <template v-if="mustList.length">
      <x-group-bar :title="`🚨 必达 · 服药 ${mustList.length}`" />
      <view v-for="msg in mustList" :key="msg.id" class="msg-must" :class="{ 'is-read': msg.read }">
        <view class="msg-must__tap" hover-class="msg-must__tap--hover" @tap="openMessage(msg)">
          <x-icon :name="msg.icon || 'pill'" :size="48" color="#4F7CFF" />
          <view class="x-flex-1">
            <view class="msg-row__t1">
              <text>{{ msg.title }}</text>
              <text v-if="!msg.read" class="msg-dot" />
            </view>
            <view class="msg-row__t2">
              {{ msg.sub }}
            </view>
          </view>
          <text class="msg-row__time">
            {{ msg.time }}
          </text>
        </view>
        <view v-if="targetOf(msg)" class="x-btns row msg-must__btns">
          <x-button text="✓ 已服用" small @click="quickTake(msg)" />
          <x-button
            type="ghost"
            small
            class="msg-snooze"
            :disabled="snoozeBlocked(msg)"
            :text="snoozeText(msg)"
            @click="quickSnooze(msg)"
          />
        </view>
      </view>
    </template>

    <!-- P1 今日摘要：可左滑（已读 / 删除），与原型 14 一致 -->
    <template v-if="digestList.length">
      <x-group-bar title="📬 今日摘要 · 可左滑 · 点卡片查看" />
      <view v-for="msg in digestList" :key="msg.id" class="msg-swipe">
        <view class="msg-swipe__actions">
          <view class="msg-swipe__read" @tap.stop="handleRead(msg)">
            已读
          </view>
          <view class="msg-swipe__del" @tap.stop="handleRemove(msg)">
            删除
          </view>
        </view>
        <view
          class="msg-item"
          :class="{ 'msg-item--head': !msg.swipeable }"
          :style="{ transform: `translateX(${offsetOf(msg.id)}px)` }"
          hover-class="msg-item--hover"
          @touchstart="onTouchStart($event, msg.id)"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd(msg)"
          @tap="openMessage(msg)"
        >
          <x-icon :name="msg.icon || 'package'" :size="40" :color="iconColor(msg)" />
          <view class="x-flex-1">
            <view class="msg-row__t1">
              <text>{{ msg.title }}</text>
              <text v-if="!msg.read" class="msg-dot" />
            </view>
            <view class="msg-row__t2">
              {{ msg.sub }}
            </view>
          </view>
          <x-tag :type="msg.level === 'P1' ? 'orange' : 'green'">
            {{ msg.level }}
          </x-tag>
        </view>
      </view>
    </template>

    <!-- P2 已处理 / 家庭变更 -->
    <template v-if="historyList.length">
      <x-group-bar :title="`🗂 已处理 · 家庭 ${historyList.length}`" more="长按可删除" />
      <view
        v-for="msg in historyList"
        :key="msg.id"
        class="msg-item"
        hover-class="msg-item--hover"
        @tap="openMessage(msg)"
        @longpress="handleLongPress(msg)"
      >
        <x-icon :name="msg.icon || 'check'" :size="40" color="#2E7D32" />
        <view class="x-flex-1">
          <view class="msg-row__t1">
            <text>{{ msg.title }}</text>
            <text v-if="!msg.read" class="msg-dot" />
          </view>
          <view class="msg-row__t2">
            {{ msg.sub }}
          </view>
        </view>
        <text class="msg-row__time">
          {{ msg.time }}
        </text>
      </view>
    </template>

    <x-empty v-if="!list.length" emoji="📭" title="消息已清空" sub="P0 服药提醒会第一时间出现在这里" />

    <x-note type="blue">
      👆 P0 必达通知无左滑，不可被滑动消除；点击卡片进入打卡页，状态与用药 Tab 实时同步。
    </x-note>

    <view class="msg-entry">
      <x-cell
        icon="sliders"
        chevron
        title="通知频控"
        subtitle="每日上限 · 免打扰时段 · 快捷模式"
        last
        @click="gotoFrequency"
      />
    </view>
  </x-page>
</template>

<script setup lang="ts">
import type { MessageRecord } from '@/store/modules/message/types';
import { usePermission } from '@/hooks';
import { useMedicineStore, useMessageStore, useSettingStore } from '@/store';
import { SNOOZE_DAILY_LIMIT } from '@/store/modules/medicine';

interface MessageTarget {
  path: string;
  params: Record<string, string>;
}

const messageStore = useMessageStore();
const medicineStore = useMedicineStore();
const settingStore = useSettingStore();

const list = computed<MessageRecord[]>(() => messageStore.list);
const mustList = computed<MessageRecord[]>(() => messageStore.mustList);
const digestList = computed<MessageRecord[]>(() => messageStore.digestList.filter(item => item.group === 'digest'));
const historyList = computed<MessageRecord[]>(() => messageStore.digestList.filter(item => item.group !== 'digest'));
const unreadP0 = computed<number>(() => messageStore.unreadP0);

const silentText = computed<string>(() => {
  const raw = String(settingStore.silentUntil || '');
  const parts = raw.split('-');
  if (/^\d{2}:\d{2}$/.test(parts[0]) && /^\d{2}:\d{2}$/.test(parts[1] || '')) {
    return `${parts[0]}–${parts[1]}`;
  }
  return '23:00–07:00';
});

function iconColor(msg: MessageRecord): string {
  if (msg.level === 'P1') {
    return '#C77700';
  }
  return '#2E7D32';
}

/**
 * 解析消息跳转链接：/pages/med/checkin/index?planId=p1&doseId=d2
 */
function targetOf(msg: MessageRecord): MessageTarget | null {
  const full = String(msg.path || '');
  if (!full.startsWith('/')) {
    return null;
  }
  const [path, query] = full.split('?');
  const params: Record<string, string> = {};
  String(query || '')
    .split('&')
    .forEach((pair) => {
      const kv = String(pair).split('=');
      if (kv[0]) {
        params[kv[0]] = kv[1] || '';
      }
    });
  return { path, params };
}

function openMessage(msg: MessageRecord) {
  const target = targetOf(msg);
  messageStore.markRead(msg.id);
  if (!target) {
    return;
  }
  uni.navigateTo({ url: fullUrl(target, msg.id) });
}

function fullUrl(target: MessageTarget, msgId: string) {
  const query = Object.keys(target.params)
    .map(key => `${key}=${target.params[key]}`)
    .join('&');
  const from = `from=${msgId}`;
  return `${target.path}?${query ? `${query}&${from}` : from}`;
}

function quickTake(msg: MessageRecord) {
  const target = targetOf(msg);
  if (!target || !target.params.planId) {
    openMessage(msg);
    return;
  }
  medicineStore.take(target.params.planId, target.params.doseId, todayOr(target));
  messageStore.markRead(msg.id);
  uni.showToast({ title: '已记录服用', icon: 'none' });
}

function todayOr(target: MessageTarget): string | undefined {
  return target.params.date || undefined;
}

function snoozeBlocked(msg: MessageRecord) {
  const target = targetOf(msg);
  if (!target || !target.params.planId) {
    return true;
  }
  return medicineStore.snoozeUsed(target.params.planId, target.params.doseId) >= SNOOZE_DAILY_LIMIT;
}

function snoozeText(msg: MessageRecord) {
  const target = targetOf(msg);
  const used = target && target.params.planId ? medicineStore.snoozeUsed(target.params.planId, target.params.doseId) : 0;
  return `稍后 15 分 · 今日已用 ${used} 次`;
}

function quickSnooze(msg: MessageRecord) {
  const target = targetOf(msg);
  if (!target || !target.params.planId) {
    return;
  }
  const ok = medicineStore.snoozeDose(target.params.planId, target.params.doseId);
  messageStore.markRead(msg.id);
  uni.showToast({
    title: ok ? '15 分钟后再次提醒' : `「稍后」今日最多 ${SNOOZE_DAILY_LIMIT} 次`,
    icon: 'none',
  });
}

/* —— 摘要行左滑：已读 / 删除（原型 14 标注「可左滑」） —— */
const swipeOffsets = ref<Record<string, number>>({});
let touchStartX = 0;
let touchStartY = 0;
let swipeMsgId = '';

function offsetOf(id: string): number {
  return swipeOffsets.value[id] || 0;
}

function onTouchStart(e: TouchEvent, id: string) {
  touchStartX = e.touches[0]?.clientX || 0;
  touchStartY = e.touches[0]?.clientY || 0;
  swipeMsgId = id;
}

function onTouchMove(e: TouchEvent) {
  if (!swipeMsgId) {
    return;
  }
  const dx = (e.touches[0]?.clientX || 0) - touchStartX;
  const dy = (e.touches[0]?.clientY || 0) - touchStartY;
  if (Math.abs(dx) < Math.abs(dy)) {
    return;
  }
  swipeOffsets.value[swipeMsgId] = Math.max(-160, Math.min(0, dx));
}

function onTouchEnd(msg: MessageRecord) {
  const offset = swipeOffsets.value[swipeMsgId] || 0;
  swipeOffsets.value[msg.id] = offset < -40 ? -160 : 0;
  swipeMsgId = '';
}

function handleRead(msg: MessageRecord) {
  messageStore.markRead(msg.id);
  swipeOffsets.value[msg.id] = 0;
  uni.showToast({ title: '已标为已读', icon: 'none' });
}

function handleRemove(msg: MessageRecord) {
  swipeOffsets.value[msg.id] = 0;
  messageStore.remove(msg.id);
  uni.showToast({ title: '已删除', icon: 'none' });
}

function handleLongPress(msg: MessageRecord) {
  const actions = msg.read ? ['删除'] : ['标为已读', '删除'];
  uni.showActionSheet({
    itemList: actions,
    success: ({ tapIndex }) => {
      const wantRead = !msg.read && tapIndex === 0;
      if (wantRead) {
        messageStore.markRead(msg.id);
        return;
      }
      uni.showModal({
        title: '删除这条消息？',
        content: '删除后本条不再显示，其它消息不受影响。',
        confirmText: '删除',
        confirmColor: '#FA5151',
        success: ({ confirm }) => {
          if (confirm) {
            messageStore.remove(msg.id);
          }
        },
      });
    },
  });
}

function handleReadAll() {
  messageStore.readAll();
  uni.showToast({ title: `已读全部（P0 未读 ${unreadP0.value} → 0）`, icon: 'none' });
}

function handleOpenNotify() {
  // #ifdef MP-WEIXIN
  uni.openSetting({
    fail: () => {
      uni.showToast({ title: '请在系统设置中开启通知', icon: 'none' });
    },
  });
  // #endif
  // #ifndef MP-WEIXIN
  if (typeof uni.openAppAuthorizeSetting === 'function') {
    uni.openAppAuthorizeSetting({
      fail: () => {
        uni.showToast({ title: '请在系统设置中开启通知', icon: 'none' });
      },
    });
  }
  else {
    uni.showToast({ title: '请在系统设置中开启通知', icon: 'none' });
  }
  // #endif
}

function gotoFrequency() {
  uni.navigateTo({ url: '/pages/msg/frequency/index' });
}

onShow(async () => {
  // onShow 阶段补校验路由权限（无权限时由 hooks/use-permission 处理跳转）
  await usePermission();
});
</script>

<style lang="scss" scoped>
.msg-h1 {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--color-text);
}

.msg-dot {
  display: inline-block;
  width: 14rpx;
  height: 14rpx;
  margin-left: 8rpx;
  background: var(--color-danger);
  border-radius: 50%;
}

.msg-row__t1 {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--color-text);
}

.msg-row__t2 {
  margin-top: 4rpx;
  font-size: var(--fs-sub);
  line-height: 1.5;
  color: var(--color-text-sub);
}

.msg-row__time {
  flex-shrink: 0;
  font-size: var(--fs-mini);
  color: var(--color-text-mute);
}

/* P0 卡：去阴影只留左条（原型 14：#F7F9FF + 4px 左条） */
.msg-must {
  padding: 28rpx;
  margin-bottom: 24rpx;
  background: var(--color-primary-mist);
  border-left: 8rpx solid var(--color-primary);
  border-radius: 24rpx;
}

.msg-must__tap {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
  transition: opacity var(--dur-normal) var(--ease-out);
}

.msg-must__tap--hover {
  opacity: 0.9;
}

.msg-must.is-read {
  opacity: 0.6;
}

.msg-must__btns {
  margin-top: 16rpx;
}

/* 「稍后15分」弱化 ghost（原型 14：#8A93A5 / #E4E8F0） */
.msg-must__btns :deep(.msg-snooze.x-button--ghost) {
  color: #8a93a5;
  border-color: #e4e8f0;
}

.msg-item {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 20rpx;
  align-items: center;
  padding: 24rpx;
  margin-bottom: 20rpx;
  background: var(--color-card);
  border-radius: 32rpx;
  box-shadow: var(--shadow-card);
  transition: transform 0.16s ease;
}

/* 左滑容器内：间距由 .msg-swipe 提供（原型 .swipe margin-bottom 8px） */
.msg-swipe .msg-item {
  margin-bottom: 0;
  border-radius: 24rpx;
  box-shadow: none;
}

/* 左滑容器：操作区在卡片下方 */
/* 原型 .swipe：12px 圆角、操作块 64px 宽、11px 字 */
.msg-swipe {
  position: relative;
  margin-bottom: 16rpx;
  overflow: hidden;
  border-radius: 24rpx;
}

.msg-swipe__actions {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 16rpx;
  z-index: 0;
  display: flex;
  overflow: hidden;
  border-radius: 0 24rpx 24rpx 0;
}

.msg-swipe__read,
.msg-swipe__del {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 128rpx;
  font-size: 22rpx;
  font-weight: 600;
  color: #ffffff;
}

.msg-swipe__read {
  background: #4f7cff;
}

.msg-swipe__del {
  background: #fa5151;
}

.msg-item--hover {
  opacity: 0.9;
}

.msg-item--head {
  border-left: 8rpx solid var(--color-primary);
}

.msg-entry {
  padding: 0 28rpx;
  margin-top: 8rpx;
  background: var(--color-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}
</style>
