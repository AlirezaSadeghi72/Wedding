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

// 1. Strict Security Headers (Configured to support AI Studio iframe preview)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// 2. Block Hidden Files, Dotfiles, Database Stores, and Backups from Direct Static Access
app.use((req, res, next) => {
  const normalizedPath = decodeURIComponent(req.path).toLowerCase();
  
  // Allow Vite internal client modules (e.g. /@vite/client, /node_modules/.vite/...)
  if (normalizedPath.includes('.vite/') || normalizedPath.startsWith('/@')) {
    return next();
  }

  // Block sensitive server files, dotfiles, database stores, backups, and configs
  if (
    normalizedPath.startsWith('/.') ||
    normalizedPath.includes('/.env') ||
    normalizedPath.includes('/.git') ||
    normalizedPath.includes('/server.ts') ||
    normalizedPath.includes('/tsconfig') ||
    normalizedPath.includes('package.json') ||
    normalizedPath.includes('.lock') ||
    normalizedPath.startsWith('/data') ||
    normalizedPath.startsWith('/backups') ||
    normalizedPath.startsWith('/backups_dir') ||
    normalizedPath.startsWith('/uploads_dir') ||
    normalizedPath.includes('store.json') ||
    normalizedPath.includes('wedding-backup') ||
    normalizedPath.endsWith('.db') ||
    normalizedPath.endsWith('.sqlite') ||
    normalizedPath.endsWith('.sqlite3') ||
    normalizedPath.endsWith('.sql') ||
    normalizedPath.endsWith('.bak')
  ) {
    return res.status(403).json({ success: false, error: 'دسترسی به این منبع به دلایل امنیتی مسدود است' });
  }
  next();
});

// High body limit for base64 audio and image uploads
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));



// Determine build and runtime environment paths
const isProduction = process.env.NODE_ENV === 'production';
const distDir = path.join(process.cwd(), 'dist');

// Storage directory strategy:
// 1. We keep durable data in the persistent `/data` (or `/backups`) directory in project root or custom environment path.
// 2. This ensures `npm run build` (which wipes/recreates `dist/`) NEVER deletes or resets saved wedding settings or uploads!
// 3. Optional environment variables BACKUPS_DIR and UPLOADS_DIR take priority if provided.
const persistentDataDir = path.join(process.cwd(), 'data');
const legacyBackupsDir = path.join(process.cwd(), 'backups');
const distBackupsDir = path.join(distDir, 'backups');

const persistentUploadsDir = path.join(process.cwd(), 'uploads');
const legacyPublicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
const distUploadsDir = path.join(distDir, 'uploads');

export const backupsDir = process.env.BACKUPS_DIR || persistentDataDir;
export const uploadsDir = process.env.UPLOADS_DIR || persistentUploadsDir;
export const publicDir = isProduction && fs.existsSync(path.join(distDir, 'public')) ? path.join(distDir, 'public') : path.join(process.cwd(), 'public');

// Ensure all persistent and build runtime directories exist
[distDir, backupsDir, uploadsDir, publicDir, persistentDataDir, persistentUploadsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // ignore
    }
  }
});

// Helper function to safely migrate/sync files from one directory to another if missing in target
function copyMissingFiles(sourceDir: string, targetDir: string) {
  if (!fs.existsSync(sourceDir) || sourceDir === targetDir) return;
  try {
    const files = fs.readdirSync(sourceDir);
    for (const file of files) {
      const src = path.join(sourceDir, file);
      const dest = path.join(targetDir, file);
      if (fs.statSync(src).isFile() && !fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
      }
    }
  } catch (e) {
    console.warn(`File migration note (${sourceDir} -> ${targetDir}):`, e);
  }
}

// Ensure all existing settings and backups from previous locations are safely preserved in backupsDir
copyMissingFiles(legacyBackupsDir, backupsDir);
copyMissingFiles(distBackupsDir, backupsDir);

// Ensure all existing uploads from previous locations are safely preserved in uploadsDir
copyMissingFiles(legacyPublicUploadsDir, uploadsDir);
copyMissingFiles(distUploadsDir, uploadsDir);

// Serve uploaded files and public assets statically (NOTE: backups is NOT statically served for security)
app.use('/uploads', express.static(uploadsDir, {
  dotfiles: 'ignore',
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));

// Fallback serve legacy uploads locations if present
[legacyPublicUploadsDir, distUploadsDir].forEach((dirPath) => {
  if (dirPath !== uploadsDir && fs.existsSync(dirPath)) {
    app.use('/uploads', express.static(dirPath, {
      dotfiles: 'ignore',
      setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
    }));
  }
});

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

// Admin Authorization Middleware (strictly validated against server settings)
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers['x-admin-token'] as string;
  const pin = req.headers['x-admin-pin'] as string;

  // 1. Check active session token registered in memory
  if (token && isValidAdminToken(token)) {
    return next();
  }

  // 2. Direct pin fallback with strict normalization against server's active PIN
  const currentAdminPin = (settingsData?.adminPin || '1404').toString().replace(/[۰-۹]/g, (d: string) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48)).trim();
  const cleanedHeaderPin = pin ? pin.toString().replace(/[۰-۹]/g, (d: string) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48)).trim() : '';

  if (cleanedHeaderPin && cleanedHeaderPin === currentAdminPin) {
    return next();
  }

  return res.status(401).json({
    success: false,
    error: 'دسترسی غیرمجاز: نشست مدیریت نامعتبر یا منقضی شده است'
  });
}

// Persistent File Paths
const rsvpsFilePath = path.join(backupsDir, 'rsvps_store.json');
const guestbookFilePath = path.join(backupsDir, 'guestbook_store.json');
const photoLikesFilePath = path.join(backupsDir, 'photo_likes_store.json');
const guestbookReactionsFilePath = path.join(backupsDir, 'guestbook_reactions_store.json');
const settingsFilePath = path.join(backupsDir, 'settings_store.json');
const visitsFilePath = path.join(backupsDir, 'visits_store.json');

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
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    likes: 14,
    flowers: 10,
    esfand: 18
  },
  {
    id: 'gb-2',
    author: 'دکتر محمدرضا شایان و بانو',
    message: 'با آرزوی بهترین‌ها در آغاز این فصل شکوهمند از زندگی مشترک. مشتاقانه در کنارتان خواهیم بود.',
    date: 'دیروز',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    likes: 9,
    flowers: 15,
    esfand: 8
  },
  {
    id: 'gb-3',
    author: 'مریم و سامان (دوستان صمیمی)',
    message: 'چقدر این کارت قشنگ و رویاییه! مبارک باشه رفقای نازنین، حسابی منتظر جشن و پایکوبی هستیم!',
    date: 'امروز',
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    likes: 21,
    flowers: 24,
    esfand: 29
  }
];

const initialSettingsSeed = {
  id: 'wedding-nahid-alireza',
  brideName: 'ناهید',
  groomName: 'علیرضا',
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
    year: '۱۴۰۵',
    month: 'شهریور',
    day: '۱۰',
    dayOfWeek: 'سه‌شنبه'
  },
  gregorianDate: '2026-09-01T18:00:00',
  gregorianDateText: 'مصادف با ۱ سپتامبر ۲۰۲۶',
  eventTime: '۱۸:۰۰ الی ۲۳:۰۰',
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
      time: '۱۸:۰۰',
      title: 'آغاز مراسم و پذیرایی اولیه',
      description: 'گردهمایی مهمانان و نوشیدنی خوش‌آمدگویی',
      icon: 'door'
    },
    {
      id: 't-2',
      time: '۱۹:۰۰',
      title: 'ورود عروس و داماد',
      description: 'ثبت زیباترین لحظه‌ها و آغاز جشن',
      icon: 'sparkles'
    },
    {
      id: 't-3',
      time: '۲۲:۰۰',
      title: 'سرو شام',
      description: 'پذیرایی شام در کنار یکدیگر',
      icon: 'utensils'
    },
    {
      id: 't-4',
      time: '۲۳:۰۰',
      title: 'پایان خاطره‌انگیز شب',
      description: 'بدرقه و قدردانی از حضور گرم شما',
      icon: 'heart'
    }
  ],
  waxSeal: {
    color: 'gold',
    monogram: 'N & A',
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
    deadlineDate: 'تا ۱۰ شهریور ۱۴۰۵',
    maxGuestsPerParty: 6,
    showDietaryOptions: true,
    allowSongRequest: true,
    requirePhone: false
  },
  envelopeOpenBtnTop: true,
  envelopeOpenBtnBottom: true,
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
      year: '۱۴۰۵',
      date: 'شهریور ۱۴۰۵',
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
    cardHolder: 'ناهید و علیرضا',
    cardNumber: '5022-2910-8472-6319',
    ibanNumber: 'IR640570029180012345678001'
  },
  faqs: [
    {
      id: 'faq-1',
      question: 'آیا امکان همراهی کودکان وجود دارد؟',
      answer: 'بله، قطعاً! حضور فرشته‌های کوچک و خنده‌هایشان، شادی جشن ما را چند برابر می‌کند.'
    },
    {
      id: 'faq-2',
      question: 'آیا مراسم تم لباس یا رنگ پوشش خاصی دارد؟',
      answer: 'خیر، هیچ محدودیت رنگی یا تم خاصی وجود ندارد؛ با هر پوششی که در آن احساس راحتی، شادابی و زیبایی می‌کنید حضور پیدا کنید.'
    },
    {
      id: 'faq-3',
      question: 'در مورد عکاسی و فیلمبرداری چه نکاتی را باید رعایت کنیم؟',
      answer: 'هیچ محدودیتی برای ثبت خاطرات شیرینتان وجود ندارد! خوشحال می‌شویم لحظات قشنگی که با گوشی‌هایتان ثبت می‌کنید را برایمان یادگاری بفرستید.'
    },
    {
      id: 'faq-4',
      question: 'تا چه زمانی می‌توانیم حضورمان را تغییر دهیم؟',
      answer: 'لطفاً تا قبل از ۱۰ شهریور وضعیت نهایی‌تان را ثبت یا ویرایش کنید تا برنامه‌ریزی تالار با دقت انجام شود.'
    }
  ],
  footerNote: '«آمدن شما، عید ماست...\nمشتاق دیدار و رقصیدن با شما در شبی فراموش‌نشدنی!»'
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

interface VisitsData {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  todayDate: string;
  lastVisitAt: string;
  visitedSessions: string[];
  history: { date: string; count: number }[];
}

const initialVisitsSeed: VisitsData = {
  totalVisits: 142,
  uniqueVisitors: 88,
  todayVisits: 12,
  todayDate: new Date().toISOString().slice(0, 10),
  lastVisitAt: new Date().toISOString(),
  visitedSessions: [],
  history: []
};

function cleanWeddingSettings(raw: any): any {
  if (!raw || typeof raw !== 'object' || Object.keys(raw).length === 0) {
    return { ...initialSettingsSeed };
  }
  
  // Recursively unwrap nested weddingData if present (prevents file nesting / bloat across multiple backups)
  let src = { ...raw };
  while (src.weddingData && typeof src.weddingData === 'object' && Object.keys(src.weddingData).length > 0) {
    src = { ...src.weddingData };
  }

  // Explicitly remove backup envelope / collections / metadata fields so settings store only contains settings
  const forbiddenKeys = [
    'weddingData',
    'rsvps',
    'rsvpList',
    'rsvpsList',
    'guestbook',
    'guestbookList',
    'comments',
    'notes',
    'photoLikes',
    'guestbookReactions',
    'visits',
    'visitStats',
    'visitsData',
    'stats',
    'version',
    'exportDate',
    'backupDate',
    'appName',
    'reason'
  ];

  for (const k of forbiddenKeys) {
    delete src[k];
  }

  return { ...initialSettingsSeed, ...src };
}

let rsvpList = loadRSVPs();
let guestbookList = loadGuestbook();
let settingsData = loadSettings();
let photoLikesData = loadPhotoLikes();
let guestbookReactionsData = loadGuestbookReactions();
let visitsData: VisitsData = loadVisits();

function saveSettingsToFile(settingsObj: any) {
  try {
    const cleaned = cleanWeddingSettings(settingsObj);
    const dir = path.dirname(settingsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(settingsFilePath, JSON.stringify(cleaned, null, 2), 'utf-8');
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
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        const cleaned = cleanWeddingSettings(parsed);
        return { ...initialSettingsSeed, ...cleaned };
      }
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

function saveVisitsToFile(dataObj: VisitsData) {
  try {
    const dir = path.dirname(visitsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Cap visitedSessions array to latest 5000 entries to prevent memory bloat
    if (dataObj.visitedSessions && dataObj.visitedSessions.length > 5000) {
      dataObj.visitedSessions = dataObj.visitedSessions.slice(-5000);
    }
    fs.writeFileSync(visitsFilePath, JSON.stringify(dataObj, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving visits to disk:', err);
  }
}

function saveVisits() {
  saveVisitsToFile(visitsData);
}

function loadVisits(): VisitsData {
  try {
    if (fs.existsSync(visitsFilePath)) {
      const data = fs.readFileSync(visitsFilePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        return {
          totalVisits: Number(parsed.totalVisits) || 0,
          uniqueVisitors: Number(parsed.uniqueVisitors) || 0,
          todayVisits: Number(parsed.todayVisits) || 0,
          todayDate: parsed.todayDate || new Date().toISOString().slice(0, 10),
          lastVisitAt: parsed.lastVisitAt || new Date().toISOString(),
          visitedSessions: Array.isArray(parsed.visitedSessions) ? parsed.visitedSessions : [],
          history: Array.isArray(parsed.history) ? parsed.history : []
        };
      }
    }
  } catch (err) {
    console.error('Error reading visits from disk:', err);
  }
  const initial = { ...initialVisitsSeed };
  saveVisitsToFile(initial);
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

  if (cleanedEnteredPin === cleanedTargetPin) {
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

app.get('/api/admin/verify-session', (req, res) => {
  const token = req.headers['x-admin-token'] as string;
  const pin = req.headers['x-admin-pin'] as string;
  const currentAdminPin = (settingsData?.adminPin || '1404').toString().replace(/[۰-۹]/g, (d: string) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48)).trim();
  const cleanedHeaderPin = pin ? pin.toString().replace(/[۰-۹]/g, (d: string) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48)).trim() : '';

  if (token && isValidAdminToken(token)) {
    return res.json({ success: true, valid: true });
  }

  if (cleanedHeaderPin && cleanedHeaderPin === currentAdminPin) {
    const newToken = createAdminSession();
    return res.json({ success: true, valid: true, token: newToken });
  }

  return res.status(401).json({
    success: false,
    valid: false,
    error: 'نشست مدیریت نامعتبر یا منقضی شده است'
  });
});

app.post('/api/admin/change-password', (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    const token = req.headers['x-admin-token'] as string;
    const headerPin = req.headers['x-admin-pin'] as string;
    const isAdminByToken = isValidAdminToken(token);

    const currentAdminPin = (settingsData?.adminPin || '1404').toString().replace(/[۰-۹]/g, (d: string) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48)).trim();
    const cleanedCurrent = currentPin ? currentPin.toString().replace(/[۰-۹]/g, (d: string) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48)).trim() : '';
    const cleanedHeaderPin = headerPin ? headerPin.toString().replace(/[۰-۹]/g, (d: string) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48)).trim() : '';
    const cleanedNew = newPin ? newPin.toString().replace(/[۰-۹]/g, (d: string) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48)).trim() : '';

    if (!cleanedNew || cleanedNew.length < 4) {
      return res.status(400).json({ success: false, error: 'رمز عبور جدید باید حداقل دارای ۴ رقم یا کاراکتر باشد' });
    }

    const isCurrentValid = (cleanedCurrent && cleanedCurrent === currentAdminPin) || (cleanedHeaderPin && cleanedHeaderPin === currentAdminPin) || isAdminByToken;

    if (!isCurrentValid) {
      return res.status(401).json({ success: false, error: 'رمز عبور فعلی مدیریت نادرست است' });
    }

    // Invalidate all existing admin sessions immediately
    adminSessions.clear();

    // Update in settingsData and persist to disk
    settingsData.adminPin = cleanedNew;
    saveSettings();
    const newToken = createAdminSession();
    broadcastSSE('SETTINGS_UPDATED', { ...settingsData, adminPin: undefined });

    return res.json({
      success: true,
      message: 'رمز عبور مدیریت با موفقیت به‌روزرسانی شد',
      token: newToken,
      newPin: cleanedNew
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'خطا در تغییر رمز عبور مدیریت' });
  }
});

// ==========================================
// Site Visits Counter & Analytics (Admin-Only Visibility)
// ==========================================

// Track public site visit (called on website load)
app.post('/api/visits/track', (req, res) => {
  try {
    const ip = getClientIp(req);
    // Rate limit: max 40 visit recordings per minute per IP to prevent spamming
    const rateCheck = checkRateLimit(ip, 'visit_track', 40, 60 * 1000);
    if (!rateCheck.allowed) {
      return res.status(200).json({ success: true, tracked: false, reason: 'rate_limited' });
    }

    const rawSessionId = req.body?.sessionId;
    const sessionId = typeof rawSessionId === 'string' && rawSessionId.trim()
      ? sanitize(rawSessionId, 100)
      : crypto.createHash('md5').update(`${ip}_${req.headers['user-agent'] || ''}`).digest('hex');

    const todayStr = new Date().toISOString().slice(0, 10);
    if (visitsData.todayDate !== todayStr) {
      if (visitsData.todayDate) {
        if (!visitsData.history) visitsData.history = [];
        visitsData.history.unshift({ date: visitsData.todayDate, count: visitsData.todayVisits || 0 });
        if (visitsData.history.length > 30) visitsData.history = visitsData.history.slice(0, 30);
      }
      visitsData.todayDate = todayStr;
      visitsData.todayVisits = 0;
    }

    visitsData.totalVisits = (visitsData.totalVisits || 0) + 1;
    visitsData.todayVisits = (visitsData.todayVisits || 0) + 1;
    visitsData.lastVisitAt = new Date().toISOString();

    if (!visitsData.visitedSessions) visitsData.visitedSessions = [];
    if (!visitsData.visitedSessions.includes(sessionId)) {
      visitsData.visitedSessions.push(sessionId);
      visitsData.uniqueVisitors = (visitsData.uniqueVisitors || 0) + 1;
    }

    saveVisits();

    // Broadcast real-time update to authenticated admin dashboards
    broadcastSSE('VISITS_UPDATED', {
      totalVisits: visitsData.totalVisits,
      uniqueVisitors: visitsData.uniqueVisitors,
      todayVisits: visitsData.todayVisits,
      lastVisitAt: visitsData.lastVisitAt
    });

    // Strictly DO NOT send count back in public response to preserve admin-only privacy
    return res.json({ success: true, tracked: true });
  } catch (err) {
    console.error('Error tracking visit:', err);
    return res.status(200).json({ success: true, tracked: false });
  }
});

// Admin-only: Get complete visit statistics
app.get('/api/visits/stats', requireAdminAuth, (req, res) => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (visitsData.todayDate !== todayStr) {
      if (visitsData.todayDate) {
        if (!visitsData.history) visitsData.history = [];
        visitsData.history.unshift({ date: visitsData.todayDate, count: visitsData.todayVisits || 0 });
        if (visitsData.history.length > 30) visitsData.history = visitsData.history.slice(0, 30);
      }
      visitsData.todayDate = todayStr;
      visitsData.todayVisits = 0;
      saveVisits();
    }

    const historyList = Array.isArray(visitsData.history) ? visitsData.history : [];
    const historyObj: Record<string, number> = {};
    historyList.forEach((h) => {
      if (h && h.date) {
        historyObj[h.date] = h.count || 0;
      }
    });
    if (visitsData.todayDate) {
      historyObj[visitsData.todayDate] = (historyObj[visitsData.todayDate] || 0) + (visitsData.todayVisits || 0);
    }

    res.json({
      success: true,
      data: {
        totalVisits: visitsData.totalVisits,
        uniqueVisitors: visitsData.uniqueVisitors,
        todayVisits: visitsData.todayVisits,
        todayDate: visitsData.todayDate,
        lastVisitAt: visitsData.lastVisitAt,
        history: historyList,
        dailyHistory: historyObj
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'خطا در دریافت آمار بازدید سایت' });
  }
});

// Admin-only: Reset or customize visit counter
app.post('/api/visits/reset', requireAdminAuth, (req, res) => {
  try {
    const rawVal = req.body?.totalVisits ?? req.body?.count;
    const newTotal = typeof rawVal === 'number' ? Math.max(0, rawVal) : 0;
    visitsData = {
      totalVisits: newTotal,
      uniqueVisitors: Math.min(newTotal, visitsData.uniqueVisitors || 0),
      todayVisits: Math.min(newTotal, visitsData.todayVisits || 0),
      todayDate: new Date().toISOString().slice(0, 10),
      lastVisitAt: new Date().toISOString(),
      visitedSessions: [],
      history: []
    };
    saveVisits();
    broadcastSSE('VISITS_UPDATED', {
      totalVisits: visitsData.totalVisits,
      uniqueVisitors: visitsData.uniqueVisitors,
      todayVisits: visitsData.todayVisits,
      lastVisitAt: visitsData.lastVisitAt
    });
    res.json({
      success: true,
      message: 'آمار بازدید با موفقیت بازنشانی شد',
      data: {
        totalVisits: visitsData.totalVisits,
        uniqueVisitors: visitsData.uniqueVisitors,
        todayVisits: visitsData.todayVisits,
        todayDate: visitsData.todayDate,
        lastVisitAt: visitsData.lastVisitAt,
        history: [],
        dailyHistory: { [visitsData.todayDate]: visitsData.todayVisits }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'خطا در بازنشانی آمار بازدید' });
  }
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
    const cleanUpdated = cleanWeddingSettings(updated);
    settingsData = { ...settingsData, ...cleanUpdated };
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

  const now = new Date();
  const newEntry = {
    id: `gb-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    author,
    message,
    date: 'لحظاتی پیش',
    createdAt: now.toISOString(),
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
// Server Backup & Export Endpoints (Admin Protected)
// ==========================================

function buildUnifiedBackupPayload(rawWeddingData?: any, reason = 'Admin Backup') {
  const baseSettings = (rawWeddingData && typeof rawWeddingData === 'object' && Object.keys(rawWeddingData).length > 0)
    ? rawWeddingData
    : settingsData;

  const cleanSettings = cleanWeddingSettings(baseSettings);

  const currentRsvps = Array.isArray(rsvpList) ? rsvpList : loadRSVPs();
  const currentGuestbook = Array.isArray(guestbookList) ? guestbookList : loadGuestbook();
  const currentPhotoLikes = photoLikesData || loadPhotoLikes();
  const currentVisits = visitsData || loadVisits();

  return {
    version: '2.0',
    exportDate: new Date().toISOString(),
    appName: 'wedding-card-studio',
    reason,
    stats: {
      totalRsvps: currentRsvps.length,
      totalGuestbook: currentGuestbook.length,
      totalVisits: currentVisits.totalVisits || 0,
      uniqueVisitors: currentVisits.uniqueVisitors || 0
    },
    weddingData: cleanSettings,
    rsvps: currentRsvps,
    guestbook: currentGuestbook,
    photoLikes: currentPhotoLikes,
    visits: currentVisits
  };
}

app.post('/api/backup', requireAdminAuth, (req, res) => {
  try {
    const { formData, reason } = req.body;
    const backupContent = buildUnifiedBackupPayload(formData, reason || 'Admin Backup');

    const timeStamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `wedding-backup-${timeStamp}.json`;
    const filePath = path.join(backupsDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backupContent, null, 2), 'utf-8');

    const latestPath = path.join(backupsDir, 'wedding-backup-latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(backupContent, null, 2), 'utf-8');

    res.json({
      success: true,
      message: 'نسخه پشتیبان با موفقیت در سرور ذخیره شد',
      fileName,
      totalRsvps: rsvpList.length,
      totalGuestbook: guestbookList.length,
      data: backupContent
    });
  } catch (error) {
    console.error('Error creating server backup:', error);
    res.status(500).json({ success: false, error: 'خطا در ذخیره نسخه پشتیبان در سرور' });
  }
});

// Full unified export endpoints (both GET and POST supported)
app.post('/api/backup/export', requireAdminAuth, (req, res) => {
  try {
    const { formData } = req.body;
    const fullBackup = buildUnifiedBackupPayload(formData, 'Admin Export');

    // Also auto-save a snapshot file in server backupsDir
    try {
      const timeStamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `wedding-backup-${timeStamp}.json`;
      fs.writeFileSync(path.join(backupsDir, fileName), JSON.stringify(fullBackup, null, 2), 'utf-8');
      fs.writeFileSync(path.join(backupsDir, 'wedding-backup-latest.json'), JSON.stringify(fullBackup, null, 2), 'utf-8');
    } catch (saveErr) {
      console.warn('Could not auto-snapshot backup file to disk:', saveErr);
    }

    res.json({ success: true, data: fullBackup });
  } catch (err) {
    res.status(500).json({ success: false, error: 'خطا در دریافت پشتیبان کامل' });
  }
});

app.get('/api/backup/full-export', requireAdminAuth, (req, res) => {
  try {
    const fullBackup = buildUnifiedBackupPayload(settingsData, 'Full Export');
    res.json({ success: true, data: fullBackup });
  } catch (err) {
    res.status(500).json({ success: false, error: 'خطا در دریافت پشتیبان کامل' });
  }
});

// Full restore endpoint for settings, RSVPs, and guestbook comments/notes
app.post('/api/backup/restore', requireAdminAuth, (req, res) => {
  try {
    const { weddingData, rsvps, guestbook, photoLikes, restoreOptions } = req.body;
    let restoredSettings = false;
    let restoredRsvpsCount = 0;
    let restoredGuestbookCount = 0;

    // 1. Restore Wedding Settings if provided
    if (weddingData && typeof weddingData === 'object' && restoreOptions?.weddingSettings !== false) {
      const clean = cleanWeddingSettings(weddingData);
      settingsData = { ...settingsData, ...clean };
      saveSettings();
      broadcastSSE('SETTINGS_UPDATED', settingsData);
      restoredSettings = true;
    }

    // 2. Restore RSVPs if provided
    const rawRsvps = Array.isArray(rsvps) ? rsvps : Array.isArray(req.body.rsvpList) ? req.body.rsvpList : null;
    if (rawRsvps && restoreOptions?.rsvps !== false) {
      const sanitizedList = rawRsvps.map((r: any, idx: number) => ({
        id: r.id ? sanitize(String(r.id), 80) : `rsvp-restored-${Date.now()}-${idx}`,
        guestName: sanitize(String(r.guestName || 'مهمان گرامی'), 100),
        phone: r.phone ? sanitize(String(r.phone), 30) : '',
        attending: r.attending === 'no' ? 'no' : 'yes',
        guestCount: Math.min(Math.max(Number(r.guestCount) || 1, 1), 50),
        dietaryNotes: r.dietaryNotes ? sanitize(String(r.dietaryNotes), 200) : '',
        message: r.message ? sanitize(String(r.message), 500) : '',
        songRequest: r.songRequest ? sanitize(String(r.songRequest), 200) : '',
        submittedAt: r.submittedAt || new Date().toISOString()
      })).filter((r) => r.guestName);

      rsvpList = sanitizedList;
      saveRSVPs();
      broadcastSSE('RSVP_UPDATED', { list: rsvpList, totalCount: rsvpList.length });
      restoredRsvpsCount = rsvpList.length;
    }

    // 3. Restore Guestbook comments & notes if provided
    const rawGuestbook = Array.isArray(guestbook)
      ? guestbook
      : Array.isArray(req.body.guestbookList)
      ? req.body.guestbookList
      : Array.isArray(req.body.comments)
      ? req.body.comments
      : Array.isArray(req.body.notes)
      ? req.body.notes
      : null;

    if (rawGuestbook && restoreOptions?.guestbook !== false) {
      const sanitizedList = rawGuestbook.map((g: any, idx: number) => ({
        id: g.id ? sanitize(String(g.id), 80) : `gb-restored-${Date.now()}-${idx}`,
        author: sanitize(String(g.author || 'مهمان گرامی'), 80),
        message: sanitize(String(g.message || ''), 600),
        date: g.date ? sanitize(String(g.date), 50) : 'لحظاتی پیش',
        createdAt: g.createdAt || new Date().toISOString(),
        likes: Number(g.likes) || 0,
        flowers: Number(g.flowers) || 0,
        esfand: Number(g.esfand) || 0
      })).filter((g) => g.message && g.author);

      guestbookList = sanitizedList;
      saveGuestbook();
      broadcastSSE('GUESTBOOK_RESET', guestbookList);
      restoredGuestbookCount = guestbookList.length;
    }

    // 4. Optionally restore photo likes if present
    if (photoLikes && typeof photoLikes === 'object' && photoLikes.counts) {
      photoLikesData = {
        counts: photoLikes.counts || {},
        likedBy: photoLikes.likedBy || {}
      };
      savePhotoLikes();
      broadcastSSE('PHOTO_LIKES_UPDATED', { counts: photoLikesData.counts });
    }

    // 5. Optionally restore visits counter if present
    const rawVisits = req.body?.visits;
    if (rawVisits && typeof rawVisits === 'object' && restoreOptions?.visits !== false) {
      visitsData = {
        totalVisits: Number(rawVisits.totalVisits) || visitsData.totalVisits || 0,
        uniqueVisitors: Number(rawVisits.uniqueVisitors) || visitsData.uniqueVisitors || 0,
        todayVisits: Number(rawVisits.todayVisits) || 0,
        todayDate: rawVisits.todayDate || new Date().toISOString().slice(0, 10),
        lastVisitAt: rawVisits.lastVisitAt || new Date().toISOString(),
        visitedSessions: Array.isArray(rawVisits.visitedSessions) ? rawVisits.visitedSessions : [],
        history: Array.isArray(rawVisits.history) ? rawVisits.history : []
      };
      saveVisits();
      broadcastSSE('VISITS_UPDATED', {
        totalVisits: visitsData.totalVisits,
        uniqueVisitors: visitsData.uniqueVisitors,
        todayVisits: visitsData.todayVisits,
        lastVisitAt: visitsData.lastVisitAt
      });
    }

    res.json({
      success: true,
      message: 'بازیابی اطلاعات با موفقیت انجام شد',
      restoredSettings,
      restoredRsvpsCount,
      restoredGuestbookCount,
      totalRsvps: rsvpList.length,
      totalGuestbook: guestbookList.length,
      totalVisits: visitsData.totalVisits,
      data: {
        settings: settingsData,
        rsvps: rsvpList,
        guestbook: guestbookList,
        visits: visitsData
      }
    });
  } catch (error) {
    console.error('Error during backup restore:', error);
    res.status(500).json({ success: false, error: 'خطا در بازیابی نسخه پشتیبان روی سرور' });
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
