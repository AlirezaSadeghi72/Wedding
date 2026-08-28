/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Users, Eye, LogOut, Sliders } from 'lucide-react';
import { WeddingCardData } from './types';
import { DEFAULT_WEDDING_DATA } from './data/defaultWedding';
import WeddingEnvelope from './components/WeddingEnvelope';
import WeddingCardView from './components/WeddingCardView';
import StudioEditorModal from './components/StudioEditorModal';
import RSVPManagerModal from './components/RSVPManagerModal';
import ThemeSelectorModal from './components/ThemeSelectorModal';
import AudioPlayerFloating from './components/AudioPlayerFloating';
import AdminLoginModal from './components/AdminLoginModal';
import { getIsAdminSessionValid, saveAdminSession, clearAdminSession, getAdminAuthHeaders, validateAdminSessionWithServer } from './utils/security';
import { subscribeToLiveEvents } from './utils/sessionSync';

export default function App() {
  const [weddingData, setWeddingData] = useState<WeddingCardData>(() => {
    try {
      const saved = localStorage.getItem('wedding_card_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return DEFAULT_WEDDING_DATA;
  });

  // Fetch wedding settings from server on mount & listen to real-time live changes
  useEffect(() => {
    fetch('/api/settings', {
      headers: getAdminAuthHeaders()
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData && resData.success && resData.data) {
          setWeddingData(resData.data);
          try {
            localStorage.setItem('wedding_card_data', JSON.stringify(resData.data));
          } catch {
            // Ignore
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load settings from server:', err);
      });

    // Real-time synchronization: when settings or theme are saved, update instantly for all viewers
    const unsubscribe = subscribeToLiveEvents((event) => {
      if (event.type === 'SETTINGS_UPDATED' && event.payload) {
        const incomingSettings = event.payload as WeddingCardData;
        setWeddingData((prev) => ({
          ...prev,
          ...incomingSettings
        }));
        try {
          localStorage.setItem('wedding_card_data', JSON.stringify(incomingSettings));
        } catch {
          // Ignore
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const [isOpened, setIsOpened] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isRsvpManagerOpen, setIsRsvpManagerOpen] = useState(false);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  
  // Admin authentication state with secure session validation & expiry
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return getIsAdminSessionValid();
  });

  // Verify stored session with server on mount; if invalid or expired, clear it
  useEffect(() => {
    if (isAdminAuthenticated) {
      validateAdminSessionWithServer().then((isValid) => {
        if (!isValid) {
          setIsAdminAuthenticated(false);
        }
      });
    }
  }, []);

  useEffect(() => {
    // Read URL search params for direct admin mode
    const searchParams = new URLSearchParams(window.location.search);
    const adminParam = searchParams.get('admin') || searchParams.get('mode');
    if (adminParam === '1' || adminParam === 'true' || adminParam === 'admin') {
      if (!isAdminAuthenticated) {
        setIsAdminLoginOpen(true);
      }
    }
  }, [isAdminAuthenticated]);

  // Dynamically update page title with bride and groom names
  useEffect(() => {
    const groom = weddingData.groomName?.trim();
    const bride = weddingData.brideName?.trim();
    if (groom && bride) {
      document.title = `کارت دعوت عروسی ${groom} و ${bride}`;
    } else if (groom || bride) {
      document.title = `کارت دعوت عروسی ${groom || bride}`;
    } else {
      document.title = 'کارت دعوت عروسی';
    }
  }, [weddingData.groomName, weddingData.brideName]);

  // If envelope is disabled in section visibility, automatically show card view
  useEffect(() => {
    if (weddingData.sectionVisibility?.envelope === false) {
      setIsOpened(true);
    }
  }, [weddingData.sectionVisibility?.envelope]);

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    fetch('/api/settings', {
      headers: getAdminAuthHeaders()
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData && resData.success && resData.data) {
          setWeddingData(resData.data);
          try {
            localStorage.setItem('wedding_card_data', JSON.stringify(resData.data));
          } catch {
            // Ignore
          }
        }
      })
      .catch(() => {});
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setIsStudioOpen(false);
    setIsRsvpManagerOpen(false);
    setIsThemeSelectorOpen(false);
    clearAdminSession();
  };

  const handleOpenStudio = () => {
    if (isAdminAuthenticated) {
      setIsStudioOpen(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleSaveData = (updated: WeddingCardData) => {
    setWeddingData(updated);
    try {
      localStorage.setItem('wedding_card_data', JSON.stringify(updated));
    } catch {
      // Ignore
    }

    // Keep active admin session PIN in sync if it was changed
    if (updated.adminPin) {
      saveAdminSession(undefined, updated.adminPin);
    }

    const authHeaders = getAdminAuthHeaders();
    if (!authHeaders['X-Admin-Pin'] && updated.adminPin) {
      authHeaders['X-Admin-Pin'] = updated.adminPin;
    }

    // Persist settings to the server
    fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify(updated)
    })
      .then((res) => res.json())
      .then((resData) => {
        if (!resData || !resData.success) {
          console.warn('Failed to save settings to server:', resData?.error);
        }
      })
      .catch((err) => {
        console.warn('Error saving settings to server:', err);
      });
  };

  const showEnvelope = !isOpened && weddingData.sectionVisibility?.envelope !== false;

  return (
    <div className={`relative ${showEnvelope ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-screen'} bg-[#FFFDF7] text-stone-900 font-vazir selection:bg-amber-400 selection:text-stone-950 overflow-x-hidden w-full transition-colors duration-500 ${isAdminAuthenticated ? 'pt-12 sm:pt-14' : ''}`}>
      {/* Top Fixed Sticky Control Header ONLY for Authenticated Admin */}
      {isAdminAuthenticated && (
        <header className="fixed top-0 inset-x-0 z-50 w-full h-12 sm:h-14 bg-[#FFFDF7]/95 border-b border-amber-300/80 shadow-md backdrop-blur-xl px-2 sm:px-6 flex items-center justify-between text-xs text-stone-900 overflow-x-auto no-scrollbar gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-amber-950 font-amiri text-xs sm:text-sm whitespace-nowrap">
              <span className="hidden sm:inline">پنل مدیریت کارت عروسی</span>
              <span className="sm:hidden">پنل مدیریت</span>
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Theme Selection Modal Toggle */}
            <button
              onClick={() => setIsThemeSelectorOpen(true)}
              className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-amber-100/90 hover:bg-amber-200/90 text-amber-950 border border-amber-300 cursor-pointer transition-all text-xs font-bold shadow-sm whitespace-nowrap"
              title="انتخاب تم و رنگ‌بندی کارت"
            >
              <Palette className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="hidden sm:inline">انتخاب تم</span>
              <span className="sm:hidden">تم</span>
            </button>

            {/* Studio Customize Button */}
            <button
              id="studio-editor-toggle-btn"
              onClick={() => setIsStudioOpen(true)}
              className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white hover:bg-amber-50 text-stone-800 border border-amber-200 cursor-pointer transition-all text-xs shadow-sm whitespace-nowrap"
              title="ویرایش متون، عکس‌ها و تنظیمات کارت"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden sm:inline">استودیو ویرایش</span>
              <span className="sm:hidden">ویرایش</span>
            </button>

            {/* Guest list & RSVP manager */}
            <button
              id="rsvp-manager-toggle-btn"
              onClick={() => setIsRsvpManagerOpen(true)}
              className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-stone-800 border border-emerald-300/80 transition-colors cursor-pointer text-xs shadow-sm whitespace-nowrap"
              title="مدیریت لیست مهمانان، تایید حضورها و نظرات"
            >
              <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">مهمانان و نظرات</span>
              <span className="sm:hidden">مهمانان</span>
            </button>

            {/* Toggle Envelope / Card view */}
            <button
              onClick={() => setIsOpened(!isOpened)}
              className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 transition-colors cursor-pointer text-xs shadow-sm whitespace-nowrap"
              title={isOpened ? 'مشاهده پاکت نامه' : 'مشاهده کارت دعوت'}
            >
              <Eye className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden md:inline">{isOpened ? 'نمای پاکت' : 'نمای کارت'}</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleAdminLogout}
              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer shadow-sm shrink-0"
              title="خروج از پنل مدیریت"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>
      )}

      {/* Main Wedding Experience */}
      <main className="w-full">
        <AnimatePresence mode="wait">
          {showEnvelope ? (
            <motion.div
              key="envelope"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <WeddingEnvelope
                data={weddingData}
                onOpen={() => setIsOpened(true)}
                isOpened={isOpened}
                isAdminAuthenticated={isAdminAuthenticated}
              />
            </motion.div>
          ) : (
            <motion.div
              key="card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <WeddingCardView
                data={weddingData}
                onOpenStudio={handleOpenStudio}
                onReopenEnvelope={weddingData.sectionVisibility?.envelope !== false ? () => setIsOpened(false) : undefined}
                onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
                isAdminAuthenticated={isAdminAuthenticated}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Permanent Bottom Footer Music Player - Always Present for Guests */}
      {weddingData.sectionVisibility?.musicPlayer !== false && weddingData.music.enabled && (
        <AudioPlayerFloating
          data={weddingData}
          onOpenStudio={handleOpenStudio}
          isAdminAuthenticated={isAdminAuthenticated}
        />
      )}

      {/* Admin Password Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        correctPin={weddingData.adminPin || '1404'}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Studio Customizer Modal */}
      <StudioEditorModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        data={weddingData}
        onSave={handleSaveData}
      />

      {/* RSVP Manager Modal */}
      <RSVPManagerModal
        isOpen={isRsvpManagerOpen}
        onClose={() => setIsRsvpManagerOpen(false)}
      />

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeSelectorOpen}
        onClose={() => setIsThemeSelectorOpen(false)}
        currentThemeId={weddingData.themeId}
        onSelectTheme={(themeId) => {
          handleSaveData({
            ...weddingData,
            themeId
          });
        }}
      />
    </div>
  );
}
