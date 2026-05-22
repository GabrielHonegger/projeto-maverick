import React, { useState } from "react";
import { Search, Bike, User, Tag, KeyRound, SearchCode } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Client, Motorbike } from "@/types";

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

  const getBrandBadge = (brandName: string) => {
    const b = brandName.toLowerCase();
    if (b === "bmw") return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
    if (b === "triumph") return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
    if (b === "honda") return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
    if (b === "yamaha") return "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300";
    return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* View Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Motocicletas</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Diretório completo de veículos registrados.</p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
        <Input
          type="text"
          placeholder="Buscar por marca, modelo, placa, chassi ou proprietário..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 pr-4 py-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-blue-500"
        />
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {filteredBikes.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">
            <SearchCode className="h-10 w-10 text-zinc-400 mx-auto mb-3" />
            <p className="font-semibold text-zinc-700 dark:text-zinc-300">Nenhuma motocicleta encontrada</p>
            <p className="text-sm text-zinc-500 mt-1">Ajuste os termos de busca ou vincule motos a clientes.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-950/40">
              <TableRow className="border-zinc-200 dark:border-zinc-800">
                <TableHead className="text-zinc-500 font-semibold">Moto / Marca</TableHead>
                <TableHead className="text-zinc-500 font-semibold">Placa</TableHead>
                <TableHead className="text-zinc-500 font-semibold">Ano & Cor</TableHead>
                <TableHead className="text-zinc-500 font-semibold">Proprietário</TableHead>
                <TableHead className="text-zinc-500 font-semibold">Chassis / VIN</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBikes.map((bike) => {
                const owner = clients.find((c) => c.id === bike.clientId);
                return (
                  <TableRow
                    key={bike.id}
                    className="border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors cursor-pointer group"
                    onClick={() => {
                      if (owner) {
                        onClientSelect(owner);
                        setActiveView("clients");
                      }
                    }}
                  >
                    {/* Brand & Model */}
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg text-zinc-600 dark:text-zinc-400 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-all duration-150">
                          <Bike className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {bike.model}
                          </span>
                          <span className="w-fit mt-0.5">
                            <span className={`px-2 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${getBrandBadge(bike.brand)}`}>
                              {bike.brand}
                            </span>
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Plate */}
                    <TableCell>
                      <span className="font-mono font-bold text-xs bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                        {bike.plate}
                      </span>
                    </TableCell>

                    {/* Year & Color */}
                    <TableCell className="text-zinc-600 dark:text-zinc-400 text-sm">
                      {bike.year} • {bike.color}
                    </TableCell>

                    {/* Owner */}
                    <TableCell>
                      {owner ? (
                        <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-medium text-sm group-hover:text-blue-500 transition-colors">
                          <User className="h-3.5 w-3.5 text-zinc-400" />
                          {owner.name}
                        </div>
                      ) : (
                        <span className="text-zinc-400 text-xs italic">Não encontrado</span>
                      )}
                    </TableCell>

                    {/* Chassis / VIN */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-mono text-zinc-600 dark:text-zinc-400 text-xs">
                        <KeyRound className="h-3.5 w-3.5 text-zinc-400" />
                        <span>{bike.vin}</span>
                        {bike.brand.toLowerCase() === "bmw" && (
                          <span className="text-[9px] text-blue-500 font-bold font-sans">(BMW last 7)</span>
                        )}
                        {bike.brand.toLowerCase() === "triumph" && (
                          <span className="text-[9px] text-amber-500 font-bold font-sans">(Triumph last 6)</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
