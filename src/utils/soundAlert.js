/**
 * Synthesizes a pleasant crystal cafe service bell chime using the browser's Web Audio API
 */
export function playCafeOrderChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Harmonic frequencies for a rich brass/silver service bell
    const frequencies = [880, 1760, 2640, 3520];
    const gains = [0.4, 0.25, 0.15, 0.08];

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Bell strike envelope (instant attack, exponential gentle decay)
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(gains[i], now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.6 + i * 0.2);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 2.0);
    });
  } catch (err) {
    console.warn('Audio chime playback error:', err);
  }
}
