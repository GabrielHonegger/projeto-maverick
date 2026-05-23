"use client";

import React, { useState, useEffect } from "react";
import { LogOut, Menu, X } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import DashboardView from "@/components/DashboardView";
import ClientsView from "@/components/ClientsView";
import ClientDetails from "@/components/ClientDetails";
import ClientForm from "@/components/ClientForm";
import BikesView from "@/components/BikesView";
import { Client, Motorbike } from "@/types";
import { getClientsAndBikes, saveClientAction, addBikeAction, deleteBikeAction } from "@/app/actions";

export default function Home() {
  const [activeView, setActiveView] = useState("dashboard");
  const [clients, setClients] = useState<Client[]>([]);
  const [bikes, setBikes] = useState<Motorbike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await getClientsAndBikes();
        if ("error" in data) {
          alert("Erro no Supabase: " + data.error);
          return;
        }
        setClients(data.clients);
        setBikes(data.bikes);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveClient = async (
    clientData: Omit<Client, "id" | "createdAt">,
    initialBikeData: Omit<Motorbike, "id" | "clientId" | "createdAt"> | null
  ) => {
    try {
      setIsLoading(true);
      const res = await saveClientAction(clientData, initialBikeData);
      if ("error" in res) { alert("Erro no Supabase: " + res.error); return; }
      setClients((prev) => [res.client!, ...prev]);
      if (res.bike) setBikes((prev) => [res.bike!, ...prev]);
      setIsAddingClient(false);
      setSelectedClient(res.client!);
    } catch { alert("Erro ao salvar o cliente."); }
    finally { setIsLoading(false); }
  };

  const handleAddBike = async (bikeData: Omit<Motorbike, "id" | "createdAt">) => {
    try {
      setIsLoading(true);
      const res = await addBikeAction(bikeData);
      if ("error" in res) { alert("Erro no Supabase: " + res.error); return; }
      setBikes((prev) => [res.bike!, ...prev]);
      if (selectedClient && selectedClient.id === bikeData.clientId) setSelectedClient({ ...selectedClient });
    } catch { alert("Erro ao adicionar a moto."); }
    finally { setIsLoading(false); }
  };

  const handleDeleteBike = async (bikeId: string) => {
    try {
      setIsLoading(true);
      const res = await deleteBikeAction(bikeId);
      if ("error" in res) { alert("Erro no Supabase: " + res.error); return; }
      setBikes((prev) => prev.filter((b) => b.id !== bikeId));
    } catch { alert("Erro ao remover a moto."); }
    finally { setIsLoading(false); }
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
    setSelectedClient(null);
    setIsAddingClient(false);
    setSidebarOpen(false);
  };

  const viewLabels: Record<string, string> = {
    dashboard: "Painel Geral",
    clients: "Clientes",
    bikes: "Motocicletas",
  };

  return (
    <div className="flex h-screen bg-zinc-50 font-sans text-zinc-900 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed on mobile, static on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:static md:z-auto transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar
          activeView={activeView}
          setActiveView={handleViewChange}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-[60px] border-b border-zinc-100 bg-white px-4 sm:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden h-9 w-9 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-50 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Logo on mobile, breadcrumb on desktop */}
            <div className="flex items-center gap-2 text-sm">
              <span className="hidden sm:block text-zinc-400 font-medium">Agus Moto Conceito</span>
              <span className="hidden sm:block text-zinc-200">/</span>
              <span className="text-zinc-700 font-semibold">{viewLabels[activeView]}</span>
            </div>
          </div>

          {/* User area */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs tracking-tight shrink-0">
                AM
              </div>
              <span className="hidden sm:block text-sm font-semibold text-zinc-700">Administrador</span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-zinc-100" />
            <button className="text-zinc-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-zinc-50">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-4 sm:p-6 lg:py-8 lg:px-12">
          <div className="max-w-6xl mx-auto">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-zinc-200 border-t-zinc-800" />
                  <p className="text-sm text-zinc-400 font-medium">Carregando dados...</p>
                </div>
              </div>
            ) : (
              <>
                {activeView === "dashboard" && (
                  <DashboardView
                    clients={clients}
                    bikes={bikes}
                    setActiveView={handleViewChange}
                    setSelectedClient={(client) => {
                      setSelectedClient(client);
                      setActiveView("clients");
                    }}
                  />
                )}

                {activeView === "clients" && (
                  <>
                    {selectedClient ? (
                      <ClientDetails
                        client={selectedClient}
                        bikes={bikes}
                        onBack={() => setSelectedClient(null)}
                        onAddBike={handleAddBike}
                        onDeleteBike={handleDeleteBike}
                      />
                    ) : isAddingClient ? (
                      <ClientForm
                        onSave={handleSaveClient}
                        onCancel={() => setIsAddingClient(false)}
                      />
                    ) : (
                      <ClientsView
                        clients={clients}
                        bikes={bikes}
                        onClientSelect={setSelectedClient}
                        onAddClientClick={() => setIsAddingClient(true)}
                      />
                    )}
                  </>
                )}

                {activeView === "bikes" && (
                  <BikesView
                    bikes={bikes}
                    clients={clients}
                    onClientSelect={setSelectedClient}
                    setActiveView={setActiveView}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
