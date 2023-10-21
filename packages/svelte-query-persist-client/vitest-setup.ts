import '@testing-library/jest-dom/vitest'
import matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/svelte'
import { afterEach, expect } from 'vitest'

expect.extend(matchers)

afterEach(() => cleanup())
