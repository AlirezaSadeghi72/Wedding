# 💍 سامانه آنلاین کارت دعوت دیجیتال عروسی (Wedding Digital Invitation)

سامانه‌ای مدرن، لوکس و انعطاف‌پذیر برای ساخت، سفارشی‌سازی و ارسال کارت‌های دعوت دیجیتال عروسی با پاکت متحرک، مهر و موم دایره‌ای دو حلقه، پخش موزیک اختصاصی، تایید حضور آنلاین (RSVP)، دفترچه یادبود و مسیریابی هوشمند.

---

## ✨ ویژگی‌های برجسته و آخرین تغییرات

- **💌 پاکت متحرک با مهر دایره‌ای دو حلقه:** بازگشایی انیمیشنی و اصیل پاکت با لمس مهر و موم دایره‌ای کلاسیک با نماد طلایی دو حلقه ازدواج پیوسته.
- **🎨 پلت رنگی شاد و گرم:** دارای ۱۵ تم متناسب با بزم‌های شادی (طلا، رزگلدی، زمردی، یاسی، مرواریدی، شامپاینی و...) بدون تم‌های تاریک یا آزاردهنده چشم.
- **📍 مسیریابی هوشمند سه‌گانه:** پشتیبانی مستقیم و سریع از سه اپلیکیشن اصلی مسیریابی شامل **گوگل مپ (Google Maps)**، **مسیریاب نشان (Neshan)** و **مسیریاب بلد (Balad)**.
- **🎵 مدیریت و پخش موزیک اختصاصی:** تنظیم عنوان موزیک، آپلود مستقیم فایل صوتی یا قرار دادن لینک مستقیم همراه با پیش‌نمایش زنده در استودیو.
- **💌 تایید حضور (RSVP):** ثبت نام مهمانان، تعداد همراهان، ترجیحات غذایی و پیغام‌های مبارک‌باد.
- **📖 دفترچه یادبود دیجیتال:** امکان ثبت پیام‌های تبریک مهمانان به همراه ابراز احساسات و لایک آنلاین.
- **⛅ هواشناسی و اطلاعات جشن:** نمایش وضعیت جوی، دما و بهترین زمان عکاسی (Golden Hour) در روز عروسی.
- **🛠️ استودیو ویرایشگر پیشرفته:** کنترل کامل متن‌ها، عکس‌ها، آدرس‌ها، وضعیت نمایش بخش‌های مختلف و تغییر رمز عبور مدیریت با سینک لحظه‌ای.
- **⚡ پشتیبانی کامل از موبایل و تبلت:** طراحی کاملاً واکنش‌گرا (Responsive) و بهینه‌سازی‌شده برای تمامی نمایشگرها.

---

## 🛠️ پیش‌نیازها

برای اجرا یا استقرار این پروژه، به موارد زیر نیاز دارید:

- **Node.js:** نسخه 18.x یا بالاتر (پیشنهادی: Node.js 20 LTS)
- **npm:** نسخه 9.x یا بالاتر
- **Git:** جهت مدیریت نسخه و آپلود روی گیت‌هاب
- **سرور لینوکس ابونتو (Ubuntu Server):** نسخه 20.04 یا 22.04 یا 24.04 LTS (برای استقرار عملیاتی)

---

## 🚀 راهنمای اجرای پروژه در محیط توسعه (Local Development)

۱. پروژه را کلون کنید یا فایل‌های آن را در یک پوشه قرار دهید:
   ```bash
   git clone https://github.com/AlirezaSadeghi72/Wedding.git
   cd Wedding
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

## 📦 خروجی گرفتن برای پروداکشن (Build for Production)

برای گرفتن خروجی نهایی و آماده‌سازی جهت آپلود روی سرور:

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

---

## 🌐 راهنمای جامع استقرار روی هاست‌های اشتراکی (Shared Hosting Guide - cPanel / DirectAdmin / Plesk)

هاست‌های اشتراکی به دو دسته کلی تقسیم می‌شوند:
1. **هاست‌های اشتراکی دارای پشتیبانی از Node.js (cPanel Setup Node.js App / CloudLinux NodeJS Selector)**: که از تمام امکانات شامل سرور Express، ذخیره پیام‌های RSVP در بک‌اند و آپلود فایل پشتیبانی می‌کنند.
2. **هاست‌های اشتراکی معمولی (صرفاً وب‌سرور PHP/Apache بدون Node.js - استقرار استاتیک)**: که خروجی فرانت‌اند به عنوان سایت ایستا (Static HTML/JS/CSS) بارگذاری می‌شود.

در ادامه مراحل گام به گام هر دو حالت به همراه فایل‌های کانفیگ مورد نیاز توضیح داده شده است:

---

### 🟢 حالت اول: هاست اشتراکی با قابلیت Node.js (cPanel - Setup Node.js App)

اکثر هاستینگ‌های لینوکسی مدرن (دارای cPanel و CloudLinux) ابزار **Setup Node.js App** دارند.

#### گام ۱: بیلد و آماده‌سازی فایل‌ها در کامپیوتر شما
در سیستم خود دستور بیلد را اجرا کنید:
```bash
npm install
npm run build
```
این دستور پوشه `dist/` را می‌سازد که شامل تمام کدهای فرانت‌اند و فایل باندل‌شده بک‌اند `dist/server.cjs` است.

#### گام ۲: ساخت فایل فشرده (ZIP) جهت آپلود روی هاست
فایل‌های زیر را انتخاب کرده و فشرده (ZIP) کنید:
- پوشه `dist` (کامل)
- پوشه `public`
- فایل `package.json`
- فایل `.env.example` یا ساخت فایل `.env` (در صورت نیاز)

*(نکته: پوشه `node_modules` و `src` را داخل فایل زیپ قرار ندهید تا حجم آپلود بسیار کم باشد).*

#### گام ۳: ورود به cPanel و ایجاد برنامه Node.js
1. وارد کنترل‌پنل cPanel هاست خود شوید.
2. در بخش **Software** روی گزینه **Setup Node.js App** کلیک کنید.
3. دکمه **Create Application** را بزنید و فیلدها را به شکل زیر پر کنید:
   - **Node.js Version:** نسخه `18.x` یا `20.x` را انتخاب کنید.
   - **Application Mode:** روی حالت `Production` قرار دهید.
   - **Application Root:** مسیر پوشه برنامه (مثلاً `wedding` یا `public_html`).
   - **Application URL:** دامنه یا ساب‌دامنه‌ای که می‌خواهید کارت روی آن باز شود (مثلا `wedding.yourdomain.com`).
   - **Application Startup File:** دقیقاً عبارت `dist/server.cjs` را بنویسید.
4. دکمه **Create** در گوشه بالا را بزنید.

#### گام ۴: آپلود و استخراج فایل‌ها روی هاست
1. وارد **File Manager** در cPanel شوید.
2. به پوشه‌ای که در مرحله قبل به عنوان *Application Root* تعیین کردید بروید.
3. فایل زیپ ساخته‌شده در گام ۲ را آپلود کرده و **Extract** نمایید.

#### گام ۵: نصب پکیج‌ها و اجرای نهایی
1. به صفحه **Setup Node.js App** بازگردید و برنامه ساخته شده را باز کنید.
2. در پایین صفحه روی دکمه **Run NPM Install** کلیک کنید تا وابستگی‌های لازم برای اجرای سرور نصب شوند.
3. در بالای صفحه دکمه **Restart** را بزنید.
4. سایت شما اکنون به طور کامل با دامنه اختصاصی آنلاین و در دسترس است!

---

### 🟡 حالت دوم: هاست اشتراکی معمولی (سایت استاتیک - بدون Node.js)

اگر هاست اشتراکی شما از Node.js پشتیبانی نمی‌کند، می‌توانید خروجی استاتیک پروژه را مستقیماً داخل پوشه `public_html` آپلود کنید.

#### گام ۱: ساخت خروجی نهایی
در سیستم خود دستور زیر را اجرا کنید:
```bash
npm run build
```

#### گام ۲: آپلود محتویات پوشه `dist`
1. وارد **File Manager** هاست (cPanel / DirectAdmin / Plesk) شوید.
2. وارد پوشه `public_html` (یا ساب‌فولدر مدنظرتان) شوید.
3. **تمام محتویات داخل پوشه `dist`** (شامل `index.html`، پوشه `assets` و...) را به درون `public_html` منتقل کنید.

#### گام ۳: ساخت فایل `.htaccess` جهت مدیریت روتینگ (Single Page App Routing)
برای اینکه صفحات به درستی باز شوند و خطای ۴۰۴ ایجاد نشود، یک فایل با نام `.htaccess` در همان مسیر `public_html` بسازید و کدهای زیر را داخل آن قرار دهید:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# بهینه‌سازی کش مرورگر برای سرعت بارگذاری بالا
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType audio/mpeg "access plus 1 year"
</IfModule>
```

#### گام ۴: فعال‌سازی SSL رایگان در هاست
در cPanel وارد بخش **SSL/TLS Status** شده و برای دامنه خود گزینه **Run AutoSSL** یا گواهی رایگان Let's Encrypt را فعال کنید تا سایت با پروتکل امن `https://` باز شود.

---

## 🐧 راهنمای جامع استقرار روی سرور لینوکس ابونتو (Ubuntu Linux Deployment)

این راهنما گام به گام مراحل نصب، کانفیگ Nginx، دریافت گواهی SSL و **تنظیم بالا آمدن اتوماتیک برنامه در صورت ریستارت شدن سرور (Auto-restart on Reboot)** را در سیستم‌عامل ابونتو (Ubuntu 20.04 / 22.04 / 24.04 LTS) توضیح می‌دهد.

---

### گام ۱: به‌روزرسانی پکیج‌های ابونتو و نصب پیش‌نیازها

با SSH به سرور ابونتو متصل شوید:
```bash
ssh root@YOUR_SERVER_IP
```

مخازن سیستم‌عامل را به‌روزرسانی کنید:
```bash
sudo apt update && sudo apt upgrade -y
```

ابزارهای ضروری، Git و Nginx را نصب کنید:
```bash
sudo apt install -y curl git nginx ufw
```

---

### گام ۲: نصب Node.js 20 LTS و PM2

نصب آخرین نسخه Node.js 20 LTS از طریق NodeSource:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

بررسی نصب موفق Node.js و npm:
```bash
node -v
npm -v
```

نصب مدیریت پروسه **PM2** به صورت سراسری (Global):
```bash
sudo npm install -g pm2
```

---

### گام ۳: تنظیم دیوار آتشین (UFW Firewall)

پورت‌های مورد نیاز (SSH, HTTP, HTTPS) را باز کنید:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

---

### گام ۴: دریافت پروژه، نصب وابستگی‌ها و بیلد

پروژه را در مسیر `/var/www/Wedding` کلون کنید:
```bash
cd /var/www
git clone https://github.com/AlirezaSadeghi72/Wedding.git
cd Wedding
```

نصب وابستگی‌ها و ساخت خروجی پروداکشن:
```bash
npm install
npm run build
```

---

### گام ۵: اجرا با PM2 و تنظیم بالا آمدن اتوماتیک پس از ریست شدن سرور (Auto-Start on Reboot)

برای اینکه برنامه همیشه در پس‌زمینه اجرا شود و **در صورت ریستارت شدن یا خاموش و روشن شدن سرور ابونتو، به صورت خودکار بالا بیاید**، مراحل زیر را اجرا کنید:

۱. اجرا کردن برنامه با PM2:
   ```bash
   pm2 start dist/server.cjs --name "Wedding"
   ```

۲. ذخیره لیست پروسه‌های فعال PM2:
   ```bash
   pm2 save
   ```

۳. فعال‌سازی سرویس Auto-startup ابونتو:
   ```bash
   pm2 startup
   ```

> ⚠️ **نکته مهم:** اجرای دستور `pm2 startup` یک خروجی دستور در ترمینال به شما می‌دهد (مشابه `sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root`). **دقیقاً همان دستور پیشنهادی را کپی کرده و در ترمینال اجرا کنید** تا سرویس systemd ثبت شود.

۴. بررسی وضعیت سرویس:
   ```bash
   pm2 status
   ```

---

### 💡 روش جایگزین: بالا آمدن اتوماتیک با Systemd نیتیو لینوکس (Optional)

اگر تمایل دارید به جای PM2 از سرویس‌دهنده خود سیستم‌عامل ابونتو (Systemd) استفاده کنید:

۱. فایل سرویس جدید بسازید:
   ```bash
   sudo nano /etc/systemd/system/Wedding.service
   ```

۲. محتوای زیر را درون آن قرار داده و ذخیره کنید (Ctrl+O و سپس Enter، برای خروج Ctrl+X):
   ```ini
   [Unit]
   Description=Wedding Digital Invitation Node.js App
   After=network.target

   [Service]
   Type=simple
   User=root
   WorkingDirectory=/var/www/Wedding
   ExecStart=/usr/bin/node dist/server.cjs
   Restart=always
   RestartSec=10
   Environment=NODE_ENV=production PORT=3000

   [Install]
   WantedBy=multi-user.target
   ```

۳. سرویس را فعال و روشن کنید:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable Wedding
   sudo systemctl start Wedding
   ```

با این کار، سرویس سیستم‌عامل مسئولیت بالا آوردن اتوماتیک پروژه در هر ریستارت را بر عهده می‌گیرد.

---

### گام ۶: تنظیم Nginx به عنوان Reverse Proxy

یک فایل کانفیگ برای دامنه‌تان در Nginx بسازید:
```bash
sudo nano /etc/nginx/sites-available/Wedding
```

کدهای زیر را قرار داده و `your-domain.com` را با دامنه خود جایگزین کنید:
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
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 50M;
}
```

فعال‌سازی کانفیگ و تست Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/Wedding /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
```

---

### گام ۷: فعال‌سازی HTTPS و گواهی رایگان SSL (Let's Encrypt)

نصب Certbot و گرفتن گواهی SSL:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

تست تمدید خودکار گواهی SSL:
```bash
sudo certbot renew --dry-run
```

---

### گام ۸: تست سلامت و بالا آمدن اتوماتیک سرور

برای اطمینان از اینکه همه چیز پس از ریستارت ابونتو خودکار بالا می‌آید، سرور را ریستارت کنید:
```bash
sudo reboot
```

پس از ۱ دقیقه، مجدداً وارد سرور شده یا آدرس سایت خود را در مرورگر باز کنید (`https://your-domain.com`). برنامه بدون نیاز به هیچ دستوری باید کاملاً آنلاین و در دسترس باشد!

---

## 🔄 راهنمای کامل به‌روزرسانی پروژه روی سرور (Updating Deployed Application)

هر زمان که کدهای جدیدی توسعه داده‌اید یا نسخه‌ای را به‌روزرسانی کرده‌اید، برای اعمال تغییرات جدید روی سروری که برنامه روی آن اجرا می‌شود، مراحل زیر را طی کنید:

---

### 🟢 روش ۱: به‌روزرسانی استاندارد با Git (پیشنهادی)

اگر پروژه شما به یک مخزن Git (مثل GitHub) متصل است، می‌توانید تنها با ۴ دستور پروژه روی سرور را آپدیت کنید:

۱. ورود به پوشه اصلی پروژه روی سرور:
   ```bash
   cd /var/www/Wedding
   ```

۲. **(اختیاری اما پیشنهادی)** گرفتن نسخه پشتیبان از داده‌های تاییدیه حضور و دفترچه یادبود:
   ```bash
   cp -r backups backups_backup_`date +%Y%m%d_%H%M%S`
   ```

۳. دریافت آخرین تغییرات کد از مخزن GitHub:
   ```bash
   git pull origin main
   ```

۴. نصب پکیج‌های جدید (در صورت اضافه شدن کتابخانه جدید به `package.json`):
   ```bash
   npm install
   ```

۵. بیلد مجدد و ساخت فایل‌های نهایی پروداکشن:
   ```bash
   npm run build
   ```

۶. ری‌استارت کردن سرویس جهت اعمال کدهای جدید:
   - **اگر از PM2 استفاده می‌کنید:**
     ```bash
     pm2 restart Wedding
     ```
   - **اگر از Systemd استفاده می‌کنید:**
     ```bash
     sudo systemctl restart Wedding
     ```

---

### 🟡 روش ۲: به‌روزرسانی دستی (Manual File Transfer / SFTP)

اگر پروژه را به صورت فایل از طریق FTP یا SFTP به سرور منتقل می‌کنید:

۱. فایل‌های جدید (شامل پوشه‌های `src` ، `public` ، `server.ts` ، `package.json` و...) را جایگزین فایل‌های قبلی روی سرور در مسیر `/var/www/Wedding` کنید.
   *(توجه: نیاز به آپلود پوشه `node_modules` یا `dist` نیست).*

۲. با SSH به سرور متصل شده و وارد پوشه پروژه شوید:
   ```bash
   cd /var/www/Wedding
   ```

۳. دستورات نصب، بیلد و ری‌استارت را اجرا کنید:
   ```bash
   npm install
   npm run build
   pm2 restart Wedding
   ```

---

### 🛡️ حفظ و امنیت اطلاعات ذخیره‌شده مهمانان هنگام به‌روزرسانی

تمامی اطلاعات تاییدیه حضور (RSVP)، پیام‌های دفترچه یادبود و فایل‌های آپلودشده توسط کاربر در مسیرهای زیر روی سرور نگهداری می‌شوند:
- `backups/rsvps_store.json` (تاییده‌های حضور مهمانان)
- `backups/guestbook_store.json` (نظرات دفترچه یادبود)
- `uploads/` (عکس‌ها و موزیک‌های آپلودشده)

این فایل‌ها و پوشه‌ها خارج از کدهای سورس بوده و با `git pull` یا `npm run build` هیچ آسیبی ندیده و پاک نمی‌شوند.

---

### 📊 بررسی سلامت و لوگ‌های سرور پس از به‌روزرسانی

جهت اطمینان از عملکرد صحیح پروژه پس از آپدیت:

- **مشاهده وضعیت برنامه در PM2:**
  ```bash
  pm2 status
  ```

- **مشاهده لوگ‌ها و خطاهای زنده سیستم:**
  ```bash
  pm2 logs Wedding --lines 50
  ```

- **بررسی سلامت API سرور:**
  ```bash
  curl -i http://localhost:3000/api/health
  ```

---

## ⚙️ راهنمای کامل گیت و آپلود در GitHub

برای قرار دادن یا به‌روزرسانی پروژه در مخزن GitHub:

۱. مقداردهی و بررسی وضعیت گیت:
   ```bash
   git init
   git status
   ```

۲. افزودن تغییرات و ثبت کامیت:
   ```bash
   git add .
   git commit -m "Update: Ring seal, 3-map navigation, and auto-start deployment guide"
   ```

۳. اتصال به مخزن گیت‌هاب و پاش کردن کدها:
   ```bash
   git branch -M main
   git remote add origin https://github.com/AlirezaSadeghi72/REPOSITORY-NAME.git
   git push -u origin main
   ```

---

## 📂 ساختار پوشه‌های پروژه

```
├── dist/                   # خروجی پروداکشن (تولیدشده با npm run build)
│   ├── index.html
│   └── server.cjs          # سرور بک‌اند کامل و باندل‌شده
├── src/
│   ├── components/         # کامپوننت‌های رابط کاربری
│   │   ├── WeddingEnvelope.tsx    # پاکت متحرک با مهر دایره‌ای دو حلقه
│   │   ├── StudioEditorModal.tsx  # مدال استودیو تنظیمات و ویرایشگر
│   │   ├── WeddingCardView.tsx    # نمای اصلی کارت دعوت
│   │   ├── AudioPlayerFloating.tsx# موزیک پلیر
│   │   ├── WeatherSection.tsx     # بخش هواشناسی جشن
│   │   └── ...
│   ├── data/
│   │   ├── themes.ts       # ۱۵ تم رنگی شاد و گرم
│   │   └── defaultWedding.ts
│   ├── types.ts            # تایپ‌های تعاریف پروژه
│   └── App.tsx             # کامپوننت ریشه
├── server.ts               # سرور Express
├── package.json            # وابستگی‌ها و اسکریپت‌های اجرایی
└── README.md               # راهنمای کامل پروژه و استقرار
```

---

## 💖 پشتیبانی و بهره‌برداری

این پروژه به کامل‌ترین شکل ممکن تست گردیده و آماده بهره‌برداری برای مراسم‌های عقد و عروسی است.
