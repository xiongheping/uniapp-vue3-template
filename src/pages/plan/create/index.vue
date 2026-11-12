<template>
  <x-page :reserve="72">
    <x-nav-bar :title="pageTitle" :before-back="confirmLeave" />

    <x-note type="blue" class="pl-note">
      模板没覆盖？自己填就行：起个名字、选好频率和时段，到点照样提醒你。
    </x-note>

    <!-- 实时预览 -->
    <view class="pl-preview">
      <text class="pl-preview__badge">
        保存后长这样
      </text>
      <view class="pl-preview__head">
        <x-icon name="eye" :size="28" color="#8A93A5" />
        <text>实时预览 · 待完成态</text>
      </view>
      <view class="pl-preview__item">
        <text class="pl-preview__time">
          {{ previewSlot.time }}
        </text>
        <view class="pl-preview__ico" :style="{ background: kind.bg }">
          <x-icon :name="kind.icon" :size="28" :color="kind.fg" />
        </view>
        <view class="x-flex-1">
          <view class="pl-preview__t1">
            {{ name || '未命名计划' }} {{ previewSlot.content }}
          </view>
          <view class="pl-preview__t2">
            到点会提醒 · 每天 {{ times.length }} 次
          </view>
        </view>
        <view class="pl-preview__check" />
      </view>
    </view>

    <view class="pl-label">
      <text>计划名称</text>
      <text class="pl-label__req">
        *
      </text>
    </view>
    <input v-model="name" class="pl-input" :maxlength="20" placeholder="给计划起个名字">

    <view class="pl-label">
      <text>选个图标</text>
      <text class="pl-label__hint">
        （决定卡片颜色和分类）
      </text>
    </view>
    <view class="pl-fchips">
      <x-chip
        v-for="key in CUSTOM_KINDS"
        :key="key"
        :text="planKind(key).label"
        :icon="planKind(key).icon"
        :active="planType === key"
        small
        @click="planType = key"
      />
    </view>

    <view class="pl-label">
      <text>频率</text>
      <text class="pl-label__req">
        *
      </text>
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

    <x-card flat class="pl-count">
      <view class="pl-pcard">
        <view class="pl-field">
          <text class="pl-field__k">
            每天次数
          </text>
          <text class="pl-field__dim">
            由时段数量决定
          </text>
          <text class="pl-field__v">
            {{ times.length }} 次
          </text>
        </view>
      </view>
    </x-card>

    <view class="pl-label">
      <text>时段 · {{ times.length }} 个（点行改内容）</text>
      <text class="pl-label__req">
        *
      </text>
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
      <view class="pl-slot__more">
        <x-icon name="more" :size="32" color="#8A93A5" />
      </view>
    </view>

    <view class="pl-addbtn" @tap="addSlot">
      <x-icon name="plus" :size="32" color="#4F7CFF" />
      <text>添加时段</text>
    </view>
    <x-note type="blue" class="pl-note pl-note--tight">
      加一个时段，次数自动 +1；删一个时段，次数自动 −1，保底 1 个。
    </x-note>

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
          <x-field label="提醒方式" icon="bell" value="系统通知（默认）" tone="primary" chevron @click="notReady('提醒方式')" />
          <x-field label="温和提醒 · 每天最多 2 条">
            <x-switch v-model:checked="gentle" />
          </x-field>
          <x-field label="漏打卡提醒" last>
            <x-switch v-model:checked="missRemind" />
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

    <!-- P3c 时段编辑 -->
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
      <input v-model="editForm.content" class="pl-input" placeholder="如 1 滴 / 300ml">

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

      <view class="pl-rowbtns">
        <view class="pl-rowbtns__cell">
          <view class="pl-btn pl-btn--danger" :class="{ 'pl-btn--disabled': times.length <= 1 }" @tap="removeSlot">
            <x-icon name="trash-2" :size="28" :color="times.length <= 1 ? '#B0B7C3' : '#D93025'" />
            <text>删除本时段</text>
          </view>
        </view>
        <view class="pl-rowbtns__cell">
          <view class="pl-btn pl-btn--ghost" @tap="openCopy">
            <x-icon name="copy" :size="28" color="#4F7CFF" />
            <text>复制到其他时段</text>
          </view>
        </view>
      </view>

      <view class="pl-save">
        <x-button text="保存" @click="saveEdit" />
      </view>
    </x-sheet>

    <!-- P3d 复制目标 -->
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

      <view class="pl-rowbtns pl-rowbtns--copy">
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

    <x-time-picker v-model="pickerValue" v-model:show="pickerShow" title="选择时间" @confirm="onPickTime" />
  </x-page>
</template>

<script setup lang="ts">
import type { PlanSaveBo, PlanTimeBo } from '@/api/xiaoqi/plan';
import type { PlanKind } from '@/mock/plan';
import { PlanApi } from '@/api';
import { CUSTOM_KINDS, FREQ_OPTIONS, planKind } from '@/mock/plan';
import { dotDate, today } from '@/utils/date';

/**
 * 原型 P3b / P3c / P3d：自定义计划创建
 * 次数由时段数量推导，图标决定卡片颜色与分类
 */
interface TimeSlot {
  id: number;
  time: string;
  content: string;
  note: string;
  remind: string;
}

const REMIND_OPTIONS = ['到点', '提前 5 分', '提前 10 分', '提前 30 分'];

/** 页面 PlanKind → xq_plan.plan_type（0用药 1保健品 2喝水 3运动 4宠物 5植物 6健康 7自定义） */
const PLAN_TYPES: Record<PlanKind, number> = {
  medication: 0,
  water: 2,
  exercise: 3,
  pet: 4,
  plant: 5,
  health: 6,
  custom: 7,
};

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

let seed = 2;

const pageTitle = ref<string>('自定义计划');
const name = ref<string>('');
const planType = ref<PlanKind>('health');
const freq = ref<string>('每天');
const moreOpen = ref<boolean>(true);
const scope = ref<'self' | 'family'>('self');
const gentle = ref<boolean>(true);
const missRemind = ref<boolean>(true);
const sound = ref<boolean>(true);
const vibrate = ref<boolean>(true);
const startDate = dotDate(today());

const times = ref<TimeSlot[]>([
  { id: 1, time: '08:00', content: '', note: '', remind: '到点' },
]);

const editShow = ref<boolean>(false);
const copyShow = ref<boolean>(false);
const pickerShow = ref<boolean>(false);
const pickerValue = ref<string>('08:00');
const picked = ref<number[]>([]);
const editForm = reactive<TimeSlot>({ id: 0, time: '08:00', content: '', note: '', remind: '到点' });
const savedSnapshot = ref<string>('');
const saving = ref<boolean>(false);
const leaving = ref<boolean>(false);
let leaveTimer: ReturnType<typeof setTimeout> | null = null;

/** 未保存修改检测：返回、取消、系统返回统一走确认 */
const dirty = computed<boolean>(() => savedSnapshot.value !== '' && formSnapshot() !== savedSnapshot.value);

function formSnapshot(): string {
  return JSON.stringify({
    name: name.value,
    planType: planType.value,
    freq: freq.value,
    scope: scope.value,
    gentle: gentle.value,
    missRemind: missRemind.value,
    sound: sound.value,
    vibrate: vibrate.value,
    times: times.value,
  });
}

function markSaved() {
  savedSnapshot.value = formSnapshot();
}

const kind = computed(() => planKind(planType.value));

const previewSlot = computed<TimeSlot>(() => times.value[0] || { id: 0, time: '--:--', content: '', note: '', remind: '到点' });

const otherSlots = computed<TimeSlot[]>(() => times.value.filter(item => item.id !== editForm.id));

const allPicked = computed<boolean>(() => otherSlots.value.length > 0 && picked.value.length === otherSlots.value.length);

const copyUndoShow = ref<boolean>(false);
const copyUndoCount = ref<number>(0);
const copyUndoKey = ref<number>(0);
let copyBackup: Array<Pick<TimeSlot, 'id' | 'content' | 'note' | 'remind'>> = [];
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const copySub = computed<string>(() => {
  const parts = [editForm.content, editForm.note, editForm.remind].filter(Boolean);
  return `将 ${editForm.time} 的「${parts.join(' · ')}」复制到：`;
});

onLoad((options) => {
  const key = String(options?.type || '');
  const hit = CUSTOM_KINDS.find(item => item === key);
  // 路由未带 type 时保留默认「健康」，与原型 P3b 的选中态一致
  if (hit) {
    planType.value = hit;
  }
  pageTitle.value = '自定义计划';
  markSaved();
});

onBackPress(() => {
  if (leaving.value) {
    return false;
  }
  if (!dirty.value) {
    return false;
  }
  confirmLeave();
  return true;
});

onUnload(() => {
  if (leaveTimer) {
    clearTimeout(leaveTimer);
  }
  if (copyTimer) {
    clearTimeout(copyTimer);
  }
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

function removeSlot() {
  if (times.value.length <= 1) {
    uni.showToast({ title: '至少保留 1 个时段', icon: 'none' });
    return;
  }
  times.value = times.value.filter(item => item.id !== editForm.id);
  editShow.value = false;
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

function leavePage() {
  if (leaving.value) {
    return;
  }
  leaving.value = true;
  if (getCurrentPages().length > 1) {
    uni.navigateBack();
    return;
  }
  uni.redirectTo({ url: '/pages/tab/plan/index' });
}

/** 返回前钩子：返回 true 放行，false 拦截并弹确认 */
function confirmLeave(): boolean {
  if (!dirty.value) {
    return true;
  }
  uni.showModal({
    title: '放弃修改？',
    content: '当前修改尚未保存，离开后不会保留。',
    confirmText: '离开',
    cancelText: '继续编辑',
    success: (res) => {
      if (res.confirm) {
        leavePage();
      }
    },
  });
  return false;
}

function cancel() {
  if (!confirmLeave()) {
    return;
  }
  leavePage();
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
    planType: PLAN_TYPES[planType.value],
    frequencyType: FREQ_TYPES[freq.value] ?? 0,
    startDate: today(),
    visibleScope: scope.value === 'family' ? 1 : 0,
    remindChannel: 0,
    mildRemind: gentle.value ? 1 : 0,
    missedRemind: missRemind.value ? 1 : 0,
    times: times.value.map<PlanTimeBo>(slot => ({
      time: slot.time,
      label: [slot.content.trim(), slot.note.trim()].filter(Boolean).join(' · ') || undefined,
      advanceMinutes: REMIND_MINUTES[slot.remind] ?? 0,
    })),
  };
  saving.value = true;
  try {
    await PlanApi.add(body);
    markSaved();
    uni.showToast({ title: '计划已保存', icon: 'none' });
    leaveTimer = setTimeout(leavePage, 600);
  }
  finally {
    saving.value = false;
  }
}

function notReady(label: string) {
  uni.showToast({ title: `${label}（演示页暂未接入）`, icon: 'none' });
}
</script>

<style lang="scss" scoped>
.pl-note {
  &--tight {
    margin-top: 16rpx;
  }
}

.pl-b {
  font-weight: 700;
}

/* 实时预览 */
.pl-preview {
  position: relative;
  box-sizing: border-box;
  padding: 32rpx;
  margin-bottom: 24rpx;
  background: #ffffff;
  border: 3rpx dashed #c9d6ff;
  border-radius: 32rpx;
}

.pl-preview__badge {
  position: absolute;
  top: -18rpx;
  left: 32rpx;
  padding: 4rpx 20rpx;
  font-size: 20rpx;
  font-weight: 700;
  color: #ffffff;
  background: var(--color-primary);
  border-radius: 20rpx;
}

.pl-preview__head {
  display: flex;
  gap: 12rpx;
  align-items: center;
  margin-bottom: 20rpx;
  font-size: var(--fs-sub);
  color: #8a93a5;
}

.pl-preview__item {
  display: flex;
  gap: 20rpx;
  align-items: center;
  padding: 18rpx 20rpx;
  background: #f7f9ff;
  border-radius: 24rpx;
}

.pl-preview__time {
  flex-shrink: 0;
  min-width: 88rpx;
  font-size: 28rpx;
  font-weight: 800;
  color: var(--color-primary);
}

.pl-preview__ico {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 60rpx;
  height: 60rpx;
  border-radius: 18rpx;
}

.pl-preview__t1 {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--color-text);
}

.pl-preview__t2 {
  margin-top: 2rpx;
  font-size: 22rpx;
  color: #8a93a5;
}

.pl-preview__check {
  flex-shrink: 0;
  width: 40rpx;
  height: 40rpx;
  border: 4rpx solid #d9dee8;
  border-radius: 50%;
}

/* 表单 */
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

.pl-label__req {
  margin-left: 4rpx;
  color: var(--color-danger);
}

.pl-label__hint {
  margin-left: 8rpx;
  font-weight: 400;
  color: #8a93a5;
}

.pl-input {
  box-sizing: border-box;
  width: 100%;
  /* 不用上下内边距，避免小程序原生 input 行高大于内容区导致文字偏上 */
  height: 86rpx;
  min-height: 86rpx;
  padding: 0 27rpx;
  font-size: 28rpx;
  color: var(--color-text);
  background: #ffffff;
  border: 3rpx solid #e4e8f0;
  border-radius: 23rpx;
}

.pl-fchips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;

  /* 原型 .freq-chips .chip 为 44px 高，x-chip--small 默认 64rpx 偏矮 */
  :deep(.xch--small) {
    min-height: 80rpx;
  }
}

/* 原型全局为 border-box；本页内统一，避免 min-height 与 padding 叠加撑高 */
:deep(.xf) {
  box-sizing: border-box;
}

.pl-pcard {
  padding: 0 28rpx;
}

.pl-count {
  margin-top: 20rpx;
}

.pl-field {
  box-sizing: border-box;
  display: flex;
  gap: 16rpx;
  align-items: center;
  min-height: 88rpx;
  padding: 26rpx 0;
  font-size: 28rpx;
}

.pl-field__k {
  font-weight: 500;
  color: var(--color-text);
}

.pl-field__dim {
  margin-left: auto;
  font-size: var(--fs-sub);
  color: #b0b7c3;
}

.pl-field__v {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--color-primary);
}

.pl-timeval {
  font-size: 36rpx;
  font-weight: 800;
  line-height: 1.2;
  color: var(--color-primary);
}

/* 时段行 */
.pl-slot {
  box-sizing: border-box;
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
  box-sizing: border-box;
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

/* 更多设置 */
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

/* 底部保存条 */
.pl-sticky {
  display: flex;
  gap: 16rpx;
  margin-top: -24rpx;
}

.pl-sticky__cell {
  flex: 1;
}

/* 时段编辑 / 复制弹层：对齐原型 P3c / P3d 的 .sheet 规格 */
:deep(.xsh) {
  box-sizing: border-box;
  max-height: 88vh;
  padding: 38rpx 35rpx calc(46rpx + env(safe-area-inset-bottom, 0px));
  overflow-y: auto;
  border-radius: 38rpx 38rpx 0 0;
}

:deep(.xsh__handle) {
  width: 69rpx;
  height: 8rpx;
  margin: 0 auto 27rpx;
  border-radius: 4rpx;
}

:deep(.xsh__title) {
  margin-bottom: 12rpx;
  font-size: 31rpx;
}

:deep(.xsh__sub) {
  margin-bottom: 27rpx;
  font-size: 23rpx;
}

.pl-rowbtns {
  display: flex;
  gap: 16rpx;
  align-items: center;
  margin-top: 32rpx;

  /* 原型 P3d 的 .row-btns 用默认 margin-top:12px，按钮字号 14px、min-height 48px */
  &--copy {
    margin-top: 23rpx;

    :deep(.x-button) {
      min-height: 96rpx;
      margin-top: 0;
      font-size: 27rpx;
    }
  }
}

.pl-rowbtns__cell {
  flex: 1;
}

.pl-btn {
  box-sizing: border-box;
  display: flex;
  gap: 8rpx;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 94rpx;
  padding: 0 16rpx;
  font-size: 25rpx;
  font-weight: 600;
  line-height: 1;
  color: #ffffff;
  text-align: center;
  background: var(--color-primary);
  border-radius: 27rpx;

  &--ghost {
    color: var(--color-primary);
    background: #ffffff;
    border: 3rpx solid var(--color-primary);
  }

  &--danger {
    color: var(--color-danger);
    background: #ffffff;
    border: 3rpx solid #fbcbcb;
  }

  /* 原型 .btn:disabled：仅剩 1 个时段时置灰，点击仍提示「至少保留 1 个时段」 */
  &--disabled {
    color: #b0b7c3;
    background: #eef0f5;
    border-color: #eef0f5;
  }
}

.pl-save {
  margin-top: 23rpx;

  :deep(.x-button) {
    min-height: 92rpx;
    margin-top: 0;
    font-size: 27rpx;
  }
}

.pl-crow {
  box-sizing: border-box;
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
  box-sizing: border-box;
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
