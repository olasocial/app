import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Share2,
  Copy,
  Check,
  Award,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Send,
  Facebook,
  Twitter,
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { fetchUserInvitations } from '../services/supabaseClient';
import { Invitation } from '../types';

export const InvitationsView: React.FC = () => {
  const { user } = useAuth();
  const { t, formatDate } = useI18n();

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const inviteCode = user?.invite_code || 'OLA-COMUNIDAD';

  // Construct official invitation link
  const getInviteUrl = () => {
    if (typeof window === 'undefined') return '';
    const baseUrl = new URL(window.location.pathname, window.location.origin).toString();
    return `${baseUrl}?ref=${inviteCode}`;
  };

  const inviteUrl = getInviteUrl();

  useEffect(() => {
    if (!user?.id) return;

    const loadInvitations = async () => {
      setIsLoading(true);
      try {
        const data = await fetchUserInvitations(user.id);
        setInvitations(data);
      } catch (err) {
        console.error('Error fetching invitations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInvitations();
  }, [user?.id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Únete a OLA SOCIAL',
          text: `Únete a OLA SOCIAL y crezcamos juntos en comunidad real. Usa mi código: ${inviteCode}`,
          url: inviteUrl
        });
      } catch (err) {
        // User cancelled or not supported
      }
    } else {
      handleCopyLink();
    }
  };

  const shareText = encodeURIComponent(
    `¡Únete a OLA SOCIAL con mi enlace de creador! Crece junto a una comunidad real sin bots: ${inviteUrl}`
  );

  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent('Únete a OLA SOCIAL y crezcamos juntos.')}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}`;

  // Metrics
  const totalRegistered = invitations.length;
  const totalVerified = invitations.filter((i) => i.status === 'verified' || i.status === 'active').length;
  const totalReputationEarned = invitations.reduce((acc, curr) => acc + (Number(curr.reputation_awarded) || 0), 0);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Title */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {t('invitations.title')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('invitations.subtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={handleNativeShare}
          className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Share2 className="w-4 h-4" />
          <span>{t('invitations.share_button')}</span>
        </button>
      </div>

      {/* Referral Link & Code Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="max-w-xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 bg-teal-900/60 px-3 py-1 rounded-full border border-teal-700/50">
              {t('invitations.title')}
            </span>
            <h3 className="text-2xl font-black mt-3">
              {t('invitations.your_link_label')}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {t('invitations.bonus_explanation')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Invite Code Box */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-300 uppercase">
                  {t('invitations.your_code_label')}
                </div>
                <div className="text-xl font-black font-mono tracking-wider text-amber-300 mt-1">
                  {inviteCode}
                </div>
              </div>
              <button
                onClick={handleCopyCode}
                className="mt-3 w-full py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? t('invitations.copied_alert') : t('invitations.copy_code_button')}</span>
              </button>
            </div>

            {/* Direct Link Box */}
            <div className="md:col-span-2 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-300 uppercase">
                  {t('invitations.your_link_label')}
                </div>
                <div className="text-xs font-mono text-slate-200 truncate mt-1 bg-black/30 px-3 py-2 rounded-xl">
                  {inviteUrl}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-900 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? t('invitations.copied_alert') : t('invitations.copy_link_button')}</span>
                </button>

                {/* Social Share Shortcuts */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white transition-all"
                  title="Telegram"
                >
                  <Send className="w-4 h-4" />
                </a>
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all"
                  title="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-all"
                  title="X"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-center">
          <div className="text-3xl font-black text-slate-900">{totalRegistered}</div>
          <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
            {t('invitations.stat_total_invited')}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-center">
          <div className="text-3xl font-black text-teal-600">{totalVerified}</div>
          <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
            {t('invitations.stat_verified')}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-center">
          <div className="text-3xl font-black text-amber-500">+{totalReputationEarned.toFixed(1)}</div>
          <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
            {t('invitations.stat_reputation_earned')}
          </div>
        </div>
      </div>

      {/* Invitations History Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 text-base">
          {t('invitations.invited_users_title')}
        </h3>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
            <span>{t('common.loading')}</span>
          </div>
        ) : invitations.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-600">{t('invitations.no_invitations')}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {t('invitations.bonus_explanation')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">{t('common.created_at')}</th>
                  <th className="p-3">{t('invitations.your_code_label')}</th>
                  <th className="p-3">{t('common.status')}</th>
                  <th className="p-3 rounded-r-xl text-right">{t('ranking.score_header')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 font-medium text-slate-600">
                      {formatDate(inv.created_at)}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">
                      {inv.invite_code}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inv.status === 'verified' || inv.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'registered'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {inv.status === 'verified'
                          ? t('common.verified')
                          : inv.status === 'registered'
                          ? t('invitations.status_pending')
                          : inv.status === 'active'
                          ? t('invitations.status_active')
                          : inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-teal-600">
                      +{Number(inv.reputation_awarded || 0).toFixed(1)} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
