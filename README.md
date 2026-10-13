# YU.JIE SU — Portfolio

苏禹杰的双语设计作品网站，包含作品档案、实验场、关于和联系页面。
基于 Next.js 15、React 19 和 TypeScript。

## 本地运行

安装 Node.js 24 LTS 和项目指定的 pnpm 11.19.0，然后执行：

```sh
pnpm install --frozen-lockfile
pnpm dev
```

默认入口为 http://localhost:3000/zh 和 http://localhost:3000/en。
如需沿用本地 3002 端口，可执行 `pnpm dev --port 3002`。

## 上传前检查

```sh
pnpm check:github
pnpm typecheck
pnpm build
```

GitHub 单文件限制为 100 MiB；请使用 Git 或 GitHub Desktop 提交项目，
不要使用 GitHub 网页拖拽上传（单文件限制为 25 MiB）。

`public/playground/maxxxine/motion-web.mp4` 保留为原网页视频；Cloudflare 上线版本使用新增的 `motion-cloudflare.mp4`。
原始 `motion.mp4` 保留在本地并被忽略，部署不依赖它。
视频保持 2560×1440、30 fps 和原始时长，使用 H.264/AAC 编码并支持快速开始播放。

`node_modules/`、`.next/`、日志、临时导出、`outputs/` 和 Blender 源文件均不提交。
正式页面引用的静态资源位于 `public/`，需随代码一起上传。
仓库不需要 Git LFS。

## 部署

项目包含 `vercel.json`，可通过 Vercel 导入 GitHub 仓库，使用 Next.js 默认构建配置。
生产构建命令为 `pnpm build`，自托管启动命令为 `pnpm start`。
这是 Next.js 应用；上传 GitHub 只保存代码，并不自动生成公开访问网址。
目前未配置静态导出，不应直接作为 GitHub Pages 静态站点发布。

需要设置站点地址时，可参考 `.env.example` 配置 `NEXT_PUBLIC_SITE_URL`。
邮箱当前在 `components/ContactCard.tsx` 中配置为 `1806189648@qq.com`。
请勿将真实私密环境变量提交到仓库。

## Cloudflare Workers 部署

本分支使用 OpenNext 将 Next.js 15 部署到 Cloudflare Workers。现有页面、路由和浏览器动效保留。

1. 在 Workers & Pages 中从 GitHub 导入此仓库，Worker 名称设置为 `syjwebsite`，选择包含本配置的分支。
2. 构建命令填写 `pnpm build:cloudflare`，部署命令填写 `pnpm deploy:cloudflare`，根目录保持仓库根目录。
3. 在构建变量中将 `NEXT_PUBLIC_SITE_URL` 设置为控制台分配的正式 HTTPS 地址（不带末尾斜杠），然后构建部署。

此方案无需启用 R2。`wrangler.jsonc` 声明 `IMAGES` 绑定，以保留 Next.js 图片优化；Cloudflare Images 默认免费方案每月包含 5000 次独特转换，超过免费额度不自动收费。保持免费方案即可，参见 https://developers.cloudflare.com/images/pricing/ 。

本地检查：

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm check:cloudflare
pnpm build:cloudflare
```

`public/.assetsignore` 将原始大视频与大封面 PNG 排除出 Worker 静态上传，但不会删除原文件。网站使用新增的 `motion-cloudflare.mp4`：完整时长、2560×1440、30 fps、H.264/AAC，启用 faststart，文件大小小于 25 MiB。封面使用新增的 3200px WebP 网页版本，原始 PNG 保留在仓库中。

GitHub Actions 的 `Build Cloudflare portfolio` 工作流会执行类型检查、静态资源上传检查及完整构建，并生成可供部署检查的构建产物。工作流本身不包含 Cloudflare 凭据，也不会自动发布。

## 素材与授权

项目作品、图像、视频和品牌素材不因代码上传而授予他人使用许可。
第三方代码来源见 `THIRD_PARTY_NOTICES.md`。
仓库包含本地字体文件，包括 Suisse Intl；公开仓库前请确认其分发授权，
授权尚未确认时建议先创建私有仓库。网页使用许可不一定包含公开分发字体文件的许可。
