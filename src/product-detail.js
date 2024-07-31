import Alpine from 'alpinejs';
import {getIndusties, getCategories} from './header';
import {getThumbnailUrl} from './untils';

import './style.css';

import {createEditor} from '@wangeditor/editor';
window.createEditor = createEditor;

Alpine.data('data', () => ({
  // 导航栏数据
  isLink: 'products',
  parentIndustries: [],
  childIndustry: [],
  parentCategories: [],
  childCategory: [],
  grandsonCategory: [],

  imgActive: 0,
  name: '',
  publishDate: '',
  views: 0,
  summary: '',
  images: [],
  categoryName: '',
  cnTitle: '',
  enTitle: '',

  async getDetail() {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id');
    const res = await fetch(`/api/v1/products/${id}`);
    const data = await res.json();
    const {name, publishedAt, views, summary, content, images, category} = data;
    this.name = name;
    this.publishDate = publishedAt.substring(0, 19).replace('T', ' ');
    this.views = views;
    this.summary = summary;
    this.categoryName = category.name;

    this.images = images.map((item) => {
      return {
        ...item,
        imageUrl: getThumbnailUrl(item.path),
      };
    });

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
