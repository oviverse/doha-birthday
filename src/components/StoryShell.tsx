import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { STAGE_THEMES } from '../data/birthdayContent';
import { SparkleIcon } from './ui/Primitives';

interface TouchBurst {
  id: number;
  x: number;
  y: number;
}

interface StoryShellProps {
  currentStage: number;
  totalStages: number;
  onPrevStage: () => void;
  onSkipStage: () => void;
  onSelectStage: (stage: number) => void;
  highestUnlocked: number;
  focusMode?: boolean;
  children: React.ReactNode;
}

const FLOATING_HEARTS = [
  { left: '7%', delay: 0, duration: 12, size: 14 },
  { left: '21%', delay: 2.5, duration: 14, size: 17 },
  { left: '43%', delay: 1.2, duration: 11, size: 12 },
  { left: '65%', delay: 4.1, duration: 15, size: 16 },
  { left: '80%', delay: 0.8, duration: 13, size: 15 },
  { left: '92%', delay: 3.3, duration: 12, size: 13 },
];

export const StoryShell: React.FC<StoryShellProps> = ({
  currentStage,
  totalStages,
  onPrevStage,
  onSkipStage,
  onSelectStage,
  highestUnlocked,
  focusMode = false,
  children,
}) => {
  const theme = STAGE_THEMES[currentStage] ?? STAGE_THEMES[0];
  const [bursts, setBursts] = useState<TouchBurst[]>([]);

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
    if (target.closest('button, a, input, iframe')) return;

    const id = Date.now() + Math.random();
    setBursts((prev) => [...prev.slice(-6), { id, x: e.clientX, y: e.clientY }]);
    window.setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id));
    }, 750);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      style={{ background: theme.bg }}
      className="relative min-h-[100dvh] w-full overflow-x-hidden transition-all duration-1000 flex flex-col"
    >
      {/* Editorial film-grain texture */}
      <div className="pointer-events-none fixed inset-0 z-10 grain-overlay" />

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
              opacity: [0, 0.35, 0.35, 0],
              x: [0, idx % 2 === 0 ? 18 : -18, 0],
            }}
            transition={{
              duration: heart.duration,
              delay: heart.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ left: heart.left, fontSize: heart.size }}
            className="absolute select-none text-white/40"
          >
            ♥
          </motion.span>
        ))}

        {/* Touch bursts */}
        <AnimatePresence>
          {bursts.map((burst) => (
            <motion.div
              key={burst.id}
              initial={{ scale: 0.3, opacity: 0.95, rotate: 0 }}
              animate={{ scale: 2.1, opacity: 0, rotate: 45 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              style={{ left: burst.x - 16, top: burst.y - 16 }}
              className="fixed z-50 pointer-events-none flex items-center justify-center w-8 h-8 text-[#ffd6e0]"
            >
              <SparkleIcon size={22} />
            </motion.div>
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
        className={`relative z-30 w-full max-w-xl mx-auto px-4 pt-3.5 pb-2 transition-all duration-700 ${
          focusMode
            ? 'opacity-20 blur-[3px] hover:opacity-95 hover:blur-0 focus-within:opacity-95 focus-within:blur-0'
            : ''
        }`}
      >
        <div
          style={{ gridTemplateColumns: `repeat(${totalStages}, minmax(0, 1fr))` }}
          className="grid gap-1.5 mb-2.5"
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
                onClick={() => isUnlocked && onSelectStage(idx)}
                aria-label={`Stage ${idx + 1}: ${STAGE_THEMES[idx]?.label}`}
                className="relative h-[5px] rounded-full bg-white/25 overflow-hidden disabled:cursor-default cursor-pointer"
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

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {currentStage > 0 && (
              <button
                type="button"
                onClick={onPrevStage}
                className="glass flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 active:scale-95 transition cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* TEMP: Temporary Skip button for testing across all pages */}
            <button
              type="button"
              onClick={onSkipStage}
              className="glass flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-[#ffd166] hover:bg-white/20 active:scale-95 transition cursor-pointer"
            >
              Skip
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Stage Container */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center w-full max-w-xl mx-auto px-4 pb-8 pt-2">
        {children}
      </main>
    </div>
  );
};
