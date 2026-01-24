/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['lucide-react'],

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

  // Reescrituras para redirigir API calls al backend (solo en desarrollo)
  // En produccion, el frontend llama directamente a la URL del backend
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // Solo aplicar rewrites en desarrollo
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: `${apiUrl}/:path*`,
        },
      ];
    }

    return [];
  },
}

export default nextConfig
