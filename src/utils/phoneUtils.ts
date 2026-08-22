/**
 * Convert Persian and Arabic digits to standard English digits
 */
export function toEnglishDigits(str: string): string {
  if (!str) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = String(str);
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(persianDigits[i], 'g'), String(i));
    result = result.replace(new RegExp(arabicDigits[i], 'g'), String(i));
  }
  return result;
}

/**
 * Filter input so it only contains numeric digits
 * Converts Persian/Arabic digits and truncates to max 11 digits
 */
export function sanitizePhoneInput(rawInput: string): string {
  if (!rawInput) return '';
  const converted = toEnglishDigits(rawInput);
  const digitsOnly = converted.replace(/\D/g, '');
  return digitsOnly.slice(0, 11);
}

/**
 * Normalizes phone number format (e.g. 9121112233 -> 09121112233)
 */
export function normalizePhoneNumber(phone: string): string {
  let cleaned = sanitizePhoneInput(phone);
  if (cleaned.length === 10 && cleaned.startsWith('9')) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
}

/**
 * Validates Iranian mobile phone format: exactly 11 digits starting with 09
 */
export function isValidIranianMobile(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return /^09\d{9}$/.test(normalized);
}
