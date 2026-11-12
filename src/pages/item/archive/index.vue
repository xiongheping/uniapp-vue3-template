<template>
  <x-page>
    <x-nav-bar title="归档与历史" right-text="回收站" @right="activeSeg = 'trash'" />

    <!-- 分段控件 -->
    <view class="ar-seg">
      <view
        v-for="s in SEGS"
        :key="s.key"
        class="ar-seg__item"
        :class="{ on: activeSeg === s.key }"
        @click="activeSeg = s.key"
      >
        {{ s.label }}
      </view>
    </view>

    <!-- 疗程：按原型 19 展示已完成/进行中的疗程卡 -->
    <view v-if="activeSeg === 'course'">
      <x-card v-if="courseList.length > 0">
        <view v-for="(p, idx) in courseList" :key="p.id">
          <view class="ar-row">
            <view class="ar-ico">
              <x-icon name="pill" :size="36" color="#2E7D32" />
            </view>
            <view class="x-flex-1">
              <view class="ar-name x-ellipsis">
                {{ p.name }}
              </view>
              <view class="x-sub">
                {{ courseSub(p) }}
              </view>
            </view>
            <x-tag :type="isCourseDone(p) ? 'green' : 'blue'">
              {{ isCourseDone(p) ? '完成' : '进行中' }}
            </x-tag>
          </view>
          <view class="ar-btns">
            <x-button type="ghost" small icon="file-text" text="记录" class="ar-btns__act" @click="gotoPlan(p.id)" />
            <x-button type="ghost" small icon="bag" text="再买" class="ar-btns__act" @click="rebuy(p.name)" />
          </view>
          <view v-if="idx !== courseList.length - 1" class="ar-divider" />
        </view>
      </x-card>
      <view v-else class="ar-empty-wrap">
        <x-empty emoji="💊" title="还没有疗程记录" sub="完成一个用药计划后会归档到这里，可在用药页查看历史疗程。">
          <template #action>
            <x-button type="ghost" text="去用药" @click="goMedicine" />
          </template>
        </x-empty>
      </view>
    </view>

    <!-- 回收站 -->
    <view v-else-if="activeSeg === 'trash'">
      <x-note>
        🗑 回收站保留 30 天，逾期自动彻底删除。
      </x-note>
      <block v-if="trashedItems.length > 0">
        <x-card v-for="it in trashedItems" :key="it.id">
          <view class="ar-row">
            <view class="ar-ico">
              <x-icon :name="catIcon(it.category)" :size="36" color="#8A93A5" />
            </view>
            <view class="x-flex-1">
              <view class="ar-name x-ellipsis">
                {{ it.name }}
              </view>
              <view class="x-sub">
                {{ trashLabel(it) }}
              </view>
            </view>
          </view>
          <view class="ar-btns">
            <x-button type="ghost" small icon="undo" text="恢复" class="ar-btns__act" @click="onRestore(it.id)" />
            <x-button type="danger" small icon="trash" text="彻底删除" class="ar-btns__act" @click="onDeleteForever(it.id)" />
          </view>
        </x-card>
      </block>
      <x-empty v-else emoji="🗑" title="回收站是空的" sub="移入回收站的物品会出现在这里。" />
    </view>

    <!-- 已用完 / 已扔 / 全部 -->
    <view v-else>
      <view v-if="showUsed">
        <view class="ar-group-title">
          🧴 已用完
        </view>
        <x-card v-if="usedItems.length > 0">
          <view v-for="(it, idx) in usedItems" :key="it.id">
            <view class="ar-row">
              <view class="ar-ico">
                <x-icon :name="catIcon(it.category)" :size="36" :color="iconColor(it)" />
              </view>
              <view class="x-flex-1">
                <view class="ar-name x-ellipsis">
                  {{ it.name }}
                </view>
                <view class="x-sub">
                  {{ usedSub(it) }}
                </view>
              </view>
              <view class="x-tap-opacity" hover-class="x-tap-opacity--hover" :hover-start-time="0" @tap="rebuy(it.name)">
                <x-tag type="gray">
                  🛒 再买
                </x-tag>
              </view>
            </view>
            <view class="ar-btns">
              <x-button type="ghost" small icon="undo" text="恢复" class="ar-btns__act" @click="onRestore(it.id)" />
              <x-button type="ghost" small text="移入回收站" class="ar-btns__act ar-trashbtn" @click="onTrash(it.id)" />
            </view>
            <view v-if="idx !== usedItems.length - 1" class="ar-divider" />
          </view>
        </x-card>
        <view v-else class="x-sub ar-none">
          暂无已用完记录
        </view>
      </view>

      <view v-if="showThrown">
        <view class="ar-group-title">
          🗑 已扔 · 归档终态，可恢复
        </view>
        <x-card v-if="thrownItems.length > 0">
          <view v-for="(it, idx) in thrownItems" :key="it.id">
            <view class="ar-row">
              <view class="ar-ico">
                <x-icon :name="catIcon(it.category)" :size="36" color="#D93025" />
              </view>
              <view class="x-flex-1">
                <view class="ar-name x-ellipsis">
                  {{ it.name }}
                </view>
                <view class="x-sub">
                  {{ thrownSub(it) }}
                </view>
              </view>
              <x-tag type="blue">
                恢复
              </x-tag>
            </view>
            <view class="ar-btns">
              <x-button type="ghost" small icon="undo" text="恢复" class="ar-btns__act" @click="onRestore(it.id)" />
              <x-button type="ghost" small text="移入回收站" class="ar-btns__act ar-trashbtn" @click="onTrash(it.id)" />
            </view>
            <view v-if="idx !== thrownItems.length - 1" class="ar-divider" />
          </view>
        </x-card>
        <view v-else class="x-sub ar-none">
          暂无已扔记录
        </view>
      </view>

      <view v-if="usedItems.length === 0 && thrownItems.length === 0" class="ar-empty-wrap">
        <x-empty emoji="📦" title="还没有归档记录" sub="物品标记已用完或移到已扔后会出现在这里。" />
      </view>
    </view>

    <x-note type="blue">
      💡 生命周期：在用 → 已用完 / 已扔 → 回收站（30 天）→ 彻底删除。彻底删除仅在回收站内提供，需二次确认。
    </x-note>
  </x-page>
</template>

<script setup lang="ts">
import type { ItemRecord } from '@/store/modules/item/types';
import type { MedPlan } from '@/store/modules/medicine/types';
import { switchTabPath } from '@/router/tab-bar';
import { useItemStore, useMedicineStore } from '@/store';
import { diffDays, dotDate, shortDate } from '@/utils/date';

type SegKey = 'all' | 'course' | 'used' | 'thrown' | 'trash';

interface SegOption {
  key: SegKey;
  label: string;
}

const itemStore = useItemStore();
const medicineStore = useMedicineStore();

/** 疗程列表（原型 19 第一段：完成 / 进行中） */
const courseList = computed<MedPlan[]>(() => medicineStore.courses);

function isCourseDone(plan: MedPlan): boolean {
  const course = plan.course as { index?: number; total?: number } | undefined;
  if (!course) {
    return false;
  }
  return Number(course.index || 0) >= Number(course.total || 0);
}

function courseSub(plan: MedPlan): string {
  const course = plan.course as { index?: number; total?: number; start?: string } | undefined;
  const reason = plan.reason ? `${plan.reason} · ` : '';
  if (!course) {
    return reason || '未设置疗程';
  }
  return `${reason}第 ${course.index || 1}/${course.total || 7} 天`;
}

function gotoPlan(planId: string) {
  uni.navigateTo({ url: `/pages/med/plan/index?planId=${planId}` });
}

const TRASH_DAYS = 30;
const SEGS: SegOption[] = [
  { key: 'all', label: '全部' },
  { key: 'course', label: '疗程' },
  { key: 'used', label: '已用完' },
  { key: 'thrown', label: '已扔' },
];
const CAT_ICON: Record<string, string> = { drug: 'pill', skin: 'droplet', food: 'cookie', other: 'package' };

const activeSeg = ref<SegKey>('all');

const usedItems = computed<ItemRecord[]>(() => itemStore.list.filter(it => it.status === 'used'));
const thrownItems = computed<ItemRecord[]>(() => itemStore.list.filter(it => it.status === 'thrown'));
const trashedItems = computed<ItemRecord[]>(() => itemStore.list.filter(it => it.status === 'trashed'));

const showUsed = computed<boolean>(() => activeSeg.value === 'all' || activeSeg.value === 'used');
const showThrown = computed<boolean>(() => activeSeg.value === 'all' || activeSeg.value === 'thrown');

function catIcon(key: string) {
  return CAT_ICON[key] ?? 'package';
}

function iconColor(it: ItemRecord) {
  const days = it.usedDays || 0;
  return days >= 90 ? '#2E7D32' : '#C77700';
}

function usedSub(it: ItemRecord) {
  const at = it.archivedAt ? `${shortDate(it.archivedAt)} 用完` : '已用完';
  return it.usedDays ? `${at} · 用了 ${it.usedDays} 天` : at;
}

function thrownSub(it: ItemRecord) {
  const at = it.archivedAt ? `${shortDate(it.archivedAt)} 已扔` : '已扔';
  return it.dueDate ? `${at} · 原到期 ${dotDate(it.dueDate)}` : at;
}

/**
 * 回收站保留期倒计时
 */
function trashLabel(it: ItemRecord) {
  if (!it.trashedAt) {
    return '回收站';
  }
  const elapsed = -diffDays(it.trashedAt);
  const left = Math.max(0, TRASH_DAYS - elapsed);
  return left > 0 ? `回收站 · ${left} 天后彻底删除` : '即将自动清理';
}

function onRestore(id: string) {
  itemStore.restore([id]);
  uni.showToast({ title: '已恢复到在用', icon: 'none' });
}

function onTrash(id: string) {
  itemStore.moveToTrash([id]);
  uni.showToast({ title: '已移入回收站', icon: 'none' });
}

/** 再买：带着原名称进入手动录入（原型 19「🛒 再买」） */
function rebuy(name: string) {
  uni.navigateTo({ url: `/pages/item/add/index?method=keyboard&name=${encodeURIComponent(name)}` });
}

function onDeleteForever(id: string) {
  const it = itemStore.findItem(id);
  uni.showModal({
    title: '彻底删除',
    content: `「${it ? it.name : ''}」将被永久删除，不可恢复。确认？`,
    confirmText: '删除',
    confirmColor: '#D93025',
    success: (res) => {
      if (res.confirm) {
        itemStore.deleteForever([id]);
        uni.showToast({ title: '已彻底删除', icon: 'none' });
      }
    },
  });
}

function goMedicine() {
  // 用药页为 tab 页，原生 tabBar 已移除，switchTabPath 内部即 uni.redirectTo
  switchTabPath('/pages/tab/medicine/index');
}

onLoad((options: Record<string, string> = {}) => {
  if (options.group) {
    activeSeg.value = options.group as SegKey;
  }
});
</script>

<style lang="scss" scoped>
/* 原型 .seg：12px 外框 / 9px 选项圆角 + 选中微阴影 */
.ar-seg {
  display: flex;
  padding: 6rpx;
  margin: 8rpx 0 24rpx;
  background: var(--color-fill);
  border-radius: 24rpx;
}

.ar-seg__item {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 72rpx;
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--color-text-sub);
  border-radius: 18rpx;
  transition:
    background-color var(--dur-normal) var(--ease-out),
    color var(--dur-normal) var(--ease-out),
    box-shadow var(--dur-normal) var(--ease-out);
}

.ar-seg__item.on {
  color: var(--color-primary);
  background: var(--color-card);
  box-shadow: 0 2rpx 6rpx rgb(20 30 60 / 8%);
}

.ar-group-title {
  padding-left: 8rpx;
  margin: 16rpx 0 4rpx;
  font-size: var(--fs-sub);
  font-weight: 700;
  color: var(--color-text-sub);
}

/* 卡片内操作按钮：横向等宽平铺（页面级 scoped，不依赖全局 .x-btns） */
.ar-btns {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.ar-btns__act {
  flex: 1;
  margin-top: 0;
}

.ar-trashbtn {
  color: #b3261e !important;
  border-color: #fbcbcb !important;
}

.ar-row {
  display: flex;
  gap: 20rpx;
  align-items: center;
  padding-bottom: 20rpx;
}

.ar-ico {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  background: var(--color-fill-light);
  border-radius: 16rpx;
}

.ar-name {
  font-size: var(--fs-body);
  font-weight: 600;
  color: var(--color-text);
}

.ar-divider {
  height: 2rpx;
  margin: 20rpx 0;
  background: var(--color-divider);
}

.ar-none {
  padding: 16rpx 8rpx 24rpx;
}

.ar-empty-wrap {
  padding-top: 20rpx;
}
</style>
