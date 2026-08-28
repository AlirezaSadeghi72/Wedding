import { useState } from 'react';
import { motion } from 'motion/react';
import { Gift, Copy, Check, Sparkles, CreditCard, HeartHandshake } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GiftRegistryData } from '../types';
import { toPersianDigits } from '../utils/dateUtils';
import { copyToClipboard } from '../utils/clipboard';
import { 
  getCardChunks, 
  sanitizeCardNumber, 
  detectBankName, 
  formatIbanDisplay, 
  sanitizeIban 
} from '../utils/cardUtils';

interface Props {
  registry?: GiftRegistryData;
  isLight?: boolean;
}

export default function GiftRegistrySection({ registry, isLight = true }: Props) {
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedIban, setCopiedIban] = useState(false);

  if (!registry || !registry.enabled) return null;

  const cardChunks = getCardChunks(registry.cardNumber);
  const cleanCardDigits = sanitizeCardNumber(registry.cardNumber);
  const bankName = registry.bankName || detectBankName(registry.cardNumber) || 'بانک پاسارگاد';
  const cardHolder = registry.cardHolder || registry.holderName || 'عروس و داماد';

  const rawIban = registry.ibanNumber || registry.iban || '';
  const formattedIban = formatIbanDisplay(rawIban);
  const cleanIban = sanitizeIban(rawIban);

  const handleCopyCard = () => {
    const textToCopy = cleanCardDigits || (registry.cardNumber || '').trim();
    if (!textToCopy) return;

    copyToClipboard(textToCopy).then((success) => {
      if (success) {
        setCopiedCard(true);
        confetti({
          particleCount: 40,
          spread: 65,
          origin: { y: 0.8 },
          colors: ['#D4AF37', '#FFD700', '#FFFFFF', '#10B981']
        });
        setTimeout(() => setCopiedCard(false), 2500);
      }
    });
  };

  const handleCopyIban = () => {
    const textToCopy = cleanIban || rawIban.trim();
    if (!textToCopy) return;

    copyToClipboard(textToCopy).then((success) => {
      if (success) {
        setCopiedIban(true);
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#D4AF37', '#FFD700', '#10B981']
        });
        setTimeout(() => setCopiedIban(false), 2500);
      }
    });
  };

  return (
    <div className={`my-8 sm:my-14 pt-6 sm:pt-10 border-t ${isLight ? 'border-amber-200/80' : 'border-stone-800'} w-full`}>
      {/* Section Header */}
      <div className="text-center mb-5 sm:mb-8 px-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100/90 border border-amber-400 text-amber-950 text-xs mb-2.5 font-bold shadow-xs"
        >
          <Gift className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>هدیه و شادباش عروسی</span>
        </motion.div>

        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold font-amiri text-stone-900 mb-1.5">
          {registry.title || 'هدیه و شادباش عروس و داماد'}
        </h3>
        <p className="text-xs sm:text-sm text-stone-700 font-normal max-w-md mx-auto leading-relaxed">
          {registry.description || 'حضور گرم شما گرانبهاترین هدیه برای ماست. در صورت تمایل به اهدای شادباش، مشخصات حساب در اختیار شماست:'}
        </p>
      </div>

      {/* Luxury Bank Card Container with High-Contrast Light Royal Gold Palette */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto px-1.5 sm:px-0"
      >
        <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 bg-gradient-to-br from-[#FFFDF8] via-[#FAF6ED] to-[#F3ECE0] border-2 border-amber-300 shadow-[0_15px_40px_rgba(217,119,6,0.12)] overflow-hidden group">
          {/* Holographic gold foil watermark grid */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          
          {/* Ambient luminous soft gold & emerald glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />

          {/* Card Top: Smart Chip, Badge & Bank Name */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 relative z-10">
            {/* Gold Chip Graphic */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-6 sm:w-11 sm:h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-500 border border-amber-300 shadow-sm flex items-center justify-center p-0.5 shrink-0">
                <div className="w-full h-full border border-amber-900/30 rounded-xs grid grid-cols-2 gap-0.5 opacity-80">
                  <div className="border-r border-b border-amber-900/40" />
                  <div className="border-b border-amber-900/40" />
                  <div className="border-r border-amber-900/40" />
                  <div />
                </div>
              </div>
              <div className="flex items-center gap-1 bg-amber-100/90 border border-amber-300 px-2.5 py-0.5 rounded-full shadow-xs">
                <Sparkles className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                <span className="text-[10px] sm:text-xs font-bold text-amber-950 whitespace-nowrap">کارت شادباش</span>
              </div>
            </div>

            {/* Bank Name */}
            <span className="font-extrabold text-sm sm:text-base font-amiri text-amber-950 text-left">
              {bankName}
            </span>
          </div>

          {/* Card Number - Guaranteed Correct LTR 4-Block Display */}
          <div className="my-3 sm:my-5 text-center relative z-10">
            <span className="text-[11px] sm:text-xs font-semibold text-stone-600 block mb-1.5">
              شماره کارت بانکی:
            </span>
            <div 
              dir="ltr" 
              style={{ direction: 'ltr' }}
              className="flex items-center justify-center gap-1.5 sm:gap-2.5 py-2.5 px-3 rounded-xl bg-white/95 border border-amber-300 shadow-inner select-all"
            >
              {cardChunks.map((chunk, idx) => (
                <div key={idx} className="flex items-center">
                  <span className="font-vazir text-base xs:text-lg sm:text-2xl font-black text-stone-900 tracking-wider">
                    {toPersianDigits(chunk)}
                  </span>
                  {idx < cardChunks.length - 1 && (
                    <span className="mx-1 sm:mx-1.5 text-amber-400 font-bold text-xs sm:text-sm select-none">
                      -
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cardholder Name & Heart Handshake */}
          <div className="flex items-center justify-between pt-2.5 sm:pt-3.5 border-t border-amber-200 text-xs relative z-10">
            <div className="text-right">
              <span className="text-[11px] font-medium text-stone-500 block mb-0.5">به نام:</span>
              <span className="font-bold font-amiri text-stone-900 text-sm sm:text-base tracking-wide">
                {cardHolder}
              </span>
            </div>

            <div className="flex items-center gap-1 text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-xl border border-amber-300/80">
              <HeartHandshake className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="text-[10px] sm:text-xs font-bold text-amber-950">مهرتان ماندگار</span>
            </div>
          </div>

          {/* IBAN Display Box (if available) */}
          {rawIban && (
            <div className="mt-3 pt-2.5 border-t border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-right relative z-10 bg-white/80 p-2.5 rounded-xl border border-amber-200 shadow-xs">
              <div>
                <span className="text-[10px] text-stone-500 font-medium block">شماره شبا (IBAN):</span>
                <span 
                  dir="ltr" 
                  style={{ direction: 'ltr' }}
                  className="text-[11px] sm:text-xs font-mono font-bold text-stone-900 tracking-wider block select-all text-left"
                >
                  {formattedIban}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyIban}
                className="self-end sm:self-center px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                {copiedIban ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">شبا کپی شد</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3 h-3 text-amber-700" />
                    <span>کپی شماره شبا</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Primary Action Button: 1-Click Copy Card Number */}
          <div className="mt-4 pt-1 relative z-10">
            <button
              type="button"
              onClick={handleCopyCard}
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs sm:text-sm shadow-[0_4px_15px_rgba(245,158,11,0.25)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-95 cursor-pointer ring-2 ring-amber-300"
            >
              {copiedCard ? (
                <>
                  <Check className="w-4 h-4 text-stone-950 stroke-[3]" />
                  <span className="font-vazir font-black">شماره کارت با موفقیت کپی شد</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-stone-950 stroke-[2.5]" />
                  <span className="font-vazir font-black">کپی شماره کارت بانکی</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
