export default {
  displayName: 'solid-query-persist-client',
  preset: '../../jest-preset.js',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  transform: { '^.+\\.(ts|tsx)$': './transform.js' },
}
