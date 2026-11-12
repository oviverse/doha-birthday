import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Crown,
  Eye,
  EyeOff,
  Gem,
  Heart,
  Instagram,
  KeyRound,
  LockKeyhole,
  LockKeyholeOpen,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { ambientAudio } from '../../utils/ambientAudio';
import { triggerHaptic } from '../../utils/haptics';
import { fireCelebrationConfetti } from '../../utils/confetti';
import { Kicker, PrimaryButton, SparkleIcon } from '../ui/Primitives';

interface StagePasswordGateProps {
  isUnlocked: boolean;
  onUnlock: () => void;
}

const SECRET_PASSWORD = 'iloveyoudoha';

const WRONG_HINTS = [
  'Hmm, not quite! Ask me on Instagram for the password 💬😘',
  'Nice guess, pretty girl — slide into my Instagram DMs for the key ✨',
  'Locked tight for Doha’s eyes only! Text me on Instagram ❤️',
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
      {/* Energetic VIP Kicker */}
      <Kicker className="text-[#ffd166]">
        <Crown className="w-3.5 h-3.5 text-[#ffd166] inline-block -mt-0.5 mr-1" />
        Chapter 02 · VIP Access
      </Kicker>

      <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white mt-1 tracking-tight leading-[1.08]">
        For Doha&apos;s{' '}
        <span className="font-serif italic font-normal shimmer-text">Eyes Only</span>
        <span className="inline-flex items-center justify-center align-middle ml-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#ff2e7e]/35 to-[#ffbe0b]/30 border border-[#ffd166]/45 shadow-[0_0_18px_rgba(255,46,126,0.45)]">
          <Gem className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ffd166]" />
        </span>
      </h2>

      {/* Energetic Multi-Ring Vault Medallion */}
      <motion.div
        key={shakeKey}
        animate={
          unlockedState
            ? { scale: [1, 1.18, 1], rotate: [0, -8, 8, 0] }
            : shakeKey > 0
              ? { x: [-9, 9, -7, 7, -3, 3, 0] }
              : undefined
        }
        transition={
          unlockedState
            ? { duration: 0.55 }
            : shakeKey > 0
              ? { duration: 0.4 }
              : undefined
        }
        className={`relative my-3.5 flex items-center justify-center ${
          !unlockedState && shakeKey === 0 ? 'soft-bob' : ''
        }`}
      >
        {/* Vibrant pulsing radial glow */}
        <motion.div
          aria-hidden
          animate={{ scale: [1, 1.14, 1], opacity: [0.65, 0.95, 0.65] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: unlockedState
              ? 'radial-gradient(circle, rgba(52, 211, 153, 0.5) 0%, rgba(255, 209, 102, 0.25) 45%, transparent 72%)'
              : 'radial-gradient(circle, rgba(255, 46, 126, 0.5) 0%, rgba(255, 190, 11, 0.25) 45%, transparent 72%)',
          }}
          className="pointer-events-none absolute -inset-9 rounded-full"
        />

        {/* Rotating dashed energetic halo */}
        <motion.div
          aria-hidden
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
          className={`pointer-events-none absolute -inset-3 rounded-full border-2 border-dashed transition-colors duration-500 ${
            unlockedState ? 'border-[#34d399]/60' : 'border-[#ffd166]/55'
          }`}
        />

        {/* Floating mini orbiting badges */}
        <motion.span
          aria-hidden
          animate={{ y: [-2, 3, -2], rotate: [-8, 8, -8] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -top-2 -left-3 w-7 h-7 rounded-full bg-gradient-to-br from-[#ffbe0b] to-[#ff5f8f] text-[#24041d] flex items-center justify-center shadow-[0_6px_16px_rgba(255,190,11,0.5)] border border-white/60"
        >
          <KeyRound className="w-3.5 h-3.5" />
        </motion.span>

        <motion.span
          aria-hidden
          animate={{ y: [2, -3, 2], scale: [1, 1.12, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          className="pointer-events-none absolute -bottom-1.5 -right-3 w-7 h-7 rounded-full bg-gradient-to-br from-[#ff2e7e] to-[#9d4edd] text-white flex items-center justify-center shadow-[0_6px_16px_rgba(255,46,126,0.55)] border border-white/45"
        >
          <Heart className="w-3.5 h-3.5 fill-white" />
        </motion.span>

        {/* Core Vault Badge */}
        <div
          className={`relative w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-full p-[2px] shadow-[0_16px_40px_rgba(0,0,0,0.6)] transition-all duration-500 ${
            unlockedState
              ? 'bg-gradient-to-br from-[#34d399] via-[#ffd166] to-[#10b981]'
              : 'bg-gradient-to-br from-[#ff2e7e] via-[#ffbe0b] to-[#9d4edd]'
          }`}
        >
          <div className="w-full h-full rounded-full bg-[#1a0424]/90 flex items-center justify-center">
            {unlockedState ? (
              <LockKeyholeOpen className="w-8 h-8 sm:w-9 sm:h-9 text-[#6ee7b7] drop-shadow-[0_0_12px_rgba(52,211,153,0.75)]" />
            ) : (
              <LockKeyhole className="w-8 h-8 sm:w-9 sm:h-9 text-[#ffd166] drop-shadow-[0_0_12px_rgba(255,209,102,0.65)]" />
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Gradient-Framed Card */}
      <div className="w-full max-w-md rounded-[30px] p-[1.5px] bg-gradient-to-br from-[#ff2e7e]/75 via-[#ffd166]/65 to-[#9d4edd]/75 shadow-[0_24px_64px_-14px_rgba(255,46,126,0.45)]">
        <div
          className="relative w-full rounded-[28.5px] p-4 sm:p-6 overflow-hidden"
          style={{
            background:
              'radial-gradient(120% 90% at 50% 0%, rgba(105, 22, 86, 0.92) 0%, rgba(34, 7, 46, 0.96) 55%, rgba(16, 3, 28, 0.98) 100%)',
          }}
        >
          <SparkleIcon size={12} color="#ffd166" className="absolute top-3.5 left-3.5 opacity-65" />
          <SparkleIcon size={12} color="#ff4f8b" className="absolute top-3.5 right-3.5 opacity-65" />

          <p className="font-serif italic text-[19px] sm:text-[22px] text-[#ffe5ec] leading-snug">
            “Did you really think I&apos;d let everyone see your pretty page and all your sweet little secrets?”
          </p>

          <p className="mt-2 text-xs sm:text-[13px] text-white/82 leading-relaxed">
            No way — this whole surprise belongs only to you. Enter the secret password below to unlock the rest of your gift!
          </p>

          {/* Energetic Instagram Clue Pill */}
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff2e7e]/25 via-[#ff7a59]/22 to-[#ffbe0b]/25 border border-[#ffd166]/45 px-3.5 py-1.5 text-[11px] font-bold text-[#fff1d6] shadow-[0_6px_20px_rgba(255,46,126,0.22)]">
            <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#ffbe0b] via-[#ff2e7e] to-[#9d4edd] flex items-center justify-center text-white shrink-0">
              <Instagram className="w-2.5 h-2.5" />
            </span>
            <span>Ask me on Instagram for the password</span>
            <Heart className="w-3 h-3 text-[#ff4f8b] fill-[#ff4f8b] shrink-0" />
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            {!unlockedState ? (
              <>
                <div className="relative group">
                  <KeyRound
                    className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${
                      password.length > 0 ? 'text-[#ffd166]' : 'text-[#ff8fab]/75'
                    }`}
                  />
                  <input
                    ref={inputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Type the secret key…"
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="off"
                    spellCheck={false}
                    enterKeyHint="go"
                    aria-label="Secret password"
                    className="w-full rounded-2xl bg-black/45 border border-[#ff8fab]/30 focus:border-[#ffd166] focus:shadow-[0_0_24px_rgba(255,46,126,0.35)] focus:outline-none pl-10 pr-11 py-3 text-center font-display text-sm sm:text-base font-bold tracking-wider text-white placeholder:text-white/45 placeholder:font-medium placeholder:tracking-normal transition"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(6);
                      setShowPassword((s) => !s);
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-[#ffd166] p-1 cursor-pointer transition-colors"
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
                  variant="pink"
                  disabled={!password.trim()}
                  className="w-full py-3 text-sm"
                >
                  <KeyRound className="w-4 h-4 text-[#fff6c9]" />
                  <span>Unlock My Surprise</span>
                  <Sparkles className="w-4 h-4 text-[#fff6c9]" />
                </PrimaryButton>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-3 pt-1"
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-[#10b981]/20 border border-[#34d399]/50 px-4 py-1.5 text-xs sm:text-sm font-extrabold text-[#a7f3d0]">
                  <ShieldCheck className="w-4 h-4 text-[#34d399]" />
                  <span>Unlocked! Welcome in, my love</span>
                  <Heart className="w-3.5 h-3.5 text-[#ff6b9d] fill-[#ff6b9d]" />
                </div>
                <PrimaryButton
                  type="button"
                  variant="gold"
                  onClick={() => {
                    triggerHaptic(12);
                    onUnlock();
                  }}
                  className="w-full py-3 text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Open Your Love Letter</span>
                  <ArrowRight className="w-4 h-4" />
                </PrimaryButton>
              </motion.div>
            )}
          </form>
        </div>
      </div>
    </motion.div>
  );
};
