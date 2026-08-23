import { useState, useRef, useEffect, ChangeEvent, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  X,
  Sparkles,
  Palette,
  Calendar,
  MapPin,
  Clock,
  Music,
  Share2,
  Check,
  Wand2,
  BookOpen,
  Plus,
  Trash2,
  Copy,
  Heart,
  MailOpen,
  Image as ImageIcon,
  Camera,
  Gift,
  HelpCircle,
  Sun,
  LayoutGrid,
  CheckCircle2,
  Eye,
  Settings,
  Download,
  Upload,
  RotateCcw,
  Sliders,
  Users,
  Volume2,
  Lock,
  Shield,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Disc,
  VolumeX,
  Radio,
  Crown,
  Flower2,
  Bird
} from 'lucide-react';
import { weddingAudio } from '../utils/audioSynth';
import { normalizeDigits, verifyPasswordSecurely } from '../utils/security';
import {
  WeddingCardData,
  ThemeId,
  SealColor,
  TimelineItem,
  LoveStoryMilestone,
  GalleryPhoto,
  FAQItem,
  SectionVisibility,
  MusicTrack,
  OverallBorderStyle,
  OverallFontPairing,
  OverallAmbientEffect
} from '../types';
import {
  THEMES,
  BORDER_STYLES,
  FONT_PAIRING_STYLES,
  AMBIENT_EFFECT_STYLES
} from '../data/themes';
import { SAMPLE_POEMS, DEFAULT_WEDDING_DATA } from '../data/defaultWedding';
import ConfirmModal from './ConfirmModal';

const toPersianDigits = (num: number | string): string => {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: WeddingCardData;
  onSave: (updated: WeddingCardData) => void;
}

type TabType =
  | 'sections'
  | 'envelope'
  | 'basics'
  | 'text_ai'
  | 'story'
  | 'gallery'
  | 'timeline'
  | 'venue'
  | 'gift_faq'
  | 'music_rsvp'
  | 'security'
  | 'backup';

export default function StudioEditorModal({ isOpen, onClose, data, onSave }: Props) {
  const [formData, setFormData] = useState<WeddingCardData>(data);
  const [activeTab, setActiveTab] = useState<TabType>('sections');

  // Security & Password change state
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passChangeStatus, setPassChangeStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Tab scrolling ref
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // AI Poetry generator state
  const [aiTone, setAiTone] = useState<'romantic' | 'classic' | 'friendly' | 'religious' | 'minimal'>('romantic');
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState('');

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);

  // Synchronize internal formData whenever modal opens or external data updates
  useEffect(() => {
    if (isOpen) {
      setFormData(data);
    }
  }, [isOpen, data]);

  // Live audio player state inside settings modal
  const [isPlayingInSettings, setIsPlayingInSettings] = useState(false);
  const [activeTrackIdInSettings, setActiveTrackIdInSettings] = useState<string | null>(null);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setIsPlayingInSettings(weddingAudio.getIsPlaying());
      const cur = weddingAudio.getCurrentTrack();
      if (cur) {
        setActiveTrackIdInSettings(cur.id);
      }
    }, 400);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Scroll active tab into view whenever activeTab changes
  useEffect(() => {
    if (!isOpen) return;
    const activeEl = tabsContainerRef.current?.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement | null;
    if (activeEl && tabsContainerRef.current) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab, isOpen]);

  // Lock body scroll and Esc key listener
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleScrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      tabsContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (!isOpen) return null;

  const currentVisibility: SectionVisibility = {
    envelope: formData.sectionVisibility?.envelope ?? true,
    poem: formData.sectionVisibility?.poem ?? true,
    parents: formData.sectionVisibility?.parents ?? true,
    countdown: formData.sectionVisibility?.countdown ?? true,
    dateAndSchedule: formData.sectionVisibility?.dateAndSchedule ?? true,
    timeline: formData.sectionVisibility?.timeline ?? true,
    venueMap: formData.sectionVisibility?.venueMap ?? true,
    weather: formData.sectionVisibility?.weather ?? true,
    loveStory: formData.sectionVisibility?.loveStory ?? true,
    gallery: formData.sectionVisibility?.gallery ?? true,
    giftRegistry: formData.sectionVisibility?.giftRegistry ?? true,
    faqs: formData.sectionVisibility?.faqs ?? true,
    rsvp: formData.sectionVisibility?.rsvp ?? true,
    guestbook: formData.sectionVisibility?.guestbook ?? true,
    calendarAndShare: formData.sectionVisibility?.calendarAndShare ?? true,
    musicPlayer: formData.sectionVisibility?.musicPlayer ?? true
  };

  const handleToggleSection = (key: keyof SectionVisibility) => {
    setFormData((prev) => ({
      ...prev,
      sectionVisibility: {
        ...currentVisibility,
        [key]: !currentVisibility[key]
      }
    }));
  };

  const handleToggleAllSections = (enable: boolean) => {
    const updated: SectionVisibility = {
      envelope: enable,
      poem: enable,
      parents: enable,
      countdown: enable,
      dateAndSchedule: enable,
      timeline: enable,
      venueMap: enable,
      weather: enable,
      loveStory: enable,
      gallery: enable,
      giftRegistry: enable,
      faqs: enable,
      rsvp: enable,
      guestbook: enable,
      calendarAndShare: enable,
      musicPlayer: enable
    };
    setFormData((prev) => ({
      ...prev,
      sectionVisibility: updated
    }));
  };

  const activeSectionsCount = Object.values(currentVisibility).filter(Boolean).length;
  const totalSectionsCount = Object.keys(currentVisibility).length;

  // File upload helper
  const handleUploadFile = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Data = reader.result as string;
            const res = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileName: file.name,
                fileType: file.type,
                fileData: base64Data
              })
            });
            const result = await res.json();
            if (result.success && result.url) {
              resolve(result.url);
            } else {
              alert('خطا در ذخیره‌سازی فایل');
              resolve(null);
            }
          } catch {
            alert('خطا در ارتباط با سرور آپلود');
            resolve(null);
          } finally {
            setIsUploading(false);
          }
        };
        reader.onerror = () => {
          setIsUploading(false);
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    } catch {
      setIsUploading(false);
      return null;
    }
  };

  const handleAiGenerate = async () => {
    setIsGeneratingAi(true);
    setAiError('');

    try {
      const res = await fetch('/api/gemini/generate-wedding-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brideName: formData.brideName,
          groomName: formData.groomName,
          tone: aiTone,
          customNote: aiCustomPrompt
        })
      });

      const resData = await res.json();
      if (resData.success && resData.data) {
        setFormData((prev) => ({
          ...prev,
          invitationTitle: resData.data.title || prev.invitationTitle,
          poem: {
            verse1: resData.data.poemVerse1 || prev.poem.verse1,
            verse2: resData.data.poemVerse2 || prev.poem.verse2,
            poet: resData.data.poet || prev.poem.poet
          },
          invitationBody: resData.data.invitationBody || prev.invitationBody
        }));
      } else {
        setAiError('خطا در دریافت متن از هوش مصنوعی');
      }
    } catch {
      setAiError('خطا در برقراری ارتباط با سرویس هوش مصنوعی');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleApplySamplePoem = (poemItem: typeof SAMPLE_POEMS[0]) => {
    setFormData((prev) => ({
      ...prev,
      poem: {
        verse1: poemItem.verse1,
        verse2: poemItem.verse2,
        poet: poemItem.poet
      }
    }));
  };

  const handleAddTimelineItem = () => {
    const newItem: TimelineItem = {
      id: `t-${Date.now()}`,
      time: '۲۰:۰۰',
      title: 'بخش جدید مراسم',
      description: 'توضیحات کوتاه این مرحله',
      icon: 'sparkles'
    };
    setFormData((prev) => ({
      ...prev,
      timeline: [...prev.timeline, newItem]
    }));
  };

  const handleRemoveTimelineItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      timeline: prev.timeline.filter((t) => t.id !== id)
    }));
  };

  const handleAddMilestone = () => {
    const newM: LoveStoryMilestone = {
      id: `m-${Date.now()}`,
      year: '۱۴۰۳',
      date: 'تاریخ رویداد',
      title: 'رویداد خاطره‌انگیز',
      description: 'داستان کوتاهی از این اتفاق زیبا بنویسید...',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80'
    };
    setFormData((prev) => ({
      ...prev,
      loveStory: [...(prev.loveStory || []), newM]
    }));
  };

  const handleRemoveMilestone = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      loveStory: (prev.loveStory || []).filter((m) => m.id !== id)
    }));
  };

  const handleLoveStoryUploadImage = async (idx: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await handleUploadFile(file);
    if (url) {
      const updated = [...(formData.loveStory || [])];
      if (updated[idx]) {
        updated[idx].imageUrl = url;
        updated[idx].image = url;
      }
      setFormData((prev) => ({
        ...prev,
        loveStory: updated
      }));
    }
  };

  const handleAddGalleryPhoto = () => {
    const newP: GalleryPhoto = {
      id: `p-${Date.now()}`,
      url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop&q=80',
      caption: 'عکسی دیگر از خاطرات شیرین'
    };
    setFormData((prev) => ({
      ...prev,
      gallery: [...(prev.gallery || []), newP]
    }));
  };

  const handleRemoveGalleryPhoto = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      gallery: (prev.gallery || []).filter((p) => p.id !== id)
    }));
  };

  const handleGalleryUploadNew = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await handleUploadFile(file);
    if (url) {
      const newP: GalleryPhoto = {
        id: `p-${Date.now()}`,
        url,
        caption: file.name.replace(/\.[^/.]+$/, '')
      };
      setFormData((prev) => ({
        ...prev,
        gallery: [...(prev.gallery || []), newP]
      }));
    }
  };

  const handleGalleryUploadReplace = async (idx: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await handleUploadFile(file);
    if (url) {
      const updated = [...(formData.gallery || [])];
      updated[idx].url = url;
      setFormData((prev) => ({ ...prev, gallery: updated }));
    }
  };

  // Music Playlist Handlers & Settings Player Helpers
  const defaultPresetTracks: MusicTrack[] = [
    {
      id: 'track-1',
      title: formData.music?.title || 'پیانوی رمانتیک و دلنشین',
      artist: formData.music?.artist || 'نوای پیانو و سنتور',
      synthPreset: formData.music?.synthPreset || 'romantic_piano',
      isPreset: !formData.music?.audioUrl,
      audioUrl: formData.music?.audioUrl || '',
      url: formData.music?.audioUrl || ''
    },
    {
      id: 'track-2',
      title: 'نوای سنتور و عود سنتی ایرانی',
      artist: 'دستگاه اصفهان و شور اصیل',
      synthPreset: 'traditional_oud',
      isPreset: true
    },
    {
      id: 'track-3',
      title: 'چنگ و هارپ آسمانی و رویایی',
      artist: 'ملودی ملایم پیوند فرخنده',
      synthPreset: 'celestial_harp',
      isPreset: true
    },
    {
      id: 'track-4',
      title: 'گیتار آکوستیک ملایم و عاشقانه',
      artist: 'ملودی دلنواز و آرام',
      synthPreset: 'gentle_acoustic',
      isPreset: true
    }
  ];

  const getEffectiveTracks = (): MusicTrack[] => {
    if (formData.music?.playlist && formData.music.playlist.length > 0) {
      return formData.music.playlist;
    }
    if (formData.music?.tracks && formData.music.tracks.length > 0) {
      return formData.music.tracks;
    }
    return defaultPresetTracks;
  };

  const updateTracksState = (newTracks: MusicTrack[]) => {
    const firstTrack = newTracks[0] || defaultPresetTracks[0];
    setFormData((prev) => ({
      ...prev,
      music: {
        ...prev.music,
        title: firstTrack.title,
        artist: firstTrack.artist || 'موزیک عروسی',
        audioUrl: firstTrack.audioUrl || firstTrack.url || '',
        synthPreset: firstTrack.synthPreset || 'romantic_piano',
        playlist: newTracks,
        tracks: newTracks
      }
    }));
  };

  const handleUpdateTrackItem = (idx: number, fields: Partial<MusicTrack>) => {
    const current = getEffectiveTracks();
    const updated = [...current];
    if (updated[idx]) {
      updated[idx] = { ...updated[idx], ...fields };
    }
    updateTracksState(updated);
  };

  const handleAddNewTrack = () => {
    const current = getEffectiveTracks();
    const newTrack: MusicTrack = {
      id: `track-${Date.now()}`,
      title: `موزیک شماره ${current.length + 1}`,
      artist: 'هنرمند یا نوازنده دلخواه',
      synthPreset: 'romantic_piano',
      isPreset: true
    };
    updateTracksState([...current, newTrack]);
  };

  const handleRemoveTrackItem = (id: string) => {
    const current = getEffectiveTracks();
    if (current.length <= 1) {
      alert('حداقل یک موزیک در لیست پخش باید باقی بماند.');
      return;
    }
    const updated = current.filter((t) => t.id !== id);
    updateTracksState(updated);
  };

  const handlePlayTrackInModal = (track: MusicTrack, idx: number) => {
    const isThisTrackPlaying = isPlayingInSettings && activeTrackIdInSettings === track.id;
    if (isThisTrackPlaying) {
      weddingAudio.stop();
      setIsPlayingInSettings(false);
    } else {
      weddingAudio.stop();
      weddingAudio.setVolume(formData.music.volume ?? 0.8);

      const tracks = getEffectiveTracks();
      const onEnded = () => {
        const nextIdx = (idx + 1) % tracks.length;
        handlePlayTrackInModal(tracks[nextIdx], nextIdx);
      };

      weddingAudio.playTrack(track, onEnded);
      setActiveTrackIdInSettings(track.id);
      setIsPlayingInSettings(true);
    }
  };

  const handleNextTrackInModal = () => {
    const tracks = getEffectiveTracks();
    let currentIdx = tracks.findIndex((t) => t.id === activeTrackIdInSettings);
    if (currentIdx === -1) currentIdx = 0;
    const nextIdx = (currentIdx + 1) % tracks.length;
    handlePlayTrackInModal(tracks[nextIdx], nextIdx);
  };

  const handlePrevTrackInModal = () => {
    const tracks = getEffectiveTracks();
    let currentIdx = tracks.findIndex((t) => t.id === activeTrackIdInSettings);
    if (currentIdx === -1) currentIdx = 0;
    const prevIdx = (currentIdx - 1 + tracks.length) % tracks.length;
    handlePlayTrackInModal(tracks[prevIdx], prevIdx);
  };

  const handleUploadAudioForPlaylistTrack = async (idx: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await handleUploadFile(file);
    if (url) {
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      const current = getEffectiveTracks();
      const updated = [...current];
      if (updated[idx]) {
        updated[idx] = {
          ...updated[idx],
          title: updated[idx].title && updated[idx].title !== 'موزیک شماره ' + (idx + 1) ? updated[idx].title : fileName,
          audioUrl: url,
          url: url,
          isPreset: false
        };
      }
      updateTracksState(updated);
    }
  };

  const handleAddFAQ = () => {
    const newF: FAQItem = {
      id: `f-${Date.now()}`,
      question: 'پرسش جدید مهمانان؟',
      answer: 'پاسخ و راهنمای کامل برای مهمانان گرامی.'
    };
    setFormData((prev) => ({
      ...prev,
      faqs: [...(prev.faqs || []), newF]
    }));
  };

  const handleRemoveFAQ = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      faqs: (prev.faqs || []).filter((f) => f.id !== id)
    }));
  };

  const handleExportJson = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(formData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `wedding-config-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.brideName) {
          setFormData(parsed);
          alert('تنظیمات با موفقیت بازیابی شد.');
        }
      } catch {
        alert('فایل JSON معتبر نیست.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDefault = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'بازنشانی به تنظیمات پیش‌فرض کارخانه',
      message: 'آیا از بازنشانی به تنظیمات پیش‌فرض کارخانه اطمینان دارید؟ تمامی تاییده‌های حضور مهمانان (RSVP) و پیام‌های دفترچه یادبود پاکسازی شده و یک نسخه پشتیبان دانلود می‌گردد.',
      onConfirm: async () => {
        try {
          // 1. Send backup to server FIRST before clearing anything
          try {
            await fetch('/api/backup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                formData,
                reason: 'Factory Reset'
              })
            });
          } catch (err) {
            console.warn('Server backup fetch error:', err);
          }

          // 2. Take automatic client browser backup download
          const backupData = JSON.stringify(formData, null, 2);
          const jsonBlob = new Blob([backupData], { type: 'application/json;charset=utf-8;' });
          const url = URL.createObjectURL(jsonBlob);
          const downloadAnchor = document.createElement('a');
          const timeStamp = new Date().toISOString().slice(0, 10);
          downloadAnchor.setAttribute('href', url);
          downloadAnchor.setAttribute('download', `wedding-backup-before-reset-${timeStamp}.json`);
          document.body.appendChild(downloadAnchor);
          downloadAnchor.click();
          document.body.removeChild(downloadAnchor);
          URL.revokeObjectURL(url);

          // Save a local storage backup as well
          localStorage.setItem('wedding_card_backup_before_reset', backupData);

          // 3. Reset RSVPs and Guestbook store to default initial seed
          await Promise.allSettled([
            fetch('/api/rsvp/reset?mode=seed', { method: 'POST' }),
            fetch('/api/guestbook/reset?mode=seed', { method: 'POST' })
          ]);

          // 4. Reset form state and notify parent app
          setFormData(DEFAULT_WEDDING_DATA);
          onSave(DEFAULT_WEDDING_DATA);
          localStorage.setItem('wedding_card_data', JSON.stringify(DEFAULT_WEDDING_DATA));

          // 5. Trigger global event so active components re-fetch/clear their lists
          window.dispatchEvent(new CustomEvent('wedding_data_reset'));
        } catch (error) {
          console.error('Error during factory reset:', error);
          setFormData(DEFAULT_WEDDING_DATA);
          onSave(DEFAULT_WEDDING_DATA);
        }
      }
    });
  };

  const handleChangeAdminPassword = async (e: FormEvent) => {
    e.preventDefault();
    setPassChangeStatus(null);

    const normCurrent = normalizeDigits(currentPasswordInput);
    const normNew = normalizeDigits(newPasswordInput);
    const normConfirm = normalizeDigits(confirmPasswordInput);

    if (!normCurrent) {
      setPassChangeStatus({ type: 'error', message: 'لطفاً رمز عبور فعلی را وارد نمایید.' });
      return;
    }

    const currentActual = formData.adminPin || '1404';
    const isCurrentValid = await verifyPasswordSecurely(normCurrent, currentActual);
    if (!isCurrentValid) {
      setPassChangeStatus({ type: 'error', message: 'رمز عبور فعلی نادرست است.' });
      return;
    }

    if (normNew.length < 4) {
      setPassChangeStatus({ type: 'error', message: 'رمز عبور جدید باید حداقل دارای ۴ کاراکتر یا رقم باشد.' });
      return;
    }

    if (normNew !== normConfirm) {
      setPassChangeStatus({ type: 'error', message: 'تکرار رمز عبور جدید با رمز جدید همخوانی ندارد.' });
      return;
    }

    // Update formData with the new password
    setFormData((prev) => ({
      ...prev,
      adminPin: normNew
    }));

    setPassChangeStatus({ type: 'success', message: 'رمز عبور مدیریت با موفقیت تغییر یافت. برای ثبت نهایی دکمه ذخیره را بزنید.' });
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
  };

  const handleSaveAndClose = () => {
    onSave(formData);
    onClose();
  };

  // Section items metadata list for the Switcher
  const SECTION_SWITCHES = [
    {
      key: 'envelope' as keyof SectionVisibility,
      title: 'پاکت، انیمیشن باز شدن و مهر موم',
      desc: 'صفحه اولیه پاکت نامه با موم و نام مهمان',
      icon: Eye,
      targetTab: 'theme' as TabType
    },
    {
      key: 'poem' as keyof SectionVisibility,
      title: 'بیت شعر و گیومه خوشامدگویی',
      desc: 'بیت آغازین حافظ، سعدی، مولانا یا شعر سفارشی',
      icon: BookOpen,
      targetTab: 'text_ai' as TabType
    },
    {
      key: 'parents' as keyof SectionVisibility,
      title: 'اسامی والدین و خانواده‌ها',
      desc: 'خانواده‌های محترم عروس و داماد',
      icon: Users,
      targetTab: 'basics' as TabType
    },
    {
      key: 'countdown' as keyof SectionVisibility,
      title: 'شمارش معکوس زنده تا روز جشن',
      desc: 'تایمر دیجیتال روز، ساعت، دقیقه و ثانیه',
      icon: Clock,
      targetTab: 'basics' as TabType
    },
    {
      key: 'dateAndSchedule' as keyof SectionVisibility,
      title: 'باکس تاریخ شمسی، میلادی و ساعت',
      desc: 'نشان تقویم لوکس با روز هفته و بازه ساعت',
      icon: Calendar,
      targetTab: 'basics' as TabType
    },
    {
      key: 'timeline' as keyof SectionVisibility,
      title: 'کنداکتور و برنامه زمان‌بندی روز جشن',
      desc: 'ساعات ورود، عقد، صرف شام و پایکوبی',
      icon: Sparkles,
      targetTab: 'timeline' as TabType
    },
    {
      key: 'venueMap' as keyof SectionVisibility,
      title: 'تالار، آدرس و دکمه‌های اسنپ و مسیریابی',
      desc: 'لینک‌های مستقیم اسنپ، بلد، نشان، گوگل مپ و ویز',
      icon: MapPin,
      targetTab: 'venue' as TabType
    },
    {
      key: 'weather' as keyof SectionVisibility,
      title: 'پیش‌بینی آب‌وهوا و ساعت عکاسی طلایی',
      desc: 'دمای تخمینی تالار و غروب آفتاب',
      icon: Sun,
      targetTab: 'gift_faq' as TabType
    },
    {
      key: 'loveStory' as keyof SectionVisibility,
      title: 'تایم‌لاین داستان آشنایی (Love Story)',
      desc: 'خط زمانی رویدادهای عاشقانه و تصاویر خاطره‌انگیز',
      icon: Heart,
      targetTab: 'story' as TabType
    },
    {
      key: 'gallery' as keyof SectionVisibility,
      title: 'آلبوم و گالری عکس‌های عروس و داماد',
      desc: 'امکان آپلود عکس یا درج لینک با لایت‌باکس تمام‌صفحه',
      icon: ImageIcon,
      targetTab: 'gallery' as TabType
    },
    {
      key: 'giftRegistry' as keyof SectionVisibility,
      title: 'کارت هدیه و شادباش نقدی',
      desc: 'کپی آسان شماره کارت بانکی و شبا',
      icon: Gift,
      targetTab: 'gift_faq' as TabType
    },
    {
      key: 'faqs' as keyof SectionVisibility,
      title: 'پرسش‌های متداول و راهنمای مهمانان',
      desc: 'آکاردئون پاسخ به سوالات پارکینگ، اقامت و ورود',
      icon: HelpCircle,
      targetTab: 'gift_faq' as TabType
    },
    {
      key: 'rsvp' as keyof SectionVisibility,
      title: 'فرم ثبت و اعلام حضور (RSVP)',
      desc: 'مهلت پاسخ، تعداد نفرات بیش از ۶ نفر و دریافت شماره',
      icon: CheckCircle2,
      targetTab: 'music_rsvp' as TabType
    },
    {
      key: 'guestbook' as keyof SectionVisibility,
      title: 'دفتر یادبود دیجیتال و تبریکات',
      desc: 'امکان ثبت پیام یادگاری، دود کردن اسپند و گل',
      icon: Heart,
      targetTab: 'basics' as TabType
    },
    {
      key: 'musicPlayer' as keyof SectionVisibility,
      title: 'پخش‌کننده موزیک و پلی‌لیست عروسی',
      desc: 'مدیریت لیست آهنگ، آپلود فایل صوتی، ولوم و سینت',
      icon: Music,
      targetTab: 'music_rsvp' as TabType
    },
    {
      key: 'calendarAndShare' as keyof SectionVisibility,
      title: 'دکمه‌های اشتراک و تقویم ICS',
      desc: 'افزودن به تقویم، واتساپ، تلگرام و کپی لینک',
      icon: Share2,
      targetTab: 'basics' as TabType
    }
  ];

  return typeof document !== 'undefined'
    ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-stone-900/60 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-[#FFFDF7] border border-amber-300/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] text-stone-900"
          >
            {/* Modal Top Header */}
            <div className="p-4 sm:p-5 border-b border-amber-200/80 bg-[#FAF6ED] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300">
                  <Sliders className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-amber-950 font-amiri">
                    استودیو مدیریت و شخصی‌سازی کارت عروسی
                  </h2>
                  <p className="text-xs text-stone-600">
                    شخصی‌سازی اشعار، تم، استایل کلی، پلی‌لیست، گالری، اسنپ و فرم تایید حضور
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-stone-900 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs with Smooth Horizontal Scrolling & Controls */}
            <div className="relative border-b border-amber-200/80 bg-[#FAF6ED]/70 flex items-center px-1">
              {/* Scroll Right Button (RTL Prev) */}
              <button
                type="button"
                onClick={() => handleScrollTabs('right')}
                className="p-2 text-stone-500 hover:text-amber-900 hover:bg-amber-100/80 rounded-xl transition-colors cursor-pointer shrink-0 hidden sm:flex items-center justify-center"
                title="اسکرول به راست"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Scrollable Tabs Row */}
              <div
                ref={tabsContainerRef}
                className="flex-1 py-2.5 px-2 flex items-center gap-1.5 overflow-x-auto text-xs scroll-smooth no-scrollbar touch-pan-x"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <button
                  type="button"
                  data-tab="sections"
                  onClick={() => setActiveTab('sections')}
                  className={`shrink-0 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer select-none font-medium ${
                    activeTab === 'sections'
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                      : 'text-stone-700 hover:bg-amber-100 hover:text-stone-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>سوئیچ بخش‌ها ({activeSectionsCount}/{totalSectionsCount})</span>
                </button>

                <button
                  type="button"
                  data-tab="envelope"
                  onClick={() => setActiveTab('envelope')}
                  className={`shrink-0 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer select-none font-medium ${
                    activeTab === 'envelope' ? 'bg-amber-500 text-stone-950 font-bold shadow-md' : 'text-stone-700 hover:bg-amber-100 hover:text-stone-900'
                  }`}
                >
                  <MailOpen className="w-3.5 h-3.5 text-amber-800" />
                  <span>تم و دکمه پاکت اولیه</span>
                </button>

                <button
                  type="button"
                  data-tab="basics"
                  onClick={() => setActiveTab('basics')}
                  className={`shrink-0 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer select-none font-medium ${
                    activeTab === 'basics' ? 'bg-amber-500 text-stone-950 font-bold shadow-md' : 'text-stone-700 hover:bg-amber-100 hover:text-stone-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>مشخصات و تاریخ</span>
                </button>

                <button
                  type="button"
                  data-tab="text_ai"
                  onClick={() => setActiveTab('text_ai')}
                  className={`shrink-0 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer select-none font-medium ${
                    activeTab === 'text_ai' ? 'bg-amber-500 text-stone-950 font-bold shadow-md' : 'text-stone-700 hover:bg-amber-100 hover:text-stone-900'
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>شعر و هوش مصنوعی</span>
                </button>

                <button
                  type="button"
                  data-tab="story"
                  onClick={() => setActiveTab('story')}
                  className={`shrink-0 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer select-none font-medium ${
                    activeTab === 'story' ? 'bg-amber-500 text-stone-950 font-bold shadow-md' : 'text-stone-700 hover:bg-amber-100 hover:text-stone-900'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>داستان عشق</span>
                </button>

                <button
                  type="button"
                  data-tab="gallery"
                  onClick={() => setActiveTab('gallery')}
                  className={`shrink-0 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer select-none font-medium ${
                    activeTab === 'gallery' ? 'bg-amber-500 text-stone-950 font-bold shadow-md' : 'text-stone-700 hover:bg-amber-100 hover:text-stone-900'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>گالری عکس</span>
                </button>

                <button
                  type="button"
                  data-tab="timeline"
                  onClick={() => setActiveTab('timeline')}
                  className={`shrink-0 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer select-none font-medium ${
                    activeTab === 'timeline' ? 'bg-amber-500 text-stone-950 font-bold shadow-md' : 'text-stone-700 hover:bg-amber-100 hover:text-stone-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>کنداکتور</span>
                </button>

                <button
                  type="button"
                  data-tab="venue"
                  onClick={() => setActiveTab('venue')}
                  className={`shrink-0 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer select-none font-medium ${
                    activeTab === 'venue' ? 'bg-amber-500 text-stone-950 font-bold shadow-md' : 'text-stone-700 hover:bg-amber-100 hover:text-stone-900'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>تالار، نقشه و اسنپ</span>
                </button>

                <button
                  type="button"
                  data-tab="gift_faq"
                  onClick={() => setActiveTab('gift_faq')}
                  className={`shrink-0 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer select-none font-medium ${
                    activeTab === 'gift_faq' ? 'bg-amber-500 text-stone-950 font-bold shadow-md' : 'text-stone-700 hover:bg-amber-100 hover:text-stone-900'
                  }`}
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>هدیه، هوا و راهنما</span>
                </button>

                <button
                  type="button"
                  data-tab="music_rsvp"
                  onClick={() => setActiveTab('music_rsvp')}
                  className={`shrink-0 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer select-none font-medium ${
                    activeTab === 'music_rsvp' ? 'bg-amber-500 text-stone-950 font-bold shadow-md' : 'text-stone-700 hover:bg-amber-100 hover:text-stone-900'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>پلی‌لیست و فرم RSVP</span>
                </button>

                <button
                  type="button"
                  data-tab="security"
                  onClick={() => setActiveTab('security')}
                  className={`shrink-0 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer select-none font-medium ${
                    activeTab === 'security' ? 'bg-amber-500 text-stone-950 font-bold shadow-md' : 'text-stone-700 hover:bg-amber-100 hover:text-stone-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>امنیت و رمز عبور</span>
                </button>

                <button
                  type="button"
                  data-tab="backup"
                  onClick={() => setActiveTab('backup')}
                  className={`shrink-0 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer select-none font-medium ${
                    activeTab === 'backup' ? 'bg-amber-500 text-stone-950 font-bold shadow-md' : 'text-stone-700 hover:bg-amber-100 hover:text-stone-900'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>پشتیبان‌گیری</span>
                </button>
              </div>

              {/* Scroll Left Button (RTL Next) */}
              <button
                type="button"
                onClick={() => handleScrollTabs('left')}
                className="p-2 text-stone-500 hover:text-amber-900 hover:bg-amber-100/80 rounded-xl transition-colors cursor-pointer shrink-0 hidden sm:flex items-center justify-center"
                title="اسکرول به چپ"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 max-h-[calc(92vh-140px)]">

          {/* TAB 0: MASTER SECTION SWITCHER & VISIBILITY DASHBOARD */}
          {activeTab === 'sections' && (
            <div className="space-y-6">
              {/* Header and Quick Actions */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-amber-950 font-amiri flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-700" />
                    مدیریت و سوئیچ بخش‌های کارت دعوت
                  </h3>
                  <p className="text-xs text-stone-600 mt-0.5">
                    هر بخشی که تمایل دارید در کارت به مهمانان نمایش داده شود را روشن و در غیر این‌صورت خاموش نمایید.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleAllSections(true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-900 text-xs font-bold cursor-pointer transition-colors"
                  >
                    فعال‌سازی همه
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAllSections(false)}
                    className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 text-xs cursor-pointer transition-colors"
                  >
                    غیرفعال‌سازی همه
                  </button>
                </div>
              </div>

              {/* Sections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {SECTION_SWITCHES.map((item) => {
                  const isEnabled = currentVisibility[item.key];
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.key}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isEnabled
                          ? 'bg-amber-50/50 border-amber-300 shadow-sm'
                          : 'bg-stone-50/80 border-stone-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-xl border mt-0.5 shrink-0 ${
                            isEnabled
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-stone-100 text-stone-400 border-stone-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-stone-900">{item.title}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                isEnabled
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-stone-200 text-stone-600'
                              }`}
                            >
                              {isEnabled ? 'فعال' : 'غیرفعال'}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 mt-0.5">{item.desc}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setActiveTab(item.targetTab)}
                          className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 text-[11px] cursor-pointer transition-colors border border-stone-200"
                          title="ویرایش مستقیم این بخش"
                        >
                          ویرایش
                        </button>

                        {/* Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleSection(item.key)}
                          className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                            isEnabled ? 'bg-amber-500 justify-end' : 'bg-stone-300 justify-start'
                          }`}
                        >
                          <motion.div
                            layout
                            className="w-4 h-4 rounded-full shadow-md bg-white"
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: ENVELOPE THEMES & WAX SEAL CUSTOMIZATION */}
          {activeTab === 'envelope' && (
            <div className="space-y-6">
              {/* Header Info Banner */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
                    <MailOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-950 font-amiri">
                      تنظیمات پاکت و مهر و موم مومین (مهر دایره‌ای دوحلقه)
                    </h3>
                    <p className="text-xs text-stone-600">
                      شخصی‌سازی رنگ کاغذ پاکت، رنگ مهر و موم دایره‌ای، روبان تزئینی و متن راهنمای بازگشایی
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Interactive Envelope Mini-Preview */}
              <div className="p-5 rounded-3xl border border-amber-300 bg-gradient-to-b from-[#FFFDF7] via-[#FAF6ED] to-amber-50/50 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 font-amiri flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    پیش‌نمایش زنده پاکت و دکمه مهر و موم:
                  </span>
                  <span className="text-[11px] text-stone-500 font-mono">
                    {formData.brideName} & {formData.groomName}
                  </span>
                </div>

                {/* Preview Envelope Container */}
                <div className="relative w-full max-w-sm mx-auto p-4 rounded-2xl border border-amber-400/60 shadow-md bg-white flex flex-col items-center justify-center text-center overflow-hidden">
                  {/* Ribbon Overlay */}
                  {formData.waxSeal.ribbonStyle !== 'none' && (
                    <div className={`absolute w-full h-6 -z-0 ${
                      formData.waxSeal.ribbonStyle === 'satin_red'
                        ? 'bg-gradient-to-r from-red-700/40 via-rose-500/60 to-red-700/40 border-y border-rose-400/50'
                        : formData.waxSeal.ribbonStyle === 'emerald_velvet'
                        ? 'bg-gradient-to-r from-emerald-800/40 via-emerald-600/60 to-emerald-800/40 border-y border-emerald-400/50'
                        : formData.waxSeal.ribbonStyle === 'royal_navy'
                        ? 'bg-gradient-to-r from-sky-800/40 via-blue-600/60 to-sky-800/40 border-y border-sky-400/50'
                        : 'bg-gradient-to-r from-amber-600/30 via-amber-400/50 to-amber-600/30 border-y border-amber-400/50'
                    }`} />
                  )}

                  {/* Circular Wax Seal Button Preview with Live Icon */}
                  <div className={`relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 flex flex-col items-center justify-center p-1 shadow-lg ${
                    formData.waxSeal.color === 'gold'
                      ? 'bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 text-amber-950 border-amber-300'
                      : formData.waxSeal.color === 'emerald'
                      ? 'bg-gradient-to-br from-emerald-600 via-emerald-800 to-emerald-950 text-emerald-100 border-emerald-400'
                      : formData.waxSeal.color === 'navy'
                      ? 'bg-gradient-to-br from-sky-600 via-blue-800 to-slate-950 text-sky-100 border-sky-400'
                      : formData.waxSeal.color === 'black'
                      ? 'bg-gradient-to-br from-stone-700 via-stone-900 to-black text-stone-200 border-stone-600'
                      : formData.waxSeal.color === 'silver'
                      ? 'bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 text-slate-950 border-slate-200'
                      : formData.waxSeal.color === 'burgundy'
                      ? 'bg-gradient-to-br from-rose-900 via-red-950 to-black text-rose-100 border-rose-600'
                      : formData.waxSeal.color === 'rose_gold'
                      ? 'bg-gradient-to-br from-rose-300 via-rose-500 to-amber-600 text-rose-950 border-rose-300'
                      : 'bg-gradient-to-br from-red-600 via-rose-800 to-red-950 text-red-100 border-rose-400'
                  }`}>
                    <div className="w-full h-full rounded-full border border-white/40 flex flex-col items-center justify-center p-0.5 shadow-inner">
                      {formData.waxSeal.iconType === 'monogram' ? (
                        <span className="font-cinzel text-xs font-bold tracking-wider leading-none">
                          {formData.waxSeal.monogram || 'P & N'}
                        </span>
                      ) : formData.waxSeal.iconType === 'heart' ? (
                        <Heart className="w-5 h-5 fill-current" />
                      ) : formData.waxSeal.iconType === 'crown' ? (
                        <Crown className="w-5 h-5 fill-current" />
                      ) : formData.waxSeal.iconType === 'floral' ? (
                        <Flower2 className="w-5 h-5 stroke-[2]" />
                      ) : formData.waxSeal.iconType === 'bird' ? (
                        <Bird className="w-5 h-5 stroke-[2]" />
                      ) : (
                        <div className="flex items-center -space-x-1.5 my-auto drop-shadow-md">
                          <div className="w-4 h-4 rounded-full border-[2px] border-current relative flex items-center justify-center shrink-0">
                            <div className="absolute -top-0.5 w-1 h-1 rounded-full bg-white shadow-xs" />
                          </div>
                          <div className="w-4 h-4 rounded-full border-[2px] border-current relative flex items-center justify-center shrink-0">
                            <div className="absolute -top-0.5 w-1 h-1 rounded-full bg-white shadow-xs" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-stone-900 font-bold mt-2 z-10 font-vazir">
                    {formData.waxSeal.sealText || 'بازگشایی دعوت‌نامه'}
                  </p>
                  <p className="text-[11px] text-amber-800 font-medium z-10">
                    {formData.waxSeal.guideText || 'برای گشودن پاکت روی مهر و موم لمس کنید'}
                  </p>
                </div>
              </div>

              {/* 1. Wax Seal Symbol / Icon */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
                <label className="block text-xs font-bold text-stone-900">
                  ۱. نماد یا طرح داخل مهر و موم (Wax Seal Icon):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'rings', name: 'دو حلقه الماس‌نشان (پیش‌فرض)', icon: '💍' },
                    { id: 'monogram', name: 'حروف اول اسامی (Monogram)', icon: '🔤' },
                    { id: 'heart', name: 'قلب عاشقانه', icon: '❤️' },
                    { id: 'crown', name: 'تاج شاهانه و ملکی', icon: '👑' },
                    { id: 'floral', name: 'گل شکوفه بهاری', icon: '🌸' },
                    { id: 'bird', name: 'پرنده مهر و وصال', icon: '🕊️' }
                  ].map((iconItem) => {
                    const isSelected = (formData.waxSeal.iconType || 'rings') === iconItem.id;
                    return (
                      <button
                        key={iconItem.id}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            waxSeal: { ...formData.waxSeal, iconType: iconItem.id as any }
                          })
                        }
                        className={`p-2.5 rounded-xl border text-xs text-right transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-100 border-amber-500 font-bold text-amber-950 ring-1 ring-amber-500'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{iconItem.icon}</span>
                          <span>{iconItem.name}</span>
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {formData.waxSeal.iconType === 'monogram' && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      متن مونوگرام اسامی انگلیسی (نمایش در مهر):
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={formData.waxSeal.monogram || 'P & N'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          waxSeal: { ...formData.waxSeal, monogram: e.target.value }
                        })
                      }
                      placeholder="P & N"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* 2. Wax Seal Color */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
                <label className="block text-xs font-bold text-stone-900">
                  ۲. رنگ مهر و موم مومین (Wax Color):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'gold', name: 'طلایی درخشان', bg: 'bg-gradient-to-r from-amber-400 to-amber-600 text-stone-950' },
                    { id: 'red', name: 'قرمز کلاسیک', bg: 'bg-gradient-to-r from-red-600 to-rose-800 text-white' },
                    { id: 'emerald', name: 'سبز زمردی', bg: 'bg-gradient-to-r from-emerald-600 to-emerald-800 text-white' },
                    { id: 'navy', name: 'سرمه‌ای ملکی', bg: 'bg-gradient-to-r from-blue-700 to-sky-900 text-white' },
                    { id: 'burgundy', name: 'زرشکی و یاقوتی', bg: 'bg-gradient-to-r from-rose-900 to-red-950 text-white' },
                    { id: 'rose_gold', name: 'رزگلد رومانتیک', bg: 'bg-gradient-to-r from-rose-400 to-amber-500 text-stone-950' },
                    { id: 'silver', name: 'نقره‌ای شیک', bg: 'bg-gradient-to-r from-slate-300 to-slate-500 text-slate-950' },
                    { id: 'black', name: 'مشکی مدرن', bg: 'bg-gradient-to-r from-stone-800 to-black text-stone-100' }
                  ].map((colorItem) => {
                    const isSelected = formData.waxSeal.color === colorItem.id;
                    return (
                      <button
                        key={colorItem.id}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            waxSeal: { ...formData.waxSeal, color: colorItem.id as any }
                          })
                        }
                        className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between gap-2 ${colorItem.bg} ${
                          isSelected ? 'ring-2 ring-stone-900 shadow-md scale-105' : 'opacity-90 hover:opacity-100'
                        }`}
                      >
                        <span className="text-xs font-bold">{colorItem.name}</span>
                        {isSelected && <Check className="w-4 h-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Ribbon Overlay Style */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
                <label className="block text-xs font-bold text-stone-900">
                  ۳. طرح نوار و روبان تزئینی پاکت:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'gold_cross', name: 'روبان طلایی متقاطع' },
                    { id: 'satin_red', name: 'روبان ساتن قرمز' },
                    { id: 'emerald_velvet', name: 'روبان مخمل زمردی' },
                    { id: 'royal_navy', name: 'روبان آبی سلطنتی' },
                    { id: 'none', name: 'بدون روبان (ساده)' }
                  ].map((ribbonItem) => {
                    const isSelected = (formData.waxSeal.ribbonStyle || 'gold_cross') === ribbonItem.id;
                    return (
                      <button
                        key={ribbonItem.id}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            waxSeal: { ...formData.waxSeal, ribbonStyle: ribbonItem.id as any }
                          })
                        }
                        className={`p-2.5 rounded-xl border text-xs text-right transition-all cursor-pointer flex items-center justify-between ${
                          isSelected ? 'bg-amber-100 border-amber-500 font-bold text-amber-950' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <span>{ribbonItem.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Button Text and Guidance */}
              <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
                <label className="block text-xs font-bold text-stone-900">
                  ۴. متون دکمه و راهنمای بازگشایی کارت:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-stone-600 mb-1">عنوان دکمه بازگشایی:</label>
                    <input
                      type="text"
                      value={formData.waxSeal.sealText || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          waxSeal: { ...formData.waxSeal, sealText: e.target.value }
                        })
                      }
                      placeholder="بازگشایی دعوت‌نامه"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-600 mb-1">متن راهنمای زیر دکمه:</label>
                    <input
                      type="text"
                      value={formData.waxSeal.guideText || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          waxSeal: { ...formData.waxSeal, guideText: e.target.value }
                        })
                      }
                      placeholder="برای گشودن پاکت روی مهر و موم لمس کنید"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: BASIC INFORMATION & DATES */}
          {activeTab === 'basics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bride Name */}
                <div>
                  <label className="block text-xs text-stone-700 font-semibold mb-1">نام عروس خانم:</label>
                  <input
                    type="text"
                    value={formData.brideName}
                    onChange={(e) => setFormData({ ...formData, brideName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-300 text-stone-900 text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="نگار"
                  />
                </div>

                {/* Groom Name */}
                <div>
                  <label className="block text-xs text-stone-700 font-semibold mb-1">نام آقا داماد:</label>
                  <input
                    type="text"
                    value={formData.groomName}
                    onChange={(e) => setFormData({ ...formData, groomName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-300 text-stone-900 text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="پارسا"
                  />
                </div>

                {/* Bride Family */}
                <div>
                  <label className="block text-xs text-stone-700 font-semibold mb-1">نام خانواده عروس:</label>
                  <input
                    type="text"
                    value={formData.brideFamily}
                    onChange={(e) => setFormData({ ...formData, brideFamily: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-300 text-stone-900 text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="صادقی و اسفندیاری"
                  />
                </div>

                {/* Groom Family */}
                <div>
                  <label className="block text-xs text-stone-700 font-semibold mb-1">نام خانواده داماد:</label>
                  <input
                    type="text"
                    value={formData.groomFamily}
                    onChange={(e) => setFormData({ ...formData, groomFamily: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-300 text-stone-900 text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="رحیمی و کاظمی"
                  />
                </div>
              </div>

              {/* Title statement */}
              <div>
                <label className="block text-xs text-stone-700 font-semibold mb-1">عنوان سربرگ دعوت‌نامه:</label>
                <input
                  type="text"
                  value={formData.invitationTitle}
                  onChange={(e) => setFormData({ ...formData, invitationTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-300 text-stone-900 text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="به نام پیوند دهنده جان‌ها و دل‌ها"
                />
              </div>

              {/* Solar Persian Date Details */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-300 space-y-3">
                <span className="text-xs text-amber-950 font-bold block">تاریخ و زمان برگزاری جشن</span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-stone-600 mb-1">روز هفته:</label>
                    <input
                      type="text"
                      value={formData.solarDate.dayOfWeek}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          solarDate: { ...formData.solarDate, dayOfWeek: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-600 mb-1">روز ماه:</label>
                    <input
                      type="text"
                      value={formData.solarDate.day}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          solarDate: { ...formData.solarDate, day: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-600 mb-1">ماه:</label>
                    <input
                      type="text"
                      value={formData.solarDate.month}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          solarDate: { ...formData.solarDate, month: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-600 mb-1">سال خورشیدی:</label>
                    <input
                      type="text"
                      value={formData.solarDate.year}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          solarDate: { ...formData.solarDate, year: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs text-stone-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] text-stone-600 mb-1">ساعت برگزاری (نمایش متنی):</label>
                    <input
                      type="text"
                      value={formData.eventTime}
                      onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                      placeholder="۱۹:۰۰ الی ۲۴:۰۰"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-600 mb-1">تاریخ میلادی دقیق (برای تایمر معکوس):</label>
                    <input
                      type="datetime-local"
                      value={formData.gregorianDate.slice(0, 16)}
                      onChange={(e) => setFormData({ ...formData, gregorianDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs text-stone-900"
                    />
                  </div>
                </div>
              </div>

              {/* Admin Security PIN Notice */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                    <Lock className="w-4 h-4 text-amber-700" />
                    <span>امنیت و رمز عبور پنل مدیریت (Admin PIN)</span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                    متمرکز شده در زبانه امنیت
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  تغییر رمز عبور مدیریت برای ارتقای امنیت و تایید رمز فعلی، به صورت متمرکز در زبانه «امنیت و رمز عبور» انجام می‌شود.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <ShieldCheck className="w-4 h-4 text-stone-950" />
                  <span>انتقال به بخش امنیت و تغییر رمز عبور</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: POETRY & AI COPYWRITER */}
          {activeTab === 'text_ai' && (
            <div className="space-y-6">
              {/* AI Generator Panel */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase">
                  <Wand2 className="w-4 h-4 text-amber-700" />
                  <span>دستیار هوشمند سرایش شعر و متن دعوت (Gemini AI)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-stone-700 mb-1 font-semibold">لحن متن و شعر:</label>
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="romantic">عاشقانه و احساسی (Romantic)</option>
                      <option value="classic">کلاسیک و کهن فاخر (Classic Persian)</option>
                      <option value="friendly">صمیمی و پرانرژی (Warm & Friendly)</option>
                      <option value="religious">معنوی و قرآنی (Spiritual)</option>
                      <option value="minimal">مینیمال و مدرن (Modern Minimal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-700 mb-1 font-semibold">یادداشت اختصاصی (اختیاری):</label>
                    <input
                      type="text"
                      value={aiCustomPrompt}
                      onChange={(e) => setAiCustomPrompt(e.target.value)}
                      placeholder="مثلاً: اشاره به فصل بهار و آشنایی در پاییز..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={isGeneratingAi}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isGeneratingAi ? 'در حال سرایش متن هوشمند...' : 'سرایش متن و شعر جدید با هوش مصنوعی'}</span>
                </button>

                {aiError && <p className="text-[11px] text-rose-600">{aiError}</p>}
              </div>

              {/* Classic Persian Sample Poems Archive */}
              <div className="space-y-2">
                <span className="text-xs text-amber-900 font-bold block font-amiri">
                  انتخاب سریع از گنجینه اشعار پارسی (حافظ، سعدی، مولانا، سهراب):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SAMPLE_POEMS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleApplySamplePoem(p)}
                      className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 hover:border-amber-400 text-right cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between text-[11px] text-amber-800 font-bold mb-1">
                        <span>{p.category}</span>
                        <span>{p.poet}</span>
                      </div>
                      <p className="text-xs text-stone-900 font-amiri leading-relaxed">{p.verse1}</p>
                      <p className="text-xs text-stone-900 font-amiri leading-relaxed">{p.verse2}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Poem Inputs */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-300 space-y-3">
                <span className="text-xs text-amber-950 font-bold block">ویرایش مستقیم شعر انتخابی</span>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.poem.verse1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        poem: { ...formData.poem, verse1: e.target.value }
                      })
                    }
                    placeholder="مصرع اول..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs text-stone-900 font-amiri"
                  />
                  <input
                    type="text"
                    value={formData.poem.verse2}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        poem: { ...formData.poem, verse2: e.target.value }
                      })
                    }
                    placeholder="مصرع دوم..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs text-stone-900 font-amiri"
                  />
                  <input
                    type="text"
                    value={formData.poem.poet || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        poem: { ...formData.poem, poet: e.target.value }
                      })
                    }
                    placeholder="نام شاعر (مثلاً: مولانا)"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs text-amber-900 font-bold"
                  />
                </div>
              </div>

              {/* Invitation Body Statement */}
              <div>
                <label className="block text-xs text-stone-700 font-semibold mb-1">متن اصلی دعوت‌نامه:</label>
                <textarea
                  rows={4}
                  value={formData.invitationBody}
                  onChange={(e) => setFormData({ ...formData, invitationBody: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-300 text-stone-900 text-xs leading-relaxed focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 4: LOVE STORY TIMELINE */}
          {activeTab === 'story' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-amber-950 font-amiri">خط زمانی داستان عشق (Love Story)</h3>
                  <p className="text-xs text-stone-600">رویدادهای به‌یادماندنی آشنایی، خواستگاری، نامزدی و وصال.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن خاطره</span>
                </button>
              </div>

              <div className="space-y-4">
                {(formData.loveStory || []).map((m, idx) => (
                  <div key={m.id || idx} className="p-4 rounded-2xl bg-amber-50/60 border border-amber-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900">مرحله {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(m.id)}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-stone-500 hover:text-red-600 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-stone-600 font-medium mb-1">سال / برچسب:</label>
                        <input
                          type="text"
                          value={m.year}
                          onChange={(e) => {
                            const updated = [...(formData.loveStory || [])];
                            updated[idx].year = e.target.value;
                            setFormData({ ...formData, loveStory: updated });
                          }}
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-xs text-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-stone-600 font-medium mb-1">تاریخ دقیق:</label>
                        <input
                          type="text"
                          value={m.date}
                          onChange={(e) => {
                            const updated = [...(formData.loveStory || [])];
                            updated[idx].date = e.target.value;
                            setFormData({ ...formData, loveStory: updated });
                          }}
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-xs text-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-stone-600 font-medium mb-1">عنوان رویداد:</label>
                        <input
                          type="text"
                          value={m.title}
                          onChange={(e) => {
                            const updated = [...(formData.loveStory || [])];
                            updated[idx].title = e.target.value;
                            setFormData({ ...formData, loveStory: updated });
                          }}
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-xs text-stone-900 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-stone-600 font-medium mb-1">شرح خاطره:</label>
                      <textarea
                        rows={2}
                        value={m.description}
                        onChange={(e) => {
                          const updated = [...(formData.loveStory || [])];
                          updated[idx].description = e.target.value;
                          setFormData({ ...formData, loveStory: updated });
                        }}
                        className="w-full px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-xs text-stone-900 leading-relaxed mb-3"
                      />
                    </div>

                    {/* Image Selection / Upload Section for Love Story Milestone */}
                    <div className="pt-2 border-t border-amber-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-amber-700" />
                          <span>تصویر یادگاری این مرحله:</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[11px] cursor-pointer transition-colors shadow-sm">
                            <Upload className="w-3 h-3" />
                            <span>{isUploading ? 'در حال آپلود...' : 'انتخاب / آپلود عکس'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleLoveStoryUploadImage(idx, e)}
                              disabled={isUploading}
                              className="hidden"
                            />
                          </label>
                          {(m.imageUrl || m.image) && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...(formData.loveStory || [])];
                                updated[idx].imageUrl = '';
                                updated[idx].image = '';
                                setFormData({ ...formData, loveStory: updated });
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-[11px] cursor-pointer transition-colors font-medium"
                            >
                              حذف عکس
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Image Preview & URL Input */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-2.5 rounded-xl border border-amber-200">
                        {(m.imageUrl || m.image) ? (
                          <div className="w-20 h-14 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-amber-300 relative group">
                            <img
                              src={m.imageUrl || m.image}
                              alt={m.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-14 rounded-lg bg-stone-50 border border-dashed border-stone-300 flex items-center justify-center shrink-0 text-stone-400 text-[10px]">
                            بدون عکس
                          </div>
                        )}

                        <div className="flex-1 w-full">
                          <input
                            type="text"
                            dir="ltr"
                            placeholder="آدرس اینترنتی عکس (https://...)"
                            value={m.imageUrl || m.image || ''}
                            onChange={(e) => {
                              const updated = [...(formData.loveStory || [])];
                              updated[idx].imageUrl = e.target.value;
                              updated[idx].image = e.target.value;
                              setFormData({ ...formData, loveStory: updated });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-xs text-stone-900 font-vazir focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PHOTO GALLERY WITH DIRECT FILE UPLOAD AND URL */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-amber-950 font-amiri">گالری و آلبوم عکس‌های عروس و داماد</h3>
                  <p className="text-xs text-stone-600">امکان درج لینک اینترنتی یا آپلود مستقیم عکس از روی دستگاه شما.</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer transition-colors shadow-md">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'در حال آپلود...' : 'آپلود عکس جدید'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleGalleryUploadNew}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleAddGalleryPhoto}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 text-xs cursor-pointer transition-colors font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن با لینک</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(formData.gallery || []).map((photo, idx) => (
                  <div key={photo.id || idx} className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-stone-100 border border-amber-300">
                      <img src={photo.url} alt={photo.caption || ''} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryPhoto(photo.id)}
                        className="absolute top-2 left-2 p-1.5 rounded-lg bg-white/90 hover:bg-rose-100 text-rose-700 cursor-pointer shadow-sm transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Replace image file button */}
                      <label className="absolute bottom-2 left-2 p-1.5 rounded-lg bg-white/90 hover:bg-amber-100 text-stone-800 hover:text-amber-900 text-[10px] cursor-pointer flex items-center gap-1 shadow-sm font-bold border border-amber-200">
                        <Upload className="w-3 h-3 text-amber-600" />
                        <span>تعویض فایل</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleGalleryUploadReplace(idx, e)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-[11px] text-stone-600 font-medium mb-1">آدرس اینترنتی یا مسیر فایل (URL):</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={photo.url}
                        onChange={(e) => {
                          const updated = [...(formData.gallery || [])];
                          updated[idx].url = e.target.value;
                          setFormData({ ...formData, gallery: updated });
                        }}
                        className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 font-vazir"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-stone-600 font-medium mb-1">کپشن / عنوان عکس:</label>
                      <input
                        type="text"
                        value={photo.caption || ''}
                        onChange={(e) => {
                          const updated = [...(formData.gallery || [])];
                          updated[idx].caption = e.target.value;
                          setFormData({ ...formData, gallery: updated });
                        }}
                        placeholder="ثبت نگاه‌های عاشقانه..."
                        className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs text-stone-900"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: TIMELINE & CEREMONY SCHEDULE */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-amber-950 font-amiri">کنداکتور و برنامه زمان‌بندی روز جشن</h3>
                  <p className="text-xs text-stone-600">ساعات دقیق ورود مهمانان، مراسم عقد، شام و برش کیک.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddTimelineItem}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن آیتم</span>
                </button>
              </div>

              <div className="space-y-3">
                {formData.timeline.map((item, idx) => (
                  <div key={item.id || idx} className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-300 flex items-start gap-3">
                    <div className="w-24 shrink-0">
                      <label className="block text-[10px] text-stone-600 font-medium mb-1">ساعت:</label>
                      <input
                        type="text"
                        value={item.time}
                        onChange={(e) => {
                          const updated = [...formData.timeline];
                          updated[idx].time = e.target.value;
                          setFormData({ ...formData, timeline: updated });
                        }}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border border-amber-300 text-xs text-amber-900 text-center font-bold"
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div>
                        <label className="block text-[10px] text-stone-600 font-medium mb-1">عنوان برنامه:</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const updated = [...formData.timeline];
                            updated[idx].title = e.target.value;
                            setFormData({ ...formData, timeline: updated });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-xs text-stone-900 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-600 font-medium mb-1">توضیحات کوتاه:</label>
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => {
                            const updated = [...formData.timeline];
                            updated[idx].description = e.target.value;
                            setFormData({ ...formData, timeline: updated });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-xs text-stone-800"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveTimelineItem(item.id)}
                      className="p-2 rounded-lg hover:bg-rose-100 text-stone-400 hover:text-rose-600 cursor-pointer mt-5 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: VENUE & NAVIGATION */}
          {activeTab === 'venue' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-stone-700 font-semibold mb-1">نام باغ تالار / عمارت:</label>
                  <input
                    type="text"
                    value={formData.venue.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        venue: { ...formData.venue, name: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-700 font-semibold mb-1">نام سالن یا بخش اختصاصی:</label>
                  <input
                    type="text"
                    value={formData.venue.hall || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        venue: { ...formData.venue, hall: e.target.value }
                      })
                    }
                    placeholder="سالن رویال و باغ اختصاصی"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-700 font-semibold mb-1">شهر برگزاری:</label>
                  <input
                    type="text"
                    value={formData.venue.city || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        venue: { ...formData.venue, city: e.target.value }
                      })
                    }
                    placeholder="تهران / شیراز"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-stone-700 font-semibold mb-1">آدرس کامل متنی تالار:</label>
                <textarea
                  rows={2}
                  value={formData.venue.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      venue: { ...formData.venue, address: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs text-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-700 font-semibold mb-1">عرض جغرافیایی (Latitude):</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.venue.lat}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        venue: { ...formData.venue, lat: parseFloat(e.target.value) || 0 }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-700 font-semibold mb-1">طول جغرافیایی (Longitude):</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.venue.lng}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        venue: { ...formData.venue, lng: parseFloat(e.target.value) || 0 }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs text-stone-900"
                  />
                </div>
              </div>

              {/* Navigation Links (Google Maps, Neshan, Balad) */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-300 space-y-3">
                <span className="text-xs text-amber-950 font-bold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-700" />
                  لینک‌های مستقیم اپلیکیشن‌های مسیریابی (گوگل مپ، نشان و بلد)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-stone-600 font-medium mb-1">لینک گوگل مپ (Google Maps):</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={formData.venue.googleMapsUrl || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          venue: { ...formData.venue, googleMapsUrl: e.target.value }
                        })
                      }
                      placeholder="https://maps.google.com/..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-600 font-medium mb-1">لینک نشان (Neshan):</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={formData.venue.neshanUrl || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          venue: { ...formData.venue, neshanUrl: e.target.value }
                        })
                      }
                      placeholder="https://nshn.ir/..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-600 font-medium mb-1">لینک بلد (Balad):</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={formData.venue.baladUrl || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          venue: { ...formData.venue, baladUrl: e.target.value }
                        })
                      }
                      placeholder="https://balad.ir/..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: GIFT REGISTRY, WEATHER & FAQS */}
          {activeTab === 'gift_faq' && (
            <div className="space-y-6">
              {/* Gift Registry / Card details */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-300 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-950 font-bold text-xs uppercase">
                    <Gift className="w-4 h-4 text-amber-600" />
                    <span>کارت هدیه و شادباش عروس و داماد</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="registryEnabled"
                      checked={formData.giftRegistry?.enabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          giftRegistry: { ...(formData.giftRegistry || { title: '' }), enabled: e.target.checked }
                        })
                      }
                      className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                    />
                    <label htmlFor="registryEnabled" className="text-xs text-stone-800 font-semibold cursor-pointer">
                      فعال بودن بخش هدیه
                    </label>
                  </div>
                </div>

                {formData.giftRegistry?.enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] text-stone-700 font-medium mb-1">شماره کارت بانکی (۱۶ رقمی):</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={toPersianDigits(formData.giftRegistry.cardNumber || '')}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            giftRegistry: { ...formData.giftRegistry, cardNumber: e.target.value }
                          })
                        }
                        placeholder="6037-9975-..."
                        className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs text-amber-950 font-vazir text-center font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-stone-700 font-medium mb-1">شماره شبا (با IR یا بدون IR):</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={toPersianDigits(formData.giftRegistry.iban || formData.giftRegistry.ibanNumber || '')}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            giftRegistry: { ...formData.giftRegistry, iban: e.target.value, ibanNumber: e.target.value }
                          })
                        }
                        placeholder="IR000000000000000000000000"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 font-vazir text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-stone-700 font-medium mb-1">نام صاحب حساب:</label>
                      <input
                        type="text"
                        value={formData.giftRegistry.holderName || formData.giftRegistry.cardHolder || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            giftRegistry: {
                              ...formData.giftRegistry,
                              holderName: e.target.value,
                              cardHolder: e.target.value
                            }
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-stone-700 font-medium mb-1">نام بانک:</label>
                      <input
                        type="text"
                        value={formData.giftRegistry.bankName || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            giftRegistry: { ...formData.giftRegistry, bankName: e.target.value }
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs text-stone-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Weather Forecast Settings */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-300 space-y-4">
                <div className="flex items-center gap-2 text-amber-950 font-bold text-xs uppercase">
                  <Sun className="w-4 h-4 text-amber-600" />
                  <span>پیش‌بینی آب و هوای روز جشن</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-stone-700 font-medium mb-1">وضعیت جوی:</label>
                    <input
                      type="text"
                      value={formData.weather?.condition || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          weather: {
                            ...(formData.weather || { condition: '' }),
                            condition: e.target.value,
                            enabled: true
                          }
                        })
                      }
                      placeholder="صاف و بهاری"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-700 font-medium mb-1">دمای تخمینی:</label>
                    <input
                      type="text"
                      value={formData.weather?.temp || formData.weather?.temperature || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          weather: {
                            ...(formData.weather || { condition: '' }),
                            temp: e.target.value,
                            temperature: e.target.value,
                            enabled: true
                          }
                        })
                      }
                      placeholder="۲۴°C"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-700 font-medium mb-1">غروب آفتاب / عکاسی طلایی:</label>
                    <input
                      type="text"
                      value={formData.weather?.goldenHour || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          weather: {
                            ...(formData.weather || { condition: '' }),
                            goldenHour: e.target.value,
                            enabled: true
                          }
                        })
                      }
                      placeholder="۱۸:۴۵"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs text-stone-900"
                    />
                  </div>
                </div>
              </div>

              {/* FAQs */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-300 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-950 font-bold text-xs uppercase">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span>پرسش‌های متداول و راهنمای مهمانان</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFAQ}
                    className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن پرسش</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(formData.faqs || []).map((faq, idx) => (
                    <div key={faq.id || idx} className="p-3 rounded-xl bg-white border border-amber-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => {
                            const updated = [...(formData.faqs || [])];
                            updated[idx].question = e.target.value;
                            setFormData({ ...formData, faqs: updated });
                          }}
                          placeholder="سوال مهمان"
                          className="flex-1 px-3 py-1.5 rounded-lg bg-amber-50/50 border border-amber-200 text-xs text-amber-950 font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFAQ(faq.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-100 text-stone-400 hover:text-rose-600 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => {
                          const updated = [...(formData.faqs || [])];
                          updated[idx].answer = e.target.value;
                          setFormData({ ...formData, faqs: updated });
                        }}
                        placeholder="پاسخ"
                        className="w-full px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-900"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: MUSIC & RSVP CONFIG */}
          {activeTab === 'music_rsvp' && (
            <div className="space-y-6">
              {/* Music Player & Playlist Config */}
              <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200/90 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-amber-200/80">
                  <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                    <Music className="w-5 h-5 text-amber-600" />
                    <span>تنظیمات و لیست پخش موزیک پس‌زمینه کارت (Multi-Track Playlist)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="musicEnabled"
                      checked={formData.music.enabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          music: { ...formData.music, enabled: e.target.checked }
                        })
                      }
                      className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                    />
                    <label htmlFor="musicEnabled" className="text-xs font-bold text-amber-950 cursor-pointer">
                      فعال‌سازی پخش موزیک
                    </label>
                  </div>
                </div>

                {formData.music.enabled && (
                  <div className="space-y-6">
                    {/* EMBEDDED INTERACTIVE LIVE AUDIO PLAYER IN SETTINGS */}
                    {(() => {
                      const effectiveTracks = getEffectiveTracks();
                      const playingTrack = effectiveTracks.find((t) => t.id === activeTrackIdInSettings) || effectiveTracks[0];
                      const playingTrackIdx = effectiveTracks.findIndex((t) => t.id === (playingTrack?.id || ''));

                      return (
                        <div className="p-4 rounded-2xl bg-amber-100/80 border border-amber-300 text-stone-900 shadow-sm space-y-3">
                          <div className="flex items-center justify-between text-xs text-amber-950 font-bold border-b border-amber-300/80 pb-2">
                            <div className="flex items-center gap-2">
                              <Radio className={`w-4 h-4 ${isPlayingInSettings ? 'text-emerald-600 animate-pulse' : 'text-amber-700'}`} />
                              <span>پلیر زنده تنظیمات (تست و پیش‌نمایش لحظه‌ای)</span>
                            </div>
                            <span className="text-[11px] text-stone-600">
                              قطعه {toPersianDigits(playingTrackIdx + 1)} از {toPersianDigits(effectiveTracks.length)}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
                            {/* Spinning Disc & Track Info */}
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <div className="relative flex items-center justify-center shrink-0">
                                <Disc className={`w-10 h-10 text-amber-700 ${isPlayingInSettings ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                                {isPlayingInSettings && (
                                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm text-stone-900 truncate">
                                  {playingTrack?.title || 'موزیک انتخاب شده'}
                                </h4>
                                <p className="text-xs text-amber-900/80 truncate font-medium">
                                  {playingTrack?.artist || 'هنرمند و نوازنده'}
                                </p>
                              </div>
                            </div>

                            {/* Player Controls */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={handlePrevTrackInModal}
                                className="p-2 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-amber-200 transition-colors cursor-pointer shadow-sm"
                                title="موزیک قبلی"
                              >
                                <SkipBack className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => playingTrack && handlePlayTrackInModal(playingTrack, playingTrackIdx >= 0 ? playingTrackIdx : 0)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer shadow-md transition-all"
                              >
                                {isPlayingInSettings ? (
                                  <>
                                    <Pause className="w-4 h-4 fill-stone-950" />
                                    <span>توقف</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4 fill-stone-950" />
                                    <span>پخش موزیک</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={handleNextTrackInModal}
                                className="p-2 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-amber-200 transition-colors cursor-pointer shadow-sm"
                                title="موزیک بعدی"
                              >
                                <SkipForward className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Volume & AutoPlay Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-300/80 text-xs text-stone-700">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="autoPlayToggleSettings"
                                checked={formData.music.autoPlay ?? true}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    music: { ...formData.music, autoPlay: e.target.checked }
                                  })
                                }
                                className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                              />
                              <label htmlFor="autoPlayToggleSettings" className="cursor-pointer text-stone-800 font-semibold">
                                پخش خودکار هنگام باز شدن کارت
                              </label>
                            </div>

                            <div className="flex items-center gap-2">
                              <Volume2 className="w-4 h-4 text-amber-700 shrink-0" />
                              <span className="text-stone-800 font-semibold">حجم صدا:</span>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={formData.music.volume ?? 0.8}
                                onChange={(e) => {
                                  const vol = parseFloat(e.target.value);
                                  weddingAudio.setVolume(vol);
                                  setFormData({
                                    ...formData,
                                    music: { ...formData.music, volume: vol }
                                  });
                                }}
                                className="w-24 accent-amber-600 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* PLAYLIST MANAGER SECTION */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-stone-900 font-bold text-xs">
                          <Sliders className="w-4 h-4 text-amber-600" />
                          <span>مدیریت قطعات لیست پخش (تعداد: {toPersianDigits(getEffectiveTracks().length)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddNewTrack}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>افزودن موزیک جدید</span>
                        </button>
                      </div>

                      {/* TRACK CARDS */}
                      <div className="space-y-3.5">
                        {getEffectiveTracks().map((track, idx) => {
                          const isThisPlaying = isPlayingInSettings && activeTrackIdInSettings === track.id;

                          return (
                            <div
                              key={track.id || idx}
                              className={`p-4 rounded-xl border transition-all space-y-3.5 ${
                                isThisPlaying
                                  ? 'bg-amber-100/90 border-amber-500 shadow-md ring-2 ring-amber-400/50'
                                  : 'bg-white/90 border-stone-200'
                              }`}
                            >
                              {/* Track Header & Play Button */}
                              <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                    {toPersianDigits(idx + 1)}
                                  </span>
                                  <span className="font-bold text-xs text-stone-900">
                                    {track.title || `موزیک ${toPersianDigits(idx + 1)}`}
                                  </span>
                                  {isThisPlaying && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold animate-pulse">
                                      در حال پخش...
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Play/Pause Button on each track */}
                                  <button
                                    type="button"
                                    onClick={() => handlePlayTrackInModal(track, idx)}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                      isThisPlaying
                                        ? 'bg-amber-500 text-stone-950 hover:bg-amber-400'
                                        : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                                    }`}
                                  >
                                    {isThisPlaying ? (
                                      <>
                                        <Pause className="w-3.5 h-3.5 fill-stone-950" />
                                        <span>توقف</span>
                                      </>
                                    ) : (
                                      <>
                                        <Play className="w-3.5 h-3.5 fill-amber-800 text-amber-800" />
                                        <span>تست و پخش</span>
                                      </>
                                    )}
                                  </button>

                                  {/* Remove Track */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTrackItem(track.id)}
                                    className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 transition-colors cursor-pointer"
                                    title="حذف موزیک"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Inputs: Title & Artist */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                                    عنوان موزیک:
                                  </label>
                                  <input
                                    type="text"
                                    value={track.title || ''}
                                    onChange={(e) => handleUpdateTrackItem(idx, { title: e.target.value })}
                                    placeholder="مثلاً: آهنگ عاشقانه بی کلام"
                                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-900 font-bold text-xs outline-none focus:ring-2 focus:ring-amber-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                                    خواننده / نوازنده:
                                  </label>
                                  <input
                                    type="text"
                                    value={track.artist || ''}
                                    onChange={(e) => handleUpdateTrackItem(idx, { artist: e.target.value })}
                                    placeholder="مثلاً: همایون شجریان / پیانوی استاد"
                                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-900 text-xs outline-none focus:ring-2 focus:ring-amber-500"
                                  />
                                </div>
                              </div>

                              {/* Source Option Selection */}
                              <div className="space-y-2 pt-1">
                                <label className="block text-[11px] font-bold text-stone-800">
                                  منبع فایل صوتی / ملودی:
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  {/* Option 1: File Upload */}
                                  <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-800 font-bold text-[11px] border border-stone-300 cursor-pointer transition-all">
                                    <Upload className="w-3.5 h-3.5 text-amber-600" />
                                    <span>{isUploading ? 'بارگذاری...' : 'آپلود فایل (MP3)'}</span>
                                    <input
                                      type="file"
                                      accept="audio/*"
                                      onChange={(e) => handleUploadAudioForPlaylistTrack(idx, e)}
                                      disabled={isUploading}
                                      className="hidden"
                                    />
                                  </label>

                                  {/* Option 2: Synth Preset Dropdown */}
                                  <div className="sm:col-span-2">
                                    <select
                                      value={track.synthPreset || 'romantic_piano'}
                                      onChange={(e) =>
                                        handleUpdateTrackItem(idx, {
                                          synthPreset: e.target.value as any,
                                          isPreset: !track.audioUrl && !track.url
                                        })
                                      }
                                      className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-stone-800 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                                    >
                                      <option value="romantic_piano">🎹 ملودی سنتز: پیانوی رمانتیک و دلنشین</option>
                                      <option value="traditional_oud">🪕 ملودی سنتز: سنتور و عود سنتی ایرانی</option>
                                      <option value="celestial_harp">🪘 ملودی سنتز: چنگ و هارپ رویایی</option>
                                      <option value="gentle_acoustic">🎸 ملودی سنتز: گیتار آکوستیک ملایم</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Custom Audio URL field */}
                                <div>
                                  <input
                                    type="text"
                                    dir="ltr"
                                    value={track.audioUrl || track.url || ''}
                                    onChange={(e) =>
                                      handleUpdateTrackItem(idx, {
                                        audioUrl: e.target.value,
                                        url: e.target.value,
                                        isPreset: !e.target.value
                                      })
                                    }
                                    placeholder="یا لینک مستقیم فایل صوتی: https://example.com/song.mp3"
                                    className="w-full px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-300 text-stone-800 font-vazir text-[11px] focus:ring-2 focus:ring-amber-500 outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RSVP Form Config */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-300 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-950 font-bold text-xs uppercase">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <span>تنظیمات فرم تایید حضور (RSVP)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="rsvpConfigEnabled"
                      checked={formData.rsvpConfig.enabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rsvpConfig: { ...formData.rsvpConfig, enabled: e.target.checked }
                        })
                      }
                      className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                    />
                    <label htmlFor="rsvpConfigEnabled" className="text-xs text-stone-800 font-semibold cursor-pointer">
                      فعال بودن سیستم اعلام حضور
                    </label>
                  </div>
                </div>

                {formData.rsvpConfig.enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] text-stone-700 font-medium mb-1">مهلت اعلام حضور (نمایش متنی):</label>
                      <input
                        type="text"
                        value={formData.rsvpConfig.deadlineDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rsvpConfig: { ...formData.rsvpConfig, deadlineDate: e.target.value }
                          })
                        }
                        placeholder="تا ۲۰ شهریور ۱۴۰۴"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-stone-700 font-medium mb-1">حداکثر تعداد همراهان هر کارت:</label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={formData.rsvpConfig.maxGuestsPerParty}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rsvpConfig: { ...formData.rsvpConfig, maxGuestsPerParty: parseInt(e.target.value) || 1 }
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs text-stone-900 font-bold"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="phoneToggle"
                        checked={formData.rsvpConfig.requirePhone ?? true}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rsvpConfig: { ...formData.rsvpConfig, requirePhone: e.target.checked }
                          })
                        }
                        className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                      />
                      <label htmlFor="phoneToggle" className="text-xs text-stone-800 font-medium cursor-pointer">
                        الزامی بودن شماره موبایل مهمان
                      </label>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="dietaryToggle"
                        checked={formData.rsvpConfig.showDietaryOptions}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rsvpConfig: { ...formData.rsvpConfig, showDietaryOptions: e.target.checked }
                          })
                        }
                        className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                      />
                      <label htmlFor="dietaryToggle" className="text-xs text-stone-800 font-medium cursor-pointer">
                        پرسش درباره رژیم غذایی / گیاه‌خواری مهمانان
                      </label>
                    </div>

                    <div className="flex items-center gap-2 pt-2 sm:col-span-2">
                      <input
                        type="checkbox"
                        id="songToggle"
                        checked={formData.rsvpConfig.allowSongRequest ?? true}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rsvpConfig: { ...formData.rsvpConfig, allowSongRequest: e.target.checked }
                          })
                        }
                        className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                      />
                      <label htmlFor="songToggle" className="text-xs text-stone-800 font-medium cursor-pointer">
                        امکان پیشنهاد آهنگ درخواستی برای دی‌جی (Song Request)
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 10: SECURITY & ADMIN PASSWORD */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Change Password Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-200/80 text-amber-900 border border-amber-300">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-950 font-amiri">
                      تغییر رمز عبور ورود به پنل مدیریت
                    </h3>
                    <p className="text-xs text-stone-600">
                      رمز جدید را تعیین کنید تا افراد غیرمجاز امکان دسترسی یا ویرایش کارت را نداشته باشند.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleChangeAdminPassword} className="space-y-4 pt-2">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs text-stone-700 mb-1.5 font-medium">
                      رمز عبور فعلی مدیریت:
                    </label>
                    <div className="relative max-w-md">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        value={currentPasswordInput}
                        data-no-farsi-digits="true"
                        onChange={(e) => setCurrentPasswordInput(e.target.value)}
                        placeholder="رمز عبور فعلی..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs focus:border-amber-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-800 p-1"
                      >
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password & Confirm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                    <div>
                      <label className="block text-xs text-stone-700 mb-1.5 font-medium">
                        رمز عبور جدید (حداقل ۴ کاراکتر یا عدد):
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          value={newPasswordInput}
                          data-no-farsi-digits="true"
                          onChange={(e) => setNewPasswordInput(e.target.value)}
                          placeholder="رمز عبور جدید..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs focus:border-amber-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-800 p-1"
                        >
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-stone-700 mb-1.5 font-medium">
                        تکرار رمز عبور جدید:
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPass ? 'text' : 'password'}
                          value={confirmPasswordInput}
                          data-no-farsi-digits="true"
                          onChange={(e) => setConfirmPasswordInput(e.target.value)}
                          placeholder="تکرار رمز جدید..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs focus:border-amber-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-800 p-1"
                        >
                          {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Status alert */}
                  {passChangeStatus && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 max-w-2xl ${
                        passChangeStatus.type === 'success'
                          ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold'
                          : 'bg-rose-50 border border-rose-300 text-rose-800 font-bold'
                      }`}
                    >
                      {passChangeStatus.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      )}
                      <span>{passChangeStatus.message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer transition-colors shadow-md flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>به‌روزرسانی و ثبت رمز عبور</span>
                  </button>
                </form>
              </div>

              {/* Security Shield & Protection Overview */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
                <h4 className="text-xs font-bold text-stone-800 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>لایه‌های امنیتی فعال در این سامانه:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-amber-200 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-stone-900 block mb-0.5">محافظت در برابر حدس پسورد (Anti Brute-Force)</strong>
                      <span className="text-stone-600 text-[11px] leading-relaxed">
                        پس از ۵ بار تلاش ناموفق، سیستم به صورت خودکار به مدت ۶۰ ثانیه قفل می‌شود.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-amber-200 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-stone-900 block mb-0.5">عدم افشای رمز پیش‌فرض</strong>
                      <span className="text-stone-600 text-[11px] leading-relaxed">
                        نمایش رمز عبور در صفحه ورود مهمانان به طور کامل حذف و غیرقابل دسترس شده است.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-amber-200 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-stone-900 block mb-0.5">پالایش ورودی‌ها و ضد تزریق (Anti-XSS)</strong>
                      <span className="text-stone-600 text-[11px] leading-relaxed">
                        تمام پیام‌های یادبود و فرم‌های تایید حضور فیلتر و کدگذاری می‌شوند.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-amber-200 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-stone-900 block mb-0.5">فیلتر امنیتی فایل‌های آپلودی</strong>
                      <span className="text-stone-600 text-[11px] leading-relaxed">
                        تنها فایل‌های مجاز تصویری و صوتی قابل بارگذاری هستند و پسوندهای خطرناک مسدود می‌شوند.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: BACKUP, RESTORE & FACTORY RESET */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-300 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-amber-950 font-amiri flex items-center gap-2">
                    <Download className="w-4 h-4 text-amber-600" />
                    خروجی گرفتن و پشتیبان‌گیری از تنظیمات (JSON Export)
                  </h3>
                  <p className="text-xs text-stone-600 mt-1">
                    شما می‌توانید تمام اطلاعات کارت، اشعار، تم، تصاویر و تنظیمات را به عنوان یک فایل پشتیبان دریافت نمایید.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>دانلود فایل پشتیبان (JSON)</span>
                  </button>

                  <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 text-xs cursor-pointer transition-colors border border-stone-300 font-semibold shadow-sm">
                    <Upload className="w-4 h-4 text-amber-600" />
                    <span>بارگذاری و بازیابی فایل تنظیمات</span>
                    <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Factory Reset */}
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>بازنشانی به تنظیمات پیش‌فرض کارخانه</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  با فشردن این دکمه، ابتدا یک فایل پشتیبان کامل (JSON) شامل تمامی تنظیمات، تاییده‌های حضور و پیام‌ها در پوشه بکاپ سرور (`/backups`) ذخیره و نسخه فایل آن روی مرورگر شما دانلود می‌گردد. سپس تمامی تاییده‌ها و پیام‌ها پاکسازی شده و کارت دعوت به حالت اولیه بازمی‌گردد.
                </p>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm text-xs cursor-pointer transition-colors font-bold"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-white" />
                  <span>پشتیبان‌گیری و بازنشانی کامل به تنظیمات اولیه</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Sticky Actions */}
        <div className="p-4 sm:p-5 border-t border-amber-200/80 bg-[#FAF6ED] flex items-center justify-between gap-3">
          <div className="text-xs text-stone-600 hidden sm:block">
            بخش‌های فعال: <span className="font-bold text-amber-900 font-cinzel">{activeSectionsCount}</span> از <span className="font-cinzel">{totalSectionsCount}</span> بخش
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 text-xs cursor-pointer transition-colors"
            >
              انصراف
            </button>

            <button
              type="button"
              onClick={handleSaveAndClose}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-[1.01]"
            >
              <Check className="w-4 h-4" />
              <span>ذخیره و اعمال در کارت دعوت</span>
            </button>
          </div>
        </div>

        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        />
      </motion.div>
    </div>,
    document.body
  )
: null;
}
