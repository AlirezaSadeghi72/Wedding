import { useState, useEffect, useCallback, MouseEvent } from 'react';
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
  Headphones,
  Settings,
  Check
} from 'lucide-react';
import { weddingAudio } from '../utils/audioSynth';
import { WeddingCardData, MusicTrack } from '../types';
import { toPersianDigits } from '../utils/dateUtils';

interface Props {
  data: WeddingCardData;
  onOpenStudio?: () => void;
  isAdminAuthenticated?: boolean;
}

export default function AudioPlayerFloating({ data, onOpenStudio, isAdminAuthenticated }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [volume, setVolume] = useState<number>(() => {
    return data.music?.volume ? Math.round(data.music.volume * 100) : 80;
  });
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [autoNext, setAutoNext] = useState(true);

  const isLight = true;

  // Build combined playlist strictly synchronized with data.music settings
  const buildPlaylist = useCallback((): MusicTrack[] => {
    const musicConfig = data.music;
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
  }, [data.music]);

  const playlist = buildPlaylist();
  const safeIndex = Math.min(Math.max(0, currentTrackIndex), Math.max(0, playlist.length - 1));
  const currentTrack = playlist[safeIndex] || playlist[0];

  // Sync volume with data.music when settings are saved
  useEffect(() => {
    if (data.music?.volume !== undefined) {
      const volPercent = Math.round(data.music.volume * 100);
      setVolume(volPercent);
      weddingAudio.setVolume(data.music.volume);
    }
  }, [data.music?.volume]);

  // Keep player playback status in sync with weddingAudio engine
  useEffect(() => {
    const interval = setInterval(() => {
      const active = weddingAudio.getIsPlaying();
      setIsPlaying(active);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Lock body scroll and keydown listener for modal
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

  const playTrackAtIndex = useCallback((index: number) => {
    if (!playlist || playlist.length === 0) return;
    const nextIdx = (index + playlist.length) % playlist.length;
    setCurrentTrackIndex(nextIdx);
    const track = playlist[nextIdx];

    weddingAudio.stop();
    weddingAudio.setVolume(volume / 100);

    const onTrackEnd = () => {
      if (autoNext) {
        playTrackAtIndex(nextIdx + 1);
      } else {
        setIsPlaying(false);
      }
    };

    weddingAudio.playTrack(track, onTrackEnd);
    setIsPlaying(true);
  }, [playlist, volume, autoNext]);

  // React to updates in data.music settings (if currently playing, re-apply track changes)
  useEffect(() => {
    if (isPlaying) {
      const runningTrack = weddingAudio.getCurrentTrack();
      if (runningTrack && currentTrack) {
        // If the URL or synthPreset or title changed in settings, refresh current playing track
        const currentUrl = currentTrack.url || currentTrack.audioUrl;
        const runningUrl = runningTrack.url || runningTrack.audioUrl;
        if (currentUrl !== runningUrl || currentTrack.synthPreset !== runningTrack.synthPreset) {
          playTrackAtIndex(safeIndex);
        }
      }
    }
  }, [data.music?.audioUrl, data.music?.synthPreset, data.music?.title, safeIndex, isPlaying, currentTrack, playTrackAtIndex]);

  const togglePlay = () => {
    if (isPlaying) {
      weddingAudio.stop();
      setIsPlaying(false);
    } else {
      playTrackAtIndex(safeIndex);
    }
  };

  const handleNext = (e?: MouseEvent) => {
    e?.stopPropagation();
    playTrackAtIndex(safeIndex + 1);
  };

  const handlePrev = (e?: MouseEvent) => {
    e?.stopPropagation();
    playTrackAtIndex(safeIndex - 1);
  };

  const handleVolumeChange = (newVolPercent: number) => {
    const clamped = Math.max(0, Math.min(100, newVolPercent));
    setVolume(clamped);
    weddingAudio.setVolume(clamped / 100);
  };

  if (!data.music?.enabled) {
    return null;
  }

  return (
    <>
      {/* Fixed Bottom Footer Music Bar */}
      <footer
        id="permanent-music-footer"
        className="fixed bottom-0 inset-x-0 z-40 w-full bg-white/95 text-stone-900 border-t border-amber-300 shadow-[0_-8px_30px_rgba(217,119,6,0.12)] backdrop-blur-xl transition-all duration-300 select-none"
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Section 1 (Right in RTL): Track Info & Spinning Vinyl Disc */}
          <div
            onClick={() => setIsOpenModal(true)}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group min-w-0 max-w-[42%] sm:max-w-[35%]"
            title="کلیک کنید برای تنظیمات و انتخاب لیست موسیقی"
          >
            {/* Spinning Vinyl Disc */}
            <div className="relative flex items-center justify-center shrink-0">
              <div
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border transition-transform ${
                  isPlaying
                    ? 'bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 border-amber-400 shadow-md animate-spin'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
                style={{ animationDuration: '3.5s' }}
              >
                <Disc className={`w-5 h-5 sm:w-6 sm:h-6 ${isPlaying ? 'text-stone-950' : 'text-amber-800'}`} />
              </div>
              {isPlaying && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping ring-2 ring-emerald-400" />
              )}
            </div>

            {/* Track Title and Subtitle */}
            <div className="flex flex-col min-w-0 text-right">
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm font-bold font-amiri text-emerald-950 truncate group-hover:text-amber-700 transition-colors">
                  {currentTrack ? currentTrack.title : 'موزیک جشن عروسی'}
                </span>
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0 hidden sm:inline" />
              </div>
              <span className="text-[10px] sm:text-[11px] text-stone-500 truncate font-light">
                {currentTrack?.artist || 'ملودی عاشقانه و دلنشین'}
              </span>
            </div>
          </div>

          {/* Section 2 (Center): Playback Controls (Prev, Play/Pause, Next) */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-3 shrink-0">
            {/* Prev Track */}
            <button
              type="button"
              onClick={handlePrev}
              className="p-2 sm:p-2.5 rounded-full hover:bg-amber-100 text-stone-700 hover:text-amber-950 transition-colors cursor-pointer"
              title="قطعه قبلی"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Play / Pause Main Button */}
            <button
              type="button"
              id="permanent-footer-play-btn"
              onClick={togglePlay}
              className="p-2.5 sm:p-3.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 font-bold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center ring-2 ring-amber-300/60"
              title={isPlaying ? 'توقف موسیقی' : 'پخش موسیقی'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-stone-950 text-stone-950" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-stone-950 text-stone-950 ml-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              type="button"
              onClick={handleNext}
              className="p-2 sm:p-2.5 rounded-full hover:bg-amber-100 text-stone-700 hover:text-amber-950 transition-colors cursor-pointer"
              title="قطعه بعدی"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Section 3 (Left in RTL): Volume & Open Settings Popup */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-3 shrink-0">
            {/* Volume slider on desktop */}
            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleVolumeChange(volume === 0 ? 80 : 0)}
                className="p-1.5 rounded-lg text-stone-600 hover:text-amber-800 transition-colors"
                title={volume === 0 ? 'با صدا' : 'بی‌صدا'}
              >
                {volume === 0 ? <VolumeX className="w-4 h-4 text-rose-600" /> : <Volume2 className="w-4 h-4 text-amber-700" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                className="w-16 lg:w-22 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <span className="text-[10px] font-mono font-bold w-7 text-left text-stone-600">
                {toPersianDigits(volume)}٪
              </span>
            </div>

            {/* Open Settings Modal Button */}
            <button
              type="button"
              id="open-music-settings-popup"
              onClick={() => setIsOpenModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-amber-100/80 hover:bg-amber-200 text-amber-950 border border-amber-300/80 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="باز کردن پنل تنظیمات و لیست قطعات"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">لیست موزیک‌ها</span>
              <span className="sm:hidden">تنظیمات</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Music Selection & Control Modal via Portal */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpenModal && (
              <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 select-none">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsOpenModal(false)}
                  className="fixed inset-0 bg-stone-900/60 backdrop-blur-md cursor-pointer"
                />

                {/* Modal Container */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-lg max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border flex flex-col z-10 bg-[#FFFDF7] border-amber-300 text-stone-900"
                >
                  {/* Glowing Ambient Backdrop Orbs */}
                  <div className="absolute top-0 right-1/4 w-48 h-48 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />

                  {/* Header */}
                  <div className="p-4 sm:p-5 border-b border-stone-200 bg-white/80 backdrop-blur-md flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shadow-sm">
                        <Music className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold font-amiri text-emerald-950">
                          تنظیمات و پخش موسیقی جشن
                        </h3>
                        <p className="text-[11px] text-stone-600 font-light">
                          انتخاب و مدیریت موزیک‌های همراه دعوت‌نامه
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsOpenModal(false)}
                      className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                      title="بستن"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Scrollable Modal Body */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 relative z-10 custom-scrollbar">
                    
                    {/* Vinyl Turntable Display Card */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-amber-300/80 bg-gradient-to-br from-white via-amber-50/70 to-emerald-50/50 shadow-sm text-center relative overflow-hidden">
                      {/* Rotating Vinyl Record Disk */}
                      <div className="relative inline-flex items-center justify-center my-2">
                        <div
                          className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-amber-300 bg-stone-900 shadow-xl flex items-center justify-center relative ${
                            isPlaying ? 'animate-spin' : ''
                          }`}
                          style={{ animationDuration: '4.5s' }}
                        >
                          {/* Vinyl Groove Rings */}
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-stone-700/60 flex items-center justify-center">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-stone-600/50 flex items-center justify-center">
                              {/* Center Label */}
                              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-amber-600 to-amber-300 flex items-center justify-center shadow-md">
                                <Disc className="w-5 h-5 text-stone-950" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-amber-500 text-stone-950 text-[10px] font-bold shadow-md flex items-center gap-1">
                          <Radio className="w-3 h-3" />
                          <span>{isPlaying ? 'در حال پخش زنده' : 'آماده پخش'}</span>
                        </div>
                      </div>

                      {/* Track Info */}
                      <div className="mt-2">
                        <h4 className="text-base sm:text-lg font-bold font-amiri text-emerald-950 truncate">
                          {currentTrack ? currentTrack.title : 'موزیک جشن'}
                        </h4>
                        <p className="text-xs text-stone-600 font-light truncate mt-0.5">
                          {currentTrack?.artist || 'نوای آرامش‌بخش جشن'}
                        </p>
                      </div>

                      {/* Equalizer Frequency Bars */}
                      <div className="flex items-center justify-center gap-1.5 h-6 mt-3">
                        {[40, 75, 55, 90, 60, 85, 45].map((height, i) => (
                          <span
                            key={i}
                            className={`w-1 rounded-full transition-all duration-300 bg-amber-600 ${
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
                        className="p-3 rounded-full border border-stone-300 bg-white hover:bg-amber-100 text-stone-800 transition-all cursor-pointer shadow-sm"
                        title="قطعه قبلی"
                      >
                        <SkipBack className="w-5 h-5" />
                      </button>

                      <button
                        type="button"
                        onClick={togglePlay}
                        className="px-6 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 font-bold text-sm sm:text-base shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
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
                        className="p-3 rounded-full border border-stone-300 bg-white hover:bg-amber-100 text-stone-800 transition-all cursor-pointer shadow-sm"
                        title="قطعه بعدی"
                      >
                        <SkipForward className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Volume Controls & Quick Presets */}
                    <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-amber-700" />
                          <span className="text-xs font-bold text-stone-800">
                            تنظیم میزان صدا:
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                          {toPersianDigits(volume)}٪
                        </span>
                      </div>

                      {/* Volume Slider */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleVolumeChange(0)}
                          className="text-stone-400 hover:text-amber-700 transition-colors"
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
                          className="flex-1 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleVolumeChange(100)}
                          className="text-stone-400 hover:text-amber-700 transition-colors"
                          title="حداکثر صدا"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quick Presets */}
                      <div className="grid grid-cols-4 gap-2 pt-1">
                        {[0, 30, 60, 100].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => handleVolumeChange(v)}
                            className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                              volume === v
                                ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-sm'
                                : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                            }`}
                          >
                            {v === 0 ? 'بی‌صدا' : `${toPersianDigits(v)}٪`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Admin Direct Shortcut to Studio Music Settings */}
                    {isAdminAuthenticated && onOpenStudio && (
                      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                          <Settings className="w-4 h-4 text-amber-700" />
                          <span>تغییر فایل‌های صوتی یا لینک موسیقی؟</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpenModal(false);
                            onOpenStudio();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
                        >
                          استودیو ویرایش
                        </button>
                      </div>
                    )}

                    {/* Playlist Selection */}
                    <div>
                      <div className="flex items-center justify-between mb-2 px-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                          <Headphones className="w-3.5 h-3.5 text-amber-700" />
                          <span>انتخاب قطعه یا ساز موسیقی:</span>
                        </div>
                        <span className="text-[11px] text-stone-500 font-medium">
                          {toPersianDigits(playlist.length)} قطعه موجود
                        </span>
                      </div>

                      <div className="space-y-2">
                        {playlist.map((track, idx) => {
                          const isSelected = idx === safeIndex;
                          return (
                            <button
                              key={track.id || idx}
                              type="button"
                              onClick={() => playTrackAtIndex(idx)}
                              className={`w-full text-right p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-100/90 border-amber-500 shadow-sm text-emerald-950'
                                  : 'bg-white border-stone-200 hover:bg-amber-50/50 text-stone-700'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'bg-amber-500 text-stone-950 font-bold'
                                    : 'bg-stone-100 text-stone-500'
                                }`}>
                                  {isSelected && isPlaying ? (
                                    <Disc className="w-4 h-4 animate-spin text-stone-950" />
                                  ) : (
                                    <span className="font-mono text-xs">{toPersianDigits(idx + 1)}</span>
                                  )}
                                </div>

                                <div className="min-w-0 text-right">
                                  <div className={`text-xs sm:text-sm font-amiri font-bold truncate ${
                                    isSelected ? 'text-emerald-950' : 'text-stone-900'
                                  }`}>
                                    {track.title}
                                  </div>
                                  <div className="text-[11px] text-stone-500 truncate">
                                    {track.artist || 'نوای دلنشین و آرام‌بخش'}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {isSelected && (
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 flex items-center gap-1">
                                    <Check className="w-3 h-3 text-amber-800" />
                                    <span>{isPlaying ? 'در حال اجرا' : 'انتخاب شده'}</span>
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
                  <div className="p-4 border-t border-stone-200 bg-stone-100/90 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoNext}
                        onChange={(e) => setAutoNext(e.target.checked)}
                        className="rounded accent-amber-600 cursor-pointer"
                      />
                      <span className="text-xs text-stone-700 font-medium">
                        پخش پیوسته و خودکار قطعات بعدی
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsOpenModal(false)}
                      className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-sm cursor-pointer transition-colors"
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
