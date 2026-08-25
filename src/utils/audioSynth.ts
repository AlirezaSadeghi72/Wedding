// High quality ambient / classical piano & traditional Persian synthesizer & audio engine
import { MusicTrack, WeddingCardData } from '../types';

export function getEffectivePlaylist(musicConfig?: WeddingCardData['music']): MusicTrack[] {
  if (!musicConfig) return [];

  const customTracks = musicConfig.playlist && musicConfig.playlist.length > 0
    ? musicConfig.playlist
    : musicConfig.tracks && musicConfig.tracks.length > 0
    ? musicConfig.tracks
    : [];

  if (customTracks.length > 0) {
    return customTracks;
  }

  // Default built-in presets fallback using configured main track info
  return [
    {
      id: 'main-track',
      title: musicConfig.title || 'پیانوی رمانتیک و دلنشین',
      artist: musicConfig.artist || 'نوای آرامش‌بخش پیانو',
      synthPreset: musicConfig.synthPreset || 'romantic_piano',
      isPreset: !musicConfig.audioUrl,
      url: musicConfig.audioUrl
    },
    {
      id: 'preset-oud',
      title: 'نوای سنتور و عود سنتی ایرانی',
      artist: 'دستگاه اصفهان و شور اصیل',
      synthPreset: 'traditional_oud',
      isPreset: true
    },
    {
      id: 'preset-harp',
      title: 'چنگ و هارپ آسمانی و رویایی',
      artist: 'نوای ملایم پیوند فرخنده',
      synthPreset: 'celestial_harp',
      isPreset: true
    },
    {
      id: 'preset-guitar',
      title: 'گیتار آکوستیک ملایم و عاشقانه',
      artist: 'ملودی دلنواز و آرام',
      synthPreset: 'gentle_acoustic',
      isPreset: true
    }
  ];
}

type AudioStateListener = (isPlaying: boolean, track: MusicTrack | null) => void;

class WeddingAudioPlayer {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private mediaElementSource: MediaElementAudioSourceNode | null = null;
  private isPlaying: boolean = false;
  private timer: number | null = null;
  private customAudio: HTMLAudioElement | null = null;
  private currentTrack: MusicTrack | null = null;
  private currentTrackIndex: number = 0;
  private hasOpenedEnvelopeThisSession: boolean = false;
  private isUserExplicitlyMuted: boolean = false;
  private onEndedCallback: (() => void) | null = null;
  private volume: number = 0.8;
  private listeners: Set<AudioStateListener> = new Set();

  constructor() {
    // When the browser refreshes or loads freshly, mute flag and envelope state reset to clean defaults
    this.isUserExplicitlyMuted = false;
    this.hasOpenedEnvelopeThisSession = false;
  }

  public subscribe(listener: AudioStateListener): () => void {
    this.listeners.add(listener);
    listener(this.isPlaying, this.currentTrack);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyStateChange() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.isPlaying, this.currentTrack);
      } catch {
        // ignore listener errors
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('wedding-audio-state', {
          detail: {
            isPlaying: this.isPlaying,
            currentTrack: this.currentTrack,
            trackIndex: this.currentTrackIndex,
            volume: this.volume
          }
        })
      );
    }
  }

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && !this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128; // 64 frequency bands for snappy real-time responsiveness
      this.analyser.smoothingTimeConstant = 0.8;
      
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Returns real-time frequency amplitudes (0-100%) synchronized directly with audio playback
   */
  public getSpectrumBars(barCount: number = 28): number[] {
    if (!this.isPlaying) {
      return Array.from({ length: barCount }, () => 0);
    }

    if (this.analyser) {
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(dataArray);

      let totalEnergy = 0;
      for (let i = 0; i < bufferLength; i++) {
        totalEnergy += dataArray[i];
      }

      if (totalEnergy > 5) {
        const bars: number[] = [];
        const step = Math.max(1, bufferLength / barCount);
        for (let i = 0; i < barCount; i++) {
          const start = Math.floor(i * step);
          const end = Math.min(bufferLength, Math.floor((i + 1) * step));
          let sum = 0;
          let count = 0;
          for (let j = start; j < end; j++) {
            sum += dataArray[j];
            count++;
          }
          const avg = count > 0 ? sum / count : 0;
          // Scale amplitude to percentage with natural curve
          const percent = Math.min(100, Math.max(8, Math.round((avg / 255) * 100 * 1.3)));
          bars.push(percent);
        }
        return bars;
      }
    }

    // Fallback if audio is external cross-origin or between subtle synth note decays
    const now = Date.now();
    return Array.from({ length: barCount }, (_, i) => {
      const wave = Math.sin((now / 200) + i * 0.4) * 30 + 40;
      const jitter = (Math.sin((now / 90) * (i + 1)) * 12);
      return Math.max(8, Math.min(100, Math.round(wave + jitter)));
    });
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
    this.notifyStateChange();
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
    this.notifyStateChange();
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
    this.notifyStateChange();
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

    const targetGain = 0.12 * this.volume;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(targetGain, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

    osc.connect(filter);
    filter.connect(gain);
    
    // Connect to masterGain which feeds the AnalyserNode and destination
    if (this.masterGain) {
      gain.connect(this.masterGain);
    } else {
      gain.connect(this.ctx.destination);
    }

    osc.start(now);
    osc.stop(now + 2.3);
  }

  public playCustomAudio(url: string, onEnded?: () => void) {
    this.stop(false);
    this.init();
    
    if (this.customAudio) {
      this.customAudio.pause();
    }
    // Sanitize any Persian/Arabic digits to valid Latin digits in audio URLs
    const cleanUrl = (url || '')
      .trim()
      .replace(/[۰-۹]/g, (d) => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)])
      .replace(/[٠-٩]/g, (d) => '0123456789'['٠١٢٣۴٥٦٧٨٩'.indexOf(d)]);

    this.customAudio = new Audio();
    this.customAudio.crossOrigin = 'anonymous';
    this.customAudio.src = cleanUrl;
    this.customAudio.volume = this.volume;
    this.customAudio.loop = !onEnded;

    if (onEnded) {
      this.customAudio.addEventListener('ended', () => {
        onEnded();
      });
    }

    // Connect custom audio into Web Audio AnalyserNode for real-time visual frequency analysis
    try {
      if (this.ctx && this.masterGain) {
        const source = this.ctx.createMediaElementSource(this.customAudio);
        source.connect(this.masterGain);
        this.mediaElementSource = source;
      }
    } catch {
      // If CORS prevents createMediaElementSource or already connected, plays gracefully directly
    }

    this.customAudio.play().catch(() => {
      // Browser autoplay policy fallback
    });
    this.isPlaying = true;
    this.setUserMuted(false);
    this.notifyStateChange();
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
    this.notifyStateChange();
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.customAudio) {
      this.customAudio.volume = this.volume;
    }
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    this.notifyStateChange();
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


