import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, RotateCcw, Volume2 } from 'lucide-react';
import childhoodPhoto1 from '../../../asset/images/childhood/542405518_497696813438731_2556553202257628836_n.jpeg';
import childhoodPhoto2 from '../../../asset/images/childhood/543382226_791785130207636_4072870486427926902_n.jpeg';
import childhoodVideo1 from '../../../asset/images/childhood/542858955_1429470438525990_2560416745788430860_n.mp4';
import childhoodVideo2 from '../../../asset/images/childhood/543017087_1104521461862947_797504643847436973_n.mp4';
import childhoodVideo3 from '../../../asset/images/childhood/541594503_1734660007250964_5753557278011703714_n.mp4';
import { ambientAudio } from '../../utils/ambientAudio';
import { fireSparkleBurst } from '../../utils/confetti';
import { PrimaryButton } from '../ui/Primitives';

interface StageChildhoodMemoriesProps {
  onNext: () => void;
  isIntroActive: boolean;
}

interface ChildhoodMemory {
  id: string;
  type: 'image' | 'video';
  src: string;
  caption: string;
  hasAudio?: boolean;
  ambientTint: string;
  kenBurns?: {
    fromScale: number;
    toScale: number;
    fromX: number;
    toX: number;
    fromY: number;
    toY: number;
  };
}

const IMAGE_DURATION_MS = 5200;
const CROSSFADE_SECONDS = 1.25;
const CROSSFADE_EASE = [0.22, 1, 0.36, 1] as const;

const CHILDHOOD_MEMORIES: ChildhoodMemory[] = [
  {
    id: 'childhood-photo-1',
    type: 'image',
    src: childhoodPhoto1,
    caption: 'Look at that sweetest little smile',
    ambientTint: 'radial-gradient(circle at 50% 45%, rgba(255, 190, 140, 0.38), rgba(255, 120, 165, 0.16), transparent 72%)',
    kenBurns: { fromScale: 1, toScale: 1.055, fromX: 0, toX: -5, fromY: 0, toY: -4 },
  },
  {
    id: 'childhood-video-1',
    type: 'video',
    src: childhoodVideo1,
    caption: 'Tiny moments full of pure joy',
    hasAudio: true,
    ambientTint: 'radial-gradient(circle at 50% 45%, rgba(255, 150, 185, 0.36), rgba(180, 120, 255, 0.16), transparent 72%)',
  },
  {
    id: 'childhood-photo-2',
    type: 'image',
    src: childhoodPhoto2,
    caption: 'Already shining brighter than the sun',
    ambientTint: 'radial-gradient(circle at 50% 45%, rgba(255, 210, 125, 0.38), rgba(255, 140, 175, 0.16), transparent 72%)',
    kenBurns: { fromScale: 1.055, toScale: 1, fromX: -4, toX: 4, fromY: 3, toY: -3 },
  },
  {
    id: 'childhood-video-2',
    type: 'video',
    src: childhoodVideo2,
    caption: 'Growing up with all that magic',
    hasAudio: false,
    ambientTint: 'radial-gradient(circle at 50% 45%, rgba(210, 140, 255, 0.36), rgba(255, 143, 171, 0.18), transparent 72%)',
  },
  {
    id: 'childhood-video-3',
    type: 'video',
    src: childhoodVideo3,
    caption: 'Every step led to you turning 21',
    hasAudio: false,
    ambientTint: 'radial-gradient(circle at 50% 45%, rgba(255, 180, 130, 0.36), rgba(255, 130, 175, 0.18), transparent 72%)',
  },
];

export const StageChildhoodMemories: React.FC<StageChildhoodMemoriesProps> = ({
  onNext,
  isIntroActive,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [needsSoundTap, setNeedsSoundTap] = useState(false);
  const [runId, setRunId] = useState(0);

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const activeMemory = CHILDHOOD_MEMORIES[activeIndex];

  // Preload images immediately so transitions are instant
  useEffect(() => {
    CHILDHOOD_MEMORIES.forEach((item) => {
      if (item.type === 'image') {
        const img = new Image();
        img.src = item.src;
        void img.decode?.().catch(() => {});
      }
    });
  }, []);

  // Restore ambient music and pause all videos on unmount
  useEffect(() => {
    const refs = videoRefs.current;
    return () => {
      ambientAudio.setTempPaused(false);
      Object.values(refs).forEach((v) => {
        if (v) v.pause();
      });
    };
  }, []);

  // Clear outgoing layer after optical cross-dissolve completes
  useEffect(() => {
    if (prevIndex === null) return;
    const prevItem = CHILDHOOD_MEMORIES[prevIndex];
    const timer = window.setTimeout(() => {
      if (prevItem?.type === 'video') {
        const prevVideo = videoRefs.current[prevItem.id];
        if (prevVideo) {
          prevVideo.pause();
          prevVideo.currentTime = 0;
        }
      }
      setPrevIndex(null);
    }, Math.round((CROSSFADE_SECONDS + 0.12) * 1000));

    return () => window.clearTimeout(timer);
  }, [prevIndex]);

  const advanceSequence = useCallback(() => {
    ambientAudio.setTempPaused(false);
    setNeedsSoundTap(false);
    setActiveIndex((current) => {
      if (current < CHILDHOOD_MEMORIES.length - 1) {
        setPrevIndex(current);
        setProgress(0);
        return current + 1;
      }
      setProgress(1);
      setIsCompleted(true);
      ambientAudio.playSparkleChime();
      fireSparkleBurst();
      return current;
    });
  }, []);

  // Sequence playback controller for the active image or video
  useEffect(() => {
    if (isIntroActive || isCompleted) return;

    let rafId = 0;
    let cancelled = false;

    if (activeMemory.type === 'image') {
      ambientAudio.setTempPaused(false);
      setNeedsSoundTap(false);
      const startTime = performance.now();

      const tickImage = (now: number) => {
        if (cancelled) return;
        const ratio = Math.min(1, (now - startTime) / IMAGE_DURATION_MS);
        setProgress(ratio);
        if (ratio >= 1) {
          advanceSequence();
          return;
        }
        rafId = requestAnimationFrame(tickImage);
      };

      rafId = requestAnimationFrame(tickImage);
      return () => {
        cancelled = true;
        cancelAnimationFrame(rafId);
      };
    }

    const videoEl = videoRefs.current[activeMemory.id];
    if (!videoEl) {
      const fallback = window.setTimeout(advanceSequence, 1000);
      return () => window.clearTimeout(fallback);
    }

    const startVideo = async () => {
      videoEl.currentTime = 0;
      const wantsAudio = Boolean(activeMemory.hasAudio);
      videoEl.muted = !wantsAudio;

      try {
        await videoEl.play();
        if (cancelled) return;
        if (wantsAudio) {
          ambientAudio.setTempPaused(true);
          setNeedsSoundTap(false);
        }
      } catch {
        if (cancelled) return;
        videoEl.muted = true;
        if (wantsAudio) {
          setNeedsSoundTap(true);
        }
        try {
          await videoEl.play();
        } catch {
          advanceSequence();
        }
      }
    };

    const tickVideo = () => {
      if (cancelled) return;
      if (videoEl.duration > 0 && Number.isFinite(videoEl.duration)) {
        setProgress(Math.min(1, videoEl.currentTime / videoEl.duration));
      }
      rafId = requestAnimationFrame(tickVideo);
    };

    const handleEnded = () => {
      if (!cancelled) advanceSequence();
    };

    const handleError = () => {
      if (!cancelled) advanceSequence();
    };

    videoEl.addEventListener('ended', handleEnded);
    videoEl.addEventListener('error', handleError);
    void startVideo();
    rafId = requestAnimationFrame(tickVideo);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      videoEl.removeEventListener('ended', handleEnded);
      videoEl.removeEventListener('error', handleError);
    };
  }, [activeIndex, activeMemory, isIntroActive, isCompleted, runId, advanceSequence]);

  const handleUnmuteVideoTap = () => {
    if (activeMemory.type !== 'video' || !activeMemory.hasAudio) return;
    const videoEl = videoRefs.current[activeMemory.id];
    if (!videoEl) return;
    videoEl.muted = false;
    setNeedsSoundTap(false);
    ambientAudio.setTempPaused(true);
    if (videoEl.paused) {
      void videoEl.play().catch(() => {});
    }
  };

  const handleReplay = () => {
    ambientAudio.setTempPaused(false);
    Object.values(videoRefs.current).forEach((v) => {
      if (v) {
        v.pause();
        v.currentTime = 0;
      }
    });
    setPrevIndex(null);
    setActiveIndex(0);
    setProgress(0);
    setIsCompleted(false);
    setNeedsSoundTap(false);
    setRunId((r) => r + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
      className="relative w-full flex flex-col items-center text-center"
    >
      {/* Whisper-quiet title above the focal theater frame */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.6 }}
        className="mb-3 flex flex-col items-center"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-white/45">
          Chapter 05 · Childhood
        </span>
        <h2 className="font-serif italic text-2xl sm:text-3xl text-white/95 tracking-tight mt-0.5">
          Little Doha
        </h2>
      </motion.div>

      {/* Focal Cinema Stage */}
      <div className="relative flex flex-col items-center">
        {/* Ambient cinema halo radiating softly onto the blurred backdrop */}
        <motion.div
          key={activeMemory.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          aria-hidden
          style={{ background: activeMemory.ambientTint }}
          className="pointer-events-none absolute -inset-16 -z-10 blur-3xl"
        />

        {/* Pure, unobstructed 9:16 portrait frame */}
        <div
          onClick={needsSoundTap ? handleUnmuteVideoTap : undefined}
          style={{ height: 'min(64dvh, 560px)' }}
          className={`relative aspect-[9/16] max-w-[88vw] rounded-[26px] overflow-hidden bg-[#0a040c] ring-1 ring-white/20 shadow-[0_36px_95px_-12px_rgba(0,0,0,0.95)] select-none ${
            needsSoundTap ? 'cursor-pointer' : ''
          }`}
        >
          {/* GPU-composited optical cross-dissolve stack */}
          {CHILDHOOD_MEMORIES.map((item, idx) => {
            const isActive = idx === activeIndex && !isIntroActive;
            const isPrevious = idx === prevIndex && !isIntroActive;
            const isVisibleLayer = isActive || isPrevious;
            const zIndex = isActive ? 2 : isPrevious ? 1 : 0;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 1.025 }}
                animate={
                  isVisibleLayer
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 1.025 }
                }
                transition={{
                  duration: isVisibleLayer ? CROSSFADE_SECONDS : 0.01,
                  ease: CROSSFADE_EASE,
                }}
                style={{ zIndex }}
                className="pointer-events-none absolute inset-0 overflow-hidden will-change-[opacity,transform]"
              >
                {item.type === 'image' ? (
                  <motion.img
                    src={item.src}
                    alt={item.caption}
                    draggable={false}
                    initial={{
                      scale: item.kenBurns?.fromScale ?? 1,
                      x: item.kenBurns?.fromX ?? 0,
                      y: item.kenBurns?.fromY ?? 0,
                    }}
                    animate={
                      isVisibleLayer && !isIntroActive
                        ? {
                            scale: item.kenBurns?.toScale ?? 1.05,
                            x: item.kenBurns?.toX ?? 0,
                            y: item.kenBurns?.toY ?? 0,
                          }
                        : {
                            scale: item.kenBurns?.fromScale ?? 1,
                            x: item.kenBurns?.fromX ?? 0,
                            y: item.kenBurns?.fromY ?? 0,
                          }
                    }
                    transition={{
                      duration: isVisibleLayer
                        ? (IMAGE_DURATION_MS + CROSSFADE_SECONDS * 1000) / 1000
                        : 0.01,
                      ease: 'linear',
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    ref={(el) => {
                      videoRefs.current[item.id] = el;
                    }}
                    src={item.src}
                    playsInline
                    preload="auto"
                    disablePictureInPicture
                    controlsList="nodownload noplaybackrate"
                    className="w-full h-full object-cover"
                  />
                )}
              </motion.div>
            );
          })}

          {/* Subtle edge feathering for cinematic depth — leaves media completely clear */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 rounded-[26px] ring-1 ring-inset ring-white/10"
            style={{
              boxShadow: 'inset 0 0 42px rgba(0, 0, 0, 0.28)',
            }}
          />

          {/* Only appears if browser blocked unmuted autoplay */}
          <AnimatePresence>
            {needsSoundTap && (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnmuteVideoTap();
                }}
                className="absolute top-3.5 right-3.5 z-20 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-semibold text-[#ffd166] ring-1 ring-white/20 backdrop-blur-md cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Tap for sound</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Minimalist progress & editorial caption cleanly BELOW the frame */}
        <div className="mt-3.5 w-full max-w-[320px] px-1">
          <div
            style={{ gridTemplateColumns: `repeat(${CHILDHOOD_MEMORIES.length}, minmax(0, 1fr))` }}
            className="pointer-events-none grid gap-1.5"
          >
            {CHILDHOOD_MEMORIES.map((item, idx) => {
              const fill =
                isCompleted || idx < activeIndex
                  ? 1
                  : idx === activeIndex
                    ? progress
                    : 0;

              return (
                <div
                  key={item.id}
                  className="h-[2.5px] rounded-full bg-white/15 overflow-hidden"
                >
                  <div
                    style={{
                      transform: `scaleX(${fill})`,
                      transformOrigin: 'left center',
                    }}
                    className={`h-full w-full rounded-full ${
                      idx === activeIndex && !isCompleted
                        ? 'bg-gradient-to-r from-[#ffe5ec] via-[#ff8fab] to-[#ffd166]'
                        : 'bg-white/75'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-2.5 min-h-[56px] flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {!isCompleted ? (
                <motion.div
                  key={activeMemory.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.45, ease: CROSSFADE_EASE }}
                  className="flex flex-col items-center gap-0.5"
                >
                  <p className="font-serif italic text-xl sm:text-[22px] text-[#fff6f8]/95 leading-snug">
                    “{activeMemory.caption}”
                  </p>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/40 tabular-nums">
                    0{activeIndex + 1} / 0{CHILDHOOD_MEMORIES.length}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="completed-actions"
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="pt-1 flex flex-wrap items-center justify-center gap-2.5"
                >
                  <button
                    type="button"
                    onClick={handleReplay}
                    className="glass inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold text-white/90 hover:bg-white/20 active:scale-95 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Replay
                  </button>
                  <PrimaryButton variant="gold" onClick={onNext} className="px-6 py-2.5 text-xs sm:text-sm">
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </PrimaryButton>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
