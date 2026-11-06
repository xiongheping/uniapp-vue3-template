<template>
  <x-page>
    <!-- 物品不存在 -->
    <template v-if="!item">
      <x-nav-bar title="物品详情" back="back" />
      <x-empty icon="package" title="物品不见了" sub="它可能已被删除或移动。">
        <template #action>
          <x-button type="ghost" text="返回" @click="goBack" />
        </template>
      </x-empty>
    </template>

    <template v-else>
      <x-nav-bar title="物品详情" right-icon="more" @right="showMore = true" />

      <!-- 头图卡 -->
      <x-card flat>
        <view class="dt-hero">
          <text class="dt-hero__emoji">
            {{ heroEmoji }}
          </text>
          <text v-if="item.photo" class="dt-hero__shot">
            📷 拍摄于 {{ shotDate }}
          </text>
        </view>
        <view class="dt-hero__body">
          <view class="dt-hero__name">
            {{ item.name }}
          </view>
          <view class="x-sub">
            {{ categoryLabel }} · {{ item.location || '未设置位置' }}
            <x-tag v-if="item.status === 'active'" :type="toneType" style="margin-left: 8rpx">
              {{ dueText }}
            </x-tag>
            <x-tag v-else type="gray" style="margin-left: 8rpx">
              {{ statusText }}
            </x-tag>
          </view>
        </view>
      </x-card>

      <x-banner
        v-if="item.status !== 'active'"
        type="blue"
        action="恢复"
        :text="`该物品处于「${statusText}」`"
        @action="onRestore"
      />

      <!-- 效期进度 -->
      <x-card v-if="item.status === 'active' && item.dueDate">
        <x-progress :percent="lifePercent" tone="life" />
        <view class="dt-prog">
          <text>{{ item.produceDate ? `生产 ${dotDate(item.produceDate)}` : '生产 —' }}</text>
          <text class="dt-prog__today">
            今天 {{ dotDate(todayStr) }}
          </text>
          <text>过期 {{ dotDate(item.dueDate) }}</text>
        </view>
      </x-card>

      <!-- 基本信息 -->
      <x-card>
        <view class="dt-row">
          <text class="dt-row__k">
            数量
          </text>
          <x-quantity :model-value="item.qty" :text="qtyText" @decrease="changeQty(-1)" @increase="changeQty(1)" />
        </view>
        <x-field label="提醒设置" icon="bell" :value="remindSummary" tone="primary" chevron @click="showMore = true" />
        <x-field label="存放位置" icon="package" :value="item.location || '未设置'" chevron @click="goEdit" />
        <x-field label="可见范围" icon="lock" :value="visText" tone="purple" chevron @click="goEdit" />
      </x-card>

      <!-- 提醒计划：原型为「图标 + 日期提醒 + 开关/只读」行，非时间轴 -->
      <x-card v-if="item.dueDate">
        <view class="dt-plan-title">
          提醒计划 · 仅未来节点可关
        </view>
        <view v-for="node in planNodes" :key="node.key" class="dt-plan-row">
          <view class="dt-plan-row__ico">
            <x-icon name="calendar" :size="32" color="#4F7CFF" />
          </view>
          <view class="x-flex-1">
            <view class="dt-plan-row__t1">
              {{ node.short }} {{ node.label }}
              <x-tag v-if="node.sent" type="gray" mini>
                已发送
              </x-tag>
            </view>
          </view>
          <text v-if="node.sent" class="dt-node__lock">
            只读
          </text>
          <x-switch v-else mini :checked="node.on" @update:checked="(v: boolean) => toggleNode(node.days, v)" />
        </view>
      </x-card>
    </template>

    <template v-if="item" #sticky>
      <view class="dt-sticky x-safe-bottom">
        <view class="dt-sticky__row">
          <x-button type="ghost" small icon="pencil" text="编辑" @click="goEdit" />
          <x-button
            type="ghost"
            small
            icon="check"
            text="已用完"
            class="dt-sticky__used"
            style="color: #52c41a; border-color: #c9e9c9;"
            @click="onArchiveUsed"
          />
        </view>
        <x-button
          type="danger"
          small
          icon="trash"
          class="dt-sticky__trash"
          style="width: 96rpx; padding: 0;"
          @click="showTrash = true"
        />
      </view>
    </template>

    <template v-if="item">
      <!-- 10b 移到已扔确认 -->
      <x-sheet v-model:show="showTrash" mode="center" :mask-closable="false" title="移到“已扔”？">
        <template #sub>
          <view class="dt-sheet-sub">
            <view>
              将归档：<text class="dt-b">
                {{ item.name }}
              </text>
            </view>
            <view>
              （{{ item.location || '未设置位置' }}<text v-if="item.dueDate">
                · {{ item.dueDate }} 到期
              </text>）
            </view>
          </view>
        </template>
        <x-note>
          💡 “已扔”是归档终态，可在 归档→已扔 中恢复，不会进回收站。
        </x-note>
        <x-button type="danger" text="确认移到已扔" @click="confirmTrash" />
        <x-button type="gray" text="取消" @click="showTrash = false" />
      </x-sheet>

      <!-- 更多操作 -->
      <x-sheet v-model:show="showMore" title="更多操作">
        <view class="dt-more" @click="onPostpone">
          <x-icon name="calendar" :size="40" color="#4F7CFF" />
          <text>延期 30 天</text>
        </view>
        <view class="dt-more" @click="goEdit">
          <x-icon name="pencil" :size="40" color="#4F7CFF" />
          <text>编辑信息</text>
        </view>
        <view class="dt-more" @click="onArchiveUsed">
          <x-icon name="check" :size="40" color="#2E7D32" />
          <text>移到已用完</text>
        </view>
        <view class="dt-more" @click="openTrashFromMore">
          <x-icon name="trash" :size="40" color="#D93025" />
          <text>移到已扔</text>
        </view>
        <x-button type="link" text="取消" @click="showMore = false" />
      </x-sheet>
    </template>
  </x-page>
</template>

<script setup lang="ts">
import type { ItemCategory, ItemRecord } from '@/store/modules/item/types';
import { useItemStore } from '@/store';
import { addDays, diffDays, dotDate, dueLabel, shortDate, today } from '@/utils/date';

/**
 * 提醒计划节点（提前 7/3/0 天）
 */
interface PlanNode {
  key: string;
  days: number;
  date: string;
  short: string;
  label: string;
  /**
   * 节点时间已过，视为已发送（只读）
   */
  sent: boolean;
  on: boolean;
  /**
   * 时间点不额外染色，保持默认灰点
   */
  state: string;
}

const itemStore = useItemStore();

const CAT_LABEL: Record<ItemCategory, string> = { drug: '药品', skin: '护肤品', food: '食品', other: '其他' };
const CAT_EMOJI: Record<ItemCategory, string> = { drug: '💊', skin: '🧴', food: '🍪', other: '📦' };
const STATUS_LABEL: Record<string, string> = { used: '已用完', thrown: '已扔', trashed: '回收站' };
const PLAN_DAYS = [7, 3, 0];

const itemId = ref<string>('');
const showTrash = ref<boolean>(false);
const showMore = ref<boolean>(false);

const item = computed<ItemRecord | null>(() => itemStore.findItem(itemId.value));

const todayStr = today();

const categoryLabel = computed<string>(() => (item.value ? CAT_LABEL[item.value.category] : '其他'));
const heroEmoji = computed<string>(() => (item.value ? CAT_EMOJI[item.value.category] : '📦'));
const dueText = computed<string>(() => (item.value?.dueDate ? dueLabel(item.value.dueDate) : '未填写'));
const statusText = computed<string>(() => STATUS_LABEL[item.value?.status ?? ''] ?? '');

const toneType = computed<string>(() => {
  const days = item.value?.dueDate ? diffDays(item.value.dueDate) : Number.NaN;
  if (Number.isNaN(days)) {
    return 'gray';
  }
  if (days < 0) {
    return 'red';
  }
  if (days <= 30) {
    return 'orange';
  }
  return 'green';
});

/**
 * 生命周期已过比例：以生产日→到期日为一整段，无生产日按 365 天估
 */
const lifePercent = computed<number>(() => {
  const it = item.value;
  if (!it || !it.dueDate) {
    return 0;
  }
  const dueDays = diffDays(it.dueDate);
  const span = it.produceDate ? Math.max(1, diffDays(it.dueDate) - diffDays(it.produceDate)) : 365;
  const elapsed = span - dueDays;
  return Math.min(100, Math.max(2, Math.round((elapsed / span) * 100)));
});

const qtyText = computed<string>(() => {
  const it = item.value;
  if (!it) {
    return '';
  }
  return it.spec ? `剩 ${it.qty} · ${it.spec}` : `${it.qty}`;
});

const remindList = computed<number[]>(() => item.value?.remindDays ?? []);

const remindSummary = computed<string>(() => {
  const list = [...remindList.value].sort((a, b) => b - a);
  if (!list.length) {
    return '已关闭';
  }
  return list.map(d => (d === 0 ? '当天' : `提前 ${d} 天`)).join(' / ');
});

const visText = computed<string>(() => (item.value?.visibility === 'family' ? '👥 家人可见' : '🔒 仅自己'));
const shotDate = computed<string>(() => shortDate(item.value?.createdAt ?? ''));

const planNodes = computed<PlanNode[]>(() => {
  const it = item.value;
  if (!it || !it.dueDate) {
    return [];
  }
  return PLAN_DAYS.map((days): PlanNode => {
    const date = addDays(-days, it.dueDate);
    return {
      key: `n${days}`,
      days,
      date,
      short: shortDate(date),
      label: days === 0 ? '到期当天' : `提前 ${days} 天提醒`,
      sent: diffDays(date) < 0,
      on: remindList.value.includes(days),
      state: '',
    };
  }).reverse(); // 由早到晚展示
});

function changeQty(delta: number) {
  const it = item.value;
  if (!it) {
    return;
  }
  itemStore.updateItem(it.id, { qty: Math.max(0, (it.qty || 0) + delta) });
}

function toggleNode(days: number, value: boolean) {
  const it = item.value;
  if (!it) {
    return;
  }
  const list = [...(it.remindDays || [])];
  const index = list.indexOf(days);
  if (value && index === -1) {
    list.push(days);
  }
  if (!value && index > -1) {
    list.splice(index, 1);
  }
  itemStore.updateItem(it.id, { remindDays: list });
}

function goEdit() {
  uni.navigateTo({ url: `/pages/item/confirm/index?id=${itemId.value}&mode=edit` });
}

function goBack() {
  uni.navigateBack();
}

function onPostpone() {
  const it = item.value;
  if (!it) {
    return;
  }
  itemStore.postpone(it.id, 30);
  showMore.value = false;
  uni.showToast({ title: '已延期 30 天', icon: 'none' });
}

function onArchiveUsed() {
  const it = item.value;
  if (!it) {
    return;
  }
  itemStore.archive([it.id], 'used');
  showMore.value = false;
  uni.showToast({ title: '已移到「已用完」', icon: 'none' });
}

function openTrashFromMore() {
  showMore.value = false;
  showTrash.value = true;
}

function confirmTrash() {
  const it = item.value;
  if (!it) {
    return;
  }
  itemStore.archive([it.id], 'thrown');
  showTrash.value = false;
  uni.showToast({ title: '已移到「已扔」', icon: 'none' });
}

function onRestore() {
  const it = item.value;
  if (!it) {
    return;
  }
  itemStore.restore([it.id]);
  uni.showToast({ title: '已恢复到在用', icon: 'none' });
}

onLoad((options: Record<string, string> = {}) => {
  itemId.value = options.id || '';
});
</script>

<style lang="scss" scoped>
.dt-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 260rpx;
  background: linear-gradient(135deg, #f0f4ff, #e4ecff);
}

.dt-hero__emoji {
  font-size: 112rpx;
}

.dt-hero__shot {
  position: absolute;
  right: 20rpx;
  bottom: 16rpx;
  padding: 4rpx 16rpx;
  font-size: var(--fs-mini);
  color: #ffffff;
  background: rgb(0 0 0 / 45%);
  border-radius: 20rpx;
}

.dt-hero__body {
  padding: 28rpx;
  text-align: center;
}

.dt-hero__name {
  font-size: var(--fs-title);
  font-weight: 700;
  color: var(--color-text);
}

.dt-prog {
  display: flex;
  justify-content: space-between;
  margin-top: 12rpx;
  font-size: var(--fs-caption);
  color: var(--color-text-sub);
}

.dt-prog__today {
  font-weight: 700;
  color: var(--color-primary);
}

.dt-row {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--h-touch);
  padding: 20rpx 0;
  border-bottom: 2rpx solid var(--color-divider);
}

.dt-row__k {
  font-size: var(--fs-body);
  color: var(--color-text);
}

.dt-plan-title {
  margin-bottom: 8rpx;
  font-size: var(--fs-caption);
  font-weight: 600;
  color: var(--color-text-sub);
}

.dt-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72rpx;
}

.dt-node__main {
  display: flex;
  gap: 12rpx;
  align-items: center;
}

.dt-node__label {
  font-size: var(--fs-sub);
  color: var(--color-text);
}

.dt-node__lock {
  font-size: var(--fs-mini);
  color: var(--color-text-mute);
}

/* 提醒计划行（原型 10：图标 + 日期提醒 + 开关） */
.dt-plan-row {
  display: flex;
  gap: 16rpx;
  align-items: center;
  min-height: 96rpx;
  padding: 22rpx 0;
  border-bottom: 2rpx solid var(--color-divider);

  &:last-child {
    border-bottom: none;
  }
}

.dt-plan-row__ico {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  background: var(--color-primary-soft);
  border-radius: 24rpx;
}

.dt-plan-row__t1 {
  display: flex;
  gap: 12rpx;
  align-items: center;
  font-size: 26rpx;
  color: var(--color-text);
}

/* 吸底：编辑/已用完 + 窄红删除 */
.dt-sticky {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.dt-sticky__row {
  display: flex;
  flex: 1;
  gap: 16rpx;
}

.dt-sticky__row > .x-button {
  flex: 1;
}

.dt-sticky__trash {
  width: 96rpx;
}

.dt-sheet-sub {
  font-size: var(--fs-sub);
  line-height: 1.6;
  color: var(--color-text-sub);
  text-align: center;
}

.dt-b {
  font-weight: 700;
  color: var(--color-text);
}

.dt-opt {
  display: flex;
  gap: 16rpx;
  align-items: center;
  padding: 16rpx 0 24rpx;
}

.dt-opt__txt {
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}

.dt-more {
  display: flex;
  gap: 20rpx;
  align-items: center;
  min-height: var(--h-touch);
  padding: 20rpx 0;
  font-size: var(--fs-body);
  color: var(--color-text);
  border-bottom: 2rpx solid var(--color-divider);
}

.dt-more:last-of-type {
  border-bottom: none;
}
</style>
