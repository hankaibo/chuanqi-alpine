import Alpine from './bootstrap';
import {getThumbnailUrl} from './utils';

import {createReadOnlyEditor} from './read-only-editor';
import {apiUrl} from './site/api-base';

Alpine.data('data', () => ({
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
    const res = await fetch(apiUrl(`/api/v1/products/${id}`));
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

    await this.initEditor(content);
  },
  initEditor(data) {
    return createReadOnlyEditor(data);
  },
}));

Alpine.start();
