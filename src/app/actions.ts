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
  } catch (error) {
    console.error("Error fetching clients and bikes:", error);
    throw new Error("Falha ao carregar dados do banco de dados.");
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
  } catch (error) {
    console.error("Error saving client:", error);
    throw new Error("Falha ao salvar cliente no banco de dados.");
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

    return formatDbBike(newBike);
  } catch (error) {
    console.error("Error adding bike:", error);
    throw new Error("Falha ao adicionar moto no banco de dados.");
  }
}

export async function deleteBikeAction(bikeId: string) {
  try {
    await db.delete(motorbikes).where(eq(motorbikes.id, bikeId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting bike:", error);
    throw new Error("Falha ao remover moto do banco de dados.");
  }
}
