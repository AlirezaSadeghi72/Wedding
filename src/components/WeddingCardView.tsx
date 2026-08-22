import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Clock,
  MapPin,
  Heart,
  Share2,
  Sparkles,
  CheckCircle2,
  Download,
  Copy,
  Check,
  Eye,
  CalendarCheck,
  Lock,
  Sun,
  Moon
} from 'lucide-react';
import { WeddingCardData } from '../types';
import { getTheme } from '../data/themes';
import { calculateTimeLeft, toPersianDigits, generateIcsCalendar, downloadCalendarFile, TimeLeft } from '../utils/dateUtils';
import { copyToClipboard } from '../utils/clipboard';
import RSVPModal from './RSVPModal';
import GuestbookSection from './GuestbookSection';
import LoveStorySection from './LoveStorySection';
import PhotoGallerySection from './PhotoGallerySection';
import WeatherSection from './WeatherSection';
import GiftRegistrySection from './GiftRegistrySection';
import FAQSection from './FAQSection';

interface Props {
  data: WeddingCardData;
  onOpenStudio?: () => void;
  onReopenEnvelope?: () => void;
  onOpenAdminLogin?: () => void;
  isAdminAuthenticated?: boolean;
}

export default function WeddingCardView({
  data,
  onOpenStudio,
  onReopenEnvelope,
  onOpenAdminLogin,
  isAdminAuthenticated,
}: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(data.gregorianDate));
  const [isRsvpOpen, setIsRsvpOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isLight = true;
  const currentTheme = getTheme(data.themeId);
  const overallStyle = data.overallStyle || {
    borderStyle: 'persian_arabesque',
    fontPairing: 'classic_amiri',
    ambientEffect: 'gold_sparkles',
    headerLayout: 'centered_crest'
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(data.gregorianDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [data.gregorianDate]);

  const handleCopyAddress = () => {
    copyToClipboard(`${data.venue.name} - ${data.venue.address}`).then((success) => {
      if (success) {
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2500);
      }
    });
  };

  const handleCopyLink = () => {
    copyToClipboard(window.location.href).then((success) => {
      if (success) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    });
  };

  const handleAddToCalendar = () => {
    const icsData = generateIcsCalendar(
      `جشن عروسی ${data.brideName} و ${data.groomName}`,
      `${data.invitationBody}\nآدرس: ${data.venue.address}`,
      `${data.venue.name} (${data.venue.city})`,
      data.gregorianDate
    );
    downloadCalendarFile(icsData, `wedding-${data.brideName}-${data.groomName}.ics`);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `کارت دعوت پیوند آسمانی ${data.brideName} و ${data.groomName}\nتاریخ: ${data.solarDate.dayOfWeek} ${data.solarDate.day} ${data.solarDate.month} ${data.solarDate.year}\nمشاهده کارت دعوت دیجیتال و مسیریابی:\n${window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(
      `کارت دعوت پیوند آسمانی ${data.brideName} و ${data.groomName}\nتاریخ: ${data.solarDate.dayOfWeek} ${data.solarDate.day} ${data.solarDate.month} ${data.solarDate.year}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${text}`, '_blank');
  };

  // Compute border styling classes based on overallStyle.borderStyle
  const getBorderClasses = () => {
    if (isLight) {
      switch (overallStyle?.borderStyle) {
        case 'persian_arabesque':
          return 'border-2 border-amber-600/60 ring-4 ring-amber-500/20 ring-offset-2 ring-offset-emerald-50/50 shadow-2xl';
        case 'royal_double_line':
          return 'border-4 border-double border-amber-600/70 shadow-2xl';
        case 'minimal_clean':
          return 'border border-stone-300 shadow-xl';
        case 'ornate_crest':
          return 'border-2 border-amber-600/50 rounded-t-[44px] shadow-2xl';
        case 'floral_wreath':
          return 'border-2 border-emerald-600/50 shadow-xl';
        case 'palace_arch':
          return 'border-4 border-amber-600/60 rounded-t-[50px] rounded-b-2xl shadow-2xl';
        case 'golden_emboss':
          return 'border-2 border-amber-600 shadow-[0_0_35px_rgba(217,119,6,0.25)]';
        default:
          return 'border border-amber-600/40 shadow-2xl';
      }
    }
    switch (overallStyle?.borderStyle) {
      case 'persian_arabesque':
        return 'border-2 border-amber-400/60 ring-4 ring-amber-500/20 ring-offset-2 ring-offset-stone-950 shadow-2xl';
      case 'royal_double_line':
        return 'border-4 border-double border-amber-400/70 shadow-2xl';
      case 'minimal_clean':
        return 'border border-stone-700/80 shadow-lg';
      case 'ornate_crest':
        return 'border-2 border-amber-400/50 rounded-t-[44px] shadow-2xl';
      case 'floral_wreath':
        return 'border-2 border-emerald-400/50 shadow-xl';
      case 'palace_arch':
        return 'border-4 border-amber-300/60 rounded-t-[50px] rounded-b-2xl shadow-2xl';
      case 'golden_emboss':
        return 'border-2 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.3)]';
      default:
        return 'border border-amber-500/40 shadow-2xl';
    }
  };

  return (
    <div id="wedding-card-root" className={`min-h-screen pt-6 sm:pt-10 md:pt-16 pb-32 sm:pb-28 px-2.5 sm:px-4 bg-gradient-to-b ${currentTheme.primaryBg} ${isLight ? 'text-stone-800' : 'text-stone-100'} flex flex-col items-center justify-start relative overflow-x-hidden w-full transition-colors duration-500`}>
      {/* Fixed Sticky Top Bar for RSVP & Reopen Envelope */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
        className={`fixed ${
          isAdminAuthenticated ? 'top-14 sm:top-16' : 'top-3 sm:top-4'
        } z-40 inset-x-0 flex items-center justify-center gap-2 pointer-events-none px-3 max-w-2xl mx-auto transition-all duration-300`}
      >
        {/* RSVP Shortcut Button */}
        {data.sectionVisibility?.rsvp !== false && data.rsvpConfig.enabled !== false && (
          <button
            type="button"
            onClick={() => {
              setIsRsvpOpen(true);
              const el = document.getElementById('rsvp-section-anchor') || document.getElementById('rsvp-open-btn');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
            className="pointer-events-auto group px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white/95 hover:bg-amber-50 border border-amber-500/80 text-amber-950 shadow-xl shadow-amber-900/10 backdrop-blur-xl flex items-center gap-2 sm:gap-2.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-amber-500/20"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
            <CheckCircle2 className="w-4 h-4 text-amber-600 group-hover:text-amber-700 shrink-0" />
            <span className="text-xs sm:text-sm font-bold font-amiri text-amber-950">
              تایید حضور (ثبت RSVP)
            </span>
          </button>
        )}

        {/* Reopen Envelope Shortcut Button */}
        {onReopenEnvelope && (
          <button
            type="button"
            onClick={onReopenEnvelope}
            className="pointer-events-auto group px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-white/95 hover:bg-amber-50 border border-amber-300 text-stone-900 shadow-xl shadow-amber-900/10 backdrop-blur-xl flex items-center gap-1.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer text-xs sm:text-sm font-bold font-amiri ring-2 ring-amber-500/20"
            title="مشاهده مجدد پاکت نامه و انیمیشن مهر و موم"
          >
            <Eye className="w-4 h-4 text-amber-600 group-hover:text-amber-700 shrink-0" />
            <span className="text-xs sm:text-sm font-bold font-amiri text-amber-950">
              مشاهده مجدد پاکت
            </span>
          </button>
        )}
      </motion.div>

      {/* Subtle Persian Damask / Ambient Background */}
      <div className={`absolute inset-0 ${isLight ? 'opacity-15' : 'opacity-10'} bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none`} />

      {/* Dynamic Ambient Background Effects */}
      {(overallStyle?.ambientEffect === 'gold_sparkles' || !overallStyle?.ambientEffect) && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-10 w-2 h-2 bg-amber-400 rounded-full animate-ping opacity-60" />
          <div className="absolute top-1/3 right-12 w-3 h-3 bg-amber-300 rounded-full animate-pulse opacity-70" />
          <div className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-yellow-200 rounded-full animate-ping opacity-40" />
          <div className="absolute top-2/3 right-1/4 w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse opacity-50" />
        </div>
      )}

      {overallStyle?.ambientEffect === 'petals_glow' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          <div className="absolute top-10 right-20 w-4 h-6 bg-rose-400/60 rounded-full blur-[1px] transform rotate-45 animate-bounce" style={{ animationDuration: '6s' }} />
          <div className="absolute top-1/2 left-16 w-3 h-5 bg-rose-300/50 rounded-full blur-[1px] transform -rotate-12 animate-bounce" style={{ animationDuration: '8s' }} />
        </div>
      )}

      {overallStyle?.ambientEffect === 'persian_geometric' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <div className="absolute top-20 left-1/3 w-24 h-24 border border-amber-400/40 rotate-45 rounded-2xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-40 right-1/3 w-32 h-32 border border-amber-300/30 rotate-12 rounded-3xl animate-pulse" style={{ animationDuration: '5s' }} />
        </div>
      )}

      {overallStyle?.ambientEffect === 'celestial_stars' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-12 left-1/4 w-1.5 h-1.5 bg-sky-200 rounded-full animate-pulse opacity-90 shadow-[0_0_8px_#bae6fd]" style={{ animationDuration: '2s' }} />
          <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-indigo-200 rounded-full animate-ping opacity-75" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-white rounded-full animate-pulse opacity-80 shadow-[0_0_10px_#ffffff]" style={{ animationDuration: '3s' }} />
        </div>
      )}

      {overallStyle?.ambientEffect === 'candlelight_shimmer' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-12 w-16 h-16 bg-amber-500/10 rounded-full blur-xl animate-pulse" style={{ animationDuration: '2.5s' }} />
          <div className="absolute bottom-1/3 right-12 w-20 h-20 bg-orange-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '3.5s' }} />
        </div>
      )}

      {overallStyle?.ambientEffect === 'minimal_vignette' && (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
      )}

      {/* Main Luxury Wedding Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full max-w-2xl rounded-3xl ${currentTheme.cardBg} ${getBorderClasses()} p-4 sm:p-8 md:p-12 shadow-2xl backdrop-blur-2xl text-center overflow-hidden my-3 sm:my-6`}
      >
        {/* Ornate Gold Framing Corners if requested */}
        {overallStyle.borderStyle !== 'minimal_clean' && (
          <>
            <div className={`absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 ${isLight ? 'border-amber-600/70' : 'border-amber-400/70'} pointer-events-none`} />
            <div className={`absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 ${isLight ? 'border-amber-600/70' : 'border-amber-400/70'} pointer-events-none`} />
            <div className={`absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 ${isLight ? 'border-amber-600/70' : 'border-amber-400/70'} pointer-events-none`} />
            <div className={`absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 ${isLight ? 'border-amber-600/70' : 'border-amber-400/70'} pointer-events-none`} />
          </>
        )}

        {/* Top Header - Bismillah / Floral Crest */}
        <div className="flex flex-col items-center mb-6">
          <div className={`w-12 h-12 rounded-full ${
            isLight
              ? 'bg-amber-100 border border-amber-400/50 text-amber-800'
              : 'bg-amber-500/10 border border-amber-400/30 text-amber-300'
          } flex items-center justify-center mb-3 shadow-inner`}>
            <Heart className={`w-6 h-6 ${isLight ? 'fill-amber-500/20 text-amber-700' : 'fill-amber-400/20 text-amber-400'}`} />
          </div>
          <span className={`font-scheherazade text-xl sm:text-2xl ${isLight ? 'text-amber-900 font-bold' : 'text-amber-300/90'} font-medium`}>
            {data.invitationTitle || 'به نام پیوند دهنده دل‌ها'}
          </span>
          <div className={`w-24 h-0.5 ${isLight ? 'bg-gradient-to-r from-transparent via-amber-600/60 to-transparent' : 'bg-gradient-to-r from-transparent via-amber-400/60 to-transparent'} mt-2`} />
        </div>

        {/* Couple Names - Luxury Typography */}
        <div className="my-6 space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-6">
            <span className={`font-scheherazade text-4xl sm:text-5xl md:text-6xl ${isLight ? 'text-emerald-950 font-black' : 'text-amber-100 font-bold'} drop-shadow-sm`}>
              {data.brideName}
            </span>
            <span className={`font-vibes text-3xl sm:text-4xl ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>&</span>
            <span className={`font-scheherazade text-4xl sm:text-5xl md:text-6xl ${isLight ? 'text-emerald-950 font-black' : 'text-amber-100 font-bold'} drop-shadow-sm`}>
              {data.groomName}
            </span>
          </div>

          {/* Families Honorifics */}
          {data.sectionVisibility?.parents !== false && (
            <div className={`pt-2 text-xs sm:text-sm ${isLight ? 'text-stone-600' : 'text-stone-400'} font-light flex items-center justify-center gap-2`}>
              <span>خانواده‌های محترم</span>
              <span className={`${isLight ? 'text-emerald-900 font-semibold' : 'text-amber-300/90 font-medium'}`}>{data.brideFamily}</span>
              <span>و</span>
              <span className={`${isLight ? 'text-emerald-900 font-semibold' : 'text-amber-300/90 font-medium'}`}>{data.groomFamily}</span>
            </div>
          )}
        </div>

        {/* Persian Poetic Verse Section */}
        {data.sectionVisibility?.poem !== false && (
          <div className={`my-8 p-5 sm:p-6 rounded-2xl ${
            isLight
              ? 'bg-emerald-50/80 border border-amber-600/30'
              : 'bg-stone-950/50 border border-amber-500/20'
          } relative shadow-sm`}>
            <div className={`${isLight ? 'text-amber-600/30' : 'text-amber-400/30'} text-3xl font-serif absolute -top-4 right-4`}>“</div>
            <div className={`space-y-2 ${isLight ? 'text-emerald-950 font-semibold' : 'text-amber-100'} font-amiri text-base sm:text-lg leading-loose`}>
              <p className="font-medium">{data.poem.verse1}</p>
              <p className="font-medium">{data.poem.verse2}</p>
            </div>
            {data.poem.poet && (
              <span className={`block text-left text-xs ${isLight ? 'text-amber-800' : 'text-amber-400/80'} mt-3 font-scheherazade font-semibold`}>
                — {data.poem.poet}
              </span>
            )}
            <div className={`${isLight ? 'text-amber-600/30' : 'text-amber-400/30'} text-3xl font-serif absolute -bottom-6 left-4`}>”</div>
          </div>
        )}

        {/* Invitation Body Statement */}
        <p className={`text-xs sm:text-sm md:text-base ${isLight ? 'text-stone-700 font-normal' : 'text-stone-300 font-light'} leading-relaxed max-w-lg mx-auto mb-8`}>
          {data.invitationBody}
        </p>

        {/* Date & Time Luxury Badge */}
        {data.sectionVisibility?.dateAndSchedule !== false && (
          <div className={`my-8 p-4 sm:p-6 rounded-2xl ${
            isLight
              ? 'bg-gradient-to-br from-amber-100/70 via-white to-emerald-50/80 border border-amber-500/50 shadow-md text-stone-900'
              : 'bg-gradient-to-br from-amber-950/40 via-stone-900/60 to-stone-950/90 border border-amber-400/40 shadow-xl text-stone-100'
          }`}>
            <div className={`flex flex-col sm:flex-row items-center justify-around gap-4 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse ${isLight ? 'divide-stone-200' : 'divide-stone-800'}`}>
              {/* Solar Persian Date */}
              <div className="flex flex-col items-center px-4 w-full sm:w-auto">
                <span className={`text-xs ${isLight ? 'text-amber-800' : 'text-amber-400'} mb-1 font-medium flex items-center gap-1`}>
                  <Calendar className="w-3.5 h-3.5" />
                  تاریخ مراسم
                </span>
                <span className={`font-bold text-lg sm:text-xl font-amiri ${isLight ? 'text-emerald-950 font-black' : 'text-white'}`}>
                  {data.solarDate.dayOfWeek} {data.solarDate.day} {data.solarDate.month} {data.solarDate.year}
                </span>
                <span className={`text-[11px] ${isLight ? 'text-stone-600' : 'text-stone-400'} mt-0.5`}>
                  مصادف با ۱۸ سپتامبر ۲۰۲۵
                </span>
              </div>

              {/* Time Slot */}
              <div className="flex flex-col items-center px-4 pt-3 sm:pt-0 w-full sm:w-auto">
                <span className={`text-xs ${isLight ? 'text-amber-800' : 'text-amber-400'} mb-1 font-medium flex items-center gap-1`}>
                  <Clock className="w-3.5 h-3.5" />
                  ساعت برگزاری
                </span>
                <span className={`font-bold text-lg sm:text-xl font-cinzel ${isLight ? 'text-amber-900' : 'text-amber-200'}`}>
                  {data.eventTime}
                </span>
                <span className={`text-[11px] ${isLight ? 'text-stone-600' : 'text-stone-400'} mt-0.5`}>
                  پذیرایی و آغاز مراسم
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Live Countdown Timer Section - Ordered strictly Left to Right: Days - Hours - Minutes - Seconds */}
        {data.sectionVisibility?.countdown !== false && (
          <div className="my-8">
            <span className={`text-xs ${isLight ? 'text-amber-900 font-bold' : 'text-amber-400/90'} block mb-3 font-medium`}>
              شمارش معکوس تا وصال و آغاز جشن
            </span>

            {timeLeft.isPast ? (
              <div className={`p-4 rounded-xl ${
                isLight
                  ? 'bg-emerald-100 border border-emerald-400 text-emerald-950'
                  : 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-200'
              } text-sm font-semibold`}>
                ✨ جشن با شکوه وصال در حال برگزاری یا سپری شده است ✨
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-md mx-auto" dir="ltr">
                {/* 1. Days (روز) - Far Left */}
                <div className={`p-2 sm:p-3.5 rounded-2xl ${
                  isLight
                    ? 'bg-emerald-50/90 border border-amber-600/40 shadow-sm'
                    : 'bg-stone-950/85 border border-amber-500/35 shadow-inner'
                } flex flex-col items-center justify-center`}>
                  <span className={`text-xl sm:text-2xl md:text-3xl font-bold font-cinzel ${isLight ? 'text-emerald-950 font-black' : 'text-amber-300'}`}>
                    {toPersianDigits(timeLeft.days)}
                  </span>
                  <span className={`text-[10px] sm:text-xs ${isLight ? 'text-stone-600' : 'text-stone-300'} font-vazir mt-1`}>روز</span>
                </div>

                {/* 2. Hours (ساعت) */}
                <div className={`p-2 sm:p-3.5 rounded-2xl ${
                  isLight
                    ? 'bg-emerald-50/90 border border-amber-600/40 shadow-sm'
                    : 'bg-stone-950/85 border border-amber-500/35 shadow-inner'
                } flex flex-col items-center justify-center`}>
                  <span className={`text-xl sm:text-2xl md:text-3xl font-bold font-cinzel ${isLight ? 'text-emerald-950 font-black' : 'text-amber-300'}`}>
                    {toPersianDigits(timeLeft.hours)}
                  </span>
                  <span className={`text-[10px] sm:text-xs ${isLight ? 'text-stone-600' : 'text-stone-300'} font-vazir mt-1`}>ساعت</span>
                </div>

                {/* 3. Minutes (دقیقه) */}
                <div className={`p-2 sm:p-3.5 rounded-2xl ${
                  isLight
                    ? 'bg-emerald-50/90 border border-amber-600/40 shadow-sm'
                    : 'bg-stone-950/85 border border-amber-500/35 shadow-inner'
                } flex flex-col items-center justify-center`}>
                  <span className={`text-xl sm:text-2xl md:text-3xl font-bold font-cinzel ${isLight ? 'text-emerald-950 font-black' : 'text-amber-300'}`}>
                    {toPersianDigits(timeLeft.minutes)}
                  </span>
                  <span className={`text-[10px] sm:text-xs ${isLight ? 'text-stone-600' : 'text-stone-300'} font-vazir mt-1`}>دقیقه</span>
                </div>

                {/* 4. Seconds (ثانیه) - Far Right */}
                <div className={`p-2 sm:p-3.5 rounded-2xl ${
                  isLight
                    ? 'bg-emerald-50/90 border border-amber-600/40 shadow-sm'
                    : 'bg-stone-950/85 border border-amber-500/35 shadow-inner'
                } flex flex-col items-center justify-center`}>
                  <span className={`text-xl sm:text-2xl md:text-3xl font-bold font-cinzel ${isLight ? 'text-amber-700 animate-pulse' : 'text-amber-400 animate-pulse'}`}>
                    {toPersianDigits(timeLeft.seconds)}
                  </span>
                  <span className={`text-[10px] sm:text-xs ${isLight ? 'text-stone-600' : 'text-stone-300'} font-vazir mt-1`}>ثانیه</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ceremony Timeline / Program */}
        {data.sectionVisibility?.timeline !== false && data.timeline && data.timeline.length > 0 && (
          <div className={`my-10 pt-6 border-t ${isLight ? 'border-stone-200' : 'border-stone-800'}`}>
            <h3 className={`text-lg sm:text-xl font-bold font-amiri ${isLight ? 'text-emerald-950' : 'text-amber-200'} mb-6 flex items-center justify-center gap-2`}>
              <Sparkles className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
              کنداکتور و برنامه زمان‌بندی جشن
            </h3>

            <div className="space-y-4 max-w-lg mx-auto text-right">
              {data.timeline.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className={`flex items-start gap-3.5 p-3 rounded-2xl ${
                    isLight
                      ? 'bg-emerald-50/70 border border-emerald-200/80 hover:border-amber-500/50 shadow-sm'
                      : 'bg-stone-950/40 border border-stone-800/80 hover:border-amber-500/30'
                  } transition-colors`}
                >
                  <div className={`w-16 shrink-0 text-center py-1 px-2 rounded-lg ${
                    isLight
                      ? 'bg-amber-100 border border-amber-400/60 text-amber-900 font-bold'
                      : 'bg-amber-500/10 border border-amber-400/30 text-amber-300 font-bold'
                  } font-cinzel text-xs`}>
                    {item.time}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-bold text-xs sm:text-sm ${isLight ? 'text-stone-900' : 'text-stone-100'} font-amiri`}>
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className={`text-[11px] ${isLight ? 'text-stone-600' : 'text-stone-400'} mt-0.5 font-light`}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Venue & Interactive Navigation Card */}
        {data.sectionVisibility?.venueMap !== false && (
          <div className={`my-10 pt-6 border-t ${isLight ? 'border-stone-200' : 'border-stone-800'}`}>
            <div className={`p-5 sm:p-6 rounded-3xl ${
              isLight
                ? 'bg-emerald-50/70 border border-amber-600/40 text-stone-900 shadow-md'
                : 'bg-stone-950/70 border border-amber-500/30 text-stone-100'
            } text-right`}>
              <div className={`flex items-center gap-2 ${isLight ? 'text-amber-800' : 'text-amber-400'} mb-2`}>
                <MapPin className="w-5 h-5" />
                <span className="text-xs uppercase font-medium">مکان برگزاری مراسم</span>
              </div>

              <h4 className={`text-lg sm:text-xl font-bold font-amiri ${isLight ? 'text-emerald-950 font-black' : 'text-stone-100'} mb-1`}>
                {data.venue.name} {data.venue.hall && `(${data.venue.hall})`}
              </h4>

              <p className={`text-xs sm:text-sm ${isLight ? 'text-stone-700 font-normal' : 'text-stone-300 font-light'} leading-relaxed mb-4`}>
                {data.venue.address}
              </p>

              {/* Copy Address Button */}
              <button
                onClick={handleCopyAddress}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                  isLight
                    ? 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 shadow-sm'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                } text-xs mb-4 transition-colors cursor-pointer`}
              >
                {copiedAddress ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 font-medium">آدرس کپی شد</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>کپی نشانی تالار</span>
                  </>
                )}
              </button>

              {/* Navigation Buttons Grid - 3 Map Apps */}
              <div className={`pt-3 border-t ${isLight ? 'border-stone-200' : 'border-stone-800/80'}`}>
                <span className={`text-xs ${isLight ? 'text-amber-900 font-bold' : 'text-amber-300/80'} block mb-2 font-medium`}>
                  مسیریابی هوشمند تالار:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Google Maps */}
                  <a
                    href={data.venue.googleMapsUrl || `https://maps.google.com/?q=${data.venue.lat},${data.venue.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`py-2.5 px-3 rounded-xl ${
                      isLight
                        ? 'bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-950 font-medium'
                        : 'bg-red-950/50 hover:bg-red-900/60 border border-red-500/40 text-red-200'
                    } text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>گوگل مپ (Google Maps)</span>
                  </a>

                  {/* Neshan */}
                  <a
                    href={data.venue.neshanUrl || `https://nshn.ir`}
                    target="_blank"
                    rel="noreferrer"
                    className={`py-2.5 px-3 rounded-xl ${
                      isLight
                        ? 'bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-950 font-medium'
                        : 'bg-blue-950/50 hover:bg-blue-900/60 border border-blue-500/40 text-blue-200'
                    } text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>مسیریاب نشان (Neshan)</span>
                  </a>

                  {/* Balad */}
                  <a
                    href={data.venue.baladUrl || `https://balad.ir`}
                    target="_blank"
                    rel="noreferrer"
                    className={`py-2.5 px-3 rounded-xl ${
                      isLight
                        ? 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 font-medium'
                        : 'bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-200'
                    } text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>مسیریاب بلد (Balad)</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Weather Forecast Section */}
        {data.sectionVisibility?.weather !== false && (
          <WeatherSection weather={data.weather} isLight={isLight} />
        )}

        {/* Our Love Story Section */}
        {data.sectionVisibility?.loveStory !== false && (
          <LoveStorySection milestones={data.loveStory} isLight={isLight} />
        )}

        {/* Photo Gallery Moments */}
        {data.sectionVisibility?.gallery !== false && (
          <PhotoGallerySection photos={data.gallery} isLight={isLight} />
        )}

        {/* Gift & Shādbāsh Registry */}
        {data.sectionVisibility?.giftRegistry !== false && (
          <GiftRegistrySection registry={data.giftRegistry} isLight={isLight} />
        )}

        {/* FAQs & Guest Guide */}
        {data.sectionVisibility?.faqs !== false && (
          <FAQSection faqs={data.faqs} isLight={isLight} />
        )}

        {/* Interactive RSVP Action Trigger */}
        {data.sectionVisibility?.rsvp !== false && data.rsvpConfig.enabled !== false && (
          <div id="rsvp-section-anchor" className={`my-10 p-6 rounded-3xl ${
            isLight
              ? 'bg-gradient-to-r from-amber-100 via-emerald-50 to-amber-100 border border-amber-500/60 shadow-lg text-emerald-950'
              : 'bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-amber-600/20 border border-amber-400/50 shadow-2xl text-amber-100'
          }`}>
            <h4 className={`text-xl font-bold font-amiri ${isLight ? 'text-emerald-950 font-black' : 'text-amber-100'} mb-2`}>
              تایید حضور در جشن (RSVP)
            </h4>
            <p className={`text-xs ${isLight ? 'text-stone-700 font-normal' : 'text-stone-300 font-light'} mb-5 max-w-md mx-auto leading-relaxed`}>
              لطفاً جهت برنامه‌ریزی بهتر و تدارک پذیرایی شایسته، حضور خود را تا تاریخ {data.rsvpConfig.deadlineDate} اعلام فرمایید.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <motion.button
                id="rsvp-open-btn"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsRsvpOpen(true)}
                className="px-7 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 text-stone-950" />
                <span>ثبت و اعلام تایید حضور</span>
              </motion.button>

              {onReopenEnvelope && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onReopenEnvelope}
                  className="px-6 py-3.5 rounded-full bg-white hover:bg-amber-50 text-amber-950 font-bold text-sm border border-amber-300/90 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Eye className="w-4 h-4 text-amber-600" />
                  <span>مشاهده مجدد پاکت</span>
                </motion.button>
              )}
            </div>
          </div>
        )}

        {/* Quick Utility Actions Bar */}
        {data.sectionVisibility?.calendarAndShare !== false && (
          <div className={`pt-6 border-t ${isLight ? 'border-stone-200' : 'border-stone-800'} flex flex-wrap items-center justify-center gap-2 text-xs`}>
            {/* Add to Calendar */}
            <button
              onClick={handleAddToCalendar}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl ${
                isLight
                  ? 'bg-white hover:bg-emerald-50 text-stone-800 hover:text-emerald-950 border border-stone-300 shadow-sm'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800'
              } transition-colors cursor-pointer`}
            >
              <CalendarCheck className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
              <span>افزودن به تقویم</span>
            </button>

            {/* Share WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl ${
                isLight
                  ? 'bg-white hover:bg-emerald-50 text-stone-800 hover:text-emerald-700 border border-stone-300 shadow-sm'
                  : 'bg-stone-900 hover:bg-emerald-950/60 text-stone-300 hover:text-emerald-300 border border-stone-800'
              } transition-colors cursor-pointer`}
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>ارسال در واتساپ</span>
            </button>

            {/* Share Telegram */}
            <button
              onClick={handleShareTelegram}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl ${
                isLight
                  ? 'bg-white hover:bg-sky-50 text-stone-800 hover:text-sky-700 border border-stone-300 shadow-sm'
                  : 'bg-stone-900 hover:bg-sky-950/60 text-stone-300 hover:text-sky-300 border border-stone-800'
              } transition-colors cursor-pointer`}
            >
              <Share2 className="w-3.5 h-3.5 text-sky-500" />
              <span>ارسال در تلگرام</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl ${
                isLight
                  ? 'bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 shadow-sm'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800'
              } transition-colors cursor-pointer`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">لینک کپی شد</span>
                </>
              ) : (
                <>
                  <Copy className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                  <span>کپی لینک کارت</span>
                </>
              )}
            </button>

            {/* Reopen Envelope */}
            {onReopenEnvelope && (
              <button
                onClick={onReopenEnvelope}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl ${
                  isLight
                    ? 'bg-white hover:bg-stone-100 text-stone-600 hover:text-stone-900 border border-stone-300 shadow-sm'
                    : 'bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-800'
                } transition-colors cursor-pointer`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>مشاهده مجدد پاکت</span>
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Guestbook Section */}
      {data.sectionVisibility?.guestbook !== false && (
        <GuestbookSection cardId={data.id} isLight={isLight} />
      )}

      {/* Footer copyright and discreet admin login */}
      <footer className={`mt-8 mb-4 text-center text-xs ${isLight ? 'text-stone-600' : 'text-stone-500'} font-light space-y-2 select-none`}>
        <p className={`font-scheherazade text-sm ${isLight ? 'text-stone-700 font-medium' : 'text-stone-400'}`}>
          با آرزوی شادی و خوشبختی جاودان برای {data.brideName} و {data.groomName}
        </p>
        {!isAdminAuthenticated && onOpenAdminLogin && (
          <div className="pt-2">
            <button
              onClick={onOpenAdminLogin}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${
                isLight
                  ? 'bg-white/80 hover:bg-white text-stone-600 hover:text-emerald-950 border border-stone-300 shadow-sm'
                  : 'bg-stone-900/60 hover:bg-stone-800 text-stone-500 hover:text-amber-400 border border-stone-800/80'
              } transition-all text-[11px] cursor-pointer`}
            >
              <Lock className="w-3 h-3" />
              <span>ورود عروس و داماد (پنل مدیریت)</span>
            </button>
          </div>
        )}
      </footer>

      {/* RSVP Modal */}
      <RSVPModal
        isOpen={isRsvpOpen}
        onClose={() => setIsRsvpOpen(false)}
        data={data}
        isLight={isLight}
      />
    </div>
  );
}

