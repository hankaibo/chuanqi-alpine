### 简介

本项目使用了 tailwindcss 与 alpine.js 2个原子样式库与脚本库。

### 开发

#### 安装依赖

```bash
# npm run install
pnpm install
```

#### 启动

```bash
# npm run dev
pnpm dev
```

#### 编译

```bash
### 目前编译公共基础路径为 /temp/ ，如果想替换为其它值，请修改 .env.production 中的 VITE_BASE_PATH 。
### 将生成的 dist 目录下的文件上传到服务器相应的目录即可。
# npm run build
pnpm build
```

### 目录结构

```
├── .husky
│   └── pre-commit                    代替格式化检查勾子
├── dist                              编译后产物
├── public                            资源目录，不经过打包工具转换
├── src
│   ├── images                        图片目录
│   ├── svg                           页面中使用到的 svg 文件，方便打开某个 svg 复制到 html 页面中
│   ├── footer-mobile.html            手机模式下公共 footer 页面片段
│   ├── footer.html                   公共 footer 页面片段
│   ├── header-mobile.html            手机模式下公共 header 页面片段
│   ├── header.html                   公共 header 页面片段
│   ├── popover.html                  首页右下角弹窗页面片段
│   ├── xxx.html                      xxx页面
│   ├── xxx.js                        xxx页面所引用的 js 文件
│   ├── style.css                     样式文件
│   └── utils.js                      js工具方法文件
├── .editorconfig.ts                  编辑器配置文件
├── .env.development.ts               开发环境配置文件
├── .env.production.ts                生产环境配置文件
├── .gitignore                        git 忽略配置文件
├── .prettierignore                   prettier 忽略配置文件
├── .prettierrc                       prettier 配置文件
├── package.json                      包管理文件
├── postcss.config.cjs                css 预处理配置文件
├── README.md                         本文件
├── tailwind.config.js                tailwindcss 配置文件
└── vite.config.js                    vite 配置文件
```
