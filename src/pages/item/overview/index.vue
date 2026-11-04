<template>
  <x-page :padded="false" :reserve="manageMode ? 176 : 120">
    <!-- 顶栏 -->
    <view class="ov-head">
      <view class="ov-head__bar">
        <view class="ov-head__back" @click="goBack">
          <x-icon name="arrow-l" :size="44" :color="navColor" />
        </view>
        <text class="ov-head__title">
          {{ groupTitle }}
        </text>
        <text class="ov-head__mgmt" @click="toggleManage">
          {{ manageMode ? '完成' : '管理' }}
        </text>
      </view>
      <view v-if="!manageMode" class="ov-search">
        <x-icon name="search" :size="32" color="#8A93A5" />
        <input
          v-model="itemStore.keyword"
          class="ov-search__input"
          placeholder="搜索物品…"
          placeholder-style="color:#8A93A5"
          type="text"
        >
      </view>
    </view>

    <!-- 列表 -->
    <view class="ov-body">
      <x-card v-if="sourceList.length > 0" flat>
        <view v-for="(it, idx) in sourceList" :key="it.id">
          <view v-if="manageMode" class="ov-pick" @click="itemStore.toggleSelect(it.id)">
            <x-check :checked="isChecked(it.id)" />
            <view class="ov-pick__ico">
              <x-icon :name="catIcon(it.category)" :size="36" :color="iconColor(it)" />
            </view>
            <view class="x-flex-1">
              <view class="ov-pick__name x-ellipsis">
                {{ it.name }}
              </view>
              <view class="x-sub">
                {{ catLabel(it.category) }} · {{ it.location || '未设置' }}
              </view>
            </view>
            <x-tag :type="toneOf(it)">
              {{ rightText(it) }}
            </x-tag>
          </view>
          <x-cell
            v-else
            :icon="catIcon(it.category)"
            :tone="toneOf(it)"
            :title="it.name"
            :subtitle="`${catLabel(it.category)} · ${it.location || '未设置'}`"
            :tag="rightText(it)"
            :tag-type="toneOf(it)"
            chevron
            :last="idx === sourceList.length - 1"
            @click="goDetail(it.id)"
          />
        </view>
      </x-card>

      <x-empty
        v-else
        emoji="📭"
        :title="itemStore.keyword ? '没有匹配的物品' : '这里还是空的'"
        :sub="itemStore.keyword ? '换个关键词试试' : '添加物品后会出现在这里'"
      >
        <template v-if="!itemStore.keyword" #action>
          <x-button type="primary" icon="plus" text="去添加" @click="goAdd" />
        </template>
      </x-empty>
    </view>

    <!-- 批量操作条 -->
    <template v-if="manageMode" #sticky>
      <view class="ov-sticky x-safe-bottom">
        <template v-if="selectedCount > 0">
          <text class="ov-sticky__count">
            已选 {{ selectedCount }} 件
          </text>
          <view class="ov-actions">
            <template v-if="isArchiveGroup">
              <x-button type="ghost" small text="恢复" @click="doRestore" />
              <x-button type="ghost" small text="移入回收站" @click="doTrash" />
              <x-button type="danger" small text="彻底删除" @click="doDeleteForever" />
            </template>
            <template v-else>
              <x-button type="ghost" small text="标记已用完" @click="doArchive('used')" />
              <x-button type="ghost" small text="移到已扔" @click="doArchive('thrown')" />
              <x-button type="danger" small text="移入回收站" @click="doTrash" />
            </template>
          </view>
        </template>
        <template v-else>
          <text class="ov-sticky__count">
            已选 0 件 · 点物品选择
          </text>
          <x-button type="ghost" small text="全选本页" @click="selectAllLocal" />
        </template>
      </view>
    </template>
  </x-page>
</template>

<script setup lang="ts">
import type { ArchiveMode, ItemRecord, ItemView } from '@/store/modules/item/types';
import { useTheme } from '@/hooks';
import { useItemStore } from '@/store';
import { dueLabel } from '@/utils/date';

/**
 * 分组浏览的行数据：在用组带到期天数，归档组只有原始记录
 */
type GroupRow = ItemView | ItemRecord;
type Tone = 'red' | 'orange' | 'green' | 'gray';

const itemStore = useItemStore();
const { isDark } = useTheme();

const GROUP_TITLE: Record<string, string> = {
  expired: '已过期',
  expiring: '临期中',
  safe: '安全',
  used: '已用完',
  thrown: '已扔',
};
const CAT_ICON: Record<string, string> = { drug: 'pill', skin: 'droplet', food: 'cookie', other: 'package' };
const CAT_LABEL: Record<string, string> = { drug: '药品', skin: '护肤', food: '食品', other: '其他' };
const ICON_COLOR: Record<Tone, string> = {
  red: '#D93025',
  orange: '#C77700',
  green: '#2E7D32',
  gray: '#6B7590',
};

const group = ref<string>('');
const manageMode = ref<boolean>(false);

const groupTitle = computed<string>(() => GROUP_TITLE[group.value] ?? '全部物品');
const isArchiveGroup = computed<boolean>(() => group.value === 'used' || group.value === 'thrown');
const navColor = computed<string>(() => (isDark.value ? '#F0F2F6' : '#1A2233'));
const selectedCount = computed<number>(() => itemStore.selectedCount);

function catIcon(key: string) {
  return CAT_ICON[key] ?? 'package';
}

function catLabel(key: string) {
  return CAT_LABEL[key] ?? '其他';
}

/**
 * 归档组不在 store 的过滤链路里，关键字在本页补一层
 */
function matchKeyword(list: GroupRow[]) {
  if (!itemStore.keyword) {
    return list;
  }
  const text = itemStore.keyword.toLowerCase();
  return list.filter(it => `${it.name}${it.location || ''}`.toLowerCase().includes(text));
}

const sourceList = computed<GroupRow[]>(() => {
  const g = group.value;
  if (g === 'expired') {
    return itemStore.expiredList;
  }
  if (g === 'expiring') {
    return itemStore.expiringList;
  }
  if (g === 'safe') {
    return itemStore.safeList;
  }
  if (g === 'used') {
    return matchKeyword(itemStore.list.filter(it => it.status === 'used'));
  }
  if (g === 'thrown') {
    return matchKeyword(itemStore.list.filter(it => it.status === 'thrown'));
  }
  return itemStore.filtered;
});

function isChecked(id: string) {
  return itemStore.selectedIds.includes(id);
}

function toneOf(it: GroupRow): Tone {
  if (it.status === 'used') {
    return 'green';
  }
  if (it.status === 'thrown') {
    return 'red';
  }
  const days = 'dueDays' in it ? it.dueDays : Number.NaN;
  if (Number.isNaN(days)) {
    return 'gray';
  }
  if (days < 0) {
    return 'red';
  }
  if (days <= 30) {
    return 'orange';
  }
  return 'green';
}

function iconColor(it: GroupRow) {
  return ICON_COLOR[toneOf(it)];
}

function rightText(it: GroupRow) {
  if (it.status === 'used') {
    return '已用完';
  }
  if (it.status === 'thrown') {
    return '已扔';
  }
  return it.dueDate ? dueLabel(it.dueDate) : '未填写';
}

function toggleManage() {
  manageMode.value = !manageMode.value;
  itemStore.clearSelection();
}

function selectAllLocal() {
  const all = sourceList.value.every(it => isChecked(it.id));
  itemStore.clearSelection();
  if (all) {
    return;
  }
  sourceList.value.forEach(it => itemStore.toggleSelect(it.id));
}

function exitManage() {
  manageMode.value = false;
  itemStore.clearSelection();
}

function doArchive(mode: ArchiveMode) {
  itemStore.archive([...itemStore.selectedIds], mode);
  exitManage();
  uni.showToast({ title: mode === 'used' ? '已标记用完' : '已移到已扔', icon: 'none' });
}

function doRestore() {
  itemStore.restore([...itemStore.selectedIds]);
  exitManage();
  uni.showToast({ title: '已恢复', icon: 'none' });
}

function doTrash() {
  itemStore.moveToTrash([...itemStore.selectedIds]);
  exitManage();
  uni.showToast({ title: '已移入回收站', icon: 'none' });
}

function doDeleteForever() {
  const ids = [...itemStore.selectedIds];
  uni.showModal({
    title: '彻底删除',
    content: `将永久删除 ${ids.length} 件物品，不可恢复。确认继续？`,
    confirmText: '删除',
    confirmColor: '#D93025',
    success: (res) => {
      if (res.confirm) {
        itemStore.deleteForever(ids);
        exitManage();
        uni.showToast({ title: '已彻底删除', icon: 'none' });
      }
    },
  });
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/item/detail/index?id=${id}` });
}

function goAdd() {
  uni.navigateTo({ url: '/pages/item/add/index' });
}

function goBack() {
  uni.navigateBack();
}

onLoad((options: Record<string, string> = {}) => {
  group.value = options.group || '';
});

onPullDownRefresh(() => {
  // 数据来自本机 store，重新渲染后收起
  setTimeout(() => uni.stopPullDownRefresh(), 300);
});
</script>

<style lang="scss" scoped>
.ov-head {
  padding: calc(var(--status-bar-height) + 12rpx) 32rpx 16rpx;
  background: var(--color-bg);
}

.ov-head__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72rpx;
}

.ov-head__back {
  display: flex;
  align-items: center;
  min-width: 80rpx;
}

.ov-head__title {
  font-size: var(--fs-nav);
  font-weight: 700;
  color: var(--color-text);
}

.ov-head__mgmt {
  min-width: 80rpx;
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--color-primary);
  text-align: right;
}

.ov-search {
  display: flex;
  gap: 12rpx;
  align-items: center;
  min-height: 80rpx;
  padding: 0 24rpx;
  margin-top: 16rpx;
  background: var(--color-card);
  border-radius: var(--radius-cell);
}

.ov-search__input {
  flex: 1;
  min-width: 0;
  font-size: var(--fs-body);
  color: var(--color-text);
}

.ov-body {
  padding: 8rpx 32rpx 24rpx;
}

.ov-pick {
  box-sizing: border-box;
  display: flex;
  gap: 20rpx;
  align-items: center;
  min-height: var(--h-cell);
  padding: 22rpx 24rpx;
  border-bottom: 2rpx solid var(--color-divider);
}

.ov-pick:last-child {
  border-bottom: none;
}

.ov-pick__ico {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  background: var(--color-fill-light);
  border-radius: 16rpx;
}

.ov-pick__name {
  font-size: var(--fs-body);
  font-weight: 600;
  color: var(--color-text);
}

.ov-sticky {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.ov-sticky__count {
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}

.ov-actions {
  display: flex;
  gap: 16rpx;
}

.ov-actions > .x-button {
  flex: 1;
}
</style>
