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

`public/playground/maxxxine/motion-web.mp4` 是网站使用的网页视频。
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

## 素材与授权

项目作品、图像、视频和品牌素材不因代码上传而授予他人使用许可。
第三方代码来源见 `THIRD_PARTY_NOTICES.md`。
仓库包含本地字体文件，包括 Suisse Intl；公开仓库前请确认其分发授权，
授权尚未确认时建议先创建私有仓库。网页使用许可不一定包含公开分发字体文件的许可。
