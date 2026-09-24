import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmButtonClass = 'bg-red-600 hover:bg-red-500' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-falcon-card border border-falcon-border rounded-lg max-w-md w-full p-5 shadow-xl relative animate-in fade-in zoom-in duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-falcon-textMuted hover:text-falcon-textMain"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start space-x-3 mb-4">
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-falcon-textMain font-mono">{title}</h3>
            <p className="text-xs text-falcon-textMuted mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 mt-6 border-t border-falcon-border/60 pt-4">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs font-mono font-medium text-falcon-textMuted hover:text-white bg-falcon-surface border border-falcon-border hover:border-falcon-borderLight transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-3 py-1.5 rounded text-xs font-mono font-semibold text-white transition-colors ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
