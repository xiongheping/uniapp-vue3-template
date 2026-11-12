<template>
  <x-page :reserve="180">
    <x-nav-bar :title="`${member?.name || '成员'}的权限`">
      <template #right>
        <view v-if="canRemove" class="pm-nav-remove x-tap-opacity" hover-class="x-tap-opacity--hover" :hover-start-time="0" @tap="openRemoveSheet">
          <x-icon name="user-x" :size="30" color="#D93025" />
          <text class="pm-nav-remove__text">
            移除
          </text>
        </view>
      </template>
    </x-nav-bar>

    <x-card v-if="member">
      <view class="pm-member">
        <view class="pm-avatar" :class="`pm-avatar--${member.tone}`">
          <image v-if="isImageAvatar(member.avatar)" :src="member.avatar" class="pm-avatar__img" mode="aspectFill" />
          <text v-else class="pm-avatar__text">
            {{ member.initial }}
          </text>
        </view>
        <view class="pm-member__body">
          <view class="pm-member__name">
            {{ member.name }}
          </view>
          <view class="pm-member__sub">
            {{ member.subtitle }}
          </view>
        </view>
        <x-tag :type="summary.type">
          {{ summary.text }}
        </x-tag>
      </view>
    </x-card>

    <x-note type="blue" icon="info">
      权限按物品分类授予，<text class="pm-b">
        新增物品默认不共享
      </text>。改动保存后立即生效，不需要对方确认。
    </x-note>

    <x-card>
      <view v-if="!rows.some(row => !row.locked)" class="pm-empty">
        还没有物品分类，先在物品页创建分类，再来分配权限。
      </view>
      <view class="pm-grid">
        <view class="pm-grid__head">
          <text class="pm-cell pm-cell--name">
            分类
          </text>
          <view v-for="cap in CAPS" :key="cap.key" class="pm-cell pm-cell--cap">
            <x-icon :name="cap.icon" :size="30" color="#6B7590" />
          </view>
        </view>
        <view v-for="row in rows" :key="row.key" class="pm-grid__row" :class="{ 'pm-grid__row--locked': row.locked }">
          <view class="pm-cell pm-cell--name">
            <x-icon v-if="row.locked" name="heart-pulse" :size="26" color="#D93025" />
            <text v-else class="pm-cell__cat">
              {{ row.icon ? `${row.icon} ` : '' }}{{ row.label }}
            </text>
            <text v-if="row.locked">
              健康数据
            </text>
          </view>
          <view
            v-for="cap in CAPS"
            :key="cap.key"
            class="pm-cell pm-cell--cap"
            @tap="toggleCap(row, cap.key)"
          >
            <text class="pm-mark" :class="markClass(row, cap.key)">
              {{ markText(row, cap.key) }}
            </text>
          </view>
        </view>
      </view>
      <view class="pm-matrix-foot">
        <view class="pm-matrix-foot__line">
          <x-icon name="lock" :size="24" color="#8A93A5" />
          <text>健康数据按合规要求不参与家庭共享，无法授权。</text>
        </view>
        <view class="pm-matrix-foot__line">
          <x-icon name="download" :size="24" color="#8A93A5" />
          <text>导出列下版本开放，当前仅本人可导出。</text>
        </view>
      </view>
    </x-card>

    <x-card>
      <x-field label="新增物品默认" icon="shield-user" :value="visibility === 'self' ? '不共享 ›' : '家人可见 ›'" chevron @click="toggleVisibility" />
      <x-field label="敏感物品需 Face ID" icon="fingerprint-pattern">
        <x-switch v-model:checked="faceIdOn" @change="savePrefs" />
      </x-field>
      <x-field label="接收变更通知" icon="bell-ring" last>
        <x-switch v-model:checked="notifyMemberOn" @change="savePrefs" />
      </x-field>
    </x-card>

    <x-note v-if="canRemove" type="red" icon="triangle-alert">
      移除成员后，该成员将立即失去所有共享访问，历史操作记录保留 30 天。
    </x-note>

    <template #sticky>
      <view class="x-btns row">
        <x-button class="pm-btns__act" type="ghost" text="取消" @click="handleCancel" />
        <x-button class="pm-btns__act" text="保存权限" :disabled="!isAdmin" @click="handleSave" />
      </view>
    </template>

    <x-sheet v-model:show="removeSheetVisible" title="移除成员？" sub="移除后该成员将立即失去所有共享访问">
      <view v-if="member" class="pm-remind">
        <view class="pm-avatar pm-avatar--sm" :class="`pm-avatar--${member.tone}`">
          <image v-if="isImageAvatar(member.avatar)" :src="member.avatar" class="pm-avatar__img" mode="aspectFill" />
          <text v-else class="pm-avatar__text">
            {{ member.initial }}
          </text>
        </view>
        <view class="pm-remind__body">
          <view class="pm-remind__name">
            {{ member.name }}
          </view>
          <view class="pm-remind__desc">
            {{ summary.text }} · 已开放 {{ openViewCount }} 个分类
          </view>
        </view>
      </view>
      <x-note type="red">
        移除后 TA 将看不到你共享的物品和计划，也不能再帮你代打卡；历史操作记录保留 30 天。
      </x-note>
      <x-button class="pm-sheet__danger" type="danger" :text="`确认移除 ${member?.name || ''}`" @click="confirmRemove" />
      <x-button type="gray" text="取消" @click="removeSheetVisible = false" />
    </x-sheet>
  </x-page>
</template>

<script setup lang="ts">
import type { FamilyMemberVo, FamilyPermissionVo } from '@/api/xiaoqi/family';
import type { ItemCategoryVo } from '@/api/xiaoqi/item';
import type { ItemVisibility } from '@/store/modules/item/types';
import { FamilyApi } from '@/api/xiaoqi/family';
import { ItemApi } from '@/api/xiaoqi/item';
import { usePermission } from '@/hooks';
import { useUserStore } from '@/store';

type CapKey = 'view' | 'edit' | 'bell' | 'export';

interface PermRow {
  key: string;
  label: string;
  icon: string;
  categoryId?: number | string;
  view: boolean;
  edit: boolean;
  bell: boolean;
  locked: boolean;
}

interface CapMeta {
  key: CapKey;
  icon: string;
}

interface MemberView {
  name: string;
  initial: string;
  tone: string;
  avatar: string;
  subtitle: string;
}

const ROLE_OWNER = 0;
const ROLE_ADMIN = 1;
const ROLE_MEMBER = 2;
const AVATAR_TONES = ['violet', 'rose', 'amber', 'green', 'blue'];
const CAPS: CapMeta[] = [
  { key: 'view', icon: 'eye' },
  { key: 'edit', icon: 'pencil' },
  { key: 'bell', icon: 'bell' },
  { key: 'export', icon: 'download' },
];

const userStore = useUserStore();

const targetUserId = ref<string>('');
const memberRows = ref<FamilyMemberVo[]>([]);
const categories = ref<ItemCategoryVo[]>([]);
const rows = ref<PermRow[]>([]);
const visibility = ref<ItemVisibility>('self');
const faceIdOn = ref<boolean>(true);
const notifyMemberOn = ref<boolean>(true);
const removeSheetVisible = ref<boolean>(false);

const targetRow = computed<FamilyMemberVo | null>(() =>
  memberRows.value.find(row => String(row.userId) === targetUserId.value) || null,
);

const selfRow = computed<FamilyMemberVo | null>(() =>
  memberRows.value.find(row => String(row.userId) === String(userStore.memberId)) || null,
);

const isAdmin = computed<boolean>(() =>
  !!selfRow.value && (selfRow.value.role === ROLE_OWNER || selfRow.value.role === ROLE_ADMIN),
);

const canRemove = computed<boolean>(() =>
  isAdmin.value && !!targetRow.value && targetRow.value.role === ROLE_MEMBER && String(targetRow.value.userId) !== String(userStore.memberId),
);

const member = computed<MemberView | null>(() => {
  const row = targetRow.value;
  if (!row) {
    return null;
  }
  const index = memberRows.value.findIndex(item => String(item.userId) === String(row.userId));
  const nick = row.nickname || `成员${row.userId}`;
  const joined = row.joinTime ? `加入于 ${formatDate(row.joinTime)} · ` : '';
  return {
    name: nick,
    initial: [...nick][0] || '家',
    tone: String(row.userId) === String(userStore.memberId) ? 'me' : AVATAR_TONES[index % AVATAR_TONES.length],
    avatar: row.avatar || '',
    subtitle: `${joined}${levelOf(row.role)}`,
  };
});

const openViewCount = computed<number>(() => rows.value.filter(row => !row.locked && row.view).length);

const summary = computed<{ text: string; type: 'purple' | 'blue' | 'gray' }>(() => {
  const open = rows.value.filter(row => !row.locked && row.view);
  if (!open.length) {
    return { text: '未授权', type: 'gray' };
  }
  if (open.some(row => row.edit)) {
    return { text: '可编辑', type: 'purple' };
  }
  if (open.some(row => row.bell)) {
    return { text: '可提醒', type: 'blue' };
  }
  return { text: '仅查看', type: 'gray' };
});

function levelOf(role?: number): string {
  if (role === ROLE_OWNER) {
    return '创建者';
  }
  return role === ROLE_ADMIN ? '管理员' : '普通成员';
}

function formatDate(value?: string): string {
  return value ? value.slice(0, 10).replace(/-/g, '.') : '';
}

function isImageAvatar(avatar?: string): boolean {
  if (!avatar) {
    return false;
  }
  return /^(https?:)?\/\//.test(avatar) || avatar.startsWith('/') || avatar.startsWith('data:');
}

function markText(row: PermRow, cap: CapKey): string {
  if (row.locked || cap === 'export') {
    return '—';
  }
  return row[cap] ? '✓' : '—';
}

function markClass(row: PermRow, cap: CapKey): string {
  return !row.locked && cap !== 'export' && row[cap] ? 'yes' : 'no';
}

function toggleCap(row: PermRow, cap: CapKey): void {
  if (cap === 'export') {
    uni.showToast({ title: '导出列下版本开放', icon: 'none' });
    return;
  }
  if (row.locked) {
    uni.showToast({ title: '健康数据不参与家庭共享', icon: 'none' });
    return;
  }
  if (!isAdmin.value) {
    uni.showToast({ title: '仅创建者或管理员可调整权限', icon: 'none' });
    return;
  }
  row[cap] = !row[cap];
}

function toggleVisibility(): void {
  visibility.value = visibility.value === 'self' ? 'family' : 'self';
  savePrefs();
  uni.showToast({ title: visibility.value === 'self' ? '新增物品默认不共享' : '新增物品默认家人可见', icon: 'none' });
}

/** 后端无对应字段，按成员做设备级偏好存储 */
function prefKey(name: string): string {
  return `xq_perm_${name}_${targetUserId.value}`;
}

function loadPrefs(): void {
  visibility.value = uni.getStorageSync(prefKey('visibility')) === 'family' ? 'family' : 'self';
  faceIdOn.value = uni.getStorageSync(prefKey('faceid')) !== false;
  notifyMemberOn.value = uni.getStorageSync(prefKey('notify')) !== false;
}

function savePrefs(): void {
  uni.setStorageSync(prefKey('visibility'), visibility.value);
  uni.setStorageSync(prefKey('faceid'), faceIdOn.value);
  uni.setStorageSync(prefKey('notify'), notifyMemberOn.value);
}

function buildRows(perms: FamilyPermissionVo[]): void {
  const permMap = new Map<string, FamilyPermissionVo>();
  perms.forEach((perm) => {
    permMap.set(String(perm.categoryId ?? ''), perm);
  });
  const list: PermRow[] = categories.value.map((cat) => {
    const perm = permMap.get(String(cat.id));
    return {
      key: String(cat.id),
      label: cat.categoryName,
      icon: cat.icon || '',
      categoryId: cat.id,
      view: perm?.canView === 1,
      edit: perm?.canEdit === 1,
      bell: perm?.canRemind === 1,
      locked: false,
    };
  });
  list.push({ key: 'health', label: '健康数据', icon: '', view: false, edit: false, bell: false, locked: true });
  rows.value = list;
}

async function loadPage(): Promise<void> {
  if (!targetUserId.value) {
    uni.showToast({ title: '缺少成员参数', icon: 'none' });
    return;
  }
  try {
    const [memberPage, categoryPage, perms] = await Promise.all([
      FamilyApi.memberList(),
      ItemApi.category.list({ pageNum: 1, pageSize: 50 }),
      FamilyApi.permissions(targetUserId.value),
    ]);
    memberRows.value = memberPage.rows || [];
    categories.value = categoryPage.rows || [];
    if (!memberRows.value.some(row => String(row.userId) === targetUserId.value)) {
      uni.showToast({ title: '成员不存在或已移除', icon: 'none' });
      return;
    }
    buildRows(perms || []);
  }
  catch (error: any) {
    uni.showToast({ title: error?.msg || '权限加载失败', icon: 'none' });
  }
}

async function handleSave(): Promise<void> {
  if (!isAdmin.value) {
    uni.showToast({ title: '仅创建者或管理员可保存权限', icon: 'none' });
    return;
  }
  const editable = rows.value.filter(row => !row.locked && row.categoryId != null);
  if (!editable.length) {
    uni.showToast({ title: '请先创建物品分类', icon: 'none' });
    return;
  }
  uni.showLoading({ title: '保存中', mask: true });
  try {
    for (const row of editable) {
      await FamilyApi.savePermission(targetUserId.value, {
        categoryId: row.categoryId,
        canView: row.view ? 1 : 0,
        canEdit: row.edit ? 1 : 0,
        canRemind: row.bell ? 1 : 0,
        canExport: 0,
      });
    }
    uni.hideLoading();
    uni.showToast({ title: '权限已保存', icon: 'none' });
  }
  catch (error: any) {
    uni.hideLoading();
    uni.showToast({ title: error?.msg || '保存失败', icon: 'none' });
  }
}

function handleCancel(): void {
  uni.navigateBack({
    fail: () => {
      uni.redirectTo({ url: '/pages/user/family/index' });
    },
  });
}

function openRemoveSheet(): void {
  if (!canRemove.value) {
    return;
  }
  removeSheetVisible.value = true;
}

async function confirmRemove(): Promise<void> {
  try {
    await FamilyApi.removeMember(targetUserId.value);
    removeSheetVisible.value = false;
    uni.showToast({ title: '已移除', icon: 'none' });
    handleCancel();
  }
  catch (error: any) {
    uni.showToast({ title: error?.msg || '移除失败', icon: 'none' });
  }
}

onLoad((options: any) => {
  targetUserId.value = String(options?.userId || '');
  loadPrefs();
});

onShow(async () => {
  const ok = await usePermission();
  if (!ok) {
    return;
  }
  if (!userStore.memberId) {
    await userStore.fetchInfo().catch(() => {});
  }
  await loadPage();
});
</script>

<style lang="scss" scoped>
.pm-b {
  font-weight: 700;
}

.pm-nav-remove {
  display: flex;
  gap: 6rpx;
  align-items: center;
  justify-content: flex-end;
  min-height: 72rpx;
  padding-left: 16rpx;
  color: var(--color-danger);
}

.pm-nav-remove__text {
  font-size: var(--fs-sub);
  font-weight: 600;
}

.pm-member {
  display: flex;
  gap: 24rpx;
  align-items: center;
}

.pm-member__body {
  flex: 1;
  min-width: 0;
}

.pm-member__name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 30rpx;
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
}

.pm-member__sub {
  margin-top: 4rpx;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}

/* 头像（与家庭页成员行同一套渐变色） */
.pm-avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  overflow: hidden;
  font-size: 36rpx;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #4f7cff, #7b5cff);
  border-radius: 50%;
}

.pm-avatar--sm {
  width: 80rpx;
  height: 80rpx;
  font-size: 32rpx;
}

.pm-avatar--me {
  background: linear-gradient(135deg, #4f7cff, #7b5cff);
}

.pm-avatar--violet {
  background: linear-gradient(135deg, #7b3ff2, #9b6bff);
}

.pm-avatar--rose {
  background: linear-gradient(135deg, #fa8c8c, #f56c6c);
}

.pm-avatar--amber {
  background: linear-gradient(135deg, #f5a623, #f7b955);
}

.pm-avatar--green {
  background: linear-gradient(135deg, #52c41a, #7dd64d);
}

.pm-avatar--blue {
  background: linear-gradient(135deg, #1677ff, #4f9cff);
}

.pm-avatar__img {
  width: 100%;
  height: 100%;
}

.pm-avatar__text {
  line-height: 1;
}

/* 权限矩阵 */
.pm-empty {
  padding: 12rpx 12rpx 24rpx;
  font-size: var(--fs-sub);
  line-height: 1.6;
  color: var(--color-text-sub);
}

.pm-grid__head {
  display: flex;
  border-bottom: 2rpx solid var(--color-divider);
}

.pm-grid__row {
  display: flex;
  border-bottom: 2rpx solid var(--color-divider);
}

.pm-grid__row--locked {
  background: var(--color-fill-light);
}

.pm-cell {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  min-height: 84rpx;
  padding: 20rpx 8rpx;
  font-size: var(--fs-sub);
}

.pm-cell--name {
  flex: 1;
  gap: 8rpx;
  min-width: 0;
  color: var(--color-text);
}

.pm-cell__cat {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pm-cell--cap {
  flex-shrink: 0;
  justify-content: center;
  width: 96rpx;
}

.pm-grid__head .pm-cell {
  min-height: 76rpx;
  font-size: var(--fs-caption);
  font-weight: 600;
  color: var(--color-text-sub);
}

.pm-mark {
  font-size: 30rpx;
  font-weight: 700;
}

.pm-mark.yes {
  color: var(--color-success-text);
}

.pm-mark.no {
  color: var(--color-icon-off);
}

.pm-matrix-foot {
  padding: 16rpx 8rpx 12rpx;
}

.pm-matrix-foot__line {
  display: flex;
  gap: 8rpx;
  align-items: flex-start;
  font-size: var(--fs-caption);
  line-height: 1.6;
  color: var(--color-text-weak);
}

.pm-matrix-foot__line + .pm-matrix-foot__line {
  margin-top: 6rpx;
}

.pm-btns__act {
  flex: 1;
  min-width: 0;
}

/* 17-M 风移除确认 */
.pm-remind {
  display: flex;
  gap: 20rpx;
  align-items: center;
  padding: 20rpx 24rpx;
  margin-bottom: 20rpx;
  background: var(--color-primary-mist);
  border-radius: 24rpx;
}

.pm-remind__body {
  flex: 1;
  min-width: 0;
}

.pm-remind__name {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text);
}

.pm-remind__desc {
  margin-top: 4rpx;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}

.pm-sheet__danger {
  color: #ffffff !important;
  background: var(--color-danger) !important;
  border-color: var(--color-danger) !important;
}
</style>
