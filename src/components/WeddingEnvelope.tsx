import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { WeddingCardData, SealColor } from '../types';
import { Sparkles, Calendar, Clock, MapPin, Heart, Crown, Flower2, Bird, ArrowUp } from 'lucide-react';
import { weddingAudio, getEffectivePlaylist } from '../utils/audioSynth';
import { getTheme } from '../data/themes';

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

  const currentTheme = getTheme(data.themeId, data.colorMode);

  // Lock body scroll on envelope screen for optimal touch feel
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

    // 1. Start ambient wedding soundtrack smoothly
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

    // Step 2: Card expands to hero full screen while envelope gracefully fades away (750ms)
    setTimeout(() => {
      setPhase('card_expanding');
    }, 750);

    // Step 3: Complete transition to interactive wedding card (1350ms)
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

  const isCardExpanded = phase === 'card_expanding' || phase === 'completed';

  return (
    <div
      id="envelope-container"
      className={`fixed inset-0 w-full h-[100dvh] overflow-hidden select-none flex flex-col justify-between items-center px-2.5 sm:px-6 overscroll-none touch-none bg-gradient-to-b ${currentTheme.primaryBg} z-30 transition-all duration-300 ${
        isAdminAuthenticated ? 'pt-14 sm:pt-16' : 'pt-2 sm:pt-4'
      } ${hasMusicFooter ? 'pb-18 sm:pb-22' : 'pb-2 sm:pb-4'}`}
      style={{ willChange: 'transform, opacity' }}
    >
      {/* Ambient luxury lighting & soft golden aura */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-200/30 via-white/40 to-transparent" />

      {/* Top Header Badge & Families Title */}
      <motion.div
        animate={{
          opacity: isCardExpanded ? 0 : 1,
          y: isCardExpanded ? -35 : 0,
        }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg flex flex-col items-center justify-center text-center z-30 shrink-0 pt-1 sm:pt-2 px-2"
      >
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] sm:text-xs shadow-sm backdrop-blur-md border bg-white/95 border-amber-300/80 text-amber-900 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
          <span className="font-bold font-vazir">کارت دعوت رسمی مراسم عروسی</span>
        </div>

        {/* Families greeting */}
        <p className="text-[11px] sm:text-xs font-medium text-stone-700 font-amiri leading-normal">
          خانواده‌های محترم {data.brideFamily} و {data.groomFamily}
        </p>
        <h1 className="text-base sm:text-xl md:text-2xl font-bold font-amiri tracking-wide text-stone-900 mt-0.5 leading-snug">
          جشن پیوند خجسته {data.brideName} و {data.groomName}
        </h1>
      </motion.div>

      {/* Interactive 3D Stage Container with White Luxury Wedding Envelope */}
      <div className="flex-1 w-full max-w-xl z-20 flex flex-col items-center justify-center shrink-0 min-h-0 py-1 sm:py-2">
        {/* Floating Animated Call to Action Banner above the envelope */}
        <AnimatePresence>
          {phase === 'idle_open' && data.envelopeOpenBtnTop !== false && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{
                opacity: 1,
                y: [0, -4, 0],
                scale: [1, 1.02, 1],
              }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{
                y: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
                scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
                opacity: { duration: 0.25 },
              }}
              onClick={handleOpenCard}
              className="z-30 mb-2 sm:mb-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-white via-amber-50 to-white text-stone-900 font-bold text-xs sm:text-sm shadow-[0_6px_20px_rgba(217,119,6,0.25)] border-2 border-amber-300/80 flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600"></span>
              </span>
              <span className="font-vazir font-extrabold tracking-wide text-amber-950">
                برای مشاهده و بیرون کشیدن کارت لمس کنید
              </span>
              <motion.span
                animate={{
                  y: [0, -3, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  ease: 'easeInOut',
                }}
                className="text-base inline-block"
              >
                💌
              </motion.span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* LUXURY PURE WHITE WEDDING ENVELOPE (پاکت فوق‌العاده شکیل، سفید صدفی، طلاکوب و با دربِ باز) */}
        {/* ========================================================================= */}
        <div
          className="relative w-full max-w-[340px] sm:max-w-[440px] md:max-w-[480px] h-[260px] sm:h-[310px] md:h-[330px] mx-auto flex items-end justify-center cursor-pointer select-none"
          onClick={handleOpenCard}
        >
          {/* ========================================================================= */}
          {/* 1. OPEN TRIANGULAR TOP FLAP - PURE WHITE (درب باز بالایی پاکت به رنگ سفید با آستر طلایی) */}
          {/* ========================================================================= */}
          <motion.div
            animate={
              isCardExpanded
                ? { opacity: 0, y: 40, scale: 0.9 }
                : phase === 'card_sliding_out'
                ? { opacity: 0.9, y: 10 }
                : { opacity: 1, y: 0 }
            }
            transition={{ duration: 0.45 }}
            className="absolute -top-16 sm:-top-22 inset-x-0 h-28 sm:h-36 z-[5] pointer-events-none"
          >
            {/* Triangular Flap Shape pointing UP */}
            <div
              className="w-full h-full bg-gradient-to-b from-white via-[#FAF9F6] to-[#F0EDE6] shadow-md relative"
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
                  clipPath: 'polygon(50% 6%, 4% 100%, 96% 100%)',
                }}
              />

              {/* Inner delicate gold line */}
              <div
                className="absolute inset-0 border-t border-amber-400/50 pointer-events-none"
                style={{
                  clipPath: 'polygon(50% 16%, 12% 100%, 88% 100%)',
                }}
              />

              {/* Subtle top apex pearlescent glow */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white blur-[3px]" />
            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* 2. ENVELOPE BACK PANEL - PURE PEARL WHITE (دیواره پشتی پاکت سفید) */}
          {/* ========================================================================= */}
          <motion.div
            animate={
              isCardExpanded
                ? { opacity: 0, y: 60, scale: 0.88 }
                : phase === 'card_sliding_out'
                ? { opacity: 0.92, y: 15 }
                : { opacity: 1, y: 0 }
            }
            transition={{ duration: 0.5 }}
            className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-white via-[#FAF8F5] to-[#EFECE6] border-2 border-amber-300/80 shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-[6]"
          >
            {/* Interior back lining texture */}
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl opacity-15 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:10px_10px]" />
          </motion.div>

          {/* ========================================================================= */}
          {/* 3. INVITATION CARD (کارت دعوت واقعی که داخل پاکت قرار دارد و بالای آن بیرون آمده) */}
          {/* ========================================================================= */}
          <motion.div
            animate={
              phase === 'card_expanding' || phase === 'completed'
                ? {
                    y: -30,
                    scale: 1.05,
                    opacity: 1,
                    bottom: '10px',
                    width: '100%',
                    maxWidth: '680px',
                    height: 'auto',
                    minHeight: '430px',
                    boxShadow:
                      '0 30px 80px -10px rgba(217, 119, 6, 0.45), 0 0 50px rgba(250, 204, 21, 0.35)',
                    zIndex: 50,
                  }
                : phase === 'card_sliding_out'
                ? {
                    y: -190,
                    scale: 1.0,
                    opacity: 1,
                    bottom: '20px',
                    width: '92%',
                    maxWidth: '430px',
                    height: '92%',
                    boxShadow:
                      '0 20px 45px -10px rgba(217, 119, 6, 0.3), 0 0 30px rgba(250, 204, 21, 0.25)',
                    zIndex: 40,
                  }
                : {
                    y: -65, // Card visibly peeking out of the open envelope mouth
                    scale: 0.94,
                    opacity: 1,
                    bottom: '18px',
                    width: '90%',
                    maxWidth: '420px',
                    height: '92%',
                    boxShadow: '0 8px 25px -4px rgba(0, 0, 0, 0.12)',
                    zIndex: 10,
                  }
            }
            transition={{
              duration: phase === 'card_expanding' ? 0.6 : phase === 'card_sliding_out' ? 0.65 : 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute left-1/2 -translate-x-1/2 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#FFFFFF] via-[#FFFDF9] to-[#FAF8F2] border-2 border-amber-400/90 p-3 sm:p-5 flex flex-col justify-between items-center text-center select-none overflow-hidden group hover:border-amber-400"
            style={{ willChange: 'transform, opacity' }}
          >
            {/* Card Filigree Corners & Inner Golden Frames */}
            <div className="absolute inset-1.5 sm:inset-2.5 border border-amber-300/60 rounded-xl sm:rounded-2xl pointer-events-none" />
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-r-2 border-amber-500 rounded-tr-sm" />
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-l-2 border-amber-500 rounded-tl-sm" />
            <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-r-2 border-amber-500 rounded-br-sm" />
            <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-l-2 border-amber-500 rounded-bl-sm" />

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
              <span className="font-scheherazade text-2xl sm:text-4xl md:text-5xl font-bold text-stone-900 block leading-tight tracking-wide drop-shadow-sm my-0.5">
                {data.brideName} & {data.groomName}
              </span>
              <p className="text-[11px] sm:text-xs text-[#4D7C0F] font-bold font-amiri leading-normal mt-0.5">
                {data.invitationTitle || 'به نام پیوند دهنده جان‌ها و دل‌ها'}
              </p>
              {data.poem?.verse1 && (
                <div className="mt-1 sm:mt-1.5 px-1">
                  <p className="text-[10px] sm:text-xs text-stone-600 font-amiri italic max-w-[320px] sm:max-w-[380px] mx-auto leading-relaxed">
                    «{data.poem.verse1}
                    <br />
                    {data.poem.verse2}»
                  </p>
                </div>
              )}
            </div>

            {/* Date, Time & Venue Details Banner */}
            <div className="w-full pt-1.5 sm:pt-2 border-t border-amber-200/80 flex items-center justify-between gap-2 text-stone-900 shrink-0">
              {/* Right Side: Venue */}
              <div className="flex flex-col items-start text-right min-w-0 flex-1">
                <span className="text-[10px] sm:text-xs font-bold font-amiri text-stone-900 flex items-center gap-1 truncate max-w-full">
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 shrink-0" />
                  {data.venue.name} {data.venue.city ? `(${data.venue.city})` : ''}
                </span>
                {data.venue.hall && (
                  <span className="text-[9px] sm:text-[11px] font-bold font-amiri text-[#4D7C0F] pr-4 truncate max-w-full">
                    {data.venue.hall}
                  </span>
                )}
              </div>

              {/* Left Side: Date & Time */}
              <div className="flex flex-col items-end text-left shrink-0">
                <span className="text-[10px] sm:text-xs font-bold font-vazir text-stone-900 flex items-center gap-1">
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

          {/* ========================================================================= */}
          {/* 4. ENVELOPE FRONT POCKET - PURE WHITE (جیب جلویی پاکت کاملاً سفید و طلاکوب) */}
          {/* ========================================================================= */}
          <motion.div
            animate={
              isCardExpanded
                ? { opacity: 0, y: 70, scale: 0.88 }
                : phase === 'card_sliding_out'
                ? { opacity: 0.9, y: 15 }
                : { opacity: 1, y: 0 }
            }
            transition={{ duration: 0.5 }}
            className="absolute inset-x-0 bottom-0 h-[65%] rounded-b-2xl sm:rounded-b-3xl bg-gradient-to-br from-white via-[#FCFBF8] to-[#F4F1EA] border-2 border-amber-300/90 shadow-[0_20px_50px_rgba(0,0,0,0.12)] overflow-visible z-[20]"
            style={{ willChange: 'transform, opacity' }}
          >
            {/* Elegant pearl white watermark texture on pocket */}
            <div className="absolute inset-0 rounded-b-2xl sm:rounded-b-3xl opacity-18 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

            {/* Deep V-Neck Cutout at the top of the pocket (دهانه باز پاکت سفید) */}
            <div
              className="absolute -top-6 sm:-top-8 inset-x-0 h-8 sm:h-10 bg-gradient-to-b from-transparent via-[#FAF9F5] to-white pointer-events-none"
              style={{
                clipPath: 'polygon(0% 100%, 50% 10%, 100% 100%)',
              }}
            />

            {/* Gold trim along pocket top rim */}
            <div
              className="absolute -top-5 sm:-top-7 inset-x-0 h-6 sm:h-8 border-t-2 border-amber-300/90 pointer-events-none"
              style={{
                clipPath: 'polygon(0% 100%, 50% 20%, 100% 100%)',
              }}
            />

            {/* Side Triangular Folds subtle shading */}
            <div
              className="absolute inset-0 bg-gradient-to-tr from-stone-200/40 to-transparent pointer-events-none rounded-bl-2xl"
              style={{ clipPath: 'polygon(0% 0%, 0% 100%, 50% 100%)' }}
            />
            <div
              className="absolute inset-0 bg-gradient-to-tl from-stone-200/40 to-transparent pointer-events-none rounded-br-2xl"
              style={{ clipPath: 'polygon(100% 0%, 100% 100%, 50% 100%)' }}
            />

            {/* Inner Gold Foil Frame on Pocket */}
            <div className="absolute inset-2 sm:inset-3 border border-amber-300/50 rounded-xl sm:rounded-2xl pointer-events-none" />

            {/* Royal Gold Filigree Crest / Watermark on white pocket */}
            <div className="absolute inset-x-0 bottom-2.5 sm:bottom-3 text-center pointer-events-none opacity-40">
              <span className="font-amiri text-[11px] sm:text-xs font-bold text-amber-900 tracking-widest">
                کارت دعوت اختصاصی
              </span>
            </div>

            {/* Optional Ribbon Decoration across envelope pocket */}
            {ribbonStyle !== 'none' && (
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-[25] pointer-events-none flex items-center justify-center">
                <div
                  className={`w-full h-7 sm:h-8 shadow-sm flex items-center justify-center ${
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
                  <div className="absolute inset-y-0 w-7 sm:w-8 bg-gradient-to-b from-amber-600 via-amber-400 to-amber-600 border-x border-amber-200/70 shadow-sm flex items-center justify-center">
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
                  className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 z-[30] cursor-pointer group"
                  onClick={handleOpenCard}
                >
                  {/* Pulsing ambient halo around wax seal */}
                  <div className="absolute -inset-2.5 rounded-full bg-amber-400/40 blur-md animate-pulse pointer-events-none" />

                  {/* 3D Wax Seal Body */}
                  <div
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white/95 p-0.5 flex items-center justify-center shadow-[0_8px_30px_rgba(217,119,6,0.55)] transition-transform group-hover:scale-110 group-hover:rotate-6 active:scale-95 ${getSealColorClasses(
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
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-stone-900/90 text-amber-200 text-[9px] sm:text-[10px] font-vazir shadow-sm backdrop-blur-xs flex items-center gap-1 border border-amber-400/30">
                    <span>لمس کنید</span>
                    <ArrowUp className="w-2.5 h-2.5 animate-bounce text-amber-300" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. GRAND OPEN ACTION BAR AT THE BOTTOM */}
      {/* ========================================================================= */}
      <div className="w-full max-w-lg flex flex-col items-center justify-center shrink-0 pb-1.5 sm:pb-3 z-30 min-h-[58px]">
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
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleOpenCard}
                className="group relative w-full max-w-sm sm:max-w-md flex items-center justify-between gap-2.5 sm:gap-3.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl sm:rounded-full bg-white hover:bg-white text-stone-900 border-2 border-amber-300/80 shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgba(217,119,6,0.25)] ring-2 ring-amber-300/40 ring-offset-2 ring-offset-white cursor-pointer transition-all overflow-hidden gold-sheen"
                title="برای بیرون کشیدن و مشاهده کارت دعوت لمس کنید"
              >
                {/* Subtle Background Sheen */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-100/30 via-white to-amber-100/30 pointer-events-none" />

                {/* Right Side (RTL): 3D Wax Seal Badge */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 z-10">
                  <div className="relative shrink-0">
                    <div className="absolute -inset-1 rounded-full bg-amber-400/25 blur-sm animate-pulse pointer-events-none" />
                    <div
                      className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-white/95 p-0.5 flex items-center justify-center shadow-md transition-transform group-hover:rotate-6 ${getSealColorClasses(
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold font-vazir text-stone-900 truncate group-hover:text-amber-700 transition-colors">
                        {data.waxSeal?.sealText || 'مشاهده کارت دعوت'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-400/90 text-stone-950 font-bold text-[10px] sm:text-[11px] shrink-0 flex items-center gap-1 shadow-sm">
                        <span>لمس کنید</span>
                        <motion.span
                          animate={{ y: [0, -2, 0] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        >
                          👆
                        </motion.span>
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-medium text-stone-500 truncate block font-vazir mt-0.5">
                      {guideText}
                    </span>
                  </div>
                </div>

                {/* Left Side (RTL): Action Cue Heart */}
                <div className="flex items-center gap-1.5 shrink-0 z-10 pr-1 pl-0.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-50 group-hover:bg-rose-50 flex items-center justify-center transition-colors shadow-sm border border-amber-200">
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
