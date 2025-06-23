import { useState, useEffect } from 'react'

/**
 * Custom hook to debounce a value
 * Useful for search inputs, API calls, etc.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Custom hook for debounced callbacks
 * Useful for debouncing function calls
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const debouncedCallback = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    const newTimeoutId = setTimeout(() => {
      callback(...args)
    }, delay)

    setTimeoutId(newTimeoutId)
  }) as T

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [timeoutId])

  return debouncedCallback
}

/**
 * Custom hook for debounced async operations
 * Cancels previous async operations when new ones are triggered
 */
export function useDebouncedAsync<T>(
  asyncOperation: () => Promise<T>,
  delay: number
): {
  execute: () => void
  loading: boolean
  data: T | null
  error: Error | null
} {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  const execute = () => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Abort previous operation
    if (abortController) {
      abortController.abort()
    }

    const newTimeoutId = setTimeout(async () => {
      const newAbortController = new AbortController()
      setAbortController(newAbortController)
      setLoading(true)
      setError(null)

      try {
        const result = await asyncOperation()
        if (!newAbortController.signal.aborted) {
          setData(result)
        }
      } catch (err) {
        if (!newAbortController.signal.aborted) {
          setError(err instanceof Error ? err : new Error('Unknown error'))
        }
      } finally {
        if (!newAbortController.signal.aborted) {
          setLoading(false)
        }
      }
    }, delay)

    setTimeoutId(newTimeoutId)
  }

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (abortController) {
        abortController.abort()
      }
    }
  }, [timeoutId, abortController])

  return { execute, loading, data, error }
}