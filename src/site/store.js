import {getIndustries, getCategories} from './api';

// 进行中的加载(模块级,避免并发调用重复请求)。
let inflight = null;

/**
 * 注册站点级共享状态。
 * 数据只取一次(幂等,并发调用复用同一个 Promise),页头/页脚/页面组件统一从这里读取。
 */
function registerSiteStore(Alpine) {
  Alpine.store('site', {
    industries: [],
    categories: [],
    isMobile: matchMedia('(max-width: 768px)').matches,
    swiperIndex: 0,
    loaded: false,

    async load() {
      if (this.loaded) return;
      if (!inflight) {
        inflight = Promise.all([getIndustries(), getCategories()])
          .then(([industries, categories]) => {
            this.industries = industries;
            this.categories = categories;
            this.loaded = true;
          })
          .catch((error) => {
            inflight = null;
            throw error;
          });
      }
      return inflight;
    },
  });
}

export {registerSiteStore};
