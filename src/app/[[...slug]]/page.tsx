"use client";

import React, { useState, useEffect } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DashboardView from "@/components/DashboardView";
import ClientsView from "@/components/ClientsView";
import ClientDetails from "@/components/ClientDetails";
import ClientForm from "@/components/ClientForm";
import BikesView from "@/components/BikesView";
import ServiceOrdersView from "@/components/ServiceOrdersView";
import ServiceOrderForm from "@/components/ServiceOrderForm";
import ServiceOrderDetails from "@/components/ServiceOrderDetails";
import TechniciansView from "@/components/TechniciansView";
import { Client, Motorbike, ServiceOrder, ServiceOrderWithRelations, PaymentItem, Technician } from "@/types";
import { toast } from "@/components/ui/toast";
import {
  getClientsAndBikes,
  saveClientAction,
  addBikeAction,
  deleteBikeAction,
  getServiceOrders,
  saveServiceOrderAction,
  updateServiceOrderStatusAction,
  getTechniciansAction,
  saveTechnicianAction,
  deleteTechnicianAction,
} from "@/app/actions";

export default function Home() {
  const pathname = usePathname();
  const router = useRouter();

  // Derive activeView from pathname
  let activeView = "service-orders";
  let urlOsNumber: number | null = null;
  if (pathname === "/dashboard") {
    activeView = "dashboard";
  } else if (pathname === "/clientes") {
    activeView = "clients";
  } else if (pathname === "/motocicletas") {
    activeView = "bikes";
  } else if (pathname === "/tecnicos" || pathname === "/mecanicos") {
    activeView = "technicians";
  } else if (pathname.startsWith("/ordens-servico") || pathname.startsWith("/service-orders")) {
    activeView = "service-orders";
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 1) {
      const numStr = segments[1];
      const parsed = parseInt(numStr, 10);
      if (!isNaN(parsed)) {
        urlOsNumber = parsed;
      }
    }
  }

  // Redirect root path to /ordens-servico
  useEffect(() => {
    if (pathname === "/") {
      router.replace("/ordens-servico");
    }
  }, [pathname, router]);
  const [clients, setClients] = useState<Client[]>([]);
  const [bikes, setBikes] = useState<Motorbike[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrderWithRelations[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [selectedServiceOrder, setSelectedServiceOrder] = useState<ServiceOrderWithRelations | null>(null);
  const [isAddingServiceOrder, setIsAddingServiceOrder] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await getClientsAndBikes();
        if ("error" in data) {
          toast.error("Erro no Supabase: " + data.error);
          return;
        }
        setClients(data.clients);
        setBikes(data.bikes);

        const osData = await getServiceOrders();
        if ("error" in osData) {
          toast.error("Erro ao carregar Ordens de Serviço: " + osData.error);
          return;
        }
        setServiceOrders(osData.serviceOrders);

        const techData = await getTechniciansAction();
        if ("error" in techData) {
          toast.error("Erro ao carregar técnicos: " + techData.error);
          return;
        }
        setTechnicians(techData.technicians);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Sync URL OS Number with selectedServiceOrder state
  useEffect(() => {
    if (urlOsNumber !== null && serviceOrders.length > 0) {
      const found = serviceOrders.find((o) => o.osNumber === urlOsNumber);
      if (found) {
        setSelectedServiceOrder(found);
      } else {
        setSelectedServiceOrder(null);
      }
    } else if (urlOsNumber === null) {
      setSelectedServiceOrder(null);
    }
  }, [urlOsNumber, serviceOrders]);

  const handleOSSelect = (order: ServiceOrderWithRelations) => {
    const padded = String(order.osNumber).padStart(4, "0");
    router.push(`/ordens-servico/${padded}`);
  };

  const handleOSBack = () => {
    router.push("/ordens-servico");
  };

  const handleSaveClient = async (
    clientData: Omit<Client, "id" | "createdAt"> & { id?: string },
    initialBikeData: Omit<Motorbike, "id" | "clientId" | "createdAt"> | null
  ) => {
    try {
      setIsLoading(true);
      const res = await saveClientAction(clientData, initialBikeData);
      if ("error" in res) { toast.error("Erro no Supabase: " + res.error); return; }
      
      if (clientData.id) {
        setClients((prev) => prev.map((c) => (c.id === res.client!.id ? res.client! : c)));
        setIsEditingClient(false);
      } else {
        setClients((prev) => [res.client!, ...prev]);
        setIsAddingClient(false);
      }
      
      if (res.bike) setBikes((prev) => [res.bike!, ...prev]);
      setSelectedClient(res.client!);
      toast.success("Cliente salvo com sucesso!");
    } catch { toast.error("Erro ao salvar o cliente."); }
    finally { setIsLoading(false); }
  };

  const handleAddBike = async (bikeData: Omit<Motorbike, "id" | "createdAt">) => {
    try {
      setIsLoading(true);
      const res = await addBikeAction(bikeData);
      if ("error" in res) { toast.error("Erro no Supabase: " + res.error); return; }
      setBikes((prev) => [res.bike!, ...prev]);
      if (selectedClient && selectedClient.id === bikeData.clientId) setSelectedClient({ ...selectedClient });
      toast.success("Moto adicionada com sucesso!");
    } catch { toast.error("Erro ao adicionar a moto."); }
    finally { setIsLoading(false); }
  };

  const handleDeleteBike = async (bikeId: string) => {
    try {
      setIsLoading(true);
      const res = await deleteBikeAction(bikeId);
      if ("error" in res) { toast.error("Erro no Supabase: " + res.error); return; }
      setBikes((prev) => prev.filter((b) => b.id !== bikeId));
      toast.success("Moto removida com sucesso!");
    } catch { toast.error("Erro ao remover a moto."); }
    finally { setIsLoading(false); }
  };

  const handleSaveServiceOrder = async (
    osData: Omit<ServiceOrder, "id" | "osNumber" | "createdAt" | "entryDate"> & { id?: string },
    keepEditing: boolean = false
  ) => {
    try {
      if (!keepEditing) {
        setIsLoading(true);
      }
      const res = await saveServiceOrderAction(osData);
      if ("error" in res) {
        toast.error("Erro ao salvar O.S: " + res.error);
        return;
      }
      const newOrUpdated = res.serviceOrder!;
      setServiceOrders((prev) => {
        const exists = prev.some((o) => o.id === newOrUpdated.id);
        if (exists) {
          return prev.map((o) => (o.id === newOrUpdated.id ? newOrUpdated : o));
        } else {
          return [newOrUpdated, ...prev];
        }
      });
      setSelectedServiceOrder(newOrUpdated);
      const padded = String(newOrUpdated.osNumber).padStart(4, "0");
      router.replace(`/ordens-servico/${padded}`);
      if (!keepEditing) {
        setIsAddingServiceOrder(false);
        toast.success("Ordem de Serviço salva com sucesso!");
      }
      return newOrUpdated;
    } catch {
      toast.error("Erro ao salvar Ordem de Serviço.");
    } finally {
      if (!keepEditing) {
        setIsLoading(false);
      }
    }
  };

  const handleCloseServiceOrder = async (
    id: string,
    status: "encerrado",
    readyDate?: string,
    exitDate?: string,
    finalPayments?: PaymentItem[]
  ) => {
    try {
      setIsLoading(true);
      const originalOrder = serviceOrders.find((o) => o.id === id);
      if (!originalOrder) return;

      const payload = {
        id,
        clientId: originalOrder.clientId,
        motorbikeId: originalOrder.motorbikeId,
        status,
        type: "os" as const,
        odometer: originalOrder.odometer,
        fuelLevel: originalOrder.fuelLevel,
        tiresCondition: originalOrder.tiresCondition,
        accessories: originalOrder.accessories,
        customAccessories: originalOrder.customAccessories,
        damagePoints: originalOrder.damagePoints,
        inspectionPhotos: originalOrder.inspectionPhotos,
        electricalProblems: originalOrder.electricalProblems,
        maintenanceProblems: originalOrder.maintenanceProblems,
        customerComplaints: originalOrder.customerComplaints,
        technicalReport: originalOrder.technicalReport,
        internalNotes: originalOrder.internalNotes,
        labor: originalOrder.labor,
        parts: originalOrder.parts,
        discounts: originalOrder.discounts,
        otherCharges: originalOrder.otherCharges,
        towingFee: originalOrder.towingFee,
        totalValue: originalOrder.totalValue,
        payments: finalPayments || originalOrder.payments,
        readyDate: readyDate,
        exitDate: exitDate,
        completedStages: originalOrder.completedStages,
      };

      const res = await saveServiceOrderAction(payload);
      if ("error" in res) {
        toast.error("Erro ao encerrar O.S: " + res.error);
        return;
      }

      const updated = res.serviceOrder!;
      setServiceOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      setSelectedServiceOrder(updated);
      toast.success("Ordem de Serviço encerrada com sucesso!");
    } catch {
      toast.error("Erro ao encerrar a Ordem de Serviço.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateServiceOrderState = (updated: ServiceOrderWithRelations) => {
    setSelectedServiceOrder(updated);
    setServiceOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  const handleSaveTechnician = async (
    techData: Omit<Technician, "id" | "createdAt"> & { id?: string }
  ) => {
    try {
      const res = await saveTechnicianAction(techData);
      if ("error" in res) {
        toast.error("Erro no Supabase: " + res.error);
        throw new Error(res.error);
      }
      
      const saved = res.technician!;
      setTechnicians((prev) => {
        const exists = prev.some((t) => t.id === saved.id);
        if (exists) {
          return prev.map((t) => (t.id === saved.id ? saved : t));
        } else {
          return [saved, ...prev];
        }
      });
    } catch (err: any) {
      throw err;
    }
  };

  const handleDeleteTechnician = async (id: string) => {
    try {
      const res = await deleteTechnicianAction(id);
      if ("error" in res) {
        toast.error("Erro no Supabase: " + res.error);
        return;
      }
      setTechnicians((prev) => prev.filter((t) => t.id !== id));
      toast.success("Técnico removido com sucesso!");
    } catch {
      toast.error("Erro ao remover o técnico.");
    }
  };

  const handleViewChange = (view: string) => {
    let path = "/ordens-servico";
    if (view === "dashboard") path = "/dashboard";
    else if (view === "clients") path = "/clientes";
    else if (view === "bikes") path = "/motocicletas";
    else if (view === "service-orders") path = "/ordens-servico";
    else if (view === "technicians") path = "/tecnicos";

    router.push(path);
    setSelectedClient(null);
    setIsAddingClient(false);
    setIsEditingClient(false);
    setSelectedServiceOrder(null);
    setIsAddingServiceOrder(false);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const viewLabels: Record<string, string> = {
    dashboard: "Painel Geral",
    clients: "Clientes",
    bikes: "Motocicletas",
    "service-orders": "Ordens de Serviço",
    technicians: "Técnicos",
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

      {/* Sidebar — fixed on mobile, static on desktop with width collapse */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:static md:z-auto transition-all duration-300 ease-in-out overflow-hidden ${
          sidebarOpen
            ? "translate-x-0 w-64 md:w-56"
            : "-translate-x-full md:translate-x-0 w-64 md:w-0"
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
        <header className="h-[60px] border-b border-zinc-100 bg-white px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger / Menu toggle button */}
            <button
              className="h-9 w-9 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-50 transition-colors cursor-pointer"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Alternar menu"
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
        <main className="flex-1 overflow-y-auto bg-zinc-50 py-3 px-4 sm:py-6">
          <div className="max-w-full mx-auto w-full">
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
                      handleViewChange("clients");
                    }}
                  />
                )}

                {activeView === "clients" && (
                  <>
                    {selectedClient ? (
                      isEditingClient ? (
                        <ClientForm
                          client={selectedClient}
                          onSave={handleSaveClient}
                          onCancel={() => setIsEditingClient(false)}
                        />
                      ) : (
                        <ClientDetails
                          client={selectedClient}
                          bikes={bikes}
                          onBack={() => setSelectedClient(null)}
                          onAddBike={handleAddBike}
                          onDeleteBike={handleDeleteBike}
                          onEditClient={() => setIsEditingClient(true)}
                        />
                      )
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
                    setActiveView={handleViewChange}
                  />
                )}

                {activeView === "service-orders" && (
                  <>
                    {selectedServiceOrder ? (
                      <ServiceOrderForm
                        initialData={selectedServiceOrder}
                        clients={clients}
                        bikes={bikes}
                        technicians={technicians}
                        onSave={handleSaveServiceOrder}
                        onCancel={handleOSBack}
                        onCloseOS={handleCloseServiceOrder}
                        onUpdateOrder={handleUpdateServiceOrderState}
                      />
                    ) : isAddingServiceOrder ? (
                      <ServiceOrderForm
                        clients={clients}
                        bikes={bikes}
                        technicians={technicians}
                        onSave={handleSaveServiceOrder}
                        onCancel={() => setIsAddingServiceOrder(false)}
                      />
                    ) : (
                      <ServiceOrdersView
                        serviceOrders={serviceOrders}
                        onOSSelect={handleOSSelect}
                        onAddOSClick={() => setIsAddingServiceOrder(true)}
                      />
                    )}
                  </>
                )}

                {activeView === "technicians" && (
                  <TechniciansView
                    technicians={technicians}
                    onSaveTechnician={handleSaveTechnician}
                    onDeleteTechnician={handleDeleteTechnician}
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
