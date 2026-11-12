import React, { useEffect, useId, useState } from 'react';
import { motion, animate, type HTMLMotionProps } from 'framer-motion';

/* ------------------------------------------------------------------ */
/* Kinetic word-by-word reveal (Wrapped-style masked slide-up)         */
/* ------------------------------------------------------------------ */
export const RevealText: React.FC<{
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}> = ({ text, className = '', delay = 0, stagger = 0.06 }) => {
  const words = text.split(' ');
  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom pb-[0.1em] -mb-[0.1em]">
          <motion.span
            aria-hidden
            className="inline-block"
            initial={{ y: '115%', rotate: 6 }}
            animate={{ y: '0%', rotate: 0 }}
            transition={{ delay: delay + i * stagger, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            {word}
            {i < words.length - 1 ? '\u00A0' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */
type ButtonVariant = 'pink' | 'gold' | 'light' | 'dark' | 'ghost';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  pink: 'bg-gradient-to-r from-[#ff3d7f] via-[#ff5f8f] to-[#ff8a5c] text-white shadow-[0_14px_40px_-10px_rgba(255,61,127,0.8)]',
  gold: 'bg-gradient-to-r from-[#fff0b3] via-[#ffcc4d] to-[#ff9f1c] text-[#3b0a2a] shadow-[0_14px_40px_-10px_rgba(255,190,60,0.8)]',
  light: 'bg-[#fff6ec] text-[#2a0a26] shadow-[0_14px_40px_-12px_rgba(0,0,0,0.55)]',
  dark: 'bg-[#2a0a26] text-[#ffd6e0] shadow-[0_14px_40px_-12px_rgba(42,10,38,0.7)]',
  ghost: 'bg-white/10 text-white border border-white/20 backdrop-blur-md',
};

interface PrimaryButtonProps extends HTMLMotionProps<'button'> {
  variant?: ButtonVariant;
  shine?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  variant = 'pink',
  shine = true,
  className = '',
  children,
  ...rest
}) => (
  <motion.button
    type="button"
    whileHover={{ scale: 1.04, y: -2 }}
    whileTap={{ scale: 0.95 }}
    className={`${shine ? 'btn-shine' : ''} relative inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 font-display text-[15px] font-bold tracking-tight cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${BUTTON_VARIANTS[variant]} ${className}`}
    {...rest}
  >
    {children}
  </motion.button>
);

/* ------------------------------------------------------------------ */
/* Small label with side rules                                         */
/* ------------------------------------------------------------------ */
export const Kicker: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span className={`inline-flex items-center gap-2.5 font-display text-[11px] font-bold uppercase tracking-[0.28em] ${className}`}>
    <span className="h-px w-6 bg-current opacity-50" />
    {children}
    <span className="h-px w-6 bg-current opacity-50" />
  </span>
);

/* ------------------------------------------------------------------ */
/* Animated number counter                                             */
/* ------------------------------------------------------------------ */
export const Counter: React.FC<{ to: number; duration?: number; delay?: number }> = ({ to, duration = 1.8, delay = 0 }) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const controls = animate(0, to, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [to, duration, delay]);
  return <>{value.toLocaleString()}</>;
};

/* ------------------------------------------------------------------ */
/* Spinning circular text badge                                        */
/* ------------------------------------------------------------------ */
export const RotatingBadge: React.FC<{
  text: string;
  size?: number;
  color?: string;
  className?: string;
  center?: React.ReactNode;
}> = ({ text, size = 100, color = '#fff', className = '', center }) => {
  const id = `circ-${useId().replace(/:/g, '')}`;
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
      >
        <defs>
          <path id={id} d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
        </defs>
        <text fontSize="10" fontWeight="800" letterSpacing="2.4" fill={color} fontFamily="Bricolage Grotesque, sans-serif">
          <textPath href={`#${id}`}>{text}</textPath>
        </text>
      </motion.svg>
      <div className="absolute inset-0 flex items-center justify-center">{center}</div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Infinite marquee band                                               */
/* ------------------------------------------------------------------ */
export const Marquee: React.FC<{ items: string[]; className?: string; speed?: number; reverse?: boolean }> = ({
  items,
  className = '',
  speed = 24,
  reverse = false,
}) => (
  <div className={`overflow-hidden whitespace-nowrap ${className}`}>
    <div className="marquee-track" style={{ animationDuration: `${speed}s`, animationDirection: reverse ? 'reverse' : 'normal' }}>
      {[0, 1].map((k) => (
        <div key={k} className="flex shrink-0 items-center" aria-hidden={k === 1}>
          {items.map((item, i) => (
            <span key={i} className="mx-4 flex items-center gap-8">
              {item}
              <span className="opacity-70">✦</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Sparkle star shape                                                  */
/* ------------------------------------------------------------------ */
export const SparkleIcon: React.FC<{ size?: number; color?: string; className?: string }> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill={color}>
    <path d="M12 0C12.6 6.6 17.4 11.4 24 12C17.4 12.6 12.6 17.4 12 24C11.4 17.4 6.6 12.6 0 12C6.6 11.4 11.4 6.6 12 0Z" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Realistic candle flame                                              */
/* ------------------------------------------------------------------ */
export const Flame: React.FC<{ size?: number; windy?: boolean; delay?: number }> = ({ size = 1, windy = false, delay = 0 }) => (
  <div className="relative pointer-events-none" style={{ width: 12 * size, height: 22 * size }}>
    <div
      className="absolute rounded-full bg-[#ffb347]/35 blur-md"
      style={{ width: 46 * size, height: 46 * size, left: '50%', top: '50%', marginLeft: -23 * size, marginTop: -26 * size }}
    />
    <div
      className={windy ? 'flame-wind' : 'flame-flicker'}
      style={{
        animationDelay: `${delay}s`,
        position: 'absolute',
        inset: 0,
        borderRadius: '50% 50% 50% 50% / 62% 62% 38% 38%',
        background:
          'radial-gradient(ellipse at 50% 80%, #ffffff 0%, #fff6c2 20%, #ffd166 42%, #ff9f1c 66%, rgba(255,90,0,0) 82%)',
      }}
    >
      <div
        className="absolute rounded-full"
        style={{
          width: 4 * size,
          height: 7 * size,
          left: '50%',
          bottom: '10%',
          marginLeft: -2 * size,
          background: 'radial-gradient(ellipse, rgba(110,150,255,0.9), rgba(80,120,255,0))',
        }}
      />
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* 3D cake tier (cylinder with frosting + drips)                       */
/* ------------------------------------------------------------------ */
function dripPath(w: number, h: number, n: number) {
  const base = h * 0.4;
  let d = `M0 0 H${w} V${base}`;
  const seg = w / n;
  for (let i = n - 1; i >= 0; i--) {
    const x0 = (i + 1) * seg;
    const x1 = i * seg;
    const mid = (x0 + x1) / 2;
    const len = h * (0.6 + ((i * 37) % 5) / 12);
    d += ` C${x0 - seg * 0.1} ${base} ${mid + seg * 0.3} ${base} ${mid + seg * 0.26} ${len - seg * 0.18}`;
    d += ` Q${mid} ${len + seg * 0.12} ${mid - seg * 0.26} ${len - seg * 0.18}`;
    d += ` C${mid - seg * 0.3} ${base} ${x1 + seg * 0.1} ${base} ${x1} ${base}`;
  }
  return `${d} Z`;
}

export const CakeTier: React.FC<{
  width: number;
  height: number;
  body?: string;
  frosting?: string;
  drip?: string;
  children?: React.ReactNode;
}> = ({
  width,
  height,
  body = 'linear-gradient(90deg, #b8336a 0%, #ee6d97 18%, #ffa3c0 45%, #f27aa0 72%, #a52a5c 100%)',
  frosting = 'radial-gradient(ellipse at 45% 35%, #ffffff 0%, #fff0f4 38%, #ffd9e4 75%, #f7bccd 100%)',
  drip = '#ffe6ee',
  children,
}) => {
  const ry = width * 0.13;
  const dripH = ry * 1.9;
  return (
    <div className="relative" style={{ width, height: height + ry }}>
      <div
        className="absolute left-0 right-0 overflow-hidden"
        style={{
          top: ry,
          height,
          background: body,
          borderRadius: `0 0 ${width / 2}px ${width / 2}px / 0 0 ${ry}px ${ry}px`,
          boxShadow: '0 18px 30px -12px rgba(0,0,0,0.55)',
        }}
      >
        {children}
      </div>
      <svg className="absolute left-0" style={{ top: ry }} width={width} height={dripH} viewBox={`0 0 ${width} ${dripH}`}>
        <path d={dripPath(width, dripH, Math.max(5, Math.round(width / 26)))} fill={drip} />
      </svg>
      <div className="absolute left-0 top-0 w-full rounded-[50%]" style={{ height: ry * 2, background: frosting }} />
    </div>
  );
};
