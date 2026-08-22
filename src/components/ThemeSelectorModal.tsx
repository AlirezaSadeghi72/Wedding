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
    id: 'emerald',
    name: '۱. زمرد شاهانه و طلایی (Royal Emerald & Gold)',
    subtitle: 'سبک درباری و اصیل با حاشیه‌های طلاکوب و زمینه مخمل زمردی',
    badge: 'پیش‌فرض لوکس',
    tag: 'اصیل و درباری',
    mood: 'شکوه، اصالت ایرانی، وقار',
    paletteColors: ['#064e3b', '#022c22', '#D4AF37', '#FEF3C7'],
    description:
      'زمینه سبز زمردی تیره درباری همراه با کادرهای طلای مات ۲۴ عیار، سربرگ‌های زرین و مونوگرام طلاکوب. این تم حال و هوای کاخ‌های سلطنتی و عمارت‌های کهن را القا می‌کند.'
  },
  {
    id: 'noir',
    name: '۲. مشکی سلطنتی و طلای ناب (Midnight Noir & Gold)',
    subtitle: 'مشکی کربنی عمیق با نهایت کنتراست و تلألو خطوط طلا',
    badge: 'مدرن و اشرافی',
    tag: 'مدرن با کنتراست بالا',
    mood: 'جذاب، کاریزماتیک، شیک',
    paletteColors: ['#09090b', '#18181b', '#F59E0B', '#FFFFFF'],
    description:
      'ترکیب شب تیره مخملی با خطوط زرکوب درخشان. این پالت بالاترین خوانایی متون و نهایت حس مدرنیته و پرستیژ را خلق می‌کند.'
  },
  {
    id: 'ruby',
    name: '۳. یاقوتی و زرشکی اشرافی (Imperial Ruby & Velvet)',
    subtitle: 'زرشکی یاقوتی سیر، خطوط کهربایی و ته‌رنگ‌های رمانتیک آتشین',
    badge: 'گرم و رمانتیک',
    tag: 'شور و گرمای عشق',
    mood: 'عاشقانه، پرحرارت، کلاسیک',
    paletteColors: ['#450a0a', '#7f1d1d', '#FBBF24', '#FEF2F2'],
    description:
      'رنگ یاقوت سرخ و مخمل زرشکی تیره با حاشیه‌های کهربایی و نگین‌های طلایی. گرما و احساس شورانگیز عشق را به زیباترین شکل تداعی می‌کند.'
  },
  {
    id: 'azure',
    name: '۴. سرمه‌ای لاجوردی و کهکشانی (Persian Sapphire & Starlight)',
    subtitle: 'لاجوردی شب‌های اصفهان، فیروزه‌ای اصیل و ستاره‌های نقره‌فام',
    badge: 'ایرانی اصیل',
    tag: 'هنر ایرانی و کهکشان',
    mood: 'آرام، باشکوه، آسمانی',
    paletteColors: ['#020617', '#0f172a', '#38BDF8', '#F0F9FF'],
    description:
      'الهام‌گرفته از کاشی‌کاری‌های لاجوردی مسجد شیخ لطف‌الله و آسمان شب‌های پرستاره. فضایی آرام، ملکوتی و در عین حال شاهانه.'
  },
  {
    id: 'ivory',
    name: '۵. کرم شیری و مروارید لوکس (Ivory Pearl & Champagne)',
    subtitle: 'بژ و کرم ابریشمی با طلای شامپاینی و حاشیه‌های مرواریدفام',
    badge: 'لوکس و نود',
    tag: 'لطیف و رویایی',
    mood: 'روشن، ملیح، شیک',
    paletteColors: ['#292524', '#44403c', '#FDE68A', '#FFFBEB'],
    description:
      'پالت رنگی با وقار، نود و روشن با تلألو شامپاینی و مرواریدی. عالی برای کسانی که هارمونی مینیمال، اروپایی و بسیار لطیف را ترجیح می‌دهند.'
  },
  {
    id: 'rosegold',
    name: '۶. رزگلد و کوارتز بلورین (Romantic Rose Quartz & Rose Gold)',
    subtitle: 'صورتی کوارتز محو، کادرهای متالیک رزگلد و ساتن مخملی',
    badge: 'رمانتیک مدرن',
    tag: 'احساسی و ترند',
    mood: 'عاشقانه، نرم، ژورنالی',
    paletteColors: ['#1c1917', '#4c0519', '#FB7185', '#FFF1F2'],
    description:
      'ترکیبی مدرن و دخترانه از تم‌های ترند اروپایی با درخشش متالیک مس و رزگلد. حس صمیمیت، ظرافت و لطافت بی‌پایان.'
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId: ThemeId;
  colorMode?: 'dark' | 'light';
  onSelectTheme: (themeId: ThemeId) => void;
  onSelectColorMode?: (mode: 'dark' | 'light') => void;
}

export default function ThemeSelectorModal({
  isOpen,
  onClose,
  currentThemeId,
  colorMode = 'dark',
  onSelectTheme,
  onSelectColorMode
}: Props) {
  if (!isOpen) return null;

  return typeof document !== 'undefined'
    ? createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-3xl bg-stone-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-950/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Palette className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-amber-100 font-amiri flex items-center gap-2">
                    <span>پیش‌نمایش تم‌ها و حالت لایت/دارک</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </h3>
                  <p className="text-xs text-stone-400">
                    با یک کلیک تم و حالت تیره یا روشن را روی کل پروژه اعمال کنید
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Light / Dark Mode Toggle Ribbon */}
            <div className="p-3 sm:p-4 bg-stone-950/90 border-b border-stone-800 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-200">حالت نمایش کارت (Light / Dark):</span>
                <span className="text-[11px] text-stone-400">
                  {colorMode === 'light' ? 'حالت روشن (سفید و عاجی زرین)' : 'حالت دارک (مشکی و زمردی مخملی)'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-stone-900 border border-stone-700">
                <button
                  type="button"
                  onClick={() => onSelectColorMode?.('dark')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    colorMode === 'dark'
                      ? 'bg-amber-500 text-stone-950 shadow-md'
                      : 'text-stone-300 hover:text-amber-200'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>حالت دارک (Dark)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectColorMode?.('light')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    colorMode === 'light'
                      ? 'bg-amber-400 text-stone-950 shadow-md'
                      : 'text-stone-300 hover:text-amber-200'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>حالت لایت (Light)</span>
                </button>
              </div>
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
                          ? 'bg-amber-500/10 border-amber-400 shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/50'
                          : 'bg-stone-950/70 border-stone-800 hover:border-amber-500/40 hover:bg-stone-950'
                      }`}
                    >
                      {/* Top Bar inside Card */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-stone-100 font-amiri">
                              {theme.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-amber-300 font-medium block mt-0.5">
                            {theme.tag} • {theme.mood}
                          </span>
                        </div>

                        {isSelected ? (
                          <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-stone-950 font-bold text-[11px] shadow-sm">
                            <Check className="w-3.5 h-3.5" />
                            فعال
                          </span>
                        ) : (
                          <span className="shrink-0 px-2.5 py-1 rounded-full bg-stone-800 text-stone-300 text-[10px] group-hover:bg-amber-500/20 group-hover:text-amber-300 transition-colors">
                            انتخاب تم
                          </span>
                        )}
                      </div>

                      {/* Visual Color Palette Swatches */}
                      <div className="mb-3 p-2 rounded-xl bg-stone-900 border border-stone-800/80 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-stone-400 font-medium">پالت رنگی:</span>
                        <div className="flex items-center gap-1.5" dir="ltr">
                          <div
                            className="w-6 h-6 rounded-lg border border-white/20 shadow-inner"
                            style={{ backgroundColor: c1 }}
                            title="پس‌زمینه اصلی"
                          />
                          <div
                            className="w-6 h-6 rounded-lg border border-white/20 shadow-inner"
                            style={{ backgroundColor: c2 }}
                            title="کادر داخلی کارت"
                          />
                          <div
                            className="w-6 h-6 rounded-lg border border-white/20 shadow-inner"
                            style={{ backgroundColor: c3 }}
                            title="رنگ اکسنت و طلاکوب"
                          />
                          <div
                            className="w-6 h-6 rounded-lg border border-white/20 shadow-inner"
                            style={{ backgroundColor: c4 }}
                            title="رنگ متون اصلی"
                          />
                        </div>
                      </div>

                      {/* Mini Preview Box */}
                      <div
                        className="p-3 rounded-xl border text-center transition-all mb-2"
                        style={{
                          background: colorMode === 'light' 
                            ? 'linear-gradient(135deg, #fbfbf9, #f4efe6)'
                            : `linear-gradient(135deg, ${c1}, ${c2})`,
                          borderColor: `${c3}55`
                        }}
                      >
                        <div
                          className="font-amiri text-sm font-bold truncate"
                          style={{ color: colorMode === 'light' ? '#047857' : c3 }}
                        >
                          پرهام و نگار
                        </div>
                        <div
                          className="text-[10px] mt-0.5 font-medium"
                          style={{ color: colorMode === 'light' ? '#1c1917' : c4 }}
                        >
                          با افتخار شما را به جشن پیوند دعوت می‌نماییم
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-stone-400 leading-relaxed mt-1">
                        {theme.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between">
              <span className="text-xs text-stone-400">
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
