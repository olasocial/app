import { useState, useEffect } from 'react';
import { pwaManager, PWAState } from '../services/pwaManager';

export function usePWA() {
  const [state, setState] = useState<PWAState>(() => pwaManager.getState());

  useEffect(() => {
    pwaManager.init();
    const unsubscribe = pwaManager.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  return {
    ...state,
    promptInstall: () => pwaManager.promptInstall(),
    applyUpdate: () => pwaManager.applyUpdate(),
    requestNotificationPermission: () => pwaManager.requestNotificationPermission(),
    updateAppBadge: (count: number) => pwaManager.updateAppBadge(count)
  };
}
