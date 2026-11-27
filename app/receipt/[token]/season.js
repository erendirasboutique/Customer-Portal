/* ============================================================
   Seasonal look for the receipt page and its share picture.
   Change SEASON to switch every receipt at once:
     'winter' → pine green, berries, gold stars, falling snow
     'fall'   → the original brown look with falling leaves
   ============================================================ */

export const SEASON = 'winter';

export const PALETTES = {
  fall: {
    bg: '#F5F3EF',
    card: '#FFFFFF',
    brand: '#957f67',
    dark: '#7f6b55',
    soft: '#cfbda9',
    line: '#e6dccf',
    line2: '#efe8de',
    ink: '#5f4e3d',
    muted: '#7d6a56',
    accent: '#957f67', // big total amount
    shadow: '149,127,103',
  },
  winter: {
    bg: '#F5F1EA',
    card: '#FFFFFF',
    brand: '#2F4A3A', // pine green
    dark: '#233A2D',
    soft: '#6E9A7C', // pine sprigs
    line: '#E6DED1',
    line2: '#EFE9DF',
    ink: '#26302A',
    muted: '#56635A',
    accent: '#9E2B32', // cranberry, big total amount
    berry: '#C8414A',
    gold: '#E2C27A',
    shadow: '47,74,58',
  },
};

export const PALETTE = PALETTES[SEASON] || PALETTES.fall;
