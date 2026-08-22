/**
 * Copy text to clipboard using the modern clipboard API with a robust fallback for insecure contexts/iframes.
 */
export function copyToClipboard(text: string): Promise<boolean> {
  // If the browser supports the Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch((err) => {
        console.warn('Modern Clipboard API failed, trying fallback:', err);
        return fallbackCopyToClipboard(text);
      });
  } else {
    // Use fallback
    return Promise.resolve(fallbackCopyToClipboard(text));
  }
}

function fallbackCopyToClipboard(text: string): boolean {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Prevent scrolling and keep it hidden offscreen
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback clipboard copy failed:', err);
    return false;
  }
}
