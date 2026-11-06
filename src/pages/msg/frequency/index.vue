<template>
  <x-page>
    <x-nav-bar title="通知频控" right-text="恢复默认" @right="handleReset" />

    <!-- 实时预估 -->
    <view class="fq-digest">
      <text class="fq-digest__k">
        当前策略下，你平均每天会收到
      </text>
      <view class="fq-digest__num">
        <text>{{ predictedTotal }} 条</text>
        <text class="fq-digest__unit">
          推送
        </text>
      </view>
      <text class="fq-digest__k">
        {{ predictedDetail }} · 改动即时更新
      </text>
    </view>

    <x-note type="blue">
      🌙 免打扰 {{ silentText }} · 当前 badge 为 P0 未读数（{{ unreadP0 }}），总未读 {{ unreadTotal }} 条。
    </x-note>

    <!-- 必达类 -->
    <x-card>
      <view class="x-section-title">
        🚨 必达类
      </view>
      <x-field label="💊 服药提醒">
        <x-switch :checked="switches.pill" @change="(value: boolean) => setSwitch('pillRemind', value)" />
      </x-field>
      <x-field label="🔴 药品已过期" last>
        <x-switch :checked="switches.expired" @change="(value: boolean) => setSwitch('expiredAlert', value)" />
      </x-field>
      <x-note type="red">
        ⚠️ 关闭服药提醒后不再推送，但仍可在 App 内查看待服清单。
      </x-note>
      <x-note type="purple">
        💡 P0 必达类（服药提醒、药品已过期）不进摘要、不做合并，也不受每日上限与免打扰时段约束。
      </x-note>
    </x-card>

    <!-- 摘要类 -->
    <x-card>
      <view class="x-section-title">
        📬 聚合进摘要
      </view>
      <x-field label="⚠️ 物品临期">
        <x-switch :checked="switches.expiring" @change="(value: boolean) => setSwitch('expiringDigest', value)" />
      </x-field>
      <x-field label="⏰ 漏服二次提醒">
        <x-switch :checked="switches.missedAgain" @change="(value: boolean) => setSwitch('missedSecond', value)" />
      </x-field>
      <x-field :value="digestTime" label="摘要时间" tone="primary" chevron last @click="openTime('digestTime')" />
    </x-card>

    <!-- 每日上限 + 免打扰 -->
    <x-card>
      <view class="x-section-title">
        📉 每日上限与时段
      </view>
      <x-field label="非必达消息上限">
        <view class="fq-chips">
          <x-chip
            v-for="item in limitOptions"
            :key="item.value"
            small
            :text="item.label"
            :active="dailyLimit === item.value"
            @click="setLimit(item.value)"
          />
        </view>
      </x-field>
      <x-field :value="silentStart" label="免打扰起始" tone="primary" chevron @click="openTime('silentStart')" />
      <x-field :value="silentEnd" label="免打扰结束" tone="primary" chevron last @click="openTime('silentEnd')" />
      <x-note type="blue">
        💡 超出上限的临期/摘要消息合并进次日 {{ digestTime }} 摘要；免打扰时段内只静音 P1/P2，服药提醒照常推送。
      </x-note>
    </x-card>

    <!-- 临时静音 -->
    <view class="fq-dashed">
      <view class="fq-dashed__row">
        <view class="x-flex-1">
          <view class="fq-dashed__k">
            ✈️ 临时静音
          </view>
          <view class="fq-dashed__sub">
            出差/住院暂停推送，服药提醒仍保留
          </view>
        </view>
        <x-switch :checked="temporaryMute" @change="(value: boolean) => setSwitch('temporaryMute', value)" />
      </view>
      <view v-if="temporaryMute" class="fq-dashed__on">
        已静音 P1/P2 推送 · P0 服药提醒仍会响
      </view>
    </view>

    <!-- 快捷模式 -->
    <x-card>
      <view class="x-section-title">
        ⚡ 快捷模式 · 三选一
      </view>
      <view
        v-for="item in modeOptions"
        :key="item.key"
        class="fq-mode"
        hover-class="fq-mode--hover"
        @tap="setMode(item.key)"
      >
        <text class="fq-mode__k">
          {{ item.label }}
        </text>
        <x-radio :checked="freqMode === item.key" />
      </view>
      <view v-if="freqMode === 'custom'" class="fq-mode">
        <text class="fq-mode__k">
          自定义（已手动调整过开关）
        </text>
        <x-radio checked />
      </view>
      <x-note type="blue">
        💡 选「零打扰」时，服药提醒仍保留系统通知（不可关闭），仅关闭摘要与兜底推送。
      </x-note>
    </x-card>

    <!-- 长辈模式说明入口 -->
    <x-card>
      <x-cell
        icon="users"
        chevron
        title="长辈模式下的简化说明"
        subtitle="字更大、每天只留 1 条摘要，打卡只有一个大按钮"
        :tag="isElder ? '已开启' : ''"
        tag-type="green"
        last
        @click="elderOpen = true"
      />
    </x-card>

    <x-button type="ghost" text="去看今日消息" icon="msg" @click="gotoMessage" />

    <!-- 时间选择弹层（复用 22 组件） -->
    <x-time-picker
      v-model="timePicker.value"
      v-model:show="timePicker.show"
      :title="timePicker.target === 'digestTime' ? '选择摘要推送时间' : '选择免打扰时间'"
      :sub="timePicker.target === 'digestTime' ? '每天这个时间合并推送 1 条摘要' : '该时段内不推送摘要与兜底消息'"
      @confirm="applyTime"
    />

    <!-- 长辈模式简化说明 -->
    <x-sheet v-model:show="elderOpen" mode="center" title="给长辈看的说明">
      <view class="fq-elder">
        <text class="fq-elder__line">
          1. 到点手机会响，点开大按钮「我吃了」就行。
        </text>
        <text class="fq-elder__line">
          2. 忘记吃药会有红色提醒，其它消息一天只汇总一次。
        </text>
        <text class="fq-elder__line">
          3. 不想被打扰：选「零打扰」，吃药提醒仍会保留。
        </text>
      </view>
      <template #footer>
        <view class="x-btns row">
          <x-button type="ghost" text="切换长辈模式" @click="toggleElder" />
          <x-button text="知道了" @click="elderOpen = false" />
        </view>
      </template>
    </x-sheet>
  </x-page>
</template>

<script setup lang="ts">
import type { FreqMode } from '@/store/modules/setting/types';
import { usePermission } from '@/hooks';
import { switchTabPath } from '@/router/tab-bar';
import { useMedicineStore, useMessageStore, useSettingStore } from '@/store';

/**
 * 快捷模式档位：零打扰对应 store 的 silent，极简与「自定义」只在页面配置里细分
 */
type FreqModeKey = 'standard' | 'simple' | 'quiet' | 'custom';
type FreqSwitchKey = 'pillRemind' | 'expiredAlert' | 'expiringDigest' | 'missedSecond' | 'temporaryMute';
type TimeTarget = 'digestTime' | 'silentStart' | 'silentEnd';

interface FreqConfig {
  pillRemind: boolean;
  expiredAlert: boolean;
  expiringDigest: boolean;
  missedSecond: boolean;
  digestTime: string;
  dailyLimit: number;
  temporaryMute: boolean;
  mode: FreqModeKey;
}

interface FreqOption {
  value: number;
  label: string;
}

interface ModeOption {
  key: FreqModeKey;
  label: string;
}

const settingStore = useSettingStore();
const messageStore = useMessageStore();
const medicineStore = useMedicineStore();

// setting store 只内置 freqMode / silentUntil，其余频控细项存页面本地配置
const FREQ_CONFIG_KEY = 'msg_freq_config';
const SILENT_DEFAULT = '23:00-07:00';

const DEFAULTS: FreqConfig = {
  pillRemind: true,
  expiredAlert: true,
  expiringDigest: true,
  missedSecond: false,
  digestTime: '09:00',
  dailyLimit: 5,
  temporaryMute: false,
  mode: 'standard',
};

const limitOptions: FreqOption[] = [
  { value: 3, label: '3 条' },
  { value: 5, label: '5 条' },
  { value: 8, label: '8 条' },
  { value: 0, label: '不限' },
];

const modeOptions: ModeOption[] = [
  { key: 'standard', label: '标准（约 3 条/天）' },
  { key: 'simple', label: '极简（约 1 条摘要/天）' },
  { key: 'quiet', label: '零打扰（全部 App 内）' },
];

const modeLabels: Record<FreqModeKey, string> = {
  standard: '标准',
  simple: '极简',
  quiet: '零打扰',
  custom: '自定义',
};

function isValid(time: string) {
  return /^\d{2}:\d{2}$/.test(String(time || ''));
}

/**
 * 读本地频控配置，首次进入时用 store 的 freqMode 兜底
 */
function readFreqConfig(): FreqConfig {
  const saved = (uni.getStorageSync(FREQ_CONFIG_KEY) || {}) as Partial<FreqConfig>;
  const config: FreqConfig = { ...DEFAULTS, ...saved };
  if (!saved.mode) {
    if (settingStore.freqMode === 'silent') config.mode = 'quiet';
    if (settingStore.freqMode === 'custom') config.mode = 'custom';
  }
  return config;
}

const config = reactive<FreqConfig>(readFreqConfig());
const timePicker = reactive<{ show: boolean; target: TimeTarget | ''; value: string }>({
  show: false,
  target: '',
  value: '09:00',
});
const elderOpen = ref<boolean>(false);

function persist() {
  uni.setStorageSync(FREQ_CONFIG_KEY, { ...config });
}

const freqMode = computed<FreqModeKey>(() => config.mode);
const digestTime = computed<string>(() => config.digestTime || DEFAULTS.digestTime);
const dailyLimit = computed<number>(() => config.dailyLimit);
const temporaryMute = computed<boolean>(() => config.temporaryMute === true);
const isElder = computed<boolean>(() => settingStore.isElder);
const unreadP0 = computed<number>(() => messageStore.unreadP0);
const unreadTotal = computed<number>(() => messageStore.unreadTotal);

const switches = computed(() => ({
  pill: config.pillRemind !== false,
  expired: config.expiredAlert !== false,
  expiring: config.expiringDigest !== false,
  missedAgain: config.missedSecond === true,
}));

const silentPair = computed<[string, string]>(() => {
  const raw = String(settingStore.silentUntil || SILENT_DEFAULT).split('-');
  return [isValid(raw[0]) ? raw[0] : '23:00', isValid(raw[1]) ? raw[1] : '07:00'];
});
const silentStart = computed<string>(() => silentPair.value[0]);
const silentEnd = computed<string>(() => silentPair.value[1]);
const silentText = computed<string>(() => `${silentStart.value}–${silentEnd.value}`);

const mustCount = computed<number>(() => (switches.value.pill ? messageStore.mustList.length : 0));
const digestCount = computed<number>(() => {
  if (freqMode.value === 'quiet' || !switches.value.expiring) {
    return 0;
  }
  if (freqMode.value === 'simple') {
    return 1;
  }
  return messageStore.digestList.filter(item => item.group === 'digest').length;
});
const extraCount = computed<number>(() => {
  if (freqMode.value !== 'standard' || !switches.value.missedAgain) {
    return 0;
  }
  return medicineStore.missedList.length > 0 ? 1 : 0;
});
const predictedTotal = computed<number>(() => mustCount.value + digestCount.value + extraCount.value);
const predictedDetail = computed<string>(
  () => `${mustCount.value} 服药 + ${digestCount.value} 摘要 + ${extraCount.value} 兜底`,
);

/**
 * 页面档位写回 store 的三档枚举：极简仍按标准节奏，细分档位留在本地配置
 */
function toStoreFreqMode(mode: FreqModeKey): FreqMode {
  if (mode === 'quiet') return 'silent';
  if (mode === 'custom') return 'custom';
  return 'standard';
}

function setSwitch(key: FreqSwitchKey, value: boolean) {
  // 临时静音是短期开关，不改变快捷模式
  if (key === 'temporaryMute') {
    config.temporaryMute = value;
    persist();
    uni.showToast({ title: value ? '已暂停摘要推送' : '已恢复摘要推送', icon: 'none' });
    return;
  }
  config[key] = value;
  config.mode = 'custom';
  persist();
  settingStore.patch({ freqMode: 'custom' });
}

function setLimit(value: number) {
  config.dailyLimit = Number(value);
  persist();
}

function setMode(key: FreqModeKey) {
  config.mode = key;
  persist();
  settingStore.patch({ freqMode: toStoreFreqMode(key) });
  uni.showToast({ title: `已切换为${modeLabels[key]}模式`, icon: 'none' });
}

function openTime(target: TimeTarget) {
  timePicker.target = target;
  timePicker.value
    = target === 'digestTime' ? digestTime.value : target === 'silentStart' ? silentStart.value : silentEnd.value;
  timePicker.show = true;
}

// 时间确认后按目标字段写回（silentStart / silentEnd 组合成 silentUntil 区间）
function applyTime(value: string) {
  if (!isValid(value)) {
    return;
  }
  if (timePicker.target === 'digestTime') {
    config.digestTime = value;
    persist();
    return;
  }
  const next = timePicker.target === 'silentStart' ? [value, silentEnd.value] : [silentStart.value, value];
  settingStore.patch({ silentUntil: `${next[0]}-${next[1]}` });
}

function toggleElder() {
  const next = !isElder.value;
  settingStore.setElder(next);
  uni.showToast({ title: next ? '长辈模式已开启' : '长辈模式已关闭', icon: 'none' });
}

function handleReset() {
  Object.assign<FreqConfig, FreqConfig[]>(config, [{ ...DEFAULTS }]);
  persist();
  settingStore.patch({ freqMode: 'standard', silentUntil: SILENT_DEFAULT });
  uni.showToast({ title: '已恢复默认频控策略', icon: 'none' });
}

function gotoMessage() {
  switchTabPath('/pages/tab/message/index');
}

onShow(async () => {
  // onShow 阶段补校验路由权限（无权限时由 hooks/use-permission 处理跳转）
  await usePermission();
});
</script>

<style lang="scss" scoped>
.fq-digest {
  padding: 28rpx;
  margin-bottom: 24rpx;
  color: #ffffff;
  background: linear-gradient(135deg, #4f7cff, #7b5cff);
  border-radius: var(--radius-card);
}

.fq-digest__k {
  display: block;
  font-size: var(--fs-sub);
  opacity: 0.85;
}

.fq-digest__num {
  display: flex;
  gap: 12rpx;
  align-items: baseline;
  margin: 8rpx 0;
  font-size: 60rpx;
  font-weight: 800;
  line-height: 1.1;
}

.fq-digest__unit {
  font-size: var(--fs-sub);
  font-weight: 400;
  opacity: 0.8;
}

.fq-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  justify-content: flex-end;
  max-width: 420rpx;
}

.fq-dashed {
  padding: 24rpx 28rpx;
  margin-bottom: 24rpx;
  background: var(--color-note-bg);
  border: 3rpx dashed var(--color-note-border);
  border-radius: var(--radius-card);
}

.fq-dashed__row {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.fq-dashed__k {
  font-size: var(--fs-body);
  font-weight: 600;
  color: var(--color-text);
}

.fq-dashed__sub {
  margin-top: 4rpx;
  font-size: var(--fs-caption);
  color: var(--color-text-sub);
}

.fq-dashed__on {
  margin-top: 16rpx;
  font-size: var(--fs-caption);
  font-weight: 600;
  color: var(--color-warning-text);
}

.fq-mode {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--h-touch);
  padding: 22rpx 0;
  border-bottom: 2rpx solid var(--color-divider);
}

.fq-mode__k {
  font-size: var(--fs-body);
  color: var(--color-text);
}

.fq-mode--hover {
  opacity: 0.9;
}

.fq-elder {
  padding: 8rpx 0 16rpx;
}

.fq-elder__line {
  display: block;
  margin-bottom: 16rpx;
  font-size: var(--fs-body);
  line-height: 1.7;
  color: var(--color-text);
}
</style>
