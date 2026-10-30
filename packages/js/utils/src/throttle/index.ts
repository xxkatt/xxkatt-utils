export interface ThrottledFunction<This, Args extends unknown[]> {
  (this: This, ...args: Args): void
  cancel(): void
}

/**
 * 节流：首次调用立即执行，间隔内的调用在 wait 毫秒后以最后一次的 this 和参数执行。
 * 持续调用时，每隔 wait 毫秒执行一次；仅调用一次时不会重复执行。
 *
 * @param fn 要限制执行频率的回调。
 * @param wait 执行间隔，单位毫秒，遵循原生 setTimeout 的时间规则。
 * @returns 带有 cancel() 方法的节流函数；cancel() 取消待执行回调并重置间隔。
 * @example
 * const update = throttle((position: number) => console.log(position), 100)
 * update(10)
 * update.cancel()
 */
export function throttle<This, Args extends unknown[]>(
  fn: (this: This, ...args: Args) => unknown,
  wait: number,
): ThrottledFunction<This, Args> {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: { thisArg: This; args: Args } | undefined

  function onTimeout(): void {
    timer = undefined
    if (!pending) return

    const { thisArg, args } = pending
    pending = undefined
    // 在执行用户回调前建立下一轮间隔，支持回调内再次调用或取消。
    timer = setTimeout(onTimeout, wait)
    fn.apply(thisArg, args)
  }

  function throttled(this: This, ...args: Args): void {
    if (timer === undefined) {
      timer = setTimeout(onTimeout, wait)
      fn.apply(this, args)
    } else {
      pending = { thisArg: this, args }
    }
  }

  throttled.cancel = (): void => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    pending = undefined
  }

  return throttled
}
