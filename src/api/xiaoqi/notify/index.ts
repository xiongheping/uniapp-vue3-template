/**
 * 消息通知与反馈：/xiaoqi/notification、/xiaoqi/notification/setting、/xiaoqi/feedback
 */
import type { BaseVo } from '../types';
import { createCrudApi } from '../crud';

export interface NotificationVo extends BaseVo {
  userId: number | string;
  familyId?: number | string;
  notifyType?: string;
  /** 优先级 */
  priority?: string;
  title: string;
  content?: string;
  relatedId?: number | string;
  relatedType?: string;
  /** 是否已读 */
  isRead?: boolean;
  readTime?: string;
}

export interface NotificationSettingVo extends BaseVo {
  userId: number | string;
  medicationRemind?: boolean;
  expiredRemind?: boolean;
  expiringRemind?: boolean;
  missedDoseRemind?: boolean;
  notificationSound?: boolean;
  notificationVibrate?: boolean;
  digestTime?: string;
  quickMode?: boolean;
  /** 免打扰时段 */
  dndStart?: string;
  dndEnd?: string;
  tempMuteStart?: string;
  tempMuteEnd?: string;
}

export interface FeedbackVo extends BaseVo {
  userId: number | string;
  feedbackType?: string;
  content: string;
  contact?: string;
  imageUrls?: string;
  status?: string | number;
  reply?: string;
}

export const NotifyApi = {
  notification: createCrudApi<NotificationVo>('/xiaoqi/notification'),
  setting: createCrudApi<NotificationSettingVo>('/xiaoqi/notification/setting'),
  feedback: createCrudApi<FeedbackVo>('/xiaoqi/feedback'),
};
