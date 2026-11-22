// Same as next.config.js (Next.js uses that one; this copy is kept in step).
const nextConfig = {
  async headers() {
    return [
      {
        source: "/brand/fonts/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },
};
export default nextConfig;
