// Session management and Real-Time Event Sync via Server-Sent Events (SSE)

export type LiveEventType =
  | 'CONNECTED'
  | 'PHOTO_LIKES_UPDATED'
  | 'GUESTBOOK_NEW_ENTRY'
  | 'GUESTBOOK_REACTION_UPDATED'
  | 'GUESTBOOK_ENTRY_DELETED'
  | 'GUESTBOOK_RESET'
  | 'SETTINGS_UPDATED'
  | 'RSVP_UPDATED'
  | 'VISITS_UPDATED';

export interface LiveEvent<T = any> {
  type: LiveEventType;
  payload: T;
}

const SESSION_KEY = 'wedding_visitor_session_id';
const LIKED_PHOTOS_KEY = 'wedding_visitor_liked_photos';
const GUESTBOOK_REACTIONS_KEY = 'wedding_visitor_gb_reactions';
const VISIT_TRACKED_KEY = 'wedding_visit_tracked_ts';

/**
 * Returns a persistent unique session ID for the current browser/device
 */
export function getSessionId(): string {
  try {
    let sess = localStorage.getItem(SESSION_KEY);
    if (!sess) {
      sess = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem(SESSION_KEY, sess);
    }
    return sess;
  } catch {
    return `sess_fallback_${Date.now()}`;
  }
}

/**
 * Automatically records a visit to the website (with session debouncing)
 */
export function trackSiteVisit(): void {
  try {
    const sessionId = getSessionId();
    const now = Date.now();
    const lastTracked = sessionStorage.getItem(VISIT_TRACKED_KEY);
    
    // Track once per session/tab load (or every 10 minutes per tab)
    if (!lastTracked || now - Number(lastTracked) > 10 * 60 * 1000) {
      sessionStorage.setItem(VISIT_TRACKED_KEY, String(now));
      fetch('/api/visits/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      }).catch(() => {});
    }
  } catch {
    // Ignore
  }
}

/**
 * Checks if current session has already liked a photo
 */
export function hasLikedPhoto(photoId: string): boolean {
  try {
    const raw = localStorage.getItem(LIKED_PHOTOS_KEY);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    return Array.isArray(list) && list.includes(photoId);
  } catch {
    return false;
  }
}

/**
 * Marks a photo as liked in local storage
 */
export function recordLikedPhoto(photoId: string): void {
  try {
    const raw = localStorage.getItem(LIKED_PHOTOS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(photoId)) {
      list.push(photoId);
      localStorage.setItem(LIKED_PHOTOS_KEY, JSON.stringify(list));
    }
  } catch (err) {
    console.error('Error saving liked photo:', err);
  }
}

/**
 * Checks if current session has already reacted to a guestbook entry
 */
export function hasReactedGuestbook(entryId: string, type: 'likes' | 'flowers' | 'esfand'): boolean {
  try {
    const raw = localStorage.getItem(GUESTBOOK_REACTIONS_KEY);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    const key = `${entryId}_${type}`;
    return Array.isArray(list) && list.includes(key);
  } catch {
    return false;
  }
}

/**
 * Marks a guestbook reaction as used in local storage
 */
export function recordReactedGuestbook(entryId: string, type: 'likes' | 'flowers' | 'esfand'): void {
  try {
    const raw = localStorage.getItem(GUESTBOOK_REACTIONS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const key = `${entryId}_${type}`;
    if (!list.includes(key)) {
      list.push(key);
      localStorage.setItem(GUESTBOOK_REACTIONS_KEY, JSON.stringify(list));
    }
  } catch (err) {
    console.error('Error saving guestbook reaction:', err);
  }
}

/**
 * Connects to the SSE endpoint /api/events for real-time synchronization
 */
export function subscribeToLiveEvents(onEvent: (event: LiveEvent) => void): () => void {
  let eventSource: EventSource | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let isClosed = false;

  function connect() {
    if (isClosed) return;
    try {
      eventSource = new EventSource('/api/events');

      eventSource.onmessage = (e) => {
        try {
          if (!e.data || e.data.startsWith(':')) return; // Ignore keep-alive
          const parsed = JSON.parse(e.data) as LiveEvent;
          onEvent(parsed);
        } catch {
          // ignore parsing errors
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (!isClosed) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };
    } catch {
      if (!isClosed) {
        reconnectTimeout = setTimeout(connect, 5000);
      }
    }
  }

  connect();

  return () => {
    isClosed = true;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}
