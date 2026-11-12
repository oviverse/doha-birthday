/**
 * Lightweight tactile haptic feedback helper for supported mobile browsers.
 */
export function triggerHaptic(pattern: number | number[] = 10): void {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
    if (ua && !ua.hasBeenActive) return;
    navigator.vibrate(pattern);
  } catch {
    // Ignore on unsupported browsers (e.g., iOS Safari)
  }
}
