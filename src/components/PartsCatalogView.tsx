import React, { useState } from "react";
import { Search, Package, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Bike } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PartCatalogItem } from "@/types";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


interface PartsCatalogViewProps {
  parts: PartCatalogItem[];
  onPartSelect: (part: PartCatalogItem) => void;
  onAddPartClick: () => void;
  onEditPartClick: (part: PartCatalogItem) => void;
  onDeletePartClick: (id: string) => void;
}

export default function PartsCatalogView({
  parts,
  onPartSelect,
  onAddPartClick,
  onEditPartClick,
  onDeletePartClick,
}: PartsCatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedBikesPartId, setExpandedBikesPartId] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const filteredParts = parts.filter((part) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const cleanQ = q.replace(/[^a-zA-Z0-9]/g, "");

    const matchesName = part.name.toLowerCase().includes(q);
    const matchesBrand = part.brand.toLowerCase().includes(q);
    
    const codeLower = part.code.toLowerCase();
    const cleanCodeVal = codeLower.replace(/[^a-zA-Z0-9]/g, "");
    const matchesCode = codeLower.includes(q) || (cleanQ !== "" && cleanCodeVal.includes(cleanQ));

    const matchesModel = part.model.toLowerCase().includes(q);
    const matchesSpecs = part.technicalSpecifications?.toLowerCase().includes(q) || false;
    const matchesMeasurements = part.measurements?.toLowerCase().includes(q) || false;
    const matchesSpecificBike = part.specificBikes.some(
      (bike) =>
        bike.brand.toLowerCase().includes(q) ||
        bike.model.toLowerCase().includes(q) ||
        bike.cc.toLowerCase().includes(q) ||
        (bike.year && bike.year.toLowerCase().includes(q))
    );

    return (
      matchesName ||
      matchesBrand ||
      matchesCode ||
      matchesModel ||
      matchesSpecs ||
      matchesMeasurements ||
      matchesSpecificBike
    );
  });

  const toggleExpandBikes = (partId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedBikesPartId(expandedBikesPartId === partId ? null : partId);
  };

  return (
    <div className="space-y-3 sm:space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
          <Package className="h-4.5 w-4.5 text-zinc-500" />
          Catálogo de Peças
        </h2>
        <Link
          href="/pecas/novo"
          className="flex items-center justify-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs tracking-wide px-3.5 py-2 rounded-xl transition-all duration-150 shadow-sm shrink-0 self-start md:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          CADASTRAR NOVA PEÇA
        </Link>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
        <input
          type="text"
          placeholder="Buscar por descrição, marca, código, compatibilidade..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-4 py-1.5 text-xs font-semibold text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
        />
      </div>

      {filteredParts.length === 0 ? (
        <div className="bg-white border border-zinc-300 rounded-2xl py-16 text-center shadow-sm">
          <Package className="h-9 w-9 text-zinc-300 mx-auto mb-3" />
          <p className="font-semibold text-zinc-700 text-sm">Nenhuma peça encontrada</p>
          <p className="text-xs text-zinc-400 mt-1">Tente ajustar a busca ou cadastre uma nova peça.</p>
        </div>
      ) : (
        <>
          {/* Mobile view - Cards */}
          <div className="md:hidden space-y-2">
            {filteredParts.map((part) => (
              <div
                key={part.id}
                className="bg-white border border-zinc-300 rounded-2xl p-4 space-y-3 shadow-sm hover:border-zinc-200 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-zinc-850 text-xs">{part.name}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-bold bg-zinc-100 text-zinc-750 px-2 py-0.5 rounded">
                        Cód: {part.code}
                      </span>
                      <span className="text-[10px] font-bold bg-zinc-100 text-zinc-750 px-2 py-0.5 rounded">
                        Marca: {part.brand}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Link
                      href={`/pecas/${part.id}/editar`}
                      className="p-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-950 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => onDeletePartClick(part.id)}
                      className="p-1.5 bg-zinc-50 hover:bg-red-550 rounded-lg text-zinc-500 hover:text-red-650 transition-colors cursor-pointer"
                      title="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-zinc-55">
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-zinc-600">
                    <p>Modelo: <strong className="text-zinc-800">{part.model}</strong></p>
                    {part.price > 0 && (
                      <p>Sugerido: <strong className="text-emerald-600">{formatPrice(part.price)}</strong></p>
                    )}
                  </div>
                  {(part.technicalSpecifications || part.measurements) && (
                    <div className="text-[10px] text-zinc-500 font-semibold space-y-0.5 bg-zinc-50/50 p-1.5 rounded-lg border border-zinc-100">
                      {part.technicalSpecifications && <p>Specs: {part.technicalSpecifications}</p>}
                      {part.measurements && <p>Medidas: {part.measurements}</p>}
                    </div>
                  )}

                  {/* Specific Bikes */}
                  {part.specificBikes.length > 0 && (
                    <div className="mt-2">
                      <button
                        onClick={(e) => toggleExpandBikes(part.id, e)}
                        className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-800 cursor-pointer"
                      >
                        <Bike className="h-3 w-3" />
                        Compatibilidades ({part.specificBikes.length})
                        {expandedBikesPartId === part.id ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                      {expandedBikesPartId === part.id && (
                        <div className="mt-1.5 pl-2 space-y-1 bg-zinc-50 p-2 rounded-xl border border-zinc-300">
                          {part.specificBikes.map((bike, idx) => (
                            <p key={idx} className="text-[10px] text-zinc-650 font-semibold">
                              • <span className="font-bold text-zinc-800">{bike.brand}</span> {bike.model} ({bike.cc}){bike.year ? ` - Ano ${bike.year}` : ""}
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
          <div className="hidden md:block bg-white border border-zinc-300 rounded-2xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-100 bg-zinc-50/80">
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Descrição da Peça</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Marca</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Código</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Modelo Moto</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Especificações</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Medidas</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Preço Sugerido</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Compatibilidade</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.map((part) => (
                  <TableRow
                    key={part.id}
                    className="border-zinc-100 hover:bg-zinc-50/60 transition-colors cursor-pointer group"
                    onClick={() => onPartSelect(part)}
                  >
                    <TableCell className="py-3 font-bold text-zinc-850 text-xs">
                      {part.name}
                    </TableCell>
                    <TableCell className="font-semibold text-zinc-700 text-xs">
                      {part.brand}
                    </TableCell>
                    <TableCell className="font-mono text-zinc-650 text-xs font-bold">
                      {part.code}
                    </TableCell>
                    <TableCell className="font-semibold text-zinc-700 text-xs">
                      {part.model}
                    </TableCell>
                    <TableCell className="text-zinc-500 text-xs truncate max-w-[120px]" title={part.technicalSpecifications}>
                      {part.technicalSpecifications || "-"}
                    </TableCell>
                    <TableCell className="text-zinc-500 text-xs">
                      {part.measurements || "-"}
                    </TableCell>
                    <TableCell className="font-extrabold text-emerald-600 text-xs">
                      {part.price > 0 ? formatPrice(part.price) : "-"}
                    </TableCell>
                    <TableCell>
                      {part.specificBikes.length === 0 ? (
                        <span className="text-[10px] text-zinc-400 italic">Nenhuma específica</span>
                      ) : (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Popover>
                            <PopoverTrigger className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-800 cursor-pointer">
                              <Bike className="h-3.5 w-3.5" />
                              Ver {part.specificBikes.length} moto(s)
                              <ChevronDown className="h-3 w-3" />
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-auto min-w-[200px] bg-white border border-zinc-200 p-2.5 rounded-xl shadow-lg z-50">
                              <div className="space-y-1">
                                {part.specificBikes.map((bike, idx) => (
                                  <p key={idx} className="text-[10px] text-zinc-605 font-semibold border-b border-zinc-50 pb-0.5 last:border-b-0">
                                    <span className="font-bold text-zinc-850">{bike.brand}</span> {bike.model} ({bike.cc}){bike.year ? ` - Ano ${bike.year}` : ""}
                                  </p>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/pecas/${part.id}/editar`}
                          className="inline-flex items-center justify-center h-8 w-8 bg-zinc-50 hover:bg-zinc-900 hover:text-white text-zinc-500 rounded-lg transition-all duration-150 cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => onDeletePartClick(part.id)}
                          className="inline-flex items-center justify-center h-8 w-8 bg-zinc-50 hover:bg-red-650 hover:text-white text-zinc-500 rounded-lg transition-all duration-150 cursor-pointer"
                          title="Remover"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
