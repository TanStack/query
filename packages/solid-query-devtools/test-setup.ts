import '@testing-library/jest-dom/vitest'
import { cleanup } from '@solidjs/testing-library'
import { afterEach } from 'vitest'

// https://github.com/solidjs/solid-testing-library
afterEach(() => cleanup())
