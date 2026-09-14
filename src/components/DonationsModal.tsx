import React, { useState } from 'react';
import { Heart, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { useOlaSocial } from '../context/OlaSocialContext';

interface DonationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DonationsModal: React.FC<DonationsModalProps> = ({ isOpen, onClose }) => {
  const { makeDonation } = useOlaSocial();

  const [selectedAmount, setSelectedAmount] = useState<number>(5);
  const [donorName, setDonorName] = useState('');
  const [donorMessage, setDonorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    makeDonation(selectedAmount, donorName || 'Amigo de OLA SOCIAL', donorMessage);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 text-lg"
        >
          ✕
        </button>

        {isSuccess ? (
          <div className="text-center py-6 sm:py-8 space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">¡Muchísimas Gracias!</h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Tu aporte voluntario mantiene a OLA SOCIAL independiente, rápida y protegida de la manipulación algorítmica.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2.5 mb-2 pr-6">
              <div className="w-9 h-9 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                <Heart className="w-5 h-5 fill-rose-500" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Apoyar a OLA SOCIAL</h3>
                <p className="text-[11px] sm:text-xs text-slate-500">Donación comunitaria voluntaria</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-900">Transparencia: </span>
              El uso del servicio básico es gratuito. Esta donación voluntaria <strong>NO</strong> otorga ventajas en el ranking, ni verifica tareas automáticamente, ni se mezcla con el apoyo entre creadores.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Selecciona un aporte (USD):
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 10, 25].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSelectedAmount(amt)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all touch-manipulation ${
                      selectedAmount === amt
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tu nombre o alias</label>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Ej. María o Anónimo"
                className="w-full text-base sm:text-xs rounded-xl border border-slate-200 p-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mensaje de aliento (opcional)
              </label>
              <input
                type="text"
                value={donorMessage}
                onChange={(e) => setDonorMessage(e.target.value)}
                placeholder="¡Sigan adelante con la comunidad!"
                className="w-full text-base sm:text-xs rounded-xl border border-slate-200 p-2.5"
              />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                className="w-full py-3 px-4 min-h-[44px] rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 touch-manipulation"
              >
                <Heart className="w-4 h-4 fill-white shrink-0" />
                <span className="truncate">Confirmar Donación Voluntaria (${selectedAmount} USD)</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
