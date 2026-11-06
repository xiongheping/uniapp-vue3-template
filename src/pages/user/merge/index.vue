<template>
  <x-page :reserve="160">
    <x-nav-bar title="欢迎回来" />

    <block v-if="!mergeResult">
      <!-- 本机 / 云端 数量对比 -->
      <x-card>
        <view class="mg-head">
          <text class="mg-head__emoji">
            📦
          </text>
          <view class="mg-head__title">
            发现本机有游客数据
          </view>
          <view class="x-sub">
            本机
            <text class="mg-strong">
              {{ localCount }}
            </text>
            件物品 · 云端
            <text class="mg-strong">
              {{ CLOUD_COUNT }}
            </text>
            件物品
          </view>
        </view>
      </x-card>

      <!-- 合并方式三选一 -->
      <x-card>
        <view class="mg-sec">
          请选择合并方式
        </view>
        <view v-for="opt in strategyOptions" :key="opt.value" class="mg-opt x-tap-bg" hover-class="x-tap--hover" :hover-start-time="0" @tap="strategy = opt.value">
          <text class="mg-opt__label">
            {{ opt.label }}
          </text>
          <x-radio :checked="strategy === opt.value" />
        </view>
      </x-card>

      <!-- PRD 判重规则卡（默认收起，点标题展开，热区 ≥44dp） -->
      <view class="mg-prd">
        <view class="mg-prd__head x-tap-bg" hover-class="x-tap--hover" :hover-start-time="0" @tap="prdOpen = !prdOpen">
          <text>📌 查看判重规则（PRD）</text>
          <x-icon name="chev-d" :size="32" :color="prdColor" />
        </view>
        <view v-show="prdOpen" class="mg-prd__body x-expand">
          <view class="mg-prd__intro">
            判重键：
            <text class="mg-strong">
              normalize(name) + '|' + dueDate
            </text>
            。名称归一化：去空格 / 全角→半角 / 英文小写 / 空格压缩；到期日统一 YYYY-MM-DD。
          </view>
          <view class="mg-table">
            <view class="mg-tr mg-tr--head">
              <text class="mg-td">
                字段
              </text>
              <text class="mg-td">
                冲突取值
              </text>
            </view>
            <view v-for="row in prdRows" :key="row.field" class="mg-tr">
              <text class="mg-td">
                {{ row.field }}
              </text>
              <text class="mg-td" :class="row.strong ? 'mg-td--strong' : ''">
                {{ row.value }}
              </text>
            </view>
          </view>
          <view class="mg-prd__api">
            接口：POST /v1/merge/guest · 幂等 idempotencyKey · 服务端单事务失败回滚 · 策略②③前写 7 天快照
          </view>
        </view>
      </view>

      <x-note type="blue">
        💡 点「稍后再说」：游客数据保留本地 · 下次登录再询问 · 首页顶部显示「有 N 件游客数据待合并 ›」轻提示。
      </x-note>
    </block>

    <!-- 合并结果 -->
    <block v-else>
      <x-card>
        <view class="mg-head">
          <text class="mg-head__emoji">
            ✅
          </text>
          <view class="mg-head__title">
            合并完成
          </view>
          <view class="x-sub">
            合并 {{ mergeResult.mergedCount }} 件 · 冲突 {{ mergeResult.conflictCount }} 件 · 待确认
            {{ mergeResult.pendingCount }} 件
          </view>
        </view>
      </x-card>
      <x-card>
        <x-field label="合并策略" :value="strategyLabel" last />
      </x-card>
      <view v-if="mergeResult.pendingCount > 0" class="x-btns">
        <x-button type="ghost" text="查看待确认物品" @click="goArchive" />
      </view>
      <view class="x-btns">
        <x-button text="返回首页" @click="goHome" />
      </view>
    </block>

    <template v-if="!mergeResult" #sticky>
      <view class="x-btns row">
        <x-button type="ghost" text="稍后再说" @click="handleLater" />
        <x-button text="确认合并" @click="handleMerge" />
      </view>
    </template>
  </x-page>
</template>

<script setup lang="ts">
import type { ItemRecord, MergeResult, MergeStrategy } from '@/store/modules/item/types';
import { usePermission, useTheme } from '@/hooks';
import { redirectToHomePage } from '@/router';
import { useItemStore } from '@/store';

interface StrategyOption {
  value: MergeStrategy;
  label: string;
}

interface PrdRow {
  field: string;
  value: string;
  strong?: boolean;
}

const itemStore = useItemStore();
const { isDark } = useTheme();

// 云端数量：mock 常量，来源=原型 26「云端 12 件」，真实项目应由 /v1/merge/guest 预览接口返回
const CLOUD_COUNT = 12;

const prdOpen = ref(false);
const strategy = ref<MergeStrategy>('merge');
const mergeResult = ref<MergeResult | null>(null);

const prdColor = computed<string>(() => (isDark.value ? '#8A93A5' : '#6B7590'));
const localCount = computed<number>(() => itemStore.guestCount);

const strategyOptions: StrategyOption[] = [
  { value: 'merge', label: '合并去重（推荐）' },
  { value: 'cloud', label: '以云端为准' },
  { value: 'local', label: '以本机为准' },
];

const strategyLabel = computed<string>(() => strategyOptions.find(o => o.value === strategy.value)?.label || '');

const prdRows: PrdRow[] = [
  { field: '名称', value: '取云端' },
  { field: '数量', value: 'max(云端, 本机)' },
  { field: '位置 / 分类 / 提醒', value: 'updatedAt 较新' },
  { field: '可见范围', value: '取更严格方（仅自己 > 家人）', strong: true },
  { field: '图片', value: '两边保留 · 主图取较新' },
];

// 本机游客物品作为待合并集合（未登录时 addItem 会打上 guest 标记）
function guestItems(): ItemRecord[] {
  return itemStore.list.filter(item => item.guest === true);
}

function handleMerge(): void {
  mergeResult.value = itemStore.mergeGuest(guestItems(), strategy.value);
}

// 稍后再说：不清除游客数据，直接回首页（首页轻提示由首页同事实现）
function handleLater(): void {
  redirectToHomePage();
}

function goArchive(): void {
  uni.navigateTo({ url: '/pages/item/archive/index' });
}

function goHome(): void {
  redirectToHomePage();
}

onShow(async () => {
  // 未登录时由 hooks/use-permission 处理跳转
  await usePermission();
});
</script>

<style lang="scss" scoped>
.mg-head {
  text-align: center;
}

.mg-head__emoji {
  font-size: 88rpx;
  line-height: 1.2;
}

.mg-head__title {
  margin-top: 8rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: var(--color-text);
}

.mg-strong {
  font-weight: 700;
  color: var(--color-primary);
}

.mg-sec {
  margin-bottom: 16rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: var(--color-text);
}

.mg-opt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--h-touch);
  padding: 16rpx 0;
  border-bottom: 2rpx solid var(--color-divider);
}

.mg-opt:last-child {
  border-bottom: none;
}

.mg-opt__label {
  font-size: var(--fs-body);
  color: var(--color-text);
}

.mg-prd {
  margin-bottom: 24rpx;
  overflow: hidden;
  background: var(--color-card);
  border: 2rpx solid var(--color-border);
  border-radius: var(--radius-card);
}

.mg-prd__head {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--h-touch);
  padding: 0 28rpx;
  font-size: var(--fs-body);
  font-weight: 600;
  color: var(--color-text);
}

.mg-prd__body {
  padding: 0 28rpx 28rpx;
}

.mg-prd__intro {
  margin-bottom: 16rpx;
  font-size: var(--fs-sub);
  line-height: 1.7;
  color: var(--color-text-sub);
}

.mg-table {
  overflow: hidden;
  border: 2rpx solid var(--color-border);
  border-radius: 16rpx;
}

.mg-tr {
  display: flex;
  border-bottom: 2rpx solid var(--color-divider);
}

.mg-tr:last-child {
  border-bottom: none;
}

.mg-tr--head {
  background: var(--color-fill);
}

.mg-td {
  flex: 1;
  padding: 18rpx 20rpx;
  font-size: var(--fs-sub);
  color: var(--color-text);
}

.mg-td--strong {
  font-weight: 700;
  color: var(--color-danger-strong);
}

.mg-prd__api {
  margin-top: 16rpx;
  font-size: var(--fs-mini);
  line-height: 1.6;
  color: var(--color-text-sub);
}
</style>
