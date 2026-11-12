import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Wind, ArrowRight, Flame as FlameIcon } from 'lucide-react';
import { fireFireworks } from '../../utils/confetti';
import { ambientAudio } from '../../utils/ambientAudio';
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
  const [blowLevel, setBlowLevel] = useState(0);
  const [isBlowing, setIsBlowing] = useState(false);
  const [celebrated, setCelebrated] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const blowProgressRef = useRef(0);
  const blowIntensityRef = useRef(0);
  const cakeRef = useRef<HTMLDivElement | null>(null);

  const litCount = candlesLit.filter(Boolean).length;
  const allOut = litCount === 0;

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
      return next;
    });
  }, []);

  const extinguishSingle = useCallback((index: number) => {
    setCandlesLit((prev) => {
      if (!prev[index]) return prev;
      const next = [...prev];
      next[index] = false;
      return next;
    });
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (allOut && !celebrated) {
      setCelebrated(true);
      setIsBlowing(false);
      setBlowLevel(0);
      blowIntensityRef.current = 0;
      stopMic();
      ambientAudio.playSparkleChime();
      cleanup = fireFireworks(4500);
    }
    return () => cleanup?.();
  }, [allOut, celebrated, stopMic]);

  useEffect(() => {
    return () => {
      stopMic();
    };
  }, [stopMic]);

  const enableMicrophone = async () => {
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

      const tick = () => {
        analyser.getByteTimeDomainData(timeData);
        let sumSq = 0;
        for (let i = 0; i < timeData.length; i++) {
          const normalized = (timeData[i] - 128) / 128;
          sumSq += normalized * normalized;
        }
        const rms = Math.sqrt(sumSq / timeData.length);
        const scaled = Math.min(1, Math.max(0, (rms - 0.014) * 5.6));

        // Drive continuous 60fps airflow cloud & flame bending
        blowIntensityRef.current = scaled;
        setBlowLevel(scaled);

        const blowingNow = scaled > 0.18;
        setIsBlowing(blowingNow);

        if (blowingNow) {
          blowProgressRef.current += scaled * 0.45;
          if (blowProgressRef.current >= 1) {
            extinguishBatch(scaled > 0.55 ? 3 : 2);
            blowProgressRef.current = 0;
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setMicStatus('denied');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.5 }}
      className="w-full flex flex-col items-center text-center"
    >
      {/* Full-screen volumetric airflow mist rising from bottom toward the candles */}
      <AirflowEffect
        blowIntensityRef={blowIntensityRef}
        targetRef={cakeRef}
        hasLitCandles={!allOut}
      />

      <Kicker className="text-[#ffd166]">Chapter 08 · 21 Candles</Kicker>
      <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-1 tracking-tight">
        Make A{' '}
        <span className="font-serif italic font-normal text-[#ffd166]">Wish, Doha</span> 🎂
      </h2>
      <p className="text-xs sm:text-sm text-[#ffd6e0]/90 mt-1.5 max-w-md leading-relaxed">
        Close your eyes, make your 21st birthday wish, and blow out all 21 candles for real! Allow microphone permission so I can feel your breath. ❤️
      </p>

      {/* Subtle lit counter pill */}
      <div className="mt-2.5 inline-flex items-center gap-2 rounded-full glass px-3.5 py-1 text-[11px] font-extrabold tracking-[0.18em] uppercase text-[#ffe8b3]">
        <FlameIcon className={`w-3.5 h-3.5 ${allOut ? 'text-white/40' : 'text-[#ffd166]'}`} />
        <span>{allOut ? 'Wish Granted ✨' : `${litCount} / ${TOTAL_CANDLES} Candles Lit`}</span>
      </div>

      {/* Photorealistic 2-Tier Patisserie Cake with 21 Candles */}
      <RealisticCake
        candlesLit={candlesLit}
        blowLevel={blowLevel}
        isBlowing={isBlowing}
        allOut={allOut}
        onExtinguishCandle={extinguishSingle}
        cakeRef={cakeRef}
      />

      {/* Controls / Finale */}
      {!allOut ? (
        <div className="relative z-30 w-full max-w-md space-y-3 mt-1">
          {micStatus === 'active' ? (
            <div className="space-y-2.5">
              <div className="mx-auto w-72 glass rounded-2xl px-4 py-2.5 border border-[#ffd166]/25">
                <div className="flex justify-between items-center gap-2 text-[11px] font-bold text-white/90 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-[#ffd166]" />
                    {isBlowing ? 'Keep blowing, you’ve got this!' : 'Blow from your mouth!'}
                  </span>
                  <span className="text-[#ffd166]">
                    {isBlowing ? 'Blowing 💨' : 'Listening 🎙️'}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                  <motion.div
                    animate={{ width: `${Math.round(blowLevel * 100)}%` }}
                    transition={{ duration: 0.08 }}
                    className="h-full rounded-full bg-gradient-to-r from-[#ffd166] via-[#ff9f1c] to-[#ff4f8b]"
                  />
                </div>
              </div>
              <p className="text-xs text-[#ffe8b3]/85 font-medium">
                {litCount === TOTAL_CANDLES
                  ? 'Take a deep breath, lean in close, and blow steadily at your screen ✨'
                  : `Almost there! Only ${litCount} ${litCount === 1 ? 'candle' : 'candles'} left — give one more big blow! 🌬️`}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2.5">
              <PrimaryButton
                variant="gold"
                onClick={() => void enableMicrophone()}
                className="px-6 py-3 text-sm"
              >
                <Mic className="w-4 h-4" />
                {micStatus === 'denied'
                  ? 'Allow Microphone & Try Again'
                  : 'Allow Microphone & Blow Candles'}
              </PrimaryButton>

              {micStatus === 'idle' ? (
                <p className="text-xs text-[#ffd6e0]/80 max-w-xs leading-relaxed">
                  Tap <span className="font-bold text-[#ffd166]">“Allow”</span> when asked for microphone access, then take a deep breath and blow gently at your screen.
                </p>
              ) : (
                <p className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#ffd166] max-w-sm leading-relaxed">
                  <MicOff className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Please allow microphone permission in your browser settings so you can blow out the candles with your breath!
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative z-30 mt-2 max-w-md space-y-4"
        >
          <div className="glass rounded-3xl p-5 border border-[#ffd166]/45">
            <p className="font-display text-2xl font-extrabold gold-text">
              All 21 Candles Blown Out! 🎉❤️
            </p>
            <p className="text-xs sm:text-sm text-white/85 mt-1">
              May every single wish you just made come true, my love.
            </p>
          </div>

          <PrimaryButton variant="pink" onClick={onNext}>
            <SparkleIcon size={16} />
            <span>Open Final Birthday Message</span>
            <ArrowRight className="w-4 h-4" />
          </PrimaryButton>
        </motion.div>
      )}
    </motion.div>
  );
};
