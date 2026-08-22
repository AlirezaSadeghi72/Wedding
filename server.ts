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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
let rsvpList = loadRSVPs();
let guestbookList = loadGuestbook();

function loadRSVPs() {
  try {
    if (fs.existsSync(rsvpsFilePath)) {
      const data = fs.readFileSync(rsvpsFilePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading rsvps from disk:', err);
  }
  return [...initialRsvpsSeed];
}

function saveRSVPs() {
  try {
    fs.writeFileSync(rsvpsFilePath, JSON.stringify(rsvpList, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving rsvps to disk:', err);
  }
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
  return [...initialGuestbookSeed];
}

function saveGuestbook() {
  try {
    fs.writeFileSync(guestbookFilePath, JSON.stringify(guestbookList, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving guestbook to disk:', err);
  }
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

// Allowed file extensions and MIME types for secure uploads
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/m4a',
  'audio/aac',
  'audio/x-m4a'
]);

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp3', 'wav', 'ogg', 'm4a', 'aac']);

// Secure File Upload Endpoint
app.post('/api/upload', (req, res) => {
  try {
    const { fileData, fileName } = req.body;
    if (!fileData || typeof fileData !== 'string') {
      return res.status(400).json({ success: false, error: 'فایلی ارسال نشده است' });
    }

    // Extract base64 payload & MIME type
    const matches = fileData.match(/^data:([A-Za-z0-9-+/]+);base64,(.+)$/);
    let buffer: Buffer;
    let mime = '';
    let extension = 'jpg';

    if (matches && matches.length === 3) {
      mime = matches[1].toLowerCase();
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(fileData, 'base64');
    }

    // File size constraint: max 25MB
    if (buffer.length > 25 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'حجم فایل بیش از حد مجاز (حداکثر ۲۵ مگابایت) است' });
    }

    // Verify MIME if available
    if (mime && !ALLOWED_MIME_TYPES.has(mime)) {
      return res.status(400).json({ success: false, error: 'نوع فایل ارسالی مجاز نمی‌باشد (فقط تصاویر و قطعات صوتی مجازند)' });
    }

    // Extract extension safely
    if (mime.includes('audio/mp3') || mime.includes('audio/mpeg')) extension = 'mp3';
    else if (mime.includes('audio/wav')) extension = 'wav';
    else if (mime.includes('audio/m4a') || mime.includes('audio/x-m4a') || mime.includes('audio/aac')) extension = 'm4a';
    else if (mime.includes('audio/ogg')) extension = 'ogg';
    else if (mime.includes('image/png')) extension = 'png';
    else if (mime.includes('image/webp')) extension = 'webp';
    else if (mime.includes('image/gif')) extension = 'gif';
    else if (mime.includes('image/jpeg') || mime.includes('image/jpg')) extension = 'jpg';
    else if (fileName && typeof fileName === 'string') {
      const sanitizedName = path.basename(fileName);
      const ext = sanitizedName.split('.').pop()?.toLowerCase();
      if (ext && ALLOWED_EXTENSIONS.has(ext)) {
        extension = ext;
      } else {
        return res.status(400).json({ success: false, error: 'پسوند فایل ارسالی نامعتبر است' });
      }
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
  const phone = sanitize(req.body.phone, 30);
  const attending = req.body.attending === 'no' ? 'no' : 'yes';
  const guestCount = Math.min(Math.max(Number(req.body.guestCount) || 1, 1), 20);
  const dietaryNotes = sanitize(req.body.dietaryNotes, 200);
  const message = sanitize(req.body.message, 500);

  if (!guestName) {
    return res.status(400).json({ success: false, error: 'نام مهمان الزامی است' });
  }

  const newRsvp = {
    id: `rsvp-${Date.now()}`,
    guestName,
    phone,
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
  rsvpList = [];
  saveRSVPs();
  res.json({ success: true, message: 'تمام تاییده‌های حضور با موفقیت حذف شدند' });
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
  guestbookList = [];
  saveGuestbook();
  res.json({ success: true, message: 'تمام پیام‌های یادبود و نظرات با موفقیت حذف شدند' });
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
