import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { fireCelebrationConfetti } from '../../utils/confetti';
import { Kicker, PrimaryButton, RevealText, SparkleIcon } from '../ui/Primitives';
import { RealisticCake } from '../cake/RealisticCake';

interface Stage1WelcomeProps {
  onNext: () => void;
}

const WELCOME_CANDLES = [true, true, true];

export const Stage1Welcome: React.FC<Stage1WelcomeProps> = ({ onNext }) => {
  useEffect(() => {
    const t = window.setTimeout(() => fireCelebrationConfetti(), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
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
        className="pointer-events-none select-none absolute -top-8 left-1/2 -translate-x-1/2 font-display text-[13rem] sm:text-[17rem] font-extrabold leading-none tracking-tighter text-outline"
      >
        21
      </motion.span>

      <Kicker className="text-[#ffd166] mb-2">A Digital Birthday Gift</Kicker>

      <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.03] text-white max-w-md">
        <RevealText text="Happy 21st Birthday," delay={0.1} />
        <span className="block font-serif italic font-normal text-5xl sm:text-6xl shimmer-text mt-1">
          My Love, Doha! ❤️
        </span>
      </h1>

      {/* Realistic Two-Tier Birthday Cake */}
      <motion.div
        initial={{ scale: 0.82, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 165, damping: 16, delay: 0.25 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => fireCelebrationConfetti()}
        title="Tap the cake for birthday confetti!"
        className="relative my-3 w-full flex justify-center cursor-pointer select-none"
      >
        <RealisticCake
          candleMode="trio"
          candlesLit={WELCOME_CANDLES}
          plaqueText="Doha Fetouh"
          interactive={false}
          className="my-1 max-w-[330px] sm:max-w-[365px]"
        />
      </motion.div>

      {/* Editorial Glass Note Card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.55 }}
        className="glass max-w-md rounded-3xl px-6 py-4 mb-6"
      >
        <p className="text-sm sm:text-[15px] leading-relaxed text-white/90">
          Even from miles away, I built this interactive birthday journey just for you — tap, scratch, spin, snap, and blow out your 21 candles.
        </p>
        <p className="mt-2 font-hand text-2xl text-[#ffd166]">
          Created with all my love, Abhi Vaidya ❤️
        </p>
      </motion.div>

      <PrimaryButton variant="pink" onClick={onNext} className="text-base px-8 py-4">
        <SparkleIcon size={16} />
        <span>Open Your Birthday Surprise</span>
        <ArrowRight className="w-4 h-4" />
      </PrimaryButton>
    </motion.div>
  );
};
