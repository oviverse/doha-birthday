import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface RealisticCakeProps {
  candlesLit: boolean[];
  blowLevel?: number;
  isBlowing?: boolean;
  allOut?: boolean;
  onExtinguishCandle?: (index: number) => void;
  cakeRef?: React.RefObject<HTMLDivElement | null>;
  candleMode?: 'trio' | 'twenty-one';
  plaqueText?: string;
  interactive?: boolean;
  className?: string;
}

interface CandleSpot {
  index: number;
  x: number;
  y: number;
  height: number;
  scale: number;
  variant: 'ivory' | 'blush' | 'champagne';
}

const VIEW_W = 420;
const VIEW_H = 385;

/**
 * Generates an organic chocolate ganache drip path anchored to the front arc
 * of an ellipse centered at (cx, cy) with radii (rx, ry).
 */
function buildDripPath(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  drips: Array<{ t: number; len: number; width: number }>
): string {
  const xStart = cx - rx;
  const xEnd = cx + rx;

  // Start at top-left of front arc, sweep across top back half-rim slightly for seamless cap
  let d = `M ${xStart} ${cy}`;
  // Trace front-facing bottom of the ellipse left -> right? Wait: to cover top surface + front drips:
  // We draw the top ellipse cap + hanging drips along the front edge.
  d = `M ${xStart} ${cy} A ${rx} ${ry} 0 0 1 ${xEnd} ${cy}`;

  // Now trace back right -> left along the front elliptical rim, dipping into drips
  const sorted = [...drips].sort((a, b) => b.t - a.t);
  let prevX = xEnd;
  let prevY = cy;

  const ellipsePt = (t: number) => {
    // t in [0, 1] maps angle from PI (left) to 0 (right) along front arc
    const angle = Math.PI * (1 - t);
    return {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    };
  };

  for (const drip of sorted) {
    const halfW = drip.width / 2;
    const tR = Math.min(0.985, drip.t + halfW);
    const tL = Math.max(0.015, drip.t - halfW);
    const pR = ellipsePt(tR);
    const pMid = ellipsePt(drip.t);
    const pL = ellipsePt(tL);

    const dropY = pMid.y + drip.len;
    const bulbW = (pR.x - pL.x) * 0.48;

    // Curve along rim from previous point to right shoulder of this drip
    const midRimX = (prevX + pR.x) / 2;
    const midRimY = Math.max(prevY, pR.y) + 1.5;
    d += ` Q ${midRimX} ${midRimY} ${pR.x.toFixed(1)} ${pR.y.toFixed(1)}`;

    // Smooth viscous ganache drop down to rounded teardrop tip and back up
    d += ` C ${(pR.x - bulbW * 0.35).toFixed(1)} ${(pR.y + drip.len * 0.32).toFixed(1)},`;
    d += ` ${(pMid.x + bulbW * 0.68).toFixed(1)} ${(dropY - drip.len * 0.2).toFixed(1)},`;
    d += ` ${(pMid.x + bulbW * 0.56).toFixed(1)} ${(dropY - 3).toFixed(1)}`;
    d += ` C ${(pMid.x + bulbW * 0.45).toFixed(1)} ${(dropY + 3.5).toFixed(1)},`;
    d += ` ${(pMid.x - bulbW * 0.45).toFixed(1)} ${(dropY + 3.5).toFixed(1)},`;
    d += ` ${(pMid.x - bulbW * 0.56).toFixed(1)} ${(dropY - 3).toFixed(1)}`;
    d += ` C ${(pMid.x - bulbW * 0.68).toFixed(1)} ${(dropY - drip.len * 0.2).toFixed(1)},`;
    d += ` ${(pL.x + bulbW * 0.35).toFixed(1)} ${(pL.y + drip.len * 0.32).toFixed(1)},`;
    d += ` ${pL.x.toFixed(1)} ${pL.y.toFixed(1)}`;

    prevX = pL.x;
    prevY = pL.y;
  }

  d += ` Q ${((prevX + xStart) / 2).toFixed(1)} ${(Math.max(prevY, cy) + 1).toFixed(1)} ${xStart} ${cy} Z`;
  return d;
}

/**
 * Generates piped buttercream pearl coordinates along a front elliptical rim.
 */
function buildPipedPearls(cx: number, cy: number, rx: number, ry: number, count: number) {
  const pearls: Array<{ x: number; y: number; r: number }> = [];
  for (let i = 0; i < count; i++) {
    const frac = i / (count - 1);
    const angle = Math.PI * (0.06 + frac * 0.88);
    const x = cx - rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    // Perspective: front pearls slightly fuller than side pearls
    const r = 4.6 + Math.sin(angle) * 1.4;
    pearls.push({ x, y, r });
  }
  return pearls;
}

/**
 * Detailed SVG strawberry garnish positioned at (x, y)
 */
const Strawberry: React.FC<{
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  uid: string;
}> = ({ x, y, scale = 1, rotate = 0, uid }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`}>
    {/* Cast shadow */}
    <ellipse cx="1" cy="11" rx="10" ry="3.5" fill="rgba(20,4,8,0.45)" />
    {/* Berry body */}
    <path
      d="M 0 -10 C 8 -10, 11 -2, 8 5 C 5.5 10.5, 2 12.5, 0 12.5 C -2 12.5, -5.5 10.5, -8 5 C -11 -2, -8 -10, 0 -10 Z"
      fill={`url(#${uid}-berry)`}
    />
    {/* Glossy specular skin highlight */}
    <ellipse
      cx="-3.4"
      cy="-2.5"
      rx="2.3"
      ry="4.8"
      transform="rotate(-14 -3.4 -2.5)"
      fill="rgba(255,220,225,0.42)"
    />
    <circle cx="-4.2" cy="-5.2" r="1.1" fill="rgba(255,255,255,0.65)" />
    {/* Tiny strawberry seeds */}
    {[
      [-4, -2], [1, -4], [5, -1],
      [-5, 2], [-1, 1], [3, 3], [6, 3],
      [-3, 6], [1, 7], [4, 7], [0, 10],
    ].map(([sx, sy], i) => (
      <ellipse
        key={i}
        cx={sx}
        cy={sy}
        rx="0.55"
        ry="0.85"
        fill="#ffd79a"
        opacity="0.78"
      />
    ))}
    {/* Green leafy calyx */}
    <path
      d="M -7 -9 C -4 -12, -1 -10, 0 -8 C 1 -10, 4 -12, 7 -9 C 4 -7, 2 -7, 0 -6.5 C -2 -7, -4 -7, -7 -9 Z"
      fill="#2e6f3e"
    />
    <path
      d="M -4 -10.5 L 0 -7.5 L 4 -10.5 L 1.5 -12.5 L 0 -10 L -1.5 -12.5 Z"
      fill="#489957"
    />
    <path d="M 0 -10.5 L 0.5 -14.5" stroke="#3b8049" strokeWidth="1.3" strokeLinecap="round" />
  </g>
);

const Blueberry: React.FC<{ x: number; y: number; r?: number; uid: string }> = ({
  x,
  y,
  r = 4.6,
  uid,
}) => (
  <g transform={`translate(${x}, ${y})`}>
    <ellipse cx="0.6" cy={r * 0.72} rx={r * 0.95} ry={r * 0.42} fill="rgba(10,5,18,0.45)" />
    <circle cx="0" cy="0" r={r} fill={`url(#${uid}-blueberry)`} />
    <circle cx={-r * 0.32} cy={-r * 0.32} r={r * 0.28} fill="rgba(220,232,255,0.5)" />
    {/* Crown dimple */}
    <path
      d={`M ${-r * 0.28} ${-r * 0.65} L 0 ${-r * 0.85} L ${r * 0.28} ${-r * 0.65}`}
      fill="none"
      stroke="#141838"
      strokeWidth="0.9"
      strokeLinecap="round"
    />
  </g>
);

const Raspberry: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <ellipse cx="0.5" cy="6.2" rx="6" ry="2.4" fill="rgba(20,4,10,0.45)" />
    {[
      [-3, -3.5], [0, -4], [3, -3.5],
      [-4.2, -0.5], [-1.5, -1], [1.5, -1], [4.2, -0.5],
      [-3.2, 2.5], [0, 2.2], [3.2, 2.5],
      [-1.5, 4.8], [1.5, 4.8],
    ].map(([dx, dy], idx) => (
      <g key={idx}>
        <circle cx={dx} cy={dy} r="2.2" fill={idx % 2 === 0 ? '#a8133d' : '#c91b4c'} />
        <circle cx={dx - 0.6} cy={dy - 0.6} r="0.65" fill="rgba(255,190,210,0.45)" />
      </g>
    ))}
  </g>
);

const GoldLeafFlake: React.FC<{ x: number; y: number; rotate?: number; scale?: number }> = ({
  x,
  y,
  rotate = 0,
  scale = 1,
}) => (
  <path
    transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`}
    d="M -4 -1 L -1 -4 L 4 -2 L 3 3 L -2 4 Z"
    fill="#f5cf6e"
    stroke="#fff4c4"
    strokeWidth="0.4"
    opacity="0.88"
  />
);

export const RealisticCake: React.FC<RealisticCakeProps> = ({
  candlesLit,
  blowLevel = 0,
  isBlowing = false,
  allOut = false,
  onExtinguishCandle,
  cakeRef,
  candleMode = 'twenty-one',
  plaqueText = 'Happy 21st, Doha',
  interactive = true,
  className = 'my-2 max-w-[410px]',
}) => {
  const rawId = useId();
  const uid = `cake-${rawId.replace(/:/g, '')}`;
  const localRef = useRef<HTMLDivElement | null>(null);
  const [uiScale, setUiScale] = useState(0.96);

  useEffect(() => {
    const el = localRef.current;
    if (!el) return;
    const update = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setUiScale(w / VIEW_W);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const setMergedRef = (node: HTMLDivElement | null) => {
    localRef.current = node;
    if (cakeRef) {
      cakeRef.current = node;
    }
  };

  const litCount = candlesLit.filter(Boolean).length;
  const lightRatio = litCount / Math.max(1, candlesLit.length);

  // Candles planted in 3D perspective on the cake surface, sorted back-to-front
  const candles = useMemo<CandleSpot[]>(() => {
    if (candleMode === 'trio') {
      return [
        { index: 0, x: 175, y: 113, height: 34, scale: 1.06, variant: 'champagne' },
        { index: 1, x: 210, y: 110, height: 42, scale: 1.14, variant: 'blush' },
        { index: 2, x: 245, y: 113, height: 34, scale: 1.06, variant: 'ivory' },
      ];
    }

    const spots: CandleSpot[] = [];
    const variants: Array<'ivory' | 'blush' | 'champagne'> = ['ivory', 'champagne', 'blush'];

    // 1. Top tier back arc (6 candles)
    const topBackAngles = [-154, -129, -103, -77, -51, -26];
    topBackAngles.forEach((deg, idx) => {
      const rad = (deg * Math.PI) / 180;
      spots.push({
        index: idx,
        x: 210 + 73 * Math.cos(rad),
        y: 112 + 12.5 * Math.sin(rad),
        height: 29,
        scale: 0.92,
        variant: variants[idx % variants.length],
      });
    });

    // 2. Top tier front arc (5 candles, interleaved between back candles)
    const topFrontAngles = [148, 119, 90, 61, 32];
    topFrontAngles.forEach((deg, idx) => {
      const rad = (deg * Math.PI) / 180;
      spots.push({
        index: 6 + idx,
        x: 210 + 67 * Math.cos(rad),
        y: 117 + 11.5 * Math.sin(rad),
        height: 28,
        scale: 0.98,
        variant: variants[(idx + 1) % variants.length],
      });
    });

    // 3. Bottom tier front & side shelf (10 candles)
    const bottomCount = 10;
    for (let i = 0; i < bottomCount; i++) {
      const deg = 171 - (i * (171 - 9)) / (bottomCount - 1);
      const rad = (deg * Math.PI) / 180;
      spots.push({
        index: 11 + i,
        x: 210 + 131 * Math.cos(rad),
        y: 208 + 21.5 * Math.sin(rad),
        height: 27,
        scale: 1.0,
        variant: variants[(i + 2) % variants.length],
      });
    }

    // Painter's algorithm: render back candles before front candles
    return spots.sort((a, b) => a.y - b.y);
  }, [candleMode]);

  const topDripSpecs = useMemo(
    () => [
      { t: 0.08, len: 22, width: 0.09 },
      { t: 0.21, len: 36, width: 0.1 },
      { t: 0.34, len: 18, width: 0.08 },
      { t: 0.48, len: 39, width: 0.11 },
      { t: 0.63, len: 23, width: 0.09 },
      { t: 0.77, len: 34, width: 0.1 },
      { t: 0.91, len: 20, width: 0.085 },
    ],
    []
  );

  const bottomDripSpecs = useMemo(
    () => [
      { t: 0.06, len: 24, width: 0.075 },
      { t: 0.16, len: 42, width: 0.085 },
      { t: 0.27, len: 28, width: 0.07 },
      { t: 0.39, len: 20, width: 0.08 },
      { t: 0.51, len: 16, width: 0.075 },
      { t: 0.62, len: 21, width: 0.08 },
      { t: 0.74, len: 39, width: 0.085 },
      { t: 0.85, len: 35, width: 0.08 },
      { t: 0.94, len: 20, width: 0.07 },
    ],
    []
  );

  const topDrips = useMemo(
    () => buildDripPath(210, 114, 94, 18, topDripSpecs),
    [topDripSpecs]
  );

  const bottomDrips = useMemo(
    () => buildDripPath(210, 207, 147, 27, bottomDripSpecs),
    [bottomDripSpecs]
  );

  const topPearls = useMemo(() => buildPipedPearls(210, 196, 94, 17.5, 15), []);
  const bottomPearls = useMemo(() => buildPipedPearls(210, 299, 146, 26, 21), []);

  // Compute exact specular highlight arcs right on each drip bulb
  const topDripHighlights = useMemo(
    () =>
      topDripSpecs.map((d) => {
        const angle = Math.PI * (1 - d.t);
        const x = 210 + 94 * Math.cos(angle) - 1.8;
        const y = 114 + 18 * Math.sin(angle) + d.len * 0.36;
        return { x, y, h: Math.max(5, d.len * 0.44) };
      }),
    [topDripSpecs]
  );

  const bottomDripHighlights = useMemo(
    () =>
      bottomDripSpecs.map((d) => {
        const angle = Math.PI * (1 - d.t);
        const x = 210 + 147 * Math.cos(angle) - 2.1;
        const y = 207 + 27 * Math.sin(angle) + d.len * 0.36;
        return { x, y, h: Math.max(6, d.len * 0.46) };
      }),
    [bottomDripSpecs]
  );

  // Continuous flame reaction to blow strength
  const effectiveBlow = isBlowing ? Math.max(0.28, blowLevel) : blowLevel;
  const flameSkew = -effectiveBlow * 34;
  const flameScaleY = Math.max(0.46, 1 - effectiveBlow * 0.44);
  const flameScaleX = 1 + effectiveBlow * 0.24;

  return (
    <div
      ref={setMergedRef}
      className={`relative w-full aspect-[420/385] select-none flex items-center justify-center ${className}`}
    >
      {/* Atmospheric warm candlelight room glow */}
      <motion.div
        animate={{
          opacity: allOut ? 0.04 : 0.22 + lightRatio * 0.62,
          scale: isBlowing ? 0.96 : 1,
        }}
        transition={{ duration: 0.35 }}
        className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-[92%] h-[68%] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, rgba(255, 198, 92, 0.55) 0%, rgba(255, 130, 50, 0.25) 45%, rgba(255, 70, 90, 0) 78%)',
        }}
      />

      {/* SVG Photorealistic Two-Tier Patisserie Cake & Stand */}
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-full block overflow-visible drop-shadow-[0_24px_38px_rgba(0,0,0,0.72)]"
        aria-hidden="true"
      >
        <defs>
          {/* Subtle organic buttercream grain texture */}
          <filter id={`${uid}-buttercream-tex`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="11" result="noise" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1  0 0 0 0 0.96  0 0 0 0 0.92  0 0 0 0.065 0"
              in="noise"
              result="tinted"
            />
            <feComposite in="tinted" in2="SourceGraphic" operator="atop" />
          </filter>

          <filter id={`${uid}-soft-blur`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>

          <filter id={`${uid}-drip-shadow`} x="-10%" y="-10%" width="120%" height="130%">
            <feGaussianBlur stdDeviation="1.8" />
          </filter>

          {/* Pedestal porcelain & warm brass lighting */}
          <linearGradient id={`${uid}-stand-stem`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6c5955" />
            <stop offset="22%" stopColor="#b8a59e" />
            <stop offset="44%" stopColor="#fff7ef" />
            <stop offset="62%" stopColor="#d9c6bc" />
            <stop offset="85%" stopColor="#8c756d" />
            <stop offset="100%" stopColor="#52423f" />
          </linearGradient>

          <linearGradient id={`${uid}-stand-rim`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#75615c" />
            <stop offset="24%" stopColor="#cbb8af" />
            <stop offset="46%" stopColor="#fffaf4" />
            <stop offset="70%" stopColor="#cdb9b0" />
            <stop offset="100%" stopColor="#5f4c48" />
          </linearGradient>

          <radialGradient id={`${uid}-plate-top`} cx="48%" cy="42%" r="58%">
            <stop offset="0%" stopColor="#fffaf4" />
            <stop offset="55%" stopColor="#ebe0d8" />
            <stop offset="85%" stopColor="#c5b2a9" />
            <stop offset="100%" stopColor="#9c877f" />
          </radialGradient>

          {/* Bottom tier: Dusty Raspberry-Rose Swiss Meringue Buttercream */}
          <linearGradient id={`${uid}-bottom-body`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4f1227" />
            <stop offset="14%" stopColor="#892447" />
            <stop offset="34%" stopColor="#c84c73" />
            <stop offset="48%" stopColor="#e27193" />
            <stop offset="68%" stopColor="#bd3f67" />
            <stop offset="88%" stopColor="#761b3a" />
            <stop offset="100%" stopColor="#420d1f" />
          </linearGradient>

          {/* Top tier: Creamy Ivory Vanilla-Bean Swiss Meringue Buttercream */}
          <linearGradient id={`${uid}-top-body`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#826558" />
            <stop offset="16%" stopColor="#bfa293" />
            <stop offset="36%" stopColor="#efe0d3" />
            <stop offset="49%" stopColor="#fff8f0" />
            <stop offset="68%" stopColor="#e5d0c0" />
            <stop offset="88%" stopColor="#a88a7c" />
            <stop offset="100%" stopColor="#6f5348" />
          </linearGradient>

          <radialGradient id={`${uid}-top-frosting`} cx="48%" cy="42%" r="60%">
            <stop offset="0%" stopColor="#fffaf2" />
            <stop offset="55%" stopColor="#f4e5d8" />
            <stop offset="88%" stopColor="#d9bfb0" />
            <stop offset="100%" stopColor="#b89888" />
          </radialGradient>

          {/* Rich Glossy Dark-Berry Chocolate Ganache */}
          <linearGradient id={`${uid}-ganache`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#260b0f" />
            <stop offset="32%" stopColor="#4a1820" />
            <stop offset="55%" stopColor="#61222b" />
            <stop offset="82%" stopColor="#320e13" />
            <stop offset="100%" stopColor="#1b0609" />
          </linearGradient>

          <radialGradient id={`${uid}-ganache-top`} cx="48%" cy="44%" r="56%">
            <stop offset="0%" stopColor="#5e212a" />
            <stop offset="55%" stopColor="#3c1118" />
            <stop offset="100%" stopColor="#1d070a" />
          </radialGradient>

          {/* Piped buttercream pearl shading */}
          <radialGradient id={`${uid}-pearl-ivory`} cx="36%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#fffcf7" />
            <stop offset="55%" stopColor="#eedccf" />
            <stop offset="100%" stopColor="#9f8172" />
          </radialGradient>

          <radialGradient id={`${uid}-pearl-rose`} cx="36%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#ffeaf0" />
            <stop offset="52%" stopColor="#e887a5" />
            <stop offset="100%" stopColor="#7a203e" />
          </radialGradient>

          {/* Fondant plaque & brushed gold */}
          <linearGradient id={`${uid}-plaque-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b8883b" />
            <stop offset="35%" stopColor="#ffe6a1" />
            <stop offset="65%" stopColor="#d49f47" />
            <stop offset="100%" stopColor="#855a1c" />
          </linearGradient>

          <linearGradient id={`${uid}-plaque-face`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2a0c15" />
            <stop offset="48%" stopColor="#4a1726" />
            <stop offset="100%" stopColor="#240911" />
          </linearGradient>

          {/* Berry gradients */}
          <radialGradient id={`${uid}-berry`} cx="35%" cy="30%" r="72%">
            <stop offset="0%" stopColor="#ff4a5f" />
            <stop offset="42%" stopColor="#d41432" />
            <stop offset="82%" stopColor="#85071b" />
            <stop offset="100%" stopColor="#4b030e" />
          </radialGradient>

          <radialGradient id={`${uid}-blueberry`} cx="34%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#7c96d6" />
            <stop offset="45%" stopColor="#3b4d8c" />
            <stop offset="85%" stopColor="#1c254d" />
            <stop offset="100%" stopColor="#0f1430" />
          </radialGradient>

          {/* Candlelight warm glow wash over frosting */}
          <radialGradient id={`${uid}-candle-wash`} cx="50%" cy="22%" r="58%">
            <stop offset="0%" stopColor={`rgba(255, 198, 108, ${0.42 * lightRatio})`} />
            <stop offset="55%" stopColor={`rgba(255, 150, 66, ${0.18 * lightRatio})`} />
            <stop offset="100%" stopColor="rgba(255, 120, 40, 0)" />
          </radialGradient>

          {/* Clip paths for cylinder textures */}
          <clipPath id={`${uid}-bottom-clip`}>
            <path d="M 63 207 L 63 300 A 147 27 0 0 0 357 300 L 357 207 Z" />
          </clipPath>
          <clipPath id={`${uid}-top-clip`}>
            <path d="M 116 114 L 116 196 A 94 18 0 0 0 304 196 L 304 114 Z" />
          </clipPath>
        </defs>

        {/* ================= 1. TABLE SHADOW & PORCELAIN PEDESTAL STAND ================= */}
        <ellipse
          cx="210"
          cy="364"
          rx="145"
          ry="13"
          fill="rgba(0,0,0,0.68)"
          filter={`url(#${uid}-soft-blur)`}
        />

        {/* Pedestal Foot */}
        <ellipse cx="210" cy="356" rx="74" ry="12" fill="#463734" />
        <ellipse cx="210" cy="353" rx="74" ry="11.5" fill={`url(#${uid}-stand-rim)`} />
        <ellipse cx="210" cy="350" rx="54" ry="8" fill="#cbb7ae" opacity="0.6" />

        {/* Turned Pedestal Stem */}
        <path
          d="M 186 318 C 188 331, 189 341, 165 350 C 185 356, 235 356, 255 350 C 231 341, 232 331, 234 318 Z"
          fill={`url(#${uid}-stand-stem)`}
        />
        {/* Stem shadow under plate */}
        <ellipse cx="210" cy="322" rx="34" ry="6.5" fill="rgba(22,12,10,0.52)" />

        {/* Platter Underside & Rim */}
        <ellipse cx="210" cy="313" rx="170" ry="28" fill="#52403c" />
        <path
          d="M 40 306 L 40 313 A 170 28 0 0 0 380 313 L 380 306 Z"
          fill={`url(#${uid}-stand-rim)`}
        />
        {/* Porcelain Top Plate */}
        <ellipse cx="210" cy="306" rx="170" ry="27" fill={`url(#${uid}-plate-top)`} />
        {/* Inner plate rim ring & subtle gold trim */}
        <ellipse
          cx="210"
          cy="306"
          rx="164"
          ry="24.5"
          fill="none"
          stroke="rgba(218, 178, 102, 0.48)"
          strokeWidth="1"
        />
        {/* Contact shadow cast by bottom cake tier onto porcelain plate */}
        <ellipse
          cx="210"
          cy="305"
          rx="153"
          ry="25"
          fill="rgba(26, 6, 12, 0.56)"
          filter={`url(#${uid}-drip-shadow)`}
        />

        {/* ================= 2. BOTTOM CAKE TIER ================= */}
        {/* Cylinder body */}
        <path
          d="M 63 207 L 63 300 A 147 27 0 0 0 357 300 L 357 207 Z"
          fill={`url(#${uid}-bottom-body)`}
          filter={`url(#${uid}-buttercream-tex)`}
        />

        {/* Horizontal buttercream palette-knife texture ridges */}
        <g clipPath={`url(#${uid}-bottom-clip)`} opacity="0.22">
          {[228, 244, 260, 276, 290].map((yPos, idx) => (
            <path
              key={idx}
              d={`M 60 ${yPos} A 147 27 0 0 0 360 ${yPos}`}
              fill="none"
              stroke={idx % 2 === 0 ? '#ffdce7' : '#3a0a1a'}
              strokeWidth="1.2"
            />
          ))}
          {/* Warm candlelight wash across lower tier */}
          <rect x="60" y="205" width="300" height="125" fill={`url(#${uid}-candle-wash)`} />
        </g>

        {/* Bottom tier piped buttercream shell border */}
        <g>
          {bottomPearls.map((p, idx) => (
            <g key={idx}>
              <ellipse cx={p.x} cy={p.y + 2.5} rx={p.r * 0.95} ry={p.r * 0.45} fill="rgba(25,4,10,0.45)" />
              <circle cx={p.x} cy={p.y} r={p.r} fill={`url(#${uid}-pearl-rose)`} />
              <circle cx={p.x - p.r * 0.28} cy={p.y - p.r * 0.28} r={p.r * 0.24} fill="rgba(255,245,248,0.55)" />
            </g>
          ))}
        </g>

        {/* Curved Brushed-Gold & Dark Chocolate Plaque: Happy 21st Doha */}
        <g transform="translate(210, 281)">
          {/* Plaque shadow */}
          <path
            d="M -58 -11 Q 0 -3 58 -11 L 56 14 Q 0 22 -56 14 Z"
            transform="translate(0, 2.5)"
            fill="rgba(18, 2, 8, 0.55)"
            filter={`url(#${uid}-drip-shadow)`}
          />
          {/* Gold bevel border */}
          <path
            d="M -58 -12 Q 0 -4 58 -12 L 56 13 Q 0 21 -56 13 Z"
            fill={`url(#${uid}-plaque-gold)`}
          />
          {/* Inner velvet chocolate plaque face */}
          <path
            d="M -55.5 -9.8 Q 0 -2 55.5 -9.8 L 53.6 10.8 Q 0 18.6 -53.6 10.8 Z"
            fill={`url(#${uid}-plaque-face)`}
          />
          <text
            x="0"
            y="5.6"
            textAnchor="middle"
            fill="#fce39d"
            fontSize="10.8"
            fontWeight="700"
            letterSpacing="1.4"
            fontFamily="Instrument Serif, Georgia, serif"
            fontStyle="italic"
          >
            {plaqueText}
          </text>
        </g>

        {/* Bottom tier top surface (glossy chocolate ganache pool) */}
        <ellipse cx="210" cy="207" rx="147" ry="27" fill={`url(#${uid}-ganache-top)`} />
        {/* Warm candlelight reflection on lower ganache shelf */}
        <ellipse
          cx="210"
          cy="208"
          rx="140"
          ry="24"
          fill={`url(#${uid}-candle-wash)`}
          opacity="0.7"
        />

        {/* Bottom tier ganache drips */}
        <path
          d={bottomDrips}
          transform="translate(0, 2.6)"
          fill="rgba(15, 2, 6, 0.45)"
          filter={`url(#${uid}-drip-shadow)`}
        />
        <path d={bottomDrips} fill={`url(#${uid}-ganache)`} />
        {/* Glossy wet specular highlights on bottom ganache drips */}
        <g opacity={0.42 + lightRatio * 0.34}>
          {bottomDripHighlights.map((hl, i) => (
            <path
              key={i}
              d={`M ${hl.x} ${hl.y} Q ${hl.x + 1.5} ${hl.y + hl.h * 0.55} ${hl.x} ${hl.y + hl.h}`}
              fill="none"
              stroke="rgba(255, 232, 224, 0.72)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* Soft contact shadow beneath top tier on lower ganache */}
        <ellipse
          cx="210"
          cy="198"
          rx="100"
          ry="20"
          fill="rgba(10, 2, 4, 0.62)"
          filter={`url(#${uid}-drip-shadow)`}
        />

        {/* ================= 3. TOP CAKE TIER ================= */}
        {/* Cylinder body */}
        <path
          d="M 116 114 L 116 196 A 94 18 0 0 0 304 196 L 304 114 Z"
          fill={`url(#${uid}-top-body)`}
          filter={`url(#${uid}-buttercream-tex)`}
        />

        {/* Buttercream spatula texture & candlelight bounce on top tier */}
        <g clipPath={`url(#${uid}-top-clip)`}>
          {[136, 152, 168, 184].map((yPos, idx) => (
            <path
              key={idx}
              d={`M 114 ${yPos} A 94 18 0 0 0 306 ${yPos}`}
              fill="none"
              stroke={idx % 2 === 0 ? 'rgba(255,255,255,0.28)' : 'rgba(110,75,60,0.16)'}
              strokeWidth="1.1"
            />
          ))}
          {/* Subtle vanilla bean flecks */}
          {[
            [138, 146], [156, 168], [178, 154], [198, 178], [218, 148],
            [240, 170], [262, 158], [280, 175], [166, 186], [232, 188],
          ].map(([vx, vy], i) => (
            <circle key={i} cx={vx} cy={vy} r="0.7" fill="#4f3528" opacity="0.45" />
          ))}
          <rect x="114" y="112" width="192" height="98" fill={`url(#${uid}-candle-wash)`} />
        </g>

        {/* Top tier piped ivory buttercream pearl border */}
        <g>
          {topPearls.map((p, idx) => (
            <g key={idx}>
              <ellipse cx={p.x} cy={p.y + 2.2} rx={p.r * 0.9} ry={p.r * 0.42} fill="rgba(16,4,6,0.48)" />
              <circle cx={p.x} cy={p.y} r={p.r * 0.86} fill={`url(#${uid}-pearl-ivory)`} />
              <circle
                cx={p.x - p.r * 0.24}
                cy={p.y - p.r * 0.24}
                r={p.r * 0.2}
                fill="rgba(255,255,255,0.75)"
              />
            </g>
          ))}
        </g>

        {/* Top tier upper frosting surface */}
        <ellipse cx="210" cy="114" rx="94" ry="18" fill={`url(#${uid}-top-frosting)`} />
        {/* Delicate concentric buttercream swirl on top */}
        <ellipse
          cx="210"
          cy="114"
          rx="74"
          ry="13.5"
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="1"
        />
        <ellipse
          cx="210"
          cy="114"
          rx="48"
          ry="8.5"
          fill="none"
          stroke="rgba(220,190,175,0.45)"
          strokeWidth="1"
        />
        {/* Warm candlelight glow on top icing */}
        <ellipse cx="210" cy="114" rx="90" ry="16" fill={`url(#${uid}-candle-wash)`} />

        {/* Top tier ganache drips */}
        <path
          d={topDrips}
          transform="translate(0, 2.2)"
          fill="rgba(35, 10, 14, 0.32)"
          filter={`url(#${uid}-drip-shadow)`}
        />
        <path d={topDrips} fill={`url(#${uid}-ganache)`} />
        <g opacity={0.44 + lightRatio * 0.38}>
          {topDripHighlights.map((hl, i) => (
            <path
              key={i}
              d={`M ${hl.x} ${hl.y} Q ${hl.x + 1.2} ${hl.y + hl.h * 0.55} ${hl.x} ${hl.y + hl.h}`}
              fill="none"
              stroke="rgba(255, 238, 228, 0.78)"
              strokeWidth="1.35"
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* Top rim specular catchlight */}
        <path
          d="M 122 118 A 88 15 0 0 0 298 118"
          fill="none"
          stroke={`rgba(255, 240, 220, ${0.25 + lightRatio * 0.35})`}
          strokeWidth="1.2"
        />

        {/* ================= 4. PATISSERIE BERRIES & GOLD LEAF GARNISH ================= */}
        {/* Left shoulder garnish on bottom tier */}
        <Strawberry x={92} y={193} scale={0.95} rotate={-22} uid={uid} />
        <Raspberry x={108} y={197} scale={0.9} />
        <Blueberry x={77} y={200} r={4.4} uid={uid} />
        <GoldLeafFlake x={102} y={204} rotate={18} scale={0.95} />

        {/* Right shoulder garnish on bottom tier */}
        <Strawberry x={327} y={193} scale={0.95} rotate={20} uid={uid} />
        <Raspberry x={311} y={197} scale={0.9} />
        <Blueberry x={343} y={200} r={4.4} uid={uid} />
        <GoldLeafFlake x={318} y={205} rotate={-25} scale={0.95} />

        {/* Center-top delicate berry & gold leaf accent between candle arcs */}
        <Raspberry x={198} y={111} scale={0.78} />
        <Blueberry x={210} y={113} r={3.8} uid={uid} />
        <Raspberry x={221} y={111} scale={0.76} />
        <GoldLeafFlake x={182} y={113} rotate={12} scale={0.75} />
        <GoldLeafFlake x={238} y={113} rotate={-16} scale={0.75} />

        {/* ================= 5. 21 REALISTIC WAX CANDLES (BACK-TO-FRONT) ================= */}
        {candles.map((c) => {
          const isLit = candlesLit[c.index];
          const w = 6.8 * c.scale;
          const h = c.height * c.scale;
          const topY = c.y - h;

          const waxColors =
            c.variant === 'blush'
              ? { dark: '#b55674', mid: '#f6b2c6', light: '#fff2f6', stripe: '#d97191' }
              : c.variant === 'champagne'
                ? { dark: '#b38b4d', mid: '#f2d388', light: '#fff9e6', stripe: '#d1a458' }
                : { dark: '#baa79b', mid: '#f3e7dc', light: '#ffffff', stripe: '#e0c7b4' };

          return (
            <g key={c.index}>
              {/* Buttercream/melted-wax collar anchoring candle into icing */}
              <ellipse
                cx={c.x}
                cy={c.y + 0.8}
                rx={w * 0.88}
                ry={2.4 * c.scale}
                fill="rgba(255,244,235,0.9)"
              />
              <ellipse
                cx={c.x}
                cy={c.y + 1.6}
                rx={w * 0.96}
                ry={2.1 * c.scale}
                fill="rgba(60, 20, 24, 0.28)"
              />

              {/* Candle wax cylinder */}
              <rect
                x={c.x - w / 2}
                y={topY}
                width={w}
                height={h}
                rx={w * 0.25}
                fill={waxColors.mid}
              />
              {/* 3D cylindrical left-shadow / right-highlight shading */}
              <rect
                x={c.x - w / 2}
                y={topY}
                width={w * 0.34}
                height={h}
                rx={w * 0.15}
                fill={waxColors.dark}
                opacity="0.48"
              />
              <rect
                x={c.x - w * 0.12}
                y={topY + 1}
                width={w * 0.28}
                height={h - 2}
                rx={1}
                fill={waxColors.light}
                opacity="0.65"
              />

              {/* Subtle spiral stripe detail */}
              {[0.25, 0.55, 0.82].map((f, si) => (
                <path
                  key={si}
                  d={`M ${c.x - w / 2} ${topY + h * f} L ${c.x + w / 2} ${topY + h * (f - 0.1)}`}
                  stroke={waxColors.stripe}
                  strokeWidth="1.2"
                  opacity="0.6"
                />
              ))}

              {/* Subsurface warm glow near top of wax when candle is lit */}
              {isLit && (
                <rect
                  x={c.x - w / 2}
                  y={topY}
                  width={w}
                  height={h * 0.38}
                  rx={w * 0.25}
                  fill="#ffae42"
                  opacity={0.42}
                />
              )}

              {/* Melted wax rim & tiny drip on front */}
              <ellipse cx={c.x} cy={topY + 0.6} rx={w * 0.52} ry={1.5 * c.scale} fill={waxColors.light} />
              <path
                d={`M ${c.x + w * 0.15} ${topY + 1} Q ${c.x + w * 0.25} ${topY + 6} ${c.x + w * 0.12} ${topY + 7}`}
                fill="none"
                stroke={waxColors.light}
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.85"
              />

              {/* Charred wick */}
              <line
                x1={c.x}
                y1={topY + 0.5}
                x2={c.x}
                y2={topY - 4.2 * c.scale}
                stroke="#220e09"
                strokeWidth={1.3 * c.scale}
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </svg>

      {/* ================= 6. INTERACTIVE FLAMES, SMOKE & TAP TARGETS ================= */}
      {candles.map((c) => {
        const isLit = candlesLit[c.index];
        const w = 6.8 * c.scale;
        const h = c.height * c.scale;
        const wickTopY = c.y - h - 4.0 * c.scale;

        const leftPct = (c.x / VIEW_W) * 100;
        const topPct = (wickTopY / VIEW_H) * 100;
        const bodyBottomPct = ((c.y + 3) / VIEW_H) * 100;
        const hitHeightPct = bodyBottomPct - topPct;
        const fs = c.scale * uiScale;
        const delay = (c.index % 7) * 0.16;

        const flameNode = (
          <div
            className="pointer-events-none absolute left-1/2 top-0"
            style={{ transform: 'translate(-50%, -88%)' }}
          >
            {isLit ? (
              <div
                className="relative flex items-end justify-center"
                style={{
                  width: 14 * fs,
                  height: 24 * fs,
                  transformOrigin: '50% 96%',
                  transform: `skewX(${flameSkew.toFixed(1)}deg) scale(${flameScaleX.toFixed(2)}, ${flameScaleY.toFixed(2)})`,
                  transition: 'transform 90ms ease-out',
                }}
              >
                {/* Soft wide atmospheric halo */}
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: 44 * fs,
                    height: 44 * fs,
                    left: '50%',
                    top: '48%',
                    transform: 'translate(-50%, -50%)',
                    background:
                      'radial-gradient(circle, rgba(255,190,85,0.44) 0%, rgba(255,130,30,0.13) 48%, transparent 74%)',
                  }}
                />

                {/* Animated inner flame body */}
                <div
                  className={effectiveBlow > 0.14 ? 'flame-wind' : 'flame-dance'}
                  style={{
                    animationDelay: `${delay}s`,
                    position: 'relative',
                    width: 11 * fs,
                    height: 22 * fs,
                    borderRadius: '50% 50% 50% 50% / 68% 68% 32% 32%',
                    background:
                      'radial-gradient(ellipse at 50% 78%, #ffffff 0%, #fff7cc 22%, #ffd060 46%, #ff8c1a 74%, rgba(255,70,0,0) 94%)',
                    filter: 'drop-shadow(0 0 6px rgba(255,180,60,0.95))',
                  }}
                >
                  {/* White-hot teardrop heart */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{
                      bottom: '18%',
                      width: 5.2 * fs,
                      height: 11 * fs,
                      borderRadius: '50% 50% 50% 50% / 65% 65% 35% 35%',
                      background:
                        'radial-gradient(ellipse at 50% 75%, #ffffff 0%, #fff6c2 65%, rgba(255,215,100,0) 100%)',
                    }}
                  />
                  {/* Authentic blue combustion zone at wick base */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 rounded-full"
                    style={{
                      bottom: '4%',
                      width: 4.5 * fs,
                      height: 5.5 * fs,
                      background:
                        'radial-gradient(ellipse, rgba(105,155,255,0.9) 0%, rgba(65,115,255,0) 85%)',
                    }}
                  />
                </div>
              </div>
            ) : (
              /* Glowing post-blow wick ember + curling smoke wisp */
              <div
                className="relative"
                style={{ width: 14 * fs, height: 24 * fs, transform: 'translateY(45%)' }}
              >
                <div
                  className="wick-ember absolute left-1/2 bottom-0 -translate-x-1/2 rounded-full bg-[#ff7b29]"
                  style={{
                    width: 5 * fs,
                    height: 5 * fs,
                    boxShadow: '0 0 6px 2px rgba(255, 110, 30, 0.85)',
                  }}
                />
                {/* Silky rising smoke tendril */}
                <svg
                  viewBox="0 0 24 56"
                  className="smoke-wisp absolute left-1/2 bottom-0 -translate-x-1/2 overflow-visible"
                  style={{ width: 20 * fs, height: 48 * fs }}
                >
                  <path
                    d="M 12 54 C 7 44, 17 34, 11 23 C 6 14, 15 6, 10 0"
                    fill="none"
                    stroke="rgba(240, 245, 255, 0.62)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    style={{ filter: 'blur(1.2px)' }}
                  />
                </svg>
                <div
                  className="smoke-puff absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-white/45 blur-[2.5px]"
                  style={{ width: 12 * fs, height: 16 * fs }}
                />
              </div>
            )}
          </div>
        );

        const sharedStyle = {
          left: `${leftPct}%`,
          top: `${topPct}%`,
          width: `${Math.max(5.2, (w / VIEW_W) * 100 * 2.8)}%`,
          height: `${hitHeightPct}%`,
        };

        if (!interactive) {
          return (
            <div
              key={c.index}
              style={sharedStyle}
              className="pointer-events-none absolute -translate-x-1/2 overflow-visible"
            >
              {flameNode}
            </div>
          );
        }

        return (
          <button
            key={c.index}
            type="button"
            onClick={() => onExtinguishCandle?.(c.index)}
            onMouseEnter={() => {
              if (isBlowing) onExtinguishCandle?.(c.index);
            }}
            aria-label={`Candle ${c.index + 1}${isLit ? ' (lit — tap to blow out)' : ' (blown out)'}`}
            style={sharedStyle}
            className="absolute -translate-x-1/2 overflow-visible cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd166]/80 rounded-full"
          >
            {/* Expanded hit target reaching up over the flame */}
            <span aria-hidden="true" className="absolute -inset-x-1 -top-7 -bottom-1" />
            {flameNode}
          </button>
        );
      })}
    </div>
  );
};
