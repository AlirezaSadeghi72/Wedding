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
      // Smooth 35fps loop for Web Audio spectral sync
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

  // Color schemes and rich glass gradients configuration
  const colorClasses = useMemo(() => {
    switch (color) {
      case 'rose':
        return {
          classicGradient: 'from-rose-600/85 via-pink-400/90 to-rose-200',
          glassTopGradient: 'from-rose-500/30 via-rose-400/80 to-white/95',
          glassBottomGradient: 'from-white/95 via-rose-400/80 to-rose-500/30',
          shadow: 'shadow-[0_0_12px_rgba(244,63,94,0.65)]',
          glow: 'from-rose-500/15 via-pink-400/15 to-amber-500/10',
          stroke: '#f43f5e',
          accent: 'bg-rose-400',
          border: 'border-rose-300/80',
          glassBorder: 'border-rose-200/90',
          jewelGlow: 'shadow-[0_0_8px_rgba(244,63,94,0.9)]',
          noteText: 'text-rose-500/40 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]',
        };
      case 'emerald':
        return {
          classicGradient: 'from-emerald-600/85 via-teal-400/90 to-emerald-200',
          glassTopGradient: 'from-emerald-500/30 via-teal-400/80 to-white/95',
          glassBottomGradient: 'from-white/95 via-teal-400/80 to-emerald-500/30',
          shadow: 'shadow-[0_0_12px_rgba(16,185,129,0.65)]',
          glow: 'from-emerald-500/15 via-teal-400/15 to-cyan-500/10',
          stroke: '#10b981',
          accent: 'bg-emerald-400',
          border: 'border-emerald-300/80',
          glassBorder: 'border-emerald-200/90',
          jewelGlow: 'shadow-[0_0_8px_rgba(16,185,129,0.9)]',
          noteText: 'text-emerald-500/40 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]',
        };
      case 'cyan':
        return {
          classicGradient: 'from-cyan-600/85 via-sky-400/90 to-blue-200',
          glassTopGradient: 'from-cyan-500/30 via-sky-400/80 to-white/95',
          glassBottomGradient: 'from-white/95 via-sky-400/80 to-cyan-500/30',
          shadow: 'shadow-[0_0_12px_rgba(6,182,212,0.65)]',
          glow: 'from-cyan-500/15 via-sky-400/15 to-indigo-500/10',
          stroke: '#06b6d4',
          accent: 'bg-cyan-400',
          border: 'border-cyan-300/80',
          glassBorder: 'border-cyan-200/90',
          jewelGlow: 'shadow-[0_0_8px_rgba(6,182,212,0.9)]',
          noteText: 'text-cyan-500/40 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]',
        };
      case 'purple':
        return {
          classicGradient: 'from-purple-600/85 via-fuchsia-400/90 to-pink-200',
          glassTopGradient: 'from-purple-500/30 via-fuchsia-400/80 to-white/95',
          glassBottomGradient: 'from-white/95 via-fuchsia-400/80 to-purple-500/30',
          shadow: 'shadow-[0_0_12px_rgba(168,85,247,0.65)]',
          glow: 'from-purple-500/15 via-fuchsia-400/15 to-pink-500/10',
          stroke: '#a855f7',
          accent: 'bg-purple-400',
          border: 'border-purple-300/80',
          glassBorder: 'border-purple-200/90',
          jewelGlow: 'shadow-[0_0_8px_rgba(168,85,247,0.9)]',
          noteText: 'text-purple-500/40 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]',
        };
      case 'white':
        return {
          classicGradient: 'from-stone-400/85 via-stone-200/90 to-white',
          glassTopGradient: 'from-white/20 via-white/70 to-white',
          glassBottomGradient: 'from-white via-white/70 to-white/20',
          shadow: 'shadow-[0_0_12px_rgba(255,255,255,0.75)]',
          glow: 'from-white/10 via-stone-200/10 to-amber-100/10',
          stroke: '#ffffff',
          accent: 'bg-white',
          border: 'border-white/80',
          glassBorder: 'border-white/90',
          jewelGlow: 'shadow-[0_0_8px_rgba(255,255,255,0.95)]',
          noteText: 'text-stone-300/50 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]',
        };
      case 'gold':
      default:
        return {
          classicGradient: 'from-amber-600/85 via-amber-400/95 to-yellow-200',
          glassTopGradient: 'from-amber-500/30 via-amber-400/80 to-amber-100/95',
          glassBottomGradient: 'from-amber-100/95 via-amber-400/80 to-amber-500/30',
          shadow: 'shadow-[0_0_12px_rgba(245,158,11,0.65)]',
          glow: isLight ? 'from-amber-500/15 via-amber-400/20 to-emerald-500/15' : 'from-amber-500/20 via-amber-300/15 to-purple-500/15',
          stroke: '#f59e0b',
          accent: 'bg-amber-400',
          border: 'border-amber-300/80',
          glassBorder: 'border-amber-200/90',
          jewelGlow: 'shadow-[0_0_8px_rgba(245,158,11,0.95)]',
          noteText: 'text-amber-500/40 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]',
        };
    }
  }, [color, isLight]);

  if (style === 'off') {
    return null;
  }

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
                className={`w-1 sm:w-1.5 md:w-2 rounded-full bg-gradient-to-b ${colorClasses.classicGradient} ${colorClasses.shadow}`}
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

          {/* EQUALIZER SHAPES (Positioned 6-8px above footer music player) */}

          {/* 1. CLASSIC BARS (میله‌های کلاسیک متقارن و لوکس) */}
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
                      className={`flex-1 max-w-[8px] sm:max-w-[12px] md:max-w-[16px] rounded-t-full bg-gradient-to-t ${colorClasses.classicGradient} ${colorClasses.shadow}`}
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

          {/* 2. MIRROR SPECTRUM (طیف دوطرفه آینه‌ای شیشه‌ای و کریستالی با گرادیان غنی) */}
          {style === 'mirror_spectrum' && (
            <div className="w-full flex justify-center pb-[54px] sm:pb-[62px] md:pb-[64px] px-2.5 sm:px-6 relative">
              <div className="w-full max-w-6xl flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 h-16 sm:h-20 md:h-24 px-1">
                {barHeights.map((height, index) => {
                  const distanceFromCenter = Math.abs(index - barCount / 2) / (barCount / 2);
                  const scaleFactor = 1 - distanceFromCenter * 0.2;
                  const effectiveHeight = Math.max(12, Math.round(height * scaleFactor));

                  return (
                    <div
                      key={`glass-mirror-bar-${index}`}
                      className="flex-1 max-w-[8px] sm:max-w-[12px] md:max-w-[15px] flex flex-col items-center justify-center h-full relative"
                    >
                      {/* Top Glass Half Column */}
                      <motion.div
                        className={`w-full rounded-t-full border-t border-x ${colorClasses.glassBorder} bg-gradient-to-t ${colorClasses.glassTopGradient} ${colorClasses.shadow} backdrop-blur-sm relative overflow-hidden`}
                        animate={{ height: `${effectiveHeight / 2}%` }}
                        transition={{ duration: 0.05, ease: 'easeOut' }}
                      >
                        {/* Specular glass reflection line */}
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-white/90 rounded-t-full" />
                      </motion.div>

                      {/* Center Glowing Jewel Point */}
                      <div
                        className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${colorClasses.accent} ${colorClasses.jewelGlow} border border-white/80 my-0.5 z-10 shrink-0 transition-transform`}
                      />

                      {/* Bottom Glass Mirror Half Column */}
                      <motion.div
                        className={`w-full rounded-b-full border-b border-x ${colorClasses.glassBorder} bg-gradient-to-b ${colorClasses.glassBottomGradient} ${colorClasses.shadow} backdrop-blur-sm relative overflow-hidden`}
                        animate={{ height: `${effectiveHeight / 2}%` }}
                        transition={{ duration: 0.05, ease: 'easeOut' }}
                      >
                        {/* Specular glass reflection line */}
                        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/90 rounded-b-full" />
                      </motion.div>
                    </div>
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
