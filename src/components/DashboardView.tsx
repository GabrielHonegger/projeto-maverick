import React from "react";
import { Users, Bike, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Client, Motorbike } from "@/types";

interface DashboardViewProps {
  clients: Client[];
  bikes: Motorbike[];
  setActiveView: (view: string) => void;
  setSelectedClient: (client: Client | null) => void;
}

export default function DashboardView({
  clients,
  bikes,
  setActiveView,
  setSelectedClient,
}: DashboardViewProps) {
  // Statistics calculations
  const totalClients = clients.length;
  const totalBikes = bikes.length;
  
  const bmwCount = bikes.filter((b) => b.brand.toLowerCase() === "bmw").length;
  const triumphCount = bikes.filter((b) => b.brand.toLowerCase() === "triumph").length;
  const otherBikesCount = totalBikes - (bmwCount + triumphCount);
  
  const avgBikesPerClient = totalClients > 0 ? (totalBikes / totalClients).toFixed(1) : "0";

  // Recent client list
  const recentClients = [...clients]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Painel Geral</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Bem-vindo ao painel de controle da oficina.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Clients */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total de Clientes</CardTitle>
            <div className="bg-blue-100 dark:bg-blue-950/50 p-2 rounded-lg text-blue-600 dark:text-blue-400">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{totalClients}</div>
            <p className="text-xs text-zinc-500 mt-1">Clientes ativos cadastrados</p>
          </CardContent>
        </Card>

        {/* Card 2: Bikes */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Motos Registradas</CardTitle>
            <div className="bg-blue-100 dark:bg-blue-950/50 p-2 rounded-lg text-blue-600 dark:text-blue-400">
              <Bike className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{totalBikes}</div>
            <p className="text-xs text-zinc-500 mt-1">Veículos sob nossa custódia/histórico</p>
          </CardContent>
        </Card>

        {/* Card 3: Average */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Motos por Cliente</CardTitle>
            <div className="bg-emerald-100 dark:bg-emerald-950/50 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{avgBikesPerClient}</div>
            <p className="text-xs text-zinc-500 mt-1">Média de veículos por cliente</p>
          </CardContent>
        </Card>

        {/* Card 4: Brand stats */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Marcas Premium</CardTitle>
            <div className="bg-purple-100 dark:bg-purple-950/50 p-2 rounded-lg text-purple-600 dark:text-purple-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {bmwCount + triumphCount}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              BMW: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{bmwCount}</span> • Triumph: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{triumphCount}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Brand Breakdown and Recent Clients */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Brand Distribution List */}
        <Card className="md:col-span-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">Marcas Atendidas</CardTitle>
            <CardDescription>Distribuição dos veículos por marca</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {totalBikes === 0 ? (
              <div className="text-sm text-zinc-500 py-6 text-center">Nenhuma moto cadastrada.</div>
            ) : (
              <div className="space-y-3">
                {/* BMW bar */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                    <span>BMW</span>
                    <span>{bmwCount} ({totalBikes > 0 ? Math.round((bmwCount/totalBikes)*100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${totalBikes > 0 ? (bmwCount/totalBikes)*100 : 0}%` }}></div>
                  </div>
                </div>

                {/* Triumph bar */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                    <span>Triumph</span>
                    <span>{triumphCount} ({totalBikes > 0 ? Math.round((triumphCount/totalBikes)*100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalBikes > 0 ? (triumphCount/totalBikes)*100 : 0}%` }}></div>
                  </div>
                </div>

                {/* Outras bar */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                    <span>Outras Marcas</span>
                    <span>{otherBikesCount} ({totalBikes > 0 ? Math.round((otherBikesCount/totalBikes)*100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-zinc-400 dark:bg-zinc-600 h-full rounded-full" style={{ width: `${totalBikes > 0 ? (otherBikesCount/totalBikes)*100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Client Registrations */}
        <Card className="md:col-span-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Clientes Recentes</CardTitle>
              <CardDescription>Últimos cadastros adicionados</CardDescription>
            </div>
            <button
              onClick={() => setActiveView("clients")}
              className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors"
            >
              Ver todos os clientes →
            </button>
          </CardHeader>
          <CardContent>
            {recentClients.length === 0 ? (
              <div className="text-sm text-zinc-500 py-10 text-center">Nenhum cliente cadastrado ainda.</div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {recentClients.map((client) => {
                  const clientBikes = bikes.filter((b) => b.clientId === client.id);
                  return (
                    <div
                      key={client.id}
                      className="py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 px-2 rounded-lg transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedClient(client);
                        setActiveView("clients");
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {client.name} {client.nickname && <span className="text-xs text-zinc-500 font-normal">({client.nickname})</span>}
                        </span>
                        <span className="text-xs text-zinc-400">{client.email || "Sem e-mail"} • {client.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold rounded-full text-zinc-600 dark:text-zinc-400">
                          {clientBikes.length} {clientBikes.length === 1 ? "moto" : "motos"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
