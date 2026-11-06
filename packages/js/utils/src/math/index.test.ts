import { describe, expect, it } from 'vitest'
import { add, average, divide, max, min, multiply, subtract, sum } from '@/index'

describe('十进制四则运算', () => {
  it.each([
    [add, 0.1, 0.2, 0.3],
    [add, -0.1, -0.2, -0.3],
    [add, 1.23, 4.5, 5.73],
    [add, 1e-7, 2e-7, 3e-7],
    [add, 1e21, 2e21, 3e21],
    [subtract, 0.3, 0.1, 0.2],
    [subtract, 1, 0.9, 0.1],
    [subtract, -0.1, 0.2, -0.3],
    [subtract, 3e-7, 1e-7, 2e-7],
    [multiply, 0.1, 0.2, 0.02],
    [multiply, -1.2, 3, -3.6],
    [multiply, 1e-7, 2e-7, 2e-14],
    [multiply, 1e200, 1e-200, 1],
    [divide, 0.3, 0.1, 3],
    [divide, 0.7, 0.1, 7],
    [divide, -1.2, 0.1, -12],
    [divide, -1.2, -0.1, 12],
    [divide, 3e-7, 1e-7, 3],
    [divide, 1, 3, 1 / 3],
    [divide, 2, 3, 2 / 3],
    [divide, 1e200, 1e200, 1],
    [divide, 1e-200, 1e-200, 1],
    [add, 9007199254740991, 0.1, 9007199254740991],
    [subtract, 9007199254740991, 0.1, 9007199254740991],
    [multiply, 9007199254740991, 1, 9007199254740991],
    [divide, 9007199254740991, 1, 9007199254740991],
  ])('%s(%s, %s) = %s', (operation, a, b, expected) => {
    expect(operation(a, b)).toBe(expected)
  })

  it.each([add, subtract, multiply, divide])('%s 的非有限数值行为与原生一致', (operation) => {
    const native = new Map([
      [add, (a: number, b: number) => a + b],
      [subtract, (a: number, b: number) => a - b],
      [multiply, (a: number, b: number) => a * b],
      [divide, (a: number, b: number) => a / b],
    ]).get(operation)!
    for (const a of [NaN, Infinity, -Infinity, -1, -0, 0, 1]) {
      for (const b of [NaN, Infinity, -Infinity, -1, -0, 0, 1]) {
        expect(operation(a, b)).toBe(native(a, b))
      }
    }
  })

  it('支持 number 范围边缘的溢出、下溢和负零', () => {
    expect(add(Number.MAX_VALUE, Number.MAX_VALUE)).toBe(Infinity)
    expect(multiply(1e308, 10)).toBe(Infinity)
    expect(multiply(-1e-300, 1e-100)).toBe(-0)
    expect(divide(1e308, 1e-308)).toBe(Infinity)
    expect(divide(-1e-308, 1e308)).toBe(-0)
    expect(divide(5e-324, 1)).toBe(Number.MIN_VALUE)
    expect(divide(5e-324, 2)).toBe(Number.MIN_VALUE)
    expect(divide(5e-324, 3)).toBe(0)
    expect(divide(1e-323, 2)).toBe(Number.MIN_VALUE)
    expect(divide(Number.MAX_VALUE, 1)).toBe(Number.MAX_VALUE)
  })

  it('除法在二进制中点采用就近取偶舍入', () => {
    expect(divide(9.007199254740993, 1e-15)).toBe(9007199254740992)
    expect(divide(9.007199254741003, 1e-15)).toBe(9007199254741004)
    expect(divide(9007199254740991, 9007199254740992)).toBe(0.9999999999999999)
    expect(divide(9007199254740991, 2)).toBe(4503599627370495.5)
  })
})

describe('数组统计', () => {
  it('计算正数、负数和小数的最大值与最小值', () => {
    expect(max([1, 3, 2])).toBe(3)
    expect(max([-3, -1, -2])).toBe(-1)
    expect(min([1, 3, 2])).toBe(1)
    expect(min([-3, -1, -2])).toBe(-3)
    expect(max([0.1, 0.3, 0.2])).toBe(0.3)
    expect(min([0.1, 0.3, 0.2])).toBe(0.1)
  })

  it('求和与平均数复用十进制运算', () => {
    expect(sum([0.1, 0.2, 0.3])).toBe(0.6)
    expect(sum([-0.1, -0.2])).toBe(-0.3)
    expect(sum([1e-7, 2e-7])).toBe(3e-7)
    expect(average([0.1, 0.2])).toBe(0.15)
    expect(average([-1, 0, 1])).toBe(0)
    expect(average([1, 2, 2])).toBe(5 / 3)
  })

  it('接受只读数组，且不修改输入', () => {
    const values = Object.freeze([3, 1, 2])
    expect(max(values)).toBe(3)
    expect(min(values)).toBe(1)
    expect(sum(values)).toBe(6)
    expect(average(values)).toBe(2)
    expect(values).toEqual([3, 1, 2])
  })

  it('处理空数组和单元素数组', () => {
    expect(max([])).toBe(-Infinity)
    expect(min([])).toBe(Infinity)
    expect(sum([])).toBe(0)
    expect(average([])).toBeNaN()
    for (const operation of [max, min, sum, average]) {
      expect(operation([1.23])).toBe(1.23)
    }
  })

  it('包含 NaN 时传播 NaN', () => {
    for (const operation of [max, min, sum, average]) {
      expect(operation([1, NaN, 2])).toBeNaN()
    }
  })

  it('保留原生无穷大与最大最小值的正负零规则', () => {
    expect(max([1, Infinity])).toBe(Infinity)
    expect(min([1, -Infinity])).toBe(-Infinity)
    expect(sum([1, Infinity])).toBe(Infinity)
    expect(sum([Infinity, -Infinity])).toBeNaN()
    expect(average([Infinity, 1])).toBe(Infinity)
    expect(max([-0, 0])).toBe(0)
    expect(min([0, -0])).toBe(-0)
  })

  it('支持超过函数参数数量限制的大数组', () => {
    const values = Array.from({ length: 200_000 }, (_, index) => index)
    expect(max(values)).toBe(199_999)
    expect(min(values)).toBe(0)
  })
})
