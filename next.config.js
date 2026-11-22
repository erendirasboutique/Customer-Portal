// The shared brand fonts in public/brand/fonts/ are loaded by the shipping
// portal and the tracker too, so other sites are allowed to load them.
// (/brand/brand.css, /brand/logo.png and /brand/brand.json are built from
// /admin/branding by app/brand/* and set their own headers.)
module.exports = {
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
