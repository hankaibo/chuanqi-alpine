import Alpine from 'alpinejs';
import '../style.css';

Alpine.data('data', () => ({
  header: '',
  footer: '',

  init() {
    fetch('../header.html')
      .then((res) => res.text())
      .then((text) => (this.header = text));
    fetch('../footer.html')
      .then((res) => res.text())
      .then((text) => (this.footer = text));
  },
}));

Alpine.start();
