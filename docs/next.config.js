const path = require('path')
const dotenvLoad = require('dotenv-load')
const optimizedImages = require('next-optimized-images')
dotenvLoad()

const remarkPlugins = [
  require('remark-slug'),
  require('./src/lib/docs/remark-paragraph-alerts'),
  [
    require('remark-autolink-headings'),
    {
      behavior: 'append',
      linkProperties: {
        class: ['anchor'],
        title: 'Direct link to heading',
      },
    },
  ],

  require('remark-emoji'),
  require('remark-footnotes'),
  require('remark-images'),
  [
    require('remark-github'),
    { repository: 'https://github.com/tannerlinsley/react-query' },
  ],
  require('remark-unwrap-images'),
  [
    require('remark-toc'),
    {
      skip: 'Reference',
      maxDepth: 6,
    },
  ],
]

module.exports = optimizedImages({
  pageExtensions: ['jsx', 'js', 'mdx', 'md'],
  env: {
    NEXT_PUBLIC_GA_TRACKING_ID: process.env.GA_TRACKING_ID || '',
    SENTRY_RELEASE: process.env.VERCEL_GITHUB_COMMIT_SHA || '',
  },
  async redirects() {
    return [
      {
        source: '/docs/:any*',
        destination: '/:any*', // Matched parameters can be used in the destination
        permanent: true,
      },
    ]
  },
  experimental: {
    plugins: true,
    modern: true,
  },
  webpack: (config, { dev, isServer, ...options }) => {
    config.module.rules.push({
      test: /.mdx?$/, // load both .md and .mdx files
      use: [
        options.defaultLoaders.babel,
        {
          loader: '@mdx-js/loader',
          options: {
            remarkPlugins,
          },
        },
        path.join(__dirname, './src/lib/docs/md-loader'),
      ],
    })

    // only compile build-rss in production server build
    if (dev || !isServer) {
      return config
    }

    // we're in build mode so enable shared caching for Notion data
    process.env.USE_CACHE = 'true'

    const originalEntry = config.entry
    config.entry = async () => {
      const entries = {
        ...(await originalEntry()),
      }
      // entries['./scripts/build-rss.js'] = './src/lib/build-rss.js'
      return entries
    }

    return config
  },
  optimizeImages: {
    /* config for next-optimized-images */
    mozjpeg: {
      quality: 70,
    },
    optipng: {
      optimizationLevel: 3,
    },
    optimizeImagesInDev: true,
  },
})
