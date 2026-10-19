import Alpine from './bootstrap';
import {getAbout} from './site/api';
import {getThumbnailUrl} from './utils';

import Swiper from 'swiper';
import {Autoplay, Pagination, Navigation, Mousewheel} from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import {createReadOnlyEditor} from './read-only-editor';

Alpine.data('data', () => ({
  isMobile: window.matchMedia('(max-width: 768px)').matches,
  aboutData: {},
  mapList: [
    {
      id: 'beijing',
      name: '北京总部',
      home: '公司：传麒科技（北京）股份有限公司',
      phone: '010-67874677',
      mobile: '13810060503',
      email: 'sales@powerail.com.cn',
      address: '北京市经济技术开发区北工大软件园26-2号楼三层',
      addressEN: '3 / F, Building 26-2, BeIGU Software Park, Beijing Economic and Technological Development Zone',
      lnglat: [116.47319, 39.797787],
    },
    {
      id: 'nanjing',
      name: '南京办事处',
      phone: '010-67874677',
      mobile: '18915956527',
      email: 'caic@powerail.com.cn',
      address: '南京市江宁区智江路300号麒麟科创园',
      addressEN: 'Qilin Science Innovation Park, 300 Zhijiang Road, Jiangning District, Nanjing',
      lnglat: [118.882265, 32.015001],
    },
    {
      id: 'zhuzhou',
      name: '株洲办事处',
      phone: '010-67874677',
      mobile: '13810062921',
      email: 'tangz@powerail.com.cn',
      address: '株洲市石峰区联城路79号轨道交通创新创业园',
      addressEN: 'Rail transit innovation and entrepreneurship Park, No.79 Liancheng Road, Shifeng District, Zhuzhou City',
      lnglat: [113.12263, 27.86255],
    },
    {
      id: 'shanghai',
      name: '上海总部',
      phone: '010-67874677',
      mobile: '13916848403',
      email: 'daidm@powerail.com.cn',
      address: '上海市虹口区中山北一路1200号柏航德必易园3号楼',
      addressEN: 'Building 3, Baihang Debi Yiyuan, No. 1200 Zhongshan North 1st Road, Hongkou District, Shanghai',
      lnglat: [121.4834, 31.29216],
    },
    {
      id: 'xian',
      name: '西安办事处',
      phone: '010-67874677',
      mobile: '13220186200',
      email: 'yangc@powerail.com.cn',
      address: '西安市高新区锦业路69号',
      addressEN: "69 Jinye Road, High tech Zone, Xi'an City",
      lnglat: [108.8586, 34.196834],
    },
  ],

  async getList() {
    const data = await getAbout();
    this.aboutData = {
      ...data,
      files: data.files.map(({id, path}) => {
        return {
          id,
          path: getThumbnailUrl(path),
          originalPath: path,
        };
      }),
    };

    this.initEditor(this.aboutData.content);

    this.$nextTick(() => {
      new Swiper(this.$refs.swiperRef, {
        modules: [Navigation, Pagination],
        loop: true,
        lazy: true,
        slidesPerView: this.isMobile ? 1 : 3,
        spaceBetween: 30,
        pagination: {
          el: '.swiper-pagination-inner',
          clickable: true,
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
      });
    });
  },

  initEditor(data) {
    return createReadOnlyEditor(data);
  },

  initMap() {
    this.mapList.forEach((item) => {
      const zoom = 16;
      const map = new window.T.Map(item.id);
      map.centerAndZoom(new window.T.LngLat(...item.lnglat), zoom);
      const marker = new window.T.Marker(new window.T.LngLat(...item.lnglat));
      map.addOverLay(marker);
      const latlng = new window.T.LngLat(...item.lnglat);
      const label = new window.T.Label({
        text: `${item.name}：<a href='https://www.powerail.com.cn/' target='_blank'>https://www.powerail.com.cn/</a>`,
        position: latlng,
        offset: new window.T.Point(-150, 20),
      });
      map.addOverLay(label);
    });
  },

  init() {
    const _this = this;
    function onIntersect(entries, observer) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          _this.initMap();

          observer.unobserve(entry.target);
        }
      });
    }
    const observer = new IntersectionObserver(onIntersect, {
      threshold: 0.1,
    });
    const mapContainer = document.querySelector('#map');
    observer.observe(mapContainer);
  },
}));

Alpine.start();
