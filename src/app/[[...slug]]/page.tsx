"use client";

import React, { useState, useEffect, useRef } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { FaMotorcycle } from "react-icons/fa6";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DashboardView from "@/components/DashboardView";
import ClientsView from "@/components/ClientsView";
import ClientDetails from "@/components/ClientDetails";
import ClientForm from "@/components/ClientForm";
import BikesView from "@/components/BikesView";
import ServiceOrdersView from "@/components/ServiceOrdersView";
import ServiceOrderForm, { ServiceOrderFormHandle } from "@/components/ServiceOrderForm";
import ServiceOrderDetails from "@/components/ServiceOrderDetails";
import BillingView from "@/components/BillingView";
import UsersView from "@/components/UsersView";
import ServicesView from "@/components/ServicesView";
import ServiceForm from "@/components/ServiceForm";
import PartsCatalogView from "@/components/PartsCatalogView";
import PartCatalogForm from "@/components/PartCatalogForm";
import MaterialsView from "@/components/MaterialsView";
import NotificationCenter from "@/components/NotificationCenter";
import { Client, Motorbike, ServiceOrder, ServiceOrderWithRelations, PaymentItem, Technician, Service, PartCatalogItem, Material, SystemNotification } from "@/types";
import { toast } from "@/components/ui/toast";
import {
  saveClientAction,
  addBikeAction,
  deleteBikeAction,
  updateBikeAction,
  deleteClientAction,
  saveServiceOrderAction,
  deleteServiceOrderAction,
  updateServiceOrderStatusAction,
  logoutAction,
  saveServiceAction,
  deleteServiceAction,
  savePartCatalogAction,
  deletePartCatalogAction,
  getInitialAppDataAction,
  saveMaterialAction,
  deleteMaterialAction,
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from "@/app/actions";

// Persistent Client-side Cache to prevent page/sidebar flicker during Next.js dynamic routing
let cachedUser: any = null;
let cachedClients: any[] = [];
let cachedBikes: any[] = [];
let cachedServiceOrders: any[] = [];
let cachedTechnicians: any[] = [];
let cachedServices: any[] = [];
let cachedPartsCatalog: any[] = [];
let cachedMaterials: any[] = [];
let cachedNotifications: any[] = [];
let hasHydrated = false;
let lastFetchTime = 0;
const CACHE_TTL_MS = 15000; // 15 seconds cache TTL

if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem("maverick_user");
    if (saved) {
      cachedUser = JSON.parse(saved);
    }
  } catch {}
}

export default function Home() {
  const pathname = usePathname();
  const router = useRouter();

  // Derive activeView and other routing details from pathname
  let activeView = "service-orders";
  let urlOsNumber: number | null = null;
  let urlClientId: string | null = null;
  let urlServiceId: string | null = null;
  let urlPartId: string | null = null;
  let urlAction: string | null = null; // "novo", "editar", "nova"

  const segments = pathname.split("/").filter(Boolean);
  const rootSegment = segments[0] || "";

  if (rootSegment === "dashboard") {
    activeView = "dashboard";
  } else if (rootSegment === "clientes") {
    activeView = "clients";
    if (segments.length > 1) {
      if (segments[1] === "novo") {
        urlAction = "novo";
      } else {
        urlClientId = segments[1];
        if (segments[2] === "editar") {
          urlAction = "editar";
        }
      }
    }
  } else if (rootSegment === "motocicletas") {
    activeView = "bikes";
  } else if (rootSegment === "servicos" || rootSegment === "services") {
    activeView = "services";
    if (segments.length > 1) {
      if (segments[1] === "novo") {
        urlAction = "novo";
      } else {
        urlServiceId = segments[1];
        if (segments[2] === "editar") {
          urlAction = "editar";
        }
      }
    }
  } else if (rootSegment === "pecas" || rootSegment === "parts") {
    activeView = "parts";
    if (segments.length > 1) {
      if (segments[1] === "novo") {
        urlAction = "novo";
      } else {
        urlPartId = segments[1];
        if (segments[2] === "editar") {
          urlAction = "editar";
        }
      }
    }
  } else if (rootSegment === "faturamento") {
    activeView = "billing";
  } else if (rootSegment === "team" || rootSegment === "equipe") {
    activeView = "team";
  } else if (rootSegment === "ordens-servico" || rootSegment === "service-orders") {
    activeView = "service-orders";
    if (segments.length > 1) {
      if (segments[1] === "nova") {
        urlAction = "nova";
      } else {
        const parsed = parseInt(segments[1], 10);
        if (!isNaN(parsed)) {
          urlOsNumber = parsed;
        }
      }
    }
  } else if (rootSegment === "materiais") {
    activeView = "materials";
  }

  // Redirect root path to /ordens-servico
  useEffect(() => {
    if (pathname === "/") {
      router.replace("/ordens-servico");
    }
  }, [pathname, router]);

  const [currentUser, _setCurrentUser] = useState<any>(() => {
    return hasHydrated ? cachedUser : null;
  });
  const setCurrentUser: React.Dispatch<React.SetStateAction<any>> = (val) => {
    _setCurrentUser(val);
    cachedUser = typeof val === 'function' ? (val as Function)(cachedUser) : val;
  };

  const [clients, _setClients] = useState<Client[]>(() => {
    return hasHydrated ? cachedClients : [];
  });
  const setClients: React.Dispatch<React.SetStateAction<Client[]>> = (val) => {
    _setClients(val);
    cachedClients = typeof val === 'function' ? (val as Function)(cachedClients) : val;
  };

  const [bikes, _setBikes] = useState<Motorbike[]>(() => {
    return hasHydrated ? cachedBikes : [];
  });
  const setBikes: React.Dispatch<React.SetStateAction<Motorbike[]>> = (val) => {
    _setBikes(val);
    cachedBikes = typeof val === 'function' ? (val as Function)(cachedBikes) : val;
  };

  const [serviceOrders, _setServiceOrders] = useState<ServiceOrderWithRelations[]>(() => {
    return hasHydrated ? cachedServiceOrders : [];
  });
  const setServiceOrders: React.Dispatch<React.SetStateAction<ServiceOrderWithRelations[]>> = (val) => {
    _setServiceOrders(val);
    cachedServiceOrders = typeof val === 'function' ? (val as Function)(cachedServiceOrders) : val;
  };

  const [technicians, _setTechnicians] = useState<Technician[]>(() => {
    return hasHydrated ? cachedTechnicians : [];
  });
  const setTechnicians: React.Dispatch<React.SetStateAction<Technician[]>> = (val) => {
    _setTechnicians(val);
    cachedTechnicians = typeof val === 'function' ? (val as Function)(cachedTechnicians) : val;
  };

  const [services, _setServices] = useState<Service[]>(() => {
    return hasHydrated ? cachedServices : [];
  });
  const setServices: React.Dispatch<React.SetStateAction<Service[]>> = (val) => {
    _setServices(val);
    cachedServices = typeof val === 'function' ? (val as Function)(cachedServices) : val;
  };

  const [partsCatalog, _setPartsCatalog] = useState<PartCatalogItem[]>(() => {
    return hasHydrated ? cachedPartsCatalog : [];
  });
  const setPartsCatalog: React.Dispatch<React.SetStateAction<PartCatalogItem[]>> = (val) => {
    _setPartsCatalog(val);
    cachedPartsCatalog = typeof val === 'function' ? (val as Function)(cachedPartsCatalog) : val;
  };

  const [selectedPartCatalogItem, setSelectedPartCatalogItem] = useState<PartCatalogItem | null>(null);
  const [isAddingPartCatalogItem, setIsAddingPartCatalogItem] = useState(false);
  const [isEditingPartCatalogItem, setIsEditingPartCatalogItem] = useState(false);

  const [materials, _setMaterials] = useState<Material[]>(() => {
    return hasHydrated ? cachedMaterials : [];
  });
  const setMaterials: React.Dispatch<React.SetStateAction<Material[]>> = (val) => {
    _setMaterials(val);
    cachedMaterials = typeof val === 'function' ? (val as Function)(cachedMaterials) : val;
  };

  const [notifications, _setNotifications] = useState<SystemNotification[]>(() => {
    return hasHydrated ? cachedNotifications : [];
  });
  const setNotifications: React.Dispatch<React.SetStateAction<SystemNotification[]>> = (val) => {
    _setNotifications(val);
    cachedNotifications = typeof val === 'function' ? (val as Function)(cachedNotifications) : val;
  };

  const [isLoading, setIsLoading] = useState(() => {
    return !hasHydrated || (cachedClients.length === 0 && cachedServiceOrders.length === 0);
  });

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [selectedServiceOrder, setSelectedServiceOrder] = useState<ServiceOrderWithRelations | null>(null);
  const [isAddingServiceOrder, setIsAddingServiceOrder] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const [isEditingService, setIsEditingService] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [initialClientId, setInitialClientId] = useState<string | undefined>(undefined);

  // Sync client query parameter from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const clienteId = params.get("clienteId") || undefined;
      setInitialClientId(clienteId);
    }
  }, [pathname]);

  // Ref to the currently-mounted ServiceOrderForm so we can save before navigating away
  const serviceOrderFormRef = useRef<ServiceOrderFormHandle>(null);

  /**
   * Called by the Sidebar before any link navigation with the target path.
   * Silently persists the current OS form state, then navigates with router.push
   * (soft navigation — no hard reload, no React state wipe).
   */
  const handleBeforeNavigate = async (path: string) => {
    if (serviceOrderFormRef.current) {
      serviceOrderFormRef.current.saveNow();
    }
    router.push(path);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    // Initialize Ionic PWA Elements for camera fallback on web
    import("@ionic/pwa-elements/loader").then(({ defineCustomElements }) => {
      defineCustomElements(window);
    });
  }, []);

  useEffect(() => {
    hasHydrated = true;
    async function loadData() {
      const now = Date.now();
      if (now - lastFetchTime < CACHE_TTL_MS) {
        setIsLoading(false);
        return;
      }
      try {
        if (cachedClients.length === 0 && cachedServiceOrders.length === 0) {
          setIsLoading(true);
        }
        const data = await getInitialAppDataAction();
        if ("error" in data) {
          toast.error("Erro ao carregar dados do aplicativo: " + data.error);
          return;
        }
        if (data.user) {
          setCurrentUser(data.user);
          if (typeof window !== "undefined") {
            localStorage.setItem("maverick_user", JSON.stringify(data.user));
          }
        } else {
          setCurrentUser(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("maverick_user");
          }
        }
        setClients(data.clients || []);
        setBikes(data.bikes || []);
        setServiceOrders(data.serviceOrders || []);
        setServices(data.services || []);
        setPartsCatalog(data.partsCatalog || []);
        setTechnicians(data.technicians || []);
        setMaterials(data.materials || []);
        setNotifications(data.notifications || []);
        lastFetchTime = Date.now();
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Synchronize client selection state with URL
  useEffect(() => {
    if (activeView === "clients") {
      if (urlAction === "novo") {
        setIsAddingClient(true);
        setSelectedClient(null);
        setIsEditingClient(false);
      } else if (urlClientId) {
        const found = clients.find((c) => c.id === urlClientId);
        if (found) {
          setSelectedClient(found);
          setIsAddingClient(false);
          setIsEditingClient(urlAction === "editar");
        } else {
          setSelectedClient(null);
          setIsAddingClient(false);
          setIsEditingClient(false);
        }
      } else {
        setSelectedClient(null);
        setIsAddingClient(false);
        setIsEditingClient(false);
      }
    } else {
      setSelectedClient(null);
      setIsAddingClient(false);
      setIsEditingClient(false);
    }
  }, [activeView, urlClientId, urlAction, clients]);

  // Synchronize service order selection state with URL
  useEffect(() => {
    if (activeView === "service-orders") {
      if (urlAction === "nova") {
        setIsAddingServiceOrder(true);
        setSelectedServiceOrder(null);
      } else if (urlOsNumber !== null && serviceOrders.length > 0) {
        const found = serviceOrders.find((o) => o.osNumber === urlOsNumber);
        if (found) {
          setSelectedServiceOrder(found);
          setIsAddingServiceOrder(false);
        } else {
          setSelectedServiceOrder(null);
          setIsAddingServiceOrder(false);
        }
      } else {
        setSelectedServiceOrder(null);
        setIsAddingServiceOrder(false);
      }
    } else {
      setSelectedServiceOrder(null);
      setIsAddingServiceOrder(false);
    }
  }, [activeView, urlOsNumber, urlAction, serviceOrders]);

  // Synchronize service selection state with URL
  useEffect(() => {
    if (activeView === "services") {
      if (urlAction === "novo") {
        setIsAddingService(true);
        setSelectedService(null);
        setIsEditingService(false);
      } else if (urlServiceId) {
        const found = services.find((s) => s.id === urlServiceId);
        if (found) {
          setSelectedService(found);
          setIsAddingService(false);
          setIsEditingService(urlAction === "editar");
        } else {
          setSelectedService(null);
          setIsAddingService(false);
          setIsEditingService(false);
        }
      } else {
        setSelectedService(null);
        setIsAddingService(false);
        setIsEditingService(false);
      }
    } else {
      setSelectedService(null);
      setIsAddingService(false);
      setIsEditingService(false);
    }
  }, [activeView, urlServiceId, urlAction, services]);

  // Synchronize parts selection state with URL
  useEffect(() => {
    if (activeView === "parts") {
      if (urlAction === "novo") {
        setIsAddingPartCatalogItem(true);
        setSelectedPartCatalogItem(null);
        setIsEditingPartCatalogItem(false);
      } else if (urlPartId) {
        const found = partsCatalog.find((p) => p.id === urlPartId);
        if (found) {
          setSelectedPartCatalogItem(found);
          setIsAddingPartCatalogItem(false);
          setIsEditingPartCatalogItem(urlAction === "editar");
        } else {
          setSelectedPartCatalogItem(null);
          setIsAddingPartCatalogItem(false);
          setIsEditingPartCatalogItem(false);
        }
      } else {
        setSelectedPartCatalogItem(null);
        setIsAddingPartCatalogItem(false);
        setIsEditingPartCatalogItem(false);
      }
    } else {
      setSelectedPartCatalogItem(null);
      setIsAddingPartCatalogItem(false);
      setIsEditingPartCatalogItem(false);
    }
  }, [activeView, urlPartId, urlAction, partsCatalog]);

  const handleOSSelect = (order: ServiceOrderWithRelations) => {
    const padded = String(order.osNumber).padStart(4, "0");
    router.push(`/ordens-servico/${padded}`);
  };

  const handleOSBack = () => {
    router.push("/ordens-servico");
  };  const handleSaveClient = async (
    clientData: Omit<Client, "id" | "createdAt"> & { id?: string },
    initialBikeData: Omit<Motorbike, "id" | "clientId" | "createdAt"> | null,
    redirectToOS?: boolean
  ) => {
    if (!clientData.id) {
      try {
        setIsLoading(true);
        const res = await saveClientAction(clientData, initialBikeData);
        if ("error" in res) { toast.error("Erro no Supabase: " + res.error); return; }
        setClients((prev) => [res.client!, ...prev]);
        setIsAddingClient(false);
        if (res.bike) setBikes((prev) => [res.bike!, ...prev]);
        setSelectedClient(res.client!);
        toast.success("Cliente salvo com sucesso!");
        if (redirectToOS) {
          router.push(`/ordens-servico/nova?clienteId=${res.client!.id}`);
        }
      } catch {
        toast.error("Erro ao salvar o cliente.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const originalClients = [...clients];
    const clientToUpdate = clients.find(c => c.id === clientData.id);
    if (!clientToUpdate) return;

    const optimisticClient: Client = {
      ...clientToUpdate,
      ...clientData,
    };

    setClients((prev) => prev.map((c) => (c.id === clientData.id ? optimisticClient : c)));
    setSelectedClient(optimisticClient);
    setIsEditingClient(false);
    toast.success("Cliente salvo com sucesso!");

    try {
      const res = await saveClientAction(clientData, initialBikeData);
      if ("error" in res) {
        setClients(originalClients);
        setSelectedClient(clientToUpdate);
        setIsEditingClient(true);
        toast.error("Erro ao salvar o cliente: " + res.error);
        return;
      }
      setClients((prev) => prev.map((c) => (c.id === res.client!.id ? res.client! : c)));
      setSelectedClient(res.client!);
    } catch {
      setClients(originalClients);
      setSelectedClient(clientToUpdate);
      setIsEditingClient(true);
      toast.error("Erro ao salvar o cliente.");
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    const originalClients = [...clients];
    const originalBikes = [...bikes];

    setClients((prev) => prev.filter((c) => c.id !== clientId));
    setBikes((prev) => prev.filter((b) => b.clientId !== clientId));
    toast.success("Cliente excluído com sucesso!");
    router.push("/clientes");

    try {
      const res = await deleteClientAction(clientId);
      if ("error" in res) {
        setClients(originalClients);
        setBikes(originalBikes);
        toast.error(res.error || "Erro ao excluir o cliente.");
        router.push(`/clientes/${clientId}`);
        return;
      }
    } catch {
      setClients(originalClients);
      setBikes(originalBikes);
      toast.error("Erro ao excluir o cliente.");
      router.push(`/clientes/${clientId}`);
    }
  };

  const handleDeleteServiceOrder = async (id: string) => {
    const originalOrders = [...serviceOrders];
    setServiceOrders((prev) => prev.filter((o) => o.id !== id));
    toast.success("Ordem de Serviço excluída com sucesso!");
    router.push("/ordens-servico");

    try {
      const res = await deleteServiceOrderAction(id);
      if ("error" in res) {
        setServiceOrders(originalOrders);
        toast.error(res.error || "Erro ao excluir a Ordem de Serviço.");
        return;
      }
    } catch {
      setServiceOrders(originalOrders);
      toast.error("Erro ao excluir a Ordem de Serviço.");
    }
  };

  const handleAddBike = async (bikeData: Omit<Motorbike, "id" | "createdAt">) => {
    const originalBikes = [...bikes];
    const tempId = `temp-${Math.random().toString()}`;
    const optimisticBike: Motorbike = {
      id: tempId,
      createdAt: new Date().toISOString(),
      ...bikeData
    };

    setBikes((prev) => [optimisticBike, ...prev]);
    if (selectedClient && selectedClient.id === bikeData.clientId) {
      setSelectedClient({ ...selectedClient });
    }
    toast.success("Moto adicionada com sucesso!");

    try {
      const res = await addBikeAction(bikeData);
      if ("error" in res) {
        setBikes(originalBikes);
        if (selectedClient && selectedClient.id === bikeData.clientId) {
          setSelectedClient({ ...selectedClient });
        }
        toast.error("Erro no Supabase: " + res.error);
        return;
      }
      setBikes((prev) => prev.map((b) => (b.id === tempId ? res.bike! : b)));
      if (selectedClient && selectedClient.id === bikeData.clientId) {
        setSelectedClient({ ...selectedClient });
      }
    } catch {
      setBikes(originalBikes);
      if (selectedClient && selectedClient.id === bikeData.clientId) {
        setSelectedClient({ ...selectedClient });
      }
      toast.error("Erro ao adicionar a moto.");
    }
  };

  const handleDeleteBike = async (bikeId: string) => {
    const originalBikes = [...bikes];
    setBikes((prev) => prev.filter((b) => b.id !== bikeId));
    toast.success("Moto removida com sucesso!");

    try {
      const res = await deleteBikeAction(bikeId);
      if ("error" in res) {
        setBikes(originalBikes);
        toast.error("Erro no Supabase: " + res.error);
        return;
      }
    } catch {
      setBikes(originalBikes);
      toast.error("Erro ao remover a moto.");
    }
  };

  const handleEditBike = async (bikeId: string, bikeData: Omit<Motorbike, "id" | "clientId" | "createdAt">) => {
    const originalBikes = [...bikes];
    const bikeToUpdate = bikes.find(b => b.id === bikeId);
    if (!bikeToUpdate) return;

    const optimisticBike: Motorbike = {
      ...bikeToUpdate,
      ...bikeData
    };

    setBikes((prev) => prev.map((b) => (b.id === bikeId ? optimisticBike : b)));
    if (selectedClient) setSelectedClient({ ...selectedClient });
    toast.success("Moto atualizada com sucesso!");

    try {
      const res = await updateBikeAction(bikeId, bikeData);
      if ("error" in res) {
        setBikes(originalBikes);
        if (selectedClient) setSelectedClient({ ...selectedClient });
        toast.error("Erro no Supabase: " + res.error);
        return;
      }
      setBikes((prev) => prev.map((b) => (b.id === bikeId ? res.bike! : b)));
      if (selectedClient) setSelectedClient({ ...selectedClient });
    } catch {
      setBikes(originalBikes);
      if (selectedClient) setSelectedClient({ ...selectedClient });
      toast.error("Erro ao atualizar a moto.");
    }
  };

  const handleSaveServiceOrder = async (
    osData: Omit<ServiceOrder, "id" | "osNumber" | "createdAt" | "entryDate"> & { id?: string },
    keepEditing: boolean = false
  ) => {
    if (!osData.id) {
      try {
        if (!keepEditing) setIsLoading(true);
        const res = await saveServiceOrderAction(osData);
        if ("error" in res) {
          toast.error("Erro ao salvar O.S: " + res.error);
          return;
        }
        const newOrUpdated = res.serviceOrder!;
        setServiceOrders((prev) => [newOrUpdated, ...prev]);
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
        if (!keepEditing) setIsLoading(false);
      }
      return;
    }

    const originalOrders = [...serviceOrders];
    const originalSelected = selectedServiceOrder;
    const existingOrder = serviceOrders.find(o => o.id === osData.id);
    if (!existingOrder) return;

    const optimisticOrder: ServiceOrderWithRelations = {
      ...existingOrder,
      ...osData,
      status: osData.status || existingOrder.status,
      type: osData.type || existingOrder.type,
      discounts: osData.discounts ?? existingOrder.discounts,
      otherCharges: osData.otherCharges ?? existingOrder.otherCharges,
      towingFee: osData.towingFee ?? existingOrder.towingFee,
      totalValue: osData.totalValue ?? existingOrder.totalValue,
      payments: osData.payments || existingOrder.payments,
      completedStages: (osData as any).completedStages || existingOrder.completedStages,
      fuelRefuelingValue: osData.fuelRefuelingValue ?? existingOrder.fuelRefuelingValue,
      fuelRefuelingLiters: osData.fuelRefuelingLiters ?? existingOrder.fuelRefuelingLiters,
    };

    setServiceOrders((prev) => prev.map((o) => (o.id === osData.id ? optimisticOrder : o)));
    setSelectedServiceOrder(optimisticOrder);
    
    if (!keepEditing) {
      setIsAddingServiceOrder(false);
      toast.success("Ordem de Serviço salva com sucesso!");
    }

    try {
      const res = await saveServiceOrderAction(osData);
      if ("error" in res) {
        setServiceOrders(originalOrders);
        setSelectedServiceOrder(originalSelected);
        toast.error("Erro ao salvar O.S: " + res.error);
        return;
      }
      const finalized = res.serviceOrder!;
      setServiceOrders((prev) => prev.map((o) => (o.id === finalized.id ? finalized : o)));
      setSelectedServiceOrder(finalized);
      return finalized;
    } catch {
      setServiceOrders(originalOrders);
      setSelectedServiceOrder(originalSelected);
      toast.error("Erro ao salvar Ordem de Serviço.");
    }
  };

  const handleSaveService = async (
    serviceData: Omit<Service, "id" | "createdAt" | "active"> & { id?: string }
  ) => {
    if (!serviceData.id) {
      try {
        setIsLoading(true);
        const res = await saveServiceAction(serviceData);
        if ("error" in res) {
          toast.error("Erro ao salvar serviço: " + res.error);
          return;
        }
        setServices((prev) => [res.service!, ...prev]);
        toast.success("Serviço Salvo com sucesso!");
        router.push("/servicos");
      } catch {
        toast.error("Erro ao salvar o serviço.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const originalServices = [...services];
    const existing = services.find(s => s.id === serviceData.id);
    if (!existing) return;

    const optimisticService: Service = {
      ...existing,
      name: serviceData.name,
      price: serviceData.price,
      estimatedTime: serviceData.estimatedTime,
      ccRanges: serviceData.ccRanges || existing.ccRanges,
      categories: serviceData.categories || existing.categories,
      specificBikes: serviceData.specificBikes || existing.specificBikes,
    };

    setServices((prev) => prev.map((s) => (s.id === serviceData.id ? optimisticService : s)));
    toast.success("Serviço Salvo com sucesso!");
    router.push("/servicos");

    try {
      const res = await saveServiceAction(serviceData);
      if ("error" in res) {
        setServices(originalServices);
        toast.error("Erro ao salvar serviço: " + res.error);
        return;
      }
      setServices((prev) => prev.map((s) => (s.id === res.service!.id ? res.service! : s)));
    } catch {
      setServices(originalServices);
      toast.error("Erro ao salvar o serviço.");
    }
  };

  const handleDeleteService = async (id: string) => {
    const originalServices = [...services];
    setServices((prev) => prev.filter((s) => s.id !== id));
    toast.success("Serviço excluído com sucesso!");
    router.push("/servicos");

    try {
      const res = await deleteServiceAction(id);
      if ("error" in res) {
        setServices(originalServices);
        toast.error("Erro ao excluir serviço: " + res.error);
        return;
      }
    } catch {
      setServices(originalServices);
      toast.error("Erro ao excluir o serviço.");
    }
  };

  const handleSavePartCatalogItem = async (
    partData: Omit<PartCatalogItem, "id" | "createdAt" | "active"> & { id?: string }
  ) => {
    if (!partData.id) {
      try {
        setIsLoading(true);
        const res = await savePartCatalogAction(partData);
        if ("error" in res) {
          toast.error("Erro ao salvar peça: " + res.error);
          return;
        }
        setPartsCatalog((prev) => [res.part!, ...prev]);
        toast.success("Peça salva com sucesso!");
        router.push("/pecas");
      } catch {
        toast.error("Erro ao salvar a peça.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const originalParts = [...partsCatalog];
    const existing = partsCatalog.find(p => p.id === partData.id);
    if (!existing) return;

    const optimisticPart: PartCatalogItem = {
      ...existing,
      name: partData.name.toUpperCase(),
      brand: partData.brand.toUpperCase(),
      code: partData.code.toUpperCase(),
      model: partData.model.toUpperCase(),
      technicalSpecifications: partData.technicalSpecifications || existing.technicalSpecifications,
      measurements: partData.measurements || existing.measurements,
      price: partData.price,
      cost: partData.cost,
      specificBikes: partData.specificBikes || existing.specificBikes,
    };

    setPartsCatalog((prev) => prev.map((p) => (p.id === partData.id ? optimisticPart : p)));
    toast.success("Peça salva com sucesso!");
    router.push("/pecas");

    try {
      const res = await savePartCatalogAction(partData);
      if ("error" in res) {
        setPartsCatalog(originalParts);
        toast.error("Erro ao salvar peça: " + res.error);
        return;
      }
      setPartsCatalog((prev) => prev.map((p) => (p.id === res.part!.id ? res.part! : p)));
    } catch {
      setPartsCatalog(originalParts);
      toast.error("Erro ao salvar a peça.");
    }
  };

  const handleDeletePartCatalogItem = async (id: string) => {
    const originalParts = [...partsCatalog];
    setPartsCatalog((prev) => prev.filter((p) => p.id !== id));
    toast.success("Peça excluída com sucesso!");
    router.push("/pecas");

    try {
      const res = await deletePartCatalogAction(id);
      if ("error" in res) {
        setPartsCatalog(originalParts);
        toast.error("Erro ao excluir peça: " + res.error);
        return;
      }
    } catch {
      setPartsCatalog(originalParts);
      toast.error("Erro ao excluir a peça.");
    }
  };

  const handleSaveMaterial = async (
    materialData: Omit<Material, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ) => {
    try {
      const res = await saveMaterialAction(materialData);
      if ("error" in res) {
        toast.error("Erro ao salvar material: " + res.error);
        return;
      }
      
      const newOrUpdated = res.material!;
      setMaterials((prev) => {
        const exists = prev.some((m) => m.id === newOrUpdated.id);
        if (exists) {
          return prev.map((m) => (m.id === newOrUpdated.id ? newOrUpdated : m));
        } else {
          return [newOrUpdated, ...prev];
        }
      });
      
      if (materialData.status === 'pendente' || !materialData.id) {
        const notifRes = await getNotificationsAction();
        if (notifRes && !("error" in notifRes) && notifRes.notifications) {
          setNotifications(notifRes.notifications);
        }
      }
      
      toast.success("Material salvo com sucesso!");
    } catch {
      toast.error("Erro ao salvar o material.");
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      const res = await deleteMaterialAction(id);
      if ("error" in res) {
        toast.error("Erro ao excluir material: " + res.error);
        return;
      }
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      toast.success("Material excluído com sucesso!");
    } catch {
      toast.error("Erro ao excluir o material.");
    }
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    try {
      const res = await markNotificationAsReadAction(id);
      if ("error" in res) {
        console.error(res.error);
        return;
      }
      const updated = res.notification!;
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      const res = await markAllNotificationsAsReadAction();
      if ("error" in res) {
        console.error(res.error);
        return;
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("Notificações marcadas como lidas.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseServiceOrder = async (
    id: string,
    status: "encerrado",
    readyDate?: string,
    exitDate?: string,
    finalPayments?: PaymentItem[]
  ) => {
    const originalOrders = [...serviceOrders];
    const originalSelected = selectedServiceOrder;
    const originalOrder = serviceOrders.find((o) => o.id === id);
    if (!originalOrder) return;

    const optimisticOrder: ServiceOrderWithRelations = {
      ...originalOrder,
      status,
      type: "os",
      payments: finalPayments || originalOrder.payments,
      readyDate: readyDate ? readyDate : originalOrder.readyDate,
      exitDate: exitDate ? exitDate : originalOrder.exitDate,
    };

    setServiceOrders((prev) => prev.map((o) => (o.id === id ? optimisticOrder : o)));
    setSelectedServiceOrder(optimisticOrder);
    toast.success("Ordem de Serviço encerrada com sucesso!");

    try {
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
        fuelRefuelingValue: originalOrder.fuelRefuelingValue,
        fuelRefuelingLiters: originalOrder.fuelRefuelingLiters,
        fuelRefuelingReceiptPhoto: originalOrder.fuelRefuelingReceiptPhoto,
      };

      const res = await saveServiceOrderAction(payload);
      if ("error" in res) {
        setServiceOrders(originalOrders);
        setSelectedServiceOrder(originalSelected);
        toast.error("Erro ao encerrar O.S: " + res.error);
        return;
      }

      const updated = res.serviceOrder!;
      setServiceOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      setSelectedServiceOrder(updated);
    } catch {
      setServiceOrders(originalOrders);
      setSelectedServiceOrder(originalSelected);
      toast.error("Erro ao encerrar a Ordem de Serviço.");
    }
  };

  const handleUpdateServiceOrderState = (updated: ServiceOrderWithRelations) => {
    setSelectedServiceOrder(updated);
    setServiceOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };



  const handleLogout = async () => {
    try {
      const res = await logoutAction();
      if (res && !("error" in res)) {
        toast.success("Sessão encerrada!");
        if (typeof window !== "undefined") {
          localStorage.removeItem("maverick_user");
        }
        cachedUser = null;
        cachedClients = [];
        cachedBikes = [];
        cachedServiceOrders = [];
        cachedTechnicians = [];
        hasHydrated = false;
        lastFetchTime = 0;
        router.push("/login");
        router.refresh();
      } else {
        toast.error("Erro ao encerrar a sessão.");
      }
    } catch (err) {
      toast.error("Erro ao deslogar.");
    }
  };

  const handleViewChange = (view: string) => {
    let path = "/ordens-servico";
    if (view === "dashboard") path = "/dashboard";
    else if (view === "clients") path = "/clientes";
    else if (view === "bikes") path = "/motocicletas";
    else if (view === "service-orders") path = "/ordens-servico";
    else if (view === "services") path = "/servicos";
    else if (view === "parts") path = "/pecas";
    else if (view === "materials") path = "/materiais";
    else if (view === "billing") path = "/faturamento";
    else if (view === "team") path = "/team";

    router.push(path);
    setSelectedClient(null);
    setIsAddingClient(false);
    setIsEditingClient(false);
    setSelectedServiceOrder(null);
    setIsAddingServiceOrder(false);
    setSelectedService(null);
    setIsAddingService(false);
    setIsEditingService(false);
    setSelectedPartCatalogItem(null);
    setIsAddingPartCatalogItem(false);
    setIsEditingPartCatalogItem(false);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const viewLabels: Record<string, string> = {
    dashboard: "Painel Geral",
    clients: "Clientes",
    bikes: "Motocicletas",
    "service-orders": "Ordens de Serviço",
    services: "Serviços",
    parts: "Peças",
    materials: "Controle de Materiais",
    billing: "Faturamento",
    team: "Gerenciar Equipe",
  };

  return (
    <div className="flex h-screen bg-zinc-100 font-sans text-zinc-900 overflow-hidden print:h-auto print:bg-white print:overflow-visible">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed on mobile, static on desktop with width collapse */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:static md:z-auto transition-all duration-300 ease-in-out overflow-hidden print:hidden ${
          sidebarOpen
            ? "translate-x-0 w-64 md:w-56"
            : "-translate-x-full md:translate-x-0 w-64 md:w-0"
        }`}
      >
        <Sidebar
          activeView={activeView}
          setActiveView={handleViewChange}
          onClose={() => setSidebarOpen(false)}
          userRole={currentUser?.role}
          onBeforeNavigate={handleBeforeNavigate}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 print:h-auto print:overflow-visible print:bg-white">
        {/* Top Header */}
        <header className="h-[60px] border-b border-zinc-100 bg-white px-4 flex items-center justify-between shrink-0 print:hidden">
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
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={handleMarkNotificationAsRead}
              onMarkAllAsRead={handleMarkAllNotificationsAsRead}
              onNavigate={handleViewChange}
              isAdmin={currentUser?.role === "admin_geral" || currentUser?.role === "aux_admin"}
            />
            {currentUser?.role && (currentUser.role === "admin_geral" || currentUser.role === "aux_admin") && (
              <div className="hidden sm:block w-px h-5 bg-zinc-200" />
            )}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs tracking-tight shrink-0">
                {currentUser?.name
                  ? currentUser.name
                      .split(" ")
                      .slice(0, 2)
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                  : "U"}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-zinc-700 line-clamp-1">
                  {currentUser?.name || "Carregando..."}
                </span>
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                  {currentUser?.role === "admin_geral"
                    ? "Administrador Geral"
                    : currentUser?.role === "aux_admin"
                    ? "Auxiliar Adm"
                    : currentUser?.role === "mecanico_chefe"
                    ? "Mecânico Chefe"
                    : currentUser?.role === "mecanico"
                    ? "Mecânico"
                    : currentUser?.role === "ajudante"
                    ? "Ajudante Geral"
                    : "Usuário"}
                </span>
              </div>
            </div>
            <div className="hidden sm:block w-px h-5 bg-zinc-100" />
            <button
              onClick={handleLogout}
              className="text-zinc-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-zinc-50 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-100 py-3 px-4 sm:py-6 print:bg-white print:p-0 print:overflow-visible">
          <div className="max-w-full mx-auto w-full print:max-w-none print:w-full">
            {isLoading ? (
              <div className="flex h-[450px] items-center justify-center animate-fade-in">
                <div className="flex flex-col items-center gap-5 bg-white border border-zinc-200 shadow-xl rounded-2xl p-8 max-w-sm w-full text-center">
                  <div className="relative flex items-center justify-center h-16 w-16">
                    <span className="absolute inline-flex h-14 w-14 rounded-full bg-zinc-950/5 animate-ping opacity-75" />
                    <div className="h-14 w-14 rounded-full border-2 border-zinc-150 border-t-zinc-950 animate-spin absolute" />
                    <div className="h-10 w-10 rounded-full bg-zinc-950 flex items-center justify-center text-white shadow-md">
                      <FaMotorcycle className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-zinc-800 tracking-wider uppercase">Agus Moto Conceito</h3>
                    <p className="text-[11px] text-zinc-400 font-semibold">Sincronizando dados...</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {activeView === "dashboard" && (
                  <DashboardView
                    clients={clients}
                    bikes={bikes}
                    serviceOrders={serviceOrders}
                    setActiveView={handleViewChange}
                    setSelectedClient={(client) => {
                      if (client) {
                        router.push(`/clientes/${client.id}`);
                      }
                    }}
                    setSelectedServiceOrder={(order) => {
                      const padded = String(order.osNumber).padStart(4, "0");
                      router.push(`/ordens-servico/${padded}`);
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
                          onCancel={() => router.push(`/clientes/${selectedClient.id}`)}
                        />
                      ) : (
                        <ClientDetails
                          client={selectedClient}
                          bikes={bikes}
                          onBack={() => router.push("/clientes")}
                          onAddBike={handleAddBike}
                          onDeleteBike={handleDeleteBike}
                          onEditClient={() => router.push(`/clientes/${selectedClient.id}/editar`)}
                          onEditBike={handleEditBike}
                          onDeleteClient={() => handleDeleteClient(selectedClient.id)}
                        />
                      )
                    ) : isAddingClient ? (
                      <ClientForm
                        onSave={handleSaveClient}
                        onCancel={() => router.push("/clientes")}
                      />
                    ) : (
                      <ClientsView
                        clients={clients}
                        bikes={bikes}
                        onClientSelect={(c) => router.push(`/clientes/${c.id}`)}
                        onAddClientClick={() => router.push("/clientes/novo")}
                      />
                    )}
                  </>
                )}

                {activeView === "bikes" && (
                  <BikesView
                    bikes={bikes}
                    clients={clients}
                    onClientSelect={(c) => router.push(`/clientes/${c.id}`)}
                    setActiveView={handleViewChange}
                  />
                )}                {activeView === "service-orders" && (
                  <>
                    {selectedServiceOrder ? (
                      <ServiceOrderForm
                        ref={serviceOrderFormRef}
                        initialData={selectedServiceOrder}
                        clients={clients}
                        bikes={bikes}
                        technicians={technicians}
                        services={services}
                        partsCatalog={partsCatalog}
                        onSave={handleSaveServiceOrder}
                        onCancel={handleOSBack}
                        onCloseOS={handleCloseServiceOrder}
                        onUpdateOrder={handleUpdateServiceOrderState}
                        onDeleteOS={handleDeleteServiceOrder}
                        onPartCatalogRegistered={(newPart) => {
                          setPartsCatalog((prev) => [newPart, ...prev]);
                        }}
                        onServiceRegistered={(newService) => {
                          setServices((prev) => [newService, ...prev]);
                        }}
                      />
                    ) : isAddingServiceOrder ? (
                      <ServiceOrderForm
                        ref={serviceOrderFormRef}
                        clients={clients}
                        bikes={bikes}
                        technicians={technicians}
                        services={services}
                        partsCatalog={partsCatalog}
                        onSave={handleSaveServiceOrder}
                        onCancel={() => router.push("/ordens-servico")}
                        initialClientId={initialClientId}
                        onPartCatalogRegistered={(newPart) => {
                          setPartsCatalog((prev) => [newPart, ...prev]);
                        }}
                        onServiceRegistered={(newService) => {
                          setServices((prev) => [newService, ...prev]);
                        }}
                      />
                    ) : (
                      <ServiceOrdersView
                        serviceOrders={serviceOrders}
                        technicians={technicians}
                        onOSSelect={handleOSSelect}
                        onAddOSClick={() => router.push("/ordens-servico/nova")}
                      />
                    )}
                  </>
                )}

                {activeView === "services" && (
                  <>
                    {selectedService && isEditingService ? (
                      <ServiceForm
                        service={selectedService}
                        onSave={handleSaveService}
                        onCancel={() => router.push("/servicos")}
                      />
                    ) : isAddingService ? (
                      <ServiceForm
                        onSave={handleSaveService}
                        onCancel={() => router.push("/servicos")}
                      />
                    ) : (
                      <ServicesView
                        services={services}
                        onServiceSelect={(s) => router.push(`/servicos/${s.id}/editar`)}
                        onAddServiceClick={() => router.push("/servicos/novo")}
                        onEditServiceClick={(s) => router.push(`/servicos/${s.id}/editar`)}
                        onDeleteServiceClick={handleDeleteService}
                      />
                    )}
                  </>
                )}

                {activeView === "parts" && (
                  <>
                    {selectedPartCatalogItem && isEditingPartCatalogItem ? (
                      <PartCatalogForm
                        part={selectedPartCatalogItem}
                        onSave={handleSavePartCatalogItem}
                        onCancel={() => router.push("/pecas")}
                      />
                    ) : isAddingPartCatalogItem ? (
                      <PartCatalogForm
                        onSave={handleSavePartCatalogItem}
                        onCancel={() => router.push("/pecas")}
                      />
                    ) : (
                      <PartsCatalogView
                        parts={partsCatalog}
                        onPartSelect={(p) => router.push(`/pecas/${p.id}/editar`)}
                        onAddPartClick={() => router.push("/pecas/novo")}
                        onEditPartClick={(p) => router.push(`/pecas/${p.id}/editar`)}
                        onDeletePartClick={handleDeletePartCatalogItem}
                      />
                    )}
                  </>
                )}

                {activeView === "billing" && (
                  <BillingView
                    serviceOrders={serviceOrders}
                    clients={clients}
                    technicians={technicians}
                    onOSSelect={handleOSSelect}
                  />
                )}

                {activeView === "materials" && (
                  <MaterialsView
                    materials={materials}
                    currentUser={currentUser}
                    onSaveMaterial={handleSaveMaterial}
                    onDeleteMaterial={handleDeleteMaterial}
                  />
                )}

                {activeView === "team" && currentUser?.role === "admin_geral" && (
                  <UsersView currentUserId={currentUser?.id} />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
