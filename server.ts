import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Security Middlewares & Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// High body limit for base64 audio and image uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

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

// Serve uploaded files and public assets statically
app.use('/uploads', express.static(uploadsDir));
app.use('/public', express.static(publicDir));
app.use('/backups', express.static(backupsDir));

// Input sanitization helper for backend
function sanitize(input: any, maxLen = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/onload|onerror|onclick|onmouseover/gi, '')
    .trim()
    .slice(0, maxLen);
}

const rsvpsFilePath = path.join(backupsDir, 'rsvps_store.json');
const guestbookFilePath = path.join(backupsDir, 'guestbook_store.json');

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

// Persistent store for RSVPs and Guestbook
const settingsFilePath = path.join(backupsDir, 'settings_store.json');

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
    ribbonStyle: 'gold_cross',
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

let rsvpList = loadRSVPs();
let guestbookList = loadGuestbook();
let settingsData = loadSettings();

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

// Lazy Google Gen AI helper
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

// Wedding settings endpoints
app.get('/api/settings', (req, res) => {
  try {
    res.json({ success: true, data: settingsData });
  } catch (err) {
    res.status(500).json({ success: false, error: 'خطا در دریافت تنظیمات کارت دعوت' });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const updated = req.body;
    if (!updated || typeof updated !== 'object') {
      return res.status(400).json({ success: false, error: 'اطلاعات ارسالی نامعتبر است' });
    }
    settingsData = { ...settingsData, ...updated };
    saveSettings();
    res.json({ success: true, data: settingsData });
  } catch (err) {
    res.status(500).json({ success: false, error: 'خطا در ذخیره‌سازی تنظیمات کارت دعوت' });
  }
});

// Allowed file extensions and MIME types for secure uploads
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/heic',
  'image/heif',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/ogg',
  'audio/vorbis',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
  'audio/aac',
  'audio/x-aac',
  'audio/webm',
  'audio/flac',
  'audio/x-flac',
  'audio/3gpp',
  'audio/3gpp2',
  'application/octet-stream'
]);

const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'heic', 'heif',
  'mp3', 'wav', 'ogg', 'm4a', 'aac', 'webm', 'flac', '3gp'
]);

// Secure File Upload Endpoint
app.post('/api/upload', (req, res) => {
  try {
    const { fileData, fileName } = req.body;
    if (!fileData || typeof fileData !== 'string') {
      return res.status(400).json({ success: false, error: 'فایلی ارسال نشده است' });
    }

    // Extract base64 payload & MIME type reliably without regular expression limitations
    let buffer: Buffer;
    let mime = '';
    let extension = '';

    if (fileData.startsWith('data:') && fileData.includes(';base64,')) {
      const parts = fileData.split(';base64,');
      const header = parts[0]; // e.g. "data:image/png"
      mime = header.substring(5).toLowerCase(); // remove "data:"
      const base64Content = parts.slice(1).join(';base64,');
      buffer = Buffer.from(base64Content, 'base64');
    } else {
      buffer = Buffer.from(fileData, 'base64');
    }

    // File size constraint: max 50MB
    if (buffer.length > 50 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'حجم فایل بیش از حد مجاز (حداکثر ۵۰ مگابایت) است' });
    }

    // Extract extension safely from filename first if available
    if (fileName && typeof fileName === 'string') {
      const sanitizedName = path.basename(fileName);
      const ext = sanitizedName.split('.').pop()?.toLowerCase();
      if (ext && ALLOWED_EXTENSIONS.has(ext)) {
        extension = ext;
      }
    }

    // Fallback to MIME if extension not found
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

    // Prevent Path Traversal by generating a secure random filename
    const uniqueName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`;
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
        poemVerse1: 'در ضмир ما نمی‌گنجد به غیر از دوست کس',
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

// RSVP Endpoints with Sanitization
app.get('/api/rsvp', (req, res) => {
  res.json({ success: true, data: rsvpList });
});

app.post('/api/rsvp', (req, res) => {
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
    id: `rsvp-${Date.now()}`,
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
  res.json({ success: true, data: newRsvp });
});

// Delete single RSVP item
app.delete('/api/rsvp/:id', (req, res) => {
  const { id } = req.params;
  const decodedId = decodeURIComponent(id);
  rsvpList = rsvpList.filter((r) => r.id !== id && r.id !== decodedId);
  saveRSVPs();
  res.json({ success: true, message: 'تاییدیه حضور مورد نظر با موفقیت حذف شد' });
});

app.post('/api/rsvp/:id/delete', (req, res) => {
  const { id } = req.params;
  const decodedId = decodeURIComponent(id);
  rsvpList = rsvpList.filter((r) => r.id !== id && r.id !== decodedId);
  saveRSVPs();
  res.json({ success: true, message: 'تاییدیه حضور مورد نظر با موفقیت حذف شد' });
});

// Delete / Clear all RSVPs
app.delete('/api/rsvp', (req, res) => {
  rsvpList = [];
  saveRSVPs();
  res.json({ success: true, message: 'تمام تاییده‌های حضور با موفقیت حذف شدند' });
});

app.post('/api/rsvp/reset', (req, res) => {
  const mode = req.query.mode || req.body?.mode;
  if (mode === 'seed' || mode === 'reseed') {
    rsvpList = [...initialRsvpsSeed];
  } else {
    rsvpList = [];
  }
  saveRSVPs();
  res.json({ success: true, message: 'تاییده‌های حضور با موفقیت بروزرسانی شد', data: rsvpList });
});

// Guestbook Endpoints with Sanitization
app.get('/api/guestbook', (req, res) => {
  res.json({ success: true, data: guestbookList });
});

app.post('/api/guestbook', (req, res) => {
  const author = sanitize(req.body.author, 80);
  const message = sanitize(req.body.message, 600);

  if (!author || !message) {
    return res.status(400).json({ success: false, error: 'نام و پیام یادبود الزامی است' });
  }

  const newEntry = {
    id: `gb-${Date.now()}`,
    author,
    message,
    date: 'لحظاتی پیش',
    likes: 1,
    flowers: 1,
    esfand: 1
  };

  guestbookList.unshift(newEntry);
  saveGuestbook();
  res.json({ success: true, data: newEntry });
});

// Delete single Guestbook entry
app.delete('/api/guestbook/:id', (req, res) => {
  const { id } = req.params;
  const decodedId = decodeURIComponent(id);
  guestbookList = guestbookList.filter((g) => g.id !== id && g.id !== decodedId);
  saveGuestbook();
  res.json({ success: true, message: 'پیام یادبود مورد نظر با موفقیت حذف شد' });
});

app.post('/api/guestbook/:id/delete', (req, res) => {
  const { id } = req.params;
  const decodedId = decodeURIComponent(id);
  guestbookList = guestbookList.filter((g) => g.id !== id && g.id !== decodedId);
  saveGuestbook();
  res.json({ success: true, message: 'پیام یادبود مورد نظر با موفقیت حذف شد' });
});

// Delete / Clear all Guestbook entries
app.delete('/api/guestbook', (req, res) => {
  guestbookList = [];
  saveGuestbook();
  res.json({ success: true, message: 'تمام پیام‌های یادبود و نظرات با موفقیت حذف شدند' });
});

app.post('/api/guestbook/reset', (req, res) => {
  const mode = req.query.mode || req.body?.mode;
  if (mode === 'seed' || mode === 'reseed') {
    guestbookList = [...initialGuestbookSeed];
  } else {
    guestbookList = [];
  }
  saveGuestbook();
  res.json({ success: true, message: 'پیام‌های یادبود با موفقیت بروزرسانی شد', data: guestbookList });
});

app.post('/api/guestbook/:id/reaction', (req, res) => {
  const { id } = req.params;
  const { type } = req.body; // 'likes' | 'flowers' | 'esfand'

  const entry = guestbookList.find((g) => g.id === id || g.id === decodeURIComponent(id));
  if (entry) {
    if (type === 'flowers') entry.flowers = (entry.flowers || 0) + 1;
    else if (type === 'esfand') entry.esfand = (entry.esfand || 0) + 1;
    else entry.likes = (entry.likes || 0) + 1;

    saveGuestbook();
    return res.json({ success: true, data: entry });
  }

  res.status(404).json({ success: false, error: 'پیام یافت نشد' });
});

// Server Backup Endpoints
app.post('/api/backup', (req, res) => {
  try {
    const { formData, reason } = req.body;

    const timeStamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `wedding-backup-${timeStamp}.json`;
    const filePath = path.join(backupsDir, fileName);

    const backupContent = {
      backupDate: new Date().toISOString(),
      reason: reason || 'Factory Reset Backup',
      weddingData: formData || null,
      rsvps: rsvpList,
      guestbook: guestbookList
    };

    fs.writeFileSync(filePath, JSON.stringify(backupContent, null, 2), 'utf-8');

    // Also update a latest backup file
    const latestPath = path.join(backupsDir, 'wedding-backup-latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(backupContent, null, 2), 'utf-8');

    res.json({
      success: true,
      message: 'نسخه پشتیبان با موفقیت در سرور ذخیره شد',
      fileName,
      filePath: `/backups/${fileName}`
    });
  } catch (error) {
    console.error('Error creating server backup:', error);
    res.status(500).json({ success: false, error: 'خطا در ذخیره نسخه پشتیبان در سرور' });
  }
});

app.get('/api/backups', (req, res) => {
  try {
    if (!fs.existsSync(backupsDir)) {
      return res.json({ success: true, data: [] });
    }
    const files = fs.readdirSync(backupsDir)
      .filter((file) => file.endsWith('.json'))
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

app.get('/api/backup/download/:fileName', (req, res) => {
  try {
    const fileName = path.basename(req.params.fileName);
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
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wedding Card Server running on http://localhost:${PORT}`);
  });
}

startServer();
