// The shared brand files in public/brand/ are loaded by the shipping portal
// and the tracker too, so they're allowed from other sites, and cached only
// briefly so a logo or color change shows up within a few minutes.
const brandHeaders = [
  {
    source: "/brand/:path*",
    headers: [
      { key: "Access-Control-Allow-Origin", value: "*" },
      { key: "Cache-Control", value: "public, max-age=300, must-revalidate" },
    ],
  },
];

module.exports = {
  async headers() {
    return brandHeaders;
  },
};
