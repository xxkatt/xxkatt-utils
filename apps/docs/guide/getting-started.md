# 快速开始

`xxkatt-utils` 是按语言分区的工具库 monorepo。目前提供 JavaScript / TypeScript 工具包 `@xxkatt/utils`。

## 安装

在项目中使用 npm 或 pnpm 安装：

```sh
# npm
npm install @xxkatt/utils

# pnpm
pnpm add @xxkatt/utils
```

工具包支持 Node.js 24+ 和现代浏览器，提供 ESM 导出和 TypeScript 类型声明。安装后即可使用，无需克隆仓库或自行构建。

## 基本用法

通过包名按需导入工具函数：

```ts
import { randomId, uuid } from '@xxkatt/utils'

const id = uuid()
const userId = uuid('user_')
const code = randomId(8, 10)
```

`download` 需要在浏览器页面中调用，具体使用方式见对应 API 文档。

## 按需打包

`@xxkatt/utils` 使用 ESM 导出，并声明 `sideEffects: false`，支持 Tree-shaking（摇树优化）。使用 Vite 等支持摇树优化的打包器进行生产构建时，未使用的工具函数会被移除，只保留实际使用的函数及其依赖。

按上面的方式使用具名导入即可，无需额外配置。直接在 Node.js 中导入并不会执行摇树优化；这一步由打包器完成。

## 查阅 API

- [uuid](/js/utils/uuid)：生成 UUID v4，支持横杠和前缀。
- [randomId](/js/utils/random-id)：生成指定长度、指定字符范围的随机 ID。
- [download](/js/utils/download)：在浏览器中下载 URL、Data URL 或 Blob/File。
- [debounce](/js/utils/debounce)：停止调用指定时间后执行最后一次调用，支持取消。
- [throttle](/js/utils/throttle)：首次立即执行，间隔内保留最后一次调用，支持取消。

## 本地开发

如需修改源码或在工作区内调试，准备 Node.js 24+ 和根 `package.json` 的 `packageManager` 字段指定的 pnpm 版本（当前为 11.24.0），然后在仓库根目录安装依赖并构建：

```sh
pnpm install
pnpm build
```

构建结果位于 `packages/js/utils/dist/`，包含 ESM 入口及 TypeScript 类型声明。

在同一 pnpm workspace 的消费包中声明依赖：

```json
{
  "dependencies": {
    "@xxkatt/utils": "workspace:*"
  }
}
```

修改后在仓库根目录运行 `pnpm install`，即可通过包名导入。工具包通过构建产物提供导出，修改源码后需要重新运行 `pnpm build`。

构建完成后，也可在仓库根目录直接体验：

```sh
node --input-type=module -e "import { uuid, randomId } from './packages/js/utils/dist/index.js'; console.log(uuid(), randomId(8, 10))"
```

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
