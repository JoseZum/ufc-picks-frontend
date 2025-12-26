/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['lucide-react'],
  output: 'standalone',
  images: {
    remotePatterns: [],
  },
}

export default nextConfig
