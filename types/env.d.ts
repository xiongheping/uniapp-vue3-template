interface ImportMetaEnv {
  /** 页面标题 */
  VITE_APP_TITLE: string;
  /** 开发环境配置 */
  VITE_APP_ENV: string;
  /** C 端后端地址（ruoyi-member-server：/app/auth、/app/member、/app/xq） */
  VITE_API_BASE_URL: string;
  /** 端口号 */
  VITE_APP_PORT: string;
  /** h5 是否走 vite 代理 */
  VITE_APP_PROXY: string;
  /** 删除console */
  VITE_DROP_CONSOLE: string;
  /** 客户端ID（sys_client.client_id） */
  VITE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
