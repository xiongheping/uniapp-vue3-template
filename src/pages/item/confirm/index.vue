<template>
  <x-page>
    <x-nav-bar :title="navTitle" :back="false">
      <template #left>
        <view class="cf-back" @click="handleBack">
          <x-icon name="arrow-l" :size="44" :color="navColor" />
        </view>
      </template>
    </x-nav-bar>

    <!-- 09c 识别确认提示 -->
    <x-note v-if="mode === 'recognize'" type="blue">
      ✨ AI 识别完成，请核对。开始识别已预占 1 次 ·
      <text class="cf-b">
        确认保存才消耗
      </text>
      · 取消则释放。
    </x-note>
    <x-note v-else-if="mode === 'manual'" type="blue">
      ✍️ 手动录入不消耗 AI 次数，可稍后补拍照。
    </x-note>
    <x-note v-if="draftRestored" type="green">
      ✓ 已为你恢复上次未保存的草稿。
    </x-note>

    <!-- 基础信息 -->
    <x-card>
      <view class="cf-row">
        <text class="cf-row__k">
          名称
        </text>
        <input v-model="form.name" class="cf-row__input" placeholder="填写物品名称" placeholder-style="color:#B0B7C3">
      </view>
      <view class="cf-row">
        <text class="cf-row__k">
          分类
        </text>
        <view class="cf-chips">
          <x-chip
            v-for="c in categories"
            :key="c.key"
            small
            :icon="c.icon"
            :text="c.label"
            :active="form.category === c.key"
            @click="form.category = c.key"
          />
        </view>
      </view>
      <view class="cf-row">
        <text class="cf-row__k">
          数量
        </text>
        <x-quantity
          :model-value="form.qty"
          @decrease="form.qty = Math.max(0, form.qty - 1)"
          @increase="form.qty += 1"
        />
      </view>
      <view class="cf-row">
        <text class="cf-row__k">
          存放位置
        </text>
        <input
          v-model="form.location"
          class="cf-row__input"
          placeholder="如 药箱左侧 / 梳妆台"
          placeholder-style="color:#B0B7C3"
        >
      </view>
    </x-card>

    <!-- 日期 -->
    <x-card>
      <picker mode="date" :value="form.produceDate" @change="onProduceDateChange">
        <x-field label="生产日期" icon="calendar" :value="form.produceDate || '未填写 ›'" tone="primary" chevron />
      </picker>
      <picker mode="date" :value="form.dueDate" @change="onDueDateChange">
        <x-field label="到期日" icon="calendar" :value="duePreview" tone="primary" chevron last />
      </picker>
    </x-card>

    <!-- 提醒 -->
    <x-card>
      <view class="cf-row">
        <text class="cf-row__k">
          到期提醒
        </text>
        <x-switch :checked="form.remindOn" @update:checked="(v: boolean) => (form.remindOn = v)" />
      </view>
      <view v-if="form.remindOn" class="cf-row">
        <text class="cf-row__k">
          提前提醒
        </text>
        <view class="cf-chips">
          <x-chip
            v-for="d in REMIND_OPTIONS"
            :key="d"
            small
            :text="d === 0 ? '当天' : `前${d}天`"
            :active="form.remindDays.includes(d)"
            @click="toggleRemind(d)"
          />
        </view>
      </view>
      <view class="cf-row">
        <text class="cf-row__k">
          谁可以看到
        </text>
        <view class="cf-chips">
          <x-chip
            small
            icon="lock"
            text="仅自己"
            :active="form.visibility === 'self'"
            @click="form.visibility = 'self'"
          />
          <x-chip
            small
            icon="users"
            text="家人"
            :active="form.visibility === 'family'"
            @click="form.visibility = 'family'"
          />
        </view>
      </view>
      <view class="cf-row">
        <text class="cf-row__k">
          💊 是药品，需服药提醒
        </text>
        <x-switch :checked="form.isDrug" @update:checked="onDrugSwitch" />
      </view>
    </x-card>

    <template #sticky>
      <view class="cf-sticky x-safe-bottom">
        <view class="x-btns row">
          <x-button v-if="mode === 'recognize'" type="ghost" icon="camera" text="重拍" @click="toReshoot" />
          <x-button type="primary" :disabled="!canSave" :text="saveText" @click="onSave" />
        </view>
      </view>
    </template>

    <!-- 21 放弃编辑确认 -->
    <x-sheet v-model:show="showDiscard" mode="center" title="还没保存，要离开吗？" :mask-closable="false">
      <template #sub>
        <text class="cf-discard-sub">
          离开后本次识别的信息将丢失，
          <br>
          但
          <text class="cf-b">
            不消耗 AI 识别次数
          </text>
          。
        </text>
      </template>
      <x-button type="primary" text="存草稿并离开" @click="leaveSaveDraft" />
      <x-button type="ghost" text="继续编辑" @click="showDiscard = false" />
      <x-button type="link" text="直接放弃" @click="leaveDiscard" />
    </x-sheet>
  </x-page>
</template>

<script setup lang="ts">
import type { ItemCategory, ItemDraft, ItemVisibility } from '@/store/modules/item/types';
import { useTheme } from '@/hooks';
import { useItemStore, useSettingStore } from '@/store';
import { CATEGORIES } from '@/store/modules/item';
import { dueLabel } from '@/utils/date';

// manual | recognize | edit
type ConfirmMode = 'manual' | 'recognize' | 'edit';

interface ConfirmForm {
  name: string;
  category: ItemCategory;
  qty: number;
  location: string;
  produceDate: string;
  dueDate: string;
  remindOn: boolean;
  remindDays: number[];
  visibility: ItemVisibility;
  isDrug: boolean;
}

interface ConfirmDraft {
  mode?: string;
  form?: Record<string, unknown>;
}

interface RecognizeData {
  name?: string;
  produceDate?: string;
  spec?: string;
}

const itemStore = useItemStore();
const settingStore = useSettingStore();
const { isDark } = useTheme();

const DRAFT_KEY = 'item_confirm_draft';
const REMIND_OPTIONS = [7, 3, 1, 0];
const CAT_ICON: Record<string, string> = { drug: 'pill', skin: 'droplet', food: 'cookie', other: 'package' };

const mode = ref<ConfirmMode>('manual');
const editId = ref<string>('');
const draftRestored = ref(false);
const showDiscard = ref(false);
const initialSnapshot = ref<string>('');

const form = reactive<ConfirmForm>({
  name: '',
  category: 'other',
  qty: 1,
  location: '',
  produceDate: '',
  dueDate: '',
  remindOn: true,
  remindDays: [7, 3, 0],
  visibility: 'self',
  isDrug: false,
});

const categories = CATEGORIES;
const navColor = computed(() => (isDark.value ? '#F0F2F6' : '#1A2233'));
const navTitle = computed(() => (mode.value === 'edit' ? '编辑物品' : '确认信息'));
const duePreview = computed(() =>
  form.dueDate ? `${form.dueDate} · ${dueLabel(form.dueDate)}` : '未填写 · 日历选择 ›',
);
const canSave = computed(() => form.name.trim().length > 0);
const saveText = computed(() =>
  mode.value === 'recognize' ? '确认保存（用预占次数）' : mode.value === 'edit' ? '保存修改' : '保存',
);

const isDirty = computed(() => JSON.stringify({ ...form }) !== initialSnapshot.value);

function snapshot() {
  initialSnapshot.value = JSON.stringify({ ...form });
}

function toggleRemind(d: number) {
  const index = form.remindDays.indexOf(d);
  if (index > -1) {
    form.remindDays.splice(index, 1);
  }
  else {
    form.remindDays.push(d);
  }
}

function onDrugSwitch(v: boolean) {
  form.isDrug = v;
  if (v && form.category === 'other') {
    form.category = 'drug';
  }
}

interface PickerDateEvent {
  detail: {
    value: string;
  };
}

function onProduceDateChange(e: PickerDateEvent) {
  form.produceDate = e.detail.value;
}

function onDueDateChange(e: PickerDateEvent) {
  form.dueDate = e.detail.value;
}

function categoryIcon(key: string) {
  return CAT_ICON[key] || 'package';
}

function fill(target: unknown) {
  if (!target || typeof target !== 'object') {
    return;
  }
  const source = target as Record<string, unknown>;
  Object.keys(form).forEach((key) => {
    const value = source[key];
    if (value !== undefined && value !== null) {
      Object.assign(form, { [key]: value });
    }
  });
}

onLoad((options: any = {}) => {
  mode.value = (options.mode || 'manual') as ConfirmMode;
  if (options.id) {
    editId.value = options.id as string;
    mode.value = 'edit';
    const item = itemStore.findItem(options.id);
    if (item) {
      fill({ ...item, remindOn: true });
    }
    snapshot();
    return;
  }
  if (mode.value === 'recognize' && options.data) {
    try {
      const data = JSON.parse(decodeURIComponent(options.data)) as RecognizeData;
      fill({
        name: data.name,
        produceDate: (data.produceDate || '').replace(/\./g, '-'),
        spec: data.spec,
      });
      form.qty = 1;
    }
    catch {
      // 数据损坏时留空
    }
    snapshot();
    return;
  }
  // manual：尝试恢复草稿
  const draft = uni.getStorageSync(DRAFT_KEY) as ConfirmDraft | '';
  if (draft && draft.mode === 'manual') {
    fill(draft.form);
    draftRestored.value = true;
  }
  snapshot();
});

function onSave() {
  if (!canSave.value) {
    uni.showToast({ title: '请填写名称', icon: 'none' });
    return;
  }
  const payload: ItemDraft = {
    name: form.name.trim(),
    category: form.category,
    qty: form.qty,
    location: form.location,
    produceDate: form.produceDate,
    dueDate: form.dueDate,
    remindDays: form.remindOn ? [...form.remindDays] : [],
    visibility: form.visibility,
    isDrug: form.isDrug,
  };

  if (mode.value === 'edit') {
    itemStore.updateItem(editId.value, payload);
    uni.showToast({ title: '已保存', icon: 'none' });
    uni.navigateBack();
    return;
  }

  const record = itemStore.addItem(payload);
  if (mode.value === 'recognize' && settingStore.quotaPreOccupied > 0) {
    settingStore.consumeQuota();
  }
  uni.removeStorageSync(DRAFT_KEY);
  snapshot();
  const via = mode.value === 'recognize' ? 'camera' : 'keyboard';
  uni.redirectTo({
    url: `/pages/item/add/index?saved=1&name=${encodeURIComponent(record.name)}&due=${record.dueDate || ''}&icon=${categoryIcon(record.category)}&via=${via}`,
  });
}

// 返回 / 放弃
function handleBack() {
  if (mode.value === 'edit') {
    uni.navigateBack();
    return;
  }
  if (isDirty.value) {
    showDiscard.value = true;
  }
  else {
    releaseIfRecognize();
    uni.navigateBack();
  }
}

function releaseIfRecognize() {
  if (mode.value === 'recognize' && settingStore.quotaPreOccupied > 0) {
    settingStore.releaseQuota();
  }
}

function leaveSaveDraft() {
  uni.setStorageSync(DRAFT_KEY, { mode: mode.value, form: { ...form } });
  releaseIfRecognize();
  showDiscard.value = false;
  uni.navigateBack();
}

function leaveDiscard() {
  uni.removeStorageSync(DRAFT_KEY);
  releaseIfRecognize();
  showDiscard.value = false;
  uni.navigateBack();
}

function toReshoot() {
  releaseIfRecognize();
  uni.redirectTo({ url: '/pages/item/recognize/index?method=camera' });
}
</script>

<style lang="scss" scoped>
.cf-back {
  display: flex;
  align-items: center;
  min-height: 72rpx;
  padding-right: 16rpx;
}

.cf-b {
  font-weight: 700;
  color: var(--color-text);
}

.cf-row {
  box-sizing: border-box;
  display: flex;
  gap: 20rpx;
  align-items: center;
  justify-content: space-between;
  min-height: var(--h-touch);
  padding: 20rpx 0;
  border-bottom: 2rpx solid var(--color-divider);
}

.cf-row:last-child {
  border-bottom: none;
}

.cf-row__k {
  flex-shrink: 0;
  font-size: var(--fs-body);
  color: var(--color-text);
}

.cf-row__input {
  flex: 1;
  min-width: 0;
  font-size: var(--fs-body);
  color: var(--color-text);
  text-align: right;
}

.cf-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  justify-content: flex-end;
}

.cf-sticky {
  display: flex;
  flex-direction: column;
}

.cf-discard-sub {
  font-size: var(--fs-sub);
  line-height: 1.6;
  color: var(--color-text-sub);
  text-align: center;
}
</style>
