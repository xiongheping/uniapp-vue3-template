<template>
  <button
    class="x-button"
    :class="[`x-button--${type}`, { 'x-button--small': small, 'x-button--mini': mini, 'x-button--disabled': disabled }]"
    :disabled="disabled"
    @tap="onTap"
  >
    <x-icon v-if="icon" :name="icon" :size="small ? 30 : 34" :color="type === 'primary' ? '#ffffff' : '#4F7CFF'" />
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
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  text: '',
  icon: '',
  small: false,
  mini: false,
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
  display: flex;
  gap: 8rpx;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: var(--h-touch);
  margin-top: 24rpx;
  font-size: var(--fs-body);
  font-weight: 600;
  text-align: center;
  border-radius: var(--radius-cell);
  transition: transform 0.12s;

  &:active {
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
    border: 3rpx solid #fbcbeb;
  }

  &.x-button--gray {
    color: var(--color-text-sub);
    background: var(--color-fill);
  }

  &.x-button--link {
    min-height: var(--h-touch);
    font-weight: 600;
    color: var(--color-primary);
    background: transparent;
  }

  &.x-button--small {
    min-height: 72rpx;
    margin-top: 0;
    font-size: var(--fs-sub);
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
    background: var(--color-fill);
    opacity: 0.8;
  }
}
</style>
