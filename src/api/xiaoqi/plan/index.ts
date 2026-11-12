/**
 * 计划 Tab（C 端）
 *
 * 来源：ruoyi-xiaoqi-app XqPlanBizController，前缀 /app/xq/plan
 * - GET    /today?date=            今日总览（通用计划 + 用药计划聚合）
 * - GET    /list                   计划分页列表
 * - GET    /{id}                   计划详情（含时段）
 * - POST   /                       新增计划
 * - PUT    /                       编辑计划
 * - DELETE /{id}                   删除计划
 * - POST   /{id}/status            暂停 / 恢复
 * - POST   /{id}/scope             可见范围
 * - POST   /{id}/copy              复制为新计划
 * - GET    /{id}/history?days=     打卡历史
 * - POST   /record/checkin         打卡
 * - POST   /record/skip            跳过本次
 * - POST   /record/{id}/undo       撤销打卡
 *
 * 用药计划（source=medication）的打卡走 MedicationApi.checkin / undo，
 * 本模块只处理 source=plan 的通用计划。
 */
import type { BaseVo, PageQuery, PageResult } from '../types';
import { del, get, post, put } from '@/utils/request';
import { biz } from '../crud';

/** 单条待办 / 已完成项 */
export interface PlanEntryVo {
  key: string;
  /** plan=通用计划 / medication=用药计划 */
  source: 'plan' | 'medication';
  planId: number | string;
  scheduleId?: number | string | null;
  recordId?: number | string | null;
  kind: string;
  kicker: string;
  title: string;
  /** HH:mm，按需计划为空 */
  time?: string | null;
  meta: string;
  status: 'pending' | 'taken' | 'skipped' | 'missed';
  actualTime?: string | null;
  actText: string;
  minutesLeft?: number | null;
  planType?: number;
}

/** 分类筛选胶囊 */
export interface PlanChipVo {
  key: string;
  label: string;
  icon: string;
  count: number;
}

export interface PlanDayVo {
  key: string;
  label: string;
  /** MM/dd */
  date: string;
  /** yyyy-MM-dd */
  value: string;
  on: boolean;
}

export interface PlanTomorrowVo {
  count: number;
  firstTime?: string | null;
  firstTitle?: string | null;
  summary: string;
}

export interface PlanMissedVo {
  text: string;
  kind: string;
  source: 'plan' | 'medication';
  planId: number | string;
  scheduleId?: number | string | null;
}

/** 今日总览 */
export interface PlanTodayVo {
  date: string;
  total: number;
  done: number;
  percent: number;
  streakDays: number;
  weekRate: number;
  weekDone: number;
  weekTotal: number;
  days: PlanDayVo[];
  next: PlanEntryVo | null;
  tomorrow: PlanTomorrowVo;
  missed: PlanMissedVo | null;
  chips: PlanChipVo[];
  pending: PlanEntryVo[];
  finished: PlanEntryVo[];
  doneSummary: string;
}

/** 计划 VO（对应 XqPlanVo） */
export interface PlanVo extends BaseVo {
  userId?: number | string;
  planType: number;
  planName: string;
  frequencyType?: number;
  frequencyValue?: string;
  startDate?: string;
  endDate?: string | null;
  visibleScope?: number;
  status?: number;
  icon?: string;
  color?: string;
  remark?: string;
}

export interface PlanScheduleVo extends BaseVo {
  planId: number | string;
  scheduleTime: string;
  scheduleLabel?: string;
  doseValue?: number;
  doseUnit?: string;
  advanceMinutes?: number;
  status?: number;
}

export interface PlanDetailVo {
  plan: PlanVo;
  schedules: PlanScheduleVo[];
}

export interface PlanRecordVo extends BaseVo {
  planId: number | string;
  scheduleId?: number | string | null;
  planDate: string;
  planTime?: string;
  actualTime?: string;
  recordType?: number;
}

export interface PlanHistoryVo {
  doneCount: number;
  rate: number;
  streakDays: number;
  records: PlanRecordVo[];
}

/** 新增 / 编辑入参 */
export interface PlanTimeBo {
  /** HH:mm */
  time: string;
  label?: string;
  doseValue?: number;
  doseUnit?: string;
  advanceMinutes?: number;
}

export interface PlanSaveBo {
  id?: number | string;
  planName: string;
  planType: number;
  frequencyType?: number;
  frequencyValue?: string;
  startDate?: string;
  endDate?: string | null;
  visibleScope?: number;
  /** 提醒通道 0系统通知 1App内横幅 */
  remindChannel?: number;
  /** 温和提醒 0关 1开 */
  mildRemind?: number;
  /** 漏打卡提醒 0关 1开 */
  missedRemind?: number;
  status?: number;
  icon?: string;
  color?: string;
  remark?: string;
  /** null 表示编辑时不改动时段 */
  times?: PlanTimeBo[] | null;
}

export const PlanApi = {
  /** 今日总览；date 为 yyyy-MM-dd，不传时服务端取今天（不要传 undefined 字面量） */
  today(date?: string) {
    return get<PlanTodayVo>('/app/xq/plan/today', biz({ params: date ? { date } : {} }));
  },

  /** 计划分页列表 */
  list(params?: PageQuery & { planType?: number; status?: number }) {
    return get<PageResult<PlanVo>>('/app/xq/plan/list', biz({ params }));
  },

  /** 计划详情（含时段） */
  detail(id: number | string) {
    return get<PlanDetailVo>(`/app/xq/plan/${id}`, biz());
  },

  /** 新增计划 */
  add(data: PlanSaveBo) {
    return post<number>('/app/xq/plan', biz({ data }));
  },

  /** 编辑计划 */
  update(data: PlanSaveBo & { id: number | string }) {
    return put<number>('/app/xq/plan', biz({ data }));
  },

  /** 删除计划（打卡历史保留） */
  remove(id: number | string) {
    return del<void>(`/app/xq/plan/${id}`, biz());
  },

  /** 暂停 / 恢复：0进行中 2已暂停 */
  setStatus(id: number | string, status: 0 | 2) {
    return post<void>(`/app/xq/plan/${id}/status`, biz({ data: { status } }));
  },

  /** 可见范围：0仅自己 1家人 */
  setScope(id: number | string, visibleScope: 0 | 1) {
    return post<void>(`/app/xq/plan/${id}/scope`, biz({ data: { visibleScope } }));
  },

  /** 复制为新计划 */
  copy(id: number | string) {
    return post<number>(`/app/xq/plan/${id}/copy`, biz());
  },

  /** 打卡历史 */
  history(id: number | string, days = 30) {
    return get<PlanHistoryVo>(`/app/xq/plan/${id}/history`, biz({ params: { days } }));
  },

  /** 通用计划打卡 */
  checkin(data: { planId: number | string; scheduleId?: number | string | null; date?: string; recordType?: 0 | 1 }) {
    return post<number>('/app/xq/plan/record/checkin', biz({ data }));
  },

  /** 通用计划跳过本次 */
  skip(data: { planId: number | string; scheduleId?: number | string | null; date?: string }) {
    return post<number>('/app/xq/plan/record/skip', biz({ data }));
  },

  /** 撤销打卡 */
  undo(recordId: number | string) {
    return post<void>(`/app/xq/plan/record/${recordId}/undo`, biz());
  },
};
