import React, { useState, useEffect } from 'react';
import { I18nProvider, useI18n } from './context/I18nContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OlaSocialProvider } from './context/OlaSocialContext';
import { Header } from './components/Header';
import { LobbyView } from './components/LobbyView';
import { SocialProfilesManager } from './components/SocialProfilesManager';
import { BattlesView } from './components/BattlesView';
import { RankingView } from './components/RankingView';
import { InvitationsView } from './components/InvitationsView';
import { SecurityCenter } from './components/SecurityCenter';
import { AdminPanel } from './components/AdminPanel';
import { LevelsAndProgressView } from './components/LevelsAndProgressView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DonationsModal } from './components/DonationsModal';
import { CreateCampaignModal } from './components/CreateCampaignModal';
import { LegalDocsModal } from './components/LegalDocsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { LoginModal } from './components/LoginModal';
import { OlaLogo } from './components/OlaLogo';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { PWAUpdateToast } from './components/PWAUpdateToast';
import { ForegroundNotificationToast } from './components/ForegroundNotificationToast';
import { NotificationPermissionPrompt } from './components/NotificationPermissionPrompt';
import { useOlaSocial } from './context/OlaSocialContext';
import { ShieldAlert, LogOut, ShieldCheck, Heart, WifiOff } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, isBanned, bannedReason, logout, needsOnboarding } = useAuth();
  const { t } = useI18n();
  const {
    activeToastNotification,
    dismissToastNotification,
    markNotificationAsRead,
    isOnline
  } = useOlaSocial();
  const [currentTab, setCurrentTab] = useState<string>('lobby');
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isDonationsOpen, setIsDonationsOpen] = useState<boolean>(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState<boolean>(false);
  const [legalModalState, setLegalModalState] = useState<{
    isOpen: boolean;
    type: 'terms' | 'privacy' | 'compliance' | 'guides';
  }>({
    isOpen: false,
    type: 'terms'
  });
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // Auto trigger onboarding if logged in user has pending legal confirmations
  useEffect(() => {
    if (needsOnboarding) {
      setIsOnboardingOpen(true);
    }
  }, [needsOnboarding]);

  // Real fluid scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setIsScrolled(scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openLegal = (type: 'terms' | 'privacy' | 'compliance' | 'guides') => {
    setLegalModalState({ isOpen: true, type });
  };

  // Section 15: Bloqueo Real del Acceso para cuentas sancionadas
  if (isBanned) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 border border-rose-500/40 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/30">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white">{t('auth.access_restricted')}</h2>
            <p className="text-sm text-slate-300 mt-2">
              {bannedReason || t('auth.ban_reason_default')}
            </p>
          </div>
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-700 text-xs text-slate-400 text-left space-y-2">
            <div className="font-semibold text-slate-200">{t('auth.ban_reason_title')}</div>
            <p>
              {t('auth.ban_reason_default')}
            </p>
          </div>
          <button
            onClick={() => logout()}
            className="w-full py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 transition-colors duration-300">
      {/* Offline Status Warning Pill */}
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="bg-amber-600 text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2 sticky top-0 z-50 shadow-xs animate-in fade-in duration-200"
        >
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>{t('offline.banner')}</span>
        </div>
      )}

      {/* PWA Persistent Update Toast */}
      <PWAUpdateToast />

      {/* Realtime Foreground Notification Toast Banner */}
      <ForegroundNotificationToast
        notification={activeToastNotification}
        onDismiss={dismissToastNotification}
        onView={(notif) => {
          markNotificationAsRead(notif.id);
          if (notif.type.includes('TASK')) {
            setCurrentTab('lobby');
          } else if (notif.type.includes('SECURITY') || notif.type.includes('ACCOUNT')) {
            setCurrentTab('security');
          }
        }}
      />

      {/* Pinned / Sticky Header with Animated Logo and Fluid Scroll Transition */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenDonations={() => setIsDonationsOpen(true)}
        onOpenLegal={openLegal}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        isScrolled={isScrolled}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {currentTab === 'lobby' && (
          <LobbyView
            onOpenCreateCampaign={() => {
              if (!user) {
                setIsLoginModalOpen(true);
              } else {
                setIsCampaignModalOpen(true);
              }
            }}
            onOpenSocialProfiles={() => {
              if (!user) {
                setIsLoginModalOpen(true);
              } else {
                setCurrentTab('profiles');
              }
            }}
            onOpenInvitations={() => {
              if (!user) {
                setIsLoginModalOpen(true);
              } else {
                setCurrentTab('invitations');
              }
            }}
            isScrolled={isScrolled}
          />
        )}

        {currentTab === 'profiles' && <SocialProfilesManager />}

        {currentTab === 'battles' && <BattlesView />}

        {currentTab === 'ranking' && <RankingView />}

        {currentTab === 'invitations' && <InvitationsView />}

        {currentTab === 'progress' && <LevelsAndProgressView />}

        {currentTab === 'security' && <SecurityCenter />}

        {currentTab === 'admin' && <AdminPanel />}
      </main>

      {/* Platform Footer (with extra padding on mobile for MobileBottomNav) */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-8 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <OlaLogo variant="compact" animate={false} />
              <div className="text-xs text-slate-500">
                {t('footer.copyright', { year: new Date().getFullYear() })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
              <button
                onClick={() => openLegal('terms')}
                className="hover:text-sky-600 transition-colors"
              >
                {t('footer.terms')}
              </button>
              <button
                onClick={() => openLegal('privacy')}
                className="hover:text-sky-600 transition-colors"
              >
                {t('footer.privacy')}
              </button>
              <button
                onClick={() => openLegal('compliance')}
                className="hover:text-sky-600 transition-colors"
              >
                {t('footer.compliance')}
              </button>
              <button
                onClick={() => openLegal('guides')}
                className="hover:text-sky-600 transition-colors"
              >
                {t('footer.help')}
              </button>
              <button
                onClick={() => setIsDonationsOpen(true)}
                className="text-rose-600 hover:text-rose-700 font-bold transition-colors"
              >
                {t('footer.support_ola')}
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>
              {t('footer.disclaimer')}
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{t('footer.status_systems')}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <DonationsModal
        isOpen={isDonationsOpen}
        onClose={() => setIsDonationsOpen(false)}
      />

      <CreateCampaignModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
      />

      <LegalDocsModal
        isOpen={legalModalState.isOpen}
        initialTab={legalModalState.type}
        onClose={() => setLegalModalState({ ...legalModalState, isOpen: false })}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={() => setIsOnboardingOpen(false)}
      />

      {/* Mobile Fixed Bottom Navigation Bar for rapid one-handed mobile navigation */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
      />

      {/* PWA Mobile Installation Prompt Banner */}
      <PWAInstallBanner />

      {/* Realtime Notification Opt-In Prompt */}
      <NotificationPermissionPrompt />
    </div>
  );
};

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <OlaSocialProvider>
          <MainAppContent />
        </OlaSocialProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

