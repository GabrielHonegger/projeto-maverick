"use server";

import { db } from "@/db/db";
import { clients, motorbikes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Client, Motorbike } from "@/types";

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
    return {
      error: error?.message || String(error)
    };
  }
}

export async function saveClientAction(
  clientData: Omit<Client, "id" | "createdAt">,
  initialBikeData: Omit<Motorbike, "id" | "clientId" | "createdAt"> | null
) {
  try {
    // Insert client
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

    let newBike = null;
    if (initialBikeData) {
      const [insertedBike] = await db.insert(motorbikes).values({
        clientId: newClient.id,
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
      client: formatDbClient(newClient),
      bike: newBike,
    };
  } catch (error: any) {
    console.error("Error saving client:", error);
    return {
      error: error?.message || String(error)
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
      error: error?.message || String(error)
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
      error: error?.message || String(error)
    };
  }
}

