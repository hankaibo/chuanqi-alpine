import {nanoid} from 'nanoid';
import {createPopper} from '@popperjs/core';
import Alpine from './bootstrap';

import Swiper from 'swiper';
import {Autoplay, Pagination, Navigation, Mousewheel} from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import * as api from './site/api';
import {getThumbnailUrl, observeOnce} from './utils';
import {createReadOnlyEditor} from './read-only-editor';

Alpine.data('popoverData', () => ({
  isMobile: window.matchMedia('(max-width: 768px)').matches,
  popperInstance: null,

  show(tooltip) {
    tooltip.classList.remove('hidden');

    this.popperInstance = createPopper(this.$el, tooltip, {
      placement: 'left',
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, 8],
          },
        },
        {
          name: 'arrow',
          options: {
            element: tooltip.querySelector('.arrow'),
          },
        },
      ],
    });

    this.popperInstance.update();
  },

  hide(tooltip) {
    tooltip.classList.add('hidden');

    this.popperInstance.setOptions((options) => ({
      ...options,
      modifiers: [...options.modifiers, {name: 'eventListeners', enabled: false}],
    }));
  },
}));

Alpine.data('data', () => ({
  isMobile: window.matchMedia('(max-width: 768px)').matches,

  outerSwiperRef: null,
  products: [], // 产品轮播图片数据
  industries: [], // 行业数据
  categories: [], // 产品的分类数据
  industryCase: {}, // 工程案例，以 行业id 作为 key
  about: {}, // 关于我们数据
  news: [], // 新闻资讯数据
  newsFirst: {}, // 第1条新闻资讯
  form: {}, // 留言信息

  /**
   * 获取行业数据
   * 复用 header 中的数据
   */

  /**
   * 获取产品的分类
   * 复用 header 中的数据
   */

  /**
   * 获取产品数据，这些产品是后台配置专门在首页轮播显示的。
   */
  async getProducts() {
    const data = await api.getProducts();
    this.products = data?.map((item) => ({
      ...item,
      // 使用缩略图，加快加载
      imageUrl: item.cover
        .map((it) => {
          return getThumbnailUrl(it.path);
        })
        .find((it) => it),
    }));
    this.$nextTick(() => {
      new Swiper(this.$refs.innerSwiper, {
        modules: [Autoplay, Pagination],
        loop: true,
        lazy: true,
        autoplay: {
          delay: 5000,
          disableOnInteraction: false,
        },
        pagination: {
          el: '.swiper-pagination-inner',
          clickable: true,
        },
      });
    });
  },

  /**
   * 根据行业 id 获取案例。
   * @param {*} id 行业 id
   * @returns
   */
  async getCases(id) {
    // if (this.industryCase[id]) {
    //   const swiper = this.industryCase[`id${id}`];
    //   if (swiper) {
    //     setTimeout(() => {
    //       swiper.update();
    //     }, 300)
    //   }
    //   return this.industryCase[id];
    // }
    // 获取所有行业数据
    const data = await api.getCases(id);
    this.industryCase[id] = data.data?.map((item) => {
      return {
        ...item,
        publishedAt: item.publishedAt.substring(0, 19).replace('T', ' '),
        imageUrl: getThumbnailUrl(item.cover.path),
      };
    });

    this.$nextTick(() => {
      this.industryCase[`id${id}`] = new Swiper(`#id${id}`, {
        modules: [Navigation, Pagination],
        lazy: true,
        slidesPerView: 3,
        spaceBetween: 30,
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
      });
    });
  },

  /**
   * 获取关于我们数据。
   */
  async getAbout() {
    const data = await api.getAbout();
    const {indexFile, indexContent} = data;
    let thumbnailUrl;
    if (Array.isArray(indexFile) && indexFile.length) {
      const [file] = indexFile;
      thumbnailUrl = getThumbnailUrl(file.path);
    }
    this.about = {
      ...data,
      imageUrl: thumbnailUrl,
    };
    // 创建富文本
    this.$nextTick(() => createReadOnlyEditor(indexContent));
  },

  /**
   * 获取资讯中心数据。
   */
  async getNews() {
    const data = await api.getNews(1, 4);
    this.news = data?.data.map((item) => {
      const {cover} = item;
      let thumbnailUrl;
      if (cover) {
        thumbnailUrl = getThumbnailUrl(cover.path);
      }
      return {
        ...item,
        imageUrl: thumbnailUrl,
      };
    });
    this.newsFirst = this.news.shift();
  },

  /**
   * 新增留言信息
   */
  async handleSumbit() {
    Object.keys(this.form).forEach((key) => {
      if (this.form[key] === '' || this.form[key] == null) {
        alert(`请输入${key}`);
      }
    });

    try {
      const res = await api.submitMessage(this.form);
    } catch (e) {
      console.error(e);
    } finally {
      this.form = {
        name: undefined,
        phone: undefined,
        email: undefined,
        department: undefined,
        message: undefined,
        content: undefined,
      };
    }
  },
  handleSubmitTest() {
    this.form.message = nanoid();
  },

  handleInitSwiper() {
    const outerSwiper = new Swiper('#outerSwiper', {
      modules: [Pagination, Mousewheel],
      direction: 'vertical',
      slidesPerView: 1,
      spaceBetween: 30,
      mousewheel: true,
      lazy: true,
      pagination: {
        el: this.$refs.outerPagination,
        clickable: true,
      },
      on: {
        slideChange: () => {
          this.$dispatch('set-swiper-index', outerSwiper.realIndex);
        },
      },
    });
    this.outerSwiperRef = outerSwiper;
  },

  handleIndustry(pId, index = 0) {
    window.open(`industry.html?pId=${pId}&index=${index}`, '_blank', 'noopener,noreferrer');
  },

  handleSolutionDetail(solutionId) {
    window.open(`solution-detail.html?id=${solutionId}`, '_blank', 'noopener,noreferrer');
  },

  // 产品分类页面
  handleProductCategory(pId, index = 0) {
    window.open(`products.html?pId=${pId}&index=${index}`, '_blank', 'noopener,noreferrer');
  },

  // 产品详情页面
  handleProductDetail(productId) {
    window.open(`product-detail.html?id=${productId}`, '_blank', 'noopener,noreferrer');
  },

  handleCaseDetail({id}) {
    window.open(`cases-detail.html?id=${id}`, '_blank', 'noopener,noreferrer');
  },

  handleAbout() {
    window.open('about.html', '_blank', 'noopener,noreferrer');
  },

  handleNews() {
    window.open('news.html', '_blank', 'noopener,noreferrer');
  },

  handleNewsDetail({id}) {
    window.open(`news-detail.html?id=${id}`, '_blank', 'noopener,noreferrer');
  },

  //
  async init() {
    if (!this.isMobile) {
      this.$nextTick(() => {
        this.handleInitSwiper();
      });
    }

    const industries = await api.getIndustries();
    // swiper 轮播图使用数据，主要展示行业应用下的解决方案数据
    this.industries = industries.map((item) => {
      if (!item.indexFile) {
        return item;
      }
      const thumbnailUrl = getThumbnailUrl(item.indexFile.path);
      return {
        ...item,
        imageUrl: thumbnailUrl,
      };
    });

    const categories = await api.getCategories();
    this.categories = categories.map((item) => {
      if (!item.indexFile) {
        return item;
      }
      const thumbnailUrl = getThumbnailUrl(item.indexFile.path);
      return {
        ...item,
        imageUrl: thumbnailUrl,
      };
    });

    this.$nextTick(() => {
      setTimeout(() => {
        this.outerSwiperRef?.update();
      }, 1000);
    });

    this.getProducts();

    // 异步加载
    observeOnce(document.querySelector('.swiper-slide-industry'), () => {
      // 在这里执行你的逻辑，比如加载图片、动画等
      // swiper 主要展示工程案例的数据，默认加载第1个行业的数据
      this.getCases(this.industries[0]?.id);
    });
    observeOnce(document.querySelector('.swiper-slide-cases'), () => {
      this.getAbout();
    });
    observeOnce(document.querySelector('.swiper-slide-about'), () => {
      this.getNews();
    });
  },
}));

Alpine.start();
