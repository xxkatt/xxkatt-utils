import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyText } from '@/index'

function mockDocument() {
  const savedRange = {}
  const range = { cloneRange: vi.fn(() => savedRange) }
  const selection = {
    rangeCount: 1,
    getRangeAt: vi.fn(() => range),
    removeAllRanges: vi.fn(),
    addRange: vi.fn(),
  }
  const activeElement = {
    tagName: 'INPUT',
    selectionStart: 1,
    selectionEnd: 3,
    selectionDirection: 'backward',
    setSelectionRange: vi.fn(),
    focus: vi.fn(),
  }
  const textarea = {
    value: '',
    readOnly: false,
    style: { cssText: '' },
    focus: vi.fn(),
    select: vi.fn(),
    setSelectionRange: vi.fn(),
    parentNode: null as unknown,
  }
  const body = {
    appendChild: vi.fn(() => {
      textarea.parentNode = body
    }),
    removeChild: vi.fn(() => {
      textarea.parentNode = null
    }),
  }
  const document = {
    body,
    activeElement,
    getSelection: vi.fn(() => selection),
    createElement: vi.fn(() => textarea),
    execCommand: vi.fn(() => true),
  }
  vi.stubGlobal('document', document)
  vi.stubGlobal('navigator', {})
  return { document, body, textarea, activeElement, selection, savedRange }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('copyText', () => {
  it.each(['普通文本', '你好\n第二行 🎉', ''])(
    '优先使用 Clipboard API，保留文本内容：%j',
    async (text) => {
      const { document } = mockDocument()
      const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) }
      vi.stubGlobal('navigator', { clipboard })

      await expect(copyText(text)).resolves.toBeUndefined()

      expect(clipboard.writeText).toHaveBeenCalledExactlyOnceWith(text)
      expect(clipboard.writeText.mock.contexts[0]).toBe(clipboard)
      expect(document.createElement).not.toHaveBeenCalled()
      expect(document.execCommand).not.toHaveBeenCalled()
    },
  )

  it('等待 Clipboard API 写入完成后才完成', async () => {
    mockDocument()
    let finish!: () => void
    const writeText = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const completed = vi.fn()
    const result = copyText('text').then(completed)

    await Promise.resolve()
    expect(completed).not.toHaveBeenCalled()
    finish()
    await result
    expect(completed).toHaveBeenCalledTimes(1)
  })

  it.each([{}, { clipboard: {} }, undefined])(
    'Clipboard API 不可用时降级：%j',
    async (navigator) => {
      const { document, body, textarea } = mockDocument()
      vi.stubGlobal('navigator', navigator)
      document.execCommand.mockImplementation(() => {
        expect(textarea.parentNode).toBe(body)
        expect(textarea.value).toBe('你好\n第二行 🎉')
        expect(textarea.readOnly).toBe(true)
        expect(textarea.focus).toHaveBeenCalledTimes(1)
        expect(textarea.select).toHaveBeenCalledTimes(1)
        expect(textarea.setSelectionRange).toHaveBeenCalledExactlyOnceWith(0, textarea.value.length)
        return true
      })

      await expect(copyText('你好\n第二行 🎉')).resolves.toBeUndefined()

      expect(document.execCommand).toHaveBeenCalledExactlyOnceWith('copy')
      expect(body.removeChild).toHaveBeenCalledExactlyOnceWith(textarea)
      expect(textarea.parentNode).toBeNull()
    },
  )

  it('HTTP 非安全上下文缺少 Clipboard API 时使用传统复制', async () => {
    const { document } = mockDocument()
    vi.stubGlobal('isSecureContext', false)

    await copyText('http://example.com')

    expect(document.execCommand).toHaveBeenCalledExactlyOnceWith('copy')
  })

  it.each(['rejection', 'throw'])('Clipboard API 失败后降级：%s', async (failure) => {
    const { document } = mockDocument()
    const error = new Error('Permission denied')
    const writeText = vi.fn(() => {
      if (failure === 'throw') throw error
      return Promise.reject(error)
    })
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    await expect(copyText('text')).resolves.toBeUndefined()

    expect(writeText).toHaveBeenCalledExactlyOnceWith('text')
    expect(document.execCommand).toHaveBeenCalledExactlyOnceWith('copy')
  })

  it.each(['success', 'false', 'throw'])(
    '降级复制后清理元素并恢复焦点和选区：%s',
    async (outcome) => {
      const { document, body, textarea, activeElement, selection, savedRange } = mockDocument()
      const error = new Error('Copy blocked')
      document.execCommand.mockImplementation(() => {
        if (outcome === 'throw') throw error
        return outcome === 'success'
      })

      const result = copyText('text')
      if (outcome === 'success') await expect(result).resolves.toBeUndefined()
      else if (outcome === 'false') await expect(result).rejects.toThrow('Failed to copy text')
      else await expect(result).rejects.toBe(error)

      expect(body.removeChild).toHaveBeenCalledExactlyOnceWith(textarea)
      expect(textarea.parentNode).toBeNull()
      expect(activeElement.focus).toHaveBeenCalledExactlyOnceWith({ preventScroll: true })
      expect(selection.removeAllRanges).toHaveBeenCalledTimes(1)
      expect(selection.addRange).toHaveBeenCalledExactlyOnceWith(savedRange)
      expect(activeElement.setSelectionRange).toHaveBeenCalledExactlyOnceWith(1, 3, 'backward')
    },
  )

  it('选中文本失败时仍移除临时元素并恢复焦点', async () => {
    const { document, body, textarea, activeElement } = mockDocument()
    const error = new Error('Selection failed')
    textarea.select.mockImplementation(() => {
      throw error
    })

    await expect(copyText('text')).rejects.toBe(error)

    expect(document.execCommand).not.toHaveBeenCalled()
    expect(body.removeChild).toHaveBeenCalledExactlyOnceWith(textarea)
    expect(activeElement.focus).toHaveBeenCalledTimes(1)
  })

  it('没有活动元素和 Selection API 时仍能复制', async () => {
    const { document } = mockDocument()
    vi.stubGlobal('document', { ...document, activeElement: null, getSelection: undefined })

    await expect(copyText('text')).resolves.toBeUndefined()

    expect(document.execCommand).toHaveBeenCalledExactlyOnceWith('copy')
  })

  it('恢复普通元素焦点时不尝试恢复输入框选区', async () => {
    const { activeElement } = mockDocument()
    activeElement.tagName = 'BUTTON'

    await copyText('text')

    expect(activeElement.focus).toHaveBeenCalledTimes(1)
    expect(activeElement.setSelectionRange).not.toHaveBeenCalled()
  })

  it('两种复制方式都失败时拒绝 Promise', async () => {
    const { document, body, textarea } = mockDocument()
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Permission denied')) },
    })
    document.execCommand.mockReturnValue(false)

    await expect(copyText('text')).rejects.toThrow('Failed to copy text')

    expect(body.removeChild).toHaveBeenCalledExactlyOnceWith(textarea)
  })

  it.each([{ execCommand: undefined }, { body: null }])(
    '传统复制不可用时明确报错：%j',
    async (override) => {
      const { document } = mockDocument()
      vi.stubGlobal('document', { ...document, ...override })

      await expect(copyText('text')).rejects.toThrow('Text copying is not supported')

      expect(document.createElement).not.toHaveBeenCalled()
    },
  )

  it('在 Node.js 或 SSR 中调用时明确报错', async () => {
    vi.stubGlobal('document', undefined)
    const writeText = vi.fn()
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    await expect(copyText('text')).rejects.toThrow('copyText requires a browser environment')

    expect(writeText).not.toHaveBeenCalled()
  })
})
