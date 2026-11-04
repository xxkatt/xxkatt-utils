import { describe, expect, it } from 'vitest'
import { appendFormData, objectToFormData } from '@/index'

describe('objectToFormData', () => {
  it('将字符串、数字、布尔值和 File 追加到 FormData', () => {
    const file = new File(['avatar'], 'avatar.txt', { type: 'text/plain' })
    const formData = objectToFormData({
      username: '小明',
      age: 18,
      enabled: false,
      profilePicture: file,
    })

    expect(formData.get('username')).toBe('小明')
    expect(formData.get('age')).toBe('18')
    expect(formData.get('enabled')).toBe('false')
    expect(formData.get('profilePicture')).toMatchObject({
      name: 'avatar.txt',
      type: 'text/plain',
    })
  })

  it('按顺序将数组追加为重复键，并保留空字符串和零', () => {
    const formData = objectToFormData({ tags: ['one', 'two'], empty: '', count: 0 })

    expect(formData.getAll('tags')).toEqual(['one', 'two'])
    expect(formData.get('empty')).toBe('')
    expect(formData.get('count')).toBe('0')
  })

  it('跳过 null、undefined 和空数组，不修改输入对象', () => {
    const fields = { missing: undefined, empty: null, tags: [] as string[] }

    expect([...objectToFormData(fields).entries()]).toEqual([])
    expect(fields).toEqual({ missing: undefined, empty: null, tags: [] })
  })
})

describe('appendFormData', () => {
  it('向已有 FormData 追加字段并返回同一个实例', () => {
    const formData = new FormData()
    formData.append('existing', 'value')

    expect(appendFormData(formData, { existing: 'new', next: true })).toBe(formData)
    expect(formData.getAll('existing')).toEqual(['value', 'new'])
    expect(formData.get('next')).toBe('true')
  })
})
