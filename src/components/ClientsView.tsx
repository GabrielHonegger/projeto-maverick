import React, { useState } from "react";
import { Search, UserPlus, Eye, Phone, MapPin, SearchCode, ChevronRight } from "lucide-react";
import { FaMotorcycle } from "react-icons/fa6";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Client, Motorbike } from "@/types";

interface ClientsViewProps {
  clients: Client[];
  bikes: Motorbike[];
  onClientSelect: (client: Client) => void;
  onAddClientClick: () => void;
}

export default function ClientsView({
  clients,
  bikes,
  onClientSelect,
  onAddClientClick,
}: ClientsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = clients.filter((client) => {
    const q = searchQuery.toLowerCase();
    const matchesClient =
      client.name.toLowerCase().includes(q) ||
      (client.nickname && client.nickname.toLowerCase().includes(q)) ||
      client.cpf.includes(q) ||
      client.phone.includes(q) ||
      (client.email && client.email.toLowerCase().includes(q));
    const clientBikes = bikes.filter((b) => b.clientId === client.id);
    const matchesBike = clientBikes.some(
      (bike) =>
        bike.plate.toLowerCase().includes(q) ||
        bike.model.toLowerCase().includes(q) ||
        bike.brand.toLowerCase().includes(q)
    );
    return matchesClient || matchesBike;
  });

  return (
    <div className="space-y-3 sm:space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
          <UserPlus className="h-4.5 w-4.5 text-zinc-500" />
          Clientes Cadastrados
        </h2>
        <button
          onClick={onAddClientClick}
          className="flex items-center justify-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs tracking-wide px-3.5 py-2 rounded-xl transition-all duration-150 shadow-sm shrink-0 self-start md:self-auto cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          CADASTRAR NOVO CLIENTE
        </button>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
        <input
          type="text"
          placeholder="Buscar por nome, CPF, placa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-4 py-1.5 text-xs font-semibold text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
        />
      </div>

      {filteredClients.length === 0 ? (
        <div className="bg-white border border-zinc-100 rounded-2xl py-16 text-center shadow-sm">
          <SearchCode className="h-9 w-9 text-zinc-300 mx-auto mb-3" />
          <p className="font-semibold text-zinc-700 text-sm">Nenhum cliente encontrado</p>
          <p className="text-xs text-zinc-400 mt-1">Tente ajustar a busca ou cadastre um novo cliente.</p>
        </div>
      ) : (
        <>
          {/* Mobile card list — hidden on md+ */}
          <div className="md:hidden space-y-2">
            {filteredClients.map((client) => {
              const clientBikes = bikes.filter((b) => b.clientId === client.id);
              const initials = client.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
              return (
                <button
                  key={client.id}
                  onClick={() => onClientSelect(client)}
                  className="w-full bg-white border border-zinc-100 rounded-2xl p-3 flex items-center gap-2.5 text-left shadow-sm hover:shadow-md hover:border-zinc-200 transition-all duration-150 active:scale-[0.99] cursor-pointer"
                >
                  <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600 shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-800 text-xs truncate">{client.name}</p>
                    {client.nickname && (
                      <p className="text-[10px] text-zinc-400 truncate">{client.nickname}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-semibold">
                        <Phone className="h-3 w-3 text-zinc-300" />
                        {client.phone}
                      </span>
                      <span className="flex items-center gap-1 text-[9px] text-zinc-400 font-bold bg-zinc-100 px-1.5 py-0.5 rounded-full">
                        <FaMotorcycle className="h-3 w-3" />
                        {clientBikes.length}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-300 shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Desktop table — hidden on mobile */}
          <div className="hidden md:block bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-100 bg-zinc-50/80">
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Nome</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">CPF</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Contato</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap">Endereço</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap text-center">Motos</TableHead>
                  <TableHead className="text-[11px] text-zinc-450 uppercase tracking-widest font-bold whitespace-nowrap text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const clientBikes = bikes.filter((b) => b.clientId === client.id);
                  const initials = client.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
                  return (
                    <TableRow
                      key={client.id}
                      className="border-zinc-100 hover:bg-zinc-50/60 transition-colors cursor-pointer group"
                      onClick={() => onClientSelect(client)}
                    >
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-600 shrink-0 group-hover:bg-zinc-900 group-hover:text-white transition-all duration-150">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-850 text-xs group-hover:text-blue-600 transition-colors">
                              {client.name}
                            </p>
                            {client.nickname && <p className="text-[10px] text-zinc-400 font-semibold">({client.nickname})</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-zinc-500 text-xs">{client.cpf || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-650 font-semibold">
                          <Phone className="h-3.5 w-3.5 text-zinc-300" />
                          {client.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-650 font-semibold">
                          <MapPin className="h-3.5 w-3.5 text-zinc-300 shrink-0" />
                          <span className="truncate max-w-[180px]">
                            {client.address.street || client.address.number || client.address.cep ? (
                              <>
                                {client.address.street || "Sem rua"}
                                {client.address.number ? `, ${client.address.number}` : ""}
                                {client.address.cep ? (
                                  <span className="text-zinc-400 text-xs ml-1">({client.address.cep})</span>
                                ) : null}
                              </>
                            ) : (
                              <span className="text-zinc-400 italic">Não informado</span>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-zinc-100 text-[10px] font-bold rounded-full text-zinc-600">
                          {clientBikes.length}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); onClientSelect(client); }}
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
