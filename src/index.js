import Alpine from 'alpinejs';
import './style.css';

import { createEditor } from '@wangeditor/editor';
import Swiper from 'swiper';
import { Autoplay, Pagination, Mousewheel } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

window.Alpine = Alpine;

Alpine.data('data', () => ({
  header: '',
  footer: '',
  isLink: 'index',
  isMobile: false,

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
  form: {}, // 留言信息

  /**
   * 获取产品数据，这些产品是后台配置专门在首页轮播显示的。
   */
  async getProducts() {
    const res = await fetch('api/products/index');
    const data = await res.json();
    this.products = data.map((item) => ({
      ...item,
      imageUrl: item.cover
        .map((it) => {
          const separator = it.path.includes('files/') ? 'files/' : it.path?.includes('files\\') ? 'files\\' : '';
          const [http, name] = it.path.split(separator);
          return `${http}files/thumbnail_${name.split('.')[0]}.webp`;
        })
        .find((it) => it),
    }));
    this.$nextTick(() => {
      new Swiper(this.$refs.outerSwiper, {
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
      });
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
    // 此处直接复用导航栏中的数据。
  },
  /**
   * 获取产品的分类，此处的产品分类与导航栏的“行业应用”中的数据一致。这是“行业应用”中的数据在分类下有产品信息，而此处不需要。
   */
  async getCategories() {
    // 此处直接复用导航栏中的数据。
  },
  /**
   * 根据行业 id 获取案例。
   * @param {*} id 行业 id
   * @returns
   */
  async getCases(id) {
    if (this.industryCase[id]) {
      return this.industryCase[id];
    }
    // 获取所有行业数据
    const res = await fetch(`/api/cases/industry/${id}`);
    const data = await res.json();
    this.industryCase[id] = data;

    this.$nextTick(() => {
      new Swiper(this.$refs.tabSwiper, {
        lazy: true,
        slidesPerView: 3,
        spaceBetween: 30,
      });
    });
  },
  /**
   * 获取关于我们数据。
   */
  async getAbout() {
    const res = await fetch('/api/about/1');
    const data = await res.json();
    const { indexFile, indexContent } = data;
    let thumbnailUrl;
    if (Array.isArray(indexFile) && indexFile.length) {
      const [file] = indexFile;
      const separator = file.path.includes('files/') ? 'files/' : file.path?.includes('files\\') ? 'files\\' : '';
      const [http, name] = file.path.split(separator);
      thumbnailUrl = `${http}files/thumbnail_${name.split('.')[0]}.webp`;
    }
    this.about = {
      ...data,
      imageUrl: thumbnailUrl,
    };
    // 创建富文本
    createEditor({
      selector: '#editor-container',
      html: data.indexContent,
      mode: 'simple',
      config: {
        readOnly: true,
      },
    });
  },
  /**
   * 获取资讯中心数据。
   */
  async getNews() {
    const res = await fetch(`/api/news?count=4&page=1`);
    const data = await res.json();
    this.news = data.data.map((item) => {
      const { coverImage } = item;
      let thumbnailUrl;
      if (coverImage) {
        const separator = coverImage.path.includes('files/')
          ? 'files/'
          : coverImage.path?.includes('files\\')
            ? 'files\\'
            : '';
        const [http, name] = coverImage.path.split(separator);
        thumbnailUrl = `${http}files/thumbnail_${name.split('.')[0]}.webp`;
      }
      return {
        ...item,
        imageUrl: thumbnailUrl,
      };
    });
  },

  handleDetail(product) {
    const { id } = product;
    this.$router.push({ name: 'ChuanQiProductDetail', params: { id } });
  },
  handleMore(industry) {
    const { chineseName, englishName } = industry;
    const tabs = JSON.stringify(industry.children.map((it) => ({ id: it.id, name: it.name })));
    this.$router.push({ name: 'ChuanQiIndustry', query: { chineseName, englishName, tabs } });
  },

  handleSetIndustry(data) {
    // 轮播图使用数据
    this.industries = data.map((item) => {
      if (!item.indexFile) {
        return item;
      }
      const separator = item.indexFile.path.includes('files/')
        ? 'files/'
        : item.indexFile.path?.includes('files\\')
          ? 'files\\'
          : '';
      const [http, name] = item.indexFile.path.split(separator);
      const thumbnailUrl = `${http}files/thumbnail_${name.split('.')[0]}.webp`;
      return {
        ...item,
        imageUrl: thumbnailUrl,
      };
    });
    // 导航栏使用数据
    this.parentIndustries = data;
    this.childIndustry = this.parentIndustries[0] || [];
  },

  handleSetCategory(data) {
    // swiper
    this.categories = data.map((item) => {
      if (!item.indexFile) {
        return item;
      }
      const separator = item.indexFile.path.includes('files/')
        ? 'files/'
        : item.indexFile.path?.includes('files\\')
          ? 'files\\'
          : '';
      const [http, name] = item.indexFile.path.split(separator);
      const thumbnailUrl = `${http}files/thumbnail_${name.split('.')[0]}.webp`;
      return {
        ...item,
        imageUrl: thumbnailUrl,
      };
    });
    // 导航栏
    this.parentCategories = data;
    this.childCategory = this.parentCategories[0];
    this.grandsonCategory = this.childCategory?.children || [];
  },

  init() {
    this.getProducts();
    this.getIndusties();
    this.getAbout();
    this.getNews();

    // 缓存行业
    const INDUSTRY_KEY = '__industry__';
    const cachedIndustryData = sessionStorage.getItem(INDUSTRY_KEY);
    if (cachedIndustryData && cachedIndustryData !== '{}') {
      const data = JSON.parse(cachedIndustryData);
      this.handleSetIndustry(data);
    } else {
      fetch('/api/industries/index')
        .then((res) => res.json())
        .then((data) => {
          this.handleSetIndustry(data);
          sessionStorage.setItem(INDUSTRY_KEY, JSON.stringify(data));
        });
    }

    // 缓存产品分类
    const CATEGORY_KEY = '__categroy__';
    const cachedData = sessionStorage.getItem(CATEGORY_KEY);
    if (cachedData && cachedData !== '{}') {
      const data = JSON.parse(cachedData);
      this.handleSetCategory(data);
    } else {
      fetch('/api/categories/index')
        .then((res) => res.json())
        .then((data) => {
          this.handleSetCategory(data);
          sessionStorage.setItem(CATEGORY_KEY, JSON.stringify(data));
        });
    }

    fetch('./header.html')
      .then((res) => res.text())
      .then((text) => (this.header = text));
  },
}));

Alpine.start();
