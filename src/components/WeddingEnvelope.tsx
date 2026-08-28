import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { WeddingCardData, SealColor } from '../types';
import { Sparkles, Calendar, Clock, MapPin, Heart, Crown, Flower2, Bird, ArrowUp } from 'lucide-react';
import { weddingAudio, getEffectivePlaylist } from '../utils/audioSynth';

interface Props {
  data: WeddingCardData;
  onOpen: () => void;
  isOpened: boolean;
  isAdminAuthenticated?: boolean;
}

type AnimationPhase =
  | 'idle_open'
  | 'card_sliding_out'
  | 'card_expanding'
  | 'completed';

export default function WeddingEnvelope({
  data,
  onOpen,
  isAdminAuthenticated,
}: Props) {
  const [phase, setPhase] = useState<AnimationPhase>('idle_open');
  const [isOpening, setIsOpening] = useState(false);
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 400
  );
  const [isLandscape, setIsLandscape] = useState(() =>
    typeof window !== 'undefined'
      ? window.innerWidth > window.innerHeight && window.innerHeight < 650
      : false
  );

  const isDesktop = windowWidth >= 1024;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  // Monitor orientation & window dimensions for perfect scaling across rotate & resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setIsLandscape(
        window.innerWidth > window.innerHeight && window.innerHeight < 650
      );
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Prevent scrollbar and scrolling in envelope view mode
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverscroll = document.body.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overscrollBehavior = originalBodyOverscroll;
    };
  }, []);

  const getSealColorClasses = (color?: SealColor) => {
    switch (color) {
      case 'emerald':
        return 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-950 text-emerald-100 border-emerald-300 shadow-[0_8px_30px_rgba(16,185,129,0.55)]';
      case 'navy':
        return 'bg-gradient-to-br from-sky-600 via-blue-800 to-indigo-950 text-sky-100 border-sky-300 shadow-[0_8px_30px_rgba(59,130,246,0.55)]';
      case 'red':
        return 'bg-gradient-to-br from-red-500 via-rose-700 to-rose-950 text-rose-100 border-rose-300 shadow-[0_8px_30px_rgba(239,68,68,0.55)]';
      case 'burgundy':
        return 'bg-gradient-to-br from-rose-800 via-rose-950 to-stone-950 text-rose-100 border-rose-300 shadow-[0_8px_30px_rgba(190,18,60,0.55)]';
      case 'rose_gold':
        return 'bg-gradient-to-br from-rose-300 via-pink-500 to-rose-700 text-rose-950 border-rose-200 shadow-[0_8px_30px_rgba(244,114,182,0.55)]';
      case 'silver':
        return 'bg-gradient-to-br from-slate-100 via-slate-300 to-slate-600 text-slate-900 border-slate-200 shadow-[0_8px_30px_rgba(148,163,184,0.55)]';
      case 'black':
        return 'bg-gradient-to-br from-stone-700 via-stone-900 to-black text-amber-300 border-stone-500 shadow-[0_8px_30px_rgba(0,0,0,0.65)]';
      case 'gold':
      default:
        return 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 text-amber-950 border-amber-200 shadow-[0_8px_32px_rgba(245,158,11,0.6)]';
    }
  };

  // High-performance celebration sparkles
  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 85,
        origin: { y: 0.48 },
        colors: ['#D4AF37', '#FFE082', '#FACC15', '#FDA4AF', '#FFFFFF', '#4D7C0F'],
        ticks: 140,
        gravity: 0.85,
        scalar: 1.05,
        disableForReducedMotion: true,
      });

      setTimeout(() => {
        confetti({
          particleCount: 30,
          angle: 60,
          spread: 50,
          origin: { x: 0.18, y: 0.45 },
          colors: ['#D4AF37', '#FFD700', '#F472B6'],
          ticks: 110,
          gravity: 0.9,
        });
        confetti({
          particleCount: 30,
          angle: 120,
          spread: 50,
          origin: { x: 0.82, y: 0.45 },
          colors: ['#D4AF37', '#FFD700', '#F472B6'],
          ticks: 110,
          gravity: 0.9,
        });
      }, 160);
    } catch {
      // Ignore confetti errors
    }
  };

  const handleOpenCard = () => {
    if (isOpening || phase !== 'idle_open') return;
    setIsOpening(true);

    const isFirstTimeOpenThisSession = !weddingAudio.getHasOpenedEnvelope();
    weddingAudio.markEnvelopeOpened();

    // Start ambient wedding soundtrack smoothly
    if (data.music?.enabled) {
      if (isFirstTimeOpenThisSession) {
        weddingAudio.setUserMuted(false);
        const playlist = getEffectivePlaylist(data.music);
        if (playlist.length > 0) {
          const randomIndex = Math.floor(Math.random() * playlist.length);
          weddingAudio.setCurrentTrackIndex(randomIndex);
          weddingAudio.playTrack(playlist[randomIndex]);
        } else if (data.music.audioUrl) {
          weddingAudio.playCustomAudio(data.music.audioUrl);
        } else {
          weddingAudio.playPreset(data.music.synthPreset);
        }
      } else {
        if (!weddingAudio.getIsPlaying() && !weddingAudio.isUserMuted()) {
          const runningTrack = weddingAudio.getCurrentTrack();
          if (runningTrack) {
            weddingAudio.playTrack(runningTrack);
          } else if (data.music.audioUrl) {
            weddingAudio.playCustomAudio(data.music.audioUrl);
          } else {
            weddingAudio.playPreset(data.music.synthPreset);
          }
        }
      }
    }

    // Step 1: Trigger celebration sparkles & start sliding card upwards
    triggerCelebration();
    setPhase('card_sliding_out');

    // Step 2: Card expands to hero full view while envelope gracefully fades away
    setTimeout(() => {
      setPhase('card_expanding');
    }, 750);

    // Step 3: Complete transition to interactive wedding card
    setTimeout(() => {
      setPhase('completed');
      onOpen();
    }, 1350);
  };

  const hasMusicFooter = data.music?.enabled && data.sectionVisibility?.musicPlayer !== false;
  const ribbonStyle = data.waxSeal?.ribbonStyle || 'none';
  const sealColor = data.waxSeal?.color || 'gold';
  const iconType = data.waxSeal?.iconType || 'rings';
  const monogram = data.waxSeal?.monogram || 'P & N';
  const guideText = data.waxSeal?.guideText || 'برای بیرون کشیدن و مشاهده کارت دعوت لمس کنید';

  const renderSealIcon = () => {
    switch (iconType) {
      case 'monogram':
        return (
          <span className="font-cinzel text-[10px] sm:text-xs md:text-sm font-bold tracking-wider text-current drop-shadow-sm leading-none select-none text-center">
            {monogram}
          </span>
        );
      case 'heart':
        return <Heart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 fill-current text-current drop-shadow-sm" />;
      case 'crown':
        return <Crown className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 fill-current text-current drop-shadow-sm" />;
      case 'floral':
        return <Flower2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-current drop-shadow-sm stroke-[2]" />;
      case 'bird':
        return <Bird className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-current drop-shadow-sm stroke-[2]" />;
      case 'rings':
      default:
        return (
          <div className="flex items-center -space-x-1.5 sm:-space-x-2 my-auto drop-shadow-sm">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-full border-[2px] border-current relative flex items-center justify-center shrink-0">
              <div className="absolute -top-0.5 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white shadow-xs ring-1 ring-amber-300" />
            </div>
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-full border-[2px] border-current relative flex items-center justify-center shrink-0">
              <div className="absolute -top-0.5 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white shadow-xs ring-1 ring-amber-300" />
            </div>
          </div>
        );
    }
  };

  const isCardExpanded = phase === 'card_expanding' || phase === 'completed';

  return (
    <div
      id="envelope-container"
      className={`fixed inset-x-0 overflow-hidden select-none flex flex-col justify-between items-center px-3 sm:px-6 md:px-8 py-2 sm:py-3 bg-gradient-to-b from-[#FFFFFF] via-[#FAF9F5] to-[#F5F3EB] z-30 transition-all duration-300 ${
        isAdminAuthenticated ? 'top-12 sm:top-14' : 'top-0'
      } ${hasMusicFooter ? 'bottom-[54px] sm:bottom-[68px]' : 'bottom-0'}`}
    >
      {/* Ambient luxury pearl lighting & subtle golden aura */}
      <div className="absolute inset-0 pointer-events-none opacity-60 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-100/40 via-white/70 to-transparent" />

      {/* ========================================================================= */}
      {/* TOP HEADER: BADGE & FAMILY GREETING (COMPACT & BALANCED) */}
      {/* ========================================================================= */}
      <motion.div
        animate={{
          opacity: isCardExpanded ? 0 : 1,
          y: isCardExpanded ? -30 : 0,
        }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md flex flex-col items-center justify-center text-center z-30 shrink-0 px-2 mb-1 sm:mb-2"
      >
        <div className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold shadow-xs backdrop-blur-md border bg-white/95 border-amber-300 text-amber-950 mb-1">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 animate-pulse shrink-0" />
          <span className="font-vazir">کارت دعوت رسمی مراسم عروسی</span>
        </div>

        {/* Families greeting */}
        <p className="text-xs sm:text-sm font-semibold text-stone-700 font-amiri leading-normal">
          خانواده‌های محترم {data.brideFamily} و {data.groomFamily}
        </p>
        <h1 className="text-sm xs:text-base sm:text-lg md:text-xl font-black font-amiri tracking-wide text-stone-900 mt-0.5 leading-tight">
          جشن پیوند خجسته {data.brideName} و {data.groomName}
        </h1>
      </motion.div>

      {/* ========================================================================= */}
      {/* MAIN ENVELOPE 3D STAGE CONTAINER (CAPPED AT TABLET WIDTH MAX) */}
      {/* ========================================================================= */}
      <div className="w-full max-w-md flex-1 min-h-0 z-20 flex flex-col items-center justify-center my-auto py-1 sm:py-2">
        {/* Floating Call to Action Badge above envelope */}
        <AnimatePresence>
          {phase === 'idle_open' && data.envelopeOpenBtnTop !== false && !isLandscape && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{
                opacity: 1,
                y: [0, -3, 0],
                scale: [1, 1.02, 1],
              }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{
                y: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
                scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
                opacity: { duration: 0.2 },
              }}
              onClick={handleOpenCard}
              className="z-30 mb-2 sm:mb-2.5 px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-white via-amber-50 to-white text-stone-900 font-bold text-[11px] sm:text-xs shadow-[0_4px_15px_rgba(217,119,6,0.18)] border border-amber-300 flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-amber-600"></span>
              </span>
              <span className="font-vazir font-extrabold tracking-wide text-amber-950">
                برای مشاهده و بیرون کشیدن کارت لمس کنید
              </span>
              <motion.span
                animate={{
                  y: [0, -2, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  ease: 'easeInOut',
                }}
                className="text-xs sm:text-sm inline-block"
              >
                💌
              </motion.span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* LUXURY WEDDING ENVELOPE BOX (CAPPED WIDTH: max-w-[430px]) */}
        {/* ========================================================================= */}
        <div
          className="relative w-full max-w-[315px] xs:max-w-[345px] sm:max-w-[390px] md:max-w-[430px] h-[215px] xs:h-[230px] sm:h-[255px] md:h-[275px] mx-auto flex items-end justify-center cursor-pointer select-none"
          onClick={handleOpenCard}
        >
          {/* ========================================================================= */}
          {/* 1. OPEN TRIANGULAR TOP FLAP (درب باز شده مثلثی پاکت سفید با آستر طلایی) */}
          {/* ========================================================================= */}
          <motion.div
            animate={
              isCardExpanded
                ? { opacity: 0, y: 35, scale: 0.9 }
                : phase === 'card_sliding_out'
                ? { opacity: 0.9, y: 10 }
                : { opacity: 1, y: 0 }
            }
            transition={{ duration: 0.4 }}
            className="absolute -top-[36%] sm:-top-[38%] md:-top-[40%] inset-x-0 h-[64%] sm:h-[68%] md:h-[70%] z-[5] pointer-events-none"
          >
            {/* Triangular Flap Shape pointing UP */}
            <div
              className="w-full h-full bg-gradient-to-b from-white via-[#FAF9F6] to-[#F1EEE8] shadow-sm relative"
              style={{
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              }}
            >
              {/* Luxury interior damask lining on the flap */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#d4af37_1.2px,transparent_1.2px)] [background-size:12px_12px]" />

              {/* Gold foil border rim on the triangle */}
              <div
                className="absolute inset-0 border-t-2 border-amber-300 pointer-events-none"
                style={{
                  clipPath: 'polygon(50% 5%, 3% 100%, 97% 100%)',
                }}
              />

              {/* Inner delicate gold line */}
              <div
                className="absolute inset-0 border-t border-amber-400/50 pointer-events-none"
                style={{
                  clipPath: 'polygon(50% 14%, 10% 100%, 90% 100%)',
                }}
              />

              {/* Subtle top apex pearlescent glow */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white blur-[3px]" />
            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* 2. ENVELOPE BACK PANEL (دیواره پشتی پاکت سفید) */}
          {/* ========================================================================= */}
          <motion.div
            animate={
              isCardExpanded
                ? { opacity: 0, y: 50, scale: 0.88 }
                : phase === 'card_sliding_out'
                ? { opacity: 0.92, y: 12 }
                : { opacity: 1, y: 0 }
            }
            transition={{ duration: 0.45 }}
            className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-white via-[#FAF8F5] to-[#EFECE5] border-2 border-amber-300/80 shadow-[0_20px_50px_rgba(0,0,0,0.08)] z-[6]"
          >
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl opacity-15 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:12px_12px]" />
          </motion.div>

          {/* ========================================================================= */}
          {/* 3. INVITATION CARD (کارت دعوت واقعی که داخل پاکت قرار دارد) */}
          {/* ========================================================================= */}
          <motion.div
            animate={
              phase === 'card_expanding' || phase === 'completed'
                ? {
                    y: -15,
                    scale: 1.02,
                    opacity: 1,
                    bottom: '8px',
                    width: '98%',
                    height: 'auto',
                    minHeight: '380px',
                    boxShadow:
                      '0 25px 70px -10px rgba(217, 119, 6, 0.4), 0 0 40px rgba(250, 204, 21, 0.3)',
                    zIndex: 50,
                  }
                : phase === 'card_sliding_out'
                ? {
                    y: isDesktop ? -190 : isTablet ? -170 : -135,
                    scale: 1.0,
                    opacity: 1,
                    bottom: '14px',
                    width: '94%',
                    height: '92%',
                    boxShadow:
                      '0 20px 45px -8px rgba(217, 119, 6, 0.3), 0 0 30px rgba(250, 204, 21, 0.25)',
                    zIndex: 40,
                  }
                : {
                    // 10px more inside envelope in idle state
                    y: isDesktop ? -100 : isTablet ? -90 : -70,
                    scale: 0.97,
                    opacity: 1,
                    bottom: '10px',
                    width: '94%',
                    height: '92%',
                    boxShadow: '0 10px 30px -4px rgba(0, 0, 0, 0.12), 0 0 20px rgba(245, 158, 11, 0.15)',
                    zIndex: 10,
                  }
            }
            transition={{
              duration: phase === 'card_expanding' ? 0.55 : phase === 'card_sliding_out' ? 0.6 : 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute left-1/2 -translate-x-1/2 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#FFFFFF] via-[#FFFDF9] to-[#FAF8F2] border-2 border-amber-400/90 p-2.5 sm:p-4 flex flex-col justify-between items-center text-center select-none overflow-hidden group hover:border-amber-400"
            style={{ willChange: 'transform, opacity' }}
          >
            {/* Card Filigree Corners & Inner Golden Frames */}
            <div className="absolute inset-1 sm:inset-2 border border-amber-300/60 rounded-xl sm:rounded-2xl pointer-events-none" />
            <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 w-2.5 h-2.5 sm:w-4 sm:h-4 border-t-2 border-r-2 border-amber-500 rounded-tr-xs" />
            <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 w-2.5 h-2.5 sm:w-4 sm:h-4 border-t-2 border-l-2 border-amber-500 rounded-tl-xs" />
            <div className="absolute bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5 w-2.5 h-2.5 sm:w-4 sm:h-4 border-b-2 border-r-2 border-amber-500 rounded-br-xs" />
            <div className="absolute bottom-1.5 left-1.5 sm:bottom-2.5 sm:left-2.5 w-2.5 h-2.5 sm:w-4 sm:h-4 border-b-2 border-l-2 border-amber-500 rounded-bl-xs" />

            {/* Bismillah Header */}
            <div className="w-full flex items-center justify-center gap-1.5 sm:gap-2 pt-0.5 shrink-0">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
              <span className="font-scheherazade text-[11px] sm:text-sm md:text-base font-bold text-amber-900 px-1.5 sm:px-3 leading-none">
                بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-400 to-transparent" />
            </div>

            {/* Couple Calligraphy Centerpiece & Title (Prominently displayed above pocket) */}
            <div className="my-auto py-0.5 sm:py-1 flex flex-col items-center justify-center w-full">
              <span className="font-scheherazade text-xl xs:text-2xl sm:text-3xl md:text-4xl font-black text-stone-900 block leading-tight tracking-wide drop-shadow-sm my-0.5 sm:my-1">
                {data.brideName} & {data.groomName}
              </span>
              <p className="text-[10px] sm:text-xs text-amber-900 font-bold font-amiri leading-tight mt-0.5">
                {data.invitationTitle || 'به نام پیوند دهنده جان‌ها و دل‌ها'}
              </p>
              {data.poem?.verse1 && isCardExpanded && (
                <div className="mt-1.5 sm:mt-2 px-1">
                  <p className="text-[11px] sm:text-xs text-stone-600 font-amiri italic max-w-xs mx-auto leading-relaxed">
                    «{data.poem.verse1}
                    <br />
                    {data.poem.verse2}»
                  </p>
                </div>
              )}
            </div>

            {/* Date, Time & Venue Details Banner (Hidden inside pocket when idle, revealed upon expand) */}
            <div className="w-full pt-1 sm:pt-2 border-t border-amber-200/80 flex items-center justify-between gap-1.5 sm:gap-2 text-stone-900 shrink-0">
              {/* Right Side: Venue */}
              <div className="flex flex-col items-start text-right min-w-0 flex-1">
                <span className="text-[9px] sm:text-[11px] font-bold font-amiri text-stone-900 flex items-center gap-1 truncate max-w-full">
                  <MapPin className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">{data.venue.name}</span>
                </span>
                {data.venue.city && (
                  <span className="text-[8px] sm:text-[10px] font-bold font-amiri text-stone-600 pr-3 sm:pr-4 truncate max-w-full">
                    {data.venue.city}
                  </span>
                )}
              </div>

              {/* Left Side: Date & Time */}
              <div className="flex flex-col items-end text-left shrink-0">
                <span className="text-[9px] sm:text-[11px] font-bold font-vazir text-stone-900 flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-amber-600 shrink-0" />
                  <span>{data.solarDate.day} {data.solarDate.month} {data.solarDate.year}</span>
                </span>
                <span className="text-[8px] sm:text-[10px] font-bold font-cinzel text-amber-900 flex items-center gap-1 pl-3 sm:pl-4">
                  <Clock className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-amber-600 shrink-0" />
                  <span>{data.eventTime}</span>
                </span>
              </div>
            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* 4. ENVELOPE FRONT POCKET (جیب جلویی پاکت کاملاً سفید و طلاکوب) */}
          {/* ========================================================================= */}
          <motion.div
            animate={
              isCardExpanded
                ? { opacity: 0, y: 60, scale: 0.88 }
                : phase === 'card_sliding_out'
                ? { opacity: 0.9, y: 12 }
                : { opacity: 1, y: 0 }
            }
            transition={{ duration: 0.45 }}
            className="absolute inset-x-0 bottom-0 h-[calc(56%+10px)] rounded-b-2xl sm:rounded-b-3xl bg-gradient-to-br from-white via-[#FCFBF8] to-[#F3F0E8] border-2 border-amber-300/90 shadow-[0_20px_45px_rgba(0,0,0,0.1)] overflow-visible z-[20]"
            style={{ willChange: 'transform, opacity' }}
          >
            {/* Elegant pearl white watermark texture on pocket */}
            <div className="absolute inset-0 rounded-b-2xl sm:rounded-b-3xl opacity-18 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

            {/* Deep V-Neck Cutout at the top of the pocket (دهانه باز پاکت سفید) */}
            <div
              className="absolute -top-5 sm:-top-7 md:-top-8 inset-x-0 h-6 sm:h-8 md:h-9 bg-gradient-to-b from-transparent via-[#FAF9F5] to-white pointer-events-none"
              style={{
                clipPath: 'polygon(0% 100%, 50% 10%, 100% 100%)',
              }}
            />

            {/* Gold trim along pocket top rim */}
            <div
              className="absolute -top-4 sm:-top-6 md:-top-7 inset-x-0 h-5 sm:h-7 md:h-8 border-t-2 border-amber-300/90 pointer-events-none"
              style={{
                clipPath: 'polygon(0% 100%, 50% 20%, 100% 100%)',
              }}
            />

            {/* Inner Gold Foil Frame on Pocket */}
            <div className="absolute inset-1.5 sm:inset-2.5 md:inset-3 border border-amber-300/50 rounded-xl sm:rounded-2xl pointer-events-none" />

            {/* Royal Gold Filigree Crest / Watermark on white pocket */}
            <div className="absolute inset-x-0 bottom-1.5 sm:bottom-2.5 text-center pointer-events-none opacity-40">
              <span className="font-amiri text-[10px] sm:text-xs font-bold text-amber-900 tracking-widest">
                کارت دعوت اختصاصی
              </span>
            </div>

            {/* Optional Ribbon Decoration across envelope pocket */}
            {ribbonStyle !== 'none' && (
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-[25] pointer-events-none flex items-center justify-center">
                <div
                  className={`w-full h-5 sm:h-7 shadow-xs flex items-center justify-center ${
                    ribbonStyle === 'satin_red'
                      ? 'bg-gradient-to-r from-red-800 via-rose-600 to-red-800 border-y border-rose-400/60'
                      : ribbonStyle === 'emerald_velvet'
                      ? 'bg-gradient-to-r from-emerald-900 via-emerald-700 to-emerald-900 border-y border-emerald-400/60'
                      : ribbonStyle === 'royal_navy'
                      ? 'bg-gradient-to-r from-sky-950 via-blue-800 to-sky-950 border-y border-sky-400/60'
                      : 'bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 border-y border-amber-200/70'
                  }`}
                >
                  <div className="w-full h-0.5 border-t border-dashed border-white/50" />
                </div>
                {ribbonStyle === 'gold_cross' && (
                  <div className="absolute inset-y-0 w-5 sm:w-7 bg-gradient-to-b from-amber-600 via-amber-400 to-amber-600 border-x border-amber-200/70 shadow-xs flex items-center justify-center">
                    <div className="h-full w-0.5 border-r border-dashed border-white/50" />
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* 5. 3D WAX SEAL CREST EMBEDDED ON THE WHITE POCKET */}
            {/* ========================================================================= */}
            <AnimatePresence>
              {phase === 'idle_open' && (
                <motion.div
                  key="open-envelope-seal"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{
                    scale: 1.35,
                    opacity: 0,
                    filter: 'blur(4px)',
                    transition: { duration: 0.2, ease: 'easeOut' },
                  }}
                  className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 z-[30] cursor-pointer group"
                  onClick={handleOpenCard}
                >
                  {/* Pulsing ambient halo around wax seal */}
                  <div className="absolute -inset-2 rounded-full bg-amber-400/35 blur-md animate-pulse pointer-events-none" />

                  {/* 3D Wax Seal Body */}
                  <div
                    className={`relative w-12 h-12 sm:w-15 sm:h-15 md:w-16 md:h-16 rounded-full border-2 border-white/95 p-0.5 flex items-center justify-center shadow-[0_8px_30px_rgba(217,119,6,0.5)] transition-transform group-hover:scale-110 group-hover:rotate-6 active:scale-95 ${getSealColorClasses(
                      sealColor
                    )}`}
                  >
                    <div className="w-full h-full rounded-full border border-white/50 flex items-center justify-center shadow-inner overflow-hidden relative">
                      {/* Glossy specular highlight */}
                      <div className="absolute top-0 inset-x-1 h-1/3 bg-white/40 rounded-full blur-[0.5px] pointer-events-none" />
                      {renderSealIcon()}
                    </div>
                  </div>

                  {/* Gentle Touch Indicator Badge */}
                  {!isLandscape && (
                    <div className="absolute -bottom-5 sm:-bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 sm:px-2.5 py-0.5 rounded-full bg-stone-900/90 text-amber-200 text-[8px] sm:text-[10px] font-vazir shadow-xs backdrop-blur-xs flex items-center gap-1 border border-amber-400/30">
                      <span>لمس کنید</span>
                      <ArrowUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-bounce text-amber-300" />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. GRAND OPEN ACTION BAR AT THE BOTTOM (CAPPED AT TABLET WIDTH) */}
      {/* ========================================================================= */}
      <div className="w-full max-w-md flex flex-col items-center justify-center shrink-0 z-30 min-h-[46px] sm:min-h-[58px] mt-1 sm:mt-2">
        <AnimatePresence>
          {phase === 'idle_open' && data.envelopeOpenBtnBottom !== false && (
            <motion.div
              key="wax-seal-button"
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{
                scale: [1, 1.15, 0],
                opacity: 0,
                y: 15,
              }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-1 w-full px-2"
            >
              <motion.button
                id="break-seal-btn"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleOpenCard}
                className="group relative w-full flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl sm:rounded-full bg-white hover:bg-white text-stone-900 border-2 border-amber-300 shadow-[0_6px_25px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_35px_rgba(217,119,6,0.22)] ring-2 ring-amber-300/40 cursor-pointer transition-all overflow-hidden gold-sheen"
                title="برای بیرون کشیدن و مشاهده کارت دعوت لمس کنید"
              >
                {/* Subtle Background Sheen */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-50/50 via-white to-amber-50/50 pointer-events-none" />

                {/* Right Side (RTL): 3D Wax Seal Badge */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 z-10">
                  <div className="relative shrink-0">
                    <div className="absolute -inset-1 rounded-full bg-amber-400/25 blur-xs animate-pulse pointer-events-none" />
                    <div
                      className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/95 p-0.5 flex items-center justify-center shadow-xs transition-transform group-hover:rotate-6 ${getSealColorClasses(
                        sealColor
                      )}`}
                    >
                      <div className="w-full h-full rounded-full border border-white/50 flex items-center justify-center shadow-inner overflow-hidden relative">
                        <div className="absolute top-0 inset-x-1 h-1/3 bg-white/30 rounded-full blur-[0.5px] pointer-events-none" />
                        {renderSealIcon()}
                      </div>
                    </div>
                  </div>

                  {/* Text Details */}
                  <div className="text-right min-w-0">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <span className="text-xs sm:text-sm font-bold font-vazir text-stone-900 truncate group-hover:text-amber-700 transition-colors">
                        {data.waxSeal?.sealText || 'مشاهده کارت دعوت'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-stone-950 font-black text-[9px] sm:text-[10px] shrink-0 flex items-center gap-0.5 shadow-2xs">
                        <span>لمس کنید</span>
                        <motion.span
                          animate={{ y: [0, -2, 0] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        >
                          👆
                        </motion.span>
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-stone-600 truncate block font-vazir mt-0.5">
                      {guideText}
                    </span>
                  </div>
                </div>

                {/* Left Side (RTL): Action Cue Heart */}
                <div className="flex items-center gap-1 shrink-0 z-10 pr-1 pl-0.5">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-50 group-hover:bg-rose-50 flex items-center justify-center transition-colors shadow-2xs border border-amber-200">
                    <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-800 group-hover:text-rose-600 group-hover:scale-110 transition-all" />
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

