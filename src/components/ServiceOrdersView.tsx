import React, { useState } from "react";
import { Plus, Search, FileText, Calendar, DollarSign, User, ChevronRight, Hash, Eye } from "lucide-react";
import { FaMotorcycle } from "react-icons/fa6";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    if (activeTab === "active" && statusFilter !== "all" && order.status !== statusFilter) {
      return false;
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
    switch (status) {
      case "montagem_orcamento":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Orçamento em Andamento
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
      {/* Compact View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-1">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight text-zinc-950">
            Ordens de Serviço e Orçamentos
          </h1>
          
          {/* Compact Inline Metrics */}
          {activeTab === "active" && (
            <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50">
                O.S EM ANDAMENTO: {totalDraft}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200/50">
                O.S AGUARDANDO APROVAÇÃO: {totalAwaiting}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                O.S APROVADAS: {totalApproved}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200/50">
                O.S RECUSADAS: {totalRejected}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onAddOSClick}
          className="flex items-center justify-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs tracking-wide px-3.5 py-2 rounded-xl transition-all duration-150 shadow-sm shrink-0 self-start md:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          ABRIR O.S / ORÇAMENTO
        </button>
      </div>


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

        {/* Filters & Sorting controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sorting controls */}
          <div className="flex items-center gap-1.5 bg-white border border-zinc-150 rounded-xl px-2.5 py-1 text-xs shadow-sm">
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

          {/* Quick status filters (Active tab only) */}
          {activeTab === "active" && (
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-zinc-900 text-white"
                  : "bg-white border border-zinc-150 text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter("montagem_orcamento")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                statusFilter === "montagem_orcamento"
                  ? "bg-amber-500 text-white"
                  : "bg-white border border-zinc-150 text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              Em Andamento
            </button>
            <button
              onClick={() => setStatusFilter("aguardando_aprovacao")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                statusFilter === "aguardando_aprovacao"
                  ? "bg-orange-500 text-white"
                  : "bg-white border border-zinc-150 text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              Aguardando Aprovação
            </button>
            <button
              onClick={() => setStatusFilter("aprovado")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                statusFilter === "aprovado"
                  ? "bg-emerald-600 text-white"
                  : "bg-white border border-zinc-150 text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              Aprovadas
            </button>
            <button
              onClick={() => setStatusFilter("recusado")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                statusFilter === "recusado"
                  ? "bg-red-500 text-white"
                  : "bg-white border border-zinc-150 text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              Recusadas
            </button>
          </div>
        )}
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
                <button
                  key={order.id}
                  onClick={() => onOSSelect(order)}
                  className="w-full bg-white border border-zinc-100 rounded-2xl p-4 flex flex-col gap-2.5 text-left shadow-sm hover:shadow-md hover:border-zinc-200 transition-all duration-150 active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {order.type === "orcamento" ? "Orçamento" : "O.S."} #{String(order.osNumber).padStart(4, "0")}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="text-xs font-bold text-zinc-800">
                    {order.client.name} {order.client.nickname ? `(${order.client.nickname})` : ""}
                  </div>
                  <div className="text-xs text-zinc-500 font-semibold">
                    {order.motorbike.model} · <span className="font-mono uppercase">{order.motorbike.plate}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-semibold flex flex-wrap gap-x-2 gap-y-0.5">
                    <span>KM: {order.odometer || "N/A"}</span>
                    <span>•</span>
                    <span>Téc: {getTechnicians(order)}</span>
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
                </button>
              );
            })}
          </div>

          {/* Desktop table view — hidden on mobile */}
          <div className="hidden md:block bg-white border border-zinc-100 rounded-2xl overflow-x-auto shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-100 bg-zinc-50/80">
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Nº / Tipo</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Situação</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Cliente</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Veículo</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Quilometragem</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Última Atualização</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Pendências</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap text-right">Valor Total</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Entrada</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Saída</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Técnico Responsável</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap text-right" />
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
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                            {order.type === "orcamento" ? "Orçamento" : "O.S."}
                          </span>
                          <span className="font-mono text-zinc-700 font-bold">
                            #{String(order.osNumber).padStart(4, "0")}
                          </span>
                        </div>
                      </TableCell>

                      {/* 2. Situação */}
                      <TableCell className="whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </TableCell>

                      {/* 3. Cliente */}
                      <TableCell className="whitespace-nowrap">
                        <div className="text-xs font-bold text-zinc-850">
                          {order.client.name}
                        </div>
                        {order.client.nickname && (
                          <div className="text-[10px] text-zinc-400 font-semibold">
                            ({order.client.nickname})
                          </div>
                        )}
                      </TableCell>

                      {/* 4. Veículo */}
                      <TableCell className="whitespace-nowrap">
                        <div className="text-xs font-bold text-zinc-850">
                          {order.motorbike.model}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono font-semibold uppercase">
                          {order.motorbike.plate}
                        </div>
                      </TableCell>

                      {/* 5. Quilometragem */}
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

                      {/* 10. Saída */}
                      <TableCell className="whitespace-nowrap font-bold text-xs">
                        {order.exitDate ? (
                          <span className="text-emerald-700">{formatDate(order.exitDate)}</span>
                        ) : (
                          <span className="text-zinc-400 font-normal">Pendente</span>
                        )}
                      </TableCell>

                      {/* 11. Técnico responsável */}
                      <TableCell className="whitespace-nowrap font-semibold text-zinc-655 text-xs">
                        {getTechnicians(order)}
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
