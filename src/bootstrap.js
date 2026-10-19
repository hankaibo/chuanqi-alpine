import Alpine from 'alpinejs';
import collapse from '@alpinejs/collapse';
import './style.css';
import {headerData} from './components/header';
import {footerData} from './components/footer';
import {navMenu} from './components/nav-menu';
import {mobileNav} from './components/mobile-nav';
import {popover} from './components/popover';
import {tabs} from './components/tabs';
import {registerSiteStore} from './site/store';

Alpine.plugin(collapse);
registerSiteStore(Alpine);
Alpine.data('headerData', headerData);
Alpine.data('footerData', footerData);
Alpine.data('navMenu', navMenu);
Alpine.data('mobileNav', mobileNav);
Alpine.data('popover', popover);
Alpine.data('tabs', tabs);

if (import.meta.env.DEV) {
  window.Alpine = Alpine;
}

export default Alpine;
