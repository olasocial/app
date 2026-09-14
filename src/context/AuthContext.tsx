import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  UserRole,
  AccountStatus,
  UserLevel,
  PresenceStatus,
  LanguageKey,
  MfaFactor,
  MfaEnrollResult
} from '../types';
import {
  supabase,
  isSupabaseConfigured,
  ADMIN_PRIMARY_EMAIL,
  fetchUserProfile,
  upsertUserProfile,
  enrollMfaTotp,
  challengeAndVerifyMfa,
  listUserMfaFactors,
  unenrollMfaFactor,
  getAuthAssuranceLevel,
  attributeInviteCode
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
  mfaNeedsVerification: boolean;
  mfaFactors: MfaFactor[];
  activeMfaFactor: MfaFactor | null;
  setLanguage: (lang: LanguageKey) => void;
  loginWithGoogle: () => Promise<void>;
  verifyMfaCode: (code: string, factorId?: string) => Promise<boolean>;
  enrollMfa: (friendlyName?: string) => Promise<MfaEnrollResult | null>;
  unenrollMfa: (factorId: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
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
  const [mfaNeedsVerification, setMfaNeedsVerification] = useState<boolean>(false);
  const [mfaFactors, setMfaFactors] = useState<MfaFactor[]>([]);
  const [activeMfaFactor, setActiveMfaFactor] = useState<MfaFactor | null>(null);

  // Sync profile from Supabase Auth & DB
  const syncProfileFromAuthUser = async (authUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, any>;
  }) => {
    if (!authUser.email) return;

    try {
      // 1. Fetch from Supabase profiles table
      let profile = await fetchUserProfile(authUser.id);

      // 2. If profile does not exist yet (first OAuth or direct signup), create with unique identity
      if (!profile) {
        const email = authUser.email.trim().toLowerCase();
        const isSuperAdminEmail = email === ADMIN_PRIMARY_EMAIL.toLowerCase() || email === 'v19629049@gmail.com';
        const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
        const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || username;
        const avatarUrl =
          authUser.user_metadata?.avatar_url ||
          authUser.user_metadata?.picture ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

        // Cryptographically generated invite code (zero Math.random)
        const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(3)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase();
        const inviteCode = `OLA-${randomHex}`;

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
          reputation_score: isSuperAdminEmail ? 1000.0 : 100.0,
          level_number: isSuperAdminEmail ? 10 : 1,
          hugs_done: 0,
          hugs_received: 0,
          hugs_verified: 0,
          stars_count: 0,
          rating_avg: 5.0,
          campaigns_created: 0,
          campaigns_completed: 0,
          confidence_level: 80,
          user_level: isSuperAdminEmail ? UserLevel.PULSO_SOCIAL : UserLevel.NUEVO,
          warnings_count: 0,
          is_18_confirmed: false,
          mfa_enabled: false,
          invite_code: inviteCode,
          invitation_score: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        // If referral code exists in metadata or session, attribute invitation
        const refCode = authUser.user_metadata?.invite_code || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('ola_ref_code') : null);
        if (refCode) {
          await attributeInviteCode(refCode, authUser.id);
        }
      }

      // 3. Status verification (Account access enforcement)
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

        // Check MFA Assurance Level and Factors
        if (isSupabaseConfigured && supabase) {
          const aal = await getAuthAssuranceLevel();
          const factors = await listUserMfaFactors();
          setMfaFactors(factors.totp);

          if (factors.totp.length > 0) {
            setActiveMfaFactor(factors.totp[0]);
            if (aal.currentLevel === 'aal1' && aal.nextLevel === 'aal2') {
              setMfaNeedsVerification(true);
            } else {
              setMfaNeedsVerification(false);
            }
          } else {
            setMfaNeedsVerification(false);
            setActiveMfaFactor(null);
          }

          // 4. Idempotent Welcome Notification (created once)
          const { data: existingWelcome } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', authUser.id)
            .eq('type', 'WELCOME')
            .limit(1);

          if (!existingWelcome || existingWelcome.length === 0) {
            await supabase.from('notifications').insert({
              user_id: authUser.id,
              type: 'WELCOME',
              title: '¡Bienvenido a OLA SOCIAL!',
              message: 'Tu cuenta ha sido creada exitosamente. Explora el lobby y apoya a creadores reales.',
              read: false,
              created_at: new Date().toISOString()
            });
          }
        }
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
            setMfaNeedsVerification(false);
            setMfaFactors([]);
            setActiveMfaFactor(null);
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

  // Google OAuth Login
  const loginWithGoogle = async () => {
    setAuthError(null);
    setIsLoading(true);

    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error(
          'Supabase no está configurado en las variables de entorno.'
        );
      }

      // Real Google OAuth via Supabase Auth (preserves pathname like /app/ on GitHub Pages)
      const redirectUrl = new URL(window.location.pathname, window.location.origin).toString();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
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

  // Verify MFA Challenge
  const verifyMfaCode = async (code: string, factorId?: string): Promise<boolean> => {
    const targetFactorId = factorId || activeMfaFactor?.id || (mfaFactors[0]?.id);
    if (!targetFactorId) {
      setAuthError('No se encontró ningún factor MFA registrado');
      return false;
    }

    const { success, error } = await challengeAndVerifyMfa(targetFactorId, code);
    if (success) {
      setMfaNeedsVerification(false);
      setAuthError(null);
      if (user) {
        await updateProfile({ mfa_enabled: true });
      }
      return true;
    } else {
      setAuthError(error || 'Código incorrecto');
      return false;
    }
  };

  // Enroll new MFA Factor
  const enrollMfa = async (friendlyName: string = 'Autenticador Principal'): Promise<MfaEnrollResult | null> => {
    const { data, error } = await enrollMfaTotp(friendlyName);
    if (error) {
      setAuthError(error);
      return null;
    }
    return data;
  };

  // Unenroll MFA Factor
  const unenrollMfa = async (factorId: string): Promise<boolean> => {
    const { success, error } = await unenrollMfaFactor(factorId);
    if (success) {
      const factors = await listUserMfaFactors();
      setMfaFactors(factors.totp);
      if (factors.totp.length === 0 && user) {
        await updateProfile({ mfa_enabled: false });
        setActiveMfaFactor(null);
      }
      return true;
    } else {
      setAuthError(error || 'Error al desvincular factor');
      return false;
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
      setMfaNeedsVerification(false);
      setMfaFactors([]);
      setActiveMfaFactor(null);
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;

    // Disallow unauthorized role/status/level/XP elevation from client
    const safeData: Partial<UserProfile> = { ...data };
    delete safeData.role;
    delete safeData.status;
    delete safeData.reputation;
    delete safeData.stars_count;
    delete safeData.hugs_done;
    delete safeData.hugs_verified;
    delete safeData.level_number;
    delete safeData.experience_points;
    delete safeData.reputation_score;
    delete safeData.unique_users_helped;
    delete safeData.unique_platforms_supported;
    delete safeData.unique_campaigns_completed;

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

  const refreshProfile = async () => {
    if (!user || !isSupabaseConfigured) return;
    try {
      const refreshed = await fetchUserProfile(user.id);
      if (refreshed) {
        setUser(refreshed);
      }
    } catch (err) {
      console.warn('Error refreshing profile:', err);
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
    Boolean(
      user?.email &&
        (user.email.toLowerCase() === ADMIN_PRIMARY_EMAIL.toLowerCase() ||
          user.email.toLowerCase() === 'v19629049@gmail.com')
    );

  const isAdmin = isSuperAdmin || user?.role === UserRole.ADMIN;

  // Strict Onboarding Rule: Once completed and confirmed, never ask again
  const needsOnboarding = Boolean(
    user &&
      !user.onboarding_completed &&
      (!user.is_18_confirmed || !user.terms_accepted_at)
  );

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
        mfaNeedsVerification,
        mfaFactors,
        activeMfaFactor,
        setLanguage,
        loginWithGoogle,
        verifyMfaCode,
        enrollMfa,
        unenrollMfa,
        logout,
        updateProfile,
        refreshProfile,
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
