// lib/barcode.js
// Browser-only barcode helpers (same as the Shipping Portal's lib/barcode.ts).
// Android Chrome has a built-in reader; iPhones get a strong one
// (ZXing compiled to WebAssembly) loaded from the CDN when needed.

const PONYFILL = "https://fastly.jsdelivr.net/npm/barcode-detector@3/dist/es/ponyfill.min.js";
const FORMATS = ["code_128", "data_matrix", "qr_code", "code_39", "pdf417"];
let detectorPromise = null;

export function getDetector() {
  if (!detectorPromise) {
    detectorPromise = (async function () {
      const Native = typeof window !== "undefined" ? window.BarcodeDetector : undefined;
      if (Native && Native.getSupportedFormats) {
        try {
          const supported = await Native.getSupportedFormats();
          if (supported.includes("code_128")) {
            return new Native({ formats: FORMATS.filter(function (f) { return supported.includes(f); }) });
          }
        } catch (e) { /* fall through to the ponyfill */ }
      }
      // eslint-disable-next-line no-new-func
      const importFromUrl = new Function("u", "return import(u)");
      const mod = await importFromUrl(PONYFILL);
      return new mod.BarcodeDetector({ formats: FORMATS });
    })().catch(function (e) {
      detectorPromise = null;
      throw e;
    });
  }
  return detectorPromise;
}

// Copy the current video frame (or just the middle band) onto a canvas.
export function grabFrame(video, canvas, band) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;
  let sx = 0, sy = 0, sw = vw, sh = vh;
  if (band) {
    sw = Math.round(vw * 0.94);
    sh = Math.round(Math.min(vh, vw * 0.6));
    sx = Math.round((vw - sw) / 2);
    sy = Math.round((vh - sh) / 2);
  }
  const scale = Math.min(1, 1600 / sw);
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas;
}

// Prefer the shipping barcode when a label has several.
export function bestCode(values) {
  const v = values.map(function (x) { return (x || "").trim(); }).filter(Boolean);
  if (!v.length) return null;
  const clean = function (s) { return s.replace(/[^0-9A-Za-z]/g, ""); };
  return (
    v.find(function (s) { return /^420\d/.test(clean(s)); }) ||
    v.find(function (s) { return /^1Z/i.test(clean(s)); }) ||
    v.find(function (s) { return /^9\d{19,}$/.test(clean(s)); }) ||
    v.sort(function (a, b) { return b.length - a.length; })[0]
  );
}

// Read a barcode from a still photo (sharper than live video).
export async function readFromPhoto(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise(function (resolve, reject) {
      const i = new window.Image();
      i.onload = function () { resolve(i); };
      i.onerror = function () { reject(new Error("decode")); };
      i.src = url;
    });
    const detector = await getDetector();
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 2400 / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const codes = await detector.detect(canvas);
    return bestCode((codes || []).map(function (c) { return c.rawValue; }));
  } finally {
    URL.revokeObjectURL(url);
  }
}

// The tracking number's last 4 digits, from a scanned label barcode.
// USPS labels read "420" + ZIP + tracking, so the tracking number is at the
// end; UPS ("1Z…") and others carry the tracking number as-is.
export function trackingLast4(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  return digits.length >= 8 ? digits.slice(-4) : "";
}
