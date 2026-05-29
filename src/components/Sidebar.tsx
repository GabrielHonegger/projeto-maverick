import React from "react";
import { LayoutDashboard, Users, FileText, X, ShieldCheck, DollarSign } from "lucide-react";
import { FaMotorcycle } from "react-icons/fa6";
import Link from "next/link";

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onClose?: () => void;
  userRole?: string;
}

export default function Sidebar({ activeView, setActiveView, onClose, userRole }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Painel Geral", icon: LayoutDashboard },
    { id: "clients", label: "Clientes", icon: Users },
    { id: "bikes", label: "Motocicletas", icon: FaMotorcycle },
    { id: "service-orders", label: "Ordens de Serviço", icon: FileText },
    ...(userRole === "admin_geral" ? [{ id: "team", label: "Equipe", icon: ShieldCheck }] : []),
    { id: "billing", label: "Faturamento", icon: DollarSign },
  ];

  return (
    <aside className="w-64 md:w-56 bg-white flex flex-col border-r border-zinc-100 h-full shadow-[1px_0_0_0_rgba(0,0,0,0.04)]">
      {/* Brand Header */}
      <div className="px-4.5 py-4 border-b border-zinc-100 flex items-center justify-between bg-white bg-cover">
        <img src="/logo.png" alt="Agus Moto Conceito" className="h-9 w-auto object-contain" />
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden h-8 w-8 flex items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-4 space-y-0.5">
        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-2.5 pb-2">
          Menu
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const path =
            item.id === "dashboard"
              ? "/dashboard"
              : item.id === "clients"
              ? "/clientes"
              : item.id === "bikes"
              ? "/motocicletas"
              : item.id === "service-orders"
              ? "/ordens-servico"
              : item.id === "team"
              ? "/team"
              : "/faturamento";
          return (
            <Link
              key={item.id}
              href={path}
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 768 && onClose) {
                  onClose();
                }
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <span
                className={`flex items-center justify-center h-6 w-6 rounded-md transition-all duration-150 shrink-0 ${
                  isActive ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-500"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={isActive ? 2.5 : 2} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4">
        <div className="rounded-lg bg-zinc-50/50 border border-zinc-100 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-semibold text-zinc-500">Sistema online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
