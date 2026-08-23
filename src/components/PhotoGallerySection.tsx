import { useState, useEffect, MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Eye, X, ChevronRight, ChevronLeft, Maximize2 } from 'lucide-react';
import { GalleryPhoto } from '../types';
import { toPersianDigits } from '../utils/dateUtils';
import {
  getSessionId,
  hasLikedPhoto,
  recordLikedPhoto,
  subscribeToLiveEvents
} from '../utils/sessionSync';

interface Props {
  photos?: GalleryPhoto[];
  isLight?: boolean;
}

export default function PhotoGallerySection({ photos, isLight }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [likedPhotoIds, setLikedPhotoIds] = useState<Set<string>>(new Set());

  // Load initial likes from server and check session liked status
  useEffect(() => {
    fetch('/api/gallery/likes')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setLikes(data.data);
        }
      })
      .catch(() => {});

    // Initial local check for session
    if (photos && photos.length > 0) {
      const initialLiked = new Set<string>();
      photos.forEach((p) => {
        if (hasLikedPhoto(p.id)) {
          initialLiked.add(p.id);
        }
      });
      setLikedPhotoIds(initialLiked);
    }

    // Subscribe to real-time updates from server
    const unsubscribe = subscribeToLiveEvents((event) => {
      if (event.type === 'PHOTO_LIKES_UPDATED' && event.payload) {
        const { photoId, likes: count, counts } = event.payload;
        if (counts) {
          setLikes(counts);
        } else if (photoId && typeof count === 'number') {
          setLikes((prev) => ({ ...prev, [photoId]: count }));
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [photos]);

  // Prevent background scroll and add Keyboard controls (Esc, Arrow keys)
  useEffect(() => {
    if (selectedIdx === null || !photos || photos.length === 0) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedIdx(null);
      } else if (e.key === 'ArrowLeft') {
        setSelectedIdx((prev) => (prev !== null ? (prev + 1) % photos.length : null));
      } else if (e.key === 'ArrowRight') {
        setSelectedIdx((prev) => (prev !== null ? (prev - 1 + photos.length) % photos.length : null));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedIdx, photos]);

  if (!photos || photos.length === 0) return null;

  const handleLike = async (e: MouseEvent, id: string) => {
    e.stopPropagation();

    // Enforce 1 like per session restriction
    if (likedPhotoIds.has(id) || hasLikedPhoto(id)) {
      return;
    }

    const sessionId = getSessionId();
    recordLikedPhoto(id);
    setLikedPhotoIds((prev) => new Set(prev).add(id));

    // Optimistic UI update
    setLikes((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));

    try {
      const res = await fetch(`/api/gallery/${encodeURIComponent(id)}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      if (data.success && typeof data.likes === 'number') {
        setLikes((prev) => ({ ...prev, [id]: data.likes }));
      }
    } catch {
      // Fallback stays optimistic
    }
  };

  const handleNext = (e?: MouseEvent) => {
    e?.stopPropagation();
    if (selectedIdx === null) return;
    setSelectedIdx((selectedIdx + 1) % photos.length);
  };

  const handlePrev = (e?: MouseEvent) => {
    e?.stopPropagation();
    if (selectedIdx === null) return;
    setSelectedIdx((selectedIdx - 1 + photos.length) % photos.length);
  };

  return (
    <div className={`my-12 sm:my-14 pt-8 sm:pt-10 border-t ${isLight ? 'border-stone-200' : 'border-stone-800/80'} w-full`}>
      {/* Section Header */}
      <div className="text-center mb-8 px-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${
            isLight
              ? 'bg-amber-100 border border-amber-400/60 text-amber-800'
              : 'bg-amber-500/10 border border-amber-400/30 text-amber-300'
          } text-xs mb-2 font-medium shadow-sm`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
          <span>آلبوم خاطرات شیرین</span>
        </motion.div>

        <h3 className={`text-2xl sm:text-3xl font-bold font-amiri ${isLight ? 'text-emerald-950 font-black' : 'text-stone-100'} mb-2`}>
          گالری عکس‌های یادگاری
        </h3>
        <p className={`text-xs sm:text-sm ${isLight ? 'text-stone-600' : 'text-stone-400'} font-light max-w-md mx-auto leading-relaxed`}>
          قاب‌هایی از لبخندها و عاشقانه‌های پیش از جشن وصال
        </p>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-xl mx-auto px-3 sm:px-4">
        {photos.map((item, idx) => {
          const itemLikes = likes[item.id] ?? 0;
          const isLikedByMe = likedPhotoIds.has(item.id);

          return (
            <motion.div
              key={item.id || idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              onClick={() => setSelectedIdx(idx)}
              className={`relative group rounded-2xl overflow-hidden ${
                isLight
                  ? 'bg-white border border-amber-600/30 hover:border-amber-500 shadow-md'
                  : 'bg-stone-950 border border-stone-800 hover:border-amber-400/60 shadow-lg'
              } cursor-pointer transition-all duration-300 transform-gpu hover:-translate-y-0.5`}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={item.url}
                  alt={item.caption || 'عکس عروسی'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700"
                />

                {/* Subtle Gold Vignette Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-75 group-hover:opacity-95 transition-opacity" />

                {/* Overlay Caption & Likes */}
                <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="p-1.5 rounded-full bg-black/40 text-amber-300/80 group-hover:text-amber-300 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleLike(e, item.id)}
                      title={isLikedByMe ? 'شما این عکس را پسندیده‌اید' : 'پسندیدن عکس (یکبار برای هر کاربر)'}
                      className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5 backdrop-blur-sm transition-all cursor-pointer select-none ${
                        isLikedByMe
                          ? 'bg-rose-600/90 text-white border border-rose-400/80 shadow-md shadow-rose-950/40 font-bold scale-105'
                          : 'bg-stone-900/80 hover:bg-rose-950/90 border border-stone-700 hover:border-rose-500/50 text-stone-200 hover:text-rose-300'
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition-transform ${
                          isLikedByMe ? 'fill-white text-white scale-110' : 'text-stone-300'
                        }`}
                      />
                      <span className="font-mono text-[11px]">{toPersianDigits(itemLikes)}</span>
                    </button>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm font-medium text-amber-100 font-amiri leading-tight drop-shadow-md">
                      {item.caption}
                    </p>
                    <span className="text-[11px] text-amber-300/90 flex items-center gap-1 mt-1 font-light">
                      <Eye className="w-3.5 h-3.5" />
                      لمس برای مشاهده بزرگ‌نمایی
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Fullscreen Lightbox Modal mounted directly to document.body via Portal */}
      {typeof document !== 'undefined' && selectedIdx !== null &&
        createPortal(
          <div
            onClick={() => setSelectedIdx(null)}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-xl select-none"
            style={{ margin: 0 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl max-h-[92vh] flex flex-col items-center justify-center my-auto"
            >
              {/* Top Bar with Like & Close */}
              <div className="absolute -top-12 inset-x-0 flex items-center justify-between px-1 sm:px-2 z-20">
                <button
                  type="button"
                  onClick={(e) => {
                    if (photos[selectedIdx]) {
                      handleLike(e, photos[selectedIdx].id);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg ${
                    photos[selectedIdx] && likedPhotoIds.has(photos[selectedIdx].id)
                      ? 'bg-rose-600 text-white border border-rose-400 font-bold'
                      : 'bg-stone-800/90 hover:bg-rose-900 text-stone-200 border border-stone-700'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      photos[selectedIdx] && likedPhotoIds.has(photos[selectedIdx].id)
                        ? 'fill-white text-white'
                        : ''
                    }`}
                  />
                  <span>
                    {photos[selectedIdx]
                      ? toPersianDigits(likes[photos[selectedIdx].id] ?? 0)
                      : '۰'}{' '}
                    پسند
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedIdx(null)}
                  className="p-2.5 rounded-full bg-stone-800/90 hover:bg-amber-500 hover:text-stone-950 text-white transition-all cursor-pointer shadow-xl"
                  title="بستن (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Photo Card */}
              <div className="relative w-full rounded-2xl overflow-hidden border border-amber-500/50 shadow-2xl bg-stone-950 flex flex-col max-h-[80vh]">
                <div className="relative flex-1 min-h-0 flex items-center justify-center bg-black overflow-hidden">
                  <img
                    src={photos[selectedIdx].url}
                    alt={photos[selectedIdx].caption}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-[68vh] object-contain select-none"
                  />
                </div>

                {photos[selectedIdx].caption && (
                  <div className="p-3 sm:p-3.5 bg-stone-900/95 text-center border-t border-stone-800 shrink-0">
                    <p className="font-amiri text-sm sm:text-base text-amber-200 font-bold">
                      {photos[selectedIdx].caption}
                    </p>
                  </div>
                )}
              </div>

              {/* Prev / Next & Counter Navigation Bar */}
              <div className="flex items-center justify-between w-full mt-3 px-2 sm:px-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3.5 py-2 rounded-xl bg-stone-900/90 hover:bg-amber-500 hover:text-stone-950 text-stone-200 border border-stone-700 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-md active:scale-95"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>عکس قبلی</span>
                </button>

                <span className="text-xs text-stone-300 font-mono font-medium px-3 py-1 rounded-full bg-stone-900 border border-stone-800">
                  {toPersianDigits(selectedIdx + 1)} / {toPersianDigits(photos.length)}
                </span>

                <button
                  type="button"
                  onClick={handleNext}
                  className="px-3.5 py-2 rounded-xl bg-stone-900/90 hover:bg-amber-500 hover:text-stone-950 text-stone-200 border border-stone-700 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-md active:scale-95"
                >
                  <span>عکس بعدی</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
