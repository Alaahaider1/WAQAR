import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  // Keep Turbopack within this project when a parent directory has another lockfile.
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      // Existing: Unsplash (used by frontend mock data)
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      // Cloudinary (production product images)
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Supabase Storage (invoices, exports — private buckets)
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async headers() {
    const production = process.env.NODE_ENV === 'production';
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      `script-src 'self' 'unsafe-inline'${production ? '' : " 'unsafe-eval'"} https://connect.facebook.net https://analytics.tiktok.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://images.unsplash.com https://plus.unsplash.com https://res.cloudinary.com https://*.supabase.co https://www.facebook.com https://analytics.tiktok.com",
      "font-src 'self' data:",
      "media-src 'self' blob: https://res.cloudinary.com https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.cloudinary.com https://connect.facebook.net https://www.facebook.com https://analytics.tiktok.com",
      ...(production ? ['upgrade-insecure-requests'] : []),
    ].join('; ');
    const headers = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'X-Frame-Options', value: 'DENY' },
      ...(production ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }] : []),
    ];
    return [{ source: '/:path*', headers }];
  },
};

export default nextConfig;
