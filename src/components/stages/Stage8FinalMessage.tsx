import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, RotateCcw, Sparkles } from 'lucide-react';
import foreverUsPhoto from '../../../asset/images/forever-us.jpg';
import { FINAL_MESSAGE_PARAGRAPHS } from '../../data/birthdayContent';
import { ambientAudio } from '../../utils/ambientAudio';
import { fireCelebrationConfetti, fireFireworks, fireSparkleBurst } from '../../utils/confetti';
import { Counter, Kicker, PrimaryButton, RevealText, SparkleIcon } from '../ui/Primitives';

interface Stage8FinalMessageProps {
  onRestart: () => void;
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

export const Stage8FinalMessage: React.FC<Stage8FinalMessageProps> = ({ onRestart }) => {
  const [whisperIndex, setWhisperIndex] = useState(0);
  const [toastIndex, setToastIndex] = useState<number | null>(null);
  const [magicCount, setMagicCount] = useState(0);

  useEffect(() => {
    const stopFireworks = fireFireworks(7000);
    return () => stopFireworks();
  }, []);

  const handlePhotoTap = () => {
    ambientAudio.playSparkleChime();
    fireSparkleBurst();
    setWhisperIndex((prev) => (prev + 1) % PHOTO_WHISPERS.length);
  };

  const handleExtraMagic = () => {
    ambientAudio.playSparkleChime();
    fireCelebrationConfetti();
    setMagicCount((prev) => prev + 1);
    setToastIndex((prev) => (prev === null ? 0 : (prev + 1) % LOVE_TOASTS.length));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
      className="relative w-full flex flex-col items-center text-center pb-4"
    >
      {/* Finale Header */}
      <Kicker className="text-[#ffd166]">Chapter 09 · Forever Yours</Kicker>

      <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white mt-2 tracking-tight leading-[1.06]">
        <RevealText text="Happy 21st Birthday," delay={0.08} />
        <span className="block font-serif italic font-normal text-4xl sm:text-5xl shimmer-text mt-1 drop-shadow-[0_6px_28px_rgba(255,107,157,0.35)]">
          My Forever, Doha ❤️
        </span>
      </h2>

      {/* Pinned & Softly Faded Keepsake Photograph */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.28, duration: 1.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-7 mb-3 flex flex-col items-center z-20"
      >
        {/* Ethereal rose-gold backlight aura */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-6 rounded-full bg-gradient-to-br from-[#ff6b9d]/30 via-[#ffd166]/20 to-[#9d4edd]/35 blur-3xl opacity-80"
        />

        {/* Gentle pendulum sway anchored at the top pin */}
        <motion.button
          type="button"
          onClick={handlePhotoTap}
          animate={{ rotate: [-2.4, -1.3, -2.4] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ scale: 1.03, rotate: 0 }}
          whileTap={{ scale: 0.97 }}
          style={{ transformOrigin: '50% 10px' }}
          aria-label="Our pinned keepsake photo — tap for sparkles"
          className="group relative cursor-pointer focus:outline-none"
        >
          {/* 3D Rose-Gold Pushpin */}
          <div className="pointer-events-none absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
            {/* Cast shadow onto the photo top */}
            <div className="absolute top-3 left-2 w-5 h-5 rounded-full bg-black/55 blur-[3px]" />
            {/* Metallic pinhead */}
            <div
              className="relative w-6 h-6 rounded-full border border-[#fff6d6]/70 shadow-[0_6px_14px_rgba(0,0,0,0.6)]"
              style={{
                background:
                  'radial-gradient(circle at 32% 28%, #fff9e6 0%, #ffd166 36%, #ff6b9d 78%, #6d103c 100%)',
              }}
            >
              <span className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-white/90" />
            </div>
            {/* Pin needle subtle shadow */}
            <div className="w-[2px] h-2 -mt-0.5 rounded-full bg-gradient-to-b from-white/80 to-black/60 shadow" />
          </div>

          {/* Faded Pinned Photo Frame */}
          <div className="relative w-[240px] sm:w-[272px] aspect-[4/4.7] rounded-[26px] p-1.5 bg-gradient-to-b from-white/20 via-white/8 to-transparent shadow-[0_26px_55px_-14px_rgba(0,0,0,0.75)] backdrop-blur-sm">
            <div className="relative w-full h-full rounded-[21px] overflow-hidden bg-[#1a0630]/40">
              <img
                src={foreverUsPhoto}
                alt="A keepsake Polaroid of Abhi and Doha together one day"
                style={{
                  maskImage:
                    'radial-gradient(ellipse 90% 88% at 50% 47%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.72) 74%, rgba(0,0,0,0.08) 99%)',
                  WebkitMaskImage:
                    'radial-gradient(ellipse 90% 88% at 50% 47%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.72) 74%, rgba(0,0,0,0.08) 99%)',
                }}
                className="w-full h-full object-cover object-[50%_41%] scale-[1.06] opacity-90 group-hover:opacity-100 transition-opacity duration-500"
              />

              {/* Soft dreamy edge vignette so photo melts gently into twilight backdrop */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse 92% 90% at 50% 46%, transparent 48%, rgba(26, 6, 48, 0.42) 82%, rgba(15, 3, 30, 0.82) 100%)',
                }}
              />

              {/* Soft warm rose-gold tint sheen */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1e0736]/75 via-transparent to-[#ffd166]/10 mix-blend-soft-light"
              />

              {/* Handwritten whisper pinned along lower fade */}
              <div className="pointer-events-none absolute inset-x-3 bottom-2.5 flex justify-center">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={whisperIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.35 }}
                    className="font-hand text-xl sm:text-[22px] text-[#ffe5ec] drop-shadow-[0_2px_10px_rgba(10,2,21,0.95)]"
                  >
                    {PHOTO_WHISPERS[whisperIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.button>

        <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
          <Sparkles className="w-3 h-3 text-[#ffd166]/75" /> tap our pinned keepsake
        </span>
      </motion.div>

      {/* Velvet & Rose-Gold Keepsake Letter Card */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.65 }}
        className="relative mt-2 w-full max-w-lg rounded-[30px] p-6 sm:p-8 text-left border border-[#ffd166]/25 shadow-[0_28px_70px_-15px_rgba(0,0,0,0.7)] overflow-hidden"
        style={{
          background:
            'linear-gradient(165deg, rgba(58, 15, 92, 0.72) 0%, rgba(26, 6, 48, 0.84) 55%, rgba(14, 3, 28, 0.9) 100%)',
          backdropFilter: 'blur(20px) saturate(150%)',
          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        }}
      >
        {/* Subtle inner hairline & warm top spotlight */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[30px] ring-1 ring-inset ring-white/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-36 rounded-full bg-[#ff6b9d]/20 blur-3xl"
        />

        {/* Corner sparkle flourishes */}
        <SparkleIcon size={13} color="#ffd166" className="absolute top-4 left-4 opacity-50" />
        <SparkleIcon size={13} color="#ff8fab" className="absolute top-4 right-4 opacity-50" />

        {/* Poetic Card Opener */}
        <div className="relative text-center pb-4 mb-4 border-b border-white/10">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.26em] text-[#ffd166]/85">
            ✦ A Promise For Year 21 ✦
          </p>
          <p className="font-serif italic text-xl sm:text-2xl text-[#ffd6e0] mt-1">
            “Every version of my future has you in it.”
          </p>
        </div>

        {/* Letter Paragraphs */}
        <div className="relative space-y-3.5">
          {FINAL_MESSAGE_PARAGRAPHS.map((para, idx) => (
            <motion.p
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + idx * 0.2, duration: 0.5 }}
              className="text-sm sm:text-[15px] leading-relaxed text-[#fff8f0]/92"
            >
              {para}
            </motion.p>
          ))}
        </div>

        {/* Signature Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.55, duration: 0.5 }}
          className="relative mt-6 pt-4 flex items-end justify-between border-t border-[#ffd166]/15"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-[#ff6b9d]/15 border border-[#ff8fab]/30 px-3.5 py-1.5 text-xs font-bold text-[#ffd6e0]">
            <Heart className="w-3.5 h-3.5 text-[#ff6b9d] fill-[#ff6b9d]" />
            <span>Always yours</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
              With all my love,
            </p>
            <p className="font-hand text-3xl sm:text-[34px] font-bold text-[#ffd166] leading-tight">
              Abhi Vaidya ❤️
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Sleek Wrapped Milestone Strip */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.55 }}
        className="mt-4 w-full max-w-lg grid grid-cols-3 gap-2.5"
      >
        <div className="glass rounded-2xl py-3 px-2 border border-white/10">
          <p className="font-display text-2xl sm:text-3xl font-extrabold gold-text">
            <Counter to={21} duration={1.4} delay={0.8} />
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/65 mt-0.5">
            Magical Years
          </p>
        </div>
        <div className="glass rounded-2xl py-3 px-2 border border-[#ff8fab]/20">
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#ff8fab]">
            {magicCount > 0 ? `∞ + ${magicCount}` : '∞'}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/65 mt-0.5">
            All My Love
          </p>
        </div>
        <div className="glass rounded-2xl py-3 px-2 border border-white/10">
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#ffd6e0]">
            <Counter to={365} duration={1.6} delay={0.8} />
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/65 mt-0.5">
            Days Cheering
          </p>
        </div>
      </motion.div>

      {/* Grand Closing Ribbon & Actions */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.65, type: 'spring', stiffness: 170 }}
        className="mt-5 flex flex-col items-center w-full max-w-lg"
      >
        <div className="glass inline-flex items-center gap-2.5 rounded-full px-6 py-2.5 border border-[#ffd166]/45 shadow-[0_12px_36px_-10px_rgba(255,209,102,0.35)]">
          <SparkleIcon size={15} color="#ffd166" />
          <span className="font-serif italic text-lg sm:text-2xl shimmer-text">
            21 Looks Beautiful on You, Doha. ❤️
          </span>
          <SparkleIcon size={15} color="#ffd166" />
        </div>

        <AnimatePresence mode="wait">
          {toastIndex !== null && (
            <motion.p
              key={`${toastIndex}-${magicCount}`}
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-3 rounded-full bg-[#ff6b9d]/20 border border-[#ff8fab]/35 px-4 py-1.5 text-xs font-semibold text-[#ffe5ec]"
            >
              {LOVE_TOASTS[toastIndex]}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <PrimaryButton variant="gold" onClick={handleExtraMagic} className="px-6 py-3 text-xs sm:text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Send Birthday Magic</span>
          </PrimaryButton>

          <PrimaryButton
            variant="ghost"
            shine={false}
            onClick={onRestart}
            className="px-5 py-3 text-xs sm:text-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay Journey</span>
          </PrimaryButton>
        </div>
      </motion.div>
    </motion.div>
  );
};
