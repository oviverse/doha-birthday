import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Heart, Pause, RotateCcw, Volume2 } from 'lucide-react';
import childhoodPhoto1 from '../../../asset/images/childhood/542405518_497696813438731_2556553202257628836_n.jpeg';
import childhoodPhoto2 from '../../../asset/images/childhood/543382226_791785130207636_4072870486427926902_n.jpeg';
import childhoodVideo1 from '../../../asset/images/childhood/542858955_1429470438525990_2560416745788430860_n.mp4';
import childhoodVideo2 from '../../../asset/images/childhood/543017087_1104521461862947_797504643847436973_n.mp4';
import childhoodVideo3 from '../../../asset/images/childhood/541594503_1734660007250964_5753557278011703714_n.mp4';
import { ambientAudio } from '../../utils/ambientAudio';
import { triggerHaptic } from '../../utils/haptics';
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

interface HeartBurst {
  id: number;
  x: number;
  y: number;
}

const IMAGE_DURATION_MS = 5000;
const CROSSFADE_SECONDS = 1.15;
const CROSSFADE_EASE = [0.22, 1, 0.36, 1] as const;

const CHILDHOOD_MEMORIES: ChildhoodMemory[] = [
  {
    id: 'childhood-photo-1',
    type: 'image',
    src: childhoodPhoto1,
    caption: 'Look at that sweetest little smile',
    ambientTint:
      'radial-gradient(circle at 50% 45%, rgba(255, 190, 140, 0.38), rgba(255, 120, 165, 0.16), transparent 72%)',
    kenBurns: { fromScale: 1, toScale: 1.055, fromX: 0, toX: -5, fromY: 0, toY: -4 },
  },
  {
    id: 'childhood-video-1',
    type: 'video',
    src: childhoodVideo1,
    caption: 'Tiny moments full of pure joy',
    hasAudio: true,
    ambientTint:
      'radial-gradient(circle at 50% 45%, rgba(255, 150, 185, 0.36), rgba(180, 120, 255, 0.16), transparent 72%)',
  },
  {
    id: 'childhood-photo-2',
    type: 'image',
    src: childhoodPhoto2,
    caption: 'Already shining brighter than the sun',
    ambientTint:
      'radial-gradient(circle at 50% 45%, rgba(255, 210, 125, 0.38), rgba(255, 140, 175, 0.16), transparent 72%)',
    kenBurns: { fromScale: 1.055, toScale: 1, fromX: -4, toX: 4, fromY: 3, toY: -3 },
  },
  {
    id: 'childhood-video-2',
    type: 'video',
    src: childhoodVideo2,
    caption: 'Growing up with all that magic',
    hasAudio: false,
    ambientTint:
      'radial-gradient(circle at 50% 45%, rgba(210, 140, 255, 0.36), rgba(255, 143, 171, 0.18), transparent 72%)',
  },
  {
    id: 'childhood-video-3',
    type: 'video',
    src: childhoodVideo3,
    caption: 'Every step led to you turning 21',
    hasAudio: false,
    ambientTint:
      'radial-gradient(circle at 50% 45%, rgba(255, 180, 130, 0.36), rgba(255, 130, 175, 0.18), transparent 72%)',
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
  const [isPaused, setIsPaused] = useState(false);
  const [needsSoundTap, setNeedsSoundTap] = useState(false);
  const [runId, setRunId] = useState(0);
  const [hearts, setHearts] = useState<HeartBurst[]>([]);

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const progressRef = useRef(0);
  const isPausedRef = useRef(false);
  const holdTimerRef = useRef<number | null>(null);
  const heldLongRef = useRef(false);
  const lastTapRef = useRef(0);

  progressRef.current = progress;
  isPausedRef.current = isPaused;

  const activeMemory = CHILDHOOD_MEMORIES[activeIndex];

  useEffect(() => {
    CHILDHOOD_MEMORIES.forEach((item) => {
      if (item.type === 'image') {
        const img = new Image();
        img.src = item.src;
        void img.decode?.().catch(() => {});
      }
    });
  }, []);

  useEffect(() => {
    const refs = videoRefs.current;
    return () => {
      ambientAudio.setTempPaused(false);
      Object.values(refs).forEach((v) => {
        if (v) v.pause();
      });
    };
  }, []);

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

  const jumpToMemory = useCallback((targetIdx: number) => {
    ambientAudio.setTempPaused(false);
    setNeedsSoundTap(false);
    setIsCompleted(false);
    setActiveIndex((curr) => {
      const clamped = Math.max(0, Math.min(CHILDHOOD_MEMORIES.length - 1, targetIdx));
      if (clamped !== curr) {
        setPrevIndex(curr);
      }
      setProgress(0);
      progressRef.current = 0;
      return clamped;
    });
    setRunId((r) => r + 1);
  }, []);

  const advanceSequence = useCallback(() => {
    ambientAudio.setTempPaused(false);
    setNeedsSoundTap(false);
    setActiveIndex((current) => {
      if (current < CHILDHOOD_MEMORIES.length - 1) {
        setPrevIndex(current);
        setProgress(0);
        progressRef.current = 0;
        return current + 1;
      }
      setProgress(1);
      progressRef.current = 1;
      setIsCompleted(true);
      ambientAudio.playSparkleChime();
      fireSparkleBurst();
      return current;
    });
  }, []);

  // Pause/resume active video when hold-pausing
  useEffect(() => {
    if (activeMemory.type !== 'video') return;
    const vid = videoRefs.current[activeMemory.id];
    if (!vid) return;
    if (isPaused) {
      vid.pause();
    } else if (!isIntroActive && !isCompleted) {
      void vid.play().catch(() => {});
    }
  }, [isPaused, activeMemory, isIntroActive, isCompleted]);

  // Sequence playback controller for the active image or video
  useEffect(() => {
    if (isIntroActive || isCompleted) return;

    let rafId = 0;
    let cancelled = false;

    if (activeMemory.type === 'image') {
      ambientAudio.setTempPaused(false);
      setNeedsSoundTap(false);
      let elapsedMs = progressRef.current * IMAGE_DURATION_MS;
      let lastTick = performance.now();

      const tickImage = (now: number) => {
        if (cancelled) return;
        const dt = now - lastTick;
        lastTick = now;
        if (!isPausedRef.current) {
          elapsedMs += dt;
        }
        const ratio = Math.min(1, elapsedMs / IMAGE_DURATION_MS);
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
    triggerHaptic(10);
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
    progressRef.current = 0;
    setIsCompleted(false);
    setIsPaused(false);
    setNeedsSoundTap(false);
    setRunId((r) => r + 1);
  };

  const handleFramePointerDown = () => {
    heldLongRef.current = false;
    if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = window.setTimeout(() => {
      heldLongRef.current = true;
      setIsPaused(true);
      triggerHaptic(8);
    }, 220);
  };

  const handleFramePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (heldLongRef.current) {
      setIsPaused(false);
      heldLongRef.current = false;
      return;
    }

    if (needsSoundTap) {
      handleUnmuteVideoTap();
      return;
    }

    const now = performance.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;

    if (now - lastTapRef.current < 260) {
      // Double tap -> heart burst
      lastTapRef.current = 0;
      const id = Date.now() + Math.random();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      triggerHaptic(10);
      ambientAudio.playSoftTap(1.22);
      setHearts((prev) => [...prev.slice(-6), { id, x, y }]);
      window.setTimeout(() => {
        setHearts((prev) => prev.filter((h) => h.id !== id));
      }, 850);
      return;
    }
    lastTapRef.current = now;

    // Single tap edge navigation (left 28% back, right 28% forward)
    if (relX < 0.28 && activeIndex > 0) {
      triggerHaptic(6);
      jumpToMemory(activeIndex - 1);
    } else if (relX > 0.72 && !isCompleted) {
      triggerHaptic(6);
      advanceSequence();
    }
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
        className="mb-2 flex flex-col items-center"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-white/45">
          Chapter 06 · Childhood
        </span>
        <h2 className="font-serif italic text-2xl sm:text-3xl text-white/95 tracking-tight mt-0.5">
          Little Doha
        </h2>
      </motion.div>

      {/* Focal Cinema Stage */}
      <div className="relative flex flex-col items-center">
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
          onPointerDown={handleFramePointerDown}
          onPointerUp={handleFramePointerUp}
          onPointerCancel={() => {
            if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current);
            setIsPaused(false);
          }}
          onPointerLeave={() => {
            if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current);
            setIsPaused(false);
          }}
          style={{ height: 'min(52dvh, 490px, calc(82vw * 16 / 9))' }}
          className="relative aspect-[9/16] rounded-[26px] overflow-hidden bg-[#0a040c] ring-1 ring-white/20 shadow-[0_36px_95px_-12px_rgba(0,0,0,0.95)] select-none cursor-pointer"
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

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 rounded-[26px] ring-1 ring-inset ring-white/10"
            style={{
              boxShadow: 'inset 0 0 42px rgba(0, 0, 0, 0.28)',
            }}
          />

          {/* Floating double-tap hearts */}
          <AnimatePresence>
            {hearts.map((h) => (
              <motion.div
                key={h.id}
                initial={{ x: h.x - 16, y: h.y - 16, scale: 0.4, opacity: 1 }}
                animate={{ y: h.y - 72, scale: 1.4, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.78, ease: 'easeOut' }}
                className="pointer-events-none absolute z-30"
              >
                <Heart className="w-8 h-8 text-[#ff4f8b] fill-[#ff4f8b] drop-shadow-[0_4px_12px_rgba(255,79,139,0.8)]" />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Hold-to-pause badge */}
          <AnimatePresence>
            {isPaused && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="pointer-events-none absolute top-3.5 left-3.5 z-20 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-md"
              >
                <Pause className="w-2.5 h-2.5" /> Paused
              </motion.div>
            )}
          </AnimatePresence>

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
        <div className="mt-3 w-full max-w-[310px] px-1">
          <div
            style={{ gridTemplateColumns: `repeat(${CHILDHOOD_MEMORIES.length}, minmax(0, 1fr))` }}
            className="grid gap-1.5"
          >
            {CHILDHOOD_MEMORIES.map((item, idx) => {
              const fill =
                isCompleted || idx < activeIndex
                  ? 1
                  : idx === activeIndex
                    ? progress
                    : 0;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => jumpToMemory(idx)}
                  aria-label={`Jump to memory ${idx + 1}`}
                  className="h-[3px] rounded-full bg-white/15 overflow-hidden cursor-pointer"
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
                </button>
              );
            })}
          </div>

          <div className="mt-2 min-h-[58px] flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {!isCompleted ? (
                <motion.div
                  key={activeMemory.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.4, ease: CROSSFADE_EASE }}
                  className="flex flex-col items-center gap-0.5"
                >
                  <p className="font-serif italic text-lg sm:text-[21px] text-[#fff6f8]/95 leading-snug">
                    “{activeMemory.caption}”
                  </p>
                  <span className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-white/40 tabular-nums">
                    0{activeIndex + 1} / 0{CHILDHOOD_MEMORIES.length} · Tap edges or hold
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
                    className="glass inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold text-white/90 hover:bg-white/20 active:scale-95 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Replay
                  </button>
                  <PrimaryButton
                    variant="gold"
                    onClick={() => {
                      triggerHaptic(12);
                      onNext();
                    }}
                    className="px-6 py-2.5 text-xs sm:text-sm"
                  >
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
