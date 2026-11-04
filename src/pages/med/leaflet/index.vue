<template>
  <x-page>
    <x-nav-bar title="说明书摘录" :back="true">
      <template #right>
        <view class="lf-sizes">
          <view
            v-for="s in sizes"
            :key="s.key"
            class="lf-size"
            :class="{ 'lf-size--on': fontKey === s.key }"
            @tap="fontKey = s.key"
          >
            {{ s.label }}
          </view>
        </view>
      </template>
    </x-nav-bar>

    <!-- 未保存计划 / 无数据兜底 -->
    <x-empty
      v-if="!plan"
      icon="file"
      title="暂无说明书摘录"
      sub="保存用药计划并录入说明书内容后，这里会逐字展示原文。"
    >
      <template #action>
        <x-button type="ghost" text="返回" @click="goBack" />
      </template>
    </x-empty>

    <template v-else>
      <!-- 药品名片 -->
      <view class="x-card lf-head">
        <text class="lf-head__name" :style="fontStyle('title')">
          {{ plan.name }}
        </text>
        <text class="lf-head__meta" :style="fontStyle('sub')">
          {{ [plan.approval, plan.spec].filter(Boolean).join(' · ') || '未录入规格信息' }}
        </text>
      </view>

      <!-- 用法用量（原文） -->
      <view v-if="plan.instruction?.usage" class="x-card lf-sec">
        <text class="lf-sec__tag lf-sec__tag--blue">
          📖 用法用量（原文）
        </text>
        <text class="lf-sec__body" :style="fontStyle('body')">
          {{ plan.instruction.usage }}
        </text>
      </view>

      <!-- 注意事项（原文） -->
      <view v-if="plan.instruction?.caution" class="x-card lf-sec">
        <text class="lf-sec__tag lf-sec__tag--red">
          ⚠️ 注意事项（原文）
        </text>
        <text class="lf-sec__body" :style="fontStyle('body')">
          {{ plan.instruction.caution }}
        </text>
      </view>

      <!-- 适应症 / 禁忌（原文） -->
      <view v-if="plan.instruction?.indications" class="x-card lf-sec">
        <text class="lf-sec__tag lf-sec__tag--blue">
          💊 适应症（原文）
        </text>
        <text class="lf-sec__body" :style="fontStyle('body')">
          {{ plan.instruction.indications }}
        </text>
      </view>
      <view v-if="plan.instruction?.contraindications" class="x-card lf-sec">
        <text class="lf-sec__tag lf-sec__tag--red">
          🚫 禁忌（原文）
        </text>
        <text class="lf-sec__body" :style="fontStyle('body')">
          {{ plan.instruction.contraindications }}
        </text>
      </view>

      <view v-if="!hasText" class="x-card lf-sec">
        <text class="lf-sec__tag lf-sec__tag--blue">
          📖 原文
        </text>
        <text class="lf-sec__body lf-sec__body--empty" :style="fontStyle('body')">
          该计划尚未录入说明书内容，可在「编辑计划 → 说明书」中补充用法用量与注意事项。
        </text>
      </view>

      <!-- 原图 / 药监数据库 -->
      <view class="x-btns row lf-links">
        <x-button type="ghost" text="🖼 查看原图核对" @click="viewOrigin" />
        <x-button type="ghost" text="🔗 药监数据库" @click="gotoNmpa" />
      </view>

      <x-note tone="purple">
        ℹ️ 内容逐字摘自药品说明书，不构成用药建议。不适请咨询医生或药师。
      </x-note>
    </template>
  </x-page>
</template>

<script setup lang="ts">
import type { MedPlan } from '@/store/modules/medicine/types';
import { onLoad } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { useMedicineStore } from '@/store';

/**
 * 说明书摘录页（原型 12★）
 * 只展示原文 + 免责声明；字号三档 A- / A / A+
 */
const medicineStore = useMedicineStore();

const planId = ref<string>('');

const plan = computed<MedPlan | null>(() => {
  return planId.value ? medicineStore.plans.find(p => p.id === planId.value) || null : null;
});

const fontKey = ref<'s' | 'm' | 'l'>('m');

const sizes = [
  { key: 's' as const, label: 'A-' },
  { key: 'm' as const, label: 'A' },
  { key: 'l' as const, label: 'A+' },
];

/** 三档字号：正文 14/16/19px，标题与辅助文字同步缩放 */
function fontStyle(kind: 'title' | 'body' | 'sub'): Record<string, string> {
  const scale = { s: 0.875, m: 1, l: 1.19 }[fontKey.value];
  const base = { title: 17, body: 15, sub: 13 }[kind];
  return { fontSize: `${Math.round(base * scale)}px` };
}

const hasText = computed<boolean>(() => {
  const ins = plan.value?.instruction;
  return !!(ins?.usage || ins?.caution || ins?.indications || ins?.contraindications);
});

function goBack() {
  uni.navigateBack();
}

onLoad((options: Record<string, string> = {}) => {
  planId.value = options.planId || '';
});

/** 说明书照片原图核对 */
function viewOrigin() {
  const url = plan.value?.instruction?.imageUrl;
  if (!url) {
    uni.showToast({ title: '未上传说明书照片', icon: 'none' });
    return;
  }
  uni.previewImage({ urls: [url] });
}

/** 跳转国家药监局药品查询（H5 外部链接） */
function gotoNmpa() {
  // #ifdef H5
  window.open('https://www.nmpa.gov.cn/', '_blank');
  // #endif
  // #ifndef H5
  uni.showToast({ title: '请在浏览器中访问药监数据库', icon: 'none' });
  // #endif
}
</script>

<style lang="scss" scoped>
.lf-sizes {
  display: flex;
  gap: 8rpx;
}

.lf-size {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 56rpx;
  min-height: 52rpx;
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--color-text-sub);
  background: var(--color-fill-light);
  border-radius: var(--radius-cell);
}

.lf-size--on {
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.lf-head {
  display: flex;
  flex-direction: column;
}

.lf-head__name {
  font-weight: 700;
  color: var(--color-text);
}

.lf-head__meta {
  margin-top: 6rpx;
  color: var(--color-text-sub);
}

.lf-sec {
  display: flex;
  flex-direction: column;
}

.lf-sec__tag {
  margin-bottom: 14rpx;
  font-size: var(--fs-sub);
  font-weight: 700;
}

.lf-sec__tag--blue {
  color: var(--color-primary);
}

.lf-sec__tag--red {
  color: var(--color-danger);
}

.lf-sec__body {
  line-height: 1.9;
  color: var(--color-text);
}

.lf-sec__body--empty {
  color: var(--color-text-sub);
}

.lf-links {
  margin-top: 24rpx;
}
</style>
