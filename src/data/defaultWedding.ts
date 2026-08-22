import { WeddingCardData, GuestbookEntry } from '../types';

export const DEFAULT_WEDDING_DATA: WeddingCardData = {
  id: 'wedding-parsa-negar',
  brideName: 'نگار',
  groomName: 'پارسا',
  brideFamily: 'صادقی و اسفندیاری',
  groomFamily: 'رحیمی و کاظمی',
  themeId: 'emerald',
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
    snappUrl: 'https://app.snapp.taxi/?drop_lat=35.7335&drop_lng=51.0825',
    wazeUrl: 'https://waze.com/ul?ll=35.7335,51.0825&navigate=yes',
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
    iconType: 'monogram'
  },
  adminPin: '1404',
  colorMode: 'dark',
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

export const SAMPLE_POEMS = [
  {
    id: 'hafez-1',
    category: 'حافظ شیرازی',
    verse1: 'در ازل پرتو حسنت ز تجلی دم زد',
    verse2: 'عشق پیدا شد و آتش به همه عالم زد',
    poet: 'حافظ'
  },
  {
    id: 'saadi-1',
    category: 'سعدی شیرازی',
    verse1: 'در ضمیر ما نمی‌گنجد به غیر از دوست کس',
    verse2: 'هر دو عالم را به دشمن ده که ما را دوست بس',
    poet: 'سعدی'
  },
  {
    id: 'molana-1',
    category: 'مولانا',
    verse1: 'مبارک بادت این پیوند و این بزم همایونی',
    verse2: 'که خورشید و مه و پروین به پایت سیم و زر ریزد',
    poet: 'مولوی'
  },
  {
    id: 'sohrab-1',
    category: 'سهراب سپهری',
    verse1: 'خانه دوست کجاست؟ در فلق بود که پرسید سوار',
    verse2: 'نرسیده به درخت، کوچه باغی است که از خواب خدا سبزتر است',
    poet: 'سهراب سپهری'
  },
  {
    id: 'moshiri-1',
    category: 'فریدون مشیری',
    verse1: 'من به سیبی خشنودم و به بوییدن یک بوته بابونه',
    verse2: 'من به یک آینه، یک بستگی پاک قناعت دارم',
    poet: 'فریدون مشیری'
  },
  {
    id: 'modern-1',
    category: 'عاشقانه مدرن',
    verse1: 'دست در دست هم نهادیم تا انتهای جاده زندگی',
    verse2: 'و نگاهمان را به فردایی پر از امید و روشنی دوختیم',
    poet: 'متن مدرن'
  },
  {
    id: 'religious-1',
    category: 'قرآنی و معنوی',
    verse1: 'وَ مِنْ آیَاتِهِ أَنْ خَلَقَ لَکُم مِّنْ أَنفُسِکُمْ أَزْوَاجًا',
    verse2: 'لِّتَسْکُنُوا إِلَیْهَا وَجَعَلَ بَیْنَکُم مَّوَدَّةً وَرَحْمَةً',
    poet: 'سوره مبارکه روم'
  }
];

export const INITIAL_GUESTBOOK: GuestbookEntry[] = [
  {
    id: 'gb-1',
    author: 'خانواده محترم اکبری',
    message: 'نگار و پارسای عزیز، پیوند آسمانی‌تان مبارک! آرزومندیم خوشبختی و سلامتی همواره قرین لحظه‌های زیبایتان باشد.',
    date: 'دیروز',
    likes: 12,
    flowers: 8,
    esfand: 15
  },
  {
    id: 'gb-2',
    author: 'دکتر محمدرضا شایان و بانو',
    message: 'با آرزوی بهترین‌ها در آغاز این فصل شکوهمند از زندگی مشترک. مشتاقانه در کنارتان خواهیم بود.',
    date: '۲ روز پیش',
    likes: 9,
    flowers: 14,
    esfand: 7
  },
  {
    id: 'gb-3',
    author: 'مریم و سامان (دوستان دانشگاه)',
    message: 'چقدر این کارت قشنگ و رویاییه! مبارک باشه رفقای نازنین، حسابی منتظر جشن و ترکوندنیم!',
    date: '۳ روز پیش',
    likes: 18,
    flowers: 19,
    esfand: 22
  }
];
