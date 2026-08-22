import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { 
  X, Users, CheckCircle, XCircle, Search, Download, RefreshCw, MessageSquare, Phone, Trash2, Heart
} from 'lucide-react';
import { RSVPResponse, GuestbookEntry } from '../types';
import { toPersianDigits } from '../utils/dateUtils';
import ConfirmModal from './ConfirmModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function RSVPManagerModal({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'rsvp' | 'guestbook'>('rsvp');
  const [rsvps, setRsvps] = useState<RSVPResponse[]>([]);
  const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'yes' | 'no'>('all');
  const [isLoading, setIsLoading] = useState(false);

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

  const fetchRSVPs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/rsvp');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRsvps(data.data);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGuestbook = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/guestbook');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setGuestbookEntries(data.data);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllData = () => {
    fetchRSVPs();
    fetchGuestbook();
  };

  useEffect(() => {
    const handleReset = () => {
      loadAllData();
    };
    window.addEventListener('wedding_data_reset', handleReset);
    return () => window.removeEventListener('wedding_data_reset', handleReset);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadAllData();
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';

      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);

      return () => {
        document.body.style.overflow = originalStyle;
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // RSVP stats
  const totalAttending = rsvps.filter((r) => r.attending === 'yes');
  const totalDeclined = rsvps.filter((r) => r.attending === 'no');
  const totalGuestCount = totalAttending.reduce((acc, curr) => acc + (curr.guestCount || 1), 0);

  // Filtered RSVPs
  const filteredRSVPs = rsvps.filter((item) => {
    const matchesSearch = item.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.phone && item.phone.includes(searchTerm));
    const matchesStatus = filterStatus === 'all' || item.attending === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Filtered Guestbook Entries
  const filteredGuestbook = guestbookEntries.filter((item) => {
    return item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.message.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Delete single RSVP item
  const handleDeleteRSVP = (id: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'حذف تاییدیه حضور',
      message: `آیا از حذف تاییدیه حضور "${name}" اطمینان دارید؟`,
      onConfirm: async () => {
        try {
          setIsLoading(true);
          setRsvps((prev) => prev.filter((r) => r.id !== id));
          const encodedId = encodeURIComponent(id);
          const res = await fetch(`/api/rsvp/${encodedId}`, { method: 'DELETE' });
          if (!res.ok) {
            await fetch(`/api/rsvp/${encodedId}/delete`, { method: 'POST' });
          }
          window.dispatchEvent(new CustomEvent('wedding_data_reset'));
        } catch {
          fetchRSVPs();
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // Clear all RSVPs
  const handleClearAllRSVPs = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'پاکسازی تمامی تاییده‌ها',
      message: 'آیا مطمئنید که می‌خواهید تمامی تاییده‌های حضور مهمانان را پاکسازی کنید؟ این عمل غیرقابل بازگشت است.',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          setRsvps([]);
          await Promise.allSettled([
            fetch('/api/rsvp', { method: 'DELETE' }),
            fetch('/api/rsvp/reset', { method: 'POST' })
          ]);
          window.dispatchEvent(new CustomEvent('wedding_data_reset'));
        } catch {
          fetchRSVPs();
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // Delete single Guestbook entry
  const handleDeleteGuestbookEntry = (id: string, author: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'حذف پیام یادبود',
      message: `آیا از حذف نظر ثبت‌شده توسط "${author}" اطمینان دارید؟`,
      onConfirm: async () => {
        try {
          setIsLoading(true);
          setGuestbookEntries((prev) => prev.filter((g) => g.id !== id));
          const encodedId = encodeURIComponent(id);
          const res = await fetch(`/api/guestbook/${encodedId}`, { method: 'DELETE' });
          if (!res.ok) {
            await fetch(`/api/guestbook/${encodedId}/delete`, { method: 'POST' });
          }
          window.dispatchEvent(new CustomEvent('wedding_data_reset'));
        } catch {
          fetchGuestbook();
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // Clear all Guestbook entries
  const handleClearAllGuestbookEntries = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'پاکسازی تمامی پیام‌های یادبود',
      message: 'آیا مطمئنید که می‌خواهید تمامی نظرات دفترچه یادبود را پاکسازی کنید؟ این عمل غیرقابل بازگشت است.',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          setGuestbookEntries([]);
          await Promise.allSettled([
            fetch('/api/guestbook', { method: 'DELETE' }),
            fetch('/api/guestbook/reset', { method: 'POST' })
          ]);
          window.dispatchEvent(new CustomEvent('wedding_data_reset'));
        } catch {
          fetchGuestbook();
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const exportToCSV = () => {
    const headers = ['نام مهمان', 'وضعیت حضور', 'تعداد نفرات', 'شماره تماس', 'رژیم غذایی', 'یادداشت تبریک', 'زمان ثبت'];
    const rows = filteredRSVPs.map((r) => [
      `"${r.guestName}"`,
      r.attending === 'yes' ? '"حضور قطعی"' : '"عدم حضور"',
      r.attending === 'yes' ? r.guestCount : 0,
      `"${r.phone || ''}"`,
      `"${r.dietaryNotes || ''}"`,
      `"${(r.message || '').replace(/"/g, '""')}"`,
      `"${new Date(r.submittedAt).toLocaleDateString('fa-IR')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `wedding-rsvp-list-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return typeof document !== 'undefined'
    ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-stone-900/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl bg-[#FFFDF7] border border-amber-300/80 text-stone-900 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-amber-200/80 flex items-center justify-between bg-[#FAF6ED]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <Users className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold font-amiri text-amber-950">
                    مدیریت مهمانان، تایید حضورها و نظرات
                  </h2>
                  <p className="text-xs text-stone-600">
                    مدیریت و حذف تاییده‌های RSVP و پیام‌های دفترچه یادبود
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 bg-[#FAF6ED] border-b border-amber-200">
              <button
                onClick={() => setActiveTab('rsvp')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border-b-2 ${
                  activeTab === 'rsvp'
                    ? 'bg-white border-amber-600 text-amber-950 shadow-sm'
                    : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-amber-100/50'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span>تاییده‌های حضور (RSVP)</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {toPersianDigits(rsvps.length)}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('guestbook')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border-b-2 ${
                  activeTab === 'guestbook'
                    ? 'bg-white border-amber-600 text-amber-950 shadow-sm'
                    : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-amber-100/50'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-amber-600" />
                <span>دفترچه یادبود و نظرات</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  {toPersianDigits(guestbookEntries.length)}
                </span>
              </button>
            </div>

            {/* TAB 1: RSVP MANAGEMENT */}
            {activeTab === 'rsvp' && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 p-4 sm:p-6 bg-amber-50/40 border-b border-amber-200/80 text-center">
                  <div className="p-3 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-300">
                    <span className="text-[11px] text-emerald-800 font-medium block mb-1">مجموع حاضرین قطعی</span>
                    <span className="text-xl sm:text-3xl font-bold font-cinzel text-emerald-700">
                      {toPersianDigits(totalGuestCount)} <span className="text-xs font-vazir">نفر</span>
                    </span>
                    <span className="text-[10px] text-stone-600 block mt-0.5 font-light">
                      در قالب {toPersianDigits(totalAttending.length)} خانواده / کارت
                    </span>
                  </div>

                  <div className="p-3 sm:p-4 rounded-2xl bg-rose-50 border border-rose-300">
                    <span className="text-[11px] text-rose-800 font-medium block mb-1">عذرخواهی و عدم حضور</span>
                    <span className="text-xl sm:text-3xl font-bold font-cinzel text-rose-700">
                      {toPersianDigits(totalDeclined.length)} <span className="text-xs font-vazir">مورد</span>
                    </span>
                    <span className="text-[10px] text-stone-600 block mt-0.5 font-light">
                      اعلام عدم امکان شرکت
                    </span>
                  </div>

                  <div className="p-3 sm:p-4 rounded-2xl bg-white border border-amber-200 shadow-sm">
                    <span className="text-[11px] text-stone-700 font-medium block mb-1">کل پاسخ‌های دریافتی</span>
                    <span className="text-xl sm:text-3xl font-bold font-cinzel text-amber-800">
                      {toPersianDigits(rsvps.length)}
                    </span>
                    <span className="text-[10px] text-stone-600 block mt-0.5 font-light">
                      پاسخ ثبت شده آنلاین
                    </span>
                  </div>
                </div>

                {/* Filter & Actions Bar */}
                <div className="p-4 sm:px-6 bg-[#FAF6ED] flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-amber-200/80">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="جستجوی نام مهمان یا تلفن..."
                      className="w-full pr-9 pl-3 py-1.5 rounded-xl bg-white border border-amber-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-amber-200 text-xs shadow-sm">
                      <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          filterStatus === 'all' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        همه ({toPersianDigits(rsvps.length)})
                      </button>
                      <button
                        onClick={() => setFilterStatus('yes')}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          filterStatus === 'yes' ? 'bg-emerald-600 text-white font-bold' : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        حاضرین ({toPersianDigits(totalAttending.length)})
                      </button>
                      <button
                        onClick={() => setFilterStatus('no')}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          filterStatus === 'no' ? 'bg-rose-600 text-white font-bold' : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        غائبین ({toPersianDigits(totalDeclined.length)})
                      </button>
                    </div>

                    <button
                      onClick={exportToCSV}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>خروجی CSV</span>
                    </button>

                    {rsvps.length > 0 && (
                      <button
                        onClick={handleClearAllRSVPs}
                        className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                        title="حذف کلیه تاییده‌های حضور"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>پاکسازی همه</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                  {filteredRSVPs.length === 0 ? (
                    <div className="py-12 text-center text-stone-500 text-sm">
                      هیچ پاسخی با این مشخصات یافت نشد.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredRSVPs.map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            item.attending === 'yes'
                              ? 'bg-emerald-50/50 border-emerald-300'
                              : 'bg-rose-50/50 border-rose-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                  item.attending === 'yes' ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                                }`}
                              >
                                {item.attending === 'yes' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                              </div>

                              <span className="font-bold text-sm text-stone-900 font-amiri">
                                {item.guestName}
                              </span>

                              {item.attending === 'yes' && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold">
                                  {toPersianDigits(item.guestCount || 1)} نفر
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-stone-500">
                              {item.phone && (
                                <span className="flex items-center gap-1 font-mono text-stone-700 font-semibold" dir="ltr">
                                  <Phone className="w-3 h-3 text-amber-700" />
                                  {item.phone}
                                </span>
                              )}
                              <span>{new Date(item.submittedAt).toLocaleDateString('fa-IR')}</span>

                              <button
                                onClick={() => handleDeleteRSVP(item.id, item.guestName)}
                                className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-300 transition-colors cursor-pointer mr-2"
                                title="حذف این تاییدیه"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {(item.message || item.dietaryNotes) && (
                            <div className="pt-2 mt-2 border-t border-amber-200/60 text-xs space-y-1">
                              {item.dietaryNotes && (
                                <p className="text-amber-900">
                                  <span className="font-semibold text-stone-600">رژیم غذایی: </span>
                                  {item.dietaryNotes}
                                </p>
                              )}
                              {item.message && (
                                <p className="text-stone-700 font-medium flex items-start gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                                  <span>{item.message}</span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* TAB 2: GUESTBOOK MANAGEMENT */}
            {activeTab === 'guestbook' && (
              <>
                {/* Search & Actions Bar */}
                <div className="p-4 sm:px-6 bg-[#FAF6ED] flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-amber-200/80">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="جستجوی نویسنده یا متن پیام..."
                      className="w-full pr-9 pl-3 py-1.5 rounded-xl bg-white border border-amber-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {guestbookEntries.length > 0 && (
                      <button
                        onClick={handleClearAllGuestbookEntries}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>پاکسازی تمامی نظرات</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                  {filteredGuestbook.length === 0 ? (
                    <div className="py-12 text-center text-stone-500 text-sm">
                      هیچ پیام یادبودی ثبت نشده یا با این عبارت یافت نگردید.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredGuestbook.map((entry) => (
                        <div
                          key={entry.id}
                          className="p-4 rounded-2xl bg-white border border-amber-200 shadow-sm flex flex-col justify-between gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center text-xs font-bold font-amiri">
                                {entry.author.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-sm text-stone-900 font-amiri block">
                                  {entry.author}
                                </span>
                                <span className="text-[10px] text-stone-500 block">
                                  {entry.date}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteGuestbookEntry(entry.id, entry.author)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 text-xs font-bold transition-colors cursor-pointer"
                              title="حذف این نظر"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>حذف</span>
                            </button>
                          </div>

                          <p className="text-xs text-stone-800 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-100/80">
                            {entry.message}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-stone-500 pt-1">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                              {toPersianDigits(entry.likes || 0)}
                            </span>
                            <span className="flex items-center gap-1">
                              <span>🌹</span>
                              {toPersianDigits(entry.flowers || 0)}
                            </span>
                            <span className="flex items-center gap-1">
                              <span>🧿</span>
                              {toPersianDigits(entry.esfand || 0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-amber-200/80 bg-[#FAF6ED] flex items-center justify-between">
              <button
                onClick={loadAllData}
                className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-amber-800 transition-colors cursor-pointer font-medium"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${isLoading ? 'animate-spin' : ''}`} />
                <span>به‌روزرسانی اطلاعات</span>
              </button>

              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-sm cursor-pointer transition-colors"
              >
                بستن پنجره
              </button>
            </div>
          </motion.div>

          <ConfirmModal
            isOpen={confirmConfig.isOpen}
            title={confirmConfig.title}
            message={confirmConfig.message}
            onConfirm={confirmConfig.onConfirm}
            onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
          />
        </div>,
        document.body
      )
    : null;
}
