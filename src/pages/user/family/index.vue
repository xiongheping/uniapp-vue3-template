<template>
  <x-page>
    <x-nav-bar title="家庭与隐私">
      <template #right>
        <view class="fam-nav-act x-tap-opacity" hover-class="x-tap-opacity--hover" :hover-start-time="0" @tap="handleInvite">
          <x-icon name="user-plus" :size="34" color="currentColor" />
          <text class="fam-nav-act__text">
            邀请
          </text>
        </view>
      </template>
    </x-nav-bar>

    <x-note type="purple" icon="shield">
      加入家庭<text class="fam-note-b">
        不会自动共享任何数据
      </text>，每一项都需要你单独授权。
    </x-note>

    <!-- 家庭 Hero 卡 -->
    <view class="fam-hero">
      <view class="fam-hero__icon">
        <x-icon name="house" :size="52" color="#ffffff" />
      </view>
      <view class="fam-hero__body">
        <view class="fam-hero__name">
          {{ familyName || '我的家庭' }}
        </view>
        <view class="fam-hero__sub">
          {{ members.length }} 位成员{{ createdAt ? ` · 创建于 ${createdAt}` : '' }}
        </view>
      </view>
      <x-tag :type="isAdmin ? 'purple' : 'gray'">
        {{ isAdmin ? '管理员' : '普通成员' }}
      </x-tag>
    </view>

    <!-- 成员列表（17-L 左滑移除） -->
    <view class="fam-head">
      <text class="fam-head__title">
        成员 · {{ members.length }}
      </text>
      <text v-if="canSwipeAny" class="fam-head__hint">
        左滑可移除 ›
      </text>
    </view>
    <x-card flat>
      <view
        v-for="m in members"
        :key="m.userId"
        class="fam-row"
        :class="{ 'fam-row--open': swipeOpenId === String(m.userId) }"
      >
        <view v-if="canSwipe" class="fam-row__actions">
          <view
            v-if="isRemovable(m)"
            class="fam-row__act fam-row__act--danger x-tap-opacity"
            hover-class="x-tap-opacity--hover"
            :hover-start-time="0"
            @tap.stop="openRemoveSheet(m)"
          >
            <x-icon name="user-x" :size="34" color="#ffffff" />
            <text class="fam-row__act-text">
              移除
            </text>
          </view>
          <view v-else class="fam-row__act fam-row__act--locked">
            <x-icon name="crown" :size="34" color="#ffffff" />
            <text class="fam-row__act-text">
              管理员
            </text>
          </view>
        </view>

        <view
          class="fam-row__content"
          @touchstart="onRowTouchStart($event)"
          @touchend="onRowTouchEnd(m, $event)"
          @tap="onRowTap(m)"
        >
          <view class="fam-avatar" :class="`fam-avatar--${m.tone}`">
            <image v-if="isImageAvatar(m.avatar)" :src="m.avatar" class="fam-avatar__img" mode="aspectFill" />
            <text v-else class="fam-avatar__text">
              {{ m.initial }}
            </text>
          </view>
          <view class="fam-row__body">
            <view class="fam-row__name">
              {{ m.name }}
            </view>
            <view class="fam-row__desc">
              {{ m.desc }}
            </view>
          </view>
          <x-tag v-if="m.role !== 'member'" type="purple">
            {{ m.level === '创建者' ? '管理员' : m.level }}
          </x-tag>
          <view v-else class="fam-link x-tap-opacity" hover-class="x-tap-opacity--hover" :hover-start-time="0" @tap.stop="openPermissionPage(m)">
            <x-tag type="gray">
              权限 ›
            </x-tag>
          </view>
        </view>
      </view>
      <view v-if="!members.length" class="fam-empty">
        还没有家庭成员。点右上角「＋邀请」，输入已注册手机号即可加入。
      </view>
    </x-card>

    <template v-if="isAdmin">
      <x-note type="blue" icon="info">
        <text class="fam-note-b">
          左滑规则
        </text>：普通成员左滑露出「移除」；管理员自己左滑露出「管理员」且置灰；同一时间只允许一行展开，点空白处收起。
      </x-note>
      <x-note icon="triangle-alert">
        <text class="fam-note-b">
          唯一管理员不可被移除
        </text>，必须先把管理员转让给其他成员，才能退出或移除自己。
      </x-note>
    </template>

    <!-- 变更通知（原型 17） -->
    <x-card>
      <view class="fam-sec">
        🔔 变更通知
      </view>
      <x-field v-for="(n, i) in notifyFields" :key="n.key" :label="n.label" :icon="n.icon" :last="i === notifyFields.length - 1">
        <x-switch v-model:checked="n.on" />
      </x-field>
    </x-card>

    <!-- 伪名保护（原型 17b 清单入口） -->
    <x-card>
      <view class="fam-sec fam-sec--ico">
        <x-icon name="eye-off" :size="28" color="#7B3FF2" />
        <text>伪名保护</text>
      </view>
      <x-field label="敏感物品化名显示" icon="eye-off" icon-color="#7B3FF2" last>
        <x-switch v-model:checked="aliasOn" @change="onAliasToggle" />
      </x-field>
      <view class="fam-alias-tip">
        已设置 {{ aliases.length }} 个伪名。家人看到的都是化名，真实名称仅自己可见；点开需 Face ID 验证。
      </view>
      <view v-if="aliasOn" class="x-btns row fam-btns">
        <x-button class="fam-btns__act" type="ghost" small text="伪名清单 ›" @click="gotoAliasPage" />
      </view>
    </x-card>

    <!-- 退出 / 转让 -->
    <x-card>
      <x-cell icon="logout" tone="red" title="退出家庭" subtitle="退出后不再接收家庭共享内容" chevron @click="handleLeave" />
      <x-cell icon="crown" title="转让管理员" subtitle="转让后你将变为普通成员" chevron last @click="openTransferSheet" />
    </x-card>

    <!-- 17-M 移除成员二次确认 -->
    <x-sheet v-model:show="removeSheetVisible" title="移除成员？" sub="移除后该成员将立即失去所有共享访问">
      <view v-if="removeTarget" class="fam-remind">
        <view class="fam-avatar fam-avatar--sm" :class="`fam-avatar--${removeTarget.tone}`">
          <image v-if="isImageAvatar(removeTarget.avatar)" :src="removeTarget.avatar" class="fam-avatar__img" mode="aspectFill" />
          <text v-else class="fam-avatar__text">
            {{ removeTarget.initial }}
          </text>
        </view>
        <view class="fam-remind__body">
          <view class="fam-remind__name">
            {{ removeTarget.name }}
          </view>
          <view class="fam-remind__desc">
            {{ removeDesc }}
          </view>
        </view>
      </view>

      <view class="fam-conseq">
        <view class="fam-conseq__item">
          <x-icon name="user-x" :size="28" color="#D93025" class="fam-conseq__ico" />
          <view>
            <text class="fam-conseq__b">
              立即失去共享访问
            </text>：TA 将看不到你共享的物品和计划，也不能再帮你代打卡。
          </view>
        </view>
        <view class="fam-conseq__item">
          <x-icon name="info" :size="28" color="#C77700" class="fam-conseq__ico" />
          <view>
            <text class="fam-conseq__b">
              历史操作记录保留 30 天
            </text>：TA 之前代打卡、编辑物品的记录仍保留，方便追溯。
          </view>
        </view>
        <view class="fam-conseq__item">
          <x-icon name="undo" :size="28" color="#2E7D32" class="fam-conseq__ico" />
          <view>
            <text class="fam-conseq__b">
              30 天内可重新加入
            </text>：原邀请码仍有效，TA 可以重新扫码加入，但权限需要重新授权。
          </view>
        </view>
      </view>

      <x-note type="blue">
        你自己的物品、计划、用药记录不受影响；被移除人自己的数据也不受影响。
      </x-note>

      <x-button class="fam-sheet__danger" type="danger" :text="`确认移除 ${removeTarget?.name || ''}`" @click="confirmRemove" />
      <x-button type="gray" text="取消" @click="removeSheetVisible = false" />
    </x-sheet>

    <!-- 17-N 转让管理员 -->
    <x-sheet v-model:show="transferSheetVisible" title="转让管理员" sub="选择一位成员接管家庭管理">
      <view class="fam-role-pick">
        <view
          v-for="m in transferCandidates"
          :key="m.userId"
          class="fam-role-item"
          :class="{ 'fam-role-item--on': transferTargetId === String(m.userId) }"
          @tap="transferTargetId = String(m.userId)"
        >
          <x-radio :checked="transferTargetId === String(m.userId)" tone="purple" />
          <view class="fam-avatar fam-avatar--sm" :class="`fam-avatar--${m.tone}`">
            <image v-if="isImageAvatar(m.avatar)" :src="m.avatar" class="fam-avatar__img" mode="aspectFill" />
            <text v-else class="fam-avatar__text">
              {{ m.initial }}
            </text>
          </view>
          <view class="fam-role-item__body">
            <view class="fam-role-item__name">
              {{ m.name }}
            </view>
            <view class="fam-role-item__desc">
              {{ m.desc }}
            </view>
          </view>
        </view>
      </view>

      <view class="fam-conseq fam-conseq--purple">
        <view class="fam-conseq__item">
          <x-icon name="crown" :size="28" color="#7B3FF2" class="fam-conseq__ico" />
          <view>
            转让后<text class="fam-conseq__b">
              你变成普通成员
            </text>，{{ transferTarget?.name || '对方' }}成为新管理员，拥有邀请、移除、修改权限的能力。
          </view>
        </view>
        <view class="fam-conseq__item">
          <x-icon name="bell" :size="28" color="#7B3FF2" class="fam-conseq__ico" />
          <view>
            {{ transferTarget?.name || '对方' }}会收到<text class="fam-conseq__b">
              「你已成为家庭管理员」
            </text>通知，其他成员也会收到变更通知。
          </view>
        </view>
        <view class="fam-conseq__item">
          <x-icon name="triangle-alert" :size="28" color="#D93025" class="fam-conseq__ico" />
          <view>
            <text class="fam-conseq__b">
              转让不可撤销
            </text>：只有新管理员能再转回给你。
          </view>
        </view>
      </view>

      <x-note type="red">
        ⚠️ 转让后，你的权限会被重置为普通成员，需要新管理员重新授权。你自己的物品和计划不受影响。
      </x-note>

      <x-button
        class="fam-sheet__transfer"
        icon="crown"
        :text="`确认转让给 ${transferTarget?.name || ''}`"
        :disabled="!transferTarget"
        @click="confirmTransfer"
      />
      <x-button type="gray" text="取消" @click="transferSheetVisible = false" />
    </x-sheet>

    <!-- 左滑展开时点空白收起 -->
    <view v-if="swipeOpenId" class="fam-swipe-mask" @tap="closeSwipe" />
  </x-page>
</template>

<script setup lang="ts">
import type { FamilyMemberVo, FamilyPermissionVo, FamilyVo } from '@/api/xiaoqi/family';
import type { ItemCategoryVo } from '@/api/xiaoqi/item';
import type { MemberUserAliasVo } from '@/api/xiaoqi/member';
import { FamilyApi } from '@/api/xiaoqi/family';
import { ItemApi } from '@/api/xiaoqi/item';
import { usePermission } from '@/hooks';
import { useUserStore } from '@/store';

interface Member {
  userId: number | string;
  name: string;
  initial: string;
  tone: string;
  avatar: string;
  desc: string;
  role: 'owner' | 'admin' | 'member';
  level: string;
  isSelf: boolean;
}

interface NotifyField {
  key: string;
  label: string;
  icon: string;
  on: boolean;
}

const ROLE_OWNER = 0;
const ROLE_ADMIN = 1;
/** 成员头像渐变（原型 .avatar 系列） */
const AVATAR_TONES = ['violet', 'rose', 'amber', 'green', 'blue'];

const userStore = useUserStore();

const familyInfo = ref<FamilyVo | null>(null);
const familyName = ref<string>('');
const memberRows = ref<FamilyMemberVo[]>([]);
const categories = ref<ItemCategoryVo[]>([]);
const aliases = ref<MemberUserAliasVo[]>([]);
/** 成员权限缓存；null = 拉取失败（按无权限展示） */
const permByUser = ref<Record<string, FamilyPermissionVo[] | null>>({});

/** 角色文案：0 创建者 / 1 管理员 / 2 普通成员 */
function levelOf(role?: number): string {
  if (role === ROLE_OWNER) {
    return '创建者';
  }
  return role === ROLE_ADMIN ? '管理员' : '普通成员';
}

function maskPhone(phone?: string): string {
  if (!phone) {
    return '';
  }
  return phone.length >= 11 ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : phone;
}

function isImageAvatar(avatar?: string): boolean {
  if (!avatar) {
    return false;
  }
  return /^(https?:)?\/\//.test(avatar) || avatar.startsWith('/') || avatar.startsWith('data:');
}

function formatDate(value?: string): string {
  return value ? value.slice(0, 10).replace(/-/g, '.') : '';
}

function openCount(perms: FamilyPermissionVo[]): number {
  return perms.filter(perm => perm.canView === 1).length;
}

function openCategoryNames(perms: FamilyPermissionVo[]): string[] {
  return perms
    .filter(perm => perm.canView === 1)
    .map(perm => categories.value.find(cat => String(cat.id) === String(perm.categoryId))?.categoryName)
    .filter((name): name is string => !!name);
}

/** 成员副标题：优先展示已开放的共享能力 */
function describeMember(row: FamilyMemberVo, isSelf: boolean): string {
  if (row.role === ROLE_OWNER) {
    return isSelf ? '家庭创建者 · 全部权限' : '家庭创建者';
  }
  if (row.role === ROLE_ADMIN) {
    return '管理员 · 全部权限';
  }
  const perms = permByUser.value[String(row.userId)];
  if (perms && perms.length) {
    const viewCount = openCount(perms);
    if (!viewCount) {
      return '未开放任何共享分类';
    }
    const editCount = perms.filter(perm => perm.canView === 1 && perm.canEdit === 1).length;
    const remindCount = perms.filter(perm => perm.canView === 1 && perm.canRemind === 1).length;
    if (editCount) {
      return `可编辑共享物品 · 已开放 ${viewCount} 个分类`;
    }
    if (remindCount) {
      return `可代打卡 · 已开放 ${viewCount} 个分类`;
    }
    const names = openCategoryNames(perms).slice(0, 4).join('、');
    return `仅查看 · 已开放：${names || `${viewCount} 个分类`}`;
  }
  const phone = maskPhone(row.phone);
  return phone ? `手机号 ${phone}` : row.isGuest === 1 ? '游客账号' : '普通成员';
}

const members = computed<Member[]>(() => memberRows.value.map((row, index) => {
  const isSelf = String(row.userId) === String(userStore.memberId);
  const nick = row.nickname || (isSelf ? '我' : `成员${row.userId}`);
  return {
    userId: row.userId,
    name: isSelf ? (row.nickname ? `${row.nickname}（我）` : '我') : nick,
    initial: [...nick][0] || '家',
    tone: isSelf ? 'me' : AVATAR_TONES[index % AVATAR_TONES.length],
    avatar: row.avatar || '',
    desc: describeMember(row, isSelf),
    role: row.role === ROLE_OWNER ? 'owner' : row.role === ROLE_ADMIN ? 'admin' : 'member',
    level: levelOf(row.role),
    isSelf,
  };
}));

const createdAt = computed<string>(() => formatDate(familyInfo.value?.createTime));

const aliasOn = ref<boolean>(true);

const notifyFields = reactive<NotifyField[]>([
  { key: 'share', label: '共享变更通知', icon: 'share', on: true },
  { key: 'perm', label: '权限变更通知', icon: 'key', on: true },
  { key: 'sensitive', label: '敏感物品访问通知', icon: 'shield-user', on: true },
]);

const isAdmin = computed<boolean>(() => {
  const self = memberRows.value.find(row => String(row.userId) === String(userStore.memberId));
  return !!self && (self.role === ROLE_OWNER || self.role === ROLE_ADMIN);
});

const adminCount = computed<number>(() => memberRows.value.filter(row => row.role === ROLE_OWNER || row.role === ROLE_ADMIN).length);

/** 转让管理员仅家庭创建者可操作 */
const isOwner = computed<boolean>(() => {
  const self = memberRows.value.find(row => String(row.userId) === String(userStore.memberId));
  return !!self && self.role === ROLE_OWNER;
});

function isRemovable(member: Member): boolean {
  return isAdmin.value && member.role === 'member' && !member.isSelf;
}

/** 左滑仅管理员可用；管理员自己与其他管理员露出置灰的「管理员」 */
const canSwipe = computed<boolean>(() => isAdmin.value && members.value.length > 0);
const canSwipeAny = computed<boolean>(() => isAdmin.value && members.value.some(member => isRemovable(member)));

/* 左滑：同一时间只展开一行，点空白收起 */
const swipeOpenId = ref<string>('');
let touchStartX = 0;
let touchStartY = 0;
let swipeGuardAt = 0;

function closeSwipe(): void {
  swipeOpenId.value = '';
}

function onRowTouchStart(event: any): void {
  if (!canSwipe.value) {
    return;
  }
  const point = event.touches?.[0];
  if (!point) {
    return;
  }
  touchStartX = point.clientX;
  touchStartY = point.clientY;
}

function onRowTouchEnd(member: Member, event: any): void {
  if (!canSwipe.value) {
    return;
  }
  const point = event.changedTouches?.[0];
  if (!point) {
    return;
  }
  const dx = point.clientX - touchStartX;
  const dy = point.clientY - touchStartY;
  if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) {
    return;
  }
  swipeGuardAt = Date.now();
  if (dx < 0) {
    swipeOpenId.value = String(member.userId);
  }
  else {
    closeSwipe();
  }
}

function onRowTap(member: Member): void {
  // 左滑结束后浏览器可能补发 tap，避免误触
  if (Date.now() - swipeGuardAt < 300) {
    return;
  }
  if (swipeOpenId.value) {
    closeSwipe();
    return;
  }
  if (member.role === 'member') {
    openPermissionPage(member);
  }
}

/** 打开成员权限矩阵页（原型 17a） */
function openPermissionPage(member: Member): void {
  if (!member.userId) {
    uni.showToast({ title: '成员缺少账号信息', icon: 'none' });
    return;
  }
  closeSwipe();
  uni.navigateTo({
    url: `/pages/user/family/permission/index?userId=${member.userId}`,
    fail: () => {
      uni.showToast({ title: '打开权限页失败，请刷新后重试', icon: 'none' });
    },
  });
}

/** 伪名保护为设备级偏好，与伪名清单页共用存储 */
function onAliasToggle(value: boolean): void {
  uni.setStorageSync('xq_alias_protect', value);
  uni.showToast({ title: value ? '伪名保护已开启' : '伪名保护已关闭', icon: 'none' });
}

function gotoAliasPage(): void {
  uni.navigateTo({ url: '/pages/user/alias/index' });
}

function handleLeave(): void {
  if (isAdmin.value && adminCount.value <= 1) {
    uni.showToast({ title: '你是唯一管理员，请先转让管理员', icon: 'none' });
    return;
  }
  uni.showToast({ title: '退出家庭由后台管理端处理，暂未开放', icon: 'none' });
}

/* 17-M 移除成员 */
const removeSheetVisible = ref<boolean>(false);
const removeTarget = ref<Member | null>(null);

const removeDesc = computed<string>(() => {
  const member = removeTarget.value;
  if (!member) {
    return '';
  }
  const perms = permByUser.value[String(member.userId)];
  const names = perms ? openCategoryNames(perms) : [];
  if (!names.length) {
    return '尚未开放任何共享分类';
  }
  return `已开放：${names.slice(0, 5).join('、')}`;
});

function openRemoveSheet(member: Member): void {
  if (!isAdmin.value) {
    uni.showToast({ title: '仅创建者或管理员可移除成员', icon: 'none' });
    return;
  }
  if (member.isSelf) {
    uni.showToast({ title: '不能移除自己', icon: 'none' });
    return;
  }
  if (member.role !== 'member') {
    uni.showToast({ title: '管理员需先转让后才能移除', icon: 'none' });
    return;
  }
  closeSwipe();
  removeTarget.value = member;
  removeSheetVisible.value = true;
}

async function confirmRemove(): Promise<void> {
  const member = removeTarget.value;
  if (!member) {
    return;
  }
  try {
    await FamilyApi.removeMember(member.userId);
    removeSheetVisible.value = false;
    removeTarget.value = null;
    await loadFamily();
    uni.showToast({ title: '已移除', icon: 'none' });
  }
  catch (error: any) {
    uni.showToast({ title: error?.msg || '移除失败', icon: 'none' });
  }
}

/* 17-N 转让管理员 */
const transferSheetVisible = ref<boolean>(false);
const transferTargetId = ref<string>('');

const transferCandidates = computed<Member[]>(() => members.value.filter(member => !member.isSelf));
const transferTarget = computed<Member | null>(() => transferCandidates.value.find(member => String(member.userId) === transferTargetId.value) || null);

function openTransferSheet(): void {
  if (!isOwner.value) {
    uni.showToast({ title: '仅家庭创建者可转让管理员', icon: 'none' });
    return;
  }
  if (!transferCandidates.value.length) {
    uni.showToast({ title: '暂无其他成员可转让', icon: 'none' });
    return;
  }
  transferTargetId.value = String(transferCandidates.value[0].userId);
  transferSheetVisible.value = true;
}

async function confirmTransfer(): Promise<void> {
  const target = transferTarget.value;
  if (!target) {
    return;
  }
  uni.showLoading({ title: '转让中', mask: true });
  try {
    await FamilyApi.transferOwner(target.userId);
    transferSheetVisible.value = false;
    transferTargetId.value = '';
    await loadFamily();
    uni.showToast({ title: '已转让管理员', icon: 'none' });
  }
  catch (error: any) {
    uni.showToast({ title: error?.msg || '转让失败', icon: 'none' });
  }
  finally {
    uni.hideLoading();
  }
}

/** 邀请：后端按手机号匹配已注册会员 */
function handleInvite(): void {
  if (!isAdmin.value) {
    uni.showToast({ title: '仅创建者或管理员可邀请', icon: 'none' });
    return;
  }
  uni.showModal({
    title: '邀请家庭成员',
    editable: true,
    placeholderText: '输入对方手机号',
    success: async ({ confirm, content }) => {
      if (!confirm || !content) {
        return;
      }
      try {
        await FamilyApi.invite(content);
        await loadFamily();
        uni.showToast({ title: '已加入家庭', icon: 'none' });
      }
      catch (error: any) {
        uni.showToast({ title: error?.msg || '邀请失败', icon: 'none' });
      }
    },
  });
}

/** 管理员预载每位成员的权限，用于成员行权限摘要与移除弹层回显 */
async function loadMemberPermissions(): Promise<void> {
  if (!isAdmin.value) {
    permByUser.value = {};
    return;
  }
  const targets = memberRows.value.filter(row => row.role !== ROLE_OWNER);
  const entries = await Promise.all(targets.map(async (row) => {
    try {
      const perms = await FamilyApi.permissions(row.userId);
      return [String(row.userId), perms] as [string, FamilyPermissionVo[]];
    }
    catch {
      return [String(row.userId), null] as [string, FamilyPermissionVo[] | null];
    }
  }));
  const map: Record<string, FamilyPermissionVo[] | null> = {};
  entries.forEach(([key, perms]) => {
    map[key] = perms;
  });
  permByUser.value = map;
}

/** 拉家庭信息 + 成员 + 化名 + 分类 */
async function loadFamily(): Promise<void> {
  closeSwipe();
  try {
    const [info, memberPage, aliasList, categoryPage] = await Promise.all([
      FamilyApi.info(),
      FamilyApi.memberList(),
      FamilyApi.aliases(),
      ItemApi.category.list({ pageNum: 1, pageSize: 50 }),
    ]);
    familyInfo.value = info;
    familyName.value = info?.familyName || '';
    memberRows.value = memberPage.rows || [];
    aliases.value = aliasList || [];
    categories.value = categoryPage.rows || [];
    aliasOn.value = uni.getStorageSync('xq_alias_protect') !== false;
    await loadMemberPermissions();
  }
  catch (error: any) {
    uni.showToast({ title: error?.msg || '家庭信息加载失败', icon: 'none' });
  }
}

onShow(async () => {
  // tab 页需在 onShow 兜底权限拦截：未登录时由 hooks/use-permission 处理跳转
  const ok = await usePermission();
  if (!ok) {
    return;
  }
  // H5 刷新后 Pinia 会重置，管理员判定依赖 memberId，先补拉一次资料
  if (!userStore.memberId) {
    await userStore.fetchInfo().catch(() => {});
  }
  await loadFamily();
});
</script>

<style lang="scss" scoped>
.fam-note-b {
  font-weight: 700;
}

.fam-nav-act {
  display: flex;
  gap: 6rpx;
  align-items: center;
  justify-content: flex-end;
  min-height: 72rpx;
  padding-left: 16rpx;
  color: var(--color-primary);
}

.fam-nav-act__text {
  font-size: var(--fs-sub);
  font-weight: 600;
}

/* 原型 17：成员段标题灰 600 / 变更通知·伪名段紫 700 */
.fam-sec {
  margin-bottom: 16rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: var(--color-purple);
}

.fam-sec--ico {
  display: flex;
  gap: 8rpx;
  align-items: center;
}

/* 家庭 Hero 卡 */
.fam-hero {
  box-sizing: border-box;
  display: flex;
  gap: 24rpx;
  align-items: center;
  padding: 28rpx;
  margin-bottom: 24rpx;
  background: linear-gradient(135deg, var(--color-note-purple-bg), var(--color-note-blue-bg));
  border: 2rpx solid rgb(123 63 242 / 22%);
  border-radius: var(--radius-card);
}

.fam-hero__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 96rpx;
  height: 96rpx;
  background: linear-gradient(135deg, #7b3ff2, #4f7cff);
  border-radius: 28rpx;
}

.fam-hero__body {
  flex: 1;
  min-width: 0;
}

.fam-hero__name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 32rpx;
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
}

.fam-hero__sub {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: var(--color-text-sub);
}

/* 成员标题 + 左滑提示 */
.fam-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8rpx 4rpx 16rpx;
}

.fam-head__title {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--color-text);
}

.fam-head__hint {
  font-size: 24rpx;
  color: var(--color-text-weak);
}

/* 左滑行 */
.fam-row {
  position: relative;
  overflow: hidden;
}

.fam-row + .fam-row {
  border-top: 2rpx solid var(--color-divider);
}

.fam-row--open {
  z-index: 6;
}

.fam-row__actions {
  position: absolute;
  inset: 0 0 0 auto;
  z-index: 1;
  display: flex;
  /* 收起时彻底隐藏，避免右侧露出红色/灰色 1px 缝隙 */
  opacity: 0;
}

.fam-row--open .fam-row__actions {
  opacity: 1;
}

.fam-row__act {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  align-items: center;
  justify-content: center;
  width: 144rpx;
  color: #ffffff;
}

.fam-row__act--danger {
  background: #d93025;
}

.fam-row__act--locked {
  background: #c0c6d2;
}

.fam-row__act-text {
  font-size: 24rpx;
  font-weight: 600;
}

.fam-row__content {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 20rpx;
  align-items: center;
  min-height: 104rpx;
  padding: 22rpx 28rpx;
  background: var(--color-card);
  transition: transform 0.2s ease;
}

.fam-row--open .fam-row__content {
  transform: translateX(-144rpx);
}

.fam-row__body {
  flex: 1;
  min-width: 0;
}

.fam-row__name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
}

.fam-row__desc {
  margin-top: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 24rpx;
  color: var(--color-text-sub);
  white-space: nowrap;
}

.fam-empty {
  padding: 32rpx 28rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--color-text-sub);
}

/* 头像 */
.fam-avatar {
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

.fam-avatar--sm {
  width: 80rpx;
  height: 80rpx;
  font-size: 32rpx;
}

.fam-avatar--me {
  background: linear-gradient(135deg, #4f7cff, #7b5cff);
}

.fam-avatar--violet {
  background: linear-gradient(135deg, #7b3ff2, #9b6bff);
}

.fam-avatar--rose {
  background: linear-gradient(135deg, #fa8c8c, #f56c6c);
}

.fam-avatar--amber {
  background: linear-gradient(135deg, #f5a623, #f7b955);
}

.fam-avatar--green {
  background: linear-gradient(135deg, #52c41a, #7dd64d);
}

.fam-avatar--blue {
  background: linear-gradient(135deg, #1677ff, #4f9cff);
}

.fam-avatar__img {
  width: 100%;
  height: 100%;
}

.fam-avatar__text {
  line-height: 1;
}

.fam-link {
  display: inline-flex;
  flex-shrink: 0;
}

.fam-swipe-mask {
  position: fixed;
  inset: 0;
  z-index: 5;
}

.fam-alias-tip {
  font-size: var(--fs-caption);
  line-height: 1.6;
  color: var(--color-text-sub);
}

.fam-btns {
  margin-top: 16rpx;
}

/* 双按钮等宽平铺：小程序端 class 落在组件宿主节点，全局 `.x-btns.row > .x-button` 选不中 */
.fam-btns__act {
  flex: 1;
  min-width: 0;
}

/* 17-M / 17-N 弹层 */
.fam-remind {
  display: flex;
  gap: 20rpx;
  align-items: center;
  padding: 20rpx 24rpx;
  margin-bottom: 20rpx;
  background: var(--color-primary-mist);
  border-radius: 24rpx;
}

.fam-remind__body {
  flex: 1;
  min-width: 0;
}

.fam-remind__name {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text);
}

.fam-remind__desc {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: var(--color-text-sub);
}

.fam-conseq {
  padding: 20rpx 24rpx;
  margin-bottom: 20rpx;
  background: var(--color-note-bg);
  border-radius: 24rpx;
}

.fam-conseq--purple {
  background: var(--color-note-purple-bg);
  border: 2rpx solid rgb(123 63 242 / 20%);
}

.fam-conseq__item {
  display: flex;
  gap: 14rpx;
  align-items: flex-start;
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--color-note-text);
}

.fam-conseq__item + .fam-conseq__item {
  margin-top: 16rpx;
}

.fam-conseq--purple .fam-conseq__item {
  color: var(--color-note-purple-text);
}

.fam-conseq__ico {
  margin-top: 4rpx;
}

.fam-conseq__b {
  font-weight: 700;
}

.fam-role-pick {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.fam-role-item {
  display: flex;
  gap: 16rpx;
  align-items: center;
  padding: 20rpx;
  border: 3rpx solid var(--color-border);
  border-radius: 24rpx;
}

.fam-role-item--on {
  background: var(--color-note-purple-bg);
  border-color: var(--color-purple);
}

.fam-role-item__body {
  flex: 1;
  min-width: 0;
}

.fam-role-item__name {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text);
}

.fam-role-item__desc {
  margin-top: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 24rpx;
  color: var(--color-text-sub);
  white-space: nowrap;
}

/* 原型 17-M 主按钮为实心红、17-N 为实心紫；覆盖 x-button 组件的语义色 */
.fam-sheet__danger {
  color: #ffffff !important;
  background: var(--color-danger) !important;
  border-color: var(--color-danger) !important;
}

.fam-sheet__transfer {
  color: #ffffff !important;
  background: var(--color-purple) !important;
  border-color: var(--color-purple) !important;
}
</style>
