import React, { useState } from "react";
import { Search, UserPlus, Eye, Phone, MapPin, SearchCode } from "lucide-react";
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

  // Search logic
  const filteredClients = clients.filter((client) => {
    const q = searchQuery.toLowerCase();
    const matchesClient =
      client.name.toLowerCase().includes(q) ||
      (client.nickname && client.nickname.toLowerCase().includes(q)) ||
      client.cpf.includes(q) ||
      client.phone.includes(q) ||
      (client.email && client.email.toLowerCase().includes(q));

    // Also match if query matches plate of any of the client's bikes
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
    <div className="space-y-6 animate-fade-in">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Clientes</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Gerencie os clientes e seus veículos.</p>
        </div>
        <button
          onClick={onAddClientClick}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold px-4 py-2.5 rounded-xl transition-all duration-150 shadow-md shadow-blue-600/10 self-start sm:self-auto"
        >
          <UserPlus className="h-5 w-5" />
          Novo Cliente
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
        <Input
          type="text"
          placeholder="Buscar por nome, apelido, CPF, placa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 pr-4 py-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-blue-500"
        />
      </div>

      {/* Clients Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {filteredClients.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">
            <SearchCode className="h-10 w-10 text-zinc-400 mx-auto mb-3" />
            <p className="font-semibold text-zinc-700 dark:text-zinc-300">Nenhum cliente encontrado</p>
            <p className="text-sm text-zinc-500 mt-1">Tente reajustar a busca ou cadastrar um novo cliente.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-950/40">
              <TableRow className="border-zinc-200 dark:border-zinc-800">
                <TableHead className="text-zinc-500 font-semibold">Nome / Apelido</TableHead>
                <TableHead className="text-zinc-500 font-semibold">CPF</TableHead>
                <TableHead className="text-zinc-500 font-semibold">Contato</TableHead>
                <TableHead className="text-zinc-500 font-semibold">Localização (CEP)</TableHead>
                <TableHead className="text-zinc-500 font-semibold text-center">Motos</TableHead>
                <TableHead className="text-zinc-500 font-semibold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => {
                const clientBikes = bikes.filter((b) => b.clientId === client.id);
                return (
                  <TableRow
                    key={client.id}
                    className="border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors cursor-pointer group"
                    onClick={() => onClientSelect(client)}
                  >
                    {/* Name Cell */}
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-500 transition-colors">
                          {client.name}
                        </span>
                        {client.nickname && (
                          <span className="text-xs text-zinc-500 font-medium">
                            Apelido: {client.nickname}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* CPF Cell */}
                    <TableCell className="font-mono text-zinc-600 dark:text-zinc-400 text-xs">
                      {client.cpf}
                    </TableCell>

                    {/* Phone Cell */}
                    <TableCell className="text-zinc-700 dark:text-zinc-300">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Phone className="h-3.5 w-3.5 text-zinc-400" />
                        {client.phone}
                      </div>
                    </TableCell>

                    {/* Address/CEP Cell */}
                    <TableCell className="text-zinc-700 dark:text-zinc-300">
                      <div className="flex items-center gap-1.5 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                        {client.address.street}, {client.address.number}{" "}
                        <span className="text-xs text-zinc-500">({client.address.cep})</span>
                      </div>
                    </TableCell>

                    {/* Bikes count Cell */}
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-xs font-bold rounded-full text-zinc-600 dark:text-zinc-400">
                        {clientBikes.length}
                      </span>
                    </TableCell>

                    {/* Action Button Cell */}
                    <TableCell className="text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClientSelect(client);
                        }}
                        className="inline-flex items-center justify-center bg-zinc-100 hover:bg-blue-600 hover:text-white dark:bg-zinc-800 dark:hover:bg-blue-600 text-zinc-700 dark:text-zinc-300 p-2 rounded-lg transition-all duration-150"
                      >
                        <Eye className="h-4.5 w-4.5" />
                      </button>
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
