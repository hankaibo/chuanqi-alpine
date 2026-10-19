import Alpine from './bootstrap';

import {createReadOnlyEditor} from './read-only-editor';

Alpine.data('data', () => ({
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
