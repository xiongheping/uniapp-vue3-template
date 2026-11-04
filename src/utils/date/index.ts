/**
 * 日期工具（小程序 iOS 需把 - 换成 / 才能被 new Date 解析）
 */

/**
 * Date 转 YYYY-MM-DD
 */
export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 今天 YYYY-MM-DD
 */
export function today(): string {
  return toDateStr(new Date());
}

/**
 * 相对起始日期偏移若干天
 * @param offset 偏移天数，可为负
 * @param from 起始日期 YYYY-MM-DD，默认今天
 */
export function addDays(offset: number, from = today()): string {
  const date = new Date(`${from.replace(/-/g, '/')} 00:00:00`);
  date.setDate(date.getDate() + offset);
  return toDateStr(date);
}

/**
 * 距今天还剩多少天（负数表示已过期）
 */
export function diffDays(dateStr: string): number {
  if (!dateStr) {
    return Number.NaN;
  }
  const target = new Date(`${dateStr.replace(/-/g, '/')} 00:00:00`).getTime();
  const base = new Date(`${today().replace(/-/g, '/')} 00:00:00`).getTime();
  return Math.round((target - base) / 86400000);
}

/**
 * 点号日期 2026.11.02
 */
export function dotDate(dateStr = ''): string {
  return String(dateStr).replace(/-/g, '.');
}

/**
 * 短日期 11.02
 */
export function shortDate(dateStr = ''): string {
  const parts = String(dateStr).split('-');
  return parts.length === 3 ? `${parts[1]}.${parts[2]}` : dateStr;
}

const WEEK_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/**
 * 中文长日期 2026年10月30日 周五
 */
export function cnDate(dateStr = today()): string {
  const date = new Date(`${dateStr.replace(/-/g, '/')} 00:00:00`);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${WEEK_CN[date.getDay()]}`;
}

/**
 * 到期剩余天数的口语描述：过期18天 / 今天到期 / 3天后
 */
export function dueLabel(dateStr: string): string {
  const days = diffDays(dateStr);
  if (Number.isNaN(days)) {
    return '未填写';
  }
  if (days < 0) {
    return `过期${Math.abs(days)}天`;
  }
  if (days === 0) {
    return '今天到期';
  }
  if (days === 1) {
    return '明天';
  }
  return `${days}天后`;
}
