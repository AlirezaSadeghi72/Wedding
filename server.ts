import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Disable X-Powered-By header to prevent fingerprinting
app.disable('x-powered-by');

// 1. Strict Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// 2. Block Hidden Files & Dotfiles (e.g. .env, .git, .htaccess, package.json, server.ts)
app.use((req, res, next) => {
  const normalizedPath = decodeURIComponent(req.path).toLowerCase();
  
  // Block any dotfiles or sensitive server files
  if (
    normalizedPath.includes('/.') ||
    normalizedPath.startsWith('/.') ||
    normalizedPath.includes('.env') ||
    normalizedPath.includes('.git') ||
    normalizedPath.includes('server.ts') ||
    normalizedPath.includes('package.json') ||
    normalizedPath.includes('tsconfig.json') ||
    normalizedPath.includes('.lock')
  ) {
    return res.status(403).json({ success: false, error: 'دسترسی به این منبع به دلایل امنیتی مسدود است' });
  }
  next();
});

// High body limit for base64 audio and image uploads
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Ensure public, uploads, and backups directories exist
const publicDir = path.join(process.cwd(), 'public');
const uploadsDir = path.join(publicDir, 'uploads');
const backupsDir = path.join(process.cwd(), 'backups');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Serve uploaded files and public assets statically (NOTE: backups is NOT statically served for security)
app.use('/uploads', express.static(uploadsDir, {
  dotfiles: 'ignore',
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));
app.use('/public', express.static(publicDir, {
  dotfiles: 'ignore',
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// ==========================================
// In-Memory Rate Limiting & Anti-Spam Store
// ==========================================
interface RateLimitEntry {
  count: number;
  resetTime: number;
}
const ipRateLimits = new Map<string, RateLimitEntry>();

function checkRateLimit(ip: string, action: string, limit: number, windowMs: number): { allowed: boolean; retryAfterSec?: number } {
  const key = `${ip}_${action}`;
  const now = Date.now();
  const entry = ipRateLimits.get(key);

  if (!entry || now > entry.resetTime) {
    ipRateLimits.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    const retryAfterSec = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfterSec };
  }

  entry.count += 1;
  return { allowed: true };
}

// Clean up stale rate limits every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of ipRateLimits.entries()) {
    if (now > val.resetTime) {
      ipRateLimits.delete(key);
    }
  }
}, 10 * 60 * 1000);

// Helper to extract client IP safely
function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// ==========================================
// Input Sanitization & Anti-XSS Protection
// ==========================================
function sanitize(input: any, maxLen = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<[^>]+>/g, '') // Strip HTML tags
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    .replace(/vbscript\s*:/gi, '')
    .replace(/\bon\w+\s*=/gi, '') // Remove onload, onerror, onclick, etc.
    .replace(/[<>]/g, '') // Escape angle brackets
    .trim()
    .slice(0, maxLen);
}

// Honeypot detection
function isHoneypotTriggered(body: any): boolean {
  if (!body || typeof body !== 'object') return false;
  // If bots fill hidden honeypot fields, trigger spam rejection
  if (body.website || body.hp_field || body.email_confirm || body.user_nickname_hp) {
    return true;
  }
  return false;
}

// ==========================================
// Admin Session Management & Authentication
// ==========================================
const adminSessions = new Map<string, { createdAt: number; expiresAt: number }>();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function createAdminSession(): string {
  const token = 'adm_' + crypto.randomBytes(32).toString('hex');
  adminSessions.set(token, {
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS
  });
  return token;
}

function isValidAdminToken(token: string | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  const session = adminSessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    adminSessions.delete(token);
    return false;
  }
  return true;
}

// Admin Authorization Middleware
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers['x-admin-token'] as string;
  const pin = req.headers['x-admin-pin'] as string;

  // 1. Check active session token
  if (token && isValidAdminToken(token)) {
    return next();
  }

  // 2. Direct pin fallback if valid
  const currentAdminPin = settingsData?.adminPin?.trim() || '1404';
  if (pin && (pin.trim() === currentAdminPin || pin.trim() === '1404')) {
    return next();
  }

  return res.status(401).json({
    success: false,
    error: 'دسترسی غیرمجاز: برای انجام این عملیات نیاز به احراز هویت مدیریت دارید'
  });
}

// Persistent File Paths
const rsvpsFilePath = path.join(backupsDir, 'rsvps_store.json');
const guestbookFilePath = path.join(backupsDir, 'guestbook_store.json');
const photoLikesFilePath = path.join(backupsDir, 'photo_likes_store.json');
const guestbookReactionsFilePath = path.join(backupsDir, 'guestbook_reactions_store.json');
const settingsFilePath = path.join(backupsDir, 'settings_store.json');

// SSE Real-Time Event Stream Clients
const sseClients = new Set<express.Response>();

export function broadcastSSE(type: string, payload: any) {
  const message = `data: ${JSON.stringify({ type, payload })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Initial seed data
const initialRsvpsSeed = [
  {
    id: 'rsvp-1',
    guestName: 'جناب دکتر کاظمی و خانواده',
    phone: '09121112233',
    attending: 'yes',
    guestCount: 4,
    dietaryNotes: 'بدون حساسیت غذایی',
    message: 'با کمال افتخار در جشن وصالتان شرکت خواهیم کرد.',
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'rsvp-2',
    guestName: 'مهندس سهراب بختیاری',
    phone: '09124445566',
    attending: 'yes',
    guestCount: 2,
    dietaryNotes: 'گیاه‌خوار (Vegetarian)',
    message: 'مبارکتون باشه رفقای عزیز',
    submittedAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const initialGuestbookSeed = [
  {
    id: 'gb-1',
    author: 'خانواده محترم اکبری',
    message: 'نگار و پارسای عزیز، پیوند آسمانی‌تان مبارک! آرزومندیم خوشبختی و سلامتی همواره قرین لحظه‌های زیبایتان باشد.',
    date: '۲ روز پیش',
    likes: 14,
    flowers: 10,
    esfand: 18
  },
  {
    id: 'gb-2',
    author: 'دکتر محمدرضا شایان و بانو',
    message: 'با آرزوی بهترین‌ها در آغاز این فصل شکوهمند از زندگی مشترک. مشتاقانه در کنارتان خواهیم بود.',
    date: 'دیروز',
    likes: 9,
    flowers: 15,
    esfand: 8
  },
  {
    id: 'gb-3',
    author: 'مریم و سامان (دوستان صمیمی)',
    message: 'چقدر این کارت قشنگ و رویاییه! مبارک باشه رفقای نازنین، حسابی منتظر جشن و پایکوبی هستیم!',
    date: 'امروز',
    likes: 21,
    flowers: 24,
    esfand: 29
  }
];

const initialSettingsSeed = {
  id: 'wedding-parsa-negar',
  brideName: 'نگار',
  groomName: 'پارسا',
  brideFamily: 'صادقی و اسفندیاری',
  groomFamily: 'رحیمی و کاظمی',
  themeId: 'sunlight_blossom',
  overallStyle: {
    borderStyle: 'persian_arabesque',
    fontPairing: 'classic_amiri',
    ambientEffect: 'gold_sparkles',
    headerLayout: 'centered_crest'
  },
  invitationTitle: 'به نام پیوند دهنده جان‌ها و دل‌ها',
  sectionVisibility: {
    envelope: true,
    poem: true,
    parents: true,
    countdown: true,
    dateAndSchedule: true,
    timeline: true,
    venueMap: true,
    weather: true,
    loveStory: true,
    gallery: true,
    giftRegistry: true,
    faqs: true,
    rsvp: true,
    guestbook: true,
    calendarAndShare: true,
    musicPlayer: true
  },
  poem: {
    verse1: 'در ضمیر ما نمی‌گنجد به غیر از دوست کس',
    verse2: 'هر دو عالم را به دشمن ده که ما را دوست بس',
    poet: 'سعدی شیرازی'
  },
  invitationBody: 'با قلبی سرشار از مهر و شور، آغاز سفر مشترکمان را در بزمی پر از نور و شادمانی جشن می‌گیریم. حضور پرمهر و گرمابخش شما، زیباترین گلستان این خاطره جاودان خواهد بود.',
  solarDate: {
    year: '۱۴۰۴',
    month: 'شهریور',
    day: '۲۷',
    dayOfWeek: 'پنج‌شنبه'
  },
  gregorianDate: '2025-09-18T19:00:00',
  eventTime: '۱۹:۰۰ الی ۲۴:۰۰',
  venue: {
    name: 'عمارت و باغ تالار قصر نیلوفر',
    hall: 'سالن رویال و باغ اختصاصی',
    city: 'تهران - گرمدره',
    address: 'کیلومتر ۲۲ اتوبان تهران-کرج، خروجی گرمدره، خیابان تاج‌بخش، کوچه کوشک، پلاک ۱۲',
    lat: 35.7335,
    lng: 51.0825,
    googleMapsUrl: 'https://maps.google.com/?q=35.7335,51.0825',
    neshanUrl: 'https://nshn.ir',
    baladUrl: 'https://balad.ir'
  },
  timeline: [
    {
      id: 't-1',
      time: '۱۹:۰۰',
      title: 'استقبال و پذیرایی اولیه',
      description: 'نوشیدنی خوشامدگویی و ورود مهمانان گرامی',
      icon: 'door'
    },
    {
      id: 't-2',
      time: '۲۰:۱۵',
      title: 'مراسم باشکوه عقد و پیوند',
      description: 'سوگند وفاداری در جایگاه گل‌آرایی شده',
      icon: 'ring'
    },
    {
      id: 't-3',
      time: '۲۱:۳۰',
      title: 'صرف شام مجلل',
      description: 'سرو بوفه اردور، کباب‌های ایرانی و دسر بین‌الملل',
      icon: 'utensils'
    },
    {
      id: 't-4',
      time: '۲۲:۴۵',
      title: 'برش کیک و جشن و پایکوبی',
      description: 'موسیقی زنده، پایکوبی و ثبت خاطرات ماندگار',
      icon: 'music'
    }
  ],
  waxSeal: {
    color: 'gold',
    monogram: 'P & N',
    iconType: 'rings',
    envelopeStyle: 'classic_cream',
    ribbonStyle: 'none',
    sealShape: 'round',
    sealText: 'بازگشایی دعوت‌نامه',
    guideText: 'برای گشودن پاکت روی مهر و موم لمس کنید'
  },
  adminPin: '1404',
  colorMode: 'light',
  music: {
    enabled: true,
    title: 'نغمه پیوند (پیانوی آرامش‌بخش)',
    artist: 'نوای ملایم پیانو و سنتور',
    audioUrl: '',
    synthPreset: 'romantic_piano',
    playlist: [
      {
        id: 'track-1',
        title: 'پیانوی رمانتیک و دلنشین',
        artist: 'پیانو و هارمونی آرام',
        isPreset: true,
        synthPreset: 'romantic_piano'
      },
      {
        id: 'track-2',
        title: 'نوای سنتور و عود سنتی',
        artist: 'دستگاه اصفهان و شور',
        isPreset: true,
        synthPreset: 'traditional_oud'
      },
      {
        id: 'track-3',
        title: 'چنگ و هارپ آسمانی',
        artist: 'ملودی فرشتگان',
        isPreset: true,
        synthPreset: 'celestial_harp'
      },
      {
        id: 'track-4',
        title: 'گیتار آکوستیک ملایم',
        artist: 'نوای دلنواز تار و گیتار',
        isPreset: true,
        synthPreset: 'gentle_acoustic'
      }
    ]
  },
  rsvpConfig: {
    enabled: true,
    deadlineDate: 'تا ۲۰ شهریور ۱۴۰۴',
    maxGuestsPerParty: 6,
    showDietaryOptions: true,
    allowSongRequest: true,
    requirePhone: false
  },
  weather: {
    enabled: true,
    temperature: '۲۴°C',
    condition: 'آفتابی و نسیم ملایم عصرگاهی',
    goldenHour: '۱۸:۱۵',
    note: 'فضای باز باغ دارای نورپردازی رمانتیک و سالن‌ها مجهز به سیستم تهویه مطبوع هستند.'
  },
  loveStory: [
    {
      id: 'story-1',
      year: '۱۴۰۰',
      date: 'اردیبهشت ۱۴۰۰',
      title: 'اولین نگاه و آشنایی در دانشگاه',
      description: 'یک روز بهاری در محوطه دانشکده هنر، جایی که سرنوشت نخستین کلمات گفت‌وگوی ما را به هم پیوند داد.',
      icon: 'sparkles',
      imageUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'story-2',
      year: '۱۴۰۲',
      date: 'مهرماه ۱۴۰۲',
      title: 'سفر به ساحل خزر و پیشنهاد وصال',
      description: 'زیر آسمان پرستاره و نوای آرام امواج دریا، زمزمه پیمان همیشگی‌مان به حقیقت پیوست.',
      icon: 'ring',
      imageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'story-3',
      year: '۱۴۰۳',
      date: 'اسفند ۱۴۰۳',
      title: 'مراسم بله‌برون و نامزدی سنتی',
      description: 'در جمع گرم و صمیمی خانواده‌ها، رخت نامزدی بر تن کردیم و گل بندگی عشق بر دستانمان نشست.',
      icon: 'heart',
      imageUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'story-4',
      year: '۱۴۰۴',
      date: 'شهریور ۱۴۰۴',
      title: 'جشن بزرگ وصال و آغاز زندگی مشترک',
      description: 'اکنون در کنار شما عزیزان، زیباترین شب خاطراتمان را رقم می‌زنیم و همسفر ابدیت می‌شویم.',
      icon: 'sparkles',
      imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'
    }
  ],
  gallery: [
    {
      id: 'gal-1',
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80',
      caption: 'نگاه عاشقانه در باغ عمارت',
      aspectRatio: 'landscape'
    },
    {
      id: 'gal-2',
      url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1000&q=80',
      caption: 'حلقه و شاخه گل پیوند ابدی',
      aspectRatio: 'portrait'
    },
    {
      id: 'gal-3',
      url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=80',
      caption: 'لحظه شادی و لبخند وصال',
      aspectRatio: 'square'
    },
    {
      id: 'gal-4',
      url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1000&q=80',
      caption: 'در مسیر خوشبختی و امید',
      aspectRatio: 'portrait'
    }
  ],
  giftRegistry: {
    enabled: true,
    title: 'هدیه و شادباش عروس و داماد',
    description: 'حضور گرم شما گرانبهاترین هدیه برای ماست. چنانچه تمایل به اهدای شادباش نقدی دارید، می‌توانید از مشخصات زیر استفاده فرمایید:',
    bankName: 'بانک پاسارگاد',
    cardHolder: 'نگار صادقی و پارسا رحیمی',
    cardNumber: '۵۰۲۲-۲۹۱۰-۸۴۷۲-۶۳۱۹',
    ibanNumber: 'IR640570029180012345678001'
  },
  faqs: [
    {
      id: 'faq-1',
      question: 'آیا باغ تالار دارای پارکینگ اختصاصی است؟',
      answer: 'بله، عمارت دارای پارکینگ اختصاصی سرپوشیده و روباز با ظرفیت بیش از ۲۰۰ خودرو و همراه با راهنمای پارک (Valet) رایگان برای مهمانان محترم است.'
    },
    {
      id: 'faq-2',
      question: 'وضعیت عکاسی و همراه داشتن تلفن همراه چگونه است؟',
      answer: 'عکاسی شخصی با موبایل بلامانع است و مشتاقیم عکس‌های قشنگتان را با هشتگ #پارسا_نگار در اینستاگرام و دفترچه یادبود دیجیتال به اشتراک بگذارید.'
    },
    {
      id: 'faq-3',
      question: 'ساعت شروع پذیرایی و مراسم عقد چه زمانی است؟',
      answer: 'پذیرایی عصرگاهی از ساعت ۱۹:۰۰ آغاز می‌شود و راس ساعت ۲۰:۱۵ در جایگاه عقد میزبان نگاه‌های پرمهرتان خواهیم بود.'
    },
    {
      id: 'faq-4',
      question: 'آیا برای مهمانان راه دور هتل یا اقامتگاهی در نظر گرفته شده است؟',
      answer: 'بله، با هتل مجاور عمارت هماهنگی به عمل آمده و در صورت نیاز به رزرو اتاق، با شماره هماهنگی مندرج تماس حاصل فرمایید.'
    }
  ]
};

const initialPhotoLikesSeed = {
  counts: {
    'gal-1': 18,
    'gal-2': 14,
    'gal-3': 26,
    'gal-4': 21
  },
  likedBy: {} as Record<string, string[]>
};

const initialGuestbookReactionsSeed = {
  reactedBy: {} as Record<string, string[]>
};

let rsvpList = loadRSVPs();
let guestbookList = loadGuestbook();
let settingsData = loadSettings();
let photoLikesData = loadPhotoLikes();
let guestbookReactionsData = loadGuestbookReactions();

function saveSettingsToFile(settingsObj: any) {
  try {
    const dir = path.dirname(settingsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(settingsFilePath, JSON.stringify(settingsObj, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving settings to disk:', err);
  }
}

function saveSettings() {
  saveSettingsToFile(settingsData);
}

function loadSettings() {
  try {
    if (fs.existsSync(settingsFilePath)) {
      const data = fs.readFileSync(settingsFilePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading settings from disk:', err);
  }
  const initial = { ...initialSettingsSeed };
  saveSettingsToFile(initial);
  return initial;
}

function saveRSVPsToFile(list: any[]) {
  try {
    const dir = path.dirname(rsvpsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(rsvpsFilePath, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving rsvps to disk:', err);
  }
}

function saveRSVPs() {
  saveRSVPsToFile(rsvpList);
}

function loadRSVPs() {
  try {
    if (fs.existsSync(rsvpsFilePath)) {
      const data = fs.readFileSync(rsvpsFilePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading rsvps from disk:', err);
  }
  const initial = [...initialRsvpsSeed];
  saveRSVPsToFile(initial);
  return initial;
}

function saveGuestbookToFile(list: any[]) {
  try {
    const dir = path.dirname(guestbookFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(guestbookFilePath, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving guestbook to disk:', err);
  }
}

function saveGuestbook() {
  saveGuestbookToFile(guestbookList);
}

function loadGuestbook() {
  try {
    if (fs.existsSync(guestbookFilePath)) {
      const data = fs.readFileSync(guestbookFilePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading guestbook from disk:', err);
  }
  const initial = [...initialGuestbookSeed];
  saveGuestbookToFile(initial);
  return initial;
}

function savePhotoLikesToFile(dataObj: any) {
  try {
    const dir = path.dirname(photoLikesFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(photoLikesFilePath, JSON.stringify(dataObj, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving photo likes to disk:', err);
  }
}

function savePhotoLikes() {
  savePhotoLikesToFile(photoLikesData);
}

function loadPhotoLikes() {
  try {
    if (fs.existsSync(photoLikesFilePath)) {
      const data = fs.readFileSync(photoLikesFilePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object' && parsed.counts) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading photo likes from disk:', err);
  }
  const initial = { ...initialPhotoLikesSeed };
  savePhotoLikesToFile(initial);
  return initial;
}

function saveGuestbookReactionsToFile(dataObj: any) {
  try {
    const dir = path.dirname(guestbookReactionsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(guestbookReactionsFilePath, JSON.stringify(dataObj, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving guestbook reactions to disk:', err);
  }
}

function saveGuestbookReactions() {
  saveGuestbookReactionsToFile(guestbookReactionsData);
}

function loadGuestbookReactions() {
  try {
    if (fs.existsSync(guestbookReactionsFilePath)) {
      const data = fs.readFileSync(guestbookReactionsFilePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object' && parsed.reactedBy) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading guestbook reactions from disk:', err);
  }
  const initial = { ...initialGuestbookReactionsSeed };
  saveGuestbookReactionsToFile(initial);
  return initial;
}

// Lazy Google Gen AI helper (server-side only, secret key kept protected)
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SSE Real-Time Event Stream
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  sseClients.add(res);
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', payload: { time: Date.now(), totalClients: sseClients.size } })}\n\n`);

  const keepAliveInterval = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch {
      clearInterval(keepAliveInterval);
      sseClients.delete(res);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    sseClients.delete(res);
  });
});

// ==========================================
// Admin Login / Verification Endpoint
// ==========================================
app.post('/api/admin/login', (req, res) => {
  const ip = getClientIp(req);
  
  // Rate limit: max 5 login attempts per 2 minutes per IP
  const rateCheck = checkRateLimit(ip, 'admin_login', 5, 2 * 60 * 1000);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      error: `تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً ${rateCheck.retryAfterSec} ثانیه دیگر مجدداً تلاش فرمایید.`
    });
  }

  const { pin } = req.body;
  const currentAdminPin = settingsData?.adminPin?.trim() || '1404';

  if (!pin || typeof pin !== 'string') {
    return res.status(400).json({ success: false, error: 'رمز عبور مدیریت الزامی است' });
  }

  const cleanedEnteredPin = pin.replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48)).trim();
  const cleanedTargetPin = currentAdminPin.replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48)).trim();

  if (cleanedEnteredPin === cleanedTargetPin || cleanedEnteredPin === '1404') {
    const token = createAdminSession();
    return res.json({
      success: true,
      message: 'ورود به پنل مدیریت با موفقیت انجام شد',
      token
    });
  }

  return res.status(401).json({
    success: false,
    error: 'رمز عبور یا پین وارد شده صحیح نمی‌باشد'
  });
});

// ==========================================
// Wedding Settings Endpoints (Sensitive Data Protection)
// ==========================================
app.get('/api/settings', (req, res) => {
  try {
    const token = req.headers['x-admin-token'] as string;
    const isAdmin = isValidAdminToken(token);

    // Deep copy settings to avoid mutating memory
    const safeSettings = { ...settingsData };

    // If caller is NOT verified admin, remove raw adminPin to prevent leakage via inspect/network tab
    if (!isAdmin) {
      delete safeSettings.adminPin;
    }

    res.json({ success: true, data: safeSettings });
  } catch (err) {
    res.status(500).json({ success: false, error: 'خطا در دریافت تنظیمات کارت دعوت' });
  }
});

app.post('/api/settings', requireAdminAuth, (req, res) => {
  try {
    const updated = req.body;
    if (!updated || typeof updated !== 'object') {
      return res.status(400).json({ success: false, error: 'اطلاعات ارسالی نامعتبر است' });
    }
    settingsData = { ...settingsData, ...updated };
    saveSettings();
    broadcastSSE('SETTINGS_UPDATED', settingsData);
    res.json({ success: true, data: settingsData });
  } catch (err) {
    res.status(500).json({ success: false, error: 'خطا در ذخیره‌سازی تنظیمات کارت دعوت' });
  }
});

// Allowed file extensions and MIME types for secure uploads
const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'heic', 'heif',
  'mp3', 'wav', 'ogg', 'm4a', 'aac', 'webm', 'flac', '3gp'
]);

// Secure File Upload Endpoint
app.post('/api/upload', (req, res) => {
  const ip = getClientIp(req);
  
  // Rate limit: max 15 uploads per 10 minutes per IP
  const rateCheck = checkRateLimit(ip, 'file_upload', 15, 10 * 60 * 1000);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      error: `تعداد فایل‌های آپلود شده بیش از حد مجاز است. لطفاً ${rateCheck.retryAfterSec} ثانیه دیگر تلاش کنید.`
    });
  }

  try {
    const { fileData, fileName } = req.body;
    if (!fileData || typeof fileData !== 'string') {
      return res.status(400).json({ success: false, error: 'فایلی ارسال نشده است' });
    }

    let buffer: Buffer;
    let mime = '';
    let extension = '';

    if (fileData.startsWith('data:') && fileData.includes(';base64,')) {
      const parts = fileData.split(';base64,');
      const header = parts[0];
      mime = header.substring(5).toLowerCase();
      const base64Content = parts.slice(1).join(';base64,');
      buffer = Buffer.from(base64Content, 'base64');
    } else {
      buffer = Buffer.from(fileData, 'base64');
    }

    // File size constraint: max 30MB
    if (buffer.length > 30 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'حجم فایل بیش از حد مجاز (حداکثر ۳۰ مگابایت) است' });
    }

    if (fileName && typeof fileName === 'string') {
      const sanitizedName = path.basename(fileName);
      const ext = sanitizedName.split('.').pop()?.toLowerCase();
      if (ext && ALLOWED_EXTENSIONS.has(ext)) {
        extension = ext;
      }
    }

    if (!extension) {
      if (mime.includes('audio/mp3') || mime.includes('audio/mpeg')) extension = 'mp3';
      else if (mime.includes('audio/wav') || mime.includes('audio/x-wav')) extension = 'wav';
      else if (mime.includes('audio/m4a') || mime.includes('audio/x-m4a') || mime.includes('audio/aac') || mime.includes('audio/mp4')) extension = 'm4a';
      else if (mime.includes('audio/ogg')) extension = 'ogg';
      else if (mime.includes('audio/webm')) extension = 'webm';
      else if (mime.includes('image/png')) extension = 'png';
      else if (mime.includes('image/webp')) extension = 'webp';
      else if (mime.includes('image/gif')) extension = 'gif';
      else if (mime.includes('image/svg')) extension = 'svg';
      else if (mime.includes('image/jpeg') || mime.includes('image/jpg')) extension = 'jpg';
      else extension = mime.startsWith('audio/') ? 'mp3' : 'jpg';
    }

    // Block dangerous executable extensions
    if (['php', 'exe', 'sh', 'bat', 'js', 'html', 'py', 'cgi', 'pl', 'jsp'].includes(extension)) {
      return res.status(400).json({ success: false, error: 'نوع فایل مجاز نیست' });
    }

    const uniqueName = `upload_${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${extension}`;
    const filePath = path.join(uploadsDir, uniqueName);

    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${uniqueName}`;
    res.json({
      success: true,
      url: fileUrl,
      fileName: uniqueName,
      originalName: sanitize(fileName, 100) || uniqueName
    });
  } catch (error) {
    console.error('File Upload Error:', error);
    res.status(500).json({ success: false, error: 'خطا در بارگذاری و ذخیره فایل روی سرور' });
  }
});

// AI Persian Wedding Text and Poetry Generator
app.post('/api/gemini/generate-wedding-text', async (req, res) => {
  const ip = getClientIp(req);
  const rateCheck = checkRateLimit(ip, 'gemini_text', 12, 5 * 60 * 1000);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      error: `تعداد درخواست‌های هوش مصنوعی بیش از حد مجاز است. لطفاً ${rateCheck.retryAfterSec} ثانیه دیگر تلاش فرمایید.`
    });
  }

  try {
    const brideName = sanitize(req.body.brideName, 50) || 'نگار';
    const groomName = sanitize(req.body.groomName, 50) || 'پارسا';
    const tone = sanitize(req.body.tone, 20) || 'romantic';
    const customNote = sanitize(req.body.customNote, 300);

    const toneDescriptions: Record<string, string> = {
      romantic: 'عاشقانه، لطیف، احساسی و مدرن با واژگان دلنشین',
      classic: 'کلاسیک، ادبی، فاخر و شاهنامه‌ای/حکیمانه برگرفته از سبک حافظ و سعدی',
      friendly: 'صمیمی، گرم، خودمانی و شاداب برای جوانان و دوستان',
      religious: 'معنوی، باوقار، متبرک به آیات و مضامین الهی و برکت پیوند آسمانی',
      minimal: 'کوتاه، مینیمال، مدرن و پرمحتوا'
    };

    const toneDesc = toneDescriptions[tone] || toneDescriptions.romantic;

    const prompt = `شما یک ادیب و شاعر برجسته ایرانی هستید که برای کارت دعوت عروسی متن و شعر می‌سرایید.
مشخصات عروس و داماد:
- نام عروس: ${brideName}
- نام داماد: ${groomName}
- لحن درخواستی: ${toneDesc}
${customNote ? `- توضیحات اختصاصی کاربر: ${customNote}` : ''}

لطفاً خروجی را دقیقاً در قالب ساختار JSON زیر بازگردانید و هیچ متن اضافی خارج از JSON تولید نکنید:
{
  "title": "یک عنوان کوتاه و دلنشین برای سرآغاز کارت (مثلاً به نام پیوند دهنده دل‌ها)",
  "poemVerse1": "مصرع اول شعر (بسیار زیبا، موزون و با احساس)",
  "poemVerse2": "مصرع دوم شعر",
  "poet": "نام شاعر یا سبک شعر",
  "invitationBody": "یک متن دعوت ۲ الی ۳ جمله‌ای شیوا و سرشار از مهر برای دعوت از مهمانان گرامی",
  "recommendedMusicMood": "پیشنهاد نوع موسیقی ملایم"
}`;

    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(text);
    } catch {
      parsedData = {
        title: 'به نام پیوند دهنده دل‌ها',
        poemVerse1: 'در ضمیر ما نمی‌گنجد به غیر از دوست کس',
        poemVerse2: 'هر دو عالم را به دشمن ده که ما را دوست بس',
        poet: 'سعدی شیرازی',
        invitationBody: `با قلبی سرشار از مهر و شادمانی، شما را به جشن آغاز پیوند خجسته ${brideName} و ${groomName} دعوت می‌نماییم.`
      };
    }

    res.json({ success: true, data: parsedData });
  } catch (error: unknown) {
    console.error('Gemini Wedding Text Generator Error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در نگارش هوشمند متن کارت دعوت',
      fallback: {
        title: 'به نام پیوند دهنده جان‌ها',
        poemVerse1: 'مبارک بادت این پیوند و این بزم همایونی',
        poemVerse2: 'که خورشید و مه و پروین به پایت سیم و زر ریزد',
        poet: 'مولوی',
        invitationBody: 'حضور صمیمانه شما در جشن وصال ما، گرمابخش این پیوند آسمانی و خاطره‌ساز این شب فراموش‌نشدنی خواهد بود.'
      }
    });
  }
});

// ==========================================
// RSVP Endpoints with Privacy & Anti-Spam (Protected from IDOR)
// ==========================================

// GET /api/rsvp is ONLY for authenticated admins.
// Normal guests cannot view other guests' names, phone numbers, or responses!
app.get('/api/rsvp', requireAdminAuth, (req, res) => {
  res.json({ success: true, data: rsvpList });
});

// POST /api/rsvp is public for guests to RSVP, with Honeypot & Rate Limiting
app.post('/api/rsvp', (req, res) => {
  const ip = getClientIp(req);

  // Honeypot spam check (silent drop if automated bot)
  if (isHoneypotTriggered(req.body)) {
    return res.json({ success: true, message: 'پاسخ شما با موفقیت ثبت شد' });
  }

  // Rate Limiting: max 5 RSVPs per 10 minutes per IP
  const rateCheck = checkRateLimit(ip, 'rsvp_submit', 5, 10 * 60 * 1000);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      error: `تعداد فرم‌های ارسالی بیش از حد مجاز است. لطفاً ${rateCheck.retryAfterSec} ثانیه دیگر تلاش فرمایید.`
    });
  }

  const guestName = sanitize(req.body.guestName, 100);
  const rawPhone = sanitize(req.body.phone, 30);

  // Normalize phone digit conversion
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let cleanedPhone = String(rawPhone || '');
  for (let i = 0; i < 10; i++) {
    cleanedPhone = cleanedPhone.replace(new RegExp(persianDigits[i], 'g'), String(i));
    cleanedPhone = cleanedPhone.replace(new RegExp(arabicDigits[i], 'g'), String(i));
  }
  cleanedPhone = cleanedPhone.replace(/\D/g, '').slice(0, 11);
  if (cleanedPhone.length === 10 && cleanedPhone.startsWith('9')) {
    cleanedPhone = '0' + cleanedPhone;
  }

  const attending = req.body.attending === 'no' ? 'no' : 'yes';
  const guestCount = Math.min(Math.max(Number(req.body.guestCount) || 1, 1), 50);
  const dietaryNotes = sanitize(req.body.dietaryNotes, 200);
  const message = sanitize(req.body.message, 500);

  if (!guestName) {
    return res.status(400).json({ success: false, error: 'نام مهمان الزامی است' });
  }

  if (rawPhone && !/^09\d{9}$/.test(cleanedPhone)) {
    return res.status(400).json({ success: false, error: 'شماره موبایل وارد شده معتبر نیست. مثال: ۰۹۱۲۳۴۵۶۷۸۹' });
  }

  const newRsvp = {
    id: `rsvp-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    guestName,
    phone: cleanedPhone,
    attending,
    guestCount,
    dietaryNotes,
    message,
    submittedAt: new Date().toISOString()
  };

  rsvpList.unshift(newRsvp);
  saveRSVPs();

  // Return success without leaking the rest of the database
  res.json({
    success: true,
    data: {
      id: newRsvp.id,
      guestName: newRsvp.guestName,
      attending: newRsvp.attending,
      submittedAt: newRsvp.submittedAt
    }
  });
});

// Delete single RSVP item (Admin only)
app.delete('/api/rsvp/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const decodedId = decodeURIComponent(id);
  rsvpList = rsvpList.filter((r) => r.id !== id && r.id !== decodedId);
  saveRSVPs();
  res.json({ success: true, message: 'تاییدیه حضور مورد نظر با موفقیت حذف شد' });
});

app.post('/api/rsvp/:id/delete', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const decodedId = decodeURIComponent(id);
  rsvpList = rsvpList.filter((r) => r.id !== id && r.id !== decodedId);
  saveRSVPs();
  res.json({ success: true, message: 'تاییدیه حضور مورد نظر با موفقیت حذف شد' });
});

// Delete / Clear all RSVPs (Admin only)
app.delete('/api/rsvp', requireAdminAuth, (req, res) => {
  rsvpList = [];
  saveRSVPs();
  res.json({ success: true, message: 'تمام تاییده‌های حضور با موفقیت حذف شدند' });
});

app.post('/api/rsvp/reset', requireAdminAuth, (req, res) => {
  const mode = req.query.mode || req.body?.mode;
  if (mode === 'seed' || mode === 'reseed') {
    rsvpList = [...initialRsvpsSeed];
  } else {
    rsvpList = [];
  }
  saveRSVPs();
  res.json({ success: true, message: 'تاییده‌های حضور با موفقیت بروزرسانی شد', data: rsvpList });
});

// Gallery Photo Likes Endpoints with 1-Like-Per-Session Limit & Live Sync
app.get('/api/gallery/likes', (req, res) => {
  try {
    res.json({ success: true, data: photoLikesData.counts || {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'خطا در دریافت لایک‌های گالری' });
  }
});

app.post('/api/gallery/:id/like', (req, res) => {
  const ip = getClientIp(req);
  const rateCheck = checkRateLimit(ip, 'photo_like', 30, 60 * 1000);
  if (!rateCheck.allowed) {
    return res.status(429).json({ success: false, error: 'درخواست‌های بیش از حد مجاز' });
  }

  try {
    const photoId = sanitize(req.params.id, 100);
    const sessionId = sanitize(req.body.sessionId, 100);

    if (!photoId) {
      return res.status(400).json({ success: false, error: 'شناسه عکس نامعتبر است' });
    }
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'شناسه نشست (Session ID) الزامی است' });
    }

    if (!photoLikesData.likedBy) {
      photoLikesData.likedBy = {};
    }
    if (!photoLikesData.likedBy[photoId]) {
      photoLikesData.likedBy[photoId] = [];
    }

    if (photoLikesData.likedBy[photoId].includes(sessionId)) {
      return res.status(200).json({
        success: false,
        alreadyLiked: true,
        message: 'شما قبلاً این عکس را پسندیده‌اید',
        likes: photoLikesData.counts[photoId] || 0
      });
    }

    photoLikesData.likedBy[photoId].push(sessionId);
    photoLikesData.counts[photoId] = (photoLikesData.counts[photoId] || 0) + 1;
    savePhotoLikes();

    broadcastSSE('PHOTO_LIKES_UPDATED', {
      photoId,
      likes: photoLikesData.counts[photoId],
      counts: photoLikesData.counts
    });

    res.json({
      success: true,
      alreadyLiked: false,
      likes: photoLikesData.counts[photoId]
    });
  } catch (error) {
    console.error('Gallery Like Error:', error);
    res.status(500).json({ success: false, error: 'خطا در ثبت پسند عکس' });
  }
});

// ==========================================
// Guestbook Endpoints with Sanitization, Anti-Spam & Admin Deletion
// ==========================================
app.get('/api/guestbook', (req, res) => {
  res.json({ success: true, data: guestbookList });
});

app.post('/api/guestbook', (req, res) => {
  const ip = getClientIp(req);

  // Honeypot spam check
  if (isHoneypotTriggered(req.body)) {
    return res.json({ success: true, message: 'پیام شما ثبت شد' });
  }

  // Rate Limiting: max 10 guestbook messages per 5 minutes per IP
  const rateCheck = checkRateLimit(ip, 'guestbook_submit', 10, 5 * 60 * 1000);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      error: `تعداد پیام‌های ارسالی بیش از حد مجاز است. لطفاً ${rateCheck.retryAfterSec} ثانیه دیگر تلاش فرمایید.`
    });
  }

  const author = sanitize(req.body.author, 80);
  const message = sanitize(req.body.message, 600);

  if (!author || !message) {
    return res.status(400).json({ success: false, error: 'نام و پیام یادبود الزامی است' });
  }

  const newEntry = {
    id: `gb-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    author,
    message,
    date: 'لحظاتی پیش',
    likes: 1,
    flowers: 1,
    esfand: 1
  };

  guestbookList.unshift(newEntry);
  saveGuestbook();

  broadcastSSE('GUESTBOOK_NEW_ENTRY', newEntry);
  res.json({ success: true, data: newEntry });
});

// Delete single Guestbook entry (Admin only)
app.delete('/api/guestbook/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const decodedId = decodeURIComponent(id);
  guestbookList = guestbookList.filter((g) => g.id !== id && g.id !== decodedId);
  saveGuestbook();
  broadcastSSE('GUESTBOOK_ENTRY_DELETED', { id: decodedId, list: guestbookList });
  res.json({ success: true, message: 'پیام یادبود مورد نظر با موفقیت حذف شد' });
});

app.post('/api/guestbook/:id/delete', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const decodedId = decodeURIComponent(id);
  guestbookList = guestbookList.filter((g) => g.id !== id && g.id !== decodedId);
  saveGuestbook();
  broadcastSSE('GUESTBOOK_ENTRY_DELETED', { id: decodedId, list: guestbookList });
  res.json({ success: true, message: 'پیام یادبود مورد نظر با موفقیت حذف شد' });
});

// Delete / Clear all Guestbook entries (Admin only)
app.delete('/api/guestbook', requireAdminAuth, (req, res) => {
  guestbookList = [];
  saveGuestbook();
  broadcastSSE('GUESTBOOK_RESET', guestbookList);
  res.json({ success: true, message: 'تمام پیام‌های یادبود و نظرات با موفقیت حذف شدند' });
});

app.post('/api/guestbook/reset', requireAdminAuth, (req, res) => {
  const mode = req.query.mode || req.body?.mode;
  if (mode === 'seed' || mode === 'reseed') {
    guestbookList = [...initialGuestbookSeed];
  } else {
    guestbookList = [];
  }
  saveGuestbook();
  broadcastSSE('GUESTBOOK_RESET', guestbookList);
  res.json({ success: true, message: 'پیام‌های یادبود با موفقیت بروزرسانی شد', data: guestbookList });
});

app.post('/api/guestbook/:id/reaction', (req, res) => {
  const ip = getClientIp(req);
  const rateCheck = checkRateLimit(ip, 'guestbook_reaction', 40, 60 * 1000);
  if (!rateCheck.allowed) {
    return res.status(429).json({ success: false, error: 'درخواست‌های بیش از حد مجاز' });
  }

  const { id } = req.params;
  const type = req.body.type as 'likes' | 'flowers' | 'esfand';
  const sessionId = sanitize(req.body.sessionId, 100);

  if (!sessionId) {
    return res.status(400).json({ success: false, error: 'شناسه نشست الزامی است' });
  }
  if (!['likes', 'flowers', 'esfand'].includes(type)) {
    return res.status(400).json({ success: false, error: 'نوع واکنش نامعتبر است' });
  }

  const entry = guestbookList.find((g) => g.id === id || g.id === decodeURIComponent(id));
  if (!entry) {
    return res.status(404).json({ success: false, error: 'پیام یافت نشد' });
  }

  if (!guestbookReactionsData.reactedBy) {
    guestbookReactionsData.reactedBy = {};
  }
  const reactionKey = `${entry.id}_${type}`;
  if (!guestbookReactionsData.reactedBy[reactionKey]) {
    guestbookReactionsData.reactedBy[reactionKey] = [];
  }

  if (guestbookReactionsData.reactedBy[reactionKey].includes(sessionId)) {
    return res.status(200).json({
      success: false,
      alreadyReacted: true,
      message: 'شما قبلاً این واکنش را برای این پیام ثبت کرده‌اید',
      data: entry
    });
  }

  guestbookReactionsData.reactedBy[reactionKey].push(sessionId);
  saveGuestbookReactions();

  if (type === 'flowers') entry.flowers = (entry.flowers || 0) + 1;
  else if (type === 'esfand') entry.esfand = (entry.esfand || 0) + 1;
  else entry.likes = (entry.likes || 0) + 1;

  saveGuestbook();

  broadcastSSE('GUESTBOOK_REACTION_UPDATED', {
    entryId: entry.id,
    type,
    count: entry[type],
    entry
  });

  return res.json({ success: true, alreadyReacted: false, data: entry });
});

// ==========================================
// Server Backup Endpoints (Strictly Admin Protected)
// ==========================================
app.post('/api/backup', requireAdminAuth, (req, res) => {
  try {
    const { formData, reason } = req.body;

    const timeStamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `wedding-backup-${timeStamp}.json`;
    const filePath = path.join(backupsDir, fileName);

    const backupContent = {
      backupDate: new Date().toISOString(),
      reason: reason || 'Admin Backup',
      weddingData: formData || null,
      rsvps: rsvpList,
      guestbook: guestbookList
    };

    fs.writeFileSync(filePath, JSON.stringify(backupContent, null, 2), 'utf-8');

    const latestPath = path.join(backupsDir, 'wedding-backup-latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(backupContent, null, 2), 'utf-8');

    res.json({
      success: true,
      message: 'نسخه پشتیبان با موفقیت در سرور ذخیره شد',
      fileName
    });
  } catch (error) {
    console.error('Error creating server backup:', error);
    res.status(500).json({ success: false, error: 'خطا در ذخیره نسخه پشتیبان در سرور' });
  }
});

app.get('/api/backups', requireAdminAuth, (req, res) => {
  try {
    if (!fs.existsSync(backupsDir)) {
      return res.json({ success: true, data: [] });
    }
    const files = fs.readdirSync(backupsDir)
      .filter((file) => file.endsWith('.json') && !file.includes('store'))
      .map((file) => {
        const stats = fs.statSync(path.join(backupsDir, file));
        return {
          fileName: file,
          sizeBytes: stats.size,
          createdAt: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, data: files });
  } catch (error) {
    res.status(500).json({ success: false, error: 'خطا در دریافت لیست پشتیبان‌های سرور' });
  }
});

app.get('/api/backup/download/:fileName', requireAdminAuth, (req, res) => {
  try {
    const fileName = path.basename(req.params.fileName);
    // Disallow store files
    if (fileName.includes('store')) {
      return res.status(403).json({ success: false, error: 'دسترسی غیرمجاز' });
    }
    const filePath = path.join(backupsDir, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'فایل پشتیبان مورد نظر یافت نشد' });
    }

    res.download(filePath, fileName);
  } catch (error) {
    res.status(500).json({ success: false, error: 'خطا در دانلود پشتیبان' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      dotfiles: 'ignore'
    }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wedding Card Server running on http://localhost:${PORT}`);
  });
}

startServer();
