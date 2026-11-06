<template>
  <x-page :padded="false">
    <x-nav-bar />
    <x-empty icon="search" title="页面不存在" sub="链接可能已失效或被删除">
      <template #action>
        <x-button text="回到首页" @click="goHome" />
      </template>
    </x-empty>
  </x-page>
</template>

<script setup lang="ts">
import { HOME_PATH } from '@/router';

/**
 * 404（模板页）
 * 自定义 tabBar 下跳首页须 redirectTo（switchTab 在非原生 tabBar 页面会失败）
 */
function goHome() {
  uni.redirectTo({ url: HOME_PATH });
}
</script>
