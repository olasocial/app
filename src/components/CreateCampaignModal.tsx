import React, { useState } from 'react';
import { PlusCircle, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { useOlaSocial } from '../context/OlaSocialContext';
import { SocialPlatformKey } from '../types';
import { PLATFORM_REGISTRY } from '../services/platformAdapters';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({ isOpen, onClose }) => {
  const { createCampaign, socialProfiles } = useOlaSocial();

  const [platform, setPlatform] = useState<SocialPlatformKey>('youtube');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [targetUsername, setTargetUsername] = useState('');
  const [maxParticipants, setMaxParticipants] = useState<number>(50);
  const [actionType, setActionType] = useState<
    'VISIT' | 'DISCOVER' | 'WATCH' | 'VOLUNTARY_FOLLOW' | 'COMMUNITY_SHARE'
  >('DISCOVER');

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !targetUrl.trim()) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    const res = createCampaign({
      platform,
      title,
      description,
      target_profile_url: targetUrl,
      target_username: targetUsername || 'creador',
      max_participants: maxParticipants,
      action_type: actionType,
      campaign_type: 'DISCOVERY'
    });

    if (!res.success) {
      setError(res.message);
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Crear Campaña de Descubrimiento</h3>
            <p className="text-xs text-slate-500">
              Presenta tu contenido para que otros usuarios lo conozcan voluntariamente.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Plataforma</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as SocialPlatformKey)}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
              >
                {Object.keys(PLATFORM_REGISTRY).map((k) => (
                  <option key={k} value={k}>
                    {PLATFORM_REGISTRY[k as SocialPlatformKey].name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tipo de Acción Humana</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
              >
                <option value="DISCOVER">Descubrir y conocer</option>
                <option value="VISIT">Visitar perfil público</option>
                <option value="WATCH">Ver video/transmisión</option>
                <option value="VOLUNTARY_FOLLOW">Seguimiento voluntario</option>
                <option value="COMMUNITY_SHARE">Compartir en comunidad</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Título de la Campaña *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Nuevo episodio sobre producción musical sostenible"
              className="w-full rounded-xl border border-slate-200 p-2.5"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Enlace de destino (Video, Canal o Perfil) *
            </label>
            <input
              type="url"
              required
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full rounded-xl border border-slate-200 p-2.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Usuario / Handle</label>
              <input
                type="text"
                value={targetUsername}
                onChange={(e) => setTargetUsername(e.target.value)}
                placeholder="ej. micreador"
                className="w-full rounded-xl border border-slate-200 p-2.5"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Máximo de Participantes</label>
              <input
                type="number"
                min={5}
                max={200}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 p-2.5"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Descripción del Contenido</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explica qué van a encontrar y por qué es interesante..."
              className="w-full rounded-xl border border-slate-200 p-2.5"
            />
          </div>

          {/* Compliance Check Notice */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-2 text-[11px] text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Validación de cumplimiento: </strong> Esta campaña cumple con la política antibot y promueve descubrimiento genuino sin prometer seguidores externos.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md"
            >
              Publicar Campaña
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
