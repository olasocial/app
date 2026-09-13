import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OlaSocialProvider } from './context/OlaSocialContext';
import { Header } from './components/Header';
import { LobbyView } from './components/LobbyView';
import { SocialProfilesManager } from './components/SocialProfilesManager';
import { BattlesView } from './components/BattlesView';
import { RankingView } from './components/RankingView';
import { SecurityCenter } from './components/SecurityCenter';
import { AdminPanel } from './components/AdminPanel';
import { DonationsModal } from './components/DonationsModal';
import { CreateCampaignModal } from './components/CreateCampaignModal';
import { LegalDocsModal } from './components/LegalDocsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { OlaLogo } from './components/OlaLogo';
import { Heart, ShieldCheck, Sparkles } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('lobby');
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  // Modals state
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 transition-colors duration-300">
      {/* Pinned / Sticky Header with Animated Logo and Fluid Scroll Transition */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenDonations={() => setIsDonationsOpen(true)}
        onOpenLegal={openLegal}
        isScrolled={isScrolled}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {currentTab === 'lobby' && (
          <LobbyView
            onOpenCreateCampaign={() => setIsCampaignModalOpen(true)}
            onOpenSocialProfiles={() => setCurrentTab('profiles')}
            isScrolled={isScrolled}
          />
        )}

        {currentTab === 'profiles' && <SocialProfilesManager />}

        {currentTab === 'battles' && <BattlesView />}

        {currentTab === 'ranking' && <RankingView />}

        {currentTab === 'security' && <SecurityCenter />}

        {currentTab === 'admin' && <AdminPanel />}
      </main>

      {/* Platform Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <OlaLogo variant="compact" animate={false} />
              <div className="text-xs text-slate-500">
                © {new Date().getFullYear()} OLA SOCIAL. "Abrazos que conectan personas."
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
              <button
                onClick={() => openLegal('terms')}
                className="hover:text-sky-600 transition-colors"
              >
                Términos
              </button>
              <button
                onClick={() => openLegal('privacy')}
                className="hover:text-sky-600 transition-colors"
              >
                Privacidad
              </button>
              <button
                onClick={() => openLegal('compliance')}
                className="hover:text-sky-600 transition-colors"
              >
                Compliance Antibot
              </button>
              <button
                onClick={() => openLegal('guides')}
                className="hover:text-sky-600 transition-colors"
              >
                Centro de Ayuda
              </button>
              <button
                onClick={() => setIsDonationsOpen(true)}
                className="text-rose-600 hover:text-rose-700 font-bold transition-colors"
              >
                Apoyar OLA SOCIAL
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>
              OLA SOCIAL no promete ni garantiza seguidores ni engagement externo artificial. Interacciones 100% humanas.
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Sistemas en línea • Supabase Realtime & PostgreSQL Ready</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
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
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <OlaSocialProvider>
        <MainAppContent />
      </OlaSocialProvider>
    </AuthProvider>
  );
}
