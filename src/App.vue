<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app';
import { useAppStore, useItemStore, useMedicineStore } from '@/store';
// #ifdef MP-WEIXIN
import { mpUpdate } from '@/utils/index';
// #endif

const appStore = useAppStore();
const itemStore = useItemStore();
const medicineStore = useMedicineStore();

onLaunch(() => {
  console.log('App Launch');

  // 初始化系统信息
  appStore.initSystemInfo();

  // 显式注入 --status-bar-height（guide/overview 的 calc(var(--status-bar-height)+…) 无回退值，须保证变量始终有值）
  injectStatusBarHeight();

  // 首启动注入演示数据（首页 07 默认态列表 / 用药 11 时间轴；各只注入一次）
  itemStore.ensureSeedDemo();
  medicineStore.ensureSeedDemo();

  // 云端模式拉取物品列表（XqItemController）；本地模式静默跳过
  itemStore.fetchList();

  // #ifdef MP-WEIXIN
  mpUpdate();
  // #endif
});

/**
 * 注入 --status-bar-height（小程序保险）：
 * - H5：挂到 :root（documentElement）
 * - 小程序：无 document，真实值由 x-page 根节点内联 CSS 变量透传；page 级静态兜底见下方样式
 */
function injectStatusBarHeight() {
  const { statusBarHeight = 0 } = uni.getSystemInfoSync();
  // #ifdef H5
  if (statusBarHeight > 0 && typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--status-bar-height', `${statusBarHeight}px`);
  }
  // #endif
}

onShow(() => {
  console.log('App Show');
});

onHide(() => {
  console.log('App Hide');
});
</script>

<style lang="scss">
/* 每个页面公共css */
@import 'uview-plus/index.scss';
@import '@/static/styles/common.scss';
@import '@/static/styles/tokens.scss';

/* 显式定义 --status-bar-height 兜底（与 var() 原回退值一致）；真实值经 H5 :root / x-page 根节点覆盖 */
page {
  --status-bar-height: 40rpx;
}
</style>
