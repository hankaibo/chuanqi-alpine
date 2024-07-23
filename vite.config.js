// vite.config.js
import {resolve} from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  root: resolve(__dirname, 'src'),
  publicDir: resolve(__dirname, './public'),
  base: '/temp/',
  build: {
    outDir: resolve(__dirname, 'dist'),
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      input: {
        about: resolve(__dirname, 'src/about.html'),
        jobs: resolve(__dirname, 'src/jobs.html'),
        news: resolve(__dirname, 'src/news.html'),
        'news-detail': resolve(__dirname, 'src/news-detail.html'),
        cases: resolve(__dirname, 'src/cases.html'),
        'cases-detail': resolve(__dirname, 'src/cases-detail.html'),
        industry: resolve(__dirname, 'src/industry.html'),
        index: resolve(__dirname, 'src/index.html'),
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        // target: 'http://localhost:3000', // 代理目标地址
        target: 'https://www.powerail.com.cn', // 代理目标地址
        changeOrigin: true, // 是否改变请求头中的 Origin 为目标 URL，默认为 true
        // secure: false, // 如果代理目标是 HTTPS，且证书自签名，需要设置为 false，默认为 true
      },
    },
  },
});
