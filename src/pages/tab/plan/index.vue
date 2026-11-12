<template>
  <x-page :tab="tabPath" :padded="false">
    <view class="pl-body">
      <view class="pl-status" />

      <!-- P2c / P2d 状态栏网络标识（原生状态栏无法放组件图标，改为页内顶部右对齐） -->
      <view v-if="viewState === 'offline' || viewState === 'error'" class="pl-net" :class="{ 'pl-net--bad': viewState === 'error' }">
        <x-icon name="wifi-off" :size="28" :color="viewState === 'error' ? '#FA5151' : '#C77700'" />
        <text>无网络</text>
      </view>

      <view class="pl-hdr">
        <view class="pl-hdr__main">
          <text class="pl-hdr__h1">
            今日计划
          </text>
          <text class="pl-hdr__sub">
            {{ dateText }}
          </text>
        </view>
        <view v-if="viewState === 'skeleton'" class="pl-sk pl-sk--lock" />
        <view v-else class="pl-lock">
          <x-icon name="lock" :size="28" color="#7B8494" />
          <text>可见范围可逐条设置</text>
        </view>
      </view>

      <!-- P2b 骨架屏 -->
      <template v-if="viewState === 'skeleton'">
        <view class="pl-sk pl-sk--hero" />
        <view class="pl-sk pl-sk--next" />
        <view class="pl-sk pl-sk--line" />
        <view class="pl-sk-row">
          <view v-for="n in 3" :key="n" class="pl-sk pl-sk--chip" />
        </view>
        <view class="pl-sk pl-sk--group" />
        <view class="pl-sk pl-sk--card" />
        <view class="pl-sk pl-sk--card pl-sk--last" />
        <view class="pl-sk__tip">
          加载中…
        </view>
      </template>

      <!-- P1 空态 -->
      <template v-else-if="viewState === 'empty'">
        <view class="pl-empty">
          <view class="pl-empty__ico">
            <x-icon name="list-checks" :size="88" color="#4F7CFF" />
          </view>
          <text class="pl-empty__title">
            还没有计划
          </text>
          <text class="pl-empty__desc">
            吃药、喝水、运动、喂狗浇花……
          </text>
          <text class="pl-empty__desc">
            设好时间，到点我提醒你，你只需点一下。
          </text>
        </view>

        <view class="pl-preview">
          <text class="pl-preview__badge">
            加了之后长这样
          </text>
          <view class="pl-preview__head">
            <x-icon name="calendar" :size="28" color="#8A93A5" />
            <text>示例 · 展示不同类型</text>
          </view>
          <view v-for="item in PREVIEW_ITEMS" :key="item.time" class="pl-preview__item">
            <text class="pl-preview__time">
              {{ item.time }}
            </text>
            <view class="pl-preview__ico" :style="{ background: kindOf(item.kind).bg }">
              <x-icon :name="kindOf(item.kind).icon" :size="28" :color="kindOf(item.kind).fg" />
            </view>
            <view class="x-flex-1">
              <view class="pl-preview__t1">
                {{ item.title }}
              </view>
              <view class="pl-preview__t2">
                {{ item.sub }}
              </view>
            </view>
            <view class="pl-preview__check" />
          </view>
          <view class="pl-preview__more" @tap="notReady('查看更多示例')">
            <text>查看更多示例（宠物 / 植物 / 血压 / 自定义）</text>
            <x-icon name="chev-d" :size="28" color="#4F7CFF" />
          </view>
        </view>

        <x-button text="添加计划" icon="plus" @click="openAdd" />

        <x-note type="green" class="pl-note">
          <view class="pl-note__row">
            <x-icon name="bell" :size="32" color="#52C41A" />
            <view class="x-flex-1">
              <text class="pl-note__b">
                提醒永久免费
              </text>
              <text>：不受会员影响，不会因为没续费停掉提醒。</text>
            </view>
          </view>
        </x-note>
        <x-note type="blue">
          <view class="pl-note__row">
            <x-icon name="lock" :size="32" color="#4F7CFF" />
            <view class="x-flex-1">
              <text>计划默认</text>
              <text class="pl-note__b">
                仅自己可见
              </text>
              <text>，加入家庭也不会自动共享。</text>
            </view>
          </view>
        </x-note>
      </template>

      <!-- P2d 加载失败（无本地缓存） -->
      <template v-else-if="viewState === 'error'">
        <view class="pl-err">
          <view class="pl-err__ico">
            <x-icon name="wifi-off" :size="56" color="#FA5151" />
          </view>
          <text class="pl-err__title">
            计划加载失败
          </text>
          <view class="pl-err__desc">
            <text>无法连接服务器，也没有找到本机缓存的计划。</text>
            <text>检查网络后重试，或先去添加第一条计划。</text>
          </view>
          <view class="pl-btns">
            <view class="pl-btns__cell">
              <x-button type="ghost" text="添加计划" @click="openAdd" />
            </view>
            <view class="pl-btns__cell">
              <x-button text="重试" icon="refresh-cw" @click="retry" />
            </view>
          </view>
        </view>
      </template>

      <!-- P2 / P2c / P2e / P7c -->
      <template v-else>
        <!-- P2c 离线 / P2e 通知权限 -->
        <view v-if="viewState === 'offline'" class="pl-banner pl-banner--orange">
          <x-icon name="wifi-off" :size="32" color="#C77700" />
          <view class="x-flex-1">
            <view class="pl-banner__title">
              当前离线，显示的是上次成功加载的数据
            </view>
            <view class="pl-banner__sub">
              恢复网络后重试即可刷新（最后更新 {{ lastUpdatedText }}）。
            </view>
            <view class="pl-banner__acts">
              <view class="pl-actbtn pl-actbtn--warn-solid" @tap="retry">
                <x-icon name="refresh-cw" :size="28" color="#FFFFFF" />
                <text>重试连接</text>
              </view>
            </view>
          </view>
        </view>

        <!-- P7c 全部完成 -->
        <view v-if="viewState === 'done'" class="pl-done">
          <view class="pl-done__ico">
            <x-icon name="trophy" :size="88" color="#FFFFFF" />
          </view>
          <text class="pl-done__title">
            今天全部完成
          </text>
          <view class="pl-done__desc">
            <text>{{ totalCount }} / {{ totalCount }} 项都做完了，已连续 </text>
            <text class="pl-done__b">
              {{ streakDays }} 天
            </text>
            <text> 完成全部计划。</text>
          </view>
          <view class="pl-done__stat">
            <view v-for="item in doneStats" :key="item.label" class="pl-done__item">
              <text class="pl-done__num">
                {{ item.value }}
              </text>
              <text class="pl-done__label">
                {{ item.label }}
              </text>
            </view>
          </view>
        </view>

        <!-- P2 / P2c / P2e 进度 hero -->
        <view v-else class="pl-hero">
          <view class="pl-hero__top">
            <view class="pl-hero__date">
              <text>{{ dateLabel }} {{ doneCount }} / {{ totalCount }} 项</text>
              <text class="pl-hero__pct">
                {{ percent }}%
              </text>
            </view>
            <view class="pl-hero__acts">
              <view class="pl-hero__btn pl-hero__btn--primary" aria-label="添加计划" @tap="openAdd">
                <x-icon name="plus" :size="32" color="#4F7CFF" />
              </view>
              <view class="pl-hero__btn" aria-label="刷新数据" @tap="retry">
                <x-icon name="refresh-cw" :size="32" color="#FFFFFF" />
              </view>
            </view>
          </view>
          <view v-if="showDayNav" class="pl-dnav">
            <view
              v-for="day in dayList"
              :key="day.key"
              class="pl-dnav__d"
              :class="{ on: day.on }"
              @tap="onDayTap(day)"
            >
              <text>{{ day.label }}</text>
              <text class="pl-dnav__date">
                {{ day.date }}
              </text>
            </view>
          </view>
          <view class="pl-hero__bar">
            <view class="pl-hero__bar-in" :style="{ width: `${percent}%` }" />
          </view>
        </view>

        <!-- 接下来卡 / 明日预告 -->
        <view class="pl-next" :class="{ 'pl-next--done': viewState === 'done' }">
          <view class="pl-next__eyebrow">
            <view class="pl-next__tag" :class="{ 'pl-next__tag--done': viewState === 'done' }">
              <x-icon
                :name="viewState === 'done' ? 'calendar' : 'clock'"
                :size="28"
                :color="viewState === 'done' ? '#2E7D32' : '#4F7CFF'"
              />
              <text>{{ viewState === 'done' ? '明日预告' : `接下来 · ${nextEntry?.time || '待办'}` }}</text>
            </view>
            <view v-if="viewState === 'done'" class="pl-next__tagcount">
              <x-tag type="green">
                明天 {{ tomorrowCount }} 项
              </x-tag>
            </view>
            <view v-else class="pl-count">
              <x-icon name="clock" :size="28" color="#3A2600" />
              <text>{{ countdownText }}</text>
            </view>
          </view>
          <view class="pl-next__body">
            <view class="pl-next__ico" :class="{ 'pl-next__ico--done': viewState === 'done' }">
              <x-icon
                :name="viewState === 'done' ? 'bell' : nextKind.icon"
                :size="48"
                :color="viewState === 'done' ? '#2E7D32' : nextKind.fg"
              />
            </view>
            <view class="x-flex-1">
              <view class="pl-next__t1">
                {{ viewState === 'done' ? `明天 ${tomorrowFirstTime || '--:--'} 第一项` : (nextEntry?.title || '') }}
              </view>
              <view class="pl-next__t2">
                {{ viewState === 'done' ? tomorrowSummary : (nextEntry?.meta || '') }}
              </view>
            </view>
          </view>
          <view class="pl-next__acts">
            <view class="pl-btn" @tap="handleNext">
              <x-icon v-if="viewState !== 'done'" name="check" :size="28" color="#FFFFFF" />
              <text>{{ viewState === 'done' ? '查看本周记录' : (nextEntry?.actText || '完成打卡') }}</text>
            </view>
            <view class="pl-btn pl-btn--plain" @tap="handleLater">
              <text>{{ viewState === 'done' ? '查看明日计划' : '稍后 15 分' }}</text>
            </view>
          </view>
        </view>

        <!-- 昨日漏打卡：服务端按前一日排期与打卡记录派生 -->
        <view v-if="missed && !missedDismissed" class="pl-miss">
          <x-icon name="circle-alert" :size="32" color="#FFB020" />
          <text class="pl-miss__text">
            {{ missed.text }}
          </text>
          <view class="pl-miss__act" @tap="makeupMissed">
            <text>现在补登</text>
            <x-icon name="chev-r" :size="28" color="#C77700" />
          </view>
          <text class="pl-miss__skip" @tap="missedDismissed = true">
            跳过
          </text>
        </view>

        <!-- 分类筛选：后端按 plan_type 聚合当日条目数 -->
        <scroll-view v-if="viewState === 'data'" class="pl-chips" scroll-x :show-scrollbar="false">
          <view class="pl-chips__in">
            <x-chip text="全部" :active="chip === 'all'" @click="chip = 'all'" />
            <x-chip
              v-for="item in chips"
              :key="item.key"
              :text="`${item.label} · ${item.count}`"
              :icon="item.icon"
              :active="chip === item.key"
              @click="chip = item.key"
            />
          </view>
        </scroll-view>

        <!-- 已完成分组：点击展开已完成的卡片 -->
        <view v-if="(viewState === 'data' || viewState === 'done') && finishedCount > 0" class="pl-donegroup" @tap="showFinished = !showFinished">
          <view class="pl-donegroup__text">
            <view class="pl-donegroup__b">
              <x-icon name="check" :size="28" color="#2E7D32" />
              <text>{{ viewState === 'done' ? `今天 ${finishedCount} 项全部完成` : `已完成 ${finishedCount} 项` }}</text>
            </view>
            <text>：{{ doneSummary || '点击查看明细' }}</text>
          </view>
          <view class="pl-donegroup__exp">
            <text>{{ showFinished ? '收起' : '展开' }}</text>
            <x-icon name="chev-d" :size="28" color="#7B8494" />
          </view>
        </view>

        <!-- 待办 / 已完成计划卡 -->
        <view
          v-for="plan in shownPlans"
          :key="plan.key"
          class="pl-card"
          :class="[`pl-card--${plan.kind}`, { 'pl-card--done': isDone(plan) }]"
        >
          <view class="pl-card__hd">
            <view class="pl-card__ico" :style="{ background: kindOf(plan.kind).bg }">
              <x-icon :name="kindOf(plan.kind).icon" :size="48" :color="kindOf(plan.kind).fg" />
            </view>
            <view class="pl-card__time">
              <text>{{ plan.time || '按需' }}</text>
              <text class="pl-card__kicker">
                {{ plan.kicker }}
              </text>
            </view>
            <view class="x-flex-1">
              <view class="pl-card__t1">
                {{ plan.title }}
              </view>
              <view class="pl-card__meta">
                {{ planMeta(plan) }}
              </view>
            </view>
            <x-tag v-if="isDone(plan)" type="green">
              已完成
            </x-tag>
            <x-tag v-else-if="plan.status === 'missed'" type="orange">
              已超时
            </x-tag>
            <view class="pl-card__more" aria-label="管理计划" @tap="openManage(plan)">
              <x-icon name="more" :size="32" color="#8A93A5" />
            </view>
          </view>
          <view v-if="!isDone(plan)" class="pl-card__acts">
            <view class="pl-btn" @tap="doCheckin(plan)">
              <x-icon name="check" :size="28" color="#FFFFFF" />
              <text>{{ plan.actText }}</text>
            </view>
            <view class="pl-btn pl-btn--plain" @tap="snooze(plan)">
              <text>稍后 15 分</text>
            </view>
          </view>
          <view v-else-if="plan.recordId" class="pl-card__acts">
            <view class="pl-btn pl-btn--plain" @tap="undoCheckin(plan)">
              <text>撤销打卡</text>
            </view>
          </view>
        </view>

        <x-note v-if="viewState === 'offline'" type="green">
          当前展示的是上次成功加载的数据，联网后点「重试连接」即可刷新；打卡操作仍需联网。
        </x-note>
        <x-note v-if="viewState === 'done'" type="blue">
          明天 {{ tomorrowFirstTime || '按排期' }} 起照常提醒，今晚不会再打扰你。
        </x-note>
      </template>
    </view>

    <!-- P7b 计划卡 ⋯ 管理菜单 -->
    <x-sheet v-model:show="manageShow" :title="manageTitle" :sub="manageSub">
      <view class="pl-menu">
        <view
          v-for="item in manageMenu"
          :key="item.key"
          class="pl-menu__item"
          :class="{ 'pl-menu__item--danger': item.danger }"
          @tap="onManage(item.key)"
        >
          <x-icon :name="item.icon" :size="32" :color="item.danger ? '#D93025' : '#4F7CFF'" />
          <view class="x-flex-1">
            <view class="pl-menu__t1">
              {{ item.title }}
            </view>
            <view class="pl-menu__t2">
              {{ item.sub }}
            </view>
          </view>
        </view>
      </view>
      <template #footer>
        <x-button type="link" text="取消" @click="manageShow = false" />
      </template>
    </x-sheet>

    <!-- 快速添加 / 编辑计划：POST/PUT /app/xq/plan -->
    <x-sheet v-model:show="formShow" :title="formEditId ? '编辑计划' : '添加计划'" sub="保存到服务端，时段用 HH:mm 逗号分隔">
      <view class="pl-form">
        <text class="pl-form__label">
          计划类型
        </text>
        <scroll-view class="pl-form__scroll" scroll-x :show-scrollbar="false">
          <view class="pl-form__chips">
            <x-chip
              v-for="k in KIND_OPTIONS"
              :key="k.value"
              :text="k.label"
              :icon="k.icon"
              small
              :active="form.planType === k.value"
              @click="form.planType = k.value"
            />
          </view>
        </scroll-view>

        <text class="pl-form__label">
          计划名称
        </text>
        <input v-model="form.planName" class="pl-form__input" placeholder="例如：喝水 300ml">

        <text class="pl-form__label">
          执行时段
        </text>
        <input v-model="form.timesText" class="pl-form__input" placeholder="08:00,20:00">
        <text class="pl-form__hint">
          多个时段用逗号分隔，保存后整体替换原时段
        </text>

        <text class="pl-form__label">
          频率
        </text>
        <view class="pl-form__chips pl-form__chips--wrap">
          <x-chip
            v-for="f in FREQ_OPTIONS"
            :key="f.value"
            :text="f.label"
            small
            :active="form.frequencyType === f.value"
            @click="form.frequencyType = f.value"
          />
        </view>
        <input v-if="freqHint" v-model="form.frequencyValue" class="pl-form__input" :placeholder="freqHint">

        <text class="pl-form__label">
          可见范围
        </text>
        <view class="pl-form__chips">
          <x-chip text="仅自己" :active="form.visibleScope === 0" @click="form.visibleScope = 0" />
          <x-chip text="家人" :active="form.visibleScope === 1" @click="form.visibleScope = 1" />
        </view>

        <view class="pl-form__more" @tap="gotoType">
          使用完整创建流程 ›
        </view>
      </view>
      <template #footer>
        <x-button type="link" text="取消" @click="formShow = false" />
        <x-button text="保存" :disabled="formSaving" @click="saveForm" />
      </template>
    </x-sheet>

    <!-- 打卡历史：GET /app/xq/plan/{id}/history 或 /app/xq/medication/record/week -->
    <x-sheet v-model:show="historyShow" title="打卡历史" sub="近 30 天">
      <view class="pl-hist">
        <view class="pl-hist__stats">
          <view class="pl-hist__cell">
            <text class="pl-hist__num">
              {{ historyData?.doneCount ?? 0 }}
            </text>
            <text>完成条数</text>
          </view>
          <view class="pl-hist__cell">
            <text class="pl-hist__num">
              {{ historyData?.rate ?? 0 }}%
            </text>
            <text>完成率</text>
          </view>
          <view class="pl-hist__cell">
            <text class="pl-hist__num">
              {{ historyData?.streakDays ?? 0 }}
            </text>
            <text>连续天数</text>
          </view>
        </view>
        <view v-if="historyRows.length === 0" class="pl-hist__empty">
          近 30 天还没有打卡记录
        </view>
        <view v-for="(row, idx) in historyRows" :key="idx" class="pl-hist__row">
          {{ row }}
        </view>
      </view>
      <template #footer>
        <x-button type="link" text="关闭" @click="historyShow = false" />
      </template>
    </x-sheet>

    <!-- 本周统计：全部来自 /app/xq/plan/today 的服务端派生字段 -->
    <x-sheet v-model:show="statsShow" title="本周记录" sub="数据来自服务端实时统计">
      <view class="pl-hist">
        <view class="pl-hist__stats">
          <view class="pl-hist__cell">
            <text class="pl-hist__num">
              {{ doneCount }}
            </text>
            <text>今日完成</text>
          </view>
          <view class="pl-hist__cell">
            <text class="pl-hist__num">
              {{ streakDays }}
            </text>
            <text>连续天数</text>
          </view>
          <view class="pl-hist__cell">
            <text class="pl-hist__num">
              {{ data?.weekRate ?? 0 }}%
            </text>
            <text>本周完成率</text>
          </view>
        </view>
        <view class="pl-hist__row">
          本周应完成 {{ data?.weekTotal ?? 0 }} 项，已完成 {{ data?.weekDone ?? 0 }} 项
        </view>
        <view class="pl-hist__row">
          明日排期 {{ tomorrowCount }} 项，开始时间 {{ tomorrowFirstTime || '按需' }}
        </view>
      </view>
      <template #footer>
        <x-button type="link" text="关闭" @click="statsShow = false" />
      </template>
    </x-sheet>
  </x-page>
</template>

<script setup lang="ts">
import type { PlanDayVo, PlanEntryVo, PlanHistoryVo, PlanSaveBo, PlanTodayVo } from '@/api/xiaoqi/plan';
import type { PlanKind } from '@/mock/plan';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { PlanApi } from '@/api';
import { MedicationApi } from '@/api/xiaoqi/medication';
import { planKind } from '@/mock/plan';
import { cnDate } from '@/utils/date';

/**
 * 计划 Tab：全部数据来自 /app/xq/plan/today（C 端 XqPlanBizController）。
 * 服务端聚合 xq_plan + xq_medication_plan 两类计划，并派生进度、接下来、
 * 分类统计、漏打卡、连续天数与本周完成率；前端只做展示与动作分发。
 *
 * 原型 P1/P2/P2b/P2c/P2d/P7b/P7c 的 UI 结构保留，
 * skeleton / empty / error / offline / data / done 六态由真实请求结果推导。
 */
type ViewState = 'skeleton' | 'empty' | 'error' | 'offline' | 'data' | 'done';

const CACHE_TODAY = 'xq_plan_today_cache';
const CACHE_SNOOZE = 'xq_plan_snooze';

/** 计划类型选项，value 对应 xq_plan.plan_type */
const KIND_OPTIONS: Array<{ value: number; label: string; icon: string }> = [
  { value: 0, label: '用药', icon: 'pill' },
  { value: 1, label: '保健品', icon: 'heart-pulse' },
  { value: 2, label: '喝水', icon: 'droplet' },
  { value: 3, label: '运动', icon: 'activity' },
  { value: 4, label: '宠物', icon: 'paw-print' },
  { value: 5, label: '植物', icon: 'sprout' },
  { value: 6, label: '健康', icon: 'heart-pulse' },
  { value: 7, label: '自定义', icon: 'list-checks' },
];

const FREQ_OPTIONS: Array<{ value: number; label: string; hint: string }> = [
  { value: 0, label: '每天', hint: '' },
  { value: 4, label: '按需', hint: '' },
  { value: 1, label: '每周', hint: '周几，如 1,3,5（1=周一）' },
  { value: 2, label: '每月', hint: '几号，如 15' },
  { value: 3, label: '每 N 天', hint: '间隔天数，如 3' },
];

/** 空态里的静态引导示例（产品示意，不是接口数据） */
const PREVIEW_ITEMS: Array<{ time: string; kind: PlanKind; title: string; sub: string }> = [
  { time: '08:00', kind: 'medication', title: '布洛芬 1 粒', sub: '到点会提醒' },
  { time: '14:00', kind: 'water', title: '喝水 300ml', sub: '每天 6 次' },
  { time: '19:00', kind: 'exercise', title: '快走 30 分钟', sub: '每周 3 次' },
];

const tabPath = '/pages/tab/plan/index';
const data = ref<PlanTodayVo | null>(null);
const loading = ref(true);
const loadError = ref(false);
const hasCache = ref(false);
const lastUpdatedText = ref('--:--');
const currentDate = ref('');
const chip = ref('all');
const showFinished = ref(false);
const missedDismissed = ref(false);
const actionBusy = ref(false);

/** 计划卡 ⋯ 管理 */
const manageShow = ref(false);
const manageEntry = ref<PlanEntryVo | null>(null);
const manageScope = ref<0 | 1>(0);
const manageStatus = ref<0 | 2>(0);

/** 快速添加 / 编辑弹层 */
const formShow = ref(false);
const formEditId = ref<number | string | null>(null);
const formSaving = ref(false);
const form = ref({ planName: '', planType: 2, timesText: '08:00,20:00', frequencyType: 0, frequencyValue: '', visibleScope: 0 });

/** 历史 / 统计弹层 */
const historyShow = ref(false);
const historyData = ref<PlanHistoryVo | null>(null);
const historyRows = ref<string[]>([]);
const statsShow = ref(false);

/** 「稍后 15 分」是本地延后标记（不写服务端、不改打卡数据） */
const snoozed = ref<Record<string, number>>({});

const viewState = computed<ViewState>(() => {
  if (loading.value && !data.value) {
    return 'skeleton';
  }
  if (loadError.value) {
    return hasCache.value ? 'offline' : 'error';
  }
  if (!data.value || data.value.total === 0) {
    return 'empty';
  }
  return data.value.pending.length === 0 ? 'done' : 'data';
});

/** 用布尔量表达日期导航显隐，避开模板 v-if/v-else 链对联合类型的收窄 */
const showDayNav = computed(() => viewState.value === 'data' || viewState.value === 'done');
const dateText = computed(() => cnDate(currentDate.value || undefined));
const dateLabel = computed(() => {
  if (!currentDate.value || currentDate.value === localDate()) {
    return '今天';
  }
  if (currentDate.value === shiftDate(-1)) {
    return '昨天';
  }
  if (currentDate.value === shiftDate(1)) {
    return '明天';
  }
  return '当日';
});

const totalCount = computed(() => data.value?.total ?? 0);
const doneCount = computed(() => data.value?.done ?? 0);
const percent = computed(() => data.value?.percent ?? 0);
const streakDays = computed(() => data.value?.streakDays ?? 0);
const dayList = computed<PlanDayVo[]>(() => data.value?.days ?? []);
const chips = computed(() => data.value?.chips ?? []);
const nextEntry = computed(() => data.value?.next ?? null);
const missed = computed(() => data.value?.missed ?? null);
const doneSummary = computed(() => data.value?.doneSummary ?? '');
const finishedCount = computed(() => data.value?.finished.length ?? 0);
const tomorrowCount = computed(() => data.value?.tomorrow.count ?? 0);
const tomorrowFirstTime = computed(() => data.value?.tomorrow.firstTime || '');
const tomorrowSummary = computed(() => {
  const t = data.value?.tomorrow;
  if (!t) {
    return '';
  }
  return [t.firstTitle, t.summary].filter(Boolean).join(' · ');
});

const doneStats = computed(() => [
  { value: String(doneCount.value), label: '今日完成' },
  { value: String(streakDays.value), label: '连续天数' },
  { value: `${data.value?.weekRate ?? 0}%`, label: '本周完成率' },
]);

const nextKind = computed(() => kindOf(nextEntry.value?.kind || 'custom'));
const freqHint = computed(() => FREQ_OPTIONS.find(f => f.value === form.value.frequencyType)?.hint || '');
const countdownText = computed(() => {
  const left = nextEntry.value?.minutesLeft;
  if (left == null) {
    return '到点了';
  }
  return left <= 0 ? '到点了' : `还有 ${left} 分`;
});

const manageTitle = computed(() => `${manageEntry.value?.kicker || '计划'} · 管理`);
const manageSub = computed(() => manageEntry.value?.meta || '');
/** 喝水 / 用药的设置页（原型 P4 / P5、P5b） */
const manageSetting = computed(() => {
  const entry = manageEntry.value;
  if (!entry) {
    return null;
  }
  if (entry.source === 'medication' || entry.planType === 0 || entry.kind === 'medication') {
    return { url: '/pages/plan/medication/index', title: '用药设置', sub: '按时 / 按需模式、剂量与库存' };
  }
  if (entry.kind === 'water' || entry.planType === 2) {
    return { url: '/pages/plan/setting/index', title: '喝水设置', sub: '名称、频率、时段与提醒' };
  }
  return null;
});
const manageMenu = computed(() => [
  { key: 'edit', icon: 'pencil', title: '编辑计划', sub: '修改名称、频率与时段', danger: false },
  ...(manageSetting.value
    ? [{ key: 'setting', icon: 'sliders', title: manageSetting.value.title, sub: manageSetting.value.sub, danger: false }]
    : []),
  { key: 'history', icon: 'history', title: '查看打卡历史', sub: '近 30 天完成率与连续天数', danger: false },
  { key: 'pause', icon: 'pause', title: manageStatus.value === 2 ? '恢复计划' : '暂停计划', sub: manageStatus.value === 2 ? '恢复后按原排期提醒' : '暂停后不再出现在今日计划', danger: false },
  { key: 'scope', icon: 'eye', title: '可见范围', sub: manageScope.value === 1 ? '当前家人可见，点击改为仅自己' : '当前仅自己可见，点击改为家人', danger: false },
  { key: 'copy', icon: 'copy', title: '复制为新计划', sub: '沿用配置与时段，另建一条', danger: false },
  { key: 'delete', icon: 'trash-2', title: '删除计划', sub: '需二次确认 · 历史打卡记录保留', danger: true },
]);

/** 待办卡片；展开已完成分组时把已完成项追加在后面 */
const shownPlans = computed<PlanEntryVo[]>(() => {
  const d = data.value;
  if (!d) {
    return [];
  }
  const pending = chip.value === 'all' ? d.pending : d.pending.filter(e => e.kind === chip.value);
  if (!showFinished.value) {
    return pending;
  }
  const finished = chip.value === 'all' ? d.finished : d.finished.filter(e => e.kind === chip.value);
  return [...pending, ...finished];
});

// ==================== 数据加载 ====================

async function load(silent = false) {
  if (!silent || !data.value) {
    loading.value = true;
  }
  try {
    const res = await PlanApi.today(currentDate.value || undefined);
    data.value = res;
    hasCache.value = true;
    loadError.value = false;
    lastUpdatedText.value = hhmm(Date.now());
    uni.setStorageSync(CACHE_TODAY, res);
  }
  catch {
    loadError.value = true;
    if (!data.value) {
      const cached = uni.getStorageSync(CACHE_TODAY) as PlanTodayVo | null;
      if (cached) {
        data.value = cached;
        hasCache.value = true;
      }
    }
  }
  finally {
    loading.value = false;
  }
}

function retry() {
  void load(false);
}

function onDayTap(day: PlanDayVo) {
  currentDate.value = day.key === 'today' ? '' : day.value;
  showFinished.value = false;
  void load(false);
}

/** onLoad 与 onShow 会连续触发，避免首次进入重复请求 */
let firstLoaded = false;

onLoad(() => {
  restoreSnooze();
  void load(false).finally(() => {
    firstLoaded = true;
  });
});

onShow(() => {
  // 从子页面返回时静默刷新，不闪骨架
  if (firstLoaded) {
    void load(true);
  }
});

// ==================== 卡片展示 ====================

function kindOf(kind: string) {
  return planKind(kind as PlanKind);
}

function isDone(entry: PlanEntryVo): boolean {
  return entry.status === 'taken' || entry.status === 'skipped';
}

function planMeta(entry: PlanEntryVo): string {
  if (isDone(entry)) {
    return entry.status === 'skipped' ? '已跳过本次' : `已完成 ${entry.actualTime || ''}`;
  }
  const parts = [entry.meta];
  if (entry.status === 'missed') {
    parts.push('已超时');
  }
  const until = snoozed.value[entry.key];
  if (until) {
    parts.push(`已延后至 ${hhmm(until)}`);
  }
  return parts.filter(Boolean).join(' · ');
}

// ==================== 打卡动作 ====================

async function doCheckin(entry: PlanEntryVo) {
  if (actionBusy.value) {
    return;
  }
  actionBusy.value = true;
  try {
    const payload = {
      planId: entry.planId,
      scheduleId: entry.scheduleId ?? undefined,
      date: currentDate.value || undefined,
    };
    if (entry.source === 'medication') {
      await MedicationApi.checkin(payload);
    }
    else {
      await PlanApi.checkin(payload);
    }
    toast('打卡成功');
    await load(true);
  }
  finally {
    actionBusy.value = false;
  }
}

async function undoCheckin(entry: PlanEntryVo) {
  if (!entry.recordId || actionBusy.value) {
    return;
  }
  actionBusy.value = true;
  try {
    if (entry.source === 'medication') {
      await MedicationApi.undo(entry.recordId);
    }
    else {
      await PlanApi.undo(entry.recordId);
    }
    toast('已撤销');
    await load(true);
  }
  finally {
    actionBusy.value = false;
  }
}

async function makeupMissed() {
  const m = missed.value;
  if (!m || actionBusy.value) {
    return;
  }
  actionBusy.value = true;
  try {
    const date = shiftDate(-1);
    const payload = { planId: m.planId, scheduleId: m.scheduleId ?? undefined, date };
    if (m.source === 'medication') {
      await MedicationApi.makeup(payload);
    }
    else {
      await PlanApi.checkin({ ...payload, recordType: 0 as const });
    }
    missedDismissed.value = true;
    toast('已补登');
    await load(true);
  }
  finally {
    actionBusy.value = false;
  }
}

/** 延后 15 分钟：纯本地标记，到期自动失效，不改服务端数据 */
function snooze(entry: PlanEntryVo) {
  const until = Date.now() + 15 * 60 * 1000;
  snoozed.value = { ...snoozed.value, [entry.key]: until };
  uni.setStorageSync(CACHE_SNOOZE, snoozed.value);
  toast(`已延后至 ${hhmm(until)}`);
}

function restoreSnooze() {
  const raw = uni.getStorageSync(CACHE_SNOOZE) as Record<string, number> | null;
  const now = Date.now();
  const next: Record<string, number> = {};
  Object.entries(raw || {}).forEach(([key, value]) => {
    if (typeof value === 'number' && value > now) {
      next[key] = value;
    }
  });
  snoozed.value = next;
  uni.setStorageSync(CACHE_SNOOZE, next);
}

// ==================== 接下来 / 明日 ====================

function handleNext() {
  if (viewState.value === 'done') {
    statsShow.value = true;
    return;
  }
  const entry = nextEntry.value;
  if (entry) {
    void doCheckin(entry);
  }
}

function handleLater() {
  if (viewState.value === 'done') {
    currentDate.value = shiftDate(1);
    void load(false);
    return;
  }
  const entry = nextEntry.value;
  if (entry) {
    snooze(entry);
  }
}

// ==================== 计划管理 ====================

function openAdd() {
  formEditId.value = null;
  form.value = { planName: '', planType: 2, timesText: '08:00,20:00', frequencyType: 0, frequencyValue: '', visibleScope: 0 };
  formShow.value = true;
}

async function openManage(entry: PlanEntryVo) {
  manageEntry.value = entry;
  manageShow.value = true;
  if (entry.source !== 'plan') {
    return;
  }
  try {
    const detail = await PlanApi.detail(entry.planId);
    manageScope.value = detail.plan.visibleScope === 1 ? 1 : 0;
    manageStatus.value = detail.plan.status === 2 ? 2 : 0;
  }
  catch {
    // 详情失败不影响菜单展示，拦截器已提示
  }
}

async function openEdit() {
  const entry = manageEntry.value;
  if (!entry) {
    return;
  }
  if (entry.source !== 'plan') {
    uni.navigateTo({ url: '/pages/med/plan/index' });
    return;
  }
  try {
    const detail = await PlanApi.detail(entry.planId);
    formEditId.value = detail.plan.id ?? null;
    form.value = {
      planName: detail.plan.planName,
      planType: detail.plan.planType,
      timesText: detail.schedules.map(s => String(s.scheduleTime || '').slice(0, 5)).join(','),
      frequencyType: detail.plan.frequencyType ?? 0,
      frequencyValue: detail.plan.frequencyValue || '',
      visibleScope: detail.plan.visibleScope ?? 0,
    };
    formShow.value = true;
  }
  catch {
    // 拦截器已提示
  }
}

async function saveForm() {
  if (formSaving.value) {
    return;
  }
  const planName = form.value.planName.trim();
  if (!planName) {
    toast('请填写计划名称');
    return;
  }
  const times = form.value.timesText.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean);
  if (times.length === 0) {
    toast('请至少填写一个时段');
    return;
  }
  if (times.some(t => !/^\d{2}:\d{2}$/.test(t))) {
    toast('时段格式应为 HH:mm');
    return;
  }
  const body: PlanSaveBo = {
    planName,
    planType: form.value.planType,
    frequencyType: form.value.frequencyType,
    frequencyValue: form.value.frequencyValue.trim() || undefined,
    visibleScope: form.value.visibleScope,
    startDate: localDate(),
    times: times.map(time => ({ time })),
  };
  formSaving.value = true;
  try {
    if (formEditId.value) {
      await PlanApi.update({ ...body, id: formEditId.value });
    }
    else {
      await PlanApi.add(body);
    }
    formShow.value = false;
    toast('已保存');
    await load(true);
  }
  finally {
    formSaving.value = false;
  }
}

async function openHistory() {
  const entry = manageEntry.value;
  if (!entry) {
    return;
  }
  try {
    if (entry.source === 'plan') {
      const res = await PlanApi.history(entry.planId, 30);
      historyData.value = res;
      historyRows.value = res.records.map(r =>
        `${r.planDate} ${String(r.planTime || '').slice(0, 5)} ${r.recordType === 1 ? '跳过' : '完成'}`);
    }
    else {
      const rows = await MedicationApi.week();
      historyData.value = {
        doneCount: rows.length,
        rate: 0,
        streakDays: data.value?.streakDays ?? 0,
        records: [],
      };
      historyRows.value = rows.map(r =>
        `${r.planDate} ${String(r.planTime || '').slice(0, 5)} ${r.recordType === 1 ? '跳过' : '服用'}`);
    }
    historyShow.value = true;
  }
  catch {
    // 拦截器已提示
  }
}

async function onManage(key: string) {
  manageShow.value = false;
  const entry = manageEntry.value;
  if (!entry) {
    return;
  }
  if (key === 'edit') {
    await openEdit();
    return;
  }
  if (key === 'history') {
    await openHistory();
    return;
  }
  if (key === 'setting') {
    if (manageSetting.value) {
      uni.navigateTo({ url: manageSetting.value.url });
    }
    return;
  }
  if (key === 'delete') {
    confirmRemove(entry);
    return;
  }
  if (entry.source !== 'plan') {
    toast('用药计划请在「用药」页管理');
    return;
  }
  try {
    if (key === 'pause') {
      const next: 0 | 2 = manageStatus.value === 2 ? 0 : 2;
      await PlanApi.setStatus(entry.planId, next);
      manageStatus.value = next;
      toast(next === 2 ? '已暂停' : '已恢复');
    }
    else if (key === 'scope') {
      const next: 0 | 1 = manageScope.value === 1 ? 0 : 1;
      await PlanApi.setScope(entry.planId, next);
      manageScope.value = next;
      toast(next === 1 ? '已设为家人可见' : '已设为仅自己可见');
    }
    else if (key === 'copy') {
      await PlanApi.copy(entry.planId);
      toast('已复制为新计划');
    }
    await load(true);
  }
  catch {
    // 拦截器已提示
  }
}

function confirmRemove(entry: PlanEntryVo) {
  if (entry.source !== 'plan') {
    toast('用药计划请在「用药」页删除');
    return;
  }
  uni.showModal({
    title: '删除计划',
    content: `确定删除「${entry.title}」？删除后不再出现在今日计划，历史打卡记录保留。`,
    success: async (res) => {
      if (!res.confirm) {
        return;
      }
      try {
        await PlanApi.remove(entry.planId);
        toast('已删除');
        await load(true);
      }
      catch {
        // 拦截器已提示
      }
    },
  });
}

function gotoType() {
  formShow.value = false;
  uni.navigateTo({ url: '/pages/plan/type/index' });
}

function notReady(label: string) {
  toast(`${label}暂未开放`);
}

// ==================== 工具 ====================

function toast(title: string) {
  uni.showToast({ title, icon: 'none' });
}

function localDate(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function shiftDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localDate(d);
}

function hhmm(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
</script>

<style lang="scss" scoped>
.pl-body {
  padding: 0 32rpx 32rpx;
}

.pl-status {
  height: var(--status-bar-height, 40rpx);
}

/* P2c / P2d 页内网络标识 */
.pl-net {
  display: flex;
  gap: 8rpx;
  align-items: center;
  justify-content: flex-end;
  padding: 4rpx 0;
  font-size: var(--fs-sub);
  font-weight: 600;
  color: #c77700;

  &--bad {
    color: var(--color-danger-strong);
  }
}

/* 头部 */
.pl-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0 28rpx;
}

.pl-hdr__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pl-hdr__h1 {
  font-size: var(--fs-h1);
  font-weight: 700;
  line-height: 1.3;
  color: var(--color-text);
}

.pl-hdr__sub {
  margin-top: 2rpx;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}

.pl-lock {
  display: inline-flex;
  flex-shrink: 0;
  gap: 6rpx;
  align-items: center;
  padding: 6rpx 18rpx;
  font-size: var(--fs-caption);
  font-weight: 600;
  color: #7b8494;
  white-space: nowrap;
  background: #f0f2f6;
  border-radius: 16rpx;
}

/* 骨架屏 */
.pl-sk {
  background: linear-gradient(90deg, #eef0f5 25%, #f5f7fb 50%, #eef0f5 75%);
  background-size: 200% 100%;
  border-radius: 8rpx;
  animation: pl-sk 1.4s infinite;
}

.pl-sk--lock {
  width: 172rpx;
  height: 56rpx;
  border-radius: 20rpx;
}

.pl-sk--hero {
  height: 260rpx;
  margin-bottom: 24rpx;
  border-radius: 40rpx;
}

.pl-sk--next {
  height: 280rpx;
  margin-bottom: 24rpx;
  border-radius: 36rpx;
}

.pl-sk--line {
  height: 72rpx;
  margin-bottom: 24rpx;
  border-radius: 24rpx;
}

.pl-sk-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;

  .pl-sk--chip {
    flex: 1;
    height: 88rpx;
    border-radius: 44rpx;
  }
}

.pl-sk--group {
  height: 96rpx;
  margin-bottom: 24rpx;
  border-radius: 24rpx;
}

.pl-sk--card {
  height: 220rpx;
  margin-bottom: 20rpx;
  border-radius: 32rpx;
}

.pl-sk--last {
  margin-bottom: 0;
}

.pl-sk__tip {
  margin-top: 24rpx;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
  text-align: center;
}

@keyframes pl-sk {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

/* P1 空态 */
.pl-empty {
  position: relative;
  padding: 44rpx 40rpx 40rpx;
  margin-bottom: 28rpx;
  overflow: hidden;
  text-align: center;
  background: linear-gradient(160deg, #f2f6ff, #fafbff);
  border-radius: 40rpx;
}

.pl-empty__ico {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 152rpx;
  height: 152rpx;
  margin: 0 auto 24rpx;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 16rpx 48rpx rgb(79 124 255 / 15%);
}

.pl-empty__title {
  display: block;
  margin-bottom: 16rpx;
  font-size: 40rpx;
  font-weight: 700;
  color: var(--color-text);
}

.pl-empty__desc {
  display: block;
  padding: 0 16rpx;
  font-size: 26rpx;
  line-height: 1.8;
  color: var(--color-text-sub);
}

.pl-preview {
  position: relative;
  padding: 32rpx;
  margin-bottom: 24rpx;
  background: #ffffff;
  border: 3rpx dashed #c9d6ff;
  border-radius: 32rpx;
}

.pl-preview__badge {
  position: absolute;
  top: -18rpx;
  left: 32rpx;
  padding: 4rpx 20rpx;
  font-size: 20rpx;
  font-weight: 700;
  color: #ffffff;
  background: var(--color-primary);
  border-radius: 20rpx;
}

.pl-preview__head {
  display: flex;
  gap: 12rpx;
  align-items: center;
  margin-bottom: 20rpx;
  font-size: var(--fs-sub);
  color: #8a93a5;
}

.pl-preview__item {
  display: flex;
  gap: 20rpx;
  align-items: center;
  padding: 18rpx 20rpx;
  margin-bottom: 16rpx;
  background: #f7f9ff;
  border-radius: 24rpx;

  &:last-of-type {
    margin-bottom: 0;
  }
}

.pl-preview__time {
  flex-shrink: 0;
  min-width: 88rpx;
  font-size: 28rpx;
  font-weight: 800;
  color: var(--color-primary);
}

.pl-preview__ico {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 60rpx;
  height: 60rpx;
  border-radius: 18rpx;
}

.pl-preview__t1 {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--color-text);
}

.pl-preview__t2 {
  margin-top: 2rpx;
  font-size: 22rpx;
  color: #8a93a5;
}

.pl-preview__check {
  flex-shrink: 0;
  width: 40rpx;
  height: 40rpx;
  border: 4rpx solid #d9dee8;
  border-radius: 50%;
}

.pl-preview__more {
  display: flex;
  gap: 8rpx;
  align-items: center;
  justify-content: center;
  min-height: 88rpx;
  margin-top: 16rpx;
  font-size: var(--fs-sub);
  font-weight: 700;
  color: var(--color-primary);
  text-align: center;
}

.pl-note {
  margin-top: 28rpx;
}

.pl-note__row {
  display: flex;
  gap: 20rpx;
  align-items: flex-start;
}

.pl-note__b {
  font-weight: 700;
}

/* P2d 错误态 */
.pl-err {
  padding: 96rpx 60rpx 40rpx;
  text-align: center;
}

.pl-err__ico {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 160rpx;
  height: 160rpx;
  margin: 0 auto;
  background: #fff0f0;
  border-radius: 50%;
}

.pl-err__title {
  display: block;
  margin: 28rpx 0 12rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: var(--color-text);
}

.pl-err__desc {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  font-size: var(--fs-sub);
  line-height: 1.7;
  color: var(--color-text-sub);
}

.pl-btns {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

.pl-btns__cell {
  flex: 1;
}

/* P2c / P2e 顶部横幅 */
.pl-banner {
  display: flex;
  gap: 20rpx;
  align-items: flex-start;
  padding: 24rpx 28rpx;
  margin-bottom: 24rpx;
  font-size: 26rpx;
  line-height: 1.6;
  border-radius: 28rpx;

  &--orange {
    color: #8a5a00;
    background: #fff6e5;
    border: 2rpx solid #ffe2b8;
  }
}

.pl-banner__title {
  font-weight: 700;
}

.pl-banner__sub {
  margin-top: 6rpx;
  font-size: var(--fs-sub);
  opacity: 0.9;
}

.pl-banner__acts {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 18rpx;
}

.pl-actbtn {
  display: inline-flex;
  gap: 10rpx;
  align-items: center;
  min-height: 88rpx;
  padding: 0 28rpx;
  font-size: var(--fs-sub);
  font-weight: 700;
  background: #ffffff;
  border: 2rpx solid #f0cf90;
  border-radius: 20rpx;

  &--warn {
    color: #c77700;
  }

  &--warn-solid {
    color: #ffffff;
    background: #c77700;
    border-color: #c77700;
  }
}

/* P2 进度 hero */
.pl-hero {
  position: relative;
  padding: 32rpx 36rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
  color: #ffffff;
  background: linear-gradient(135deg, #4f7cff, #7b5cff);
  border-radius: 40rpx;
}

.pl-hero__top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pl-hero__date {
  display: flex;
  align-items: baseline;
  font-size: 28rpx;
  font-weight: 700;
}

.pl-hero__pct {
  margin-left: 12rpx;
  font-size: var(--fs-sub);
  font-weight: 600;
  opacity: 0.8;
}

.pl-hero__acts {
  display: flex;
  gap: 12rpx;
  align-items: center;
  margin: -12rpx -16rpx -12rpx 0;
}

.pl-hero__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  background: rgb(255 255 255 / 14%);
  border-radius: 20rpx;

  &--primary {
    color: #4f7cff;
    background: rgb(255 255 255 / 95%);
  }
}

.pl-dnav {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 12rpx;
  margin: 24rpx 0 16rpx;
}

.pl-dnav__d {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2rpx;
  align-items: center;
  justify-content: center;
  min-height: 80rpx;
  font-size: var(--fs-caption);
  color: rgb(255 255 255 / 85%);
  background: rgb(255 255 255 / 12%);
  border-radius: 20rpx;

  &.on {
    font-weight: 700;
    color: #4f7cff;
    background: #ffffff;
  }
}

.pl-dnav__date {
  font-size: 18rpx;
  opacity: 0.75;
}

.pl-hero__bar {
  position: relative;
  z-index: 1;
  height: 12rpx;
  margin-top: 24rpx;
  overflow: hidden;
  background: rgb(255 255 255 / 22%);
  border-radius: 6rpx;
}

.pl-hero__bar-in {
  height: 100%;
  background: #ffffff;
  border-radius: 6rpx;
}

/* P7c 全部完成 hero */
.pl-done {
  position: relative;
  padding: 48rpx 40rpx;
  margin-bottom: 28rpx;
  overflow: hidden;
  color: #ffffff;
  text-align: center;
  background: linear-gradient(135deg, #52c41a, #8fd44a);
  border-radius: 40rpx;
}

.pl-done__ico {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 144rpx;
  height: 144rpx;
  margin: 0 auto 24rpx;
  background: rgb(255 255 255 / 22%);
  border-radius: 50%;
}

.pl-done__title {
  display: block;
  margin-bottom: 12rpx;
  font-size: 40rpx;
  font-weight: 700;
}

.pl-done__desc {
  font-size: 26rpx;
  line-height: 1.7;
  opacity: 0.9;
}

.pl-done__b {
  font-weight: 700;
}

.pl-done__stat {
  display: flex;
  gap: 20rpx;
  margin-top: 28rpx;
}

.pl-done__item {
  flex: 1;
  padding: 20rpx 12rpx;
  background: rgb(255 255 255 / 16%);
  border-radius: 24rpx;
}

.pl-done__num {
  display: block;
  font-size: 36rpx;
  font-weight: 800;
}

.pl-done__label {
  display: block;
  margin-top: 4rpx;
  font-size: 20rpx;
  opacity: 0.85;
}

/* 接下来卡 / 明日预告 */
.pl-next {
  position: relative;
  padding: 32rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  background: #ffffff;
  border: 4rpx solid var(--color-primary);
  border-radius: 36rpx;
  box-shadow: 0 12rpx 48rpx rgb(79 124 255 / 14%);

  &::before {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 10rpx;
    content: '';
    background: linear-gradient(180deg, #4f7cff, #7b5cff);
  }

  &--done {
    border-color: #52c41a;
    box-shadow: 0 12rpx 48rpx rgb(82 196 26 / 14%);

    &::before {
      background: #52c41a;
    }
  }
}

.pl-next__eyebrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.pl-next__tag {
  display: flex;
  gap: 10rpx;
  align-items: center;
  font-size: var(--fs-caption);
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.6rpx;

  &--done {
    color: #2e7d32;
  }
}

.pl-count {
  display: inline-flex;
  gap: 6rpx;
  align-items: center;
  padding: 6rpx 16rpx;
  font-size: var(--fs-caption);
  font-weight: 700;
  color: #3a2600;
  background: #ffd666;
  border-radius: 16rpx;
}

.pl-next__body {
  display: flex;
  gap: 24rpx;
  align-items: center;
  margin-bottom: 24rpx;
}

.pl-next__ico {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 96rpx;
  height: 96rpx;
  color: #1677ff;
  background: #e6f4ff;
  border-radius: 28rpx;

  &--done {
    color: #2e7d32;
    background: #eaf8e8;
  }
}

.pl-next__t1 {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--color-text);
}

.pl-next__t2 {
  margin-top: 6rpx;
  font-size: var(--fs-sub);
  color: #8a93a5;
}

.pl-next__acts {
  display: flex;
  gap: 16rpx;
}

/* 卡片内按钮：原型 44px 高，x-button 固定 96rpx 高不适配双按钮行，故本页自绘 */
.pl-btn {
  box-sizing: border-box;
  display: flex;
  flex: 1;
  gap: 8rpx;
  align-items: center;
  justify-content: center;
  min-height: 88rpx;
  padding: 18rpx;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 1;
  color: #ffffff;
  text-align: center;
  background: var(--color-primary);
  border-radius: 28rpx;

  &--plain {
    flex: 0 0 auto;
    padding: 0 28rpx;
    color: #8a93a5;
    background: #ffffff;
    border: 3rpx solid #e4e8f0;
  }
}

/* P2 漏打卡 */
.pl-miss {
  display: flex;
  gap: 16rpx;
  align-items: center;
  padding: 20rpx 28rpx;
  margin-bottom: 24rpx;
  font-size: var(--fs-sub);
  line-height: 1.5;
  color: #7a5b00;
  background: #fff9e6;
  border-radius: 24rpx;
}

.pl-miss__text {
  min-width: 0;
}

.pl-miss__act {
  display: flex;
  flex-shrink: 0;
  gap: 6rpx;
  align-items: center;
  min-height: 64rpx;
  margin-left: auto;
  font-weight: 700;
  color: #c77700;
  white-space: nowrap;
}

.pl-miss__skip {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  min-height: 64rpx;
  padding: 0 8rpx;
  font-weight: 600;
  color: #8a93a5;
}

/* P2 分类筛选 */
.pl-chips {
  margin-bottom: 24rpx;
  white-space: nowrap;
}

.pl-chips__in {
  display: inline-flex;
  gap: 16rpx;
  padding: 4rpx 0;
}

/* P2 已完成分组 */
.pl-donegroup {
  display: flex;
  gap: 16rpx;
  align-items: center;
  justify-content: space-between;
  min-height: 96rpx;
  padding: 16rpx 28rpx;
  margin-bottom: 20rpx;
  font-size: var(--fs-sub);
  line-height: 1.55;
  color: #7b8494;
  background: #fafbfd;
  border: 2rpx dashed #d9dee8;
  border-radius: 24rpx;
}

.pl-donegroup__text {
  min-width: 0;
}

.pl-donegroup__b {
  display: inline-flex;
  gap: 10rpx;
  align-items: center;
  font-weight: 700;
  color: #2e7d32;
}

.pl-donegroup__exp {
  display: flex;
  flex-shrink: 0;
  gap: 6rpx;
  align-items: center;
  font-weight: 600;
}

/* P2 计划卡 */
.pl-card {
  padding: 28rpx;
  margin-bottom: 20rpx;
  background: #ffffff;
  border-left: 8rpx solid var(--color-primary);
  border-radius: 32rpx;
  box-shadow: 0 2rpx 6rpx rgb(20 30 60 / 4%);

  &--medication {
    border-left-color: #ffa940;
  }

  &--water {
    border-left-color: #1677ff;
  }

  &--exercise {
    border-left-color: #52c41a;
  }

  &--pet {
    border-left-color: #7b3ff2;
  }

  &--plant {
    border-left-color: #13c2c2;
  }

  &--health {
    border-left-color: #d93025;
  }

  &--custom {
    border-left-color: #8a93a5;
  }

  &--done {
    background: #fafbfd;
    opacity: 0.72;
  }
}

.pl-card__hd {
  display: flex;
  gap: 20rpx;
  align-items: center;
}

.pl-card__ico {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 76rpx;
  height: 76rpx;
  border-radius: 22rpx;
}

.pl-card__time {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  min-width: 96rpx;
  font-size: 32rpx;
  font-weight: 800;
  color: var(--color-text);
}

.pl-card__kicker {
  margin-top: -2rpx;
  font-size: 20rpx;
  font-weight: 600;
  color: #8a93a5;
}

.pl-card__t1 {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
}

.pl-card__meta {
  margin-top: 4rpx;
  font-size: var(--fs-sub);
  color: #8a93a5;
}

.pl-card__more {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  margin: -8rpx -12rpx -8rpx 0;
  color: #8a93a5;
  border-radius: 24rpx;
}

.pl-card__acts {
  display: flex;
  gap: 12rpx;
  margin-top: 20rpx;
}

/* P7b 管理菜单 */
.pl-menu {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.pl-menu__item {
  display: flex;
  gap: 24rpx;
  align-items: center;
  padding: 22rpx 36rpx;
  background: #ffffff;
  border: 3rpx solid var(--color-primary);
  border-radius: 28rpx;

  &--danger {
    border-color: #fbcbcb;
  }
}

.pl-menu__t1 {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text);
}

.pl-menu__item--danger .pl-menu__t1 {
  color: var(--color-danger);
}

.pl-menu__t2 {
  margin-top: 4rpx;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
}

/* 快速添加 / 编辑表单 */
.pl-form {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  max-height: 60vh;
  padding: 0 8rpx 8rpx;
  overflow-y: auto;
}

.pl-form__label {
  margin-top: 12rpx;
  font-size: var(--fs-sub);
  font-weight: 700;
  color: var(--color-text);
}

.pl-form__scroll {
  white-space: nowrap;
}

.pl-form__chips {
  display: inline-flex;
  gap: 12rpx;
  padding: 4rpx 0;
}

.pl-form__chips--wrap {
  display: flex;
  flex-wrap: wrap;
}

.pl-form__input {
  height: 88rpx;
  padding: 0 24rpx;
  font-size: var(--fs-sub);
  color: var(--color-text);
  background: #f7f9ff;
  border: 2rpx solid #e4e8f0;
  border-radius: 20rpx;
}

.pl-form__hint {
  font-size: var(--fs-caption);
  color: var(--color-text-sub);
}

.pl-form__more {
  margin-top: 20rpx;
  font-size: var(--fs-sub);
  font-weight: 700;
  color: var(--color-primary);
  text-align: center;
}

/* 历史 / 本周统计 */
.pl-hist {
  padding: 0 8rpx 8rpx;
}

.pl-hist__stats {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.pl-hist__cell {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6rpx;
  align-items: center;
  padding: 20rpx 8rpx;
  font-size: var(--fs-caption);
  color: var(--color-text-sub);
  background: #f7f9ff;
  border-radius: 24rpx;
}

.pl-hist__num {
  font-size: 36rpx;
  font-weight: 800;
  color: var(--color-primary);
}

.pl-hist__row {
  padding: 16rpx 20rpx;
  margin-bottom: 12rpx;
  font-size: var(--fs-sub);
  color: var(--color-text);
  background: #fafbfd;
  border-radius: 16rpx;
}

.pl-hist__empty {
  padding: 40rpx 0;
  font-size: var(--fs-sub);
  color: var(--color-text-sub);
  text-align: center;
}
</style>
