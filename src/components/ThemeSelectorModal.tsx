import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Check, X, Sparkles, Sun, Moon } from 'lucide-react';
import { ThemeId } from '../types';

export interface ThemePreviewOption {
  id: ThemeId;
  name: string;
  subtitle: string;
  badge: string;
  tag: string;
  mood: string;
  paletteColors: [string, string, string, string]; // [primaryBg, cardAccent, goldAccent, textColor]
  description: string;
}

export const CURATED_THEMES: ThemePreviewOption[] = [
  {
    id: 'sunlight_blossom',
    name: '۱. آفتاب و شکوفه (Sunlight & Blossom)',
    subtitle: 'سفید عاجی نرم، سبز زیتونی، زرد لیمویی شاد و صورتی هلویی',
    badge: 'روشن و بهاری',
    tag: 'پالت روشن شاد',
    mood: 'شاداب، مدرن و پر از طراوت بهاری',
    paletteColors: ['#FFFDF5', '#4D7C0F', '#FACC15', '#F472B6'],
    description: 'پس‌زمینه سفید عاجی نرم (#FFFDF5)، متون و آیکون‌های سبز زیتونی روشن (#4D7C0F) و جزئیات زرد لیمویی درخشان (#FACC15) و صورتی هلویی.'
  },
  {
    id: 'sunflower_lavender',
    name: '۲. آفتابگردان و لاوندر (Sunflower & Lavender)',
    subtitle: 'کرم شیری گرم، بنفش اسطوخودوسی ملایم و زرد آفتابگردانی',
    badge: 'روشن و جذاب',
    tag: 'هارمونی مکمل',
    mood: 'هارمونی جذاب رنگ‌های مکمل و بسیار چشم‌نواز',
    paletteColors: ['#FAF6ED', '#7C3AED', '#FBBF24', '#7C3AED'],
    description: 'پس‌زمینه کرم شیری گرم (#FAF6ED)، متون بنفش اسطوخودوسی ملایم (#7C3AED) و جزئیات زرد آفتابگردانی درخشان (#FBBF24).'
  },
  {
    id: 'honey_citrus',
    name: '۳. عسل و مرکبات (Honey & Citrus)',
    subtitle: 'وانیلی خیلی روشن، مرجانی گرم، زرد کهربایی و طلایی',
    badge: 'گرم و جشن‌گونه',
    tag: 'پر از انرژی و گرما',
    mood: 'صمیمی، جشن‌گونه و پر از گرما',
    paletteColors: ['#FFFBEB', '#E11D48', '#F59E0B', '#D97706'],
    description: 'پس‌زمینه وانیلی خیلی روشن (#FFFBEB)، متون مرجانی گرم (#E11D48) و اکسنت زرد کهربایی (#F59E0B) و طلایی متالیک.'
  },
  {
    id: 'golden_forest',
    name: '۴. جنگل طلایی (Golden Emerald Forest)',
    subtitle: 'سبز زمردی تیره لوکس (بدون مشکی)، سفید کرمی و زرد خردلی',
    badge: 'تیره لوکس بدون مشکی',
    tag: 'طبیعت و طلای براق',
    mood: 'تلفیق بی‌نظیر طبیعت و زرد درخشان، چشم‌نواز و شیک',
    paletteColors: ['#064E3B', '#043E2F', '#FACC15', '#FEF3C7'],
    description: 'پس‌زمینه سبز زمردی تیره عمیق (#064E3B)، متن کرمی خوانا (#FEF3C7) و جزئیات زرد خردلی روشن و براق (#FACC15).'
  },
  {
    id: 'indigo_sun',
    name: '۵. شب لاجوردی و آفتاب (Indigo Night & Sun)',
    subtitle: 'سورمه‌ای یاقوتی عمیق (بدون مشکی)، طلایی بژ و زرد زعفرانی',
    badge: 'تیره اشرافی با کنتراست عالی',
    tag: 'اشرافی و عالی',
    mood: 'کنتراست فوق‌العاده بالا، خوانایی عالی و اشرافی',
    paletteColors: ['#1E1B4B', '#17153B', '#F59E0B', '#FDE68A'],
    description: 'پس‌زمینه سورمه‌ای یاقوتی عمیق (#1E1B4B)، متون طلایی بژ ملایم (#FDE68A) و اکسنت زرد زعفرانی زنده (#F59E0B).'
  },
  {
    id: 'plum_honey',
    name: '۶. آلو و عسل (Plum & Honey)',
    subtitle: 'بنفش بادمجانی سیر (بدون مشکی)، شیری صدفی و زرد آفتابی',
    badge: 'تیره فاخر و رمانتیک',
    tag: 'عمیق و فاخر',
    mood: 'عمیق، فاخر، رمانتیک و جذاب',
    paletteColors: ['#2E1065', '#240C52', '#FBBF24', '#FFF7ED'],
    description: 'پس‌زمینه بنفش بادمجانی سیر (#2E1065)، متون شیری صدفی روشن (#FFF7ED) و اکسنت زرد آفتابی پررنگ (#FBBF24).'
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
}

export default function ThemeSelectorModal({
  isOpen,
  onClose,
  currentThemeId,
  onSelectTheme
}: Props) {
  if (!isOpen) return null;

  return typeof document !== 'undefined'
    ? createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-3xl bg-[#FFFDF7] border border-amber-300/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto text-stone-900"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-amber-200/80 bg-[#FAF6ED] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300">
                  <Palette className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-amber-950 font-amiri flex items-center gap-2">
                    <span>پیش‌نمایش و انتخاب تم کارت</span>
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  </h3>
                  <p className="text-xs text-stone-600">
                    تم مورد نظر خود را با یک کلیک روی تمام بخش‌های کارت اعمال کنید
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-stone-900 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Themes Grid */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CURATED_THEMES.map((theme) => {
                  const isSelected = currentThemeId === theme.id;
                  const [c1, c2, c3, c4] = theme.paletteColors;

                  return (
                    <div
                      key={theme.id}
                      onClick={() => {
                        onSelectTheme(theme.id);
                      }}
                      className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                        isSelected
                          ? 'bg-amber-50 border-amber-500 shadow-md ring-2 ring-amber-400/50'
                          : 'bg-white border-amber-200 hover:border-amber-400 hover:bg-amber-50/30'
                      }`}
                    >
                      {/* Top Bar inside Card */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-stone-900 font-amiri">
                              {theme.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-amber-800 font-bold block mt-0.5">
                            {theme.tag} • {theme.mood}
                          </span>
                        </div>

                        {isSelected ? (
                          <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-stone-950 font-bold text-[11px] shadow-sm">
                            <Check className="w-3.5 h-3.5" />
                            فعال
                          </span>
                        ) : (
                          <span className="shrink-0 px-2.5 py-1 rounded-full bg-amber-100/80 text-amber-900 text-[10px] group-hover:bg-amber-200 transition-colors">
                            انتخاب تم
                          </span>
                        )}
                      </div>

                      {/* Visual Color Palette Swatches */}
                      <div className="mb-3 p-2 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-stone-600 font-medium">پالت رنگی:</span>
                        <div className="flex items-center gap-1.5" dir="ltr">
                          <div
                            className="w-6 h-6 rounded-lg border border-black/10 shadow-sm"
                            style={{ backgroundColor: c1 }}
                            title="پس‌زمینه اصلی"
                          />
                          <div
                            className="w-6 h-6 rounded-lg border border-black/10 shadow-sm"
                            style={{ backgroundColor: c2 }}
                            title="کادر داخلی کارت"
                          />
                          <div
                            className="w-6 h-6 rounded-lg border border-black/10 shadow-sm"
                            style={{ backgroundColor: c3 }}
                            title="رنگ اکسنت و طلاکوب"
                          />
                          <div
                            className="w-6 h-6 rounded-lg border border-black/10 shadow-sm"
                            style={{ backgroundColor: c4 }}
                            title="رنگ متون اصلی"
                          />
                        </div>
                      </div>

                      {/* Mini Preview Box */}
                      <div
                        className="p-3 rounded-xl border text-center transition-all mb-2 shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${c1}, ${c2})`,
                          borderColor: `${c3}55`
                        }}
                      >
                        <div
                          className="font-amiri text-sm font-bold truncate"
                          style={{ color: c3 }}
                        >
                          پرهام و نگار
                        </div>
                        <div
                          className="text-[10px] mt-0.5 font-medium"
                          style={{ color: c4 }}
                        >
                          با افتخار شما را به جشن پیوند دعوت می‌نماییم
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-stone-600 leading-relaxed mt-1">
                        {theme.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-amber-200/80 bg-[#FAF6ED] flex items-center justify-between">
              <span className="text-xs text-stone-600">
                تغییرات بلافاصله ذخیره و برای همه مهمانان نمایش داده می‌شود.
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer transition-colors shadow-md"
              >
                بستن و مشاهده نتیجه
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )
    : null;
}
