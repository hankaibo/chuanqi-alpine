### 简介

本项目是使用 Vite 构建的多页面静态站点，使用 Tailwind CSS、Alpine.js 和 Swiper。

### 开发

#### 安装依赖

```bash
pnpm install
```

#### 启动

```bash
pnpm dev
```

#### 编译

```bash
pnpm build
```

构建读取 `.env.production`，其中两项决定产物如何对外访问：

| 变量                | 当前值                             | 说明                                                     |
| ------------------- | ---------------------------------- | -------------------------------------------------------- |
| `VITE_BASE_PATH`    | `/chuanqi-alpine/`                 | 资源前缀，对应 GitHub Pages 项目站点路径                 |
| `VITE_API_BASE_URL` | `https://api-chuanqi.mypandora.cn` | 后端地址；留空则请求走相对路径（开发环境的 `/api` 代理） |

部署到自有服务器时，把 `VITE_BASE_PATH` 改成该站点的目录（例如 `/temp/`）再构建，然后把 `dist` 里的文件上传到对应目录。

`VITE_*` 会在构建时内联进 JS/CSS，不是秘密，直接写在 `.env.production` 里即可，无需配置 GitHub Secrets。

#### 部署

推送到 `main` 后，`.github/workflows/static.yml` 会执行 `pnpm install --frozen-lockfile`、`pnpm build`，并把 `dist` 发布到 GitHub Pages。

仓库侧只需一项设置：Settings → Pages → **Source** 选 `GitHub Actions`。若绑定自定义域名，把域名填在同一个页面，并把 `.env.production` 的 `VITE_BASE_PATH` 改为 `/`。

#### 检查

```bash
pnpm check
```

该命令会检查格式并执行生产构建。项目要求 Node.js `>=22.22.1`，并通过 `packageManager` 固定 pnpm 版本。

### 目录结构

```
├── .husky
│   └── pre-commit                    提交前格式化暂存文件
├── dist                              构建产物（自动清理，不提交）
├── public                            原样复制到构建目录的资源
├── src
│   ├── components                    各页面共享的组件脚本（页头、页脚、导航、弹窗、Tab 等）
│   ├── images                        图片目录
│   ├── partials                      公共页面片段（页头、页脚、移动端菜单、弹窗）
│   ├── site                          站点级模块（API 请求、站点配置、全局 store）
│   ├── svg                           页面中使用到的 svg 文件，方便打开某个 svg 复制到 html 页面中
│   ├── bootstrap.js                  应用入口，注册 Alpine 组件与指令
│   ├── read-only-editor.js           延迟加载只读富文本编辑器
│   ├── xxx.html                      xxx页面
│   ├── xxx.js                        xxx页面所引用的 js 文件
│   ├── style.css                     样式文件（Tailwind CSS v4 配置与全局样式）
│   └── utils.js                      js工具方法文件
├── .editorconfig                     编辑器配置文件
├── .env.development                  开发环境配置文件
├── .env.production                   生产环境配置文件
├── .gitignore                        git 忽略配置文件
├── .prettierignore                   prettier 忽略配置文件
├── .prettierrc                       prettier 配置文件
├── package.json                      依赖、运行时和脚本配置
├── README.md                         本文件
└── vite.config.js                    vite 配置文件
```
