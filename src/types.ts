export type ThemeId =
  | 'emerald'
  | 'gold'
  | 'rosegold'
  | 'azure'
  | 'noir'
  | 'ruby'
  | 'olive'
  | 'lavender'
  | 'ivory'
  | 'bronze'
  | 'pearl_silver'
  | 'persian_sunset'
  | 'yazd_termeh'
  | 'imperial_orchid'
  | 'midnight_starlight';

export type SealColor = 'red' | 'gold' | 'emerald' | 'navy' | 'black' | 'silver' | 'burgundy' | 'rose_gold';

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

export interface MusicTrack {
  id: string;
  title: string;
  artist?: string;
  url?: string;
  isPreset?: boolean;
  synthPreset?: 'romantic_piano' | 'traditional_oud' | 'gentle_acoustic' | 'celestial_harp';
}

export interface MusicConfig {
  enabled: boolean;
  title: string;
  artist?: string;
  audioUrl?: string;
  synthPreset: 'romantic_piano' | 'traditional_oud' | 'gentle_acoustic' | 'celestial_harp';
  playlist?: MusicTrack[];
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
    lat: number;
    lng: number;
    snappUrl?: string;
    wazeUrl?: string;
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
  waxSeal: {
    color: SealColor;
    monogram: string;
    iconType: 'monogram' | 'heart' | 'rings' | 'floral';
  };
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

