# 快速开始

`xxkatt-utils` 是按语言分区的工具库 monorepo。目前提供 JavaScript / TypeScript 工具包 `@xxkatt/utils`。

::: info 当前使用范围
`@xxkatt/utils` 目前标记为 `private`，尚未发布到 npm。以下说明以本仓库和 pnpm workspace 内的使用方式为准。
:::

## 环境准备

- Node.js 24+
- pnpm 11.24.0，具体版本以根 `package.json` 的 `packageManager` 字段为准

在仓库根目录安装依赖并构建工具包：

```sh
pnpm install
pnpm build
```

构建结果位于 `packages/js/utils/dist/`，包含 ESM 入口及 TypeScript 类型声明。

## 在工作区内使用

在同一 pnpm workspace 的消费包中声明依赖：

```json
{
  "dependencies": {
    "@xxkatt/utils": "workspace:*"
  }
}
```

修改后在仓库根目录运行 `pnpm install`，即可通过包名导入：

```ts
import { randomId, uuid } from '@xxkatt/utils'

const id = uuid()
const userId = uuid('user_')
const code = randomId(8, 10)
```

工具包通过构建产物提供导出，修改源码后需要重新运行 `pnpm build`。

## 在仓库中直接体验

构建完成后，可在仓库根目录运行：

```sh
node --input-type=module -e "import { uuid, randomId } from './packages/js/utils/dist/index.js'; console.log(uuid(), randomId(8, 10))"
```

## 查阅 API

- [uuid](/js/utils/uuid)：生成 UUID v4，支持横杠和前缀。
- [randomId](/js/utils/random-id)：生成指定长度、指定字符范围的随机 ID。
- [download](/js/utils/download)：在浏览器中下载 URL、Data URL 或 Blob/File。

## 本地查看文档

在仓库根目录启动开发服务：

```sh
pnpm docs:dev
```

构建静态站点并预览：

```sh
pnpm docs:build
pnpm docs:preview
```

静态文件输出到 `apps/docs/.vitepress/dist/`。部署到域名子路径时，需要在 `apps/docs/.vitepress/config.mts` 中将 `base` 设置为对应路径，例如 `/xxkatt-utils/`。
