import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmPhrase?: string; // If provided, user must type this exact text
  confirmButtonText?: string;
  isDestructive?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  isLoading?: boolean;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  title,
  description,
  confirmPhrase,
  confirmButtonText = 'Confirmar Operación',
  isDestructive = false,
  onConfirm,
  onClose,
  isLoading = false
}) => {
  const [typedPhrase, setTypedPhrase] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const requiresTyping = Boolean(confirmPhrase);
  const isTypingValid = !requiresTyping || typedPhrase.trim().toUpperCase() === confirmPhrase?.toUpperCase();

  const handleConfirm = async () => {
    if (!isTypingValid) {
      setError(`Debes escribir exactamente "${confirmPhrase}" para continuar.`);
      return;
    }
    setError(null);
    await onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className={`p-5 flex items-start gap-3 border-b ${isDestructive ? 'bg-rose-50/70 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
          <div className={`p-2.5 rounded-xl shrink-0 ${isDestructive ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
            {isDestructive ? <ShieldAlert className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{description}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Validation */}
        <div className="p-5 space-y-4">
          {requiresTyping && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Para confirmar, escribe <span className="font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-bold">{confirmPhrase}</span>:
              </label>
              <input
                type="text"
                value={typedPhrase}
                onChange={(e) => {
                  setTypedPhrase(e.target.value);
                  setError(null);
                }}
                placeholder={confirmPhrase}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-mono"
                autoFocus
              />
              {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isTypingValid || isLoading}
              className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isDestructive
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {isLoading ? 'Procesando...' : confirmButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
