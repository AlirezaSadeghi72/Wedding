import {
  ThemeId,
  SealColor,
  CardBorderStyle,
  FontPairingStyle,
  AmbientEffectStyle
} from '../types';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  subtitle: string;
  badge: string;
  primaryBg: string;
  cardBg: string;
  innerBg: string;
  accentGold: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderOrnament: string;
  envelopeColor: string;
  envelopeLining: string;
  sealDefaultColor: SealColor;
  previewColor: string;
  // Light mode overrides
  lightPrimaryBg?: string;
  lightCardBg?: string;
  lightInnerBg?: string;
  lightAccentGold?: string;
  lightTextPrimary?: string;
  lightTextSecondary?: string;
  lightTextMuted?: string;
  lightBorderOrnament?: string;
  lightEnvelopeColor?: string;
  lightEnvelopeLining?: string;
  lightSealColor?: SealColor;
}

export interface BorderStyleOption {
  id: CardBorderStyle;
  name: string;
  desc: string;
  description: string;
  previewClass: string;
}

export interface FontPairingOption {
  id: FontPairingStyle;
  name: string;
  desc: string;
  description: string;
  headingClass: string;
  bodyClass: string;
}

export interface AmbientEffectOption {
  id: AmbientEffectStyle;
  name: string;
  desc: string;
  description: string;
  icon: string;
}

export const BORDER_STYLES: BorderStyleOption[] = [
  {
    id: 'persian_arabesque',
    name: 'قاب اسلیمی و ترنج شاهانه',
    desc: 'گوشه‌های طلاکوب اسلیمی با نقوش تذهیب اصیل ایرانی',
    description: 'گوشه‌های طلاکوب اسلیمی با نقوش تذهیب اصیل ایرانی',
    previewClass: 'border-2 border-amber-400/50 rounded-2xl'
  },
  {
    id: 'royal_double_line',
    name: 'کادر دولایه کلاسیک طلاکوب',
    desc: 'خطوط موازی اشرافی با لچک‌های گوشواره‌ای باریک',
    description: 'خطوط موازی اشرافی با لچک‌های گوشواره‌ای باریک',
    previewClass: 'border-4 border-double border-amber-400/60 rounded-xl'
  },
  {
    id: 'minimal_clean',
    name: 'مینیمال خطی مدرن و پیوسته',
    desc: 'خطوط بسیار ظریف با گوشه‌های نرم و خلوت',
    description: 'خطوط بسیار ظریف با گوشه‌های نرم و خلوت',
    previewClass: 'border border-stone-700/80 rounded-3xl'
  },
  {
    id: 'ornate_crest',
    name: 'طاق و قوس نگارگری درباری',
    desc: 'حاشیه قوسی با سرلوحه گنبدی و کتیبه نقره‌فام',
    description: 'حاشیه قوسی با سرلوحه گنبدی و کتیبه نقره‌فام',
    previewClass: 'border-2 border-dashed border-amber-500/40 rounded-t-3xl rounded-b-xl'
  },
  {
    id: 'floral_wreath',
    name: 'حاشیه گل و بوته ابریشمی',
    desc: 'تزیین شاخ و برگ‌های بهاری و نگین‌های درخشان',
    description: 'تزیین شاخ و برگ‌های بهاری و نگین‌های درخشان',
    previewClass: 'border-2 border-emerald-400/40 rounded-2xl'
  },
  {
    id: 'palace_arch',
    name: 'طاق قصر نیاوران و کاخ گلستان',
    desc: 'طاق قوسی فوق‌العاده چشم‌نواز با کنگره‌های زرین',
    description: 'طاق قوسی فوق‌العاده چشم‌نواز با کنگره‌های زرین',
    previewClass: 'border-4 border-amber-300/60 rounded-t-[40px] rounded-b-2xl'
  },
  {
    id: 'golden_emboss',
    name: 'برجسته‌کاری زرکوب و مخمل',
    desc: 'سایه نئونی و درخشش هاله طلایی در پیرامون کارت',
    description: 'سایه نئونی و درخشش هاله طلایی در پیرامون کارت',
    previewClass: 'border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)] rounded-2xl'
  }
];

export const FONT_PAIRING_STYLES: FontPairingOption[] = [
  {
    id: 'classic_amiri',
    name: 'امیری اصیل و نستعلیق سنتی',
    desc: 'تایپوگرافی کلاسیک، فاخر و اشعار کهن با وقار',
    description: 'تایپوگرافی کلاسیک، فاخر و اشعار کهن با وقار',
    headingClass: 'font-amiri font-bold',
    bodyClass: 'font-amiri'
  },
  {
    id: 'modern_vazir',
    name: 'وزیرمتن مدرن و هندسی',
    desc: 'طراحی بسیار خوانا، مینیمال، مدرن و شیک',
    description: 'طراحی بسیار خوانا، مینیمال، مدرن و شیک',
    headingClass: 'font-vazir font-bold',
    bodyClass: 'font-vazir'
  },
  {
    id: 'royal_scheherazade',
    name: 'شهرزاد درباری کشیده',
    desc: 'کشیدگی حروف و ترکیبات موزون و شاهانه',
    description: 'کشیدگی حروف و ترکیبات موزون و شاهانه',
    headingClass: 'font-amiri tracking-wide font-bold',
    bodyClass: 'font-amiri leading-loose'
  },
  {
    id: 'chic_marcellus',
    name: 'تلفیق سینزل لاتین و خط ایرانی',
    desc: 'ترکیب لوکس تایپوگرافی اروپایی و خوشنویسی فارسی',
    description: 'ترکیب لوکس تایپوگرافی اروپایی و خوشنویسی فارسی',
    headingClass: 'font-cinzel tracking-wider font-bold',
    bodyClass: 'font-vazir'
  }
];

export const AMBIENT_EFFECT_STYLES: AmbientEffectOption[] = [
  {
    id: 'gold_sparkles',
    name: 'تلألو ذرات طلایی و اکلیل نورانی',
    desc: 'ستارگان ریز و درخشش ملایم نور طلا در پس‌زمینه',
    description: 'ستارگان ریز و درخشش ملایم نور طلا در پس‌زمینه',
    icon: '✨'
  },
  {
    id: 'petals_glow',
    name: 'بارش نرم گلبرگ و مه رمانتیک',
    desc: 'حرکت آرام گلبرگ‌های بهاری در هوای معطر جشن',
    description: 'حرکت آرام گلبرگ‌های بهاری در هوای معطر جشن',
    icon: '🌸'
  },
  {
    id: 'persian_geometric',
    name: 'شمسه‌های هندسی و نقوش اسلیمی',
    desc: 'خطوط ملایم تذهیب و گره‌چینی کهن در عمق صفحه',
    description: 'خطوط ملایم تذهیب و گره‌چینی کهن در عمق صفحه',
    icon: '⚜️'
  },
  {
    id: 'minimal_vignette',
    name: 'سایه‌روشن مینیمال و ملایم',
    desc: 'تمرکز نوری تاریک و روشن بدون المان‌های شلوغ',
    description: 'تمرکز نوری تاریک و روشن بدون المان‌های شلوغ',
    icon: '🌑'
  },
  {
    id: 'celestial_stars',
    name: 'کهکشان و ستاره‌های درخشان',
    desc: 'آسمان شب با چشمک ملایم خوشه‌های ستاره‌ای',
    description: 'آسمان شب با چشمک ملایم خوشه‌های ستاره‌ای',
    icon: '🌌'
  },
  {
    id: 'candlelight_shimmer',
    name: 'نور لرزان شمع‌های رویایی',
    desc: 'هاله گرم و آرامش‌بخش شمع‌آرایی جشن',
    description: 'هاله گرم و آرامش‌بخش شمع‌آرایی جشن',
    icon: '🕯️'
  }
];

export const THEMES: Record<ThemeId, ThemeConfig> = {
  emerald: {
    id: 'emerald',
    name: 'زمرد و طلای سلطنتی',
    subtitle: 'سبک درباری و اصیل با حاشیه‌های طلاکوب',
    badge: 'پیش‌فرض لوکس',
    // Dark mode
    primaryBg: 'from-emerald-950 via-stone-950 to-emerald-950',
    cardBg: 'bg-stone-900/90',
    innerBg: 'bg-emerald-950/40',
    accentGold: '#D4AF37',
    textPrimary: 'text-amber-100',
    textSecondary: 'text-amber-200/80',
    textMuted: 'text-emerald-300/60',
    borderOrnament: 'border-amber-400/40',
    envelopeColor: 'bg-emerald-900 border-emerald-700',
    envelopeLining: 'bg-gradient-to-br from-emerald-950 to-amber-950/80',
    sealDefaultColor: 'gold',
    previewColor: '#064e3b',
    // Light mode
    lightPrimaryBg: 'from-emerald-50/95 via-amber-50/60 to-emerald-100/90',
    lightCardBg: 'bg-white/95',
    lightInnerBg: 'bg-emerald-50/70',
    lightAccentGold: '#b45309',
    lightTextPrimary: 'text-stone-900',
    lightTextSecondary: 'text-emerald-950',
    lightTextMuted: 'text-stone-600',
    lightBorderOrnament: 'border-amber-600/50',
    lightEnvelopeColor: 'bg-emerald-800 border-amber-400/70',
    lightEnvelopeLining: 'bg-gradient-to-br from-emerald-900 to-amber-800/60',
    lightSealColor: 'gold'
  },
  gold: {
    id: 'gold',
    name: 'شامپاینی و کریستال طلایی',
    subtitle: 'گرم، درخشان و خیره‌کننده',
    badge: 'کلاسیک طلایی',
    primaryBg: 'from-stone-950 via-amber-950/40 to-stone-950',
    cardBg: 'bg-stone-900/95',
    innerBg: 'bg-amber-950/20',
    accentGold: '#F59E0B',
    textPrimary: 'text-amber-50',
    textSecondary: 'text-amber-200/90',
    textMuted: 'text-stone-400',
    borderOrnament: 'border-amber-500/40',
    envelopeColor: 'bg-stone-900 border-amber-600/50',
    envelopeLining: 'bg-gradient-to-br from-amber-900/40 to-stone-950',
    sealDefaultColor: 'gold',
    previewColor: '#92400e'
  },
  azure: {
    id: 'azure',
    name: 'لاجوردی و فیروزه‌ای اصفهان',
    subtitle: 'نقوش اسلیمی و کاشی‌کاری‌های ایرانی',
    badge: 'ایرانی اصیل',
    primaryBg: 'from-slate-950 via-blue-950 to-slate-950',
    cardBg: 'bg-slate-900/90',
    innerBg: 'bg-blue-950/40',
    accentGold: '#38BDF8',
    textPrimary: 'text-cyan-50',
    textSecondary: 'text-cyan-200/80',
    textMuted: 'text-sky-300/60',
    borderOrnament: 'border-cyan-400/40',
    envelopeColor: 'bg-sky-950 border-cyan-700',
    envelopeLining: 'bg-gradient-to-br from-blue-950 to-sky-900/60',
    sealDefaultColor: 'navy',
    previewColor: '#0c4a6e'
  },
  rosegold: {
    id: 'rosegold',
    name: 'رزگلد و ابریشم مروارید',
    subtitle: 'ملایم، رمانتیک و لطیف',
    badge: 'رمانتیک مدرن',
    primaryBg: 'from-stone-950 via-rose-950/30 to-stone-950',
    cardBg: 'bg-stone-900/90',
    innerBg: 'bg-rose-950/25',
    accentGold: '#FB7185',
    textPrimary: 'text-rose-50',
    textSecondary: 'text-rose-200/85',
    textMuted: 'text-rose-300/60',
    borderOrnament: 'border-rose-400/40',
    envelopeColor: 'bg-rose-950 border-rose-800/60',
    envelopeLining: 'bg-gradient-to-br from-rose-950 to-pink-950/60',
    sealDefaultColor: 'red',
    previewColor: '#881337'
  },
  noir: {
    id: 'noir',
    name: 'مشکی کربن و عاجی مینیمال',
    subtitle: 'وقار مدرن با کنتراست فوق‌العاده',
    badge: 'مینیمال شیک',
    primaryBg: 'from-black via-stone-950 to-black',
    cardBg: 'bg-stone-950/95',
    innerBg: 'bg-stone-900/40',
    accentGold: '#E5E7EB',
    textPrimary: 'text-stone-100',
    textSecondary: 'text-stone-300',
    textMuted: 'text-stone-500',
    borderOrnament: 'border-stone-700',
    envelopeColor: 'bg-stone-950 border-stone-800',
    envelopeLining: 'bg-stone-900',
    sealDefaultColor: 'black',
    previewColor: '#1c1917'
  },
  ruby: {
    id: 'ruby',
    name: 'یاقوتی و کهربایی',
    subtitle: 'شور و گرمای عشق آتشین',
    badge: 'گرم و باوقار',
    primaryBg: 'from-stone-950 via-red-950 to-stone-950',
    cardBg: 'bg-stone-900/90',
    innerBg: 'bg-red-950/30',
    accentGold: '#F59E0B',
    textPrimary: 'text-red-50',
    textSecondary: 'text-amber-200/80',
    textMuted: 'text-red-300/60',
    borderOrnament: 'border-amber-400/40',
    envelopeColor: 'bg-red-950 border-red-800',
    envelopeLining: 'bg-gradient-to-br from-red-950 to-amber-950/70',
    sealDefaultColor: 'red',
    previewColor: '#7f1d1d'
  },
  olive: {
    id: 'olive',
    name: 'سبز زیتونی و اکالیپتوس',
    subtitle: 'طبیعت مینیمال و ارگانیک با شکوه مدیترانه‌ای',
    badge: 'ترند روز ۲۰۲۶',
    primaryBg: 'from-stone-950 via-emerald-950/60 to-stone-950',
    cardBg: 'bg-stone-900/95',
    innerBg: 'bg-emerald-900/20',
    accentGold: '#A3E635',
    textPrimary: 'text-emerald-50',
    textSecondary: 'text-emerald-200/80',
    textMuted: 'text-emerald-400/60',
    borderOrnament: 'border-emerald-500/40',
    envelopeColor: 'bg-stone-900 border-emerald-800/60',
    envelopeLining: 'bg-gradient-to-br from-emerald-950 to-stone-900',
    sealDefaultColor: 'emerald',
    previewColor: '#365314'
  },
  lavender: {
    id: 'lavender',
    name: 'یاسمن و اسطوخودوس پرووانس',
    subtitle: 'بنفش رویایی و شاهانه با ته‌رنگ نقره‌ای',
    badge: 'رمانتیک اشرافی',
    primaryBg: 'from-stone-950 via-purple-950/60 to-stone-950',
    cardBg: 'bg-stone-900/95',
    innerBg: 'bg-purple-950/30',
    accentGold: '#C084FC',
    textPrimary: 'text-purple-50',
    textSecondary: 'text-purple-200/80',
    textMuted: 'text-purple-300/60',
    borderOrnament: 'border-purple-400/40',
    envelopeColor: 'bg-purple-950 border-purple-800/60',
    envelopeLining: 'bg-gradient-to-br from-purple-950 to-stone-950',
    sealDefaultColor: 'red',
    previewColor: '#581c87'
  },
  ivory: {
    id: 'ivory',
    name: 'عاجی مرواریدی و کرم ساتن',
    subtitle: 'سفید و بژ اشرافی با تلألو مرواریدی',
    badge: 'لوکس و نود',
    primaryBg: 'from-stone-950 via-amber-950/20 to-stone-950',
    cardBg: 'bg-stone-900/95',
    innerBg: 'bg-amber-950/10',
    accentGold: '#FDE68A',
    textPrimary: 'text-stone-50',
    textSecondary: 'text-amber-100/90',
    textMuted: 'text-stone-400',
    borderOrnament: 'border-amber-200/40',
    envelopeColor: 'bg-stone-900 border-amber-300/30',
    envelopeLining: 'bg-gradient-to-br from-stone-900 to-amber-950/40',
    sealDefaultColor: 'gold',
    previewColor: '#fef3c7'
  },
  bronze: {
    id: 'bronze',
    name: 'برنز کویری و شکلاتی کهربایی',
    subtitle: 'شکوه گرم کویر و اصالت معماری ایرانی',
    badge: 'گرم و کاریزماتیک',
    primaryBg: 'from-stone-950 via-orange-950/50 to-stone-950',
    cardBg: 'bg-stone-900/90',
    innerBg: 'bg-orange-950/25',
    accentGold: '#FB923C',
    textPrimary: 'text-orange-50',
    textSecondary: 'text-amber-200/85',
    textMuted: 'text-orange-300/60',
    borderOrnament: 'border-orange-500/40',
    envelopeColor: 'bg-stone-950 border-orange-900/60',
    envelopeLining: 'bg-gradient-to-br from-orange-950 to-stone-950',
    sealDefaultColor: 'gold',
    previewColor: '#7c2d12'
  },
  pearl_silver: {
    id: 'pearl_silver',
    name: 'مروارید و نقره‌ای پلاتینیوم',
    subtitle: 'سفید صدفی درخشان و خطوط نقره‌فام کریستالی',
    badge: 'پلاتین و ابریشم',
    primaryBg: 'from-slate-950 via-slate-900 to-slate-950',
    cardBg: 'bg-slate-900/95',
    innerBg: 'bg-slate-800/40',
    accentGold: '#E2E8F0',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-300',
    textMuted: 'text-slate-400',
    borderOrnament: 'border-slate-400/50',
    envelopeColor: 'bg-slate-900 border-slate-700',
    envelopeLining: 'bg-gradient-to-br from-slate-800 to-slate-950',
    sealDefaultColor: 'silver',
    previewColor: '#cbd5e1'
  },
  persian_sunset: {
    id: 'persian_sunset',
    name: 'طلای سرخ و انار شیراز',
    subtitle: 'ترکیب یاقوت اناری، ارغوان و طلای ناب شیرازی',
    badge: 'اصالت پارسی',
    primaryBg: 'from-stone-950 via-rose-950/80 to-stone-950',
    cardBg: 'bg-stone-900/95',
    innerBg: 'bg-rose-950/40',
    accentGold: '#F59E0B',
    textPrimary: 'text-rose-50',
    textSecondary: 'text-amber-200/90',
    textMuted: 'text-rose-300/70',
    borderOrnament: 'border-amber-400/50',
    envelopeColor: 'bg-rose-950 border-amber-600/60',
    envelopeLining: 'bg-gradient-to-br from-rose-950 to-amber-950',
    sealDefaultColor: 'red',
    previewColor: '#9f1239'
  },
  yazd_termeh: {
    id: 'yazd_termeh',
    name: 'فیروزه و ترمه زرین یزد',
    subtitle: 'آبی فیروزه‌ای اصیل با ترنج‌های طلاکوب سنتی',
    badge: 'میراث هنر یزد',
    primaryBg: 'from-stone-950 via-teal-950 to-stone-950',
    cardBg: 'bg-stone-900/95',
    innerBg: 'bg-teal-950/40',
    accentGold: '#2DD4BF',
    textPrimary: 'text-teal-50',
    textSecondary: 'text-amber-200/90',
    textMuted: 'text-teal-300/70',
    borderOrnament: 'border-teal-400/50',
    envelopeColor: 'bg-teal-950 border-amber-500/50',
    envelopeLining: 'bg-gradient-to-br from-teal-950 to-amber-950/60',
    sealDefaultColor: 'emerald',
    previewColor: '#115e59'
  },
  imperial_orchid: {
    id: 'imperial_orchid',
    name: 'ارغوانی شاهانه و بنفش سلطنتی',
    subtitle: 'مخمل بنفش اشرافی و شمسه‌های زرین باوقار',
    badge: 'امپریال درباری',
    primaryBg: 'from-stone-950 via-fuchsia-950/70 to-stone-950',
    cardBg: 'bg-stone-900/95',
    innerBg: 'bg-fuchsia-950/30',
    accentGold: '#FBBF24',
    textPrimary: 'text-fuchsia-50',
    textSecondary: 'text-amber-200/90',
    textMuted: 'text-fuchsia-300/70',
    borderOrnament: 'border-amber-400/50',
    envelopeColor: 'bg-stone-950 border-fuchsia-800/70',
    envelopeLining: 'bg-gradient-to-br from-fuchsia-950 to-stone-950',
    sealDefaultColor: 'gold',
    previewColor: '#701a75'
  },
  midnight_starlight: {
    id: 'midnight_starlight',
    name: 'لاجورد شب و ستاره‌های نقره‌ای',
    subtitle: 'آبی نیلی ژرف با ستارگان درخشان شب آسمانی',
    badge: 'کهکشانی رویایی',
    primaryBg: 'from-black via-indigo-950 to-black',
    cardBg: 'bg-stone-900/95',
    innerBg: 'bg-indigo-950/40',
    accentGold: '#818CF8',
    textPrimary: 'text-indigo-50',
    textSecondary: 'text-indigo-200/90',
    textMuted: 'text-indigo-300/70',
    borderOrnament: 'border-indigo-400/50',
    envelopeColor: 'bg-indigo-950 border-indigo-700',
    envelopeLining: 'bg-gradient-to-br from-indigo-950 to-slate-950',
    sealDefaultColor: 'navy',
    previewColor: '#312e81'
  }
};

export function getTheme(themeId: ThemeId = 'emerald', mode: 'dark' | 'light' = 'dark'): ThemeConfig {
  const base = THEMES[themeId] || THEMES.emerald;
  if (mode === 'light') {
    return {
      ...base,
      primaryBg: base.lightPrimaryBg || 'from-emerald-50/95 via-amber-50/60 to-emerald-100/90',
      cardBg: base.lightCardBg || 'bg-white/95',
      innerBg: base.lightInnerBg || 'bg-emerald-50/70',
      accentGold: base.lightAccentGold || '#b45309',
      textPrimary: base.lightTextPrimary || 'text-stone-900',
      textSecondary: base.lightTextSecondary || 'text-emerald-950',
      textMuted: base.lightTextMuted || 'text-stone-600',
      borderOrnament: base.lightBorderOrnament || 'border-amber-600/50',
      envelopeColor: base.lightEnvelopeColor || 'bg-emerald-800 border-amber-400/70',
      envelopeLining: base.lightEnvelopeLining || 'bg-gradient-to-br from-emerald-900 to-amber-800/60',
      sealDefaultColor: base.lightSealColor || base.sealDefaultColor
    };
  }
  return base;
}
