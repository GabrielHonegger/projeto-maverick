import React, { useState } from "react";
import { Search, Wrench, Plus, Edit2, Trash2, CheckCircle2, ChevronDown, ChevronUp, Bike } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Service } from "@/types";
import Link from "next/link";

interface ServicesViewProps {
  services: Service[];
  onServiceSelect: (service: Service) => void;
  onAddServiceClick: () => void;
  onEditServiceClick: (service: Service) => void;
  onDeleteServiceClick: (id: string) => void;
}

export default function ServicesView({
  services,
  onServiceSelect,
  onAddServiceClick,
  onEditServiceClick,
  onDeleteServiceClick,
}: ServicesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedBikesServiceId, setExpandedBikesServiceId] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const filteredServices = services.filter((service) => {
    const q = searchQuery.toLowerCase();
    const matchesName = service.name.toLowerCase().includes(q);
    const matchesCategory = service.categories.some((cat) => cat.toLowerCase().includes(q));
    const matchesCc = service.ccRanges.some((cc) => cc.toLowerCase().includes(q));
    const matchesSpecificBike = service.specificBikes.some(
      (bike) =>
        bike.brand.toLowerCase().includes(q) ||
        bike.model.toLowerCase().includes(q) ||
        bike.cc.toLowerCase().includes(q)
    );

    return matchesName || matchesCategory || matchesCc || matchesSpecificBike;
  });

  const toggleExpandBikes = (serviceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedBikesServiceId(expandedBikesServiceId === serviceId ? null : serviceId);
  };

  return (
    <div className="space-y-3 sm:space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
          <Wrench className="h-4.5 w-4.5 text-zinc-500" />
          Serviços da Oficina
        </h2>
        <Link
          href="/servicos/novo"
          className="flex items-center justify-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs tracking-wide px-3.5 py-2 rounded-xl transition-all duration-150 shadow-sm shrink-0 self-start md:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          CADASTRAR NOVO SERVIÇO
        </Link>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
        <input
          type="text"
          placeholder="Buscar por nome, categoria, cilindrada..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-4 py-1.5 text-xs font-semibold text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
        />
      </div>

      {filteredServices.length === 0 ? (
        <div className="bg-white border border-zinc-100 rounded-2xl py-16 text-center shadow-sm">
          <Wrench className="h-9 w-9 text-zinc-300 mx-auto mb-3" />
          <p className="font-semibold text-zinc-700 text-sm">Nenhum serviço encontrado</p>
          <p className="text-xs text-zinc-400 mt-1">Tente ajustar a busca ou cadastre um novo serviço.</p>
        </div>
      ) : (
        <>
          {/* Mobile view - Cards */}
          <div className="md:hidden space-y-2">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white border border-zinc-100 rounded-2xl p-4 space-y-3 shadow-sm hover:border-zinc-200 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-zinc-800 text-xs">{service.name}</h3>
                    <p className="text-[13px] font-extrabold text-emerald-600 mt-0.5">
                      {formatPrice(service.price)}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Link
                      href={`/servicos/${service.id}/editar`}
                      className="p-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-950 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => onDeleteServiceClick(service.id)}
                      className="p-1.5 bg-zinc-50 hover:bg-red-550 rounded-lg text-zinc-500 hover:text-red-650 transition-colors cursor-pointer"
                      title="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-zinc-50">
                  {/* CC ranges and categories */}
                  <div className="flex flex-wrap gap-1">
                    {service.ccRanges.map((cc) => (
                      <span key={cc} className="text-[9px] font-bold bg-zinc-100 text-zinc-650 px-2 py-0.5 rounded-full">
                        {cc}
                      </span>
                    ))}
                    {service.categories.map((cat) => (
                      <span key={cat} className="text-[9px] font-bold bg-blue-50 text-blue-650 px-2 py-0.5 rounded-full">
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Specific Bikes */}
                  {service.specificBikes.length > 0 && (
                    <div className="mt-2">
                      <button
                        onClick={(e) => toggleExpandBikes(service.id, e)}
                        className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-800 cursor-pointer"
                      >
                        <Bike className="h-3 w-3" />
                        Motos específicas ({service.specificBikes.length})
                        {expandedBikesServiceId === service.id ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                      {expandedBikesServiceId === service.id && (
                        <div className="mt-1.5 pl-2 space-y-1 bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                          {service.specificBikes.map((bike, idx) => (
                            <p key={idx} className="text-[10px] text-zinc-600 font-semibold">
                              • <span className="font-bold text-zinc-850">{bike.brand}</span> {bike.model} ({bike.cc})
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop view - Table */}
          <div className="hidden md:block bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-100 bg-zinc-50/80">
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Nome do Serviço</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Preço</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Cilindrada (CC)</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Categorias</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Motos Específicas</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => {
                  return (
                    <TableRow
                      key={service.id}
                      className="border-zinc-100 hover:bg-zinc-50/60 transition-colors cursor-pointer group"
                      onClick={() => onServiceSelect(service)}
                    >
                      <TableCell className="py-3 font-bold text-zinc-850 text-xs">
                        {service.name}
                      </TableCell>
                      <TableCell className="font-extrabold text-emerald-600 text-xs">
                        {formatPrice(service.price)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {service.ccRanges.length === 0 ? (
                            <span className="text-[10px] text-zinc-400 italic">Todas</span>
                          ) : (
                            service.ccRanges.map((cc) => (
                              <span
                                key={cc}
                                className="text-[9px] font-bold bg-zinc-100 text-zinc-650 px-2 py-0.5 rounded-full"
                              >
                                {cc}
                              </span>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {service.categories.length === 0 ? (
                            <span className="text-[10px] text-zinc-400 italic">Todas</span>
                          ) : (
                            service.categories.map((cat) => (
                              <span
                                key={cat}
                                className="text-[9px] font-bold bg-blue-50 text-blue-650 px-2 py-0.5 rounded-full"
                              >
                                {cat}
                              </span>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {service.specificBikes.length === 0 ? (
                          <span className="text-[10px] text-zinc-400 italic">Nenhuma específica</span>
                        ) : (
                          <div>
                            <button
                              onClick={(e) => toggleExpandBikes(service.id, e)}
                              className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-800 cursor-pointer"
                            >
                              <Bike className="h-3.5 w-3.5" />
                              Ver {service.specificBikes.length} moto(s)
                              {expandedBikesServiceId === service.id ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                            {expandedBikesServiceId === service.id && (
                              <div
                                className="absolute z-10 mt-1 space-y-1 bg-white border border-zinc-200 p-2.5 rounded-xl shadow-lg min-w-[200px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {service.specificBikes.map((bike, idx) => (
                                  <p key={idx} className="text-[10px] text-zinc-600 font-semibold border-b border-zinc-50 pb-0.5 last:border-b-0">
                                    <span className="font-bold text-zinc-800">{bike.brand}</span> {bike.model} ({bike.cc})
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/servicos/${service.id}/editar`}
                            className="inline-flex items-center justify-center h-8 w-8 bg-zinc-50 hover:bg-zinc-900 hover:text-white text-zinc-500 rounded-lg transition-all duration-150 cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => onDeleteServiceClick(service.id)}
                            className="inline-flex items-center justify-center h-8 w-8 bg-zinc-50 hover:bg-red-650 hover:text-white text-zinc-500 rounded-lg transition-all duration-150 cursor-pointer"
                            title="Remover"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
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
