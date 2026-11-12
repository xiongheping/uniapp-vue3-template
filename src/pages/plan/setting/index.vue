<template>
  <x-page :reserve="72">
    <x-nav-bar title="喝水计划" right-icon="more" @right="planMenuShow = true" />

    <x-card class="pl-hero">
      <view class="pl-hero__row">
        <view class="pl-hero__ico" :style="{ background: kind.bg }">
          <x-icon :name="kind.icon" :size="48" :color="kind.fg" />
        </view>
        <view class="x-flex-1">
          <view class="pl-hero__t1">
            {{ heroTitle }}
          </view>
          <view class="pl-hero__t2">
            {{ heroSub }}
          </view>
        </view>
        <x-tag type="blue">
          {{ freq }}
        </x-tag>
      </view>
    </x-card>

    <view class="pl-label">
      计划名称
    </view>
    <input v-model="name" class="pl-input" :maxlength="20" placeholder="给计划起个名字">

    <view class="pl-label">
      频率
    </view>
    <view class="pl-fchips">
      <x-chip
        v-for="item in FREQ_OPTIONS"
        :key="item"
        :text="item"
        :active="freq === item"
        small
        @click="freq = item"
      />
    </view>

    <view class="pl-label">
      时段 · {{ times.length }} 个（点行改内容）
    </view>
    <view v-for="slot in times" :key="slot.id" class="pl-slot" @tap="openEdit(slot)">
      <text class="pl-slot__tm">
        {{ slot.time }}
      </text>
      <view class="x-flex-1">
        <view class="pl-slot__t1">
          {{ slot.content }}{{ slot.note ? ` · ${slot.note}` : '' }}
        </view>
        <view class="pl-slot__t2">
          提醒：{{ slot.remind }}
        </view>
      </view>
      <view class="pl-slot__more" aria-label="管理时段" @tap.stop="openManage(slot)">
        <x-icon name="more" :size="32" color="#8A93A5" />
      </view>
    </view>

    <view class="pl-addbtn" @tap="addSlot">
      <x-icon name="plus" :size="32" color="#4F7CFF" />
      <text>添加时段</text>
    </view>

    <view class="pl-sect" @tap="moreOpen = !moreOpen">
      <text class="pl-sect__title">
        更多设置
      </text>
      <view class="pl-sect__fold">
        <text>{{ moreOpen ? '收起' : '展开' }}</text>
        <x-icon :name="moreOpen ? 'chev-u' : 'chev-d'" :size="28" color="#4F7CFF" />
      </view>
    </view>

    <template v-if="moreOpen">
      <view class="pl-label">
        通知方式
      </view>
      <x-card flat>
        <view class="pl-pcard">
          <x-field label="提醒方式" icon="bell" value="系统通知（默认）" tone="primary" chevron @click="gotoNotify" />
          <x-field label="温和提醒 · 每天最多 2 条">
            <x-switch v-model:checked="gentle" />
          </x-field>
          <x-field label="App 内横幅提醒" last>
            <x-switch v-model:checked="banner" />
          </x-field>
        </view>
      </x-card>

      <view class="pl-label">
        开始与结束
      </view>
      <x-card flat>
        <view class="pl-pcard">
          <x-field label="开始日期" :value="startDate" chevron @click="notReady('开始日期')" />
          <x-field label="结束日期" value="长期" chevron last @click="notReady('结束日期')" />
        </view>
      </x-card>

      <view class="pl-label">
        可见范围
      </view>
      <x-card flat>
        <view class="pl-pcard">
          <x-field label="谁能看到" last>
            <view class="pl-scope">
              <x-chip text="仅自己" icon="lock" :active="scope === 'self'" small @click="scope = 'self'" />
              <x-chip text="家人" :active="scope === 'family'" small @click="scope = 'family'" />
            </view>
          </x-field>
        </view>
      </x-card>

      <view class="pl-label">
        打卡反馈
      </view>
      <x-card flat>
        <view class="pl-pcard">
          <view class="pl-tip">
            打卡成功后，用声音与震动确认已记录
          </view>
          <x-field label="完成提醒音">
            <x-switch v-model:checked="sound" />
          </x-field>
          <x-field label="完成震动" last>
            <x-switch v-model:checked="vibrate" />
          </x-field>
        </view>
      </x-card>
    </template>

    <template #sticky>
      <view class="pl-sticky">
        <view class="pl-sticky__cell">
          <x-button type="ghost" text="取消" @click="cancel" />
        </view>
        <view class="pl-sticky__cell">
          <x-button :text="saving ? '保存中…' : '保存计划'" :disabled="saving" @click="save" />
        </view>
      </view>
    </template>

    <!-- 时段编辑（同 P3c） -->
    <x-sheet v-model:show="editShow" :title="`编辑时段 · ${editForm.time}`" :sub="`只改这一时段，不影响其他 ${Math.max(0, times.length - 1)} 个`">
      <x-card flat>
        <view class="pl-pcard">
          <x-field label="时间" icon="clock" chevron last @click="openPicker">
            <text class="pl-timeval">
              {{ editForm.time }}
            </text>
          </x-field>
        </view>
      </x-card>

      <view class="pl-label pl-label--tight">
        本时段内容
      </view>
      <input v-model="editForm.content" class="pl-input" placeholder="如 300ml">

      <view class="pl-label">
        备注（可选）
      </view>
      <input v-model="editForm.note" class="pl-input" placeholder="如 午饭后">

      <view class="pl-label">
        提前提醒
      </view>
      <view class="pl-fchips">
        <x-chip
          v-for="item in REMIND_OPTIONS"
          :key="item"
          :text="item"
          :active="editForm.remind === item"
          small
          @click="editForm.remind = item"
        />
      </view>

      <x-button class="pl-savebtn" text="保存" @click="saveEdit" />
    </x-sheet>

    <!-- 时段 ⋯ 管理 -->
    <x-sheet v-model:show="menuShow" mode="center" title="时段操作" :sub="menuSub">
      <view class="pl-menu">
        <view class="pl-menu__item" @tap="openCopy">
          <x-icon name="copy" :size="40" color="#4F7CFF" />
          <text>复制到其他时段</text>
        </view>
        <view class="pl-menu__item pl-menu__item--danger" @tap="removeSlot">
          <x-icon name="trash-2" :size="40" color="#D93025" />
          <text>删除本时段</text>
        </view>
      </view>
    </x-sheet>

    <!-- 复制目标（同 P3d） -->
    <x-sheet v-model:show="copyShow" title="复制到其他时段" :sub="copySub">
      <view class="pl-pickall" @tap="toggleAll">
        <x-check :checked="allPicked" />
        <text class="pl-pickall__text">
          全选（{{ otherSlots.length }} 个时段）
        </text>
      </view>
      <view
        v-for="slot in otherSlots"
        :key="slot.id"
        class="pl-crow"
        :class="{ 'pl-crow--on': picked.includes(slot.id) }"
        @tap="togglePick(slot.id)"
      >
        <x-check :checked="picked.includes(slot.id)" />
        <text class="pl-crow__tm">
          {{ slot.time }}
        </text>
        <view class="x-flex-1">
          <view class="pl-crow__t1">
            当前 {{ slot.content }}{{ slot.note ? ` · ${slot.note}` : '' }}
          </view>
          <view class="pl-crow__t2">
            复制后覆盖内容与提醒
          </view>
        </view>
      </view>

      <view v-if="picked.length" class="pl-coverhint">
        将覆盖 {{ picked.length }} 个时段的内容、备注与提前提醒，时间不变
      </view>

      <x-note type="blue">
        <text>只复制内容、备注、提前提醒；</text>
        <text class="pl-b">
          时间不复制
        </text>
        <text>，保留各时段原时间。</text>
      </x-note>

      <view class="pl-rowbtns">
        <view class="pl-rowbtns__cell">
          <x-button type="ghost" text="取消" @click="copyShow = false" />
        </view>
        <view class="pl-rowbtns__cell">
          <x-button :text="`确认复制到 ${picked.length} 个时段`" @click="doCopy" />
        </view>
      </view>
    </x-sheet>

    <view v-if="copyUndoShow" class="pl-snack">
      <x-icon name="check" :size="28" color="#FFFFFF" />
      <text class="pl-snack__text">
        已复制到 {{ copyUndoCount }} 个时段
      </text>
      <view class="pl-snack__undo" @tap="undoCopy">
        <x-icon name="undo" :size="28" color="#8FB0FF" />
        <text>撤销</text>
      </view>
      <view :key="copyUndoKey" class="pl-snack__bar" />
    </view>

    <!-- 计划 ⋯（P7b） -->
    <x-sheet v-model:show="planMenuShow" title="管理计划" :sub="planSub">
      <view class="pl-menu">
        <view v-for="item in PLAN_MENU" :key="item.key" class="pl-menu__item" :class="{ 'pl-menu__item--danger': item.danger }" @tap="onPlanMenu(item)">
          <x-icon :name="item.icon" :size="32" :color="item.danger ? '#D93025' : '#6B7590'" />
          <text>{{ item.text }}</text>
        </view>
      </view>
      <template #footer>
        <x-button type="link" text="取消" @click="planMenuShow = false" />
      </template>
    </x-sheet>

    <x-time-picker v-model="pickerValue" v-model:show="pickerShow" title="选择时间" @confirm="onPickTime" />
  </x-page>
</template>

<script setup lang="ts">
import type { PlanSaveBo, PlanTimeBo } from '@/api/xiaoqi/plan';
import type { PlanKind } from '@/mock/plan';
import { PlanApi } from '@/api';
import { FREQ_OPTIONS, planKind } from '@/mock/plan';
import { dotDate, today } from '@/utils/date';

/**
 * 原型 P4：计划设置 · 通用层（喝水）
 * 时段数量变化会带动次数与总量，保存前统一校验
 */
interface TimeSlot {
  id: number;
  time: string;
  content: string;
  note: string;
  remind: string;
}

const REMIND_OPTIONS = ['到点', '提前 5 分', '提前 10 分', '提前 30 分'];

/** 页面频率文案 → xq_plan.frequency_type（0每天 1每周 2每月 3每N天 4按需） */
const FREQ_TYPES: Record<string, number> = {
  '每天': 0,
  '每周': 1,
  '每月': 2,
  '每 N 天': 3,
  '按需': 4,
};

/** 页面提醒文案 → xq_plan_schedule.advance_minutes */
const REMIND_MINUTES: Record<string, number> = {
  '到点': 0,
  '提前 5 分': 5,
  '提前 10 分': 10,
  '提前 30 分': 30,
};

const PLAN_MENU = [
  { key: 'edit', text: '编辑计划', icon: 'pencil', danger: false },
  { key: 'history', text: '打卡历史', icon: 'history', danger: false },
  { key: 'pause', text: '暂停计划', icon: 'pause', danger: false },
  { key: 'scope', text: '可见范围', icon: 'eye', danger: false },
  { key: 'copy', text: '复制计划', icon: 'copy', danger: false },
  { key: 'delete', text: '删除计划', icon: 'trash-2', danger: true },
];

let seed = 2;

const kind = planKind('water' as PlanKind);
const name = ref<string>('');
const freq = ref<string>('每天');
const moreOpen = ref<boolean>(true);
const scope = ref<'self' | 'family'>('self');
const gentle = ref<boolean>(true);
const banner = ref<boolean>(false);
const sound = ref<boolean>(true);
const vibrate = ref<boolean>(true);
const startDate = dotDate(today());

const times = ref<TimeSlot[]>([
  { id: 1, time: '08:00', content: '', note: '', remind: '到点' },
]);

const editShow = ref<boolean>(false);
const menuShow = ref<boolean>(false);
const copyShow = ref<boolean>(false);
const planMenuShow = ref<boolean>(false);
const pickerShow = ref<boolean>(false);
const pickerValue = ref<string>('08:00');
const picked = ref<number[]>([]);
const editForm = reactive<TimeSlot>({ id: 0, time: '08:00', content: '', note: '', remind: '到点' });

const heroTitle = computed<string>(() => name.value.trim() || '未命名计划');
const heroSub = computed<string>(() => {
  const parts = [`每天 ${times.value.length} 次`];
  const content = times.value.find(item => item.content.trim())?.content.trim();
  if (content) {
    parts.push(`每次 ${content}`);
  }
  parts.push('总量自动计算');
  return parts.join(' · ');
});
const planSub = computed<string>(() => `喝水 · 每天 ${times.value.length} 次`);

const menuSub = computed<string>(() => [editForm.time, editForm.content].filter(Boolean).join(' · '));

const otherSlots = computed<TimeSlot[]>(() => times.value.filter(item => item.id !== editForm.id));

const allPicked = computed<boolean>(() => otherSlots.value.length > 0 && picked.value.length === otherSlots.value.length);

const copyUndoShow = ref<boolean>(false);
const copyUndoCount = ref<number>(0);
const copyUndoKey = ref<number>(0);
const saving = ref<boolean>(false);
let copyBackup: Array<Pick<TimeSlot, 'id' | 'content' | 'note' | 'remind'>> = [];
let copyTimer: ReturnType<typeof setTimeout> | null = null;

onUnload(() => {
  if (copyTimer) {
    clearTimeout(copyTimer);
  }
});

const copySub = computed<string>(() => {
  const parts = [editForm.content, editForm.note, editForm.remind].filter(Boolean);
  return `将 ${editForm.time} 的「${parts.join(' · ')}」复制到：`;
});

function openEdit(slot: TimeSlot) {
  Object.assign(editForm, slot);
  editShow.value = true;
}

function saveEdit() {
  const target = times.value.find(item => item.id === editForm.id);
  if (target) {
    Object.assign(target, editForm);
  }
  editShow.value = false;
}

function addSlot() {
  times.value.push({ id: seed++, time: '08:00', content: '', note: '', remind: '到点' });
}

function openManage(slot: TimeSlot) {
  Object.assign(editForm, slot);
  menuShow.value = true;
}

function openPicker() {
  pickerValue.value = editForm.time;
  pickerShow.value = true;
}

function onPickTime(value: string) {
  editForm.time = value;
}

function openCopy() {
  picked.value = [];
  menuShow.value = false;
  copyShow.value = true;
}

function togglePick(id: number) {
  picked.value = picked.value.includes(id)
    ? picked.value.filter(item => item !== id)
    : [...picked.value, id];
}

function toggleAll() {
  picked.value = allPicked.value ? [] : otherSlots.value.map(item => item.id);
}

function doCopy() {
  if (!picked.value.length) {
    uni.showToast({ title: '请选择要复制的时段', icon: 'none' });
    return;
  }
  copyBackup = times.value
    .filter(item => picked.value.includes(item.id))
    .map(({ id, content, note, remind }) => ({ id, content, note, remind }));
  times.value.forEach((item) => {
    if (picked.value.includes(item.id)) {
      item.content = editForm.content;
      item.note = editForm.note;
      item.remind = editForm.remind;
    }
  });
  copyShow.value = false;
  copyUndoCount.value = picked.value.length;
  copyUndoShow.value = true;
  copyUndoKey.value += 1;
  if (copyTimer) {
    clearTimeout(copyTimer);
  }
  copyTimer = setTimeout(() => {
    copyUndoShow.value = false;
    copyBackup = [];
  }, 30000);
}

function undoCopy() {
  copyBackup.forEach(({ id, content, note, remind }) => {
    const target = times.value.find(item => item.id === id);
    if (target) {
      Object.assign(target, { content, note, remind });
    }
  });
  copyUndoShow.value = false;
  copyBackup = [];
  if (copyTimer) {
    clearTimeout(copyTimer);
    copyTimer = null;
  }
  uni.showToast({ title: '已撤销复制', icon: 'none' });
}

function removeSlot() {
  if (times.value.length <= 1) {
    uni.showToast({ title: '至少保留 1 个时段', icon: 'none' });
    return;
  }
  times.value = times.value.filter(item => item.id !== editForm.id);
  menuShow.value = false;
  uni.showToast({ title: '已删除本时段', icon: 'none' });
}

function onPlanMenu(item: { key: string }) {
  planMenuShow.value = false;
  if (item.key === 'edit') {
    uni.navigateTo({ url: '/pages/plan/create/index?type=water' });
    return;
  }
  if (item.key === 'history') {
    uni.navigateTo({ url: '/pages/plan/checkin/index?kind=water' });
    return;
  }
  notReady(item.key);
}

function gotoNotify() {
  uni.navigateTo({ url: '/pages/plan/notify/index' });
}

function notReady(label: string) {
  uni.showToast({ title: `${label}（演示页暂未接入）`, icon: 'none' });
}

function cancel() {
  uni.navigateBack({
    fail: () => {
      uni.redirectTo({ url: '/pages/tab/plan/index' });
    },
  });
}

async function save() {
  if (saving.value) {
    return;
  }
  const planName = name.value.trim();
  if (!planName) {
    uni.showToast({ title: '请填写计划名称', icon: 'none' });
    return;
  }
  const body: PlanSaveBo = {
    planName,
    planType: 2,
    frequencyType: FREQ_TYPES[freq.value] ?? 0,
    startDate: today(),
    visibleScope: scope.value === 'family' ? 1 : 0,
    remindChannel: banner.value ? 1 : 0,
    mildRemind: gentle.value ? 1 : 0,
    times: times.value.map<PlanTimeBo>(slot => ({
      time: slot.time,
      label: [slot.content.trim(), slot.note.trim()].filter(Boolean).join(' · ') || undefined,
      advanceMinutes: REMIND_MINUTES[slot.remind] ?? 0,
    })),
  };
  saving.value = true;
  try {
    await PlanApi.add(body);
    uni.showToast({ title: '计划已保存', icon: 'none' });
    setTimeout(() => {
      uni.navigateBack({
        fail: () => {
          uni.redirectTo({ url: '/pages/tab/plan/index' });
        },
      });
    }, 600);
  }
  finally {
    saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.pl-hero {
  padding: 28rpx;
}

.pl-hero__row {
  display: flex;
  gap: 24rpx;
  align-items: center;
}

.pl-hero__ico {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  border-radius: 26rpx;
}

.pl-hero__t1 {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--color-text);
}

.pl-hero__t2 {
  margin-top: 4rpx;
  font-size: var(--fs-caption);
  color: var(--color-text-sub);
}

.pl-b {
  font-weight: 700;
}

.pl-label {
  display: flex;
  align-items: center;
  margin: 28rpx 4rpx 12rpx;
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--color-text-sub);

  &--tight {
    margin-top: 0;
  }
}

.pl-input {
  box-sizing: border-box;
  width: 100%;
  /* 不用上下内边距，避免小程序原生 input 行高大于内容区导致文字偏上 */
  height: 96rpx;
  min-height: 96rpx;
  padding: 0 27rpx;
  font-size: 28rpx;
  color: var(--color-text);
  background: #ffffff;
  border: 3rpx solid #e4e8f0;
  border-radius: 24rpx;
}

.pl-fchips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.pl-pcard {
  padding: 0 28rpx;
}

.pl-timeval {
  font-size: 36rpx;
  font-weight: 800;
  color: var(--color-primary);
}

.pl-slot {
  display: flex;
  gap: 20rpx;
  align-items: center;
  min-height: 112rpx;
  padding: 22rpx 24rpx;
  margin-bottom: 16rpx;
  background: #f7f9ff;
  border: 2rpx solid #e4ecff;
  border-radius: 24rpx;
}

.pl-slot__tm {
  flex-shrink: 0;
  min-width: 104rpx;
  font-size: 32rpx;
  font-weight: 800;
  color: var(--color-primary);
}

.pl-slot__t1 {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--color-text);
}

.pl-slot__t2 {
  margin-top: 2rpx;
  font-size: 22rpx;
  color: #8a93a5;
}

.pl-slot__more {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  margin: -8rpx -12rpx -8rpx 0;
  border-radius: 20rpx;
}

.pl-addbtn {
  display: flex;
  gap: 12rpx;
  align-items: center;
  justify-content: center;
  min-height: 88rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--color-primary);
  background: #ffffff;
  border: 3rpx solid var(--color-primary);
  border-radius: 28rpx;
}

.pl-sect {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 32rpx 4rpx 16rpx;
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--color-text-sub);
}

.pl-sect__fold {
  display: flex;
  gap: 8rpx;
  align-items: center;
  min-height: 88rpx;
  font-weight: 600;
  color: var(--color-primary);
}

.pl-scope {
  display: flex;
  gap: 10rpx;
  align-items: center;
}

.pl-tip {
  padding-top: 20rpx;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}

.pl-sticky {
  display: flex;
  gap: 16rpx;
  margin-top: -24rpx;
}

.pl-sticky__cell {
  flex: 1;
}

.pl-savebtn {
  margin-top: 32rpx;
}

.pl-menu {
  overflow: hidden;
}

.pl-menu__item {
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

.pl-rowbtns {
  display: flex;
  gap: 16rpx;
  align-items: center;
  margin-top: 32rpx;
}

.pl-rowbtns__cell {
  flex: 1;
}

.pl-crow {
  display: flex;
  gap: 20rpx;
  align-items: center;
  min-height: 112rpx;
  padding: 22rpx 24rpx;
  margin-bottom: 16rpx;
  background: #f7f9ff;
  border: 2rpx solid transparent;
  border-radius: 24rpx;

  &--on {
    border-color: var(--color-primary);
  }
}

.pl-crow__tm {
  flex-shrink: 0;
  min-width: 104rpx;
  font-size: 32rpx;
  font-weight: 800;
  color: var(--color-primary);
}

.pl-crow__t1 {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--color-text);
}

.pl-crow__t2 {
  margin-top: 2rpx;
  font-size: 22rpx;
  color: #8a93a5;
}

/* 全选 / 覆盖提示 / 复制撤销条 */
.pl-pickall {
  display: flex;
  gap: 16rpx;
  align-items: center;
  min-height: 88rpx;
  padding: 0 8rpx 8rpx;
  margin-bottom: 8rpx;
  border-bottom: 2rpx solid var(--color-divider);
}

.pl-pickall__text {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--color-text);
}

.pl-coverhint {
  margin-top: 8rpx;
  font-size: 24rpx;
  font-weight: 600;
  line-height: 1.6;
  color: var(--color-primary);
}

.pl-snack {
  position: fixed;
  right: 32rpx;
  bottom: calc(180rpx + env(safe-area-inset-bottom, 0px));
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
  animation: pl-copy-bar 30s linear forwards;
}

@keyframes pl-copy-bar {
  from {
    width: 84%;
  }

  to {
    width: 0;
  }
}
</style>
