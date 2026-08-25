import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { weddingAudio } from '../utils/audioSynth';
import { WeddingCardData, EqualizerStyle, EqualizerColor } from '../types';

interface Props {
  data?: WeddingCardData;
  isLight?: boolean;
}

export default function BackgroundEqualizer({ data, isLight = true }: Props) {
  const [isPlaying, setIsPlaying] = useState(() => weddingAudio.getIsPlaying());
  
  const style: EqualizerStyle = data?.music?.equalizerStyle || 'bars';
  const color: EqualizerColor = data?.music?.equalizerColor || 'gold';
  const showNotes: boolean = data?.music?.showFloatingNotes ?? true;

  // Real-time animated bar levels
  const barCount = 30;
  const [barHeights, setBarHeights] = useState<number[]>(() => 
    Array.from({ length: barCount }, () => 10)
  );

  // Subscribe to audio engine playback state updates
  useEffect(() => {
    const unsubscribe = weddingAudio.subscribe((playing) => {
      setIsPlaying(playing);
    });

    const handleCustomEvent = (e: Event) => {
      const custom = e as CustomEvent<{ isPlaying: boolean }>;
      if (custom.detail) {
        setIsPlaying(custom.detail.isPlaying);
      }
    };

    window.addEventListener('wedding-audio-state', handleCustomEvent);
    return () => {
      unsubscribe();
      window.removeEventListener('wedding-audio-state', handleCustomEvent);
    };
  }, []);

  // Animate the equalizer bars strictly in sync with Web Audio AnalyserNode
  useEffect(() => {
    if (!isPlaying || style === 'off') return;

    let frameId: number;
    let lastTime = 0;

    const animateRealTimeSpectrum = (time: number) => {
      // 30-40 fps update loop for smooth Web Audio sync
      if (time - lastTime >= 28) {
        lastTime = time;
        const liveFrequencies = weddingAudio.getSpectrumBars(barCount);
        setBarHeights(liveFrequencies);
      }
      frameId = requestAnimationFrame(animateRealTimeSpectrum);
    };

    frameId = requestAnimationFrame(animateRealTimeSpectrum);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, style]);

  // Floating decorative musical notes
  const notes = useMemo(() => [
    { id: 1, char: '♪', left: '8%', delay: 0, duration: 6.5, size: 'text-xl' },
    { id: 2, char: '♫', left: '22%', delay: 1.8, duration: 7.2, size: 'text-2xl' },
    { id: 3, char: '♩', left: '78%', delay: 0.9, duration: 6.8, size: 'text-lg' },
    { id: 4, char: '♬', left: '90%', delay: 2.5, duration: 8.0, size: 'text-2xl' },
    { id: 5, char: '✦', left: '15%', delay: 3.2, duration: 5.5, size: 'text-sm' },
    { id: 6, char: '✧', left: '84%', delay: 4.1, duration: 5.8, size: 'text-sm' },
  ], []);

  // Color schemes configuration
  const colorClasses = useMemo(() => {
    switch (color) {
      case 'rose':
        return {
          gradient: 'from-rose-600/80 via-pink-400/90 to-rose-200',
          shadow: 'shadow-[0_0_12px_rgba(244,63,94,0.6)]',
          glow: 'from-rose-500/15 via-pink-400/15 to-amber-500/10',
          stroke: '#f43f5e',
          fill: 'rgba(244,63,94,0.15)',
          noteText: 'text-rose-500/40 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]',
          accent: 'bg-rose-500'
        };
      case 'emerald':
        return {
          gradient: 'from-emerald-600/80 via-teal-400/90 to-emerald-200',
          shadow: 'shadow-[0_0_12px_rgba(16,185,129,0.6)]',
          glow: 'from-emerald-500/15 via-teal-400/15 to-cyan-500/10',
          stroke: '#10b981',
          fill: 'rgba(16,185,129,0.15)',
          noteText: 'text-emerald-500/40 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]',
          accent: 'bg-emerald-500'
        };
      case 'cyan':
        return {
          gradient: 'from-cyan-600/80 via-sky-400/90 to-blue-200',
          shadow: 'shadow-[0_0_12px_rgba(6,182,212,0.6)]',
          glow: 'from-cyan-500/15 via-sky-400/15 to-indigo-500/10',
          stroke: '#06b6d4',
          fill: 'rgba(6,182,212,0.15)',
          noteText: 'text-cyan-500/40 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]',
          accent: 'bg-cyan-500'
        };
      case 'purple':
        return {
          gradient: 'from-purple-600/80 via-fuchsia-400/90 to-pink-200',
          shadow: 'shadow-[0_0_12px_rgba(168,85,247,0.6)]',
          glow: 'from-purple-500/15 via-fuchsia-400/15 to-pink-500/10',
          stroke: '#a855f7',
          fill: 'rgba(168,85,247,0.15)',
          noteText: 'text-purple-500/40 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]',
          accent: 'bg-purple-500'
        };
      case 'white':
        return {
          gradient: 'from-stone-400/80 via-stone-200/90 to-white',
          shadow: 'shadow-[0_0_12px_rgba(255,255,255,0.7)]',
          glow: 'from-white/10 via-stone-200/10 to-amber-100/10',
          stroke: '#ffffff',
          fill: 'rgba(255,255,255,0.12)',
          noteText: 'text-stone-300/50 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]',
          accent: 'bg-white'
        };
      case 'gold':
      default:
        return {
          gradient: 'from-amber-600/80 via-amber-400/95 to-yellow-200',
          shadow: 'shadow-[0_0_12px_rgba(245,158,11,0.6)]',
          glow: isLight ? 'from-amber-500/15 via-amber-400/20 to-emerald-500/15' : 'from-amber-500/20 via-amber-300/15 to-purple-500/15',
          stroke: '#f59e0b',
          fill: 'rgba(245,158,11,0.18)',
          noteText: 'text-amber-500/40 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]',
          accent: 'bg-amber-500'
        };
    }
  }, [color, isLight]);

  if (style === 'off') {
    return null;
  }

  // Calculate SVG wave path points for 'wave' style
  const svgWavePoints = useMemo(() => {
    if (style !== 'wave') return '';
    const width = 1000;
    const height = 120;
    const numPoints = barHeights.length;
    const dx = width / (numPoints - 1);

    const points = barHeights.map((h, i) => {
      const x = i * dx;
      const normalizedH = (h / 100) * (height * 0.75);
      const y = height - Math.max(8, normalizedH);
      return { x, y };
    });

    let d = `M 0 ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const mx = (p0.x + p1.x) / 2;
      d += ` Q ${p0.x} ${p0.y}, ${mx} ${(p0.y + p1.y) / 2}`;
    }
    const lastP = points[points.length - 1];
    d += ` T ${lastP.x} ${lastP.y}`;
    return d;
  }, [barHeights, style]);

  const svgWaveAreaPath = useMemo(() => {
    if (style !== 'wave' || !svgWavePoints) return '';
    return `${svgWavePoints} L 1000 120 L 0 120 Z`;
  }, [svgWavePoints, style]);

  // Average energy for radial circles
  const avgEnergy = useMemo(() => {
    if (barHeights.length === 0) return 0;
    const sum = barHeights.reduce((a, b) => a + b, 0);
    return Math.round(sum / barHeights.length);
  }, [barHeights]);

  return (
    <AnimatePresence>
      {isPlaying && (
        <motion.div
          key="background-equalizer-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 pointer-events-none z-20 overflow-hidden flex flex-col justify-between"
        >
          {/* Top Subtle Spectrum Header */}
          <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 md:gap-2 pt-3 pb-1 px-4 opacity-50 hover:opacity-85 transition-opacity">
            {barHeights.slice(0, 24).map((h, idx) => (
              <motion.div
                key={`top-bar-${idx}`}
                className={`w-1 sm:w-1.5 md:w-2 rounded-full bg-gradient-to-b ${colorClasses.gradient} ${colorClasses.shadow}`}
                animate={{ height: `${Math.max(6, h * 0.4)}px` }}
                transition={{ duration: 0.05, ease: 'linear' }}
              />
            ))}
          </div>

          {/* Floating Romantic Musical Notes & Ambient Stardust */}
          {showNotes && (
            <div className="absolute inset-0 pointer-events-none">
              {notes.map((note) => (
                <motion.div
                  key={`note-${note.id}`}
                  className={`absolute bottom-16 ${note.size} font-serif font-bold ${colorClasses.noteText} select-none`}
                  style={{ left: note.left }}
                  animate={{
                    y: [-20, -780],
                    x: [0, Math.sin(note.id) * 55, 0],
                    opacity: [0, 0.75, 0.85, 0],
                    rotate: [-15, 20, -10],
                    scale: [0.8, 1.25, 0.9],
                  }}
                  transition={{
                    duration: note.duration,
                    repeat: Infinity,
                    delay: note.delay,
                    ease: 'easeInOut',
                  }}
                >
                  {note.char}
                </motion.div>
              ))}
            </div>
          )}

          {/* Radial Ambient Sound Glow Behind Card */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl h-[75vh] bg-gradient-to-r ${colorClasses.glow} rounded-full blur-3xl animate-pulse pointer-events-none`}
            style={{ animationDuration: '4s' }}
          />

          {/* EQUALIZER SHAPES & STYLES (Positioned 6-8px above footer music player) */}

          {/* STYLE 1: BARS (طیف میله‌ای کلاسیک) */}
          {style === 'bars' && (
            <div className="w-full flex justify-center pb-[58px] sm:pb-[66px] md:pb-[68px] px-2.5 sm:px-6 relative">
              <div className="w-full max-w-6xl flex items-end justify-center gap-1 sm:gap-1.5 md:gap-2.5 h-10 sm:h-14 md:h-16 px-1">
                {barHeights.map((height, index) => {
                  const distanceFromCenter = Math.abs(index - barCount / 2) / (barCount / 2);
                  const scaleFactor = 1 - distanceFromCenter * 0.22;
                  const effectiveHeight = Math.max(8, Math.round(height * scaleFactor));

                  return (
                    <motion.div
                      key={`bottom-bar-${index}`}
                      className={`flex-1 max-w-[8px] sm:max-w-[12px] md:max-w-[16px] rounded-t-full bg-gradient-to-t ${colorClasses.gradient} ${colorClasses.shadow}`}
                      animate={{
                        height: `${effectiveHeight}%`,
                      }}
                      transition={{
                        duration: 0.05,
                        ease: 'easeOut',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* STYLE 2: WAVE (امواج صوتی سینوسی و روان) */}
          {style === 'wave' && (
            <div className="w-full flex justify-center pb-[54px] sm:pb-[62px] md:pb-[64px] px-2 sm:px-6 relative">
              <div className="w-full max-w-6xl h-16 sm:h-24 relative flex items-end">
                <svg
                  viewBox="0 0 1000 120"
                  preserveAspectRatio="none"
                  className="w-full h-full filter drop-shadow-[0_0_12px_rgba(245,158,11,0.55)]"
                >
                  <defs>
                    <linearGradient id={`wave-gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colorClasses.stroke} stopOpacity="0.45" />
                      <stop offset="100%" stopColor={colorClasses.stroke} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {svgWaveAreaPath && (
                    <path d={svgWaveAreaPath} fill={`url(#wave-gradient-${color})`} />
                  )}
                  {svgWavePoints && (
                    <path
                      d={svgWavePoints}
                      fill="none"
                      stroke={colorClasses.stroke}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  )}
                </svg>
              </div>
            </div>
          )}

          {/* STYLE 3: DOTS (ماتریس نقطه‌ای و کپسول‌های معلق) */}
          {style === 'dots' && (
            <div className="w-full flex justify-center pb-[58px] sm:pb-[66px] md:pb-[68px] px-2.5 sm:px-6 relative">
              <div className="w-full max-w-6xl flex items-end justify-center gap-1.5 sm:gap-2 md:gap-3 h-12 sm:h-16 px-1">
                {barHeights.map((height, index) => {
                  const distanceFromCenter = Math.abs(index - barCount / 2) / (barCount / 2);
                  const scaleFactor = 1 - distanceFromCenter * 0.2;
                  const effectiveHeight = Math.max(10, Math.round(height * scaleFactor));
                  const dotCount = Math.max(1, Math.min(6, Math.ceil(effectiveHeight / 16)));

                  return (
                    <div
                      key={`dots-col-${index}`}
                      className="flex-1 max-w-[10px] sm:max-w-[14px] flex flex-col-reverse items-center gap-1.5"
                    >
                      {Array.from({ length: dotCount }).map((_, dIdx) => (
                        <motion.div
                          key={`dot-${index}-${dIdx}`}
                          className={`w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full ${colorClasses.accent} ${colorClasses.shadow}`}
                          animate={{
                            scale: [1, 1.25, 1],
                            opacity: [0.7, 1, 0.7],
                          }}
                          transition={{
                            duration: 0.3 + (dIdx * 0.05),
                            repeat: Infinity,
                          }}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STYLE 4: GLOW BARS (ستون‌های نوری نئونی مدرن) */}
          {style === 'glow_bars' && (
            <div className="w-full flex justify-center pb-[58px] sm:pb-[66px] md:pb-[68px] px-2.5 sm:px-6 relative">
              <div className="w-full max-w-6xl flex items-end justify-center gap-1.5 sm:gap-2 md:gap-3.5 h-12 sm:h-18 px-1">
                {barHeights.map((height, index) => {
                  const distanceFromCenter = Math.abs(index - barCount / 2) / (barCount / 2);
                  const scaleFactor = 1 - distanceFromCenter * 0.2;
                  const effectiveHeight = Math.max(10, Math.round(height * scaleFactor));

                  return (
                    <div
                      key={`glow-col-${index}`}
                      className="flex-1 max-w-[12px] sm:max-w-[18px] md:max-w-[22px] flex flex-col justify-end items-center h-full"
                    >
                      {/* Bright tip light */}
                      <motion.div
                        className={`w-2.5 h-1 sm:w-3.5 sm:h-1.5 rounded-full bg-white ${colorClasses.shadow} mb-1`}
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 0.15, repeat: Infinity }}
                      />
                      {/* Neon body column */}
                      <motion.div
                        className={`w-full rounded-t-lg bg-gradient-to-t ${colorClasses.gradient} ${colorClasses.shadow}`}
                        animate={{ height: `${effectiveHeight}%` }}
                        transition={{ duration: 0.05, ease: 'easeOut' }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STYLE 5: CIRCULAR PULSE (امواج رادیال و حلقه‌های متحدالمرکز صوتی) */}
          {style === 'circular_pulse' && (
            <div className="w-full flex justify-center pb-[52px] sm:pb-[60px] relative overflow-hidden pointer-events-none">
              <div className="relative w-64 h-24 sm:w-96 sm:h-32 flex items-center justify-center">
                {/* 4 Concentric sound pulse ripples */}
                {[1, 2, 3, 4].map((ring) => {
                  const ringScale = 1 + (ring * 0.45) + (avgEnergy / 140);
                  return (
                    <motion.div
                      key={`ripple-${ring}`}
                      className={`absolute rounded-full border-2 border-dashed ${colorClasses.shadow}`}
                      style={{
                        borderColor: colorClasses.stroke,
                        width: `${ring * 60}px`,
                        height: `${ring * 35}px`,
                      }}
                      animate={{
                        scale: [ringScale * 0.85, ringScale * 1.15, ringScale * 0.85],
                        opacity: [0.3, 0.8, 0.3],
                      }}
                      transition={{
                        duration: 1.2 + ring * 0.3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* STYLE 6: MINIMAL LINE (خط باریک ضربان صوتی مینیمال) */}
          {style === 'minimal_line' && (
            <div className="w-full flex justify-center pb-[58px] sm:pb-[66px] md:pb-[68px] px-4 sm:px-10 relative">
              <div className="w-full max-w-5xl h-6 flex items-center justify-between gap-1">
                {barHeights.map((height, index) => {
                  const distanceFromCenter = Math.abs(index - barCount / 2) / (barCount / 2);
                  const scaleFactor = 1 - distanceFromCenter * 0.25;
                  const effectiveHeight = Math.max(3, Math.round((height / 100) * 24 * scaleFactor));

                  return (
                    <motion.div
                      key={`min-line-${index}`}
                      className={`flex-1 rounded-full ${colorClasses.accent} ${colorClasses.shadow}`}
                      animate={{
                        height: `${effectiveHeight}px`,
                      }}
                      transition={{
                        duration: 0.05,
                        ease: 'easeOut',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

        </motion.div>
      )}
    </AnimatePresence>
  );
}
