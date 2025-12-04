/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Proxy local → Supabase (bypass CORS no navegador)
      {
        source: '/proxy/supabase/:path*',
        destination: 'https://yuanqfswhberkoevtmfr.supabase.co/:path*',
      },
    ];
  },
};

export default nextConfig;
