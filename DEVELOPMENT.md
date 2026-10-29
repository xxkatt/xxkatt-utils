# 开发指南

`xxkatt-utils` 按语言组织工具库，目前维护 JavaScript / TypeScript 包 `@xxkatt/utils`。修改前请阅读 [AGENTS.md](./AGENTS.md)。

## 本地开发

使用 **Node.js 24+**，pnpm 版本以根 `package.json` 的 `packageManager` 字段为准，当前为 **11.24.0**。

在仓库根目录执行：

```sh
pnpm install
pnpm check
pnpm test
pnpm build
```

需要严格使用已提交的锁文件时，使用 `pnpm install --frozen-lockfile` 安装依赖。

## 目录结构

```text
xxkatt-utils/
├── README.md                  # 项目介绍与使用示例
├── DEVELOPMENT.md             # 开发指南
├── AGENTS.md                  # 协作约定
├── package.json               # 根命令和共享开发依赖
├── pnpm-workspace.yaml        # 工作区：apps/*、packages/js/*
├── apps/
│   └── docs/                  # @xxkatt/docs 文档站
│       ├── package.json       # VitePress 依赖和脚本
│       ├── .vitepress/        # 文档站配置
│       ├── guide/            # 使用指南
│       └── js/               # JavaScript / TypeScript API 文档
└── packages/
    └── js/
        ├── tsconfig.base.json # 前端共享 TypeScript 配置
        └── utils/             # @xxkatt/utils
            ├── package.json
            ├── tsconfig.json
            ├── tsdown.config.ts
            ├── vitest.config.ts
            └── src/
                ├── index.ts   # 公共导出入口
                └── uuid/      # UUID 与随机 ID
```

后续其他语言放入 `packages/<语言>`，分别使用各自的工具链。`packages/js/tsconfig.base.json` 是共享配置，不是独立包。

## 常用命令

| 命令                | 作用                                     |
| ------------------- | ---------------------------------------- |
| `pnpm docs:dev`     | 启动文档站开发服务                       |
| `pnpm docs:build`   | 构建文档站                               |
| `pnpm docs:preview` | 预览已构建的文档站                       |
| `pnpm build`        | 构建 `@xxkatt/utils`                     |
| `pnpm lint`         | 使用 Oxlint 检查前端代码，警告也视为失败 |
| `pnpm typecheck`    | 检查 `@xxkatt/utils` 的 TypeScript 类型  |
| `pnpm test`         | 运行 `@xxkatt/utils` 的单元测试一次      |
| `pnpm test:watch`   | 监听文件变化并运行单元测试               |
| `pnpm format`       | 使用 Oxfmt 格式化文件                    |
| `pnpm format:check` | 检查文件格式                             |
| `pnpm check`        | 依次执行 lint、类型检查和格式检查        |
| `pnpm clean`        | 清理 `@xxkatt/utils` 的构建产物          |

`pnpm check` 仅执行静态检查，单元测试通过 `pnpm test` 单独运行。

只操作指定包时，使用 `pnpm --filter @xxkatt/utils <命令>`，例如：

```sh
pnpm --filter @xxkatt/utils build
```

文档站是独立 workspace 包 `@xxkatt/docs`，也可使用 `pnpm --filter @xxkatt/docs dev` 启动。静态站点输出到 `apps/docs/.vitepress/dist/`；修改文档后运行 `pnpm docs:build` 验证。

## 部署文档到 GitHub Pages

仓库使用 [GitHub Actions workflow](./.github/workflows/deploy-docs.yml) 构建并部署文档站。首次部署时：

1. 在 GitHub 仓库的 **Settings → Pages → Build and deployment** 中，将 **Source** 设为 **GitHub Actions**。
2. 将配置推送到默认分支 `master`，使 workflow 出现在 Actions 页面。
3. 在 **Actions → Deploy docs to GitHub Pages → Run workflow** 中选择 `master` 分支并手动触发部署。
4. 等待 workflow 成功后，访问 <https://xxkatt.github.io/xxkatt-utils/>。

之后需要更新网站时，手动运行 workflow；推送代码不会自动触发部署。VitePress 的 `base` 已设为 `/xxkatt-utils/`，本地开发和预览也使用这个路径；如果以后改为自定义域名根路径，需要将 `base` 改为 `/`。

## 添加工具

在 `packages/js/utils/src` 中编写工具函数，从 `src/index.ts` 统一导出。包内可通过 `@/` 引用 `src/` 下的模块。

TypeScript 负责严格类型检查；项目启用了 `isolatedDeclarations`，导出声明需要满足独立生成类型声明的要求，例如为导出函数显式标注返回类型。

测试使用 Vitest，默认在 Node 环境中运行。测试文件命名为 `*.test.ts`，放在对应源码附近；从 `vitest` 显式导入测试 API，直接导入 TypeScript 源码进行测试，无需先构建。现有 ID 工具的测试见 [index.test.ts](./packages/js/utils/src/uuid/__test__/index.test.ts)。未发现测试时，`pnpm test` 默认以失败退出。

提交前运行静态检查、单元测试和构建：

```sh
pnpm check
pnpm test
pnpm build
```

编辑器基础规则由 `.editorconfig` 统一，代码检查和格式化分别以 `.oxlintrc.json`、`.oxfmtrc.json` 为准。

## 构建与包管理

tsdown 构建目标为 ES2022，输出 ESM、类型声明和 sourcemap 到包内 `dist/`。公共入口为 `index.js` 和 `index.d.ts`；类型声明由 Oxc 生成，类型检查通过独立的 `pnpm typecheck` 执行。

新增前端包时，在 `packages/js/<包名>` 下参考现有 `utils` 包添加配置和入口；该目录会被 workspace 自动识别。使用唯一包名，同步配置根命令、公共导出和产物路径。

共享开发工具由根目录管理，文档站专用的 VitePress 依赖由 `apps/docs` 管理，运行依赖声明在对应包中，内部包依赖使用 `workspace:*`。依赖变更需同步更新 `pnpm-lock.yaml`，不混用其他包管理器或锁文件。

根项目和当前工具包均标记为 `private`，尚未配置 npm 发布流程。
