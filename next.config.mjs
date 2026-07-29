/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['lucide-react'],
  turbopack: {
    root: process.cwd(),
  },

  // Para Docker usa 'standalone', para Vercel no necesita output
  // output: 'standalone',

  images: {
    remotePatterns: [
      {
        // Permitir imagenes de cualquier dominio (para fotos de perfil de Google, etc)
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Reescrituras para redirigir API calls al backend (Proxy para evitar CORS)
  async rewrites() {
    // URL del backend real (Render en prod, localhost en dev por defecto)
    const isDev = process.env.NODE_ENV === 'development';
    const backendUrl = process.env.BACKEND_URL || (isDev ? 'http://localhost:8000' : 'https://ufc-picks-backend.onrender.com');

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
}

export default nextConfig
