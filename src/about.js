import Alpine from 'alpinejs';
import './style.css';

import { createEditor } from '@wangeditor/editor';
import { register } from 'swiper/element/bundle';
register();

window.Alpine = Alpine;

Alpine.data('data', () => ({
  header: '',
  footer: '',
  isLink: 'about',
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
      lnglat: [116.473190, 39.797787],
    },
    {
      id: 'nanjing',
      name: '南京办事处',
      phone: '010-67874677',
      mobile: '18915956527',
      email: 'caic@powerail.com.cn',
      address: '南京市江宁区智江路300号麒麟科创园',
      addressEN: 'Qilin Science Innovation Park, 300 Zhijiang Road, Jiangning District, Nanjing',
      lnglat: [118.882830, 32.015280],
    },
    {
      id: 'zhuzhou',
      name: '株洲办事处',
      phone: '010-67874677',
      mobile: '13810062921',
      email: 'tangz@powerail.com.cn',
      address: '株洲市石峰区联城路79号轨道交通创新创业园',
      addressEN:
        'Rail transit innovation and entrepreneurship Park, No.79 Liancheng Road, Shifeng District, Zhuzhou City',
      lnglat: [113.12, 27.91],
    },
    {
      id: 'shanghai',
      name: '上海总部',
      phone: '010-67874677',
      mobile: '13916848403',
      email: 'daidm@powerail.com.cn',
      address: '上海市虹口区中山北一路1200号柏航德必易园3号楼',
      addressEN: "Building 3, Baihang Debi Yiyuan, No. 1200 Zhongshan North 1st Road, Hongkou District, Shanghai",
      lnglat: [121.483400, 31.292160],
    },
    {
      id: 'xian',
      name: '西安办事处',
      phone: '010-67874677',
      mobile: '13220186200',
      email: 'yangc@powerail.com.cn',
      address: '西安市高新区锦业路69号',
      addressEN: "69 Jinye Road, High tech Zone, Xi'an City",
      lnglat: [108.858600, 34.196834],
    }
  ],
  isMobile: false,
  async getList() {
    const res = await fetch('/api/about/1');
    const data = await res.json();
    this.aboutData = {
      ...data,
      files: data.files.map(({ id, path }) => {
        const [http, name] = path.split('files/');
        const thumbnailUrl = `${http}files/thumbnail_${name.split('.')[0]}.webp`;
        return {
          id,
          path: thumbnailUrl,
          originalPath: path,
        }
      })
    };
    this.initEditor(this.aboutData.content);
    const swiperEl = document.querySelector('swiper-container');
    swiperEl.addEventListener('swiperslidechange', (event) => {
      console.log('slide changed');
    });
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
  initMap() {
    this.mapList.forEach((item) => {
      const zoom = 16;
      const map = new window.T.Map(item.id);
      map.centerAndZoom(new window.T.LngLat(...item.lnglat), zoom);
      const marker = new window.T.Marker(new window.T.LngLat(...item.lnglat));
      map.addOverLay(marker);
      const latlng = new window.T.LngLat(...item.lnglat);
      const label = new window.T.Label({
        text: `${item.name}：<a href='http://www.powerail.com.cn/' target='_blank'>http://www.powerail.com.cn/</a>`,
        position: latlng,
        offset: new window.T.Point(-150, 20),
      });
      map.addOverLay(label);
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

function handleTop() {
  const el = document.querySelector('.top');
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function handleLink(path) {
  if (typeof path === 'string') {
    this.$router.push({ path });
  } else {
    const { chineseName, englishName, parentName } = path;
    const tabs = JSON.stringify(path.children.map((it) => ({ id: it.id, name: it.name })));
    this.$router.push({
      name: parentName,
      query: { chineseName, englishName, tabs },
    });
  }
}

Alpine.start();
