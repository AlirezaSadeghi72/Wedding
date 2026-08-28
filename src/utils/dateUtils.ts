export function toPersianDigits(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '';
  const str = String(num);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str
    .replace(/[0-9]/g, (w) => persianDigits[+w])
    .replace(/[٠-٩]/g, (w) => persianDigits[arabicDigits.indexOf(w)]);
}

/**
 * Format timestamp into comprehensive Persian Date & Time
 * e.g. "۶ شهریور ۱۴۰۵ ساعت ۰۷:۱۳"
 */
export function formatPersianDateTime(dateInput: string | Date | number | undefined | null): string {
  if (!dateInput) return '';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  } catch {
    return String(dateInput);
  }
}

/**
 * Format timestamp into full Persian Date & Time with weekday
 * e.g. "جمعه، ۶ شهریور ۱۴۰۵ - ساعت ۰۷:۱۳"
 */
export function formatPersianFullDateTime(dateInput: string | Date | number | undefined | null): string {
  if (!dateInput) return '';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);
    const datePart = new Intl.DateTimeFormat('fa-IR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
    const timePart = new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
    return `${datePart} - ساعت ${timePart}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Short numerical Persian date & time (for tables & CSV exports)
 * e.g. "۱۴۰۵/۰۶/۰۶ - ۰۷:۱۳"
 */
export function formatPersianShortDateTime(dateInput: string | Date | number | undefined | null): string {
  if (!dateInput) return '';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);
    const datePart = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
    const timePart = new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
    return `${datePart} - ${timePart}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Dynamic Persian relative time calculator
 * e.g. "لحظاتی پیش", "۲ دقیقه پیش", "۳ ساعت پیش", "دیروز، ساعت ۱۸:۳۰", "۳ روز پیش", "۶ شهریور ۱۴۰۵"
 */
export function formatPersianRelativeTime(
  dateInput: string | Date | number | undefined | null,
  fallbackText?: string
): string {
  if (!dateInput) return fallbackText || 'لحظاتی پیش';

  // If it's not a standard ISO date and already a Persian string like "دیروز" or "۲ روز پیش"
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return fallbackText || String(dateInput);
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // If time is slightly in the future (client/server skew) or < 45 seconds ago
  if (diffMs < 45000) {
    return 'لحظاتی پیش';
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 60) {
    return `${toPersianDigits(diffMin)} دقیقه پیش`;
  }

  if (diffHours < 24) {
    return `${toPersianDigits(diffHours)} ساعت پیش`;
  }

  if (diffDays === 1) {
    try {
      const timeStr = new Intl.DateTimeFormat('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);
      return `دیروز، ساعت ${timeStr}`;
    } catch {
      return 'دیروز';
    }
  }

  if (diffDays < 7) {
    return `${toPersianDigits(diffDays)} روز پیش`;
  }

  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch {
    return fallbackText || String(dateInput);
  }
}

export function formatGregorianToPersian(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const year = date.getFullYear();
    const monthIndex = date.getMonth(); // 0-11
    const day = date.getDate();
    
    const months = [
      'ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن',
      'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'
    ];
    
    const persianMonth = months[monthIndex];
    const persianDay = toPersianDigits(day);
    const persianYear = toPersianDigits(year);
    
    return `مصادف با ${persianDay} ${persianMonth} ${persianYear}`;
  } catch (e) {
    return dateStr;
  }
}

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  totalSeconds: number;
}

export function calculateTimeLeft(targetIsoDate: string): TimeLeft {
  const target = new Date(targetIsoDate).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: true,
      totalSeconds: 0
    };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return {
    days,
    hours,
    minutes,
    seconds,
    isPast: false,
    totalSeconds: Math.floor(diff / 1000)
  };
}

export function generateIcsCalendar(
  title: string,
  description: string,
  location: string,
  startDateIso: string,
  durationHours = 5
): string {
  const startDate = new Date(startDateIso);
  const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);

  const formatIcsDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Digital Wedding Card//FA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icsContent;
}

export function downloadCalendarFile(icsContent: string, filename = 'wedding-invitation.ics') {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
