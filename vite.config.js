// vite.config.js
import {resolve} from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd());

  return {
    root: resolve(__dirname, 'src'),
    base: env.VITE_BASE_PATH || '/',
    publicDir: resolve(__dirname, './public'),
    build: {
      outDir: resolve(__dirname, 'dist'),
      chunkSizeWarningLimit: 1024,
      rollupOptions: {
        input: {
          header: resolve(__dirname, 'src/header.html'),
          'header-mobile': resolve(__dirname, 'src/header-mobile.html'),
          footer: resolve(__dirname, 'src/footer.html'),
          'footer-mobile': resolve(__dirname, 'src/footer-mobile.html'),
          popover: resolve(__dirname, 'src/popover.html'),
          about: resolve(__dirname, 'src/about.html'),
          jobs: resolve(__dirname, 'src/jobs.html'),
          news: resolve(__dirname, 'src/news.html'),
          'news-detail': resolve(__dirname, 'src/news-detail.html'),
          cases: resolve(__dirname, 'src/cases.html'),
          'cases-detail': resolve(__dirname, 'src/cases-detail.html'),
          products: resolve(__dirname, 'src/products.html'),
          'product-detail': resolve(__dirname, 'src/product-detail.html'),
          industry: resolve(__dirname, 'src/industry.html'),
          'solution-detail': resolve(__dirname, 'src/solution-detail.html'),
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
  };
});
