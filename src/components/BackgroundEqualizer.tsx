import { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { weddingAudio } from '../utils/audioSynth';
import { WeddingCardData, EqualizerStyle, EqualizerColor } from '../types';

interface Props {
  data?: WeddingCardData;
  isLight?: boolean;
}

// Optimized individual bar to prevent unnecessary re-rendering (origin bottom)
const BarItem = memo(({ height, className }: { height: number; className: string }) => {
  return (
    <div
      className={`flex-1 max-w-[8px] sm:max-w-[12px] md:max-w-[16px] rounded-t-full ${className} transition-[transform] duration-75 ease-out origin-bottom`}
      style={{
        transform: `scaleY(${Math.max(0.08, height / 100)})`,
        height: '100%',
        willChange: 'transform',
      }}
    />
  );
});
BarItem.displayName = 'BarItem';

// Optimized downward-pointing bar (origin top, rounded at bottom, stretches downward)
const DownwardBarItem = memo(({ height, className }: { height: number; className: string }) => {
  return (
    <div
      className={`flex-1 max-w-[4px] sm:max-w-[5px] md:max-w-[6px] rounded-b-full ${className} transition-[transform] duration-75 ease-out origin-top`}
      style={{
        transform: `scaleY(${Math.max(0.15, height / 100)})`,
        height: '100%',
        willChange: 'transform',
      }}
    />
  );
});
DownwardBarItem.displayName = 'DownwardBarItem';

// Optimized mirror bar
const MirrorBarItem = memo(({ 
  height, 
  glassTopGradient, 
  glassBottomGradient, 
  glassBorder, 
  shadow, 
  accent, 
  jewelGlow 
}: { 
  height: number; 
  glassTopGradient: string; 
  glassBottomGradient: string; 
  glassBorder: string; 
  shadow: string; 
  accent: string; 
  jewelGlow: string; 
}) => {
  const halfScale = Math.max(0.12, height / 100);
  return (
    <div className="flex-1 max-w-[8px] sm:max-w-[12px] md:max-w-[15px] flex flex-col items-center justify-center h-full relative">
      {/* Top Glass Half Column */}
      <div
        className={`w-full rounded-t-full border-t border-x ${glassBorder} bg-gradient-to-t ${glassTopGradient} ${shadow} backdrop-blur-[2px] relative overflow-hidden transition-[transform] duration-75 ease-out origin-bottom flex-1`}
        style={{
          transform: `scaleY(${halfScale})`,
          willChange: 'transform',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-[2px] bg-white/90 rounded-t-full" />
      </div>

      {/* Center Glowing Jewel Point */}
      <div
        className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${accent} ${jewelGlow} border border-white/80 my-0.5 z-10 shrink-0`}
      />

      {/* Bottom Glass Mirror Half Column */}
      <div
        className={`w-full rounded-b-full border-b border-x ${glassBorder} bg-gradient-to-b ${glassBottomGradient} ${shadow} backdrop-blur-[2px] relative overflow-hidden transition-[transform] duration-75 ease-out origin-top flex-1`}
        style={{
          transform: `scaleY(${halfScale})`,
          willChange: 'transform',
        }}
      >
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/90 rounded-b-full" />
      </div>
    </div>
  );
});
MirrorBarItem.displayName = 'MirrorBarItem';

function getColorClasses(color: EqualizerColor, isLight: boolean) {
  switch (color) {
    case 'rose':
      return {
        classicGradient: 'from-rose-600/90 via-pink-400/90 to-rose-300',
        downwardGradient: 'from-rose-500 via-pink-400 to-rose-300/40',
        glassTopGradient: 'from-rose-500/30 via-rose-400/80 to-white/95',
        glassBottomGradient: 'from-white/95 via-rose-400/80 to-rose-500/30',
        shadow: 'shadow-[0_0_10px_rgba(244,63,94,0.5)]',
        glow: 'from-rose-500/10 via-pink-400/10 to-amber-500/10',
        stroke: '#f43f5e',
        accent: 'bg-rose-400',
        border: 'border-rose-300/80',
        glassBorder: 'border-rose-200/90',
        jewelGlow: 'shadow-[0_0_8px_rgba(244,63,94,0.9)]',
        noteText: 'text-rose-500/40 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]',
        lineGlow: 'via-rose-400',
      };
    case 'emerald':
      return {
        classicGradient: 'from-emerald-600/90 via-teal-400/90 to-emerald-300',
        downwardGradient: 'from-emerald-500 via-teal-400 to-emerald-300/40',
        glassTopGradient: 'from-emerald-500/30 via-teal-400/80 to-white/95',
        glassBottomGradient: 'from-white/95 via-teal-400/80 to-emerald-500/30',
        shadow: 'shadow-[0_0_10px_rgba(16,185,129,0.5)]',
        glow: 'from-emerald-500/10 via-teal-400/10 to-cyan-500/10',
        stroke: '#10b981',
        accent: 'bg-emerald-400',
        border: 'border-emerald-300/80',
        glassBorder: 'border-emerald-200/90',
        jewelGlow: 'shadow-[0_0_8px_rgba(16,185,129,0.9)]',
        noteText: 'text-emerald-500/40 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]',
        lineGlow: 'via-emerald-400',
      };
    case 'cyan':
      return {
        classicGradient: 'from-cyan-600/90 via-sky-400/90 to-blue-300',
        downwardGradient: 'from-cyan-500 via-sky-400 to-blue-300/40',
        glassTopGradient: 'from-cyan-500/30 via-sky-400/80 to-white/95',
        glassBottomGradient: 'from-white/95 via-sky-400/80 to-cyan-500/30',
        shadow: 'shadow-[0_0_10px_rgba(6,182,212,0.5)]',
        glow: 'from-cyan-500/10 via-sky-400/10 to-indigo-500/10',
        stroke: '#06b6d4',
        accent: 'bg-cyan-400',
        border: 'border-cyan-300/80',
        glassBorder: 'border-cyan-200/90',
        jewelGlow: 'shadow-[0_0_8px_rgba(6,182,212,0.9)]',
        noteText: 'text-cyan-500/40 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]',
        lineGlow: 'via-cyan-400',
      };
    case 'purple':
      return {
        classicGradient: 'from-purple-600/90 via-fuchsia-400/90 to-pink-300',
        downwardGradient: 'from-purple-500 via-fuchsia-400 to-pink-300/40',
        glassTopGradient: 'from-purple-500/30 via-fuchsia-400/80 to-white/95',
        glassBottomGradient: 'from-white/95 via-fuchsia-400/80 to-purple-500/30',
        shadow: 'shadow-[0_0_10px_rgba(168,85,247,0.5)]',
        glow: 'from-purple-500/10 via-fuchsia-400/10 to-pink-500/10',
        stroke: '#a855f7',
        accent: 'bg-purple-400',
        border: 'border-purple-300/80',
        glassBorder: 'border-purple-200/90',
        jewelGlow: 'shadow-[0_0_8px_rgba(168,85,247,0.9)]',
        noteText: 'text-purple-500/40 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]',
        lineGlow: 'via-purple-400',
      };
    case 'white':
      return {
        classicGradient: 'from-stone-400/90 via-stone-200/90 to-white',
        downwardGradient: 'from-white via-stone-200 to-stone-400/30',
        glassTopGradient: 'from-white/20 via-white/70 to-white',
        glassBottomGradient: 'from-white via-white/70 to-white/20',
        shadow: 'shadow-[0_0_10px_rgba(255,255,255,0.6)]',
        glow: 'from-white/10 via-stone-200/10 to-amber-100/10',
        stroke: '#ffffff',
        accent: 'bg-white',
        border: 'border-white/80',
        glassBorder: 'border-white/90',
        jewelGlow: 'shadow-[0_0_8px_rgba(255,255,255,0.95)]',
        noteText: 'text-stone-300/50 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]',
        lineGlow: 'via-white',
      };
    case 'gold':
    default:
      return {
        classicGradient: 'from-amber-600/90 via-amber-400/95 to-yellow-200',
        downwardGradient: 'from-amber-500 via-amber-400 to-amber-300/40',
        glassTopGradient: 'from-amber-500/30 via-amber-400/80 to-amber-100/95',
        glassBottomGradient: 'from-amber-100/95 via-amber-400/80 to-amber-500/30',
        shadow: 'shadow-[0_0_10px_rgba(245,158,11,0.5)]',
        glow: isLight ? 'from-amber-500/10 via-amber-400/15 to-emerald-500/10' : 'from-amber-500/15 via-amber-300/10 to-purple-500/10',
        stroke: '#f59e0b',
        accent: 'bg-amber-400',
        border: 'border-amber-300/80',
        glassBorder: 'border-amber-200/90',
        jewelGlow: 'shadow-[0_0_8px_rgba(245,158,11,0.95)]',
        noteText: 'text-amber-500/40 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]',
        lineGlow: 'via-amber-400',
      };
  }
}

/**
 * Top Downward Equalizer:
 * Positions directly underneath the top RSVP confirmation button,
 * with audio bars oscillating and hanging DOWNWARDS towards the page content.
 */
export function TopDownwardEqualizer({ data, isLight = true }: Props) {
  const [isPlaying, setIsPlaying] = useState(() => weddingAudio.getIsPlaying());
  
  const style: EqualizerStyle = data?.music?.equalizerStyle || 'bars';
  const color: EqualizerColor = data?.music?.equalizerColor || 'gold';

  const barCount = 30;
  const [barHeights, setBarHeights] = useState<number[]>(() => 
    Array.from({ length: barCount }, () => 14)
  );

  // Audio playback subscription
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

  // Web Audio spectral sync loop
  useEffect(() => {
    if (!isPlaying || style === 'off') return;

    let frameId: number;
    let lastTime = 0;

    const animateRealTimeSpectrum = (time: number) => {
      if (time - lastTime >= 33) {
        lastTime = time;
        const liveFrequencies = weddingAudio.getSpectrumBars(barCount);
        setBarHeights(liveFrequencies);
      }
      frameId = requestAnimationFrame(animateRealTimeSpectrum);
    };

    frameId = requestAnimationFrame(animateRealTimeSpectrum);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, style]);

  const colorClasses = useMemo(() => getColorClasses(color, isLight), [color, isLight]);

  if (style === 'off') return null;

  return (
    <AnimatePresence>
      {isPlaying && (
        <motion.div
          key="top-downward-equalizer"
          initial={{ opacity: 0, y: -4, scaleY: 0.4 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: -4, scaleY: 0.4 }}
          transition={{ duration: 0.25 }}
          className="w-full flex flex-col items-center justify-center pointer-events-none mt-1"
        >
          {/* Connecting glowing hairline below both action buttons */}
          <div className={`w-[96%] h-[1.5px] bg-gradient-to-r from-transparent ${colorClasses.lineGlow} to-transparent rounded-full shadow-[0_0_6px_rgba(245,158,11,0.5)] opacity-85`} />

          {/* Downward hanging spectrum bars spanning both buttons width */}
          <div className="w-full h-3.5 sm:h-4.5 md:h-5 flex items-start justify-center gap-0.5 sm:gap-1 px-1 pt-0.5">
            {barHeights.map((height, index) => {
              const distanceFromCenter = Math.abs(index - barCount / 2) / (barCount / 2);
              const scaleFactor = 1 - distanceFromCenter * 0.22;
              const effectiveHeight = Math.max(12, Math.round(height * scaleFactor));

              return (
                <DownwardBarItem
                  key={`downward-top-bar-${index}`}
                  height={effectiveHeight}
                  className={`bg-gradient-to-b ${colorClasses.downwardGradient} ${colorClasses.shadow}`}
                />
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function BackgroundEqualizer({ data, isLight = true }: Props) {
  const [isPlaying, setIsPlaying] = useState(() => weddingAudio.getIsPlaying());
  
  const style: EqualizerStyle = data?.music?.equalizerStyle || 'bars';
  const color: EqualizerColor = data?.music?.equalizerColor || 'gold';
  const showNotes: boolean = data?.music?.showFloatingNotes ?? true;

  const barCount = 28;
  const [barHeights, setBarHeights] = useState<number[]>(() => 
    Array.from({ length: barCount }, () => 12)
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

  // Dynamically measure the exact rendered height of the fixed music footer
  const [footerHeight, setFooterHeight] = useState<number>(44);

  useEffect(() => {
    const updateFooterHeight = () => {
      const footerEl = document.getElementById('permanent-music-footer');
      if (footerEl) {
        const rect = footerEl.getBoundingClientRect();
        if (rect.height > 0) {
          setFooterHeight(Math.round(rect.height));
        }
      }
    };

    updateFooterHeight();
    const t1 = setTimeout(updateFooterHeight, 50);
    const t2 = setTimeout(updateFooterHeight, 250);
    const t3 = setTimeout(updateFooterHeight, 600);

    const footerEl = document.getElementById('permanent-music-footer');
    let observer: ResizeObserver | null = null;
    if (footerEl && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        updateFooterHeight();
      });
      observer.observe(footerEl);
    }

    window.addEventListener('resize', updateFooterHeight);
    window.addEventListener('orientationchange', updateFooterHeight);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', updateFooterHeight);
      window.removeEventListener('orientationchange', updateFooterHeight);
      if (observer && footerEl) {
        observer.unobserve(footerEl);
      }
    };
  }, [isPlaying]);

  // Smooth throttled Web Audio spectral sync loop (30fps) with GPU scaleY transforms
  useEffect(() => {
    if (!isPlaying || style === 'off') return;

    let frameId: number;
    let lastTime = 0;

    const animateRealTimeSpectrum = (time: number) => {
      if (time - lastTime >= 33) {
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
  const colorClasses = useMemo(() => getColorClasses(color, isLight), [color, isLight]);

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
          transition={{ duration: 0.5 }}
          className="fixed inset-0 pointer-events-none z-20 overflow-hidden flex flex-col justify-end"
        >
          {/* Floating Romantic Musical Notes */}
          {showNotes && (
            <div className="absolute inset-0 pointer-events-none">
              {notes.map((note) => (
                <motion.div
                  key={`note-${note.id}`}
                  className={`absolute bottom-16 ${note.size} font-serif font-bold ${colorClasses.noteText} select-none`}
                  style={{ left: note.left }}
                  animate={{
                    y: [-20, -780],
                    x: [0, Math.sin(note.id) * 45, 0],
                    opacity: [0, 0.75, 0.85, 0],
                    rotate: [-15, 20, -10],
                    scale: [0.8, 1.2, 0.9],
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

          {/* Radial Ambient Glow Behind Card */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] max-w-4xl h-[70vh] bg-gradient-to-r ${colorClasses.glow} rounded-full blur-3xl animate-pulse pointer-events-none`}
            style={{ animationDuration: '4s' }}
          />

          {/* EQUALIZER SHAPES (Positioned exactly 2px above footer music player) */}

          {/* 1. CLASSIC BARS */}
          {style === 'bars' && (
            <div
              className="w-full flex flex-col items-center justify-end px-2.5 sm:px-6 relative transition-[padding] duration-150"
              style={{ paddingBottom: `${footerHeight + 2}px` }}
            >
              <div className="w-full max-w-5xl flex items-end justify-center gap-1 sm:gap-1.5 md:gap-2.5 h-10 sm:h-14 md:h-16 px-1">
                {barHeights.map((height, index) => {
                  const distanceFromCenter = Math.abs(index - barCount / 2) / (barCount / 2);
                  const scaleFactor = 1 - distanceFromCenter * 0.22;
                  const effectiveHeight = Math.max(8, Math.round(height * scaleFactor));

                  return (
                    <BarItem
                      key={`bottom-bar-${index}`}
                      height={effectiveHeight}
                      className={`bg-gradient-to-t ${colorClasses.classicGradient} ${colorClasses.shadow}`}
                    />
                  );
                })}
              </div>
              {/* Subtle connecting hairline glowing 2px above the music footer */}
              <div className={`w-full max-w-5xl h-[1.5px] bg-gradient-to-r from-transparent ${colorClasses.lineGlow} to-transparent rounded-full shadow-[0_0_6px_rgba(245,158,11,0.4)] opacity-75 mt-0.5`} />
            </div>
          )}

          {/* 2. MIRROR SPECTRUM */}
          {style === 'mirror_spectrum' && (
            <div
              className="w-full flex flex-col items-center justify-end px-2.5 sm:px-6 relative transition-[padding] duration-150"
              style={{ paddingBottom: `${footerHeight + 2}px` }}
            >
              <div className="w-full max-w-5xl flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 h-16 sm:h-20 md:h-24 px-1">
                {barHeights.map((height, index) => {
                  const distanceFromCenter = Math.abs(index - barCount / 2) / (barCount / 2);
                  const scaleFactor = 1 - distanceFromCenter * 0.2;
                  const effectiveHeight = Math.max(12, Math.round(height * scaleFactor));

                  return (
                    <MirrorBarItem
                      key={`glass-mirror-bar-${index}`}
                      height={effectiveHeight}
                      glassTopGradient={colorClasses.glassTopGradient}
                      glassBottomGradient={colorClasses.glassBottomGradient}
                      glassBorder={colorClasses.glassBorder}
                      shadow={colorClasses.shadow}
                      accent={colorClasses.accent}
                      jewelGlow={colorClasses.jewelGlow}
                    />
                  );
                })}
              </div>
              {/* Subtle connecting hairline glowing 2px above the music footer */}
              <div className={`w-full max-w-5xl h-[1.5px] bg-gradient-to-r from-transparent ${colorClasses.lineGlow} to-transparent rounded-full shadow-[0_0_6px_rgba(245,158,11,0.4)] opacity-75 mt-0.5`} />
            </div>
          )}

        </motion.div>
      )}
    </AnimatePresence>
  );
}
