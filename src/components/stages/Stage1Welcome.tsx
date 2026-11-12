import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { fireCelebrationConfetti, fireSparkleBurst } from '../../utils/confetti';
import { ambientAudio } from '../../utils/ambientAudio';
import { triggerHaptic } from '../../utils/haptics';
import { Kicker, PrimaryButton, RevealText, SparkleIcon } from '../ui/Primitives';
import { RealisticCake } from '../cake/RealisticCake';

interface Stage1WelcomeProps {
  onNext: () => void;
}

const WELCOME_CANDLES = [true, true, true];

const CAKE_WISHES = [
  'Happy 21st, Princess! 👑',
  'My favorite artist & swimmer 🎨🌊',
  'Your voice melts my heart 🎤✨',
  'Miles apart, never in heart ❤️',
  'Make a magical wish! 🕯️',
];

export const Stage1Welcome: React.FC<Stage1WelcomeProps> = ({ onNext }) => {
  const [tapCount, setTapCount] = useState(0);
  const [floatingWish, setFloatingWish] = useState<{ id: number; text: string } | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => fireCelebrationConfetti(), 500);
    return () => clearTimeout(t);
  }, []);

  const handleCakeTap = () => {
    triggerHaptic(14);
    ambientAudio.playSparkleChime();
    if (tapCount % 2 === 0) {
      fireCelebrationConfetti();
    } else {
      fireSparkleBurst();
    }
    const text = CAKE_WISHES[tapCount % CAKE_WISHES.length];
    const id = Date.now();
    setTapCount((c) => c + 1);
    setFloatingWish({ id, text });
    window.setTimeout(() => {
      setFloatingWish((curr) => (curr?.id === id ? null : curr));
    }, 2100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24, scale: 0.96 }}
      transition={{ duration: 0.55 }}
      className="relative w-full flex flex-col items-center text-center"
    >
      {/* Giant Wrapped background "21" outline watermark */}
      <motion.span
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        aria-hidden
        className="pointer-events-none select-none absolute -top-6 left-1/2 -translate-x-1/2 font-display text-[11.5rem] sm:text-[16rem] font-extrabold leading-none tracking-tighter text-outline"
      >
        21
      </motion.span>

      <Kicker className="text-[#ffd166] mb-1">Nov 13 · A Digital Birthday Gift</Kicker>

      <h1 className="font-display text-[32px] sm:text-5xl font-extrabold tracking-tight leading-[1.02] text-white max-w-md">
        <RevealText text="Happy 21st Birthday," delay={0.1} />
        <span className="block font-serif italic font-normal text-[40px] sm:text-6xl shimmer-text mt-0.5">
          My Love, Doha! ❤️
        </span>
      </h1>

      {/* Realistic Two-Tier Birthday Cake */}
      <motion.div
        initial={{ scale: 0.82, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 165, damping: 16, delay: 0.25 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCakeTap}
        title="Tap the cake for birthday confetti!"
        className="relative my-1.5 w-full flex justify-center cursor-pointer select-none"
      >
        {/* Floating wish bubble on cake tap */}
        <AnimatePresence>
          {floatingWish && (
            <motion.div
              key={floatingWish.id}
              initial={{ opacity: 0, y: 12, scale: 0.85 }}
              animate={{ opacity: 1, y: -12, scale: 1 }}
              exit={{ opacity: 0, y: -28, scale: 0.92 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="pointer-events-none absolute -top-2 z-30 rounded-full bg-[#2a0a26]/90 border border-[#ffd166]/60 px-3.5 py-1 text-xs font-bold text-[#ffe8b3] shadow-xl backdrop-blur-md"
            >
              {floatingWish.text}
            </motion.div>
          )}
        </AnimatePresence>

        <RealisticCake
          candleMode="trio"
          candlesLit={WELCOME_CANDLES}
          plaqueText="Doha Fetouh"
          interactive={false}
          className="my-0 max-w-[min(70vw,285px,35dvh)] sm:max-w-[335px]"
        />
      </motion.div>

      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45 mb-1.5">
        ✨ Tap the cake for sparkles
      </p>

      {/* Editorial Glass Note Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.55 }}
        className="glass w-full max-w-md rounded-3xl px-4 py-3 mb-3"
      >
        <p className="text-[12.5px] sm:text-[15px] leading-snug sm:leading-relaxed text-white/92">
          Even from miles away, I built this interactive birthday journey just for you — tap, scratch, spin, snap, and blow out your 21 candles.
        </p>
        <p className="mt-1 font-hand text-[21px] text-[#ffd166]">
          Created with all my love, Abhi Vaidya ❤️
        </p>
      </motion.div>

      <PrimaryButton
        variant="pink"
        onClick={() => {
          triggerHaptic(14);
          onNext();
        }}
        className="text-sm sm:text-base px-7 py-3.5"
      >
        <SparkleIcon size={16} />
        <span>Open Your Birthday Surprise</span>
        <ArrowRight className="w-4 h-4" />
      </PrimaryButton>
    </motion.div>
  );
};
