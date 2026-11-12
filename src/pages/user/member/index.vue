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
      <block v-if="isMember">
        <x-banner :text="`⏰ 会员将于 ${expireText} 到期${Number.isNaN(daysLeft) ? '' : `（剩 ${daysLeft} 天）`}，到期后 AI 识别恢复为 10 次/月。`" />
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
      <view v-if="plans.length" class="mb-plans">
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
      <x-note v-else>
        暂无可购买的会员方案，请稍后重试。
      </x-note>

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
          <text v-else-if="payResult === 'pending'" class="mb-result__emoji">
            ⏳
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
          <x-field label="订单号" :value="orderNo || '—'" last />
        </x-card>
        <view class="x-btns">
          <x-button :text="payResult === 'success' ? '开始使用' : '重新选择方案'" @click="handleContinue" />
          <x-button type="ghost" text="返回方案" @click="showResult = false" />
        </view>
        <view class="x-sub mb-result__tip">
          扣费失败或取消时，权益保留至到期日
        </view>
      </view>
    </block>

    <!-- 底部 sticky：仅方案页 -->
    <template v-if="!showResult" #sticky>
      <view class="x-btns row">
        <block v-if="isMember">
          <x-button :text="`立即续费 · ${selectedPlanObj.price}${selectedPlanObj.unit}`" @click="handlePay" />
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
import type { MemberSubscriptionVo, MemberTierVo } from '@/api/xiaoqi/member';
import { MemberApi } from '@/api/xiaoqi/member';
import { usePermission } from '@/hooks';

type PayResultState = 'success' | 'fail' | 'close' | 'pending';
type PayMethod = 'apple' | 'wechat';

interface PlanFeature {
  on: boolean;
  text: string;
}

interface Plan {
  key: string;
  /** 方案ID（下单用） */
  id?: number | string;
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

const showResult = ref(false);
const payResult = ref<PayResultState>('pending');
const payMethod = ref<PayMethod>('apple');
const selected = ref<string>('');
const orderNo = ref<string>('');

const tiers = ref<MemberTierVo[]>([]);
const subscription = ref<MemberSubscriptionVo | null>(null);

/** 金额：去掉无意义的小数零 */
function formatMoney(value?: number): string {
  const num = Number(value ?? 0);
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
}

/** 权益 JSON → 可读条目；后端存的是对象（如 {"ai_quota":-1,"cloud_sync":1}） */
function parseFeats(json?: string): PlanFeature[] {
  if (!json) {
    return [];
  }
  let data: Record<string, unknown>;
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed.map(item => ({ on: true, text: String(item) }));
    }
    data = parsed as Record<string, unknown>;
  }
  catch {
    return [];
  }
  const feats: PlanFeature[] = [];
  const num = (key: string): number | undefined => (data[key] == null ? undefined : Number(data[key]));
  const quota = num('ai_quota');
  if (quota != null) {
    feats.push({ on: true, text: quota < 0 ? 'AI 识别无限次' : `AI 识别 ${quota} 次` });
  }
  const cloud = num('cloud_sync');
  if (cloud != null) {
    feats.push({ on: cloud === 1, text: cloud === 1 ? '云同步 + 多端' : '不含云同步' });
  }
  const report = num('report');
  if (report != null) {
    feats.push({ on: report === 1, text: report === 1 ? '消耗/浪费报表' : '不含消耗报表' });
  }
  const history = num('history');
  if (history != null && history === 1) {
    feats.push({ on: true, text: '历史永久保留' });
  }
  const theme = num('theme');
  if (theme != null && theme === 1) {
    feats.push({ on: true, text: '专属主题' });
  }
  const family = num('family');
  if (family != null && family > 0) {
    feats.push({ on: true, text: `${family} 人共享` });
  }
  return feats;
}

const plans = computed<Plan[]>(() => tiers.value.map(tier => ({
  key: tier.planCode,
  id: tier.id,
  name: tier.planName,
  price: `¥${formatMoney(tier.price)}`,
  unit: tier.durationDays ? `/${tier.durationDays}天` : '',
  note: tier.memberCount && tier.memberCount > 1 ? `${tier.memberCount} 人共享` : '个人使用',
  baseline: tier.planType === 0,
  hot: tier.planType === 1,
  badge: tier.planType === 1 ? '推荐' : undefined,
  feats: parseFeats(tier.featuresJson),
})));

const compareRows: CompareRow[] = [
  { label: 'AI 识别额度', free: true, freeText: '10 次/月', pro: true, proText: '无限次' },
  { label: '云同步', free: false, freeText: '—', pro: true, proText: '多端同步' },
  { label: '消耗报表', free: false, freeText: '—', pro: true, proText: '月度浪费报表' },
  { label: '服药/到期提醒', free: true, freeText: '免费', pro: true, proText: '免费' },
];

const selectedPlanObj = computed<Plan>(() => plans.value.find(p => p.key === selected.value) || plans.value[0] || {
  key: '',
  name: '会员',
  price: '¥0',
  unit: '',
  note: '',
  baseline: true,
  hot: false,
  feats: [],
});

/** 是否有效会员：以服务端订阅为准 */
const isMember = computed<boolean>(() => !!subscription.value?.endTime);

const ctaText = computed<string>(() =>
  selectedPlanObj.value.baseline ? '免费版无需开通' : `开通 ${selectedPlanObj.value.name} · ${selectedPlanObj.value.price}${selectedPlanObj.value.unit}`);
const ctaNote = computed<string>(() =>
  selectedPlanObj.value.baseline ? '免费版为当前基线，不可购买' : '权益自支付成功后立即生效');

const expireText = computed<string>(() => String(subscription.value?.endTime || '').slice(0, 10));
const planTitle = computed<string>(() => {
  const tier = tiers.value.find(item => String(item.id) === String(subscription.value?.planId));
  return tier?.planName || '会员';
});

const autoRenewProxy = computed<boolean>({
  get: () => subscription.value?.autoRenew === 1,
  set: async (value: boolean) => {
    try {
      await MemberApi.switchAutoRenew(value);
      if (subscription.value) {
        subscription.value.autoRenew = value ? 1 : 0;
      }
      uni.showToast({ title: value ? '已开启自动续费' : '已关闭自动续费', icon: 'none' });
    }
    catch (error: any) {
      uni.showToast({ title: error?.msg || '设置失败', icon: 'none' });
    }
  },
});

const resultTitle = computed<string>(() => {
  if (payResult.value === 'success') {
    return '开通成功';
  }
  if (payResult.value === 'pending') {
    return '订单待支付';
  }
  return payResult.value === 'fail' ? '支付失败' : '已取消支付';
});
const resultSub = computed<string>(() => {
  if (payResult.value === 'success') {
    return '会员权益已生效，AI 识别已升级为无限次。';
  }
  if (payResult.value === 'pending') {
    return '订单已创建并保存为待支付，支付通道接入后完成扣费即自动开通。';
  }
  return payResult.value === 'fail'
    ? '扣费未成功，本次开通未生效，权益保留至到期日。'
    : '你已关闭支付页，本次未开通，权益保留至到期日。';
});
const resultPlanName = computed<string>(() => `${selectedPlanObj.value.name}${selectedPlanObj.value.unit}`);
const resultPaid = computed<string>(() =>
  payResult.value === 'pending' ? `${selectedPlanObj.value.price}（待支付）` : '¥0');
const resultNext = computed<string>(() => (payResult.value === 'success' ? `${expireText.value || '—'} · 自动续费` : '—'));

// 距到期天数：驱动到期提醒横幅文案
const daysLeft = computed<number>(() => {
  const end = subscription.value?.endTime;
  if (!end) {
    return Number.NaN;
  }
  const target = new Date(String(end).replace(/-/g, '/')).getTime();
  if (Number.isNaN(target)) {
    return Number.NaN;
  }
  return Math.ceil((target - Date.now()) / 86400000);
});

function selectPlan(plan: Plan): void {
  if (plan.baseline) {
    uni.showToast({ title: '免费版为基线，不可选', icon: 'none' });
    return;
  }
  selected.value = plan.key;
}

/** 下单：服务端按 planId 回查金额，支付通道未接入时订单落库为待支付 */
async function handlePay(): Promise<void> {
  const plan = selectedPlanObj.value;
  if (plan.baseline || plan.id == null) {
    return;
  }
  uni.showLoading({ title: '创建订单', mask: true });
  try {
    const no = await MemberApi.createOrder({
      planId: plan.id,
      // 支付渠道 0 iOS 内购 / 1 微信
      payChannel: payMethod.value === 'apple' ? 0 : 1,
      autoRenew: 1,
    });
    orderNo.value = no;
    uni.hideLoading();
    payResult.value = 'pending';
    showResult.value = true;
  }
  catch (error: any) {
    uni.hideLoading();
    uni.showToast({ title: error?.msg || '下单失败', icon: 'none' });
  }
}

async function handleCloseRenew(): Promise<void> {
  try {
    await MemberApi.switchAutoRenew(false);
    if (subscription.value) {
      subscription.value.autoRenew = 0;
    }
    uni.showToast({ title: '已关闭自动续费', icon: 'none' });
  }
  catch (error: any) {
    uni.showToast({ title: error?.msg || '设置失败', icon: 'none' });
  }
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
  uni.showToast({ title: 'App 内购恢复需在正式包中使用', icon: 'none' });
}

/** 拉在售方案与当前订阅 */
async function loadMember(): Promise<void> {
  try {
    const [tierList, sub] = await Promise.all([
      MemberApi.tiers(),
      MemberApi.currentSubscription(),
    ]);
    tiers.value = tierList || [];
    subscription.value = sub || null;
    if (!selected.value) {
      const first = plans.value.find(plan => !plan.baseline);
      selected.value = first?.key || plans.value[0]?.key || '';
    }
  }
  catch (error: any) {
    uni.showToast({ title: error?.msg || '会员信息加载失败', icon: 'none' });
  }
}

onShow(async () => {
  // 未登录时由 hooks/use-permission 处理跳转
  const ok = await usePermission();
  if (!ok) {
    return;
  }
  await loadMember();
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
