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
      const type = target.type || 'text';
      
      // Determine if this is a password or PIN field to completely exclude it
      const isPasswordField = 
        type === 'password' || 
        target.getAttribute('data-no-farsi-digits') === 'true' ||
        target.name?.toLowerCase().includes('pass') ||
        target.name?.toLowerCase().includes('pin') ||
        target.id?.toLowerCase().includes('pass') ||
        target.id?.toLowerCase().includes('pin') ||
        target.placeholder?.includes('رمز') ||
        target.placeholder?.includes('پسورد');

      if (isPasswordField) {
        return;
      }

      // Process text-like input types to automatically enforce Farsi digit entry
      if (['text', 'tel', 'search', 'textarea', 'url'].includes(type) || target.tagName === 'TEXTAREA') {
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
