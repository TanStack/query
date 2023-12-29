// @ts-check

import { getViteConfig } from '../../scripts/getViteConfig.js'

export default getViteConfig({
  test: {
    name: 'react-query',
    dir: './src',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['test-setup.ts'],
    coverage: { provider: 'istanbul', include: ['src/**/*'] },
  },
})
