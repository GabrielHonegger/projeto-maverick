import React, { useState } from "react";
import { Plus, Search, FileText, Calendar, DollarSign, User, ChevronRight, Hash, Eye, HelpCircle } from "lucide-react";
import { FaMotorcycle } from "react-icons/fa6";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ServiceOrderWithRelations, Technician } from "@/types";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface ServiceOrdersViewProps {
  serviceOrders: ServiceOrderWithRelations[];
  technicians: Technician[];
  onOSSelect: (order: ServiceOrderWithRelations) => void;
  onAddOSClick: () => void;
}


export default function ServiceOrdersView({
  serviceOrders,
  technicians,
  onOSSelect,
  onAddOSClick,
}: ServiceOrdersViewProps) {
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
    "yamaha": "/marcas/yamaha.png"
  };

  const renderBrandLogo = (brandName: string, className = "h-6") => {
    const normalized = brandName.toLowerCase().trim();
    const logoPath = BRAND_LOGOS[normalized];
    if (logoPath) {
      return (
        <img
          src={logoPath}
          alt={brandName}
          className={`${className} object-contain max-w-[80px] h-5 sm:h-6`}
        />
      );
    }
    return (
      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-150/70 px-1 py-0.5 rounded border border-zinc-200">
        {brandName}
      </span>
    );
  };

  const abbreviateClientName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 2) return fullName;
    return `${parts[0]} ${parts[parts.length - 1]}`;
  };

  const abbreviateTechnicianString = (order: ServiceOrderWithRelations) => {
    const orderTechNames = new Set<string>();
    let hasUnregistered = false;
    
    order.labor?.forEach((l) => {
      if (l.technician) {
        const shortName = l.technician.split("(")[0].trim();
        orderTechNames.add(shortName);
        
        const exists = technicians.some(t => {
          const dbName = t.name.toLowerCase().trim();
          const dbFullName = `${t.name} (${t.role})`.toLowerCase().trim();
          const searchName = l.technician.toLowerCase().trim();
          return searchName === dbName || searchName === dbFullName || dbName.includes(searchName) || searchName.includes(dbName);
        });
        if (!exists) hasUnregistered = true;
      }
    });

    order.parts?.forEach((p) => {
      if (p.technician) {
        const shortName = p.technician.split("(")[0].trim();
        orderTechNames.add(shortName);
        
        const exists = technicians.some(t => {
          const dbName = t.name.toLowerCase().trim();
          const dbFullName = `${t.name} (${t.role})`.toLowerCase().trim();
          const searchName = p.technician.toLowerCase().trim();
          return searchName === dbName || searchName === dbFullName || dbName.includes(searchName) || searchName.includes(dbName);
        });
        if (!exists) hasUnregistered = true;
      }
    });

    const combinedStr = orderTechNames.size > 0 ? Array.from(orderTechNames).join(", ") : "N/A";
    return hasUnregistered ? `${combinedStr} ⚠️` : combinedStr;
  };

  const renderTechniciansList = (order: ServiceOrderWithRelations) => {
    const orderTechNames = new Set<string>();
    order.labor?.forEach((l) => {
      if (l.technician) orderTechNames.add(l.technician);
    });
    order.parts?.forEach((p) => {
      if (p.technician) orderTechNames.add(p.technician);
    });

    if (orderTechNames.size === 0) {
      return <span className="text-zinc-400">N/A</span>;
    }

    return (
      <div className="flex flex-wrap gap-1 max-w-[160px]">
        {Array.from(orderTechNames).map((techName) => {
          const displayName = techName.split("(")[0].trim();
          
          const exists = technicians.some(t => {
            const dbName = t.name.toLowerCase().trim();
            const dbFullName = `${t.name} (${t.role})`.toLowerCase().trim();
            const searchName = techName.toLowerCase().trim();
            return searchName === dbName || searchName === dbFullName || dbName.includes(searchName) || searchName.includes(dbName);
          });

          return (
            <span
              key={techName}
              className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${
                exists 
                  ? "bg-zinc-100 text-zinc-750 border border-zinc-200" 
                  : "bg-amber-50 text-amber-700 border border-amber-250/60"
              }`}
              title={exists ? undefined : "Técnico não cadastrado no sistema"}
            >
              {displayName}
              {!exists && <span className="ml-1 text-[8.5px]">⚠️</span>}
            </span>
          );
        })}
      </div>
    );
  };


  const [activeTab, setActiveTab] = useState<"active" | "closed">("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"number" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const getPendingStages = (order: ServiceOrderWithRelations) => {
    const pending: string[] = [];
    const completed = order.completedStages || [];

    // Vistoria is pending if not marked completed and has no odometer reading
    const hasVistoria = completed.includes("inspection") || (order.odometer && order.odometer.trim() !== "");
    if (!hasVistoria) {
      pending.push("Vistoria");
    }

    // Serviços/Peças is pending if not marked completed and has no labor or parts
    const hasLaborParts = completed.includes("labor_parts") || (order.labor && order.labor.length > 0) || (order.parts && order.parts.length > 0);
    if (!hasLaborParts) {
      pending.push("Serviços/Peças");
    }

    // Laudo is pending if not marked completed and complaints are empty or default
    const hasNotes = completed.includes("notes") || (order.customerComplaints && order.customerComplaints.trim() !== "" && order.customerComplaints !== "Em elaboração...");
    if (!hasNotes) {
      pending.push("Laudo");
    }

    // Financeiro is pending if not marked completed and status is still montagem_orcamento
    const hasFinancial = completed.includes("financial") || (order.status !== "montagem_orcamento");
    if (!hasFinancial) {
      pending.push("Financeiro");
    }

    return pending;
  };

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
    if (activeTab === "active" && statusFilter !== "all") {
      if (statusFilter === "em_andamento") {
        if (order.status !== "montagem_orcamento" && order.status !== "aguardando_aprovacao") {
          return false;
        }
      } else if (order.status !== statusFilter) {
        return false;
      }
    }

    // 3. Search query
    const clientName = order.client.name.toLowerCase();
    const clientNickname = (order.client.nickname || "").toLowerCase();
    const bikeBrand = order.motorbike.brand.toLowerCase();
    const bikeModel = order.motorbike.model.toLowerCase();
    const bikePlate = order.motorbike.plate.toLowerCase();
    const bikeVin = order.motorbike.vin.toLowerCase();
    const bikeYear = order.motorbike.year.toLowerCase();
    const bikeColor = order.motorbike.color.toLowerCase();
    const osNumber = `os-${order.osNumber}`.toLowerCase();
    const orcNumber = `orc-${order.osNumber}`.toLowerCase();
    const docTypeLabel = order.type === "orcamento" ? "orcamento" : "os ordem de servico";
    const rawNumber = String(order.osNumber);
    const search = searchTerm.toLowerCase();

    return (
      clientName.includes(search) ||
      clientNickname.includes(search) ||
      bikeBrand.includes(search) ||
      bikeModel.includes(search) ||
      bikePlate.includes(search) ||
      bikeVin.includes(search) ||
      bikeYear.includes(search) ||
      bikeColor.includes(search) ||
      osNumber.includes(search) ||
      orcNumber.includes(search) ||
      docTypeLabel.includes(search) ||
      rawNumber.includes(search)
    );
  });

  // Sort logic
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === "number") {
      return sortOrder === "asc" ? a.osNumber - b.osNumber : b.osNumber - a.osNumber;
    } else {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    }
  });

  const getStatusBadge = (status: string) => {
    const getStatusInfo = (s: string) => {
      switch (s) {
        case "montagem_orcamento":
          return { label: "Aguardando aprovação", dotClass: "bg-amber-500", bgClass: "bg-amber-50 border-amber-200" };
        case "aguardando_aprovacao":
          return { label: "Aguardando aprovação", dotClass: "bg-amber-500", bgClass: "bg-amber-50 border-amber-200" };
        case "aprovado":
          return { label: "Aprovada em Andamento", dotClass: "bg-emerald-500 animate-pulse", bgClass: "bg-emerald-50 border-emerald-200" };
        case "recusado":
          return { label: "Recusadas", dotClass: "bg-red-500", bgClass: "bg-red-50 border-red-200" };
        case "encerrado":
          return { label: "Finalizadas", dotClass: "bg-zinc-500", bgClass: "bg-zinc-100 border-zinc-200" };
        default:
          return { label: "Desconhecido", dotClass: "bg-zinc-300", bgClass: "bg-zinc-50 border-zinc-200" };
      }
    };

    const info = getStatusInfo(status);

    return (
      <Tooltip>
        <TooltipTrigger>
          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${info.bgClass}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${info.dotClass}`} />
          </span>
        </TooltipTrigger>
        <TooltipContent className="bg-zinc-950 text-white border border-zinc-800 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 shadow-md">
          <span className={`h-1.5 w-1.5 rounded-full ${info.dotClass.replace("animate-pulse", "")}`} />
          {info.label}
        </TooltipContent>
      </Tooltip>
    );
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

  const formatDateOnly = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getTechnicians = (order: ServiceOrderWithRelations) => {
    const techs = new Set<string>();
    order.labor?.forEach((l) => {
      if (l.technician) techs.add(l.technician);
    });
    order.parts?.forEach((p) => {
      if (p.technician) techs.add(p.technician);
    });
    return techs.size > 0 ? Array.from(techs).join(", ") : "N/A";
  };



  return (
    <div className="space-y-3 sm:space-y-4 animate-fade-in">
      {/* Compact View Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        {/* Navigation / Filters Menu */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => {
              setActiveTab("active");
              setStatusFilter("all");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "active" && statusFilter === "all"
                ? "bg-zinc-950 text-white shadow-sm"
                : "bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            Todos
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
              activeTab === "active" && statusFilter === "all"
                ? "bg-white/20 text-white"
                : "bg-zinc-100 text-zinc-550"
            }`}>
              {totalActive}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("active");
              setStatusFilter("em_andamento");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "active" && statusFilter === "em_andamento"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            Aguardando aprovação
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
              activeTab === "active" && statusFilter === "em_andamento"
                ? "bg-white/25 text-white"
                : "bg-zinc-100 text-zinc-550"
            }`}>
              {totalDraft + totalAwaiting}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("active");
              setStatusFilter("aprovado");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "active" && statusFilter === "aprovado"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            Aprovada em Andamento
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
              activeTab === "active" && statusFilter === "aprovado"
                ? "bg-white/20 text-white"
                : "bg-zinc-100 text-zinc-550"
            }`}>
              {totalApproved}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("closed");
              setStatusFilter("all");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "closed"
                ? "bg-zinc-900 text-white shadow-sm"
                : "bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            Finalizadas
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
              activeTab === "closed"
                ? "bg-white/20 text-white"
                : "bg-zinc-100 text-zinc-550"
            }`}>
              {totalClosed}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("active");
              setStatusFilter("recusado");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "active" && statusFilter === "recusado"
                ? "bg-red-500 text-white shadow-sm"
                : "bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            Recusadas
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
              activeTab === "active" && statusFilter === "recusado"
                ? "bg-white/20 text-white"
                : "bg-zinc-100 text-zinc-550"
            }`}>
              {totalRejected}
            </span>
          </button>
        </div>

        <button
          onClick={onAddOSClick}
          className="flex items-center justify-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs tracking-wide px-3.5 py-2 rounded-xl transition-all duration-150 shadow-sm shrink-0 self-start md:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          ABRIR O.S / ORÇAMENTO
        </button>
      </div>

      {/* Search and Sorting */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por O.S, cliente, placa, chassi (VIN) ou moto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-4 py-1.5 text-xs font-semibold text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
          />
        </div>

        {/* Sorting controls */}
        <div className="flex items-center gap-1.5 bg-white border border-zinc-150 rounded-xl px-2.5 py-1 text-xs shadow-sm self-start lg:self-auto">
          <span className="text-zinc-400 font-bold uppercase tracking-wider text-[9px] select-none">Ordenar por:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-zinc-750 font-bold border-none focus:outline-none cursor-pointer py-0.5 text-xs"
          >
            <option value="date">Data de Criação</option>
            <option value="number">Número da O.S.</option>
          </select>
          <div className="w-px h-3.5 bg-zinc-200" />
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="text-zinc-500 hover:text-zinc-950 font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors text-xs"
            title={sortOrder === "asc" ? "Ordenação Crescente" : "Ordenação Decrescente"}
          >
            {sortOrder === "asc" ? "Crescente ↑" : "Decrescente ↓"}
          </button>
        </div>
      </div>

      {/* Grid or Table List */}
      {sortedOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-100 py-16 px-4 text-center">
          <FileText className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-700">Nenhum registro encontrado</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Não encontramos ordens de serviço correspondentes aos filtros aplicados.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile list view — hidden on desktop */}
          <div className="md:hidden space-y-2">
            {sortedOrders.map((order) => {
              const pending = getPendingStages(order);
              return (
                <div
                  key={order.id}
                  onClick={() => onOSSelect(order)}
                  className="w-full bg-white border border-zinc-100 rounded-2xl p-4 flex flex-col gap-2.5 text-left shadow-sm hover:shadow-md hover:border-zinc-200 transition-all duration-150 active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {order.type === "orcamento" ? "Orçamento" : "O.S."} #{String(order.osNumber).padStart(4, "0")}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="text-xs font-bold text-zinc-800">
                    {abbreviateClientName(order.client.name)} {order.client.nickname ? `(${order.client.nickname})` : ""}
                  </div>
                  <div className="text-xs text-zinc-500 font-semibold">
                    {order.motorbike.model} · <span className="font-mono uppercase">{order.motorbike.plate}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-semibold flex flex-wrap gap-x-2 gap-y-0.5">
                    <span>KM: {order.odometer || "N/A"}</span>
                    <span>•</span>
                    <span>Téc: {abbreviateTechnicianString(order)}</span>
                    <span>•</span>
                    <span>Últ. Att: {formatDate(order.createdAt)}</span>
                  </div>
                  {pending.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {pending.map((p) => (
                        <span
                          key={p}
                          className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="border-t border-zinc-100 pt-2 mt-1 flex justify-between items-end">
                    <div className="flex flex-col gap-0.5 text-[10px] text-zinc-500 font-semibold">
                      <span>Entrada: {formatDate(order.entryDate)}</span>
                      {order.readyDate && (
                        <span>Pronta/Previsão: {formatDateOnly(order.readyDate)}</span>
                      )}
                    </div>
                    <span className="font-extrabold text-zinc-950 text-sm">
                      {formatCurrency(order.totalValue)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden md:block bg-white border border-zinc-100 rounded-2xl overflow-x-auto shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-100 bg-zinc-50/80">
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">O.S. Nº</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap w-12 text-center">
                    <Tooltip>
                      <TooltipTrigger>
                        <button className="flex items-center justify-center mx-auto hover:text-zinc-650 transition-colors cursor-default">
                          <HelpCircle className="h-3.5 w-3.5 text-zinc-400" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-zinc-950 text-white border border-zinc-800 p-3 rounded-xl shadow-xl flex flex-col gap-2 font-semibold">
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-1">
                          Legenda de Situações
                        </p>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                            <span>Aguardando aprovação</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                            <span>Aprovada em Andamento</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-zinc-500 shrink-0" />
                            <span>Finalizadas</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                            <span>Recusadas</span>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Cliente</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Veículo</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">KM</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Última Atualização</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Pendências</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap text-right">Valor Total</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Entrada</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">
                    <Tooltip>
                      <TooltipTrigger>
                        <button className="hover:text-zinc-650 transition-colors uppercase font-bold tracking-widest cursor-default">
                          TR
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-zinc-950 text-white border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-semibold">
                        Técnico Responsável
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.map((order) => {
                  const pending = getPendingStages(order);
                  return (
                    <TableRow
                      key={order.id}
                      className="border-zinc-100 hover:bg-zinc-50/60 transition-colors cursor-pointer group"
                      onClick={() => onOSSelect(order)}
                    >
                      {/* 1. Numerações da O.S */}
                      <TableCell className="py-3 font-semibold text-xs text-zinc-900 whitespace-nowrap">
                        <span className="font-mono text-zinc-700 font-bold">
                          {String(order.osNumber).padStart(4, "0")}
                        </span>
                      </TableCell>

                      {/* 2. Situação */}
                      <TableCell className="whitespace-nowrap text-center">
                        <div className="flex justify-center">
                          {getStatusBadge(order.status)}
                        </div>
                      </TableCell>

                      {/* 3. Cliente */}
                      <TableCell className="whitespace-nowrap">
                        <div className="text-xs font-bold text-zinc-850">
                          {abbreviateClientName(order.client.name)}
                        </div>
                        {order.client.nickname && (
                          <div className="text-[10px] text-zinc-400 font-semibold">
                            ({order.client.nickname})
                          </div>
                        )}
                      </TableCell>

                      {/* 4. Veículo */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {renderBrandLogo(order.motorbike.brand, "h-6 shrink-0")}
                          <div>
                            <div className="text-xs font-bold text-zinc-850">
                              {order.motorbike.model}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono font-semibold uppercase">
                              {order.motorbike.plate}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* 5. KM */}
                      <TableCell className="whitespace-nowrap font-bold text-zinc-700 text-xs">
                        {order.odometer ? `${order.odometer} km` : "N/A"}
                      </TableCell>

                      {/* 6. Data/horário das últimas atualizações */}
                      <TableCell className="whitespace-nowrap font-semibold text-zinc-650 text-xs">
                        {formatDate(order.createdAt)}
                      </TableCell>

                      {/* 7. Avisos de pendências */}
                      <TableCell className="whitespace-nowrap">
                        {pending.length === 0 ? (
                          <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
                            Sem Pendências
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {pending.map((p) => (
                              <span
                                key={p}
                                className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </TableCell>

                      {/* 8. Valor total */}
                      <TableCell className="text-right font-extrabold text-zinc-950 text-xs sm:text-sm whitespace-nowrap">
                        {formatCurrency(order.totalValue)}
                      </TableCell>

                      {/* 9. Entrada */}
                      <TableCell className="whitespace-nowrap font-semibold text-zinc-600 text-xs">
                        {formatDate(order.entryDate)}
                      </TableCell>

                      {/* 11. Técnico responsável */}
                      <TableCell className="whitespace-nowrap font-semibold text-zinc-655 text-xs">
                        {renderTechniciansList(order)}
                      </TableCell>

                      <TableCell className="text-right pr-4 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOSSelect(order);
                          }}
                          className="inline-flex items-center justify-center h-8 w-8 bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-500 rounded-lg transition-all duration-150"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
