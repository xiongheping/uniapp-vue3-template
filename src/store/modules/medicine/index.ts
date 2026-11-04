import type {
  DoseEntry,
  DoseRecord,
  DoseStatus,
  MedPlan,
  MissedEntry,
} from './types';
import { defineStore } from 'pinia';
import storage from '@/utils/storage';

/** 撤销窗口：5 分钟（从打卡成功起算） */
export const UNDO_MS = 5 * 60 * 1000;

/** 「稍后 15 分钟」每日上限 */
export const SNOOZE_DAILY_LIMIT = 3;

/** 可提前打卡的分钟数 */
export const EARLY_MINUTES = 30;

/** 计划持久化键 */
const PLAN_LIST_KEY = 'med_plan_list';
/** 打卡记录持久化键 */
const RECORD_MAP_KEY = 'med_record_map';

function nowId(prefix: string): string {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function hhmm(date = new Date()): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function dayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** 当前分钟数（0:00 起算） */
function nowClock(): number {
  const date = new Date();
  return date.getHours() * 60 + date.getMinutes();
}

function minutesOf(time: string): number {
  const parts = String(time).split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

const useMedicineStore = defineStore('medicine', {
  state: () => ({
    plans: (storage.getJSON(PLAN_LIST_KEY) || []) as MedPlan[],
    /** key = planId:doseId:date */
    records: (storage.getJSON(RECORD_MAP_KEY) || {}) as Record<string, DoseRecord>,
    /** 稍后次数：key = planId:doseId:date */
    snoozes: {} as Record<string, number>,
  }),
  getters: {
    /** 启用中的计划 */
    activePlans(state): MedPlan[] {
      return state.plans.filter(plan => plan.enabled !== false);
    },

    /** 进行中的疗程（我的页 / 设置页统计「用药计划 N 个」） */
    courses(state): MedPlan[] {
      return state.plans.filter(plan => !!plan.course);
    },

    /**
     * 今日排班时间轴：启用计划 × 启用时段，按时间升序，状态来自今日打卡记录
     */
    todayEntries(state): DoseEntry[] {
      const date = dayKey();
      return this.activePlans
        .flatMap(plan =>
          plan.doses
            .filter(dose => dose.enabled !== false && !!dose.time)
            .map((dose) => {
              const key = `${plan.id}:${dose.id}:${date}`;
              const record = state.records[key];
              return {
                key,
                planId: plan.id,
                doseId: dose.id,
                name: plan.name,
                time: dose.time,
                label: dose.label,
                afterMeal: dose.afterMeal,
                amount: dose.amount,
                advance: dose.advance,
                reason: plan.reason,
                status: (record?.status || 'pending') as DoseStatus,
                takenAt: record?.takenAt,
                undoUntil: record?.undoUntil,
              };
            }),
        )
        .sort((a, b) => minutesOf(a.time) - minutesOf(b.time));
    },

    /** 待服用条目 */
    pendingEntries(): DoseEntry[] {
      return this.todayEntries.filter(entry => entry.status === 'pending');
    },

    /** 今日漏服条目（时间轴标红 + 频控兜底提醒） */
    missedList(): DoseEntry[] {
      return this.todayEntries.filter(entry => entry.status === 'missed');
    },

    /** 今日总剂次 */
    todayTotal(): number {
      return this.todayEntries.length;
    },

    /** 今日已完成剂次 */
    todayDone(): number {
      return this.todayEntries.filter(entry => entry.status === 'taken').length;
    },

    /** 今日是否全部完成（驱动 11b 庆祝动效） */
    isAllDone(): boolean {
      return this.todayTotal > 0 && this.todayDone === this.todayTotal;
    },

    /** 下一剂（时间已到或未到的最近待服用剂次） */
    nextEntry(): DoseEntry | null {
      const now = nowClock();
      const pending = this.pendingEntries;
      const upcoming = pending.filter(entry => minutesOf(entry.time) >= now - 60);
      if (upcoming.length) {
        return upcoming[0] ?? null;
      }
      return pending[0] ?? null;
    },

    /** 是否可提前打卡：下一剂已进入「到点前 30 分钟」窗口 */
    canCheckIn(): boolean {
      const next = this.nextEntry;
      if (!next) {
        return false;
      }
      const left = minutesOf(next.time) - nowClock();
      return left <= EARLY_MINUTES;
    },

    /** 昨日漏服（status=missed 且日期为昨天） */
    yesterdayMissed(state): MissedEntry[] {
      const yesterday = dayKey(new Date(Date.now() - 86400000));
      const result: MissedEntry[] = [];
      Object.keys(state.records).forEach((key) => {
        const record = state.records[key];
        if (record.status !== 'missed' || !key.endsWith(yesterday)) {
          return;
        }
        const [planId, doseId, date] = key.split(':');
        const plan = state.plans.find(p => p.id === planId);
        const dose = plan?.doses.find(d => d.id === doseId);
        result.push({ planId, doseId, date, planName: plan?.name, time: dose?.time });
      });
      return result;
    },

    /** 连续全勤天数（从今天往前数「有排班且全部完成」的日子） */
    streakDays(state): number {
      let streak = 0;
      for (let offset = 0; offset < 60; offset += 1) {
        const date = dayKey(new Date(Date.now() - offset * 86400000));
        const keys = Object.keys(state.records).filter(key => key.endsWith(date));
        if (!keys.length) {
          break;
        }
        const allDone = keys.every((key) => {
          const status = state.records[key]?.status;
          return status === 'taken' || status === 'skipped';
        });
        if (allDone) {
          streak += 1;
        }
        else {
          break;
        }
      }
      return streak;
    },
  },
  actions: {
    persistPlans() {
      storage.setJSON(PLAN_LIST_KEY, this.plans);
    },

    persistRecords() {
      storage.setJSON(RECORD_MAP_KEY, this.records);
    },

    planById(id: string): MedPlan | null {
      return this.plans.find(plan => plan.id === id) || null;
    },

    doseOf(planId: string, doseId: string) {
      return this.planById(planId)?.doses.find(dose => dose.id === doseId) || null;
    },

    /** 记录键：planId:doseId:date */
    recordKey(planId: string, doseId: string, date: string): string {
      return `${planId}:${doseId}:${date}`;
    },

    /** 距某时间点的分钟数（正数=未到点） */
    minutesTo(time: string): number {
      return minutesOf(time) - nowClock();
    },

    /**
     * 记录已服用；扣减库存并开启撤销窗口
     */
    take(planId: string, doseId: string, date = dayKey()) {
      const key = this.recordKey(planId, doseId, date);
      const takenAt = hhmm();
      this.records[key] = { status: 'taken', takenAt, undoUntil: Date.now() + UNDO_MS };
      this.persistRecords();
      const plan = this.planById(planId);
      if (plan?.stock && plan.stock.have > 0) {
        plan.stock.have -= 1;
        this.persistPlans();
      }
    },

    /** 撤销打卡：恢复为待服用，库存退回 */
    undo(key: string) {
      const record = this.records[key];
      if (!record || record.status !== 'taken') {
        return;
      }
      this.records[key] = { status: 'pending' };
      this.persistRecords();
      const [planId] = key.split(':');
      const plan = this.planById(planId);
      if (plan?.stock) {
        plan.stock.have += 1;
        this.persistPlans();
      }
    },

    /** 跳过今日这一剂（不扣库存） */
    skip(planId: string, doseId: string, date = dayKey()) {
      const key = this.recordKey(planId, doseId, date);
      this.records[key] = { status: 'skipped' };
      this.persistRecords();
    },

    /** 标记错过（昨日漏服 / 超时未打卡） */
    markMissed(planId: string, doseId: string, date = dayKey()) {
      const key = this.recordKey(planId, doseId, date);
      this.records[key] = { status: 'missed' };
      this.persistRecords();
    },

    /** 今日「稍后 15 分钟」已用次数 */
    snoozeUsed(planId: string, doseId: string): number {
      return this.snoozes[`${planId}:${doseId}:${dayKey()}`] || 0;
    },

    /**
     * 稍后 15 分钟：每日上限 SNOOZE_DAILY_LIMIT，到上限返回 false
     */
    snoozeDose(planId: string, doseId: string): boolean {
      const key = `${planId}:${doseId}:${dayKey()}`;
      const used = this.snoozes[key] || 0;
      if (used >= SNOOZE_DAILY_LIMIT) {
        return false;
      }
      this.snoozes[key] = used + 1;
      const snoozeAt = hhmm(new Date(Date.now() + 15 * 60000));
      const record = this.records[this.recordKey(planId, doseId, dayKey())];
      if (!record || record.status === 'pending') {
        this.records[this.recordKey(planId, doseId, dayKey())] = { status: 'pending', snoozeAt };
        this.persistRecords();
      }
      return true;
    },

    /**
     * 保存计划：有 id 更新，无 id 新建；修改时间点只影响之后的提醒
     */
    savePlan(payload: Partial<MedPlan>) {
      if (payload.id) {
        const target = this.plans.find(plan => plan.id === payload.id);
        if (target) {
          Object.assign(target, payload);
          this.persistPlans();
          return;
        }
      }
      const plan: MedPlan = {
        ...payload,
        id: nowId('p'),
        createdAt: dayKey(),
      } as MedPlan;
      if (plan.course) {
        plan.course.index = plan.course.index || 1;
      }
      this.plans.push(plan);
      this.persistPlans();
    },

    /**
     * 删除计划：今日之后的排班一并移除，历史打卡记录保留
     */
    removePlan(id: string) {
      this.plans = this.plans.filter(plan => plan.id !== id);
      this.persistPlans();
    },
  },
  persist: true,
});

export default useMedicineStore;
