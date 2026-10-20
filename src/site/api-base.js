// 生产环境的接口与站点不同源(见 .env.production 的 VITE_API_BASE_URL)；
// 开发环境该变量为空，请求保持相对路径，交给 vite.config.js 的 /api 代理。
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

/**
 * 把 `/api/v1/...` 补成完整地址；未配置 VITE_API_BASE_URL 时原样返回。
 * @param {string} path
 * @returns {string}
 */
function apiUrl(path) {
  return `${API_BASE}${path}`;
}

export {apiUrl};
