import confetti from 'canvas-confetti';

const ROMANTIC_COLORS = ['#fadadd', '#ff6b9d', '#ff4f8b', '#ffd166', '#c77dff', '#ffffff'];

export function fireCelebrationConfetti() {
  confetti({
    particleCount: 90,
    spread: 80,
    origin: { y: 0.65 },
    colors: ROMANTIC_COLORS,
    scalar: 1.05,
  });
}

export function fireJackpotConfetti() {
  const end = Date.now() + 2400;

  const frame = () => {
    confetti({ particleCount: 6, angle: 60, spread: 62, origin: { x: 0, y: 0.7 }, colors: ROMANTIC_COLORS });
    confetti({ particleCount: 6, angle: 120, spread: 62, origin: { x: 1, y: 0.7 }, colors: ROMANTIC_COLORS });
    if (Date.now() < end) requestAnimationFrame(frame);
  };

  frame();
}

export function fireSparkleBurst() {
  confetti({
    particleCount: 40,
    spread: 60,
    startVelocity: 26,
    origin: { y: 0.55 },
    colors: ['#ffd166', '#fadadd', '#ff85a1', '#ffffff'],
  });
}

/** Repeated firework-style bursts. Returns a cleanup function. */
export function fireFireworks(duration = 6000) {
  const end = Date.now() + duration;
  const interval = window.setInterval(() => {
    if (Date.now() > end) {
      clearInterval(interval);
      return;
    }
    confetti({
      particleCount: 55,
      startVelocity: 30,
      spread: 360,
      ticks: 70,
      gravity: 0.9,
      scalar: 0.9,
      origin: { x: Math.random() * 0.6 + 0.2, y: Math.random() * 0.3 + 0.1 },
      colors: ROMANTIC_COLORS,
    });
  }, 700);
  return () => clearInterval(interval);
}
