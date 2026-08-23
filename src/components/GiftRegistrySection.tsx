import { useState } from 'react';
import { motion } from 'motion/react';
import { Gift, Copy, Check, Sparkles, CreditCard, HeartHandshake } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GiftRegistryData } from '../types';
import { toPersianDigits } from '../utils/dateUtils';
import { copyToClipboard } from '../utils/clipboard';

interface Props {
  registry?: GiftRegistryData;
  isLight?: boolean;
}

export default function GiftRegistrySection({ registry, isLight }: Props) {
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedIban, setCopiedIban] = useState(false);

  if (!registry || !registry.enabled) return null;

  const handleCopyCard = () => {
    copyToClipboard(registry.cardNumber.replace(/-/g, '')).then((success) => {
      if (success) {
        setCopiedCard(true);
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#D4AF37', '#FFD700', '#FFFFFF']
        });
        setTimeout(() => setCopiedCard(false), 2500);
      }
    });
  };

  const handleCopyIban = () => {
    if (registry.ibanNumber) {
      copyToClipboard(registry.ibanNumber).then((success) => {
        if (success) {
          setCopiedIban(true);
          setTimeout(() => setCopiedIban(false), 2500);
        }
      });
    }
  };

  return (
    <div className={`my-8 sm:my-14 pt-6 sm:pt-10 border-t ${isLight ? 'border-stone-200' : 'border-stone-800/80'} w-full`}>
      {/* Section Header */}
      <div className="text-center mb-6 sm:mb-8 px-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${
            isLight
              ? 'bg-amber-100 border border-amber-400/60 text-amber-800'
              : 'bg-amber-500/10 border border-amber-400/30 text-amber-300'
          } text-xs mb-2 font-medium`}
        >
          <Gift className={`w-3.5 h-3.5 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
          <span>هدیه و شادباش</span>
        </motion.div>

        <h3 className={`text-xl sm:text-3xl font-bold font-amiri ${isLight ? 'text-emerald-950 font-black' : 'text-stone-100'} mb-1.5`}>
          {registry.title || 'هدیه و شادباش عروس و داماد'}
        </h3>
        <p className={`text-xs sm:text-sm ${isLight ? 'text-stone-600' : 'text-stone-300'} font-light max-w-md mx-auto leading-relaxed`}>
          {registry.description}
        </p>
      </div>

      {/* Luxury Bank Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-md mx-auto px-1 sm:px-0"
      >
        <div className={`relative rounded-2xl sm:rounded-3xl p-4 sm:p-7 ${
          isLight
            ? 'bg-gradient-to-br from-emerald-900 via-stone-900 to-emerald-950 border border-amber-400/60 shadow-xl'
            : 'bg-gradient-to-br from-amber-900/60 via-stone-900 to-stone-950 border border-amber-400/50 shadow-2xl'
        } overflow-hidden backdrop-blur-xl group`}>
          {/* Holographic foil texture background */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffd700_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-600/20 rounded-full blur-2xl pointer-events-none" />

          {/* Card Top: Bank Name & Smart Chip */}
          <div className="flex items-center justify-between mb-5 sm:mb-8 relative z-10">
            <div className="flex items-center gap-2">
              {/* Gold Chip Graphic */}
              <div className="w-9 h-6 sm:w-11 sm:h-8 rounded-md bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 border border-amber-200/80 shadow-md flex items-center justify-center p-0.5 sm:p-1">
                <div className="w-full h-full border border-amber-950/30 rounded-sm grid grid-cols-2 gap-0.5 opacity-60">
                  <div className="border-r border-b border-amber-950/40" />
                  <div className="border-b border-amber-950/40" />
                  <div className="border-r border-amber-950/40" />
                  <div />
                </div>
              </div>
              <span className="text-[10px] text-amber-300/80 font-medium">هدیه وصال</span>
            </div>

            <span className="font-bold text-xs sm:text-base font-amiri text-amber-200">
              {registry.bankName || 'بانک پاسارگاد'}
            </span>
          </div>

          {/* Card Number */}
          <div className="my-3 sm:my-4 text-center relative z-10">
            <span className="text-[10px] sm:text-[11px] text-stone-300 block mb-1">شماره کارت بانکی:</span>
            <div className="font-vazir text-lg sm:text-2xl font-bold tracking-widest text-amber-100 text-shadow-sm select-all dir-ltr">
              {toPersianDigits(registry.cardNumber)}
            </div>
          </div>

          {/* Cardholder Names */}
          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-amber-500/20 text-xs relative z-10">
            <div>
              <span className="text-[10px] text-stone-400 block mb-0.5">به نام:</span>
              <span className="font-bold font-amiri text-stone-100 text-xs sm:text-sm">
                {registry.cardHolder}
              </span>
            </div>

            <HeartHandshake className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400/80" />
          </div>

          {/* 1-Click Copy Buttons */}
          <div className="mt-4 sm:mt-6 pt-2 sm:pt-3 flex flex-col sm:flex-row items-center justify-center gap-2 relative z-10">
            <button
              onClick={handleCopyCard}
              className="w-full sm:flex-1 py-2 sm:py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedCard ? (
                <>
                  <Check className="w-4 h-4 text-stone-950" />
                  <span>شماره کارت کپی شد</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-stone-950" />
                  <span>کپی شماره کارت</span>
                </>
              )}
            </button>

            {registry.ibanNumber && (
              <button
                onClick={handleCopyIban}
                className="w-full sm:w-auto py-2 sm:py-2.5 px-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-amber-200 text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                {copiedIban ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>شبا کپی شد</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>کپی شماره شبا</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
