import Alpine from 'alpinejs';
import collapse from '@alpinejs/collapse';
import './style.css';
import {headerData} from './components/header';
import {footerData} from './components/footer';

Alpine.plugin(collapse);
Alpine.data('headerData', headerData);
Alpine.data('footerData', footerData);

if (import.meta.env.DEV) {
  window.Alpine = Alpine;
}

export default Alpine;
