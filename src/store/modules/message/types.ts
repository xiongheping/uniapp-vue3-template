/**
 * 消息中心领域类型
 * 原型对应：14 消息中心 / 15 通知频控 / 自定义 tabBar 角标
 */

/** 角标类型：总未读 / P0 必达未读 / 不显示 */
export type BadgeType = 'total' | 'p0' | 'none';

/** 消息级别：P0 必达（服药提醒）/ P1 重要 / P2 一般 */
export type MessageLevel = 'P0' | 'P1' | 'P2';

/** 消息分组：必达 / 摘要 / 历史 */
export type MessageGroup = 'must' | 'digest' | 'history';

export interface MessageRecord {
  id: string;
  level: MessageLevel;
  group: MessageGroup;
  title: string;
  /** 摘要正文（列表第二行） */
  body?: string;
  /** 列表副标题（展示用，与 body 同源） */
  sub?: string;
  /** 图标名（x-icon） */
  icon?: string;
  /** 摘要类是否支持滑动操作（头部摘要卡不滑动） */
  swipeable?: boolean;
  /** 展示时间，如「08:00」或「昨天」 */
  time: string;
  read: boolean;
  /** 点击跳转路径，如 /pages/med/checkin/index?planId=p1&doseId=d1 */
  path?: string;
}
