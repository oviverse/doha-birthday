import React, { useEffect, useRef } from 'react';

interface AirflowEffectProps {
  /** Continuous smoothed blow intensity in [0, 1] */
  blowIntensityRef: React.MutableRefObject<number>;
  /** Reference to the cake/candles container to aim the airflow toward */
  targetRef: React.RefObject<HTMLElement | null>;
  /** Whether candles are still lit (tints mist slightly warm near flames) */
  hasLitCandles?: boolean;
}

type ParticleKind = 'cloud' | 'stream' | 'mote';

interface AirParticle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  growRate: number;
  alpha: number;
  maxAlpha: number;
  age: number;
  life: number;
  swirlFreq: number;
  swirlAmp: number;
  phase: number;
  warmth: number;
  prevX: number;
  prevY: number;
}

const MAX_PARTICLES = 180;

export const AirflowEffect: React.FC<AirflowEffectProps> = ({
  blowIntensityRef,
  targetRef,
  hasLitCandles = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hasLitRef = useRef(hasLitCandles);

  useEffect(() => {
    hasLitRef.current = hasLitCandles;
  }, [hasLitCandles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resize();
    window.addEventListener('resize', resize);

    const particles: AirParticle[] = [];
    let smoothedIntensity = 0;
    let wasBlowing = false;
    let spawnAccumulator = 0;
    let lastTime = performance.now();
    let rafId = 0;

    const getTargetPoint = () => {
      const el = targetRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        return {
          tx: rect.left + rect.width * 0.5,
          ty: rect.top + rect.height * 0.34,
          spread: Math.max(110, rect.width * 0.55),
        };
      }
      return {
        tx: width * 0.5,
        ty: height * 0.38,
        spread: 140,
      };
    };

    const spawnParticle = (kind: ParticleKind, intensity: number, initialBurst = false) => {
      if (particles.length >= MAX_PARTICLES) return;

      const { tx, ty } = getTargetPoint();
      const originX = width * 0.5 + (Math.random() - 0.5) * Math.min(110, width * 0.22);
      const originY = height + (kind === 'cloud' ? 26 : 12) + Math.random() * 18;

      const dx = tx - originX;
      const dy = ty - originY;
      const dist = Math.max(120, Math.hypot(dx, dy));
      const baseAngle = Math.atan2(dy, dx);

      // Conical jet angle spread from mouth/bottom toward the cake candles
      const coneSpread = kind === 'cloud' ? 0.34 : kind === 'stream' ? 0.24 : 0.4;
      const angle = baseAngle + (Math.random() - 0.5) * coneSpread;

      // Scale speed to viewport distance so breath reliably reaches the candles
      const distanceScale = Math.max(0.85, Math.min(1.45, dist / 460));
      const baseSpeed =
        kind === 'cloud'
          ? (460 + Math.random() * 240 + intensity * 320) * distanceScale
          : kind === 'stream'
            ? (640 + Math.random() * 280 + intensity * 380) * distanceScale
            : (520 + Math.random() * 260 + intensity * 300) * distanceScale;

      const speedMult = initialBurst ? 1.15 : 1;
      const vx = Math.cos(angle) * baseSpeed * speedMult;
      const vy = Math.sin(angle) * baseSpeed * speedMult;

      const life =
        kind === 'cloud'
          ? 0.95 + Math.random() * 0.55
          : kind === 'stream'
            ? 0.52 + Math.random() * 0.3
            : 0.75 + Math.random() * 0.45;

      const radius =
        kind === 'cloud'
          ? 26 + Math.random() * 22 + intensity * 18
          : kind === 'stream'
            ? 2.2 + Math.random() * 2.5
            : 1.5 + Math.random() * 2.4;

      const maxAlpha =
        kind === 'cloud'
          ? (0.09 + Math.random() * 0.08) * (0.45 + intensity * 0.65)
          : kind === 'stream'
            ? (0.14 + Math.random() * 0.14) * (0.4 + intensity * 0.7)
            : (0.22 + Math.random() * 0.22) * (0.45 + intensity * 0.65);

      particles.push({
        kind,
        x: originX,
        y: originY,
        prevX: originX,
        prevY: originY,
        vx,
        vy,
        radius,
        growRate: kind === 'cloud' ? 88 + Math.random() * 75 : 0,
        alpha: 0,
        maxAlpha,
        age: 0,
        life,
        swirlFreq: 2.5 + Math.random() * 3.5,
        swirlAmp: kind === 'cloud' ? 36 + Math.random() * 44 : 24 + Math.random() * 36,
        phase: Math.random() * Math.PI * 2,
        warmth: hasLitRef.current ? Math.random() * 0.35 : 0,
        // Note: prevX/prevY updated each frame for smooth streamlines
      });
    };

    const step = (now: number) => {
      const dt = Math.min(0.04, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const rawTarget = Math.max(0, Math.min(1, blowIntensityRef.current));
      // Fast rise, smooth natural decay
      const lerpRate = rawTarget > smoothedIntensity ? 16 : 7;
      smoothedIntensity += (rawTarget - smoothedIntensity) * Math.min(1, dt * lerpRate);

      const blowingNow = smoothedIntensity > 0.06;

      // Initial puff burst when user begins blowing
      if (blowingNow && !wasBlowing) {
        for (let i = 0; i < 8; i++) spawnParticle('cloud', Math.max(0.45, smoothedIntensity), true);
        for (let i = 0; i < 6; i++) spawnParticle('stream', Math.max(0.45, smoothedIntensity), true);
      }
      wasBlowing = blowingNow;

      // Continuous emission proportional to blow strength
      if (blowingNow) {
        const rate = 24 + smoothedIntensity * 64;
        spawnAccumulator += rate * dt;
        while (spawnAccumulator >= 1) {
          spawnAccumulator -= 1;
          const r = Math.random();
          if (r < 0.52) {
            spawnParticle('cloud', smoothedIntensity);
          } else if (r < 0.82) {
            spawnParticle('stream', smoothedIntensity);
          } else {
            spawnParticle('mote', smoothedIntensity);
          }
        }
      } else {
        spawnAccumulator = 0;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Subtle atmospheric bottom-breath glow column when actively blowing
      if (smoothedIntensity > 0.05) {
        const { tx, ty } = getTargetPoint();
        const beamGrad = ctx.createLinearGradient(width * 0.5, height, tx, ty - 60);
        beamGrad.addColorStop(0, `rgba(245, 250, 255, ${0.14 * smoothedIntensity})`);
        beamGrad.addColorStop(0.55, `rgba(255, 255, 255, ${0.06 * smoothedIntensity})`);
        beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(width * 0.5 - 55, height + 10);
        ctx.lineTo(width * 0.5 + 55, height + 10);
        ctx.lineTo(tx + 185, ty - 50);
        ctx.lineTo(tx - 185, ty - 50);
        ctx.closePath();
        ctx.fill();
      }

      const { ty } = getTargetPoint();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age += dt;
        if (p.age >= p.life) {
          particles.splice(i, 1);
          continue;
        }

        const progress = p.age / p.life;
        p.prevX = p.x;
        p.prevY = p.y;

        // Air resistance & upward dispersion curl as air hits the cake region
        const drag = Math.pow(0.28, dt);
        p.vx *= drag;
        p.vy *= drag;

        // Gentle horizontal swirl & outward deflection near the cake
        const curl = Math.sin(p.age * p.swirlFreq + p.phase) * p.swirlAmp;
        const nearCake = p.y < ty + 90 ? 1.55 : 1;
        p.x += (p.vx + curl * nearCake) * dt;
        p.y += p.vy * dt;

        // Clouds expand continuously as the air jet diffuses
        p.radius += p.growRate * dt * (1 + progress * 0.55);

        // Smooth fade-in then long soft fade-out
        const fadeIn = Math.min(1, progress / 0.14);
        const fadeOut = Math.pow(1 - progress, 1.45);
        p.alpha = p.maxAlpha * fadeIn * fadeOut;

        if (p.alpha <= 0.002) continue;

        if (p.kind === 'cloud') {
          // Warm slightly near lit candles for realistic ambient light scattering
          const nearFlames = p.y < ty + 110 ? p.warmth : 0;
          const r = 255;
          const g = Math.round(252 - nearFlames * 12);
          const b = Math.round(255 - nearFlames * 34);

          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
          grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${p.alpha})`);
          grad.addColorStop(0.42, `rgba(242, 248, 255, ${p.alpha * 0.58})`);
          grad.addColorStop(0.75, `rgba(235, 244, 255, ${p.alpha * 0.18})`);
          grad.addColorStop(1, 'rgba(235, 244, 255, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 'stream') {
          const tailScale = 0.045;
          const tailX = p.x - p.vx * tailScale;
          const tailY = p.y - p.vy * tailScale;

          const grad = ctx.createLinearGradient(tailX, tailY, p.x, p.y);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          grad.addColorStop(0.55, `rgba(248, 252, 255, ${p.alpha})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.strokeStyle = grad;
          ctx.lineWidth = p.radius * (1 - progress * 0.45);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          const ctrlX = (tailX + p.x) * 0.5 + Math.sin(p.age * 7 + p.phase) * 8;
          const ctrlY = (tailY + p.y) * 0.5;
          ctx.quadraticCurveTo(ctrlX, ctrlY, p.x, p.y);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(255, 250, 244, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [blowIntensityRef, targetRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40"
    />
  );
};
