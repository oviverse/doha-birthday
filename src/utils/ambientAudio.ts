import backgroundMusicUrl from '../../asset/music/background.mp3';

// Background MP3 music manager + rich Web Audio API UI soundscape

type MuteListener = (muted: boolean) => void;

const PENTATONIC_FREQS = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];

class AmbientAudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgAudio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private tempPaused = false;
  private muted = false;
  private unlockBound = false;
  private visibilityBound = false;
  private lastScratchMs = 0;
  private lastTapMs = 0;
  private fadeRaf: number | null = null;
  private listeners = new Set<MuteListener>();

  private ensureContext() {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.18;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private ensureBgAudio() {
    if (!this.bgAudio) {
      const audio = new Audio(backgroundMusicUrl);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0.36;
      audio.muted = this.muted;
      audio.addEventListener('pause', () => {
        if (this.isPlaying && !this.tempPaused && !this.muted) {
          this.bindUnlockListeners();
        }
      });
      this.bgAudio = audio;
    }
    return this.bgAudio;
  }

  private fadeBgVolume(targetVolume: number, durationMs = 450, onDone?: () => void) {
    const audio = this.bgAudio;
    if (!audio) {
      onDone?.();
      return;
    }
    if (this.fadeRaf !== null) {
      cancelAnimationFrame(this.fadeRaf);
      this.fadeRaf = null;
    }

    const startVol = audio.volume;
    const startTime = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / Math.max(1, durationMs));
      const eased = 1 - Math.pow(1 - t, 2);
      audio.volume = Math.max(0, Math.min(1, startVol + (targetVolume - startVol) * eased));
      if (t < 1) {
        this.fadeRaf = requestAnimationFrame(step);
      } else {
        this.fadeRaf = null;
        onDone?.();
      }
    };
    this.fadeRaf = requestAnimationFrame(step);
  }

  private readonly handleUserUnlock = () => {
    if (this.ctx && this.ctx.state === 'suspended' && !this.muted) {
      void this.ctx.resume().catch(() => {});
    }
    if (!this.isPlaying) return;
    this.tryPlayBgAudio();
  };

  private readonly handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && this.isPlaying && !this.tempPaused && !this.muted) {
      this.tryPlayBgAudio();
    }
  };

  private bindUnlockListeners() {
    if (this.unlockBound) return;
    this.unlockBound = true;
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'touchstart', 'click'];
    events.forEach((evt) =>
      window.addEventListener(evt, this.handleUserUnlock, { passive: true, capture: true })
    );
  }

  private unbindUnlockListeners() {
    if (!this.unlockBound) return;
    this.unlockBound = false;
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'touchstart', 'click'];
    events.forEach((evt) =>
      window.removeEventListener(evt, this.handleUserUnlock, { capture: true })
    );
  }

  private bindVisibilityListener() {
    if (this.visibilityBound) return;
    this.visibilityBound = true;
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private unbindVisibilityListener() {
    if (!this.visibilityBound) return;
    this.visibilityBound = false;
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private tryPlayBgAudio() {
    const audio = this.ensureBgAudio();
    audio.muted = this.muted;
    if (!this.isPlaying || this.tempPaused || this.muted) return;

    if (!audio.paused) {
      this.unbindUnlockListeners();
      return;
    }

    audio.volume = 0.02;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.unbindUnlockListeners();
          this.fadeBgVolume(0.36, 700);
        })
        .catch(() => {
          this.bindUnlockListeners();
        });
    }
  }

  public subscribeMute(listener: MuteListener): () => void {
    this.listeners.add(listener);
    listener(this.muted);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getIsMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.bgAudio) {
      this.bgAudio.muted = this.muted;
      if (this.muted) {
        this.bgAudio.pause();
      } else if (this.isPlaying && !this.tempPaused) {
        this.tryPlayBgAudio();
      }
    }
    if (!this.muted) {
      this.ensureContext();
    }
    this.listeners.forEach((l) => l(this.muted));
    return this.muted;
  }

  public startAmbient() {
    this.isPlaying = true;
    this.bindVisibilityListener();
    this.tryPlayBgAudio();
  }

  public setTempPaused(paused: boolean) {
    this.tempPaused = paused;
    if (!this.bgAudio) return;
    if (paused) {
      this.fadeBgVolume(0, 320, () => {
        if (this.tempPaused) {
          this.bgAudio?.pause();
        }
      });
    } else if (this.isPlaying && !this.muted) {
      this.tryPlayBgAudio();
    }
  }

  public playSoftTap(pitchShift = 1) {
    const nowMs = performance.now();
    if (nowMs - this.lastTapMs < 45) return;
    this.lastTapMs = nowMs;

    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880 * pitchShift, now);
    osc.frequency.exponentialRampToValueAtTime(1180 * pitchShift, now + 0.06);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playSparkleChime() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const notes = [659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.065;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(0.14, now + 0.018);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 0.6);
    });
  }

  public playWaxSealBreak() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const sampleCount = Math.floor(ctx.sampleRate * 0.08);
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      const env = Math.pow(1 - i / sampleCount, 3);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, ctx.currentTime);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.35, ctx.currentTime);
    noise.connect(filter);
    filter.connect(ng);
    ng.connect(this.masterGain);
    noise.start();

    [523.25, 659.25, 783.99, 987.77].forEach((freq, idx) => {
      const t = ctx.currentTime + 0.04 + idx * 0.055;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.025);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.8);
    });
  }

  public playPaperRustle() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const sampleCount = Math.floor(ctx.sampleRate * 0.14);
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      const p = i / sampleCount;
      const env = Math.sin(p * Math.PI) * 0.7;
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, ctx.currentTime);
    filter.Q.setValueAtTime(0.9, ctx.currentTime);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    noise.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    noise.start();
  }

  public playWheelTick(speedRatio = 0.5) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    const baseFreq = 620 + speedRatio * 420;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.032);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.14, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  public playJackpotFanfare() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const arpeggio = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98, 2093.0];
    arpeggio.forEach((freq, idx) => {
      const t = ctx.currentTime + idx * 0.065;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.95);
    });
  }

  public playScratchSound() {
    const nowMs = performance.now();
    if (nowMs - this.lastScratchMs < 55) return;
    this.lastScratchMs = nowMs;

    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const sampleCount = Math.floor(ctx.sampleRate * 0.045);
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      const env = Math.sin((i / sampleCount) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3600 + Math.random() * 900, ctx.currentTime);
    filter.Q.setValueAtTime(2.0, ctx.currentTime);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.09, ctx.currentTime);
    noise.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    noise.start();
  }

  public playCandlePuff() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const sampleCount = Math.floor(ctx.sampleRate * 0.16);
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      const env = Math.pow(1 - i / sampleCount, 1.8);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.15);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.24, ctx.currentTime);
    noise.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    noise.start();
  }

  public playWishGranted() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const chord = [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98];
    chord.forEach((freq, idx) => {
      const t = ctx.currentTime + idx * 0.08;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.14, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.45);
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 1.5);
    });
  }

  public playLanternChime(step = 0) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const freq = PENTATONIC_FREQS[Math.abs(step) % PENTATONIC_FREQS.length];
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.95);
  }

  public playCameraCountdownBeep(isFinal = false) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isFinal ? 1174.66 : 783.99, now);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(isFinal ? 0.22 : 0.14, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + (isFinal ? 0.24 : 0.14));
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playCameraShutter() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const playClick = (offset: number, freq: number, duration: number, level: number) => {
      const sampleCount = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < sampleCount; i++) {
        const env = Math.pow(1 - i / sampleCount, 2.5);
        data[i] = (Math.random() * 2 - 1) * env;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, ctx.currentTime + offset);
      filter.Q.setValueAtTime(1.4, ctx.currentTime + offset);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(level, ctx.currentTime + offset);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      noise.start(ctx.currentTime + offset);
    };

    playClick(0, 2600, 0.045, 0.7);
    playClick(0.06, 1900, 0.055, 0.5);
  }

  public stopAmbient() {
    this.isPlaying = false;
    this.tempPaused = false;
    this.unbindUnlockListeners();
    this.unbindVisibilityListener();
    if (this.fadeRaf !== null) {
      cancelAnimationFrame(this.fadeRaf);
      this.fadeRaf = null;
    }
    if (this.bgAudio) {
      this.bgAudio.pause();
      this.bgAudio.currentTime = 0;
    }
  }
}

export const ambientAudio = new AmbientAudioManager();
