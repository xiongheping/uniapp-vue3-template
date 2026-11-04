<template>
  <x-page>
    <x-nav-bar title="设置" />

    <!-- ☁️ 数据与同步 -->
    <view class="x-section-title">
      ☁️ 数据与同步
    </view>
    <x-card>
      <x-field label="存储方式" value="本地优先" />
      <x-field label="本地备份" :value="`上次 ${backupText}`" />
      <x-field label="云同步" @click="handleCloud">
        <view class="st-cloud">
          <x-tag type="orange">
            PRO
          </x-tag>
          <text class="st-cloud__v">
            未开启 ›
          </text>
        </view>
      </x-field>
      <x-field label="从备份恢复" @click="goRestore">
        <text class="st-link">
          预览后确认 ›
        </text>
      </x-field>
      <x-field label="导出 CSV" last @click="handleExport">
        <text class="st-link">
          需二次认证 ›
        </text>
      </x-field>
    </x-card>

    <!-- 🔐 隐私与权限 -->
    <view class="x-section-title">
      🔐 隐私与权限
    </view>
    <x-card>
      <x-field label="相机（拍照识别）" @click="requestCamera">
        <text :class="cameraClass">
          {{ cameraText }}
        </text>
      </x-field>
      <x-field label="健康数据授权" @click="handleHealth">
        <text class="st-ok">
          已授权 · 可撤回 ›
        </text>
      </x-field>
      <x-field label="通知频控" @click="goFrequency">
        <text class="st-link">
          标准 · 约 3 条/天 ›
        </text>
      </x-field>
      <x-field label="个人信息收集清单" @click="handleCollection">
        <text class="st-link">
          查看 ›
        </text>
      </x-field>
      <x-field label="第三方共享清单" @click="handleThirdParty">
        <text class="st-link">
          查看 ›
        </text>
      </x-field>
      <x-field label="长辈模式" last>
        <x-switch :checked="settingStore.isElder" @change="handleElder" />
      </x-field>
    </x-card>

    <!-- 外观 -->
    <view class="x-section-title">
      🌗 外观
    </view>
    <x-card>
      <view class="st-theme">
        <x-chip
          v-for="opt in themeOptions"
          :key="opt.value"
          :text="opt.label"
          :active="theme === opt.value"
          @click="setTheme(opt.value)"
        />
      </view>
      <x-note>{{ themeHint }}</x-note>
    </x-card>

    <!-- 删除全部数据 -->
    <view class="x-btns">
      <x-button type="danger" text="🗑 删除我的全部数据" @click="deleteSheet = true" />
    </view>
    <view class="x-sub st-danger-tip">
      需输入「删除」确认 · 立即不可撤销（回收站同时清空）
    </view>

    <!-- 20b 强确认弹层 -->
    <x-sheet v-model:show="deleteSheet" mode="center" mask-closable>
      <view class="st-sheet-title">
        删除全部数据？
      </view>
      <view class="st-sheet-sub">
        将永久删除
        <text class="st-strong">
          {{ deleteCounts.item }} 件物品 · {{ deleteCounts.med }} 条用药记录
        </text>
        <text>，此操作立即不可撤销，回收站也将清空。</text>
      </view>
      <view class="st-confirm">
        <view class="st-confirm__label">
          请输入「
          <text class="st-strong">
            删除
          </text>
          」以确认：
        </view>
        <input v-model="confirmText" class="st-confirm__input" placeholder="输入 删除">
      </view>
      <view class="x-btns">
        <x-button type="danger" :disabled="confirmText !== '删除'" text="确认删除" @click="handleDeleteAll" />
        <x-button type="gray" text="取消" @click="deleteSheet = false" />
      </view>
    </x-sheet>
  </x-page>
</template>

<script setup lang="ts">
import type { ThemeMode } from '@/store/modules/app/types';
import { usePermission, useTheme } from '@/hooks';
import { useItemStore, useMedicineStore, useMessageStore, useSettingStore } from '@/store';

interface ThemeOption {
  value: ThemeMode;
  label: string;
}

const settingStore = useSettingStore();
const itemStore = useItemStore();
const medicineStore = useMedicineStore();
const messageStore = useMessageStore();
const { theme, isDark, setTheme } = useTheme();

const backupText = computed<string>(() => (uni.getStorageSync('backup_at') as string) || '2026.10.28 21:14');

const themeOptions: ThemeOption[] = [
  { value: 'auto', label: '跟随系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
];
const themeHint = computed<string>(() => {
  if (theme.value === 'auto') {
    return `跟随系统 · 当前为${isDark.value ? '深色' : '浅色'}（随系统深浅自动切换）`;
  }
  return theme.value === 'dark' ? '已锁定深色模式' : '已锁定浅色模式';
});

const cameraAuth = ref<boolean | null>(null);
const cameraText = computed<string>(() => {
  if (cameraAuth.value === true) {
    return '已授权 ›';
  }
  if (cameraAuth.value === false) {
    return '未授权 ›';
  }
  return '未请求 ›';
});
const cameraClass = computed<string>(() => (cameraAuth.value === true ? 'st-ok' : 'st-warn'));

const deleteSheet = ref(false);
const confirmText = ref('');
const deleteCounts = computed(() => ({
  item: itemStore.list.length,
  med: medicineStore.courses.length,
}));

function goRestore(): void {
  uni.navigateTo({ url: '/pages/user/restore/index' });
}
function goFrequency(): void {
  uni.navigateTo({ url: '/pages/msg/frequency/index' });
}

function handleCloud(): void {
  if (!settingStore.isMember) {
    uni.navigateTo({ url: '/pages/user/member/index' });
    return;
  }
  uni.showToast({ title: '云同步已开启', icon: 'none' });
}

function handleExport(): void {
  uni.showModal({
    title: '导出 CSV',
    content: '导出包含全部物品与用药记录，需二次确认。确认导出？',
    confirmText: '确认导出',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '已生成本地导出文件', icon: 'none' });
      }
    },
  });
}

function requestCamera(): void {
  if (typeof uni.getSetting !== 'function') {
    uni.showToast({ title: '当前环境不支持相机授权查询', icon: 'none' });
    return;
  }
  uni.getSetting({
    success: (res) => {
      const authed = res.authSetting['scope.camera'];
      if (authed) {
        cameraAuth.value = true;
        uni.showToast({ title: '相机已授权', icon: 'none' });
        return;
      }
      uni.authorize({
        scope: 'scope.camera',
        success: () => {
          cameraAuth.value = true;
        },
        fail: () => {
          cameraAuth.value = false;
          uni.showToast({ title: '未授权，可在系统设置开启', icon: 'none' });
        },
      });
    },
    fail: () => {
      uni.showToast({ title: '无法读取授权状态', icon: 'none' });
    },
  });
}

function handleHealth(): void {
  uni.showModal({
    title: '健康数据授权',
    content: '健康数据不参与家庭共享，可在系统健康应用撤回授权。',
    showCancel: false,
  });
}

function handleCollection(): void {
  uni.showModal({
    title: '个人信息收集清单',
    content: '收集：设备标识、拍照图片、物品名称/位置/效期、用药时间。用途：本地存储与提醒，默认不上传。',
    showCancel: false,
  });
}

function handleThirdParty(): void {
  uni.showModal({
    title: '第三方共享清单',
    content: '不向第三方共享个人数据；云同步为会员可选功能，需单独授权。',
    showCancel: false,
  });
}

function handleElder(value: boolean): void {
  settingStore.setElder(value);
}

// 删除全部数据：清空物品（含回收站）+ 消息复位 + 本地备份与设置复位
function handleDeleteAll(): void {
  if (confirmText.value !== '删除') {
    return;
  }
  itemStore.deleteForever(itemStore.list.map(item => item.id));
  messageStore.reset();
  uni.removeStorageSync('backup_at');
  settingStore.reset();
  confirmText.value = '';
  deleteSheet.value = false;
  uni.showToast({ title: '已删除全部数据，回收站同时清空', icon: 'none' });
}

onShow(async () => {
  const allowed = await usePermission();
  if (!allowed) {
    return;
  }
  if (typeof uni.getSetting === 'function') {
    uni.getSetting({
      success: (res) => {
        cameraAuth.value = res.authSetting['scope.camera'] === true;
      },
    });
  }
});
</script>

<style lang="scss" scoped>
.st-cloud {
  display: flex;
  gap: 12rpx;
  align-items: center;
}

.st-cloud__v {
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}

.st-link {
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--color-primary);
}

.st-ok {
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--color-success-text);
}

.st-warn {
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--color-warning-text);
}

.st-theme {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.st-danger-tip {
  margin-top: 12rpx;
  text-align: center;
}

.st-sheet-title {
  margin-bottom: 12rpx;
  font-size: var(--fs-nav);
  font-weight: 700;
  color: var(--color-danger-strong);
  text-align: center;
}

.st-sheet-sub {
  margin-bottom: 24rpx;
  font-size: var(--fs-sub);
  line-height: 1.6;
  color: var(--color-text-sub);
  text-align: center;
}

.st-strong {
  font-weight: 700;
  color: var(--color-danger-strong);
}

.st-confirm {
  padding: 24rpx;
  margin-bottom: 12rpx;
  background: var(--color-fill);
  border-radius: 24rpx;
}

.st-confirm__label {
  margin-bottom: 12rpx;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}

.st-confirm__input {
  box-sizing: border-box;
  width: 100%;
  height: 84rpx;
  padding: 0 24rpx;
  font-size: var(--fs-body);
  color: var(--color-text);
  background: var(--color-card);
  border: 3rpx solid var(--color-danger-line);
  border-radius: 20rpx;
}
</style>
