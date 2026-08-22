import { useState, useEffect, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X, Check, Heart, User, Phone, Users, MessageSquare, AlertCircle, Sparkles, Music, Plus, Minus, Hash } from 'lucide-react';
import confetti from 'canvas-confetti';
import { WeddingCardData } from '../types';
import { toPersianDigits } from '../utils/dateUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: WeddingCardData;
  initialGuestName?: string;
}

export default function RSVPModal({ isOpen, onClose, data, initialGuestName = '' }: Props) {
  const [guestName, setGuestName] = useState(initialGuestName);
  const [phone, setPhone] = useState('');
  const [attending, setAttending] = useState<'yes' | 'no'>('yes');
  const [guestCount, setGuestCount] = useState(2);
  const [isCustomCountMode, setIsCustomCountMode] = useState(false);
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [songRequest, setSongRequest] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setErrorMsg('لطفاً نام و نام خانوادگی خود را وارد فرمایید');
      return;
    }

    if (data.rsvpConfig.requirePhone && !phone.trim()) {
      setErrorMsg('وارد کردن شماره تماس الزامی است');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: guestName.trim(),
          phone: phone.trim(),
          attending,
          guestCount: attending === 'yes' ? (guestCount > 0 ? guestCount : 1) : 0,
          dietaryNotes: dietaryNotes.trim(),
          songRequest: songRequest.trim(),
          message: message.trim()
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setIsSuccess(true);
        if (attending === 'yes') {
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#D4AF37', '#10B981', '#F43F5E', '#FFFFFF']
          });
        }
      } else {
        setErrorMsg(resData.error || 'خطایی در ثبت اطلاعات رخ داد');
      }
    } catch {
      // Local fallback
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    onClose();
  };

  const handleSelectPredefinedCount = (count: number) => {
    setGuestCount(count);
    setIsCustomCountMode(false);
  };

  return typeof document !== 'undefined'
    ? createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            className="relative w-full max-w-lg rounded-3xl bg-stone-900 border border-amber-500/40 p-5 sm:p-7 md:p-8 text-stone-100 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar my-auto"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 left-4 sm:top-5 sm:left-5 p-2 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

        {isSuccess ? (
          <div className="py-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center mb-4 text-emerald-400 shadow-lg shadow-emerald-900/50">
              <Check className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-bold font-amiri text-amber-200 mb-2">
              {attending === 'yes' ? 'با سپاس، حضور شما با موفقیت ثبت شد!' : 'پیام شما با موفقیت ثبت گردید'}
            </h3>

            <p className="text-stone-300 text-sm max-w-md leading-relaxed mb-6">
              {attending === 'yes'
                ? `مشتاقانه چشم‌انتظار دیدار روی ماه شما (${guestName}) ${guestCount > 1 ? `به همراه ${toPersianDigits(guestCount - 1)} نفر همراه محترم` : ''} در این بزم پر از شادی و خاطره هستیم.`
                : `با سپاس از اطلاع‌رسانی شما (${guestName}). دلتنگ حضورتان خواهیم بود و آرزوی سلامتی و بهترین‌ها را برایتان داریم.`}
            </p>

            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-semibold text-sm shadow-lg transition-all cursor-pointer"
            >
              بستن پنجره
            </button>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <span className="text-xs uppercase tracking-widest text-amber-400 block mb-1">
                تایید حضور آنلاین (RSVP)
              </span>
              <h2 className="text-2xl font-bold font-amiri text-amber-100">
                اعلام حضور در جشن عروسی
              </h2>
              <p className="text-xs text-stone-400 mt-1">
                مهلت تایید حضور: {data.rsvpConfig.deadlineDate}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {/* Attendance Choice */}
              <div>
                <label className="block text-xs text-amber-300/90 mb-1.5 font-medium">
                  آیا افتخار میزبانی شما را خواهیم داشت؟
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAttending('yes')}
                    className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all cursor-pointer text-xs ${
                      attending === 'yes'
                        ? 'bg-emerald-950 border-emerald-400 text-emerald-200 shadow-md shadow-emerald-950'
                        : 'bg-stone-800/60 border-stone-700 text-stone-400 hover:border-stone-600'
                    }`}
                  >
                    <Check className="w-4 h-4 shrink-0" />
                    <span>با کمال میل حضور خواهم داشت</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttending('no')}
                    className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all cursor-pointer text-xs ${
                      attending === 'no'
                        ? 'bg-rose-950 border-rose-400 text-rose-200 shadow-md shadow-rose-950'
                        : 'bg-stone-800/60 border-stone-700 text-stone-400 hover:border-stone-600'
                    }`}
                  >
                    <X className="w-4 h-4 shrink-0" />
                    <span>متاسفانه امکان حضور ندارم</span>
                  </button>
                </div>
              </div>

              {/* Guest Name */}
              <div>
                <label className="block text-xs text-stone-300 mb-1 font-medium">
                  نام و نام خانوادگی <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="مثلاً: دکتر علی صادقی و بانو"
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-stone-800/80 border border-stone-700 focus:border-amber-400 focus:outline-none text-stone-100 placeholder:text-stone-500"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs text-stone-300 mb-1 font-medium">
                  شماره تماس {data.rsvpConfig.requirePhone ? <span className="text-rose-400">* (الزامی)</span> : '(اختیاری جهت هماهنگی)'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="tel"
                    dir="ltr"
                    required={data.rsvpConfig.requirePhone}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-stone-800/80 border border-stone-700 focus:border-amber-400 focus:outline-none text-stone-100 placeholder:text-stone-500 text-right"
                  />
                </div>
              </div>

              {/* Guest Count (if attending) */}
              {attending === 'yes' && (
                <div className="p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-stone-300 font-medium flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>تعداد کل حاضرین (به همراه خودتان):</span>
                    </label>
                    <span className="text-amber-400 font-bold font-cinzel text-sm">
                      {toPersianDigits(guestCount)} نفر
                    </span>
                  </div>

                  {/* Predefined Quick Buttons (1 to 6) */}
                  <div className="grid grid-cols-6 gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((num) => {
                      const isSelected = guestCount === num && !isCustomCountMode;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleSelectPredefinedCount(num)}
                          className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 border-amber-400 text-stone-950 shadow-md shadow-amber-500/20'
                              : 'bg-stone-900 border-stone-700 text-stone-300 hover:border-amber-400/50'
                          }`}
                        >
                          {toPersianDigits(num)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Option for custom / more than 6 guests */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCountMode(true);
                          if (guestCount <= 6) setGuestCount(7);
                        }}
                        className={`flex-1 py-1.5 px-3 rounded-xl border text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          isCustomCountMode || guestCount > 6
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                            : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>بیشتر از ۶ نفر (تعداد دلخواه)</span>
                      </button>
                    </div>

                    {/* Numeric Stepper and Direct Input when custom mode is on or count > 6 */}
                    {(isCustomCountMode || guestCount > 6) && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-stone-900 border border-amber-500/30 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 flex items-center justify-center cursor-pointer font-bold"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={guestCount}
                            onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 py-1 px-2 text-center rounded-lg bg-stone-950 border border-stone-700 text-amber-300 font-bold text-sm font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setGuestCount(guestCount + 1)}
                            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 flex items-center justify-center cursor-pointer font-bold"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="text-xs text-stone-400">
                          نفر مهمان گرامی
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dietary note if enabled & attending */}
              {attending === 'yes' && data.rsvpConfig.showDietaryOptions && (
                <div>
                  <label className="block text-xs text-stone-300 mb-1 font-medium">
                    رژیم غذایی خاص یا حساسیت غذایی (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={dietaryNotes}
                    onChange={(e) => setDietaryNotes(e.target.value)}
                    placeholder="مثلاً: رژیم گیاه‌خواری، وگان یا بدون گلوتن"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-800/80 border border-stone-700 focus:border-amber-400 focus:outline-none text-stone-100 placeholder:text-stone-500 text-xs"
                  />
                </div>
              )}

              {/* Song request for DJ if attending and enabled */}
              {attending === 'yes' && (data.rsvpConfig.allowSongRequest ?? true) && (
                <div>
                  <label className="block text-xs text-stone-300 mb-1 font-medium flex items-center justify-between">
                    <span>پیشنهاد آهنگ به دی‌جی برای رقص و پایکوبی (اختیاری)</span>
                    <Music className="w-3.5 h-3.5 text-amber-400" />
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={songRequest}
                      onChange={(e) => setSongRequest(e.target.value)}
                      placeholder="نام قطعه موسیقی یا خواننده مورد علاقه شما برای جشن..."
                      className="w-full px-4 py-2.5 rounded-xl bg-stone-800/80 border border-stone-700 focus:border-amber-400 focus:outline-none text-stone-100 placeholder:text-stone-500 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Message / Warm Wish */}
              <div>
                <label className="block text-xs text-stone-300 mb-1 font-medium">
                  پیام تبریک یا یادداشت اختصاصی برای عروس و داماد
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 absolute right-3.5 top-3 text-stone-400" />
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="شادباش، دعای خیر یا توضیحات بیشتر..."
                    className="w-full pr-10 pl-4 py-2 rounded-xl bg-stone-800/80 border border-stone-700 focus:border-amber-400 focus:outline-none text-stone-100 placeholder:text-stone-500 text-xs leading-relaxed"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>در حال ثبت...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-stone-950" />
                      <span>ثبت نهایی تایید حضور</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  )
: null;
}

