export type ThemeId = 'sunlight_blossom';

export type SealColor = 'gold' | 'emerald' | 'navy' | 'red' | 'burgundy' | 'rose_gold' | 'silver' | 'black';
export type EnvelopeStyle = 'classic_cream';
export type RibbonStyle = 'none' | 'gold_cross' | 'satin_red' | 'emerald_velvet' | 'royal_navy';
export type SealShape = 'round' | 'flower' | 'octagon' | 'shield';

export interface WaxSealConfig {
  color: SealColor;
  monogram: string;
  iconType: 'monogram' | 'heart' | 'rings' | 'floral' | 'crown' | 'bird';
  envelopeStyle?: EnvelopeStyle;
  ribbonStyle?: RibbonStyle;
  sealShape?: SealShape;
  sealText?: string;
  guideText?: string;
}

export type CardBorderStyle =
  | 'persian_arabesque'
  | 'royal_double_line'
  | 'minimal_clean'
  | 'ornate_crest'
  | 'floral_wreath'
  | 'palace_arch'
  | 'golden_emboss';

export type FontPairingStyle = 'classic_amiri' | 'modern_vazir' | 'royal_scheherazade' | 'chic_marcellus';

export type AmbientEffectStyle =
  | 'gold_sparkles'
  | 'petals_glow'
  | 'persian_geometric'
  | 'minimal_vignette'
  | 'celestial_stars'
  | 'candlelight_shimmer';

export type OverallBorderStyle = CardBorderStyle;
export type OverallFontPairing = FontPairingStyle;
export type OverallAmbientEffect = AmbientEffectStyle;

export interface OverallStyleConfig {
  borderStyle: CardBorderStyle;
  fontPairing: FontPairingStyle;
  ambientEffect: AmbientEffectStyle;
  headerLayout?: 'centered_crest' | 'floating_modern' | 'traditional_arch';
}

export interface TimelineItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  icon: 'ring' | 'door' | 'cake' | 'utensils' | 'music' | 'camera' | 'sparkles';
}

export interface SolarDate {
  year: string;
  month: string;
  day: string;
  dayOfWeek: string;
}

export interface LoveStoryMilestone {
  id: string;
  year: string;
  date: string;
  title: string;
  description: string;
  imageUrl?: string;
  image?: string;
  icon?: string;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  caption: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface GiftRegistryData {
  enabled: boolean;
  title?: string;
  description?: string;
  cardNumber?: string;
  cardHolder?: string;
  holderName?: string;
  bankName?: string;
  ibanNumber?: string;
  iban?: string;
}

export interface WeatherData {
  enabled: boolean;
  temperature?: string;
  temp?: string;
  condition: string;
  goldenHour?: string;
  sunset?: string;
  note?: string;
}

export interface SectionVisibility {
  envelope: boolean;
  poem: boolean;
  parents: boolean;
  countdown: boolean;
  dateAndSchedule: boolean;
  timeline: boolean;
  venueMap: boolean;
  weather: boolean;
  loveStory: boolean;
  gallery: boolean;
  giftRegistry: boolean;
  faqs: boolean;
  rsvp: boolean;
  guestbook: boolean;
  calendarAndShare: boolean;
  musicPlayer: boolean;
}

export type SectionKey =
  | 'parents'
  | 'poem'
  | 'dateAndSchedule'
  | 'countdown'
  | 'timeline'
  | 'venueMap'
  | 'weather'
  | 'loveStory'
  | 'gallery'
  | 'giftRegistry'
  | 'faqs'
  | 'rsvp'
  | 'calendarAndShare'
  | 'guestbook';

export const DEFAULT_SECTIONS_ORDER: SectionKey[] = [
  'parents',
  'poem',
  'dateAndSchedule',
  'countdown',
  'timeline',
  'venueMap',
  'weather',
  'loveStory',
  'gallery',
  'giftRegistry',
  'faqs',
  'rsvp',
  'calendarAndShare',
  'guestbook'
];

export function getEffectiveSectionsOrder(sectionsOrder?: (SectionKey | string)[]): SectionKey[] {
  if (!sectionsOrder || !Array.isArray(sectionsOrder) || sectionsOrder.length === 0) {
    return [...DEFAULT_SECTIONS_ORDER];
  }
  const validKeys = new Set(DEFAULT_SECTIONS_ORDER);
  const result: SectionKey[] = [];
  const added = new Set<string>();

  for (const k of sectionsOrder) {
    if (validKeys.has(k as SectionKey) && !added.has(k)) {
      result.push(k as SectionKey);
      added.add(k);
    }
  }

  for (const k of DEFAULT_SECTIONS_ORDER) {
    if (!added.has(k)) {
      result.push(k);
      added.add(k);
    }
  }

  return result;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist?: string;
  url?: string;
  audioUrl?: string;
  isPreset?: boolean;
  synthPreset?: 'romantic_piano' | 'traditional_oud' | 'gentle_acoustic' | 'celestial_harp';
}

export interface MusicConfig {
  enabled: boolean;
  title: string;
  artist?: string;
  audioUrl?: string;
  autoPlay?: boolean;
  volume?: number;
  synthPreset: 'romantic_piano' | 'traditional_oud' | 'gentle_acoustic' | 'celestial_harp';
  playlist?: MusicTrack[];
  tracks?: MusicTrack[];
}

export interface WeddingCardData {
  id: string;
  brideName: string;
  groomName: string;
  brideFamily: string;
  groomFamily: string;
  themeId: ThemeId;
  overallStyle?: OverallStyleConfig;
  invitationTitle: string;
  sectionVisibility?: Partial<SectionVisibility>;
  sectionsOrder?: SectionKey[] | string[];
  poem: {
    verse1: string;
    verse2: string;
    poet?: string;
  };
  invitationBody: string;
  solarDate: SolarDate;
  gregorianDate: string; // e.g. "2025-09-18T19:00:00"
  eventTime: string;
  venue: {
    name: string;
    hall?: string;
    city: string;
    address: string;
    lat: number | string;
    lng: number | string;
    googleMapsUrl?: string;
    neshanUrl?: string;
    baladUrl?: string;
  };
  timeline: TimelineItem[];
  loveStory?: LoveStoryMilestone[];
  gallery?: GalleryPhoto[];
  giftRegistry?: GiftRegistryData;
  weather?: WeatherData;
  faqs?: FAQItem[];
  waxSeal: WaxSealConfig;
  adminPin?: string;
  colorMode?: 'dark' | 'light';
  music: MusicConfig;
  rsvpConfig: {
    enabled: boolean;
    deadlineDate: string;
    maxGuestsPerParty: number;
    showDietaryOptions: boolean;
    allowSongRequest?: boolean;
    requirePhone?: boolean;
  };
}

export interface RSVPResponse {
  id: string;
  guestName: string;
  phone?: string;
  attending: 'yes' | 'no';
  guestCount: number;
  dietaryNotes?: string;
  songRequest?: string;
  message?: string;
  submittedAt: string;
}

export interface GuestbookEntry {
  id: string;
  author: string;
  message: string;
  date: string;
  likes: number;
  flowers: number;
  esfand: number;
}

