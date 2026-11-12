/**
 * 消息通知与反馈
 * 来源：ruoyi-xiaoqi-app /app/xq/notification、/app/xq/notification/setting、/app/xq/feedback
 * 布尔开关统一为 Integer（0 关 1 开），与后端 XqNotificationSettingVo 一致
 */
import type { BaseVo, PageQuery } from '../types';
import { get, put } from '@/utils/request';
import { biz, createCrudApi } from '../crud';

export interface NotificationVo extends BaseVo {
  userId: number | string;
  familyId?: number | string;
  /** 消息类型（Integer 字典值） */
  notifyType?: number;
  /** 优先级（Integer 字典值） */
  priority?: number;
  title: string;
  content?: string;
  relatedId?: number | string;
  relatedType?: number;
  /** 是否已读 0 未读 1 已读 */
  isRead?: number;
  readTime?: string;
  isDeleted?: number;
}

export interface NotificationSettingVo extends BaseVo {
  userId: number | string;
  /** 用药提醒 0 关 1 开 */
  medicationRemind?: number;
  expiredRemind?: number;
  expiringRemind?: number;
  missedDoseRemind?: number;
  notificationSound?: number;
  notificationVibrate?: number;
  /** 摘要时间 HH:mm:ss */
  digestTime?: string;
  quickMode?: number;
  /** 免打扰时段 HH:mm:ss */
  dndStart?: string;
  dndEnd?: string;
  /** 临时免打扰（含日期） */
  tempMuteStart?: string;
  tempMuteEnd?: string;
}

export interface FeedbackVo extends BaseVo {
  userId: number | string;
  feedbackType?: number;
  content: string;
  contact?: string;
  imageUrls?: string;
  status?: number;
  reply?: string;
}

/** 消息列表查询条件（后端 XqNotificationController#list，参数名是 notifyType） */
export interface NotificationQuery extends PageQuery {
  notifyType?: number;
  isRead?: number;
}

export const NotifyApi = {
  notification: createCrudApi<NotificationVo>('/app/xq/notification'),
  feedback: createCrudApi<FeedbackVo>('/app/xq/feedback'),

  /** 未读消息数 */
  unreadCount() {
    return get<number>('/app/xq/notification/unread-count', biz());
  },

  /** 单条已读 */
  read(id: number | string) {
    return put<void>(`/app/xq/notification/${id}/read`, biz());
  },

  /** 全部已读，返回影响条数 */
  readAll() {
    return put<number>('/app/xq/notification/read-all', biz());
  },

  /** 通知设置（单条，不存在时后端自动按默认值初始化） */
  setting: {
    get() {
      return get<NotificationSettingVo>('/app/xq/notification/setting', biz());
    },
    update(data: Partial<NotificationSettingVo>) {
      return put<void>('/app/xq/notification/setting', biz({ data }));
    },
  },
};
