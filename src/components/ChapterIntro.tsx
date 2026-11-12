import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { STAGE_THEMES } from '../data/birthdayContent';
import { RevealText, SparkleIcon } from './ui/Primitives';

interface ChapterIntroProps {
  stageIndex: number;
  onDone: () => void;
}

const INTRO_DURATION_MS = 1550;

export const ChapterIntro: React.FC<ChapterIntroProps> = ({ stageIndex, onDone }) => {
  const theme = STAGE_THEMES[stageIndex] ?? STAGE_THEMES[0];
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const t = window.setTimeout(() => onDoneRef.current(), INTRO_DURATION_MS);
    return () => clearTimeout(t);
  }, [stageIndex]);

  return (
    <motion.div
      key={`intro-${stageIndex}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onDoneRef.current()}
      style={{ background: theme.introBg, color: theme.introText }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center select-none overflow-hidden cursor-pointer"
    >
      <div className="pointer-events-none fixed inset-0 grain-overlay" />

      {/* Expanding halo ring */}
      <motion.div
        initial={{ scale: 0.35, opacity: 0.35 }}
        animate={{ scale: 1.9, opacity: 0 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
        className="pointer-events-none absolute w-64 h-64 rounded-full border-2 border-current"
      />

      {/* Giant chapter number watermark */}
      <motion.span
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.14 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute font-display text-[14rem] sm:text-[22rem] font-extrabold leading-none tracking-tighter"
      >
        {theme.chapter}
      </motion.span>

      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        className="relative mb-4 text-5xl sm:text-6xl"
      >
        {theme.emoji}
      </motion.div>

      <p className="relative font-display text-xs font-extrabold uppercase tracking-[0.35em] opacity-75 mb-2">
        Chapter {theme.chapter}
      </p>

      <h2 className="relative font-display text-3xl sm:text-6xl font-extrabold tracking-tight leading-[1.05] max-w-lg">
        <RevealText text={theme.title} delay={0.08} stagger={0.05} />
      </h2>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 0.85, y: 0 }}
        transition={{ delay: 0.38, duration: 0.45 }}
        className="relative mt-2.5 font-serif italic text-2xl sm:text-3xl"
      >
        {theme.subtitle}
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.65 }}
        transition={{ delay: 0.5 }}
        className="relative mt-9 flex items-center gap-3"
      >
        <SparkleIcon size={12} />
        <div className="h-[3px] w-24 rounded-full bg-current/20 overflow-hidden">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: INTRO_DURATION_MS / 1000, ease: 'linear' }}
            style={{ transformOrigin: '0% 50%' }}
            className="h-full w-full rounded-full bg-current"
          />
        </div>
        <SparkleIcon size={12} />
      </motion.div>
    </motion.div>
  );
};
