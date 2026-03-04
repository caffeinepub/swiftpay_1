/**
 * Triggers a short haptic vibration on supported mobile devices.
 * Pattern: two quick pulses (like PhonePe's success haptic).
 */
export function triggerPaymentVibration(): void {
  try {
    if (navigator.vibrate) {
      // Short double-pulse: vibrate 80ms, pause 40ms, vibrate 120ms
      navigator.vibrate([80, 40, 120]);
    }
  } catch {
    // Silently fail if vibration API is not supported
  }
}

/**
 * Plays a PhonePe-style payment success sound using the Web Audio API.
 * Two ascending chime notes (like the iconic UPI success tone).
 */
export function playPaymentSuccessSound(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();

    // PhonePe-style: two quick ascending notes + a soft sustain
    const notes: Array<{
      freq: number;
      start: number;
      duration: number;
      gain: number;
    }> = [
      { freq: 880, start: 0.0, duration: 0.18, gain: 0.4 }, // A5 — first ding
      { freq: 1318.5, start: 0.16, duration: 0.22, gain: 0.45 }, // E6 — second ding (higher)
      { freq: 1760, start: 0.32, duration: 0.35, gain: 0.35 }, // A6 — final chime sustain
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.start);

      gainNode.gain.setValueAtTime(0, ctx.currentTime + note.start);
      gainNode.gain.linearRampToValueAtTime(
        note.gain,
        ctx.currentTime + note.start + 0.015,
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + note.start + note.duration,
      );

      osc.start(ctx.currentTime + note.start);
      osc.stop(ctx.currentTime + note.start + note.duration);
    }

    // Close context after all notes finish
    setTimeout(() => {
      ctx.close();
    }, 1200);
  } catch {
    // Silently fail if audio is blocked (e.g. browser autoplay policy)
  }
}
