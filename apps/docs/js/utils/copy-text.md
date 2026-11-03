# copyText

在浏览器中复制文本，优先使用 Clipboard API；不可用或调用失败时，回退到隐藏文本框配合 `document.execCommand('copy')`，兼容缺少 Clipboard API 的旧浏览器及 HTTP 等非安全上下文。

## 基本用法

```ts
import { copyText } from '@xxkatt/utils'

// 建议直接在用户点击事件中调用，避免先等待网络请求等异步操作。
document.querySelector('#copy')?.addEventListener('click', async () => {
  try {
    await copyText('要复制的内容')
    console.log('复制成功')
  } catch {
    console.log('复制失败，请手动复制')
  }
})
```

支持中文、换行和 emoji，内容按传入的字符串复制，不进行格式化或序列化。

## 类型签名

```ts
function copyText(text: string): Promise<void>
```

## 参数

| 参数   | 类型     | 说明               |
| ------ | -------- | ------------------ |
| `text` | `string` | 要复制的文本，必填 |

## 返回值与错误

返回 `Promise<void>`，在 Clipboard API 写入成功或 `execCommand('copy')` 返回成功后完成。

- Clipboard API 调用失败后会继续尝试降级复制，仅在降级也失败时拒绝 Promise。
- 降级方式不可用、返回 `false` 或执行时抛错，均会拒绝 Promise，由调用方处理失败提示。
- 降级过程中创建的临时文本框会被移除，并恢复原来的焦点和选区，包括输入框内的文本选区。
- 仅支持浏览器页面中调用；Node.js、SSR 渲染期间和 Web Worker 中调用会报错。模块本身可在 SSR 中安全导入。

## 兼容性

- Clipboard API 通常要求 HTTPS 或 localhost 等安全上下文；普通 HTTP 页面会尝试使用传统复制方式。
- `execCommand` 已被弃用，仅用于兼容；浏览器权限、用户激活要求和 iframe 策略仍然生效，无法保证每个页面都允许复制。Clipboard API 异步失败后，用户激活也可能已失效，降级仍可能失败。
- 临时文本框使用只读模式，避免弹出软键盘，不使用 `display: none` 或 `hidden`，以便浏览器选中文本。
- 旧浏览器兼容指缺少 Clipboard API 时的功能降级；包仍以 ES2022 构建，更早的 JavaScript 运行环境需由应用自行转译并按需补充 polyfill。
