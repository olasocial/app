import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Globe,
  Shield,
  Swords,
  Trophy,
  Share2,
  Heart,
  User,
  LogOut,
  Sparkles,
  Flame,
  CheckCircle2,
  Menu,
  X,
  ExternalLink,
  Award,
  Users
} from 'lucide-react';
import { OlaLogo } from './OlaLogo';
import { useAuth } from '../context/AuthContext';
import { useOlaSocial } from '../context/OlaSocialContext';
import { useI18n } from '../context/I18nContext';
import { LanguageSelector } from './LanguageSelector';
import { PresenceStatus, DonationSettings } from '../types';
import { fetchDonationSettings, DEFAULT_DONATION_SETTINGS } from '../services/donationService';
import { supabase } from '../services/supabaseClient';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenDonations: () => void;
  onOpenLegal: (type: 'terms' | 'privacy' | 'compliance' | 'guides') => void;
  onOpenLogin: () => void;
  isScrolled: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenDonations,
  onOpenLegal,
  onOpenLogin,
  isScrolled
}) => {
  const { user, isAdmin, logout, togglePresence } = useAuth();
  const { t, formatTime } = useI18n();
  const { notifications, onlineUsersCount, markNotificationAsRead, markAllNotificationsAsRead } =
    useOlaSocial();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [donationSettings, setDonationSettings] = useState<DonationSettings>(DEFAULT_DONATION_SETTINGS);

  useEffect(() => {
    fetchDonationSettings().then(setDonationSettings).catch(() => {});

    const channel = supabase
      ?.channel('header_donation_settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donation_settings' },
        () => {
          fetchDonationSettings().then(setDonationSettings).catch(() => {});
        }
      )
      .subscribe();

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-white/92 backdrop-blur-md shadow-md border-b border-sky-100 py-2.5'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Logo with Real Animation */}
          <div className="flex items-center gap-3">
            <OlaLogo
              variant="compact"
              animate={true}
              onClick={() => onSelectTab('lobby')}
            />

            {/* Live Realtime Presence Pill */}
            <div
              onClick={togglePresence}
              title={t('common.presence_tooltip', undefined, 'Cambiar estado de presencia (En línea / Ausente)')}
              className="hidden md:inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 cursor-pointer hover:bg-emerald-100 transition-colors shadow-2xs"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{onlineUsersCount} {t('common.online')}</span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-slate-100/90 backdrop-blur-xs p-1 rounded-full border border-slate-200/80 shadow-inner">
            <button
              onClick={() => onSelectTab('lobby')}
              className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                currentTab === 'lobby'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {t('nav.lobby')}
            </button>

            <button
              onClick={() => onSelectTab('profiles')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                currentTab === 'profiles'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t('nav.profiles')}</span>
            </button>

            <button
              onClick={() => onSelectTab('battles')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                currentTab === 'battles'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>{t('nav.battles')}</span>
            </button>

            <button
              onClick={() => onSelectTab('ranking')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                currentTab === 'ranking'
                  ? 'bg-white text-amber-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>{t('nav.ranking')}</span>
            </button>

            <button
              onClick={() => onSelectTab('invitations')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                currentTab === 'invitations'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-teal-600" />
              <span>{t('nav.invitations')}</span>
            </button>

            <button
              onClick={() => onSelectTab('progress')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                currentTab === 'progress'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('nav.progress')}</span>
            </button>

            <button
              onClick={() => onSelectTab('security')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                currentTab === 'security'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{t('nav.security')}</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => onSelectTab('admin')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold transition-all ${
                  currentTab === 'admin'
                    ? 'bg-gradient-to-r from-sky-600 to-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 hover:bg-emerald-100/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{t('nav.admin')}</span>
              </button>
            )}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Voluntary Donation Button */}
            {(donationSettings.enabled || isAdmin) && (
              <button
                onClick={onOpenDonations}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 min-h-[40px] sm:min-h-0 rounded-full text-xs sm:text-sm font-bold bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-98 transition-all touch-manipulation"
                title={t('donations.support_community')}
              >
                <Heart className="w-3.5 h-3.5 fill-white" />
                <span className="hidden sm:inline">{t('nav.donate')}</span>
              </button>
            )}

            {/* Global Reactive Language Selector */}
            <LanguageSelector variant="compact" />

            {/* Realtime Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
                className="relative p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors touch-manipulation"
                title={t('notifications.title')}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-auto mt-1 sm:mt-2 w-[calc(100vw-1rem)] sm:w-96 max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-sm">{t('notifications.title')}</h4>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-xs text-sky-600 hover:text-sky-800 font-semibold"
                      >
                        {t('notifications.mark_all_read')}
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        {t('notifications.no_notifications')}
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationAsRead(n.id)}
                          className={`p-3 text-xs hover:bg-slate-50 transition-colors cursor-pointer ${
                            !n.read ? 'bg-sky-50/40 font-medium' : 'text-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{n.title}</span>
                            <span className="text-[10px] text-slate-400">
                              {formatTime(n.created_at)}
                            </span>
                          </div>
                          <p className="mt-1 text-slate-600">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar / Dropdown OR Login Button */}
            {!user ? (
              <button
                type="button"
                onClick={onOpenLogin}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-full text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs hover:shadow-md transition-all cursor-pointer touch-manipulation"
              >
                <User className="w-3.5 h-3.5" />
                <span>{t('nav.login')}</span>
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 p-1.5 min-h-[44px] min-w-[44px] rounded-full hover:ring-2 hover:ring-sky-300 transition-all cursor-pointer touch-manipulation"
                >
                  <img
                    src={user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=olasocial'}
                    alt={user.display_name}
                    className="w-8 h-8 rounded-full border border-sky-300 object-cover"
                  />
                  <span className="hidden xl:inline text-xs font-semibold text-slate-800 max-w-[120px] truncate">
                    {user.display_name}
                  </span>
                </button>

              {showUserMenu && (
                <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-auto mt-1 sm:mt-2 w-[calc(100vw-1rem)] sm:w-56 max-w-xs bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 text-sm">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs text-slate-500">{t('user_menu.connected_as')}</p>
                    <p className="font-bold text-slate-900 truncate">{user?.display_name}</p>
                    <p className="text-[11px] text-sky-600 font-semibold">{user?.email}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      {t('user_menu.level')}: {user?.user_level}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSelectTab('profiles');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 text-xs text-left"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t('user_menu.my_profile')}</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectTab('security');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 text-xs text-left"
                  >
                    <Shield className="w-3.5 h-3.5 text-teal-600" />
                    <span>{t('user_menu.security_center')}</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        onSelectTab('admin');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-emerald-700 font-semibold hover:bg-emerald-50 text-xs text-left"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t('user_menu.admin_panel')}</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-slate-100"></div>

                  <button
                    onClick={() => {
                      onOpenLegal('terms');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-1.5 text-slate-600 hover:bg-slate-50 text-xs text-left"
                  >
                    <span>{t('user_menu.terms_privacy')}</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenLegal('guides');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-1.5 text-slate-600 hover:bg-slate-50 text-xs text-left"
                  >
                    <span>{t('user_menu.help_faq')}</span>
                  </button>

                  <div className="my-1 border-t border-slate-100"></div>

                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 text-xs text-left font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('user_menu.logout')}</span>
                  </button>
                </div>
              )}
            </div>
          )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-slate-200 pb-2 space-y-1">
            <button
              onClick={() => {
                onSelectTab('lobby');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold ${
                currentTab === 'lobby' ? 'bg-sky-50 text-sky-700' : 'text-slate-700'
              }`}
            >
              {t('nav.lobby')}
            </button>
            <button
              onClick={() => {
                onSelectTab('profiles');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold ${
                currentTab === 'profiles' ? 'bg-sky-50 text-sky-700' : 'text-slate-700'
              }`}
            >
              {t('nav.profiles')}
            </button>
            <button
              onClick={() => {
                onSelectTab('battles');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold ${
                currentTab === 'battles' ? 'bg-rose-50 text-rose-700' : 'text-slate-700'
              }`}
            >
              {t('nav.battles')}
            </button>
            <button
              onClick={() => {
                onSelectTab('ranking');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold ${
                currentTab === 'ranking' ? 'bg-amber-50 text-amber-700' : 'text-slate-700'
              }`}
            >
              {t('nav.ranking')}
            </button>
            <button
              onClick={() => {
                onSelectTab('invitations');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold ${
                currentTab === 'invitations' ? 'bg-teal-50 text-teal-700' : 'text-slate-700'
              }`}
            >
              {t('nav.invitations')}
            </button>
            <button
              onClick={() => {
                onSelectTab('progress');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold flex items-center justify-between ${
                currentTab === 'progress' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>{t('nav.progress')}</span>
              </span>
              {user && (
                <span className="text-[11px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                  {t('user_menu.level')} {user.level_number || 1}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                onSelectTab('security');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold ${
                currentTab === 'security' ? 'bg-teal-50 text-teal-700' : 'text-slate-700'
              }`}
            >
              {t('nav.security')}
            </button>
            {(donationSettings.enabled || isAdmin) && (
              <button
                onClick={() => {
                  onOpenDonations();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-rose-600 bg-rose-50/70 hover:bg-rose-100 flex items-center gap-2"
              >
                <Heart className="w-4 h-4 fill-rose-500" />
                <span>{t('nav.donate')}</span>
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => {
                  onSelectTab('admin');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold ${
                  currentTab === 'admin' ? 'bg-emerald-100 text-emerald-800' : 'text-emerald-700'
                }`}
              >
                {t('nav.admin')}
              </button>
            )}

            <div className="pt-2 border-t border-slate-200 mt-2">
              {!user ? (
                <button
                  type="button"
                  onClick={() => {
                    onOpenLogin();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-sky-600 text-white font-bold text-sm text-center shadow-xs"
                >
                  {t('auth.login_with_google')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold text-sm text-left flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('user_menu.logout')} ({user.display_name})</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

