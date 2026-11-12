<template>
  <x-page>
    <x-nav-bar :title="navTitle" :back="false">
      <template #left>
        <view class="rec-back" @click="onCancel">
          <x-icon name="x" :size="44" :color="navColor" />
        </view>
      </template>
    </x-nav-bar>

    <!-- 09 识别中 -->
    <view v-if="stage === 'recognizing'" class="rec">
      <view class="rec-view">
        <image v-if="photo" class="rec-view__img" :src="photo" mode="aspectFill" />
        <view v-else class="rec-view__lock">
          <text class="rec-view__emoji">
            🧴
          </text>
          <text class="rec-view__tip">
            照片已锁定
          </text>
        </view>
      </view>

      <x-card>
        <view class="rec-status">
          <view class="rec-spin" />
          <view class="x-flex-1">
            <view class="rec-status__main">
              {{ spinningText }}
            </view>
            <view class="x-sub">
              通常需要 2–3 秒
            </view>
          </view>
        </view>
        <view class="rec-seg">
          <view class="rec-seg__bar" style="background: #52c41a" />
          <view class="rec-seg__bar" style="background: #4f7cff" />
          <view class="rec-seg__bar" style="background: var(--color-border)" />
        </view>
      </x-card>

      <x-button type="gray" text="取消识别（不扣次数）" @click="onCancel" />

      <view style="margin-top: 20rpx">
        <x-note type="blue">
          💡 本月剩余
          <text class="rec-b">
            {{ quotaText }}
          </text>
          次（含预占 1 次）。规则：开始识别即预占 ·
          <text class="rec-b">
            确认保存才消耗
          </text>
          · 取消 / 重拍 / 完全失败自动释放。
        </x-note>
      </view>
    </view>

    <!-- 09b 低置信度：核对识别结果 -->
    <view v-else-if="stage === 'lowconf'" class="rec">
      <x-note type="red">
        ⚠️ 部分字段置信度较低，请手动核对。开始识别已预占 1 次 ·
        <text class="rec-b">
          确认保存才消耗
        </text>
        · 放弃则自动释放。
      </x-note>
      <x-card>
        <view class="rec-field">
          <text class="rec-field__k">
            名称
          </text>
          <view class="rec-field__v">
            <text>{{ result.name }}</text>
            <text class="rec-conf hi">
              ●97%
            </text>
          </view>
        </view>
        <view class="rec-field">
          <text class="rec-field__k">
            生产日期
          </text>
          <view class="rec-field__v">
            <text class="rec-lo">
              {{ result.produceDate }}
            </text>
            <text class="rec-conf lo">
              ●42%
            </text>
          </view>
        </view>
        <picker mode="date" :value="duePickerValue" @change="onDueChange">
          <view class="rec-field x-tap-bg" hover-class="x-tap--hover" :hover-start-time="0">
            <text class="rec-field__k">
              到期日
            </text>
            <view class="rec-field__v">
              <template v-if="result.dueDate">
                <text class="rec-blue">
                  {{ result.dueDate }} · 日历选择 ›
                </text>
              </template>
              <template v-else>
                <text class="rec-lo">
                  未识别
                </text>
                <text class="rec-conf lo">
                  需填写
                </text>
              </template>
            </view>
          </view>
        </picker>
        <view class="rec-field">
          <text class="rec-field__k">
            数量
          </text>
          <x-quantity
            :model-value="qty"
            editable
            :unit="qtyUnit"
            @update:model-value="(v: number) => (qty = Math.max(1, v || 1))"
            @decrease="qty = Math.max(1, qty - 1)"
            @increase="qty += 1"
          />
        </view>
      </x-card>
      <x-note type="blue">
        💡 点任一字段可手动修正；也可查看原图核对。
      </x-note>
      <view class="x-btns row rec-row rec-inline">
        <x-button class="rec-cell" type="ghost" icon="eye" text="查看原图" @click="previewPhoto" />
        <x-button class="rec-cell" type="ghost" icon="camera" text="重拍" @click="reshoot" />
      </view>
    </view>

    <!-- 09c 识别确认（识别成功） -->
    <view v-else-if="stage === 'ok'" class="rec">
      <x-note type="blue">
        ✨ AI 识别完成，请核对。开始识别已预占 1 次 ·
        <text class="rec-b">
          确认保存才消耗
        </text>
        · 取消则释放。
      </x-note>
      <x-card>
        <view class="rec-field">
          <text class="rec-field__k">
            名称
          </text>
          <view class="rec-field__v">
            <text>{{ result.name }}</text>
            <text class="rec-conf hi">
              ●97%
            </text>
          </view>
        </view>
        <view class="rec-field">
          <text class="rec-field__k">
            生产日期
          </text>
          <view class="rec-field__v">
            <text>{{ result.produceDate }}</text>
            <text class="rec-conf mid">
              ●74%
            </text>
          </view>
        </view>
        <picker mode="date" :value="duePickerValue" @change="onDueChange">
          <view class="rec-field x-tap-bg" hover-class="x-tap--hover" :hover-start-time="0">
            <text class="rec-field__k">
              到期日
            </text>
            <view class="rec-field__v">
              <text class="rec-blue">
                {{ result.dueDate || '未识别' }} · 日历选择 ›
              </text>
            </view>
          </view>
        </picker>
        <view class="rec-field">
          <text class="rec-field__k">
            数量
          </text>
          <x-quantity
            :model-value="qty"
            editable
            :unit="qtyUnit"
            @update:model-value="(v: number) => (qty = Math.max(1, v || 1))"
            @decrease="qty = Math.max(1, qty - 1)"
            @increase="qty += 1"
          />
        </view>
      </x-card>
      <x-card>
        <view class="rec-field">
          <text class="rec-field__k">
            谁可以看到
          </text>
          <view class="rec-vis">
            <x-chip small icon="lock" text="仅自己" :active="visibility === 'self'" @click="visibility = 'self'" />
            <x-chip small text="家人" :active="visibility === 'family'" @click="visibility = 'family'" />
          </view>
        </view>
        <view class="rec-field">
          <text class="rec-field__k">
            💊 是药品，需服药提醒
          </text>
          <x-switch :checked="needRemind" @update:checked="(v: boolean) => (needRemind = v)" />
        </view>
      </x-card>
    </view>

    <!-- 09b 识别失败 -->
    <view v-else-if="stage === 'failed'" class="rec">
      <view class="rec-state">
        <text class="rec-state__emoji">
          🔍
        </text>
        <text class="rec-state__title">
          没识别出有效信息
        </text>
        <text class="rec-state__sub">
          照片可能过暗或角度不佳。
          <br>
          本次识别已自动释放，不消耗次数。
        </text>
        <view class="x-btns" style="margin-top: 40rpx">
          <x-button type="primary" icon="camera" text="重拍" @click="reshoot" />
          <x-button type="ghost" icon="keyboard" text="手动输入" @click="toManual" />
        </view>
      </view>
    </view>

    <!-- 09d AI 额度耗尽 -->
    <view v-else-if="stage === 'quota'" class="rec rec-center">
      <text class="rec-state__emoji">
        🤖
      </text>
      <text class="rec-state__title">
        本月 AI 识别次数已用完
      </text>
      <text class="rec-state__sub">
        免费版每月 {{ quotaTotal }} 次，已用 {{ quotaTotal }} 次。
      </text>
      <text class="rec-state__sub">
        下月 1 日自动恢复；手动输入、扫条码、到期提醒
        <text class="rec-b">
          不受影响
        </text>
        。
      </text>
      <x-card>
        <view class="rec-perk">
          <text>💊 服药提醒</text>
          <x-tag type="green">
            永久免费
          </x-tag>
        </view>
        <view class="rec-perk">
          <text>🔔 到期提醒</text>
          <x-tag type="green">
            永久免费
          </x-tag>
        </view>
        <view class="rec-perk">
          <text>📤 数据导出</text>
          <x-tag type="green">
            永久免费
          </x-tag>
        </view>
        <view class="rec-perk">
          <text>🤖 AI 识别</text>
          <x-tag type="orange">
            本月 {{ quotaText }}
          </x-tag>
        </view>
      </x-card>
      <view class="x-btns">
        <x-button type="primary" text="升级会员 · AI 识别无限次" @click="goMember" />
        <x-button type="ghost" icon="keyboard" text="手动输入" @click="toManual" />
      </view>
      <text class="x-sub" style="margin-top: 24rpx; font-size: 22rpx">
        升级后立即生效，到期前 3 天提醒
      </text>
    </view>

    <!-- 吸底操作（必须在 x-page 直接子级，否则不会吸底） -->
    <template #sticky>
      <view v-if="stage === 'lowconf'" class="x-btns row x-safe-bottom rec-row rec-sticky">
        <x-button class="rec-cell" type="ghost" icon="keyboard" text="手动输入" @click="toManual" />
        <x-button class="rec-cell" type="primary" text="确认保存" @click="toConfirm" />
      </view>
      <view v-else-if="stage === 'ok'" class="x-btns row x-safe-bottom rec-row rec-sticky">
        <x-button class="rec-cell" type="ghost" text="重拍" @click="reshoot" />
        <x-button class="rec-cell" type="primary" text="确认保存" @click="toConfirm" />
      </view>
    </template>

    <!-- 调试态开关（供验收五态） -->
    <view class="rec-switch">
      <x-chip small :active="stage === 'recognizing'" text="识别中" @click="forceStage('recognizing')" />
      <x-chip small :active="stage === 'ok'" text="识别成功" @click="forceStage('ok')" />
      <x-chip small :active="stage === 'lowconf'" text="低置信度" @click="forceStage('lowconf')" />
      <x-chip small :active="stage === 'failed'" text="失败" @click="forceStage('failed')" />
      <x-chip small :active="stage === 'quota'" text="额度耗尽" @click="forceStage('quota')" />
    </view>
  </x-page>
</template>

<script setup lang="ts">
import { useTheme } from '@/hooks';
import { useSettingStore } from '@/store';
import { today } from '@/utils/date';

// recognizing | ok | lowconf | failed | quota
type Stage = 'recognizing' | 'ok' | 'lowconf' | 'failed' | 'quota';

const settingStore = useSettingStore();
const { isDark } = useTheme();

const stage = ref<Stage>('recognizing');
const photo = ref('');
const method = ref<string>('camera');
let occupied = false;
let keepOccupy = false;
let spinTimer: ReturnType<typeof setInterval> | null = null;
let resolveTimer: ReturnType<typeof setTimeout> | null = null;

const SPIN_TEXTS: string[] = ['正在识别效期位置…', '正在读取包装文字…', '正在匹配商品库…', '正在生成结构化结果…'];
const spinIndex = ref(0);
const spinningText = computed(() => SPIN_TEXTS[spinIndex.value % SPIN_TEXTS.length]);

const quotaText = computed(() => settingStore.quotaLeftText);
const quotaTotal = computed(() => settingStore.quotaTotal);
const navColor = computed(() => (isDark.value ? '#F0F2F6' : '#1A2233'));

const result = ref({
  name: '兰蔻小黑瓶精华面膜',
  produceDate: '2025.03.15',
  dueDate: '',
  spec: '1 盒 5 片',
});

// 09c 确认页的交互字段
const qty = ref<number>(1);
const visibility = ref<'self' | 'family'>('self');
const needRemind = ref<boolean>(true);

/** 到期日：识别结果用点分隔，picker 需要横杠；未识别时从今天开始选 */
const duePickerValue = computed<string>(() =>
  result.value.dueDate ? result.value.dueDate.replace(/\./g, '-') : today(),
);

/** 数量单位：从识别规格里去掉开头数量（「1 盒 5 片」→「盒 5 片」） */
const qtyUnit = computed<string>(() => result.value.spec.replace(/^\d+\s*/, ''));

function onDueChange(e: { detail: { value: string } }) {
  result.value.dueDate = e.detail.value.replace(/-/g, '.');
}

const NAV_TITLE: Record<Stage, string> = {
  recognizing: 'AI 识别中',
  ok: '确认信息',
  lowconf: '核对识别结果',
  failed: '识别失败',
  quota: 'AI 额度',
};
const navTitle = computed(() => NAV_TITLE[stage.value] || 'AI 识别中');

function occupy() {
  if (!occupied) {
    settingStore.preOccupyQuota();
    occupied = true;
  }
}
function release() {
  if (occupied) {
    settingStore.releaseQuota();
    occupied = false;
  }
}

function startSpin() {
  stopSpin();
  spinTimer = setInterval(() => {
    spinIndex.value += 1;
  }, 700);
}
function stopSpin() {
  if (spinTimer) {
    clearInterval(spinTimer);
    spinTimer = null;
  }
}

function runRecognize() {
  stage.value = 'recognizing';
  occupy();
  startSpin();
  stopResolve();
  resolveTimer = setTimeout(() => {
    stopSpin();
    // 演示：默认落到「低置信度」核对态
    stage.value = 'lowconf';
  }, 2400);
}
function stopResolve() {
  if (resolveTimer) {
    clearTimeout(resolveTimer);
    resolveTimer = null;
  }
}

function forceStage(next: Stage) {
  stopSpin();
  stopResolve();
  stage.value = next;
  if (next === 'recognizing') {
    occupy();
    startSpin();
  }
  else if (next === 'failed' || next === 'quota') {
    release();
  }
}

function chooseImage() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['camera', 'album'],
    success: (res) => {
      photo.value = res.tempFilePaths[0];
      runRecognize();
    },
    fail: () => {
      // 用户取消 / 权限被拒：不消耗，回退
      release();
      uni.showToast({ title: '已取消选图', icon: 'none' });
      setTimeout(() => uni.navigateBack(), 400);
    },
  });
}

function reshoot() {
  forceStage('recognizing');
  chooseImage();
}

function previewPhoto() {
  if (photo.value) {
    uni.previewImage({ urls: [photo.value] });
  }
  else {
    uni.showToast({ title: '无原图', icon: 'none' });
  }
}

function toManual() {
  release();
  uni.redirectTo({ url: '/pages/item/confirm/index?mode=manual' });
}

function toConfirm() {
  // 预占保留，确认保存（在 confirm 页）才消耗
  keepOccupy = true;
  const q = encodeURIComponent(JSON.stringify({ ...result.value, qty: qty.value }));
  uni.redirectTo({ url: `/pages/item/confirm/index?mode=recognize&data=${q}` });
}

function onCancel() {
  release();
  uni.navigateBack();
}

function goMember() {
  uni.navigateTo({ url: '/pages/user/member/index' });
}

onLoad((options: any = {}) => {
  method.value = options.method || 'camera';
  if (method.value === 'camera' && settingStore.quotaLeft === 0) {
    stage.value = 'quota';
    return;
  }
  if (method.value === 'scan') {
    // 扫码走同一识别流程，跳过选图
    runRecognize();
  }
  else {
    chooseImage();
  }
});

onUnload(() => {
  stopSpin();
  stopResolve();
  // 交给确认页继续持有的预占不在此释放；其余离开场景自动释放
  if (!keepOccupy) {
    release();
  }
});
onUnmounted(() => {
  stopSpin();
  stopResolve();
});
</script>

<style lang="scss" scoped>
.rec {
  padding-top: 8rpx;
}

.rec-back {
  display: flex;
  align-items: center;
  min-height: 72rpx;
  padding-right: 16rpx;
}

.rec-center {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  padding-top: 40rpx;
  text-align: center;
}

/* 双按钮横向平铺：小程序端 class 落在组件宿主节点，全局 `.x-btns.row > .x-button`
   选不中，需显式给宿主 flex:1 */
.rec-row {
  :deep(.x-button) {
    margin-top: 0;
  }
}

.rec-cell {
  flex: 1;
  min-width: 0;
}

/* 原型 09b 行内按钮：字号 13px，高度沿用 .btn 的 48px（不是 small 的 72rpx） */
.rec-inline {
  :deep(.x-button) {
    font-size: 25rpx;
  }
}

/* 原型 09b/09c 吸底按钮：字号 14px */
.rec-sticky {
  :deep(.x-button) {
    font-size: 27rpx;
  }
}

/* 09 取景器：原型 1:1 方形 + 20px 圆角 */
.rec-view {
  position: relative;
  aspect-ratio: 1 / 1;
  margin-bottom: 24rpx;
  overflow: hidden;
  background: linear-gradient(110deg, #1a2233 40%, #2a3040 50%, #1a2233 60%);
  border-radius: 40rpx;
}

.rec-view__img {
  width: 100%;
  height: 100%;
}

.rec-view__lock {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #ffffff;
}

.rec-view__emoji {
  margin-bottom: 20rpx;
  font-size: 96rpx;
}

.rec-view__tip {
  font-size: var(--fs-sub);
  opacity: 0.7;
}

.rec-status {
  display: flex;
  gap: 20rpx;
  align-items: center;
}

.rec-status__main {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--color-text);
}

.rec-spin {
  flex-shrink: 0;
  width: 40rpx;
  height: 40rpx;
  border: 4rpx solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: rec-rot 1s linear infinite;
}

@keyframes rec-rot {
  to {
    transform: rotate(360deg);
  }
}

.rec-seg {
  display: flex;
  gap: 8rpx;
  margin-top: 24rpx;
}

.rec-seg__bar {
  flex: 1;
  height: 8rpx;
  border-radius: 4rpx;
}

.rec-b {
  font-weight: 700;
  color: var(--color-text);
}

/* 原型 .field：k 深色 500 / v 灰 13px 右对齐 */
.rec-field {
  display: flex;
  gap: 16rpx;
  align-items: center;
  justify-content: space-between;
  min-height: 88rpx;
  padding: 26rpx 0;
  border-bottom: 2rpx solid var(--color-divider);
}

.rec-field:last-child {
  border-bottom: none;
}

.rec-field__k {
  font-size: var(--fs-body);
  font-weight: 500;
  color: var(--color-text);
}

.rec-field__v {
  display: flex;
  gap: 12rpx;
  align-items: center;
  font-size: 26rpx;
  color: var(--color-text-sub);
  text-align: right;
}

.rec-lo {
  font-weight: 600;
  color: #d93025;
}

.rec-conf {
  display: inline-flex;
  gap: 8rpx;
  align-items: center;
  padding: 4rpx 16rpx;
  font-size: 22rpx;
  font-weight: 600;
  border-radius: 20rpx;
}

.rec-conf.hi {
  color: var(--color-success-text);
  background: var(--color-success-tag-bg);
}

.rec-conf.lo {
  color: #d93025;
  background: #ffe5e5;
}

.rec-conf.mid {
  color: #c77700;
  background: #fff0db;
}

.rec-blue {
  font-weight: 600;
  color: var(--color-primary);
}

.rec-vis {
  display: flex;
  gap: 12rpx;
  align-items: center;
}

.rec-state {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 40rpx 20rpx;
  text-align: center;
}

.rec-state__emoji {
  font-size: 120rpx;
  line-height: 1.2;
}

.rec-state__title {
  margin: 28rpx 0 16rpx;
  font-size: 38rpx;
  font-weight: 700;
  color: var(--color-text);
}

.rec-state__sub {
  font-size: var(--fs-sub);
  line-height: 1.8;
  color: var(--color-text-sub);
}

.rec-perk {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--h-touch);
  padding: 16rpx 0;
  font-size: var(--fs-body);
  color: var(--color-text);
  border-bottom: 2rpx solid var(--color-divider);
}

.rec-perk:last-child {
  border-bottom: none;
}

.rec-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  padding: 48rpx 0 24rpx;
}
</style>
