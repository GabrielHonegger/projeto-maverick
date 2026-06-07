import React, { useState, useRef, useEffect } from "react";
import { Bell, BellOff, Check, CheckSquare } from "lucide-react";
import { SystemNotification } from "@/types";

interface NotificationCenterProps {
  notifications: SystemNotification[];
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onNavigate: (path: string) => void;
  isAdmin: boolean;
}

export default function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigate,
  isAdmin,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Only show notification badge/menu for administrators (admin_geral / aux_admin)
  if (!isAdmin) {
    return null;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const handleNotificationClick = async (notification: SystemNotification) => {
    if (!notification.read) {
      await onMarkAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.link) {
      onNavigate(notification.link);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all p-2 rounded-xl cursor-pointer"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 bg-white border border-zinc-200 rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
            <span className="text-xs font-extrabold text-zinc-800 uppercase tracking-wider">
              Notificações
            </span>
            {unreadCount > 0 && (
              <button
                onClick={async () => {
                  await onMarkAllAsRead();
                }}
                className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 flex items-center gap-1 cursor-pointer transition-colors"
                title="Marcar todas como lidas"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                Marcar todas lidas
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-50">
            {notifications.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center text-zinc-400">
                <BellOff className="h-8 w-8 text-zinc-300 mb-2" />
                <p className="text-xs font-semibold">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 text-left transition-colors cursor-pointer hover:bg-zinc-50/80 flex items-start gap-2.5 ${
                    !notification.read ? "bg-zinc-50/40" : ""
                  }`}
                >
                  {/* Unread indicator dot */}
                  {!notification.read && (
                    <span className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  )}
                  <div className="flex-1 space-y-0.5">
                    <p className={`text-xs ${!notification.read ? "font-bold text-zinc-950" : "font-semibold text-zinc-700"}`}>
                      {notification.title}
                    </p>
                    <p className="text-[10px] font-semibold text-zinc-400 leading-normal">
                      {notification.message}
                    </p>
                    <p className="text-[9px] font-bold text-zinc-400 pt-1">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
