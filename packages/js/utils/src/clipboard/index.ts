/**
 * 复制文本；优先使用 Clipboard API，失败或不可用时回退到 execCommand。
 *
 * @returns 写入成功后完成；浏览器不支持或拒绝复制时抛错。
 * @example
 * await copyText('要复制的内容')
 */
export async function copyText(text: string): Promise<void> {
  if (typeof document === 'undefined') {
    throw new Error('copyText requires a browser environment')
  }

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function') {
      await navigator.clipboard.writeText(text)
      return
    }
  } catch {
    // 权限或安全策略可能拒绝 Clipboard API，继续尝试传统复制。
  }

  const body = document.body
  if (!body || typeof document.execCommand !== 'function') {
    throw new Error('Text copying is not supported in this environment')
  }

  const activeElement = document.activeElement as HTMLElement | null
  const activeInput =
    activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA'
      ? (activeElement as HTMLInputElement | HTMLTextAreaElement)
      : null
  const inputStart = activeInput?.selectionStart
  const inputEnd = activeInput?.selectionEnd
  const inputDirection = activeInput?.selectionDirection
  const selection = document.getSelection?.()
  const ranges: Range[] = []
  if (selection) {
    for (let index = 0; index < selection.rangeCount; index++) {
      ranges.push(selection.getRangeAt(index).cloneRange())
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.readOnly = true
  // 保持元素可选中；固定定位防止滚动，16px 字体避免移动端聚焦时缩放。
  textarea.style.cssText =
    'position:fixed;top:0;left:0;opacity:0;font-size:16px;pointer-events:none;'

  try {
    body.appendChild(textarea)
    textarea.focus({ preventScroll: true })
    textarea.select()
    textarea.setSelectionRange(0, text.length)
    if (!document.execCommand('copy')) {
      throw new Error('Failed to copy text')
    }
  } finally {
    if (textarea.parentNode) textarea.parentNode.removeChild(textarea)
    activeElement?.focus?.({ preventScroll: true })
    if (selection) {
      selection.removeAllRanges()
      for (const range of ranges) selection.addRange(range)
    }
    if (inputStart != null && inputEnd != null) {
      activeInput?.setSelectionRange(inputStart, inputEnd, inputDirection ?? undefined)
    }
  }
}
