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
  sunlight_blossom: {
    id: 'sunlight_blossom',
    name: '۱. آفتاب و شکوفه (Sunlight & Blossom)',
    subtitle: 'سفید عاجی نرم، سبز زیتونی، زرد لیمویی شاد و صورتی هلویی',
    badge: 'روشن و بهاری',
    primaryBg: 'from-[#052e16] via-[#064e3b] to-[#022c22]',
    cardBg: 'bg-[#052e16]/90',
    innerBg: 'bg-[#064e3b]/80',
    accentGold: '#FACC15',
    textPrimary: 'text-[#FEF3C7]',
    textSecondary: 'text-[#FEF3C7]',
    textMuted: 'text-[#FEF3C7]/80',
    borderOrnament: 'border-[#FACC15]/80',
    envelopeColor: 'bg-[#FFFDF5] border-[#FACC15]/80',
    envelopeLining: 'bg-gradient-to-br from-[#FEF3C7] to-[#F472B6]/40',
    sealDefaultColor: 'gold',
    previewColor: '#FACC15',
    lightPrimaryBg: 'from-[#FFFDF5] via-[#FFFDF5] to-[#FEF3C7]',
    lightCardBg: 'bg-[#FFFDF5]/95',
    lightInnerBg: 'bg-[#FEF3C7]/40',
    lightAccentGold: '#EAB308',
    lightTextPrimary: 'text-[#4D7C0F]',
    lightTextSecondary: 'text-[#4D7C0F]',
    lightTextMuted: 'text-[#4D7C0F]/70',
    lightBorderOrnament: 'border-[#FACC15]/80',
    lightEnvelopeColor: 'bg-[#FFFDF5] border-[#FACC15]/80',
    lightEnvelopeLining: 'bg-gradient-to-br from-[#FEF3C7] to-[#F472B6]/40',
    lightSealColor: 'gold'
  }
};

export const DEFAULT_LIGHT_THEME: ThemeConfig = THEMES.sunlight_blossom;

export function getTheme(_themeId?: string, _mode?: 'dark' | 'light'): ThemeConfig {
  const base = THEMES.sunlight_blossom;
  return {
    ...base,
    primaryBg: base.lightPrimaryBg || 'from-[#FFFDF5] via-[#FFFDF5] to-[#FEF3C7]',
    cardBg: base.lightCardBg || 'bg-[#FFFDF5]/95',
    innerBg: base.lightInnerBg || 'bg-[#FEF3C7]/40',
    accentGold: base.lightAccentGold || '#EAB308',
    textPrimary: base.lightTextPrimary || 'text-[#4D7C0F]',
    textSecondary: base.lightTextSecondary || 'text-[#4D7C0F]',
    textMuted: base.lightTextMuted || 'text-[#4D7C0F]/70',
    borderOrnament: base.lightBorderOrnament || 'border-[#FACC15]/80',
    envelopeColor: base.lightEnvelopeColor || 'bg-[#FFFDF5] border-[#FACC15]/80',
    envelopeLining: base.lightEnvelopeLining || 'bg-gradient-to-br from-[#FEF3C7] to-[#F472B6]/40',
    sealDefaultColor: base.lightSealColor || 'gold'
  };
}
