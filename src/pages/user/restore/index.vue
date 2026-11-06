<template>
  <x-page :reserve="180">
    <x-nav-bar title="恢复预览" />

    <x-note type="blue">
      📦 备份时间：{{ backupMeta.at }} · 来自{{ backupMeta.source }}
    </x-note>

    <!-- 备份内容概览 -->
    <x-card>
      <x-field label="物品" :value="`${backupMeta.counts.item} 件`" />
      <x-field label="用药计划" :value="`${backupMeta.counts.plan} 个`" />
      <x-field label="用药记录" :value="`${backupMeta.counts.med} 条`" />
      <x-field label="与当前数据冲突" last>
        <text class="rs-conflict">
          {{ backupMeta.counts.conflict }} 件物品
        </text>
      </x-field>
    </x-card>

    <!-- 冲突处理：三选一互斥 radio -->
    <x-card>
      <view class="rs-sec">
        冲突处理（默认已选「合并保留最新修改」）
      </view>
      <view v-for="opt in conflictOptions" :key="opt.value" class="rs-opt x-tap-bg" hover-class="x-tap--hover" :hover-start-time="0" @tap="conflictStrategy = opt.value">
        <view class="rs-opt__head">
          <text class="rs-opt__label">
            {{ opt.label }}
          </text>
          <x-radio :checked="conflictStrategy === opt.value" />
        </view>
        <view class="rs-opt__desc">
          {{ opt.desc }}
        </view>
      </view>
    </x-card>

    <x-note type="red">
      ⚠️ 恢复前建议先导出当前数据；恢复过程约 10 秒，请勿关闭 App。
    </x-note>

    <template #sticky>
      <view class="x-btns row">
        <x-button type="ghost" text="取消" @click="handleCancel" />
        <x-button text="确认恢复" @click="handleRestore" />
      </view>
    </template>
  </x-page>
</template>

<script setup lang="ts">
import type { ItemDraft, MergeStrategy } from '@/store/modules/item/types';
import { usePermission } from '@/hooks';
import { useItemStore } from '@/store';

interface BackupCounts {
  item: number;
  plan: number;
  med: number;
  conflict: number;
}

interface BackupSnapshot {
  at: string;
  source: string;
  counts: BackupCounts;
  items: ItemDraft[];
}

interface ConflictOption {
  value: string;
  label: string;
  desc: string;
}

const itemStore = useItemStore();

// 备份快照 mock：真实项目由本地缓存读取 key=backup_data 的快照
const DEFAULT_BACKUP: BackupSnapshot = {
  at: '2026.10.28 21:14',
  source: '本机本地备份',
  counts: { item: 30, plan: 4, med: 5, conflict: 3 },
  // 待恢复物品（含与当前数据重名的冲突项、缺 dueDate 的待确认项）
  items: [
    {
      name: '连花清瘟胶囊',
      dueDate: '2026-11-15',
      qty: 2,
      visibility: 'family',
      category: 'drug',
      location: '药箱左侧',
    },
    { name: '阿莫西林胶囊', dueDate: '2026-11-05', qty: 1, visibility: 'self', category: 'drug', location: '药箱左侧' },
    {
      name: '备份独有：汤剂包',
      dueDate: '2026-12-01',
      qty: 5,
      visibility: 'family',
      category: 'drug',
      location: '冰箱冷藏',
    },
    { name: '缺日期物品', dueDate: '', qty: 1, visibility: 'self', category: 'other', location: '抽屉' },
  ],
};

const backupMeta = computed<BackupSnapshot>(() => {
  const saved = uni.getStorageSync('backup_data') as BackupSnapshot | '';
  return saved && typeof saved === 'object' && saved.counts ? saved : DEFAULT_BACKUP;
});

const conflictStrategy = ref<string>('merge-latest');

const conflictOptions: ConflictOption[] = [
  { value: 'overwrite', label: '覆盖本地（以备份为准）', desc: '全部按备份写入，本机新增项将作为独立物品保留。' },
  {
    value: 'merge-latest',
    label: '合并保留最新修改',
    desc: '默认推荐：判重键命中则合并数量取 max、可见范围取更严格方，未命中则新增。',
  },
  { value: 'missing-only', label: '仅恢复本地缺失项', desc: '只补回本机没有的物品，已有物品不改动。' },
];

function mapStrategy(): MergeStrategy {
  if (conflictStrategy.value === 'overwrite') {
    return 'local';
  }
  return 'merge';
}

function handleCancel(): void {
  uni.navigateBack();
}

// 恢复口径：读取备份快照 items，走 itemStore.mergeGuest（PRD 规则三判重）
// 覆盖本地=local（全部并入）；合并/仅缺失=merge（判重去重，冲突合并、缺失新增、缺日期计待确认）
function handleRestore(): void {
  const result = itemStore.mergeGuest(backupMeta.value.items || [], mapStrategy());
  uni.showToast({
    title: `已恢复：合并 ${result.mergedCount} · 冲突 ${result.conflictCount} · 待确认 ${result.pendingCount}`,
    icon: 'none',
    duration: 2500,
  });
  setTimeout(() => uni.navigateBack(), 600);
}

onShow(async () => {
  // 未登录时由 hooks/use-permission 处理跳转
  await usePermission();
});
</script>

<style lang="scss" scoped>
.rs-conflict {
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--color-warning-text);
}

.rs-sec {
  margin-bottom: 16rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: var(--color-text);
}

.rs-opt {
  padding: 20rpx 0;
  border-bottom: 2rpx solid var(--color-divider);
}

.rs-opt:last-child {
  border-bottom: none;
}

.rs-opt__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--h-touch);
}

.rs-opt__label {
  font-size: var(--fs-body);
  font-weight: 600;
  color: var(--color-text);
}

.rs-opt__desc {
  margin-top: 4rpx;
  font-size: var(--fs-sub);
  line-height: 1.5;
  color: var(--color-text-sub);
}
</style>
