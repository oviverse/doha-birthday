import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Cake,
  CalendarHeart,
  Camera,
  Crown,
  Feather,
  Flame,
  Heart,
  HeartHandshake,
  Infinity as InfinityIcon,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
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

const FINALE_TABS = [
  { label: 'Keepsake', Icon: Camera },
  { label: 'Final Letter', Icon: Feather },
  { label: 'Forever', Icon: Flame },
] as const;

const AMBIENT_EMBERS = [
  { left: '12%', delay: 0.2, dur: 9, size: 4, color: '#ffd166' },
  { left: '28%', delay: 2.1, dur: 11, size: 3, color: '#ff8fab' },
  { left: '48%', delay: 0.9, dur: 10, size: 5, color: '#ffd166' },
  { left: '68%', delay: 3.4, dur: 12, size: 3.5, color: '#ff5f8f' },
  { left: '85%', delay: 1.5, dur: 9.5, size: 4, color: '#ffe8b3' },
];

export const Stage8FinalMessage: React.FC<Stage8FinalMessageProps> = ({ onRestart }) => {
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);
  const [whisperIndex, setWhisperIndex] = useState(0);
  const [toastIndex, setToastIndex] = useState<number | null>(null);
  const [magicCount, setMagicCount] = useState(0);
  const [lanterns, setLanterns] = useState<FloatingLantern[]>([]);
  const [shootingStarKey, setShootingStarKey] = useState(0);

  const spawnLantern = (xPct?: number, silent = false) => {
    const id = Date.now() + Math.random();
    if (!silent) {
      ambientAudio.playLanternChime(magicCount);
      triggerHaptic(10);
    }
    const lantern: FloatingLantern = {
      id,
      xPct: xPct ?? 14 + Math.random() * 72,
      scale: 0.78 + Math.random() * 0.42,
      driftX: (Math.random() - 0.5) * 44,
      wish: LANTERN_WISHES[Math.floor(Math.random() * LANTERN_WISHES.length)],
    };
    setLanterns((prev) => [...prev.slice(-11), lantern]);
    window.setTimeout(() => {
      setLanterns((prev) => prev.filter((l) => l.id !== id));
    }, 5200);
  };

  useEffect(() => {
    const stopFireworks = fireFireworks(6500);

    // Launch gentle starter lanterns so the finale sky feels immediately alive
    const t1 = window.setTimeout(() => spawnLantern(18, true), 350);
    const t2 = window.setTimeout(() => spawnLantern(82, true), 1150);

    // Periodic shooting star streak
    const starInterval = window.setInterval(() => {
      setShootingStarKey((k) => k + 1);
    }, 5500);

    return () => {
      stopFireworks();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearInterval(starInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      {/* Immersive Aurora, Shooting Star & Rising Ember Layer */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Soft glowing cosmic aurora */}
        <motion.div
          animate={{ opacity: [0.35, 0.58, 0.35], scale: [1, 1.06, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[125vw] max-w-[780px] h-72 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(255,61,127,0.34) 0%, rgba(255,209,102,0.2) 48%, transparent 75%)',
          }}
        />

        {/* Occasional shooting star */}
        <div
          key={shootingStarKey}
          className="shooting-star absolute top-[12%] left-0 w-24 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#ffd166] to-white shadow-[0_0_12px_#fff]"
        />

        {/* Warm rising golden-rose embers */}
        {AMBIENT_EMBERS.map((e, i) => (
          <motion.span
            key={i}
            initial={{ y: '100dvh', opacity: 0 }}
            animate={{ y: '-12dvh', opacity: [0, 0.75, 0.6, 0] }}
            transition={{ duration: e.dur, delay: e.delay, repeat: Infinity, ease: 'linear' }}
            style={{
              left: e.left,
              width: e.size,
              height: e.size,
              backgroundColor: e.color,
              boxShadow: `0 0 10px ${e.color}`,
            }}
            className="absolute rounded-full"
          />
        ))}
      </div>

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
                className="w-8 h-10 rounded-t-xl rounded-b-md border border-[#ffe8a3]/75 shadow-[0_0_26px_8px_rgba(255,180,80,0.55)] flex items-end justify-center pb-1"
                style={{
                  background:
                    'radial-gradient(circle at 50% 65%, #fff7d6 0%, #ffb74d 45%, #e65100 100%)',
                }}
              >
                <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#fff]" />
              </div>
              <span className="mt-1 text-[9px] font-bold tracking-wider text-[#ffe8b3]/90 whitespace-nowrap drop-shadow">
                {l.wish}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Finale Header */}
      <Kicker className="relative z-20 text-[#ffd166]">
        <Crown className="w-3.5 h-3.5 text-[#ffd166] inline-block -mt-0.5 mr-1" />
        Chapter 10 · Forever Yours
      </Kicker>

      <h2 className="relative z-20 font-display text-2xl sm:text-4xl font-extrabold text-white mt-1 tracking-tight leading-[1.06]">
        <RevealText text="Happy 21st Birthday," delay={0.08} />
        <span className="block font-serif italic font-normal text-3xl sm:text-5xl shimmer-text mt-0.5 drop-shadow-[0_6px_28px_rgba(255,61,127,0.45)]">
          My Forever, Doha ❤️
        </span>
      </h2>

      {/* Sleek Icon + Label Segmented Tab Bar */}
      <div className="relative z-20 mt-2.5 inline-flex items-center gap-1 rounded-full glass p-1 border border-[#ffd166]/25 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
        {FINALE_TABS.map(({ label, Icon }, idx) => {
          const tabIdx = idx as 0 | 1 | 2;
          const active = activeTab === tabIdx;
          return (
            <button
              key={label}
              type="button"
              onClick={() => switchTab(tabIdx)}
              className={`relative rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                active ? 'text-[#24041d]' : 'text-white/75 hover:text-white'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="finale-tab-pill"
                  transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-[#ff5f8f] via-[#ff8fab] to-[#ffd166] shadow-[0_4px_16px_rgba(255,95,143,0.45)]"
                />
              )}
              <Icon className="relative z-10 w-3.5 h-3.5 shrink-0" />
              <span className="relative z-10">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Swipeable / Paged Finale Stage */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.14}
        onDragEnd={(_, info) => {
          if (info.offset.x < -48 && activeTab < 2) switchTab((activeTab + 1) as 0 | 1 | 2);
          if (info.offset.x > 48 && activeTab > 0) switchTab((activeTab - 1) as 0 | 1 | 2);
        }}
        className="relative z-20 w-full max-w-lg mt-2.5 flex flex-col items-center"
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
                <motion.div
                  aria-hidden
                  animate={{ scale: [1, 1.08, 1], opacity: [0.65, 0.95, 0.65] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    background:
                      'radial-gradient(circle, rgba(255, 61, 127, 0.38) 0%, rgba(255, 209, 102, 0.22) 48%, transparent 74%)',
                  }}
                  className="pointer-events-none absolute -inset-11 rounded-full"
                />

                <motion.button
                  type="button"
                  onClick={handlePhotoTap}
                  whileHover={{ scale: 1.03, rotate: 0 }}
                  whileTap={{ scale: 0.96 }}
                  aria-label="Our pinned keepsake photo — tap for sparkles"
                  className="keepsake-sway group relative cursor-pointer focus:outline-none"
                >
                  {/* 3D Rose-Gold Pushpin */}
                  <div className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                    <div className="absolute top-2.5 left-1.5 w-4 h-4 rounded-full bg-black/55 blur-[3px]" />
                    <div
                      className="relative w-5 h-5 rounded-full border border-[#fff6d6]/80 shadow-[0_6px_14px_rgba(0,0,0,0.6)]"
                      style={{
                        background:
                          'radial-gradient(circle at 32% 28%, #fff9e6 0%, #ffd166 36%, #ff6b9d 78%, #6d103c 100%)',
                      }}
                    >
                      <span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-white/90" />
                    </div>
                  </div>

                  {/* Luminous Pinned Photo Frame */}
                  <div className="relative w-[min(56vw,215px,28dvh)] sm:w-[235px] aspect-[4/4.6] rounded-[24px] p-[2px] bg-gradient-to-b from-[#ffd166]/65 via-[#ff6b9d]/45 to-white/10 shadow-[0_24px_55px_-12px_rgba(255,61,127,0.45)]">
                    <div className="relative w-full h-full rounded-[22px] overflow-hidden bg-[#1a0630]/60">
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

                <span className="mt-1.5 inline-flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#ffe5ec]/65">
                  <Sparkles className="w-3 h-3 text-[#ffd166]" />
                  <span>tap keepsake</span>
                  <Heart className="w-2.5 h-2.5 text-[#ff6b9d] fill-[#ff6b9d]" />
                </span>
              </div>

              {/* Colorful Icon-Rich Milestone Strip */}
              <div className="mt-1.5 w-full grid grid-cols-3 gap-2">
                <div className="rounded-2xl py-2.5 px-1.5 bg-gradient-to-b from-[#ffd166]/20 to-[#ff9f1c]/10 border border-[#ffd166]/35 backdrop-blur-md shadow-[0_10px_25px_-10px_rgba(255,209,102,0.35)] flex flex-col items-center">
                  <Cake className="w-3.5 h-3.5 text-[#ffd166] mb-0.5" />
                  <p className="font-display text-xl sm:text-2xl font-extrabold gold-text leading-tight">
                    <Counter to={21} duration={1.3} delay={0.3} />
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#ffe8b3]/80">
                    Magical Years
                  </p>
                </div>

                <div className="rounded-2xl py-2.5 px-1.5 bg-gradient-to-b from-[#ff3d7f]/25 to-[#c9184a]/12 border border-[#ff8fab]/45 backdrop-blur-md shadow-[0_10px_25px_-10px_rgba(255,61,127,0.4)] flex flex-col items-center">
                  <InfinityIcon className="w-3.5 h-3.5 text-[#ff8fab] mb-0.5" />
                  <p className="font-display text-xl sm:text-2xl font-extrabold text-[#ffd6e6] leading-tight">
                    {magicCount > 0 ? `∞ + ${magicCount}` : '∞'}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#ffd6e0]/85">
                    All My Love
                  </p>
                </div>

                <div className="rounded-2xl py-2.5 px-1.5 bg-gradient-to-b from-[#c77dff]/20 to-[#7b2ff7]/12 border border-[#c77dff]/35 backdrop-blur-md shadow-[0_10px_25px_-10px_rgba(199,125,255,0.35)] flex flex-col items-center">
                  <CalendarHeart className="w-3.5 h-3.5 text-[#e0aaff] mb-0.5" />
                  <p className="font-display text-xl sm:text-2xl font-extrabold text-[#f3d9ff] leading-tight">
                    <Counter to={365} duration={1.5} delay={0.3} />
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#e0aaff]/85">
                    Days Cheering
                  </p>
                </div>
              </div>

              <PrimaryButton
                variant="gold"
                onClick={() => switchTab(1)}
                className="mt-4 px-7 py-3 text-sm"
              >
                <Feather className="w-4 h-4" />
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
              {/* Luminous Rose-Gold Framed Velvet Letter Card */}
              <div className="w-full rounded-[26px] p-[1.5px] bg-gradient-to-br from-[#ffd166]/70 via-[#ff4f8b]/60 to-[#9d4edd]/65 shadow-[0_28px_70px_-15px_rgba(255,61,127,0.45)]">
                <div
                  className="relative w-full rounded-[24.5px] p-4 sm:p-5 text-left overflow-hidden"
                  style={{
                    background:
                      'radial-gradient(120% 80% at 50% 0%, rgba(92, 20, 78, 0.92) 0%, rgba(28, 6, 48, 0.96) 55%, rgba(14, 3, 28, 0.98) 100%)',
                  }}
                >
                  <SparkleIcon size={12} color="#ffd166" className="absolute top-3 left-3 opacity-65" />
                  <SparkleIcon size={12} color="#ff8fab" className="absolute top-3 right-3 opacity-65" />

                  <div className="relative text-center pb-2 mb-2.5 border-b border-[#ffd166]/20">
                    <p className="inline-flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.24em] text-[#ffd166]">
                      <Feather className="w-3 h-3 text-[#ffd166]" />
                      <span>A Promise For Year 21</span>
                      <HeartHandshake className="w-3 h-3 text-[#ff8fab]" />
                    </p>
                    <p className="font-serif italic text-base sm:text-xl text-[#ffd6e0] mt-0.5">
                      “Every version of my future has you in it.”
                    </p>
                  </div>

                  <div className="relative space-y-2">
                    {FINAL_MESSAGE_PARAGRAPHS.map((para, idx) => (
                      <p
                        key={idx}
                        className="text-[12px] sm:text-[13.5px] leading-[1.42] text-[#fff8f0]/94"
                      >
                        {para}
                      </p>
                    ))}
                  </div>

                  <div className="relative mt-3 pt-2.5 flex items-end justify-between border-t border-[#ffd166]/20">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff3d7f]/25 to-[#ffd166]/15 border border-[#ff8fab]/40 px-3 py-1 text-[10.5px] font-bold text-[#ffe5ec]">
                      <Heart className="w-3 h-3 text-[#ff4f8b] fill-[#ff4f8b]" />
                      <span>Always yours</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[8.5px] font-bold uppercase tracking-[0.22em] text-white/60">
                        With all my love,
                      </p>
                      <p className="font-hand text-2xl sm:text-3xl font-bold text-[#ffd166] leading-none">
                        Abhi Vaidya ❤️
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <PrimaryButton
                variant="pink"
                onClick={() => switchTab(2)}
                className="mt-2.5 px-7 py-2.5 text-sm"
              >
                <Flame className="w-4 h-4 text-[#fff6c9]" />
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
              <div className="w-full rounded-[30px] p-[1.5px] bg-gradient-to-br from-[#ffd166]/75 via-[#ff3d7f]/65 to-[#9d4edd]/75 shadow-[0_24px_65px_-12px_rgba(255,61,127,0.45)]">
                <div
                  className="relative w-full rounded-[28.5px] p-5 sm:p-7 overflow-hidden"
                  style={{
                    background:
                      'radial-gradient(120% 85% at 50% 0%, rgba(108, 22, 86, 0.9) 0%, rgba(30, 7, 46, 0.96) 55%, rgba(13, 3, 24, 0.98) 100%)',
                  }}
                >
                  {/* Custom Glowing Lantern & Starlight Emblem */}
                  <div className="relative mx-auto mb-3 w-20 h-20 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.18, 1], opacity: [0.55, 0.9, 0.55] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full blur-xl"
                      style={{
                        background:
                          'radial-gradient(circle, rgba(255,190,11,0.55) 0%, rgba(255,61,127,0.35) 60%, transparent 80%)',
                      }}
                    />

                    {/* Floating glowing lantern centerpiece */}
                    <motion.div
                      animate={{ y: [-3, 3, -3] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="relative w-11 h-14 rounded-t-2xl rounded-b-lg border border-[#fff6c9]/80 shadow-[0_0_28px_rgba(255,190,11,0.65)] flex flex-col items-center justify-end pb-1.5"
                      style={{
                        background:
                          'radial-gradient(circle at 50% 62%, #fffbe6 0%, #ffd166 42%, #ff7a3d 85%, #c9184a 100%)',
                      }}
                    >
                      <Flame className="w-4 h-4 text-white drop-shadow-[0_0_6px_#fff]" />
                      <span className="mt-1 w-4 h-[2px] rounded-full bg-[#ffe8a3]/80" />
                    </motion.div>

                    {/* Orbiting Sparkle & Heart badges */}
                    <span className="absolute -top-0.5 right-1 w-6 h-6 rounded-full bg-gradient-to-br from-[#ff3d7f] to-[#c9184a] border border-white/50 flex items-center justify-center shadow-lg">
                      <Heart className="w-3 h-3 text-white fill-white" />
                    </span>
                    <span className="absolute bottom-1 left-0.5 w-6 h-6 rounded-full bg-gradient-to-br from-[#ffd166] to-[#ff9f1c] border border-white/60 flex items-center justify-center shadow-lg">
                      <Sparkles className="w-3 h-3 text-[#24041d]" />
                    </span>
                  </div>

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
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff3d7f]/30 to-[#ffd166]/20 border border-[#ff8fab]/45 px-4 py-1.5 text-xs font-semibold text-[#ffe5ec]"
                      >
                        <Heart className="w-3.5 h-3.5 text-[#ff8fab] fill-[#ff8fab] shrink-0" />
                        <span>{LOVE_TOASTS[toastIndex]}</span>
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                    <PrimaryButton
                      variant="gold"
                      onClick={handleExtraMagic}
                      className="px-6 py-3 text-xs sm:text-sm"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Release Wish Lantern</span>
                      <Sparkles className="w-4 h-4" />
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
                    <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-[#ffd166]/15 border border-[#ffd166]/35 px-3.5 py-1 text-[11px] font-bold tracking-wider uppercase text-[#ffd166]">
                      <Flame className="w-3.5 h-3.5 text-[#ff9f1c]" />
                      <span>
                        {magicCount} {magicCount === 1 ? 'Wish Lantern' : 'Wish Lanterns'} Released
                      </span>
                      <Sparkles className="w-3 h-3 text-[#ffd166]" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
