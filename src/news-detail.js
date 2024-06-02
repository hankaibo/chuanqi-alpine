import Alpine from "alpinejs";
import "./style.css";

import { createEditor } from "@wangeditor/editor";
window.createEditor = createEditor;

Alpine.data('data', () => ({
  header: '',
  footer: '',
  isLink: 'news',
  name: '',
  publishDate: '',
  views: 0,
  summary: '',
  async getDetail() {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id');
    const res = await fetch(`/api/news/${id}`);
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
      }
    });
  },

  init() {
    fetch('./header.html')
      .then((res) => res.text())
      .then((text) => (this.header = text));
    fetch('./footer.html')
      .then((res) => res.text())
      .then((text) => (this.footer = text));
  },
}));

Alpine.start();
