import {resolve} from 'path';
import {fileURLToPath} from 'node:url';
import {defineConfig, loadEnv} from 'vite';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, projectRoot);

  return {
    root: resolve(projectRoot, 'src'),
    base: env.VITE_BASE_PATH || '/',
    publicDir: resolve(projectRoot, 'public'),
    build: {
      outDir: resolve(projectRoot, 'dist'),
      emptyOutDir: true,
      rolldownOptions: {
        input: {
          header: resolve(projectRoot, 'src/header.html'),
          'header-mobile': resolve(projectRoot, 'src/header-mobile.html'),
          footer: resolve(projectRoot, 'src/footer.html'),
          'footer-mobile': resolve(projectRoot, 'src/footer-mobile.html'),
          popover: resolve(projectRoot, 'src/popover.html'),
          about: resolve(projectRoot, 'src/about.html'),
          jobs: resolve(projectRoot, 'src/jobs.html'),
          news: resolve(projectRoot, 'src/news.html'),
          'news-detail': resolve(projectRoot, 'src/news-detail.html'),
          cases: resolve(projectRoot, 'src/cases.html'),
          'cases-detail': resolve(projectRoot, 'src/cases-detail.html'),
          products: resolve(projectRoot, 'src/products.html'),
          'product-detail': resolve(projectRoot, 'src/product-detail.html'),
          industry: resolve(projectRoot, 'src/industry.html'),
          'solution-detail': resolve(projectRoot, 'src/solution-detail.html'),
          index: resolve(projectRoot, 'src/index.html'),
        },
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000', // 代理目标地址
          changeOrigin: true, // 是否改变请求头中的 Origin 为目标 URL，默认为 true
        },
      },
    },
  };
});
