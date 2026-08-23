import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronDown, Sparkles } from 'lucide-react';
import { FAQItem } from '../types';

interface Props {
  faqs?: FAQItem[];
  isLight?: boolean;
}

export default function FAQSection({ faqs, isLight }: Props) {
  const [openId, setOpenId] = useState<string | null>(faqs && faqs.length > 0 ? faqs[0].id : null);

  if (!faqs || faqs.length === 0) return null;

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className={`my-8 sm:my-14 pt-6 sm:pt-10 border-t ${isLight ? 'border-stone-200' : 'border-stone-800/80'} max-w-xl mx-auto w-full`}>
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
          <HelpCircle className={`w-3.5 h-3.5 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
          <span>راهنمای مهمانان</span>
        </motion.div>

        <h3 className={`text-xl sm:text-3xl font-bold font-amiri ${isLight ? 'text-emerald-950 font-black' : 'text-stone-100'} mb-1.5`}>
          پرسش‌های متداول و نکات مهم
        </h3>
        <p className={`text-xs sm:text-sm ${isLight ? 'text-stone-600' : 'text-stone-400'} font-light`}>
          پاسخ به سوالات رایج درباره رفت‌وآمد، پارکینگ و امکانات عمارت
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-2.5 sm:space-y-3 px-1 sm:px-0">
        {faqs.map((item, idx) => {
          const isOpen = openId === item.id;

          return (
            <motion.div
              key={item.id || idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className={`rounded-xl sm:rounded-2xl border ${
                isLight
                  ? 'border-amber-600/20 bg-white/90 shadow-sm hover:border-amber-500'
                  : 'border-stone-800 bg-stone-950/60 hover:border-amber-500/30'
              } overflow-hidden backdrop-blur-sm transition-colors duration-300`}
            >
              <button
                onClick={() => toggle(item.id)}
                className="w-full p-3.5 sm:p-5 flex items-center justify-between text-right gap-3 cursor-pointer select-none"
              >
                <span className={`font-bold text-xs sm:text-base font-amiri ${isLight ? 'text-stone-900' : 'text-stone-100'}`}>
                  {item.question}
                </span>

                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className={`p-1 sm:p-1.5 rounded-full ${
                    isLight
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-stone-900 text-amber-400 border border-stone-700/80'
                  } flex-shrink-0`}
                >
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className={`p-3.5 sm:p-5 pt-0 text-xs sm:text-sm ${
                      isLight ? 'text-stone-700 border-t border-stone-100 font-normal' : 'text-stone-300 border-t border-stone-900/60 font-light'
                    } leading-relaxed`}>
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
