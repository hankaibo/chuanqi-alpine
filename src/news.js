import Alpine from 'alpinejs';
import {getIndusties, getCategories} from './header';
import {getThumbnailUrl} from './untils';
import './style.css';

Alpine.data('data', () => ({
  // 导航栏数据
  isLink: 'news',
  parentIndustries: [],
  childIndustry: [],
  parentCategories: [],
  childCategory: [],
  grandsonCategory: [],

  loading: false,
  // 新闻数据
  newsList: [],
  total: 0,
  hasNextPage: false,
  queryParams: {
    currentPage: 1,
    pageSize: 10,
  },
  async getList() {
    this.loading = true;
    const res = await fetch(`/api/v1/news?pageSize=${this.queryParams.pageSize}&currentPage=${this.queryParams.currentPage}`);
    const data = await res.json();
    this.loading = false;
    this.hasNextPage = data.hasNextPage;
    this.newsList = data?.data.map((item) => {
      return {
        ...item,
        publishedAt: item.publishedAt.substring(0, 19).replace('T', ' '),
        imageUrl: getThumbnailUrl(item.cover.path),
      };
    });
    this.total = data.total;
  },
  handleDetail(item) {
    const {id} = item;
    window.location.href = `news-detail.html?id=${id}`;
  },
  handleNext() {
    this.queryParams.currentPage += 1;
    this.getList();
    window.scrollTo({
      top: 0,
      behavior: 'smooth', // 平滑滚动
    });
  },
  handlePrevious() {
    this.queryParams.currentPage -= 1;
    if (this.queryParams.currentPage < 1) {
      this.queryParams.currentPage = 1;
    }
    this.getList();
    window.scrollTo({
      top: 0,
      behavior: 'smooth', // 平滑滚动
    });
  },

  init() {
    getIndusties((data) => {
      // 导航栏使用数据
      this.parentIndustries = data;
      this.childIndustry = this.parentIndustries[0] || [];
    });

    getCategories((data) => {
      // 导航栏
      this.parentCategories = data;
      this.childCategory = this.parentCategories[0];
      this.grandsonCategory = this.childCategory?.children || [];
    });
  },
}));

Alpine.start();
