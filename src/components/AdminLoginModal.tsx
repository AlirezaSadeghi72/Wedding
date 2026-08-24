import { useState, useEffect, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  X,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { toPersianDigits } from '../utils/dateUtils';
import {
  normalizeDigits,
  verifyPasswordSecurely,
  checkLockoutStatus,
  recordFailedAttempt,
  resetLockout,
  saveAdminSession
} from '../utils/security';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  correctPin?: string;
  onSuccess: () => void;
}

export default function AdminLoginModal({ isOpen, onClose, correctPin, onSuccess }: Props) {
  const [pinInput, setPinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  // Lockout state
  const [lockout, setLockout] = useState<{
    isLocked: boolean;
    remainingSeconds: number;
    attemptsLeft: number;
  }>({
    isLocked: false,
    remainingSeconds: 0,
    attemptsLeft: 5
  });

  // Check lockout status on mount and when modal opens
  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setError('');
      setIsSuccess(false);
      setIsSubmitting(false);
      const status = checkLockoutStatus();
      setLockout(status);

      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';

      const handleEsc = (e: globalThis.KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);

      return () => {
        document.body.style.overflow = originalStyle;
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);

  // Live countdown timer for lockout
  useEffect(() => {
    if (!isOpen || !lockout.isLocked) return;

    const timer = setInterval(() => {
      const status = checkLockoutStatus();
      setLockout(status);
      if (!status.isLocked) {
        setError('');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, lockout.isLocked]);

  if (!isOpen) return null;

  const actualTargetPin = correctPin?.trim() || '1404';

  const handleVerify = async () => {
    if (lockout.isLocked || isSubmitting) return;

    const entered = pinInput.trim();
    if (!entered) {
      setError('لطفاً رمز عبور یا پین مدیریت را وارد فرمایید');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 1. First attempt verification against server endpoint
      let serverSuccess = false;
      let sessionToken = '';

      try {
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: normalizeDigits(entered) })
        });
        const resData = await response.json();
        if (response.ok && resData.success) {
          serverSuccess = true;
          sessionToken = resData.token;
        } else if (response.status === 429) {
          setError(resData.error || 'تعداد تلاش‌های ناموفق بیش از حد مجاز است');
          setIsSubmitting(false);
          return;
        }
      } catch {
        // Offline or preview fallback
      }

      // 2. Client fallback verification if server didn't respond
      const isClientValid = await verifyPasswordSecurely(entered, actualTargetPin);

      if (serverSuccess || isClientValid) {
        setIsSuccess(true);
        saveAdminSession(sessionToken || 'token_' + Date.now(), entered);
        resetLockout();
        setError('');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 500);
      } else {
        const newLockout = recordFailedAttempt();
        setLockout(newLockout);
        setShake(true);
        setTimeout(() => setShake(false), 500);

        if (newLockout.isLocked) {
          setError(`تعداد تلاش‌های ناموفق بیش از حد مجاز بود. لطفاً ${toPersianDigits(newLockout.remainingSeconds)} ثانیه صبر کنید.`);
        } else {
          setError(`رمز عبور نادرست است. (${toPersianDigits(newLockout.attemptsLeft)} تلاش باقی‌مانده)`);
        }
      }
    } catch {
      setError('خطا در اعتبارسنجی رمز عبور');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handleKeypadPress = (num: string) => {
    if (lockout.isLocked) return;
    setError('');
    if (pinInput.length < 24) {
      setPinInput((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    if (lockout.isLocked) return;
    setError('');
    setPinInput((prev) => prev.slice(0, -1));
  };

  return typeof document !== 'undefined'
    ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              x: shake ? [-8, 8, -6, 6, -3, 3, 0] : 0
            }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-sm bg-[#FFFDF7] border border-amber-300/80 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 text-center select-none text-stone-900"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
              title="بستن"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Lock Icon Crest */}
            <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-sm transition-colors ${
              isSuccess
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : lockout.isLocked
                ? 'bg-rose-100 text-rose-700 border border-rose-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              {isSuccess ? (
                <ShieldCheck className="w-7 h-7 text-emerald-600 animate-bounce" />
              ) : lockout.isLocked ? (
                <ShieldAlert className="w-7 h-7 text-rose-600 animate-pulse" />
              ) : (
                <Lock className="w-7 h-7 text-amber-700" />
              )}
            </div>

            <h3 className="text-lg font-bold text-amber-950 font-amiri mb-1">
              ورود امن به پنل مدیریت کارت
            </h3>
            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              برای دسترسی به تنظیمات اختصاصی، اسامی و ویرایش بخش‌ها، رمز عبور را وارد نمایید:
            </p>

            {/* Lockout Warning Banner */}
            {lockout.isLocked && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center justify-center gap-2 font-medium">
                <Clock className="w-4 h-4 text-rose-600 animate-spin" />
                <span>
                  دسترسی موقتاً مسدود شد ({toPersianDigits(lockout.remainingSeconds)} ثانیه تا تلاش مجدد)
                </span>
              </div>
            )}

            {/* Password / PIN Input Box */}
            <div className="relative mb-3">
              <input
                type={showPassword ? 'text' : 'password'}
                value={pinInput}
                data-no-farsi-digits="true"
                disabled={lockout.isLocked || isSubmitting}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                placeholder="رمز عبور مدیریت..."
                autoFocus
                className={`w-full px-4 py-3 text-center text-lg tracking-widest rounded-2xl bg-amber-50/50 border focus:outline-none font-vazir shadow-inner transition-colors ${
                  lockout.isLocked
                    ? 'border-rose-300 text-stone-400 cursor-not-allowed opacity-60'
                    : 'border-amber-300 focus:border-amber-500 text-stone-900 placeholder:text-stone-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={lockout.isLocked}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-amber-800 transition-colors"
                title={showPassword ? 'مخفی کردن' : 'نمایش'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error & Success Messages */}
            <AnimatePresence>
              {error && !lockout.isLocked && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-1.5 text-xs text-rose-700 mb-3 bg-rose-50 py-1.5 px-3 rounded-xl border border-rose-200 font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </motion.div>
              )}

              {isSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-1.5 text-xs text-emerald-800 mb-3 bg-emerald-50 py-1.5 px-3 rounded-xl border border-emerald-300 font-bold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>هویت تایید شد. در حال باز کردن استودیو مدیریت...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Numeric Keypad for Mobile / Touch */}
            <div className="grid grid-cols-3 gap-2 mb-4 font-mono select-none" dir="ltr">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={lockout.isLocked || isSubmitting}
                  onClick={() => handleKeypadPress(num)}
                  className={`py-2.5 rounded-xl text-base font-bold transition-all shadow-sm ${
                    lockout.isLocked
                      ? 'bg-stone-100 text-stone-400 opacity-40 cursor-not-allowed'
                      : 'bg-white hover:bg-amber-100/80 active:bg-amber-500 active:text-white border border-stone-200 text-stone-800 cursor-pointer'
                  }`}
                >
                  {toPersianDigits(num)}
                </button>
              ))}
              <button
                type="button"
                disabled={lockout.isLocked || isSubmitting}
                onClick={() => setPinInput('')}
                className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  lockout.isLocked
                    ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer'
                }`}
              >
                پاک کردن
              </button>
              <button
                type="button"
                disabled={lockout.isLocked || isSubmitting}
                onClick={() => handleKeypadPress('0')}
                className={`py-2.5 rounded-xl text-base font-bold transition-all shadow-sm ${
                  lockout.isLocked
                    ? 'bg-stone-100 text-stone-400 opacity-40 cursor-not-allowed'
                    : 'bg-white hover:bg-amber-100/80 active:bg-amber-500 active:text-white border border-stone-200 text-stone-800 cursor-pointer'
                }`}
              >
                {toPersianDigits('0')}
              </button>
              <button
                type="button"
                disabled={lockout.isLocked || isSubmitting}
                onClick={handleBackspace}
                className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  lockout.isLocked
                    ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                    : 'bg-stone-100 hover:bg-rose-100 text-rose-700 cursor-pointer'
                }`}
              >
                حذف ⌫
              </button>
            </div>

            {/* Submit action */}
            <button
              type="button"
              disabled={lockout.isLocked || isSubmitting || !pinInput.trim()}
              onClick={handleVerify}
              className={`w-full py-3 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
                lockout.isLocked || !pinInput.trim()
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'
                  : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-amber-500/20 cursor-pointer hover:scale-[1.02] active:scale-95'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>{isSubmitting ? 'در حال بررسی هویت...' : 'ورود به پنل مدیریت'}</span>
            </button>

            {/* Secure Note */}
            <div className="mt-3 text-[11px] text-stone-500 flex items-center justify-center gap-1.5 font-light">
              <Lock className="w-3 h-3 text-amber-600" />
              <span>پنل مدیریت امن و رمزگذاری شده</span>
            </div>
          </motion.div>
        </div>,
        document.body
      )
    : null;
}
