/**
 * Lightweight tactile haptic feedback helper for supported mobile browsers.
 */
export function triggerHaptic(pattern: number | number[] = 10): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore on unsupported browsers (e.g., iOS Safari)
  }
}
