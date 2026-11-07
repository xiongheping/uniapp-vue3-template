<template>
  <view class="lg-page">
    <!-- 05 登录 / 注册 -->
    <template v-if="step === 'phone'">
      <view class="lg-hero">
        <text class="lg-hero__logo">
          📦
        </text>
        <text class="lg-hero__title">
          欢迎回到小七管家
        </text>
        <text class="lg-hero__sub">
          登录后数据可跨设备同步
        </text>
      </view>

      <view class="lg-field" :class="{ 'lg-field--err': phoneErr }">
        <input
          v-model="phone"
          class="lg-field__input"
          type="number"
          :maxlength="11"
          inputmode="numeric"
          placeholder="请输入 11 位手机号"
        >
        <text v-if="phone" class="lg-field__switch" @tap="switchPhone">
          切换
        </text>
      </view>
      <text v-if="phoneErr" class="lg-err">
        {{ phoneErr }}
      </text>

      <view class="lg-btn lg-btn--main x-tap-scale" :class="{ 'lg-btn--disabled': !phoneOk }" hover-class="x-tap-scale--hover" :hover-start-time="0" @tap="getCode">
        {{ codeSent ? '重新获取验证码' : '获取验证码' }}
      </view>

      <!-- 协议：默认无错，交互后提示 -->
      <view class="lg-protocol" :class="{ 'lg-protocol--err': protocolErr }" @tap="agree = !agree">
        <view class="lg-cb" :class="{ 'lg-cb--on': agree, 'lg-cb--err': protocolErr }">
          <x-icon v-if="agree" name="check" :size="24" color="#fff" />
        </view>
        <text class="lg-protocol__text">
          我已阅读并同意 <text class="lg-protocol__link">
            《用户协议》
          </text>、<text class="lg-protocol__link">
            《隐私政策》
          </text> 与 <text class="lg-protocol__link">
            《健康数据授权说明》
          </text>。未勾选不可获取验证码。
        </text>
      </view>
      <text v-if="protocolErr" class="lg-err">
        请先阅读并勾选协议
      </text>

      <view class="lg-btn lg-btn--ghost x-tap-scale" hover-class="x-tap-scale--hover" :hover-start-time="0" @tap="oneClickLogin">
        <x-icon name="phone" :size="32" />
        <text>本机号码一键登录</text>
      </view>

      <view class="lg-divider">
        <view class="lg-divider__line" />
        <text class="lg-divider__text">
          其他方式
        </text>
        <view class="lg-divider__line" />
      </view>

      <view class="lg-social">
        <view class="lg-social__item x-tap-opacity" hover-class="x-tap-opacity--hover" :hover-start-time="0" @tap="socialLogin('wechat')">
          <x-icon name="wechat" :size="36" color="#07C160" />
          <text>微信登录</text>
        </view>
        <view class="lg-social__item x-tap-opacity" hover-class="x-tap-opacity--hover" :hover-start-time="0" @tap="socialLogin('apple')">
          <x-icon name="apple" :size="36" />
          <text>Apple 登录</text>
        </view>
      </view>

      <view class="lg-guest x-tap-opacity" hover-class="x-tap-opacity--hover" :hover-start-time="0" @tap="showGuest = true">
        <text class="lg-guest__link">
          先逛逛 ›
        </text>
        <text class="lg-guest__sub">
          游客可添加物品，数据仅存本机
        </text>
      </view>
    </template>

    <!-- 05c 验证码：60s 倒计时 + 6 格自动跳格 -->
    <template v-else>
      <view class="lg-hero">
        <text class="lg-hero__logo">
          📦
        </text>
        <text class="lg-hero__title">
          输入验证码
        </text>
        <text class="lg-hero__sub">
          验证码已发送至 {{ maskedPhone }}
        </text>
      </view>

      <view class="lg-codes">
        <view
          v-for="(d, i) in codeDigits"
          :key="i"
          class="lg-code"
          :class="{ 'lg-code--on': !!d }"
          @tap="focusCode"
        >
          {{ d }}
        </view>
        <input
          v-model="codeStr"
          class="lg-codes__input"
          type="number"
          :maxlength="6"
          :focus="codeFocused"
          @input="onCodeInput"
        >
      </view>

      <view class="lg-resend">
        <text class="lg-resend__tip">
          未收到？
        </text>
        <text class="lg-resend__count" :class="{ 'lg-resend__count--on': countdown === 0 }" @tap="resend">
          {{ countdown > 0 ? `${countdown}s 后重发` : '重新发送' }}
        </text>
      </view>

      <view class="lg-btn lg-btn--main x-tap-scale" :class="{ 'lg-btn--disabled': codeStr.length < 6 }" hover-class="x-tap-scale--hover" :hover-start-time="0" @tap="verifyLogin">
        验证并登录
      </view>
      <view class="lg-btn lg-btn--ghost x-tap-scale" hover-class="x-tap-scale--hover" :hover-start-time="0" @tap="backToPhone">
        更换手机号
      </view>
    </template>

    <!-- 05d 游客模式说明弹层：能做 / 不能做 -->
    <x-sheet v-model:show="showGuest" title="以游客身份继续" sub="先体验核心功能，登录后可合并数据">
      <view class="x-card lg-guest-card">
        <view v-for="row in guestRows" :key="row.k" class="lg-guest-row">
          <view class="lg-guest-row__k">
            <x-icon :name="row.ok ? 'check' : 'x'" :size="32" :color="row.ok ? '#2E7D32' : '#C0C6D2'" />
            <text>{{ row.k }}</text>
          </view>
          <text class="lg-guest-row__v">
            {{ row.v }}
          </text>
        </view>
      </view>
      <x-note type="blue">
        💡 登录时若本机已有游客数据，会询问：合并去重 / 以云端为准 / 以本机为准。
      </x-note>
      <view class="lg-btn lg-btn--main x-tap-scale" hover-class="x-tap-scale--hover" :hover-start-time="0" @tap="continueGuest">
        继续以游客身份使用
      </view>
      <view class="lg-btn lg-btn--ghost x-tap-scale" hover-class="x-tap-scale--hover" :hover-start-time="0" @tap="showGuest = false">
        返回登录
      </view>
    </x-sheet>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { AuthApi } from '@/api';
import { HOME_PATH, LOGIN_PATH, removeQueryString } from '@/router';
import { useItemStore, useUserStore } from '@/store';

/**
 * 登录页（原型 05 / 05b / 05c / 05d）
 * 手机号+验证码（grant_type=sms）、微信（grant_type=wechat）、游客（grant_type=guest）
 */
const itemStore = useItemStore();
const userStore = useUserStore();

type Step = 'phone' | 'code';

const step = ref<Step>('phone');
const phone = ref<string>('');
const agree = ref<boolean>(false);
const phoneErr = ref<string>('');
const protocolErr = ref<boolean>(false);
const codeStr = ref<string>('');
const codeFocused = ref<boolean>(false);
const codeSent = ref<boolean>(false);
const submitting = ref<boolean>(false);
const countdown = ref<number>(0);
const showGuest = ref<boolean>(false);
let redirect = HOME_PATH;
let timer: ReturnType<typeof setInterval> | null = null;

const phoneOk = computed<boolean>(() => /^1\d{10}$/.test(phone.value));

const maskedPhone = computed<string>(() => {
  const p = phone.value;
  return p.length === 11 ? `${p.slice(0, 3)}****${p.slice(7)}` : p;
});

const codeDigits = computed<string[]>(() => {
  return Array.from({ length: 6 }, (_, i) => codeStr.value[i] || '');
});

/** 游客能力清单（05d：能做 / 不能做） */
const guestRows = [
  { ok: true, k: '可以添加物品', v: '游客账号云端保存' },
  { ok: true, k: '可以看本地数据', v: '无需手机号' },
  { ok: false, k: '家庭共享', v: '注册后开启' },
  { ok: false, k: 'AI 额度按设备计算', v: '10 次/月' },
];

function startCountdown() {
  countdown.value = 60;
  if (timer) {
    clearInterval(timer);
  }
  timer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value -= 1;
    }
    if (countdown.value === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  }, 1000);
}

/** 获取验证码：调后端 /resource/sms/code（60s 限流），错误原位提示 */
async function getCode() {
  if (!phoneOk.value) {
    phoneErr.value = '请输入 11 位手机号';
    return;
  }
  if (!agree.value) {
    protocolErr.value = true;
    uni.showToast({ title: '请先阅读并同意协议', icon: 'none' });
    return;
  }
  phoneErr.value = '';
  protocolErr.value = false;
  try {
    const echo = await AuthApi.sendSmsCode(phone.value);
    codeSent.value = true;
    startCountdown();
    step.value = 'code';
    codeStr.value = '';
    setTimeout(() => {
      codeFocused.value = true;
    }, 300);
    // 仅后端开启回显（本地联调）时 data 为验证码
    uni.showToast({ title: echo ? `验证码：${echo}` : '验证码已发送', icon: 'none' });
  }
  catch (error: any) {
    phoneErr.value = error?.msg || '发送失败，请稍后重试';
  }
}

function switchPhone() {
  step.value = 'phone';
  codeStr.value = '';
}

function onCodeInput(e: { detail: { value: string } }) {
  codeStr.value = (e.detail.value || '').replace(/\D/g, '').slice(0, 6);
}

function focusCode() {
  codeFocused.value = true;
}

async function resend() {
  if (countdown.value > 0) {
    return;
  }
  try {
    const echo = await AuthApi.sendSmsCode(phone.value);
    startCountdown();
    uni.showToast({ title: echo ? `验证码：${echo}` : '验证码已重新发送', icon: 'none' });
  }
  catch (error: any) {
    uni.showToast({ title: error?.msg || '发送失败，请稍后重试', icon: 'none' });
  }
}

function backToPhone() {
  step.value = 'phone';
}

/** 登录成功后的分流：游客数据 → 合并页（26）；否则首页 */
function afterLogin() {
  // 有本地游客数据时先按 guestCount 分流；云端列表由合并流程（mergeGuest）或此处拉取
  if (itemStore.guestCount > 0) {
    uni.redirectTo({ url: `/pages/user/merge/index?redirect=${encodeURIComponent(redirect)}` });
    return;
  }
  itemStore.fetchList();
  uni.redirectTo({ url: redirect });
}

/** 短信验证码登录（grant_type=sms，首次自动注册） */
async function verifyLogin() {
  if (codeStr.value.length < 6) {
    uni.showToast({ title: '请输入 6 位验证码', icon: 'none' });
    return;
  }
  if (submitting.value) {
    return;
  }
  submitting.value = true;
  try {
    await userStore.smsLogin(phone.value, codeStr.value);
    afterLogin();
  }
  catch (error: any) {
    const msg = error?.msg || error?.message || '登录失败，请重试';
    uni.showToast({ title: msg, icon: 'none' });
  }
  finally {
    submitting.value = false;
  }
}

/** 本机号码一键登录（运营商能力，暂未开通） */
function oneClickLogin() {
  uni.showToast({ title: '一键登录暂未开通，请使用验证码登录', icon: 'none' });
}

/** 微信登录（grant_type=wechat，social_code 为 wx.login 的 code） */
async function socialLogin(platform: 'wechat' | 'apple') {
  if (platform !== 'wechat') {
    uni.showToast({ title: 'Apple 登录暂未接入', icon: 'none' });
    return;
  }
  if (!agree.value) {
    protocolErr.value = true;
    uni.showToast({ title: '请先阅读并同意协议', icon: 'none' });
    return;
  }
  try {
    await userStore.wechatLogin();
    afterLogin();
  }
  catch (error: any) {
    uni.showToast({ title: error?.msg || '微信登录失败', icon: 'none' });
  }
}

/** 游客模式：grant_type=guest 按设备号登录，数据云端保存 */
async function continueGuest() {
  showGuest.value = false;
  try {
    await userStore.guestLogin();
  }
  catch (error: any) {
    // 游客登录失败降级为纯本地模式
    console.warn('guest login failed:', error);
    uni.setStorageSync('guest_mode', true);
  }
  uni.redirectTo({ url: '/pages/boot/onboard/index' });
}

onLoad((options: Record<string, string> = {}) => {
  if (options.redirect && removeQueryString(options.redirect) !== LOGIN_PATH) {
    redirect = decodeURIComponent(options.redirect);
  }
});
</script>

<style lang="scss" scoped>
.lg-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
  padding: 0 56rpx;
}

.lg-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 44rpx;
  text-align: center;
}

.lg-hero__logo {
  font-size: 104rpx;
}

.lg-hero__title {
  margin-top: 16rpx;
  font-size: 44rpx;
  font-weight: 700;
  color: var(--color-text);
}

.lg-hero__sub {
  margin-top: 12rpx;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}

.lg-field {
  position: relative;
  display: flex;
  align-items: center;
  min-height: var(--h-touch);
  padding: 0 28rpx;
  background: var(--color-card);
  border: 3rpx solid var(--color-divider);
  border-radius: var(--radius-cell);
}

.lg-field--err {
  border-color: var(--color-danger);
}

.lg-field__input {
  flex: 1;
  min-width: 0;
  font-size: var(--fs-title);
  color: var(--color-text);
}

.lg-field__switch {
  padding: 8rpx 16rpx;
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--color-primary);
}

.lg-err {
  margin-top: 10rpx;
  font-size: var(--fs-sub);
  color: var(--color-danger);
}

.lg-btn {
  display: flex;
  gap: 12rpx;
  align-items: center;
  justify-content: center;
  min-height: var(--h-touch);
  font-size: var(--fs-body);
  font-weight: 700;
  border-radius: var(--radius-cell);
  transition: transform 0.12s ease;

  &:active {
    transform: scale(0.97);
  }
}

.lg-btn--main {
  margin-top: 28rpx;
  color: #fff;
  background: var(--color-primary);
}

.lg-btn--ghost {
  margin-top: 24rpx;
  color: var(--color-text);
  background: var(--color-fill-light);
}

.lg-btn--disabled {
  opacity: 0.55;
}

.lg-protocol {
  display: flex;
  gap: 14rpx;
  align-items: flex-start;
  margin-top: 26rpx;
}

.lg-cb {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36rpx;
  height: 36rpx;
  margin-top: 4rpx;
  border: 3rpx solid var(--color-divider);
  border-radius: 10rpx;
}

.lg-cb--on {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.lg-cb--err {
  border-color: var(--color-danger);
}

.lg-protocol__text {
  font-size: var(--fs-mini);
  line-height: 1.7;
  color: var(--color-text-sub);
}

.lg-protocol--err .lg-protocol__text {
  color: var(--color-danger);
}

.lg-protocol__link {
  color: var(--color-primary);
}

.lg-divider {
  display: flex;
  gap: 20rpx;
  align-items: center;
  margin: 36rpx 0 24rpx;
}

.lg-divider__line {
  flex: 1;
  height: 2rpx;
  background: var(--color-divider);
}

.lg-divider__text {
  font-size: var(--fs-mini);
  color: var(--color-text-sub);
}

.lg-social {
  display: flex;
  gap: 120rpx;
  justify-content: center;
}

.lg-social__item {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  align-items: center;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}

.lg-social__icon {
  font-size: 44rpx;
}

.lg-guest {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 44rpx;
}

.lg-guest__link {
  font-size: var(--fs-body);
  font-weight: 600;
  color: var(--color-primary);
}

.lg-guest__sub {
  margin-top: 10rpx;
  font-size: var(--fs-mini);
  color: var(--color-text-sub);
}

/* 验证码 6 格 */
.lg-codes {
  position: relative;
  display: flex;
  gap: 14rpx;
  margin-bottom: 10rpx;
}

.lg-code {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  height: 100rpx;
  font-size: 40rpx;
  font-weight: 700;
  color: var(--color-text);
  background: var(--color-card);
  border: 3rpx solid var(--color-divider);
  border-radius: var(--radius-cell);
}

.lg-code--on {
  border-color: var(--color-primary);
}

.lg-codes__input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
}

.lg-resend {
  display: flex;
  justify-content: space-between;
  margin: 20rpx 0 24rpx;
}

.lg-resend__tip {
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}

.lg-resend__count {
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--color-text-sub);
}

.lg-resend__count--on {
  color: var(--color-primary);
}

/* 游客说明（05d） */
.lg-guest-card {
  margin: 0 0 20rpx;
}

.lg-guest-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 2rpx solid var(--color-divider);

  &:last-child {
    border-bottom: none;
  }
}

.lg-guest-row__k {
  display: flex;
  gap: 14rpx;
  align-items: center;
  font-size: var(--fs-body);
  color: var(--color-text);
}

.lg-guest-row__v {
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}
</style>
