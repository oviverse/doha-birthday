import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Wind, ArrowRight, Flame as FlameIcon } from 'lucide-react';
import { fireFireworks } from '../../utils/confetti';
import { ambientAudio } from '../../utils/ambientAudio';
import { triggerHaptic } from '../../utils/haptics';
import { Kicker, PrimaryButton, SparkleIcon } from '../ui/Primitives';
import { RealisticCake } from '../cake/RealisticCake';
import { AirflowEffect } from '../cake/AirflowEffect';

interface Stage7BlowCandlesProps {
  onNext: () => void;
}

const TOTAL_CANDLES = 21;

export const Stage7BlowCandles: React.FC<Stage7BlowCandlesProps> = ({ onNext }) => {
  const [candlesLit, setCandlesLit] = useState<boolean[]>(() =>
    Array.from({ length: TOTAL_CANDLES }, () => true)
  );
  const [micStatus, setMicStatus] = useState<'idle' | 'active' | 'denied'>('idle');
  const [isBlowing, setIsBlowing] = useState(false);
  const [celebrated, setCelebrated] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const blowProgressRef = useRef(0);
  const blowIntensityRef = useRef(0);
  const isBlowingRef = useRef(false);
  const cakeRef = useRef<HTMLDivElement | null>(null);
  const meterBarRef = useRef<HTMLDivElement | null>(null);
  const swipeBlowRef = useRef<{ active: boolean; lastX: number; lastY: number; acc: number }>({
    active: false,
    lastX: 0,
    lastY: 0,
    acc: 0,
  });
  const swipeDecayTimerRef = useRef<number | null>(null);

  const litCount = candlesLit.filter(Boolean).length;
  const allOut = litCount === 0;

  const applyBlowVisuals = useCallback((scaled: number, blowingNow: boolean) => {
    blowIntensityRef.current = scaled;

    if (meterBarRef.current) {
      meterBarRef.current.style.transform = `scaleX(${scaled.toFixed(3)})`;
    }

    const cakeEl = cakeRef.current;
    if (cakeEl) {
      const effective = blowingNow ? Math.max(0.28, scaled) : scaled;
      cakeEl.style.setProperty('--flame-skew', `${(-effective * 34).toFixed(1)}deg`);
      cakeEl.style.setProperty('--flame-sx', (1 + effective * 0.24).toFixed(2));
      cakeEl.style.setProperty('--flame-sy', Math.max(0.46, 1 - effective * 0.44).toFixed(2));
    }

    if (blowingNow !== isBlowingRef.current) {
      isBlowingRef.current = blowingNow;
      setIsBlowing(blowingNow);
    }
  }, []);

  const stopMic = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      void audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }, []);

  const extinguishBatch = useCallback((count: number) => {
    setCandlesLit((prev) => {
      const litIndices = prev
        .map((lit, idx) => (lit ? idx : -1))
        .filter((idx) => idx !== -1);
      if (litIndices.length === 0) return prev;

      const next = [...prev];
      for (let i = 0; i < Math.min(count, litIndices.length); i++) {
        const pick = Math.floor(Math.random() * litIndices.length);
        const chosenIdx = litIndices.splice(pick, 1)[0];
        next[chosenIdx] = false;
      }
      ambientAudio.playCandlePuff();
      triggerHaptic(8);
      return next;
    });
  }, []);

  const extinguishSingle = useCallback((index: number) => {
    setCandlesLit((prev) => {
      if (!prev[index]) return prev;
      const next = [...prev];
      next[index] = false;
      ambientAudio.playCandlePuff();
      triggerHaptic(8);
      return next;
    });
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (allOut && !celebrated) {
      setCelebrated(true);
      applyBlowVisuals(0, false);
      stopMic();
      ambientAudio.playWishGranted();
      triggerHaptic([20, 40, 20, 50]);
      cleanup = fireFireworks(4500);
    }
    return () => cleanup?.();
  }, [allOut, celebrated, stopMic, applyBlowVisuals]);

  useEffect(() => {
    return () => {
      stopMic();
      if (swipeDecayTimerRef.current) window.clearTimeout(swipeDecayTimerRef.current);
    };
  }, [stopMic]);

  const enableMicrophone = async () => {
    triggerHaptic(10);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicStatus('denied');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.65;
      source.connect(analyser);

      const timeData = new Uint8Array(analyser.fftSize);
      setMicStatus('active');

      let lastSample = 0;
      const tick = (now: number) => {
        if (now - lastSample >= 32) {
          lastSample = now;
          analyser.getByteTimeDomainData(timeData);
          let sumSq = 0;
          for (let i = 0; i < timeData.length; i++) {
            const normalized = (timeData[i] - 128) / 128;
            sumSq += normalized * normalized;
          }
          const rms = Math.sqrt(sumSq / timeData.length);
          const scaled = Math.min(1, Math.max(0, (rms - 0.014) * 5.8));
          const blowingNow = scaled > 0.17;

          applyBlowVisuals(scaled, blowingNow);

          if (blowingNow) {
            blowProgressRef.current += scaled * 0.85;
            if (blowProgressRef.current >= 1) {
              extinguishBatch(scaled > 0.55 ? 3 : 2);
              blowProgressRef.current = 0;
            }
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setMicStatus('denied');
    }
  };

  // Finger-swipe wind gesture over the cake so she can also blow candles out with a swipe!
  const handleCakePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (allOut) return;
    swipeBlowRef.current = { active: true, lastX: e.clientX, lastY: e.clientY, acc: 0 };
  };

  const handleCakePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (allOut || !swipeBlowRef.current.active) return;
    const dist = Math.hypot(
      e.clientX - swipeBlowRef.current.lastX,
      e.clientY - swipeBlowRef.current.lastY
    );
    swipeBlowRef.current.lastX = e.clientX;
    swipeBlowRef.current.lastY = e.clientY;
    swipeBlowRef.current.acc += dist;

    const strength = Math.min(1, Math.max(0.32, dist / 24));
    applyBlowVisuals(strength, true);

    if (swipeDecayTimerRef.current) window.clearTimeout(swipeDecayTimerRef.current);
    swipeDecayTimerRef.current = window.setTimeout(() => {
      if (micStatus !== 'active') {
        applyBlowVisuals(0, false);
      }
    }, 180);

    if (swipeBlowRef.current.acc > 42) {
      swipeBlowRef.current.acc = 0;
      extinguishBatch(2);
    }
  };

  const handleCakePointerUp = () => {
    swipeBlowRef.current.active = false;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.5 }}
      className="relative w-full flex flex-col items-center text-center"
    >
      {/* Full-screen volumetric airflow mist (sleeps when idle) */}
      <AirflowEffect
        blowIntensityRef={blowIntensityRef}
        targetRef={cakeRef}
        hasLitCandles={!allOut}
        isActive={isBlowing}
      />

      {/* Shooting Wish Star when all 21 candles go out */}
      {allOut && (
        <div
          aria-hidden
          className="shooting-star pointer-events-none fixed top-12 left-0 z-20 h-[2px] w-28 rounded-full bg-gradient-to-r from-transparent via-[#fff7cc] to-[#ffd166] shadow-[0_0_16px_4px_rgba(255,220,130,0.9)]"
        />
      )}

      <Kicker className="text-[#ffd166]">Chapter 09 · 21 Candles</Kicker>
      <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white mt-0.5 tracking-tight">
        Make A{' '}
        <span className="font-serif italic font-normal text-[#ffd166]">Wish, Doha</span> 🎂
      </h2>
      <p className="text-[11px] sm:text-sm text-[#ffd6e0]/90 mt-1 max-w-md leading-snug">
        Close your eyes, make your 21st wish, and blow into your mic — or swipe across the flames!
      </p>

      {/* Lit counter pill */}
      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full glass px-3 py-1 text-[10px] font-extrabold tracking-[0.18em] uppercase text-[#ffe8b3]">
        <FlameIcon className={`w-3.5 h-3.5 ${allOut ? 'text-white/40' : 'text-[#ffd166]'}`} />
        <span>{allOut ? 'Wish Granted ✨' : `${litCount} / ${TOTAL_CANDLES} Candles Lit`}</span>
      </div>

      {/* Interactive 21-Candle Cake (supports both mic blow & finger-wind swipe + tap) */}
      <div
        onPointerDown={handleCakePointerDown}
        onPointerMove={handleCakePointerMove}
        onPointerUp={handleCakePointerUp}
        onPointerCancel={handleCakePointerUp}
        className="w-full flex justify-center touch-none"
      >
        <RealisticCake
          candlesLit={candlesLit}
          isBlowing={isBlowing}
          allOut={allOut}
          onExtinguishCandle={extinguishSingle}
          cakeRef={cakeRef}
          className="my-1 max-w-[min(80vw,330px,42dvh)] sm:max-w-[385px]"
        />
      </div>

      {/* Controls / Finale */}
      {!allOut ? (
        <div className="relative z-30 w-full max-w-md space-y-2 mt-0.5">
          {micStatus === 'active' ? (
            <div className="space-y-1.5">
              <div className="mx-auto w-72 glass rounded-2xl px-3.5 py-2 border border-[#ffd166]/25">
                <div className="flex justify-between items-center gap-2 text-[11px] font-bold text-white/90 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-[#ffd166]" />
                    {isBlowing ? 'Keep blowing, you’ve got this!' : 'Blow at your screen!'}
                  </span>
                  <span className="text-[#ffd166]">
                    {isBlowing ? 'Blowing 💨' : 'Listening 🎙️'}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                  <div
                    ref={meterBarRef}
                    style={{ transform: 'scaleX(0)', transformOrigin: 'left center' }}
                    className="h-full w-full rounded-full bg-gradient-to-r from-[#ffd166] via-[#ff9f1c] to-[#ff4f8b] transition-transform duration-75 ease-out"
                  />
                </div>
              </div>
              <p className="text-[11px] text-[#ffe8b3]/85 font-medium">
                {litCount === TOTAL_CANDLES
                  ? 'Take a deep breath and blow steadily — or swipe across the flames 🌬️'
                  : `Almost there! Only ${litCount} ${litCount === 1 ? 'candle' : 'candles'} left! 🌬️`}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <PrimaryButton
                variant="gold"
                onClick={() => void enableMicrophone()}
                className="px-6 py-2.5 text-xs sm:text-sm"
              >
                <Mic className="w-4 h-4" />
                {micStatus === 'denied'
                  ? 'Retry Microphone'
                  : 'Allow Mic & Blow Candles'}
              </PrimaryButton>

              {micStatus === 'idle' ? (
                <p className="text-[11px] text-[#ffd6e0]/75 max-w-xs leading-snug">
                  Tap <span className="font-bold text-[#ffd166]">“Allow”</span> to blow for real, or <span className="font-bold text-white">swipe/tap</span> the flames.
                </p>
              ) : (
                <p className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#ffd166] max-w-xs leading-snug">
                  <MicOff className="w-3.5 h-3.5 shrink-0" />
                  <span>No mic needed — swipe your finger across the flames to blow them out!</span>
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative z-30 mt-1 w-full max-w-md space-y-3"
        >
          <div className="glass rounded-2xl px-4 py-3 border border-[#ffd166]/45">
            <p className="font-display text-xl sm:text-2xl font-extrabold gold-text">
              All 21 Candles Blown Out! 🎉❤️
            </p>
            <p className="text-xs text-white/85 mt-0.5">
              May every single wish you just made come true, my love.
            </p>
          </div>

          <PrimaryButton
            variant="pink"
            onClick={() => {
              triggerHaptic(14);
              onNext();
            }}
            className="px-7 py-3 text-sm"
          >
            <SparkleIcon size={16} />
            <span>Open Final Birthday Message</span>
            <ArrowRight className="w-4 h-4" />
          </PrimaryButton>
        </motion.div>
      )}
    </motion.div>
  );
};
