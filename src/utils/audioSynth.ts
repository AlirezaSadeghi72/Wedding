// High quality ambient / classical piano & traditional Persian synthesizer & audio engine
import { MusicTrack } from '../types';

class WeddingAudioPlayer {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private timer: number | null = null;
  private customAudio: HTMLAudioElement | null = null;
  private currentTrack: MusicTrack | null = null;
  private currentTrackIndex: number = 0;
  private hasOpenedEnvelopeThisSession: boolean = false;
  private isUserExplicitlyMuted: boolean = false;
  private onEndedCallback: (() => void) | null = null;
  private volume: number = 0.8;

  constructor() {
    // When the browser refreshes or loads freshly, mute flag and envelope state reset to clean defaults
    this.isUserExplicitlyMuted = false;
    this.hasOpenedEnvelopeThisSession = false;
  }

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getHasOpenedEnvelope(): boolean {
    return this.hasOpenedEnvelopeThisSession;
  }

  public markEnvelopeOpened(): void {
    this.hasOpenedEnvelopeThisSession = true;
  }

  public isUserMuted(): boolean {
    return this.isUserExplicitlyMuted;
  }

  public setUserMuted(muted: boolean): void {
    this.isUserExplicitlyMuted = muted;
  }

  public getCurrentTrackIndex(): number {
    return this.currentTrackIndex;
  }

  public setCurrentTrackIndex(idx: number): void {
    this.currentTrackIndex = Math.max(0, idx);
  }

  public playTrack(track: MusicTrack, onEnded?: () => void) {
    this.currentTrack = track;
    this.onEndedCallback = onEnded || null;
    this.setUserMuted(false);

    const audioUrl = track.url || track.audioUrl;
    if (audioUrl && audioUrl.trim().length > 0) {
      this.playCustomAudio(audioUrl, onEnded);
    } else {
      const preset = track.synthPreset || 'romantic_piano';
      this.playPreset(preset);
    }
  }

  public playPreset(preset: 'romantic_piano' | 'traditional_oud' | 'gentle_acoustic' | 'celestial_harp' = 'romantic_piano') {
    this.stop(false);
    this.init();
    this.isPlaying = true;
    this.setUserMuted(false);

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
    this.stop(false);
    if (this.customAudio) {
      this.customAudio.pause();
    }
    // Sanitize any Persian/Arabic digits to valid Latin digits in audio URLs
    const cleanUrl = (url || '')
      .trim()
      .replace(/[۰-۹]/g, (d) => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)])
      .replace(/[٠-٩]/g, (d) => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);

    this.customAudio = new Audio(cleanUrl);
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
    this.setUserMuted(false);
  }

  public stop(userAction: boolean = false) {
    this.isPlaying = false;
    if (userAction) {
      this.setUserMuted(true);
    }
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


