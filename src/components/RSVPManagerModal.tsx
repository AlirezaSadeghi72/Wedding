import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X, Users, CheckCircle, XCircle, Search, Download, RefreshCw, MessageSquare, Phone } from 'lucide-react';
import { RSVPResponse } from '../types';
import { toPersianDigits } from '../utils/dateUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function RSVPManagerModal({ isOpen, onClose }: Props) {
  const [rsvps, setRsvps] = useState<RSVPResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'yes' | 'no'>('all');
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    if (isOpen) {
      fetchRSVPs();
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

  const totalAttending = rsvps.filter((r) => r.attending === 'yes');
  const totalDeclined = rsvps.filter((r) => r.attending === 'no');
  const totalGuestCount = totalAttending.reduce((acc, curr) => acc + (curr.guestCount || 1), 0);

  const filtered = rsvps.filter((item) => {
    const matchesSearch = item.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.phone && item.phone.includes(searchTerm));
    const matchesStatus = filterStatus === 'all' || item.attending === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ['نام مهمان', 'وضعیت حضور', 'تعداد نفرات', 'شماره تماس', 'رژیم غذایی', 'یادداشت تبریک', 'زمان ثبت'];
    const rows = filtered.map((r) => [
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl bg-stone-900 border border-amber-500/40 text-stone-100 shadow-2xl flex flex-col overflow-hidden"
          >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-amiri text-amber-100">
                مدیریت لیست مهمانان و تایید حضورها (RSVP)
              </h2>
              <p className="text-xs text-stone-400">
                مشاهده آمار دقیق حاضرین، تعداد نفرات و یادداشت‌های مهمانان
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 p-4 sm:p-6 bg-stone-950/40 border-b border-stone-800 text-center">
          {/* Confirmed Guests */}
          <div className="p-3 sm:p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40">
            <span className="text-[11px] text-emerald-300 block mb-1">مجموع حاضرین قطعی</span>
            <span className="text-xl sm:text-3xl font-bold font-cinzel text-emerald-400">
              {toPersianDigits(totalGuestCount)} <span className="text-xs font-vazir">نفر</span>
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5 font-light">
              در قالب {toPersianDigits(totalAttending.length)} خانواده / کارت
            </span>
          </div>

          {/* Declined */}
          <div className="p-3 sm:p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40">
            <span className="text-[11px] text-rose-300 block mb-1">عذرخواهی و عدم حضور</span>
            <span className="text-xl sm:text-3xl font-bold font-cinzel text-rose-400">
              {toPersianDigits(totalDeclined.length)} <span className="text-xs font-vazir">مورد</span>
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5 font-light">
              اعلام عدم امکان شرکت
            </span>
          </div>

          {/* Total Responses */}
          <div className="p-3 sm:p-4 rounded-2xl bg-stone-900 border border-stone-700">
            <span className="text-[11px] text-stone-300 block mb-1">کل پاسخ‌های دریافتی</span>
            <span className="text-xl sm:text-3xl font-bold font-cinzel text-amber-400">
              {toPersianDigits(rsvps.length)}
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5 font-light">
              پاسخ ثبت شده آنلاین
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 sm:px-6 bg-stone-900 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-stone-800">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی نام مهمان یا تلفن..."
              className="w-full pr-9 pl-3 py-1.5 rounded-xl bg-stone-950 border border-stone-700 text-xs text-stone-100 placeholder:text-stone-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterStatus === 'all' ? 'bg-stone-800 text-white font-semibold' : 'text-stone-400'
                }`}
              >
                همه ({toPersianDigits(rsvps.length)})
              </button>
              <button
                onClick={() => setFilterStatus('yes')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterStatus === 'yes' ? 'bg-emerald-900 text-emerald-200 font-semibold' : 'text-stone-400'
                }`}
              >
                حاضرین ({toPersianDigits(totalAttending.length)})
              </button>
              <button
                onClick={() => setFilterStatus('no')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterStatus === 'no' ? 'bg-rose-900 text-rose-200 font-semibold' : 'text-stone-400'
                }`}
              >
                غائبین ({toPersianDigits(totalDeclined.length)})
              </button>
            </div>

            <button
              onClick={exportToCSV}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>خروجی اکسل / CSV</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-stone-500 text-sm">
              هیچ پاسخی با این مشخصات یافت نشد.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.attending === 'yes'
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-rose-950/20 border-rose-500/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          item.attending === 'yes' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {item.attending === 'yes' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </div>

                      <span className="font-bold text-sm text-stone-100 font-amiri">
                        {item.guestName}
                      </span>

                      {item.attending === 'yes' && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                          {toPersianDigits(item.guestCount || 1)} نفر
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-stone-400">
                      {item.phone && (
                        <span className="flex items-center gap-1 font-mono text-stone-300" dir="ltr">
                          <Phone className="w-3 h-3 text-amber-400" />
                          {item.phone}
                        </span>
                      )}
                      <span>{new Date(item.submittedAt).toLocaleDateString('fa-IR')}</span>
                    </div>
                  </div>

                  {/* Notes & Wishes */}
                  {(item.message || item.dietaryNotes) && (
                    <div className="pt-2 mt-2 border-t border-stone-800/60 text-xs space-y-1">
                      {item.dietaryNotes && (
                        <p className="text-amber-300/80">
                          <span className="font-semibold text-stone-400">رژیم غذایی: </span>
                          {item.dietaryNotes}
                        </p>
                      )}
                      {item.message && (
                        <p className="text-stone-300 font-light flex items-start gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
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

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <button
            onClick={fetchRSVPs}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>به‌روزرسانی لیست</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
: null;
}
