import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, AccountStatus, UserLevel, PresenceStatus, LanguageKey } from '../types';
import {
  supabase,
  isSupabaseConfigured,
  ADMIN_PRIMARY_EMAIL,
  fetchUserProfile,
  upsertUserProfile
} from '../services/supabaseClient';

interface AuthContextType {
  user: UserProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  isBanned: boolean;
  bannedReason: string | null;
  authError: string | null;
  language: LanguageKey;
  needsOnboarding: boolean;
  setLanguage: (lang: LanguageKey) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  togglePresence: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBanned, setIsBanned] = useState<boolean>(false);
  const [bannedReason, setBannedReason] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [language, setLanguageState] = useState<LanguageKey>('es');

  // Load user profile from Supabase Auth & DB
  const syncProfileFromAuthUser = async (authUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, any>;
  }) => {
    if (!authUser.email) return;

    try {
      // 1. Fetch from Supabase profiles table
      let profile = await fetchUserProfile(authUser.id);

      // 2. If profile does not exist yet (first Google OAuth login), create controlled upsert
      if (!profile) {
        const email = authUser.email;
        const isSuperAdminEmail = email.toLowerCase() === ADMIN_PRIMARY_EMAIL.toLowerCase();
        const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
        const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || username;
        const avatarUrl =
          authUser.user_metadata?.avatar_url ||
          authUser.user_metadata?.picture ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

        profile = await upsertUserProfile({
          id: authUser.id,
          email,
          display_name: fullName,
          username,
          avatar_url: avatarUrl,
          role: isSuperAdminEmail ? UserRole.SUPER_ADMIN : UserRole.USER,
          status: AccountStatus.ACTIVE,
          language: 'es',
          presence: PresenceStatus.ONLINE,
          last_seen_at: new Date().toISOString(),
          reputation: 75.0,
          hugs_done: 0,
          hugs_received: 0,
          hugs_verified: 0,
          stars_count: 0,
          rating_avg: 5.0,
          campaigns_created: 0,
          campaigns_completed: 0,
          confidence_level: 80,
          user_level: UserLevel.NUEVO,
          warnings_count: 0,
          is_18_confirmed: false,
          mfa_enabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // 3. Status verification (Section 15: Bloqueo Real del Acceso)
      if (profile) {
        if (profile.status === AccountStatus.BANNED) {
          setIsBanned(true);
          setBannedReason('Tu cuenta ha sido bloqueada permanentemente por moderación.');
          setUser(null);
          return;
        }
        if (profile.status === AccountStatus.SUSPENDED) {
          setIsBanned(true);
          setBannedReason('Tu cuenta se encuentra temporalmente suspendida.');
          setUser(null);
          return;
        }

        setIsBanned(false);
        setBannedReason(null);
        setUser(profile);
        setLanguageState(profile.language || 'es');
      }
    } catch (err: any) {
      console.error('Error synchronizing user profile:', err);
      setAuthError('Error al sincronizar el perfil con Supabase.');
    }
  };

  // Initial session recovery and Auth State Listener
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      setIsLoading(true);

      if (!isSupabaseConfigured || !supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Supabase session recovery error:', error);
        } else if (session?.user && isMounted) {
          await syncProfileFromAuthUser(session.user);
        }
      } catch (err) {
        console.error('Initialization auth error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Subscribe to real-time Auth State Changes
    if (isSupabaseConfigured && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!isMounted) return;

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            if (session?.user) {
              await syncProfileFromAuthUser(session.user);
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setIsBanned(false);
            setBannedReason(null);
          }
        }
      );

      return () => {
        isMounted = false;
        authListener.subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = async (lang: LanguageKey) => {
    setLanguageState(lang);
    if (user) {
      await updateProfile({ language: lang });
    }
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    setIsLoading(true);

    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error(
          'Supabase no está configurado en las variables de entorno. Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
        );
      }

      // Real Google OAuth via Supabase Auth
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Google OAuth Login error:', err);
      setAuthError(err.message || 'Error al conectar con Google OAuth.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsBanned(false);
      setBannedReason(null);
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;

    // Disallow unauthorized role/status elevation from client
    const safeData: Partial<UserProfile> = { ...data };
    delete safeData.role;
    delete safeData.status;
    delete safeData.reputation;
    delete safeData.stars_count;
    delete safeData.hugs_done;
    delete safeData.hugs_verified;

    const updated = {
      ...user,
      ...safeData,
      updated_at: new Date().toISOString()
    };

    setUser(updated);

    if (isSupabaseConfigured && supabase) {
      await upsertUserProfile({ id: user.id, email: user.email, ...safeData });
    }
  };

  const togglePresence = async () => {
    if (!user) return;
    const nextPresence =
      user.presence === PresenceStatus.ONLINE
        ? PresenceStatus.AWAY
        : user.presence === PresenceStatus.AWAY
        ? PresenceStatus.OFFLINE
        : PresenceStatus.ONLINE;

    await updateProfile({ presence: nextPresence });
  };

  const clearAuthError = () => setAuthError(null);

  // Protected Admin Authorization from Supabase
  const isSuperAdmin =
    user?.role === UserRole.SUPER_ADMIN ||
    Boolean(user?.email && user.email.toLowerCase() === ADMIN_PRIMARY_EMAIL.toLowerCase());

  const isAdmin = isSuperAdmin || user?.role === UserRole.ADMIN;

  const needsOnboarding = Boolean(user && (!user.is_18_confirmed || !user.terms_accepted_at));

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isSuperAdmin,
        isLoading,
        isBanned,
        bannedReason,
        authError,
        language,
        needsOnboarding,
        setLanguage,
        loginWithGoogle,
        logout,
        updateProfile,
        togglePresence,
        clearAuthError
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
