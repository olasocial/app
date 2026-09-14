import React, { useEffect } from 'react';
import {
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
  Megaphone,
  ShieldAlert,
  Bell,
  X
} from 'lucide-react';
import { NotificationItem, NotificationType } from '../types';

interface ForegroundNotificationToastProps {
  notification: NotificationItem | null;
  onDismiss: () => void;
  onView: (notification: NotificationItem) => void;
}

export const ForegroundNotificationToast: React.FC<ForegroundNotificationToastProps> = ({
  notification,
  onDismiss,
  onView
}) => {
  useEffect(() => {
    if (!notification) return;

    // Auto-dismiss after 6 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);

    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case NotificationType.TASK_ASSIGNED:
      case NotificationType.NEW_TASK:
        return <HeartHandshake className="w-5 h-5 text-rose-500" />;
      case NotificationType.TASK_VERIFIED:
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case NotificationType.TASK_REJECTED:
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case NotificationType.SECURITY_ALERT:
      case NotificationType.ACCOUNT_WARNING:
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case NotificationType.ADMIN_MESSAGE:
      case NotificationType.CAMPAIGN_UPDATE:
        return <Megaphone className="w-5 h-5 text-sky-500" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div
      role="alert"
      className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-sky-100 ring-1 ring-slate-900/5 animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-2xs">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
            {notification.title}
          </h4>
          <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
            {notification.message}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                onView(notification);
                onDismiss();
              }}
              className="text-[11px] font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Ver detalles
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 px-1 py-1 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar notificación"
          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
