import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MailOpen, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { LOVE_LETTER_PARAGRAPHS } from '../../data/birthdayContent';
import { ambientAudio } from '../../utils/ambientAudio';
import { triggerHaptic } from '../../utils/haptics';
import { fireSparkleBurst } from '../../utils/confetti';
import { Kicker, PrimaryButton } from '../ui/Primitives';

interface Stage2LoveLetterProps {
  onNext: () => void;
}

type EnvelopePhase = 'closed' | 'opening' | 'open';

interface LetterStamp {
  id: number;
  xPct: number;
  yPct: number;
  rotate: number;
}

/**
 * Embossed 3D wax seal with organic scalloped outer rim and heart crest.
 */
const WaxSeal: React.FC<{ size?: 'md' | 'sm'; pulse?: boolean; broken?: boolean }> = ({
  size = 'md',
  pulse = false,
  broken = false,
}) => {
  const dim = size === 'md' ? 'w-16 h-16' : 'w-10 h-10';
  const ringInset = size === 'md' ? 'inset-[5px]' : 'inset-[3.5px]';
  const iconSize = size === 'md' ? 'w-6 h-6' : 'w-4 h-4';

  return (
    <motion.div
      animate={
        broken
          ? { scale: 0.72, opacity: 0, rotate: -14, y: -6 }
          : pulse
            ? { scale: [1, 1.06, 1] }
            : undefined
      }
      transition={
        broken
          ? { duration: 0.35, ease: 'easeOut' }
          : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
      }
      className={`relative ${dim} rounded-full flex items-center justify-center select-none`}
      style={{
        background:
          'radial-gradient(circle at 32% 28%, #ff6b86 0%, #d91e4b 38%, #8f0e32 76%, #57071d 100%)',
        boxShadow:
          '0 10px 22px -4px rgba(72, 8, 26, 0.6), inset 0 2px 4px rgba(255, 220, 228, 0.42), inset 0 -3px 6px rgba(45, 4, 16, 0.55)',
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-[2px] rounded-full border border-[#ff9eb1]/35 opacity-80"
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute ${ringInset} rounded-full border border-[#4a0618]/45 shadow-[inset_0_1px_2px_rgba(255,255,255,0.22)]`}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-2 left-3 w-3 h-1.5 rounded-full bg-white/30 -rotate-25 blur-[0.5px]"
      />
      <Heart className={`${iconSize} relative z-10 text-[#ffe6ec] fill-[#ffe6ec] drop-shadow-[0_1px_2px_rgba(65,5,20,0.65)]`} />
    </motion.div>
  );
};

/**
 * Interactive linen envelope with 3D pointer tilt, hinged flap, postage stamp, postmark, and wax seal.
 */
const EnvelopeView: React.FC<{
  isOpening: boolean;
  onOpen: () => void;
}> = ({ isOpening, onOpen }) => {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isOpening) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -ny * 10, ry: nx * 12 });
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 16, rotate: -1.5 }}
      animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
      exit={{ scale: 0.95, opacity: 0, y: -18 }}
      transition={{ type: 'spring', stiffness: 185, damping: 18 }}
      className="w-full max-w-[350px] my-5 flex flex-col items-center"
    >
      <motion.button
        type="button"
        disabled={isOpening}
        onPointerMove={handleMove}
        onPointerLeave={() => setTilt({ rx: 0, ry: 0 })}
        animate={{ rotateX: isOpening ? 0 : tilt.rx, rotateY: isOpening ? 0 : tilt.ry }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        whileTap={isOpening ? undefined : { scale: 0.975 }}
        onClick={onOpen}
        style={{ perspective: 1100, transformStyle: 'preserve-3d' }}
        className="group relative block w-full aspect-[4/2.9] rounded-[22px] p-5 shadow-[0_32px_68px_-16px_rgba(0,0,0,0.72),0_0_0_1px_rgba(255,255,255,0.35)] cursor-pointer overflow-visible text-left focus:outline-none"
      >
        <div
          className="absolute inset-0 rounded-[22px] overflow-hidden"
          style={{
            background:
              'linear-gradient(150deg, #fff6f8 0%, #fde2ea 48%, #f6c4d2 100%)',
          }}
        >
          <div className="pointer-events-none absolute inset-0 paper-grain" />
          <div
            className="absolute inset-x-0 top-0 h-[62%]"
            style={{
              background:
                'linear-gradient(180deg, #b83b5e 0%, #d45d7e 65%, #eec0ce 100%)',
              clipPath: 'polygon(0 0, 100% 0, 50% 92%)',
              opacity: isOpening ? 0.9 : 0.25,
              transition: 'opacity 0.4s ease',
            }}
          />
        </div>

        {/* Letter peeking upward during opening transition */}
        <motion.div
          aria-hidden
          initial={{ y: 16, opacity: 0 }}
          animate={isOpening ? { y: -40, opacity: 1 } : { y: 16, opacity: 0 }}
          transition={{ delay: 0.16, duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute left-5 right-5 top-4 h-36 rounded-t-xl cotton-paper border border-[#d6b29a]/50 shadow-[0_-6px_18px_rgba(60,12,28,0.18)] px-4 pt-3 z-10"
        >
          <div className="paper-grain absolute inset-0 rounded-t-xl" />
          <p className="font-hand text-lg text-[#8c1642]/80 relative z-10">My Dearest Doha,</p>
          <div className="mt-2 space-y-1.5 opacity-35">
            <div className="h-1.5 w-4/5 rounded-full bg-[#8c1642]/40" />
            <div className="h-1.5 w-3/5 rounded-full bg-[#8c1642]/30" />
          </div>
        </motion.div>

        {/* Left, right & bottom folded pocket flaps */}
        <div className="pointer-events-none absolute inset-0 rounded-[22px] overflow-hidden z-20">
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(110deg, #f9d5e0 0%, #f3b8ca 100%)',
              clipPath: 'polygon(0 0, 52% 54%, 0 100%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(250deg, #f9d5e0 0%, #f2b3c6 100%)',
              clipPath: 'polygon(100% 0, 48% 54%, 100% 100%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, #ffeaf0 0%, #f9cad8 55%, #f0adc1 100%)',
              clipPath: 'polygon(0 100%, 50% 42%, 100% 100%)',
              filter: 'drop-shadow(0 -2px 5px rgba(95, 22, 46, 0.14))',
            }}
          />
        </div>

        {/* Hinged Top Triangular Flap */}
        <motion.div
          animate={isOpening ? { rotateX: -172 } : { rotateX: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: '50% 0%', transformStyle: 'preserve-3d' }}
          className="pointer-events-none absolute top-0 inset-x-0 h-[57%] z-30"
        >
          <div
            className="w-full h-full rounded-t-[22px]"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #fff0f4 62%, #fad3df 100%)',
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              filter: 'drop-shadow(0 5px 8px rgba(85, 16, 40, 0.18))',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, transparent 70%, rgba(196, 128, 144, 0.25) 100%)',
              clipPath: 'polygon(4% 0, 96% 0, 50% 95%)',
            }}
          />
        </motion.div>

        {/* Postage Stamp & Postmark */}
        <div className="pointer-events-none absolute top-3.5 right-4 z-40 flex items-center">
          <div className="mr-[-14px] mt-3 w-11 h-11 rounded-full border border-dashed border-[#8c1642]/30 flex flex-col items-center justify-center -rotate-12 text-[6px] font-bold uppercase tracking-widest text-[#8c1642]/45">
            <span>NOV 13</span>
            <span className="text-[7px]">♥</span>
            <span>21ST</span>
          </div>
          <div className="w-11 h-12 rounded-[4px] border-2 border-dotted border-[#b76e79]/75 bg-[#fffaf3] p-1 flex flex-col items-center justify-center rotate-6 shadow-[0_3px_8px_rgba(70,12,32,0.18)]">
            <span className="text-xs leading-none">💌</span>
            <span className="font-serif italic text-[9px] font-semibold text-[#8c1642] mt-0.5">
              21¢
            </span>
            <span className="text-[6px] font-bold uppercase tracking-wider text-[#9d174d]/70">
              DOHA
            </span>
          </div>
        </div>

        {/* Wax Seal & Address */}
        <div className="relative z-40 h-full flex flex-col items-center justify-end pb-1.5 pt-8">
          <div className="mb-2">
            <WaxSeal size="md" pulse={!isOpening} broken={isOpening} />
          </div>

          <p className="font-hand text-[29px] sm:text-[32px] font-bold text-[#590d22] leading-none drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]">
            For Doha Fetouh
          </p>

          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#590d22] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#fff0f3] shadow-[0_6px_16px_rgba(89,13,34,0.35)] group-hover:bg-[#73122d] transition-colors">
            <MailOpen className="w-3.5 h-3.5" />
            {isOpening ? 'Unsealing...' : 'Tap to Break Seal'}
          </span>
        </div>
      </motion.button>
    </motion.div>
  );
};

export const Stage2LoveLetter: React.FC<Stage2LoveLetterProps> = ({ onNext }) => {
  const [phase, setPhase] = useState<EnvelopePhase>('closed');
  const [page, setPage] = useState<0 | 1>(0);
  const [visitedPage2, setVisitedPage2] = useState(false);
  const [stamps, setStamps] = useState<LetterStamp[]>([]);

  useEffect(() => {
    if (phase !== 'opening') return;
    const openTimer = window.setTimeout(() => {
      setPhase('open');
    }, 660);
    return () => clearTimeout(openTimer);
  }, [phase]);

  const handleOpenEnvelope = () => {
    if (phase !== 'closed') return;
    triggerHaptic([16, 30, 12]);
    ambientAudio.playWaxSealBreak();
    fireSparkleBurst();
    setPhase('opening');
  };

  const goPage = (target: 0 | 1) => {
    if (target === page) return;
    triggerHaptic(8);
    ambientAudio.playPaperRustle();
    setPage(target);
    if (target === 1) setVisitedPage2(true);
  };

  const handlePaperDoubleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    triggerHaptic(10);
    ambientAudio.playSoftTap(1.15);
    setStamps((prev) => [
      ...prev.slice(-7),
      { id: Date.now() + Math.random(), xPct, yPct, rotate: (Math.random() - 0.5) * 34 },
    ]);
  };

  const salutation = LOVE_LETTER_PARAGRAPHS[0];
  const bodyParagraphs = LOVE_LETTER_PARAGRAPHS.slice(1, -1);
  const signOff = LOVE_LETTER_PARAGRAPHS[LOVE_LETTER_PARAGRAPHS.length - 1];

  const page1Paragraphs = bodyParagraphs.slice(0, 2);
  const page2Paragraphs = bodyParagraphs.slice(2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.5 }}
      className="w-full flex flex-col items-center"
    >
      <div className="text-center mb-3">
        <Kicker className="text-[#ffc2d1]">Chapter 02 · Love Letter</Kicker>
        <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white mt-1 tracking-tight">
          Words From{' '}
          <span className="font-serif italic font-normal text-[#ffc2d1]">My Heart</span> 💌
        </h2>
      </div>

      <AnimatePresence mode="wait">
        {phase !== 'open' ? (
          <EnvelopeView
            key="envelope-stage"
            isOpening={phase === 'opening'}
            onOpen={handleOpenEnvelope}
          />
        ) : (
          <motion.div
            key="opened-stationery"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[500px] mt-1"
          >
            {/* Layered cotton sheets underneath */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-1.5 top-2.5 -bottom-2 rounded-[26px] bg-gradient-to-br from-[#f8cdd8] to-[#e49ab0] -rotate-[1.8deg] shadow-[0_24px_50px_-14px_rgba(0,0,0,0.55)] opacity-85"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-1 top-1.5 -bottom-1 rounded-[24px] bg-[#f4e4ce] rotate-[0.9deg] shadow-md opacity-90"
            />

            {/* Main Fixed-Height Paged Cotton Stationery Sheet — zero scroll */}
            <motion.div
              onDoubleClick={handlePaperDoubleTap}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.14}
              onDragEnd={(_, info) => {
                if (info.offset.x < -45 && page === 0) goPage(1);
                if (info.offset.x > 45 && page === 1) goPage(0);
              }}
              className="cotton-paper relative rounded-[24px] text-[#3a1624] px-5 py-5 sm:px-8 sm:py-6 shadow-[0_28px_65px_-16px_rgba(12,3,10,0.72),inset_0_0_36px_rgba(160,104,72,0.1)] border border-[#e7d2ba] overflow-hidden select-none"
            >
              <div aria-hidden className="pointer-events-none absolute inset-0 paper-grain" />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[#b8896f]/22 to-transparent shadow-[0_1px_0_rgba(255,255,255,0.65)]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-2.5 sm:inset-3.5 rounded-[16px] border border-[#c78592]/28"
              />

              {/* Interactive kiss/heart stamps left by double-tap */}
              <AnimatePresence>
                {stamps.map((s) => (
                  <motion.span
                    key={s.id}
                    initial={{ scale: 1.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.78 }}
                    style={{ left: `${s.xPct}%`, top: `${s.yPct}%`, rotate: `${s.rotate}deg` }}
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-lg z-20 drop-shadow-xs"
                  >
                    💋
                  </motion.span>
                ))}
              </AnimatePresence>

              {/* Stationery Header Crest */}
              <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1 font-serif italic text-[11px] tracking-[0.16em] uppercase text-[#9d445d]/80">
                  <Sparkles className="w-3 h-3 text-[#c97a63]" />
                  November 13 · XXI
                </span>
                <span className="rounded-full bg-[#8c1642]/10 px-2.5 py-0.5 text-[10px] font-extrabold tracking-widest text-[#8c1642]">
                  PAGE {page + 1} / 2
                </span>
              </div>

              {/* Letter Content Area */}
              <div className="relative z-10 min-h-[270px] sm:min-h-[295px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  {page === 0 ? (
                    <motion.div
                      key="letter-page-1"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.32, ease: 'easeOut' }}
                      className="space-y-3"
                    >
                      <p className="font-hand text-[26px] sm:text-[30px] font-bold text-[#8c1642] leading-tight">
                        {salutation}
                      </p>
                      {page1Paragraphs.map((paragraph, idx) => (
                        <motion.p
                          key={idx}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.12 + idx * 0.22, duration: 0.55 }}
                          className="font-hand text-[19px] sm:text-[21px] leading-[1.48] text-[#3d1725]"
                        >
                          {paragraph}
                        </motion.p>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="letter-page-2"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.32, ease: 'easeOut' }}
                      className="space-y-3"
                    >
                      {page2Paragraphs.map((paragraph, idx) => (
                        <motion.p
                          key={idx}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.08 + idx * 0.2, duration: 0.55 }}
                          className="font-hand text-[19px] sm:text-[21px] leading-[1.48] text-[#3d1725]"
                        >
                          {paragraph}
                        </motion.p>
                      ))}

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.42, duration: 0.5 }}
                        className="pt-2 flex items-end justify-between gap-4"
                      >
                        <p className="whitespace-pre-line font-hand text-[24px] sm:text-[27px] font-bold text-[#8c1642] leading-[1.24]">
                          {signOff}
                        </p>
                        <div className="shrink-0 opacity-95 -rotate-6">
                          <WaxSeal size="sm" />
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="mt-2 text-center text-[10px] font-semibold tracking-wider text-[#9d445d]/55">
                  Double-tap paper to stamp a kiss 💋
                </p>
              </div>

              {/* Footer Action Bar */}
              <div className="relative z-10 mt-3 pt-3 border-t border-[#b76e79]/22 flex items-center justify-between gap-2">
                {page === 1 ? (
                  <button
                    type="button"
                    onClick={() => goPage(0)}
                    className="inline-flex items-center gap-1 rounded-full bg-[#8c1642]/10 px-3.5 py-2 text-xs font-bold text-[#8c1642] hover:bg-[#8c1642]/15 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Page 1
                  </button>
                ) : (
                  <span className="font-serif italic text-[14px] text-[#8c1642]/85">
                    Sealed with love ❤️
                  </span>
                )}

                {page === 0 && !visitedPage2 ? (
                  <PrimaryButton
                    variant="pink"
                    onClick={() => goPage(1)}
                    className="px-5 py-2.5 text-sm"
                  >
                    <span>Turn Page</span>
                    <ArrowRight className="w-4 h-4" />
                  </PrimaryButton>
                ) : page === 0 ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => goPage(1)}
                      className="rounded-full bg-[#8c1642]/10 px-3.5 py-2 text-xs font-bold text-[#8c1642] hover:bg-[#8c1642]/15 transition cursor-pointer"
                    >
                      Page 2
                    </button>
                    <PrimaryButton
                      variant="pink"
                      onClick={() => {
                        triggerHaptic(12);
                        onNext();
                      }}
                      className="px-4 py-2 text-xs sm:text-sm"
                    >
                      Next <ArrowRight className="w-4 h-4" />
                    </PrimaryButton>
                  </div>
                ) : (
                  <PrimaryButton
                    variant="pink"
                    onClick={() => {
                      triggerHaptic(12);
                      onNext();
                    }}
                    className="px-5 py-2.5 text-sm"
                  >
                    <span>Next Surprise</span>
                    <ArrowRight className="w-4 h-4" />
                  </PrimaryButton>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
