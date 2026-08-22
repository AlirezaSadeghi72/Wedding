import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Send, Sparkles, MessageCircleHeart, Flame, Smile, Check, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GuestbookEntry } from '../types';
import { INITIAL_GUESTBOOK } from '../data/defaultWedding';
import { toPersianDigits } from '../utils/dateUtils';
import { getIsAdminSessionValid } from '../utils/security';
import ConfirmModal from './ConfirmModal';

interface Props {
  cardId?: string;
  isLight?: boolean;
}

export default function GuestbookSection({ cardId, isLight }: Props) {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [author, setAuthor] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const loadGuestbook = () => {
    fetch('/api/guestbook')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setEntries(data.data);
        }
      })
      .catch(() => {
        // Fallback to local
      });
  };

  useEffect(() => {
    loadGuestbook();

    const handleReset = () => {
      loadGuestbook();
    };

    window.addEventListener('wedding_data_reset', handleReset);
    return () => window.removeEventListener('wedding_data_reset', handleReset);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: author.trim(),
          message: message.trim()
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setEntries([data.data, ...entries]);
        setJustAddedId(data.data.id);
        setAuthor('');
        setMessage('');

        // Gold confetti
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#D4AF37', '#F43F5E', '#FBBF24']
        });
      }
    } catch {
      // Local fallback
      const localEntry: GuestbookEntry = {
        id: `gb-local-${Date.now()}`,
        author: author.trim(),
        message: message.trim(),
        date: 'لحظاتی پیش',
        likes: 1,
        flowers: 1,
        esfand: 1
      };
      setEntries([localEntry, ...entries]);
      setAuthor('');
      setMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = async (id: string, type: 'likes' | 'flowers' | 'esfand') => {
    // Optimistic update
    setEntries((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            [type]: (item[type] || 0) + 1
          };
        }
        return item;
      })
    );

    try {
      await fetch(`/api/guestbook/${id}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
    } catch {
      // Keep optimistic
    }
  };

  const handleDeleteEntry = (id: string, authorName: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'حذف پیام یادبود',
      message: `آیا از حذف این پیام ثبت‌شده توسط "${authorName}" اطمینان دارید؟`,
      onConfirm: async () => {
        try {
          setEntries((prev) => prev.filter((item) => item.id !== id));
          const encodedId = encodeURIComponent(id);
          const res = await fetch(`/api/guestbook/${encodedId}`, { method: 'DELETE' });
          if (!res.ok) {
            await fetch(`/api/guestbook/${encodedId}/delete`, { method: 'POST' });
          }
          window.dispatchEvent(new CustomEvent('wedding_data_reset'));
        } catch {
          loadGuestbook();
        }
      }
    });
  };

  const isAdmin = getIsAdminSessionValid();

  return (
    <div id="guestbook-section" className="w-full max-w-2xl mx-auto my-12 px-4 select-none">
      <div className={`rounded-3xl ${
        isLight
          ? 'bg-white/95 border border-amber-600/30 shadow-xl'
          : 'bg-stone-900/80 border border-amber-500/30 shadow-2xl'
      } p-6 md:p-8 backdrop-blur-xl`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center p-3 rounded-full ${
            isLight
              ? 'bg-amber-100 border border-amber-300 text-amber-800'
              : 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
          } mb-3`}>
            <MessageCircleHeart className="w-6 h-6" />
          </div>
          <h3 className={`text-2xl md:text-3xl font-bold font-amiri ${isLight ? 'text-emerald-950 font-black' : 'text-amber-100'} mb-1`}>
            دفترچه یادبود و شادباش مهمانان
          </h3>
          <p className={`text-xs md:text-sm ${isLight ? 'text-stone-600' : 'text-stone-400'}`}>
            زیباترین دعای خیر و تبریک‌های صمیمانه خود را برای عروس و داماد به یادگار بگذارید
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className={`mb-8 p-4 rounded-2xl ${
          isLight
            ? 'bg-stone-50 border border-stone-200'
            : 'bg-stone-950/60 border border-stone-800'
        } space-y-3`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs ${isLight ? 'text-stone-700 font-semibold' : 'text-stone-300'} mb-1 font-medium`}>
                نام شما / خانواده گرامی:
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="مثلاً: خانواده دکتر حسینی"
                className={`w-full px-3.5 py-2 rounded-xl ${
                  isLight
                    ? 'bg-white border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:border-amber-600'
                    : 'bg-stone-900 border border-stone-700 text-stone-100 placeholder:text-stone-500 focus:border-amber-400'
                } text-xs focus:outline-none`}
              />
            </div>
            <div className="flex items-end">
              <span className={`text-[11px] ${isLight ? 'text-amber-800' : 'text-amber-400/80'} pb-2`}>
                پیام شما بلافاصله در دیوار خاطرات نمایش داده می‌شود
              </span>
            </div>
          </div>

          <div>
            <label className={`block text-xs ${isLight ? 'text-stone-700 font-semibold' : 'text-stone-300'} mb-1 font-medium`}>
              متن شادباش و آرزوی قشنگ شما:
            </label>
            <textarea
              required
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="عروس و داماد نازنین، پیوند آسمانی‌تان مبارک و شادکام باشید..."
              className={`w-full px-3.5 py-2 rounded-xl ${
                isLight
                  ? 'bg-white border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:border-amber-600'
                  : 'bg-stone-900 border border-stone-700 text-stone-100 placeholder:text-stone-600 focus:border-amber-400'
              } text-xs focus:outline-none`}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>ثبت پیام تبریک</span>
          </button>
        </form>

        {/* Wishes Feed */}
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          <AnimatePresence>
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl border transition-all ${
                  justAddedId === entry.id
                    ? isLight
                      ? 'bg-amber-50 border-amber-500 shadow-md'
                      : 'bg-amber-950/40 border-amber-400 shadow-lg shadow-amber-950/50'
                    : isLight
                      ? 'bg-stone-50/90 border-stone-200 hover:border-amber-400'
                      : 'bg-stone-950/40 border-stone-800/80 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full ${
                      isLight
                        ? 'bg-amber-200 text-amber-900 border border-amber-400'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    } flex items-center justify-center text-xs font-bold font-amiri`}>
                      {entry.author.charAt(0)}
                    </div>
                    <span className={`font-bold text-xs ${isLight ? 'text-emerald-950' : 'text-amber-200'} font-amiri`}>
                      {entry.author}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-stone-500'}`}>{entry.date}</span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteEntry(entry.id, entry.author)}
                        className="p-1 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-300 transition-colors cursor-pointer"
                        title="حذف این نظر (مدیریت)"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <p className={`text-xs ${isLight ? 'text-stone-800 font-normal' : 'text-stone-300 font-light'} leading-relaxed mb-3`}>
                  {entry.message}
                </p>

                {/* Reaction Actions */}
                <div className={`flex items-center gap-2 pt-2 border-t ${isLight ? 'border-stone-200' : 'border-stone-800/60'} text-[11px] text-stone-400`}>
                  <button
                    onClick={() => handleReaction(entry.id, 'likes')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${
                      isLight
                        ? 'bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-700 border border-stone-200'
                        : 'bg-stone-900 hover:bg-rose-950/60 hover:text-rose-300 border border-stone-800'
                    } transition-colors cursor-pointer`}
                  >
                    <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20" />
                    <span>{toPersianDigits(entry.likes || 0)}</span>
                  </button>

                  <button
                    onClick={() => handleReaction(entry.id, 'flowers')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${
                      isLight
                        ? 'bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 border border-stone-200'
                        : 'bg-stone-900 hover:bg-emerald-950/60 hover:text-emerald-300 border border-stone-800'
                    } transition-colors cursor-pointer`}
                  >
                    <span>🌹</span>
                    <span>{toPersianDigits(entry.flowers || 0)}</span>
                  </button>

                  <button
                    onClick={() => handleReaction(entry.id, 'esfand')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${
                      isLight
                        ? 'bg-white hover:bg-blue-50 text-stone-700 hover:text-blue-700 border border-stone-200'
                        : 'bg-stone-900 hover:bg-blue-950/60 hover:text-blue-300 border border-stone-800'
                    } transition-colors cursor-pointer`}
                    title="دود کردن اسپند و چشم‌زخم"
                  >
                    <span>🧿</span>
                    <span>{toPersianDigits(entry.esfand || 0)}</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
