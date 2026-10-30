# @xxkatt/utils

JavaScript / TypeScript 工具包，提供 ESM 导出和 TypeScript 类型声明。

## 工具函数

| 函数                    | 用途                                          |
| ----------------------- | --------------------------------------------- |
| [uuid](./uuid)          | 生成 UUID v4，支持保留横杠和添加前缀          |
| [randomId](./random-id) | 使用加密安全随机数生成指定长度、指定基数的 ID |
| [download](./download)  | 在浏览器中下载 URL、Data URL 或 Blob/File     |
| [debounce](./debounce)  | 防抖：停止调用指定时间后执行最后一次调用      |
| [throttle](./throttle)  | 节流：首次立即执行，间隔内保留最后一次调用    |
| [is](./is)              | 类型判断、判空及 URL、邮箱、手机号格式校验    |

首次使用请先阅读[快速开始](/guide/getting-started)。所有函数均从 `@xxkatt/utils` 的公共入口导入。
