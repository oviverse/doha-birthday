import React, { useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { ArrowRight, RotateCw } from 'lucide-react';
import { WHEEL_SEGMENTS, WheelSegment } from '../../data/birthdayContent';
import { fireCelebrationConfetti, fireJackpotConfetti } from '../../utils/confetti';
import { ambientAudio } from '../../utils/ambientAudio';
import { triggerHaptic } from '../../utils/haptics';
import { Kicker, PrimaryButton, SparkleIcon } from '../ui/Primitives';

interface Stage3JackpotWheelProps {
  onNext: () => void;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDegFromTop: number) {
  const rad = ((angleDegFromTop - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function createWedgePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export const Stage3JackpotWheel: React.FC<Stage3JackpotWheelProps> = ({ onNext }) => {
  const [spinCount, setSpinCount] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonPrizes, setWonPrizes] = useState<WheelSegment[]>([]);
  const [currentPrize, setCurrentPrize] = useState<WheelSegment | null>(null);
  const [pointerFlick, setPointerFlick] = useState(false);

  const rotationMV = useMotionValue(0);
  const lastWedgeRef = useRef(0);
  const flickTimerRef = useRef<number | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const jackpotIndex = WHEEL_SEGMENTS.findIndex((s) => s.isJackpot);
  const maxSpins = 3;
  const spinsLeft = maxSpins - spinCount;
  const hasWonJackpot = spinCount >= maxSpins && !isSpinning;

  const handleSpin = () => {
    if (isSpinning || spinCount >= maxSpins) return;

    triggerHaptic(15);
    const nextSpin = spinCount + 1;
    const targetIndex = nextSpin === 1 ? 7 : nextSpin === 2 ? 1 : jackpotIndex;

    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    const currentRotation = rotationMV.get();
    const desiredMod = (360 - targetIndex * segmentAngle) % 360;
    const currentMod = ((currentRotation % 360) + 360) % 360;
    const deltaMod = (desiredMod - currentMod + 360) % 360;

    const extraSpins = nextSpin === 3 ? 8 * 360 : 5 * 360;
    const jitter = nextSpin === 3 ? 0 : (Math.random() - 0.5) * 12;
    const duration = nextSpin === 3 ? 5.0 : 3.1;
    const targetRotation = currentRotation + extraSpins + deltaMod + jitter;
    const totalDelta = Math.max(1, targetRotation - currentRotation);

    setIsSpinning(true);
    setCurrentPrize(null);

    animate(rotationMV, targetRotation, {
      duration,
      ease: [0.12, 0.85, 0.16, 1],
      onUpdate: (latest) => {
        const wedgeIdx = Math.floor((latest + segmentAngle / 2) / segmentAngle);
        if (wedgeIdx !== lastWedgeRef.current) {
          lastWedgeRef.current = wedgeIdx;
          const progress = Math.min(1, Math.max(0, (latest - currentRotation) / totalDelta));
          ambientAudio.playWheelTick(1 - progress * 0.7);
          triggerHaptic(4);
          setPointerFlick(true);
          if (flickTimerRef.current) window.clearTimeout(flickTimerRef.current);
          flickTimerRef.current = window.setTimeout(() => setPointerFlick(false), 65);
        }
      },
      onComplete: () => {
        const won = WHEEL_SEGMENTS[targetIndex];
        setIsSpinning(false);
        setPointerFlick(false);
        setSpinCount(nextSpin);
        setCurrentPrize(won);
        setWonPrizes((prev) => [...prev, won]);

        if (won.isJackpot) {
          ambientAudio.playJackpotFanfare();
          triggerHaptic([20, 40, 20, 40, 35]);
          fireJackpotConfetti();
        } else {
          ambientAudio.playSparkleChime();
          triggerHaptic([14, 25, 14]);
          fireCelebrationConfetti();
        }
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.5 }}
      className="w-full flex flex-col items-center text-center"
    >
      <Kicker className="text-[#ffcc4d]">Chapter 04 · 3 Spins</Kicker>

      <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight mt-0.5">
        <span className="neon-pink">LOVE</span>{' '}
        <span className="neon-gold">JACKPOT</span>
      </h2>

      {/* Spin Indicator Pills */}
      <div className="mt-1.5 flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < spinCount
                ? 'w-7 bg-[#ffcc4d] shadow-[0_0_10px_#ffcc4d]'
                : i === spinCount
                  ? 'w-7 bg-[#ff4fa3] animate-pulse'
                  : 'w-4 bg-white/25'
            }`}
          />
        ))}
        <span className="ml-1 text-[11px] font-bold text-white/85">
          {hasWonJackpot
            ? 'JACKPOT WON!'
            : spinsLeft === 1
              ? 'Final Spin!'
              : `${spinsLeft} Spins Left`}
        </span>
      </div>

      {/* Wheel Stage — Swipe or Tap to Spin */}
      <div
        onPointerDown={(e) => {
          swipeStartRef.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          if (!swipeStartRef.current) return;
          const dist = Math.hypot(
            e.clientX - swipeStartRef.current.x,
            e.clientY - swipeStartRef.current.y
          );
          swipeStartRef.current = null;
          if (dist > 28) handleSpin();
        }}
        className="relative flex items-center justify-center my-3 touch-pan-y"
      >
        {/* Glow (pure radial gradient — zero blur filter) */}
        <motion.div
          animate={{
            scale: isSpinning && spinCount === 2 ? [1, 1.12, 1] : 1,
            opacity: hasWonJackpot || (isSpinning && spinCount === 2) ? 0.9 : 0.45,
          }}
          transition={{ duration: 0.7, repeat: isSpinning ? Infinity : 0 }}
          style={{
            background:
              'radial-gradient(circle, rgba(255, 79, 163, 0.45) 0%, rgba(255, 204, 77, 0.32) 42%, rgba(123, 47, 247, 0.25) 62%, transparent 74%)',
          }}
          className="pointer-events-none absolute -inset-8 rounded-full"
        />

        {/* Top Pointer that physically flicks with every peg tick */}
        <motion.div
          animate={{ rotate: pointerFlick ? -22 : 0 }}
          transition={{ duration: 0.05 }}
          style={{ transformOrigin: '50% 0%' }}
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_6px_12px_rgba(0,0,0,0.7)]"
        >
          <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[26px] border-l-transparent border-r-transparent border-t-[#ffcc4d]" />
        </motion.div>

        {/* 3D Marquee Rim */}
        <div className="relative w-[min(70vw,280px,37dvh)] h-[min(70vw,280px,37dvh)] sm:w-[315px] sm:h-[315px] rounded-full p-3 bg-gradient-to-b from-[#ffe08a] via-[#d97706] to-[#78350f] shadow-[0_24px_60px_rgba(0,0,0,0.65),inset_0_2px_4px_rgba(255,255,255,0.6)]">
          {/* Chasing Marquee Bulbs */}
          {Array.from({ length: 20 }).map((_, i) => {
            const angle = (i * 360) / 20;
            const rad = (angle * Math.PI) / 180;
            const x = 50 + 47.6 * Math.cos(rad);
            const y = 50 + 47.6 * Math.sin(rad);
            return (
              <span
                key={i}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  animationDelay: `${(i % 2) * 0.28}s`,
                }}
                className={`${
                  isSpinning || hasWonJackpot ? 'bulb-fast' : 'bulb'
                } absolute -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#fff6d6] z-20`}
              />
            );
          })}

          <motion.div
            style={{ rotate: rotationMV }}
            className="w-full h-full rounded-full overflow-hidden relative shadow-[inset_0_0_25px_rgba(0,0,0,0.5)] bg-[#1f0738]"
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {WHEEL_SEGMENTS.map((seg, idx) => {
                const slice = 360 / WHEEL_SEGMENTS.length;
                const startAngle = idx * slice - slice / 2;
                const endAngle = idx * slice + slice / 2;
                const midAngle = idx * slice;

                return (
                  <g key={seg.label}>
                    <path
                      d={createWedgePath(100, 100, 99, startAngle, endAngle)}
                      fill={seg.color}
                      stroke="#fff8f0"
                      strokeWidth="0.9"
                    />
                    <g transform={`rotate(${midAngle} 100 100)`}>
                      <text x="100" y="25" textAnchor="middle" fontSize="11">
                        {seg.emoji}
                      </text>
                      <text
                        x="100"
                        y="39"
                        textAnchor="middle"
                        fill={seg.textColor}
                        fontSize="6.1"
                        fontWeight="800"
                        fontFamily="Bricolage Grotesque, sans-serif"
                      >
                        {seg.shortLabel}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </motion.div>

          {/* Center Spin Hub */}
          <button
            type="button"
            disabled={isSpinning || hasWonJackpot}
            onClick={handleSpin}
            aria-label="Spin wheel"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#fff6d6] via-[#ffcc4d] to-[#d97706] border-4 border-[#3b0a57] shadow-[0_8px_20px_rgba(0,0,0,0.6)] flex items-center justify-center z-20 cursor-pointer active:scale-95 transition disabled:cursor-default"
          >
            <span className="font-display text-[10px] sm:text-[11px] font-extrabold tracking-wider text-[#3b0a57]">
              {isSpinning ? '•••' : hasWonJackpot ? '👑' : 'SPIN'}
            </span>
          </button>
        </div>
      </div>

      {/* Compact Won Prize Card + Trophy Strip */}
      <div className="w-full max-w-md min-h-[104px] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {currentPrize ? (
            <motion.div
              key={currentPrize.label}
              initial={{ opacity: 0, scale: 0.88, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className={`w-full rounded-2xl px-4 py-3 border shadow-2xl ${
                currentPrize.isJackpot
                  ? 'bg-gradient-to-r from-[#ffcc4d]/30 via-[#ff4fa3]/30 to-[#7b2ff7]/30 border-[#ffcc4d] backdrop-blur-xl'
                  : 'glass'
              }`}
            >
              <p className="font-display text-sm sm:text-base font-extrabold text-white flex items-center justify-center gap-1.5">
                <span>{currentPrize.emoji}</span>
                <span className={currentPrize.isJackpot ? 'gold-text text-base sm:text-lg' : ''}>
                  {currentPrize.isJackpot
                    ? 'JACKPOT! ALL MY LOVE, FOREVER!'
                    : `You Won: ${currentPrize.label}!`}
                </span>
              </p>
              <p className="text-[11px] sm:text-xs text-white/90 mt-0.5 leading-snug">
                {currentPrize.description}
              </p>
            </motion.div>
          ) : (
            <motion.p
              key="spin-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              exit={{ opacity: 0 }}
              className="text-xs text-white/70"
            >
              {isSpinning
                ? 'Watch the wheel spin… ✨'
                : 'Tap SPIN or swipe the wheel for your birthday prize!'}
            </motion.p>
          )}
        </AnimatePresence>

        {wonPrizes.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-2">
            {wonPrizes.map((p, i) => (
              <span
                key={i}
                className="glass rounded-full px-2.5 py-0.5 text-[10px] font-bold text-[#ffd6e0]"
              >
                {p.emoji} {p.shortLabel}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main CTA */}
      <div className="mt-3">
        {!hasWonJackpot ? (
          <PrimaryButton
            variant={spinCount === 2 ? 'gold' : 'pink'}
            disabled={isSpinning}
            onClick={handleSpin}
            className={`px-7 py-3 text-sm ${spinCount === 2 && !isSpinning ? 'animate-pulse' : ''}`}
          >
            <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
            {isSpinning
              ? spinCount === 2
                ? 'Hold Your Breath...'
                : 'Spinning...'
              : spinCount === 2
                ? 'FINAL SPIN TO WIN!'
                : 'SPIN TO WIN'}
          </PrimaryButton>
        ) : (
          <PrimaryButton
            variant="gold"
            onClick={() => {
              triggerHaptic(14);
              onNext();
            }}
            className="px-7 py-3 text-sm"
          >
            <SparkleIcon size={16} />
            <span>Claim & Continue</span>
            <ArrowRight className="w-4 h-4" />
          </PrimaryButton>
        )}
      </div>
    </motion.div>
  );
};
