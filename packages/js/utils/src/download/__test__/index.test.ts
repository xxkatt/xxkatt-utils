import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { download } from '@/index'

function mockDocument() {
  const anchor = { href: '', download: '', hidden: false, click: vi.fn(), remove: vi.fn() }
  const append = vi.fn()
  vi.stubGlobal('document', { createElement: vi.fn(() => anchor), body: { append } })
  return { anchor, append }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.runAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('download', () => {
  it.each([
    new Blob(['你好，世界'], { type: 'text/plain;charset=utf-8' }),
    new Blob([]),
    new File(['file content'], 'original.txt', { type: 'text/plain' }),
  ])('直接下载 Blob/File，保留内容和 MIME 类型：%s', async (source) => {
    const { anchor, append } = mockDocument()
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL')
    anchor.click.mockImplementation(() => {
      expect(append).toHaveBeenCalledWith(anchor)
      expect(anchor.href).toBe('blob:test')
      expect(anchor.download).toBe('导出.txt')
      expect(anchor.hidden).toBe(true)
    })

    await expect(download(source, '导出.txt')).resolves.toBeUndefined()

    expect(fetch).not.toHaveBeenCalled()
    expect(createObjectURL).toHaveBeenCalledExactlyOnceWith(source)
    expect(anchor.click).toHaveBeenCalledTimes(1)
    expect(anchor.remove).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:test')
  })

  it.each(['/files/report.pdf', 'https://example.com/report.pdf', 'blob:existing'])(
    '获取 URL 后下载：%s',
    async (source) => {
      const { anchor } = mockDocument()
      const blob = new Blob(['report'], { type: 'application/pdf' })
      const fetch = vi.fn().mockResolvedValue(new Response(blob))
      vi.stubGlobal('fetch', fetch)
      const createObjectURL = vi.spyOn(URL, 'createObjectURL')

      await download(source, 'report.pdf')

      expect(fetch).toHaveBeenCalledExactlyOnceWith(source)
      const downloaded = createObjectURL.mock.calls[0]![0] as Blob
      expect(await downloaded.text()).toBe('report')
      expect(downloaded.type).toBe('application/pdf')
      expect(anchor.click).toHaveBeenCalledTimes(1)
    },
  )

  it.each([
    'data:text/plain;charset=utf-8;base64,5L2g5aW9',
    'data:text/plain;charset=utf-8,%E4%BD%A0%E5%A5%BD',
  ])('下载完整 Data URL，正确还原中文内容：%s', async (source) => {
    const { anchor } = mockDocument()
    const createObjectURL = vi.spyOn(URL, 'createObjectURL')

    await download(source, '你好.txt')

    const downloaded = createObjectURL.mock.calls[0]![0] as Blob
    expect(await downloaded.text()).toBe('你好')
    expect(downloaded.type).toBe('text/plain;charset=utf-8')
    expect(anchor.click).toHaveBeenCalledTimes(1)
  })

  it('HTTP 错误时拒绝下载，不创建对象 URL', async () => {
    const { anchor } = mockDocument()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Not Found', { status: 404 })))
    const createObjectURL = vi.spyOn(URL, 'createObjectURL')

    await expect(download('/missing', 'report.pdf')).rejects.toThrow('HTTP 404')

    expect(createObjectURL).not.toHaveBeenCalled()
    expect(anchor.click).not.toHaveBeenCalled()
  })

  it('透传网络错误', async () => {
    const { anchor } = mockDocument()
    const error = new TypeError('Failed to fetch')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error))

    await expect(download('/files/report.pdf', 'report.pdf')).rejects.toBe(error)

    expect(anchor.click).not.toHaveBeenCalled()
  })

  it('透传读取响应体时的错误', async () => {
    const { anchor } = mockDocument()
    const error = new Error('Failed to read body')
    const response = new Response('report')
    vi.spyOn(response, 'blob').mockRejectedValue(error)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
    const createObjectURL = vi.spyOn(URL, 'createObjectURL')

    await expect(download('/files/report.pdf', 'report.pdf')).rejects.toBe(error)

    expect(createObjectURL).not.toHaveBeenCalled()
    expect(anchor.click).not.toHaveBeenCalled()
  })

  it('触发下载失败时仍移除链接并释放对象 URL', async () => {
    const { anchor } = mockDocument()
    const error = new Error('Failed to click')
    anchor.click.mockImplementation(() => {
      throw error
    })
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL')

    await expect(download(new Blob(['report']), 'report.txt')).rejects.toBe(error)

    expect(anchor.remove).toHaveBeenCalledTimes(1)
    vi.runAllTimers()
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:test')
  })

  it('在非浏览器环境调用时明确报错，且不发起请求', async () => {
    vi.stubGlobal('document', undefined)
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)

    await expect(download('/files/report.pdf', 'report.pdf')).rejects.toThrow(
      'download requires a browser environment',
    )

    expect(fetch).not.toHaveBeenCalled()
  })
})
