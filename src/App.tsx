/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Users, Eye, LogOut } from 'lucide-react';
import { WeddingCardData } from './types';
import { DEFAULT_WEDDING_DATA } from './data/defaultWedding';
import WeddingEnvelope from './components/WeddingEnvelope';
import WeddingCardView from './components/WeddingCardView';
import StudioEditorModal from './components/StudioEditorModal';
import RSVPManagerModal from './components/RSVPManagerModal';
import AudioPlayerFloating from './components/AudioPlayerFloating';
import AdminLoginModal from './components/AdminLoginModal';
import { getIsAdminSessionValid, saveAdminSession, clearAdminSession } from './utils/security';

export default function App() {
  const [weddingData, setWeddingData] = useState<WeddingCardData>(() => {
    try {
      const saved = localStorage.getItem('wedding_card_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure default colorMode is dark if not specified
        return { ...parsed, colorMode: parsed.colorMode || 'dark' };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_WEDDING_DATA;
  });

  const [isOpened, setIsOpened] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isRsvpManagerOpen, setIsRsvpManagerOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  
  // Guest color mode preference (Defaults to 'dark')
  const [guestColorMode, setGuestColorMode] = useState<'dark' | 'light'>(() => {
    try {
      const savedMode = localStorage.getItem('wedding_guest_color_mode');
      if (savedMode === 'dark' || savedMode === 'light') return savedMode;
    } catch {
      // ignore
    }
    return weddingData.colorMode || 'dark';
  });

  const handleToggleGuestColorMode = () => {
    const nextMode = guestColorMode === 'dark' ? 'light' : 'dark';
    setGuestColorMode(nextMode);
    try {
      localStorage.setItem('wedding_guest_color_mode', nextMode);
    } catch {
      // ignore
    }
  };
  
  // Admin authentication state with secure session validation & expiry
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return getIsAdminSessionValid();
  });

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

  // If envelope is disabled in section visibility, automatically show card view
  useEffect(() => {
    if (weddingData.sectionVisibility?.envelope === false) {
      setIsOpened(true);
    }
  }, [weddingData.sectionVisibility?.envelope]);

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    saveAdminSession();
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setIsStudioOpen(false);
    setIsRsvpManagerOpen(false);
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
  };

  const showEnvelope = !isOpened && weddingData.sectionVisibility?.envelope !== false;
  const effectiveData: WeddingCardData = {
    ...weddingData,
    colorMode: guestColorMode
  };

  return (
    <div className={`relative min-h-screen ${guestColorMode === 'light' ? 'bg-stone-100 text-stone-900' : 'bg-stone-950 text-stone-100'} font-vazir selection:bg-amber-400 selection:text-stone-950 overflow-x-hidden w-full transition-colors duration-500`}>
      {/* Top Floating Control Ribbon ONLY for Authenticated Admin */}
      {isAdminAuthenticated && (
        <header
          className={`fixed left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-3 pointer-events-none transition-all duration-300 ${
            weddingData.sectionVisibility?.rsvp !== false && weddingData.rsvpConfig.enabled !== false
              ? 'top-14 sm:top-16'
              : 'top-3 sm:top-4'
          }`}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto flex items-center justify-between gap-1.5 p-1.5 rounded-full bg-stone-900/95 border border-amber-500/50 shadow-2xl backdrop-blur-xl text-xs"
          >
            <div className="flex items-center gap-1.5 pr-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-amber-300 font-amiri hidden sm:inline">
                پنل مدیریت کارت عروسی
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Studio Customize Button */}
              <button
                id="studio-editor-toggle-btn"
                onClick={() => setIsStudioOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-amber-200 border border-amber-500/30 cursor-pointer transition-all text-xs"
              >
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>ویرایش بخش‌ها</span>
              </button>

              {/* Guest list & RSVP manager */}
              <button
                id="rsvp-manager-toggle-btn"
                onClick={() => setIsRsvpManagerOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors cursor-pointer text-xs"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">مهمانان</span>
                <span>(RSVP)</span>
              </button>

              {/* Toggle Envelope / Card view */}
              {isOpened && weddingData.sectionVisibility?.envelope !== false && (
                <button
                  onClick={() => setIsOpened(false)}
                  className="p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors cursor-pointer"
                  title="مشاهده نمای پاکت"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                </button>
              )}

              {/* Logout Button */}
              <button
                onClick={handleAdminLogout}
                className="p-1.5 rounded-full bg-stone-800 hover:bg-rose-950 text-stone-400 hover:text-rose-400 border border-stone-700 transition-colors cursor-pointer"
                title="خروج از پنل مدیریت"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
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
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.6 }}
            >
              <WeddingEnvelope
                data={effectiveData}
                onOpen={() => setIsOpened(true)}
                isOpened={isOpened}
                guestColorMode={guestColorMode}
                onToggleColorMode={handleToggleGuestColorMode}
              />
            </motion.div>
          ) : (
            <motion.div
              key="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <WeddingCardView
                data={effectiveData}
                onOpenStudio={handleOpenStudio}
                onReopenEnvelope={weddingData.sectionVisibility?.envelope !== false ? () => setIsOpened(false) : undefined}
                onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
                isAdminAuthenticated={isAdminAuthenticated}
                guestColorMode={guestColorMode}
                onToggleColorMode={handleToggleGuestColorMode}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Permanent Bottom Footer Music Player - Always Present for Guests */}
      {weddingData.sectionVisibility?.musicPlayer !== false && weddingData.music.enabled && (
        <AudioPlayerFloating
          data={effectiveData}
          guestColorMode={guestColorMode}
          onToggleColorMode={handleToggleGuestColorMode}
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
    </div>
  );
}
