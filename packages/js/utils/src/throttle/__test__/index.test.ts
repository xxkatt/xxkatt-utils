import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { throttle } from '@/index'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('throttle', () => {
  it('首次立即执行，单次调用不会产生尾部执行，空闲后可立即执行', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)
    throttled('first')
    expect(fn).toHaveBeenCalledExactlyOnceWith('first')
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)

    throttled('next')
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('next')
  })

  it('间隔内保留最后一次调用，尾部执行后仍遵守间隔', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)
    throttled(0)
    vi.advanceTimersByTime(30)
    throttled(1)
    vi.advanceTimersByTime(60)
    throttled(2)
    vi.advanceTimersByTime(9)
    expect(fn).toHaveBeenCalledExactlyOnceWith(0)
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenLastCalledWith(2)

    vi.advanceTimersByTime(10)
    throttled(3)
    vi.advanceTimersByTime(89)
    expect(fn).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(1)
    expect(fn.mock.calls).toEqual([[0], [2], [3]])
    vi.advanceTimersByTime(100)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('持续调用时按固定间隔执行，不会被后续调用一直推迟', () => {
    const calls: number[] = []
    const throttled = throttle(() => calls.push(Date.now()), 100)
    const start = Date.now()
    for (let index = 0; index < 10; index++) {
      throttled()
      vi.advanceTimersByTime(30)
    }
    expect(calls.map((time) => time - start)).toEqual([0, 100, 200, 300])
    vi.runAllTimers()
    expect(calls).toHaveLength(4)
  })

  it('保留立即执行和尾部执行的 this、参数类型，包装函数返回 void', () => {
    const fn = vi.fn(function (this: { value: number }, amount: number) {
      return this.value + amount
    })
    const throttled = throttle(function (this: { value: number }, amount: number) {
      return fn.call(this, amount)
    }, 100)
    expectTypeOf(throttled).parameters.toEqualTypeOf<[amount: number]>()
    expectTypeOf(throttled).thisParameter.toEqualTypeOf<{ value: number }>()
    expectTypeOf(throttled).returns.toEqualTypeOf<void>()
    const first = { value: 1 }
    const last = { value: 10 }
    expect(throttled.call(first, 2)).toBeUndefined()
    throttled.call({ value: 5 }, 3)
    expect(throttled.call(last, 4)).toBeUndefined()
    vi.advanceTimersByTime(100)
    expect(fn.mock.contexts).toEqual([first, last])
    expect(fn.mock.results.map((result) => result.value)).toEqual([3, 14])
  })

  it('取消尾部执行并重置间隔，下一次调用立即执行', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)
    throttled.cancel()
    throttled('first')
    throttled('cancelled')
    vi.advanceTimersByTime(50)
    throttled.cancel()
    throttled.cancel()
    expect(vi.getTimerCount()).toBe(0)
    throttled('next')
    expect(fn.mock.calls).toEqual([['first'], ['next']])
    vi.runAllTimers()
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('wait 为 0 时首次立即执行，同步重复调用合并到下一轮', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 0)
    throttled('first')
    throttled('middle')
    throttled('last')
    expect(fn).toHaveBeenCalledExactlyOnceWith('first')
    vi.runAllTimers()
    expect(fn.mock.calls).toEqual([['first'], ['last']])
  })

  it('回调内再次调用时遵守间隔，回调内取消时清除所有状态', () => {
    const fn = vi.fn((value: number) => {
      throttled(value + 1)
      if (value === 2) throttled.cancel()
    })
    const throttled = throttle(fn, 100)
    throttled(1)
    expect(fn).toHaveBeenCalledExactlyOnceWith(1)
    vi.advanceTimersByTime(100)
    expect(fn.mock.calls).toEqual([[1], [2]])
    expect(vi.getTimerCount()).toBe(0)
    vi.runAllTimers()
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it.each(['leading', 'trailing'])('%s 回调抛错后仍可复用和取消', (phase) => {
    const error = new Error('callback failed')
    const fn = vi.fn((value: string) => {
      if (value === 'throw') throw error
    })
    const throttled = throttle(fn, 100)
    if (phase === 'leading') {
      expect(() => throttled('throw')).toThrow(error)
    } else {
      throttled('first')
      throttled('throw')
      expect(() => vi.advanceTimersByTime(100)).toThrow(error)
    }
    throttled('next')
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenLastCalledWith('next')
    throttled.cancel()
    expect(vi.getTimerCount()).toBe(0)
  })
})
