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
# npm run build
pnpm build
```

将生成的 dist 目录下的文件上传到服务器相应的目录即可。
