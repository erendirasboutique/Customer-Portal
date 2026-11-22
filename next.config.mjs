// Same as next.config.js (Next.js uses that one; this copy is kept in step).
// The shared brand files in public/brand/ are loaded by the shipping portal
// and the tracker too, so they're allowed from other sites, and cached only
// briefly so a logo or color change shows up within a few minutes.
const nextConfig = {
  async headers() {
    return [
      {
        source: "/brand/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=300, must-revalidate" },
        ],
      },
    ];
  },
};
export default nextConfig;
