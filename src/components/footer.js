import {footerProducts, footerSolutions, footerCases, footerNews, footerAbouts, footerCompanies, mobileMenuList} from '../site/config';

/**
 * 页脚组件(桌面端与移动端共用一个作用域)。
 */
function footerData() {
  return {
    footerProducts,
    footerSolutions,
    footerCases,
    footerNews,
    footerAbouts,
    footerCompanies,
    mobileMenuList,

    handleTop() {
      window.scrollTo({top: 0, behavior: 'smooth'});
    },
  };
}

export {footerData};
