// vite.config.js
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  root: resolve(__dirname, "src"),
  publicDir: resolve(__dirname, './public'),
  base: "/",
  build: {
    outDir: resolve(__dirname, 'dist'),
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      input: {
        about: resolve(__dirname, "src/about.html"),
        invite: resolve(__dirname, "src/pages/invite.html"),
        news: resolve(__dirname, "src/pages/news.html"),
        "news-detail": resolve(__dirname, "src/pages/news-detail.html"),
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000", // 代理目标地址
        changeOrigin: true, // 是否改变请求头中的 Origin 为目标 URL，默认为 true
        rewrite: (path) => path.replace(/^\/api/, "/api/v1"), // 路径重写规则，将请求路径中的 '/api' 前缀去掉
        // secure: false, // 如果代理目标是 HTTPS，且证书自签名，需要设置为 false，默认为 true
      },
    },
  },
});
