"use server";

import { db } from "@/db/db";
import { clients, motorbikes, serviceOrders, technicians, profiles, services, partsCatalog, materials, notifications } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { Client, Motorbike, ServiceOrder, Technician, Service, PartCatalogItem, Material, SystemNotification } from "@/types";
import { createClient, createAdminClient } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

const ROLE_DEFAULT_PERMISSIONS: Record<string, any> = {
  admin_geral: {
    dashboard: { view: true, edit: true, delete: true },
    clients: { view: true, edit: true, delete: true },
    bikes: { view: true, edit: true, delete: true },
    serviceOrders: { view: true, edit: true, delete: true },
    services: { view: true, edit: true, delete: true },
    parts: { view: true, edit: true, delete: true },
    materials: { view: true, edit: true, delete: true },
    billing: { view: true, edit: true, delete: true },
    financial: { view: true, edit: true, delete: true },
  },
  aux_admin: {
    dashboard: { view: true, edit: true, delete: true },
    clients: { view: true, edit: true, delete: true },
    bikes: { view: true, edit: true, delete: true },
    serviceOrders: { view: true, edit: true, delete: true },
    services: { view: true, edit: true, delete: true },
    parts: { view: true, edit: true, delete: true },
    materials: { view: true, edit: true, delete: true },
    billing: { view: true, edit: true, delete: true },
    financial: { view: true, edit: true, delete: true },
  },
  mecanico_chefe: {
    dashboard: { view: true, edit: true, delete: true },
    clients: { view: true, edit: true, delete: true },
    bikes: { view: true, edit: true, delete: true },
    serviceOrders: { view: true, edit: true, delete: true },
    services: { view: true, edit: true, delete: true },
    parts: { view: true, edit: true, delete: true },
    materials: { view: true, edit: true, delete: true },
    billing: { view: true, edit: false, delete: false },
    financial: { view: true, edit: true, delete: true },
  },
  mecanico: {
    dashboard: { view: true, edit: false, delete: false },
    clients: { view: true, edit: false, delete: false },
    bikes: { view: true, edit: false, delete: false },
    serviceOrders: { view: true, edit: true, delete: false },
    services: { view: true, edit: false, delete: false },
    parts: { view: true, edit: false, delete: false },
    materials: { view: true, edit: false, delete: false },
    billing: { view: false, edit: false, delete: false },
    financial: { view: false, edit: false, delete: false },
  },
  ajudante: {
    dashboard: { view: true, edit: false, delete: false },
    clients: { view: true, edit: false, delete: false },
    bikes: { view: true, edit: false, delete: false },
    serviceOrders: { view: true, edit: false, delete: false },
    services: { view: true, edit: false, delete: false },
    parts: { view: true, edit: false, delete: false },
    materials: { view: true, edit: true, delete: false },
    billing: { view: false, edit: false, delete: false },
    financial: { view: false, edit: false, delete: false },
  },
};

function getMergedPermissions(profile: any) {
  const defaultPerms = ROLE_DEFAULT_PERMISSIONS[profile.role] || ROLE_DEFAULT_PERMISSIONS.ajudante;
  const permissions = {
    ...defaultPerms,
    ...(profile.permissions || {}),
  };
  if (profile.permissions && !permissions.financial) {
    permissions.financial = defaultPerms.financial;
  }
  return permissions;
}

async function checkPermission(category: string, action: 'view' | 'edit' | 'delete'): Promise<boolean> {
  const res = await getCurrentUserAction();
  if ("error" in res || !res.user) return false;
  
  // admin_geral has full access
  if (res.user.role === 'admin_geral') return true;
  
  const permissions = res.user.permissions;
  if (!permissions || !permissions[category]) return false;
  return !!permissions[category][action];
}

// Helper to convert DB format to frontend type format
function formatDbClient(dbClient: any): Client {
  return {
    id: dbClient.id,
    name: dbClient.name,
    nickname: dbClient.nickname || undefined,
    cpf: dbClient.cpf,
    birthDate: dbClient.birthDate,
    phone: dbClient.phone,
    email: dbClient.email || "",
    gender: dbClient.gender,
    address: dbClient.address as any,
    createdAt: dbClient.createdAt.toISOString(),
  };
}


function formatDbBike(dbBike: any): Motorbike {
  return {
    id: dbBike.id,
    clientId: dbBike.clientId,
    model: dbBike.model,
    year: dbBike.year,
    color: dbBike.color,
    brand: dbBike.brand,
    plate: dbBike.plate,
    vin: dbBike.vin,
    category: dbBike.category || undefined,
    createdAt: dbBike.createdAt.toISOString(),
  };
}

function formatDbServiceOrder(dbOrder: any): ServiceOrder {
  return {
    id: dbOrder.id,
    osNumber: dbOrder.osNumber,
    clientId: dbOrder.clientId,
    motorbikeId: dbOrder.motorbikeId,
    status: dbOrder.status as any,
    type: dbOrder.type as any,
    odometer: dbOrder.odometer,
    fuelLevel: dbOrder.fuelLevel as any,
    tiresCondition: dbOrder.tiresCondition as any,
    brakePadsCondition: dbOrder.brakePadsCondition as any || undefined,
    accessories: dbOrder.accessories as any,
    customAccessories: dbOrder.customAccessories as any || [],
    damagePoints: dbOrder.damagePoints as any || [],
    inspectionPhotos: dbOrder.inspectionPhotos as any || [],
    electricalProblems: dbOrder.electricalProblems || undefined,
    maintenanceProblems: dbOrder.maintenanceProblems || undefined,
    customerComplaints: dbOrder.customerComplaints,
    technicalReport: dbOrder.technicalReport || undefined,
    internalNotes: dbOrder.internalNotes || undefined,
    labor: dbOrder.labor as any || [],
    parts: dbOrder.parts as any || [],
    discounts: Number(dbOrder.discounts),
    otherCharges: Number(dbOrder.otherCharges),
    towingFee: Number(dbOrder.towingFee),
    totalValue: Number(dbOrder.totalValue),
    payments: dbOrder.payments as any || [],
    entryDate: dbOrder.entryDate.toISOString(),
    readyDate: dbOrder.readyDate ? dbOrder.readyDate.toISOString() : undefined,
    exitDate: dbOrder.exitDate ? dbOrder.exitDate.toISOString() : undefined,
    createdAt: dbOrder.createdAt.toISOString(),
    completedStages: dbOrder.completedStages as any || [],
    laborGeneralTechnician: dbOrder.laborGeneralTechnician || undefined,
    partsGeneralTechnician: dbOrder.partsGeneralTechnician || undefined,
    fuelRefuelingValue: Number(dbOrder.fuelRefuelingValue ?? 0),
    fuelRefuelingLiters: Number(dbOrder.fuelRefuelingLiters ?? 0),
    fuelRefuelingReceiptPhoto: dbOrder.fuelRefuelingReceiptPhoto || undefined,
  };
}

function formatActionError(error: any): string {
  if (!error) return "Erro desconhecido no banco de dados.";
  const message = error.message || String(error);
  const code = error.code || "N/A";
  const detail = error.detail || "N/A";
  const hint = error.hint || "N/A";
  let cause = "N/A";
  if (error.cause) {
    cause = error.cause.message || String(error.cause);
  }
  return `${message} | Código: ${code} | Causa: ${cause} | Detalhe: ${detail} | Dica: ${hint}`;
}

export async function getClientsAndBikes() {
  try {
    const dbClientsList = await db.select().from(clients).orderBy(desc(clients.createdAt));
    const dbBikesList = await db.select().from(motorbikes).orderBy(desc(motorbikes.createdAt));

    return {
      clients: dbClientsList.map(formatDbClient),
      bikes: dbBikesList.map(formatDbBike),
    };
  } catch (error: any) {
    console.error("Error fetching clients and bikes:", error);
    let passwordLength = 0;
    let containsBackslash = false;
    let containsRawDollar = false;
    
    const dbUrl = process.env.DATABASE_URL || "";
    if (dbUrl) {
      const parts = dbUrl.split('@')[0].split(':');
      const pass = parts[parts.length - 1] || "";
      passwordLength = pass.length;
      containsBackslash = pass.includes('\\');
      containsRawDollar = pass.includes('$');
    }
    return {
      error: `${formatActionError(error)} | PassLen: ${passwordLength} | HasSlash: ${containsBackslash} | HasDollar: ${containsRawDollar}`
    };
  }
}

export async function saveClientAction(
  clientData: Omit<Client, "id" | "createdAt"> & { id?: string },
  initialBikeData: Omit<Motorbike, "id" | "clientId" | "createdAt"> | null
) {
  try {
    if (!(await checkPermission("clients", "edit"))) {
      return { error: "Você não tem permissão para cadastrar ou editar clientes." };
    }
    let savedClient;
    if (clientData.id) {
      const [updatedClient] = await db.update(clients).set({
        name: clientData.name,
        nickname: clientData.nickname || null,
        cpf: clientData.cpf,
        birthDate: clientData.birthDate,
        phone: clientData.phone,
        email: clientData.email || null,
        gender: clientData.gender,
        address: clientData.address,
      }).where(eq(clients.id, clientData.id)).returning();
      savedClient = updatedClient;
    } else {
      const [newClient] = await db.insert(clients).values({
        name: clientData.name,
        nickname: clientData.nickname || null,
        cpf: clientData.cpf,
        birthDate: clientData.birthDate,
        phone: clientData.phone,
        email: clientData.email || null,
        gender: clientData.gender,
        address: clientData.address,
      }).returning();
      savedClient = newClient;
    }

    let newBike = null;
    if (initialBikeData && !clientData.id) {
      const [insertedBike] = await db.insert(motorbikes).values({
        clientId: savedClient.id,
        model: initialBikeData.model,
        year: initialBikeData.year,
        color: initialBikeData.color,
        brand: initialBikeData.brand,
        plate: initialBikeData.plate,
        vin: initialBikeData.vin,
        category: initialBikeData.category,
      }).returning();
      newBike = formatDbBike(insertedBike);
    }

    return {
      client: formatDbClient(savedClient),
      bike: newBike,
    };
  } catch (error: any) {
    console.error("Error saving client:", error);
    return {
      error: formatActionError(error)
    };
  }
}

export async function addBikeAction(bikeData: Omit<Motorbike, "id" | "createdAt">) {
  try {
    if (!(await checkPermission("bikes", "edit"))) {
      return { error: "Você não tem permissão para adicionar ou editar motocicletas." };
    }
    const [newBike] = await db.insert(motorbikes).values({
      clientId: bikeData.clientId,
      model: bikeData.model,
      year: bikeData.year,
      color: bikeData.color,
      brand: bikeData.brand,
      plate: bikeData.plate,
      vin: bikeData.vin,
      category: bikeData.category,
    }).returning();

    return { bike: formatDbBike(newBike) };
  } catch (error: any) {
    console.error("Error adding bike:", error);
    return {
      error: formatActionError(error)
    };
  }
}

export async function deleteBikeAction(bikeId: string) {
  try {
    if (!(await checkPermission("bikes", "delete"))) {
      return { error: "Você não tem permissão para excluir motocicletas." };
    }
    await db.delete(motorbikes).where(eq(motorbikes.id, bikeId));
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting bike:", error);
    return {
      error: formatActionError(error)
    };
  }
}

export async function deleteClientAction(clientId: string) {
  try {
    if (!(await checkPermission("clients", "delete"))) {
      return { error: "Você não tem permissão para excluir clientes." };
    }
    await db.delete(clients).where(eq(clients.id, clientId));
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting client:", error);
    const errMsg = error.message || "";
    const causeMsg = error.cause ? (error.cause.message || String(error.cause)) : "";
    const strError = String(error);
    const combinedError = `${errMsg} ${causeMsg} ${strError}`.toLowerCase();
    
    if (
      error.code === "23503" ||
      combinedError.includes("violates foreign key constraint") ||
      combinedError.includes("foreign key constraint") ||
      combinedError.includes("violates foreign key")
    ) {
      return {
        error: "Não é possível excluir este cliente pois ele possui Ordens de Serviço vinculadas."
      };
    }
    return {
      error: formatActionError(error)
    };
  }
}


export async function updateBikeAction(
  bikeId: string,
  bikeData: Omit<Motorbike, "id" | "clientId" | "createdAt">
) {
  try {
    if (!(await checkPermission("bikes", "edit"))) {
      return { error: "Você não tem permissão para adicionar ou editar motocicletas." };
    }
    const [updatedBike] = await db
      .update(motorbikes)
      .set({
        model: bikeData.model,
        year: bikeData.year,
        color: bikeData.color,
        brand: bikeData.brand,
        plate: bikeData.plate,
        vin: bikeData.vin,
        category: bikeData.category,
      })
      .where(eq(motorbikes.id, bikeId))
      .returning();

    return { bike: formatDbBike(updatedBike) };
  } catch (error: any) {
    console.error("Error updating bike:", error);
    return {
      error: formatActionError(error)
    };
  }
}

export async function getServiceOrders() {
  try {
    const orders = await db
      .select({
        serviceOrder: serviceOrders,
        client: clients,
        motorbike: motorbikes,
      })
      .from(serviceOrders)
      .innerJoin(clients, eq(serviceOrders.clientId, clients.id))
      .innerJoin(motorbikes, eq(serviceOrders.motorbikeId, motorbikes.id))
      .orderBy(desc(serviceOrders.createdAt));

    return {
      serviceOrders: orders.map((o) => ({
        ...formatDbServiceOrder(o.serviceOrder),
        client: formatDbClient(o.client),
        motorbike: formatDbBike(o.motorbike),
      })),
    };
  } catch (error: any) {
    console.error("Error fetching service orders:", error);
    return { error: formatActionError(error) };
  }
}

export async function saveServiceOrderAction(
  osData: Omit<ServiceOrder, "id" | "osNumber" | "createdAt" | "entryDate"> & { id?: string }
) {
  try {
    if (!(await checkPermission("serviceOrders", "edit"))) {
      return { error: "Você não tem permissão para criar ou editar ordens de serviço." };
    }
    const status = osData.status || "aguardando_aprovacao";
    const type = (status === "aprovado" || status === "encerrado") ? "os" : "orcamento";

    const formattedData = {
      clientId: osData.clientId,
      motorbikeId: osData.motorbikeId,
      status,
      type,
      odometer: osData.odometer || "",
      fuelLevel: osData.fuelLevel || "1/2",
      tiresCondition: osData.tiresCondition || { front: "bom" as const, rear: "bom" as const },
      brakePadsCondition: osData.brakePadsCondition || { front: "bom" as const, rear: "bom" as const },
      accessories: osData.accessories || [],
      customAccessories: osData.customAccessories || [],
      damagePoints: osData.damagePoints || [],
      inspectionPhotos: osData.inspectionPhotos || [],
      electricalProblems: osData.electricalProblems || null,
      maintenanceProblems: osData.maintenanceProblems || null,
      customerComplaints: osData.customerComplaints || "Em elaboração...",
      technicalReport: osData.technicalReport || null,
      internalNotes: osData.internalNotes || null,
      labor: osData.labor || [],
      parts: osData.parts || [],
      discounts: (osData.discounts ?? 0).toString(),
      otherCharges: (osData.otherCharges ?? 0).toString(),
      towingFee: (osData.towingFee ?? 0).toString(),
      totalValue: (osData.totalValue ?? 0).toString(),
      payments: osData.payments || [],
      completedStages: (osData as any).completedStages || [],
      readyDate: osData.readyDate ? new Date(osData.readyDate) : null,
      exitDate: osData.exitDate ? new Date(osData.exitDate) : null,
      laborGeneralTechnician: osData.laborGeneralTechnician || null,
      partsGeneralTechnician: osData.partsGeneralTechnician || null,
      fuelRefuelingValue: (osData.fuelRefuelingValue ?? 0).toString(),
      fuelRefuelingLiters: (osData.fuelRefuelingLiters ?? 0).toString(),
      fuelRefuelingReceiptPhoto: osData.fuelRefuelingReceiptPhoto || null,
    };

    let result;
    if (osData.id) {
      const [updated] = await db
        .update(serviceOrders)
        .set(formattedData)
        .where(eq(serviceOrders.id, osData.id))
        .returning();
      result = updated;
    } else {
      const [inserted] = await db
        .insert(serviceOrders)
        .values(formattedData)
        .returning();
      result = inserted;
    }

    const [fetchedWithRelations] = await db
      .select({
        serviceOrder: serviceOrders,
        client: clients,
        motorbike: motorbikes,
      })
      .from(serviceOrders)
      .innerJoin(clients, eq(serviceOrders.clientId, clients.id))
      .innerJoin(motorbikes, eq(serviceOrders.motorbikeId, motorbikes.id))
      .where(eq(serviceOrders.id, result.id));

    return {
      serviceOrder: {
        ...formatDbServiceOrder(fetchedWithRelations.serviceOrder),
        client: formatDbClient(fetchedWithRelations.client),
        motorbike: formatDbBike(fetchedWithRelations.motorbike),
      },
    };
  } catch (error: any) {
    console.error("Error saving service order:", error);
    return { error: formatActionError(error) };
  }
}

export async function deleteServiceOrderAction(id: string) {
  try {
    if (!(await checkPermission("serviceOrders", "delete"))) {
      return { error: "Você não tem permissão para excluir ordens de serviço." };
    }
    await db.delete(serviceOrders).where(eq(serviceOrders.id, id));
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting service order:", error);
    return { error: formatActionError(error) };
  }
}

export async function updateServiceOrderStatusAction(
  id: string,
  status: string,
  readyDate?: string,
  exitDate?: string
) {
  try {
    if (!(await checkPermission("serviceOrders", "edit"))) {
      return { error: "Você não tem permissão para alterar o status da ordem de serviço." };
    }
    const type = (status === "aprovado" || status === "encerrado") ? "os" : "orcamento";
    const updateData: any = { status, type };
    if (readyDate !== undefined) {
      updateData.readyDate = readyDate ? new Date(readyDate) : null;
    }
    if (exitDate !== undefined) {
      updateData.exitDate = exitDate ? new Date(exitDate) : null;
    }

    const [updated] = await db
      .update(serviceOrders)
      .set(updateData)
      .where(eq(serviceOrders.id, id))
      .returning();

    const [fetchedWithRelations] = await db
      .select({
        serviceOrder: serviceOrders,
        client: clients,
        motorbike: motorbikes,
      })
      .from(serviceOrders)
      .innerJoin(clients, eq(serviceOrders.clientId, clients.id))
      .innerJoin(motorbikes, eq(serviceOrders.motorbikeId, motorbikes.id))
      .where(eq(serviceOrders.id, updated.id));

    return {
      serviceOrder: {
        ...formatDbServiceOrder(fetchedWithRelations.serviceOrder),
        client: formatDbClient(fetchedWithRelations.client),
        motorbike: formatDbBike(fetchedWithRelations.motorbike),
      },
    };
  } catch (error: any) {
    console.error("Error updating service order status:", error);
    return { error: formatActionError(error) };
  }
}

export async function toggleLaborTimerAction(orderId: string, laborItemId: string) {
  try {
    const [fetched] = await db
      .select()
      .from(serviceOrders)
      .where(eq(serviceOrders.id, orderId));

    if (!fetched) {
      return { error: "Ordem de serviço não encontrada." };
    }

    const laborList = (fetched.labor as any[]) || [];
    const updatedLabor = laborList.map((item) => {
      if (item.id === laborItemId) {
        const nowStr = new Date().toISOString();
        const currentStartedAt = item.timerStartedAt;
        let tracked = item.trackedSeconds || 0;
        let startedAt: string | null = null;

        if (currentStartedAt) {
          const elapsed = Math.round((new Date(nowStr).getTime() - new Date(currentStartedAt).getTime()) / 1000);
          tracked += Math.max(0, elapsed);
        } else {
          startedAt = nowStr;
        }

        return {
          ...item,
          trackedSeconds: tracked,
          timerStartedAt: startedAt,
        };
      }
      return item;
    });

    const [updated] = await db
      .update(serviceOrders)
      .set({ labor: updatedLabor })
      .where(eq(serviceOrders.id, orderId))
      .returning();

    const [fetchedWithRelations] = await db
      .select({
        serviceOrder: serviceOrders,
        client: clients,
        motorbike: motorbikes,
      })
      .from(serviceOrders)
      .innerJoin(clients, eq(serviceOrders.clientId, clients.id))
      .innerJoin(motorbikes, eq(serviceOrders.motorbikeId, motorbikes.id))
      .where(eq(serviceOrders.id, updated.id));

    return {
      serviceOrder: {
        ...formatDbServiceOrder(fetchedWithRelations.serviceOrder),
        client: formatDbClient(fetchedWithRelations.client),
        motorbike: formatDbBike(fetchedWithRelations.motorbike),
      },
    };
  } catch (error: any) {
    console.error("Error toggling labor timer:", error);
    return { error: formatActionError(error) };
  }
}

export async function updateLaborTimerAction(
  orderId: string,
  laborItemId: string,
  trackedSeconds: number,
  timerStartedAt: string | null = null
) {
  try {
    const [fetched] = await db
      .select()
      .from(serviceOrders)
      .where(eq(serviceOrders.id, orderId));

    if (!fetched) {
      return { error: "Ordem de serviço não encontrada." };
    }

    const laborList = (fetched.labor as any[]) || [];
    const updatedLabor = laborList.map((item) => {
      if (item.id === laborItemId) {
        return {
          ...item,
          trackedSeconds,
          timerStartedAt,
        };
      }
      return item;
    });

    const [updated] = await db
      .update(serviceOrders)
      .set({ labor: updatedLabor })
      .where(eq(serviceOrders.id, orderId))
      .returning();

    const [fetchedWithRelations] = await db
      .select({
        serviceOrder: serviceOrders,
        client: clients,
        motorbike: motorbikes,
      })
      .from(serviceOrders)
      .innerJoin(clients, eq(serviceOrders.clientId, clients.id))
      .innerJoin(motorbikes, eq(serviceOrders.motorbikeId, motorbikes.id))
      .where(eq(serviceOrders.id, updated.id));

    return {
      serviceOrder: {
        ...formatDbServiceOrder(fetchedWithRelations.serviceOrder),
        client: formatDbClient(fetchedWithRelations.client),
        motorbike: formatDbBike(fetchedWithRelations.motorbike),
      },
    };
  } catch (error: any) {
    console.error("Error updating labor timer:", error);
    return { error: formatActionError(error) };
  }
}


export async function loginAction(formData: any) {
  try {
    const email = formData.email;
    const password = formData.password;
    if (!email || !password) {
      return { error: "Email e senha são obrigatórios." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Login error:", error);
    return { error: formatActionError(error) };
  }
}

export async function logoutAction() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return { success: true };
  } catch (error: any) {
    console.error("Logout error:", error);
    return { error: formatActionError(error) };
  }
}

export async function getCurrentUserAction() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { error: "Não autenticado." };

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id));

    if (!profile) return { error: "Perfil não encontrado no banco de dados." };

    const permissions = getMergedPermissions(profile);

    return { user: { ...profile, permissions } };
  } catch (error: any) {
    console.error("Error fetching current user:", error);
    return { error: formatActionError(error) };
  }
}

export async function getTeamMembersAction() {
  try {
    const list = await db.select().from(profiles).orderBy(desc(profiles.createdAt));
    return { members: list };
  } catch (error: any) {
    console.error("Error fetching team members:", error);
    return { error: formatActionError(error) };
  }
}

export async function createUserAction(userData: {
  name: string;
  email: string;
  role: 'admin_geral' | 'aux_admin' | 'mecanico_chefe' | 'mecanico' | 'ajudante';
  permissions?: Record<string, { view: boolean; edit: boolean; delete: boolean }>;
  password?: string;
}) {
  try {
    // 1. Check if the current user is an admin_geral or aux_admin
    const currentUserRes = await getCurrentUserAction();
    if ("error" in currentUserRes || (currentUserRes.user?.role !== "admin_geral" && currentUserRes.user?.role !== "aux_admin")) {
      return { error: "Apenas Administrador Geral ou Auxiliar Administrativo pode cadastrar membros da equipe." };
    }

    // 2. Generate a password if not provided
    const password = userData.password || Math.random().toString(36).slice(-8) + "Aa1!";

    // 3. Create the user in Supabase Auth via Admin client
    const supabaseAdmin = createAdminClient();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: password,
      email_confirm: true,
      user_metadata: { name: userData.name }
    });

    if (authError || !authData.user) {
      return { error: authError?.message || "Erro ao criar usuário no Supabase Auth." };
    }

    // 4. Create the profile in Drizzle
    const [newProfile] = await db
      .insert(profiles)
      .values({
        id: authData.user.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        permissions: userData.permissions || ROLE_DEFAULT_PERMISSIONS[userData.role] || ROLE_DEFAULT_PERMISSIONS.ajudante,
      })
      .returning();

    revalidatePath("/");
    return { 
      member: newProfile,
      tempPassword: userData.password ? undefined : password 
    };
  } catch (error: any) {
    console.error("Error creating team member:", error);
    return { error: formatActionError(error) };
  }
}

export async function deleteUserAction(userId: string) {
  try {
    // 1. Check if the current user is an admin_geral or aux_admin
    const currentUserRes = await getCurrentUserAction();
    if ("error" in currentUserRes || (currentUserRes.user?.role !== "admin_geral" && currentUserRes.user?.role !== "aux_admin")) {
      return { error: "Apenas Administrador Geral ou Auxiliar Administrativo pode remover membros da equipe." };
    }

    // 2. Prevent self-deletion
    if (currentUserRes.user.id === userId) {
      return { error: "Você não pode excluir sua própria conta administrativa." };
    }

    // 3. Delete from Supabase Auth
    const supabaseAdmin = createAdminClient();
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      console.warn(`Auth deletion failed for ${userId}:`, authError.message);
    }

    // 4. Delete the profile from Drizzle
    await db.delete(profiles).where(eq(profiles.id, userId));

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting team member:", error);
    return { error: formatActionError(error) };
  }
}

export async function seedTestAccountsAction() {

  try {
    console.log("Seeding test accounts...");
    const supabaseAdmin = createAdminClient();

    const roles: Array<{
      email: string;
      name: string;
      role: 'admin_geral' | 'aux_admin' | 'mecanico_chefe' | 'mecanico' | 'ajudante';
    }> = [
      { email: "admin@maverick.com", name: "Administrador Geral", role: "admin_geral" },
      { email: "auxiliar@maverick.com", name: "Auxiliar Administrativo", role: "aux_admin" },
      { email: "mecanicochefe@maverick.com", name: "Mecânico Chefe", role: "mecanico_chefe" },
      { email: "mecanico@maverick.com", name: "Mecânico", role: "mecanico" },
      { email: "ajudante@maverick.com", name: "Ajudante Geral", role: "ajudante" },
    ];

    const results = [];

    for (const r of roles) {
      // Check if user already exists in profiles
      const [existing] = await db.select().from(profiles).where(eq(profiles.email, r.email));
      if (existing) {
        results.push({ email: r.email, status: "already_exists", id: existing.id });
        continue;
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: r.email,
        password: "senha123maverick", // password for testing
        email_confirm: true,
        user_metadata: { name: r.name }
      });

      if (authError || !authData.user) {
        console.warn(`Auth creation failed for ${r.email}:`, authError?.message);
        if (authError?.message?.includes("already exists") || authError?.message?.includes("email_exists")) {
          // Fetch user to get ID and create profile
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const found = listData.users.find(u => u.email === r.email);
          if (found) {
            const [newProfile] = await db.insert(profiles).values({
              id: found.id,
              name: r.name,
              email: r.email,
              role: r.role,
              permissions: ROLE_DEFAULT_PERMISSIONS[r.role]
            }).returning();
            results.push({ email: r.email, status: "created_profile_only", id: newProfile.id });
            continue;
          }
        }
        results.push({ email: r.email, status: "error", error: authError?.message });
        continue;
      }

      // Insert profile
      const [newProfile] = await db.insert(profiles).values({
        id: authData.user.id,
        name: r.name,
        email: r.email,
        role: r.role,
        permissions: ROLE_DEFAULT_PERMISSIONS[r.role]
      }).returning();

      results.push({ email: r.email, status: "created_both", id: newProfile.id });
    }

    revalidatePath("/");
    return { success: true, results };
  } catch (error: any) {
    console.error("Error seeding test accounts:", error);
    return { error: formatActionError(error) };
  }
}

function formatDbService(dbService: any): Service {
  return {
    id: dbService.id,
    name: dbService.name,
    price: Number(dbService.price),
    estimatedTime: dbService.estimatedTime || "",
    ccRanges: (dbService.ccRanges as string[]) || [],
    categories: (dbService.categories as string[]) || [],
    specificBikes: (dbService.specificBikes as any[]) || [],
    active: dbService.active,
    createdAt: dbService.createdAt.toISOString(),
  };
}

export async function getServices() {
  try {
    const list = await db.select().from(services).orderBy(asc(services.name));
    return {
      services: list.map(formatDbService)
    };
  } catch (error: any) {
    console.error("Error fetching services:", error);
    return { error: formatActionError(error) };
  }
}

export async function saveServiceAction(
  serviceData: Omit<Service, "id" | "createdAt" | "active"> & { id?: string }
) {
  try {
    if (!(await checkPermission("services", "edit"))) {
      return { error: "Você não tem permissão para criar ou editar serviços." };
    }
    const formattedData = {
      name: serviceData.name,
      price: serviceData.price.toString(),
      estimatedTime: serviceData.estimatedTime,
      ccRanges: serviceData.ccRanges || [],
      categories: serviceData.categories || [],
      specificBikes: serviceData.specificBikes || [],
    };

    let saved;
    if (serviceData.id) {
      const [updated] = await db
        .update(services)
        .set(formattedData)
        .where(eq(services.id, serviceData.id))
        .returning();
      saved = updated;
    } else {
      const [inserted] = await db
        .insert(services)
        .values({
          ...formattedData,
          active: true,
        })
        .returning();
      saved = inserted;
    }

    revalidatePath("/");
    return { service: formatDbService(saved) };
  } catch (error: any) {
    console.error("Error saving service:", error);
    return { error: formatActionError(error) };
  }
}

export async function deleteServiceAction(id: string) {
  try {
    if (!(await checkPermission("services", "delete"))) {
      return { error: "Você não tem permissão para excluir serviços." };
    }
    await db.delete(services).where(eq(services.id, id));
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting service:", error);
    return { error: formatActionError(error) };
  }
}

export async function toggleServiceActiveAction(id: string, active: boolean) {
  try {
    const [updated] = await db
      .update(services)
      .set({ active })
      .where(eq(services.id, id))
      .returning();
    revalidatePath("/");
    return { service: formatDbService(updated) };
  } catch (error: any) {
    console.error("Error toggling service active:", error);
    return { error: formatActionError(error) };
  }
}

function formatDbPart(dbPart: any): PartCatalogItem {
  return {
    id: dbPart.id,
    name: dbPart.name,
    brand: dbPart.brand,
    code: dbPart.code,
    model: dbPart.model,
    technicalSpecifications: dbPart.technicalSpecifications || undefined,
    measurements: dbPart.measurements || undefined,
    price: Number(dbPart.price),
    cost: Number(dbPart.cost),
    avgMarketValue: Number(dbPart.avgMarketValue),
    specificBikes: (dbPart.specificBikes as any[]) || [],
    active: dbPart.active,
    createdAt: dbPart.createdAt.toISOString(),
    isKit: dbPart.isKit,
    kitParts: (dbPart.kitParts as any[]) || [],
  };
}

export async function getPartsCatalogAction() {
  try {
    const list = await db.select().from(partsCatalog).orderBy(asc(partsCatalog.name));
    return {
      partsCatalog: list.map(formatDbPart)
    };
  } catch (error: any) {
    console.error("Error fetching parts catalog:", error);
    return { error: formatActionError(error) };
  }
}

export async function savePartCatalogAction(
  partData: Omit<PartCatalogItem, "id" | "createdAt" | "active"> & { id?: string }
) {
  try {
    if (!(await checkPermission("parts", "edit"))) {
      return { error: "Você não tem permissão para criar ou editar peças." };
    }
    const formattedData = {
      name: partData.name.toUpperCase(),
      brand: partData.brand.toUpperCase(),
      code: partData.code.toUpperCase(),
      model: partData.model.toUpperCase(),
      technicalSpecifications: partData.technicalSpecifications || null,
      measurements: partData.measurements || null,
      price: partData.price.toString(),
      cost: partData.cost.toString(),
      avgMarketValue: partData.avgMarketValue.toString(),
      specificBikes: partData.specificBikes || [],
      isKit: partData.isKit || false,
      kitParts: partData.kitParts || [],
    };

    let saved;
    if (partData.id) {
      const [updated] = await db
        .update(partsCatalog)
        .set(formattedData)
        .where(eq(partsCatalog.id, partData.id))
        .returning();
      saved = updated;
    } else {
      const [inserted] = await db
        .insert(partsCatalog)
        .values({
          ...formattedData,
          active: true,
        })
        .returning();
      saved = inserted;
    }

    revalidatePath("/");
    return { part: formatDbPart(saved) };
  } catch (error: any) {
    console.error("Error saving part to catalog:", error);
    return { error: formatActionError(error) };
  }
}

export async function deletePartCatalogAction(id: string) {
  try {
    if (!(await checkPermission("parts", "delete"))) {
      return { error: "Você não tem permissão para excluir peças." };
    }
    await db.delete(partsCatalog).where(eq(partsCatalog.id, id));
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting part from catalog:", error);
    return { error: formatActionError(error) };
  }
}

export async function togglePartActiveAction(id: string, active: boolean) {
  try {
    const [updated] = await db
      .update(partsCatalog)
      .set({ active })
      .where(eq(partsCatalog.id, id))
      .returning();
    revalidatePath("/");
    return { part: formatDbPart(updated) };
  } catch (error: any) {
    console.error("Error toggling part active:", error);
    return { error: formatActionError(error) };
  }
}

export async function getInitialAppDataAction() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    let currentUserProfile = null;
    if (user && !authError) {
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, user.id));
      if (profile) {
        const permissions = getMergedPermissions(profile);
        currentUserProfile = { ...profile, permissions };
      }
    }

    const [
      dbClientsList,
      dbBikesList,
      ordersList,
      servicesList,
      partsList,
      profilesList,
      materialsList,
      notificationsList,
    ] = await Promise.all([
      db.select().from(clients).orderBy(desc(clients.createdAt)),
      db.select().from(motorbikes).orderBy(desc(motorbikes.createdAt)),
      db
        .select({
          serviceOrder: serviceOrders,
          client: clients,
          motorbike: motorbikes,
        })
        .from(serviceOrders)
        .innerJoin(clients, eq(serviceOrders.clientId, clients.id))
        .innerJoin(motorbikes, eq(serviceOrders.motorbikeId, motorbikes.id))
        .orderBy(desc(serviceOrders.createdAt)),
      db.select().from(services).orderBy(asc(services.name)),
      db.select().from(partsCatalog).orderBy(asc(partsCatalog.name)),
      db.select().from(profiles).orderBy(desc(profiles.createdAt)),
      db.select().from(materials).orderBy(desc(materials.createdAt)),
      db.select().from(notifications).orderBy(desc(notifications.createdAt)),
    ]);

    const mappedTechs = profilesList.map((m: any) => ({
      id: m.id,
      name: m.name,
      role: m.role === "admin_geral"
        ? "Administrador Geral"
        : m.role === "aux_admin"
        ? "Auxiliar Administrativo"
        : m.role === "mecanico_chefe"
        ? "Mecânico Chefe"
        : m.role === "mecanico"
        ? "Mecânico"
        : m.role === "ajudante"
        ? "Ajudante Geral"
        : m.role,
      email: m.email,
      active: true,
      createdAt: typeof m.createdAt === "string" ? m.createdAt : m.createdAt?.toISOString() || new Date().toISOString()
    }));

    return {
      user: currentUserProfile,
      clients: dbClientsList.map(formatDbClient),
      bikes: dbBikesList.map(formatDbBike),
      serviceOrders: ordersList.map((o) => ({
        ...formatDbServiceOrder(o.serviceOrder),
        client: formatDbClient(o.client),
        motorbike: formatDbBike(o.motorbike),
      })),
      services: servicesList.map(formatDbService),
      partsCatalog: partsList.map(formatDbPart),
      technicians: mappedTechs,
      materials: materialsList.map(formatDbMaterial),
      notifications: notificationsList.map(formatDbNotification),
    };
  } catch (error: any) {
    console.error("Error fetching initial app data:", error);
    return { error: formatActionError(error) };
  }
}

// Helpers for materials and notifications
function formatDbMaterial(dbMaterial: any): Material {
  return {
    id: dbMaterial.id,
    name: dbMaterial.name,
    category: dbMaterial.category,
    status: dbMaterial.status,
    cost: Number(dbMaterial.cost),
    supplierName: dbMaterial.supplierName || undefined,
    supplierPhone: dbMaterial.supplierPhone || undefined,
    reportedBy: dbMaterial.reportedBy || undefined,
    neededByDate: dbMaterial.neededByDate || undefined,
    neededByTime: dbMaterial.neededByTime || undefined,
    createdAt: dbMaterial.createdAt.toISOString(),
    updatedAt: dbMaterial.updatedAt.toISOString(),
  };
}

function formatDbNotification(dbNotification: any): SystemNotification {
  return {
    id: dbNotification.id,
    title: dbNotification.title,
    message: dbNotification.message,
    read: dbNotification.read,
    type: dbNotification.type,
    link: dbNotification.link || undefined,
    createdAt: dbNotification.createdAt.toISOString(),
  };
}

// Material Actions
export async function getMaterialsAction() {
  try {
    const list = await db.select().from(materials).orderBy(desc(materials.createdAt));
    return { materials: list.map(formatDbMaterial) };
  } catch (error: any) {
    console.error("Error fetching materials:", error);
    return { error: formatActionError(error) };
  }
}

export async function saveMaterialAction(
  materialData: Omit<Material, "id" | "createdAt" | "updatedAt"> & { id?: string }
) {
  try {
    if (!(await checkPermission("materials", "edit"))) {
      return { error: "Você não tem permissão para cadastrar ou editar materiais." };
    }
    let saved;
    const now = new Date();
    
    if (materialData.id) {
      const [updated] = await db
        .update(materials)
        .set({
          name: materialData.name,
          category: materialData.category,
          status: materialData.status,
          cost: materialData.cost.toString(),
          supplierName: materialData.supplierName || null,
          supplierPhone: materialData.supplierPhone || null,
          reportedBy: materialData.reportedBy || null,
          neededByDate: materialData.neededByDate || null,
          neededByTime: materialData.neededByTime || null,
          updatedAt: now,
        })
        .where(eq(materials.id, materialData.id))
        .returning();
      saved = updated;
    } else {
      const [inserted] = await db
        .insert(materials)
        .values({
          name: materialData.name,
          category: materialData.category,
          status: materialData.status || "pendente",
          cost: (materialData.cost ?? 0).toString(),
          supplierName: materialData.supplierName || null,
          supplierPhone: materialData.supplierPhone || null,
          reportedBy: materialData.reportedBy || null,
          neededByDate: materialData.neededByDate || null,
          neededByTime: materialData.neededByTime || null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      saved = inserted;
    }

    // If status is 'pendente', let's automatically create a notification for the admins
    if (saved.status === 'pendente') {
      const displayCategory = 
        saved.category === 'insumo_servico' ? 'Insumo de Serviço' :
        saved.category === 'insumo_mercado' ? 'Insumo de Mercado' :
        saved.category === 'ferramenta' ? 'Ferramenta' :
        saved.category === 'lubrificante' ? 'Lubrificante' : 'Peça Essencial';
      
      const reportedByText = saved.reportedBy ? ` por ${saved.reportedBy}` : '';
      
      let limitText = '';
      if (saved.neededByDate) {
        try {
          const [y, m, d] = saved.neededByDate.split('-');
          const dateFormatted = `${d}/${m}/${y}`;
          const timeFormatted = saved.neededByTime ? ` às ${saved.neededByTime}` : '';
          limitText = ` (necessário até ${dateFormatted}${timeFormatted})`;
        } catch {
          limitText = ` (necessário até ${saved.neededByDate})`;
        }
      }
      
      await db.insert(notifications).values({
        title: `Falta de Material: ${saved.name}`,
        message: `Falta de ${saved.name} (${displayCategory}) reportada${reportedByText}${limitText}.`,
        read: false,
        type: 'material_shortage',
        link: '/materiais',
        createdAt: now,
      });
    }

    revalidatePath("/");
    return { material: formatDbMaterial(saved) };
  } catch (error: any) {
    console.error("Error saving material:", error);
    return { error: formatActionError(error) };
  }
}

export async function deleteMaterialAction(id: string) {
  try {
    if (!(await checkPermission("materials", "delete"))) {
      return { error: "Você não tem permissão para excluir materiais." };
    }
    await db.delete(materials).where(eq(materials.id, id));
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting material:", error);
    return { error: formatActionError(error) };
  }
}

// Notification Actions
export async function getNotificationsAction() {
  try {
    const list = await db.select().from(notifications).orderBy(desc(notifications.createdAt));
    return { notifications: list.map(formatDbNotification) };
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return { error: formatActionError(error) };
  }
}

export async function markNotificationAsReadAction(id: string) {
  try {
    const [updated] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    revalidatePath("/");
    return { notification: formatDbNotification(updated) };
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return { error: formatActionError(error) };
  }
}

export async function markAllNotificationsAsReadAction() {
  try {
    await db.update(notifications).set({ read: true });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error);
    return { error: formatActionError(error) };
  }
}




