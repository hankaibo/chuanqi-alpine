// 页头/页脚静态数据集中处(原先散落在各 partial 的内联 x-data 里)。

// 桌面端下拉面板的次级菜单(行业应用/产品中心由数据接口动态提供,不在此列)
const menuList = [
  {id: 'cases', name: '工程案例', href: './cases.html'},
  {id: 'news', name: '资讯中心', href: './news.html'},
  {id: 'jobs', name: '诚邀才俊', href: './jobs.html'},
  {id: 'about', name: '关于我们', href: './about.html'},
];

// 移动端导航 / 移动端页脚的完整菜单
const mobileMenuList = [
  {id: '1', name: '首页', path: '/index'},
  {id: '2', name: '行业应用', href: '/indutry'},
  {id: '3', name: '产品中心', href: '/product'},
  {id: '4', name: '工程案例', href: './cases.html'},
  {id: '5', name: '资讯中心', href: './news.html'},
  {id: '6', name: '诚邀才俊', href: './jobs.html'},
  {id: '7', name: '关于我们', href: './about.html'},
];

// 首页右下角悬浮客服气泡条目
const popoverItems = [
  {title: '客服电话', content: '010-67874677'},
  {title: '北京总部', content: '张经理：13810060503'},
  {title: '株洲办事处', content: '唐经理：13810062921'},
  {title: '南京办事处', content: '蔡经理：18915956527'},
  {title: '西安办事处', content: '杨经理：13220186200'},
  {title: '上海总部', content: '戴经理：13916848403'},
];

// 页脚静态列表
const footerProducts = ['DEWE产品系列', 'CPSS定制化电源系统', '功率分析仪及电流信号采集仪', '电力仿真系统', '检测装备及集成系统'];
const footerSolutions = ['新能源检测', '轨道交通', '传统电力系统', '其他能源测试'];
const footerCases = ['新能源应用', '轨道交通', '电力系统应用'];
const footerNews = ['公司新闻', '行业新闻'];
const footerAbouts = ['公司简介', '资质荣誉', '晋升空间', '组织架构'];

// 页脚各办事处联系方式
const footerCompanies = [
  {
    title: '北京总部',
    address: '北京市经济技术开发区北工大软件园26-2号楼三层',
    phone: '13810060503',
    tel: '010-67874677',
    email: 'sales@powerail.com.cn',
    addressEnglish: '3 / F, Building 26-2, BeIGU Software Park, Beijing Economic and Technological Development Zone',
  },
  {
    title: '南京办事处',
    address: '南京市鼓楼区软件园路2号',
    phone: '13810060503',
    tel: '010-67874677',
    email: 'sales@powerail.com.cn',
    addressEnglish: '2nd Floor, No. 2, Software Park Road, Xihu District, Nanjing, Jiangsu Province, China',
  },
  {
    title: '杭州办事处',
    address: '株洲市石峰区联城路79号轨道交通创新创业园',
    phone: '13810060503',
    tel: '010-67874677',
    email: 'tangz@powerail.com.cn',
    addressEnglish: 'Rail transit innovation and entrepreneurship Park, No.79 Liancheng Road, Shifeng District, Zhuzhou City',
  },
  {
    title: '西安办事处',
    address: '西安市高新区锦业路69号',
    phone: '13220186200',
    tel: '010-67874677',
    email: 'yangc@powerail.com.cn',
    addressEnglish: "69 Jinye Road, High tech Zone, Xi'an City",
  },
  {
    title: '上海总部',
    address: '上海市虹口区中山北一路1200号柏航德必易园3号楼',
    phone: '13916848403',
    tel: '010-67874677',
    email: 'daidm@powerail.com.cn',
    addressEnglish: 'Building 3, Baihang Debi Yiyuan, No. 1200 Zhongshan North 1st Road, Hongkou District, Shanghai',
  },
];

// 首页「联系我们」各办事处
const contactCompanies = [
  {
    name: '北京总部',
    mobile: '13810060503',
    fax: '010-67874677',
    email: 'sales@powerail.com.cn',
    address: '北京市经济技术开发区北工大软件园26-2号楼三层',
    addressEN: '3 / F, Building 26-2, BeIGU Software Park, Beijing Economic and Technological Development Zone',
  },
  {
    name: '南京办事处',
    mobile: '18915956527',
    fax: '010-67874677',
    email: 'caic@powerail.com.cn',
    address: '南京市江宁区智江路300号麒麟科创园',
    addressEN: 'Qilin Science Innovation Park, 300 Zhijiang Road, Jiangning District, Nanjing',
  },
  {
    name: '株洲办事处',
    mobile: '13810062921',
    fax: '010-67874677',
    email: 'tangz@powerail.com.cn',
    address: '株洲市石峰区联城路79号轨道交通创新创业园',
    addressEN: 'Rail transit innovation and entrepreneurship Park, No.79 Liancheng Road, Shifeng District, Zhuzhou City',
  },
  {
    name: '西安办事处',
    mobile: '13220186200',
    fax: '010-67874677',
    email: 'yangc@powerail.com.cn',
    address: '西安市高新区锦业路69号',
    addressEN: "69 Jinye Road, High tech Zone, Xi'an City",
  },
  {
    name: '上海总部',
    mobile: '13916848403',
    fax: '010-67874677',
    email: 'daidm@powerail.com.cn',
    address: '上海市虹口区中山北一路1200号柏航德必易园3号楼',
    addressEN: 'Building 3, Baihang Debi Yiyuan, No. 1200 Zhongshan North 1st Road, Hongkou District, Shanghai',
  },
];

export {menuList, mobileMenuList, popoverItems, footerProducts, footerSolutions, footerCases, footerNews, footerAbouts, footerCompanies, contactCompanies};
