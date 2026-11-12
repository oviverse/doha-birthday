import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight, Check, Heart } from 'lucide-react';
import { LOVE_REASONS, type LoveReason } from '../../data/birthdayContent';
import { ambientAudio } from '../../utils/ambientAudio';
import { triggerHaptic } from '../../utils/haptics';
import { fireCelebrationConfetti, fireSparkleBurst } from '../../utils/confetti';
import { PrimaryButton } from '../ui/Primitives';

interface Stage4ReasonsLoveProps {
  onNext: () => void;
}

interface ScratchFlake {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  rot: number;
  w: number;
  h: number;
  color: string;
}

const FLAKE_COLORS = ['#fbe3b5', '#e4b26b', '#f2b5bd', '#fff6e3', '#c88d55'];
const REVEAL_THRESHOLD_PCT = 40;

const REASON_HALO_COLORS = [
  'radial-gradient(circle at 50% 45%, rgba(255, 110, 155, 0.36), rgba(255, 165, 115, 0.16), transparent 72%)',
  'radial-gradient(circle at 50% 45%, rgba(185, 120, 255, 0.34), rgba(255, 130, 190, 0.16), transparent 72%)',
  'radial-gradient(circle at 50% 45%, rgba(135, 125, 255, 0.34), rgba(255, 150, 200, 0.14), transparent 72%)',
  'radial-gradient(circle at 50% 45%, rgba(255, 95, 165, 0.36), rgba(215, 110, 255, 0.16), transparent 72%)',
  'radial-gradient(circle at 50% 45%, rgba(255, 125, 155, 0.38), rgba(255, 200, 125, 0.16), transparent 72%)',
  'radial-gradient(circle at 50% 45%, rgba(255, 185, 125, 0.36), rgba(255, 105, 175, 0.18), transparent 72%)',
];

let cachedBrushedMetalTile: HTMLCanvasElement | null = null;

function getBrushedMetalTile(): HTMLCanvasElement {
  if (cachedBrushedMetalTile) return cachedBrushedMetalTile;
  const tile = document.createElement('canvas');
  tile.width = 160;
  tile.height = 160;
  const tctx = tile.getContext('2d');
  if (tctx) {
    // Horizontal anisotropic brushed metal streaks
    for (let y = 0; y < 160; y++) {
      const seed = (y * 97 + 31) % 100;
      const isLight = seed > 48;
      const alpha = isLight ? ((seed - 48) / 52) * 0.09 : ((48 - seed) / 48) * 0.06;
      tctx.fillStyle = isLight ? `rgba(255,250,240,${alpha})` : `rgba(60,24,12,${alpha})`;
      tctx.fillRect(0, y, 160, 1);
    }
    // Fine metallic grain specks
    for (let i = 0; i < 640; i++) {
      const x = (i * 73 + 17) % 160;
      const y = (i * 41 + 29) % 160;
      const len = 2 + (i % 6);
      tctx.fillStyle =
        i % 2 === 0 ? 'rgba(255, 252, 244, 0.08)' : 'rgba(65, 28, 16, 0.05)';
      tctx.fillRect(x, y, len, 1);
    }
  }
  cachedBrushedMetalTile = tile;
  return tile;
}

function drawVectorHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) {
  ctx.beginPath();
  const topY = cy - size * 0.3;
  ctx.moveTo(cx, cy + size * 0.48);
  ctx.bezierCurveTo(
    cx - size * 0.68,
    cy + size * 0.04,
    cx - size * 0.62,
    topY - size * 0.34,
    cx,
    topY + size * 0.08
  );
  ctx.bezierCurveTo(
    cx + size * 0.62,
    topY - size * 0.34,
    cx + size * 0.68,
    cy + size * 0.04,
    cx,
    cy + size * 0.48
  );
  ctx.closePath();
}

interface ScratchReasonCardProps {
  reason: LoveReason;
  index: number;
  total: number;
  isRevealed: boolean;
  onReveal: () => void;
  onSwipeCard?: (dir: number) => void;
}

interface HeartPop {
  id: number;
  x: number;
  y: number;
}

const ScratchReasonCard: React.FC<ScratchReasonCardProps> = ({
  reason,
  index,
  total,
  isRevealed,
  onReveal,
  onSwipeCard,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const strokeCountRef = useRef(0);
  const revealedRef = useRef(isRevealed);
  const canvasSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const [flakes, setFlakes] = useState<ScratchFlake[]>([]);
  const [glintPos, setGlintPos] = useState<{ x: number; y: number } | null>(null);
  const [scratchPct, setScratchPct] = useState(0);
  const [hearts, setHearts] = useState<HeartPop[]>([]);

  useEffect(() => {
    revealedRef.current = isRevealed;
    if (isRevealed) {
      setGlintPos(null);
      setScratchPct(100);
    } else {
      setScratchPct(0);
    }
  }, [isRevealed, reason.id]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || reason.mediaType !== 'video') return;
    vid.muted = true;
    vid.currentTime = 0;
    void vid.play().catch(() => {});
  }, [reason.id, reason.mediaType]);

  const initCanvas = useCallback(
    (force = false) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container || isRevealed) return;

      const rect = container.getBoundingClientRect();
      const w = Math.max(140, Math.round(rect.width));
      const h = Math.max(240, Math.round(rect.height));

      if (
        !force &&
        canvasSizeRef.current.w === w &&
        canvasSizeRef.current.h === h &&
        strokeCountRef.current > 0
      ) {
        return;
      }

      canvasSizeRef.current = { w, h };
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';

      // 1. Deep champagne & rose-gold metallic foil base
      const baseGrad = ctx.createLinearGradient(0, 0, w, h);
      baseGrad.addColorStop(0, '#d8a48f');
      baseGrad.addColorStop(0.18, '#f4d5b6');
      baseGrad.addColorStop(0.38, '#c98e75');
      baseGrad.addColorStop(0.56, '#fae3c6');
      baseGrad.addColorStop(0.76, '#d99b89');
      baseGrad.addColorStop(1, '#b8766c');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Soft diagonal optical metallic sheen (feathered, never harsh stripes)
      const sheenGrad = ctx.createLinearGradient(w * 0.1, 0, w * 0.9, h);
      sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      sheenGrad.addColorStop(0.32, 'rgba(255, 248, 236, 0.24)');
      sheenGrad.addColorStop(0.45, 'rgba(255, 255, 255, 0.04)');
      sheenGrad.addColorStop(0.66, 'rgba(255, 244, 224, 0.22)');
      sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = sheenGrad;
      ctx.fillRect(0, 0, w, h);

      // 3. Tiled procedural brushed-metal grain
      const pattern = ctx.createPattern(getBrushedMetalTile(), 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, w, h);
      }

      // 4. Subtle edge vignette on the foil for realistic cardstock depth
      const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, h * 0.72);
      vig.addColorStop(0, 'rgba(255, 250, 242, 0.08)');
      vig.addColorStop(1, 'rgba(56, 18, 22, 0.22)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      // 5. Minimal embossed 1px hairline border
      ctx.strokeStyle = 'rgba(255, 250, 240, 0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(14.5, 14.5, w - 29, h - 29);
      ctx.strokeStyle = 'rgba(72, 26, 22, 0.16)';
      ctx.strokeRect(15.5, 15.5, w - 31, h - 31);

      // 6. Subtle stamped metallic medallion & editorial typography
      const cx = w / 2;
      const cy = h / 2 - 14;
      const ringR = Math.min(44, w * 0.16);

      // Medallion outer deboss ring
      ctx.strokeStyle = 'rgba(75, 26, 26, 0.22)';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 250, 242, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy + 1, ringR, 0, Math.PI * 2);
      ctx.stroke();

      // Debossed vector heart (light highlight below + bronze fill)
      ctx.fillStyle = 'rgba(255, 250, 240, 0.48)';
      drawVectorHeart(ctx, cx, cy + 2.5, ringR * 0.78);
      ctx.fill();

      ctx.fillStyle = 'rgba(76, 26, 28, 0.62)';
      drawVectorHeart(ctx, cx, cy + 1, ringR * 0.78);
      ctx.fill();

      ctx.textAlign = 'center';

      // Top micro-label
      ctx.fillStyle = 'rgba(72, 24, 26, 0.65)';
      ctx.font = '700 10px "Bricolage Grotesque", sans-serif';
      ctx.fillText(`REASON  0${index + 1}  /  0${total}`, cx, 42);

      // Center editorial prompt (light bevel + dark bronze text)
      ctx.fillStyle = 'rgba(255, 250, 242, 0.45)';
      ctx.font = 'italic 26px "Instrument Serif", Georgia, serif';
      ctx.fillText('Scratch to Reveal', cx, cy + ringR + 35);

      ctx.fillStyle = 'rgba(64, 20, 24, 0.85)';
      ctx.fillText('Scratch to Reveal', cx, cy + ringR + 34);

      ctx.fillStyle = 'rgba(72, 24, 26, 0.62)';
      ctx.font = '600 11px "Bricolage Grotesque", sans-serif';
      ctx.fillText('Rub gently across the foil', cx, cy + ringR + 58);

      strokeCountRef.current = 0;
    },
    [index, isRevealed, total]
  );

  useEffect(() => {
    initCanvas(true);
    let active = true;
    void document.fonts?.ready.then(() => {
      if (active && strokeCountRef.current === 0 && !revealedRef.current) {
        initCanvas(true);
      }
    });
    return () => {
      active = false;
    };
  }, [initCanvas, reason.id]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (strokeCountRef.current === 0 && !revealedRef.current) {
        initCanvas(true);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [initCanvas]);

  const spawnFlakes = (x: number, y: number) => {
    const newFlakes: ScratchFlake[] = Array.from({ length: 3 }, () => ({
      id: Date.now() + Math.random(),
      x,
      y,
      dx: (Math.random() - 0.5) * 42,
      dy: Math.random() * 28 + 10,
      rot: (Math.random() - 0.5) * 260,
      w: 3 + Math.random() * 4.5,
      h: 2 + Math.random() * 2.5,
      color: FLAKE_COLORS[Math.floor(Math.random() * FLAKE_COLORS.length)],
    }));

    setFlakes((prev) => [...prev.slice(-18), ...newFlakes]);
    window.setTimeout(() => {
      const ids = new Set(newFlakes.map((f) => f.id));
      setFlakes((prev) => prev.filter((f) => !ids.has(f.id)));
    }, 520);
  };

  const checkProgress = () => {
    const canvas = canvasRef.current;
    if (!canvas || revealedRef.current) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;
    let cleared = 0;
    let sampled = 0;
    const step = 16 * 4;
    for (let i = 3; i < data.length; i += step) {
      sampled++;
      if (data[i] < 40) cleared++;
    }

    const pct = Math.min(100, Math.round((cleared / Math.max(1, sampled)) * 100));
    setScratchPct(Math.min(100, Math.round((pct / REVEAL_THRESHOLD_PCT) * 100)));
    if (pct >= REVEAL_THRESHOLD_PCT && !revealedRef.current) {
      revealedRef.current = true;
      setGlintPos(null);
      setScratchPct(100);
      triggerHaptic([14, 24, 14]);
      ambientAudio.playSparkleChime();
      fireSparkleBurst();
      onReveal();
    }
  };

  const getLocalPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const stampOrganicBrush = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    baseRadius: number,
    seed: number
  ) => {
    ctx.beginPath();
    ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6 + (seed % 9) * 0.37;
      const dist = baseRadius * 0.52 + ((i * 5 + seed) % 7);
      const r = baseRadius * 0.28 + ((i + seed) % 4);
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const scratchAt = (pt: { x: number; y: number }, prev: { x: number; y: number } | null) => {
    const canvas = canvasRef.current;
    if (!canvas || revealedRef.current) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const points: { x: number; y: number }[] = [];
    if (prev) {
      const dx = pt.x - prev.x;
      const dy = pt.y - prev.y;
      const distance = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.ceil(distance / 8));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        points.push({ x: prev.x + dx * t, y: prev.y + dy * t });
      }
    } else {
      points.push(pt);
    }

    // 1. Physical raised/tarnished foil rim along the scratched edge
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(62, 22, 14, 0.26)';
    points.forEach((p, idx) => stampOrganicBrush(ctx, p.x, p.y, 24, strokeCountRef.current + idx));
    ctx.restore();

    // 2. Punch clean organic opening through the foil
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000000';
    points.forEach((p, idx) => stampOrganicBrush(ctx, p.x, p.y, 20, strokeCountRef.current + idx));
    ctx.restore();

    if (strokeCountRef.current % 2 === 0) {
      spawnFlakes(pt.x, pt.y);
    }
    ambientAudio.playScratchSound();
    strokeCountRef.current++;
    if (strokeCountRef.current % 5 === 0) {
      checkProgress();
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (revealedRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = getLocalPoint(e);
    lastPointRef.current = pt;
    setGlintPos(pt);
    scratchAt(pt, null);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (revealedRef.current) return;
    const pt = getLocalPoint(e);
    setGlintPos(pt);
    if (!isDrawingRef.current) return;
    scratchAt(pt, lastPointRef.current);
    lastPointRef.current = pt;
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;
    checkProgress();
  };

  const handlePointerLeave = () => {
    if (!isDrawingRef.current) {
      setGlintPos(null);
    }
  };

  const handleRevealedPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isRevealed) return;
    swipeStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleRevealedPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isRevealed || !swipeStartRef.current) return;
    const dx = e.clientX - swipeStartRef.current.x;
    const dy = e.clientY - swipeStartRef.current.y;
    swipeStartRef.current = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      onSwipeCard?.(dx < 0 ? 1 : -1);
    }
  };

  const handleRevealedDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRevealed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    triggerHaptic(10);
    ambientAudio.playSoftTap(1.2);
    setHearts((prev) => [...prev.slice(-6), { id, x, y }]);
    window.setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 850);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handleRevealedPointerDown}
      onPointerUp={handleRevealedPointerUp}
      onDoubleClick={handleRevealedDoubleClick}
      className="relative h-full w-full rounded-[28px] overflow-hidden bg-[#0a040c] ring-1 ring-white/25 shadow-[0_36px_95px_-12px_rgba(0,0,0,0.95)] select-none"
    >
      {/* Pure, gallery-grade 9:16 portrait memory underneath */}
      <div className="relative h-full w-full overflow-hidden">
        {reason.mediaType === 'image' ? (
          <motion.img
            src={reason.mediaSrc}
            alt={reason.title}
            draggable={false}
            animate={isRevealed ? { scale: [1, 1.045] } : { scale: 1 }}
            transition={{ duration: 8, ease: 'easeOut' }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            src={reason.mediaSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            controlsList="nodownload noplaybackrate"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Subtle optical inner shadow for depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/15"
          style={{ boxShadow: 'inset 0 0 42px rgba(0, 0, 0, 0.25)' }}
        />

        {/* Whisper-minimal top-right status indicator + live scratch progress */}
        <div className="relative z-10 flex items-center justify-between px-3.5 pt-3.5">
          {!isRevealed && scratchPct > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#ffd166] backdrop-blur-md ring-1 ring-white/15">
              {scratchPct}%
            </span>
          ) : (
            <span />
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-white/90 backdrop-blur-md ring-1 ring-white/15">
            {isRevealed ? (
              <>
                <Check className="w-3 h-3 text-[#4ade80]" /> 0{index + 1} / 0{total}
              </>
            ) : (
              `0${index + 1} / 0${total}`
            )}
          </span>
        </div>

        {/* Floating double-tap hearts */}
        <AnimatePresence>
          {hearts.map((h) => (
            <motion.div
              key={h.id}
              initial={{ x: h.x - 16, y: h.y - 16, scale: 0.4, opacity: 1 }}
              animate={{ y: h.y - 70, scale: 1.4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.78, ease: 'easeOut' }}
              className="pointer-events-none absolute z-40"
            >
              <Heart className="w-8 h-8 text-[#ff4f8b] fill-[#ff4f8b] drop-shadow-[0_4px_12px_rgba(255,79,139,0.75)]" />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Clean, airy bottom editorial scrim keeping her face/video clear */}
        <motion.div
          initial={false}
          animate={{ opacity: isRevealed ? 1 : 0.9, y: isRevealed ? 0 : 4 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{
            background:
              'linear-gradient(to top, rgba(8, 2, 10, 0.88) 0%, rgba(8, 2, 10, 0.56) 55%, rgba(8, 2, 10, 0.12) 85%, transparent 100%)',
          }}
          className="absolute inset-x-0 bottom-0 z-10 px-5 pb-5 pt-16 text-left"
        >
          <span className="block text-[9.5px] font-bold uppercase tracking-[0.26em] text-[#ffd166]/90 mb-1">
            Reason 0{index + 1}
          </span>
          <h3 className="font-serif italic text-2xl sm:text-[26px] text-white leading-[1.1] tracking-tight drop-shadow-sm">
            {reason.title}
          </h3>
          <p className="mt-1.5 text-[12.5px] sm:text-[13px] leading-relaxed text-white/85 drop-shadow-sm">
            {reason.message}
          </p>
        </motion.div>
      </div>

      {/* Scratchable Brushed Metallic Foil Overlay */}
      <AnimatePresence>
        {!isRevealed && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.48, ease: 'easeOut' }}
            className="absolute inset-0 z-20"
          >
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerLeave}
              className="w-full h-full touch-none cursor-crosshair block"
            />

            {/* Dynamic specular metallic sheen following finger/cursor */}
            {glintPos && (
              <div
                aria-hidden
                style={{
                  background: `radial-gradient(circle 150px at ${glintPos.x}px ${glintPos.y}px, rgba(255, 252, 240, 0.34), transparent 72%)`,
                }}
                className="pointer-events-none absolute inset-0 mix-blend-overlay"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flying Metallic Foil Shavings */}
      <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
        {flakes.map((flake) => (
          <motion.span
            key={flake.id}
            initial={{ x: flake.x, y: flake.y, scale: 1, rotate: 0, opacity: 0.95 }}
            animate={{
              x: flake.x + flake.dx,
              y: flake.y + flake.dy,
              scale: 0.3,
              rotate: flake.rot,
              opacity: 0,
            }}
            transition={{ duration: 0.48, ease: 'easeOut' }}
            style={{
              backgroundColor: flake.color,
              width: flake.w,
              height: flake.h,
            }}
            className="absolute rounded-[1px] shadow-sm"
          />
        ))}
      </div>
    </div>
  );
};

export const Stage4ReasonsLove: React.FC<Stage4ReasonsLoveProps> = ({ onNext }) => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [seenIds, setSeenIds] = useState<Record<number, boolean>>({});
  const [celebratedAll, setCelebratedAll] = useState(false);

  const current = LOVE_REASONS[index];
  const seenCount = Object.keys(seenIds).length;
  const allSeen = seenCount >= LOVE_REASONS.length;
  const isCurrentRevealed = !!seenIds[current.id];

  useEffect(() => {
    LOVE_REASONS.forEach((reason) => {
      if (reason.mediaType === 'image') {
        const img = new Image();
        img.src = reason.mediaSrc;
        void img.decode?.().catch(() => {});
      }
    });
  }, []);

  const handleRevealCurrent = () => {
    setSeenIds((prev) => {
      if (prev[current.id]) return prev;
      const updated = { ...prev, [current.id]: true };
      if (Object.keys(updated).length === LOVE_REASONS.length && !celebratedAll) {
        setCelebratedAll(true);
        window.setTimeout(() => fireCelebrationConfetti(), 300);
      }
      return updated;
    });
  };

  const goCard = (dir: number) => {
    setDirection(dir);
    setIndex((prev) => (prev + dir + LOVE_REASONS.length) % LOVE_REASONS.length);
  };

  const goToNextUnseen = () => {
    const nextUnseenIdx = LOVE_REASONS.findIndex((r, i) => i !== index && !seenIds[r.id]);
    if (nextUnseenIdx !== -1) {
      setDirection(nextUnseenIdx > index ? 1 : -1);
      setIndex(nextUnseenIdx);
    } else {
      goCard(1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.65 }}
      className="relative w-full flex flex-col items-center text-center"
    >
      {/* Whisper-quiet title above the focal 9:16 card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.55 }}
        className="mb-2 flex flex-col items-center"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-white/45">
          Chapter 05 · {seenCount} / {LOVE_REASONS.length} Revealed
        </span>
        <h2 className="font-serif italic text-2xl sm:text-3xl text-white/95 tracking-tight mt-0.5">
          Reasons I Love You
        </h2>
      </motion.div>

      {/* Large Focal 9:16 Cinema Scratch Card */}
      <div
        style={{ height: 'min(58dvh, 520px, calc(84vw * 16 / 9))' }}
        className="relative aspect-[9/16] flex items-center justify-center"
      >
        {/* Ambient cinema halo radiating onto the faded dark backdrop */}
        <motion.div
          key={`halo-${current.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          aria-hidden
          style={{ background: REASON_HALO_COLORS[index % REASON_HALO_COLORS.length] }}
          className="pointer-events-none absolute -inset-16 -z-10 blur-3xl"
        />

        {/* Subtle smoked glass stack edges behind card */}
        <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-white/[0.04] border border-white/10 rotate-2 scale-[0.97]" />
        <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-white/[0.03] border border-white/10 -rotate-2 scale-[0.97]" />

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 48, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -direction * 48, scale: 0.95 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 h-full w-full"
          >
            <ScratchReasonCard
              reason={current}
              index={index}
              total={LOVE_REASONS.length}
              isRevealed={isCurrentRevealed}
              onReveal={handleRevealCurrent}
              onSwipeCard={goCard}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Minimalist Navigation & Action Controls Below */}
      <div className="mt-4 flex items-center gap-3.5">
        <button
          type="button"
          onClick={() => goCard(-1)}
          aria-label="Previous reason"
          className="glass h-9 w-9 rounded-full hover:bg-white/20 active:scale-90 flex items-center justify-center text-white/90 transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5">
          {LOVE_REASONS.map((reason, idx) => {
            const isSeen = !!seenIds[reason.id];
            const isActive = idx === index;
            return (
              <button
                key={reason.id}
                type="button"
                onClick={() => {
                  setDirection(idx >= index ? 1 : -1);
                  setIndex(idx);
                }}
                aria-label={`Reason ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  isActive
                    ? 'w-7 bg-[#ffd166]'
                    : isSeen
                      ? 'w-2 bg-white/85'
                      : 'w-2 bg-white/25'
                }`}
              />
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => goCard(1)}
          aria-label="Next reason"
          className="glass h-9 w-9 rounded-full hover:bg-white/20 active:scale-90 flex items-center justify-center text-white/90 transition cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3.5 min-h-[48px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {allSeen ? (
            <motion.div
              key="unlock-next"
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            >
              <PrimaryButton variant="gold" onClick={onNext} className="px-6 py-2.5 text-xs sm:text-sm">
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </PrimaryButton>
            </motion.div>
          ) : isCurrentRevealed ? (
            <motion.button
              key="next-unscratched"
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={goToNextUnseen}
              className="glass inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold text-[#ffd166] hover:bg-white/15 transition cursor-pointer"
            >
              <span>Next Unscratched ({LOVE_REASONS.length - seenCount} left)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          ) : (
            <motion.p
              key="progress-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[11px] font-medium tracking-wide text-white/45"
            >
              {allSeen
                ? 'Every reason unlocked ❤️'
                : `Scratch all ${LOVE_REASONS.length} cards to continue`}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
