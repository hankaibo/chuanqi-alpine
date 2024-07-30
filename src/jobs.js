import Alpine from 'alpinejs';
import {getIndusties, getCategories} from './header';
import './style.css';

Alpine.data('data', () => ({
  // 导航栏数据
  isLink: 'jobs',
  parentIndustries: [],
  childIndustry: [],
  parentCategories: [],
  childCategory: [],
  grandsonCategory: [],

  jobs: [],
  isMobile: false,
  async getList() {
    const res = await fetch('/api/v1/jobs');
    const data = await res.json();
    this.jobs = data.data;
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
