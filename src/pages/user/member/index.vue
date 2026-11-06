<template>
  <x-page :reserve="showResult ? 0 : 240">
    <x-nav-bar
      :title="showResult ? '支付结果' : '小七管家会员'"
      :right-text="showResult ? '' : '恢复购买'"
      @right="handleRestorePurchase"
    />

    <!-- ============ 方案选择 ============ -->
    <block v-if="!showResult">
      <x-note type="green">
        💚 服药提醒、到期提醒、数据导出永久免费。试用到期前 3 天会提醒。
      </x-note>

      <!-- 18c 会员到期提醒（已开通时展示） -->
      <block v-if="settingStore.isMember">
        <x-banner :text="`⏰ 会员将于 ${expireText} 到期（剩 ${daysLeft} 天），到期后 AI 识别恢复为 10 次/月。`" />
        <x-card>
          <view class="mb-sec">
            ⭐ {{ planTitle }} 状态
          </view>
          <x-field label="有效期至" :value="expireText" icon="calendar" />
          <x-field label="自动续费" icon="refresh" last>
            <x-switch v-model:checked="autoRenewProxy" />
          </x-field>
          <view class="mb-sec mb-sec--sub">
            到期后权益变化
          </view>
          <x-field label="AI 识别" value="无限次 → 10 次/月" icon="star" />
          <x-field label="云同步" value="关闭（本地数据保留）" icon="cloud-check" />
          <x-field label="消耗报表" value="仅查看历史" icon="activity" />
          <x-field label="服药/到期提醒" value="不受影响" tone="success" icon="bell-ring" last />
        </x-card>
        <view class="x-sub mb-renew-tip">
          关闭自动续费后仍可用至到期日，不会立即降级。
        </view>
      </block>

      <!-- 免费 / PRO 对比 -->
      <x-card>
        <view class="mb-sec">
          免费版 vs 会员 对比
        </view>
        <view v-for="row in compareRows" :key="row.label" class="mb-cmp">
          <text class="mb-cmp__label">
            {{ row.label }}
          </text>
          <view class="mb-cmp__free" :class="row.free ? 'on' : 'off'">
            {{ row.freeText }}
          </view>
          <view class="mb-cmp__pro" :class="row.pro ? 'on' : 'off'">
            {{ row.proText }}
          </view>
        </view>
      </x-card>

      <!-- 方案卡 -->
      <view class="mb-plans">
        <view
          v-for="plan in plans"
          :key="plan.key"
          class="mb-plan"
          :class="{ sel: selected === plan.key, baseline: plan.baseline, hot: plan.hot }"
          @tap="selectPlan(plan)"
        >
          <text v-if="plan.badge" class="mb-plan__badge">
            {{ plan.badge }}
          </text>
          <view class="mb-plan__check" :class="{ on: selected === plan.key }">
            <x-icon v-if="selected === plan.key" name="check" :size="48" color="#FFFFFF" :stroke-width="3" />
          </view>
          <view class="mb-plan__name">
            {{ plan.name }}
          </view>
          <view class="mb-plan__price">
            {{ plan.price }}
            <text v-if="plan.unit" class="mb-plan__unit">
              {{ plan.unit }}
            </text>
          </view>
          <view class="mb-plan__note">
            {{ plan.note }}
          </view>
          <view v-for="f in plan.feats" :key="f.text" class="mb-plan__feat" :class="{ dim: !f.on }">
            <text>{{ f.on ? '✓' : '—' }} {{ f.text }}</text>
          </view>
        </view>
      </view>

      <!-- 支付方式 -->
      <x-card>
        <view class="mb-sec">
          💳 支付方式
        </view>
        <view class="mb-pay x-tap-bg" hover-class="x-tap--hover" :hover-start-time="0" @tap="payMethod = 'apple'">
          <text>🍎 App 内购（iOS）</text>
          <x-radio :checked="payMethod === 'apple'" />
        </view>
        <view class="mb-pay x-tap-bg" hover-class="x-tap--hover" :hover-start-time="0" @tap="payMethod = 'wechat'">
          <text>微信支付（Android）</text>
          <x-radio :checked="payMethod === 'wechat'" />
        </view>
      </x-card>
    </block>

    <!-- ============ 18b 支付结果 ============ -->
    <block v-else>
      <view class="mb-result">
        <view class="mb-result__icon">
          <text v-if="payResult === 'success'" class="mb-result__emoji">
            ✅
          </text>
          <x-icon v-else-if="payResult === 'fail'" name="alert" :size="128" color="#FA5151" />
          <x-icon v-else name="x" :size="128" color="#8A93A5" />
        </view>
        <view class="mb-result__title">
          {{ resultTitle }}
        </view>
        <view class="x-sub mb-result__sub">
          {{ resultSub }}
        </view>
        <x-card>
          <x-field label="套餐" :value="resultPlanName" />
          <x-field label="实付" :value="resultPaid" :tone="payResult === 'success' ? 'primary' : ''" />
          <x-field label="下次扣费" :value="resultNext" />
          <x-field label="订单号" value="XQ202610300001" last />
        </x-card>
        <view class="x-btns">
          <x-button :text="payResult === 'success' ? '开始使用' : '重新开通'" @click="handleContinue" />
          <x-button type="ghost" text="返回方案" @click="showResult = false" />
        </view>
        <view class="x-sub mb-result__tip">
          扣费失败或取消时，权益保留至到期日
        </view>
        <view class="mb-preview">
          <text>本地模拟支付结果预览：</text>
          <text class="mb-preview__link" @tap="previewResult('success')">
            成功
          </text>
          <text class="mb-preview__link" @tap="previewResult('fail')">
            失败
          </text>
          <text class="mb-preview__link" @tap="previewResult('close')">
            关闭
          </text>
        </view>
      </view>
    </block>

    <!-- 底部 sticky：仅方案页 -->
    <template v-if="!showResult" #sticky>
      <view class="x-btns row">
        <block v-if="settingStore.isMember">
          <x-button text="立即续费 · ¥48/年" @click="handlePay" />
          <x-button type="ghost" text="关闭自动续费" @click="handleCloseRenew" />
        </block>
        <x-button v-else :disabled="selectedPlanObj.baseline" :text="ctaText" @click="handlePay" />
      </view>
      <view class="mb-cta-note">
        {{ ctaNote }}
      </view>
    </template>
  </x-page>
</template>

<script setup lang="ts">
import type { PlanLevel } from '@/store/modules/setting/types';
import { usePermission } from '@/hooks';
import { useSettingStore } from '@/store';
import { addDays, dotDate } from '@/utils/date';

type PayResultState = 'success' | 'fail' | 'close';
type PayMethod = 'apple' | 'wechat';

interface PlanFeature {
  on: boolean;
  text: string;
}

interface Plan {
  key: string;
  name: string;
  price: string;
  unit: string;
  note: string;
  baseline: boolean;
  hot: boolean;
  badge?: string;
  feats: PlanFeature[];
}

interface CompareRow {
  label: string;
  free: boolean;
  freeText: string;
  pro: boolean;
  proText: string;
}

// 会员档位（家庭组 / 会员年费）文案：B 的 PlanLevel 只有 free/member，档位区分在此页面内持久化
const PLAN_TIER_KEY = 'member_plan_tier';
type PlanTier = 'pro' | 'family';

const settingStore = useSettingStore();

const showResult = ref(false);
const payResult = ref<PayResultState>('success');
const payMethod = ref<PayMethod>('apple');
const selected = ref<string>('pro');
const planTier = ref<PlanTier>((uni.getStorageSync(PLAN_TIER_KEY) as PlanTier) || 'pro');

const plans: Plan[] = [
  {
    key: 'free',
    name: '免费版',
    price: '¥0',
    unit: '',
    note: '当前基线 · 不可选',
    baseline: true,
    hot: false,
    feats: [
      { on: true, text: '全部基础功能' },
      { on: true, text: 'AI 识别 10 次/月' },
      { on: true, text: '本地存储' },
      { on: false, text: '云同步' },
      { on: false, text: '消耗报表' },
    ],
  },
  {
    key: 'pro',
    name: '会员',
    price: '¥48',
    unit: '/年',
    note: '≈ ¥4/月',
    badge: '推荐',
    baseline: false,
    hot: true,
    feats: [
      { on: true, text: 'AI 识别无限次' },
      { on: true, text: '云同步 + 多端' },
      { on: true, text: '消耗/浪费报表' },
      { on: true, text: '历史永久保留' },
      { on: true, text: '专属主题' },
    ],
  },
  {
    key: 'family',
    name: '家庭组',
    price: '¥68',
    unit: '/年',
    note: '6 人均摊 ¥11',
    baseline: false,
    hot: false,
    feats: [
      { on: true, text: '含会员全部权益' },
      { on: true, text: '6 人共享' },
      { on: true, text: '一人付费全家用' },
      { on: true, text: '跨成员提醒转发' },
      { on: false, text: '不含专属主题' },
    ],
  },
];

const compareRows: CompareRow[] = [
  { label: 'AI 识别额度', free: true, freeText: '10 次/月', pro: true, proText: '无限次' },
  { label: '云同步', free: false, freeText: '—', pro: true, proText: '多端同步' },
  { label: '消耗报表', free: false, freeText: '—', pro: true, proText: '月度浪费报表' },
  { label: '服药/到期提醒', free: true, freeText: '免费', pro: true, proText: '免费' },
];

const selectedPlanObj = computed<Plan>(() => plans.find(p => p.key === selected.value) || plans[1]!);

const ctaText = computed<string>(() =>
  selected.value === 'family' ? '开通家庭组 · ¥68/年' : '开通会员 · ¥48/年 · 首月 ¥1 试用');
const ctaNote = computed<string>(() =>
  selected.value === 'family' ? '选中家庭组时文案为「开通家庭组 · ¥68/年」' : '首月 ¥1 试用，试用到期前 3 天提醒');

const expireText = computed<string>(() => dotDate(settingStore.planExpireAt || addDays(365)));
const planTitle = computed<string>(() => (planTier.value === 'family' ? '家庭组' : '会员年费'));

const autoRenewProxy = computed<boolean>({
  get: () => settingStore.autoRenew,
  set: (value: boolean) => settingStore.patch({ autoRenew: value }),
});

const resultTitle = computed<string>(() =>
  payResult.value === 'success' ? '开通成功' : payResult.value === 'fail' ? '支付失败' : '已取消支付');
const resultSub = computed<string>(() =>
  payResult.value === 'success'
    ? '会员权益已生效，AI 识别已升级为无限次。'
    : payResult.value === 'fail'
      ? '扣费未成功，本次开通未生效，权益保留至到期日。'
      : '你已关闭支付页，本次未开通，权益保留至到期日。');
const resultPlanName = computed<string>(() => `${selectedPlanObj.value.name}年费`);
const resultPaid = computed<string>(() =>
  payResult.value === 'success' ? '¥1（首月试用）' : payResult.value === 'fail' ? '¥0（未扣费）' : '¥0（未支付）');
const resultNext = computed<string>(() => {
  const date = dotDate(addDays(365));
  return payResult.value === 'success' ? `${date} · ¥48/年` : '—';
});

// 距到期天数：驱动到期提醒横幅文案
const daysLeft = computed<number>(() => {
  const dateStr = settingStore.planExpireAt;
  if (!dateStr) {
    return Number.NaN;
  }
  const target = new Date(`${dateStr.replace(/-/g, '/')} 00:00:00`).getTime();
  const base = new Date(`${addDays(0).replace(/-/g, '/')} 00:00:00`).getTime();
  return Math.round((target - base) / 86400000);
});

function selectPlan(plan: Plan): void {
  if (plan.baseline) {
    uni.showToast({ title: '免费版为基线，不可选', icon: 'none' });
    return;
  }
  selected.value = plan.key;
}

// 本地模拟支付：成功即写入会员态（无后端，接口应在真实项目里替换此处）
function handlePay(): void {
  if (selectedPlanObj.value.baseline) {
    return;
  }
  const tier: PlanTier = selected.value === 'family' ? 'family' : 'pro';
  planTier.value = tier;
  uni.setStorageSync(PLAN_TIER_KEY, tier);
  settingStore.patch({
    plan: 'member' as PlanLevel,
    planExpireAt: addDays(365),
    autoRenew: true,
    quotaTotal: 9999,
    quotaUsed: 0,
  });
  payResult.value = 'success';
  showResult.value = true;
}

function handleCloseRenew(): void {
  settingStore.patch({ autoRenew: false });
  uni.showToast({ title: '已关闭自动续费', icon: 'none' });
}

// 结果态预览（本地状态机演示，不落库）
function previewResult(type: PayResultState): void {
  payResult.value = type;
}

function handleContinue(): void {
  if (payResult.value === 'success') {
    uni.navigateBack();
  }
  else {
    showResult.value = false;
  }
}

function handleRestorePurchase(): void {
  uni.showToast({ title: '正在恢复购买…', icon: 'none' });
}

onShow(async () => {
  // 未登录时由 hooks/use-permission 处理跳转
  await usePermission();
});
</script>

<style lang="scss" scoped>
.mb-sec {
  margin-bottom: 16rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: var(--color-text);
}

.mb-sec--sub {
  margin-top: 24rpx;
}

.mb-renew-tip {
  margin: -8rpx 0 24rpx;
  text-align: center;
}

.mb-cmp {
  display: flex;
  align-items: center;
  padding: 18rpx 0;
  font-size: 24rpx;
  border-bottom: 2rpx solid var(--color-divider);
}

.mb-cmp:last-child {
  border-bottom: none;
}

.mb-cmp__label {
  flex: 1.2;
  color: var(--color-text);
}

.mb-cmp__free,
.mb-cmp__pro {
  flex: 1;
  text-align: center;
}

.mb-cmp__free.on,
.mb-cmp__pro.on {
  font-weight: 600;
  color: var(--color-success-text);
}

.mb-cmp__free.off,
.mb-cmp__pro.off {
  color: var(--color-icon-off);
}

.mb-plans {
  display: flex;
  gap: 16rpx;
  align-items: stretch;
  margin-bottom: 24rpx;
}

.mb-plan {
  position: relative;
  box-sizing: border-box;
  flex: 1;
  padding: 40rpx 16rpx 24rpx;
  background: var(--color-card);
  border: 3rpx solid var(--color-border);
  border-radius: 32rpx;
}

.mb-plan.baseline {
  border-style: dashed;
  opacity: 0.7;
}

.mb-plan.hot {
  background: var(--color-primary-bg);
  border-color: var(--color-primary);
}

.mb-plan.sel {
  border-color: var(--color-primary);
  box-shadow: 0 8rpx 28rpx rgb(79 124 255 / 15%);
}

.mb-plan__badge {
  position: absolute;
  top: -14rpx;
  left: 50%;
  padding: 4rpx 20rpx;
  font-size: 20rpx;
  color: #ffffff;
  background: var(--color-warning-strong);
  border-radius: 20rpx;
  transform: translateX(-50%);
}

.mb-plan__check {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40rpx;
  height: 40rpx;
  background: var(--color-card);
  border: 4rpx solid var(--color-switch-off);
  border-radius: 50%;
}

.mb-plan__check.on {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.mb-plan__name {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--color-text);
}

.mb-plan__price {
  margin-top: 8rpx;
  font-size: 40rpx;
  font-weight: 800;
  color: var(--color-primary);
}

.mb-plan.baseline .mb-plan__price {
  color: var(--color-text-sub);
}

.mb-plan__unit {
  font-size: 22rpx;
  font-weight: 500;
}

.mb-plan__note {
  margin-bottom: 12rpx;
  font-size: 20rpx;
  color: var(--color-text-sub);
}

.mb-plan__feat {
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.5;
  color: var(--color-text);
}

.mb-plan__feat.dim {
  color: var(--color-text-mute);
}

.mb-pay {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--h-touch);
  padding: 16rpx 0;
  font-size: var(--fs-body);
  color: var(--color-text);
  border-bottom: 2rpx solid var(--color-divider);
}

.mb-pay:last-child {
  border-bottom: none;
}

.mb-cta-note {
  margin-top: 12rpx;
  font-size: 22rpx;
  color: var(--color-text-sub);
  text-align: center;
}

.mb-result {
  display: flex;
  flex-direction: column;
  padding-top: 40rpx;
  text-align: center;
}

.mb-result__emoji {
  font-size: 128rpx;
  line-height: 1.2;
}

.mb-result__title {
  margin: 24rpx 0 12rpx;
  font-size: 40rpx;
  font-weight: 700;
  color: var(--color-text);
}

.mb-result__sub {
  line-height: 1.7;
}

.mb-result__tip {
  margin-top: 20rpx;
  text-align: center;
}

.mb-preview {
  margin-top: 32rpx;
  font-size: 22rpx;
  color: var(--color-text-sub);
  text-align: center;
}

.mb-preview__link {
  margin-left: 16rpx;
  font-weight: 600;
  color: var(--color-primary);
}
</style>
