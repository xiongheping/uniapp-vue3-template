<template>
  <x-page :reserve="72">
    <x-nav-bar :title="isPrn ? '用药计划 · 按需' : '用药计划'" right-icon="more" @right="openPlanMenu" />

    <x-card class="pl-hero">
      <view class="pl-hero__row">
        <view class="pl-hero__ico" :style="{ background: kind.bg }">
          <x-icon :name="kind.icon" :size="48" :color="kind.fg" />
        </view>
        <view class="x-flex-1">
          <view class="pl-hero__t1">
            {{ DRUG_NAME }}
          </view>
          <view class="pl-hero__t2">
            {{ DRUG_SPEC }} · {{ isPrn ? '按需服用' : '关联物品' }}
            <x-icon v-if="!isPrn" class="pl-hero__chev" name="chev-r" :size="28" color="#C0C6D2" />
          </view>
        </view>
        <x-tag type="orange">
          {{ isPrn ? '按需' : '用药' }}
        </x-tag>
      </view>
      <x-field
        v-if="!isPrn"
        class="pl-hero__field"
        label="说明书摘录"
        icon="file-text"
        value="查看原文"
        tone="primary"
        chevron
        last
        @click="notReady('说明书原文')"
      />
    </x-card>

    <view class="pl-label">
      服药类型
    </view>
    <view class="pl-seg">
      <view class="pl-seg__item" :class="{ 'pl-seg__item--on': !isPrn }" @tap="switchMode(false)">
        <x-icon name="clock" :size="32" :color="isPrn ? '#6B7590' : '#4F7CFF'" />
        <text>按时</text>
      </view>
      <view class="pl-seg__item" :class="{ 'pl-seg__item--on': isPrn }" @tap="switchMode(true)">
        <x-icon name="scale" :size="32" :color="isPrn ? '#4F7CFF' : '#6B7590'" />
        <text>按需</text>
      </view>
    </view>

    <!-- 按时：固定时段 -->
    <template v-if="!isPrn">
      <view class="pl-label">
        服用时段（按时模式）
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
      <x-note type="purple" class="pl-note">
        切到「按需」后：每日最大剂量 / 最小间隔 / PRN 原因，不显示固定时段。
      </x-note>
    </template>

    <!-- 按需：剂量规则 -->
    <template v-else>
      <view class="pl-label">
        按需规则
      </view>
      <x-card flat>
        <view class="pl-pcard">
          <x-field label="每日最大剂量">
            <input v-model="maxDailyDose" type="digit" class="pl-num-input" placeholder="如 3">
            <text class="pl-num-unit">
              {{ DOSAGE_UNIT }}
            </text>
          </x-field>
          <x-field label="两次最小间隔">
            <input v-model="minIntervalHours" type="number" class="pl-num-input" placeholder="如 6">
            <text class="pl-num-unit">
              小时
            </text>
          </x-field>
          <x-field label="单次剂量" last>
            <input v-model="dosage" type="digit" class="pl-num-input" placeholder="如 1">
            <text class="pl-num-unit">
              {{ DOSAGE_UNIT }}
            </text>
          </x-field>
        </view>
      </x-card>

      <view class="pl-label">
        服用原因（PRN）
      </view>
      <view class="pl-fchips">
        <x-chip
          v-for="item in PRN_REASONS"
          :key="item"
          :text="item"
          :active="prnReason === item"
          small
          @click="prnReason = item"
        />
        <x-chip small icon="plus" @click="notReady('新增服用原因')" />
      </view>
      <x-note type="blue" class="pl-note">
        按需模式不生成固定时段，用户随时手动打卡；系统只校验「不超日最大剂量」和「不小于最小间隔」。
      </x-note>
    </template>

    <view class="pl-label">
      疗程与库存
    </view>
    <x-card flat>
      <view class="pl-pcard">
        <picker mode="date" :value="courseStart" @change="onCourseStart">
          <x-field label="开始日期" :value="dotDate(courseStart)" tone="primary" chevron />
        </picker>
        <x-field label="疗程">
          <input v-model="courseDays" type="number" class="pl-num-input" placeholder="如 7">
          <text class="pl-num-unit">
            天
          </text>
        </x-field>
        <x-field label="结束日期" :value="`${dotDate(courseEnd)} · 由疗程推算`" />
        <x-field v-if="!isPrn" label="当前进度" :value="`第 1 / ${courseDays || '-'} 天`" />
        <x-field v-if="!isPrn" label="结束自动停提醒">
          <x-switch v-model:checked="autoStop" />
        </x-field>
        <x-field label="库存" :value="stockLabel" chevron @click="openStock" />
        <x-field v-if="!isPrn" label="药量不足提醒" :value="`≤ ${LOW_STOCK_DAYS} 天用量时`" chevron last @click="notReady('药量不足提醒')" />
      </view>
    </x-card>

    <!-- 病症标签（按时模式） -->
    <template v-if="!isPrn">
      <view class="pl-label">
        病症标签
      </view>
      <view class="pl-fchips">
        <x-chip
          v-for="item in ILLNESS_TAGS"
          :key="item"
          :text="item"
          :active="illness === item"
          small
          @click="illness = item"
        />
        <x-chip small icon="plus" @click="notReady('新增病症标签')" />
      </view>
    </template>

    <!-- P5b 按需不展示可见范围（原型 P5b 无该区块） -->
    <template v-if="!isPrn">
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
    </template>

    <view class="pl-safe">
      <x-icon name="shield-check" :size="32" color="#52C41A" />
      <view class="pl-safe__body">
        <template v-if="isPrn">
          <text class="pl-safe__title">
            按需模式仍受「每日最大剂量」保护
          </text>
          <text>：超过上限时打卡按钮置灰并提示「今日已达上限，请遵医嘱」。</text>
        </template>
        <template v-else>
          <text class="pl-safe__title">
            用药到点强提醒已开启 · 不可关闭
          </text>
          <text>：这是安全功能，可在提醒与通知查看但无法关闭。</text>
        </template>
      </view>
    </view>

    <template #sticky>
      <view class="pl-sticky">
        <view class="pl-sticky__cell">
          <x-button type="ghost" text="取消" @click="cancel" />
        </view>
        <view class="pl-sticky__cell">
          <x-button :text="saving ? '保存中…' : isPrn ? '保存按需计划' : '保存用药计划'" :disabled="saving" @click="save" />
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
      <input v-model="editForm.content" class="pl-input" placeholder="如 1 粒">

      <view class="pl-label">
        备注（可选）
      </view>
      <input v-model="editForm.note" class="pl-input" placeholder="如 早餐后">

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
          <view class="pl-btn pl-btn--danger" @tap="removeSlot">
            <x-icon name="trash-2" :size="28" color="#D93025" />
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

      <x-button class="pl-savebtn" text="保存" @click="saveEdit" />
    </x-sheet>

    <!-- 库存编辑 -->
    <x-sheet v-model:show="stockShow" title="编辑库存" sub="用于药量不足提醒，可随时调整">
      <view class="pl-label pl-label--tight">
        剩余数量
      </view>
      <input v-model="stockForm.quantity" class="pl-input" type="digit" placeholder="如 12">

      <view class="pl-label">
        单位
      </view>
      <view class="pl-fchips">
        <x-chip
          v-for="item in STOCK_UNITS"
          :key="item"
          :text="item"
          :active="stockForm.unit === item"
          small
          @click="stockForm.unit = item"
        />
      </view>

      <x-button class="pl-savebtn" text="保存" @click="saveStock" />
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
    <x-sheet v-model:show="planMenuShow" title="管理计划" :sub="isPrn ? `${DRUG_NAME} · 按需` : `${DRUG_NAME} · 每天 ${times.length} 次`">
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
import type { PlanKind } from '@/mock/plan';
import { MedicationApi } from '@/api';
import { planKind } from '@/mock/plan';
import { addDays, dotDate, today } from '@/utils/date';

/**
 * 原型 P5 / P5b：用药计划设置（按时 ↔ 按需）
 * 按时走固定时段；按需改为剂量规则 + PRN 原因，不生成时段
 */
interface TimeSlot {
  id: number;
  time: string;
  content: string;
  note: string;
  remind: string;
}

const REMIND_OPTIONS = ['到点', '提前 5 分', '提前 10 分', '提前 30 分'];
const ILLNESS_TAGS = ['感冒发烧', '过敏鼻炎', '头痛止痛', '咳嗽咽痛'];
const PRN_REASONS = ['头痛', '发热', '牙痛', '痛经'];

/** 病症标签 → 后端 eventType（0感冒发烧 1过敏鼻炎 3头痛止痛 4咳嗽咽痛） */
const ILLNESS_EVENT_TYPES: Record<string, number> = {
  感冒发烧: 0,
  过敏鼻炎: 1,
  头痛止痛: 3,
  咳嗽咽痛: 4,
};

/** 新建计划默认药品信息（后续接物品库后可替换） */
const DRUG_NAME = '布洛芬缓释胶囊';
const DRUG_SPEC = '0.3g';
const DOSAGE_UNIT = '粒';
const LOW_STOCK_DAYS = 3;
const STOCK_UNITS = [DOSAGE_UNIT, '片', 'ml', '袋'];

/** 可编辑的剂量 / 疗程参数 */
const dosage = ref<string>('1');
const maxDailyDose = ref<string>('3');
const minIntervalHours = ref<string>('6');
const courseDays = ref<string>('7');
const courseStart = ref<string>(today());
const courseEnd = computed<string>(() => {
  const days = Number(courseDays.value);
  const valid = Number.isFinite(days) && days >= 1 ? Math.floor(days) : 1;
  return addDays(valid - 1, courseStart.value);
});

const PLAN_MENU = [
  { key: 'edit', text: '编辑计划', icon: 'pencil', danger: false },
  { key: 'history', text: '打卡历史', icon: 'history', danger: false },
  { key: 'pause', text: '暂停计划', icon: 'pause', danger: false },
  { key: 'scope', text: '可见范围', icon: 'eye', danger: false },
  { key: 'copy', text: '复制计划', icon: 'copy', danger: false },
  { key: 'delete', text: '删除计划', icon: 'trash-2', danger: true },
];

let seed = 3;

const kind = planKind('medication' as PlanKind);
const isPrn = ref<boolean>(false);
const scope = ref<'self' | 'family'>('self');
const autoStop = ref<boolean>(true);
const illness = ref<string>('');
const prnReason = ref<string>('');
const saving = ref<boolean>(false);
/** 有 id 走 PUT 修改，否则 POST 新增 */
const planId = ref<number | string>('');

const stockShow = ref<boolean>(false);
const stockQuantity = ref<number | null>(null);
const stockUnit = ref<string>(DOSAGE_UNIT);
const stockForm = reactive({ quantity: '', unit: DOSAGE_UNIT });

const stockLabel = computed<string>(() => (stockQuantity.value === null ? '未填写' : `${stockQuantity.value} ${stockUnit.value}`));

const times = ref<TimeSlot[]>([
  { id: 1, time: '08:00', content: '', note: '', remind: '到点' },
]);

const editShow = ref<boolean>(false);
const copyShow = ref<boolean>(false);
const planMenuShow = ref<boolean>(false);
const pickerShow = ref<boolean>(false);
const pickerValue = ref<string>('08:00');
const picked = ref<number[]>([]);
const editForm = reactive<TimeSlot>({ id: 0, time: '08:00', content: '', note: '', remind: '到点' });

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
  isPrn.value = String(options?.mode || '') === 'prn';
  planId.value = options?.id ? String(options.id) : '';
});

onUnload(() => {
  if (copyTimer) {
    clearTimeout(copyTimer);
  }
});

function switchMode(value: boolean) {
  isPrn.value = value;
}

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

function openStock() {
  stockForm.quantity = stockQuantity.value === null ? '' : String(stockQuantity.value);
  stockForm.unit = stockUnit.value;
  stockShow.value = true;
}

function saveStock() {
  const raw = stockForm.quantity.trim();
  if (!raw) {
    stockQuantity.value = null;
    stockUnit.value = stockForm.unit;
    stockShow.value = false;
    return;
  }
  const quantity = Number(raw);
  if (!Number.isFinite(quantity) || quantity < 0) {
    uni.showToast({ title: '请填写有效数量', icon: 'none' });
    return;
  }
  stockQuantity.value = quantity;
  stockUnit.value = stockForm.unit;
  stockShow.value = false;
}

function addSlot() {
  times.value.push({ id: seed++, time: '12:00', content: '', note: '', remind: '到点' });
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

function onCourseStart(event: any) {
  const value = event?.detail?.value;
  if (value) {
    courseStart.value = value;
  }
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

function openPlanMenu() {
  planMenuShow.value = true;
}

function onPlanMenu(item: { key: string }) {
  planMenuShow.value = false;
  if (item.key === 'history') {
    uni.navigateTo({ url: '/pages/plan/checkin/index?kind=medication' });
    return;
  }
  notReady(item.key);
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
  const dosageValue = Number(dosage.value);
  if (!Number.isFinite(dosageValue) || dosageValue <= 0) {
    uni.showToast({ title: '请填写单次剂量', icon: 'none' });
    return;
  }
  const courseDayValue = Number(courseDays.value);
  if (!Number.isInteger(courseDayValue) || courseDayValue <= 0) {
    uni.showToast({ title: '请填写有效疗程天数', icon: 'none' });
    return;
  }
  const maxDoseValue = Number(maxDailyDose.value);
  if (isPrn.value && (!Number.isFinite(maxDoseValue) || maxDoseValue <= 0)) {
    uni.showToast({ title: '请填写每日最大剂量', icon: 'none' });
    return;
  }
  const intervalValue = Number(minIntervalHours.value);
  if (isPrn.value && (!Number.isInteger(intervalValue) || intervalValue <= 0)) {
    uni.showToast({ title: '请填写有效的间隔小时', icon: 'none' });
    return;
  }
  saving.value = true;
  try {
    const body = {
      drugName: DRUG_NAME,
      dosage: String(dosageValue),
      dosageUnit: DOSAGE_UNIT,
      drugType: isPrn.value ? 1 : 0,
      maxDailyDose: isPrn.value ? maxDoseValue : undefined,
      minIntervalHours: isPrn.value ? intervalValue : undefined,
      prnReason: isPrn.value ? prnReason.value || undefined : undefined,
      eventType: isPrn.value ? undefined : ILLNESS_EVENT_TYPES[illness.value],
      courseDays: courseDayValue,
      courseStartDate: courseStart.value,
      courseEndDate: courseEnd.value,
      stockQuantity: stockQuantity.value ?? undefined,
      stockUnit: stockQuantity.value === null ? undefined : stockUnit.value,
      lowStockDays: LOW_STOCK_DAYS,
    };
    if (planId.value) {
      await MedicationApi.plan.update({ ...body, id: planId.value });
    }
    else {
      await MedicationApi.plan.add(body);
    }
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
  display: flex;
  gap: 4rpx;
  align-items: center;
  margin-top: 4rpx;
  font-size: var(--fs-caption);
  color: var(--color-text-sub);
}

.pl-hero__chev {
  margin-top: 2rpx;
}

.pl-hero__field {
  padding-top: 4rpx;
  margin-top: 20rpx;
  border-top: 2rpx solid var(--color-divider);
}

/* 分段控件 */
.pl-seg {
  display: flex;
  padding: 6rpx;
  margin-bottom: 12rpx;
  background: #eef0f5;
  border-radius: 24rpx;
}

.pl-seg__item {
  display: flex;
  flex: 1;
  gap: 10rpx;
  align-items: center;
  justify-content: center;
  min-height: 80rpx;
  font-size: var(--fs-sub);
  font-weight: 600;
  color: #6b7590;
  border-radius: 18rpx;

  &--on {
    color: var(--color-primary);
    background: #ffffff;
    box-shadow: 0 2rpx 6rpx rgb(20 30 60 / 8%);
  }
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

.pl-note {
  margin-top: 16rpx;
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

/* 行内数值输入：与右侧单位并排 */
.pl-num-input {
  width: 160rpx;
  font-size: var(--fs-sub);
  color: var(--color-primary);
  text-align: right;
}

.pl-num-unit {
  flex-shrink: 0;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
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

.pl-scope {
  display: flex;
  gap: 10rpx;
  align-items: center;
}

/* 安全提示条（带盾牌图标） */
.pl-safe {
  display: flex;
  gap: 20rpx;
  align-items: flex-start;
  padding: 20rpx 24rpx;
  margin-top: 24rpx;
  font-size: var(--fs-sub);
  line-height: 1.6;
  color: #2e5c1e;
  background: #f0faf0;
  border-left: 6rpx solid #52c41a;
  border-radius: 16rpx;
}

.pl-safe__body {
  flex: 1;
}

.pl-safe__title {
  font-weight: 700;
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

.pl-btn {
  box-sizing: border-box;
  display: flex;
  gap: 8rpx;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 88rpx;
  padding: 0 16rpx;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 1;
  color: #ffffff;
  text-align: center;
  background: var(--color-primary);
  border-radius: 28rpx;

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
