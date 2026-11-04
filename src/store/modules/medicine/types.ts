/**
 * 用药（服药提醒）领域类型
 * 原型对应：11 用药首页 / 11b 完成庆祝 / 11c 用药设置 / 12 说明书 / 13 今日打卡 / 14 消息中心
 */

/** 计划类型：定时服用 / 按需服用 */
export type PlanType = 'ontime' | 'prn';

/** 计划可见范围 */
export type PlanVisibility = 'self' | 'family';

/** 服用时段 */
export interface DoseTime {
  id: string;
  /** HH:mm */
  time: string;
  /** 时段文案（早间 / 午间 / 晚间） */
  label?: string;
  /** 餐前餐后说明 */
  afterMeal?: string;
  /** 单次用量，如「1 粒」 */
  amount?: string;
  /** 提前提醒分钟数 */
  advance?: number;
  enabled?: boolean;
}

/** 疗程：总天数与当前进度；起止日期为计划页编辑字段 */
export interface PlanCourse {
  total: number;
  index: number;
  /** 结束后自动停止提醒 */
  autoStop?: boolean;
  start?: string;
  end?: string;
}

/** 库存 */
export interface PlanStock {
  have: number;
  total: number;
  unit: string;
}

/** 说明书摘录（逐字来自说明书原文，不构成用药建议） */
export interface PlanInstruction {
  /** 用法用量 */
  usage?: string;
  /** 注意事项 */
  caution?: string;
  /** 适应症 */
  indications?: string;
  /** 禁忌 */
  contraindications?: string;
  /** 说明书照片 */
  imageUrl?: string;
}

/** 服用计划 */
export interface MedPlan {
  id: string;
  name: string;
  spec?: string;
  /** 批准文号 */
  approval?: string;
  type: PlanType;
  /** 服药原因（如「感冒」） */
  reason?: string;
  doses: DoseTime[];
  course?: PlanCourse;
  stock?: PlanStock;
  /** 低库存预警阈值（可用天数） */
  lowStockDays?: number;
  /** 每日最大服用量 */
  perDayMax?: string;
  /** 两次服用最小间隔 */
  minInterval?: string;
  /** 按需服药的原因说明 */
  prnReason?: string;
  visibility: PlanVisibility;
  enabled?: boolean;
  instruction?: PlanInstruction;
  createdAt?: string;
}

/** 打卡记录状态 */
export type DoseStatus = 'pending' | 'taken' | 'skipped' | 'missed';

/** 打卡记录（key = planId:doseId:date） */
export interface DoseRecord {
  status: DoseStatus;
  /** 服用时间 HH:mm */
  takenAt?: string;
  /** 撤销窗口截止时间戳（ms），5 分钟 */
  undoUntil?: number;
  /** 稍后提醒时间 HH:mm */
  snoozeAt?: string;
}

/** 今日排班行（用药首页时间轴） */
export interface DoseEntry {
  /** 记录键 planId:doseId:date */
  key: string;
  planId: string;
  doseId: string;
  /** 计划名称（药品名） */
  name: string;
  time: string;
  label?: string;
  afterMeal?: string;
  amount?: string;
  advance?: number;
  reason?: string;
  status: DoseStatus;
  takenAt?: string;
  undoUntil?: number;
}

/** 昨日漏服条目（用药首页补登卡片） */
export interface MissedEntry {
  planId: string;
  doseId: string;
  date: string;
  planName?: string;
  time?: string;
}
