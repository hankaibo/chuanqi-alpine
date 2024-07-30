import {nanoid} from 'nanoid';
import Alpine from 'alpinejs';
import './style.css';

import {createEditor} from '@wangeditor/editor';
import Swiper from 'swiper';
import {Autoplay, Pagination, Navigation, Mousewheel} from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import {getIndusties, getCategories} from './header';
import {getThumbnailUrl, buildQueryString} from './untils';

window.Alpine = Alpine;

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
    const res = await fetch('/api/v1/products/index');
    const data = await res.json();
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
    const res = await fetch('/api/v1/about/1');
    const data = await res.json();
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
      const res = await fetch('/api/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.form),
      });
    } catch (e) {
      console.error(e);
    } finally {
      this.form = {
        id: undefined,
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

  handleDetail(product) {
    const {id} = product;
    this.$router.push({name: 'ChuanQiProductDetail', params: {id}});
  },
  handleMore(industry) {
    const {chineseName, englishName} = industry;
    const tabs = JSON.stringify(industry.children.map((it) => ({id: it.id, name: it.name})));
    this.$router.push({name: 'ChuanQiIndustry', query: {chineseName, englishName, tabs}});
  },

  init() {
    getIndusties((data) => {
      // 导航栏使用数据
      this.parentIndustries = data;
      this.childIndustry = this.parentIndustries[0] || [];

      // swiper 轮播图使用数据，主要展示行业应用下的解决方案数据
      this.industries = data.map((item) => {
        if (!item.indexFile) {
          return item;
        }
        const thumbnailUrl = getThumbnailUrl(item.indexFile.path);
        return {
          ...item,
          imageUrl: thumbnailUrl,
        };
      });

      // swiper 主要展示工程案例的数据，默认加载第1个行业的数据
      this.getCases(this.industries[0]?.id);
    });
    getCategories((data) => {
      // 导航栏
      this.parentCategories = data;
      this.childCategory = this.parentCategories[0];
      this.grandsonCategory = this.childCategory?.children || [];

      // swiper
      this.categories = data.map((item) => {
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
    });

    this.getProducts();
    this.getAbout();
    this.getNews();
  },
}));

Alpine.start();
