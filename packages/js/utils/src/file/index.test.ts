import { afterEach, describe, expect, it, vi } from 'vitest'
import { dataURLToBlob, download, fileToDataURL } from '@/index'

function mockFileReader() {
  const reader = {
    result: null as string | null,
    error: null as DOMException | null,
    onload: null as (() => void) | null,
    onerror: null as (() => void) | null,
    onabort: null as (() => void) | null,
    readAsDataURL: vi.fn(),
  }
  vi.stubGlobal(
    'FileReader',
    vi.fn(function () {
      return reader
    }),
  )
  return reader
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('fileToDataURL', () => {
  it('读取 File，等待完成后返回包含 MIME 类型的完整 Data URL', async () => {
    const reader = mockFileReader()
    const file = new File(['你好'], '你好.txt', { type: 'text/plain;charset=utf-8' })
    const completed = vi.fn()
    const result = fileToDataURL(file).then((value) => {
      completed(value)
      return value
    })

    expect(reader.readAsDataURL).toHaveBeenCalledExactlyOnceWith(file)
    await Promise.resolve()
    expect(completed).not.toHaveBeenCalled()

    reader.result = 'data:text/plain;charset=utf-8;base64,5L2g5aW9'
    reader.onload?.()

    await expect(result).resolves.toBe(reader.result)
    expect(completed).toHaveBeenCalledExactlyOnceWith(reader.result)
  })

  it.each([
    [new Blob([new Uint8Array([0, 128, 255])], { type: 'application/octet-stream' }), 'AID/'],
    [new Blob([], { type: 'application/octet-stream' }), ''],
  ])('支持 Blob 和空内容：%j', async (file, base64) => {
    const reader = mockFileReader()
    const result = fileToDataURL(file)
    reader.result = `data:application/octet-stream;base64,${base64}`
    reader.onload?.()

    await expect(result).resolves.toBe(reader.result)
    expect(reader.readAsDataURL).toHaveBeenCalledExactlyOnceWith(file)
  })

  it('透传文件读取错误', async () => {
    const reader = mockFileReader()
    const error = new DOMException('Cannot read file', 'NotReadableError')
    const result = fileToDataURL(new Blob(['text']))
    reader.error = error
    reader.onerror?.()

    await expect(result).rejects.toBe(error)
  })

  it('读取被中止时拒绝 Promise', async () => {
    const reader = mockFileReader()
    const result = fileToDataURL(new Blob(['text']))
    reader.onabort?.()

    await expect(result).rejects.toThrow('File reading was aborted')
  })

  it('同步读取错误也拒绝 Promise', async () => {
    const reader = mockFileReader()
    const error = new TypeError('Invalid Blob')
    reader.readAsDataURL.mockImplementation(() => {
      throw error
    })

    await expect(fileToDataURL(new Blob())).rejects.toBe(error)
  })

  it('缺少 FileReader 时明确报错', async () => {
    vi.stubGlobal('FileReader', undefined)

    await expect(fileToDataURL(new Blob())).rejects.toThrow(
      'fileToDataURL requires FileReader support',
    )
  })
})

describe('dataURLToBlob', () => {
  it.each([
    ['data:text/plain;base64,aGVsbG8=', 'hello', 'text/plain'],
    ['data:text/plain;charset=UTF-8;base64,5L2g5aW9', '你好', 'text/plain;charset=utf-8'],
    [
      'data:text/plain;charset=utf-8,%E4%BD%A0%E5%A5%BD%20%F0%9F%8E%89',
      '你好 🎉',
      'text/plain;charset=utf-8',
    ],
    ['data:text/plain,你好 🎉', '你好 🎉', 'text/plain'],
    ['data:text/plain,a+b%20c%2Bd,more', 'a+b c+d,more', 'text/plain'],
    ['data:,hello', 'hello', 'text/plain;charset=us-ascii'],
    ['data:;charset=UTF-8,%E4%BD%A0%E5%A5%BD', '你好', 'text/plain;charset=utf-8'],
    ['data:;base64,aGVsbG8=', 'hello', 'text/plain;charset=us-ascii'],
    ['DATA:TEXT/PLAIN;BASE64,aGVsbG8=', 'hello', 'text/plain'],
    ['data:text/plain;base64,aGVsbG8%3D', 'hello', 'text/plain'],
    ['data:text/plain;base64,aG Vs bG8=', 'hello', 'text/plain'],
    ['data:text/plain,', '', 'text/plain'],
    ['data:application/octet-stream;base64,', '', 'application/octet-stream'],
    ['data:text/plain,hello?world#fragment', 'hello?world', 'text/plain'],
    ['data:text/plain,%23fragment', '#fragment', 'text/plain'],
  ])('还原文本和 MIME 类型：%s', async (dataURL, text, type) => {
    const blob = dataURLToBlob(dataURL)

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe(type)
    expect(await blob.text()).toBe(text)
  })

  it.each([
    'data:application/octet-stream;base64,AID/',
    'data:application/octet-stream,%00%80%FF',
    'data:application/octet-stream;base64,AID%2F',
  ])('保留二进制字节，包括无效 UTF-8：%s', async (dataURL) => {
    const blob = dataURLToBlob(dataURL)

    expect(blob.type).toBe('application/octet-stream')
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(new Uint8Array([0, 128, 255]))
  })

  it('文件读取结果转换回 Blob 时保留内容和 MIME 类型', async () => {
    const reader = mockFileReader()
    const file = new File([new Uint8Array([0, 128, 255])], 'image.bin', {
      type: 'application/octet-stream',
    })
    const result = fileToDataURL(file)
    reader.result = 'data:application/octet-stream;base64,AID/'
    reader.onload?.()

    const blob = dataURLToBlob(await result)

    expect(blob.type).toBe(file.type)
    expect(await blob.arrayBuffer()).toEqual(await file.arrayBuffer())
  })

  it('转换后的 Blob 可直接交给 download', async () => {
    vi.useFakeTimers()
    try {
      const anchor = { click: vi.fn(), remove: vi.fn() }
      vi.stubGlobal('document', {
        body: { append: vi.fn() },
        createElement: vi.fn(() => anchor),
      })
      const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
      const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
      const blob = dataURLToBlob('data:text/plain;charset=utf-8,%E4%BD%A0%E5%A5%BD')

      await download(blob, '你好.txt')

      expect(createObjectURL).toHaveBeenCalledExactlyOnceWith(blob)
      expect(anchor.click).toHaveBeenCalledTimes(1)
      expect(anchor).toMatchObject({ href: 'blob:test', download: '你好.txt' })
      expect(await blob.text()).toBe('你好')
      vi.runAllTimers()
      expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:test')
    } finally {
      vi.useRealTimers()
    }
  })

  it.each([
    '',
    'aGVsbG8=',
    'https://example.com/file.txt',
    'data:text/plain;base64',
    'data:text/plain,%',
    'data:text/plain,%0',
    'data:text/plain,%GG',
    'data:text/plain;base64,%%%',
    'data:text/plain;base64,not-base64!',
    'data:text/plain;base64,A',
  ])('拒绝不完整的 Data URL 和非法编码：%s', (dataURL) => {
    expect(() => dataURLToBlob(dataURL)).toThrow()
  })

  it('无需 document、FileReader 或网络请求，可在 Node.js 中使用', async () => {
    vi.stubGlobal('document', undefined)
    vi.stubGlobal('FileReader', undefined)
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)

    const blob = dataURLToBlob('data:text/plain,hello')

    expect(await blob.text()).toBe('hello')
    expect(fetch).not.toHaveBeenCalled()
  })
})
