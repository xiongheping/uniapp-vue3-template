<template>
  <x-page>
    <x-nav-bar title="家庭与隐私" right-text="＋邀请" @right="handleInvite" />

    <x-note type="purple">
      🔐 加入家庭不会自动共享任何数据，需逐项授权。
    </x-note>

    <!-- 成员列表 -->
    <x-card>
      <view class="fam-sec">
        👨‍👩‍👧 成员 · {{ members.length }}
      </view>
      <x-cell
        v-for="(m, index) in members"
        :key="m.name"
        icon="user"
        :title="m.name"
        :subtitle="m.desc"
        :last="index === members.length - 1"
      >
        <template #right>
          <x-tag v-if="m.role === 'admin'" type="blue">
            管理员
          </x-tag>
          <view v-else class="fam-link" @tap="openMatrix(m)">
            <x-tag type="gray">
              权限 ›
            </x-tag>
          </view>
        </template>
      </x-cell>
    </x-card>

    <!-- 物品默认可见范围 -->
    <x-card>
      <view class="fam-sec">
        👁 物品可见范围
      </view>
      <view class="fam-chips">
        <x-chip text="仅自己" :active="visibility === 'self'" @click="visibility = 'self'" />
        <x-chip text="家人可见" :active="visibility === 'family'" @click="visibility = 'family'" />
      </view>
      <x-note>
        当前：新增物品默认「{{ visibility === 'self' ? '仅自己' : '家人可见' }}」。可见范围在合并与共享时取更严格的一方。
      </x-note>
    </x-card>

    <!-- 17b 权限矩阵 -->
    <view class="x-section-title">
      17b · {{ currentMember.name }}的权限矩阵
    </view>
    <x-card>
      <view class="fam-sec">
        {{ currentMember.avatar }} {{ currentMember.name }} · {{ currentMember.level }}
      </view>
      <scroll-view class="fam-matrix" scroll-x>
        <view class="fam-grid">
          <view class="fam-grid__head">
            <text class="fam-cell fam-cell--name">
              分类
            </text>
            <view class="fam-cell fam-cell--cap">
              <x-icon name="eye" :size="32" :color="capColor" />
            </view>
            <view class="fam-cell fam-cell--cap">
              <x-icon name="pencil" :size="32" :color="capColor" />
            </view>
            <view class="fam-cell fam-cell--cap">
              <x-icon name="bell" :size="32" :color="capColor" />
            </view>
          </view>
          <view v-for="row in matrix" :key="row.cat" class="fam-grid__row">
            <text class="fam-cell fam-cell--name">
              {{ row.cat }}
            </text>
            <view
              v-for="cap in CAPS"
              :key="cap"
              class="fam-cell fam-cell--cap"
              @tap="toggleCap(row, cap)"
            >
              <text class="fam-mark" :class="row[cap] ? 'yes' : 'no'">
                {{ row[cap] ? '✓' : '—' }}
              </text>
            </view>
          </view>
        </view>
      </scroll-view>
      <x-note>
        🔒 健康数据按合规要求不参与家庭共享。📤 导出列下版本开放。
      </x-note>
    </x-card>

    <!-- 变更通知 -->
    <x-card>
      <view class="fam-sec">
        🔔 变更通知
      </view>
      <x-field v-for="n in notifyFields" :key="n.key" :label="n.label" last>
        <x-switch v-model:checked="n.on" />
      </x-field>
    </x-card>

    <x-note type="red">
      ⚠️ 移除成员后，该成员将立即失去所有共享访问，历史操作记录保留。
    </x-note>
    <view class="x-btns">
      <x-button type="ghost" text="保存权限" @click="handleSave" />
    </view>
  </x-page>
</template>

<script setup lang="ts">
import type { ItemVisibility } from '@/store/modules/item/types';
import { usePermission } from '@/hooks';

type CapKey = 'view' | 'edit' | 'bell';

interface Member {
  name: string;
  desc: string;
  role: 'admin' | 'member';
  avatar: string;
  level: string;
}

interface MatrixRow {
  cat: string;
  view: boolean;
  edit: boolean;
  bell: boolean;
  locked: boolean;
}

interface NotifyField {
  key: string;
  label: string;
  on: boolean;
}

const visibility = ref<ItemVisibility>('self');
const capColor = '#6B7590';
const CAPS: CapKey[] = ['view', 'edit', 'bell'];

const members = reactive<Member[]>([
  { name: '小明（我）', desc: '家庭创建者', role: 'admin', avatar: '👨', level: '管理员' },
  { name: '小雨', desc: '可编辑共享物品', role: 'member', avatar: '👩', level: '可编辑' },
  { name: '父亲', desc: '仅查看 · 已开放：药箱、血压计', role: 'member', avatar: '🧑', level: '仅查看' },
]);

const currentMember = computed<Member>(() => members[1]);

const matrix = reactive<MatrixRow[]>([
  { cat: '💊 药品', view: true, edit: true, bell: true, locked: false },
  { cat: '🧴 护肤', view: true, edit: true, bell: true, locked: false },
  { cat: '🍪 食品', view: true, edit: false, bell: true, locked: false },
  { cat: '🩺 健康数据', view: false, edit: false, bell: false, locked: true },
]);

const notifyFields = reactive<NotifyField[]>([
  { key: 'share', label: '共享变更通知', on: true },
  { key: 'perm', label: '权限变更通知', on: true },
  { key: 'sensitive', label: '敏感物品访问通知', on: true },
]);

function toggleCap(row: MatrixRow, cap: CapKey): void {
  if (row.locked) {
    uni.showToast({ title: '健康数据不参与家庭共享', icon: 'none' });
    return;
  }
  row[cap] = !row[cap];
}

function openMatrix(member: Member): void {
  uni.showToast({ title: `查看 ${member.name} 的权限`, icon: 'none' });
}

function handleInvite(): void {
  uni.showToast({ title: '已发送邀请', icon: 'none' });
}

function handleSave(): void {
  uni.showToast({ title: '权限已保存', icon: 'none' });
}

onShow(async () => {
  // tab 页需在 onShow 兜底权限拦截：未登录时由 hooks/use-permission 处理跳转
  await usePermission();
});
</script>

<style lang="scss" scoped>
.fam-sec {
  margin-bottom: 16rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: var(--color-purple);
}

.fam-chips {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.fam-link {
  display: inline-flex;
}

.fam-matrix {
  width: 100%;
  white-space: nowrap;
}

.fam-grid {
  display: inline-block;
  min-width: 100%;
  overflow: hidden;
  border: 2rpx solid var(--color-border);
  border-radius: 16rpx;
}

.fam-grid__head {
  display: flex;
  background: var(--color-fill);
}

.fam-grid__row {
  display: flex;
  border-top: 2rpx solid var(--color-divider);
}

.fam-cell {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 88rpx;
  padding: 16rpx 12rpx;
  font-size: 24rpx;
  white-space: nowrap;
}

.fam-cell--name {
  flex-shrink: 0;
  justify-content: flex-start;
  width: 220rpx;
  color: var(--color-text);
}

.fam-cell--cap {
  flex-shrink: 0;
  width: 128rpx;
}

.fam-grid__head .fam-cell {
  font-weight: 600;
  color: var(--color-text-sub);
}

.fam-mark {
  font-size: 30rpx;
  font-weight: 700;
}

.fam-mark.yes {
  color: var(--color-success-text);
}

.fam-mark.no {
  color: var(--color-icon-off);
}
</style>
