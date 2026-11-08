import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useApi } from './useApi.js'

describe('useApi', () => {
  it('loads data and supports direct and updater setData calls', async () => {
    const load = vi.fn().mockResolvedValue({ items: ['first'] })
    const { result } = renderHook(() => useApi(load, []))

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.data).toEqual({ items: ['first'] }))
    expect(result.current.loading).toBe(false)

    act(() => result.current.setData({ items: ['second'] }))
    expect(result.current.data).toEqual({ items: ['second'] })

    act(() => result.current.setData((current) => ({ items: [...current.items, 'third'] })))
    expect(result.current.data).toEqual({ items: ['second', 'third'] })
  })

  it('exposes an API error status and uses zero when no status exists', async () => {
    const { result, rerender } = renderHook(({ attempt }) => useApi(
      () => Promise.reject(attempt === 1 ? { message: 'Unavailable', status: 503 } : new Error('Offline')),
      [attempt],
    ), {
      initialProps: { attempt: 1 },
    })

    await waitFor(() => expect(result.current.error).toBe('Unavailable'))
    expect(result.current.errorStatus).toBe(503)

    rerender({ attempt: 2 })
    await waitFor(() => expect(result.current.error).toBe('Offline'))
    expect(result.current.errorStatus).toBe(0)
    expect(result.current.data).toBeNull()
  })

  it('reloads the same dependencies', async () => {
    const load = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second')
    const { result } = renderHook(() => useApi(load, ['same']))

    await waitFor(() => expect(result.current.data).toBe('first'))
    act(() => result.current.reload())
    await waitFor(() => expect(result.current.data).toBe('second'))
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('does not apply an obsolete response after dependencies change', async () => {
    let resolveOld
    const oldRequest = new Promise((resolve) => { resolveOld = resolve })
    const load = vi.fn((id) => (id === 'old' ? oldRequest : Promise.resolve('new')))
    const { result, rerender } = renderHook(({ id }) => useApi(() => load(id), [id]), {
      initialProps: { id: 'old' },
    })

    rerender({ id: 'new' })
    await waitFor(() => expect(result.current.data).toBe('new'))
    await act(async () => resolveOld('old'))
    expect(result.current.data).toBe('new')
  })
})
