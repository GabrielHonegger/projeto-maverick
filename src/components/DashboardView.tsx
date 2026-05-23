import React from "react";
import { Users, TrendingUp, Star, ChevronRight } from "lucide-react";
import { FaMotorcycle } from "react-icons/fa6";
import { Client, Motorbike } from "@/types";

interface DashboardViewProps {
  clients: Client[];
  bikes: Motorbike[];
  setActiveView: (view: string) => void;
  setSelectedClient: (client: Client | null) => void;
}

export default function DashboardView({
  clients,
  bikes,
  setActiveView,
  setSelectedClient,
}: DashboardViewProps) {
  const totalClients = clients.length;
  const totalBikes = bikes.length;
  const bmwCount = bikes.filter((b) => b.brand.toLowerCase() === "bmw").length;
  const triumphCount = bikes.filter((b) => b.brand.toLowerCase() === "triumph").length;
  const otherBikesCount = totalBikes - (bmwCount + triumphCount);
  const avgBikesPerClient = totalClients > 0 ? (totalBikes / totalClients).toFixed(1) : "0";

  const recentClients = [...clients]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const statCards = [
    {
      label: "Total de Clientes",
      value: totalClients,
      sub: "Cadastrados",
      icon: Users,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Motos Registradas",
      value: totalBikes,
      sub: "No sistema",
      icon: FaMotorcycle,
      iconBg: "bg-zinc-100",
      iconColor: "text-zinc-700",
    },
    {
      label: "Motos / Cliente",
      value: avgBikesPerClient,
      sub: "Média",
      icon: TrendingUp,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Marcas Premium",
      value: bmwCount + triumphCount,
      sub: `BMW ${bmwCount} · Triumph ${triumphCount}`,
      icon: Star,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
  ];

  const brandBars = [
    { name: "BMW", count: bmwCount, color: "bg-blue-500" },
    { name: "Triumph", count: triumphCount, color: "bg-amber-500" },
    { name: "Outras", count: otherBikesCount, color: "bg-zinc-300" },
  ];

  return (
    <div className="space-y-5 sm:space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">Painel Geral</h1>
        <p className="text-zinc-500 mt-1 text-sm">Bem-vindo ao painel de controle da oficina.</p>
      </div>

      {/* Stat Cards — 2 cols on mobile, 4 on large */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-zinc-100 p-4 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <p className="text-[10px] sm:text-[11px] font-semibold text-zinc-400 uppercase tracking-widest leading-tight">
                  {card.label}
                </p>
                <div className={`${card.iconBg} p-1.5 sm:p-2 rounded-xl shrink-0`}>
                  <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${card.iconColor}`} strokeWidth={2} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                {card.value}
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 font-medium">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Lower section — stacks on mobile */}
      <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
        {/* Brand Distribution */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm overflow-hidden">
          <h2 className="text-sm font-bold text-zinc-900 mb-0.5">Marcas Atendidas</h2>
          <p className="text-xs text-zinc-400 mb-5">Distribuição por marca</p>
          {totalBikes === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">Nenhuma moto cadastrada.</div>
          ) : (
            <div className="space-y-4">
              {brandBars.map((bar) => (
                <div key={bar.name}>
                  <div className="flex justify-between text-xs font-semibold mb-1.5 text-zinc-700">
                    <span>{bar.name}</span>
                    <span className="text-zinc-400">
                      {bar.count} ({totalBikes > 0 ? Math.round((bar.count / totalBikes) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`${bar.color} h-full rounded-full transition-all duration-700`}
                      style={{ width: `${totalBikes > 0 ? (bar.count / totalBikes) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Clients */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Clientes Recentes</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Últimos cadastros</p>
            </div>
            <button
              onClick={() => setActiveView("clients")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors shrink-0"
            >
              Ver todos →
            </button>
          </div>

          {recentClients.length === 0 ? (
            <div className="py-10 text-center text-xs text-zinc-400">Nenhum cliente cadastrado ainda.</div>
          ) : (
            <div className="space-y-1">
              {recentClients.map((client) => {
                const clientBikes = bikes.filter((b) => b.clientId === client.id);
                const initials = client.name
                  .split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
                return (
                  <button
                    key={client.id}
                    className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-zinc-50 transition-colors group text-left overflow-hidden"
                    onClick={() => { setSelectedClient(client); setActiveView("clients"); }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-[11px] font-bold text-zinc-600 shrink-0 group-hover:bg-zinc-900 group-hover:text-white transition-all duration-150">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-zinc-800 group-hover:text-blue-600 transition-colors truncate">
                          {client.name}
                        </p>
                        {client.nickname && (
                          <p className="text-xs text-zinc-400 truncate hidden sm:block">{client.nickname}</p>
                        )}
                        <p className="text-xs text-zinc-400 truncate">{client.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full whitespace-nowrap">
                        {clientBikes.length} {clientBikes.length === 1 ? "moto" : "motos"}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-zinc-300 sm:hidden" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
