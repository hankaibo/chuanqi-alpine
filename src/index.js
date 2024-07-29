import Alpine from 'alpinejs';
import './style.css';

import {createEditor} from '@wangeditor/editor';
import Swiper from 'swiper';
import {Autoplay, Pagination, Navigation, Mousewheel} from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

window.Alpine = Alpine;

function buildQueryString(obj, prefix) {
  const str = [];
  for (const p in obj) {
    if (obj.hasOwnProperty(p)) {
      const k = prefix ? `${prefix}[${p}]` : p;
      const v = obj[p];
      str.push(v !== null && typeof v === 'object' ? buildQueryString(v, k) : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    }
  }
  return str.join('&');
}

Alpine.data('data', () => ({
  isLink: 'index',
  isMobile: false,
  swiperIndex: 0, // 当前最外部 swiper 的索引，方便切换 header 样式

  parentIndustries: [],
  childIndustry: [],
  parentCategories: [],
  childCategory: [],
  grandsonCategory: [],

  products: [], // 产品轮播图片数据
  industries: [], // 行业数据
  categories: [], // 产品的分类数据
  industryCase: {}, // 工程案例，以 行业id 作为 key
  about: {}, // 关于我们数据
  news: [], // 新闻资讯数据
  newsFirst: {}, // 第1条新闻资讯
  form: {}, // 留言信息

  /**
   * 获取产品数据，这些产品是后台配置专门在首页轮播显示的。
   */
  async getProducts() {
    const res = await fetch('/api/v1/products/index');
    const data = await res.json();
    this.products = data?.map((item) => ({
      ...item,
      // 使用缩略图，加快加载
      imageUrl: item.cover
        .map((it) => {
          return this.handleThumbnail(it.path);
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
   * 获取行业数据
   */
  async getIndusties() {
    // 缓存行业
    const INDUSTRY_KEY = '__industry__';
    const cachedIndustryData = sessionStorage.getItem(INDUSTRY_KEY);
    if (cachedIndustryData && cachedIndustryData !== '{}') {
      const data = JSON.parse(cachedIndustryData);
      this.handleSetIndustry(data);
    } else {
      fetch('/api/v1/industries/index')
        .then((res) => res.json())
        .then((data) => {
          this.handleSetIndustry(data);
          sessionStorage.setItem(INDUSTRY_KEY, JSON.stringify(data));
        });
    }
  },
  handleSetIndustry(data) {
    // swiper 轮播图使用数据，主要展示行业应用下的解决方案数据
    this.industries = data.map((item) => {
      if (!item.indexFile) {
        return item;
      }
      const thumbnailUrl = this.handleThumbnail(item.indexFile.path);
      return {
        ...item,
        imageUrl: thumbnailUrl,
      };
    });

    // swiper 主要展示工程案例的数据，默认加载第1个行业的数据
    this.getCases(this.industries[0]?.id);

    // 导航栏使用数据
    this.parentIndustries = data;
    this.childIndustry = this.parentIndustries[0] || [];
  },

  /**
   * 获取产品的分类
   */
  async getCategories() {
    // 缓存产品分类
    const CATEGORY_KEY = '__categroy__';
    const cachedData = sessionStorage.getItem(CATEGORY_KEY);
    if (cachedData && cachedData !== '{}') {
      const data = JSON.parse(cachedData);
      this.handleSetCategory(data);
    } else {
      fetch('/api/v1/categories/index')
        .then((res) => res.json())
        .then((data) => {
          this.handleSetCategory(data);
          sessionStorage.setItem(CATEGORY_KEY, JSON.stringify(data));
        });
    }
  },
  handleSetCategory(data) {
    // swiper
    this.categories = data.map((item) => {
      if (!item.indexFile) {
        return item;
      }
      const thumbnailUrl = this.handleThumbnail(item.indexFile.path);
      return {
        ...item,
        imageUrl: thumbnailUrl,
      };
    });
    // 导航栏
    this.parentCategories = data;
    this.childCategory = this.parentCategories[0];
    this.grandsonCategory = this.childCategory?.children || [];
    //
    this.$nextTick(() => {
      const outerSwiper = new Swiper(this.$refs.outerSwiper, {
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
            this.swiperIndex = outerSwiper.realIndex;
          },
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
    //   return this.industryCase[id];
    // }
    // 获取所有行业数据
    const params = {
      filters: {
        industryId: id,
      },
    };

    const queryString = buildQueryString(params);

    const res = await fetch(`/api/v1/cases/index?${queryString}`);
    const data = await res.json();
    this.industryCase[id] = data.data?.map((item) => {
      return {
        ...item,
        publishedAt: item.publishedAt.substring(0, 19).replace('T', ' '),
        imageUrl: this.handleThumbnail(item.cover.path),
      };
    });

    this.$nextTick(() => {
      new Swiper(`#${id}`, {
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
    const res = await fetch('/api/v1/about/1');
    const data = await res.json();
    const {indexFile, indexContent} = data;
    let thumbnailUrl;
    if (Array.isArray(indexFile) && indexFile.length) {
      const [file] = indexFile;
      thumbnailUrl = this.handleThumbnail(file.path);
    }
    this.about = {
      ...data,
      imageUrl: thumbnailUrl,
    };
    // 创建富文本
    this.$nextTick(() => {
      createEditor({
        selector: '#editor-container',
        html: data.indexContent,
        mode: 'simple',
        config: {
          readOnly: true,
        },
      });
    });
  },

  /**
   * 获取资讯中心数据。
   */
  async getNews() {
    const res = await fetch(`/api/v1/news?currentPage=1&pageSize=4`);
    const data = await res.json();
    this.news = data?.data.map((item) => {
      const {cover} = item;
      let thumbnailUrl;
      if (cover) {
        thumbnailUrl = this.handleThumbnail(cover.path);
      }
      return {
        ...item,
        imageUrl: thumbnailUrl,
      };
    });
    this.newsFirst = this.news.shift();
  },

  handleDetail(product) {
    const {id} = product;
    this.$router.push({name: 'ChuanQiProductDetail', params: {id}});
  },
  handleMore(industry) {
    const {chineseName, englishName} = industry;
    const tabs = JSON.stringify(industry.children.map((it) => ({id: it.id, name: it.name})));
    this.$router.push({name: 'ChuanQiIndustry', query: {chineseName, englishName, tabs}});
  },

  // 计算缩略图的地址
  handleThumbnail(path) {
    if (!path) {
      return '';
    }
    const separator = path.includes('files/') ? 'files/' : path?.includes('files\\') ? 'files\\' : '';
    const [http, name] = path.split(separator);
    return `${http}files/thumbnail_${name.split('.')[0]}.webp`;
  },

  init() {
    this.getProducts();
    this.getIndusties();
    this.getCategories();
    this.getAbout();
    this.getNews();
  },
}));

Alpine.start();
