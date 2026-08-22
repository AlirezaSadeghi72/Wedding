import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, Camera, X } from 'lucide-react';
import { LoveStoryMilestone } from '../types';

interface Props {
  milestones?: LoveStoryMilestone[];
  isLight?: boolean;
}

export default function LoveStorySection({ milestones, isLight }: Props) {
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  // Lock body scroll when photo modal is open & add Esc key listener
  useEffect(() => {
    if (!activePhoto) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePhoto(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePhoto]);

  if (!milestones || milestones.length === 0) return null;

  return (
    <div className={`my-12 sm:my-14 pt-8 sm:pt-10 border-t ${isLight ? 'border-stone-200' : 'border-stone-800/80'} w-full overflow-hidden`}>
      {/* Section Header */}
      <div className="text-center mb-8 sm:mb-10 px-3">
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
          <span>روایت یک دلدادگی</span>
        </motion.div>

        <h3 className={`text-2xl sm:text-3xl font-bold font-amiri ${isLight ? 'text-emerald-950 font-black' : 'text-stone-100'} mb-2`}>
          داستان عشق و همراهی ما
        </h3>
        <p className={`text-xs sm:text-sm ${isLight ? 'text-stone-600' : 'text-stone-400'} font-light max-w-md mx-auto leading-relaxed`}>
          فصل‌هایی از زیباترین لحظات و خاطرات مشترکمان تا رسیدن به این شب رویایی
        </p>
      </div>

      {/* Timeline Container - Redesigned for mobile responsiveness */}
      <div className="relative w-full max-w-2xl mx-auto px-3 sm:px-4">
        {/* Glowing Line - Far Right on Mobile, Centered on Desktop */}
        <div
          className={`absolute top-4 bottom-4 right-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 w-0.5 ${
            isLight
              ? 'bg-gradient-to-b from-amber-500/80 via-emerald-600/50 to-amber-500/20'
              : 'bg-gradient-to-b from-amber-400/90 via-amber-500/40 to-amber-500/10'
          } pointer-events-none`}
        />

        <div className="space-y-6 sm:space-y-10">
          {milestones.map((item, idx) => {
            const isEven = idx % 2 === 0;
            const photoUrl = item.imageUrl || item.image;

            return (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className={`relative flex items-center ${
                  isEven ? 'sm:flex-row-reverse' : 'sm:flex-row'
                }`}
              >
                {/* Marker Dot: Positioned on right for Mobile, Centered on Desktop */}
                <div
                  className={`absolute right-0.5 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 top-4 sm:top-1/2 sm:-translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full ${
                    isLight
                      ? 'bg-white border-2 border-amber-600 shadow-md shadow-amber-900/20'
                      : 'bg-stone-950 border-2 border-amber-400 shadow-lg shadow-amber-500/40'
                  } flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                      isLight
                        ? 'text-amber-600 fill-amber-500/30'
                        : 'text-amber-400 fill-amber-400/40'
                    }`}
                  />
                </div>

                {/* Content Card Container - Full width on Mobile, Half width on Desktop */}
                <div
                  className={`w-full mr-9 sm:mr-0 sm:w-[calc(50%-2rem)] ${
                    isEven
                      ? 'sm:ml-auto sm:text-right'
                      : 'sm:mr-auto sm:text-right'
                  } text-right`}
                >
                  <div
                    className={`p-4 sm:p-5 rounded-2xl ${
                      isLight
                        ? 'bg-white/95 border border-amber-600/30 hover:border-amber-500 shadow-md hover:shadow-lg'
                        : 'bg-stone-950/85 border border-stone-800/90 hover:border-amber-500/50 shadow-xl'
                    } transition-all duration-300 group backdrop-blur-sm relative overflow-hidden`}
                  >
                    {/* Corner golden ornament shimmer */}
                    <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/5 rounded-bl-full pointer-events-none" />

                    {/* Year / Date Badge */}
                    <div className="flex items-center flex-wrap gap-1.5 mb-2">
                      {(item.year || item.date) && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full ${
                            isLight
                              ? 'bg-amber-100 text-amber-950 border border-amber-300'
                              : 'bg-amber-500/15 border border-amber-400/40 text-amber-300'
                          } font-cinzel text-xs font-bold`}
                        >
                          {item.year || item.date}
                        </span>
                      )}
                      {item.date && item.year && (
                        <span
                          className={`text-xs ${
                            isLight ? 'text-stone-600 font-medium' : 'text-stone-400'
                          }`}
                        >
                          {item.date}
                        </span>
                      )}
                    </div>

                    <h4
                      className={`font-bold text-sm sm:text-base ${
                        isLight
                          ? 'text-stone-900 group-hover:text-emerald-950'
                          : 'text-stone-100 group-hover:text-amber-200'
                      } font-amiri mb-1.5 transition-colors leading-snug`}
                    >
                      {item.title}
                    </h4>

                    <p
                      className={`text-xs ${
                        isLight ? 'text-stone-700 font-normal' : 'text-stone-300 font-light'
                      } leading-relaxed mb-3 break-words`}
                    >
                      {item.description}
                    </p>

                    {/* Optional Photo Attachment */}
                    {photoUrl && (
                      <div
                        onClick={() => setActivePhoto(photoUrl)}
                        className={`relative rounded-xl overflow-hidden aspect-[16/9] border ${
                          isLight
                            ? 'border-amber-400/40 group-hover:border-amber-600 bg-stone-100'
                            : 'border-amber-500/20 group-hover:border-amber-400/50 bg-stone-900'
                        } cursor-pointer transition-all shadow-md mt-1`}
                      >
                        <img
                          src={photoUrl}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                          <span className="text-xs text-amber-200 flex items-center gap-1 font-medium">
                            <Camera className="w-3.5 h-3.5 text-amber-400" />
                            مشاهده عکس بزرگ‌تر
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Photo Preview Modal rendered directly on document.body via Portal */}
      {typeof document !== 'undefined' && activePhoto &&
        createPortal(
          <div
            onClick={() => setActivePhoto(null)}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-xl cursor-pointer select-none"
            style={{ margin: 0 }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center cursor-default"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                className="absolute -top-12 left-0 sm:left-2 p-2 rounded-full bg-stone-800/90 hover:bg-amber-500 hover:text-stone-950 text-white transition-all cursor-pointer shadow-lg z-10"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative rounded-2xl overflow-hidden border border-amber-500/50 shadow-2xl bg-stone-950 max-h-[82vh] flex items-center justify-center">
                <img
                  src={activePhoto}
                  alt="عکس یادگاری"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-contain max-h-[80vh] rounded-2xl"
                />
              </div>

              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => setActivePhoto(null)}
                  className="px-5 py-1.5 rounded-full bg-stone-900 border border-stone-700 text-stone-300 hover:text-white text-xs transition-colors cursor-pointer"
                >
                  بستن پیش‌نمایش (Esc)
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
    </div>
  );
}
