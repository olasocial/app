import React, { useState } from 'react';
import { PlusCircle, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { useOlaSocial } from '../context/OlaSocialContext';
import { useI18n } from '../context/I18nContext';
import { SocialPlatformKey } from '../types';
import { PLATFORM_REGISTRY } from '../services/platformAdapters';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({ isOpen, onClose }) => {
  const { createCampaign, socialProfiles } = useOlaSocial();
  const { t } = useI18n();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
        >
          ✕
        </button>

        <div className="flex items-center gap-2.5 mb-4 pr-6">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">{t('campaigns.create_title')}</h3>
            <p className="text-[11px] sm:text-xs text-slate-500">
              {t('campaigns.create_subtitle')}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Quick autofill from registered social profiles */}
        {socialProfiles.length > 0 && (
          <div className="mb-4 p-3 rounded-2xl bg-sky-50/70 border border-sky-100">
            <div className="text-[11px] font-bold text-sky-900 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('profiles.title')}:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {socialProfiles.map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => {
                    setPlatform(sp.platform);
                    setTargetUrl(sp.profile_url);
                    setTargetUsername(sp.username);
                    if (!title) {
                      setTitle(`Conoce mi contenido en ${PLATFORM_REGISTRY[sp.platform]?.name || sp.platform}`);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white text-slate-700 border border-slate-200 hover:border-sky-400 hover:text-sky-600 transition-colors flex items-center gap-1"
                >
                  <span className="font-bold">{PLATFORM_REGISTRY[sp.platform]?.name || sp.platform}:</span>
                  <span>@{sp.username}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Quick Objective Presets */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">{t('campaigns.action_type_label')}</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setActionType('DISCOVER');
                  if (!title) setTitle('Presentación de canal y contenido');
                }}
                className={`p-2 rounded-xl text-center border font-semibold transition-all ${
                  actionType === 'DISCOVER'
                    ? 'border-sky-500 bg-sky-50 text-sky-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t('campaigns.action_visit')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActionType('WATCH');
                  if (!title) setTitle('Nuevo video o contenido destacado');
                }}
                className={`p-2 rounded-xl text-center border font-semibold transition-all ${
                  actionType === 'WATCH'
                    ? 'border-sky-500 bg-sky-50 text-sky-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t('campaigns.action_discover')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActionType('COMMUNITY_SHARE');
                  if (!title) setTitle('Transmisión en vivo o evento');
                }}
                className={`p-2 rounded-xl text-center border font-semibold transition-all ${
                  actionType === 'COMMUNITY_SHARE'
                    ? 'border-sky-500 bg-sky-50 text-sky-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t('campaigns.action_interact')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('campaigns.platform_select')}</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as SocialPlatformKey)}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-base sm:text-xs"
              >
                {Object.keys(PLATFORM_REGISTRY).map((k) => (
                  <option key={k} value={k}>
                    {PLATFORM_REGISTRY[k as SocialPlatformKey].name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('campaigns.action_type_label')}</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-base sm:text-xs"
              >
                <option value="DISCOVER">{t('campaigns.action_discover')}</option>
                <option value="VISIT">{t('campaigns.action_visit')}</option>
                <option value="COMMUNITY_SHARE">{t('campaigns.action_interact')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">{t('campaigns.campaign_title_label')} *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('campaigns.campaign_title_placeholder')}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-base sm:text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {t('campaigns.target_url_label')} *
            </label>
            <input
              type="url"
              required
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-base sm:text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('profiles.username_label')}</label>
              <input
                type="text"
                value={targetUsername}
                onChange={(e) => setTargetUsername(e.target.value)}
                placeholder="ej. micreador"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-base sm:text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('campaigns.quota_label')}</label>
              <input
                type="number"
                min={5}
                max={200}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-base sm:text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">{t('common.details')}</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-base sm:text-xs"
            />
          </div>

          {/* Compliance Check Notice */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-2 text-[11px] text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>{t('common.verified')}: </strong> {t('onboarding.rule_organic_desc')}
            </span>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 text-center"
            >
              {t('campaigns.cancel_button')}
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md text-center"
            >
              {t('campaigns.submit_button')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
