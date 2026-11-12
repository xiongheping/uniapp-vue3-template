import type {
  DoseEntry,
  DoseRecord,
  DoseStatus,
  DoseTime,
  MedPlan,
  MissedEntry,
} from './types';
import type {
  MedicationInstructionVo,
  MedicationPlanVo,
  MedicationScheduleVo,
} from '@/api/xiaoqi/medication';
import { defineStore } from 'pinia';
import { MedicationApi } from '@/api/xiaoqi/medication';
import { isLogin } from '@/utils/auth';
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

/** 疗程进度：起始日期到今天的天数，缺省为 1 */
function courseIndexOf(start?: string): number {
  if (!start) {
    return 1;
  }
  const begin = new Date(`${String(start).slice(0, 10).replace(/-/g, '/')} 00:00:00`).getTime();
  const todayTime = new Date(`${dayKey().replace(/-/g, '/')} 00:00:00`).getTime();
  if (Number.isNaN(begin)) {
    return 1;
  }
  return Math.max(1, Math.round((todayTime - begin) / 86400000) + 1);
}

/** 从「1 粒」「4 片」中取数值 */
function amountOf(text?: string): number | undefined {
  const match = String(text ?? '').match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

/** 从「4 小时」中取整数 */
function intOf(text?: string): number | undefined {
  const match = String(text ?? '').match(/\d+/);
  return match ? Number(match[0]) : undefined;
}

/** 时段文案：与计划页 labelOf 口径一致 */
function labelOfTime(time: string): string | undefined {
  if (!time) {
    return undefined;
  }
  const hour = Number(String(time).split(':')[0]);
  if (Number.isNaN(hour)) {
    return undefined;
  }
  if (hour < 6) {
    return '清晨';
  }
  if (hour < 11) {
    return '早间';
  }
  if (hour < 14) {
    return '午间';
  }
  if (hour < 18) {
    return '午后';
  }
  return '晚间';
}

/** 餐关系 + 偏移分钟 + 时间 → 页面文案（如「早餐后 30 分钟」） */
function mealTextOf(schedule: MedicationScheduleVo, time: string): string | undefined {
  const relation = Number(schedule.mealRelation ?? 3);
  if (relation === 3) {
    return undefined;
  }
  const offset = Number(schedule.mealOffsetMinutes ?? 0);
  let prefix = '随餐';
  if (relation !== 2) {
    const hour = Number(String(time).split(':')[0]);
    const suffix = relation === 0 ? '前' : '后';
    if (!Number.isNaN(hour) && hour < 10) {
      prefix = `早餐${suffix}`;
    }
    else if (!Number.isNaN(hour) && hour < 15) {
      prefix = `午餐${suffix}`;
    }
    else if (!Number.isNaN(hour) && hour < 21) {
      prefix = `晚餐${suffix}`;
    }
    else {
      prefix = `饭${suffix}`;
    }
  }
  return offset > 0 ? `${prefix} ${offset} 分钟` : prefix;
}

/**
 * 后端计划 → 前端 MedPlan。
 * 规格与说明书正文来自 xq_medication_instruction（按 planId 关联）。
 */
function toMedPlan(
  vo: MedicationPlanVo,
  schedules: MedicationScheduleVo[],
  instruction: MedicationInstructionVo | null,
): MedPlan {
  const unit = vo.stockUnit || vo.dosageUnit || '';
  const dosageText = vo.dosage != null ? `${vo.dosage}${vo.dosageUnit || ''}` : undefined;
  const doses: DoseTime[] = schedules.map((schedule) => {
    const time = String(schedule.scheduleTime || '').slice(0, 5);
    return {
      id: String(schedule.id),
      time,
      label: labelOfTime(time),
      afterMeal: mealTextOf(schedule, time),
      amount: schedule.dosePerTime != null ? `${schedule.dosePerTime}${vo.dosageUnit || ''}` : dosageText,
      advance: schedule.advanceMinutes ?? undefined,
      enabled: Number(schedule.status) !== 1,
    };
  });
  const stockQuantity = Number(vo.stockQuantity ?? 0);
  return {
    id: String(vo.id),
    name: vo.drugName,
    spec: instruction?.specification,
    approval: instruction?.approvalNumber,
    type: vo.drugType === 1 ? 'prn' : 'ontime',
    reason: vo.eventCustomName,
    doses,
    course: {
      total: Number(vo.courseDays ?? 0),
      index: courseIndexOf(vo.courseStartDate),
      start: vo.courseStartDate,
      end: vo.courseEndDate,
      autoStop: true,
    },
    stock: { have: stockQuantity, total: stockQuantity, unit },
    lowStockDays: vo.lowStockDays ?? 3,
    perDayMax: vo.maxDailyDose != null ? String(vo.maxDailyDose) : undefined,
    minInterval: vo.minIntervalHours != null ? String(vo.minIntervalHours) : undefined,
    prnReason: vo.prnReason,
    visibility: Number(vo.visibleScope) === 1 ? 'family' : 'self',
    enabled: Number(vo.status) !== 1,
    instruction: instruction
      ? {
          usage: instruction.usageText,
          caution: instruction.precautionText,
          imageUrl: instruction.imageUrl,
        }
      : undefined,
    createdAt: vo.createTime ? String(vo.createTime).slice(0, 10) : undefined,
  };
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
    /** 云端模式：已登录即从 /app/xq/medication/today 拉取，未登录降级本地演示 */
    isCloudMode(): boolean {
      return isLogin();
    },

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
      // 云端模式不注入演示数据，避免假数据混进真实用药计划
      if (this.isCloudMode) {
        return;
      }
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

    /**
     * 拉取完整计划列表（含服药时段、疗程、库存、说明书）。
     * 计划数为个位数，按计划逐个补时段与说明书，避免依赖 create_by 分页过滤。
     */
    async fetchPlans(): Promise<void> {
      if (!this.isCloudMode) {
        return;
      }
      try {
        const page = await MedicationApi.plan.list({ pageNum: 1, pageSize: 100 });
        const rows = page.rows || [];
        const plans: MedPlan[] = [];
        for (const row of rows) {
          const planId = String(row.id);
          const [schedules, instruction] = await Promise.all([
            MedicationApi.schedule
              .list({ planId: row.id, pageNum: 1, pageSize: 50 })
              .then(res => res.rows || [])
              .catch(() => []),
            MedicationApi.instructionByPlan(planId).catch(() => null),
          ]);
          plans.push(toMedPlan(row, schedules, instruction));
        }
        this.plans = plans;
        this.persistPlans();
      }
      catch (error) {
        console.warn('medication fetchPlans failed:', error);
      }
    },

    /**
     * 拉取今日用药时间轴（服务端派生状态），覆盖今日记录并补齐缺失的计划。
     */
    async fetchToday(): Promise<void> {
      if (!this.isCloudMode) {
        return;
      }
      try {
        const today = await MedicationApi.today();
        const date = dayKey();
        const todayRecords: Record<string, DoseRecord> = {};
        for (const entry of today.entries || []) {
          const planId = String(entry.planId);
          let plan = this.plans.find(item => item.id === planId);
          if (!plan) {
            plan = {
              id: planId,
              name: entry.drugName,
              type: entry.drugType === 1 ? 'prn' : 'ontime',
              doses: [],
              visibility: 'self',
              enabled: true,
              prnReason: entry.prnReason,
            };
            this.plans.push(plan);
          }
          const doseId = entry.scheduleId != null ? String(entry.scheduleId) : 'prn';
          if (!plan.doses.some(dose => dose.id === doseId)) {
            plan.doses.push({
              id: doseId,
              time: entry.planTime || '',
              amount: entry.dosageText,
              enabled: true,
            });
          }
          if (entry.status === 'taken' || entry.status === 'skipped' || entry.status === 'missed') {
            todayRecords[this.recordKey(planId, doseId, date)] = {
              status: entry.status,
              takenAt: entry.actualTime ? entry.actualTime.slice(11, 16) : undefined,
              recordId: entry.recordId != null ? String(entry.recordId) : undefined,
            };
          }
        }
        const history = Object.fromEntries(
          Object.entries(this.records).filter(([key]) => !key.endsWith(date)),
        ) as Record<string, DoseRecord>;
        this.records = { ...history, ...todayRecords };
        this.persistPlans();
        this.persistRecords();
      }
      catch (error) {
        console.warn('medication fetchToday failed:', error);
      }
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
      if (this.isCloudMode) {
        MedicationApi.checkin({
          planId,
          scheduleId: doseId === 'prn' ? undefined : doseId,
          date,
        })
          .then(() => this.fetchToday())
          .catch((error: any) => console.warn('medication checkin failed:', error));
      }
    },

    /** 撤销打卡：恢复为待服用，库存退回 */
    undo(key: string) {
      const record = this.records[key];
      if (!record || record.status !== 'taken') {
        return;
      }
      const recordId = record.recordId;
      this.records[key] = { status: 'pending' };
      this.persistRecords();
      const [planId] = key.split(':');
      const plan = this.planById(planId);
      if (plan?.stock) {
        plan.stock.have += 1;
        this.persistPlans();
      }
      if (this.isCloudMode && recordId) {
        MedicationApi.undo(recordId)
          .then(() => this.fetchToday())
          .catch((error: any) => console.warn('medication undo failed:', error));
      }
    },

    /** 跳过今日这一剂（不扣库存） */
    skip(planId: string, doseId: string, date = dayKey()) {
      const key = this.recordKey(planId, doseId, date);
      this.records[key] = { status: 'skipped' };
      this.persistRecords();
      if (this.isCloudMode) {
        MedicationApi.skip({
          planId,
          scheduleId: doseId === 'prn' ? undefined : doseId,
          date,
        })
          .then(() => this.fetchToday())
          .catch((error: any) => console.warn('medication skip failed:', error));
      }
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
    async savePlan(payload: Partial<MedPlan>): Promise<void> {
      if (this.isCloudMode) {
        const doses = payload.doses || [];
        const enabledDoses = doses.filter(dose => dose.enabled !== false && !!dose.time);
        // 按需模式没有服药时段，显式传空数组以清掉历史时段
        const isPrn = payload.type === 'prn';
        const times = isPrn ? [] : payload.doses ? enabledDoses.map(dose => dose.time) : null;
        const doseTimes = isPrn
          ? []
          : payload.doses
            ? doses
                .filter(dose => !!dose.time)
                .map(dose => ({
                  time: dose.time,
                  amount: amountOf(dose.amount),
                  advanceMinutes: dose.advance,
                  enabled: dose.enabled !== false,
                  afterMeal: dose.afterMeal || undefined,
                }))
            : null;
        const firstDose = enabledDoses[0] ?? doses[0];
        const body: Record<string, unknown> = {
          id: payload.id && /^\d+$/.test(payload.id) ? payload.id : undefined,
          drugName: payload.name,
          dosage: amountOf(firstDose?.amount),
          dosageUnit: payload.stock?.unit || undefined,
          drugType: payload.type === 'prn' ? 1 : 0,
          prnReason: payload.prnReason,
          maxDailyDose: amountOf(payload.perDayMax),
          minIntervalHours: intOf(payload.minInterval),
          courseDays: payload.course?.total,
          courseStartDate: payload.course?.start || undefined,
          courseEndDate: payload.course?.end || undefined,
          stockQuantity: payload.stock?.have,
          stockUnit: payload.stock?.unit,
          lowStockDays: payload.lowStockDays,
          visibleScope: payload.visibility === 'family' ? 1 : 0,
          status: payload.enabled === false ? 1 : 0,
          eventCustomName: payload.reason,
          times,
          doseTimes,
          // 规格/批准文号/说明书正文落到 xq_medication_instruction
          specification: payload.spec || undefined,
          approvalNumber: payload.approval || undefined,
          usageText: payload.instruction?.usage || undefined,
          precautionText: payload.instruction?.caution || undefined,
          imageUrl: payload.instruction?.imageUrl || undefined,
        };
        await MedicationApi.savePlanFull(body);
        await Promise.all([this.fetchPlans(), this.fetchToday()]);
        return;
      }
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
    async removePlan(id: string): Promise<void> {
      this.plans = this.plans.filter(plan => plan.id !== id);
      this.persistPlans();
      if (this.isCloudMode && /^\d+$/.test(id)) {
        await MedicationApi.plan.remove(id);
        await Promise.all([this.fetchPlans(), this.fetchToday()]);
      }
    },
  },
  persist: true,
});

export default useMedicineStore;
