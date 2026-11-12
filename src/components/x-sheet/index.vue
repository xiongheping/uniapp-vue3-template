<template>
  <view class="xsh__mask" :class="[{ 'xsh__mask--center': mode === 'center' }, { 'xsh__mask--hidden': !show }]" @tap="onMask">
    <view class="xsh" :class="{ 'xsh--center': mode === 'center' }" @tap.stop>
      <view v-if="mode !== 'center'" class="xsh__handle" />
      <view v-if="title" class="xsh__title">
        {{ title }}
      </view>
      <view v-if="sub || $slots.sub" class="xsh__sub">
        <slot name="sub">
          {{ sub }}
        </slot>
      </view>
      <slot />
      <view v-if="$slots.footer" class="xsh__footer">
        <slot name="footer" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { watch } from 'vue';

/**
 * 底部弹层 / 居中弹窗（原型 sheet + modal-mask）
 */
interface Props {
  show: boolean;
  title?: string;
  sub?: string;
  /** center = 居中弹窗，默认底部弹层 */
  mode?: 'bottom' | 'center';
  /** 点击遮罩是否可关闭 */
  maskClosable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  sub: '',
  mode: 'bottom',
  maskClosable: true,
});

const emit = defineEmits<{ 'update:show': [value: boolean]; 'close': [] }>();

function close() {
  emit('update:show', false);
  emit('close');
}

function onMask() {
  if (props.maskClosable) {
    close();
  }
}

watch(
  () => props.show,
  (v) => {
    // 弹层期间禁用页面滚动穿透，关闭后恢复（弹层常驻 DOM，必须成对还原）
    // #ifdef H5
    document.body.style.overflow = v ? 'hidden' : '';
    // #endif
  },
);
</script>

<style lang="scss" scoped>
.xsh__mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  background: rgb(10 15 30 / 45%);
}

.xsh__mask--center {
  align-items: center;
  padding: 64rpx;
}

/* 小程序端 v-show 编译为 hidden 会被自身 display:flex 覆盖，显隐统一用 class 控制 */
.xsh__mask--hidden {
  display: none !important;
}

.xsh {
  box-sizing: border-box;
  width: 100%;
  padding: 20rpx 36rpx;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom, 0px));
  background: var(--color-card);
  border-radius: 44rpx 44rpx 0 0;
  animation: xsh-up 0.22s ease-out;
}

.xsh--center {
  padding: 40rpx 36rpx 48rpx;
  border-radius: 40rpx;
  animation: none;
}

.xsh__handle {
  width: 76rpx;
  height: 8rpx;
  margin: 0 auto 16rpx;
  background: var(--color-fill);
  border-radius: 4rpx;
}

.xsh__title {
  margin-bottom: 12rpx;
  font-size: var(--fs-nav);
  font-weight: 700;
  color: var(--color-text);
  text-align: center;
}

.xsh__sub {
  margin-bottom: 28rpx;
  font-size: var(--fs-sub);
  line-height: 1.6;
  color: var(--color-text-sub);
  text-align: center;
}

.xsh__footer {
  margin-top: 24rpx;
}

@keyframes xsh-up {
  from {
    opacity: 0.6;
    transform: translateY(80rpx);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
