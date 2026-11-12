<template>
  <view class="xtp__mask" :class="{ 'xtp__mask--hidden': !show }" @tap="onCancel">
    <view class="xtp" @tap.stop>
      <view class="xtp__handle" />
      <view class="xtp__title">
        {{ title }}
      </view>
      <view v-if="sub" class="xtp__sub">
        {{ sub }}
      </view>

      <slot name="advance" />

      <view class="xtp__cols">
        <picker mode="selector" :range="HOURS" :value="hourIdx" @change="onHour">
          <view class="xtp__col">
            {{ value.split(':')[0] || '08' }} 时
          </view>
        </picker>
        <picker mode="selector" :range="MINUTES" :value="minIdx" @change="onMin">
          <view class="xtp__col">
            {{ value.split(':')[1] || '00' }} 分
          </view>
        </picker>
      </view>

      <view class="xtp__btns">
        <x-button class="xtp__btn" type="ghost" text="取消" @click="onCancel" />
        <x-button class="xtp__btn" text="确认" @click="onConfirm" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';

/**
 * 底部滚轮时间选择（HH:mm，5 分钟步进，原型 22）
 */
interface Props {
  show: boolean;
  title?: string;
  sub?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '选择时间',
  sub: '',
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  'confirm': [value: string];
  'close': [];
}>();
const value = defineModel<string>({ default: '08:00' });
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

const hourIdx = computed<number>(() => Math.max(0, HOURS.indexOf(value.value.split(':')[0] || '08')));
const minIdx = computed<number>(() => Math.max(0, MINUTES.indexOf(value.value.split(':')[1] || '00')));

watch(
  () => props.show,
  (v) => {
    if (!v) {
      emit('close');
    }
  },
);

function onHour(e: any) {
  value.value = `${HOURS[e.detail.value]}:${value.value.split(':')[1] || '00'}`;
}

function onMin(e: any) {
  value.value = `${value.value.split(':')[0] || '08'}:${MINUTES[e.detail.value]}`;
}

function onConfirm() {
  emit('confirm', value.value);
  emit('update:show', false);
}

function onCancel() {
  emit('update:show', false);
}
</script>

<style lang="scss" scoped>
.xtp__mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  background: rgb(10 15 30 / 45%);
}

/* 小程序端 v-show 编译为 hidden 会被自身 display:flex 覆盖，显隐统一用 class 控制 */
.xtp__mask--hidden {
  display: none !important;
}

.xtp {
  width: 100%;
  padding: 20rpx 36rpx;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom, 0px));
  background: var(--color-card);
  border-radius: 44rpx 44rpx 0 0;
}

.xtp__handle {
  width: 76rpx;
  height: 8rpx;
  margin: 0 auto 16rpx;
  background: var(--color-fill);
  border-radius: 4rpx;
}

.xtp__title {
  font-size: var(--fs-nav);
  font-weight: 700;
  color: var(--color-text);
  text-align: center;
}

.xtp__sub {
  margin-top: 8rpx;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
  text-align: center;
}

.xtp__cols {
  display: flex;
  gap: 24rpx;
  margin-top: 28rpx;
}

.xtp__cols picker {
  flex: 1;
}

.xtp__col {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: var(--h-touch);
  font-size: var(--fs-title);
  font-weight: 700;
  color: var(--color-text);
  background: var(--color-fill-light);
  border-radius: var(--radius-cell);
}

.xtp__btns {
  display: flex;
  gap: 16rpx;
  margin-top: 28rpx;

  /* H5 端 class 落在 x-button 根节点；小程序端落在自定义组件宿主节点，两端都能等分 */
  .xtp__btn {
    flex: 1;
    margin-top: 0;
  }

  /* 小程序端内部按钮仍带默认上间距，需单独清零 */
  :deep(.x-button) {
    margin-top: 0;
  }
}
</style>
