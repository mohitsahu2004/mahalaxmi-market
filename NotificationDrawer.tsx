import React from 'react';
import { db } from '../services/db';
import { AppNotification } from '../types';
import { X, Bell, MessageSquare, Smartphone, CheckCheck } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filterRecipient?: string; // 'admin' or tenant mobile/shopId
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  filterRecipient,
}) => {
  if (!isOpen) return null;

  let notifications = db.getNotifications();
  if (filterRecipient) {
    notifications = notifications.filter(
      (n) => n.recipient === filterRecipient || (filterRecipient === 'admin' && n.recipient === 'admin')
    );
  }

  const getChannelBadge = (channel: AppNotification['channel']) => {
    switch (channel) {
      case 'sms':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded">
            <Smartphone className="w-3 h-3" /> SMS
          </span>
        );
      case 'whatsapp':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">
            <MessageSquare className="w-3 h-3" /> WhatsApp
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">
            <Bell className="w-3 h-3" /> In-App
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Notification Center
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No notifications yet.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {getChannelBadge(notif.channel)}
                    {notif.shopBusinessName && (
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {notif.shopBusinessName}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(notif.sentAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                  {notif.message}
                </p>

                <div className="flex items-center justify-end text-[10px] text-emerald-600 dark:text-emerald-400 gap-1 pt-1">
                  <CheckCheck className="w-3 h-3" />
                  <span>Delivered</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
