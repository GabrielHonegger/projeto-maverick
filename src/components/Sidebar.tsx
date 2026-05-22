import React from "react";
import { LayoutDashboard, Users, Bike, Wrench } from "lucide-react";

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export default function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Painel Geral", icon: LayoutDashboard },
    { id: "clients", label: "Clientes", icon: Users },
    { id: "bikes", label: "Motocicletas", icon: Bike },
  ];

  return (
    <aside className="w-64 bg-zinc-950 text-zinc-100 flex flex-col border-r border-zinc-800 h-full">
      {/* Brand Logo Header */}
      <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-center">
        <img src="/logo.png" alt="Agus Moto Conceito Logo" className="h-12 w-auto object-contain" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/10"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-zinc-800">
        <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/80">
          <p className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Status do Servidor</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-zinc-300 font-medium">Modo Protótipo Local</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
