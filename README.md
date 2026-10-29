# xxkatt-utils

按语言分区的工具库 monorepo，用于统一维护不同语言的工具库。目前先搭建前端工作区，尚未实现具体工具函数。

## 技术栈

- **pnpm workspace**：管理前端包和共享开发依赖。
- **TypeScript**：严格类型检查。
- **tsdown**：构建 ESM，通过 Oxc 生成类型声明。
- **Oxlint / Oxfmt**：代码检查与格式化。
- **Vitest**：单元测试。

## 目录结构

```text
xxkatt-utils/
├── AGENTS.md                  # 协作约定
├── package.json               # 根命令和共享开发依赖
├── pnpm-workspace.yaml        # 前端工作区：packages/js/*
├── pnpm-lock.yaml
├── .editorconfig              # 编辑器基础规则
├── .oxlintrc.json             # Oxlint 配置
├── .oxfmtrc.json               # Oxfmt 配置
└── packages/
    └── js/
        ├── tsconfig.base.json # 前端共享 TypeScript 配置
        └── utils/             # @xxkatt/utils
            ├── package.json
            ├── tsconfig.json
            ├── tsdown.config.ts
            ├── vitest.config.ts
            └── src/
                └── index.ts   # 公共导出入口，目前为空
```

后续其他语言放入 `packages/<语言>`，分别使用各自的包管理与构建工具。当前根目录的构建、类型检查和清理命令直接操作 `@xxkatt/utils`，lint 命令检查前端工作区。

## 开始使用

环境要求：**Node.js 24+、pnpm 11.24.0**。pnpm 版本以根 `package.json` 的 `packageManager` 字段为准。

在仓库根目录执行：

```sh
pnpm install
pnpm check
pnpm build
```

需要严格使用已提交的锁文件安装时：

```sh
pnpm install --frozen-lockfile
```

## 常用命令

| 命令                | 作用                                     |
| ------------------- | ---------------------------------------- |
| `pnpm build`        | 构建 `@xxkatt/utils`                     |
| `pnpm lint`         | 使用 Oxlint 检查前端代码，警告也视为失败 |
| `pnpm typecheck`    | 检查 `@xxkatt/utils` 的 TypeScript 类型  |
| `pnpm test`         | 运行 `@xxkatt/utils` 的单元测试一次      |
| `pnpm test:watch`   | 监听文件变化并运行单元测试               |
| `pnpm format`       | 使用 Oxfmt 格式化文件                    |
| `pnpm format:check` | 检查文件格式                             |
| `pnpm check`        | 依次执行 lint、类型检查和格式检查        |
| `pnpm clean`        | 清理 `@xxkatt/utils` 的构建产物          |

只操作指定包：

```sh
pnpm --filter @xxkatt/utils build
pnpm --filter @xxkatt/utils typecheck
```

## 前端包开发

在 `packages/js/utils/src` 中编写工具函数，从 `src/index.ts` 统一导出。当前启用了 `isolatedDeclarations`，导出声明需要满足独立生成类型声明的要求，例如为导出函数显式标注返回类型。

`pnpm build` 使用 tsdown 构建，目标为 ES2022，输出到包内 `dist/`：

- `index.js`：ESM 入口。
- `index.d.ts`：类型声明入口。

构建配置已开启 sourcemap；实际生成的文件取决于源码内容。类型检查由独立的 `pnpm typecheck` 执行。

新增前端包时，在 `packages/js/<包名>` 下添加 `package.json`、`src/index.ts`、`tsconfig.json` 和 `tsdown.config.ts`，参考现有 `utils` 包。使用唯一包名，并同步配置脚本、公共导出和产物路径；该目录会被当前 workspace 规则自动识别。包之间通过 `workspace:*` 声明依赖。

根项目和当前工具包均标记为 `private`，尚未配置 npm 发布流程。

## 单元测试

使用 Vitest，默认在 Node 环境中运行。测试文件放在源码旁，命名为 `src/**/*.test.ts`，从 `vitest` 显式导入 `describe`、`it`、`expect` 等 API。测试可直接导入对应的 TypeScript 源码，无需先构建。

```sh
pnpm test
pnpm test:watch
```

当前尚无工具函数和测试用例；默认未发现测试时，`pnpm test` 会以失败退出，避免漏跑测试。仅检查空项目的测试配置时，可执行 `pnpm test --passWithNoTests`。`pnpm check` 保持执行静态检查，单元测试通过 `pnpm test` 单独运行。

## 协作

修改代码前阅读 [AGENTS.md](./AGENTS.md)。编辑器基础行为由 `.editorconfig` 统一，代码检查和格式化规则分别以 Oxlint、Oxfmt 配置为准。
