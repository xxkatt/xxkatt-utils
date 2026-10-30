export interface DebouncedFunction<This, Args extends unknown[]> {
  (this: This, ...args: Args): void
  cancel(): void
}

/**
 * 防抖：停止调用 wait 毫秒后，使用最后一次调用的 this 和参数执行回调。
 *
 * @param fn 要延迟执行的回调。
 * @param wait 等待时间，单位毫秒，遵循原生 setTimeout 的时间规则。
 * @returns 带有 cancel() 方法的防抖函数；cancel() 取消尚未执行的回调。
 * @example
 * const search = debounce((keyword: string) => console.log(keyword), 300)
 * search('hello')
 * search.cancel()
 */
export function debounce<This, Args extends unknown[]>(
  fn: (this: This, ...args: Args) => unknown,
  wait: number,
): DebouncedFunction<This, Args> {
  let timer: ReturnType<typeof setTimeout> | undefined

  function debounced(this: This, ...args: Args): void {
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      fn.apply(this, args)
    }, wait)
  }

  debounced.cancel = (): void => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }

  return debounced
}
