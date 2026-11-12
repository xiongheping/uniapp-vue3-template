/**
 * 用药管理：/app/xq/medication/plan、record、schedule、instruction、stock/log
 *
 * 时间轴/打卡走 XqMedicationBizController（today、record/checkin、
 * record/skip、record/makeup、record/{id}/undo、stock、instruction/query）。
 */
import type { BaseVo } from '../types';
import { get, post, put } from '@/utils/request';
import { biz, createCrudApi } from '../crud';

export interface MedicationPlanVo extends BaseVo {
  userId: number | string;
  familyId?: number | string;
  itemId?: number | string;
  drugName: string;
  dosage?: string;
  dosageUnit?: string;
  drugType?: number;
  maxDailyDose?: number;
  minIntervalHours?: number;
  /** 按需服用原因（PRN） */
  prnReason?: string;
  eventType?: number;
  eventCustomName?: string;
  courseDays?: number;
  courseStartDate?: string;
  courseEndDate?: string;
  stockQuantity?: number;
  stockUnit?: string;
  lowStockDays?: number;
  visibleScope?: number;
  status?: string | number;
}

export interface MedicationRecordVo extends BaseVo {
  planId: number | string;
  scheduleId?: number | string;
  userId: number | string;
  planDate: string;
  planTime?: string;
  actualTime?: string;
  /** 记录类型（Integer 字典值：服用/跳过/补登） */
  recordType?: number;
  source?: number;
  remark?: string;
}

export interface MedicationScheduleVo extends BaseVo {
  planId: number | string;
  /** 服药时点，LocalTime 序列化为 HH:mm:ss */
  scheduleTime: string;
  /** 与餐关系（Integer 字典值） */
  mealRelation?: number;
  mealOffsetMinutes?: number;
  advanceMinutes?: number;
  /** 单次剂量（BigDecimal） */
  dosePerTime?: number;
  status?: number;
}

/** 计划保存时的时段明细 */
export interface MedicationDoseTimeBo {
  /** HH:mm */
  time: string;
  /** 单次剂量数值 */
  amount?: number;
  /** 提前提醒分钟数 */
  advanceMinutes?: number;
  enabled?: boolean;
  /** 餐前后说明，如「早餐后 30 分钟」 */
  afterMeal?: string;
}

export interface MedicationInstructionVo extends BaseVo {
  planId?: number | string;
  itemId?: number | string;
  drugName: string;
  approvalNumber?: string;
  specification?: string;
  usageText?: string;
  precautionText?: string;
  imageUrl?: string;
  sourceUrl?: string;
}

export interface MedicationStockLogVo extends BaseVo {
  planId: number | string;
  /** 变更类型（Integer 字典值） */
  changeType?: number;
  changeQuantity: number;
  beforeQuantity?: number;
  afterQuantity?: number;
  operatorId?: number | string;
  remark?: string;
}

/** 今日时间轴单条时段 */
export interface DoseEntryVo {
  recordId?: number | string;
  planId: number | string;
  scheduleId?: number | string;
  drugName: string;
  /** 剂量文本，如「1片」 */
  dosageText?: string;
  /** 计划时间 HH:mm */
  planTime?: string;
  /** pending/taken/skipped/missed/prn */
  status: 'pending' | 'taken' | 'skipped' | 'missed' | 'prn';
  actualTime?: string;
  /** 0 按时 / 1 按需 */
  drugType?: number;
  prnReason?: string;
}

/** 今日用药时间轴 */
export interface MedicationTodayVo {
  date: string;
  total: number;
  done: number;
  entries: DoseEntryVo[];
}

/** 打卡/跳过/补登入参 */
export interface DoseActionBo {
  planId: number | string;
  scheduleId?: number | string;
  /** yyyy-MM-dd */
  date?: string;
  /** 实际时间 */
  actualTime?: string;
}

export const MedicationApi = {
  plan: createCrudApi<MedicationPlanVo>('/app/xq/medication/plan'),
  record: createCrudApi<MedicationRecordVo>('/app/xq/medication/record'),
  schedule: createCrudApi<MedicationScheduleVo>('/app/xq/medication/schedule'),
  instruction: createCrudApi<MedicationInstructionVo>('/app/xq/medication/instruction'),
  stockLog: createCrudApi<MedicationStockLogVo>('/app/xq/medication/stock/log'),

  /** 今日时间轴 */
  today() {
    return get<MedicationTodayVo>('/app/xq/medication/today', biz());
  },

  /** 本周记录 */
  week(date?: string) {
    return get<MedicationRecordVo[]>('/app/xq/medication/record/week', biz({ params: { date } }));
  },

  /** 打卡 */
  checkin(data: DoseActionBo) {
    return post<number>('/app/xq/medication/record/checkin', biz({ data }));
  },

  /** 跳过 */
  skip(data: DoseActionBo) {
    return post<number>('/app/xq/medication/record/skip', biz({ data }));
  },

  /** 补登 */
  makeup(data: DoseActionBo) {
    return post<number>('/app/xq/medication/record/makeup', biz({ data }));
  },

  /** 撤销打卡 */
  undo(recordId: number | string) {
    return post<void>(`/app/xq/medication/record/${recordId}/undo`, biz());
  },

  /** 按药品名查说明书 */
  instructionByName(drugName: string) {
    return get<MedicationInstructionVo | null>('/app/xq/medication/instruction/query', biz({ params: { drugName } }));
  },

  /** 按计划查说明书（计划编辑保存的那一份） */
  instructionByPlan(planId: number | string) {
    return get<MedicationInstructionVo | null>(`/app/xq/medication/instruction/plan/${planId}`, biz());
  },

  /** 查询库存 */
  stock(planId: number | string) {
    return get<MedicationPlanVo>(`/app/xq/medication/stock/${planId}`, biz());
  },

  /** 调整库存 */
  updateStock(planId: number | string, data: { quantity: number; unit?: string; remark?: string }) {
    return put<void>(`/app/xq/medication/stock/${planId}`, biz({ data }));
  },

  /** 保存计划并整体替换时段（doseTimes 优先，times 仅作兼容） */
  savePlanFull(data: Partial<MedicationPlanVo> & {
    times?: string[] | null;
    doseTimes?: MedicationDoseTimeBo[] | null;
  }) {
    return post<number>('/app/xq/medication/plan/full', biz({ data }));
  },
};
