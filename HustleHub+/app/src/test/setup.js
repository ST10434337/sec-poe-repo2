import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Runs before every test file
// jest-dom adds checks like toBeInTheDocument() ~> (Testing Library, n.d.)

// After each test: remove what was rendered, forget any saved login, and reset mock call counts
afterEach(() => {
  cleanup()
  sessionStorage.clear()
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

// Testing Library. n.d. jest-dom: With Vitest. [online] Available at: https://github.com/testing-library/jest-dom#with-vitest (Accessed: 12 October 2026).
