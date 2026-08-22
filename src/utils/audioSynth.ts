// High quality ambient / classical piano & traditional Persian synthesizer & audio engine
import { MusicTrack } from '../types';

class WeddingAudioPlayer {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private timer: number | null = null;
  private customAudio: HTMLAudioElement | null = null;
  private currentTrack: MusicTrack | null = null;
  private onEndedCallback: (() => void) | null = null;
  private volume: number = 0.8;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playTrack(track: MusicTrack, onEnded?: () => void) {
    this.currentTrack = track;
    this.onEndedCallback = onEnded || null;

    const audioUrl = track.url || track.audioUrl;
    if (audioUrl && audioUrl.trim().length > 0) {
      this.playCustomAudio(audioUrl, onEnded);
    } else {
      const preset = track.synthPreset || 'romantic_piano';
      this.playPreset(preset);
    }
  }

  public playPreset(preset: 'romantic_piano' | 'traditional_oud' | 'gentle_acoustic' | 'celestial_harp' = 'romantic_piano') {
    this.stop();
    this.init();
    this.isPlaying = true;

    // Beautiful relaxing pentatonic & Persian Shur/Esfahan romantic progression chords
    const scales = {
      romantic_piano: [
        [196.00, 246.94, 293.66, 392.00, 493.88], // G3, B3, D4, G4, B4
        [164.81, 220.00, 261.63, 329.63, 440.00], // E3, A3, C4, E4, A4
        [174.61, 220.00, 261.63, 349.23, 440.00], // F3, A3, C4, F4, A4
        [146.83, 220.00, 293.66, 369.99, 440.00], // D3, A3, D4, F#4, A4
        [130.81, 196.00, 261.63, 329.63, 392.00], // C3, G3, C4, E4, G4
      ],
      traditional_oud: [
        [146.83, 220.00, 261.63, 329.63, 440.00],
        [174.61, 220.00, 261.63, 349.23, 440.00],
        [196.00, 246.94, 293.66, 392.00, 493.88],
        [164.81, 220.00, 261.63, 329.63, 440.00],
      ],
      gentle_acoustic: [
        [130.81, 196.00, 261.63, 329.63, 523.25],
        [164.81, 246.94, 329.63, 392.00, 493.88],
        [174.61, 261.63, 349.23, 440.00, 523.25],
        [196.00, 293.66, 392.00, 493.88, 587.33],
      ],
      celestial_harp: [
        [261.63, 329.63, 392.00, 523.25, 659.25],
        [220.00, 261.63, 329.63, 440.00, 523.25],
        [174.61, 220.00, 261.63, 349.23, 440.00],
        [196.00, 246.94, 293.66, 392.00, 493.88],
      ]
    };

    const chordList = scales[preset] || scales.romantic_piano;
    let chordIndex = 0;
    let noteIndex = 0;

    const playNextNote = () => {
      if (!this.isPlaying || !this.ctx) return;

      const currentChord = chordList[chordIndex];
      const freq = currentChord[noteIndex];

      this.playPluck(freq, preset);

      noteIndex++;
      if (noteIndex >= currentChord.length) {
        noteIndex = 0;
        chordIndex = (chordIndex + 1) % chordList.length;
      }

      const delay = noteIndex === 0 ? 850 : 420;
      this.timer = window.setTimeout(playNextNote, delay);
    };

    playNextNote();
  }

  private playPluck(freq: number, preset: string) {
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (preset === 'celestial_harp') {
      osc.type = 'sine';
    } else if (preset === 'traditional_oud') {
      osc.type = 'triangle';
    } else {
      osc.type = 'sine';
    }

    osc.frequency.setValueAtTime(freq, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 1.6);

    const targetGain = 0.08 * this.volume;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(targetGain, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 2.3);
  }

  public playCustomAudio(url: string, onEnded?: () => void) {
    this.stop();
    if (this.customAudio) {
      this.customAudio.pause();
    }
    this.customAudio = new Audio(url);
    this.customAudio.volume = this.volume;
    this.customAudio.loop = !onEnded;

    if (onEnded) {
      this.customAudio.addEventListener('ended', () => {
        onEnded();
      });
    }

    this.customAudio.play().catch(() => {
      // Browser autoplay fallback
    });
    this.isPlaying = true;
  }

  public stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio = null;
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.customAudio) {
      this.customAudio.volume = this.volume;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTrack(): MusicTrack | null {
    return this.currentTrack;
  }
}

export const weddingAudio = new WeddingAudioPlayer();

