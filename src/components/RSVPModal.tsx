import { useState, useEffect, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X, Check, Heart, User, Phone, Users, MessageSquare, AlertCircle, Sparkles, Music, Plus, Minus, Hash } from 'lucide-react';
import confetti from 'canvas-confetti';
import { WeddingCardData } from '../types';
import { toPersianDigits } from '../utils/dateUtils';
import { sanitizePhoneInput, normalizePhoneNumber, isValidIranianMobile, toEnglishDigits } from '../utils/phoneUtils';
import { sanitizeString } from '../utils/security';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: WeddingCardData;
  initialGuestName?: string;
  isLight?: boolean;
}

export default function RSVPModal({ isOpen, onClose, data, initialGuestName = '', isLight = true }: Props) {
  const [guestName, setGuestName] = useState(initialGuestName);
  const [phone, setPhone] = useState('');
  const [attending, setAttending] = useState<'yes' | 'no'>('yes');
  const [guestCount, setGuestCount] = useState<number | ''>(2);
  const [isCustomCountMode, setIsCustomCountMode] = useState(false);
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [songRequest, setSongRequest] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [countError, setCountError] = useState('');

  const maxGuestsAllowed = data.rsvpConfig?.maxGuestsPerParty || 10;
  const predefinedButtonsCount = Math.min(6, maxGuestsAllowed);
  const quickNumbers = Array.from({ length: predefinedButtonsCount }, (_, i) => i + 1);

  const safeParseCount = (val: number | string | ''): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const englishDigits = toEnglishDigits(String(val)).replace(/\D/g, '');
    return parseInt(englishDigits) || 0;
  };

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
    
    let hasError = false;
    setNameError('');
    setPhoneError('');
    setCountError('');
    setErrorMsg('');

    const cleanName = sanitizeString(guestName, 100);
    if (!cleanName) {
      setNameError('لطفاً نام و نام خانوادگی خود را وارد فرمایید');
      hasError = true;
    }

    const cleanedPhone = normalizePhoneNumber(phone);

    if (data.rsvpConfig.requirePhone && !cleanedPhone) {
      setPhoneError('وارد کردن شماره موبایل الزامی است');
      hasError = true;
    } else if (cleanedPhone && !isValidIranianMobile(cleanedPhone)) {
      setPhoneError('لطفاً شماره موبایل معتبر ۱۱ رقمی وارد نمایید (مثال: ۰۹۱۲۳۴۵۶۷۸۹)');
      hasError = true;
    }

    const countNum = safeParseCount(guestCount);
    if (attending === 'yes' && (guestCount === '' || isNaN(countNum) || countNum < 1 || countNum > maxGuestsAllowed)) {
      setCountError(`لطفاً تعداد کل حاضرین را عددی بین ۱ تا ${toPersianDigits(maxGuestsAllowed)} وارد نمایید`);
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: cleanName,
          phone: cleanedPhone,
          attending,
          guestCount: attending === 'yes' ? (safeParseCount(guestCount) > 0 ? safeParseCount(guestCount) : 1) : 0,
          dietaryNotes: sanitizeString(dietaryNotes, 200),
          songRequest: sanitizeString(songRequest, 100),
          message: sanitizeString(message, 500),
          website: honeypot // Anti-bot honeypot
        })
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-4 bg-stone-900/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            className={`relative w-full max-w-lg rounded-3xl ${
              isLight
                ? 'bg-[#FFFDF7] border border-amber-300/80 text-stone-900'
                : 'bg-stone-900 border border-amber-500/40 text-stone-100'
            } p-3.5 sm:p-6 md:p-8 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto custom-scrollbar my-auto`}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className={`absolute top-3 left-3 sm:top-5 sm:left-5 p-1.5 sm:p-2 rounded-full ${
                isLight
                  ? 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                  : 'bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white'
              } transition-colors cursor-pointer`}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

        {isSuccess ? (
          <div className="py-6 sm:py-8 text-center flex flex-col items-center">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${
              isLight
                ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-700 shadow-md'
                : 'bg-emerald-950 border-2 border-emerald-400 text-emerald-400 shadow-lg shadow-emerald-900/50'
            } flex items-center justify-center mb-3 sm:mb-4`}>
              <Check className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <h3 className={`text-xl sm:text-2xl font-bold font-amiri ${isLight ? 'text-emerald-950 font-black' : 'text-amber-200'} mb-2`}>
              {attending === 'yes' ? 'با سپاس، حضور شما با موفقیت ثبت شد!' : 'پیام شما با موفقیت ثبت گردید'}
            </h3>

            <p className={`${isLight ? 'text-stone-700' : 'text-stone-300'} text-xs sm:text-sm max-w-md leading-relaxed mb-5`}>
              {attending === 'yes'
                ? `مشتاقانه چشم‌انتظار دیدار روی ماه شما (${guestName}) ${safeParseCount(guestCount) > 1 ? `به همراه ${toPersianDigits(safeParseCount(guestCount) - 1)} نفر همراه محترم` : ''} در این بزم پر از شادی و خاطره هستیم.`
                : `با سپاس از اطلاع‌رسانی شما (${guestName}). دلتنگ حضورتان خواهیم بود و آرزوی سلامتی و بهترین‌ها را برایتان داریم.`}
            </p>

            <button
              onClick={handleReset}
              className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-semibold text-xs sm:text-sm shadow-lg transition-all cursor-pointer"
            >
              بستن پنجره
            </button>
          </div>
        ) : (
          <div>
            <div className="text-center mb-3 sm:mb-5">
              <span className={`text-[10px] sm:text-xs uppercase tracking-widest ${isLight ? 'text-amber-700 font-bold' : 'text-amber-400'} block mb-0.5`}>
                تایید حضور آنلاین (RSVP)
              </span>
              <h2 className={`text-lg sm:text-2xl font-bold font-amiri ${isLight ? 'text-emerald-950 font-black' : 'text-amber-100'}`}>
                اعلام حضور در جشن عروسی
              </h2>
              <p className={`text-[11px] sm:text-xs ${isLight ? 'text-stone-600' : 'text-stone-400'} mt-0.5`}>
                مهلت تایید حضور: {data.rsvpConfig.deadlineDate}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
              {/* Attendance Choice */}
              <div>
                <label className={`block text-xs ${isLight ? 'text-amber-900 font-bold' : 'text-amber-300/90'} mb-1.5 font-medium`}>
                  آیا افتخار میزبانی شما را خواهیم داشت؟
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAttending('yes')}
                    className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all cursor-pointer text-xs ${
                      attending === 'yes'
                        ? isLight
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold shadow-sm'
                          : 'bg-emerald-950 border-emerald-400 text-emerald-200 shadow-md shadow-emerald-950'
                        : isLight
                        ? 'bg-white border-stone-300 text-stone-700 hover:border-amber-400'
                        : 'bg-stone-800/60 border-stone-700 text-stone-400 hover:border-stone-600'
                    }`}
                  >
                    <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>با کمال میل حضور خواهم داشت</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttending('no')}
                    className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all cursor-pointer text-xs ${
                      attending === 'no'
                        ? isLight
                          ? 'bg-rose-100 border-rose-500 text-rose-950 font-bold shadow-sm'
                          : 'bg-rose-950 border-rose-400 text-rose-200 shadow-md shadow-rose-950'
                        : isLight
                        ? 'bg-white border-stone-300 text-stone-700 hover:border-amber-400'
                        : 'bg-stone-800/60 border-stone-700 text-stone-400 hover:border-stone-600'
                    }`}
                  >
                    <X className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>متاسفانه امکان حضور ندارم</span>
                  </button>
                </div>
              </div>

              {/* Honeypot field for bot protection */}
              <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {/* Guest Name */}
              <div>
                <label className={`block text-xs ${isLight ? 'text-stone-700 font-semibold' : 'text-stone-300 font-medium'} mb-1`}>
                  نام و نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-stone-500' : 'text-stone-400'}`} />
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => {
                      setGuestName(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    placeholder="مثلاً: دکتر علی صادقی و بانو"
                    className={`w-full pr-10 pl-4 py-2.5 rounded-xl ${
                      nameError
                        ? 'border-rose-500 bg-rose-50/5'
                        : isLight
                        ? 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400 focus:border-amber-500'
                        : 'bg-stone-800/80 border-stone-700 text-stone-100 placeholder:text-stone-500 focus:border-amber-400'
                    } border focus:outline-none`}
                  />
                </div>
                {nameError && (
                  <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {nameError}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className={`block text-xs ${isLight ? 'text-stone-700 font-semibold' : 'text-stone-300 font-medium'} mb-1`}>
                  شماره همراه {data.rsvpConfig.requirePhone ? <span className="text-rose-500">* (الزامی)</span> : '(اختیاری جهت هماهنگی)'}
                </label>
                <div className="relative">
                  <Phone className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-stone-500' : 'text-stone-400'}`} />
                  <input
                    type="tel"
                    dir="ltr"
                    required={data.rsvpConfig.requirePhone}
                    value={toPersianDigits(phone)}
                    onChange={(e) => {
                      setPhone(sanitizePhoneInput(e.target.value));
                      if (phoneError) setPhoneError('');
                    }}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    maxLength={11}
                    className={`w-full pr-10 pl-4 py-2.5 rounded-xl ${
                      phoneError
                        ? 'border-rose-500 bg-rose-50/5'
                        : isLight
                        ? 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400 focus:border-amber-500'
                        : 'bg-stone-800/80 border-stone-700 text-stone-100 placeholder:text-stone-500 focus:border-amber-400'
                    } border focus:outline-none text-right font-vazir tracking-wider`}
                  />
                </div>
                {phoneError && (
                  <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {phoneError}
                  </p>
                )}
              </div>

              {/* Guest Count (if attending) */}
              {attending === 'yes' && (
                <div className={`p-3.5 rounded-2xl ${
                  countError
                    ? 'bg-rose-50/5 border-rose-500'
                    : isLight 
                    ? 'bg-amber-50/80 border-amber-300/60' 
                    : 'bg-stone-950/60 border-stone-800'
                } border space-y-3`}>
                  <div className="flex items-center justify-between">
                    <label className={`text-xs ${
                      countError
                        ? 'text-rose-500 font-bold'
                        : isLight 
                        ? 'text-stone-800 font-semibold' 
                        : 'text-stone-300 font-medium'
                    } flex items-center gap-1.5`}>
                      <Users className={`w-4 h-4 ${countError ? 'text-rose-500' : isLight ? 'text-amber-700' : 'text-amber-400'}`} />
                      <span>تعداد کل حاضرین (به همراه خودتان):</span>
                    </label>
                    <span className={`${
                      countError
                        ? 'text-rose-500 font-black'
                        : isLight 
                        ? 'text-amber-800 font-black' 
                        : 'text-amber-400 font-bold'
                    } font-cinzel text-sm`}>
                      {toPersianDigits(safeParseCount(guestCount) || 1)} نفر
                    </span>
                  </div>
 
                  {/* Predefined Quick Buttons */}
                  <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${predefinedButtonsCount}, minmax(0, 1fr))` }}>
                    {quickNumbers.map((num) => {
                      const isSelected = guestCount === num && !isCustomCountMode;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            handleSelectPredefinedCount(num);
                            if (countError) setCountError('');
                          }}
                          className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 border-amber-400 text-stone-950 shadow-md shadow-amber-500/20'
                              : isLight
                              ? 'bg-white border-stone-300 text-stone-800 hover:border-amber-500'
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
                    {maxGuestsAllowed > 6 && (
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomCountMode(true);
                            if (safeParseCount(guestCount) <= 6) {
                              setGuestCount(Math.min(7, maxGuestsAllowed));
                            }
                            if (countError) setCountError('');
                          }}
                          className={`flex-1 py-1.5 px-3 rounded-xl border text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                            isCustomCountMode || safeParseCount(guestCount) > 6
                              ? 'bg-amber-500/20 border-amber-400 text-amber-800 font-bold'
                              : isLight
                              ? 'bg-white border-stone-300 text-stone-700 hover:text-stone-900'
                              : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>بیشتر از ۶ نفر (تعداد دلخواه)</span>
                        </button>
                      </div>
                    )}
 
                    {/* Numeric Stepper and Direct Input when custom mode is on or count > 6 */}
                    {(isCustomCountMode || safeParseCount(guestCount) > 6) && (
                      <div className={`mt-2.5 p-2.5 rounded-xl ${
                        countError
                          ? 'bg-rose-50/5 border-rose-500/30'
                          : isLight 
                          ? 'bg-white border-amber-400/50' 
                          : 'bg-stone-900 border-amber-500/30'
                      } border flex items-center justify-between gap-3`}>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const current = safeParseCount(guestCount);
                              setGuestCount(Math.max(1, current - 1));
                              if (countError) setCountError('');
                            }}
                            className={`w-8 h-8 rounded-lg ${isLight ? 'bg-amber-100 hover:bg-amber-200 text-amber-900' : 'bg-stone-800 hover:bg-stone-700 text-amber-300'} flex items-center justify-center cursor-pointer font-bold`}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={guestCount === '' ? '' : toPersianDigits(guestCount)}
                            onChange={(e) => {
                              if (countError) setCountError('');
                              const rawVal = e.target.value;
                              if (rawVal === '') {
                                setGuestCount('');
                                return;
                              }
                              const val = toEnglishDigits(rawVal).replace(/\D/g, '');
                              if (val === '') {
                                setGuestCount('');
                                return;
                              }
                              const num = parseInt(val);
                              if (isNaN(num)) {
                                setGuestCount('');
                              } else {
                                setGuestCount(Math.min(maxGuestsAllowed, num));
                              }
                            }}
                            className={`w-16 py-1 px-2 text-center rounded-lg ${
                              countError
                                ? 'bg-rose-50/10 border-rose-500 text-rose-700'
                                : isLight 
                                ? 'bg-stone-100 border-stone-300 text-amber-900' 
                                : 'bg-stone-950 border-stone-700 text-amber-300'
                            } border font-bold text-sm font-vazir`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const current = safeParseCount(guestCount);
                              setGuestCount(Math.min(maxGuestsAllowed, current + 1));
                              if (countError) setCountError('');
                            }}
                            className={`w-8 h-8 rounded-lg ${isLight ? 'bg-amber-100 hover:bg-amber-200 text-amber-900' : 'bg-stone-800 hover:bg-stone-700 text-amber-300'} flex items-center justify-center cursor-pointer font-bold`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <span className={`text-xs ${isLight ? 'text-stone-600' : 'text-stone-400'}`}>
                          نفر مهمان گرامی
                        </span>
                      </div>
                    )}
                  </div>
                  {countError && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {countError}
                    </p>
                  )}
                </div>
              )}

              {/* Dietary note if enabled & attending */}
              {attending === 'yes' && data.rsvpConfig.showDietaryOptions && (
                <div>
                  <label className={`block text-xs ${isLight ? 'text-stone-700 font-semibold' : 'text-stone-300 font-medium'} mb-1`}>
                    رژیم غذایی خاص یا حساسیت غذایی (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={dietaryNotes}
                    onChange={(e) => setDietaryNotes(e.target.value)}
                    placeholder="مثلاً: رژیم گیاه‌خواری، وگان یا بدون گلوتن"
                    className={`w-full px-4 py-2.5 rounded-xl ${
                      isLight
                        ? 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400 focus:border-amber-500'
                        : 'bg-stone-800/80 border-stone-700 text-stone-100 placeholder:text-stone-500 focus:border-amber-400'
                    } border focus:outline-none text-xs`}
                  />
                </div>
              )}

              {/* Song request for DJ if attending and enabled */}
              {attending === 'yes' && (data.rsvpConfig.allowSongRequest ?? true) && (
                <div>
                  <label className={`block text-xs ${isLight ? 'text-stone-700 font-semibold' : 'text-stone-300 font-medium'} mb-1 flex items-center justify-between`}>
                    <span>پیشنهاد آهنگ به دی‌جی برای رقص و پایکوبی (اختیاری)</span>
                    <Music className={`w-3.5 h-3.5 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={songRequest}
                      onChange={(e) => setSongRequest(e.target.value)}
                      placeholder="نام قطعه موسیقی یا خواننده مورد علاقه شما برای جشن..."
                      className={`w-full px-4 py-2.5 rounded-xl ${
                        isLight
                          ? 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400 focus:border-amber-500'
                          : 'bg-stone-800/80 border-stone-700 text-stone-100 placeholder:text-stone-500 focus:border-amber-400'
                      } border focus:outline-none text-xs`}
                    />
                  </div>
                </div>
              )}

              {/* Message / Warm Wish */}
              <div>
                <label className={`block text-xs ${isLight ? 'text-stone-700 font-semibold' : 'text-stone-300 font-medium'} mb-1`}>
                  پیام تبریک یا یادداشت اختصاصی برای عروس و داماد
                </label>
                <div className="relative">
                  <MessageSquare className={`w-4 h-4 absolute right-3.5 top-3 ${isLight ? 'text-stone-500' : 'text-stone-400'}`} />
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="شادباش، دعای خیر یا توضیحات بیشتر..."
                    className={`w-full pr-10 pl-4 py-2 rounded-xl ${
                      isLight
                        ? 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400 focus:border-amber-500'
                        : 'bg-stone-800/80 border-stone-700 text-stone-100 placeholder:text-stone-500 focus:border-amber-400'
                    } border focus:outline-none text-xs leading-relaxed`}
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

