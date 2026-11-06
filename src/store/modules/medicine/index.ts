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

/** 演示数据总开关：让用药页首次启动即呈现原型 11 的「2/3 已完成 + 昨日漏服」 */
const DEMO_ENABLED = true;
/** 演示数据已注入标记（只注入一次） */
const SEED_KEY = 'med_demo_seeded';

function nowId(prefix: string): string {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function hhmm(date = new Date()): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function dayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** N 天前的日期键（0 = 今天） */
function dayKeyBefore(offset: number): string {
  return dayKey(new Date(Date.now() - offset * 86400000));
}

/**
 * 演示计划（严格对齐原型 11 / 11c / 12 / 13）
 * 布洛芬缓释胶囊：08:00 早间 + 20:00 晚间，疗程 7 天（今天第 2 天），库存 16/20 粒
 * 维生素 C：08:00 早间，与布洛芬同日同时段，构成本日 3 剂次
 */
const DEMO_PLANS: MedPlan[] = [
  {
    id: 'p-demo-1',
    name: '布洛芬缓释胶囊',
    spec: '0.3g × 20 粒',
    approval: '国药准字H20013062',
    type: 'ontime',
    reason: '感冒发烧',
    doses: [
      { id: 'd1', time: '08:00', label: '早间', afterMeal: '早餐后', amount: '1 粒', advance: 10, enabled: true },
      { id: 'd2', time: '20:00', label: '晚间', afterMeal: '晚餐后 30 分钟', amount: '1 粒', advance: 10, enabled: true },
    ],
    course: { total: 7, index: 2, autoStop: true },
    stock: { have: 16, total: 20, unit: '粒' },
    lowStockDays: 3,
    visibility: 'self',
    enabled: true,
    instruction: {
      usage: '口服。成人，一次 1 粒（0.3g），一日 2 次（早晚各一次）。',
      caution: '不得超剂量服用。服药期间不得饮酒。孕妇及哺乳期妇女不宜使用。',
      indications: '用于缓解轻至中度疼痛，如头痛、关节痛、偏头痛、牙痛、肌肉痛、神经痛、痛经；也用于普通感冒或流行性感冒引起的发热。',
      contraindications: '对本品及其他解热镇痛药过敏者禁用。活动性消化道溃疡者禁用。',
    },
    createdAt: dayKeyBefore(1),
  },
  {
    id: 'p-demo-2',
    name: '维生素 C',
    spec: '100mg × 60 片',
    approval: '国药准字H31021027',
    type: 'ontime',
    doses: [
      { id: 'd1', time: '08:00', label: '早间', afterMeal: '早餐后', amount: '1 片', advance: 10, enabled: true },
    ],
    course: { total: 30, index: 2, autoStop: true },
    stock: { have: 24, total: 60, unit: '片' },
    lowStockDays: 3,
    visibility: 'self',
    enabled: true,
    instruction: {
      usage: '口服。成人一日 1 片。',
      caution: '不宜长期过量服用，过量可引起腹泻、皮疹等。',
      indications: '用于预防坏血病，也可用于各种急慢性传染性疾病及紫癜等辅助治疗。',
    },
    createdAt: dayKeyBefore(1),
  },
];

/**
 * 演示打卡记录（对应原型 11）
 * 今日：08:00 布洛芬 08:31 已服用（保留 5 分钟撤销窗口，还原「撤销」链接）、08:00 维生素 C 08:35 已服用、20:00 布洛芬待服用
 * 昨日（疗程第 1 天）：08:00 两剂已完成，20:00 布洛芬漏服 → 首页红色「现在补登 / 跳过」
 */
function seedDemoRecords(): Record<string, DoseRecord> {
  const todayStr = dayKey();
  const yesterday = dayKeyBefore(1);
  return {
    [`p-demo-1:d1:${todayStr}`]: { status: 'taken', takenAt: '08:31', undoUntil: Date.now() + UNDO_MS },
    [`p-demo-2:d1:${todayStr}`]: { status: 'taken', takenAt: '08:35' },
    [`p-demo-1:d1:${yesterday}`]: { status: 'taken', takenAt: '08:20' },
    [`p-demo-2:d1:${yesterday}`]: { status: 'taken', takenAt: '08:25' },
    [`p-demo-1:d2:${yesterday}`]: { status: 'missed' },
  };
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
    /**
     * 首启动注入演示计划与打卡记录（原型 11 今日用药时间轴）
     * 只注入一次：SEED_KEY 写入后，即使用户删光计划也不会再次生成
     */
    ensureSeedDemo() {
      if (!DEMO_ENABLED || storage.get(SEED_KEY) === '1') {
        return;
      }
      storage.set(SEED_KEY, '1');
      if (this.plans.length > 0) {
        return;
      }
      // 深拷贝，避免编辑计划时改到模块级常量
      this.plans = JSON.parse(JSON.stringify(DEMO_PLANS)) as MedPlan[];
      this.records = seedDemoRecords();
      this.persistPlans();
      this.persistRecords();
    },

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
