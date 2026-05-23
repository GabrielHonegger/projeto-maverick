import React, { useState } from "react";
import { Plus, Search, FileText, Calendar, DollarSign, Bike, User, ChevronRight, Hash } from "lucide-react";
import { ServiceOrderWithRelations } from "@/types";

interface ServiceOrdersViewProps {
  serviceOrders: ServiceOrderWithRelations[];
  onOSSelect: (order: ServiceOrderWithRelations) => void;
  onAddOSClick: () => void;
}

export default function ServiceOrdersView({
  serviceOrders,
  onOSSelect,
  onAddOSClick,
}: ServiceOrdersViewProps) {
  const [activeTab, setActiveTab] = useState<"active" | "closed">("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Basic counters
  const totalActive = serviceOrders.filter((o) => o.status !== "encerrado").length;
  const totalClosed = serviceOrders.filter((o) => o.status === "encerrado").length;
  
  const totalDraft = serviceOrders.filter((o) => o.status === "montagem_orcamento").length;
  const totalAwaiting = serviceOrders.filter((o) => o.status === "aguardando_aprovacao").length;
  const totalApproved = serviceOrders.filter((o) => o.status === "aprovado").length;
  const totalRejected = serviceOrders.filter((o) => o.status === "recusado").length;

  // Filter logic
  const filteredOrders = serviceOrders.filter((order) => {
    // 1. Tab filter
    if (activeTab === "active" && order.status === "encerrado") return false;
    if (activeTab === "closed" && order.status !== "encerrado") return false;

    // 2. Status filter
    if (activeTab === "active" && statusFilter !== "all" && order.status !== statusFilter) {
      return false;
    }

    // 3. Search query
    const clientName = order.client.name.toLowerCase();
    const clientNickname = (order.client.nickname || "").toLowerCase();
    const bikeModel = order.motorbike.model.toLowerCase();
    const bikePlate = order.motorbike.plate.toLowerCase();
    const osNumber = `os-${order.osNumber}`.toLowerCase();
    const orcNumber = `orc-${order.osNumber}`.toLowerCase();
    const docTypeLabel = order.type === "orcamento" ? "orcamento" : "os ordem de servico";
    const rawNumber = String(order.osNumber);
    const search = searchTerm.toLowerCase();

    return (
      clientName.includes(search) ||
      clientNickname.includes(search) ||
      bikeModel.includes(search) ||
      bikePlate.includes(search) ||
      osNumber.includes(search) ||
      orcNumber.includes(search) ||
      docTypeLabel.includes(search) ||
      rawNumber.includes(search)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "montagem_orcamento":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Orçamento em Montagem
          </span>
        );
      case "aguardando_aprovacao":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            Aguardando Aprovação
          </span>
        );
      case "aprovado":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Serviço Aprovado / Em Execução
          </span>
        );
      case "recusado":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Orçamento Recusado
          </span>
        );
      case "encerrado":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
            OS Encerrada
          </span>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
            Ordens de Serviço e Orçamentos
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Gerencie os orçamentos, checklists de vistoria e ordens de serviço da oficina.
          </p>
        </div>
        <button
          onClick={onAddOSClick}
          className="flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs tracking-wide px-4 py-3 rounded-xl transition-all duration-150 shadow-sm shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          ABRIR O.S / ORÇAMENTO
        </button>
      </div>

      {/* Metrics Row (Displays only when looking at active tab) */}
      {activeTab === "active" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl border border-zinc-100 p-4 shadow-sm">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Montagem</p>
            <p className="text-2xl font-bold text-zinc-800 mt-1">{totalDraft}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Em elaboração</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-100 p-4 shadow-sm">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Aguardando</p>
            <p className="text-2xl font-bold text-zinc-800 mt-1">{totalAwaiting}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Pendente aprovação</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-100 p-4 shadow-sm bg-emerald-50/20 border-emerald-100">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Aprovado / Execução</p>
            <p className="text-2xl font-bold text-emerald-800 mt-1">{totalApproved}</p>
            <p className="text-[10px] text-emerald-600/70 mt-0.5">Serviço ativo</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-100 p-4 shadow-sm bg-red-50/20 border-red-100">
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Recusados</p>
            <p className="text-2xl font-bold text-red-800 mt-1">{totalRejected}</p>
            <p className="text-[10px] text-red-600/70 mt-0.5">Não aprovados</p>
          </div>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => {
            setActiveTab("active");
            setStatusFilter("all");
          }}
          className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors relative cursor-pointer ${
            activeTab === "active"
              ? "border-zinc-950 text-zinc-950 font-bold"
              : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          Orçamentos e O.S. Abertas
          <span className="ml-1.5 text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-full font-bold">
            {totalActive}
          </span>
        </button>
        <button
          onClick={() => {
            setActiveTab("closed");
            setStatusFilter("all");
          }}
          className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors relative cursor-pointer ${
            activeTab === "closed"
              ? "border-zinc-950 text-zinc-950 font-bold"
              : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          O.S. Encerradas
          <span className="ml-1.5 text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-full font-bold">
            {totalClosed}
          </span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, placa ou número da O.S..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
          />
        </div>

        {/* Quick status filters (Active tab only) */}
        {activeTab === "active" && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-zinc-900 text-white"
                  : "bg-white border border-zinc-150 text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter("montagem_orcamento")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "montagem_orcamento"
                  ? "bg-amber-500 text-white"
                  : "bg-white border border-zinc-150 text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              Montagem
            </button>
            <button
              onClick={() => setStatusFilter("aguardando_aprovacao")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "aguardando_aprovacao"
                  ? "bg-orange-500 text-white"
                  : "bg-white border border-zinc-150 text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              Aguardando
            </button>
            <button
              onClick={() => setStatusFilter("aprovado")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "aprovado"
                  ? "bg-emerald-600 text-white"
                  : "bg-white border border-zinc-150 text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              Aprovado
            </button>
            <button
              onClick={() => setStatusFilter("recusado")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "recusado"
                  ? "bg-red-500 text-white"
                  : "bg-white border border-zinc-150 text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              Recusados
            </button>
          </div>
        )}
      </div>

      {/* Grid or Table List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-100 py-16 px-4 text-center">
          <FileText className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-700">Nenhum registro encontrado</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Não encontramos ordens de serviço correspondentes aos filtros aplicados.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
          {filteredOrders.map((order) => (
            <button
              key={order.id}
              onClick={() => onOSSelect(order)}
              className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm hover:shadow-md card-hover text-left flex flex-col justify-between group overflow-hidden cursor-pointer"
            >
              <div className="w-full">
                {/* OS Number & Status */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-1.5 text-zinc-500 font-bold text-xs tracking-wide">
                    <Hash className="h-3.5 w-3.5 text-zinc-400" />
                    {order.type === "orcamento" ? "Orçamento" : "O.S."} #{String(order.osNumber).padStart(4, "0")}
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {/* Client / Motorbike details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-950 group-hover:text-white transition-all duration-150 shrink-0">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-800 truncate group-hover:text-blue-600 transition-colors">
                        {order.client.name}
                      </p>
                      {order.client.nickname && (
                        <p className="text-[10px] text-zinc-400 truncate font-medium">
                          ({order.client.nickname})
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-950 group-hover:text-white transition-all duration-150 shrink-0">
                      <Bike className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-700 truncate">
                        {order.motorbike.model}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono tracking-wide">
                        Placa: {order.motorbike.plate.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price and Dates */}
              <div className="border-t border-zinc-100 pt-4 mt-2 flex items-center justify-between text-xs w-full">
                <div className="flex items-center gap-1 text-zinc-400 font-medium">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>Entrada: {formatDate(order.entryDate)}</span>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider leading-none">
                    Valor Total
                  </p>
                  <p className="text-sm font-bold text-zinc-950 group-hover:text-blue-600 mt-1 tracking-tight">
                    {formatCurrency(order.totalValue)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
