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
          <x-icon :name="msg.icon || 'pill'" :size="44" color="#4F7CFF" />
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
            :disabled="snoozeBlocked(msg)"
            :text="snoozeText(msg)"
            @click="quickSnooze(msg)"
          />
        </view>
      </view>
    </template>

    <!-- P1 今日摘要 -->
    <template v-if="digestList.length">
      <x-group-bar :title="`📬 今日摘要 · ${digestList.length}`" more="长按可标已读 / 删除" />
      <view
        v-for="msg in digestList"
        :key="msg.id"
        class="msg-item"
        :class="{ 'msg-item--head': !msg.swipeable }"
        hover-class="msg-item--hover"
        @tap="openMessage(msg)"
        @longpress="handleLongPress(msg)"
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
      👆 P0 必达通知不可被滑动消除；点击卡片进入打卡页，状态与用药 Tab 实时同步。摘要与历史条目长按可标已读或删除。
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
  font-size: var(--fs-caption);
  line-height: 1.5;
  color: var(--color-text-sub);
}

.msg-row__time {
  flex-shrink: 0;
  font-size: var(--fs-mini);
  color: var(--color-text-mute);
}

/* P0 卡：去阴影只留左条 */
.msg-must {
  padding: 28rpx;
  margin-bottom: 24rpx;
  background: var(--color-primary-bg);
  border-left: 8rpx solid var(--color-primary);
  border-radius: 24rpx;
}

.msg-must__tap {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
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

.msg-item {
  display: flex;
  gap: 16rpx;
  align-items: center;
  padding: 24rpx 28rpx;
  margin-bottom: 20rpx;
  background: var(--color-card);
  border-radius: 24rpx;
  box-shadow: var(--shadow-card);
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
