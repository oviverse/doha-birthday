import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Download,
  RefreshCw,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { fireCelebrationConfetti } from '../../utils/confetti';
import { ambientAudio } from '../../utils/ambientAudio';
import { triggerHaptic } from '../../utils/haptics';
import { Kicker, PrimaryButton } from '../ui/Primitives';

interface Stage5PhotoBoothProps {
  onNext: () => void;
}

type FilterId = 'natural' | 'rosy' | 'golden' | 'vintage' | 'bw';
type FrameId = 'love' | 'queen' | 'starry';

const FILTERS: Array<{ id: FilterId; label: string; css: string }> = [
  { id: 'natural', label: 'Natural', css: 'none' },
  { id: 'rosy', label: 'Rosy', css: 'saturate(1.18) brightness(1.04) hue-rotate(-8deg)' },
  { id: 'golden', label: 'Golden', css: 'sepia(0.22) saturate(1.25) brightness(1.05)' },
  { id: 'vintage', label: 'Film', css: 'sepia(0.35) contrast(1.08) brightness(0.98)' },
  { id: 'bw', label: 'B&W', css: 'grayscale(1) contrast(1.12) brightness(1.04)' },
];

const FRAMES: Array<{ id: FrameId; label: string; badge: string; caption: string }> = [
  { id: 'love', label: 'Love ❤️', badge: 'NOV 2026 · LOVE POLAROID', caption: "Doha's 21st Birthday ❤️" },
  { id: 'queen', label: 'Queen 👑', badge: 'CHAPTER XXI · BIRTHDAY QUEEN', caption: '21 & Forever Radiant 👑' },
  { id: 'starry', label: 'Starry ✨', badge: 'MADE WITH LOVE BY ABHI', caption: 'Shine Bright, My Love ✨' },
];

const SMILE_PROMPTS = [
  "Smile, Doha! Come on, don't be shy… you are so cute! 💖",
  'Give the booth that gorgeous 21st birthday smile ✨',
  'No hiding, birthday queen — the camera loves you! 👑',
  'One pretty smile for me across the miles 📸',
  'Look at you glowing… strike a pose for me! 😘',
];

const COUNTDOWN_LINES: Record<number, string> = {
  3: "Come on Doha, don't be shy…",
  2: "You're so pretty, give us that smile!",
  1: 'HOLD IT… GORGEOUS! ✨',
};

const CAPTURED_CAPTIONS = [
  'See?! Told you — absolutely stunning! ❤️',
  'Looking gorgeous, Birthday Queen! 👑',
  'That pretty smile just lit up the whole booth ✨',
];

export const Stage5PhotoBooth: React.FC<Stage5PhotoBoothProps> = ({ onNext }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timersRef = useRef<number[]>([]);

  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'ready' | 'denied'>('idle');
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [developing, setDeveloping] = useState(false);

  const [selectedFilter, setSelectedFilter] = useState<FilterId>('natural');
  const [selectedFrame, setSelectedFrame] = useState<FrameId>('love');
  const [promptIndex, setPromptIndex] = useState(0);
  const [capturedCaptionIdx, setCapturedCaptionIdx] = useState(0);

  const activeFilterObj = FILTERS.find((f) => f.id === selectedFilter) ?? FILTERS[0];
  const activeFrameObj = FRAMES.find((f) => f.id === selectedFrame) ?? FRAMES[0];

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
      // Autoplay handled by muted + playsInline
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

  useEffect(() => {
    if (!capturedUrl && cameraState === 'ready') {
      void attachStreamToVideo();
    }
  }, [capturedUrl, cameraState, attachStreamToVideo]);

  useEffect(() => {
    if (cameraState !== 'ready' || capturedUrl || countdown !== null) return;
    const interval = window.setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % SMILE_PROMPTS.length);
    }, 4500);
    return () => window.clearInterval(interval);
  }, [cameraState, capturedUrl, countdown]);

  const drawPolaroidOverlay = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
    const bgPaper =
      selectedFrame === 'queen' ? '#fff7f0' : selectedFrame === 'starry' ? '#f7f4ff' : '#fff9f2';
    ctx.strokeStyle = bgPaper;
    ctx.lineWidth = 42;
    ctx.strokeRect(21, 21, w - 42, h - 42);
    ctx.fillStyle = bgPaper;
    ctx.fillRect(0, h - 134, w, 134);

    ctx.strokeStyle =
      selectedFrame === 'queen'
        ? 'rgba(217, 119, 6, 0.32)'
        : selectedFrame === 'starry'
          ? 'rgba(123, 47, 247, 0.25)'
          : 'rgba(183, 110, 121, 0.28)';
    ctx.lineWidth = 2;
    ctx.strokeRect(42, 42, w - 84, h - 176);

    // Subtle decorative corner accents
    ctx.font = '32px sans-serif';
    if (selectedFrame === 'love') {
      ctx.fillText('💖', 56, 82);
      ctx.fillText('🌸', w - 92, 82);
    } else if (selectedFrame === 'queen') {
      ctx.fillText('👑', 56, 82);
      ctx.fillText('✨', w - 92, 82);
    } else {
      ctx.fillText('✨', 56, 82);
      ctx.fillText('🌙', w - 92, 82);
    }

    ctx.fillStyle = selectedFrame === 'starry' ? '#4c1d95' : '#8b1e48';
    ctx.font = 'bold 42px "Dancing Script", cursive, serif';
    ctx.textAlign = 'center';
    ctx.fillText(activeFrameObj.caption, w / 2, h - 56);

    ctx.fillStyle = 'rgba(139, 30, 72, 0.58)';
    ctx.font = 'bold 15px "Bricolage Grotesque", sans-serif';
    ctx.fillText(activeFrameObj.badge, w / 2, h - 22);
    ctx.restore();
  };

  const renderSourceToPolaroid = (
    source: HTMLVideoElement | HTMLImageElement,
    srcW: number,
    srcH: number,
    mirror: boolean
  ) => {
    const canvas = canvasRef.current;
    if (!canvas || !srcW || !srcH) return;
    const size = 900;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const side = Math.min(srcW, srcH);
    const sx = (srcW - side) / 2;
    const sy = (srcH - side) / 2;

    ctx.save();
    ctx.filter = activeFilterObj.css;
    if (mirror) {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(source, sx, sy, side, side, 0, 0, size, size);
    ctx.restore();

    drawPolaroidOverlay(ctx, size, size);
    setCapturedCaptionIdx(Math.floor(Math.random() * CAPTURED_CAPTIONS.length));
    setDeveloping(true);
    setCapturedUrl(canvas.toDataURL('image/png'));
    scheduleTimer(() => setDeveloping(false), 1000);
    fireCelebrationConfetti();
  };

  const handleCapture = () => {
    if (!videoRef.current || cameraState !== 'ready' || countdown !== null) return;
    clearScheduledTimers();
    triggerHaptic(12);

    setCountdown(3);
    ambientAudio.playCameraCountdownBeep(false);

    scheduleTimer(() => {
      setCountdown(2);
      ambientAudio.playCameraCountdownBeep(false);
    }, 750);

    scheduleTimer(() => {
      setCountdown(1);
      ambientAudio.playCameraCountdownBeep(true);
    }, 1500);

    scheduleTimer(() => {
      setCountdown(null);
      setFlash(true);
      triggerHaptic([20, 30, 15]);
      ambientAudio.playCameraShutter();
      scheduleTimer(() => setFlash(false), 260);
      if (videoRef.current) {
        renderSourceToPolaroid(
          videoRef.current,
          videoRef.current.videoWidth,
          videoRef.current.videoHeight,
          true
        );
      }
    }, 2250);
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        ambientAudio.playCameraShutter();
        triggerHaptic(14);
        renderSourceToPolaroid(img, img.naturalWidth, img.naturalHeight, false);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRetake = () => {
    triggerHaptic(8);
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
    triggerHaptic(10);
    ambientAudio.playSparkleChime();
    const link = document.createElement('a');
    link.href = capturedUrl;
    link.download = 'Doha-21st-Birthday-Polaroid.png';
    link.click();
  };

  const activePrompt = countdown !== null ? COUNTDOWN_LINES[countdown] : SMILE_PROMPTS[promptIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.5 }}
      className="w-full flex flex-col items-center text-center"
    >
      <Kicker className="text-[#ffb3d9]">Chapter 06 · Photo Studio</Kicker>
      <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white mt-0.5 tracking-tight">
        Birthday{' '}
        <span className="font-serif italic font-normal text-[#ff8fab]">Photo Booth</span>
      </h2>

      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFilePick}
        className="hidden"
      />

      {/* COMPACT PHOTO BOOTH CONSOLE */}
      <div className="mt-2.5 w-full max-w-[365px] rounded-[26px] p-[2.5px] bg-gradient-to-b from-[#e4c1d0]/45 via-[#8d5b7a]/35 to-[#2b1a33]/80 shadow-[0_28px_65px_-14px_rgba(0,0,0,0.85)]">
        <div className="relative rounded-[23px] bg-gradient-to-b from-[#2b2038] via-[#1c1528] to-[#110c1b] p-2.5 sm:p-3 overflow-hidden">
          {/* 1. ILLUMINATED MARQUEE + OPTICS */}
          <div className="rounded-xl bg-[#0e0a16] border border-white/10 px-2.5 py-1.5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={`lb-${i}`}
                  style={{ animationDelay: `${i * 0.25}s` }}
                  className={`${
                    countdown !== null ? 'bulb-fast' : 'bulb'
                  } w-1.5 h-1.5 rounded-full bg-[#ffe299]`}
                />
              ))}
            </div>

            <div className="flex-1 rounded-lg bg-gradient-to-r from-[#ffedf3] via-[#fff7eb] to-[#ffedf3] px-2 py-0.5">
              <div className="flex items-center justify-center gap-1.5">
                <span className="font-display text-[10px] font-extrabold tracking-[0.2em] text-[#3a1226]">
                  PHOTO BOOTH
                </span>
                <span className="rounded bg-[#ff4f8b] px-1.5 py-[1px] text-[8px] font-extrabold tracking-wider text-white">
                  21
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={`rb-${i}`}
                  style={{ animationDelay: `${(i + 1) * 0.25}s` }}
                  className={`${
                    countdown !== null ? 'bulb-fast' : 'bulb'
                  } w-1.5 h-1.5 rounded-full bg-[#ffe299]`}
                />
              ))}
            </div>
          </div>

          {!capturedUrl ? (
            <>
              {/* Prompt bar */}
              <button
                type="button"
                onClick={() => {
                  if (countdown === null) setPromptIndex((prev) => (prev + 1) % SMILE_PROMPTS.length);
                }}
                className="mt-2 w-full rounded-xl bg-[#0b0813] border border-[#ff8fab]/30 px-2.5 py-1.5 cursor-pointer hover:border-[#ff8fab]/55 transition text-center"
              >
                <AnimatePresence mode="wait">
                  <motion.p
                    key={activePrompt}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.22 }}
                    className="text-[11px] sm:text-xs font-bold text-[#ffd6e6] leading-tight truncate"
                  >
                    {activePrompt}
                  </motion.p>
                </AnimatePresence>
              </button>

              {/* Recessed Viewfinder */}
              <div className="mt-2 mx-auto w-[min(66vw,250px,33dvh)] sm:w-[270px] rounded-2xl bg-[#07050c] p-1 shadow-[inset_0_4px_14px_rgba(0,0,0,0.95)] border border-white/10">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#0e0b18] ring-1 ring-white/10">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    style={{ filter: activeFilterObj.css }}
                    className="w-full h-full object-cover -scale-x-100 transition-[filter] duration-200"
                  />

                  {/* Live Polaroid Overlay */}
                  <div className="pointer-events-none absolute inset-0 border-[8px] border-[#fff9f2]/92 flex flex-col justify-end">
                    <div className="bg-[#fff9f2]/95 py-1 text-center">
                      <span className="font-hand text-sm font-bold text-[#8b1e48]">
                        {activeFrameObj.caption}
                      </span>
                    </div>
                  </div>

                  {/* Camera HUD */}
                  {cameraState === 'ready' && countdown === null && (
                    <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-center justify-between font-mono text-[8px] font-semibold text-white/75">
                      <span className="rounded bg-black/45 px-1.5 py-0.5 backdrop-blur-xs">
                        ● LIVE
                      </span>
                      <span className="rounded bg-black/45 px-1.5 py-0.5 backdrop-blur-xs">
                        {activeFilterObj.label.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {cameraState === 'starting' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#120d1d]/92 p-4 text-white/85 text-xs">
                      <Sparkles className="w-6 h-6 text-[#ff8fab] animate-spin mb-1.5" />
                      Warming up studio lens...
                    </div>
                  )}

                  {cameraState === 'denied' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#120d1d]/95 p-4 text-center">
                      <AlertCircle className="w-7 h-7 text-[#ffd166] mb-1.5" />
                      <p className="text-xs font-bold text-white mb-1">Camera permission needed</p>
                      <p className="text-[11px] text-white/70 mb-3">
                        Allow camera or pick a photo from your gallery!
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => void startCamera()}
                          className="rounded-full bg-[#ff5fa2] px-3.5 py-1.5 text-[11px] font-bold text-white cursor-pointer"
                        >
                          Retry
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-full bg-white/15 border border-white/20 px-3.5 py-1.5 text-[11px] font-bold text-white cursor-pointer inline-flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" /> Choose Photo
                        </button>
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {countdown !== null && (
                      <motion.div
                        key={countdown}
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.7, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/30"
                      >
                        <div className="w-20 h-20 rounded-full border-2 border-[#ffd166]/80 flex items-center justify-center bg-black/35 backdrop-blur-[2px]">
                          <span className="font-display text-5xl font-extrabold text-[#ffd166]">
                            {countdown}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {flash && <div className="absolute inset-0 bg-white z-30" />}
                </div>
              </div>

              {/* Filter & Frame Picker Strip */}
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-center gap-1 overflow-x-auto no-scrollbar">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic(5);
                        setSelectedFilter(f.id);
                      }}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition cursor-pointer ${
                        selectedFilter === f.id
                          ? 'bg-[#ff5fa2] text-white shadow'
                          : 'bg-white/8 text-white/65 hover:bg-white/15'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  {FRAMES.map((fr) => (
                    <button
                      key={fr.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic(5);
                        setSelectedFrame(fr.id);
                      }}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition cursor-pointer ${
                        selectedFrame === fr.id
                          ? 'bg-[#ffd166] text-[#2a0a26]'
                          : 'bg-white/8 text-white/65 hover:bg-white/15'
                      }`}
                    >
                      {fr.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tactile Shutter Deck */}
              <div className="mt-2.5 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Pick photo from gallery"
                  className="glass rounded-full px-3 py-2 text-[11px] font-bold text-white/80 hover:bg-white/15 cursor-pointer inline-flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" /> Gallery
                </button>

                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={cameraState !== 'ready' || countdown !== null}
                  aria-label="Snap Birthday Photo"
                  className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-b from-[#e9d8e0] via-[#b8a3b3] to-[#6a576b] p-[3.5px] shadow-[0_8px_20px_rgba(0,0,0,0.65)] active:translate-y-0.5 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer transition"
                >
                  <span className="w-full h-full rounded-full bg-[#191224] p-[3px] flex items-center justify-center">
                    <span className="w-full h-full rounded-full bg-gradient-to-b from-[#ff7aa8] via-[#ff3d7f] to-[#c9184a] flex items-center justify-center group-hover:brightness-110 transition">
                      <Camera className="w-5 h-5 text-white drop-shadow" />
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onNext}
                  className="glass rounded-full px-3 py-2 text-[11px] font-bold text-white/75 hover:text-white cursor-pointer"
                >
                  Skip ›
                </button>
              </div>
            </>
          ) : (
            <div className="mt-2 rounded-xl bg-[#0b0813] border border-emerald-400/25 px-3 py-2 text-center">
              <p className="text-xs font-extrabold tracking-wide text-[#ffd6e6]">
                {developing ? '🎞️ Developing your Love Polaroid…' : CAPTURED_CAPTIONS[capturedCaptionIdx]}
              </p>
            </div>
          )}

          {/* Photo Dispenser Slot */}
          <div className="mt-2.5 pt-0.5">
            <div className="mx-auto w-[86%] h-2.5 rounded-full bg-[#050309] border-b border-white/15 shadow-[inset_0_3px_6px_rgba(0,0,0,0.95)]" />
          </div>
        </div>
      </div>

      {/* DISPENSED POLAROID PRINT (slides out cleanly with zero page overflow) */}
      <AnimatePresence>
        {capturedUrl && (
          <motion.div
            key="dispensed-print"
            initial={{ y: -65, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -30, opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 190, damping: 20 }}
            className="-mt-2 relative z-10 w-full max-w-[285px] sm:max-w-[310px] flex flex-col items-center"
          >
            <div className="w-full rounded-b-[20px] rounded-t-md bg-[#fcf7f0] p-2.5 pb-3 shadow-[0_26px_55px_-12px_rgba(0,0,0,0.85)] border border-[#e6d8c8]">
              <div className="relative w-full aspect-square max-h-[34dvh] rounded-lg overflow-hidden bg-[#1a1523]">
                <img
                  src={capturedUrl}
                  alt="Doha's 21st Birthday Polaroid"
                  className="w-full h-full object-cover"
                />
                <motion.div
                  initial={{ opacity: 0.78 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 1.0, ease: 'easeOut' }}
                  className="pointer-events-none absolute inset-0 bg-[#1a121e]"
                />
              </div>

              <div className="mt-2 flex items-center justify-between px-1">
                <p className="font-hand text-lg font-bold text-[#4a182d] leading-tight">
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
              transition={{ delay: 0.2 }}
              className="mt-3 flex flex-wrap items-center justify-center gap-2"
            >
              <button
                type="button"
                onClick={handleRetake}
                className="glass inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white hover:bg-white/20 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retake
              </button>
              <PrimaryButton
                variant="gold"
                onClick={handleDownload}
                className="px-4 py-2 text-xs"
              >
                <Download className="w-3.5 h-3.5" /> Save Photo
              </PrimaryButton>
              <PrimaryButton
                variant="pink"
                onClick={() => {
                  triggerHaptic(12);
                  onNext();
                }}
                className="px-5 py-2 text-xs"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </PrimaryButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
