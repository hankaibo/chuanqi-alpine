import Alpine from 'alpinejs';
import './style.css';

import { createEditor } from '@wangeditor/editor';
window.createEditor = createEditor;

Alpine.data('data', () => ({
  header: '',
  footer: '',
  isLink: 'cases',
  name: '',
  publishDate: '',
  views: 0,
  summary: '',

  async getDetail() {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id');
    const res = await fetch(`/api/cases/${id}`);
    const data = await res.json();
    const { name, updatedAt, views, summary, content } = data;
    this.name = name;
    this.publishDate = updatedAt;
    this.views = views;
    this.summary = summary;

    this.initEditor(content);
  },
  initEditor(data) {
    createEditor({
      selector: '#editor-container',
      html: data,
      mode: 'simple',
      config: {
        readOnly: true,
      },
    });
  },

  handleSetIndustry(data) {
    // 导航栏使用数据
    this.parentIndustries = data;
    this.childIndustry = this.parentIndustries[0] || [];
  },

  handleSetCategory(data) {
    // 导航栏
    this.parentCategories = data;
    this.childCategory = this.parentCategories[0];
    this.grandsonCategory = this.childCategory?.children || [];
  },

  init() {
    // 缓存行业
    const INDUSTRY_KEY = '__industry__';
    const cachedIndustryData = sessionStorage.getItem(INDUSTRY_KEY);
    if (cachedIndustryData && cachedIndustryData !== '{}') {
      const data = JSON.parse(cachedIndustryData);
      this.handleSetIndustry(data);
    } else {
      fetch('/api/industries')
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
      fetch('/api/categories')
        .then((res) => res.json())
        .then((data) => {
          this.handleSetCategory(data);
          sessionStorage.setItem(CATEGORY_KEY, JSON.stringify(data));
        });
    }

    fetch('./header.html')
      .then((res) => res.text())
      .then((text) => (this.header = text));
    fetch('./footer.html')
      .then((res) => res.text())
      .then((text) => (this.footer = text));
  },
}));

Alpine.start();
