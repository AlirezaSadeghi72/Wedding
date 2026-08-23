import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { WeddingCardData, SealColor } from '../types';
import { Sparkles, Calendar, Clock, MapPin, Heart, Crown, Flower2, Bird } from 'lucide-react';
import { weddingAudio } from '../utils/audioSynth';
import { getTheme } from '../data/themes';

interface Props {
  data: WeddingCardData;
  onOpen: () => void;
  isOpened: boolean;
  isAdminAuthenticated?: boolean;
}

export default function WeddingEnvelope({
  data,
  onOpen,
  isAdminAuthenticated,
}: Props) {
  const [isOpening, setIsOpening] = useState(false);
  const [sealBroken, setSealBroken] = useState(false);
  const [animStage, setAnimStage] = useState<'idle' | 'rising' | 'centering' | 'fullscreen'>('idle');

  const currentTheme = getTheme(data.themeId, data.colorMode);

  // Strictly lock body scroll on envelope screen
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
    };
  }, []);

  const getSealColorClasses = (color?: SealColor) => {
    switch (color) {
      case 'emerald':
        return 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-950 text-emerald-100 border-emerald-300 shadow-[0_8px_25px_rgba(16,185,129,0.55)]';
      case 'navy':
        return 'bg-gradient-to-br from-sky-600 via-blue-800 to-indigo-950 text-sky-100 border-sky-300 shadow-[0_8px_25px_rgba(59,130,246,0.55)]';
      case 'red':
        return 'bg-gradient-to-br from-red-500 via-rose-700 to-rose-950 text-rose-100 border-rose-300 shadow-[0_8px_25px_rgba(239,68,68,0.55)]';
      case 'burgundy':
        return 'bg-gradient-to-br from-rose-800 via-rose-950 to-stone-950 text-rose-100 border-rose-300 shadow-[0_8px_25px_rgba(190,18,60,0.55)]';
      case 'rose_gold':
        return 'bg-gradient-to-br from-rose-300 via-pink-500 to-rose-700 text-rose-950 border-rose-200 shadow-[0_8px_25px_rgba(244,114,182,0.55)]';
      case 'silver':
        return 'bg-gradient-to-br from-slate-200 via-slate-400 to-slate-700 text-slate-900 border-slate-200 shadow-[0_8px_25px_rgba(148,163,184,0.55)]';
      case 'black':
        return 'bg-gradient-to-br from-stone-700 via-stone-900 to-black text-amber-300 border-stone-500 shadow-[0_8px_25px_rgba(0,0,0,0.65)]';
      case 'gold':
      default:
        return 'bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 text-amber-950 border-amber-300 shadow-[0_8px_28px_rgba(245,158,11,0.6)]';
    }
  };

  const triggerCelebratoryEffects = () => {
    confetti({
      particleCount: 110,
      spread: 115,
      origin: { y: 0.5 },
      colors: ['#D4AF37', '#FFE082', '#FACC15', '#FDA4AF', '#FFFFFF', '#4D7C0F'],
      ticks: 290,
      gravity: 0.65,
      scalar: 1.25
    });

    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 75,
        origin: { x: 0.1, y: 0.55 },
        colors: ['#D4AF37', '#FFD700', '#F472B6']
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 75,
        origin: { x: 0.9, y: 0.55 },
        colors: ['#D4AF37', '#FFD700', '#F472B6']
      });
    }, 200);
  };

  const handleOpenEnvelope = () => {
    if (isOpening) return;
    setIsOpening(true);

    // 1. Play romantic wedding audio
    if (data.music?.enabled && !weddingAudio.getIsPlaying()) {
      if (data.music.audioUrl) {
        weddingAudio.playCustomAudio(data.music.audioUrl);
      } else {
        weddingAudio.playPreset(data.music.synthPreset);
      }
    }

    // 2. Break wax seal & trigger celebratory confetti
    setSealBroken(true);
    triggerCelebratoryEffects();

    // 3. Stage 1: Card lifts smoothly from inside envelope pocket
    setTimeout(() => {
      setAnimStage('rising');
    }, 150);

    // 4. Stage 2: Card re-centers and starts expanding
    setTimeout(() => {
      setAnimStage('centering');
    }, 450);

    // 5. Stage 3: Card smoothly expands to fullscreen hero view
    setTimeout(() => {
      setAnimStage('fullscreen');
    }, 850);

    // 6. Seamlessly complete transition to full WeddingCardView
    setTimeout(() => {
      onOpen();
    }, 1300);
  };

  const hasMusicFooter = data.music?.enabled && data.sectionVisibility?.musicPlayer !== false;
  const ribbonStyle = data.waxSeal?.ribbonStyle || 'none';
  const sealColor = data.waxSeal?.color || 'gold';
  const iconType = data.waxSeal?.iconType || 'rings';
  const monogram = data.waxSeal?.monogram || 'P & N';
  const guideText = data.waxSeal?.guideText || 'برای گشودن پاکت روی مهر و موم لمس کنید';

  const renderSealIcon = () => {
    switch (iconType) {
      case 'monogram':
        return (
          <span className="font-cinzel text-[10px] sm:text-xs font-bold tracking-wider text-current drop-shadow-sm leading-none select-none text-center">
            {monogram}
          </span>
        );
      case 'heart':
        return <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-current drop-shadow-sm" />;
      case 'crown':
        return <Crown className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-current drop-shadow-sm" />;
      case 'floral':
        return <Flower2 className="w-4 h-4 sm:w-5 sm:h-5 text-current drop-shadow-sm stroke-[2]" />;
      case 'bird':
        return <Bird className="w-4 h-4 sm:w-5 sm:h-5 text-current drop-shadow-sm stroke-[2]" />;
      case 'rings':
      default:
        return (
          <div className="flex items-center -space-x-1.5 my-auto drop-shadow-sm">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-[1.8px] border-current relative flex items-center justify-center shrink-0">
              <div className="absolute -top-0.5 w-1 h-1 rounded-full bg-white shadow-xs ring-1 ring-amber-300" />
            </div>
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-[1.8px] border-current relative flex items-center justify-center shrink-0">
              <div className="absolute -top-0.5 w-1 h-1 rounded-full bg-white shadow-xs ring-1 ring-amber-300" />
            </div>
          </div>
        );
    }
  };

  return (
    <div
      id="envelope-container"
      className={`fixed inset-0 w-full h-[100dvh] overflow-hidden select-none flex flex-col justify-between items-center px-2.5 sm:px-6 overscroll-none touch-none bg-gradient-to-b ${currentTheme.primaryBg} z-30 transition-all duration-300 ${
        isAdminAuthenticated ? 'pt-14 sm:pt-16' : 'pt-2 sm:pt-4'
      } ${hasMusicFooter ? 'pb-18 sm:pb-22' : 'pb-2 sm:pb-5'}`}
    >
      {/* Background ambient lighting & soft golden aura */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-300/35 via-stone-100/40 to-amber-100/60" />

      {/* Top Header Badge & Families Title */}
      <motion.div
        animate={{
          opacity: animStage === 'fullscreen' ? 0 : 1,
          y: animStage === 'fullscreen' ? -35 : 0
        }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg flex flex-col items-center justify-center text-center z-30 shrink-0 pt-1 sm:pt-2 px-2"
      >
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] sm:text-xs shadow-sm backdrop-blur-md border bg-white/95 border-amber-400/60 text-amber-900 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
          <span className="font-bold font-vazir">کارت دعوت رسمی مراسم عروسی</span>
        </div>

        {/* Families greeting */}
        <p className="text-[11px] sm:text-xs font-medium text-amber-900/90 font-amiri leading-normal">
          خانواده‌های محترم {data.brideFamily} و {data.groomFamily}
        </p>
        <h1 className="text-base sm:text-xl md:text-2xl font-bold font-amiri tracking-wide text-amber-950 mt-0.5 leading-snug">
          جشن پیوند خجسته {data.brideName} و {data.groomName}
        </h1>
      </motion.div>

      {/* Interactive 3D Stage Container */}
      <div className="flex-1 w-full max-w-xl z-20 flex flex-col items-center justify-center shrink-0 min-h-0 py-1 sm:py-2">
        
        {/* Floating Animated Call to Action Banner above the envelope */}
        <AnimatePresence>
          {!sealBroken && animStage === 'idle' && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{
                opacity: 1,
                y: [0, -5, 0],
                scale: [1, 1.03, 1]
              }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{
                y: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
                scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
                opacity: { duration: 0.3 }
              }}
              onClick={handleOpenEnvelope}
              className="z-30 mb-2 sm:mb-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-amber-950 font-bold text-xs sm:text-sm shadow-[0_6px_20px_rgba(217,119,6,0.45)] border-2 border-white flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-900 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-950"></span>
              </span>
              <span className="font-vazir font-extrabold tracking-wide">برای بازگشایی پاکت لمس کنید</span>
              <motion.span
                animate={{
                  y: [0, 4, 0],
                  rotate: [0, -8, 8, 0]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: 'easeInOut'
                }}
                className="text-base inline-block"
              >
                👇
              </motion.span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Envelope & Card Wrapper */}
        <div className="relative w-full max-w-[340px] sm:max-w-[460px] md:max-w-[500px] h-[min(48vh,330px)] sm:h-[330px] md:h-[350px] mx-auto flex items-center justify-center [perspective:1400px]">
          
          {/* ================= 1. REALISTIC LUXURY ENVELOPE BASE ================= */}
          <motion.div
            animate={
              animStage === 'fullscreen' || animStage === 'centering'
                ? {
                    opacity: 0,
                    y: 90,
                    scale: 0.85
                  }
                : animStage === 'rising'
                ? {
                    opacity: 0.7,
                    y: 25,
                    scale: 0.96
                  }
                : {
                    opacity: 1,
                    y: 0,
                    scale: 1
                  }
            }
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#FDF8EE] via-[#F8EEDA] to-[#EEDDB8] border-2 border-amber-400/90 shadow-[0_15px_35px_rgba(217,119,6,0.22)] overflow-hidden z-[1]"
          >
            {/* Elegant luxury damask texture on envelope background */}
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#b48a28_1.2px,transparent_1.2px)] [background-size:14px_14px] pointer-events-none" />
            
            {/* Inner golden perimeter lining */}
            <div className="absolute inset-2 sm:inset-3 border border-amber-400/50 rounded-xl sm:rounded-2xl pointer-events-none" />
            
            {/* Realistic Top Open Triangular Flap pointing up behind card */}
            <div
              className="absolute -top-1 left-0 right-0 h-24 sm:h-36 bg-gradient-to-b from-[#FFFDF8] via-[#F6EBCE] to-[#ECD8A5] border-t-2 border-amber-400/80 shadow-[0_4px_10px_rgba(180,138,40,0.2)] z-[1]"
              style={{ clipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)' }}
            />

            {/* Left Diagonal Pocket Fold with Realistic 3D Shadow */}
            <div
              className="absolute inset-0 bg-gradient-to-tr from-[#ECD8A5] via-[#F8EEDA] to-transparent pointer-events-none border-l border-amber-300/60 shadow-inner z-[5]"
              style={{ clipPath: 'polygon(0% 0%, 0% 100%, 50% 50%)' }}
            />
            {/* Right Diagonal Pocket Fold */}
            <div
              className="absolute inset-0 bg-gradient-to-tl from-[#ECD8A5] via-[#F8EEDA] to-transparent pointer-events-none border-r border-amber-300/60 shadow-inner z-[5]"
              style={{ clipPath: 'polygon(100% 0%, 100% 100%, 50% 50%)' }}
            />
            {/* Bottom Triangular Pocket Fold with Realistic Crease */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-[#DFCA95] via-[#F8EEDA] to-transparent pointer-events-none border-b-2 border-amber-400/70 shadow-[0_-5px_15px_rgba(180,138,40,0.15)] z-[6]"
              style={{ clipPath: 'polygon(0% 100%, 100% 100%, 50% 48%)' }}
            />

            {/* Ribbon Decoration on the Envelope (Behind Card) */}
            {ribbonStyle !== 'none' && (
              <div className="absolute inset-0 z-[1] pointer-events-none flex items-center justify-center">
                {/* Horizontal Ribbon Banner */}
                <div
                  className={`w-full h-8 sm:h-10 shadow-md flex items-center justify-center ${
                    ribbonStyle === 'satin_red'
                      ? 'bg-gradient-to-r from-red-800 via-rose-600 to-red-800 border-y border-rose-400/60 shadow-rose-900/30'
                      : ribbonStyle === 'emerald_velvet'
                      ? 'bg-gradient-to-r from-emerald-900 via-emerald-700 to-emerald-900 border-y border-emerald-400/60 shadow-emerald-950/30'
                      : ribbonStyle === 'royal_navy'
                      ? 'bg-gradient-to-r from-sky-950 via-blue-800 to-sky-950 border-y border-sky-400/60 shadow-blue-950/30'
                      : 'bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700 border-y border-amber-300/70 shadow-amber-900/25'
                  }`}
                >
                  <div className="w-full h-0.5 border-t border-dashed border-white/40" />
                </div>

                {/* Optional Vertical Ribbon for Gold Cross style */}
                {ribbonStyle === 'gold_cross' && (
                  <div className="absolute inset-y-0 w-8 sm:w-10 bg-gradient-to-b from-amber-700 via-amber-500 to-amber-700 border-x border-amber-300/70 shadow-md flex items-center justify-center">
                    <div className="h-full w-0.5 border-r border-dashed border-white/40" />
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* ================= 2. THE WEDDING INVITATION CARD INSIDE THE ENVELOPE ================= */}
          <motion.div
            animate={
              animStage === 'fullscreen'
                ? {
                    y: 0,
                    scale: 1.12,
                    opacity: 1,
                    width: '100%',
                    maxWidth: '680px',
                    height: 'auto',
                    minHeight: '430px',
                    boxShadow: '0 35px 90px -15px rgba(217, 119, 6, 0.55), 0 0 60px rgba(250, 204, 21, 0.5)',
                    zIndex: 40
                  }
                : animStage === 'centering'
                ? {
                    y: 0,
                    scale: 1.03,
                    opacity: 1,
                    width: '95%',
                    maxWidth: '480px',
                    height: '92%',
                    boxShadow: '0 25px 60px -12px rgba(217, 119, 6, 0.4), 0 0 35px rgba(250, 204, 21, 0.35)',
                    zIndex: 35
                  }
                : animStage === 'rising'
                ? {
                    y: -50,
                    scale: 1.0,
                    opacity: 1,
                    width: '93%',
                    maxWidth: '460px',
                    height: '90%',
                    boxShadow: '0 20px 45px -10px rgba(217, 119, 6, 0.35), 0 0 25px rgba(250, 204, 21, 0.28)',
                    zIndex: 25
                  }
                : {
                    y: 0,
                    scale: 0.95,
                    opacity: 1,
                    width: '92%',
                    maxWidth: '450px',
                    height: '90%',
                    boxShadow: '0 10px 25px -5px rgba(217, 119, 6, 0.18)',
                    zIndex: 2
                  }
            }
            transition={{
              duration: animStage === 'fullscreen' ? 0.7 : animStage === 'centering' ? 0.5 : 0.45,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="absolute rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#FFFDF5] via-[#FFFDF5] to-[#FAF6ED] border-2 border-amber-500/90 p-3 sm:p-5 flex flex-col justify-between items-center text-center transition-colors cursor-pointer select-none overflow-hidden"
            onClick={handleOpenEnvelope}
          >
            {/* Card Filigree Corners & Inner Golden Frames */}
            <div className="absolute inset-1.5 sm:inset-2.5 border border-amber-400/60 rounded-xl sm:rounded-2xl pointer-events-none" />
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-r-2 border-amber-600 rounded-tr-sm sm:rounded-tr-md" />
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-l-2 border-amber-600 rounded-tl-sm sm:rounded-tl-md" />
            <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-r-2 border-amber-600 rounded-br-sm sm:rounded-br-md" />
            <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-l-2 border-amber-600 rounded-bl-sm sm:rounded-bl-md" />

            {/* Bismillah Header */}
            <div className="w-full flex items-center justify-center gap-1.5 sm:gap-2 pt-0.5 shrink-0">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
              <span className="font-scheherazade text-xs sm:text-base font-bold text-amber-900 px-2 sm:px-3 leading-none">
                بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-400 to-transparent" />
            </div>

            {/* Couple Calligraphy Centerpiece & Poem */}
            <div className="my-auto py-1 sm:py-2 flex flex-col items-center justify-center w-full">
              <span className="font-scheherazade text-2xl sm:text-4xl md:text-5xl font-bold text-amber-950 block leading-tight tracking-wide drop-shadow-sm my-0.5">
                {data.brideName} & {data.groomName}
              </span>
              <p className="text-[11px] sm:text-xs text-[#4D7C0F] font-bold font-amiri leading-normal mt-0.5">
                {data.invitationTitle || 'به نام پیوند دهنده جان‌ها و دل‌ها'}
              </p>
              {data.poem?.verse1 && (
                <div className="mt-1 sm:mt-1.5 px-1">
                  <p className="text-[10px] sm:text-xs text-stone-700 font-amiri italic max-w-[320px] sm:max-w-[380px] mx-auto leading-relaxed">
                    «{data.poem.verse1}
                    <br />
                    {data.poem.verse2}»
                  </p>
                </div>
              )}
            </div>

            {/* Date, Time & Venue Details Banner (Right: Venue/Hall | Left: Date/Time) */}
            <div className="w-full pt-1.5 sm:pt-2 border-t border-amber-300/80 flex items-center justify-between gap-2 text-stone-900 shrink-0">
              {/* Right Side (RTL Start): Venue Name (Top) & Salon Name (Bottom) */}
              <div className="flex flex-col items-start text-right min-w-0 flex-1">
                <span className="text-[10px] sm:text-xs font-bold font-amiri text-amber-950 flex items-center gap-1 truncate max-w-full">
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 shrink-0" />
                  {data.venue.name} {data.venue.city ? `(${data.venue.city})` : ''}
                </span>
                {data.venue.hall && (
                  <span className="text-[9px] sm:text-[11px] font-bold font-amiri text-[#4D7C0F] pr-4 truncate max-w-full">
                    {data.venue.hall}
                  </span>
                )}
              </div>

              {/* Left Side (RTL End): Date (Top) & Time (Bottom) */}
              <div className="flex flex-col items-end text-left shrink-0">
                <span className="text-[10px] sm:text-xs font-bold font-vazir text-amber-950 flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 shrink-0" />
                  {data.solarDate.dayOfWeek} {data.solarDate.day} {data.solarDate.month} {data.solarDate.year}
                </span>
                <span className="text-[9px] sm:text-[11px] font-bold font-cinzel text-amber-800 flex items-center gap-1 pl-4">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 shrink-0" />
                  {data.eventTime}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ================= 3. GRAND WAX SEAL OPENING BUTTON AT THE BOTTOM ================= */}
      <div className="w-full max-w-lg flex flex-col items-center justify-center shrink-0 pb-1.5 sm:pb-3 z-30 min-h-[58px]">
        <AnimatePresence>
          {!sealBroken && (
            <motion.div
              key="wax-seal-button"
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{
                scale: [1, 1.25, 0],
                opacity: 0,
                y: 15
              }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center gap-1 w-full px-2"
            >
              <motion.button
                id="break-seal-btn"
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOpenEnvelope}
                className="group relative w-full max-w-sm sm:max-w-md flex items-center justify-between gap-2.5 sm:gap-3.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl sm:rounded-full bg-white/95 hover:bg-white text-stone-900 border-2 border-amber-400 shadow-[0_8px_30px_rgba(217,119,6,0.35)] hover:shadow-[0_12px_40px_rgba(217,119,6,0.5)] ring-2 ring-amber-400/60 ring-offset-2 ring-offset-amber-50 cursor-pointer transition-all overflow-hidden gold-sheen"
                title="برای بازگشایی دعوت‌نامه لمس کنید"
              >
                {/* Subtle Background Sheen */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-200/40 via-amber-100/20 to-amber-200/40 pointer-events-none" />

                {/* Right Side (RTL): 3D Wax Seal Badge styled matching the settings */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 z-10">
                  {/* Real 3D Wax Seal Icon with Pulsing Halo */}
                  <div className="relative shrink-0">
                    <div className="absolute -inset-1.5 rounded-full bg-amber-400/40 blur-md animate-pulse pointer-events-none" />
                    <div
                      className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-white/90 p-0.5 flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6 ${getSealColorClasses(
                        sealColor
                      )}`}
                    >
                      <div className="w-full h-full rounded-full border border-white/50 flex items-center justify-center shadow-inner overflow-hidden relative">
                        {/* Upper highlight arc */}
                        <div className="absolute top-0 inset-x-1 h-1/3 bg-white/30 rounded-full blur-[0.5px] pointer-events-none" />
                        {renderSealIcon()}
                      </div>
                    </div>
                  </div>

                  {/* Text Details */}
                  <div className="text-right min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold font-vazir text-stone-900 truncate group-hover:text-amber-700 transition-colors">
                        {data.waxSeal?.sealText || 'بازگشایی دعوت‌نامه'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px] sm:text-[11px] shrink-0 animate-pulse flex items-center gap-1 shadow-sm">
                        <span>لمس کنید</span>
                        <motion.span
                          animate={{ y: [0, -2, 0] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        >
                          👆
                        </motion.span>
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-medium text-stone-600 truncate block font-vazir mt-0.5">
                      {guideText}
                    </span>
                  </div>
                </div>

                {/* Left Side (RTL): Action Cue Heart */}
                <div className="flex items-center gap-1.5 shrink-0 z-10 pr-1 pl-0.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-100 group-hover:bg-rose-100 flex items-center justify-center transition-colors shadow-sm border border-amber-300">
                    <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-800 group-hover:text-rose-600 group-hover:scale-110 transition-all" />
                  </div>
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

