/**
 * OLA SOCIAL — Progressive Web App & Notification Engine
 * Manages Service Worker lifecycle, install prompt interception,
 * persistent updates, App Badge API, and Web Push.
 */

export interface PWAState {
  isInstalled: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  canInstall: boolean;
  updateAvailable: boolean;
  notificationPermission: NotificationPermission;
}

type PWAStateListener = (state: PWAState) => void;

class PWAManager {
  private deferredPrompt: any = null;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private waitingWorker: ServiceWorker | null = null;
  private updateAvailable = false;
  private listeners: Set<PWAStateListener> = new Set();

  private isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  private isIOS(): boolean {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
  }

  public getState(): PWAState {
    const standalone = this.isStandalone();
    return {
      isInstalled: standalone || localStorage.getItem('ola_pwa_installed') === 'true',
      isStandalone: standalone,
      isIOS: this.isIOS(),
      canInstall: !!this.deferredPrompt && !standalone,
      updateAvailable: this.updateAvailable,
      notificationPermission:
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    };
  }

  public subscribe(listener: PWAStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('[PWA] Listener error:', err);
      }
    });
  }

  public init() {
    if (typeof window === 'undefined') return;

    // Listen for display mode changes (user installs app while viewing)
    try {
      window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
        if (e.matches) {
          localStorage.setItem('ola_pwa_installed', 'true');
          this.deferredPrompt = null;
          this.notify();
        }
      });
    } catch {
      // Ignored for older browsers
    }

    // Intercept native browser install prompt (Chrome / Android / Edge)
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.notify();
    });

    // App installed event
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      localStorage.setItem('ola_pwa_installed', 'true');
      this.notify();
    });

    // Register Service Worker
    this.registerServiceWorker();
  }

  private async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    try {
      // Register with relative scope to support both / and /app/
      const registration = await navigator.serviceWorker.register('./sw.js', {
        scope: './'
      });
      this.swRegistration = registration;

      // 1. Check if there's already an active waiting worker from a previous session
      if (registration.waiting) {
        this.waitingWorker = registration.waiting;
        this.updateAvailable = true;
        this.notify();
      }

      // 2. Listen for newly discovered updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version installed and ready to activate!
            this.waitingWorker = newWorker;
            this.updateAvailable = true;
            this.notify();
          }
        });
      });

      // 3. Reload cleanly when the new worker takes control (after SKIP_WAITING)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      // Periodically check for service worker updates (e.g. on focus)
      window.addEventListener('focus', () => {
        registration.update().catch(() => {});
      });
    } catch (error) {
      console.warn('[PWA] Service Worker registration failed:', error);
    }
  }

  /**
   * Prompts the native Android/Chrome install dialog
   */
  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        localStorage.setItem('ola_pwa_installed', 'true');
        this.deferredPrompt = null;
        this.notify();
        return true;
      }
      this.deferredPrompt = null;
      this.notify();
      return false;
    } catch {
      this.deferredPrompt = null;
      this.notify();
      return false;
    }
  }

  /**
   * Activates the waiting Service Worker cleanly without deleting user session or data
   */
  public applyUpdate(): void {
    if (this.waitingWorker) {
      this.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else if (this.swRegistration?.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Fallback reload
      window.location.reload();
    }
  }

  /**
   * App Badge API: Updates the badge on the app icon on mobile and desktop
   */
  public async updateAppBadge(count: number): Promise<void> {
    if (typeof navigator === 'undefined') return;
    try {
      if ('setAppBadge' in navigator && typeof (navigator as any).setAppBadge === 'function') {
        if (count > 0) {
          await (navigator as any).setAppBadge(count);
        } else if ('clearAppBadge' in navigator) {
          await (navigator as any).clearAppBadge();
        }
      }
    } catch {
      // Benign failure if not supported or disabled
    }
  }

  /**
   * Request Notification permission with explicit user trigger
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof Notification === 'undefined') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.notify();
      return permission;
    } catch {
      return 'denied';
    }
  }

  /**
   * Display system notification if granted
   */
  public async showSystemNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return;
    }

    try {
      if (this.swRegistration && 'showNotification' in this.swRegistration) {
        await this.swRegistration.showNotification(title, {
          icon: './logo.png',
          badge: './logo.png',
          ...options
        });
      } else {
        new Notification(title, {
          icon: './logo.png',
          ...options
        });
      }
    } catch (e) {
      console.warn('[PWA] showSystemNotification warning:', e);
    }
  }

  public getRegistration(): ServiceWorkerRegistration | null {
    return this.swRegistration;
  }
}

export const pwaManager = new PWAManager();
