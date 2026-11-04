/**
 * 设置 / 账户偏好领域类型
 * 原型对应：05 登录 / 09d AI 额度 / 15 通知频控 / 16 个人中心 / 18 会员 / 24 长辈模式
 */

/** 通知频控档位（store 三档枚举；页面细分档位存本地配置） */
export type FreqMode = 'standard' | 'silent' | 'custom';

/** 添加方式：拍照识别 / 扫条码 / 手动输入 */
export type AddMethod = 'camera' | 'scan' | 'keyboard';

/** 会员档位：免费 / 会员 / 家庭组 */
export type PlanLevel = 'free' | 'member' | 'family';

export interface SettingState {
  /** 昵称（未登录展示用） */
  nickname: string;
  /** 长辈模式：大字号 · 大按钮 · 简化导航 */
  isElder: boolean;
  freqMode: FreqMode;
  /** 免打扰时段，格式「23:00-07:00」 */
  silentUntil: string;
  /** AI 识别总额度 */
  quotaTotal: number;
  quotaUsed: number;
  /** 识别预占次数（开始识别即预占 1 次，确认保存才消耗） */
  quotaPreOccupied: number;
  /** 上次使用的添加方式（降级兜底用） */
  lastAddMethod: AddMethod;
  plan: PlanLevel;
  /** 会员到期日 YYYY-MM-DD */
  planExpireAt: string;
  /** 自动续费 */
  autoRenew: boolean;
}
