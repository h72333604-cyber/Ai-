/**
 * Audio effects synthesizer & Text-to-Speech engine
 * Uses Web Audio API for 100% offline, zero-latency sound effects.
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Melodic chime for correct answer
  playCorrect() {
    const ctx = this.getContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.4);
    });
  }

  // Gentle low tone for wrong answer
  playIncorrect() {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.38);
  }

  // Google Live wake sound
  playLiveActivate() {
    const ctx = this.getContext();
    if (!ctx) return;
    const frequencies = [440, 554.37, 659.25, 880];
    frequencies.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.06);

      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.06 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.06);
      osc.stop(ctx.currentTime + i * 0.06 + 0.45);
    });
  }

  // Soft click / tap
  playClick() {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.07);
  }

  // Duel fanfare
  playVictory() {
    const ctx = this.getContext();
    if (!ctx) return;
    const chord = [392, 523.25, 659.25, 783.99, 1046.50];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);

      gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.07);
      osc.stop(ctx.currentTime + idx * 0.07 + 0.7);
    });
  }

  playNotificationChime() {
    const ctx = this.getContext();
    if (!ctx) return;
    const notes = [587.33, 880]; // D5, A5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.45);
    });
  }

  playSuccess() {
    this.playCorrect();
  }
}

export const soundEffects = new AudioSynthesizer();

/**
 * Text-to-Speech (TTS) helper for Arabic reading
 */
export function speakArabicText(
  text: string,
  preferredGenderOrOnEnd?: ('male' | 'female') | (() => void),
  onEnd?: () => void,
  onError?: () => void
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (typeof preferredGenderOrOnEnd === 'function') preferredGenderOrOnEnd();
    else if (onEnd) onEnd();
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Strip Markdown symbols for natural reading
  const cleanText = text
    .replace(/[#*`_~[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let actualOnEnd = onEnd;
  let actualOnError = onError;
  let gender: 'male' | 'female' | undefined;

  if (typeof preferredGenderOrOnEnd === 'function') {
    actualOnEnd = preferredGenderOrOnEnd;
  } else if (preferredGenderOrOnEnd === 'male' || preferredGenderOrOnEnd === 'female') {
    gender = preferredGenderOrOnEnd;
  }

  if (!cleanText) {
    if (actualOnEnd) actualOnEnd();
    return;
  }

  // Determine gender from parameter or stored setting
  if (!gender) {
    try {
      const raw = localStorage.getItem('qatrah_theme_settings_v2');
      if (raw) {
        gender = JSON.parse(raw).voiceGender;
      }
    } catch {}
  }
  gender = gender || 'male';

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'ar-SA';
  
  if (gender === 'female') {
    utterance.pitch = 1.25; // feminine higher pitch
    utterance.rate = 1.02;
  } else {
    utterance.pitch = 0.88; // masculine deeper pitch
    utterance.rate = 0.98;
  }

  const voices = window.speechSynthesis.getVoices();
  const arVoices = voices.filter(v => v.lang.startsWith('ar') || v.lang.includes('ar'));

  if (arVoices.length > 0) {
    if (gender === 'female') {
      const femaleVoice = arVoices.find(v => 
        /female|laila|zeina|salma|mariam|hoda|fatima/i.test(v.name)
      );
      utterance.voice = femaleVoice || arVoices[0];
    } else {
      const maleVoice = arVoices.find(v => 
        /male|maged|tarik|naayf|hamed|omar|ahmed/i.test(v.name)
      );
      utterance.voice = maleVoice || arVoices[0];
    }
  }

  utterance.onend = () => {
    if (actualOnEnd) actualOnEnd();
  };

  utterance.onerror = () => {
    if (actualOnError) actualOnError();
    else if (actualOnEnd) actualOnEnd();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopArabicSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
