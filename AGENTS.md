# 协作约定

本文件适用于整个仓库。修改前先阅读目标目录的配置；子目录存在 `AGENTS.md` 时，同时遵循其中的约定。用户明确指令优先于本文件。

## 仓库结构

- `xxkatt-utils` 是按语言分区的工具库 monorepo，目前先维护前端工具库。
- 前端包放在 `packages/js/*`，由 pnpm workspace 管理。
- `packages/js/tsconfig.base.json` 是前端共享 TypeScript 配置，不是独立包。
- 当前 `packages/js/utils` 对应 `@xxkatt/utils`，仅有空入口，尚无工具函数。
- 后续其他语言使用 `packages/<语言>` 分区，按实际需要引入各自工具链。

## 技术栈

- 使用 Node.js 24+ 和根 `package.json` 中 `packageManager` 指定的 pnpm 版本。
- 使用 tsdown 构建；使用 Oxlint 检查代码，使用 Oxfmt 格式化。
- 使用 Vitest 运行单元测试，默认使用 Node 环境；测试文件与源码相邻，命名为 `*.test.ts`，从 `vitest` 显式导入测试 API。
- TypeScript 仅负责类型检查；通过 `isolatedDeclarations` 让 tsdown 使用 Oxc 生成类型声明。
- 共享开发工具由根目录管理；包的运行依赖声明在对应包中，内部包依赖使用 `workspace:*`。
- 依赖变更同步更新 `pnpm-lock.yaml`，不混用其他包管理器或锁文件。
