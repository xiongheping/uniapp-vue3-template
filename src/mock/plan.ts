/**
 * 计划模块静态演示数据（取自《原型图V2.html》页面文案，纯展示，不接后端）
 */
export type PlanKind = 'medication' | 'water' | 'exercise' | 'pet' | 'plant' | 'health' | 'custom';

export interface PlanKindMeta {
  key: PlanKind;
  /** 分类名（卡片时间下方小字 / 筛选胶囊） */
  label: string;
  icon: string;
  /** 图标前景色 */
  fg: string;
  /** 图标底色 */
  bg: string;
  /** 卡片左侧色条 */
  bar: string;
}

/** 分类色板：与原型 .type-* / .plan-card.* 一一对应 */
export const PLAN_KINDS: PlanKindMeta[] = [
  { key: 'medication', label: '用药', icon: 'pill', fg: '#C77700', bg: '#FFF4E5', bar: '#FFA940' },
  { key: 'water', label: '喝水', icon: 'droplet', fg: '#1677FF', bg: '#E6F4FF', bar: '#1677FF' },
  { key: 'exercise', label: '运动', icon: 'activity', fg: '#2E7D32', bg: '#EAF8E8', bar: '#52C41A' },
  { key: 'pet', label: '宠物', icon: 'paw-print', fg: '#7B3FF2', bg: '#F0E6FF', bar: '#7B3FF2' },
  { key: 'plant', label: '植物', icon: 'sprout', fg: '#13C2C2', bg: '#E6FAFA', bar: '#13C2C2' },
  { key: 'health', label: '健康', icon: 'heart-pulse', fg: '#D93025', bg: '#FFEDED', bar: '#D93025' },
  { key: 'custom', label: '通用', icon: 'list-checks', fg: '#7B8494', bg: '#F0F2F6', bar: '#8A93A5' },
];

export function planKind(key: PlanKind): PlanKindMeta {
  return PLAN_KINDS.find(item => item.key === key) || PLAN_KINDS[PLAN_KINDS.length - 1];
}

export interface DemoPlan {
  id: string;
  kind: PlanKind;
  time: string;
  /** 时间下方分类小字 */
  kicker: string;
  title: string;
  meta: string;
}

/** 计划首页「待办」两张卡（原型 P2） */
export const DEMO_PLANS: DemoPlan[] = [
  { id: 'exercise', kind: 'exercise', time: '19:00', kicker: '运动', title: '快走 30 分钟', meta: '每周 3 次 · 一三五' },
  { id: 'pill', kind: 'medication', time: '20:00', kicker: '用药', title: '布洛芬缓释胶囊 · 1 粒', meta: '感冒发烧 · 晚餐后 30 分钟 · 第 5/7 天' },
];

/** 早间已完成分组摘要（原型 P2） */
export const DEMO_DONE_TEXT = '喝水 08:00 · 用药 08:00 · 宠物 08:00';

export interface PlanTemplate {
  key: PlanKind;
  name: string;
  /** 两行描述 */
  desc: string[];
  tag?: string;
}

/** 添加计划类型模板（原型 P3） */
export const PLAN_TEMPLATES: PlanTemplate[] = [
  { key: 'medication', name: '用药', desc: ['每天 2 次', '08:00 / 20:00'], tag: '最常用' },
  { key: 'water', name: '喝水', desc: ['每天 6 次', '每 2 小时 300ml'] },
  { key: 'exercise', name: '运动', desc: ['每周 3 次', '19:00 · 30 分钟'] },
  { key: 'pet', name: '宠物驱虫', desc: ['每月 1 号', '10:00 · 1 次'] },
  { key: 'plant', name: '植物浇水', desc: ['每 3 天', '09:00 · 1 次'] },
  { key: 'health', name: '血压血糖', desc: ['每天 2 次', '08:00 / 20:00'] },
];

/** 频率选项（P3b / P4 / P5） */
export const FREQ_OPTIONS = ['每天', '每周', '每月', '每 N 天', '按需'];

/** 自定义计划可选图标（P3b） */
export const CUSTOM_KINDS: PlanKind[] = ['health', 'medication', 'exercise', 'plant', 'pet', 'custom'];
