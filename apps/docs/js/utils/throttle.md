# throttle

节流：首次调用立即执行，间隔内的重复调用在 `wait` 毫秒后以最后一次的参数和 `this` 执行。持续调用时按间隔执行，适合滚动位置更新、鼠标移动等场景。

## 基本用法

```ts
import { throttle } from '@xxkatt/utils'

const updatePosition = throttle((position: number) => {
  console.log('位置：', position)
}, 100)

updatePosition(10) // 立即输出「位置：10」。
updatePosition(20)
updatePosition(30)
// 约 100ms 后输出「位置：30」。

// 页面或组件销毁时，取消待执行回调并重置间隔。
updatePosition.cancel()
```

应创建一次节流函数并重复使用。上例若同步执行 `cancel()`，待执行的位置更新将被取消，已经执行的首次更新不受影响。

## 类型签名

```ts
interface ThrottledFunction<This, Args extends unknown[]> {
  (this: This, ...args: Args): void
  cancel(): void
}

function throttle<This, Args extends unknown[]>(
  fn: (this: This, ...args: Args) => unknown,
  wait: number,
): ThrottledFunction<This, Args>
```

## 参数与返回值

| 参数   | 类型     | 说明                                 |
| ------ | -------- | ------------------------------------ |
| `fn`   | 回调函数 | 接收对应执行时的调用参数和 `this`    |
| `wait` | `number` | 执行间隔，单位为毫秒，建议使用非负数 |

两个参数均为必填。返回带有 `.cancel()` 方法的函数，保留回调的参数类型和显式声明的 `this` 类型。包装函数返回 `void`，不返回回调的结果或 Promise。

`.cancel()` 取消待执行的回调并重置间隔，下一次调用会立即执行。可重复取消并复用同一个节流函数；已经开始执行的回调或异步请求不会被取消。

## 执行时序

以 `wait = 100` 为例：

| 调用时间 | 行为                                               |
| -------- | -------------------------------------------------- |
| `0ms`    | 立即执行，开始等待间隔                             |
| `30ms`   | 记录本次调用                                       |
| `90ms`   | 覆盖待执行调用                                     |
| `100ms`  | 使用 `90ms` 的参数和 `this` 执行，并开始下一轮间隔 |
| `110ms`  | 记录本次调用，在约 `200ms` 执行                    |

如果间隔内没有新的调用，则不会产生额外的尾部执行；间隔结束后，下一次调用会立即执行。

## 注意事项

- `wait` 直接传给原生 `setTimeout`，时间转换与最大延迟限制遵循运行环境规则；`wait = 0` 时首次立即执行，同步重复调用合并到后续定时器任务。
- 定时器的实际执行时间可能因事件循环繁忙或后台标签页限制而延后。
- 需要动态 `this` 时，使用普通函数作为回调，并以方法调用或 `.call()` 传入上下文；箭头函数的 `this` 由定义位置决定。
- 首次立即执行时的同步异常会传给调用方，尾部执行时的异常在定时器任务中抛出；异步回调需要自行处理拒绝。节流按调用时间限制频率，不等待 Promise 完成，异步任务可能重叠。
- 需要停止调用一段时间后只执行最后一次时，使用 [debounce](./debounce)。
