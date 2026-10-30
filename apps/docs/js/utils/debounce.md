# debounce

防抖：每次调用重新计时，停止调用 `wait` 毫秒后，使用最后一次调用的参数和 `this` 执行回调。适合搜索输入、窗口尺寸变化后计算布局等场景。

## 基本用法

```ts
import { debounce } from '@xxkatt/utils'

const search = debounce((keyword: string) => {
  console.log('搜索：', keyword)
}, 300)

search('h')
search('he')
search('hello')
// 最后一次调用 300ms 后，仅输出「搜索：hello」。

// 页面或组件销毁时，取消尚未执行的回调。
search.cancel()
```

应创建一次防抖函数并重复使用；在每次事件中重新创建函数，无法合并调用。上例若同步执行 `cancel()`，搜索回调将不会执行。

## 类型签名

```ts
interface DebouncedFunction<This, Args extends unknown[]> {
  (this: This, ...args: Args): void
  cancel(): void
}

function debounce<This, Args extends unknown[]>(
  fn: (this: This, ...args: Args) => unknown,
  wait: number,
): DebouncedFunction<This, Args>
```

## 参数与返回值

| 参数   | 类型     | 说明                                 |
| ------ | -------- | ------------------------------------ |
| `fn`   | 回调函数 | 接收最后一次调用的参数和 `this`      |
| `wait` | `number` | 等待时间，单位为毫秒，建议使用非负数 |

两个参数均为必填。返回带有 `.cancel()` 方法的函数，保留回调的参数类型和显式声明的 `this` 类型。包装函数返回 `void`，不返回回调的结果或 Promise。

`.cancel()` 取消待执行的回调，可重复调用；取消后仍可继续使用同一个防抖函数。已经开始执行的回调或异步请求不会被取消。

## 执行时序

以 `wait = 100` 为例：在 `0ms`、`40ms`、`90ms` 调用，回调只在约 `190ms` 执行一次，使用 `90ms` 调用时的参数和 `this`。

## 注意事项

- `wait` 直接传给原生 `setTimeout`，时间转换与最大延迟限制遵循运行环境规则；`wait = 0` 时仍延迟到后续定时器任务执行。
- 定时器只能保证等待后安排执行，实际时间可能因事件循环繁忙或后台标签页限制而延后。
- 需要动态 `this` 时，使用普通函数作为回调，并以方法调用或 `.call()` 传入上下文；箭头函数的 `this` 由定义位置决定。
- 回调中的同步异常在定时器任务中抛出；异步回调需要自行处理拒绝。防抖不控制异步任务的完成顺序。
- 需要连续操作期间按间隔执行时，使用 [throttle](./throttle)。
