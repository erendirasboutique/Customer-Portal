// components/account/LabelScanner.jsx
//
// Pop-up camera scanner for the package label, ported from the Shipping
// Portal's BarcodeScanner (works on iPhone and Android). Calls onCode with
// the barcode it reads.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getDetector, grabFrame, bestCode, readFromPhoto } from "@/lib/barcode";

const TEXT = {
  es: {
    title: "Escanea la etiqueta",
    close: "Cerrar",
    starting: "Abriendo la cámara…",
    hint: "Pon el código de barras largo dentro del cuadro, a unos 15 cm.",
    photo: "¿No lo lee? Toma una foto de la etiqueta",
    reading: "Leyendo…",
    noCamera: "Este navegador no puede usar la cámara. Toma una foto de la etiqueta.",
    blocked: "La cámara está bloqueada. Permítela para este sitio en Ajustes, o toma una foto de la etiqueta.",
    noStart: "No se pudo abrir la cámara. Toma una foto de la etiqueta.",
    noReader: "No se pudo cargar el lector. Revisa tu conexión.",
    noCode: "No encontramos un código en la foto. Acércate para que el código llene la foto.",
    badPhoto: "No pudimos leer la foto. Intenta otra vez.",
  },
  en: {
    title: "Scan the label",
    close: "Close",
    starting: "Starting camera…",
    hint: "Hold the long barcode inside the box, about 6 inches away.",
    photo: "Not scanning? Take a photo of the label",
    reading: "Reading…",
    noCamera: "This browser can't use the camera. Take a photo of the label instead.",
    blocked: "Camera access is blocked. Allow the camera for this site in Settings, or take a photo of the label.",
    noStart: "Couldn't start the camera. Take a photo of the label instead.",
    noReader: "The barcode reader couldn't load. Check your connection.",
    noCode: "Couldn't find a barcode in that photo. Get closer so the barcode fills the photo.",
    badPhoto: "Couldn't read that photo. Try again.",
  },
};

export default function LabelScanner(props) {
  const onCode = props.onCode;
  const onClose = props.onClose;
  const t = TEXT[props.lang] || TEXT.es;
  const videoRef = useRef(null);
  const fileRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const activeRef = useRef(false);
  const doneRef = useRef(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  const stop = useCallback(function () {
    activeRef.current = false;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    if (streamRef.current) streamRef.current.getTracks().forEach(function (tr) { tr.stop(); });
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  const found = useCallback(function (code) {
    if (doneRef.current) return;
    doneRef.current = true;
    try { if (navigator.vibrate) navigator.vibrate(60); } catch (e) { /* no vibration */ }
    stop();
    onCode(code);
  }, [onCode, stop]);

  const start = useCallback(async function () {
    setMsg("");
    const video = videoRef.current;
    if (!video) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMsg(t.noCamera);
      return;
    }
    stop();
    activeRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (!activeRef.current) {
        stream.getTracks().forEach(function (tr) { tr.stop(); });
        return;
      }
      streamRef.current = stream;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      video.muted = true;
      await video.play();
      setCameraOn(true);
      try {
        const track = stream.getVideoTracks()[0];
        const caps = track && track.getCapabilities ? track.getCapabilities() : null;
        if (caps && caps.focusMode && caps.focusMode.includes && caps.focusMode.includes("continuous")) {
          await track.applyConstraints({ advanced: [{ focusMode: "continuous" }] });
        }
      } catch (e) { /* no focus control */ }

      let detector;
      try {
        detector = await getDetector();
      } catch (e) {
        setMsg(t.noReader);
        return;
      }
      const canvas = document.createElement("canvas");
      let n = 0;
      const tick = async function () {
        if (!activeRef.current) return;
        try {
          const frame = grabFrame(video, canvas, n++ % 3 !== 2);
          if (frame) {
            const codes = await detector.detect(frame);
            const best = bestCode((codes || []).map(function (c) { return c.rawValue; }));
            if (best && activeRef.current) { found(best); return; }
          }
        } catch (e) { /* keep trying */ }
        if (activeRef.current) timerRef.current = window.setTimeout(tick, 150);
      };
      tick();
    } catch (e) {
      activeRef.current = false;
      const denied = e && (e.name === "NotAllowedError" || e.name === "SecurityError");
      setMsg(denied ? t.blocked : t.noStart);
    }
  }, [found, stop, t]);

  useEffect(function () {
    start();
    return function () { stop(); };
  }, [start, stop]);

  useEffect(function () {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return function () { window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  async function onPhoto(e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    setBusy(t.reading);
    setMsg("");
    try {
      const code = await readFromPhoto(f);
      setBusy("");
      if (!code) { setMsg(t.noCode); return; }
      found(code);
    } catch (err) {
      setBusy("");
      setMsg(t.badPhoto);
    }
  }

  return (
    <div className="ls-back" onClick={onClose}>
      <style>{css}</style>
      <div className="ls-card" role="dialog" aria-modal="true" aria-labelledby="ls-title" onClick={function (e) { e.stopPropagation(); }}>
        <div className="ls-head">
          <h2 id="ls-title">{t.title}</h2>
          <button type="button" onClick={onClose} aria-label={t.close} className="ls-x">×</button>
        </div>
        <div className="ls-cam">
          <video ref={videoRef} muted playsInline />
          {cameraOn ? <div className="ls-frame" aria-hidden="true"><div /></div> : null}
          {!cameraOn && !msg ? <div className="ls-starting">{t.starting}</div> : null}
          {busy ? <div className="ls-busy" role="status">{busy}</div> : null}
        </div>
        {msg ? <p className="ls-err" role="alert">{msg}</p> : null}
        <p className="ls-hint">{t.hint}</p>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onPhoto} />
        <button type="button" className="ls-photo" disabled={Boolean(busy)} onClick={function () { if (fileRef.current) fileRef.current.click(); }}>
          {t.photo}
        </button>
      </div>
    </div>
  );
}

const css = `
.ls-back { position:fixed; inset:0; z-index:50; display:flex; align-items:flex-end; justify-content:center; padding:12px; background:rgba(63,51,39,.55); }
@media (min-width: 640px) { .ls-back { align-items:center; } }
.ls-card { width:100%; max-width:440px; background:#fff; border-radius:32px; padding:16px; font-family:var(--brand-font-body, "Ltt Recoleta", Georgia, serif); color:#3f3327; font-synthesis:none; }
.ls-head { display:flex; align-items:center; justify-content:space-between; padding:0 4px 12px; }
.ls-head h2 { margin:0; font-family:var(--brand-font-heading, "Charman Serif", Georgia, serif); font-weight:400; font-size:26px; color:#957f67; }
.ls-x { width:44px; height:44px; border:0; border-radius:50%; background:#F5F3EF; color:#5F4E3D; font-size:26px; line-height:1; cursor:pointer; }
.ls-cam { position:relative; overflow:hidden; border-radius:24px; background:#000; aspect-ratio:3 / 4; }
.ls-cam video { width:100%; height:100%; object-fit:cover; display:block; }
.ls-frame { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; }
.ls-frame div { width:86%; height:34%; border:2px solid rgba(255,255,255,.9); border-radius:18px; box-shadow:0 0 0 9999px rgba(0,0,0,.35); }
.ls-starting { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,.85); font-size:15px; }
.ls-busy { position:absolute; left:0; right:0; bottom:0; padding:12px; text-align:center; background:rgba(0,0,0,.6); color:#fff; font-size:15px; }
.ls-err { margin:12px 0 0; padding:10px 14px; border-radius:16px; background:#f6e4de; color:#8f3a22; font-size:15px; line-height:1.4; }
.ls-hint { margin:12px 0 0; text-align:center; font-size:15px; color:#6b5a48; }
.ls-photo { width:100%; min-height:54px; margin-top:12px; border:1px solid rgba(149,127,103,.35); border-radius:18px; background:#fff; color:#3f3327; font-family:inherit; font-size:16px; cursor:pointer; }
`;
