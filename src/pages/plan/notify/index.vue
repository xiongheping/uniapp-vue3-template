<template>
  <x-page :reserve="72">
    <x-nav-bar title="提醒与通知" />

    <view class="no-safe">
      <x-icon name="shield-check" :size="32" color="#52C41A" />
      <view class="x-flex-1">
        系统通知权限<text class="no-b">
          已开启
        </text> · 到点提醒可以正常送达。
      </view>
    </view>

    <view class="no-label">
      提醒方式
    </view>
    <x-card flat>
      <view class="no-pcard">
        <x-field label="系统通知（推荐）">
          <view class="no-picked">
            <text>已选</text>
            <x-icon name="check" :size="28" color="#4F7CFF" />
          </view>
        </x-field>
        <x-field label="App 内横幅" value="使用中打开 App 时显示" />
        <x-field label="声音">
          <x-switch v-model:checked="sound" />
        </x-field>
        <x-field label="震动" last>
          <x-switch v-model:checked="vibrate" />
        </x-field>
      </view>
    </x-card>

    <view class="no-label">
      提醒分档
    </view>
    <x-card flat>
      <view class="no-pcard">
        <x-field label="到点强提醒 · 用药 / 血压" icon="pill" value="始终开启" last />
        <x-field label="温和提醒 · 喝水 / 运动等">
          <x-switch v-model:checked="gentle" />
        </x-field>
        <x-field label="温和提醒上限" value="每天 2 条" chevron @click="notReady('温和提醒上限')" />
        <x-field label="漏打卡提醒" last>
          <x-switch v-model:checked="missRemind" />
        </x-field>
      </view>
    </x-card>

    <view class="no-label">
      免打扰
    </view>
    <x-card flat>
      <view class="no-pcard">
        <x-field label="免打扰时段" icon="moon" value="22:30 – 07:30" chevron @click="notReady('免打扰时段')" />
        <x-field label="免打扰时用药提醒" last>
          <text class="no-blue">
            仍然响铃
          </text>
        </x-field>
      </view>
    </x-card>

    <x-note type="blue" class="no-note">
      到点强提醒与温和提醒互不挤占：温和提醒达到 2 条上限后，不再追加；强提醒不受上限影响。
    </x-note>

    <template #sticky>
      <view class="no-sticky">
        <x-button text="完成" @click="done" />
      </view>
    </template>
  </x-page>
</template>

<script setup lang="ts">
/**
 * 原型 P9：提醒与通知通道设置
 * 用药到点强提醒为安全功能，只能查看不能关闭
 */
const sound = ref<boolean>(true);
const vibrate = ref<boolean>(true);
const gentle = ref<boolean>(true);
const missRemind = ref<boolean>(true);

function notReady(label: string) {
  uni.showToast({ title: `${label}（演示页暂未接入）`, icon: 'none' });
}

function done() {
  uni.navigateBack({
    fail: () => {
      uni.redirectTo({ url: '/pages/tab/plan/index' });
    },
  });
}
</script>

<style lang="scss" scoped>
.no-safe {
  display: flex;
  gap: 20rpx;
  align-items: flex-start;
  padding: 20rpx 24rpx;
  margin-bottom: 4rpx;
  font-size: var(--fs-sub);
  line-height: 1.6;
  color: #2e5c1e;
  background: #f0faf0;
  border-left: 6rpx solid #52c41a;
  border-radius: 16rpx;
}

.no-b {
  font-weight: 700;
}

.no-label {
  margin: 28rpx 4rpx 12rpx;
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--color-text-sub);
}

.no-pcard {
  padding: 0 28rpx;
}

.no-picked {
  display: flex;
  gap: 8rpx;
  align-items: center;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--color-primary);
}

.no-blue {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--color-primary);
}

.no-note {
  margin-top: 24rpx;
}

.no-sticky {
  margin-top: -24rpx;
}
</style>
