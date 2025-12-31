/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'beyondchats.com',
      },
      {
        protocol: 'http',
        hostname: 'beyondchats.com',
      },
    ]
  }
};

export default nextConfig;
