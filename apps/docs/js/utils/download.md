# download

在浏览器中下载文件，统一支持文件 URL、完整 Data URL 和 `Blob/File`。

## 基本用法

```ts
import { download } from '@xxkatt/utils'

// 相对地址或支持 CORS 的远程地址
await download('/files/report.pdf', '报告.pdf')

// 完整 Data URL，支持 Base64 和百分号编码
await download('data:text/plain;base64,aGVsbG8=', 'hello.txt')
await download('data:text/plain;charset=utf-8,%E4%BD%A0%E5%A5%BD', '你好.txt')

// Blob 或 File：保留原始内容和 MIME 类型，使用传入的文件名
const blob = new Blob(['hello'], { type: 'text/plain;charset=utf-8' })
await download(blob, 'hello.txt')
```

字符串始终作为地址处理。下载普通文本、JSON、`ArrayBuffer` 等内容时，请先转换为 `Blob`：

```ts
const data = { name: 'xxkatt' }
await download(new Blob([JSON.stringify(data)], { type: 'application/json' }), 'data.json')

// CSV 如需 UTF-8 BOM，可在构造 Blob 时自行添加
const csv = new Blob(['\uFEFF', '姓名,年龄\n小明,18'], { type: 'text/csv;charset=utf-8' })
await download(csv, '用户.csv')
```

## 下载接口返回的文件

需要自定义请求头、请求体、跨域凭据或取消请求时，先使用自己的请求逻辑，再传入 `Blob`：

```ts
const response = await fetch('/api/export', { method: 'POST' })
if (!response.ok) throw new Error(`导出失败：HTTP ${response.status}`)

await download(await response.blob(), '报表.xlsx')
```

## 类型签名

```ts
function download(source: string | Blob, filename: string): Promise<void>
```

## 参数

| 参数       | 类型             | 说明                                                          |
| ---------- | ---------------- | ------------------------------------------------------------- |
| `source`   | `string \| Blob` | 文件 URL、完整 Data URL 或 Blob；File 继承 Blob，也可直接传入 |
| `filename` | `string`         | 建议保存的完整文件名，包含扩展名                              |

两个参数均为必填。不从 URL、`File.name` 或 `Content-Disposition` 推断文件名，浏览器可能调整文件名中的非法字符。

## 返回值与错误

返回 `Promise<void>`，在获取文件内容并触发浏览器下载后完成。它不表示文件已保存到磁盘，也无法判断用户是否取消保存。

- HTTP 非成功状态会抛出包含状态码的错误。
- 网络、CORS 和响应体读取错误会原样抛出，可使用 `try/catch` 处理。
- 仅能在浏览器页面中调用；Node.js、SSR 渲染期间或 Web Worker 中调用会报错。模块本身可在 SSR 中安全导入。

## 注意事项

- 字符串地址会通过 `fetch` 获取为 Blob。跨域地址必须允许 CORS，不能通过此方法绕过浏览器的跨域限制。
- URL 请求使用 `fetch` 的默认配置。同源请求默认携带同源凭据；需要额外配置时请自行请求后传入 Blob。
- Base64 需要包含 `data:类型;base64,` 前缀；裸 Base64 不会自动识别。
- 文件会先完整读取到内存中，适合常规文件下载。大文件或流式下载宜使用服务端下载链接，并由服务端设置 `Content-Disposition: attachment`。
- 建议由用户点击操作触发；浏览器的自动下载或多文件下载策略仍然生效。
- 下载链接会立即从页面移除，本方法创建的对象 URL 会延迟释放；传入的对象 URL 仍由调用方管理。
