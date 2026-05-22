"use client";

import React, { useState, useEffect } from "react";
import { Wrench, Search, LogOut, Sun, Moon } from "lucide-react";
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
  
  // Client drill-down and form states
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);

  // Load from Supabase DB
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await getClientsAndBikes();
        if ('error' in data) {
          alert("Erro no Supabase: " + data.error);
          return;
        }
        setClients(data.clients);
        setBikes(data.bikes);
      } catch (error) {
        console.error("Erro ao carregar dados do Supabase:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Add a new client (along with an optional first motorbike)
  const handleSaveClient = async (
    clientData: Omit<Client, "id" | "createdAt">,
    initialBikeData: Omit<Motorbike, "id" | "clientId" | "createdAt"> | null
  ) => {
    try {
      setIsLoading(true);
      const res = await saveClientAction(clientData, initialBikeData);
      if ('error' in res) {
        alert("Erro no Supabase: " + res.error);
        return;
      }
      
      setClients((prev) => [res.client!, ...prev]);
      if (res.bike) {
        setBikes((prev) => [res.bike!, ...prev]);
      }
      
      setIsAddingClient(false);
      setSelectedClient(res.client!);
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert("Erro ao salvar o cliente no banco de dados.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add a motorbike to an existing client
  const handleAddBike = async (bikeData: Omit<Motorbike, "id" | "createdAt">) => {
    try {
      setIsLoading(true);
      const res = await addBikeAction(bikeData);
      if ('error' in res) {
        alert("Erro no Supabase: " + res.error);
        return;
      }
      setBikes((prev) => [res.bike!, ...prev]);
      
      // Update selected client details to reflect the new bike immediately
      if (selectedClient && selectedClient.id === bikeData.clientId) {
        setSelectedClient({ ...selectedClient });
      }
    } catch (error) {
      console.error("Erro ao adicionar moto:", error);
      alert("Erro ao adicionar a moto no banco de dados.");
    } finally {
      setIsLoading(false);
    }
  };

  // Remove a motorbike
  const handleDeleteBike = async (bikeId: string) => {
    try {
      setIsLoading(true);
      const res = await deleteBikeAction(bikeId);
      if ('error' in res) {
        alert("Erro no Supabase: " + res.error);
        return;
      }
      setBikes((prev) => prev.filter((b) => b.id !== bikeId));
    } catch (error) {
      console.error("Erro ao remover moto:", error);
      alert("Erro ao remover a moto do banco de dados.");
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation interceptor to clean detail views
  const handleViewChange = (view: string) => {
    setActiveView(view);
    setSelectedClient(null);
    setIsAddingClient(false);
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black font-sans text-zinc-900 dark:text-zinc-50 overflow-hidden">
      {/* Sidebar navigation */}
      <Sidebar activeView={activeView} setActiveView={handleViewChange} />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Main top header */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="text-xs font-semibold px-2.5 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400">
              Agus Moto Conceito
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 pr-4 border-r border-zinc-200 dark:border-zinc-800">
              <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs">
                M
              </div>
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Administrador</span>
            </div>
            
            <button className="text-zinc-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900">
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        {/* Dynamic page content scroll-container */}
        <main className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/20 p-8">
          <div className="max-w-5xl mx-auto h-full">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Carregando dados do Supabase...</p>
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
