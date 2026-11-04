<template>
  <x-page>
    <x-nav-bar :back="backMode" :title="navTitle">
      <template #right>
        <x-icon name="lock" :size="32" color="#6B7590" />
      </template>
    </x-nav-bar>

    <!-- 撤销提示条（5 分钟窗口） -->
    <view v-if="status === 'taken'" class="ck-snack">
      <text class="ck-snack__ok">
        ✓ 已记录 {{ record.takenAt }} 服用
      </text>
      <text v-if="undoLeft > 0" class="ck-snack__undo" @tap="handleUndo">
        撤销（剩余 {{ undoText }}）
      </text>
      <text v-else class="ck-snack__gone">
        撤销窗口已过
      </text>
    </view>

    <template v-if="plan && dose">
      <x-card>
        <view class="ck-hero">
          <text class="ck-hero__emoji">
            💊
          </text>
          <text class="ck-hero__name">
            {{ plan.name }}
          </text>
          <text class="ck-hero__sub">
            {{ dose.amount }} · {{ dose.afterMeal || "不限餐前后" }}
          </text>
          <view class="ck-hero__tag">
            <x-tag type="blue">
              {{ reasonText }}
            </x-tag>
          </view>
        </view>
      </x-card>

      <x-button large :disabled="takeBlocked" :text="takeText" @click="handleTake" />

      <view class="x-btns row ck-btns">
        <view class="ck-btn" @tap="handleSnoozeTap">
          <x-button type="ghost" small :disabled="snoozeBlocked" :text="snoozeText" />
        </view>
        <view class="ck-btn">
          <x-button type="ghost" small text="今天跳过" :disabled="status !== 'pending'" @click="handleSkip" />
        </view>
      </view>
      <x-button type="danger" small text="标记为已错过" :disabled="status !== 'pending'" @click="handleMissed" />

      <x-note v-if="stockLow" type="red">
        🔴 库存不足 · 仅剩 {{ stock.have }}{{ stock.unit }}，约可用 {{ stockDays }} 天
      </x-note>
      <x-banner v-if="stockLow" text="补货后可在用药设置里更新库存" action="去调整库存 ›" @action="gotoPlan" />
      <view v-else class="ck-stock">
        <text class="ck-stock__label">
          📦 当前库存
        </text>
        <text class="ck-stock__value">
          剩 {{ stock.have }}/{{ stock.total }} {{ stock.unit }} · 约 {{ stockDays }} 天
        </text>
      </view>

      <!-- 说明书摘录（点击进 12） -->
      <view class="ck-leaflet" @tap="gotoLeaflet">
        <text class="ck-leaflet__title">
          📄 说明书原文
        </text>
        <text class="ck-leaflet__quote">
          “{{ usageText }}”
        </text>
        <text v-if="plan.instruction && plan.instruction.caution" class="ck-leaflet__caution">
          ⚠️ {{ plan.instruction.caution }}
        </text>
        <text class="ck-leaflet__more">
          查看完整摘录与禁忌 ›
        </text>
      </view>

      <x-note type="blue">
        💡 撤销窗口为 {{ Math.round(UNDO_MS / 60000) }} 分钟；「稍后 15 分钟」每日最多 {{ limit }} 次；P0
        服药提醒不受免打扰限制。
      </x-note>
    </template>

    <x-empty v-else emoji="📭" title="没找到这条服药提醒" sub="计划可能已删除，或时间点参数不正确">
      <template #action>
        <x-button type="ghost" text="返回用药首页" @click="gotoMedicine" />
      </template>
    </x-empty>
  </x-page>
</template>

<script setup lang="ts">
import type { DoseRecord, DoseTime, MedPlan, PlanStock } from '@/store/modules/medicine/types';
import { usePermission } from '@/hooks';
import { switchTabPath } from '@/router/tab-bar';
import { useMedicineStore } from '@/store';
import { SNOOZE_DAILY_LIMIT, UNDO_MS } from '@/store/modules/medicine';
import { today } from '@/utils/date';

const medicineStore = useMedicineStore();

// 「稍后 15 分钟」每日上限
const limit = SNOOZE_DAILY_LIMIT;

// 无记录时的兜底（打卡状态默认待服用）
const EMPTY_RECORD: DoseRecord = { status: 'pending', takenAt: '' };
const EMPTY_STOCK: PlanStock = { have: 0, total: 0, unit: '' };

const query = ref<Record<string, string>>({});
const tick = ref<number>(Date.now());
let timer: ReturnType<typeof setInterval> | null = null;

const plan = computed<MedPlan | null>(() => (query.value.planId ? medicineStore.planById(query.value.planId) : null));
const dose = computed<DoseTime | null>(() => {
  if (!plan.value) {
    return null;
  }
  const found = query.value.doseId ? medicineStore.doseOf(plan.value.id, query.value.doseId) : null;
  return found || plan.value.doses.find(item => item.enabled) || plan.value.doses[0] || null;
});
const day = computed<string>(() => query.value.date || today());
const isBackfill = computed<boolean>(() => day.value !== today());
const key = computed<string>(() =>
  plan.value && dose.value ? medicineStore.recordKey(plan.value.id, dose.value.id, day.value) : '',
);
const record = computed<DoseRecord>(() => (key.value ? medicineStore.records[key.value] || EMPTY_RECORD : EMPTY_RECORD));
const status = computed<string>(() => record.value.status || 'pending');
const stock = computed<PlanStock>(() => {
  const raw = (plan.value && plan.value.stock) || EMPTY_STOCK;
  return { have: Number(raw.have) || 0, total: Number(raw.total) || 0, unit: raw.unit || '' };
});
const perDay = computed<number>(() => {
  if (!plan.value) {
    return 1;
  }
  const count = plan.value.doses.filter(item => item.enabled).length;
  return count || 1;
});
const stockDays = computed<number>(() => Math.floor(stock.value.have / perDay.value));
const stockLow = computed<boolean>(() => {
  if (!plan.value) {
    return false;
  }
  const threshold = Number(plan.value.lowStockDays || 3);
  return stockDays.value <= threshold;
});

const navTitle = computed<string>(() => (dose.value ? `${dose.value.label || dose.value.time}服药` : '今日打卡'));
const reasonText = computed<string>(() => {
  const parts: string[] = [];
  if (plan.value && plan.value.reason) {
    parts.push(`🤒 ${plan.value.reason}`);
  }
  const course = (plan.value && plan.value.course) || null;
  if (course) {
    parts.push(`第 ${course.index}/${course.total} 天`);
  }
  return parts.join(' · ');
});

const usageText = computed<string>(() => {
  const usage = plan.value && plan.value.instruction ? plan.value.instruction.usage : '';
  return usage || '暂无摘录';
});

// 当前分钟数（定时器驱动，倒计时随之刷新）
const nowClock = computed<number>(() => {
  const date = new Date(tick.value);
  return date.getHours() * 60 + date.getMinutes();
});

function minutesLeft(time: string): number {
  const parts = String(time).split(':').map(Number);
  return parts[0] * 60 + parts[1] - nowClock.value;
}

const minsToDose = computed<number>(() => (dose.value ? minutesLeft(dose.value.time) : 0));
const tooEarly = computed<boolean>(() => !isBackfill.value && minsToDose.value > 30);
const takeBlocked = computed<boolean>(() => status.value === 'taken' || tooEarly.value);

const takeText = computed<string>(() => {
  if (status.value === 'taken') {
    return `✓ 已记录 ${record.value.takenAt || ''}`;
  }
  if (tooEarly.value) {
    return `还有 ${minsToDose.value} 分钟到点 · 可提前 30 分钟打卡`;
  }
  if (isBackfill.value) {
    return '✓ 补登为已服用';
  }
  return '✓ 我已服用';
});

const undoLeft = computed<number>(() => (record.value.undoUntil ? record.value.undoUntil - tick.value : 0));
const undoText = computed<string>(() => {
  const total = Math.max(0, Math.floor(undoLeft.value / 1000));
  const mm = Math.floor(total / 60);
  const ss = `${total % 60}`.padStart(2, '0');
  return `${mm}:${ss}`;
});

const snoozeUsed = computed<number>(() =>
  plan.value && dose.value ? medicineStore.snoozeUsed(plan.value.id, dose.value.id) : 0,
);
const snoozeBlocked = computed<boolean>(() => snoozeUsed.value >= SNOOZE_DAILY_LIMIT);
const snoozeText = computed<string>(() =>
  snoozeBlocked.value
    ? `稍后 15 分钟 · 今日已用 ${SNOOZE_DAILY_LIMIT} 次`
    : `稍后 15 分钟 · 今日已用 ${snoozeUsed.value}/${SNOOZE_DAILY_LIMIT} 次`,
);

const backMode = computed<'back' | 'close'>(() => (query.value.from ? 'close' : 'back'));

function handleTake() {
  if (!plan.value || !dose.value) {
    return;
  }
  if (tooEarly.value) {
    uni.showToast({ title: '未到打卡时间，可提前 30 分钟', icon: 'none' });
    return;
  }
  medicineStore.take(plan.value.id, dose.value.id, day.value);
  uni.showToast({ title: '已记录服用', icon: 'none' });
}

function handleUndo() {
  if (!key.value || undoLeft.value <= 0) {
    uni.showToast({ title: '撤销窗口已过', icon: 'none' });
    return;
  }
  medicineStore.undo(key.value);
  uni.showToast({ title: '已撤销，恢复为待服用', icon: 'none' });
}

function handleSkip() {
  if (!plan.value || !dose.value) {
    return;
  }
  medicineStore.skip(plan.value.id, dose.value.id, day.value);
  uni.showToast({ title: '今天这一剂已跳过', icon: 'none' });
}

function handleMissed() {
  if (!plan.value || !dose.value) {
    return;
  }
  medicineStore.markMissed(plan.value.id, dose.value.id, day.value);
  uni.showToast({ title: '已标记为错过，可在用药页补登', icon: 'none' });
}

function handleSnoozeTap() {
  if (!plan.value || !dose.value) {
    return;
  }
  if (snoozeBlocked.value) {
    uni.showToast({ title: `「稍后」今日最多 ${SNOOZE_DAILY_LIMIT} 次，不能再延`, icon: 'none' });
    return;
  }
  const ok = medicineStore.snoozeDose(plan.value.id, dose.value.id);
  uni.showToast({ title: ok ? '15 分钟后再次提醒' : `今日「稍后」已用完 ${SNOOZE_DAILY_LIMIT} 次`, icon: 'none' });
}

function gotoPlan() {
  if (!plan.value) {
    return;
  }
  uni.navigateTo({ url: `/pages/med/plan/index?planId=${plan.value.id}` });
}

function gotoLeaflet() {
  if (!plan.value) {
    return;
  }
  uni.navigateTo({ url: `/pages/med/leaflet/index?planId=${plan.value.id}` });
}

function gotoMedicine() {
  // 原生 tabBar 已移除，用药首页为自定义底栏的 tab 页
  switchTabPath('/pages/tab/medicine/index');
}

function startTimer() {
  stopTimer();
  tick.value = Date.now();
  timer = setInterval(() => {
    tick.value = Date.now();
  }, 1000);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

onLoad((options: Record<string, string> = {}) => {
  query.value = options || {};
});

onShow(async () => {
  const ok = await usePermission();
  if (!ok) {
    return;
  }
  startTimer();
});

onHide(stopTimer);
onUnload(stopTimer);
onUnmounted(stopTimer);
</script>

<style lang="scss" scoped>
.ck-snack {
  display: flex;
  gap: 16rpx;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 24rpx;
  margin-bottom: 20rpx;
  font-size: var(--fs-sub);
  color: var(--color-note-green-text);
  background: var(--color-note-green-bg);
  border-radius: 20rpx;
}

.ck-snack__ok {
  flex: 1;
  min-width: 0;
  font-weight: 600;
}

.ck-snack__undo {
  flex-shrink: 0;
  font-weight: 700;
  color: var(--color-primary);
}

.ck-snack__gone {
  flex-shrink: 0;
  color: var(--color-text-mute);
}

.ck-hero {
  padding: 12rpx 0;
  text-align: center;
}

.ck-hero__emoji {
  display: block;
  font-size: 112rpx;
  line-height: 1.1;
}

.ck-hero__name {
  display: block;
  margin-top: 12rpx;
  font-size: 38rpx;
  font-weight: 700;
  color: var(--color-text);
}

.ck-hero__sub {
  display: block;
  margin-top: 8rpx;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}

.ck-hero__tag {
  display: flex;
  justify-content: center;
  margin-top: 16rpx;
}

.ck-btns {
  margin-top: 24rpx;
}

.ck-btn {
  flex: 1;
  min-width: 0;
}

.ck-stock {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 24rpx;
  margin: 24rpx 0 0;
  background: var(--color-card);
  border-radius: var(--radius-cell);
  box-shadow: var(--shadow-card);
}

.ck-stock__label {
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--color-text);
}

.ck-stock__value {
  font-size: var(--fs-caption);
  color: var(--color-text-sub);
}

.ck-leaflet {
  display: block;
  padding: 24rpx;
  margin-top: 24rpx;
  background: var(--color-note-purple-bg);
  border: 2rpx solid #e4d9ff;
  border-radius: var(--radius-cell);
}

.ck-leaflet__title {
  display: block;
  margin-bottom: 8rpx;
  font-size: var(--fs-caption);
  font-weight: 700;
  color: var(--color-note-purple-text);
}

.ck-leaflet__quote,
.ck-leaflet__caution,
.ck-leaflet__more {
  display: block;
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--color-note-purple-text);
}

.ck-leaflet__caution {
  margin-top: 8rpx;
}

.ck-leaflet__more {
  margin-top: 12rpx;
  font-weight: 700;
  text-decoration: underline;
}
</style>
