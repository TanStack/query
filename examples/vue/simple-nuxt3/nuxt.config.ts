// https://nuxt.com/docs/3.x/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    head: {
      title: 'TanStack Vue Query Simple Example (Nuxt 3)',
      link: [
        {
          rel: 'shortcut icon',
          type: 'image/svg+xml',
          href: '/emblem-light.svg',
        },
      ],
    },
  },
  modules: ['@nuxt/eslint'],
  eslint: {
    config: {
      standalone: false,
    },
  },
})
