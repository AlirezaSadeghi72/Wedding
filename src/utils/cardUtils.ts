import { toEnglishDigits } from './phoneUtils';
import { toPersianDigits } from './dateUtils';

/**
 * Known Iranian Bank 6-digit BIN prefixes
 */
export const IRANIAN_BANKS_BIN: Record<string, { name: string; color?: string }> = {
  '603799': { name: 'بانک ملی ایران' },
  '589210': { name: 'بانک سپه' },
  '627648': { name: 'بانک توسعه صادرات' },
  '627961': { name: 'بانک صنعت و معدن' },
  '603770': { name: 'بانک کشاورزی' },
  '628023': { name: 'بانک مسکن' },
  '627760': { name: 'پست بانک ایران' },
  '502908': { name: 'بانک توسعه تعاون' },
  '627412': { name: 'بانک اقتصاد نوین' },
  '622106': { name: 'بانک پارسیان' },
  '502229': { name: 'بانک پاسارگاد' },
  '627488': { name: 'بانک کارآفرین' },
  '621986': { name: 'بانک سامان' },
  '639346': { name: 'بانک سینا' },
  '639607': { name: 'بانک سرمایه' },
  '636214': { name: 'بانک آینده' },
  '502806': { name: 'بانک شهر' },
  '502938': { name: 'بانک دی' },
  '603769': { name: 'بانک صادرات ایران' },
  '610433': { name: 'بانک ملت' },
  '627353': { name: 'بانک تجارت' },
  '585983': { name: 'بانک تجارت' },
  '639599': { name: 'بانک قوامین' },
  '606373': { name: 'بانک قرض‌الحسنه مهر ایران' },
  '504172': { name: 'بانک قرض‌الحسنه رسالت' },
  '505785': { name: 'بانک ایران زمین' },
  '636795': { name: 'بانک مرکزی' },
  '627381': { name: 'بانک انصار' },
  '505801': { name: 'موسسه اعتباری کوثر' },
  '606256': { name: 'موسسه اعتباری ملل' },
  '639370': { name: 'موسسه مهر اقتصاد' },
  '628157': { name: 'موسسه اعتباری توسعه' },
  '581874': { name: 'بانک ایران زمین' },
  '505416': { name: 'بانک گردشگری' },
  '507677': { name: 'موسسه اعتباری نور' }
};

/**
 * Detect bank name from 16-digit card number or 6-digit BIN
 */
export function detectBankName(rawCard: string): string | null {
  const clean = sanitizeCardNumber(rawCard);
  if (clean.length >= 6) {
    const bin = clean.slice(0, 6);
    if (IRANIAN_BANKS_BIN[bin]) {
      return IRANIAN_BANKS_BIN[bin].name;
    }
  }
  return null;
}

/**
 * Cleans card number string into 16 English digits (removes spaces, dashes, Persian digits)
 */
export function sanitizeCardNumber(raw: string | undefined | null): string {
  if (!raw) return '';
  const english = toEnglishDigits(String(raw));
  return english.replace(/\D/g, '').slice(0, 16);
}

/**
 * Splits card number into 4-digit chunks in natural Left-to-Right bank card order
 * e.g. "5022291084726319" -> ["5022", "2910", "8472", "6319"]
 */
export function getCardChunks(raw: string | undefined | null): string[] {
  const clean = sanitizeCardNumber(raw);
  if (!clean) return ['----', '----', '----', '----'];
  
  const chunks: string[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    chunks.push(clean.slice(i, i + 4));
  }
  
  // Pad if incomplete
  while (chunks.length < 4) {
    chunks.push('----');
  }
  
  return chunks;
}

/**
 * Format card number for text display with dashes (e.g. 5022-2910-8472-6319)
 */
export function formatCardWithDashes(raw: string | undefined | null): string {
  const chunks = getCardChunks(raw).filter(c => c !== '----');
  return chunks.join('-');
}

/**
 * Format Iranian IBAN (Sheba) number
 * e.g. "IR640570029180012345678001" -> "IR64 0570 0291 8001 2345 6780 01"
 */
export function formatIbanDisplay(raw: string | undefined | null): string {
  if (!raw) return '';
  let clean = toEnglishDigits(String(raw)).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (!clean.startsWith('IR') && clean.length > 0) {
    clean = 'IR' + clean;
  }
  // Group in 4s after IR
  const match = clean.match(/.{1,4}/g);
  return match ? match.join(' ') : clean;
}

/**
 * Sanitize IBAN for clipboard copying (clean 26 characters without spaces)
 */
export function sanitizeIban(raw: string | undefined | null): string {
  if (!raw) return '';
  let clean = toEnglishDigits(String(raw)).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (!clean.startsWith('IR') && clean.length > 0) {
    clean = 'IR' + clean;
  }
  return clean.slice(0, 26);
}
