import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Share2,
  Lock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOlaSocial } from '../context/OlaSocialContext';
import { useI18n } from '../context/I18nContext';
import { SocialPlatformKey, PlatformApiStatus } from '../types';
import { PLATFORM_REGISTRY, SocialPlatformAdapter } from '../services/platformAdapters';

export const SocialProfilesManager: React.FC = () => {
  const { user } = useAuth();
  const { socialProfiles, addSocialProfile, requestProfileChange } = useOlaSocial();
  const { t, formatDate } = useI18n();

  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatformKey>('youtube');
  const [profileUrlInput, setProfileUrlInput] = useState('');
  const [isPrimaryCheck, setIsPrimaryCheck] = useState(false);
  const [previewData, setPreviewData] = useState<ReturnType<typeof SocialPlatformAdapter.parseProfile> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Change request modal
  const [requestModalProfileId, setRequestModalProfileId] = useState<string | null>(null);
  const [changeReason, setChangeReason] = useState('');

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const parsed = SocialPlatformAdapter.parseProfile(selectedPlatform, profileUrlInput);
    if (!parsed) {
      setErrorMessage('Por favor introduce un enlace o usuario válido para la plataforma seleccionada.');
      return;
    }
    setPreviewData(parsed);
  };

  const handleConfirmAdd = () => {
    if (!previewData) return;

    const res = addSocialProfile({
      platform: previewData.platform,
      profile_url: previewData.profileUrl,
      username: previewData.username,
      display_name: previewData.displayName,
      is_primary: isPrimaryCheck,
      followers_count: undefined,
      likes_count: undefined
    });

    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }

    setSuccessMessage(res.message);
    setPreviewData(null);
    setProfileUrlInput('');
    setIsPrimaryCheck(false);
  };

  const handleSubmitChangeRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestModalProfileId) return;

    requestProfileChange(requestModalProfileId, changeReason);
    setRequestModalProfileId(null);
    setChangeReason('');
    setSuccessMessage('Solicitud de cambio enviada para revisión por el equipo de moderación.');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Title & Compliance Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {t('profiles.title')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('profiles.subtitle')}
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-start gap-3 text-xs text-sky-800">
          <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">{t('common.info')}: </span>
            {t('profiles.locked_notice')}
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)}>✕</button>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)}>✕</button>
        </div>
      )}

      {/* Add New Profile Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-sky-600" />
          <span>{t('profiles.add_profile_button')}</span>
        </h3>

        <form onSubmit={handlePreview} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('profiles.platform_label')}
              </label>
              <select
                value={selectedPlatform}
                onChange={(e) => {
                  setSelectedPlatform(e.target.value as SocialPlatformKey);
                  setPreviewData(null);
                }}
                className="w-full text-base sm:text-xs rounded-xl border border-slate-200 p-3 bg-white focus:ring-2 focus:ring-sky-500"
              >
                {Object.keys(PLATFORM_REGISTRY).map((k) => (
                  <option key={k} value={k}>
                    {PLATFORM_REGISTRY[k as SocialPlatformKey].name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('profiles.url_label')}
              </label>
              <input
                type="text"
                required
                value={profileUrlInput}
                onChange={(e) => setProfileUrlInput(e.target.value)}
                placeholder={t('profiles.url_placeholder')}
                className="w-full text-base sm:text-xs rounded-xl border border-slate-200 p-3 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPrimary"
              checked={isPrimaryCheck}
              onChange={(e) => setIsPrimaryCheck(e.target.checked)}
              className="rounded-md border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
            />
            <label htmlFor="isPrimary" className="text-xs text-slate-700 font-medium cursor-pointer">
              {t('profiles.primary_label')}
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-colors touch-manipulation"
            >
              {t('profiles.preview_button')}
            </button>
          </div>
        </form>

        {/* Preview and Confirmation Box */}
        {previewData && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                {t('common.confirm')}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                {PLATFORM_REGISTRY[previewData.platform].name}
              </span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-100 flex items-center gap-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-sky-400 to-emerald-400 flex items-center justify-center text-white font-bold text-lg shadow-xs shrink-0">
                {previewData.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-slate-900 truncate">@{previewData.username}</div>
                <div className="text-xs text-sky-600 truncate">{previewData.profileUrl}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{previewData.apiNotice}</div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-900 leading-relaxed">
              <strong>{t('common.info')}: </strong>
              {t('profiles.locked_notice')}
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 text-center"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md text-center"
              >
                {t('profiles.save_button')}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* List of Registered & Locked Profiles */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">{t('profiles.title')}</h3>

        {socialProfiles.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center text-xs text-slate-500">
            {t('profiles.no_profiles')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {socialProfiles.map((prof) => {
              const platformConfig = PLATFORM_REGISTRY[prof.platform];
              return (
                <div
                  key={prof.id}
                  className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: platformConfig?.color || '#0284c7' }}
                        />
                        <span className="text-xs font-bold text-slate-800">
                          {platformConfig?.name || prof.platform}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {prof.is_primary && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            {t('profiles.primary_badge')}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          <Lock className="w-2.5 h-2.5 text-slate-500" />
                          <span>LOCKED</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-sm font-extrabold text-slate-900 truncate">@{prof.username}</div>
                    <a
                      href={prof.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-sky-600 hover:underline flex items-center gap-1 mt-0.5 max-w-[280px] sm:max-w-none truncate"
                    >
                      <span className="truncate">{prof.profile_url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>

                    <div className="mt-3 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                      {t('common.status')}: <strong className="text-slate-800">{prof.verification_status === 'verified' ? t('profiles.verified_badge') : t('profiles.pending_badge')}</strong> • {formatDate(prof.locked_at)}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">{t('common.verified')}</span>
                    <button
                      onClick={() => setRequestModalProfileId(prof.id)}
                      className="text-xs text-sky-600 hover:text-sky-800 font-semibold inline-flex items-center gap-1 p-1 touch-manipulation"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{t('profiles.request_change')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Change Request Modal */}
      {requestModalProfileId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg mb-2">{t('profiles.request_change')}</h3>
            <p className="text-xs text-slate-600 mb-4">
              {t('profiles.locked_notice')}
            </p>

            <form onSubmit={handleSubmitChangeRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('profiles.change_reason_label')} *
                </label>
                <textarea
                  required
                  rows={3}
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder={t('profiles.change_reason_placeholder')}
                  className="w-full text-base sm:text-xs rounded-xl border border-slate-200 p-3 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRequestModalProfileId(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 text-center"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md text-center"
                >
                  {t('profiles.submit_change_request')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
