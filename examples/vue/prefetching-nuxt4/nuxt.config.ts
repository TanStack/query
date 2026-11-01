// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint'],
  eslint: {
    config: {
      standalone: false,
    },
  },
  typescript: {
    nodeTsConfig: {
      include: ['../eslint.config.js'],
    },
  },
})
