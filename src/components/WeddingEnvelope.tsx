import { useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { WeddingCardData, SealColor, EnvelopeStyle, RibbonStyle } from '../types';
import { THEMES } from '../data/themes';
import { Sparkles, MailOpen } from 'lucide-react';
import { weddingAudio } from '../utils/audioSynth';

interface Props {
  data: WeddingCardData;
  onOpen: () => void;
  isOpened: boolean;
}

export default function WeddingEnvelope({
  data,
  onOpen,
}: Props) {
  const [isBreaking, setIsBreaking] = useState(false);

  const currentTheme = THEMES[data.themeId] || THEMES.emerald;

  const triggerPetalsAndGold = () => {
    // Luxury gold and rose petals confetti burst
    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#FFE082', '#E11D48', '#FDA4AF', '#FFFFFF'],
      ticks: 200,
      gravity: 0.8,
      scalar: 1.2
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#D4AF37', '#FFD700', '#F43F5E']
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#D4AF37', '#FFD700', '#F43F5E']
      });
    }, 250);
  };

  const handleBreakSeal = () => {
    if (isBreaking) return;
    setIsBreaking(true);

    // Play wedding music automatically on interaction
    if (data.music?.enabled) {
      if (data.music.audioUrl) {
        weddingAudio.playCustomAudio(data.music.audioUrl);
      } else {
        weddingAudio.playPreset(data.music.synthPreset);
      }
    }

    triggerPetalsAndGold();

    setTimeout(() => {
      onOpen();
    }, 700);
  };

  const getSealBg = (color: SealColor) => {
    switch (color) {
      case 'gold':
        return 'bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 text-amber-950 border-amber-300/80 shadow-[0_0_20px_rgba(245,158,11,0.35)]';
      case 'emerald':
        return 'bg-gradient-to-br from-emerald-600 via-emerald-800 to-emerald-950 text-emerald-100 border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.3)]';
      case 'navy':
        return 'bg-gradient-to-br from-sky-600 via-blue-800 to-slate-950 text-sky-100 border-sky-400/80 shadow-[0_0_20px_rgba(59,130,246,0.3)]';
      case 'black':
        return 'bg-gradient-to-br from-stone-700 via-stone-900 to-black text-stone-200 border-stone-600';
      case 'silver':
        return 'bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 text-slate-950 border-slate-200 shadow-[0_0_20px_rgba(226,232,240,0.4)]';
      case 'burgundy':
        return 'bg-gradient-to-br from-rose-900 via-red-950 to-black text-rose-100 border-rose-600/80 shadow-[0_0_20px_rgba(225,29,72,0.3)]';
      case 'rose_gold':
        return 'bg-gradient-to-br from-rose-300 via-rose-500 to-amber-600 text-rose-950 border-rose-300/90 shadow-[0_0_20px_rgba(244,63,94,0.3)]';
      case 'red':
      default:
        return 'bg-gradient-to-br from-red-600 via-rose-800 to-red-950 text-red-100 border-rose-400/80 shadow-[0_0_20px_rgba(239,68,68,0.3)]';
    }
  };

  const getEnvelopePaperStyle = (style?: EnvelopeStyle) => {
    switch (style) {
      case 'royal_gold':
        return 'bg-gradient-to-b from-amber-100 via-amber-200 to-amber-300/90 border-amber-500/80 text-amber-950 shadow-amber-500/15';
      case 'emerald_palace':
        return 'bg-gradient-to-b from-emerald-900 via-emerald-950 to-stone-950 border-emerald-400/70 text-emerald-100';
      case 'deep_burgundy':
        return 'bg-gradient-to-b from-rose-950 via-stone-900 to-black border-rose-500/70 text-rose-100';
      case 'midnight_navy':
        return 'bg-gradient-to-b from-sky-950 via-slate-900 to-black border-sky-400/70 text-sky-100';
      case 'pearl_white':
        return 'bg-gradient-to-b from-white via-slate-50 to-amber-50/80 border-slate-300 text-slate-900';
      case 'classic_cream':
      default:
        return 'bg-gradient-to-b from-[#FFFDF7] via-[#FAF6ED] to-[#FEF3C7]/90 border-amber-400/50 text-stone-900';
    }
  };

  const getRibbonStyle = (ribbon?: RibbonStyle) => {
    switch (ribbon) {
      case 'satin_red':
        return 'bg-gradient-to-r from-red-700/40 via-rose-500/60 to-red-700/40 border-y border-rose-400/50';
      case 'emerald_velvet':
        return 'bg-gradient-to-r from-emerald-800/40 via-emerald-600/60 to-emerald-800/40 border-y border-emerald-400/50';
      case 'royal_navy':
        return 'bg-gradient-to-r from-sky-800/40 via-blue-600/60 to-sky-800/40 border-y border-sky-400/50';
      case 'none':
        return 'hidden';
      case 'gold_cross':
      default:
        return 'bg-gradient-to-r from-amber-600/30 via-amber-400/50 to-amber-600/30 border-y border-amber-400/50';
    }
  };

  const isDarkEnvelope = data.waxSeal.envelopeStyle === 'emerald_palace' ||
    data.waxSeal.envelopeStyle === 'deep_burgundy' ||
    data.waxSeal.envelopeStyle === 'midnight_navy';

  return (
    <div id="envelope-container" className="relative flex flex-col items-center justify-between min-h-screen py-4 sm:py-8 px-3 sm:px-6 select-none overflow-x-hidden transition-colors duration-500 bg-gradient-to-b from-[#FFFDF7] via-[#FAF6ED] to-[#FEF3C7]">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-300/30 via-stone-100 to-amber-100/50" />

      {/* Top Bar Header Badge */}
      <div className="w-full max-w-lg flex items-center justify-center gap-2 z-30 mb-2 sm:mb-4">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs shadow-md backdrop-blur-md border bg-white/95 border-amber-500/30 text-amber-900"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
          <span className="font-semibold">کارت دعوت دیجیتال</span>
        </motion.div>
      </div>

      {/* Title Header */}
      <div className="text-center z-20 mb-3 sm:mb-6 px-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-amiri tracking-wide text-amber-950">
          پیوند خجسته {data.brideName} و {data.groomName}
        </h1>
      </div>

      {/* 3D Envelope Element */}
      <motion.div
        layout
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg my-auto z-20"
      >
        {/* Envelope Outer Shell */}
        <div className={`relative w-full rounded-2xl sm:rounded-3xl p-1 shadow-2xl border ${currentTheme.envelopeColor} overflow-hidden backdrop-blur-md transition-all duration-500 hover:shadow-amber-500/20 hover:shadow-2xl`}>
          {/* Ornate Gold Texture Overlay */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Envelope Main Body */}
          <div className={`relative rounded-xl sm:rounded-2xl p-4 sm:p-7 border flex flex-col items-center text-center transition-colors duration-500 ${getEnvelopePaperStyle(
            data.waxSeal.envelopeStyle
          )}`}>
            
            {/* Top Ornamental Arch */}
            <div className="w-full flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
              <div className="w-1.5 h-1.5 rotate-45 border border-amber-500 bg-amber-400/30" />
              <span className={`font-scheherazade text-sm sm:text-base px-1 sm:px-2 font-bold ${
                isDarkEnvelope ? 'text-amber-200' : 'text-amber-900'
              }`}>
                بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </span>
              <div className="w-1.5 h-1.5 rotate-45 border border-amber-500 bg-amber-400/30" />
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-500/50 to-transparent" />
            </div>

            {/* Couple Calligraphy Monogram */}
            <div className="my-2 sm:my-3 text-center">
              <span className={`font-scheherazade text-2xl sm:text-3xl md:text-4xl block font-bold leading-relaxed ${
                isDarkEnvelope ? 'text-amber-200' : 'text-amber-900'
              }`}>
                {data.brideName} & {data.groomName}
              </span>
              <p className={`text-[11px] sm:text-xs mt-0.5 font-medium ${
                isDarkEnvelope ? 'text-amber-200/80' : 'text-amber-800/80'
              }`}>
                جشن آغاز فصل نوینی از عاشقانه‌ها
              </p>
            </div>

            {/* Envelope Flap & Wax Seal Section */}
            <div className="relative my-5 sm:my-8 flex flex-col items-center justify-center w-full">
              {/* Ribbon Overlay */}
              <div className={`absolute w-full h-7 sm:h-8 -z-0 ${getRibbonStyle(data.waxSeal.ribbonStyle)}`} />

              {/* Interactive Wax Seal Button (Strictly Round with Two Interlocking Rings) */}
              <motion.button
                id="break-seal-btn"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                animate={isBreaking ? { scale: [1, 1.25, 0], rotate: [0, -10, 20], opacity: [1, 1, 0] } : {}}
                transition={{ duration: 0.6 }}
                onClick={handleBreakSeal}
                className={`relative z-10 w-22 h-22 sm:w-28 sm:h-28 rounded-full border-2 p-1 sm:p-1.5 flex flex-col items-center justify-center cursor-pointer wax-seal transition-all shadow-xl ${getSealBg(
                  data.waxSeal.color
                )}`}
              >
                {/* Inner Intaglio Rim */}
                <div className="w-full h-full rounded-full border border-white/40 flex flex-col items-center justify-center p-1.5 sm:p-2 shadow-inner">
                  {/* Two Interlocking Rings Icon */}
                  <div className="flex items-center -space-x-2 sm:-space-x-2.5 my-auto drop-shadow-md">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border-[2.5px] border-current relative flex items-center justify-center">
                      <div className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-white shadow-sm animate-pulse" />
                    </div>
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border-[2.5px] border-current relative flex items-center justify-center">
                      <div className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-white shadow-sm animate-pulse" />
                    </div>
                  </div>
                </div>
              </motion.button>

              {/* Guidance Text Below Seal */}
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`mt-3.5 flex items-center gap-1.5 text-[11px] sm:text-xs font-bold ${
                  isDarkEnvelope ? 'text-amber-200' : 'text-amber-700'
                }`}
              >
                <MailOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                <span>{data.waxSeal.guideText || 'برای گشودن پاکت روی مهر و موم لمس کنید'}</span>
              </motion.div>
            </div>

            {/* Date Preview Footer */}
            <div className={`w-full pt-3 sm:pt-4 border-t flex items-center justify-between text-[11px] sm:text-xs font-medium ${
              isDarkEnvelope ? 'border-amber-500/30 text-amber-200' : 'border-amber-200 text-amber-900'
            }`}>
              <span>{data.solarDate.dayOfWeek} {data.solarDate.day} {data.solarDate.month} {data.solarDate.year}</span>
              <span className={`font-cinzel font-bold ${isDarkEnvelope ? 'text-amber-300' : 'text-amber-800'}`}>
                {data.eventTime}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom Spacer for smooth alignment */}
      <div className="h-2 z-10" />
    </div>
  );
}


