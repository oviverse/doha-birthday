import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Download,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Heart,
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
  'Give the camera that gorgeous 21st birthday smile ✨',
  'No hiding, birthday queen — the lens loves you! 👑',
  'One pretty smile for me across the miles 📸',
  'Look at you glowing… press the red shutter button! 😘',
];

const COUNTDOWN_LINES: Record<number, string> = {
  3: "Come on Doha, don't be shy…",
  2: "You're so pretty, give us that smile!",
  1: 'HOLD IT… GORGEOUS! ✨',
};

const CAPTURED_CAPTIONS = [
  'See?! Told you — absolutely stunning! ❤️',
  'Looking gorgeous, Birthday Queen! 👑',
  'That pretty smile just lit up the whole room ✨',
];

const RAINBOW_STRIPES = ['#d81b70', '#e6392a', '#f7b718', '#46b749', '#1b9be0'];

export const Stage5PhotoBooth: React.FC<Stage5PhotoBoothProps> = ({ onNext }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timersRef = useRef<number[]>([]);

  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'ready' | 'denied'>('idle');
  const [denialCount, setDenialCount] = useState(0);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [developing, setDeveloping] = useState(false);

  const [selectedFilter, setSelectedFilter] = useState<FilterId>('natural');
  const [selectedFrame, setSelectedFrame] = useState<FrameId>('love');
  const [promptIndex, setPromptIndex] = useState(0);
  const [capturedCaptionIdx, setCapturedCaptionIdx] = useState(0);

  const activeFilterIdx = Math.max(
    0,
    FILTERS.findIndex((f) => f.id === selectedFilter)
  );
  const activeFilterObj = FILTERS[activeFilterIdx] ?? FILTERS[0];
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
    if (videoRef.current) {
      videoRef.current.srcObject = null;
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

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch {
          setDenialCount((prev) => prev + 1);
          setCameraState('denied');
          return;
        }
      }
    }

    if (stream) {
      streamRef.current = stream;
      await attachStreamToVideo();
      setCameraState('ready');
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
    scheduleTimer(() => setDeveloping(false), 1100);
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

  const handleShutterClick = () => {
    if (capturedUrl) return;
    if (cameraState === 'denied' || cameraState === 'idle') {
      void startCamera();
      return;
    }
    if (cameraState === 'ready' && countdown === null) {
      handleCapture();
    }
  };

  const handleCycleFilter = () => {
    if (capturedUrl || countdown !== null) return;
    triggerHaptic(6);
    const nextIdx = (activeFilterIdx + 1) % FILTERS.length;
    setSelectedFilter(FILTERS[nextIdx].id);
  };

  const activePrompt = capturedUrl
    ? developing
      ? '🎞️ Developing your Polaroid print…'
      : CAPTURED_CAPTIONS[capturedCaptionIdx]
    : cameraState === 'denied'
      ? 'Allow camera access to snap your birthday photo! 💖'
      : countdown !== null
        ? COUNTDOWN_LINES[countdown]
        : SMILE_PROMPTS[promptIndex];

  const isLensCompact = Boolean(capturedUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.5 }}
      className="w-full flex flex-col items-center text-center"
    >
      <Kicker className="text-[#ffb3d9]">Chapter 07 · Photo Studio</Kicker>
      <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-0.5 tracking-tight">
        Birthday{' '}
        <span className="font-serif italic font-normal text-[#ff8fab]">Photo Booth</span>
      </h2>

      <canvas ref={canvasRef} className="hidden" />

      {/* Interactive prompt banner */}
      <button
        type="button"
        onClick={() => {
          if (capturedUrl) return;
          if (cameraState === 'denied') {
            void startCamera();
          } else if (countdown === null) {
            setPromptIndex((prev) => (prev + 1) % SMILE_PROMPTS.length);
          }
        }}
        className="mt-1.5 w-full max-w-[360px] rounded-full bg-black/35 border border-white/15 backdrop-blur-md px-3.5 py-1 cursor-pointer hover:border-[#ff8fab]/55 transition text-center"
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={activePrompt}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-[11px] sm:text-xs font-bold text-[#ffd6e6] leading-tight truncate"
          >
            {activePrompt}
          </motion.p>
        </AnimatePresence>
      </button>

      {/* ============================================================ */}
      {/* POLAROID LAND CAMERA (Supercolor 1000 Inspired Chassis)       */}
      {/* ============================================================ */}
      <div className="relative mt-2.5 w-full max-w-[368px] sm:max-w-[396px] flex flex-col items-center select-none drop-shadow-[0_24px_38px_rgba(0,0,0,0.68)]">
        {/* Top dark viewfinder bridge notch */}
        <div
          aria-hidden
          className="w-[24%] h-2 rounded-t-md bg-gradient-to-b from-[#3d3d42] via-[#26262a] to-[#171719] border-t border-white/15 shadow-sm"
        />

        {/* UPPER CREAM BODY */}
        <div
          className="relative w-full rounded-t-[18px] px-2.5 sm:px-3.5 pt-2.5 sm:pt-3 pb-0 overflow-hidden"
          style={{
            background:
              'linear-gradient(180deg, #f5f0e3 0%, #ede6d3 52%, #e0d7bf 100%)',
            boxShadow:
              'inset 0 2px 2px rgba(255,255,255,0.85), inset 4px 0 10px rgba(170,155,125,0.18), inset -4px 0 10px rgba(170,155,125,0.18)',
          }}
        >
          {/* 3-Column Upper Deck: [Badge + Red Shutter] | [Center Lens Viewfinder] | [Flash + Dial] */}
          <div className="relative z-10 grid grid-cols-[64px_1fr_64px] sm:grid-cols-[74px_1fr_74px] items-center gap-1.5 sm:gap-2.5">
            {/* LEFT FLANK: Supercolor 1000 Badge + Red Shutter Button */}
            <div className="flex flex-col items-center justify-between self-stretch py-1">
              {/* Brushed metallic cream label */}
              <div
                className="w-full rounded-[5px] border border-[#c5baa0]/80 px-1 py-1 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.85),0_1px_2px_rgba(0,0,0,0.12)]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, rgba(0,0,0,0.025) 0px, rgba(0,0,0,0.025) 1px, transparent 1px, transparent 2px), linear-gradient(155deg, #f5eedb 0%, #e6dcc1 55%, #d9ceb0 100%)',
                }}
              >
                <p className="font-display text-[9px] sm:text-[10px] font-extrabold leading-none tracking-tight text-[#d92b1e]">
                  Supercolor
                </p>
                <p className="font-display text-[11px] sm:text-[12px] font-bold leading-tight tracking-wider text-[#1e1e22] mt-0.5">
                  1000
                </p>
              </div>

              {/* Iconic Red Shutter Button */}
              <div className="flex flex-col items-center mt-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9, y: 1.5 }}
                  onClick={handleShutterClick}
                  disabled={cameraState === 'starting' || countdown !== null || Boolean(capturedUrl)}
                  aria-label={
                    cameraState === 'ready' ? 'Snap Birthday Photo' : 'Enable Camera'
                  }
                  className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full p-[3px] bg-gradient-to-b from-[#c7bda4] to-[#efe8d5] shadow-[inset_0_2px_4px_rgba(0,0,0,0.38),0_1px_0_rgba(255,255,255,0.8)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                    !capturedUrl && cameraState === 'ready' && countdown === null
                      ? 'ring-2 ring-[#ff4d3d]/45 ring-offset-2 ring-offset-[#e8e0cc]'
                      : ''
                  } ${
                    !capturedUrl && cameraState === 'denied'
                      ? 'animate-pulse ring-2 ring-[#ff4f8b]/75 ring-offset-2 ring-offset-[#e8e0cc]'
                      : ''
                  }`}
                >
                  <span
                    className="block w-full h-full rounded-full"
                    style={{
                      background:
                        'radial-gradient(circle at 38% 28%, #ff7361 0%, #ea3826 48%, #b91c12 100%)',
                      boxShadow:
                        'inset 0 2px 3px rgba(255,255,255,0.45), inset 0 -3px 5px rgba(80,0,0,0.45), 0 3px 6px rgba(0,0,0,0.35)',
                    }}
                  />
                </motion.button>
                <span className="mt-1 font-display text-[8px] sm:text-[9px] font-extrabold tracking-[0.14em] uppercase text-[#5c5343]">
                  {capturedUrl
                    ? 'SNAPPED'
                    : countdown !== null
                      ? 'SMILE!'
                      : cameraState === 'ready'
                        ? 'SHUTTER'
                        : 'ALLOW'}
                </span>
              </div>
            </div>

            {/* CENTER: Iconic Squircle Black Lens Barrel + Live Camera Viewfinder */}
            <div className="flex flex-col items-center">
              <div
                className={`relative w-full mx-auto rounded-[22px] sm:rounded-[26px] p-[7px] sm:p-[8px] transition-all duration-300 ${
                  isLensCompact
                    ? 'max-w-[140px] sm:max-w-[155px]'
                    : 'max-w-[196px] sm:max-w-[214px]'
                }`}
                style={{
                  background:
                    'linear-gradient(145deg, #2e2e33 0%, #161619 52%, #0c0c0e 100%)',
                  boxShadow:
                    '0 10px 18px -6px rgba(0,0,0,0.48), inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.8)',
                }}
              >
                {/* Concentric ribbed lens ring */}
                <div
                  className="relative w-full aspect-square rounded-[16px] sm:rounded-[18px] p-[4px]"
                  style={{
                    backgroundImage:
                      'repeating-radial-gradient(circle at 50% 50%, #1d1d21 0px, #1d1d21 2px, #0d0d10 2px, #0d0d10 4px)',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.95)',
                  }}
                >
                  {/* Glass Optics / Live Video Aperture */}
                  <div className="relative w-full h-full rounded-[13px] sm:rounded-[15px] overflow-hidden bg-[#0a0c10] ring-1 ring-white/10">
                    {!capturedUrl ? (
                      <>
                        <video
                          ref={videoRef}
                          playsInline
                          muted
                          autoPlay
                          style={{ filter: activeFilterObj.css }}
                          className="w-full h-full object-cover -scale-x-100 transition-[filter] duration-200"
                        />

                        {/* Subtle curved lens glass reflection */}
                        <div
                          aria-hidden
                          className="pointer-events-none absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-white/18 via-white/5 to-transparent blur-[1px]"
                        />
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-0 shadow-[inset_0_0_18px_rgba(0,0,0,0.55)] rounded-[13px] sm:rounded-[15px]"
                        />

                        {/* Live HUD inside lens */}
                        {cameraState === 'ready' && countdown === null && (
                          <div className="pointer-events-none absolute top-2 left-2 right-2 flex items-center justify-between font-mono text-[8px] font-bold text-white/85">
                            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 backdrop-blur-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ff3d5a] animate-pulse" />
                              LIVE
                            </span>
                            <span className="rounded-full bg-black/60 px-1.5 py-0.5 backdrop-blur-sm">
                              {activeFilterObj.label.toUpperCase()}
                            </span>
                          </div>
                        )}

                        {cameraState === 'starting' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d1016]/92 p-3 text-white/85 text-[11px] z-20">
                            <Sparkles className="w-5 h-5 text-[#ff8fab] animate-spin mb-1.5" />
                            <span className="font-semibold leading-tight">
                              Warming up lens…
                            </span>
                          </div>
                        )}

                        {cameraState === 'denied' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#120d1d]/95 p-2.5 text-center z-20">
                            <div className="w-8 h-8 rounded-full bg-[#ff4f8b]/20 border border-[#ff4f8b]/40 flex items-center justify-center mb-1">
                              <Heart className="w-4 h-4 text-[#ff8fab] fill-[#ff8fab]/30 animate-pulse" />
                            </div>
                            <p className="text-[10px] sm:text-[11px] font-bold text-white leading-tight mb-1">
                              {denialCount > 1
                                ? "Don't be shy! 🥺"
                                : 'See your smile 💖'}
                            </p>
                            <button
                              type="button"
                              onClick={() => void startCamera()}
                              className="rounded-full bg-gradient-to-r from-[#ff5fa2] to-[#c9184a] hover:brightness-110 px-2.5 py-1 text-[10px] font-bold text-white shadow cursor-pointer inline-flex items-center gap-1 active:scale-95 transition"
                            >
                              <Camera className="w-3 h-3" />
                              <span>Allow</span>
                            </button>
                          </div>
                        )}

                        <AnimatePresence>
                          {countdown !== null && (
                            <motion.div
                              key={countdown}
                              initial={{ scale: 1.45, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.7, opacity: 0 }}
                              transition={{ duration: 0.22 }}
                              className="absolute inset-0 flex items-center justify-center bg-black/35 z-20"
                            >
                              <div className="w-16 h-16 rounded-full border-2 border-[#ffd166]/85 flex items-center justify-center bg-black/60">
                                <span className="font-display text-4xl font-extrabold text-[#ffd166]">
                                  {countdown}
                                </span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {flash && <div className="absolute inset-0 bg-white z-30" />}
                      </>
                    ) : (
                      /* Dark optical glass reflection state while photo is ejected */
                      <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-[#19202b] via-[#0e1218] to-[#060709]">
                        <div className="w-[54%] h-[54%] rounded-full border border-white/10 bg-gradient-to-br from-[#1f2937]/70 to-[#07090d] shadow-inner flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-white/15 blur-[1px] -translate-x-1.5 -translate-y-1.5" />
                        </div>
                        <div
                          aria-hidden
                          className="pointer-events-none absolute top-2 right-2 w-10 h-10 rounded-full bg-white/10 blur-[1px]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT FLANK: Flash Window + Exposure/Filter Dial */}
            <div className="flex flex-col items-center justify-between self-stretch py-1">
              {/* Square Viewfinder / Flash Window */}
              <div
                className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-[10px] flex items-center justify-center shadow-[0_3px_8px_rgba(0,0,0,0.32),inset_0_1px_1px_rgba(255,255,255,0.22)]"
                style={{
                  background:
                    'linear-gradient(155deg, #3c3c42 0%, #1f1f23 65%, #121215 100%)',
                }}
              >
                <div
                  className={`w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-[3px] transition-all duration-150 ${
                    flash
                      ? 'bg-white shadow-[0_0_24px_8px_rgba(255,255,255,0.95)] scale-110'
                      : 'bg-gradient-to-br from-[#ffffff] via-[#eef1f6] to-[#cfd5df] shadow-[inset_0_1px_2px_rgba(0,0,0,0.18)]'
                  }`}
                />
                {/* Diagonal glass sheen */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[10px] bg-gradient-to-br from-white/15 via-transparent to-transparent"
                />
              </div>

              {/* Circular Dark Exposure / Filter Dial */}
              <div className="flex flex-col items-center mt-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  animate={{ rotate: activeFilterIdx * 72 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  onClick={handleCycleFilter}
                  disabled={Boolean(capturedUrl) || countdown !== null}
                  title={`Filter: ${activeFilterObj.label} (tap to switch)`}
                  aria-label={`Cycle camera filter (current: ${activeFilterObj.label})`}
                  className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full p-[3px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background:
                      'linear-gradient(160deg, #38383d 0%, #1d1d21 60%, #101013 100%)',
                    boxShadow:
                      '0 4px 8px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.2)',
                  }}
                >
                  <span className="block w-full h-full rounded-full border border-white/10 bg-[#19191d] relative">
                    <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1.5 rounded-full bg-[#ffd166]" />
                  </span>
                </motion.button>
                <span className="mt-1 font-display text-[8px] sm:text-[9px] font-extrabold tracking-[0.12em] uppercase text-[#5c5343]">
                  {activeFilterObj.label}
                </span>
              </div>
            </div>
          </div>

          {/* Vertical Rainbow Stripe directly under the center lens */}
          <div className="relative flex justify-center h-4 sm:h-4.5 -mt-1.5">
            <div className="flex h-full w-[40px] sm:w-[46px] shadow-[0_0_1px_rgba(0,0,0,0.15)]">
              {RAINBOW_STRIPES.map((color) => (
                <div key={color} className="flex-1 h-full" style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
        </div>

        {/* ANGLED 3D CREAM SHELF / LEDGE */}
        <div
          className="relative w-[103%] h-4 sm:h-5 flex justify-center items-stretch border-t border-white/75"
          style={{
            background:
              'linear-gradient(180deg, #f5f0e2 0%, #e5dec9 55%, #c7bea4 100%)',
            clipPath: 'polygon(1.5% 0%, 98.5% 0%, 100% 100%, 0% 100%)',
            boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.12)',
          }}
        >
          <div
            className="flex h-full w-[44px] sm:w-[50px]"
            style={{ clipPath: 'polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)' }}
          >
            {RAINBOW_STRIPES.map((color) => (
              <div key={color} className="flex-1 h-full" style={{ backgroundColor: color }} />
            ))}
          </div>
        </div>

        {/* LOWER CHARCOAL BLACK POLAROID BASE */}
        <div
          className="relative z-20 w-[103%] rounded-b-[18px] px-3 sm:px-4 pt-2 pb-2.5 border-t border-white/10"
          style={{
            background:
              'linear-gradient(180deg, #323237 0%, #232327 45%, #161619 100%)',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -3px 8px rgba(0,0,0,0.65)',
          }}
        >
          {/* Brushed Metallic Nameplate Strip */}
          <div
            className="w-full rounded-[4px] border border-white/10 px-2.5 py-1 flex items-center justify-between shadow-[inset_0_1px_3px_rgba(0,0,0,0.65)]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 2px), linear-gradient(180deg, #2e2e33 0%, #202024 100%)',
            }}
          >
            <span className="font-display text-[9px] sm:text-[10px] font-semibold tracking-[0.14em] text-white/85 uppercase">
              POLAROID LAND CAMERA
            </span>
            <span className="font-mono text-[8px] sm:text-[9px] font-bold tracking-[0.14em] text-[#ff9ebb] uppercase">
              DOHA · 21
            </span>
          </div>

          {/* Photo Ejection Slot */}
          <div className="mt-2 mx-2 h-2.5 sm:h-3 rounded-full bg-[#050507] border-b border-white/15 shadow-[inset_0_3px_6px_rgba(0,0,0,0.95)]" />
        </div>
      </div>

      {/* ============================================================ */}
      {/* CONTROLS BELOW CAMERA (when taking photo)                    */}
      {/* ============================================================ */}
      {!capturedUrl && (
        <div className="mt-2.5 w-full max-w-[380px] space-y-1.5">
          {/* Filter Chips */}
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
                    : 'bg-white/10 text-white/70 hover:bg-white/18'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Polaroid Frame Theme Chips */}
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
                    : 'bg-white/10 text-white/70 hover:bg-white/18'
                }`}
              >
                {fr.label}
              </button>
            ))}
          </div>

          {/* Clear Snap Hint / Accessible Fallback Trigger */}
          <div className="pt-0.5 flex justify-center">
            <button
              type="button"
              onClick={handleShutterClick}
              disabled={cameraState === 'starting' || countdown !== null}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/16 border border-white/15 px-3.5 py-1 text-[10px] sm:text-[11px] font-bold text-white/90 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#e6392a]" />
              {cameraState === 'ready'
                ? countdown !== null
                  ? 'Smile for the camera…'
                  : 'Tap red shutter button to snap'
                : cameraState === 'starting'
                  ? 'Warming up camera…'
                  : 'Tap to allow camera'}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DISPENSED POLAROID PRINT (Ejects smoothly from bottom slot!)  */}
      {/* ============================================================ */}
      <AnimatePresence>
        {capturedUrl && (
          <div
            style={{ clipPath: 'inset(0px -40px -80px -40px)' }}
            className="-mt-2.5 relative z-10 w-full max-w-[265px] sm:max-w-[285px] pt-1 flex flex-col items-center"
          >
            <motion.div
              key="dispensed-print"
              initial={{ y: -150, opacity: 0.35, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -90, opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex flex-col items-center"
            >
              <div className="w-full rounded-b-[18px] rounded-t-sm bg-[#fcf7f0] p-2 pb-2.5 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.85)] border border-[#e6d8c8]">
                <div className="relative w-full aspect-square max-h-[28dvh] rounded-md overflow-hidden bg-[#1a1523]">
                  <img
                    src={capturedUrl}
                    alt="Doha's 21st Birthday Polaroid"
                    className="w-full h-full object-cover"
                  />
                  <motion.div
                    initial={{ opacity: 0.84 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 1.1, ease: 'easeOut' }}
                    className="pointer-events-none absolute inset-0 bg-[#18121c]"
                  />
                </div>

                <div className="mt-1.5 flex items-center justify-between px-1">
                  <p className="font-hand text-base sm:text-lg font-bold text-[#4a182d] leading-tight">
                    Look how pretty you are! ❤️
                  </p>
                  <span className="font-mono text-[9px] font-bold tracking-widest text-[#9d6c7e] uppercase">
                    DOHA · 21
                  </span>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-2.5 flex flex-wrap items-center justify-center gap-2 pb-1"
              >
                <button
                  type="button"
                  onClick={handleRetake}
                  className="glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-white hover:bg-white/20 cursor-pointer"
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
                  className="px-4 py-2 text-xs"
                >
                  Next <ArrowRight className="w-3.5 h-3.5" />
                </PrimaryButton>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
