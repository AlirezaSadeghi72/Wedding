import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global automatic English/Arabic to Persian digits input listener
if (typeof document !== 'undefined') {
  const replaceWithPersianDigits = (str: string) => {
    return str
      .replace(/[0-9]/g, (w) => '۰۱۲۳۴۵۶۷۸۹'[+w])
      .replace(/[٠-٩]/g, (w) => '۰۱۲۳۴۵۶۷۸۹'['٠١٢٣٤٥٦٧٨٩'.indexOf(w)]);
  };

  document.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      const type = (target.type || 'text').toLowerCase();
      
      // 1. Exclude non-text types (password, url, email, number, date, time, file, color, range, etc.)
      const excludedTypes = ['password', 'url', 'email', 'number', 'date', 'datetime-local', 'time', 'file', 'color', 'range', 'hidden', 'checkbox', 'radio'];
      if (excludedTypes.includes(type)) {
        return;
      }

      // 2. Exclude explicitly marked fields
      if (target.getAttribute('data-no-farsi-digits') === 'true') {
        return;
      }

      // 3. Exclude any LTR input (URLs, codes, coordinates, English texts, latin names)
      if (target.getAttribute('dir')?.toLowerCase() === 'ltr') {
        return;
      }

      // 4. Exclude by name, id, class or placeholder patterns for technical/URL/secret fields
      const fieldIdentifier = `${target.name || ''} ${target.id || ''} ${target.className || ''} ${target.placeholder || ''}`.toLowerCase();
      const technicalKeywords = [
        'pass', 'pin', 'token', 'secret', 'key',
        'url', 'link', 'http', 'audio', 'music', 'mp3', 'image', 'photo',
        'lat', 'lng', 'coord', 'iban', 'card', 'mono', 'font-mono'
      ];
      if (technicalKeywords.some((kw) => fieldIdentifier.includes(kw))) {
        return;
      }

      // 5. Check if the value itself looks like a URL, link, or path
      const currentValue = target.value || '';
      if (
        currentValue.startsWith('http://') ||
        currentValue.startsWith('https://') ||
        currentValue.startsWith('data:') ||
        currentValue.startsWith('blob:') ||
        currentValue.startsWith('/') ||
        currentValue.includes('://') ||
        currentValue.includes('www.') ||
        /\.(mp3|m4a|wav|ogg|aac|png|jpg|jpeg|webp|gif|svg|json)(\?.*)?$/i.test(currentValue)
      ) {
        return;
      }

      // Process standard Persian text inputs (text, search, textarea, tel)
      if (['text', 'tel', 'search'].includes(type) || target.tagName === 'TEXTAREA') {
        const originalValue = target.value;
        const convertedValue = replaceWithPersianDigits(originalValue);
        
        if (originalValue !== convertedValue) {
          const selectionStart = target.selectionStart;
          const selectionEnd = target.selectionEnd;
          
          const valueSetter = Object.getOwnPropertyDescriptor(
            target.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
            'value'
          )?.set;

          if (valueSetter) {
            valueSetter.call(target, convertedValue);
          } else {
            target.value = convertedValue;
          }
          
          if (selectionStart !== null && selectionEnd !== null) {
            target.setSelectionRange(selectionStart, selectionEnd);
          }
          
          // Dispatch standard change event so React hook listeners trigger
          const reactEvent = new Event('input', { bubbles: true });
          target.dispatchEvent(reactEvent);
        }
      }
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
