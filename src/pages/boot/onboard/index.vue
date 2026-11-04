<template>
  <x-page>
    <view class="onboard">
      <!-- 分步进度条 -->
      <view class="stepper">
        <view v-for="(s, i) in steps" :key="s.key" class="stepper__bar" :class="{ on: s.done || i === currentIdx }" />
      </view>
      <view class="progress-text">
        {{ progressText }}
      </view>

      <!-- 当前步骤 -->
      <block v-if="currentIdx >= 0">
        <view class="head">
          <view v-if="steps[currentIdx].emoji" class="head__emoji">
            {{ steps[currentIdx].emoji }}
          </view>
          <view v-else class="head__ico">
            <x-icon :name="steps[currentIdx].icon || 'package'" :size="56" color="#4F7CFF" />
          </view>
          <view class="head__title">
            {{ steps[currentIdx].title }}
          </view>
          <view class="head__sub">
            {{ steps[currentIdx].subtitle }}
          </view>
        </view>

        <!-- 步骤一：拍照添加物品 -->
        <block v-if="steps[currentIdx].key === 'add'">
          <x-card highlight>
            <x-cell icon="camera" title="拍一张药盒 / 包装" subtitle="点击后请求相机权限" tag="推荐" tag-type="blue" />
            <view class="card-btn">
              <x-button text="打开相机" @click="openCamera" />
            </view>
          </x-card>
          <x-card>
            <x-cell
              icon="keyboard"
              title="手动输入"
              subtitle="不想拍照？手填只要 15 秒"
              chevron
              @click="gotoAdd('keyboard')"
            />
            <x-cell
              icon="scan"
              title="扫商品条码"
              subtitle="百万级商品库秒识别"
              chevron
              last
              @click="gotoAdd('scan')"
            />
          </x-card>
          <x-note type="blue">
            💡 存完第一件后会询问是否开启提醒通知，跳过也不影响使用。
          </x-note>
        </block>

        <!-- 步骤二：用药提醒 -->
        <block v-else-if="steps[currentIdx].key === 'plan'">
          <x-card highlight>
            <x-cell icon="pill" title="设置第一个用药提醒" subtitle="服药提醒单独走，不会被合并漏掉" />
            <view class="card-btn">
              <x-button text="去设置提醒" @click="gotoPlan" />
            </view>
          </x-card>
        </block>

        <!-- 步骤三：今日摘要 -->
        <block v-else>
          <x-card highlight>
            <x-cell icon="chart" title="查看今日摘要" subtitle="临期物品合并成每天 1 条摘要" />
            <view class="card-btn">
              <x-button text="查看今日摘要" @click="gotoDigest" />
            </view>
          </x-card>
        </block>

        <view class="skip">
          <text class="skip__link" @tap="enterHome">
            先逛逛 ›
          </text>
        </view>
      </block>

      <!-- 全部完成 -->
      <block v-else>
        <view class="head">
          <view class="head__emoji">
            🎯
          </view>
          <view class="head__title">
            太棒了，全部完成！
          </view>
          <view class="head__sub">
            之后我会帮你盯效期、提醒吃药
          </view>
        </view>
        <x-button text="进入首页" @click="enterHome" />
      </block>
    </view>

    <!-- 06b 相机权限被拒 -->
    <x-sheet
      v-model:show="permSheet"
      title="相机权限未开启"
      sub="拍照识别需要相机权限。你也可以先用手动输入或扫条码，不影响添加物品。"
    >
      <view class="perm-path">
        设置路径：系统设置 › 小七管家 › 相机
      </view>
      <x-button text="去设置开启相机" @click="openSetting" />
      <view class="perm-alt">
        <x-button type="ghost" text="手动输入" @click="altAdd('keyboard')" />
      </view>
      <view class="perm-alt">
        <x-button type="gray" text="取消" @click="permSheet = false" />
      </view>
    </x-sheet>
  </x-page>
</template>

<script setup lang="ts">
import { redirectToHomePage } from '@/router';

interface OnboardStep {
  key: string;
  done: boolean;
  emoji?: string;
  icon?: string;
  title: string;
  subtitle: string;
}

const steps = ref<OnboardStep[]>([
  { key: 'add', done: false, emoji: '🎯', title: '添加你的第一件物品', subtitle: '30 秒完成，之后我就能帮你盯效期了' },
  { key: 'plan', done: false, icon: 'pill', title: '设置第一个用药提醒', subtitle: '到点提醒你吃药，单独推送不被合并' },
  { key: 'digest', done: false, icon: 'chart', title: '查看今日摘要', subtitle: '看看今天有哪些物品需要留意' },
]);

const permSheet = ref(false);

const currentIdx = computed(() => steps.value.findIndex(s => !s.done));
const progressText = computed(() => {
  if (currentIdx.value < 0) {
    return '已完成全部 3 步';
  }
  return `第 ${currentIdx.value + 1} / ${steps.value.length} 步`;
});

function markDone(key: string) {
  const target = steps.value.find(s => s.key === key);
  if (target) {
    target.done = true;
  }
}

function openCamera() {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera'],
    success: (res) => {
      const path = res.tempFilePaths && res.tempFilePaths[0] ? res.tempFilePaths[0] : '';
      markDone('add');
      uni.navigateTo({ url: `/pages/item/add/index?method=camera&photo=${encodeURIComponent(String(path))}` });
    },
    fail: () => {
      // 区分「用户取消」与「权限被拒」
      uni.getSetting({
        success: (setting) => {
          const cameraAuth = setting.authSetting && setting.authSetting['scope.camera'];
          if (cameraAuth === false) {
            permSheet.value = true;
          }
        },
        fail: () => {
          permSheet.value = true;
        },
      });
    },
  });
}

function gotoAdd(method: string) {
  markDone('add');
  uni.navigateTo({ url: `/pages/item/add/index?method=${method}` });
}

function altAdd(method: string) {
  permSheet.value = false;
  gotoAdd(method);
}

function gotoPlan() {
  markDone('plan');
  uni.navigateTo({ url: '/pages/med/plan/index' });
}

function gotoDigest() {
  markDone('digest');
  // 首页为 tab 页，原生 tabBar 已移除，统一走 redirectToHomePage（等价于 A 的 navigateTo 首页）
  redirectToHomePage();
}

function openSetting() {
  uni.openSetting({
    success: (res) => {
      const granted = res.authSetting && res.authSetting['scope.camera'];
      if (granted) {
        permSheet.value = false;
        openCamera();
      }
    },
  });
}

function enterHome() {
  redirectToHomePage();
}
</script>

<style lang="scss" scoped>
.onboard {
  padding-top: 32rpx;
}

.stepper {
  display: flex;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.stepper__bar {
  flex: 1;
  height: 10rpx;
  background: var(--color-border);
  border-radius: 6rpx;
}

.stepper__bar.on {
  background: var(--color-primary);
}

.progress-text {
  margin-bottom: 16rpx;
  font-size: var(--fs-caption);
  color: var(--color-text-sub);
  text-align: right;
}

.head {
  padding: 16rpx 0 24rpx;
  text-align: center;
}

.head__emoji {
  font-size: 88rpx;
  line-height: 1;
}

.head__ico {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 112rpx;
  height: 112rpx;
  margin: 0 auto;
  background: var(--color-primary-soft);
  border-radius: 32rpx;
}

.head__title {
  margin-top: 16rpx;
  font-size: var(--fs-title);
  font-weight: 700;
  color: var(--color-text);
}

.head__sub {
  margin-top: 8rpx;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}

.card-btn {
  margin-top: 16rpx;
}

.skip {
  margin-top: 24rpx;
  text-align: center;
}

.skip__link {
  font-size: var(--fs-sub);
  color: var(--color-text-weak);
}

.perm-path {
  padding: 8rpx 0 28rpx;
  font-size: var(--fs-mini);
  color: var(--color-text-sub);
  text-align: center;
}

.perm-alt {
  margin-top: 16rpx;
}
</style>
