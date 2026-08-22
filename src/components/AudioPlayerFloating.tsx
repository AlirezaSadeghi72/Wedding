import { useState, useEffect, MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Music,
  Volume2,
  VolumeX,
  Disc,
  Sparkles,
  SkipForward,
  SkipBack,
  Play,
  Pause,
  X,
  Sliders,
  Radio,
  Headphones
} from 'lucide-react';
import { weddingAudio } from '../utils/audioSynth';
import { WeddingCardData, MusicTrack } from '../types';
import { toPersianDigits } from '../utils/dateUtils';

interface Props {
  data: WeddingCardData;
  guestColorMode?: 'dark' | 'light';
  onToggleColorMode?: () => void;
}

export default function AudioPlayerFloating({ data, guestColorMode }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [autoNext, setAutoNext] = useState(true);

  const effectiveColorMode = guestColorMode || data.colorMode || 'dark';
  const isLight = effectiveColorMode === 'light';

  // Build combined playlist with default romantic classical & Iranian traditional presets
  const defaultTracks: MusicTrack[] = [
    {
      id: 'default-1',
      title: data.music?.title || 'پیانوی رمانتیک و دلنشین',
      artist: data.music?.artist || 'نوای آرامش‌بخش پیانو',
      synthPreset: data.music?.synthPreset || 'romantic_piano',
      isPreset: !data.music?.audioUrl,
      url: data.music?.audioUrl
    },
    {
      id: 'default-2',
      title: 'نوای سنتور و عود سنتی ایرانی',
      artist: 'دستگاه اصفهان و شور اصیل',
      synthPreset: 'traditional_oud',
      isPreset: true
    },
    {
      id: 'default-3',
      title: 'چنگ و هارپ آسمانی و رویایی',
      artist: 'نوای ملایم پیوند فرخنده',
      synthPreset: 'celestial_harp',
      isPreset: true
    },
    {
      id: 'default-4',
      title: 'گیتار آکوستیک ملایم و عاشقانه',
      artist: 'ملودی دلنواز و آرام',
      synthPreset: 'gentle_acoustic',
      isPreset: true
    }
  ];

  const playlist: MusicTrack[] =
    data.music?.playlist && data.music.playlist.length > 0
      ? data.music.playlist
      : defaultTracks;

  const currentTrack = playlist[currentTrackIndex] || playlist[0];

  // Sync isPlaying state with audio utility
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlaying(weddingAudio.getIsPlaying());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpenModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpenModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpenModal]);

  const playTrackAtIndex = (index: number) => {
    const nextIdx = (index + playlist.length) % playlist.length;
    setCurrentTrackIndex(nextIdx);
    const track = playlist[nextIdx];

    weddingAudio.stop();
    weddingAudio.setVolume(volume / 100);

    const onTrackEnd = () => {
      if (autoNext) {
        playTrackAtIndex(nextIdx + 1);
      }
    };

    weddingAudio.playTrack(track, onTrackEnd);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (isPlaying) {
      weddingAudio.stop();
      setIsPlaying(false);
    } else {
      playTrackAtIndex(currentTrackIndex);
    }
  };

  const handleNext = (e?: MouseEvent) => {
    e?.stopPropagation();
    playTrackAtIndex(currentTrackIndex + 1);
  };

  const handlePrev = (e?: MouseEvent) => {
    e?.stopPropagation();
    playTrackAtIndex(currentTrackIndex - 1);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    weddingAudio.setVolume(newVol / 100);
  };

  return (
    <>
      {/* Permanent Fixed Bottom Footer Music Player */}
      <footer
        id="permanent-music-footer"
        className={`fixed bottom-0 inset-x-0 z-40 w-full transition-all duration-300 select-none ${
          isLight
            ? 'bg-white/95 text-stone-900 border-t border-amber-600/30 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]'
            : 'bg-stone-950/95 text-stone-100 border-t border-amber-500/30 shadow-[0_-8px_35px_rgba(0,0,0,0.6)]'
        } backdrop-blur-xl`}
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          {/* Section 1 (Right in RTL): Track Info & Spinning Vinyl Disc */}
          <div
            onClick={() => setIsOpenModal(true)}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group min-w-0 max-w-[40%] sm:max-w-[32%]"
            title="کلیک کنید برای تنظیمات و انتخاب موسیقی"
          >
            {/* Spinning Vinyl Disc */}
            <div className="relative flex items-center justify-center shrink-0">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-transform ${
                  isPlaying
                    ? 'bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 border-amber-300 shadow-md animate-spin'
                    : isLight
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-stone-900 text-stone-400 border-stone-700'
                }`}
                style={{ animationDuration: '3.5s' }}
              >
                <Disc className={`w-5 h-5 ${isPlaying ? 'text-stone-950' : ''}`} />
              </div>
              {isPlaying && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping ring-2 ring-emerald-400" />
              )}
            </div>

            {/* Track Title and Subtitle */}
            <div className="flex flex-col min-w-0 text-right">
              <div className="flex items-center gap-1">
                <span className={`text-xs sm:text-sm font-bold font-amiri truncate group-hover:text-amber-500 transition-colors ${
                  isLight ? 'text-emerald-950' : 'text-amber-100'
                }`}>
                  {currentTrack.title}
                </span>
                <Sparkles className="w-3 h-3 text-amber-400 shrink-0 hidden sm:inline" />
              </div>
              <span className={`text-[10px] sm:text-[11px] truncate font-light ${
                isLight ? 'text-stone-500' : 'text-stone-400'
              }`}>
                {currentTrack.artist || 'نوای دلنشین جشن'}
              </span>
            </div>
          </div>

          {/* Section 2 (Center): Playback Controls (Prev, Play/Pause, Next) */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-3 shrink-0">
            {/* Prev Track */}
            <button
              type="button"
              onClick={handlePrev}
              className={`p-2 sm:p-2.5 rounded-full transition-colors cursor-pointer ${
                isLight
                  ? 'hover:bg-amber-50 text-stone-600 hover:text-amber-900'
                  : 'hover:bg-stone-800 text-stone-400 hover:text-amber-300'
              }`}
              title="قطعه قبلی"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Play / Pause Main Button */}
            <button
              type="button"
              id="permanent-footer-play-btn"
              onClick={togglePlay}
              className="p-2.5 sm:p-3 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center ring-2 ring-amber-300/40"
              title={isPlaying ? 'توقف موسیقی' : 'پخش موسیقی'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-stone-950" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-stone-950 ml-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              type="button"
              onClick={handleNext}
              className={`p-2 sm:p-2.5 rounded-full transition-colors cursor-pointer ${
                isLight
                  ? 'hover:bg-amber-50 text-stone-600 hover:text-amber-900'
                  : 'hover:bg-stone-800 text-stone-400 hover:text-amber-300'
              }`}
              title="قطعه بعدی"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Section 3 (Left in RTL): Volume & Open Settings Modal */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-3 shrink-0">
            {/* Quick Volume Slider on desktop */}
            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleVolumeChange(volume === 0 ? 80 : 0)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isLight ? 'text-stone-600 hover:text-amber-700' : 'text-stone-400 hover:text-amber-300'
                }`}
                title={volume === 0 ? 'با صدا' : 'بی‌صدا'}
              >
                {volume === 0 ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                className="w-16 lg:w-20 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <span className={`text-[10px] font-mono w-7 text-left ${isLight ? 'text-stone-500' : 'text-stone-400'}`}>
                {toPersianDigits(volume)}٪
              </span>
            </div>

            {/* Open Full Music Panel Modal Button */}
            <button
              type="button"
              id="open-music-settings-popup"
              onClick={() => setIsOpenModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full border text-xs font-bold transition-all cursor-pointer shadow-sm ${
                isLight
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-stone-900 hover:bg-stone-800 text-amber-300 border-amber-500/40'
              }`}
              title="باز کردن پنل تنظیمات و لیست سازها"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">تنظیمات موسیقی</span>
              <span className="sm:hidden">سازها</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Guest Music Control Popup / Modal rendered via Portal */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpenModal && (
              <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 select-none">
                {/* Backdrop with Blur */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsOpenModal(false)}
                  className="fixed inset-0 bg-stone-950/80 backdrop-blur-md cursor-pointer"
                />

                {/* Modal Container */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className={`relative w-full max-w-lg max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border flex flex-col z-10 ${
                    isLight
                      ? 'bg-gradient-to-b from-[#fcfbf9] via-[#f7f3eb] to-[#f4eee3] border-amber-600/30 text-stone-900'
                      : 'bg-gradient-to-b from-stone-950 via-[#101413] to-stone-950 border-amber-500/40 text-stone-100 shadow-amber-950/50'
                  }`}
                >
                  {/* Decorative Glowing Backdrop Orbs */}
                  <div className="absolute top-0 right-1/4 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Header */}
                  <div className={`p-4 sm:p-5 border-b flex items-center justify-between relative z-10 ${
                    isLight ? 'border-stone-200 bg-white/70' : 'border-stone-800/80 bg-stone-950/70'
                  } backdrop-blur-md`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                        isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        <Music className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={`text-base sm:text-lg font-bold font-amiri ${isLight ? 'text-emerald-950 font-black' : 'text-amber-100'}`}>
                          تنظیمات و پخش موسیقی مهمانان
                        </h3>
                        <p className={`text-[11px] ${isLight ? 'text-stone-600' : 'text-stone-400'} font-light`}>
                          نوای دلخواه خود را برای همراهی در کارت جشن انتخاب کنید
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsOpenModal(false)}
                      className={`p-2 rounded-full transition-colors cursor-pointer ${
                        isLight
                          ? 'bg-stone-200/80 hover:bg-stone-300 text-stone-700'
                          : 'bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white'
                      }`}
                      title="بستن پنجره"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Scrollable Content Body */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 relative z-10 custom-scrollbar">
                    {/* Vinyl Turntable & Live Visualizer Card */}
                    <div className={`p-4 sm:p-5 rounded-2xl border relative overflow-hidden text-center ${
                      isLight
                        ? 'bg-gradient-to-br from-white via-amber-50/60 to-emerald-50/40 border-amber-400/40 shadow-sm'
                        : 'bg-gradient-to-br from-stone-900/90 via-stone-950 to-stone-900/90 border-amber-500/30 shadow-inner'
                    }`}>
                      {/* Rotating Vinyl Record Disk */}
                      <div className="relative inline-flex items-center justify-center my-2">
                        <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 shadow-2xl flex items-center justify-center relative ${
                          isLight ? 'border-amber-300 bg-stone-900' : 'border-amber-400/40 bg-stone-950'
                        } ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '5s' }}>
                          {/* Vinyl Groove Rings */}
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-stone-700/50 flex items-center justify-center">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-stone-600/40 flex items-center justify-center">
                              {/* Center Label */}
                              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-amber-600 to-amber-300 flex items-center justify-center shadow-md">
                                <Disc className="w-5 h-5 text-stone-950" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Tone arm needle effect badge */}
                        <div className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-amber-500 text-stone-950 text-[10px] font-bold shadow-md flex items-center gap-1">
                          <Radio className="w-3 h-3" />
                          <span>{isPlaying ? 'در حال پخش زنده' : 'آماده پخش'}</span>
                        </div>
                      </div>

                      {/* Current Track Details */}
                      <div className="mt-2">
                        <h4 className={`text-base sm:text-lg font-bold font-amiri truncate ${
                          isLight ? 'text-emerald-950' : 'text-amber-200'
                        }`}>
                          {currentTrack.title}
                        </h4>
                        <p className={`text-xs ${isLight ? 'text-stone-600' : 'text-stone-400'} font-light truncate mt-0.5`}>
                          {currentTrack.artist || 'نوای رمانتیک و دلنشین'}
                        </p>
                      </div>

                      {/* Equalizer Dynamic Dancing Bars */}
                      <div className="flex items-center justify-center gap-1.5 h-6 mt-3">
                        {[40, 75, 55, 90, 60, 85, 45].map((height, i) => (
                          <span
                            key={i}
                            className={`w-1 rounded-full transition-all duration-300 ${
                              isLight ? 'bg-amber-600' : 'bg-amber-400'
                            } ${
                              isPlaying ? 'animate-pulse' : 'opacity-30 h-1.5'
                            }`}
                            style={{
                              height: isPlaying ? `${height}%` : '4px',
                              animationDelay: `${i * 120}ms`,
                              animationDuration: '600ms'
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Master Playback Controls */}
                    <div className="flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={handlePrev}
                        className={`p-3 rounded-full border transition-all cursor-pointer ${
                          isLight
                            ? 'bg-white hover:bg-amber-100 text-stone-700 hover:text-amber-900 border-stone-300 shadow-sm'
                            : 'bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border-stone-800 shadow-lg'
                        }`}
                        title="قطعه قبلی"
                      >
                        <SkipBack className="w-5 h-5" />
                      </button>

                      <button
                        type="button"
                        onClick={togglePlay}
                        className="px-6 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 font-bold text-sm sm:text-base shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-5 h-5 fill-stone-950" />
                            <span>توقف موقت</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5 fill-stone-950 ml-0.5" />
                            <span>شروع پخش موسیقی</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleNext}
                        className={`p-3 rounded-full border transition-all cursor-pointer ${
                          isLight
                            ? 'bg-white hover:bg-amber-100 text-stone-700 hover:text-amber-900 border-stone-300 shadow-sm'
                            : 'bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border-stone-800 shadow-lg'
                        }`}
                        title="قطعه بعدی"
                      >
                        <SkipForward className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Master Volume Controller & Quick Buttons */}
                    <div className={`p-4 rounded-2xl border space-y-3 ${
                      isLight
                        ? 'bg-white/90 border-stone-200 shadow-sm'
                        : 'bg-stone-950/70 border-stone-800/80 shadow-md'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Volume2 className={`w-4 h-4 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
                          <span className={`text-xs font-bold ${isLight ? 'text-stone-800' : 'text-stone-200'}`}>
                            تنظیم میزان صدا:
                          </span>
                        </div>
                        <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                          isLight ? 'bg-amber-100 text-amber-900' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}>
                          {toPersianDigits(volume)}٪
                        </span>
                      </div>

                      {/* Slider */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleVolumeChange(0)}
                          className="text-stone-400 hover:text-amber-400 transition-colors"
                          title="بی‌صدا"
                        >
                          <VolumeX className="w-4 h-4" />
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={volume}
                          onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                          className="flex-1 h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleVolumeChange(100)}
                          className="text-stone-400 hover:text-amber-400 transition-colors"
                          title="حداکثر صدا"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quick Volume Preset Buttons */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleVolumeChange(0)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                            volume === 0
                              ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold'
                              : isLight
                              ? 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                              : 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800'
                          }`}
                        >
                          بی‌صدا (۰٪)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVolumeChange(50)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                            volume === 50
                              ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold'
                              : isLight
                              ? 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                              : 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800'
                          }`}
                        >
                          ملایم (۵۰٪)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVolumeChange(90)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                            volume >= 90
                              ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold'
                              : isLight
                              ? 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                              : 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800'
                          }`}
                        >
                          کامل (۹۰٪)
                        </button>
                      </div>
                    </div>

                    {/* Playlist Selection & Melodies List */}
                    <div>
                      <div className="flex items-center justify-between mb-2 px-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                          <Headphones className="w-3.5 h-3.5 text-amber-400" />
                          <span className={isLight ? 'text-stone-800' : 'text-amber-200'}>
                            انتخاب قطعه یا ساز موسیقی دلخواه:
                          </span>
                        </div>
                        <span className={`text-[11px] ${isLight ? 'text-stone-500' : 'text-stone-400'}`}>
                          {toPersianDigits(playlist.length)} ملودی
                        </span>
                      </div>

                      <div className="space-y-2">
                        {playlist.map((track, idx) => {
                          const isSelected = idx === currentTrackIndex;
                          return (
                            <button
                              key={track.id || idx}
                              type="button"
                              onClick={() => playTrackAtIndex(idx)}
                              className={`w-full text-right p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                isSelected
                                  ? isLight
                                    ? 'bg-amber-100/90 border-amber-500 shadow-sm text-emerald-950'
                                    : 'bg-amber-500/15 border-amber-400 shadow-lg text-amber-100'
                                  : isLight
                                  ? 'bg-white/80 border-stone-200 hover:bg-amber-50/50 text-stone-700'
                                  : 'bg-stone-950/60 border-stone-800/80 hover:bg-stone-900 text-stone-300'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'bg-amber-500 text-stone-950 font-bold'
                                    : isLight
                                    ? 'bg-stone-100 text-stone-500'
                                    : 'bg-stone-900 text-stone-400'
                                }`}>
                                  {isSelected && isPlaying ? (
                                    <Disc className="w-4 h-4 animate-spin text-stone-950" />
                                  ) : (
                                    <span className="font-mono text-xs">{idx + 1}</span>
                                  )}
                                </div>

                                <div className="min-w-0 text-right">
                                  <div className={`text-xs sm:text-sm font-amiri font-bold truncate ${
                                    isSelected ? (isLight ? 'text-emerald-950' : 'text-amber-200') : ''
                                  }`}>
                                    {track.title}
                                  </div>
                                  <div className={`text-[11px] truncate ${isLight ? 'text-stone-500' : 'text-stone-400'}`}>
                                    {track.artist || 'نوای آرامش‌بخش پیوند'}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {isSelected && (
                                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    isLight ? 'bg-amber-200 text-amber-900' : 'bg-amber-500/20 text-amber-300'
                                  }`}>
                                    {isPlaying ? 'در حال اجرا' : 'انتخاب شده'}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className={`p-4 border-t flex items-center justify-between ${
                    isLight ? 'border-stone-200 bg-stone-100/90' : 'border-stone-800/80 bg-stone-950'
                  }`}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoNext}
                        onChange={(e) => setAutoNext(e.target.checked)}
                        className="rounded accent-amber-500 cursor-pointer"
                      />
                      <span className={`text-xs ${isLight ? 'text-stone-700' : 'text-stone-300'}`}>
                        پخش پیوسته و خودکار قطعات بعدی
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsOpenModal(false)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md cursor-pointer transition-colors"
                    >
                      تایید و بستن
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
