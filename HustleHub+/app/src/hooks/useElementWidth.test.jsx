import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useElementWidth } from './useElementWidth.js'

describe('useElementWidth', () => {
  afterEach(() => {
    delete globalThis.ResizeObserver
  })

  it('keeps the fallback while disabled or without an element', () => {
    const ref = { current: null }
    const observe = vi.fn()
    globalThis.ResizeObserver = class { observe = observe }

    const { result, rerender } = renderHook(({ enabled }) => useElementWidth(ref, 320, enabled), {
      initialProps: { enabled: false },
    })

    expect(result.current).toBe(320)
    expect(observe).not.toHaveBeenCalled()
    rerender({ enabled: true })
    expect(result.current).toBe(320)
    expect(observe).not.toHaveBeenCalled()
  })

  it('tracks rounded resize widths and disconnects on cleanup', () => {
    const element = document.createElement('div')
    const ref = { current: element }
    let callback
    const disconnect = vi.fn()
    globalThis.ResizeObserver = class {
      constructor(onResize) { callback = onResize }
      observe = vi.fn()
      disconnect = disconnect
    }

    const { result, unmount } = renderHook(() => useElementWidth(ref, 200))
    expect(result.current).toBe(200)
    act(() => callback([{ contentRect: { width: 410.6 } }]))
    expect(result.current).toBe(411)
    unmount()
    expect(disconnect).toHaveBeenCalledOnce()
  })

  it('uses the fallback when ResizeObserver is unavailable', () => {
    const { result } = renderHook(() => useElementWidth({ current: document.createElement('div') }, 180))
    expect(result.current).toBe(180)
  })
})
