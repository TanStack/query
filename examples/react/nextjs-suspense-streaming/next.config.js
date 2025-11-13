// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    if (config.name === 'server') config.optimization.concatenateModules = false

    return config
  },
}

export default nextConfig
