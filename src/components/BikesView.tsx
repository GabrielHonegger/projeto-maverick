import React, { useState } from "react";
import { Search, User, KeyRound, SearchCode, ChevronRight } from "lucide-react";
import { FaMotorcycle } from "react-icons/fa6";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Client, Motorbike } from "@/types";
import Link from "next/link";

interface BikesViewProps {
  bikes: Motorbike[];
  clients: Client[];
  onClientSelect: (client: Client) => void;
  setActiveView: (view: string) => void;
}

export default function BikesView({
  bikes,
  clients,
  onClientSelect,
  setActiveView,
}: BikesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBikes = bikes.filter((bike) => {
    const q = searchQuery.toLowerCase();
    const owner = clients.find((c) => c.id === bike.clientId);
    const ownerName = owner ? owner.name.toLowerCase() : "";
    return (
      bike.model.toLowerCase().includes(q) ||
      bike.brand.toLowerCase().includes(q) ||
      bike.plate.toLowerCase().includes(q) ||
      bike.vin.toLowerCase().includes(q) ||
      ownerName.includes(q)
    );
  });
  const getBrandStyle = (brandName: string) => {
    const b = brandName.toLowerCase();
    if (b === "bmw") return { pill: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" };
    if (b === "triumph") return { pill: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" };
    if (b === "honda") return { pill: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500" };
    if (b === "yamaha") return { pill: "bg-sky-50 text-sky-700 border-sky-100", dot: "bg-sky-500" };
    if (b === "kawasaki") return { pill: "bg-green-50 text-green-700 border-green-100", dot: "bg-green-500" };
    if (b === "harley-davidson") return { pill: "bg-orange-50 text-orange-700 border-orange-100", dot: "bg-orange-500" };
    if (b === "ducati") return { pill: "bg-red-50 text-red-800 border-red-100", dot: "bg-red-600" };
    return { pill: "bg-zinc-50 text-zinc-600 border-zinc-100", dot: "bg-zinc-400" };
  };

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
    const brandStyle = getBrandStyle(brandName);
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wide shrink-0 ${brandStyle.pill}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${brandStyle.dot}`} />
        {brandName}
      </span>
    );
  };

  return (
    <div className="space-y-3 sm:space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
          <FaMotorcycle className="h-4.5 w-4.5 text-zinc-500" />
          Motos Cadastradas
        </h2>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
        <input
          type="text"
          placeholder="Buscar por marca, modelo, placa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-4 py-1.5 text-xs font-semibold text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
        />
      </div>

      {filteredBikes.length === 0 ? (
        <div className="bg-white border border-zinc-100 rounded-2xl py-16 text-center shadow-sm">
          <SearchCode className="h-9 w-9 text-zinc-300 mx-auto mb-3" />
          <p className="font-semibold text-zinc-700 text-sm">Nenhuma motocicleta encontrada</p>
          <p className="text-xs text-zinc-400 mt-1">Ajuste os termos de busca.</p>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden space-y-2">
            {filteredBikes.map((bike) => {
              const owner = clients.find((c) => c.id === bike.clientId);
              return (
                <Link
                  key={bike.id}
                  href={owner ? `/clientes/${owner.id}` : "#"}
                  className="w-full bg-white border border-zinc-100 rounded-2xl p-3 flex items-center gap-2.5 text-left shadow-sm hover:shadow-md hover:border-zinc-200 transition-all duration-150 active:scale-[0.99] cursor-pointer"
                >
                  {/* Bike icon */}
                  <div className="h-9 w-9 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                    <FaMotorcycle className="h-4.5 w-4.5 text-zinc-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-zinc-800 text-xs truncate">{bike.model}</p>
                      {renderBrandLogo(bike.brand)}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[10px] font-bold text-zinc-600 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-lg tracking-widest">
                        {bike.plate}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-semibold">{bike.year} · {bike.color}</span>
                    </div>
                    {owner && (
                      <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1 font-semibold">
                        <User className="h-3 w-3 text-zinc-300" />
                        {owner.name}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-300 shrink-0" />
                </Link>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-100 bg-zinc-50/80">
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Moto</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Placa</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Ano · Cor</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Proprietário</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Chassis</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBikes.map((bike) => {
                  const owner = clients.find((c) => c.id === bike.clientId);
                  return (
                    <TableRow
                      key={bike.id}
                      className="border-zinc-100 hover:bg-zinc-50/60 transition-colors cursor-pointer group"
                      onClick={() => {
                        if (owner) { onClientSelect(owner); setActiveView("clients"); }
                      }}
                    >
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7.5 w-7.5 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 group-hover:bg-zinc-200 transition-colors">
                            <FaMotorcycle className="h-3.5 w-3.5 text-zinc-500" />
                          </div>
                          <div>
                            <p className="font-bold text-zinc-850 text-xs">{bike.model}</p>
                            {renderBrandLogo(bike.brand, "h-6 mt-0.5")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-bold text-[10px] bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-lg text-zinc-700 tracking-widest">
                          {bike.plate}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-650 font-semibold">
                        <span className="font-bold text-zinc-800">{bike.year}</span>
                        <span className="text-zinc-300 mx-1.5">·</span>
                        {bike.color}
                      </TableCell>
                      <TableCell>
                        {owner ? (
                          <Link href={`/clientes/${owner.id}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-xs text-zinc-650 font-semibold group-hover:text-blue-600 transition-colors hover:underline">
                            <User className="h-3.5 w-3.5 text-zinc-300" />
                            {owner.name}
                          </Link>
                        ) : (
                          <span className="text-zinc-400 text-xs italic">Não encontrado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-mono text-zinc-500 text-xs">
                          <KeyRound className="h-3.5 w-3.5 text-zinc-300 shrink-0" />
                          <span className="bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-md">{bike.vin}</span>
                          {bike.brand.toLowerCase() === "bmw" && (
                            <span className="text-[9px] text-blue-500 font-bold font-sans">7 díg.</span>
                          )}
                          {bike.brand.toLowerCase() === "triumph" && (
                            <span className="text-[9px] text-amber-500 font-bold font-sans">6 núm.</span>
                          )}
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
