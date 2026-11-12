<template>
  <!-- reserve：吸底操作条占位（24+96rpx ≈ 70px，底部安全区由 reserve 公式附加），避免内容滚动到底被遮挡 -->
  <x-page :reserve="70">
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
            :key="c.id ?? c.key"
            small
            :icon="c.icon"
            :text="c.label"
            :active="isCategoryActive(c)"
            @click="selectCategory(c)"
          />
        </view>
      </view>
      <view class="cf-row">
        <text class="cf-row__k">
          数量
        </text>
        <x-quantity
          :model-value="form.qty"
          editable
          @update:model-value="(v: number) => (form.qty = Math.max(0, v || 0))"
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
            :active="form.remindDays[0] === d"
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
        <view class="cf-row__k cf-row__k--ico">
          <x-icon name="pill" :size="30" color="#4F7CFF" />
          <text>是药品，需服药提醒</text>
        </view>
        <x-switch :checked="form.isDrug" @update:checked="onDrugSwitch" />
      </view>
    </x-card>

    <template #sticky>
      <view class="cf-sticky">
        <x-button v-if="mode === 'recognize'" type="ghost" icon="camera" text="重拍" class="cf-sticky__act" @click="toReshoot" />
        <x-button type="primary" :disabled="!canSave" :text="saveText" class="cf-sticky__act" @click="onSave" />
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
import { ItemApi } from '@/api';
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
  /** 自定义分类的云端 id（本地 key 只有 other，恢复草稿时需还原选中项） */
  categoryId?: number | string;
}

interface RecognizeData {
  name?: string;
  produceDate?: string;
  dueDate?: string;
  spec?: string;
  qty?: number;
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
  remindDays: [7],
  visibility: 'self',
  isDrug: false,
});

/** 分类 chips：云端 /app/xq/item/category/list 拉取，本地 CATEGORIES 兜底 */
interface CategoryChip {
  key: ItemCategory;
  label: string;
  icon: string;
  /** 云端分类 id；接口不可用时的本地兜底分类没有 */
  id?: number | string;
}

const categories = ref<CategoryChip[]>([...CATEGORIES]);

/** 当前选中的云端分类 id（自定义分类无法用本地 key 区分，保存时优先带 id） */
const categoryId = ref<number | string | undefined>(undefined);

/** 拉取云端分类；categoryName 与本地 CATEGORIES label 桥接得到本地 key，失败保持本地兜底 */
async function loadCategories() {
  try {
    const res = await ItemApi.category.list({ pageNum: 1, pageSize: 100 }, { custom: { toast: false } as any });
    const rows = (res.rows || []).slice().sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
    if (rows.length) {
      categories.value = rows.map((vo) => {
        const local = CATEGORIES.find(c => c.label === vo.categoryName);
        return { key: local?.key || 'other', label: vo.categoryName, icon: vo.icon || local?.icon || 'package', id: vo.id };
      });
      // 默认分类（或本地记录的旧数据没有云端 id）按本地 key 回填选中项
      if (categoryId.value === undefined) {
        categoryId.value = categories.value.find(c => c.key === form.category)?.id;
      }
    }
  }
  catch {
    // 接口失败时保持本地分类展示
  }
}

/** 选中项判定：有云端 id 时按 id 区分（自定义分类的本地 key 都是 other） */
function isCategoryActive(c: CategoryChip): boolean {
  if (categoryId.value !== undefined && c.id !== undefined) {
    return String(c.id) === String(categoryId.value);
  }
  return c.key === form.category;
}

function selectCategory(c: CategoryChip) {
  form.category = c.key;
  categoryId.value = c.id;
}

/** 按本地 key 选中（如打开「是药品」时切到药品分类） */
function selectCategoryByKey(key: ItemCategory) {
  const chip = categories.value.find(c => c.key === key);
  if (chip) {
    selectCategory(chip);
  }
  else {
    form.category = key;
    categoryId.value = undefined;
  }
}
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

/** 提前提醒单选：重复点击已选中项取消选择（remindDays 保留数组结构以兼容云端映射） */
function toggleRemind(d: number) {
  form.remindDays = form.remindDays[0] === d ? [] : [d];
}

function onDrugSwitch(v: boolean) {
  form.isDrug = v;
  if (v && form.category === 'other') {
    selectCategoryByKey('drug');
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
  loadCategories();
  mode.value = (options.mode || 'manual') as ConfirmMode;
  if (options.id) {
    editId.value = options.id as string;
    mode.value = 'edit';
    const item = itemStore.findItem(options.id);
    if (item) {
      fill({ ...item, remindOn: true });
      categoryId.value = item.cloudCategoryId;
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
        dueDate: (data.dueDate || '').replace(/\./g, '-'),
        spec: data.spec,
      });
      form.qty = Math.max(1, data.qty ?? 1);
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
    categoryId.value = draft.categoryId;
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
    cloudCategoryId: categoryId.value,
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
  uni.setStorageSync(DRAFT_KEY, { mode: mode.value, form: { ...form }, categoryId: categoryId.value });
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

/* 带图标的行标签（图标 + 文本垂直居中） */
.cf-row__k--ico {
  display: flex;
  gap: 8rpx;
  align-items: center;
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

/* 吸底操作：横向平铺（重拍 + 保存等宽；单按钮时占满） */
.cf-sticky {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.cf-sticky__act {
  flex: 1;
  margin-top: 0;
}

.cf-discard-sub {
  font-size: var(--fs-sub);
  line-height: 1.6;
  color: var(--color-text-sub);
  text-align: center;
}
</style>
