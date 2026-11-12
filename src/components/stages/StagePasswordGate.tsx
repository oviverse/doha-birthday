import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Lock, LockOpen, MessageCircleHeart, Sparkles } from 'lucide-react';
import { ambientAudio } from '../../utils/ambientAudio';
import { triggerHaptic } from '../../utils/haptics';
import { fireCelebrationConfetti } from '../../utils/confetti';
import { Kicker, PrimaryButton } from '../ui/Primitives';

interface StagePasswordGateProps {
  isUnlocked: boolean;
  onUnlock: () => void;
}

const SECRET_PASSWORD = 'iloveyoudoha';

const WRONG_HINTS = [
  "Hmm, not quite! Ask me on Instagram for the password 💬😘",
  "Nice guess, pretty girl — slide into my Instagram DMs for the key ✨",
  "Locked tight for Doha’s eyes only! Text me on Instagram ❤️",
];

export const StagePasswordGate: React.FC<StagePasswordGateProps> = ({
  isUnlocked,
  onUnlock,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const unlockedState = isUnlocked || justUnlocked;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockedState) {
      triggerHaptic(10);
      onUnlock();
      return;
    }

    const normalized = password.trim().toLowerCase().replace(/\s+/g, '');
    if (normalized === SECRET_PASSWORD) {
      setJustUnlocked(true);
      triggerHaptic([16, 28, 18]);
      ambientAudio.playJackpotFanfare();
      fireCelebrationConfetti();
      window.setTimeout(() => {
        onUnlock();
      }, 950);
    } else {
      triggerHaptic([18, 35, 18]);
      ambientAudio.playSoftTap(0.65);
      setErrorCount((c) => c + 1);
      setShakeKey((k) => k + 1);
      inputRef.current?.focus();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24, scale: 0.96 }}
      transition={{ duration: 0.5 }}
      className="relative w-full flex flex-col items-center text-center"
    >
      <Kicker className="text-[#ffd166]">Chapter 02 · VIP Access</Kicker>

      <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white mt-1 tracking-tight leading-[1.08]">
        For Doha&apos;s{' '}
        <span className="font-serif italic font-normal text-[#ff8fab]">Eyes Only</span> 🔐
      </h2>

      {/* Animated Padlock Medallion */}
      <motion.div
        key={shakeKey}
        animate={
          unlockedState
            ? { scale: [1, 1.16, 1], rotate: [0, -6, 6, 0] }
            : shakeKey > 0
              ? { x: [-9, 9, -7, 7, -3, 3, 0] }
              : { y: [0, -4, 0] }
        }
        transition={
          unlockedState
            ? { duration: 0.55 }
            : shakeKey > 0
              ? { duration: 0.4 }
              : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
        }
        className="relative my-3.5 flex items-center justify-center"
      >
        <div
          aria-hidden
          className={`pointer-events-none absolute -inset-4 rounded-full blur-2xl transition-colors duration-500 ${
            unlockedState ? 'bg-[#4ade80]/35' : 'bg-[#ff4f8b]/35'
          }`}
        />
        <div
          className={`relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full border flex items-center justify-center shadow-[0_14px_35px_rgba(0,0,0,0.55)] transition-colors duration-500 ${
            unlockedState
              ? 'bg-gradient-to-br from-[#4ade80]/30 to-[#10b981]/20 border-[#4ade80]/60 text-[#86efac]'
              : 'bg-gradient-to-br from-[#ff4f8b]/30 via-[#ffd166]/20 to-[#7b2ff7]/30 border-[#ffd166]/50 text-[#ffd166]'
          }`}
        >
          {unlockedState ? (
            <LockOpen className="w-7 h-7 sm:w-8 sm:h-8" />
          ) : (
            <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
          )}
        </div>
      </motion.div>

      {/* Main Teasing Message + Password Form Card */}
      <div className="glass w-full max-w-md rounded-[28px] p-4 sm:p-6 border border-white/18 shadow-2xl">
        <p className="font-serif italic text-[19px] sm:text-[22px] text-[#ffe5ec] leading-snug">
          “Did you really think I&apos;d let everyone see your pretty page and all your sweet little secrets?”
        </p>

        <p className="mt-2 text-xs sm:text-[13px] text-white/80 leading-relaxed">
          No way — this whole surprise belongs only to you. Enter the secret password below to unlock the rest of your gift!
        </p>

        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#ff4f8b]/18 border border-[#ff8fab]/35 px-3.5 py-1 text-[11px] font-bold text-[#ffd6e6]">
          <MessageCircleHeart className="w-3.5 h-3.5 text-[#ff8fab] shrink-0" />
          <span>Ask me on Instagram for the password 💬</span>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {!unlockedState ? (
            <>
              <div className="relative">
                <input
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secret password…"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="off"
                  spellCheck={false}
                  enterKeyHint="go"
                  aria-label="Secret password"
                  className="w-full rounded-2xl bg-black/40 border border-white/20 focus:border-[#ffd166]/80 focus:outline-none px-4 py-3 pr-11 text-center font-display text-sm sm:text-base font-bold tracking-wider text-white placeholder:text-white/40 placeholder:font-medium placeholder:tracking-normal transition"
                />
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(6);
                    setShowPassword((s) => !s);
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/55 hover:text-white p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {errorCount > 0 && (
                  <motion.p
                    key={errorCount}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[11px] font-semibold text-[#ffd166]"
                  >
                    {WRONG_HINTS[(errorCount - 1) % WRONG_HINTS.length]}
                  </motion.p>
                )}
              </AnimatePresence>

              <PrimaryButton
                type="submit"
                variant="gold"
                disabled={!password.trim()}
                className="w-full py-3 text-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>Unlock My Surprise</span>
              </PrimaryButton>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3 pt-1"
            >
              <p className="text-sm font-extrabold text-[#86efac]">
                Unlocked! Welcome in, my love ❤️
              </p>
              <PrimaryButton
                type="button"
                variant="pink"
                onClick={() => {
                  triggerHaptic(12);
                  onUnlock();
                }}
                className="w-full py-3 text-sm"
              >
                <span>Open Your Love Letter</span>
                <ArrowRight className="w-4 h-4" />
              </PrimaryButton>
            </motion.div>
          )}
        </form>
      </div>
    </motion.div>
  );
};
