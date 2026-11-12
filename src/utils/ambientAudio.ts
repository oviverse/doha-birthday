import backgroundMusicUrl from '../../asset/music/background.mp3';

// Background MP3 music manager + lightweight Web Audio API UI chime generator

class AmbientAudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgAudio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private tempPaused = false;
  private unlockBound = false;
  private visibilityBound = false;

  private ensureContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.16;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private ensureBgAudio() {
    if (!this.bgAudio) {
      const audio = new Audio(backgroundMusicUrl);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0.4;
      audio.muted = false;
      audio.addEventListener('pause', () => {
        if (this.isPlaying && !this.tempPaused) {
          this.bindUnlockListeners();
        }
      });
      this.bgAudio = audio;
    }
    return this.bgAudio;
  }

  private readonly handleUserUnlock = () => {
    if (!this.isPlaying) return;
    this.tryPlayBgAudio();
  };

  private readonly handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && this.isPlaying && !this.tempPaused) {
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
    audio.muted = false;
    if (!this.isPlaying || this.tempPaused) return;

    if (!audio.paused) {
      this.unbindUnlockListeners();
      return;
    }

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.unbindUnlockListeners();
        })
        .catch(() => {
          // Browser blocked autoplay before user interaction; retry on first gesture
          this.bindUnlockListeners();
        });
    }
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
      this.bgAudio.pause();
    } else if (this.isPlaying) {
      this.tryPlayBgAudio();
    }
  }

  public playSparkleChime() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const notes = [659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.07;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 0.6);
    });
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

    // Two-curtain mechanical shutter click
    playClick(0, 2600, 0.045, 0.7);
    playClick(0.06, 1900, 0.055, 0.5);
  }

  public stopAmbient() {
    this.isPlaying = false;
    this.tempPaused = false;
    this.unbindUnlockListeners();
    this.unbindVisibilityListener();
    if (this.bgAudio) {
      this.bgAudio.pause();
      this.bgAudio.currentTime = 0;
    }
  }
}

export const ambientAudio = new AmbientAudioManager();
