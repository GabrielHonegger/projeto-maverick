import React from "react";
import { LayoutDashboard, Users, Bike, X } from "lucide-react";

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onClose?: () => void;
}

export default function Sidebar({ activeView, setActiveView, onClose }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Painel Geral", icon: LayoutDashboard },
    { id: "clients", label: "Clientes", icon: Users },
    { id: "bikes", label: "Motocicletas", icon: Bike },
  ];

  return (
    <aside className="w-72 md:w-64 bg-white flex flex-col border-r border-zinc-100 h-full shadow-[1px_0_0_0_rgba(0,0,0,0.04)]">
      {/* Brand Header */}
      <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-white">
        <img src="/logo.png" alt="Agus Moto Conceito" className="h-11 w-auto object-contain" />
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden h-8 w-8 flex items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest px-3 pb-2.5">
          Menu
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-zinc-900 text-white font-semibold shadow-sm"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <span
                className={`flex items-center justify-center h-7 w-7 rounded-lg transition-all duration-150 shrink-0 ${
                  isActive ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-500"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 2} />
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 pb-6">
        <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-zinc-500">Sistema online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
