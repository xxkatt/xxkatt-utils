<div align="center">
  <h1>xxkatt-utils</h1>

  <p><strong>把常用的小工具，放在一起。</strong></p>
  <p>从 JavaScript / TypeScript 开始，积累日常开发中用得上的工具函数。</p>

  <p>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-类型支持-3178c6?style=flat-square&amp;logo=typescript&amp;logoColor=white" alt="TypeScript 类型支持" /></a>
    <img src="https://img.shields.io/badge/模块-ESM-2563eb?style=flat-square" alt="ESM 模块" />
    <a href="https://www.npmjs.com/package/@xxkatt/utils"><img src="https://img.shields.io/npm/v/@xxkatt/utils?color=a1b858&amp;label=version" alt="npm version" /></a>
  </p>

  <p>
    <a href="#-工具一览">工具一览</a> ·
    <a href="#-使用示例">使用示例</a> ·
    <a href="./DEVELOPMENT.md">开发指南</a> ·
    <a href="https://github.com/xxkatt/xxkatt-utils/issues">反馈问题</a>
  </p>
</div>

## ✨ 简单，也顺手

- **类型齐全** — 使用 TypeScript 编写，提供类型声明，调用时就能看到参数提示。
- **轻装使用** — 无运行时依赖，以 ESM 导出，可按需导入工具函数。
- **逐步积累** — 提供 ID 生成、浏览器下载、防抖、节流和判断工具，每个工具配套单元测试。

## 🧰 工具一览

| 工具       | 用途                                        |
| ---------- | ------------------------------------------- |
| `uuid`     | 生成 UUID v4，可保留横杠、添加前缀          |
| `randomId` | 生成指定长度的随机 ID，支持 2–62 进制字符集 |
| `download` | 在浏览器中下载 URL、Data URL 或 Blob/File   |
| `debounce` | 防抖：停止调用指定时间后执行最后一次调用    |
| `throttle` | 节流：首次立即执行，间隔内保留最后一次调用  |
| `is`       | 类型判断、判空及 URL、邮箱、手机号格式校验  |

## 📦 安装

在项目中使用 npm 或 pnpm 安装：

```sh
# npm
npm install @xxkatt/utils

# pnpm
pnpm add @xxkatt/utils
```

支持 Node.js 24+ 和现代浏览器，提供 ESM 导出和 TypeScript 类型声明。安装后即可通过包名导入。

## 🔨 使用示例

```ts
import { randomId, uuid } from '@xxkatt/utils'

uuid() // 32 位 UUID，不带横杠
uuid('', true) // 标准 UUID 格式：xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
uuid('user_') // 添加业务前缀：user_…

randomId(8, 10) // 8 位随机数字，例如 '20839157'
randomId(21, 62) // 21 位随机 ID，字符来自 0–9、a–z、A–Z
```

## 📦 本地体验

如需修改源码或参与开发，可以克隆仓库，在本地构建和运行测试。

准备 **Node.js 24+** 和 **pnpm 11.24.0**，然后执行：

```sh
git clone https://github.com/xxkatt/xxkatt-utils.git
cd xxkatt-utils
pnpm install
pnpm test
pnpm build
```

构建产物位于 `packages/js/utils/dist/`。目录结构、开发命令和新增工具的方法见[开发指南](./DEVELOPMENT.md)。

## 📚 文档

访问[在线文档](https://xxkatt.github.io/xxkatt-utils/)，查看快速开始和完整 API 说明。

项目文档使用 VitePress 编写。在本地仓库中运行以下命令启动文档站：

```sh
pnpm docs:dev
```

也可以使用 `pnpm docs:build` 构建静态站点，再通过 `pnpm docs:preview` 预览。文档源文件位于 [`apps/docs/`](./apps/docs/)，API 从 [工具概览](./apps/docs/js/utils/index.md) 开始阅读。

## 🤝 一起完善

有经常重复写的小工具，或遇到了使用问题？欢迎通过 [Issues](https://github.com/xxkatt/xxkatt-utils/issues) 交流，也欢迎提交 [Pull Request](https://github.com/xxkatt/xxkatt-utils/pulls)。

参与开发前，请阅读[开发指南](./DEVELOPMENT.md)和[协作约定](./AGENTS.md)。
