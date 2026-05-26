import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  AlertCircle,
  CreditCard,
  Landmark,
  Wallet,
  CheckCircle2,
  ChevronRight,
  User,
  Wrench,
  Package,
  Info,
  SlidersHorizontal
} from "lucide-react";
import { ServiceOrderWithRelations, Technician, Client } from "@/types";

interface BillingViewProps {
  serviceOrders: ServiceOrderWithRelations[];
  clients: Client[];
  technicians: Technician[];
  onOSSelect: (order: ServiceOrderWithRelations) => void;
}

export default function BillingView({
  serviceOrders,
  clients,
  technicians,
  onOSSelect
}: BillingViewProps) {
  // Period state
  const [period, setPeriod] = useState<"all" | "last30" | "thisMonth" | "lastMonth" | "thisYear">("thisMonth");
  // Status state
  const [osStatus, setOsStatus] = useState<"all" | "encerrado" | "aprovado">("all");

  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatDateOnly = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  // Helper to verify if a date string is inside the chosen period
  const checkPeriod = (dateStr: string | null | undefined, filterPeriod: typeof period) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    const now = new Date();
    
    // Set to start of day for accurate comparison
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (filterPeriod === "all") return true;

    if (filterPeriod === "last30") {
      const thirtyDaysAgo = new Date(startOfToday);
      thirtyDaysAgo.setDate(startOfToday.getDate() - 30);
      return d >= thirtyDaysAgo;
    }

    if (filterPeriod === "thisMonth") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }

    if (filterPeriod === "lastMonth") {
      let targetMonth = now.getMonth() - 1;
      let targetYear = now.getFullYear();
      if (targetMonth < 0) {
        targetMonth = 11;
        targetYear -= 1;
      }
      return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    }

    if (filterPeriod === "thisYear") {
      return d.getFullYear() === now.getFullYear();
    }

    return true;
  };

  // 1. FILTER SERVICE ORDERS
  const filteredOrders = serviceOrders.filter((order) => {
    // Only include real O.S. type (exclude budgets/orcamentos unless they are OS)
    if (order.type !== "os") return false;

    // Apply O.S. status filter
    if (osStatus === "encerrado" && order.status !== "encerrado") return false;
    if (osStatus === "aprovado" && order.status !== "aprovado") return false;

    // Apply period filter based on order entryDate
    return checkPeriod(order.entryDate, period);
  });

  // 2. COLLECT AND FILTER PAYMENTS
  // Payments are linked to O.S. but we want to filter them based on the payment's own date
  // to correctly represent the Cash Flow (Regime de Caixa) for the selected period
  const allPayments: Array<{
    id: string;
    amount: number;
    date: string;
    method: string;
    account: string;
    order: ServiceOrderWithRelations;
  }> = [];

  serviceOrders.forEach((order) => {
    if (order.type !== "os") return;
    // Apply O.S. status filter here as well to keep in sync with active dataset
    if (osStatus === "encerrado" && order.status !== "encerrado") return;
    if (osStatus === "aprovado" && order.status !== "aprovado") return;

    order.payments?.forEach((p) => {
      allPayments.push({
        ...p,
        order
      });
    });
  });

  // Filter payments by the payment date
  const filteredPayments = allPayments.filter((p) => checkPeriod(p.date, period));

  // --- STAT CARD CALCULATIONS ---
  // Gross billing (Sum of total value of filtered O.S.)
  const grossRevenue = filteredOrders.reduce((sum, order) => sum + (order.totalValue || 0), 0);

  // Payments received (Sum of payments made within the period)
  const receivedRevenue = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Outstanding/pending balance (For the filtered O.S. set, what remains to be paid)
  const pendingRevenue = filteredOrders.reduce((sum, order) => {
    const totalPaid = (order.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
    const diff = (order.totalValue || 0) - totalPaid;
    return sum + (diff > 0 ? diff : 0);
  }, 0);

  // Net estimated profit
  // Labor revenue + parts markup.
  // parts markup = salePrice - cost.
  // Mathematically identical to: totalValue - partsCost (only active parts)
  const estimatedProfit = filteredOrders.reduce((sum, order) => {
    const partsCost = (order.parts || [])
      .filter((p) => !p.isOptional)
      .reduce((s, p) => s + (p.cost || 0) * p.quantity, 0);

    // If an OS totalValue exists, subtract the non-optional parts cost from it.
    // This correctly leaves: Labor + parts markup + other fees - discounts.
    return sum + Math.max(0, (order.totalValue || 0) - partsCost);
  }, 0);

  // --- BREAKDOWNS ---
  
  // Payment methods breakdown
  const methodTotals: Record<string, number> = {};
  filteredPayments.forEach((p) => {
    const method = p.method || "Outro";
    methodTotals[method] = (methodTotals[method] || 0) + p.amount;
  });

  const paymentMethods = Object.entries(methodTotals)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: receivedRevenue > 0 ? Math.round((amount / receivedRevenue) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  // Destination accounts breakdown
  const accountTotals: Record<string, number> = {};
  filteredPayments.forEach((p) => {
    const account = p.account || "Não Especificado";
    accountTotals[account] = (accountTotals[account] || 0) + p.amount;
  });

  const accounts = Object.entries(accountTotals)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: receivedRevenue > 0 ? Math.round((amount / receivedRevenue) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  // Mão de Obra (Labor) by Technician
  const techLaborTotals: Record<
    string,
    { id: string; name: string; total: number; count: number; isRegistered: boolean; role?: string }
  > = {};

  filteredOrders.forEach((order) => {
    order.labor?.forEach((l) => {
      if (l.isOptional) return;
      const rawName = l.technician || "Sem Técnico";

      // Match raw name with db technicians
      const matched = technicians.find((t) => {
        const dbName = t.name.toLowerCase().trim();
        const dbFullName = `${t.name} (${t.role})`.toLowerCase().trim();
        const searchName = rawName.toLowerCase().trim();
        return (
          searchName === dbName ||
          searchName === dbFullName ||
          dbName.includes(searchName) ||
          searchName.includes(dbName)
        );
      });

      const key = matched ? matched.id : rawName;
      const displayName = matched ? matched.name : rawName.split("(")[0].trim();
      const role = matched ? matched.role : undefined;

      if (!techLaborTotals[key]) {
        techLaborTotals[key] = {
          id: key,
          name: displayName,
          total: 0,
          count: 0,
          isRegistered: !!matched,
          role
        };
      }

      techLaborTotals[key].total += l.total || 0;
      techLaborTotals[key].count += 1;
    });
  });

  const techLaborList = Object.values(techLaborTotals).sort((a, b) => b.total - a.total);
  const totalLaborValue = techLaborList.reduce((sum, t) => sum + t.total, 0);

  // --- TABLES ---

  // Recent payments
  const recentPayments = [...filteredPayments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10); // Limit to top 10

  // Aggregated parts performance/margin
  const partsAggregation: Record<
    string,
    { name: string; code?: string; qty: number; totalCost: number; totalSale: number }
  > = {};

  filteredOrders.forEach((order) => {
    order.parts?.forEach((p) => {
      if (p.isOptional) return;
      const key = `${p.name.toLowerCase().trim()}_${(p.code || "").toLowerCase().trim()}`;
      if (!partsAggregation[key]) {
        partsAggregation[key] = {
          name: p.name,
          code: p.code,
          qty: 0,
          totalCost: 0,
          totalSale: 0
        };
      }
      partsAggregation[key].qty += p.quantity;
      partsAggregation[key].totalCost += (p.cost || 0) * p.quantity;
      partsAggregation[key].totalSale += p.total || 0;
    });
  });

  const partsPerformance = Object.values(partsAggregation)
    .map((part) => {
      const markup = part.totalSale - part.totalCost;
      const margin = part.totalSale > 0 ? (markup / part.totalSale) * 100 : 0;
      const hasZeroCost = part.totalSale > 0 && part.totalCost === 0;
      return {
        ...part,
        markup,
        margin,
        hasZeroCost
      };
    })
    .sort((a, b) => b.totalSale - a.totalSale)
    .slice(0, 10); // Show top 10 parts by sales revenue

  // Helper for status badge style
  const getOSStatusBadge = (status: string) => {
    switch (status) {
      case "montagem_orcamento":
      case "aguardando_aprovacao":
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-50 text-amber-700 border border-amber-100">
            Orçamento
          </span>
        );
      case "aprovado":
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
            Andamento
          </span>
        );
      case "recusado":
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-50 text-red-650 border border-red-100">
            Recusado
          </span>
        );
      case "encerrado":
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
            Finalizado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Filter Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-5 rounded-2xl border border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-zinc-800" strokeWidth={2.5} />
            Faturamento e Finanças
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-medium">
            Acompanhe o faturamento, lucro estimado, receitas e desempenho operacional da sua oficina.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Period Filter */}
          <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/50">
            <button
              onClick={() => setPeriod("thisMonth")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                period === "thisMonth"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Este Mês
            </button>
            <button
              onClick={() => setPeriod("lastMonth")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                period === "lastMonth"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Mês Anterior
            </button>
            <button
              onClick={() => setPeriod("last30")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                period === "last30"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              30 dias
            </button>
            <button
              onClick={() => setPeriod("thisYear")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                period === "thisYear"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Este Ano
            </button>
            <button
              onClick={() => setPeriod("all")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                period === "all"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Todos
            </button>
          </div>

          {/* OS Status Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1.5 rounded-lg border border-zinc-200">
            <SlidersHorizontal className="h-3 w-3 text-zinc-400" />
            <select
              value={osStatus}
              onChange={(e) => setOsStatus(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-zinc-600 focus:outline-none cursor-pointer border-none p-0 pr-1.5"
            >
              <option value="all">Todas as O.S.</option>
              <option value="encerrado">Apenas Finalizadas</option>
              <option value="aprovado">Apenas Em Andamento</option>
            </select>
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Bruta */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between group hover:border-zinc-200 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Receita Bruta (OS)</span>
              <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                {formatCurrency(grossRevenue)}
              </h2>
            </div>
            <div className="h-9 w-9 rounded-xl bg-zinc-50 text-zinc-500 flex items-center justify-center border border-zinc-100 group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900 transition-all duration-200">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-50 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="font-semibold">{filteredOrders.length} O.S. no período</span>
            <span className="bg-zinc-50 px-1.5 py-0.5 rounded font-bold text-zinc-500">Média: {formatCurrency(filteredOrders.length > 0 ? grossRevenue / filteredOrders.length : 0)}</span>
          </div>
        </div>

        {/* Receita Recebida */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between group hover:border-zinc-200 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Receita Recebida</span>
              <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                {formatCurrency(receivedRevenue)}
              </h2>
            </div>
            <div className="h-9 w-9 rounded-xl bg-zinc-50 text-zinc-500 flex items-center justify-center border border-zinc-100 group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900 transition-all duration-200">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-50 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="font-semibold">{filteredPayments.length} pagamentos realizados</span>
            <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold border border-emerald-100">
              Caixa
            </span>
          </div>
        </div>

        {/* Saldo a Receber */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between group hover:border-zinc-200 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Saldo a Receber</span>
              <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                {formatCurrency(pendingRevenue)}
              </h2>
            </div>
            <div className="h-9 w-9 rounded-xl bg-zinc-50 text-zinc-500 flex items-center justify-center border border-zinc-100 group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900 transition-all duration-200">
              <AlertCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-50 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="font-semibold">Pendente de liquidação</span>
            {grossRevenue > 0 && (
              <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold border border-amber-100">
                {Math.round((pendingRevenue / grossRevenue) * 100)}% do total
              </span>
            )}
          </div>
        </div>

        {/* Lucro Estimado */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between group hover:border-zinc-200 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Lucro Líquido Est.</span>
              <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                {formatCurrency(estimatedProfit)}
              </h2>
            </div>
            <div className="h-9 w-9 rounded-xl bg-zinc-50 text-zinc-500 flex items-center justify-center border border-zinc-100 group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900 transition-all duration-200">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-50 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="font-semibold">Mão de obra + Markup de peças</span>
            {grossRevenue > 0 && (
              <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold border border-blue-100">
                Margem: {Math.round((estimatedProfit / grossRevenue) * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* DYNAMIC BREAKDOWNS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meios de Pagamento */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4 text-zinc-500" />
            Meios de Pagamento
          </h3>
          {paymentMethods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Info className="h-8 w-8 text-zinc-300 mb-2" />
              <p className="text-xs text-zinc-400 font-medium">Nenhum pagamento registrado no período.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((m) => (
                <div key={m.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-700">{m.name}</span>
                    <div className="text-right">
                      <span className="text-zinc-900 mr-1.5">{formatCurrency(m.amount)}</span>
                      <span className="text-zinc-400 text-[10px]">{m.percentage}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-900 rounded-full transition-all duration-500"
                      style={{ width: `${m.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contas Financeiras */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-2 mb-4">
            <Landmark className="h-4 w-4 text-zinc-500" />
            Contas de Destino
          </h3>
          {accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Info className="h-8 w-8 text-zinc-300 mb-2" />
              <p className="text-xs text-zinc-400 font-medium">Nenhum lançamento no período.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((acc) => (
                <div key={acc.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-700">{acc.name}</span>
                    <div className="text-right">
                      <span className="text-zinc-900 mr-1.5">{formatCurrency(acc.amount)}</span>
                      <span className="text-zinc-400 text-[10px]">{acc.percentage}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${acc.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mão de Obra por Técnico */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-2 mb-4">
            <Wrench className="h-4 w-4 text-zinc-500" />
            Mão de Obra por Técnico
          </h3>
          {techLaborList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Info className="h-8 w-8 text-zinc-300 mb-2" />
              <p className="text-xs text-zinc-400 font-medium">Nenhum serviço de mão de obra no período.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {techLaborList.map((t) => {
                const percent = totalLaborValue > 0 ? Math.round((t.total / totalLaborValue) * 100) : 0;
                return (
                  <div key={t.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-700">{t.name}</span>
                        {t.role && (
                          <span className="text-[9px] px-1 py-0.1 bg-zinc-100 text-zinc-500 rounded uppercase tracking-wider">
                            {t.role}
                          </span>
                        )}
                        {!t.isRegistered && (
                          <span className="text-[9px] px-1 py-0.1 bg-amber-50 text-amber-600 rounded border border-amber-100" title="Técnico não possui cadastro atual no sistema">
                            Sem Cadastro
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-900 mr-1.5">{formatCurrency(t.total)}</span>
                        <span className="text-zinc-400 text-[10px]">{percent}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          t.isRegistered ? "bg-zinc-800" : "bg-zinc-400"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-zinc-400 flex justify-between font-medium">
                      <span>{t.count} serviços executados</span>
                      <span>Total da mão de obra</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Fluxo de Caixa (Últimos Pagamentos) */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-2 mb-4">
              <Wallet className="h-4 w-4 text-zinc-500" />
              Últimos Pagamentos Recebidos
            </h3>
            {recentPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Info className="h-8 w-8 text-zinc-300 mb-2" />
                <p className="text-xs text-zinc-400 font-medium">Sem transações registradas para este período.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="pb-2.5">Data</th>
                      <th className="pb-2.5">O.S.</th>
                      <th className="pb-2.5">Cliente</th>
                      <th className="pb-2.5">Método/Conta</th>
                      <th className="pb-2.5 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 text-xs font-semibold">
                    {recentPayments.map((p) => {
                      const clientName = p.order.client?.name || "N/A";
                      const abbreviatedClient = clientName.split(" ").slice(0, 2).join(" ");
                      
                      return (
                        <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="py-3 text-zinc-500 font-medium">{formatDateOnly(p.date)}</td>
                          <td className="py-3">
                            <button
                              onClick={() => onOSSelect(p.order)}
                              className="text-zinc-900 hover:text-blue-600 underline decoration-dotted flex items-center gap-0.5 font-bold"
                            >
                              #{String(p.order.osNumber).padStart(4, "0")}
                              <ChevronRight className="h-3 w-3 inline shrink-0" />
                            </button>
                          </td>
                          <td className="py-3 text-zinc-700" title={clientName}>
                            {abbreviatedClient}
                          </td>
                          <td className="py-3">
                            <div className="flex flex-col">
                              <span className="text-zinc-800 text-[11px]">{p.method}</span>
                              <span className="text-zinc-400 text-[9px] font-medium">{p.account}</span>
                            </div>
                          </td>
                          <td className="py-3 text-right text-emerald-600 font-bold">
                            {formatCurrency(p.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {recentPayments.length > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-50 text-[11px] text-zinc-400 text-center font-medium">
              Mostrando os últimos {recentPayments.length} pagamentos do período
            </div>
          )}
        </div>

        {/* Desempenho de Peças (Margens) */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-2 mb-4">
              <Package className="h-4 w-4 text-zinc-500" />
              Desempenho de Peças (Margem e Markup)
            </h3>
            {partsPerformance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Info className="h-8 w-8 text-zinc-300 mb-2" />
                <p className="text-xs text-zinc-400 font-medium">Nenhuma peça faturada no período.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="pb-2.5">Peça</th>
                      <th className="pb-2.5 text-center">Qtd</th>
                      <th className="pb-2.5 text-right">Custo Tot.</th>
                      <th className="pb-2.5 text-right">Venda Tot.</th>
                      <th className="pb-2.5 text-right">Margem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 text-xs font-semibold">
                    {partsPerformance.map((part, i) => (
                      <tr key={i} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-3">
                          <div className="flex flex-col max-w-[180px] sm:max-w-xs">
                            <span className="text-zinc-800 truncate" title={part.name}>{part.name}</span>
                            {part.code && (
                              <span className="text-zinc-400 text-[9px] font-mono tracking-tight">
                                Cód: {part.code}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-center text-zinc-600 font-medium">{part.qty}</td>
                        <td className="py-3 text-right text-zinc-500">
                          {part.hasZeroCost ? (
                            <span className="text-[9px] px-1 py-0.5 bg-amber-50 text-amber-600 rounded border border-amber-100" title="Preço de custo não foi preenchido na O.S.">
                              Sem Custo
                            </span>
                          ) : (
                            formatCurrency(part.totalCost)
                          )}
                        </td>
                        <td className="py-3 text-right text-zinc-800">{formatCurrency(part.totalSale)}</td>
                        <td className="py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-zinc-950 font-bold">{formatCurrency(part.markup)}</span>
                            <span
                              className={`text-[9px] font-bold px-1 rounded ${
                                part.margin >= 50
                                  ? "bg-emerald-50 text-emerald-700"
                                  : part.margin >= 30
                                  ? "bg-blue-50 text-blue-700"
                                  : part.margin > 0
                                  ? "bg-zinc-50 text-zinc-650"
                                  : "bg-red-50 text-red-650"
                              }`}
                            >
                              {Math.round(part.margin)}% margem
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {partsPerformance.length > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-50 text-[11px] text-zinc-400 text-center font-medium">
              Mostrando as top {partsPerformance.length} peças mais vendidas por receita
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
