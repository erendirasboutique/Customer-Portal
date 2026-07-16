module.exports = {};
async rewrites() {
  return {
    beforeFiles: [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'live.erendirasboutique.com' }],
        destination: '/live',
      },
    ],
  };
}
