/**
 * 自定义 tabBar 配置
 * 原型为 4 个 tab 且需要图标染色 + 角标，原生 tabBar 只能吃 png，故改用 components/x-tabbar
 * 原生 tabBar 移除后，tab 页之间切换走 uni.redirectTo（保持单层栈，语义等同 switchTab）
 */
import type { BadgeType } from '@/store/modules/message/types';

export interface TabBarItem {
  path: string;
  text: string;
  icon: string;
  /**
   * 角标类型：总未读 / P0 必达未读
   */
  badge: BadgeType;
}

export const TAB_BAR_LIST: TabBarItem[] = [
  { path: '/pages/tab/home/index', text: '首页', icon: 'house', badge: 'total' },
  { path: '/pages/tab/medicine/index', text: '用药', icon: 'pill', badge: 'total' },
  { path: '/pages/tab/message/index', text: '消息', icon: 'msg', badge: 'p0' },
  { path: '/pages/tab/mine/index', text: '我的', icon: 'user', badge: 'total' },
];

export const TAB_PATHS = TAB_BAR_LIST.map(item => item.path);

/**
 * 是否是 tab 页路径
 */
export function isCustomTabBarPath(path = ''): boolean {
  return TAB_PATHS.includes(path.split('?')[0] ?? '');
}

/**
 * 切换 tab
 */
export function switchTabPath(url: string) {
  uni.redirectTo({ url });
}
