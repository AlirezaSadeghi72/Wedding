import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title = 'تایید عملیات',
  message,
  confirmText = 'بله، حذف شود',
  cancelText = 'انصراف',
  isDanger = true,
  onConfirm,
  onClose
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          className="w-full max-w-sm rounded-3xl bg-[#FFFDF7] border border-amber-200 shadow-2xl overflow-hidden p-6 text-stone-900"
          dir="rtl"
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-200/60">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl ${isDanger ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}`}>
                {isDanger ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <h3 className="font-bold text-base font-amiri text-stone-900">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-stone-700 leading-relaxed my-4">
            {message}
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
                isDanger
                  ? 'bg-rose-600 hover:bg-rose-700 active:scale-95'
                  : 'bg-amber-600 hover:bg-amber-700 active:scale-95'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
