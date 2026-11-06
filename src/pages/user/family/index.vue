<template>
  <x-page>
    <x-nav-bar title="家庭与隐私" right-text="＋邀请" @right="handleInvite" />

    <x-note type="purple">
      🔐 加入家庭不会自动共享任何数据，需逐项授权。
    </x-note>

    <!-- 成员列表 -->
    <x-card>
      <view class="fam-sec fam-sec--gray">
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
          <view v-else class="fam-link x-tap-opacity" hover-class="x-tap-opacity--hover" :hover-start-time="0" @tap="openMatrix(m)">
            <x-tag type="gray">
              权限 ›
            </x-tag>
          </view>
        </template>
      </x-cell>
    </x-card>

    <!-- 变更通知（原型 17） -->
    <x-card>
      <view class="fam-sec">
        🔔 变更通知
      </view>
      <x-field v-for="(n, i) in notifyFields" :key="n.key" :label="n.label" :icon="n.icon" :last="i === notifyFields.length - 1">
        <x-switch v-model:checked="n.on" />
      </x-field>
    </x-card>

    <!-- 伪名保护 -->
    <x-card>
      <view class="fam-sec">
        🥸 伪名保护
      </view>
      <x-field label="敏感物品化名显示" icon="eye" last>
        <x-switch v-model:checked="aliasOn" />
      </x-field>
      <view class="fam-alias-tip">
        示例：“维生素 B6”（实为敏感药品），点开需 Face ID；不支持 Face ID 时可用设备密码或家人协助。
      </view>
      <view class="x-btns row fam-btns">
        <x-button type="ghost" small text="设置伪名清单 ›" @click="handleAliasList" />
        <x-button type="ghost" small text="权限矩阵 ›" @click="openMatrix(currentMember)" />
      </view>
    </x-card>

    <!-- 退出 / 转让 -->
    <x-card>
      <x-cell icon="logout" tone="red" title="退出家庭" subtitle="退出后不再接收家庭共享内容" chevron @click="handleLeave" />
      <x-cell icon="crown" title="转让管理员" subtitle="转让后你将变为普通成员" chevron last @click="handleTransfer" />
    </x-card>

    <!-- 17b 权限矩阵：点「权限 ›」展开（v-show 减少重复创建） -->
    <view v-show="matrixOpen">
      <view class="x-section-title x-expand">
        权限矩阵 · {{ currentMember.name }}
      </view>
      <x-card class="x-expand">
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
        <view class="fam-foot">
          🔒 健康数据按合规要求不参与家庭共享。📤 导出列下版本开放。
        </view>
      </x-card>

      <x-card>
        <x-field label="新增物品默认" icon="shield-user" :value="visibility === 'self' ? '不共享 ›' : '家人可见 ›'" chevron @click="toggleVisibility" />
        <x-field label="敏感物品需 Face ID" icon="fingerprint-pattern">
          <x-switch v-model:checked="faceIdOn" />
        </x-field>
        <x-field label="接收变更通知" icon="bell-ring" last>
          <x-switch v-model:checked="notifyMemberOn" />
        </x-field>
      </x-card>

      <x-note type="red">
        ⚠️ 移除成员后，该成员将立即失去所有共享访问，历史操作记录保留。
      </x-note>
      <view class="x-btns">
        <x-button type="ghost" text="保存权限" @click="handleSave" />
      </view>
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
  icon: string;
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

const currentMember = ref<Member>(members[1]);
/** 权限矩阵默认收起，点「权限 ›」展开（原型 17b 为独立屏） */
const matrixOpen = ref<boolean>(false);
const aliasOn = ref<boolean>(true);
const faceIdOn = ref<boolean>(true);
const notifyMemberOn = ref<boolean>(true);

const matrix = reactive<MatrixRow[]>([
  { cat: '💊 药品', view: true, edit: true, bell: true, locked: false },
  { cat: '🧴 护肤', view: true, edit: true, bell: true, locked: false },
  { cat: '🍪 食品', view: true, edit: false, bell: true, locked: false },
  { cat: '🩺 健康数据', view: false, edit: false, bell: false, locked: true },
]);

const notifyFields = reactive<NotifyField[]>([
  { key: 'share', label: '共享变更通知', icon: 'share', on: true },
  { key: 'perm', label: '权限变更通知', icon: 'key', on: true },
  { key: 'sensitive', label: '敏感物品访问通知', icon: 'shield-user', on: true },
]);

function toggleCap(row: MatrixRow, cap: CapKey): void {
  if (row.locked) {
    uni.showToast({ title: '健康数据不参与家庭共享', icon: 'none' });
    return;
  }
  row[cap] = !row[cap];
}

function openMatrix(member: Member): void {
  currentMember.value = member;
  matrixOpen.value = true;
}

function toggleVisibility(): void {
  visibility.value = visibility.value === 'self' ? 'family' : 'self';
  uni.showToast({ title: visibility.value === 'self' ? '新增物品默认不共享' : '新增物品默认家人可见', icon: 'none' });
}

function handleAliasList(): void {
  uni.showToast({ title: '设置伪名清单', icon: 'none' });
}

function handleLeave(): void {
  uni.showModal({
    title: '退出家庭？',
    content: '退出后不再接收家庭共享内容，你共享出去的物品会立即收回。',
    confirmText: '退出',
    confirmColor: '#D93025',
    success: ({ confirm }) => {
      if (confirm) {
        uni.showToast({ title: '已退出家庭', icon: 'none' });
      }
    },
  });
}

function handleTransfer(): void {
  uni.showModal({
    title: '转让管理员',
    content: '转让后你将变为普通成员，管理员可调整全家的共享权限。',
    confirmText: '转让给小雨',
    success: ({ confirm }) => {
      if (confirm) {
        uni.showToast({ title: '已转让管理员', icon: 'none' });
      }
    },
  });
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
/* 原型 17：成员段标题灰 600 / 变更通知·伪名段紫 700 */
.fam-sec {
  margin-bottom: 16rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: var(--color-purple);
}

.fam-sec--gray {
  margin-bottom: 16rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: var(--color-text-sub);
}

.fam-chips {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.fam-alias-tip {
  font-size: var(--fs-caption);
  line-height: 1.6;
  color: var(--color-text-sub);
}

.fam-btns {
  margin-top: 16rpx;
}

.fam-foot {
  margin-top: 12rpx;
  font-size: var(--fs-caption);
  line-height: 1.6;
  color: var(--color-text-sub);
}

.fam-link {
  display: inline-flex;
}

.fam-matrix {
  width: 100%;
  white-space: nowrap;
}

/* 原型 .matrix：无外框表格，仅行底线 #F2F4F8、表头灰 11px */
.fam-grid {
  display: inline-block;
  min-width: 100%;
  overflow: hidden;
}

.fam-grid__head {
  display: flex;
}

.fam-grid__row {
  display: flex;
  border-bottom: 2rpx solid var(--color-divider);
}

.fam-grid__head .fam-cell {
  border-bottom: 2rpx solid var(--color-divider);
}

.fam-cell {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80rpx;
  padding: 20rpx 12rpx;
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
  font-size: 22rpx;
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
