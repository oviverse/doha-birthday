import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Heart, RotateCcw, Sparkles } from 'lucide-react';
import foreverUsPhoto from '../../../asset/images/forever-us.jpg';
import { FINAL_MESSAGE_PARAGRAPHS } from '../../data/birthdayContent';
import { ambientAudio } from '../../utils/ambientAudio';
import { triggerHaptic } from '../../utils/haptics';
import { fireCelebrationConfetti, fireFireworks, fireSparkleBurst } from '../../utils/confetti';
import { Counter, Kicker, PrimaryButton, RevealText, SparkleIcon } from '../ui/Primitives';

interface Stage8FinalMessageProps {
  onRestart: () => void;
}

interface FloatingLantern {
  id: number;
  xPct: number;
  scale: number;
  driftX: number;
  wish: string;
}

const PHOTO_WHISPERS = [
  'you & me, one day for real 🎀',
  'counting down until we finally meet ❤️',
  '21 never looked so radiant ✨',
  'forever my favorite story 💖',
];

const LOVE_TOASTS = [
  'Sending 1,000,000 hugs across the miles to Doha! 🫂💖',
  'May every wish you made tonight come true ✨',
  'Still falling for your smile and your voice every single day ❤️',
  'Here is to your brightest, happiest year yet! 🥂',
];

const LANTERN_WISHES = ['Health & Peace', 'Ocean Days', 'Endless Art', 'Sweet Songs', 'Us Forever'];

const FINALE_TABS = ['Keepsake', 'Final Letter', 'Forever'] as const;

export const Stage8FinalMessage: React.FC<Stage8FinalMessageProps> = ({ onRestart }) => {
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);
  const [whisperIndex, setWhisperIndex] = useState(0);
  const [toastIndex, setToastIndex] = useState<number | null>(null);
  const [magicCount, setMagicCount] = useState(0);
  const [lanterns, setLanterns] = useState<FloatingLantern[]>([]);

  useEffect(() => {
    const stopFireworks = fireFireworks(6500);
    return () => stopFireworks();
  }, []);

  const spawnLantern = (xPct?: number) => {
    const id = Date.now() + Math.random();
    const nextStep = magicCount;
    ambientAudio.playLanternChime(nextStep);
    triggerHaptic(10);
    const lantern: FloatingLantern = {
      id,
      xPct: xPct ?? 14 + Math.random() * 72,
      scale: 0.78 + Math.random() * 0.42,
      driftX: (Math.random() - 0.5) * 44,
      wish: LANTERN_WISHES[Math.floor(Math.random() * LANTERN_WISHES.length)],
    };
    setLanterns((prev) => [...prev.slice(-10), lantern]);
    window.setTimeout(() => {
      setLanterns((prev) => prev.filter((l) => l.id !== id));
    }, 5200);
  };

  const handlePhotoTap = () => {
    triggerHaptic(12);
    ambientAudio.playSparkleChime();
    fireSparkleBurst();
    setWhisperIndex((prev) => (prev + 1) % PHOTO_WHISPERS.length);
  };

  const handleExtraMagic = () => {
    triggerHaptic([12, 24, 12]);
    ambientAudio.playSparkleChime();
    fireCelebrationConfetti();
    spawnLantern();
    setMagicCount((prev) => prev + 1);
    setToastIndex((prev) => (prev === null ? 0 : (prev + 1) % LOVE_TOASTS.length));
  };

  const switchTab = (next: 0 | 1 | 2) => {
    if (next === activeTab) return;
    triggerHaptic(8);
    ambientAudio.playSoftTap(1.06);
    setActiveTab(next);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.65 }}
      className="relative w-full flex flex-col items-center text-center"
    >
      {/* Floating Glowing Wish Lanterns Layer */}
      <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
        <AnimatePresence>
          {lanterns.map((l) => (
            <motion.div
              key={l.id}
              initial={{ y: '92dvh', x: 0, opacity: 0, scale: l.scale * 0.8 }}
              animate={{
                y: '-18dvh',
                x: l.driftX,
                opacity: [0, 0.95, 0.9, 0],
                scale: l.scale,
              }}
              transition={{ duration: 5.0, ease: 'easeOut' }}
              style={{ left: `${l.xPct}%` }}
              className="absolute flex flex-col items-center -translate-x-1/2"
            >
              <div
                className="w-8 h-10 rounded-t-xl rounded-b-md border border-[#ffe8a3]/65 shadow-[0_0_24px_6px_rgba(255,180,80,0.5)] flex items-end justify-center pb-1"
                style={{
                  background:
                    'radial-gradient(circle at 50% 65%, #fff7d6 0%, #ffb74d 45%, #e65100 100%)',
                }}
              >
                <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#fff]" />
              </div>
              <span className="mt-1 text-[9px] font-bold tracking-wider text-[#ffe8b3]/85 whitespace-nowrap drop-shadow">
                {l.wish}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Finale Header */}
      <Kicker className="text-[#ffd166]">Chapter 09 · Forever Yours</Kicker>

      <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white mt-1 tracking-tight leading-[1.06]">
        <RevealText text="Happy 21st Birthday," delay={0.08} />
        <span className="block font-serif italic font-normal text-3xl sm:text-5xl shimmer-text mt-0.5 drop-shadow-[0_6px_28px_rgba(255,107,157,0.35)]">
          My Forever, Doha ❤️
        </span>
      </h2>

      {/* Sleek Segmented Tab Bar */}
      <div className="mt-2.5 inline-flex items-center gap-1 rounded-full glass p-1 border border-white/15">
        {FINALE_TABS.map((label, idx) => {
          const tabIdx = idx as 0 | 1 | 2;
          const active = activeTab === tabIdx;
          return (
            <button
              key={label}
              type="button"
              onClick={() => switchTab(tabIdx)}
              className={`rounded-full px-3.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                active
                  ? 'bg-gradient-to-r from-[#ff5f8f] to-[#ffd166] text-[#2a0a26] shadow'
                  : 'text-white/75 hover:text-white'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Swipeable / Paged Finale Stage (Fits cleanly inside 100dvh with zero vertical scroll) */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.14}
        onDragEnd={(_, info) => {
          if (info.offset.x < -48 && activeTab < 2) switchTab((activeTab + 1) as 0 | 1 | 2);
          if (info.offset.x > 48 && activeTab > 0) switchTab((activeTab - 1) as 0 | 1 | 2);
        }}
        className="w-full max-w-lg mt-2.5 flex flex-col items-center"
      >
        <AnimatePresence mode="wait">
          {activeTab === 0 && (
            <motion.div
              key="finale-tab-0"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              className="w-full flex flex-col items-center"
            >
              {/* Pinned & Softly Faded Keepsake Photograph */}
              <div className="relative mt-2 mb-1.5 flex flex-col items-center z-20">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-5 rounded-full bg-gradient-to-br from-[#ff6b9d]/30 via-[#ffd166]/20 to-[#9d4edd]/35 blur-3xl opacity-80"
                />

                <motion.button
                  type="button"
                  onClick={handlePhotoTap}
                  animate={{ rotate: [-2.2, -1.1, -2.2] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                  whileHover={{ scale: 1.03, rotate: 0 }}
                  whileTap={{ scale: 0.96 }}
                  style={{ transformOrigin: '50% 10px' }}
                  aria-label="Our pinned keepsake photo — tap for sparkles"
                  className="group relative cursor-pointer focus:outline-none"
                >
                  {/* 3D Rose-Gold Pushpin */}
                  <div className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                    <div className="absolute top-2.5 left-1.5 w-4 h-4 rounded-full bg-black/55 blur-[3px]" />
                    <div
                      className="relative w-5 h-5 rounded-full border border-[#fff6d6]/70 shadow-[0_6px_14px_rgba(0,0,0,0.6)]"
                      style={{
                        background:
                          'radial-gradient(circle at 32% 28%, #fff9e6 0%, #ffd166 36%, #ff6b9d 78%, #6d103c 100%)',
                      }}
                    >
                      <span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-white/90" />
                    </div>
                  </div>

                  {/* Faded Pinned Photo Frame */}
                  <div className="relative w-[min(56vw,215px,28dvh)] sm:w-[235px] aspect-[4/4.6] rounded-[24px] p-1.5 bg-gradient-to-b from-white/20 via-white/8 to-transparent shadow-[0_24px_50px_-14px_rgba(0,0,0,0.75)] backdrop-blur-sm">
                    <div className="relative w-full h-full rounded-[19px] overflow-hidden bg-[#1a0630]/40">
                      <img
                        src={foreverUsPhoto}
                        alt="A keepsake Polaroid of Abhi and Doha together one day"
                        style={{
                          maskImage:
                            'radial-gradient(ellipse 90% 88% at 50% 47%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.72) 74%, rgba(0,0,0,0.08) 99%)',
                          WebkitMaskImage:
                            'radial-gradient(ellipse 90% 88% at 50% 47%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.72) 74%, rgba(0,0,0,0.08) 99%)',
                        }}
                        className="w-full h-full object-cover object-[50%_41%] scale-[1.06] opacity-92 group-hover:opacity-100 transition-opacity duration-500"
                      />
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background:
                            'radial-gradient(ellipse 92% 90% at 50% 46%, transparent 48%, rgba(26, 6, 48, 0.42) 82%, rgba(15, 3, 30, 0.82) 100%)',
                        }}
                      />
                      <div className="pointer-events-none absolute inset-x-2.5 bottom-2 flex justify-center">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={whisperIndex}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.35 }}
                            className="font-hand text-lg sm:text-xl text-[#ffe5ec] drop-shadow-[0_2px_10px_rgba(10,2,21,0.95)]"
                          >
                            {PHOTO_WHISPERS[whisperIndex]}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.button>

                <span className="mt-1.5 inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-[0.2em] text-white/45">
                  <Sparkles className="w-3 h-3 text-[#ffd166]/75" /> tap keepsake
                </span>
              </div>

              {/* Sleek Wrapped Milestone Strip */}
              <div className="mt-1.5 w-full grid grid-cols-3 gap-2">
                <div className="glass rounded-2xl py-2.5 px-1.5 border border-white/10">
                  <p className="font-display text-xl sm:text-2xl font-extrabold gold-text">
                    <Counter to={21} duration={1.3} delay={0.3} />
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/65">
                    Magical Years
                  </p>
                </div>
                <div className="glass rounded-2xl py-2.5 px-1.5 border border-[#ff8fab]/20">
                  <p className="font-display text-xl sm:text-2xl font-extrabold text-[#ff8fab]">
                    {magicCount > 0 ? `∞ + ${magicCount}` : '∞'}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/65">
                    All My Love
                  </p>
                </div>
                <div className="glass rounded-2xl py-2.5 px-1.5 border border-white/10">
                  <p className="font-display text-xl sm:text-2xl font-extrabold text-[#ffd6e0]">
                    <Counter to={365} duration={1.5} delay={0.3} />
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/65">
                    Days Cheering
                  </p>
                </div>
              </div>

              <PrimaryButton
                variant="gold"
                onClick={() => switchTab(1)}
                className="mt-4 px-7 py-3 text-sm"
              >
                <span>Read My Final Letter</span>
                <ArrowRight className="w-4 h-4" />
              </PrimaryButton>
            </motion.div>
          )}

          {activeTab === 1 && (
            <motion.div
              key="finale-tab-1"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              className="w-full flex flex-col items-center"
            >
              {/* Velvet & Rose-Gold Keepsake Letter Card */}
              <div
                className="relative w-full rounded-[24px] p-4 sm:p-5 text-left border border-[#ffd166]/25 shadow-[0_28px_70px_-15px_rgba(0,0,0,0.7)] overflow-hidden"
                style={{
                  background:
                    'linear-gradient(165deg, rgba(58, 15, 92, 0.74) 0%, rgba(26, 6, 48, 0.86) 55%, rgba(14, 3, 28, 0.92) 100%)',
                  backdropFilter: 'blur(20px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                }}
              >
                <SparkleIcon size={12} color="#ffd166" className="absolute top-3 left-3 opacity-50" />
                <SparkleIcon size={12} color="#ff8fab" className="absolute top-3 right-3 opacity-50" />

                <div className="relative text-center pb-2 mb-2.5 border-b border-white/10">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.26em] text-[#ffd166]/85">
                    ✦ A Promise For Year 21 ✦
                  </p>
                  <p className="font-serif italic text-base sm:text-xl text-[#ffd6e0] mt-0.5">
                    “Every version of my future has you in it.”
                  </p>
                </div>

                <div className="relative space-y-2">
                  {FINAL_MESSAGE_PARAGRAPHS.map((para, idx) => (
                    <p
                      key={idx}
                      className="text-[12px] sm:text-[13.5px] leading-[1.42] text-[#fff8f0]/92"
                    >
                      {para}
                    </p>
                  ))}
                </div>

                <div className="relative mt-3 pt-2.5 flex items-end justify-between border-t border-[#ffd166]/15">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ff6b9d]/15 border border-[#ff8fab]/30 px-3 py-1 text-[10.5px] font-bold text-[#ffd6e0]">
                    <Heart className="w-3 h-3 text-[#ff6b9d] fill-[#ff6b9d]" />
                    <span>Always yours</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[8.5px] font-bold uppercase tracking-[0.22em] text-white/55">
                      With all my love,
                    </p>
                    <p className="font-hand text-2xl sm:text-3xl font-bold text-[#ffd166] leading-none">
                      Abhi Vaidya ❤️
                    </p>
                  </div>
                </div>
              </div>

              <PrimaryButton
                variant="pink"
                onClick={() => switchTab(2)}
                className="mt-2.5 px-7 py-2.5 text-sm"
              >
                <span>Our 21st Tribute</span>
                <ArrowRight className="w-4 h-4" />
              </PrimaryButton>
            </motion.div>
          )}

          {activeTab === 2 && (
            <motion.div
              key="finale-tab-2"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 18 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              className="w-full flex flex-col items-center py-2"
            >
              <div className="glass w-full rounded-[28px] p-5 sm:p-7 border border-[#ffd166]/35 shadow-[0_20px_60px_-10px_rgba(255,107,157,0.3)]">
                <div className="text-4xl mb-2">🏮✨💖</div>
                <h3 className="font-serif italic text-2xl sm:text-3xl shimmer-text leading-snug">
                  21 Looks Beautiful on You, Doha. ❤️
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-white/85 leading-relaxed max-w-sm mx-auto">
                  Tap below to release glowing birthday wish lanterns into the sky and celebrate as long as you want!
                </p>

                <AnimatePresence mode="wait">
                  {toastIndex !== null && (
                    <motion.p
                      key={`${toastIndex}-${magicCount}`}
                      initial={{ opacity: 0, y: 6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="mt-3 inline-block rounded-full bg-[#ff6b9d]/25 border border-[#ff8fab]/40 px-4 py-1.5 text-xs font-semibold text-[#ffe5ec]"
                    >
                      {LOVE_TOASTS[toastIndex]}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                  <PrimaryButton
                    variant="gold"
                    onClick={handleExtraMagic}
                    className="px-6 py-3 text-xs sm:text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Release Wish Lantern</span>
                  </PrimaryButton>

                  <PrimaryButton
                    variant="ghost"
                    shine={false}
                    onClick={() => {
                      triggerHaptic(10);
                      onRestart();
                    }}
                    className="px-5 py-3 text-xs sm:text-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Replay Journey</span>
                  </PrimaryButton>
                </div>

                {magicCount > 0 && (
                  <p className="mt-3 text-[11px] font-bold tracking-wider uppercase text-[#ffd166]/80">
                    ✨ {magicCount} {magicCount === 1 ? 'Wish Lantern' : 'Wish Lanterns'} Released
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
