import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { debounce } from '@/index'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('debounce', () => {
  it('停止调用后等待完整间隔，再使用最后一次参数执行', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('first')
    vi.advanceTimersByTime(60)
    debounced('last', 2)
    vi.advanceTimersByTime(99)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledExactlyOnceWith('last', 2)
    expect(vi.getTimerCount()).toBe(0)

    debounced('next')
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('next')
  })

  it('保留最后一次调用的 this 和参数类型，包装函数返回 void', () => {
    const fn = vi.fn(function (this: { value: number }, amount: number, label: string) {
      return `${label}:${this.value + amount}`
    })
    const debounced = debounce(function (this: { value: number }, amount: number, label: string) {
      return fn.call(this, amount, label)
    }, 100)
    expectTypeOf(debounced).parameter(0).toEqualTypeOf<number>()
    expectTypeOf(debounced).parameter(1).toEqualTypeOf<string>()
    expectTypeOf(debounced).thisParameter.toEqualTypeOf<{ value: number }>()
    expectTypeOf(debounced).returns.toEqualTypeOf<void>()

    debounced.call({ value: 1 }, 2, 'first')
    const context = { value: 10 }
    expect(debounced.call(context, 3, 'last')).toBeUndefined()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledExactlyOnceWith(3, 'last')
    expect(fn.mock.contexts[0]).toBe(context)
    expect(fn.mock.results[0]?.value).toBe('last:13')
  })

  it('支持无参数回调和可选参数', () => {
    const calls: (string | undefined)[] = []
    const debounced = debounce((value?: string) => calls.push(value), 100)
    expectTypeOf(debounced).parameters.toEqualTypeOf<[value?: string | undefined]>()
    debounced()
    vi.advanceTimersByTime(100)
    debounced('next')
    vi.advanceTimersByTime(100)
    expect(calls).toEqual([undefined, 'next'])
  })

  it('取消待执行回调，可重复取消并在之后复用', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced.cancel()
    debounced('cancelled')
    vi.advanceTimersByTime(50)
    debounced.cancel()
    debounced.cancel()
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(100)
    expect(fn).not.toHaveBeenCalled()

    debounced('next')
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledExactlyOnceWith('next')
  })

  it('wait 为 0 时仍延迟执行并合并同步调用', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 0)
    debounced('first')
    debounced('last')
    expect(fn).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(fn).toHaveBeenCalledExactlyOnceWith('last')
  })

  it('回调内再次调用时，新的任务仍可取消', () => {
    const fn = vi.fn((value: number) => {
      if (value === 1) debounced(2)
    })
    const debounced = debounce(fn, 100)
    debounced(1)
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledExactlyOnceWith(1)
    debounced.cancel()
    vi.runAllTimers()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('回调抛错后仍可再次使用', () => {
    const error = new Error('callback failed')
    const fn = vi.fn().mockImplementationOnce(() => {
      throw error
    })
    const debounced = debounce(fn, 100)
    debounced()
    expect(() => vi.advanceTimersByTime(100)).toThrow(error)
    debounced()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(vi.getTimerCount()).toBe(0)
  })
})
