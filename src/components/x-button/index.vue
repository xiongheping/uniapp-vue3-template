<template>
  <button
    class="x-button"
    :class="[
      `x-button--${type}`,
      { 'x-button--small': small, 'x-button--mini': mini, 'x-button--large': large, 'x-button--disabled': disabled },
    ]"
    hover-class="x-button--hover"
    :hover-start-time="0"
    :disabled="disabled"
    @tap="onTap"
  >
    <x-icon v-if="icon" :name="icon" :size="small ? 28 : 32" color="currentColor" />
    <text v-if="text || $slots.default">
      {{ text }}<slot />
    </text>
  </button>
</template>

<script setup lang="ts">
/**
 * 按钮：primary / ghost / danger / gray / link
 */
interface Props {
  type?: 'primary' | 'ghost' | 'danger' | 'gray' | 'link';
  text?: string;
  icon?: string;
  small?: boolean;
  mini?: boolean;
  large?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  text: '',
  icon: '',
  small: false,
  mini: false,
  large: false,
  disabled: false,
});

const emit = defineEmits<{ click: [] }>();

function onTap() {
  if (!props.disabled) {
    emit('click');
  }
}
</script>

<style lang="scss" scoped>
.x-button {
  box-sizing: border-box;
  display: flex;
  gap: 8rpx;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: var(--h-btn);
  /* 小程序 button UA 重置：默认 line-height:2.55 会撑高文字行盒导致图标错位；左右 padding、::after 边框同理 */
  padding: 0;
  margin: 0;
  margin-top: 24rpx;
  font-size: var(--fs-btn);
  font-weight: 600;
  line-height: 1;
  text-align: center;
  border-radius: var(--radius-cell);
  transition: transform var(--dur-fast) var(--ease-out), opacity var(--dur-normal) var(--ease-out);

  &::after {
    border: none;
  }

  &:active {
    opacity: 0.9;
    transform: scale(0.98);
  }

  /* hover-class 按压态（小程序/H5 通用） */
  &.x-button--hover {
    opacity: 0.9;
    transform: scale(0.98);
  }

  &.x-button--primary {
    color: #ffffff;
    background: var(--color-primary);
  }

  &.x-button--ghost {
    color: var(--color-primary);
    background: var(--color-card);
    border: 3rpx solid var(--color-primary);
  }

  &.x-button--danger {
    color: var(--color-danger);
    background: var(--color-card);
    border: 3rpx solid #fbcbcb;
  }

  &.x-button--gray {
    color: var(--color-text-sub);
    background: var(--color-fill);
  }

  &.x-button--link {
    min-height: var(--h-btn);
    font-weight: 600;
    color: var(--color-primary);
    background: transparent;
  }

  &.x-button--small {
    min-height: 72rpx;
    margin-top: 0;
    font-size: var(--fs-sub);
  }

  /* 原型 13 主 CTA：56px 高 / 17px 字号；elder 60px（--h-btn-lg） */
  &.x-button--large {
    min-height: var(--h-btn-lg);
    font-size: var(--fs-btn-lg);
  }

  &.x-button--mini {
    min-height: 56rpx;
    padding: 0 24rpx;
    margin-top: 0;
    font-size: var(--fs-caption);
  }

  &.x-button--disabled {
    color: #ffffff;
    pointer-events: none;
    background: var(--color-disabled-bg);
  }
}
</style>
