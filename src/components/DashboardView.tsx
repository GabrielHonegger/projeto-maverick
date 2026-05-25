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
    <div className="space-y-3 sm:space-y-4 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="h-4.5 w-4.5 text-zinc-500" />
          Painel de Controle / Oficina
        </h2>
      </div>

      {/* Stat Cards — 2 cols on mobile, 4 on large */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-zinc-100 p-3 sm:p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-tight">
                  {card.label}
                </p>
                <div className={`${card.iconBg} p-1 rounded-lg shrink-0`}>
                  <Icon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${card.iconColor}`} strokeWidth={2.5} />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-zinc-950 tracking-tight">
                {card.value}
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-1 font-semibold">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Lower section — stacks on mobile */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        {/* Brand Distribution */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm overflow-hidden">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Marcas Atendidas</h3>
          <p className="text-[10px] text-zinc-400 font-semibold mb-3">Distribuição por marca</p>
          {totalBikes === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">Nenhuma moto cadastrada.</div>
          ) : (
            <div className="space-y-3">
              {brandBars.map((bar) => (
                <div key={bar.name}>
                  <div className="flex justify-between text-[11px] font-semibold mb-1 text-zinc-650">
                    <span>{bar.name}</span>
                    <span className="text-zinc-400 font-bold">
                      {bar.count} ({totalBikes > 0 ? Math.round((bar.count / totalBikes) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden">
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
        <div className="md:col-span-2 bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Clientes Recentes</h3>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Últimos cadastros</p>
            </div>
            <button
              onClick={() => setActiveView("clients")}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors shrink-0"
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
                    className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-xl hover:bg-zinc-50 transition-colors group text-left overflow-hidden"
                    onClick={() => { setSelectedClient(client); setActiveView("clients"); }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="h-7 w-7 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-600 shrink-0 group-hover:bg-zinc-900 group-hover:text-white transition-all duration-150">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-zinc-800 group-hover:text-blue-600 transition-colors truncate">
                          {client.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-semibold">
                          {client.nickname && (
                            <span className="text-zinc-400 truncate hidden sm:inline">({client.nickname})</span>
                          )}
                          <span className="hidden sm:inline">•</span>
                          <span className="truncate">{client.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[9px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
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
