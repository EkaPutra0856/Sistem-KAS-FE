import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            // Versi satu baris panjang (copy semua sampai titik koma terakhir)
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://app.sandbox.midtrans.com https://app.midtrans.com https://api.midtrans.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; frame-src 'self' https://app.sandbox.midtrans.com https://app.midtrans.com; connect-src 'self' https://app.sandbox.midtrans.com https://app.midtrans.com https://api.midtrans.com http://localhost:8000 https://va.vercel-scripts.com;"
          },
        ],
      },
    ];
  },
};

export default nextConfig;