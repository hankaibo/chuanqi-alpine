import Alpine from 'alpinejs';
import {getIndusties, getCategories} from './header';
import './style.css';

import {createEditor} from '@wangeditor/editor';
window.createEditor = createEditor;

Alpine.data('data', () => ({
  // 导航栏数据
  isLink: 'cases',
  parentIndustries: [],
  childIndustry: [],
  parentCategories: [],
  childCategory: [],
  grandsonCategory: [],

  name: '',
  publishDate: '',
  views: 0,
  summary: '',

  async getDetail() {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id');
    const res = await fetch(`/api/v1/cases/${id}`);
    const data = await res.json();
    const {name, publishedAt, views, summary, content} = data;
    this.name = name;
    (this.publishDate = publishedAt.substring(0, 19).replace('T', ' ')), (this.views = views);
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
