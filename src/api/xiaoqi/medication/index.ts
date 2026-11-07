/**
 * 用药管理：/xiaoqi/medication/plan、record、schedule、instruction、stock/log
 */
import type { BaseVo } from '../types';
import { createCrudApi } from '../crud';

export interface MedicationPlanVo extends BaseVo {
  userId: number | string;
  familyId?: number | string;
  itemId?: number | string;
  drugName: string;
  dosage?: string;
  dosageUnit?: string;
  drugType?: string;
  maxDailyDose?: number;
  minIntervalHours?: number;
  /** 按需服用原因（PRN） */
  prnReason?: string;
  eventType?: string;
  eventCustomName?: string;
  courseDays?: number;
  courseStartDate?: string;
  courseEndDate?: string;
  stockQuantity?: number;
  stockUnit?: string;
  lowStockDays?: number;
  visibleScope?: string;
  status?: string | number;
}

export interface MedicationRecordVo extends BaseVo {
  planId: number | string;
  scheduleId?: number | string;
  userId: number | string;
  planDate: string;
  planTime?: string;
  actualTime?: string;
  /** 记录类型：taken/skipped/... */
  recordType?: string;
  source?: string;
  remark?: string;
}

export interface MedicationScheduleVo extends BaseVo {
  planId: number | string;
  /** 服药时点，如 08:00 */
  scheduleTime: string;
  /** 与餐关系 */
  mealRelation?: string;
  mealOffsetMinutes?: number;
  advanceMinutes?: number;
  dosePerTime?: string;
  status?: string | number;
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
  changeType?: string;
  changeQuantity: number;
  beforeQuantity?: number;
  afterQuantity?: number;
  operatorId?: number | string;
  remark?: string;
}

export const MedicationApi = {
  plan: createCrudApi<MedicationPlanVo>('/xiaoqi/medication/plan'),
  record: createCrudApi<MedicationRecordVo>('/xiaoqi/medication/record'),
  schedule: createCrudApi<MedicationScheduleVo>('/xiaoqi/medication/schedule'),
  instruction: createCrudApi<MedicationInstructionVo>('/xiaoqi/medication/instruction'),
  stockLog: createCrudApi<MedicationStockLogVo>('/xiaoqi/medication/stock/log'),
};
