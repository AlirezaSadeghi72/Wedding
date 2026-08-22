# کارت دعوت دیجیتال عروسی | Digital Wedding Invitation & Studio

یک وب‌اپلیکیشن شیک، تعاملی و کاملاً ریسپانسیو برای ساخت، ویرایش و به اشتراک‌گذاری کارت‌های دعوت دیجیتال عروسی با پشتیبانی از تم‌های مختلف، موزیک آنلاین، داستان عشق، فرم حضور و غیاب (RSVP)، و پنل مدیریت با امنیت بالا.

---

## ✨ ویژگی‌های برجسته (Features)

- ✉️ **پاکت دعوت سه‌بعدی و مهروموم موم (Wax Seal):** بازگشایی تعاملی پاکت با مهر انیمیشنی زرق‌وبرق‌دار.
- 📱 **طراحی کاملاً بهینه‌شده برای موبایل (Mobile-First Design):** نمایش بی‌نقص در تمامی نمایشگرهای موبایل و تبلت.
- 📖 **بخش داستان عشق (Love Story Timeline):** ثبت خاطرات و مراحل آشنایی همراه با قابلیت آپلود و انتخاب تصویر برای هر مرحله.
- 🎨 **استودیو و پنل ویرایش اختصاصی (Studio Editor):**
  - شخصی‌سازی رنگ‌ها، تم‌های نوری (روز/شب) و تایپوگرافی (فونت‌های زیبای فارسی و انگلیسی).
  - مدیریت گالری تصاویر و ویدیوهای یادگاری.
  - تنظیم آدرس تالار و مسیریابی روی نقشه (نشان، بلد، گوگل مپ، اسنپ، تپسی).
  - موزیک‌پلیر شناور با قابلیت آپلود موزیک دلخواه.
- 📝 **فرم پاسخ به دعوت (RSVP) و یادگاری مهمانان:** ثبت تعداد همراهان و پیام‌های تبریک مهمانان به صورت زنده.
- 🔐 **پنل مدیریت ایمن (Admin Panel Security):**
  - متمرکزسازی تغییر رمز عبور در زبانه اختصاصی امنیت.
  - سیستم ضد حدس زدن رمز عبور (Anti Brute-Force) با قفل خودکار ۶۰ ثانیه‌ای.
  - پشتیبانی هوشمند از اعداد فارسی و انگلیسی (مثل `1404` و `۱۴۰۴`).

---

## 🛠️ تکنولوژی‌های استفاده‌شده (Tech Stack)

- **Front-end:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide Icons, Canvas Confetti
- **Animations:** Motion (Framer Motion)
- **Backend/Server:** Express.js, Multer (جهت آپلود ایمن فایل)

---

## 🚀 راهنمای نصب و اجرای پروژه (Getting Started)

### پیش‌نیازها
- نصب [Node.js](https://nodejs.org/) (نسخه ۱۸ یا بالاتر)

### مراحل اجرا در محیط توسعه (Local)

1. **مخزن را کلون کنید:**
   ```bash
   git clone https://github.com/your-username/wedding-card.git
   cd wedding-card
   ```

2. **وابستگی‌ها را نصب کنید:**
   ```bash
   npm install
   ```

3. **پروژه را در حالت توسعه اجرا کنید:**
   ```bash
   npm run dev
   ```
   برنامه در آدرس `http://localhost:3000` در دسترس خواهد بود.

---

## 📦 خروجی گرفتن و آپلود روی سرور لینوکس (Linux Server Deployment)

این پروژه شامل یک سرور اختصاصی Express و فرانت‌اند Vite است. برای اجرا روی سرور لینوکس (Ubuntu / Debian / CentOS)، مراحل زیر را دنبال کنید:

### روش اول: اجرای مستقیم با PM2 و Nginx (پیشنهادی)

#### ۱. انتقال فایل‌ها به سرور
فایل‌های پروژه را از طریق `git clone` یا فایل `ZIP` روی سرور لینوکس خود قرار دهید:
```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git wedding-card
cd wedding-card
```

#### ۲. نصب وابستگی‌ها و ساخت خروجی پروداکشن
```bash
# نصب پکیج‌ها
npm install

# ساخت فایل‌های خروجی فرانت‌اند و کامپایل سرور
npm run build
```
با اجرای دستور `npm run build`، فایل‌های فرانت‌اند در پوشه `dist/` قرار گرفته و فایل سرور در `dist/server.cjs` کامپایل می‌شود.

#### ۳. مدیریت پروسه با PM2
برای اینکه برنامه به صورت مداوم و در پس‌زمینه سرور اجرا بماند، از ابزار `pm2` استفاده کنید:
```bash
# نصب PM2 به صورت سراسری (در صورت عدم نصب)
sudo npm install -g pm2

# اجرای پروژه با PM2
pm2 start dist/server.cjs --name "wedding-card"

# ذخیره‌سازی وضعیت PM2 برای اجرا پس از ریستارت سرور
pm2 save
pm2 startup
```

#### ۴. تنظیم ریورس پروکسی Nginx (اختیاری جهت اتصال دامنه و SSL)
فایل کانفیگ جدیدی در Nginx ایجاد کنید:
```bash
sudo nano /etc/nginx/sites-available/wedding-card
```
محتوای زیر را قرار دهید:
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
}
```
فعال‌سازی کانفیگ و ریستارت Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/wedding-card /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### ۵. فعال‌سازی گواهی SSL رایگان (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 🐙 تنظیمات و آپلود در گیت‌هاب (GitHub Repository Setup)

اگر قصد دارید این پروژه را در ریپوزیتوری گیت‌هاب خود آپلود کنید:

1. **یک ریپوزیتوری جدید در گیت‌هاب بسازید** (مثلاً با نام `wedding-card`).
2. **در ترمینال پروژه دستورات زیر را اجرا کنید:**

```bash
# مقداردهی اولیه ریپوزیتوری گیت
git init

# افزودن تمام فایل‌های پروژه (فایل‌های اضافی طبق .gitignore نادیده گرفته می‌شوند)
git add .

# ثبت تغییرات اولیه
git commit -m "Initial commit: Digital Wedding Card & Studio"

# تغییر نام شاخه به main
git branch -M main

# اتصال به ریپوزیتوری گیت‌هاب شما
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# ارسال کدها به گیت‌هاب
git push -u origin main
```

---

## 🗝️ ورود به پنل مدیریت (Admin Panel)

برای ورود به پنل تنظیمات استودیو:
1. روی آیکون **تنظیمات** در گوشه صفحه کلیک کنید.
2. رمز عبور پیش‌فرض: `1404` (یا `۱۴۰۴`) می‌باشد.
3. پس از ورود، می‌توانید از زبانه **«امنیت و رمز عبور»** رمز عبور مدیریت را به رمز دلخواه تغییر دهید.

---

## 📄 لایسنس (License)

این پروژه تحت لایسنس MIT منتشر شده است.
