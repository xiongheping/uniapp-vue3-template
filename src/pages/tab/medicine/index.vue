<template>
  <x-page tab="/pages/tab/medicine/index">
    <x-nav-bar :back="false" right-text="用药设置" @right="gotoSetting">
      <view class="med-nav">
        <text class="med-nav__h1">
          今日用药
        </text>
        <text class="med-nav__sub">
          {{ dateText }} · {{ todayDone }}/{{ todayTotal }} 已完成
        </text>
      </view>
    </x-nav-bar>

    <!-- 概览：仅你可见（原型 11 头部 lock 徽标） -->
    <view class="med-line">
      <view class="med-lock">
        <x-icon name="lock" :size="48" color="#6B7590" />
        <text>仅你可见</text>
      </view>
      <text class="med-line__tip">
        待服 {{ pendingCount }} 条 · 与首页一致
      </text>
    </view>

    <!-- 11b 今日全部完成庆祝（动效只播一次）；无下一剂时空态；否则展示下一剂卡片 -->
    <view v-if="isAllDone" class="med-party">
      <view v-if="playing" class="med-confetti">
        <view class="med-bit c1" />
        <view class="med-bit c2" />
        <view class="med-bit c3" />
        <view class="med-bit c4" />
        <view class="med-bit c5" />
      </view>
      <text class="med-party__emoji">
        💪
      </text>
      <text class="med-party__title">
        今天 {{ todayTotal }}/{{ todayTotal }} 全部完成
      </text>
      <view class="med-party__sub">
        <text>已连续</text>
        <text class="med-party__b">
          {{ streakDays }} 天
        </text>
        <text>按计划服药。</text>
      </view>
      <text v-if="courseRemain > 0" class="med-party__sub">
        疗程还剩 {{ courseRemain }} 天，继续保持。
      </text>
      <x-card>
        <view v-for="item in takenEntries" :key="item.key" class="med-party__row">
          <text class="med-party__check">
            ✓
          </text>
          <text class="med-party__text">
            {{ item.time }} {{ item.name }} · {{ item.amount }}{{ earlyText(item) }}
          </text>
        </view>
      </x-card>
      <x-button type="ghost" text="查看本周记录" @click="revealAll" />
    </view>

    <x-card v-else-if="nextEntry" highlight>
      <view class="med-tags">
        <x-tag type="blue">
          ⏰ 接下来 {{ nextEntry.time }}
        </x-tag>
        <x-tag v-if="canCheckIn" type="orange">
          可提前 30 分钟打卡
        </x-tag>
        <x-tag v-else type="gray">
          {{ countdownText }}
        </x-tag>
      </view>
      <x-cell
        icon="pill"
        tone="orange"
        :title="`${nextEntry.name} · ${nextEntry.amount}`"
        :subtitle="subtitleOf(nextEntry)"
      />
      <x-button text="✓ 我已服用" @click="gotoCheckin(nextEntry)" />
    </x-card>

    <x-empty v-else emoji="🌙" title="今天没有待服" sub="可在下方时间轴回看，或添加新的服用计划" />

    <!-- 昨日漏服补登 -->
    <x-note v-if="yesterdayMissed.length" type="red">
      <text>🔴 昨日 {{ yesterdayMissed[0].time }} 漏服 ·</text>
      <text class="med-link" @tap="gotoCheckin(yesterdayMissed[0], true)">
        现在补登
      </text>
      <text>·</text>
      <text class="med-plain" @tap="handleSkipYesterday">
        跳过
      </text>
    </x-note>

    <!-- 今日时间轴 -->
    <view class="med-tl-hd">
      <text class="med-tl-hd__title">
        今日时间轴
      </text>
      <text v-if="hiddenCount > 0 || expanded" class="med-tl-hd__toggle" @tap="expanded = !expanded">
        {{ expanded ? "收起 ▴" : `展开已隐藏 ${hiddenCount} 条 ▾` }}
      </text>
    </view>

    <x-timeline-item
      v-for="(item, index) in shownEntries"
      :key="item.key"
      :time="item.time"
      :state="dotState(item)"
      :line="index < shownEntries.length - 1"
    >
      <view class="med-tl-card x-tap" :class="{ on: item.key === nextKey }" hover-class="x-tap--hover" :hover-start-time="0" @tap="gotoCheckin(item)">
        <view class="med-tl-card__t1">
          <text>{{ item.name }} · {{ item.amount }}</text>
          <text v-if="item.status === 'taken'" class="med-tl-card__ok">
            ✓
          </text>
        </view>
        <view class="med-tl-card__t2">
          <template v-if="item.status === 'taken'">
            <text>{{ item.takenAt }} 已服用</text>
            <text v-if="canUndo(item)" class="med-link" @tap.stop="handleUndo(item)">
              · 撤销
            </text>
          </template>
          <text v-else-if="item.status === 'skipped'">
            今天已跳过
          </text>
          <template v-else-if="item.status === 'missed'">
            <text class="med-missed">
              已错过
            </text>
            <text class="med-link" @tap.stop="gotoCheckin(item)">
              · 现在补登
            </text>
          </template>
          <text v-else>
            {{ statusText(item) }}
          </text>
        </view>
      </view>
    </x-timeline-item>

    <!-- 数据概览：时间轴之后，不打断原型 11 的首屏信息顺序 -->
    <view class="med-stats">
      <view class="med-stat">
        <text class="med-stat__num">
          {{ todayDone }}/{{ todayTotal }}
        </text>
        <text class="med-stat__label">
          今日完成
        </text>
      </view>
      <view class="med-stat">
        <text class="med-stat__num">
          {{ streakDays }} 天
        </text>
        <text class="med-stat__label">
          连续打卡
        </text>
      </view>
      <view class="med-stat">
        <text class="med-stat__num">
          {{ pendingCount }}
        </text>
        <text class="med-stat__label">
          待服用
        </text>
      </view>
      <view class="med-stat">
        <text class="med-stat__num" :class="{ warn: missedCount > 0 }">
          {{ missedCount }}
        </text>
        <text class="med-stat__label">
          漏服待补
        </text>
      </view>
    </view>

    <!-- 计划入口 -->
    <view class="x-section-title">
      我的服用计划
    </view>
    <x-card>
      <x-cell
        v-for="plan in plans"
        :key="plan.id"
        icon="pill"
        chevron
        :title="plan.name"
        :subtitle="planSummary(plan)"
        :tag="plan.enabled ? '' : '已停用'"
        :last="plan.id === lastPlanId"
        @click="gotoPlan(plan.id)"
      />
      <view class="x-btns row">
        <x-button type="ghost" text="＋ 添加用药计划" icon="plus" @click="gotoPlan('')" />
        <x-button type="link" text="用药设置 ›" @click="gotoSetting" />
      </view>
    </x-card>
  </x-page>
</template>

<script setup lang="ts">
import type { DoseEntry, MedPlan, MissedEntry } from '@/store/modules/medicine/types';
import { usePermission } from '@/hooks';
import { useMedicineStore } from '@/store';
import { cnDate, today } from '@/utils/date';

/**
 * 打卡页入口参数：今日剂次或昨日漏服
 */
type CheckinTarget = DoseEntry | MissedEntry;

const medicineStore = useMedicineStore();

const expanded = ref<boolean>(false);
const playing = ref<boolean>(false);
const tick = ref<number>(Date.now());
let timer: ReturnType<typeof setInterval> | null = null;

const dateText = computed<string>(() => cnDate(today()));
const plans = computed<MedPlan[]>(() => medicineStore.plans);
const lastPlanId = computed<string>(() => (plans.value.length ? plans.value[plans.value.length - 1].id : ''));
const entries = computed<DoseEntry[]>(() => medicineStore.todayEntries);
const takenEntries = computed<DoseEntry[]>(() => entries.value.filter(item => item.status === 'taken'));
const todayTotal = computed<number>(() => medicineStore.todayTotal);
const todayDone = computed<number>(() => medicineStore.todayDone);
const pendingCount = computed<number>(() => medicineStore.pendingEntries.length);
const missedCount = computed<number>(() => medicineStore.missedList.length);
const streakDays = computed<number>(() => medicineStore.streakDays);
const isAllDone = computed<boolean>(() => medicineStore.isAllDone);
const canCheckIn = computed<boolean>(() => medicineStore.canCheckIn);
const nextEntry = computed<DoseEntry | null>(() => medicineStore.nextEntry);
const nextKey = computed<string>(() => (nextEntry.value ? nextEntry.value.key : ''));
const yesterdayMissed = computed<MissedEntry[]>(() => medicineStore.yesterdayMissed);

const hiddenCount = computed<number>(() => takenEntries.value.length);

const shownEntries = computed<DoseEntry[]>(() => {
  if (expanded.value || hiddenCount.value === 0) {
    return entries.value;
  }
  const list = entries.value.filter(item => item.status !== 'taken');
  return list.length ? list : entries.value;
});

// 页面当前分钟数（定时器驱动，倒计时文案随之刷新）
const nowClock = computed<number>(() => {
  const date = new Date(tick.value);
  return date.getHours() * 60 + date.getMinutes();
});

function minutesLeft(time: string): number {
  const parts = String(time).split(':').map(Number);
  return parts[0] * 60 + parts[1] - nowClock.value;
}

function describeLeft(mins: number): string {
  if (mins > 0) {
    return `还有 ${mins} 分钟`;
  }
  if (mins === 0) {
    return '就是现在';
  }
  return `已过 ${Math.abs(mins)} 分钟`;
}

const countdownText = computed<string>(() => (nextEntry.value ? describeLeft(minutesLeft(nextEntry.value.time)) : ''));

const courseRemain = computed<number>(() => {
  const plan = plans.value.find(item => item.enabled && item.course);
  if (!plan?.course) {
    return 0;
  }
  return Math.max(0, Number(plan.course.total || 0) - Number(plan.course.index || 0));
});

function subtitleOf(entry: DoseEntry): string {
  const parts: string[] = [];
  if (entry.reason) {
    parts.push(`🤒 ${entry.reason}`);
  }
  if (entry.afterMeal) {
    parts.push(entry.afterMeal);
  }
  return parts.join(' · ');
}

function statusText(entry: DoseEntry): string {
  const base = entry.advance ? `提前 ${entry.advance} 分钟会提醒` : '到点提醒';
  const left = minutesLeft(entry.time);
  if (left > 30) {
    return `待服用 · ${describeLeft(left)} · ${base}`;
  }
  if (left >= 0) {
    return `待服用 · ${base}`;
  }
  return `待服用 · ${describeLeft(left)} · ${base}`;
}

function dotState(entry: DoseEntry): string {
  if (entry.status === 'taken') {
    return 'done';
  }
  if (entry.status === 'missed') {
    return 'missed';
  }
  return entry.key === nextKey.value ? 'on' : '';
}

function canUndo(entry: DoseEntry): boolean {
  return entry.status === 'taken' && (entry.undoUntil ?? 0) > tick.value;
}

function earlyText(entry: DoseEntry): string {
  if (!entry.takenAt) {
    return '';
  }
  const [dh, dm] = String(entry.time).split(':').map(Number);
  const [th, tm] = String(entry.takenAt).split(':').map(Number);
  const diff = dh * 60 + dm - (th * 60 + tm);
  return diff > 0 ? `（提前 ${diff} 分钟打卡）` : '';
}

function planSummary(plan: MedPlan): string {
  const times = plan.doses
    .filter(dose => dose.enabled)
    .map(dose => dose.time)
    .join(' / ');
  const stock = plan.stock ? ` · 剩 ${plan.stock.have}${plan.stock.unit || ''}` : '';
  return `${times || '未设置时间'}${stock}`;
}

function revealAll() {
  expanded.value = true;
}

function handleUndo(entry: DoseEntry) {
  medicineStore.undo(entry.key);
  uni.showToast({ title: '已撤销打卡', icon: 'none' });
}

function handleSkipYesterday() {
  const item = yesterdayMissed.value[0];
  if (!item) {
    return;
  }
  medicineStore.skip(item.planId, item.doseId, item.date);
  uni.showToast({ title: '已标记跳过', icon: 'none' });
}

function queryOf(planId: string, doseId: string, date: string): string {
  const parts = [`planId=${planId}`, `doseId=${doseId}`];
  if (date) {
    parts.push(`date=${date}`);
  }
  return parts.join('&');
}

function gotoCheckin(entry: CheckinTarget, withDate = false) {
  if (!entry || !entry.planId) {
    return;
  }
  const date = withDate ? (entry as MissedEntry).date || today() : '';
  uni.navigateTo({
    url: `/pages/med/checkin/index?${queryOf(entry.planId, entry.doseId, date)}`,
  });
}

function gotoPlan(id: string) {
  uni.navigateTo({ url: `/pages/med/plan/index${id ? `?planId=${id}` : ''}` });
}

function gotoSetting() {
  gotoPlan(lastPlanId.value);
}

function startTimer() {
  stopTimer();
  tick.value = Date.now();
  timer = setInterval(() => {
    tick.value = Date.now();
  }, 30000);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

onLoad(() => {
  // 原型 11 时间轴三条全部展示（含 08:31 已服用 · 撤销）
  expanded.value = true;
});

onShow(async () => {
  const ok = await usePermission();
  if (!ok) {
    return;
  }
  // 登录态下以服务端数据为准：先拿完整计划（疗程/库存），再拿今日时间轴
  await Promise.all([medicineStore.fetchPlans(), medicineStore.fetchToday()]);
  startTimer();
  // 庆祝动效每次进入只播一次
  if (isAllDone.value) {
    playing.value = true;
    setTimeout(() => {
      playing.value = false;
    }, 1600);
  }
  else {
    playing.value = false;
  }
});

onHide(stopTimer);
onUnload(stopTimer);
</script>

<style lang="scss" scoped>
.med-nav {
  text-align: left;
}

.med-nav__h1,
.med-nav__sub {
  display: block;
}

.med-nav__h1 {
  font-size: var(--fs-title);
  font-weight: 700;
  color: var(--color-text);
}

.med-nav__sub {
  margin-top: 2rpx;
  font-size: var(--fs-mini);
  color: var(--color-text-sub);
}

.med-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.med-lock {
  display: flex;
  gap: 8rpx;
  align-items: center;
  padding: 6rpx 16rpx;
  font-size: var(--fs-caption);
  color: var(--color-text-sub);
  background: var(--color-fill);
  border-radius: 10rpx;
}

.med-line__tip {
  font-size: var(--fs-caption);
  color: var(--color-text-weak);
}

.med-stats {
  display: flex;
  padding: 20rpx 0;
  margin-bottom: 24rpx;
  background: var(--color-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.med-stat {
  flex: 1;
  text-align: center;
}

.med-stat__num {
  display: block;
  font-size: 34rpx;
  font-weight: 800;
  color: var(--color-text);
}

.med-stat__num.warn {
  color: var(--color-danger-strong);
}

.med-stat__label {
  display: block;
  margin-top: 4rpx;
  font-size: var(--fs-caption);
  color: var(--color-text-sub);
}

.med-tags {
  display: flex;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.med-link {
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: underline;
}

.med-plain {
  color: var(--color-text-sub);
}

.med-party {
  padding: 12rpx 0 4rpx;
  text-align: center;
}

.med-confetti {
  position: relative;
  height: 40rpx;
}

.med-confetti .med-bit,
.med-bit {
  position: absolute;
  top: 0;
  width: 12rpx;
  height: 24rpx;
  border-radius: 4rpx;
  animation: med-fall 1.4s ease-out forwards;
}

.med-confetti .c1 {
  left: 12%;
  background: var(--color-success);
}

.med-confetti .c2 {
  left: 28%;
  background: var(--color-primary);
  animation-delay: 0.4s;
}

.med-confetti .c3 {
  left: 46%;
  background: #ffb020;
  animation-delay: 0.2s;
}

.med-confetti .c4 {
  left: 64%;
  background: var(--color-success);
  animation-delay: 0.6s;
}

.med-confetti .c5 {
  left: 82%;
  background: var(--color-primary);
  animation-delay: 0.3s;
}

@keyframes med-fall {
  0% {
    opacity: 1;
    transform: translateY(-20rpx) rotate(0deg);
  }

  100% {
    opacity: 0;
    transform: translateY(60rpx) rotate(180deg);
  }
}

.med-party__emoji {
  display: block;
  font-size: 128rpx;
  line-height: 1.1;
}

.med-party__title {
  display: block;
  margin: 24rpx 0 12rpx;
  font-size: 44rpx;
  font-weight: 700;
  color: var(--color-text);
}

.med-party__sub {
  display: block;
  padding: 0 60rpx;
  font-size: var(--fs-sub);
  line-height: 1.7;
  color: var(--color-text-sub);
}

.med-party__b {
  font-weight: 700;
  color: var(--color-primary);
}

/* 原型 11b 复盘行：标准 .row（11px 0 + 分割线） */
.med-party__row {
  display: flex;
  gap: 20rpx;
  align-items: center;
  padding: 22rpx 0;
  border-bottom: 2rpx solid var(--color-divider);

  &:last-child {
    border-bottom: none;
  }
}

.med-party__check {
  font-size: 36rpx;
  color: var(--color-success);
}

.med-party__text {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  color: var(--color-text);
  text-align: left;
}

.med-tl-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 28rpx 4rpx 16rpx;
}

.med-tl-hd__title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--color-text);
}

.med-tl-hd__toggle {
  font-size: var(--fs-caption);
  color: var(--color-primary);
}

.med-tl-card {
  padding: 20rpx 24rpx;
  background: var(--color-card);
  border: 3rpx solid transparent;
  border-radius: var(--radius-cell);
  box-shadow: var(--shadow-card);
  transition: border-color var(--dur-normal) var(--ease-out);
}

.med-tl-card.on {
  border-color: #b9cbff;
}

.med-tl-card__t1 {
  display: flex;
  gap: 8rpx;
  align-items: center;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--color-text);
}

.med-tl-card__ok {
  color: var(--color-success);
}

.med-tl-card__t2 {
  margin-top: 4rpx;
  font-size: var(--fs-sub);
  line-height: 1.6;
  color: var(--color-text-sub);
}

.med-missed {
  color: var(--color-danger-strong);
}
</style>
