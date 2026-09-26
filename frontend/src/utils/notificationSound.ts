/**
 * Mild Notification Sound Generator for ERP Notifications
 * Uses HTML5 Web Audio API for zero-latency, pleasant, non-intrusive mobile-like chimes.
 */

class SoundPlayer {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Plays a soft, mild two-tone chime (mobile notification style).
   * Volume is calibrated to be subtle and non-intrusive.
   */
  public playMildAlert(isCritical = false) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      // Mild gain: 0.05 - 0.08 is gentle and pleasant
      masterGain.gain.setValueAtTime(0.06, now);
      masterGain.connect(ctx.destination);

      if (isCritical) {
        // Soft urgent two-tone chime (659Hz E5 -> 880Hz A5)
        this.createTone(ctx, masterGain, 659.25, now, 0.12);
        this.createTone(ctx, masterGain, 880.0, now + 0.1, 0.22);
      } else {
        // Gentle friendly notification chime (587.33Hz D5 -> 783.99Hz G5)
        this.createTone(ctx, masterGain, 587.33, now, 0.14);
        this.createTone(ctx, masterGain, 783.99, now + 0.12, 0.26);
      }
    } catch (e) {
      console.warn('Audio chime playback omitted or blocked by browser policy:', e);
    }
  }

  private createTone(
    ctx: AudioContext,
    destination: GainNode,
    freq: number,
    startTime: number,
    duration: number,
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine'; // Sine wave produces the softest, purest tone
    osc.frequency.setValueAtTime(freq, startTime);

    // Smooth ADSR envelope to prevent clicks or harsh transients
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.7, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }
}

export const notificationSound = new SoundPlayer();
