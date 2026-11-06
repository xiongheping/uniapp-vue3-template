<template>
  <x-page>
    <x-nav-bar title="用药提醒" :right-icon="form.id ? 'more' : ''" @right="openMore" />

    <x-note type="blue">
      💡 点头部「⋯」展开：
      <text class="mp-b">
        查看说明书
      </text>
      /
      <text class="mp-b mp-danger">
        删除计划
      </text>
      （红色 · 需二次确认）。
    </x-note>

    <!-- 基本信息（原型 11c：💊 药名 · 说明书 › / 服药类型） -->
    <x-card>
      <x-field label="💊 药品名称">
        <view class="mp-inline">
          <input v-model="form.name" class="mp-input mp-input--flex" placeholder="填写药品名称">
          <text class="mp-link" @click="gotoLeaflet">
            📄 说明书 ›
          </text>
        </view>
      </x-field>
      <x-field label="服药类型" last>
        <view class="mp-chips">
          <x-chip small text="⏰ 按时" :active="form.type === 'ontime'" @click="form.type = 'ontime'" />
          <x-chip small text="⚖️ 按需" :active="form.type === 'prn'" @click="form.type = 'prn'" />
        </view>
      </x-field>
    </x-card>

    <!-- 附加字段：原型不占首屏，收进折叠区 -->
    <view class="mp-more x-tap" hover-class="x-tap--hover" :hover-start-time="0" @tap="showMoreInfo = !showMoreInfo">
      <text>更多信息（规格 / 批准文号 / 用药原因）</text>
      <text class="mp-more__act">
        {{ showMoreInfo ? "收起 ▴" : "展开 ▾" }}
      </text>
    </view>
    <x-card v-show="showMoreInfo" class="x-expand">
      <x-field label="规格">
        <input v-model="form.spec" class="mp-input" placeholder="如 0.3g × 20 粒">
      </x-field>
      <x-field label="批准文号">
        <input v-model="form.approval" class="mp-input" placeholder="国药准字…">
      </x-field>
      <x-field label="用药原因">
        <input v-model="form.reason" class="mp-input" placeholder="如 感冒发烧 / 日常补充">
      </x-field>
      <x-field label="库存单位" last>
        <view class="mp-chips">
          <x-chip
            v-for="item in unitOptions"
            :key="item"
            small
            :text="item"
            :active="form.stock.unit === item"
            @click="form.stock.unit = item"
          />
        </view>
      </x-field>
    </x-card>

    <!-- 按时：服用时段 -->
    <template v-if="form.type === 'ontime'">
      <view class="x-section-title">
        ⏰ 服用时段（按时模式）
      </view>
      <view v-for="(dose, index) in form.doses" :key="dose.id || `new-${index}`" class="mp-dose">
        <view class="mp-dose__hd" hover-class="mp-dose__hd--hover" @tap="toggleDose(index)">
          <view class="mp-dose__ico">
            <x-icon name="clock" :size="40" color="#4F7CFF" />
          </view>
          <view class="x-flex-1">
            <view class="mp-dose__t1">
              {{ dose.label }} {{ dose.time }} · {{ dose.afterMeal || "不限" }}
            </view>
            <view class="mp-dose__t2">
              {{ dose.amount }} · 提前 {{ dose.advance }} 分钟提醒
            </view>
          </view>
          <x-tag type="blue">
            {{ dose.editing ? "收起" : "编辑" }}
          </x-tag>
          <view class="mp-dose__del" @tap.stop="removeDose(index)">
            <x-icon name="trash" :size="36" color="#D93025" />
          </view>
        </view>

        <view v-if="dose.editing" class="mp-dose__body">
          <x-field label="时间点" :value="dose.time" tone="primary" chevron @click="openTime(index)" />
          <view class="mp-field">
            <text class="mp-field__k">
              提前提醒
            </text>
            <view class="mp-chips">
              <x-chip
                v-for="item in advanceOptions"
                :key="item"
                small
                :text="`${item}分`"
                :active="Number(dose.advance) === item"
                @click="dose.advance = item"
              />
            </view>
          </view>
          <x-field label="每次剂量">
            <input v-model="dose.amount" class="mp-input" placeholder="1 粒">
          </x-field>
          <x-field label="餐前后">
            <input v-model="dose.afterMeal" class="mp-input" placeholder="早餐后 / 晚餐后 30 分钟">
          </x-field>
          <x-field label="启用该时间" last>
            <x-switch :checked="dose.enabled !== false" @change="(value: boolean) => toggleDoseEnabled(dose, value)" />
          </x-field>
        </view>
      </view>
      <x-button type="ghost" text="＋ 添加时间点" icon="plus" @click="addDose" />
      <x-note type="blue">
        💡 切到「按需」后，上方替换为：每日最大剂量 / 最小间隔 / PRN 原因（疼痛/发热等），不显示固定时段。
      </x-note>
    </template>

    <!-- 按需 -->
    <template v-else>
      <view class="x-section-title">
        ⚖️ 按需服用
      </view>
      <x-card>
        <x-field label="每日最大剂量">
          <input v-model="form.perDayMax" class="mp-input" placeholder="如 4 粒">
        </x-field>
        <x-field label="最小间隔">
          <input v-model="form.minInterval" class="mp-input" placeholder="如 6 小时">
        </x-field>
        <x-field label="PRN 原因" last>
          <input v-model="form.prnReason" class="mp-input" placeholder="疼痛 / 发热 / 过敏">
        </x-field>
      </x-card>
    </template>

    <!-- 疗程 · 库存 · 隐私（原型 11c：4 行摘要 + › 展开编辑） -->
    <view class="x-section-title">
      疗程与库存
    </view>
    <x-card>
      <x-field
        label="疗程"
        :value="`${form.course.total || 0} 天 · 结束自动停提醒`"
        chevron
        @click="courseOpen = !courseOpen"
      />
      <template v-if="courseOpen">
        <x-field label="疗程天数">
          <input v-model="form.course.total" type="number" class="mp-input" placeholder="7">
        </x-field>
        <picker mode="date" :value="form.course.start" @change="(e: any) => onDateChange('start', e)">
          <x-field
            label="开始日期"
            :value="form.course.start || '选择日期'"
            :tone="form.course.start ? 'primary' : ''"
            chevron
          />
        </picker>
        <picker mode="date" :value="form.course.end" @change="(e: any) => onDateChange('end', e)">
          <x-field
            label="结束日期"
            :value="form.course.end || '选择日期'"
            :tone="form.course.end ? 'primary' : ''"
            chevron
          />
        </picker>
        <x-field label="结束自动停提醒" last>
          <x-switch :checked="form.course.autoStop !== false" @change="(value: boolean) => (form.course.autoStop = value)" />
        </x-field>
      </template>
      <x-field label="📦 库存">
        <x-quantity
          :text="`${form.stock.have}/${form.stock.total} ${form.stock.unit}`"
          @decrease="changeStock(-1)"
          @increase="changeStock(1)"
        />
      </x-field>
      <x-field
        label="药量不足提醒"
        :value="`≤ ${form.lowStockDays} 天用量时`"
        chevron
        @click="lowOpen = !lowOpen"
      />
      <view v-if="lowOpen" class="mp-chips mp-chips--left">
        <x-chip
          v-for="item in lowOptions"
          :key="item"
          small
          :text="`≤ ${item} 天`"
          :active="Number(form.lowStockDays) === item"
          @click="form.lowStockDays = item"
        />
      </view>
      <x-field label="可见范围" last>
        <text class="mp-vis" @click="visOpen = !visOpen">
          🔒 {{ form.visibility === 'family' ? '家人可见' : '仅自己' }} ›
        </text>
      </x-field>
      <view v-if="visOpen" class="mp-chips mp-chips--left">
        <x-chip small text="仅自己" :active="form.visibility === 'self'" @click="form.visibility = 'self'" />
        <x-chip small text="👥 家人可见" :active="form.visibility === 'family'" @click="form.visibility = 'family'" />
      </view>
    </x-card>

    <x-card>
      <x-field label="启用服药提醒" last>
        <view class="mp-row">
          <text v-if="!form.enabled" class="mp-weak">
            提醒已暂停
          </text>
          <x-switch :checked="form.enabled" @change="(value: boolean) => (form.enabled = value)" />
        </view>
      </x-field>
      <x-note v-if="nextHint" type="blue">
        💡 {{ nextHint }}
      </x-note>
    </x-card>

    <x-card>
      <view class="mp-block">
        <text class="mp-block__k">
          用法用量（原文）
        </text>
        <textarea
          v-model="form.instruction.usage"
          class="mp-textarea"
          placeholder="口服。成人，一次 1 粒，一日 2 次。"
        />
      </view>
      <view class="mp-block">
        <text class="mp-block__k">
          注意事项（原文）
        </text>
        <textarea v-model="form.instruction.caution" class="mp-textarea" placeholder="不得超剂量服用…" />
      </view>
      <view class="mp-block">
        <text class="mp-block__k">
          适应症（选填）
        </text>
        <textarea v-model="form.instruction.indications" class="mp-textarea" placeholder="用于缓解轻至中度疼痛" />
      </view>
      <view class="mp-block">
        <text class="mp-block__k">
          禁忌（选填）
        </text>
        <textarea v-model="form.instruction.contraindications" class="mp-textarea" placeholder="对本品过敏者禁用" />
      </view>
      <x-note type="blue">
        💡 摘录逐字来自说明书，供打卡页与「说明书」页展示；不构成用药建议。
      </x-note>
    </x-card>

    <x-button v-if="form.id" type="danger" text="删除计划" icon="trash" @click="confirmRemove" />

    <template #sticky>
      <view class="x-btns row">
        <x-button type="ghost" text="取消" @click="handleCancel" />
        <x-button :disabled="!canSave" :text="canSave ? '保存服用计划' : saveBlockText" @click="handleSave" />
      </view>
    </template>

    <!-- 22 时间选择弹层 -->
    <x-time-picker v-model:show="timePicker.show" v-model="timePicker.value" title="选择服药时间" @confirm="applyTime">
      <template #advance>
        <view class="mp-advance">
          <text class="mp-advance__k">
            提前提醒
          </text>
          <view class="mp-chips">
            <x-chip
              v-for="item in advanceOptions"
              :key="item"
              small
              :text="`${item}分`"
              :active="Number(currentDose && currentDose.advance) === item"
              @click="setAdvance(item)"
            />
          </view>
        </view>
      </template>
    </x-time-picker>
  </x-page>
</template>

<script setup lang="ts">
import type {
  DoseTime,
  MedPlan,
  PlanCourse,
  PlanInstruction,
  PlanStock,
  PlanType,
  PlanVisibility,
} from '@/store/modules/medicine/types';
import { usePermission } from '@/hooks';
import { switchTabPath } from '@/router/tab-bar';
import { useMedicineStore } from '@/store';
import { today } from '@/utils/date';

/**
 * 服用时段草稿：编辑态是页面局部的展开字段，不落库
 */
type DoseDraft = DoseTime & { editing?: boolean };

/**
 * 疗程草稿：计划页可填写起止日期，store 只关心天数与进度
 */
interface CourseDraft extends PlanCourse {
  start: string;
  end: string;
}

/**
 * 说明书草稿：适应症/禁忌为摘录原文，plan 页可编辑
 */
interface InstructionDraft extends PlanInstruction {
  indications: string;
  contraindications: string;
}

interface PlanForm {
  id: string;
  name: string;
  spec: string;
  approval: string;
  type: PlanType;
  reason: string;
  doses: DoseDraft[];
  course: CourseDraft;
  stock: PlanStock;
  lowStockDays: number;
  perDayMax: string;
  minInterval: string;
  prnReason: string;
  visibility: PlanVisibility;
  enabled: boolean;
  instruction: InstructionDraft;
}

interface DateChangeEvent {
  detail: {
    value: string;
  };
}

type CourseDateField = 'start' | 'end';

const medicineStore = useMedicineStore();

const advanceOptions = [0, 10, 15, 30];
const unitOptions = ['粒', '片', '袋', '毫升'];
const lowOptions = [3, 5, 7];

function createForm(): PlanForm {
  return {
    id: '',
    name: '',
    spec: '',
    approval: '',
    type: 'ontime',
    reason: '',
    doses: [],
    course: { total: 7, index: 1, start: '', end: '', autoStop: true },
    stock: { have: 0, total: 0, unit: '粒' },
    lowStockDays: 3,
    perDayMax: '',
    minInterval: '',
    prnReason: '',
    visibility: 'self',
    enabled: true,
    instruction: { usage: '', caution: '', indications: '', contraindications: '', imageUrl: '' },
  };
}

const form = reactive<PlanForm>(createForm());

/** 附加字段折叠（原型 11c 首屏只保留药名 / 说明书 / 服药类型） */
const showMoreInfo = ref<boolean>(false);
const courseOpen = ref<boolean>(false);
const lowOpen = ref<boolean>(false);
const visOpen = ref<boolean>(false);

const timePicker = reactive<{ show: boolean; value: string; index: number }>({ show: false, value: '08:00', index: -1 });

const currentDose = computed<DoseDraft | null>(() => (timePicker.index > -1 ? form.doses[timePicker.index] : null));

const enabledDoses = computed<DoseDraft[]>(() => form.doses.filter(dose => dose.enabled !== false && !!dose.time));

const canSave = computed<boolean>(() => {
  if (!String(form.name).trim()) {
    return false;
  }
  if (form.type === 'ontime') {
    return enabledDoses.value.length > 0;
  }
  return true;
});

const saveBlockText = computed<string>(() => {
  if (!String(form.name).trim()) {
    return '请先填写药品名称';
  }
  if (form.type === 'ontime' && enabledDoses.value.length === 0) {
    return '请至少保留一个服用时间';
  }
  return '保存服用计划';
});

// 复用 store 的「可提前 30 分钟打卡」口径，用于提醒生效时间的说明
const nextHint = computed<string>(() => {
  if (form.id) {
    const plan = medicineStore.planById(form.id);
    const next = medicineStore.nextEntry;
    if (plan && next && next.planId === plan.id) {
      const left = medicineStore.minutesTo(next.time);
      return `今日下一剂 ${next.time}${left > 0 ? ` · 还有 ${left} 分钟` : ''} · ${
        medicineStore.canCheckIn ? '现在可提前 30 分钟打卡' : '到点前 30 分钟内可提前打卡'
      }`;
    }
  }
  return '修改时间点只影响之后的提醒，今日已生成的记录不受影响。';
});

function labelOf(time: string): string {
  const hour = Number(String(time).split(':')[0]);
  if (hour < 6) {
    return '清晨';
  }
  if (hour < 11) {
    return '早间';
  }
  if (hour < 14) {
    return '午间';
  }
  if (hour < 18) {
    return '午后';
  }
  return '晚间';
}

function fill(plan: MedPlan | null) {
  const draft = createForm();
  // 新建计划的默认时间点（与原型一致：早间 08:00 早餐后 1 粒）
  const fresh: PlanForm = {
    ...draft,
    doses: [
      {
        id: `d${Date.now()}`,
        time: '08:00',
        label: '早间',
        afterMeal: '早餐后',
        amount: '1 粒',
        advance: 10,
        enabled: true,
      },
    ],
  };
  const source: PlanForm = plan ? ({ ...fresh, ...plan } as PlanForm) : fresh;
  form.id = source.id || '';
  form.name = source.name || '';
  form.spec = source.spec || '';
  form.approval = source.approval || '';
  form.type = source.type || 'ontime';
  form.reason = source.reason || '';
  form.doses = (source.doses || []).map(dose => ({ ...dose, editing: false }));
  form.course = { ...fresh.course, start: '', end: '', ...(plan?.course || {}) };
  form.stock = source.stock ? { ...source.stock } : { have: 0, total: 0, unit: '粒' };
  if (!form.stock.unit) {
    form.stock.unit = '粒';
  }
  form.lowStockDays = Number(source.lowStockDays || 3);
  form.perDayMax = source.perDayMax || '';
  form.minInterval = source.minInterval || '';
  form.prnReason = source.prnReason || '';
  form.visibility = source.visibility || 'self';
  form.enabled = source.enabled !== false;
  form.instruction = { ...fresh.instruction, ...(source.instruction || {}) };
}

function toggleDose(index: number) {
  const dose = form.doses[index];
  if (!dose) {
    return;
  }
  form.doses.forEach((item, i) => {
    item.editing = i === index ? !item.editing : false;
  });
  if (dose.editing) {
    timePicker.index = index;
  }
}

function toggleDoseEnabled(dose: DoseDraft, value: boolean) {
  dose.enabled = value;
  if (!value) {
    uni.showToast({ title: '停用后今日不再生成该剂提醒', icon: 'none' });
  }
}

function addDose() {
  form.doses.push({
    id: `d${Date.now()}`,
    time: '12:00',
    label: labelOf('12:00'),
    afterMeal: '午餐后',
    amount: '1 粒',
    advance: 10,
    enabled: true,
    editing: true,
  });
}

function removeDose(index: number) {
  if (form.doses.length <= 1) {
    uni.showToast({ title: '至少保留一个服用时间', icon: 'none' });
    return;
  }
  uni.showModal({
    title: '删除这个时间点？',
    content: '今日该剂次的提醒会一并移除。',
    confirmText: '删除',
    confirmColor: '#FA5151',
    success: ({ confirm }) => {
      if (confirm) {
        form.doses.splice(index, 1);
      }
    },
  });
}

function openTime(index: number) {
  const dose = form.doses[index];
  if (!dose) {
    return;
  }
  timePicker.index = index;
  timePicker.value = dose.time || '08:00';
  timePicker.show = true;
}

function applyTime(value: string) {
  const dose = currentDose.value;
  if (!dose) {
    return;
  }
  dose.time = value;
  dose.label = labelOf(value);
}

function setAdvance(item: number) {
  if (currentDose.value) {
    currentDose.value.advance = item;
  }
}

function onDateChange(field: CourseDateField, event: DateChangeEvent) {
  form.course[field] = event.detail.value;
  if (field === 'start' && form.course.end) {
    form.course.total = courseRangeDays(form.course.start, form.course.end);
  }
}

// 疗程起止日期相差天数（含首尾），非法区间保持原天数
function courseRangeDays(start: string, end: string): number {
  const a = new Date(`${String(start).replace(/-/g, '/')} 00:00:00`).getTime();
  const b = new Date(`${String(end).replace(/-/g, '/')} 00:00:00`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) {
    return form.course.total;
  }
  return Math.round((b - a) / 86400000) + 1;
}

function changeStock(step: number) {
  form.stock.have = Math.max(0, Number(form.stock.have) + step);
}

function payload() {
  return {
    id: form.id || undefined,
    name: String(form.name).trim(),
    spec: form.spec,
    approval: form.approval,
    type: form.type,
    reason: form.reason,
    doses: form.doses.map((dose, index) => {
      const next = { ...dose };
      delete next.editing;
      if (!next.id) {
        next.id = `d${Date.now()}${index}`;
      }
      if (!next.label) {
        next.label = labelOf(next.time);
      }
      return next;
    }),
    course: { ...form.course, total: Number(form.course.total) || 1 },
    stock: { ...form.stock, have: Number(form.stock.have) || 0, total: Number(form.stock.total) || 0 },
    lowStockDays: Number(form.lowStockDays) || 3,
    perDayMax: form.perDayMax,
    minInterval: form.minInterval,
    prnReason: form.prnReason,
    visibility: form.visibility,
    enabled: form.enabled,
    instruction: { ...form.instruction },
  };
}

function handleSave() {
  if (!canSave.value) {
    uni.showToast({ title: saveBlockText.value, icon: 'none' });
    return;
  }
  medicineStore.savePlan(payload());
  uni.showToast({ title: '服用计划已保存', icon: 'none' });
  setTimeout(goBack, 400);
}

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
  }
  else {
    // 原生 tabBar 已移除，用药首页走 switchTabPath（内部为 uni.redirectTo）
    switchTabPath('/pages/tab/medicine/index');
  }
}

function handleCancel() {
  goBack();
}

function openMore() {
  const actions = form.id ? ['查看说明书', '删除计划'] : ['查看说明书'];
  uni.showActionSheet({
    itemList: actions,
    success: ({ tapIndex }) => {
      if (actions[tapIndex] === '查看说明书') {
        gotoLeaflet();
        return;
      }
      confirmRemove();
    },
  });
}

function confirmRemove() {
  if (!form.id) {
    uni.showToast({ title: '新计划尚未保存，无需删除', icon: 'none' });
    return;
  }
  const plan = medicineStore.planById(form.id);
  uni.showModal({
    title: '删除这个服用计划？',
    content: `「${plan ? plan.name : form.name}」的提醒与今日之后的排班会一并删除，历史记录保留。`,
    confirmText: '删除计划',
    confirmColor: '#FA5151',
    success: ({ confirm }) => {
      if (confirm) {
        medicineStore.removePlan(form.id);
        uni.showToast({ title: '计划已删除', icon: 'none' });
        setTimeout(goBack, 300);
      }
    },
  });
}

function gotoLeaflet() {
  if (!form.id) {
    uni.showToast({ title: '保存计划后可查看说明书摘录', icon: 'none' });
    return;
  }
  uni.navigateTo({ url: `/pages/med/leaflet/index?planId=${form.id}` });
}

onLoad(async (options: Record<string, string> = {}) => {
  const ok = await usePermission();
  if (!ok) {
    return;
  }
  const plan = options.planId ? medicineStore.planById(options.planId) : null;
  fill(plan);
  if (options.planId && !plan) {
    uni.showToast({ title: '没找到这个计划，已转为新建', icon: 'none' });
  }
  // 新建计划的疗程起始日默认今天
  if (!form.id && !form.course.start) {
    form.course.start = today();
  }
});
</script>

<style lang="scss" scoped>
/* 附加字段折叠入口 */
.mp-more {
  display: flex;
  gap: 12rpx;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 8rpx 20rpx 16rpx;
  font-size: var(--fs-caption);
  color: var(--color-text-sub);

  &:active {
    opacity: 0.7;
  }
}

.mp-more__act {
  font-weight: 600;
  color: var(--color-primary);
}

.mp-b {
  font-weight: 700;
}

.mp-danger {
  color: var(--color-danger-strong);
}

.mp-input {
  width: 320rpx;
  font-size: var(--fs-sub);
  color: var(--color-text);
  text-align: right;
}

/* 药名 + 说明书 › 并排（原型 11c 第一行） */
.mp-inline {
  display: flex;
  gap: 16rpx;
  align-items: center;
  justify-content: flex-end;
}

.mp-input--flex {
  width: 240rpx;
}

.mp-link {
  flex-shrink: 0;
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--color-primary);
}

.mp-textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 120rpx;
  padding: 16rpx;
  margin-top: 12rpx;
  font-size: var(--fs-sub);
  line-height: 1.6;
  color: var(--color-text);
  background: var(--color-fill-light);
  border-radius: 16rpx;
}

.mp-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  justify-content: flex-end;
  max-width: 440rpx;
}

/* 展开编辑行：chip 靠左 */
.mp-chips--left {
  justify-content: flex-start;
  max-width: none;
  padding: 4rpx 0 20rpx;
}

/* 可见范围值（原型 11c：紫色 🔒 仅自己 ›） */
.mp-vis {
  font-size: var(--fs-sub);
  font-weight: 600;
  color: #7b3ff2;
}

.mp-block {
  padding: 20rpx 0;
  border-bottom: 2rpx solid var(--color-divider);
}

.mp-block__k {
  display: block;
  margin-bottom: 12rpx;
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--color-text);
}

.mp-row {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.mp-weak {
  font-size: var(--fs-caption);
  color: var(--color-text-weak);
}

.mp-dose {
  padding: 8rpx 24rpx;
  margin-bottom: 20rpx;
  background: var(--color-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.mp-dose__hd {
  display: flex;
  gap: 20rpx;
  align-items: center;
  min-height: var(--h-cell);
  padding: 16rpx 0;
}

.mp-dose__hd--hover {
  opacity: 0.9;
}

.mp-dose__ico {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--h-icon);
  height: var(--h-icon);
  background: var(--color-primary-soft);
  border-radius: var(--radius-cell);
}

.mp-dose__t1 {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--color-text);
}

.mp-dose__t2 {
  margin-top: 4rpx;
  font-size: var(--fs-caption);
  color: var(--color-text-sub);
}

.mp-dose__del {
  display: flex;
  align-items: center;
  padding: 8rpx;
}

.mp-dose__body {
  padding: 0 0 12rpx;
  border-top: 2rpx solid var(--color-divider);
}

.mp-field {
  display: flex;
  gap: 16rpx;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 0;
  border-bottom: 2rpx solid var(--color-divider);
}

.mp-field__k {
  font-size: var(--fs-body);
  color: var(--color-text);
}

.mp-advance {
  display: flex;
  gap: 16rpx;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  margin-top: 20rpx;
  background: var(--color-fill-light);
  border-radius: 20rpx;
}

.mp-advance__k {
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--color-text);
}
</style>
