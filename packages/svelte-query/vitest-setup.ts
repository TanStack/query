import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/svelte'
import { afterEach } from 'vitest'

afterEach(() => cleanup())
