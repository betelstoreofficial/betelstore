/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) return []
    return [
      {
        source: '/supabase/rest/:path*',
        destination: `${supabaseUrl}/rest/:path*`,
      },
      {
        source: '/supabase/auth/:path*',
        destination: `${supabaseUrl}/auth/:path*`,
      },
      {
        source: '/supabase/storage/:path*',
        destination: `${supabaseUrl}/storage/:path*`,
      },
      {
        source: '/supabase/realtime/:path*',
        destination: `${supabaseUrl}/realtime/:path*`,
      },
    ]
  },
}

export default nextConfig
