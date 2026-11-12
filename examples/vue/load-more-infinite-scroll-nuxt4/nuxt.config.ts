// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    head: {
      title: 'TanStack Vue Query Load-More Infinite Scroll Example',
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
  typescript: {
    nodeTsConfig: {
      include: ['../eslint.config.js'],
    },
  },
})
