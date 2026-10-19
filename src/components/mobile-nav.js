import {mobileMenuList} from '../site/config';

/**
 * 移动端导航开合状态。
 * 行业/产品数据(`parentIndustries`/`parentCategories`)与 `handle*` 方法
 * 从父级 `headerData` 作用域继承。
 */
function mobileNav() {
  return {
    open: false,
    openIndustry: false,
    openCategory: false,
    mobileMenuList,
  };
}

export {mobileNav};
