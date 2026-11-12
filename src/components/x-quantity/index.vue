<template>
  <view class="xq">
    <button class="xq__btn" hover-class="xq__btn--hover" :hover-start-time="0" @tap="emit('decrease')">
      −
    </button>
    <input
      v-if="editable"
      class="xq__input"
      type="number"
      :value="draft"
      @input="onInput"
      @blur="onBlur"
    >
    <text v-else class="xq__val">
      {{ text || modelValue }}
    </text>
    <text v-if="editable && unit" class="xq__unit">
      {{ unit }}
    </text>
    <button class="xq__btn" hover-class="xq__btn--hover" :hover-start-time="0" @tap="emit('increase')">
      +
    </button>
  </view>
</template>

<script setup lang="ts">
import { watch } from 'vue';

/**
 * 数量步进器：+/- 按钮，中间展示数值（text 优先于 modelValue）；editable 时可直接输入
 */
interface Props {
  modelValue?: number;
  /** 直接展示文案（如库存 18/30 粒） */
  text?: string;
  /** 中间数值改为可输入 */
  editable?: boolean;
  /** 可输入模式下数值后的单位文案（如「盒 5 片」） */
  unit?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  text: '',
  editable: false,
  unit: '',
});

const emit = defineEmits<{ 'decrease': []; 'increase': []; 'update:modelValue': [value: number] }>();

/** 输入中的文本：允许暂时为空，失焦再回填，避免删除时被外部夹紧值打断 */
const draft = ref(String(props.modelValue));

watch(
  () => props.modelValue,
  (v) => {
    if (Number(draft.value) !== v) {
      draft.value = String(v);
    }
  },
);

function onInput(e: { detail: { value: string } }) {
  draft.value = e.detail.value;
  if (draft.value === '') {
    return;
  }
  const n = Number(draft.value);
  if (Number.isFinite(n)) {
    emit('update:modelValue', n);
  }
}

function onBlur() {
  if (draft.value === '') {
    draft.value = String(props.modelValue);
  }
}
</script>

<style lang="scss" scoped>
.xq {
  display: inline-flex;
  gap: 28rpx;
  align-items: center;
  padding: 12rpx 24rpx;
  background: var(--color-fill-light);
  border-radius: 24rpx;
}

.xq__btn {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  padding: 0;
  margin: 0;
  font-size: var(--fs-body);
  line-height: 1;
  color: var(--color-primary);
  background: var(--color-card);
  border: 2rpx solid var(--color-fill);
  border-radius: 16rpx;
  transition: opacity var(--dur-normal) var(--ease-out), transform var(--dur-fast) var(--ease-out);

  /* 小程序 button 默认 ::after 边框 */
  &::after {
    border: none;
  }
}

.xq__btn--hover {
  opacity: 0.85;
  transform: scale(0.94);
}

.xq__val {
  min-width: 112rpx;
  font-size: var(--fs-body);
  font-weight: 700;
  color: var(--color-text);
  text-align: center;
}

.xq__input {
  box-sizing: border-box;
  width: 96rpx;
  height: 64rpx;
  font-size: var(--fs-body);
  font-weight: 700;
  color: var(--color-text);
  text-align: center;
  background: transparent;
  border: none;
}

.xq__unit {
  font-size: var(--fs-body);
  color: var(--color-text);
}
</style>
