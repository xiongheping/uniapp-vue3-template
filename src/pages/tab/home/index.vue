<template>
  <x-page tab="/pages/tab/home/index">
    <x-nav-bar :back="false">
      <view class="home-nav">
        <view class="home-nav__greet">
          <text class="home-nav__h1">
            嗨，{{ userName }}
          </text>
          <text class="home-nav__sub">
            {{ cnDate() }}
          </text>
        </view>
        <view class="home-nav__fam" @tap="gotoFamily">
          <x-icon name="users" :size="14" />
          <text>家庭</text>
        </view>
      </view>
    </x-nav-bar>

    <!-- 07b 骨架屏：形状与真实卡片一致 -->
    <template v-if="loadState === 'skeleton'">
      <view class="home-sk-digest" />
      <view class="x-card home-sk-card">
        <view v-for="i in 2" :key="i" class="home-sk-row">
          <view class="home-sk-ico" />
          <view class="home-sk-lines">
            <view class="home-sk-line home-sk-line--a" />
            <view class="home-sk-line home-sk-line--b" />
          </view>
        </view>
      </view>
    </template>

    <!-- 07c 错误态：强调本地数据安全 -->
    <template v-else-if="loadState === 'error'">
      <view class="home-state">
        <text class="home-state__emoji">
          📡
        </text>
        <text class="home-state__title">
          网络开小差了
        </text>
        <text class="home-state__sub">
          无法连接服务器。你的数据都安全存在本机，不会丢失。
        </text>
        <view class="x-btns row home-state__btns">
          <x-button type="ghost" text="查看本地数据" @click="useLocal" />
          <x-button text="↻ 重试" @click="retry" />
        </view>
      </view>
      <x-note tone="green">
        ✓ 本地模式可用：核心功能不依赖网络，恢复后自动同步。
      </x-note>
    </template>

    <!-- 07a 空态：四要素齐备 -->
    <template v-else-if="isEmpty">
      <view class="home-state">
        <text class="home-state__emoji home-state__emoji--dim">
          📦
        </text>
        <text class="home-state__title">
          还没有添加任何物品
        </text>
        <text class="home-state__sub">
          添加第一件物品后，这里会显示它的状态和到期提醒。
        </text>
        <view class="home-state__btns">
          <x-button text="📷 拍照添加第一件" @click="gotoAdd" />
        </view>
        <text class="home-state__alt" @tap="gotoAdd">
          或手动输入 / 扫条码 ›
        </text>
      </view>
      <x-note tone="blue">
        💡 药品和护肤品最值得先管起来。
      </x-note>
    </template>

    <!-- 07 默认态 / 07d 批量入口 -->
    <template v-else>
      <!-- 概览 tile：按下缩放，badge 口径 = 各分组件数 -->
      <view class="x-card home-digest">
        <view class="home-tiles">
          <view
            v-for="t in tiles"
            :key="t.key"
            class="home-tile"
            :class="{ 'home-tile--on': chip === 'all' || t.on }"
            @tap="filterByTile(t)"
          >
            <text class="home-tile__num" :class="`home-tile__num--${t.key}`">
              {{ t.n }}
            </text>
            <text class="home-tile__label">
              {{ t.label }}
            </text>
          </view>
        </view>
        <view v-if="todoText" class="home-todo" @tap="gotoMedicine">
          <x-icon name="pill" :size="16" />
          <text class="home-todo__text">
            {{ todoText }}
          </text>
          <text class="home-todo__go">
            去用药 ›
          </text>
        </view>
      </view>

      <!-- 搜索 + 排序 + 批量 -->
      <view class="home-tools">
        <view class="home-search">
          <x-icon name="search" :size="16" color="#8A93A5" />
          <input
            v-model="itemStore.keyword"
            class="home-search__input"
            placeholder="搜索物品…"
            confirm-type="search"
          >
        </view>
        <view class="home-tool-btn" @tap="toggleSort">
          <x-icon name="sort" :size="16" />
          <text>{{ sortMode === 'due' ? '按到期日' : '按添加时间' }}</text>
        </view>
        <view class="home-tool-btn home-tool-btn--accent" @tap="gotoBatch">
          <text>批量</text>
        </view>
      </view>

      <!-- 分类 chips：点击 tile 可预筛选分组 -->
      <view class="home-chips">
        <view
          v-for="c in chips"
          :key="c.key"
          class="home-chip"
          :class="{ 'home-chip--on': chip === c.key }"
          @tap="onChipTap(c.key)"
        >
          <x-icon v-if="c.icon" :name="c.icon" :size="12" />
          <text>{{ c.label }}</text>
        </view>
      </view>

      <!-- 分组列表 -->
      <template v-for="g in groups" :key="g.key">
        <template v-if="g.items.length">
          <view class="home-grp-bar">
            <text>{{ g.title }} · {{ g.items.length }}</text>
            <text class="home-grp-bar__more" @tap="gotoArchive">
              查看全部 ›
            </text>
          </view>
          <view class="x-card home-grp">
            <view
              v-for="it in g.items"
              :key="it.id"
              class="home-row-wrap"
            >
              <view class="home-swipe-actions">
                <view class="home-swipe-actions__keep" @tap.stop="onKeep(it)">
                  还在用
                </view>
                <view class="home-swipe-actions__throw" @tap.stop="onThrow(it)">
                  已扔
                </view>
              </view>
              <view
                class="home-row"
                :style="{ transform: `translateX(${offsetOf(it.id)}px)` }"
                @touchstart="onTouchStart($event, it.id)"
                @touchmove="onTouchMove"
                @touchend="onTouchEnd(it)"
                @tap="gotoDetail(it)"
              >
                <view class="home-row__ico" :class="`tone-${toneOf(it)}`">
                  <x-icon :name="iconOf(it.category)" :size="20" />
                </view>
                <view class="home-row__grow">
                  <text class="home-row__t1">
                    {{ it.name }}
                  </text>
                  <text class="home-row__t2">
                    {{ subOf(it) }}
                  </text>
                </view>
                <x-tag :tone="toneOf(it)">
                  {{ tagOf(it) }}
                </x-tag>
              </view>
            </view>
          </view>
        </template>
      </template>

      <view v-if="!groups.some(g => g.items.length)" class="home-nomatch">
        <text>没有匹配「{{ itemStore.keyword }}」的物品</text>
        <text class="home-nomatch__clear" @tap="itemStore.keyword = ''">
          清除搜索
        </text>
      </view>

      <x-note tone="blue">
        👆 左滑「还在用」询问：顺延 30 天 / 保持 / 取消，操作后可撤销。
      </x-note>

      <!-- FAB -->
      <view class="home-fab" @tap="gotoAdd">
        <x-icon name="plus" :size="22" color="#fff" />
      </view>

      <!-- 左滑「还在用」：顺延 30 天 / 保持 / 取消 -->
      <x-sheet v-model:show="showKeep" title="还在用 · 连花清瘟胶囊">
        <view class="home-keep-opts">
          <view class="home-keep-opt" @tap="doPostpone(30)">
            <x-icon name="clock" :size="18" />
            <view class="home-keep-opt__grow">
              <text class="home-keep-opt__t1">
                顺延 30 天
              </text>
              <text class="home-keep-opt__t2">
                到期日自动后移一个月
              </text>
            </view>
          </view>
          <view class="home-keep-opt" @tap="showKeep = false">
            <x-icon name="check" :size="18" />
            <view class="home-keep-opt__grow">
              <text class="home-keep-opt__t1">
                保持不变
              </text>
              <text class="home-keep-opt__t2">
                仅标记本次查看
              </text>
            </view>
          </view>
          <x-button type="ghost" text="取消" block @click="showKeep = false" />
        </view>
      </x-sheet>
    </template>
  </x-page>
</template>

<script setup lang="ts">
import type { ItemCategory, ItemView } from '@/store/modules/item/types';
import { onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { useItemStore, useMedicineStore, useUserStore } from '@/store';
import { cnDate } from '@/utils/date';

/** 首页五态：skeleton → ready / error；ready 内再分空态与默认态（原型 07~07d） */
type LoadState = 'skeleton' | 'ready' | 'error';

const itemStore = useItemStore();
const medicineStore = useMedicineStore();
const userStore = useUserStore();

const userName = computed<string>(() => userStore.user_name || '朋友');
const loadState = ref<LoadState>('skeleton');
/** 分组筛选项：分类 chip 与 tile 预筛选共用 */
type HomeFilter = 'all' | ItemCategory | 'manage' | 'expired' | 'expiring' | 'safe';

const chip = ref<HomeFilter>('all');
const sortMode = ref<'due' | 'added'>('due');
const showKeep = ref(false);
const keepTarget = ref<ItemView | null>(null);

/** 左滑位移记录：key = 物品 id */
const swipeOffsets = ref<Record<string, number>>({});
let touchStartX = 0;
let touchStartY = 0;
let swipeTargetId = '';

const isEmpty = computed<boolean>(() => itemStore.stats.active === 0);

const tiles = computed(() => [
  { key: 'expired', label: '🔴 过期', n: itemStore.stats.expired, on: chip.value === 'expired' },
  { key: 'expiring', label: '⚠️ 临期', n: itemStore.stats.expiring, on: chip.value === 'expiring' },
  { key: 'safe', label: '✓ 安全', n: itemStore.stats.active - itemStore.stats.expired - itemStore.stats.expiring, on: chip.value === 'safe' },
]);

const todoText = computed<string>(() => {
  if (medicineStore.isAllDone) {
    return `今日用药已完成 ${medicineStore.todayDone}/${medicineStore.todayTotal} ✓`;
  }
  if (medicineStore.pendingEntries.length > 0) {
    return `今日待办：${medicineStore.pendingEntries.length} 次服药未打卡`;
  }
  return '';
});

const chips = computed(() => [
  { key: 'all' as const, label: '全部', icon: '' },
  { key: 'drug' as const, label: '药品', icon: 'pill' },
  { key: 'skin' as const, label: '护肤', icon: 'droplet' },
  { key: 'food' as const, label: '食品', icon: 'cookie' },
  { key: 'manage' as const, label: '管理分类', icon: 'sliders' },
]);

/** 分类过滤 + 排序后的在用列表 */
const viewList = computed<ItemView[]>(() => {
  let list = itemStore.filtered;
  if (chip.value === 'expired' || chip.value === 'expiring' || chip.value === 'safe') {
    list = list.filter((it) => {
      if (chip.value === 'expired') {
        return it.dueDays < 0;
      }
      if (chip.value === 'expiring') {
        return it.dueDays >= 0 && it.dueDays <= 30;
      }
      return it.dueDays > 30;
    });
  }
  else if (chip.value !== 'all' && chip.value !== 'manage') {
    list = list.filter(it => it.category === chip.value);
  }
  if (sortMode.value === 'added') {
    return [...list].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }
  return list;
});

const groups = computed(() => [
  { key: 'expired', title: '🔴 已过期', items: viewList.value.filter(it => it.dueDays < 0) },
  { key: 'expiring', title: '⚠️ 临期中', items: viewList.value.filter(it => it.dueDays >= 0 && it.dueDays <= 30) },
  { key: 'safe', title: '✓ 安全', items: viewList.value.filter(it => it.dueDays > 30) },
]);

/** tile 点击预筛选对应分组 */
function filterByTile(t: { key: string }) {
  if (t.key === 'expired' || t.key === 'expiring' || t.key === 'safe') {
    chip.value = t.key;
  }
}

function toggleSort() {
  sortMode.value = sortMode.value === 'due' ? 'added' : 'due';
}

function toneOf(it: ItemView): string {
  if (it.dueDays < 0) {
    return 'red';
  }
  return it.dueDays <= 30 ? 'orange' : 'green';
}

function iconOf(category: ItemCategory): string {
  const map: Record<ItemCategory, string> = { drug: 'pill', skin: 'droplet', food: 'cookie', other: 'package' };
  return map[category] || 'package';
}

function tagOf(it: ItemView): string {
  if (it.dueDays < 0) {
    return `过期${-it.dueDays}天`;
  }
  if (it.dueDays === 0) {
    return '今天到期';
  }
  return `${it.dueDays}天后`;
}

function subOf(it: ItemView): string {
  const cat = { drug: '药品', skin: '护肤', food: '食品', other: '其他' }[it.category];
  return it.location ? `${cat} · ${it.location}` : cat;
}

function offsetOf(id: string): number {
  return swipeOffsets.value[id] || 0;
}

/** 左滑手势：-64px 显示「还在用 / 已扔」双操作 */
function onTouchStart(e: TouchEvent, id: string) {
  touchStartX = e.touches[0]?.clientX || 0;
  touchStartY = e.touches[0]?.clientY || 0;
  swipeTargetId = id;
}

function onTouchMove(e: TouchEvent) {
  if (!swipeTargetId) {
    return;
  }
  const dx = (e.touches[0]?.clientX || 0) - touchStartX;
  const dy = (e.touches[0]?.clientY || 0) - touchStartY;
  if (Math.abs(dx) < Math.abs(dy)) {
    return;
  }
  swipeOffsets.value[swipeTargetId] = Math.max(-64, Math.min(0, dx));
}

function onTouchEnd(it: ItemView) {
  const offset = swipeOffsets.value[swipeTargetId] || 0;
  swipeOffsets.value[it.id] = offset < -32 ? -64 : 0;
  swipeTargetId = '';
}

/** 左滑「还在用」→ 顺延 / 保持弹层 */
function onKeep(it: ItemView) {
  keepTarget.value = it;
  swipeOffsets.value[it.id] = 0;
  showKeep.value = true;
}

function doPostpone(days: number) {
  if (keepTarget.value) {
    itemStore.postpone(keepTarget.value.id, days);
    uni.$u?.toast?.(`已顺延 ${days} 天`);
  }
  showKeep.value = false;
}

/** 左滑「已扔」→ 直接归档 */
function onThrow(it: ItemView) {
  swipeOffsets.value[it.id] = 0;
  itemStore.archive([it.id], 'thrown');
  uni.$u?.toast?.('已移到已扔');
}

function gotoDetail(it: ItemView) {
  if (offsetOf(it.id)) {
    swipeOffsets.value[it.id] = 0;
    return;
  }
  uni.navigateTo({ url: `/pages/item/detail/index?id=${it.id}` });
}

function gotoAdd() {
  uni.navigateTo({ url: '/pages/item/add/index' });
}

function gotoArchive() {
  uni.navigateTo({ url: '/pages/item/archive/index' });
}

function gotoBatch() {
  itemStore.clearSelection();
  uni.navigateTo({ url: '/pages/item/overview/index' });
}

function gotoMedicine() {
  uni.redirectTo({ url: '/pages/tab/medicine/index' });
}

function gotoFamily() {
  uni.navigateTo({ url: '/pages/user/family/index' });
}

function gotoSetting() {
  uni.navigateTo({ url: '/pages/user/setting/index' });
}

function checkNetwork(): Promise<boolean> {
  return new Promise((resolve) => {
    uni.getNetworkType({
      success: res => resolve(res.networkType !== 'none'),
      fail: () => resolve(true),
    });
  });
}

/** 首次进入：骨架 → 校验网络 → ready / error */
async function initialLoad() {
  loadState.value = 'skeleton';
  const online = await checkNetwork();
  setTimeout(() => {
    loadState.value = online ? 'ready' : 'error';
  }, 600);
}

async function retry() {
  const online = await checkNetwork();
  loadState.value = online ? 'ready' : 'error';
}

/** 错误态「查看本地数据」：本地数据本就可用，直接进入默认态 */
function useLocal() {
  loadState.value = 'ready';
}

onShow(() => {
  if (loadState.value === 'skeleton') {
    initialLoad();
  }
});

/** 管理分类 chip 暂以设置页承载 */
function onChipTap(key: HomeFilter) {
  if (key === 'manage') {
    gotoSetting();
    return;
  }
  chip.value = key;
}
</script>

<style lang="scss" scoped>
.home-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.home-nav__h1 {
  display: block;
  font-size: var(--fs-h1);
  font-weight: 700;
  color: var(--color-text);
}

.home-nav__sub {
  display: block;
  margin-top: 4rpx;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}

.home-nav__fam {
  display: flex;
  gap: 8rpx;
  align-items: center;
  padding: 12rpx 24rpx;
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--color-primary);
  background: var(--color-primary-light);
  border-radius: var(--radius-cell);
}

/* 骨架屏（07b）：形状与真实卡片一致 */
.home-sk-digest {
  height: 240rpx;
  margin-bottom: 28rpx;
  background: var(--color-fill-light);
  border-radius: var(--radius-card);
  animation: home-sk-breathe 1.4s ease-in-out infinite;
}

.home-sk-row {
  display: flex;
  gap: 24rpx;
  align-items: center;
  padding: 20rpx 0;
}

.home-sk-ico {
  flex-shrink: 0;
  width: 80rpx;
  height: 80rpx;
  background: var(--color-fill-light);
  border-radius: var(--radius-cell);
  animation: home-sk-breathe 1.4s ease-in-out infinite;
}

.home-sk-lines {
  flex: 1;
}

.home-sk-line {
  height: 26rpx;
  background: var(--color-fill-light);
  border-radius: 8rpx;
  animation: home-sk-breathe 1.4s ease-in-out infinite;
}

.home-sk-line--a {
  width: 70%;
  margin-bottom: 14rpx;
}

.home-sk-line--b {
  width: 45%;
}

@keyframes home-sk-breathe {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.45;
  }
}

/* 全屏状态（空态 / 错误态） */
.home-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 60rpx;
  text-align: center;
}

.home-state__emoji {
  font-size: 128rpx;
}

.home-state__emoji--dim {
  opacity: 0.7;
}

.home-state__title {
  margin: 28rpx 0 12rpx;
  font-size: var(--fs-title);
  font-weight: 700;
  color: var(--color-text);
}

.home-state__sub {
  font-size: var(--fs-sub);
  line-height: 1.7;
  color: var(--color-text-sub);
}

.home-state__btns {
  display: flex;
  gap: 24rpx;
  justify-content: center;
  width: 100%;
  margin-top: 40rpx;
}

.home-state__alt {
  margin-top: 24rpx;
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--color-primary);
}

/* 概览 */
.home-digest {
  margin-bottom: 20rpx;
}

.home-tiles {
  display: flex;
  gap: 16rpx;
}

.home-tile {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0;
  background: var(--color-fill-light);
  border-radius: var(--radius-cell);
  transition: transform 0.12s ease;

  &:active {
    transform: scale(0.94);
  }
}

.home-tile__num {
  font-size: var(--fs-num);
  font-weight: 700;
  color: var(--color-text);
}

.home-tile__num--expired {
  color: var(--color-danger);
}

.home-tile__num--expiring {
  color: var(--color-warning);
}

.home-tile__num--safe {
  color: var(--color-success);
}

.home-tile__label {
  margin-top: 6rpx;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}

.home-todo {
  display: flex;
  gap: 12rpx;
  align-items: center;
  padding: 20rpx 24rpx;
  margin-top: 20rpx;
  color: #fff;
  background: var(--color-primary);
  border-radius: var(--radius-cell);
}

.home-todo__text {
  flex: 1;
  font-size: var(--fs-sub);
}

.home-todo__go {
  font-size: var(--fs-sub);
  opacity: 0.9;
}

/* 搜索 / 排序 / 批量 */
.home-tools {
  display: flex;
  gap: 16rpx;
  align-items: center;
  margin-bottom: 20rpx;
}

.home-search {
  display: flex;
  flex: 1;
  gap: 12rpx;
  align-items: center;
  min-height: var(--h-touch);
  padding: 0 24rpx;
  background: var(--color-card);
  border: 2rpx solid var(--color-divider);
  border-radius: var(--radius-cell);
}

.home-search__input {
  flex: 1;
  min-width: 0;
  font-size: var(--fs-body);
  color: var(--color-text);
}

.home-tool-btn {
  display: flex;
  gap: 8rpx;
  align-items: center;
  min-height: var(--h-touch);
  padding: 0 20rpx;
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--color-primary);
  background: var(--color-card);
  border-radius: var(--radius-cell);
}

.home-tool-btn--accent {
  color: #fff;
  background: var(--color-primary);
}

/* 分类 chips */
.home-chips {
  display: flex;
  gap: 14rpx;
  margin-bottom: 24rpx;
  overflow-x: auto;
}

.home-chip {
  display: flex;
  flex-shrink: 0;
  gap: 6rpx;
  align-items: center;
  min-height: 60rpx;
  padding: 0 24rpx;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
  background: var(--color-card);
  border: 2rpx solid var(--color-divider);
  border-radius: var(--radius-cell);
}

.home-chip--on {
  color: var(--color-primary);
  background: var(--color-primary-light);
  border-color: var(--color-primary);
}

/* 分组 */
.home-grp-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 8rpx 12rpx;
  font-size: var(--fs-sub);
  font-weight: 700;
  color: var(--color-text);
}

.home-grp-bar__more {
  font-weight: 400;
  color: var(--color-text-sub);
}

.home-grp {
  padding: 0;
  overflow: hidden;
}

/* 行 + 左滑 */
.home-row-wrap {
  position: relative;
  overflow: hidden;
}

.home-row {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 20rpx;
  align-items: center;
  padding: 24rpx 28rpx;
  background: var(--color-card);
  border-bottom: 2rpx solid var(--color-divider);
  transition: transform 0.15s ease;

  &:last-child {
    border-bottom: none;
  }
}

.home-swipe-actions {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: flex;
}

.home-swipe-actions__keep {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: flex-end;
  padding-right: 24rpx;
  font-size: var(--fs-sub);
  font-weight: 600;
  color: #fff;
  background: var(--color-warning);
}

.home-swipe-actions__throw {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 140rpx;
  font-size: var(--fs-sub);
  font-weight: 600;
  color: #fff;
  background: var(--color-danger);
}

.home-row__ico {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border-radius: var(--radius-cell);
}

.tone-red {
  color: var(--color-danger);
  background: var(--color-danger-light);
}

.tone-orange {
  color: var(--color-warning);
  background: var(--color-warning-light);
}

.tone-green {
  color: var(--color-success);
  background: var(--color-success-light);
}

.home-row__grow {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.home-row__t1 {
  font-size: var(--fs-body);
  font-weight: 600;
  color: var(--color-text);
}

.home-row__t2 {
  margin-top: 4rpx;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}

.home-nomatch {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}

.home-nomatch__clear {
  margin-top: 12rpx;
  color: var(--color-primary);
}

/* FAB */
.home-fab {
  position: fixed;
  right: 36rpx;
  bottom: calc(160rpx + env(safe-area-inset-bottom, 0px));
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 108rpx;
  height: 108rpx;
  background: var(--color-primary);
  border-radius: 50%;
  box-shadow: 0 12rpx 32rpx rgb(61 90 241 / 35%);
  transition: transform 0.12s ease;

  &:active {
    transform: scale(0.92);
  }
}

/* 顺延弹层 */
.home-keep-opts {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.home-keep-opt {
  display: flex;
  gap: 20rpx;
  align-items: center;
  padding: 24rpx 8rpx;
  color: var(--color-text);

  &:active {
    opacity: 0.7;
  }
}

.home-keep-opt__grow {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.home-keep-opt__t1 {
  font-size: var(--fs-body);
  font-weight: 600;
}

.home-keep-opt__t2 {
  margin-top: 4rpx;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}
</style>
