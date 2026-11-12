import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Lock, Volume2, VolumeX, X, Compass } from 'lucide-react';
import { STAGE_THEMES } from '../data/birthdayContent';
import { ambientAudio } from '../utils/ambientAudio';
import { triggerHaptic } from '../utils/haptics';
import { SparkleIcon } from './ui/Primitives';

interface TouchBurst {
  id: number;
  x: number;
  y: number;
  particles: Array<{
    dx: number;
    dy: number;
    size: number;
    isHeart: boolean;
    color: string;
    rot: number;
  }>;
}

interface StoryShellProps {
  currentStage: number;
  totalStages: number;
  onPrevStage: () => void;
  onSelectStage: (stage: number) => void;
  onUnlockAll?: () => void;
  highestUnlocked: number;
  focusMode?: boolean;
  children: React.ReactNode;
}

const FLOATING_HEARTS = [
  { left: '7%', delay: 0, duration: 12, size: 13 },
  { left: '22%', delay: 2.5, duration: 14, size: 16 },
  { left: '44%', delay: 1.2, duration: 11, size: 12 },
  { left: '66%', delay: 4.1, duration: 15, size: 15 },
  { left: '82%', delay: 0.8, duration: 13, size: 14 },
  { left: '93%', delay: 3.3, duration: 12, size: 12 },
];

const BURST_COLORS = ['#ffd6e0', '#ffd166', '#ff8fab', '#ffffff'];

const AmbientDustCanvas: React.FC<{ accent: string }> = ({ accent }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const accentRef = useRef(accent);
  accentRef.current = accent;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };
    resize();
    window.addEventListener('resize', resize);

    const motes = Array.from({ length: 26 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.9 + (i % 3) * 0.75,
      vx: (Math.random() - 0.5) * 10,
      vy: -(6 + Math.random() * 14),
      phase: Math.random() * Math.PI * 2,
      alpha: 0.16 + Math.random() * 0.35,
    }));

    let last = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      for (const m of motes) {
        m.x += (m.vx + Math.sin(now * 0.0012 + m.phase) * 6) * dt;
        m.y += m.vy * dt;

        if (m.y < -12) {
          m.y = height + 12;
          m.x = Math.random() * width;
        }
        if (m.x < -12) m.x = width + 12;
        if (m.x > width + 12) m.x = -12;

        const twinkle = 0.55 + 0.45 * Math.sin(now * 0.002 + m.phase);
        ctx.globalAlpha = m.alpha * twinkle;
        ctx.fillStyle = accentRef.current;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-[5]" />;
};

export const StoryShell: React.FC<StoryShellProps> = ({
  currentStage,
  totalStages,
  onPrevStage,
  onSelectStage,
  onUnlockAll,
  highestUnlocked,
  focusMode = false,
  children,
}) => {
  const theme = STAGE_THEMES[currentStage] ?? STAGE_THEMES[0];
  const [bursts, setBursts] = useState<TouchBurst[]>([]);
  const [isMuted, setIsMuted] = useState(() => ambientAudio.getIsMuted());
  const [chapterMapOpen, setChapterMapOpen] = useState(false);
  const secretTapRef = useRef({ count: 0, lastAt: 0 });

  useEffect(() => ambientAudio.subscribeMute(setIsMuted), []);

  const stars = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        left: `${(i * 37 + 11) % 98}%`,
        top: `${(i * 53 + 7) % 92}%`,
        size: (i % 3) + 1.5,
        delay: (i % 7) * 0.45,
      })),
    []
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, iframe, canvas')) return;

    ambientAudio.playSoftTap(0.92 + Math.random() * 0.25);

    const id = Date.now() + Math.random();
    const particles = Array.from({ length: 5 }, (_, idx) => {
      const angle = (Math.PI * 2 * idx) / 5 + (Math.random() - 0.5) * 0.6;
      const dist = 18 + Math.random() * 24;
      return {
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - 10,
        size: 10 + Math.round(Math.random() * 6),
        isHeart: idx % 2 === 1,
        color: BURST_COLORS[idx % BURST_COLORS.length],
        rot: (Math.random() - 0.5) * 90,
      };
    });

    setBursts((prev) => [...prev.slice(-4), { id, x: e.clientX, y: e.clientY, particles }]);
    window.setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id));
    }, 760);
  };

  const handleToggleMute = () => {
    triggerHaptic(8);
    const nowMuted = ambientAudio.toggleMute();
    if (!nowMuted) {
      ambientAudio.playSoftTap(1.1);
    }
  };

  const handleSecretHeaderTap = () => {
    const now = Date.now();
    if (now - secretTapRef.current.lastAt > 1800) {
      secretTapRef.current = { count: 1, lastAt: now };
    } else {
      secretTapRef.current = { count: secretTapRef.current.count + 1, lastAt: now };
    }
    if (secretTapRef.current.count >= 5) {
      secretTapRef.current.count = 0;
      onUnlockAll?.();
      ambientAudio.playSparkleChime();
      triggerHaptic([12, 30, 12]);
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      style={{ background: theme.bg }}
      className="relative h-[100dvh] w-full overflow-hidden transition-all duration-1000 flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      {/* Editorial film-grain texture */}
      <div className="pointer-events-none fixed inset-0 z-10 grain-overlay" />

      {/* Drifting stardust canvas */}
      <AmbientDustCanvas accent={theme.blobs[0]} />

      {/* Animated Wrapped-style ambient blobs & decorations */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 42, -25, 0],
            y: [0, -35, 22, 0],
            scale: [1, 1.18, 0.94, 1],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          style={{ backgroundColor: theme.blobs[0] }}
          className="absolute -top-28 -left-24 h-80 w-80 rounded-full opacity-35 blur-3xl transition-colors duration-1000"
        />
        <motion.div
          animate={{
            x: [0, -35, 28, 0],
            y: [0, 38, -28, 0],
            scale: [1, 0.9, 1.15, 1],
          }}
          transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
          style={{ backgroundColor: theme.blobs[1] }}
          className="absolute -bottom-28 -right-24 h-96 w-96 rounded-full opacity-30 blur-3xl transition-colors duration-1000"
        />
        <motion.div
          animate={{
            x: [0, 25, -20, 0],
            y: [0, 20, -25, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          style={{ backgroundColor: theme.blobs[2] }}
          className="absolute top-1/3 right-1/4 h-64 w-64 rounded-full opacity-20 blur-3xl transition-colors duration-1000"
        />

        {/* Twinkling starfield on candle/finale stages */}
        {theme.stars &&
          stars.map((s, idx) => (
            <div
              key={idx}
              style={{
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                animationDelay: `${s.delay}s`,
              }}
              className="twinkle absolute rounded-full bg-white/90 shadow-[0_0_6px_#fff]"
            />
          ))}

        {/* Orbiting Wrapped rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 55, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[118vw] w-[118vw] max-h-[780px] max-w-[780px] rounded-full border border-white/[0.06]"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[88vw] w-[88vw] max-h-[560px] max-w-[560px] rounded-full border border-dashed border-white/[0.05]"
        />

        {/* Floating hearts */}
        {FLOATING_HEARTS.map((heart, idx) => (
          <motion.span
            key={idx}
            initial={{ y: '105dvh', opacity: 0 }}
            animate={{
              y: ['105dvh', '-12dvh'],
              opacity: [0, 0.32, 0.32, 0],
              x: [0, idx % 2 === 0 ? 18 : -18, 0],
            }}
            transition={{
              duration: heart.duration,
              delay: heart.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ left: heart.left, fontSize: heart.size }}
            className="absolute select-none text-white/35"
          >
            ♥
          </motion.span>
        ))}

        {/* Multi-particle touch bursts */}
        <AnimatePresence>
          {bursts.map((burst) => (
            <div key={burst.id} className="fixed inset-0 z-50 pointer-events-none">
              {burst.particles.map((p, idx) => (
                <motion.div
                  key={idx}
                  initial={{ x: burst.x - 8, y: burst.y - 8, scale: 0.4, opacity: 0.95, rotate: 0 }}
                  animate={{
                    x: burst.x - 8 + p.dx,
                    y: burst.y - 8 + p.dy,
                    scale: 1.25,
                    opacity: 0,
                    rotate: p.rot,
                  }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  style={{ color: p.color }}
                  className="absolute flex items-center justify-center"
                >
                  {p.isHeart ? (
                    <span style={{ fontSize: p.size }}>♥</span>
                  ) : (
                    <SparkleIcon size={p.size} />
                  )}
                </motion.div>
              ))}
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Cinema focus backdrop: blurs & dims the entire website behind focal stages */}
      <AnimatePresence>
        {focusMode && (
          <motion.div
            key="cinema-focus-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: 'easeInOut' }}
            className="pointer-events-none fixed inset-0 z-[15] bg-[#07020b]/78 backdrop-blur-3xl"
          />
        )}
      </AnimatePresence>

      {/* Top Spotify Wrapped Story Header */}
      <header
        className={`relative z-30 shrink-0 w-full max-w-xl mx-auto px-3.5 sm:px-5 pt-2.5 pb-1 transition-all duration-700 ${
          focusMode
            ? 'opacity-35 hover:opacity-100 focus-within:opacity-100'
            : ''
        }`}
      >
        <div
          style={{ gridTemplateColumns: `repeat(${totalStages}, minmax(0, 1fr))` }}
          className="grid gap-1.5 mb-2"
        >
          {Array.from({ length: totalStages }).map((_, idx) => {
            const isPast = idx < currentStage;
            const isCurrent = idx === currentStage;
            const isUnlocked = idx <= highestUnlocked;
            return (
              <button
                key={idx}
                type="button"
                disabled={!isUnlocked}
                onClick={() => {
                  if (isUnlocked) {
                    triggerHaptic(6);
                    onSelectStage(idx);
                  }
                }}
                aria-label={`Stage ${idx + 1}: ${STAGE_THEMES[idx]?.label}`}
                className="relative h-[4.5px] rounded-full bg-white/22 overflow-hidden disabled:cursor-default cursor-pointer"
              >
                <motion.div
                  initial={false}
                  animate={{
                    width: isPast || isCurrent ? '100%' : '0%',
                    opacity: isCurrent ? 1 : isPast ? 0.8 : 0,
                  }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    isCurrent
                      ? 'bg-gradient-to-r from-[#fff6c9] via-[#ff8fab] to-[#ffd166]'
                      : 'bg-white'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center min-w-[68px]">
            {currentStage > 0 && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(6);
                  onPrevStage();
                }}
                className="glass flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/20 active:scale-95 transition cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
          </div>

          {/* Interactive Chapter Pill */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(6);
              setChapterMapOpen(true);
            }}
            className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold text-white/90 hover:bg-white/20 active:scale-95 transition cursor-pointer"
          >
            <Compass className="w-3 h-3 text-[#ffd166]" />
            <span className="tabular-nums text-white/60">
              {theme.chapter}/{String(totalStages).padStart(2, '0')}
            </span>
            <span className="truncate max-w-[110px]">{theme.label}</span>
          </button>

          {/* Audio Mute / Unmute Toggle */}
          <div className="flex items-center justify-end min-w-[68px]">
            <button
              type="button"
              onClick={handleToggleMute}
              aria-label={isMuted ? 'Unmute music and sounds' : 'Mute music and sounds'}
              className={`glass flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition active:scale-95 cursor-pointer ${
                isMuted ? 'text-white/55' : 'text-[#ffd6e0]'
              }`}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#ffd166]" />
                  <span className="flex items-end gap-[2px] h-2.5" aria-hidden>
                    <span className="eq-bar w-[2px] h-2 rounded-full bg-[#ffd166]" />
                    <span
                      className="eq-bar w-[2px] h-2.5 rounded-full bg-[#ff8fab]"
                      style={{ animationDelay: '0.22s' }}
                    />
                    <span
                      className="eq-bar w-[2px] h-1.5 rounded-full bg-[#ffd166]"
                      style={{ animationDelay: '0.42s' }}
                    />
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Stage Container — Edge-to-edge full viewport without page scroll */}
      <main className="relative z-20 flex-1 min-h-0 w-full max-w-xl mx-auto px-3.5 sm:px-5 pb-3 pt-1 flex flex-col items-center justify-center overflow-y-auto overflow-x-hidden no-scrollbar">
        {children}
      </main>

      {/* Chapter Journey Drawer */}
      <AnimatePresence>
        {chapterMapOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setChapterMapOpen(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="glass w-full max-w-sm rounded-[28px] p-5 border border-white/20 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3.5">
                <button
                  type="button"
                  onClick={handleSecretHeaderTap}
                  className="text-left focus:outline-none"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#ffd166]">
                    Doha&apos;s 21st Story
                  </p>
                  <h3 className="font-serif italic text-2xl text-white">Chapters</h3>
                </button>
                <button
                  type="button"
                  onClick={() => setChapterMapOpen(false)}
                  aria-label="Close chapters"
                  className="glass w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-[60dvh] overflow-y-auto no-scrollbar pr-0.5">
                {STAGE_THEMES.map((ch) => {
                  const unlocked = ch.id <= highestUnlocked;
                  const active = ch.id === currentStage;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => {
                        if (!unlocked) return;
                        triggerHaptic(8);
                        setChapterMapOpen(false);
                        onSelectStage(ch.id);
                      }}
                      className={`w-full flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-left transition border ${
                        active
                          ? 'bg-white/20 border-[#ffd166]/70 text-white'
                          : unlocked
                            ? 'bg-white/[0.06] border-white/10 text-white/90 hover:bg-white/14 cursor-pointer'
                            : 'bg-white/[0.02] border-white/5 text-white/35 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg shrink-0">{ch.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold tracking-tight truncate">
                            {ch.chapter}. {ch.title}
                          </p>
                          <p className="text-[10px] text-white/55 truncate">{ch.subtitle}</p>
                        </div>
                      </div>
                      {!unlocked ? (
                        <Lock className="w-3.5 h-3.5 text-white/30 shrink-0" />
                      ) : active ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#ffd166] shrink-0">
                          Here
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
