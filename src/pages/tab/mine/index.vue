<template>
  <x-page tab="/pages/tab/mine/index">
    <x-nav-bar title="我的" :back="false" />

    <!-- 身份信息卡 -->
    <x-card>
      <view class="mine-id">
        <view class="mine-id__avatar">
          <x-icon name="user" :size="56" color="#4F7CFF" />
        </view>
        <view class="x-flex-1">
          <view class="mine-id__name">
            {{ nickname }}
          </view>
          <view class="x-sub">
            {{ idSubText }}
          </view>
        </view>
        <view class="x-tap-opacity" hover-class="x-tap-opacity--hover" :hover-start-time="0" @tap="handleEdit">
          <x-tag type="blue">
            编辑
          </x-tag>
        </view>
      </view>
    </x-card>

    <!-- 会员 / AI 额度卡 -->
    <view class="mine-member">
      <view class="mine-member__row">
        <view>
          <view class="mine-member__title">
            <x-icon name="star" :size="32" color="#FFD666" />
            <text>小七管家会员</text>
          </view>
          <view class="mine-member__desc">
            {{ memberDesc }} · 云同步{{ settingStore.isMember ? '已开启' : '未开启' }}
          </view>
        </view>
        <text class="mine-member__btn x-tap-opacity" hover-class="x-tap-opacity--hover" :hover-start-time="0" @tap="goMember">
          {{ settingStore.isMember ? '管理中' : '升级' }}
        </text>
      </view>
    </view>

    <!-- 家庭 / 归档入口（原型 16：仅 3 项） -->
    <x-card>
      <x-cell
        icon="archive"
        title="归档与历史"
        :subtitle="`已用完 ${archiveStats.used} · 已扔 ${archiveStats.thrown} · 已完成疗程 ${archiveStats.course}`"
        chevron
        @click="goArchive"
      />
      <x-cell icon="users" title="家庭与隐私" subtitle="3 位成员 · 默认仅自己可见" chevron @click="goFamily" />
      <x-cell icon="eye-off" title="长辈模式" subtitle="大字号 · 大按钮 · 简化导航" last>
        <template #right>
          <x-switch :checked="settingStore.isElder" @change="handleElder" />
        </template>
      </x-cell>
    </x-card>

    <!-- 数据 / 合规 / 账号（原型 16 第二张卡） -->
    <x-card>
      <x-cell
        icon="cloud"
        title="数据与备份"
        :subtitle="`本地备份 ${backupText} · 云同步未开启`"
        chevron
        @click="goRestore"
      />
      <x-cell icon="chart" title="消耗统计" subtitle="月度浪费报表 · 会员功能">
        <template #right>
          <x-tag type="orange">
            PRO ›
          </x-tag>
        </template>
      </x-cell>
      <x-cell
        icon="file"
        title="个人信息收集清单"
        subtitle="查看收集项、用途与第三方共享"
        chevron
        @click="handleCollectList"
      />
      <x-cell
        icon="info"
        title="关于与协议"
        subtitle="v1.0.0 · 隐私政策 · 用户协议"
        chevron
        @click="handleAbout"
      />
      <x-cell icon="logout" tone="red" title="注销账号" subtitle="删除账号与全部关联数据" chevron last @click="handleLogout" />
    </x-card>

    <!-- 必要入口（原型未画，设置页承载外观/隐私/删除数据） -->
    <x-card>
      <x-cell icon="settings" title="设置" subtitle="外观 · 隐私与权限 · 删除数据" chevron last @click="goSetting" />
    </x-card>
  </x-page>
</template>

<script setup lang="ts">
import { usePermission } from '@/hooks';
import { useItemStore, useMedicineStore, useSettingStore, useUserStore } from '@/store';
import { isLogin } from '@/utils/auth';

// 游客模式标记（登录页「先逛逛」写入，与 store/modules/item 的判定一致）
const GUEST_KEY = 'guest_mode';

const settingStore = useSettingStore();
const itemStore = useItemStore();
const medicineStore = useMedicineStore();
const userStore = useUserStore();

const isGuest = computed<boolean>(() => uni.getStorageSync(GUEST_KEY) === true);
// 已登录判定改走 B 的 token 存储（@/utils/auth）
const loggedIn = computed<boolean>(() => isLogin());

const nickname = computed<string>(() => {
  if (loggedIn.value && userStore.user_name) {
    return userStore.user_name;
  }
  if (isGuest.value) {
    return '游客';
  }
  return settingStore.nickname;
});

// 判断依据：已登录看 token，游客进入看 guest_mode，其余为未登录
const idSubText = computed<string>(() => {
  if (!loggedIn.value && isGuest.value) {
    return '游客进入 · 数据仅存本机，登录后可合并';
  }
  if (!loggedIn.value && !isGuest.value) {
    return '未登录 · 登录后可跨设备同步';
  }
  // B 的 UserState 未存手机号，页面内直接用原型的脱敏号
  return '138****1234 · 家庭创建者';
});

const memberDesc = computed(() =>
  settingStore.isMember
    ? '会员已生效 · AI 识别无限次'
    : `本月 AI 剩余 ${settingStore.quotaLeft} 次（共 ${settingStore.quotaTotal} 次）`,
);

const archiveStats = computed(() => ({
  used: itemStore.stats.used,
  thrown: itemStore.stats.thrown,
  course: medicineStore.courses.length,
}));

const backupText = computed(() => uni.getStorageSync('backup_at') || '2026.10.28');

function go(url: string) {
  uni.navigateTo({ url });
}
function goMember() {
  go('/pages/user/member/index');
}
function goFamily() {
  go('/pages/user/family/index');
}
function goSetting() {
  go('/pages/user/setting/index');
}
function goRestore() {
  go('/pages/user/restore/index');
}
function goArchive() {
  go('/pages/item/archive/index');
}

function handleEdit() {
  if (!loggedIn.value) {
    uni.showToast({ title: '登录后编辑资料', icon: 'none' });
    return;
  }
  uni.showToast({ title: '编辑资料', icon: 'none' });
}

function handleAbout() {
  uni.showToast({ title: '小七管家 v1.0.0', icon: 'none' });
}

/** 个人信息收集清单：合规入口（当前无独立页，先提示） */
function handleCollectList() {
  uni.showModal({
    title: '个人信息收集清单',
    content: '账号信息（手机号）、物品与用药记录、识别图片。仅用于核心功能，不向第三方共享，敏感数据单独授权。',
    showCancel: false,
    confirmText: '我知道了',
  });
}

/** 注销账号：二次确认（原型 20b 同口径的强确认） */
function handleLogout() {
  uni.showModal({
    title: '注销账号？',
    content: '将删除账号与全部关联数据，且不可恢复。本机数据会立即清除。',
    confirmText: '继续',
    confirmColor: '#D93025',
    success: (res) => {
      if (!res.confirm) {
        return;
      }
      uni.showModal({
        title: '确认注销',
        content: '此操作不可撤销。建议先导出备份。',
        confirmText: '确认注销',
        confirmColor: '#D93025',
        success: (second) => {
          if (second.confirm) {
            uni.showToast({ title: '已提交注销申请', icon: 'none' });
          }
        },
      });
    },
  });
}

function handleElder(value: boolean) {
  settingStore.setElder(value);
  // 开启后进入长辈模式首页（原型 24）
  if (value) {
    uni.navigateTo({ url: '/pages/user/elder/index' });
  }
}

onShow(async () => {
  // tab 页需在 onShow 兜底权限拦截：未登录时 hasPerm 会跳登录页并带 ?redirect=
  await usePermission();
});
</script>

<style lang="scss" scoped>
.mine-id {
  display: flex;
  gap: 28rpx;
  align-items: center;
}

.mine-id__avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 112rpx;
  height: 112rpx;
  background: var(--color-primary-soft);
  border-radius: 50%;
}

.mine-id__name {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--color-text);
}

.mine-member {
  padding: 32rpx;
  margin-bottom: 24rpx;
  color: #ffffff;
  background: linear-gradient(135deg, #2b2f42, #4a3f6b);
  border-radius: var(--radius-card);
}

.mine-member__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mine-member__title {
  display: flex;
  gap: 12rpx;
  align-items: center;
  font-size: 30rpx;
  font-weight: 700;
}

.mine-member__desc {
  margin-top: 8rpx;
  font-size: 24rpx;
  opacity: 0.75;
}

.mine-member__btn {
  flex-shrink: 0;
  padding: 12rpx 24rpx;
  font-size: 22rpx;
  font-weight: 600;
  background: var(--color-warning-strong);
  border-radius: 28rpx;
}
</style>
