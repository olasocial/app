import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, AccountStatus, UserLevel, PresenceStatus, LanguageKey } from '../types';
import { createDefaultProfile, ADMIN_PRIMARY_EMAIL, supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface AuthContextType {
  user: UserProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  language: LanguageKey;
  setLanguage: (lang: LanguageKey) => void;
  loginWithGoogle: (customEmail?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  togglePresence: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'ola_social_active_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_USER);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // fallback
    }
    // By default, initialize with a logged-in active user profile ready for immediate discovery,
    // default to admin profile or standard community creator profile
    return createDefaultProfile(ADMIN_PRIMARY_EMAIL, 'Admin Ola Social');
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [language, setLanguageState] = useState<LanguageKey>(user?.language || 'es');

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      setLanguageState(user.language || 'es');
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [user]);

  const setLanguage = (lang: LanguageKey) => {
    setLanguageState(lang);
    if (user) {
      setUser({ ...user, language: lang });
    }
  };

  const loginWithGoogle = async (customEmail?: string) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        // Real Supabase OAuth
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
          }
        });
        return;
      }

      // Demo/preview resilient instant Google OAuth mock login
      const targetEmail = customEmail || ADMIN_PRIMARY_EMAIL;
      const newProfile = createDefaultProfile(targetEmail);
      setUser(newProfile);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!user) return;
    setUser((prev) => (prev ? { ...prev, ...data, updated_at: new Date().toISOString() } : null));
  };

  const togglePresence = () => {
    if (!user) return;
    const nextPresence =
      user.presence === PresenceStatus.ONLINE
        ? PresenceStatus.AWAY
        : user.presence === PresenceStatus.AWAY
        ? PresenceStatus.OFFLINE
        : PresenceStatus.ONLINE;
    updateProfile({ presence: nextPresence });
  };

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN || user?.email.toLowerCase() === ADMIN_PRIMARY_EMAIL.toLowerCase();
  const isAdmin = isSuperAdmin || user?.role === UserRole.ADMIN;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isSuperAdmin,
        isLoading,
        language,
        setLanguage,
        loginWithGoogle,
        logout,
        updateProfile,
        togglePresence
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
