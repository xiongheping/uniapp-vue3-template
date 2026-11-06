<template>
  <!-- 08 Action Sheet：四种录入方式 -->
  <x-page v-if="viewMode === 'sheet'">
    <x-nav-bar title="添加物品" back="close" />
    <view class="add-blank" />

    <!-- 选项行 -->
    <x-sheet :show="true" title="添加物品" @close="onCancel">
      <view v-for="(m, idx) in sheetList" :key="m.key" class="add-opt" :class="{ off: m.off }" @click="onPick(m)">
        <view class="add-opt__ico" :class="{ primary: idx === 0 && !m.off }">
          <x-icon :name="m.icon" :size="48" :color="idx === 0 && !m.off ? '#FFFFFF' : '#4F7CFF'" />
        </view>
        <view class="x-flex-1">
          <view class="add-opt__title">
            <text>{{ m.title }}</text>
            <x-tag v-if="m.badge" :type="m.badgeType || 'blue'" class="add-opt__badge">
              {{ m.badge }}
            </x-tag>
          </view>
          <view class="add-opt__sub">
            {{ m.sub }}
          </view>
        </view>
        <x-icon v-if="!m.off" name="chev-r" :size="36" color="#C0C6D2" />
      </view>
      <x-button type="link" text="取消" @click="onCancel" />
    </x-sheet>
  </x-page>

  <!-- 08b 保存成功 · 继续添加 -->
  <x-page v-else>
    <x-nav-bar title="添加物品" :back="false">
      <template #left>
        <view class="add-back" @click="goHome">
          <x-icon name="x" :size="44" :color="navColor" />
        </view>
      </template>
    </x-nav-bar>
    <view class="saved">
      <view class="saved__head">
        <text class="saved__emoji">
          ✅
        </text>
        <text class="saved__title">
          已保存 · 提醒已开启
        </text>
      </view>

      <x-card>
        <view class="saved__item">
          <view class="saved__item-ico">
            <x-icon :name="savedIcon" :size="36" color="#C77700" />
          </view>
          <view class="x-flex-1">
            <view class="saved__item-name x-ellipsis">
              {{ savedName }}
            </view>
            <view class="x-sub">
              {{ savedDueText }}
            </view>
          </view>
          <x-tag type="green">
            ✓
          </x-tag>
        </view>
      </x-card>

      <x-card>
        <view class="saved__quota">
          本月 AI 剩余
          <text class="saved__quota-num">
            {{ quotaText }}
          </text>
          次{{ usedCamera ? '（已扣减）' : '' }}
        </view>
      </x-card>

      <x-note v-if="degradeToKeyboard" type="red">
        本月 AI 已用完，手动录入不消耗次数。
      </x-note>
      <x-note v-else type="blue">
        💡 已连续添加
        <text class="saved__b">
          {{ continueCount }}
        </text>
        件{{ continueCount >= 3 ? '，先休息一下也完全可以，随时回来继续。' : '，第 3 件后会出现温和休息提示（主 CTA 不变）。' }}
      </x-note>
    </view>

    <template #sticky>
      <view class="saved-sticky x-safe-bottom">
        <x-button type="primary" large :icon="mainCta.icon" :text="mainCta.text" @click="onContinue(mainCta.key)" />
        <text class="saved-sticky__hint">
          适合一次整理多件 · 主出口跟随上次方式
        </text>
        <x-button type="ghost" small :icon="secCta.icon" :text="secCta.text" @click="onContinue(secCta.key)" />
        <x-button type="link" text="完成，回到首页" class="saved-sticky__done" @click="goHome" />
      </view>
    </template>
  </x-page>
</template>

<script setup lang="ts">
import type { AddMethod } from '@/store/modules/setting/types';
import { useTheme } from '@/hooks';
import { HOME_PATH } from '@/router';
import { switchTabPath } from '@/router/tab-bar';
import { useSettingStore } from '@/store';
import { dueLabel } from '@/utils/date';

type MethodKey = AddMethod | 'receipt';

interface SheetOption {
  key: MethodKey;
  icon: string;
  title: string;
  sub: string;
  off?: boolean;
  badge?: string;
  badgeType?: string;
}

interface ContinueOption {
  key: AddMethod;
  icon: string;
  text: string;
}

const settingStore = useSettingStore();
const { isDark } = useTheme();

// 连续添加计数（PRD 规则二：第 3 件后温和提示）
const COUNT_KEY = 'add_continue_count';
const viewMode = ref<'sheet' | 'saved'>('sheet');

const savedName = ref('未命名物品');
const savedDueText = ref('');
const savedIcon = ref('droplet');
const usedCamera = ref(false);
const continueCount = ref(0);

// —— 08 Action Sheet（PRD 规则一）——
const METHOD_META: Record<MethodKey, SheetOption> = {
  camera: { key: 'camera', icon: 'camera', title: '拍照识别', sub: '拍包装，AI 自动读效期' },
  scan: { key: 'scan', icon: 'scan', title: '扫商品条码', sub: '百万级商品库秒识别' },
  keyboard: { key: 'keyboard', icon: 'keyboard', title: '手动录入', sub: '15 秒填完，不依赖网络' },
  receipt: { key: 'receipt', icon: 'receipt', title: '小票批量', sub: '拍一张小票，一次录入多件', off: true },
};
const BASE_ORDER: MethodKey[] = ['camera', 'scan', 'keyboard', 'receipt'];

const sheetList = computed<SheetOption[]>(() => {
  const last = settingStore.lastAddMethod;
  const memory: AddMethod | '' = (['camera', 'scan', 'keyboard'] as AddMethod[]).includes(last as AddMethod) ? last : '';
  const order = memory ? [memory, ...BASE_ORDER.filter(key => key !== memory)] : BASE_ORDER;
  return order.map((key) => {
    const meta: SheetOption = { ...METHOD_META[key] };
    if (!meta.off) {
      if (memory && key === memory) {
        meta.badge = '上次使用';
        meta.badgeType = 'blue';
      }
      else if (!memory && key === 'camera') {
        meta.badge = '推荐';
        meta.badgeType = 'blue';
      }
    }
    else {
      meta.badge = '下版本';
      meta.badgeType = 'gray';
    }
    return meta;
  });
});

function onPick(m: SheetOption) {
  if (m.off) {
    // receipt 本期不可用：不写入、不进入流程
    uni.showToast({ title: '敬请期待', icon: 'none' });
    return;
  }
  // 仅在真正点进流程时写入（遮罩 / 取消不写）
  settingStore.setLastAddMethod(m.key as AddMethod);
  if (m.key === 'keyboard') {
    uni.redirectTo({ url: '/pages/item/confirm/index?mode=manual' });
  }
  else {
    uni.navigateTo({ url: `/pages/item/recognize/index?method=${m.key}` });
  }
}

function onCancel() {
  // 点遮罩 / 取消关闭：不写 lastAddMethod
  uni.navigateBack();
}

// —— 08b 保存成功（PRD 规则二）——
const CONTINUE_LABEL: Record<AddMethod, ContinueOption> = {
  camera: { key: 'camera', icon: 'camera', text: '继续拍照识别' },
  scan: { key: 'scan', icon: 'scan', text: '继续扫码' },
  keyboard: { key: 'keyboard', icon: 'keyboard', text: '继续手动录入' },
};

const quotaText = computed(() => settingStore.quotaLeftText);
const navColor = computed(() => (isDark.value ? '#F0F2F6' : '#1A2233'));

const degradeToKeyboard = computed(() => settingStore.lastAddMethod === 'camera' && settingStore.quotaLeft === 0);

const mainCta = computed<ContinueOption>(() => {
  if (degradeToKeyboard.value) {
    return CONTINUE_LABEL.keyboard;
  }
  const last = settingStore.lastAddMethod;
  return last ? CONTINUE_LABEL[last] : CONTINUE_LABEL.camera;
});

const secCta = computed<ContinueOption>(() => {
  if (mainCta.value.key === 'keyboard') {
    return CONTINUE_LABEL.camera;
  }
  return CONTINUE_LABEL.keyboard;
});

function onContinue(key: AddMethod) {
  settingStore.setLastAddMethod(key);
  if (key === 'keyboard') {
    uni.redirectTo({ url: '/pages/item/confirm/index?mode=manual' });
  }
  else {
    uni.navigateTo({ url: `/pages/item/recognize/index?method=${key}` });
  }
}

function goHome() {
  uni.removeStorageSync(COUNT_KEY);
  switchTabPath(HOME_PATH);
}

onLoad((options: any = {}) => {
  if (options.saved === '1') {
    viewMode.value = 'saved';
    savedName.value = decodeURIComponent(options.name || '未命名物品');
    savedDueText.value = options.due
      ? `${decodeURIComponent(options.due)} · ${dueLabel(options.due)} · 提前 7 天提醒`
      : '提醒已开启';
    savedIcon.value = options.icon || 'droplet';
    usedCamera.value = options.via !== 'keyboard';
    const prev = Number(uni.getStorageSync(COUNT_KEY) || 0);
    continueCount.value = prev + 1;
    uni.setStorageSync(COUNT_KEY, continueCount.value);
  }
});
</script>

<style lang="scss" scoped>
.add-blank {
  min-height: 60vh;
}

.add-back {
  display: flex;
  align-items: center;
  min-height: 72rpx;
  padding-right: 16rpx;
}

/* 08 无边框选项行 + 按下态（原型 .opt-row） */
.add-opt {
  box-sizing: border-box;
  display: flex;
  gap: 24rpx;
  align-items: center;
  min-height: 128rpx;
  padding: 28rpx 20rpx;
  border-radius: 28rpx;

  &:active {
    background: #f5f7fb;
  }
}

.add-opt.off {
  pointer-events: none;
  opacity: 0.5;
}

.add-opt__ico {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 92rpx;
  height: 92rpx;
  background: var(--color-primary-soft);
  border-radius: 28rpx;
}

.add-opt__ico.primary {
  background: var(--color-primary);
}

.add-opt__title {
  display: flex;
  gap: 8rpx;
  align-items: center;
  font-size: 30rpx;
  font-weight: 600;
  color: var(--color-text);
}

.add-opt__sub {
  margin-top: 6rpx;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}

/* 行内小 badge（原型 9px） */
.add-opt__badge {
  padding: 2rpx 8rpx;
  font-size: 18rpx;
}

.saved {
  padding-top: 16rpx;
}

.saved__head {
  padding: 24rpx 0;
  text-align: center;
}

.saved__emoji {
  display: block;
  font-size: 112rpx;
  line-height: 1.1;
}

.saved__title {
  display: block;
  margin-top: 20rpx;
  font-size: 38rpx;
  font-weight: 700;
  color: var(--color-text);
}

.saved__item {
  display: flex;
  gap: 20rpx;
  align-items: center;
}

.saved__item-ico {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  background: var(--color-warning-tag-bg);
  border-radius: 20rpx;
}

.saved__item-name {
  font-size: var(--fs-body);
  font-weight: 600;
  color: var(--color-text);
}

.saved__quota {
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
  text-align: center;
}

.saved__quota-num {
  font-weight: 700;
  color: var(--color-warning-text);
}

.saved__b {
  font-weight: 700;
  color: var(--color-primary);
}

.saved-sticky {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.saved-sticky__hint {
  font-size: var(--fs-caption);
  color: var(--color-text-sub);
  text-align: center;
}

/* 「完成，回到首页」弱化为 #5B6478（原型 08b） */
.saved-sticky__done {
  color: #5b6478;
}
</style>
