import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2, Info } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'warning' | 'info'
  requireMatch = null, // e.g. 'DELETE ALL'
  matchPlaceholder = 'Type confirmation text...',
  isLoading = false,
}) {
  const [matchInput, setMatchInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMatchInput('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isMatchValid = !requireMatch || matchInput.trim().toUpperCase() === requireMatch.trim().toUpperCase();

  const handleConfirmClick = () => {
    if (!isMatchValid || isLoading) return;
    onConfirm();
  };

  const getIconAndColors = () => {
    switch (type) {
      case 'warning':
        return {
          icon: AlertTriangle,
          badgeBg: 'bg-amber-100 text-amber-700 border-amber-200',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-400',
        };
      case 'info':
        return {
          icon: Info,
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          btnBg: 'bg-green hover:bg-green-dark text-white focus:ring-green',
        };
      case 'danger':
      default:
        return {
          icon: Trash2,
          badgeBg: 'bg-red-100 text-red-600 border-red-200',
          btnBg: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-400',
        };
    }
  };

  const { icon: ModalIcon, badgeBg, btnBg } = getIconAndColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => !isLoading && onClose()}
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-border text-center z-10 animate-scale-up space-y-5">
        {/* Close Icon */}
        {!isLoading && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-muted hover:text-black hover:bg-cream transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Top Icon Badge */}
        <div
          className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border shadow-xs ${badgeBg}`}
        >
          <ModalIcon className="w-7 h-7" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="font-serif text-2xl font-bold text-[#1C1C1C]">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-muted font-sans leading-relaxed">
            {message}
          </p>
        </div>

        {/* Required Confirmation Input (if any) */}
        {requireMatch && (
          <div className="space-y-1.5 text-left bg-cream p-3.5 rounded-2xl border border-border">
            <label className="block text-[11px] font-bold text-[#444] uppercase tracking-wider">
              Type <span className="text-red-600 font-mono font-bold">{requireMatch}</span> to confirm:
            </label>
            <input
              type="text"
              value={matchInput}
              onChange={(e) => setMatchInput(e.target.value)}
              placeholder={matchPlaceholder}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-xs font-mono text-[#1C1C1C] focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl border border-border bg-cream hover:bg-border text-[#444] text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={!isMatchValid || isLoading}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 cursor-pointer ${btnBg}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
