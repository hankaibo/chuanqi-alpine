import Alpine from 'alpinejs';
import {getIndusties, getCategories} from './header';
import './style.css';

import {createReadOnlyEditor} from './read-only-editor';

window.Alpine = Alpine;

Alpine.data('headerData', () => ({
  headerHtml: '',
  // 导航栏数据
  isLink: 'news',
  isMobile: window.matchMedia('(max-width: 768px)').matches,

  parentIndustries: [],
  childIndustry: [],
  grandsonIndustry: [],

  parentCategories: [],
  childCategory: [],
  grandsonCategory: [],

  //
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

  init() {
    getIndusties((data) => {
      // 导航栏使用数据
      this.parentIndustries = data;
      this.childIndustry = this.parentIndustries[0]?.children || [];
      this.grandsonIndustry = this.childIndustry[0]?.children || [];
    });
    this.$watch('childIndustry', (newValue) => {
      this.grandsonIndustry = newValue[0]?.children || [];
    });

    getCategories((data) => {
      // 导航栏
      this.parentCategories = data;
      this.childCategory = this.parentCategories[0]?.children || [];
      this.grandsonCategory = this.childCategory[0]?.children || [];
    });
    this.$watch('childCategory', (newValue) => {
      this.grandsonCategory = newValue[0]?.children || [];
    });

    const localHtml = this.isMobile ? './header-mobile.html' : './header.html';
    this.$nextTick(() => {
      fetch(localHtml)
        .then((response) => response.text())
        .then((data) => {
          this.headerHtml = data;
        })
        .catch((error) => console.error('Error loading header:', error));
    });
  },
}));

Alpine.data('footerData', () => ({
  footerHtml: '',
  isMobile: window.matchMedia('(max-width: 768px)').matches,

  handleTop() {
    window.scrollTo({top: 0, behavior: 'smooth'});
  },

  init() {
    const localHtml = this.isMobile ? './footer-mobile.html' : './footer.html';
    this.$nextTick(() => {
      fetch(localHtml)
        .then((response) => response.text())
        .then((data) => {
          this.footerHtml = data;
        })
        .catch((error) => console.error('Error loading footer:', error));
    });
  },
}));

Alpine.data('data', () => ({
  name: '',
  publishDate: '',
  views: 0,
  summary: '',

  async getDetail() {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id');
    const res = await fetch(`/api/v1/news/${id}`);
    const data = await res.json();
    const {name, publishedAt, views, summary, content} = data;
    this.name = name;
    this.publishDate = publishedAt.substring(0, 19).replace('T', ' ');
    this.views = views;
    this.summary = summary;

    await this.initEditor(content);
  },
  initEditor(data) {
    return createReadOnlyEditor(data);
  },
}));

Alpine.start();
