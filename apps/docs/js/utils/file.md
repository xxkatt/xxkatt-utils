# 文件转换

在 File/Blob 与完整 Data URL 之间转换，适用于上传预览、读取图片处理结果，以及配合 [`download`](./download) 保存文件。

## 基本用法

```ts
import { dataURLToBlob, download, fileToDataURL } from '@xxkatt/utils'

const file = new File(['你好'], 'hello.txt', { type: 'text/plain;charset=utf-8' })

// File/Blob → 完整 Base64 Data URL
const dataURL = await fileToDataURL(file)
// data:text/plain;charset=utf-8;base64,5L2g5aW9

// Data URL → Blob，保留内容和 MIME 类型
const blob = dataURLToBlob(dataURL)
await download(blob, 'hello.txt')
```

## 上传图片预览

```ts
import { fileToDataURL } from '@xxkatt/utils'

const input = document.querySelector<HTMLInputElement>('#upload')!
const preview = document.querySelector<HTMLImageElement>('#preview')!

input.addEventListener('change', async () => {
  const file = input.files?.[0]
  if (!file) return

  try {
    preview.src = await fileToDataURL(file)
  } catch (error) {
    console.error('读取图片失败', error)
  }
})
```

如果只需要临时预览较大的本地文件，可以直接使用 `URL.createObjectURL(file)`，在不再使用时调用 `URL.revokeObjectURL(url)`，减少 Base64 编码带来的内存占用。

## 将图片处理结果下载或上传

`canvas.toDataURL()` 等接口返回的完整 Data URL 可以直接还原为 Blob：

```ts
import { dataURLToBlob, download } from '@xxkatt/utils'

const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!
const blob = dataURLToBlob(canvas.toDataURL('image/png'))

await download(blob, 'image.png')

// 上传时可为 Blob 指定文件名
const form = new FormData()
form.append('file', blob, 'image.png')
await fetch('/api/upload', { method: 'POST', body: form })
```

## fileToDataURL

```ts
function fileToDataURL(file: Blob): Promise<string>
```

| 参数   | 类型   | 说明                                           |
| ------ | ------ | ---------------------------------------------- |
| `file` | `Blob` | 要读取的文件内容；File 继承 Blob，也可直接传入 |

使用 `FileReader.readAsDataURL` 读取文件，返回包含 `data:` 前缀、MIME 类型和 Base64 内容的完整 Data URL。MIME 类型来自 `file.type`，为空时由 FileReader 使用默认类型；不根据文件名推断类型。

- 读取成功后完成 Promise；读取失败或被中止时拒绝 Promise。
- 原始文件读取错误会透传给调用方，同步读取错误也会转为 Promise 拒绝。
- 需要环境提供 FileReader，支持浏览器页面和提供该 API 的 Web Worker；Node.js 默认没有 FileReader，调用时会明确报错。

## dataURLToBlob

```ts
function dataURLToBlob(dataURL: string): Blob
```

| 参数      | 类型     | 说明                                    |
| --------- | -------- | --------------------------------------- |
| `dataURL` | `string` | 完整 Data URL，支持 Base64 和百分号编码 |

```ts
import { dataURLToBlob } from '@xxkatt/utils'

dataURLToBlob('data:text/plain;base64,aGVsbG8=')
dataURLToBlob('data:text/plain;charset=utf-8,%E4%BD%A0%E5%A5%BD')

// 百分号编码按字节还原，也可用于二进制数据
dataURLToBlob('data:application/octet-stream,%00%80%FF')
```

- 同步返回 Blob，不发起网络请求，保留 MIME 类型及其参数；Blob 的 `type` 会按原生规则转为小写。
- 省略 MIME 类型时默认使用 `text/plain;charset=us-ascii`；仅指定 `;charset=...` 时补充 `text/plain`。
- 支持空内容；`+` 保持加号，不会转换为空格。
- URL 的 fragment 不属于文件内容；需要保留 `#` 时请编码为 `%23`。
- 仅接受完整 Data URL；缺少 `data:` 前缀或逗号、非法 Base64 或百分号编码时同步抛错，裸 Base64 不会自动识别。
- 不依赖 DOM 和 FileReader，可在 Node.js 24+、现代浏览器和 Web Worker 中使用。

## 注意事项

- 两个函数都在内存中处理完整内容。Base64 内容通常比原始文件大约三分之一，适合常规大小的文件。
- 转换保留文件内容，不执行图片压缩、缩放或格式转换；这些操作可以先通过 Canvas 等工具完成。
- Data URL 不保存原始文件名。需要 File 对象时，可使用 `new File([blob], 'filename.png', { type: blob.type })`。
- 模块本身可以在 SSR 中安全导入，依赖的环境能力只在调用时使用。
