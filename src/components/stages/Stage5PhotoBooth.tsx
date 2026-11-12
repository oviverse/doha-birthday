import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Download,
  RefreshCw,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { fireCelebrationConfetti } from '../../utils/confetti';
import { ambientAudio } from '../../utils/ambientAudio';
import { Kicker, PrimaryButton } from '../ui/Primitives';

interface Stage5PhotoBoothProps {
  onNext: () => void;
}

const SMILE_PROMPTS = [
  "Smile, Doha! Come on, don't be shy… you are so cute, do it! 💖",
  'Give the booth that gorgeous 21st birthday smile ✨',
  'No hiding, birthday queen — the camera loves you! 👑',
  'Come on, one pretty smile for me across the miles 📸',
  'Look at you glowing… okay, strike a pose for me! 😘',
];

const COUNTDOWN_LINES: Record<number, string> = {
  3: "Come on Doha, don't be shy…",
  2: "You're so pretty, give us that smile!",
  1: 'HOLD IT… GORGEOUS! ✨',
};

const CAPTURED_CAPTIONS = [
  'See?! Told you — absolutely stunning! ❤️',
  'Not shy anymore & looking gorgeous, Birthday Queen! 👑',
  'That pretty smile just lit up the whole booth ✨',
];

export const Stage5PhotoBooth: React.FC<Stage5PhotoBoothProps> = ({ onNext }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timersRef = useRef<number[]>([]);

  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'ready' | 'denied'>('idle');
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [developing, setDeveloping] = useState(false);

  const [promptIndex, setPromptIndex] = useState(0);
  const [capturedCaptionIdx, setCapturedCaptionIdx] = useState(0);

  const clearScheduledTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const scheduleTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const attachStreamToVideo = useCallback(async () => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
    try {
      await video.play();
    } catch {
      // Autoplay handled by muted + playsInline attributes
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('denied');
      return;
    }
    setCameraState('starting');
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      await attachStreamToVideo();
      setCameraState('ready');
    } catch {
      setCameraState('denied');
    }
  }, [attachStreamToVideo, stopCamera]);

  useEffect(() => {
    void startCamera();
    return () => {
      clearScheduledTimers();
      stopCamera();
    };
  }, [startCamera, stopCamera, clearScheduledTimers]);

  // Re-attach active MediaStream whenever returning from captured view to live viewfinder
  useEffect(() => {
    if (!capturedUrl && cameraState === 'ready') {
      void attachStreamToVideo();
    }
  }, [capturedUrl, cameraState, attachStreamToVideo]);

  // Rotate playful smile prompts automatically when live & idle
  useEffect(() => {
    if (cameraState !== 'ready' || capturedUrl || countdown !== null) return;
    const interval = window.setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % SMILE_PROMPTS.length);
    }, 4600);
    return () => window.clearInterval(interval);
  }, [cameraState, capturedUrl, countdown]);

  const drawPolaroidOverlay = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
    ctx.strokeStyle = '#fff9f2';
    ctx.lineWidth = 42;
    ctx.strokeRect(21, 21, w - 42, h - 42);
    ctx.fillStyle = '#fff9f2';
    ctx.fillRect(0, h - 134, w, 134);
    ctx.strokeStyle = 'rgba(183, 110, 121, 0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(42, 42, w - 84, h - 176);

    ctx.fillStyle = '#8b1e48';
    ctx.font = 'bold 44px "Dancing Script", cursive, serif';
    ctx.textAlign = 'center';
    ctx.fillText("Doha's 21st Birthday ❤️", w / 2, h - 56);

    ctx.fillStyle = 'rgba(139, 30, 72, 0.55)';
    ctx.font = 'bold 16px "Bricolage Grotesque", sans-serif';
    ctx.fillText('NOV 2026 · LOVE POLAROID', w / 2, h - 22);
    ctx.restore();
  };

  const compositeAndSave = (source: HTMLVideoElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = 900;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const srcW = source.videoWidth;
    const srcH = source.videoHeight;
    if (!srcW || !srcH) return;

    const side = Math.min(srcW, srcH);
    const sx = (srcW - side) / 2;
    const sy = (srcH - side) / 2;

    ctx.save();
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(source, sx, sy, side, side, 0, 0, size, size);
    ctx.restore();

    drawPolaroidOverlay(ctx, size, size);
    setCapturedCaptionIdx(Math.floor(Math.random() * CAPTURED_CAPTIONS.length));
    setDeveloping(true);
    setCapturedUrl(canvas.toDataURL('image/png'));
    scheduleTimer(() => setDeveloping(false), 1150);
    fireCelebrationConfetti();
  };

  const handleCapture = () => {
    if (!videoRef.current || cameraState !== 'ready' || countdown !== null) return;
    clearScheduledTimers();

    setCountdown(3);
    ambientAudio.playCameraCountdownBeep(false);

    scheduleTimer(() => {
      setCountdown(2);
      ambientAudio.playCameraCountdownBeep(false);
    }, 800);

    scheduleTimer(() => {
      setCountdown(1);
      ambientAudio.playCameraCountdownBeep(true);
    }, 1600);

    scheduleTimer(() => {
      setCountdown(null);
      setFlash(true);
      ambientAudio.playCameraShutter();
      scheduleTimer(() => setFlash(false), 280);
      if (videoRef.current) compositeAndSave(videoRef.current);
    }, 2400);
  };

  const handlePromptTap = () => {
    if (countdown !== null || capturedUrl) return;
    setPromptIndex((prev) => (prev + 1) % SMILE_PROMPTS.length);
  };

  const handleRetake = () => {
    clearScheduledTimers();
    setDeveloping(false);
    setCapturedUrl(null);
    const hasLiveTrack =
      streamRef.current?.getVideoTracks().some((t) => t.readyState === 'live') ?? false;
    if (cameraState !== 'ready' || !hasLiveTrack) {
      void startCamera();
    }
  };

  const handleDownload = () => {
    if (!capturedUrl) return;
    const link = document.createElement('a');
    link.href = capturedUrl;
    link.download = 'Doha-21st-Birthday-Polaroid.png';
    link.click();
  };

  const activePrompt = countdown !== null ? COUNTDOWN_LINES[countdown] : SMILE_PROMPTS[promptIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.5 }}
      className="w-full flex flex-col items-center text-center"
    >
      <Kicker className="text-[#ffb3d9]">Chapter 06 · Photo Studio</Kicker>
      <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-1 tracking-tight">
        Birthday{' '}
        <span className="font-serif italic font-normal text-[#ff8fab]">Photo Booth</span>
      </h2>

      <canvas ref={canvasRef} className="hidden" />

      {/* ================================================================ */}
      {/* REALISTIC PHYSICAL PHOTO BOOTH CONSOLE                           */}
      {/* ================================================================ */}
      <div className="mt-3.5 w-full max-w-[385px] rounded-[28px] p-[3px] bg-gradient-to-b from-[#e4c1d0]/45 via-[#8d5b7a]/35 to-[#2b1a33]/80 shadow-[0_30px_70px_-14px_rgba(0,0,0,0.85)]">
        <div className="relative rounded-[25px] bg-gradient-to-b from-[#2b2038] via-[#1c1528] to-[#110c1b] p-3 sm:p-3.5 overflow-hidden">
          {/* Corner brushed-metal rivets */}
          <span className="pointer-events-none absolute top-2.5 left-2.5 w-1.5 h-1.5 rounded-full bg-white/25 shadow-inner" />
          <span className="pointer-events-none absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-white/25 shadow-inner" />

          {/* 1. ILLUMINATED MARQUEE SIGN */}
          <div className="rounded-xl bg-[#0e0a16] border border-white/10 px-2.5 py-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={`lb-${i}`}
                  style={{ animationDelay: `${i * 0.25}s` }}
                  className={`${
                    countdown !== null ? 'bulb-fast' : 'bulb'
                  } w-2 h-2 rounded-full bg-[#ffe299]`}
                />
              ))}
            </div>

            <div className="flex-1 rounded-lg bg-gradient-to-r from-[#ffedf3] via-[#fff7eb] to-[#ffedf3] px-2.5 py-1 shadow-[0_0_16px_rgba(255,143,171,0.35),inset_0_1px_2px_rgba(255,255,255,0.9)]">
              <div className="flex items-center justify-center gap-1.5">
                <span className="font-display text-[11px] font-extrabold tracking-[0.22em] text-[#3a1226]">
                  PHOTO BOOTH
                </span>
                <span className="rounded bg-[#ff4f8b] px-1.5 py-[1px] text-[9px] font-extrabold tracking-wider text-white">
                  21
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={`rb-${i}`}
                  style={{ animationDelay: `${(i + 1) * 0.25}s` }}
                  className={`${
                    countdown !== null ? 'bulb-fast' : 'bulb'
                  } w-2 h-2 rounded-full bg-[#ffe299]`}
                />
              ))}
            </div>
          </div>

          {/* 2. HARDWARE OPTICS BAR (Tally LED · Camera Lens · Xenon Flash) */}
          <div className="mt-2.5 flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-black/45 border border-white/10 px-2 py-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    capturedUrl
                      ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                      : cameraState === 'ready'
                        ? 'bg-[#ff3b6b] shadow-[0_0_8px_#ff3b6b] animate-pulse'
                        : 'bg-amber-400'
                  }`}
                />
                <span className="font-mono text-[9px] font-bold tracking-widest text-white/75">
                  {capturedUrl ? 'PRINTED' : cameraState === 'ready' ? 'LIVE' : 'STANDBY'}
                </span>
              </div>
              <div className="hidden sm:grid grid-cols-3 gap-[2px] opacity-35">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <span key={idx} className="w-[2px] h-[2px] rounded-full bg-white" />
                ))}
              </div>
            </div>

            {/* Multi-Element Camera Lens */}
            <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-b from-[#554b66] to-[#1c1626] p-[3px] shadow-[0_4px_10px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.35)]">
              <div className="w-full h-full rounded-full bg-[#09070f] p-[4px] flex items-center justify-center border border-white/10">
                <div
                  className="relative w-full h-full rounded-full border border-white/15 overflow-hidden"
                  style={{
                    background:
                      'radial-gradient(circle at 32% 30%, rgba(120,210,255,0.45) 0%, rgba(255,95,162,0.28) 28%, #090714 68%, #020105 100%)',
                  }}
                >
                  <div className="absolute top-1 left-1.5 w-2 h-1 rounded-full bg-white/65 rotate-[-25deg] blur-[0.3px]" />
                  <div className="absolute inset-[7px] rounded-full bg-[#030207] border border-white/10" />
                </div>
              </div>
            </div>

            {/* Ribbed Xenon Flash Window */}
            <div className="relative flex items-center gap-1.5">
              <span className="font-mono text-[8px] font-bold tracking-wider text-white/40 uppercase">
                Flash
              </span>
              <div
                className={`relative w-12 h-5 rounded-md border transition-all duration-150 overflow-hidden ${
                  flash
                    ? 'bg-white border-white shadow-[0_0_28px_10px_rgba(255,248,220,0.95)]'
                    : 'bg-gradient-to-b from-[#3d364c] via-[#5c536e] to-[#2c2538] border-white/20 shadow-[inset_0_1px_3px_rgba(255,255,255,0.25)]'
                }`}
              >
                <div
                  className="w-full h-full opacity-45"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(90deg, transparent 0 3px, rgba(255,255,255,0.35) 3px 4px)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* 3. INTERACTIVE DIRECTOR PROMPT BAR */}
          {!capturedUrl && (
            <button
              type="button"
              onClick={handlePromptTap}
              title="Tap for another prompt"
              className="mt-2.5 w-full rounded-xl bg-[#0b0813] border border-[#ff8fab]/30 px-3 py-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.85)] cursor-pointer hover:border-[#ff8fab]/55 transition text-center"
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={activePrompt}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="text-xs sm:text-[13px] font-bold text-[#ffd6e6] leading-snug"
                >
                  {activePrompt}
                </motion.p>
              </AnimatePresence>
            </button>
          )}

          {/* 4. RECESSED VIEWFINDER SCREEN OR PRINTING DISPLAY */}
          {!capturedUrl ? (
            <div className="mt-2.5 rounded-2xl bg-[#07050c] p-1.5 shadow-[inset_0_4px_14px_rgba(0,0,0,0.95)] border border-white/10">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#0e0b18] ring-1 ring-white/10">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover -scale-x-100"
                />

                {/* Soft Studio Ring-Light Edge Illumination */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-xl"
                  style={{
                    boxShadow: 'inset 0 0 28px rgba(255, 214, 230, 0.2)',
                  }}
                />

                {/* Love Polaroid Live Frame Overlay */}
                <div className="pointer-events-none absolute inset-0 border-[10px] border-[#fff9f2]/92 flex flex-col justify-end">
                  <div className="bg-[#fff9f2]/95 py-1.5 text-center">
                    <span className="font-hand text-base font-bold text-[#8b1e48]">
                      Doha&apos;s 21st Birthday ❤️
                    </span>
                  </div>
                </div>

                {/* Camera Viewfinder Corner Reticles */}
                <div className="pointer-events-none absolute inset-4 bottom-12">
                  <span className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-white/55 rounded-tl-sm" />
                  <span className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-white/55 rounded-tr-sm" />
                  <span className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-white/55 rounded-bl-sm" />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-white/55 rounded-br-sm" />
                </div>

                {/* Subtle glass reflection streak */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-20"
                  style={{
                    background:
                      'linear-gradient(125deg, rgba(255,255,255,0.35) 0%, transparent 28%, transparent 100%)',
                  }}
                />

                {/* Camera HUD telemetry */}
                {cameraState === 'ready' && countdown === null && (
                  <div className="pointer-events-none absolute top-4 left-4 right-4 flex items-center justify-between font-mono text-[9px] font-semibold text-white/75 drop-shadow">
                    <span className="rounded bg-black/45 px-1.5 py-0.5 backdrop-blur-xs">
                      AF · FACE
                    </span>
                    <span className="rounded bg-black/45 px-1.5 py-0.5 backdrop-blur-xs">
                      LOVE POLAROID
                    </span>
                  </div>
                )}

                {/* Starting overlay */}
                {cameraState === 'starting' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#120d1d]/92 p-5 text-white/85 text-sm">
                    <Sparkles className="w-7 h-7 text-[#ff8fab] animate-spin mb-2" />
                    Warming up studio lens...
                  </div>
                )}

                {/* Denied / No-camera fallback */}
                {cameraState === 'denied' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#120d1d]/95 p-5 text-center">
                    <AlertCircle className="w-8 h-8 text-[#ffd166] mb-2" />
                    <p className="text-sm font-bold text-white mb-1">Camera permission needed</p>
                    <p className="text-xs text-white/70 mb-4 max-w-[230px]">
                      Allow camera access to take your Love Polaroid birthday photo!
                    </p>
                    <button
                      type="button"
                      onClick={() => void startCamera()}
                      className="rounded-full bg-[#ff5fa2] hover:brightness-110 px-4 py-2 text-xs font-bold text-white cursor-pointer transition"
                    >
                      Retry Camera
                    </button>
                  </div>
                )}

                {/* Countdown Overlay */}
                <AnimatePresence>
                  {countdown !== null && (
                    <motion.div
                      key={countdown}
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.7, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-black/30"
                    >
                      <div className="w-24 h-24 rounded-full border-2 border-[#ffd166]/80 flex items-center justify-center bg-black/35 backdrop-blur-[2px] shadow-[0_0_30px_rgba(255,209,102,0.45)]">
                        <span className="font-display text-6xl font-extrabold text-[#ffd166] drop-shadow-lg">
                          {countdown}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bright Xenon Flash */}
                {flash && <div className="absolute inset-0 bg-white z-30" />}
              </div>
            </div>
          ) : (
            <div className="mt-2.5 rounded-xl bg-[#0b0813] border border-emerald-400/25 px-3 py-2.5 text-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.85)]">
              <p className="text-xs font-extrabold tracking-wide text-[#ffd6e6]">
                {developing ? '🎞️ Developing your Love Polaroid…' : CAPTURED_CAPTIONS[capturedCaptionIdx]}
              </p>
            </div>
          )}

          {/* 5. TACTILE SHUTTER DECK */}
          {!capturedUrl && (
            <div className="mt-3 rounded-2xl bg-[#140e20]/90 border border-white/10 px-3 py-2.5 flex flex-col items-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <button
                type="button"
                onClick={handleCapture}
                disabled={cameraState !== 'ready' || countdown !== null}
                aria-label="Snap Birthday Photo"
                className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-b from-[#e9d8e0] via-[#b8a3b3] to-[#6a576b] p-[4px] shadow-[0_8px_20px_rgba(0,0,0,0.65),inset_0_1px_2px_rgba(255,255,255,0.8)] active:translate-y-0.5 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer transition"
              >
                <span className="w-full h-full rounded-full bg-[#191224] p-[3px] flex items-center justify-center">
                  <span className="w-full h-full rounded-full bg-gradient-to-b from-[#ff7aa8] via-[#ff3d7f] to-[#c9184a] flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.55)] group-hover:brightness-110 transition">
                    <Camera className="w-6 h-6 text-white drop-shadow" />
                  </span>
                </span>
              </button>

              <p className="text-[11px] font-semibold tracking-wide text-white/65">
                {countdown !== null
                  ? 'Hold that pretty smile… ✨'
                  : '💌 Love Polaroid · Press shutter to snap'}
              </p>
            </div>
          )}

          {/* 6. PHOTO DISPENSER SLOT */}
          <div className="mt-3 pt-1">
            <div className="mx-auto w-[86%] h-3 rounded-full bg-[#050309] border-b border-white/15 shadow-[inset_0_3px_6px_rgba(0,0,0,0.95)] flex items-center justify-center">
              <span className="h-[2px] w-3/4 rounded-full bg-white/5" />
            </div>
            <p className="mt-1 font-mono text-[8px] font-bold tracking-[0.28em] text-white/35 uppercase">
              ▼ Photo Print Slot ▼
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* DISPENSED PHYSICAL PHOTO PRINT + ACTIONS                         */}
      {/* ================================================================ */}
      <AnimatePresence>
        {capturedUrl && (
          <motion.div
            key="dispensed-print"
            initial={{ y: -70, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -30, opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 190, damping: 20 }}
            className="-mt-2 relative z-10 w-full max-w-[325px] flex flex-col items-center"
          >
            <div className="w-full rounded-b-[20px] rounded-t-md bg-[#fcf7f0] p-3 pb-4 shadow-[0_26px_55px_-12px_rgba(0,0,0,0.85),0_2px_0_rgba(255,255,255,0.6)_inset] border border-[#e6d8c8]">
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#1a1523] shadow-[inset_0_1px_4px_rgba(0,0,0,0.4)]">
                <img
                  src={capturedUrl}
                  alt="Doha's 21st Birthday Polaroid"
                  className="w-full h-full object-cover"
                />
                <motion.div
                  initial={{ opacity: 0.78 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 1.05, ease: 'easeOut' }}
                  className="pointer-events-none absolute inset-0 bg-[#1a121e]"
                />
              </div>

              <div className="mt-2.5 flex items-center justify-between px-1">
                <p className="font-hand text-xl font-bold text-[#4a182d] leading-tight">
                  Look how pretty you are! ❤️
                </p>
                <span className="font-mono text-[9px] font-bold tracking-widest text-[#9d6c7e] uppercase">
                  DOHA · 21
                </span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-4 flex flex-wrap items-center justify-center gap-2.5"
            >
              <button
                type="button"
                onClick={handleRetake}
                className="glass inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-white/20 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Retake
              </button>
              <PrimaryButton
                variant="gold"
                onClick={handleDownload}
                className="px-5 py-2.5 text-xs sm:text-sm"
              >
                <Download className="w-4 h-4" /> Save Photo
              </PrimaryButton>
              <PrimaryButton
                variant="pink"
                onClick={onNext}
                className="px-5 py-2.5 text-xs sm:text-sm"
              >
                Next <ArrowRight className="w-4 h-4" />
              </PrimaryButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!capturedUrl && (
        <button
          type="button"
          onClick={onNext}
          className="mt-3 text-xs font-bold text-white/60 hover:text-white underline cursor-pointer"
        >
          Skip for now
        </button>
      )}
    </motion.div>
  );
};
