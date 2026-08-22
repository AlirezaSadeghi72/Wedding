# 💍 سامانه آنلاین کارت دعوت دیجیتال عروسی (Wedding Digital Invitation)

سامانه‌ای مدرن، لوکس و انعطاف‌پذیر برای ساخت، سفارشی‌سازی و ارسال کارت‌های دعوت دیجیتال عروسی با پاکت متحرک، مهر و موم طرح دو حلقه، پخش موزیک اختصاصی، تایید حضور آنلاین (RSVP)، دفترچه یادبود و مسیریابی هوشمند.

---

## ✨ ویژگی‌های برجسته

- **💌 پاکت متحرک با مهر و موم دو حلقه:** بازگشایی انیمیشنی پاکت با لمس مهر و موم دو حلقه طلایی یا دلخواه.
- **🎨 پلت رنگی شاد و گرم:** دارای ۱۵ تم متناسب با بزم‌های شادی (طلا، رزگلدی، زمردی، یاسی، مرواریدی، شامپاینی و...) بدون تم‌های تاریک یا آزاردهنده چشم.
- **🎵 مدیریت آسان موزیک:** تنظیم عنوان موزیک، آپلود مستقیم فایل صوتی (MP3/WAV) یا قرار دادن لینک مستقیم URL با پخش خودکار.
- **📍 مسیریابی هوشمند:** پشتیبانی کامل از نقشه و اپلیکیشن‌های نشان، بلد، اسنپ، ویز (Waze) و گوگل مپس.
- **💌 تایید حضور (RSVP):** ثبت نام مهمانان، تعداد همراهان، ترجیحات غذایی و پیغام‌های مبارک‌باد.
- **📖 دفترچه یادبود دیجیتال:** امکان ثبت پیام‌های تبریک مهمانان به همراه لایک و ابراز احساسات.
- **⏳ شمارش معکوس و یادآوری تقویم:** شمارش معکوس تا روز عروسی و امکان افزودن رویداد به گوگل تقویم.
- **⚡ پشتیبانی کامل از موبایل و تبلت:** طراحی کاملاً واکنش‌گرا (Responsive) و بهینه‌سازی‌شده برای تمامی نمایشگرها.

---

## 🛠️ پیش‌نیازها

برای اجرا یا استقرار این پروژه، به موارد زیر نیاز دارید:

- **Node.js:** نسخه 18.x یا بالاتر (پیشنهادی: Node 20 LTS)
- **npm:** نسخه 9.x یا بالاتر (همراه با Node نصب می‌شود)
- **Git:** جهت مدیریت نسخه و آپلود روی گیت‌هاب

---

## 🚀 راهنمای اجرای پروژه در محیط توسعه (Local Development)

۱. پروژه را کلون کنید یا فایل‌های آن را در یک پوشه قرار دهید:
   ```bash
   git clone https://github.com/USERNAME/wedding-card.git
   cd wedding-card
   ```

۲. وابستگی‌ها (Dependencies) را نصب کنید:
   ```bash
   npm install
   ```

۳. سرور توسعه را اجرا کنید:
   ```bash
   npm run dev
   ```

۴. مرورگر خود را باز کرده و آدرس زیر را وارد کنید:
   ```
   http://localhost:3000
   ```

---

## 📦 اموزش خروجی گرفتن (Build for Production)

برای گرفتن خروجی نهایی و آماده‌سازی جهت آپلود روی سرور لینوکس:

```bash
npm run build
```

این دستور فرایندهای زیر را به صورت خودکار انجام می‌دهد:
1. **کد فرانت‌اند (React + Vite):** کامپایل شده و در پوشه `dist/` قرار می‌گیرد.
2. **کد بک‌اند (Express):** توسط `esbuild` باندل شده و در فایل تک‌فایلی `dist/server.cjs` ساخته می‌شود.

جهت تست خروجی گرفته‌شده روی سیستم خود:
```bash
npm run start
```

---

## 🐧 راهنمای جامع استقرار و آپلود روی سرور لینوکس (Linux Deployment Guide)

برای اجرای کارت دعوت آنلاین روی سرور لینوکس (مانند Ubuntu / Debian / CentOS)، می‌توانید از روش زیر که رایج‌ترین و مطمئن‌ترین روش است استفاده کنید:

### روش اول: استقرار با PM2 و Nginx (پیشنهاد اصلی)

#### ۱. اتصال به سرور لینوکس و نصب پیش‌نیازها
با SSH به سرور متصل شوید:
```bash
ssh root@YOUR_SERVER_IP
```

نصب Node.js (نسخه 20) و PM2:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git
sudo npm install -y -g pm2
```

#### ۲. انتقال پروژه به سرور
پروژه را از ریپوزیتوری گیت‌هاب کلون کنید یا پوشه پروژه را آپلود نمایید:
```bash
cd /var/www
git clone https://github.com/USERNAME/wedding-card.git
cd wedding-card
```

#### ۳. نصب وابستگی‌ها و بیلد پروژه
```bash
npm install
npm run build
```

#### ۴. اجرای برنامه با PM2
جهت اجرا و زنده نگه‌داشتن برنامه در پس‌زمینه سرور:
```bash
pm2 start dist/server.cjs --name "wedding-card"
pm2 save
pm2 startup
```

با این دستور برنامه روی پورت `3000` سرور شروع به کار می‌کند.

#### ۵. تنظیم Nginx به عنوان Reverse Proxy
فایل پیکربندی Nginx را بسازید:
```bash
sudo nano /etc/nginx/sites-available/wedding-card
```

محتوای زیر را درون آن قرار دهید (دامنه خود را جایگزین کنید):
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    client_max_body_size 50M;
}
```

فعال‌سازی تنظیمات و ریستارت Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/wedding-card /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### ۶. فعال‌سازی HTTPS و گواهی SSL رایگان (Let's Encrypt)
```bash
sudo apt-get install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

تبریک! کارت دعوت دیجیتال شما اکنون با پروتکل امن HTTPS روی دامنه‌تان فعال است.

---

### روش دوم: استقرار با Docker (اختیاری)

اگر ترجیح می‌دهید از داکر استفاده کنید، یک فایل `Dockerfile` با محتوای زیر بسازید:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

سپس بیلد و اجرا کنید:
```bash
docker build -t wedding-card .
docker run -d -p 3000:3000 --name wedding-app wedding-card
```

---

## ⚙️ راهنمای کامل تنظیمات گیت و آپلود در GitHub (Git Configuration Guide)

برای قرار دادن پروژه در مخزن (Repository) گیت‌هاب خود، مراحل زیر را گام‌به‌گام انجام دهید:

### ۱. مقداردهی اولیه‌ گیت (در صورت نیاز)
در ترمینال سیستم خود در پوشه اصلی پروژه وارد کنید:
```bash
git init
```

### ۲. پیکربندی نام و ایمیل در گیت
```bash
git config user.name "نام شما"
git config user.email "your-email@example.com"
```

### ۳. بررسی وضعیت فایل‌ها و افزودن به Staging
```bash
git status
git add .
```

### ۴. ثبت کامیت تغییرات
```bash
git commit -m "Initial commit: Wedding Digital Invitation with Warm Themes and Ring Seal"
```

### ۵. تنظیم شاخه اصلی روی main
```bash
git branch -M main
```

### ۶. اتصال به ریپوزیتوری GitHub
ابتدا یک ریپوزیتوری جدید در [GitHub](https://github.com/new) بسازید (بدون افزودن README اولیه). سپس لینک آن را جایگزین کنید:
```bash
git remote add origin https://github.com/USERNAME/REPOSITORY-NAME.git
```

### ۷. پوش کردن کدها به GitHub
```bash
git push -u origin main
```

اگر بعداً تغییراتی ایجاد کردید، برای به‌روزرسانی در گیت‌هاب کافیست دستورات زیر را بزنید:
```bash
git add .
git commit -m "توضیح تغییرات جدید"
git push
```

---

## 📂 ساختار کلی پوشه‌های پروژه

```
├── dist/                   # پوشه خروجی نهایی بیلد شده
│   ├── index.html
│   ├── server.cjs          # بک‌اند کامپایل‌شده
│   └── assets/             # فایل‌های استاتیک فرانت‌اند
├── src/
│   ├── components/         # کامپوننت‌های رابط کاربری
│   │   ├── WeddingEnvelope.tsx    # پاکت متحرک با مهر دو حلقه
│   │   ├── StudioEditorModal.tsx  # مدال ویرایشگر کارت
│   │   ├── MusicPlayer.tsx        # پخش‌کننده صوتی
│   │   └── ...
│   ├── data/
│   │   ├── themes.ts       # ۱۵ تم رنگی شاد و گرم
│   │   └── defaultWedding.ts
│   ├── types.ts            # تایپ‌های TypeScript
│   └── App.tsx             # کامپوننت اصلی
├── server.ts               # سرور Express و APIها
├── package.json            # اسکریپت‌ها و وابستگی‌ها
├── README.md               # راهنمای کامل پروژه
└── .gitignore              # فایل‌های نادیده‌گرفته‌شده در گیت
```

---

## 💖 پشتیبانی و توسعه

این پروژه آماده نصب، شخصی‌سازی و بهره‌برداری کامل جهت برگزاری جشن‌های عروسی شاد و باشکوه است. در صورت نیاز به توسعه امکانات بیشتر، می‌توانید بخش‌های جدیدی به پوشه `src/components/` اضافه نمایید.
