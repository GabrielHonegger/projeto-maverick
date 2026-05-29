import React from "react";
import Link from "next/link";
import { Users, TrendingUp, Star, ChevronRight, DollarSign, FileText, CheckCircle2, AlertCircle, Clock, Ban } from "lucide-react";
import { FaMotorcycle } from "react-icons/fa6";
import { Client, Motorbike, ServiceOrderWithRelations } from "@/types";

interface DashboardViewProps {
  clients: Client[];
  bikes: Motorbike[];
  serviceOrders: ServiceOrderWithRelations[];
  setActiveView: (view: string) => void;
  setSelectedClient: (client: Client | null) => void;
  setSelectedServiceOrder: (order: ServiceOrderWithRelations) => void;
}

export default function DashboardView({
  clients,
  bikes,
  serviceOrders,
  setActiveView,
  setSelectedClient,
  setSelectedServiceOrder,
}: DashboardViewProps) {
  const totalClients = clients.length;
  const totalBikes = bikes.length;
  const totalOS = serviceOrders.length;

  // OS Status Counts
  const osPending = serviceOrders.filter(
    (o) => o.status === "montagem_orcamento" || o.status === "aguardando_aprovacao"
  ).length;
  const osInProgress = serviceOrders.filter((o) => o.status === "aprovado").length;
  const osCompleted = serviceOrders.filter((o) => o.status === "encerrado").length;
  const osRejected = serviceOrders.filter((o) => o.status === "recusado").length;

  // Financial Metrics
  let grossRevenue = 0;
  let paidRevenue = 0;
  let towingFeesTotal = 0;
  let discountsTotal = 0;

  serviceOrders.forEach((order) => {
    grossRevenue += order.totalValue || 0;
    towingFeesTotal += order.towingFee || 0;
    discountsTotal += order.discounts || 0;
    order.payments?.forEach((pay) => {
      paidRevenue += pay.amount || 0;
    });
  });

  const pendingRevenue = Math.max(0, grossRevenue - paidRevenue);
  const avgOSValue = totalOS > 0 ? (grossRevenue / totalOS).toFixed(2) : "0,00";

  // Recent clients (4)
  const recentClients = [...clients]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  // Recent service orders (4)
  const recentOS = [...serviceOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const BRAND_LOGOS: Record<string, string> = {
    "bmw": "/marcas/bmw.png",
    "ducati": "/marcas/ducati.png",
    "harley-davidson": "/marcas/harley-davidson.png",
    "harley davidson": "/marcas/harley-davidson.png",
    "honda": "/marcas/honda.png",
    "husqvarna": "/marcas/husqvarna.png",
    "kmt": "/marcas/kmt.png",
    "ktm": "/marcas/kmt.png",
    "royal-enfield": "/marcas/royal-enfield.png",
    "royal enfield": "/marcas/royal-enfield.png",
    "suzuki": "/marcas/suzuki.png",
    "triumph": "/marcas/triumph.png",
    "yamaha": "/marcas/yamaha.png",
    "cf-motos": "/marcas/cf-motos.png",
    "cf motos": "/marcas/cf-motos.png",
    "kawasaki": "/marcas/kawasaki.png",
    "haojue": "/marcas/haojue.png",
    "bajaj": "/marcas/bajaj.png"
  };

  // Dynamic brand distribution
  const brandCounts: Record<string, number> = {};
  bikes.forEach((b) => {
    const brandKey = b.brand.toLowerCase().trim();
    brandCounts[brandKey] = (brandCounts[brandKey] || 0) + 1;
  });

  const sortedBrands = Object.entries(brandCounts)
    .map(([key, count]) => {
      const originalName = bikes.find((b) => b.brand.toLowerCase().trim() === key)?.brand || key;
      return {
        key,
        name: originalName,
        count,
        percentage: totalBikes > 0 ? Math.round((count / totalBikes) * 100) : 0,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // top 5 brands

  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "montagem_orcamento":
      case "aguardando_aprovacao":
        return <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-50 text-amber-700 border border-amber-100">Orcamento</span>;
      case "aprovado":
        return <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-100 animate-pulse">Andamento</span>;
      case "recusado":
        return <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-red-50 text-red-600 border border-red-100">Recusado</span>;
      case "encerrado":
        return <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-zinc-100 text-zinc-650 border border-zinc-200">Finalizado</span>;
      default:
        return null;
    }
  };

  const statCards = [
    {
      label: "Faturamento Bruto",
      value: formatCurrency(grossRevenue),
      sub: `Média de ${formatCurrency(Number(avgOSValue))} por O.S.`,
      icon: DollarSign,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "O.S. em Andamento",
      value: osInProgress,
      sub: "Serviços ativos na oficina",
      icon: FaMotorcycle,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Aguardando Aprovação",
      value: osPending,
      sub: "Orçamentos pendentes do cliente",
      icon: Clock,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "O.S. Finalizadas",
      value: osCompleted,
      sub: "Histórico total de ordens concluídas",
      icon: CheckCircle2,
      iconBg: "bg-zinc-100",
      iconColor: "text-zinc-600",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="h-4.5 w-4.5 text-zinc-500" />
          Painel de Controle Geral
        </h2>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-tight">
                  {card.label}
                </p>
                <div className={`${card.iconBg} p-1.5 rounded-lg shrink-0`}>
                  <Icon className={`h-4 w-4 ${card.iconColor}`} strokeWidth={2.5} />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-zinc-950 tracking-tight">
                {card.value}
              </div>
              <p className="text-[11px] text-zinc-450 mt-1 font-semibold">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Middle Sections (Grid with 3 boxes) */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Brand Distribution */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Marcas Atendidas</h3>
            <p className="text-[10px] text-zinc-450 font-semibold mb-4">Principais marcas na oficina</p>
            {totalBikes === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-450">Nenhuma moto cadastrada.</div>
            ) : (
              <div className="space-y-3.5">
                {sortedBrands.map((brand) => {
                  const logoPath = BRAND_LOGOS[brand.key];
                  return (
                    <div key={brand.key} className="flex items-center gap-3">
                      {logoPath ? (
                        <img
                          src={logoPath}
                          alt={brand.name}
                          className="h-6 w-10 object-contain shrink-0"
                        />
                      ) : (
                        <div className="h-6 w-10 bg-zinc-150 rounded text-[9px] font-bold text-zinc-500 flex items-center justify-center shrink-0 border border-zinc-200">
                          {brand.name.substring(0, 3).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between text-[11px] font-semibold mb-1 text-zinc-650">
                          <span>{brand.name}</span>
                          <span className="text-zinc-400 font-bold">
                            {brand.count} ({brand.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-zinc-800 h-full rounded-full transition-all duration-700"
                            style={{ width: `${brand.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {totalBikes > 0 && (
            <Link
              href="/motocicletas"
              className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 py-1.5 rounded-xl transition-all w-full mt-4 text-center block"
            >
              Ver todas as {totalBikes} motos →
            </Link>
          )}
        </div>

        {/* Financial Summary Card */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Resumo Financeiro</h3>
            <p className="text-[10px] text-zinc-450 font-semibold mb-4">Fluxo de caixa das Ordens de Serviço</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 bg-emerald-50/50 border border-emerald-100/50 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700">Total Recebido</span>
                  <p className="text-sm font-extrabold text-emerald-950 mt-0.5">{formatCurrency(paidRevenue)}</p>
                </div>
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>

              <div className="flex items-center justify-between p-2.5 bg-amber-50/50 border border-amber-100/50 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-700">Saldo a Receber</span>
                  <p className="text-sm font-extrabold text-amber-950 mt-0.5">{formatCurrency(pendingRevenue)}</p>
                </div>
                <Clock className="h-5 w-5 text-amber-500" />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="p-2 border border-zinc-150 rounded-xl bg-zinc-50/30">
                  <span className="text-[9px] uppercase font-bold text-zinc-400">Taxas de Guincho</span>
                  <p className="text-xs font-bold text-zinc-700 mt-0.5">{formatCurrency(towingFeesTotal)}</p>
                </div>
                <div className="p-2 border border-zinc-150 rounded-xl bg-zinc-50/30">
                  <span className="text-[9px] uppercase font-bold text-zinc-400">Total Descontos</span>
                  <p className="text-xs font-bold text-zinc-700 mt-0.5">{formatCurrency(discountsTotal)}</p>
                </div>
              </div>
            </div>
          </div>
          <Link
            href="/ordens-servico"
            className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 py-1.5 rounded-xl transition-all w-full mt-4 text-center block"
          >
            Acessar Faturamento de O.S. →
          </Link>
        </div>

        {/* OS Stats Stage Summary */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Situação de Ordens</h3>
            <p className="text-[10px] text-zinc-450 font-semibold mb-4">Total de {totalOS} ordens abertas</p>
            <div className="space-y-2">
              {[
                { label: "Orçamentos (Pendentes)", count: osPending, color: "bg-amber-500", icon: Clock },
                { label: "Aprovadas (Em Execução)", count: osInProgress, color: "bg-emerald-500 animate-pulse", icon: FaMotorcycle },
                { label: "Finalizadas (Concluídas)", count: osCompleted, color: "bg-zinc-500", icon: CheckCircle2 },
                { label: "Recusadas (Canceladas)", count: osRejected, color: "bg-red-500", icon: Ban },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center justify-between p-2 border border-zinc-100 rounded-xl hover:bg-zinc-50/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${item.color}`} />
                      <span className="text-[11px] font-bold text-zinc-700">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-zinc-900">{item.count}</span>
                      <span className="text-[9px] font-bold text-zinc-400">({totalOS > 0 ? Math.round((item.count / totalOS) * 100) : 0}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <Link
            href="/ordens-servico"
            className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 py-1.5 rounded-xl transition-all w-full mt-4 text-center block"
          >
            Visualizar no Quadro de O.S. →
          </Link>
        </div>
      </div>

      {/* Lower section — stacks on mobile */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Clients */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-2">
            <div>
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Clientes Recentes</h3>
              <p className="text-[10px] text-zinc-450 font-semibold">Últimos cadastros na plataforma</p>
            </div>
            <Link
              href="/clientes"
              className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors shrink-0 block"
            >
              Ver todos →
            </Link>
          </div>

          {recentClients.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-450">Nenhum cliente cadastrado ainda.</div>
          ) : (
            <div className="space-y-1">
              {recentClients.map((client) => {
                const clientBikes = bikes.filter((b) => b.clientId === client.id);
                const initials = client.name
                  .split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
                return (
                  <Link
                    key={client.id}
                    className="w-full flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-zinc-50 transition-colors group text-left overflow-hidden cursor-pointer block"
                    href={`/clientes/${client.id}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="h-7.5 w-7.5 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-650 shrink-0 group-hover:bg-zinc-900 group-hover:text-white transition-all duration-155">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-zinc-800 group-hover:text-blue-600 transition-colors truncate">
                          {client.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-550 font-semibold">
                          {client.nickname && (
                            <span className="text-zinc-400 truncate">({client.nickname})</span>
                          )}
                          <span className="text-zinc-300">•</span>
                          <span className="truncate">{client.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[9px] font-bold text-zinc-550 bg-zinc-100 px-2 py-0.5 rounded-lg border border-zinc-150">
                        {clientBikes.length} {clientBikes.length === 1 ? "moto" : "motos"}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-zinc-350 shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Service Orders */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-2">
            <div>
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Ordens de Serviço Recentes</h3>
              <p className="text-[10px] text-zinc-450 font-semibold">Últimas movimentações</p>
            </div>
            <Link
              href="/ordens-servico"
              className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors shrink-0 block"
            >
              Ver todos →
            </Link>
          </div>

          {recentOS.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-450">Nenhuma ordem de serviço registrada.</div>
          ) : (
            <div className="space-y-1">
              {recentOS.map((order) => {
                return (
                  <Link
                    key={order.id}
                    className="w-full flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-zinc-50 transition-colors group text-left overflow-hidden cursor-pointer block"
                    href={`/ordens-servico/${String(order.osNumber).padStart(4, "0")}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="h-7.5 w-7.5 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 group-hover:bg-zinc-900 group-hover:text-white transition-all duration-155">
                        <FileText className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-zinc-800 group-hover:text-blue-600 transition-colors truncate">
                            #{String(order.osNumber).padStart(4, "0")} · {order.motorbike.model}
                          </p>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-550 font-semibold mt-0.5">
                          <span className="truncate">{order.client.name}</span>
                          <span className="text-zinc-300">•</span>
                          <span className="font-mono uppercase">{order.motorbike.plate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[11px] font-extrabold text-zinc-950">
                        {formatCurrency(order.totalValue)}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-zinc-350 shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
