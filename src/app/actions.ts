"use server";

import { db } from "@/db/db";
import { clients, motorbikes, serviceOrders, technicians, profiles } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { Client, Motorbike, ServiceOrder, Technician } from "@/types";
import { createClient, createAdminClient } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";


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
    const [newBike] = await db.insert(motorbikes).values({
      clientId: bikeData.clientId,
      model: bikeData.model,
      year: bikeData.year,
      color: bikeData.color,
      brand: bikeData.brand,
      plate: bikeData.plate,
      vin: bikeData.vin,
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
    await db.delete(motorbikes).where(eq(motorbikes.id, bikeId));
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting bike:", error);
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
    const [updatedBike] = await db
      .update(motorbikes)
      .set({
        model: bikeData.model,
        year: bikeData.year,
        color: bikeData.color,
        brand: bikeData.brand,
        plate: bikeData.plate,
        vin: bikeData.vin,
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
    const formattedData = {
      clientId: osData.clientId,
      motorbikeId: osData.motorbikeId,
      status: osData.status || "montagem_orcamento",
      type: osData.type || "orcamento",
      odometer: osData.odometer || "",
      fuelLevel: osData.fuelLevel || "1/2",
      tiresCondition: osData.tiresCondition || { front: "bom" as const, rear: "bom" as const },
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
    const updateData: any = { status };
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

    return { user: profile };
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
  password?: string;
}) {
  try {
    // 1. Check if the current user is an admin_geral
    const currentUserRes = await getCurrentUserAction();
    if ("error" in currentUserRes || currentUserRes.user?.role !== "admin_geral") {
      return { error: "Apenas Administrador Geral pode cadastrar membros da equipe." };
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
    // 1. Check if the current user is an admin_geral
    const currentUserRes = await getCurrentUserAction();
    if ("error" in currentUserRes || currentUserRes.user?.role !== "admin_geral") {
      return { error: "Apenas Administrador Geral pode remover membros da equipe." };
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
              role: r.role
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
        role: r.role
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


