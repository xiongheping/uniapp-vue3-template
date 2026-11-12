<template>
  <x-page :reserve="180">
    <x-nav-bar title="伪名保护">
      <template #right>
        <view class="al-nav-act x-tap-opacity" hover-class="x-tap-opacity--hover" :hover-start-time="0" @tap="openAdd">
          <x-icon name="plus" :size="30" color="currentColor" />
          <text class="al-nav-act__text">
            添加
          </text>
        </view>
      </template>
    </x-nav-bar>

    <x-note type="purple" icon="eye-off">
      敏感物品用化名显示，家人看到的是“维生素 B6”，<text class="al-b">
        点开需 Face ID 才能看真实名称
      </text>。
    </x-note>

    <x-card>
      <x-field label="伪名保护" icon="eye-off" icon-color="#7B3FF2">
        <x-switch v-model:checked="protectOn" @change="onProtectChange" />
      </x-field>
      <x-field label="默认对所有药品生效" last>
        <x-switch v-model:checked="defaultDrug" @change="onDefaultDrugChange" />
      </x-field>
    </x-card>

    <view class="al-head">
      <text class="al-head__title">
        已设置 · {{ filteredAliases.length }}
      </text>
      <text class="al-head__filter x-tap-opacity" hover-class="x-tap-opacity--hover" :hover-start-time="0" @tap="openFilter">
        {{ filterLabel }}
      </text>
    </view>

    <view v-if="!filteredAliases.length" class="al-empty">
      {{ aliases.length ? '该分类下还没有伪名。' : '还没有设置伪名。点上方「添加」或下方按钮新增一条。' }}
    </view>

    <view
      v-for="alias in filteredAliases"
      :key="alias.id"
      class="al-card x-tap-opacity"
      hover-class="x-tap-opacity--hover"
      :hover-start-time="0"
      @tap="openEdit(alias)"
    >
      <view class="al-card__ico" :class="`al-card__ico--${aliasMeta(alias).tone}`">
        <x-icon :name="aliasMeta(alias).icon" :size="32" :color="aliasMeta(alias).color" />
      </view>
      <view class="al-card__body">
        <view class="al-fake">
          {{ alias.aliasName }}
        </view>
        <view class="al-sub">
          <text class="al-real">
            {{ alias.originalName }}
          </text> · {{ aliasMeta(alias).label }}
        </view>
      </view>
      <x-icon name="chev-r" :size="28" color="#C4B5FD" />
    </view>

    <x-button class="al-add" type="ghost" icon="plus" text="添加伪名" @click="openAdd" />

    <x-note type="blue" icon="info">
      <text class="al-b">
        降级方案
      </text>：不支持 Face ID 的设备，用设备密码或家人协助验证。伪名清单仅自己可见，家人看不到这份列表。
    </x-note>

    <x-sheet v-model:show="filterSheetVisible" title="按分类筛选">
      <view class="al-filter">
        <x-chip text="全部分类" :active="!filterCategoryId" @click="selectFilter('')" />
        <x-chip
          v-for="cat in categories"
          :key="cat.id"
          :text="cat.categoryName"
          :active="filterCategoryId === String(cat.id)"
          @click="selectFilter(String(cat.id))"
        />
      </view>
    </x-sheet>

    <x-sheet v-model:show="sheetVisible" :title="editingId ? '编辑伪名' : '添加伪名'" sub="家人只看得到化名，真实名称仅自己可见">
      <x-field label="真实名称">
        <input v-model="form.originalName" class="al-input" :maxlength="128" placeholder="如 舍曲林片">
      </x-field>
      <x-field label="化名">
        <input v-model="form.aliasName" class="al-input" :maxlength="128" placeholder="如 维生素 B6">
      </x-field>
      <x-field label="分类" :last="!editingId">
        <view class="al-chips">
          <x-chip small text="未分类" :active="!form.categoryId" @click="form.categoryId = ''" />
          <x-chip
            v-for="cat in categories"
            :key="cat.id"
            small
            :text="cat.categoryName"
            :active="String(form.categoryId) === String(cat.id)"
            @click="form.categoryId = String(cat.id)"
          />
        </view>
      </x-field>
      <x-button v-if="editingId" type="danger" text="删除伪名" @click="confirmDelete" />
      <x-button :text="editingId ? '保存修改' : '保存伪名'" :disabled="!canSave" @click="handleSave" />
      <x-button type="gray" text="取消" @click="sheetVisible = false" />
    </x-sheet>

    <template #sticky>
      <x-button text="完成" @click="handleDone" />
    </template>
  </x-page>
</template>

<script setup lang="ts">
import type { ItemCategoryVo } from '@/api/xiaoqi/item';
import type { MemberUserAliasVo } from '@/api/xiaoqi/member';
import { FamilyApi } from '@/api/xiaoqi/family';
import { ItemApi } from '@/api/xiaoqi/item';
import { usePermission } from '@/hooks';

interface AliasMeta {
  label: string;
  icon: string;
  tone: 'amber' | 'red' | 'purple';
  color: string;
}

interface AliasForm {
  originalName: string;
  aliasName: string;
  categoryId: string;
}

const PROTECT_KEY = 'xq_alias_protect';
const DEFAULT_DRUG_KEY = 'xq_alias_default_drug';

const aliases = ref<MemberUserAliasVo[]>([]);
const categories = ref<ItemCategoryVo[]>([]);
const filterCategoryId = ref<string>('');

/** 设备级偏好：伪名总开关 / 新增时默认套用药品分类 */
const protectOn = ref<boolean>(uni.getStorageSync(PROTECT_KEY) !== false);
const defaultDrug = ref<boolean>(uni.getStorageSync(DEFAULT_DRUG_KEY) !== false);

const sheetVisible = ref<boolean>(false);
const filterSheetVisible = ref<boolean>(false);
const editingId = ref<string>('');
const form = reactive<AliasForm>({ originalName: '', aliasName: '', categoryId: '' });

const canSave = computed<boolean>(() => !!form.originalName.trim() && !!form.aliasName.trim());

const filteredAliases = computed<MemberUserAliasVo[]>(() => {
  if (!filterCategoryId.value) {
    return aliases.value;
  }
  return aliases.value.filter(alias => String(alias.categoryId ?? '') === filterCategoryId.value);
});

const filterLabel = computed<string>(() => {
  const cat = categories.value.find(item => String(item.id) === filterCategoryId.value);
  return cat ? cat.categoryName : '按分类筛选';
});

function aliasMeta(alias: MemberUserAliasVo): AliasMeta {
  const cat = categories.value.find(item => String(item.id) === String(alias.categoryId ?? ''));
  const name = cat?.categoryName || '未分类';
  if (name.includes('药')) {
    return { label: name, icon: 'pill', tone: 'amber', color: '#C77700' };
  }
  if (name.includes('健康')) {
    return { label: name, icon: 'heart-pulse', tone: 'red', color: '#D93025' };
  }
  return { label: name, icon: 'pill', tone: 'purple', color: '#7B3FF2' };
}

function onProtectChange(value: boolean): void {
  uni.setStorageSync(PROTECT_KEY, value);
  uni.showToast({ title: value ? '伪名保护已开启' : '伪名保护已关闭', icon: 'none' });
}

function onDefaultDrugChange(value: boolean): void {
  uni.setStorageSync(DEFAULT_DRUG_KEY, value);
  uni.showToast({ title: value ? '新增伪名默认套用药品分类' : '新增伪名不预选分类', icon: 'none' });
}

/** 「按分类筛选」：底部弹层选择全部分类或某一分类 */
function openFilter(): void {
  filterSheetVisible.value = true;
}

function selectFilter(categoryId: string): void {
  filterCategoryId.value = categoryId;
  filterSheetVisible.value = false;
}

function defaultCategoryId(): string {
  if (!defaultDrug.value) {
    return '';
  }
  const drug = categories.value.find(cat => cat.categoryName.includes('药'));
  return drug ? String(drug.id) : '';
}

function openAdd(): void {
  editingId.value = '';
  form.originalName = '';
  form.aliasName = '';
  form.categoryId = defaultCategoryId();
  sheetVisible.value = true;
}

function openEdit(alias: MemberUserAliasVo): void {
  if (alias.id == null) {
    return;
  }
  editingId.value = String(alias.id);
  form.originalName = alias.originalName;
  form.aliasName = alias.aliasName;
  form.categoryId = alias.categoryId != null ? String(alias.categoryId) : '';
  sheetVisible.value = true;
}

async function handleSave(): Promise<void> {
  if (!canSave.value) {
    return;
  }
  const payload = {
    originalName: form.originalName.trim(),
    aliasName: form.aliasName.trim(),
    categoryId: form.categoryId || undefined,
  };
  const isEdit = !!editingId.value;
  uni.showLoading({ title: '保存中', mask: true });
  try {
    if (isEdit) {
      await FamilyApi.updateAlias(editingId.value, payload);
    }
    else {
      await FamilyApi.addAlias(payload);
    }
    uni.hideLoading();
    sheetVisible.value = false;
    await loadAliases();
    uni.showToast({ title: isEdit ? '已保存' : '已添加', icon: 'none' });
  }
  catch (error: any) {
    uni.hideLoading();
    uni.showToast({ title: error?.msg || '保存失败', icon: 'none' });
  }
}

function confirmDelete(): void {
  const id = editingId.value;
  if (!id) {
    return;
  }
  uni.showModal({
    title: '删除伪名？',
    content: '删除后，该物品将恢复显示真实名称。',
    confirmText: '删除',
    confirmColor: '#D93025',
    success: async ({ confirm }) => {
      if (!confirm) {
        return;
      }
      try {
        await FamilyApi.removeAlias(id);
        sheetVisible.value = false;
        await loadAliases();
        uni.showToast({ title: '已删除', icon: 'none' });
      }
      catch (error: any) {
        uni.showToast({ title: error?.msg || '删除失败', icon: 'none' });
      }
    },
  });
}

async function loadAliases(): Promise<void> {
  try {
    aliases.value = await FamilyApi.aliases();
  }
  catch (error: any) {
    uni.showToast({ title: error?.msg || '伪名加载失败', icon: 'none' });
  }
  try {
    const page = await ItemApi.category.list({ pageNum: 1, pageSize: 50 });
    categories.value = page.rows || [];
  }
  catch {
    categories.value = [];
  }
}

function handleDone(): void {
  uni.navigateBack({
    fail: () => {
      uni.redirectTo({ url: '/pages/user/family/index' });
    },
  });
}

onShow(async () => {
  const ok = await usePermission();
  if (!ok) {
    return;
  }
  await loadAliases();
});
</script>

<style lang="scss" scoped>
.al-b {
  font-weight: 700;
}

.al-nav-act {
  display: flex;
  gap: 6rpx;
  align-items: center;
  justify-content: flex-end;
  min-height: 72rpx;
  padding-left: 16rpx;
  color: var(--color-primary);
}

.al-nav-act__text {
  font-size: var(--fs-sub);
  font-weight: 600;
}

.al-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8rpx 4rpx 16rpx;
}

.al-head__title {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--color-text);
}

.al-head__filter {
  font-size: var(--fs-sub);
  color: var(--color-text-weak);
}

.al-card {
  display: flex;
  gap: 20rpx;
  align-items: center;
  padding: 24rpx;
  margin-bottom: 16rpx;
  background: var(--color-note-purple-bg);
  border: 2rpx solid rgb(123 63 242 / 22%);
  border-radius: 24rpx;
}

.al-card__ico {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 68rpx;
  height: 68rpx;
  border-radius: 20rpx;
}

.al-card__ico--amber {
  color: #c77700;
  background: #fff4e5;
}

.al-card__ico--red {
  color: #d93025;
  background: #ffeded;
}

.al-card__ico--purple {
  color: #7b3ff2;
  background: #f0e6ff;
}

.al-card__body {
  flex: 1;
  min-width: 0;
}

.al-fake {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-note-purple-text);
  white-space: nowrap;
}

.al-sub {
  margin-top: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--fs-caption);
  color: var(--color-text-weak);
  white-space: nowrap;
}

.al-real {
  text-decoration: line-through;
}

.al-empty {
  padding: 32rpx;
  margin-bottom: 16rpx;
  font-size: var(--fs-sub);
  line-height: 1.6;
  color: var(--color-text-sub);
  text-align: center;
  background: var(--color-card);
  border-radius: 24rpx;
}

.al-add {
  margin-bottom: 24rpx;
}

.al-input {
  width: 300rpx;
  font-size: var(--fs-sub);
  color: var(--color-text);
  text-align: right;
}

.al-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  justify-content: flex-end;
  max-width: 560rpx;
}

.al-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 16rpx;
}
</style>
