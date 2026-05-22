import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  nickname: text("nickname"),
  cpf: text("cpf").notNull(),
  birthDate: text("birth_date").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  gender: text("gender").notNull(),
  address: jsonb("address").$type<{
    cep: string;
    street: string;
    number: string;
    complement?: string;
  }>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const motorbikes = pgTable("motorbikes", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .references(() => clients.id, { onDelete: "cascade" })
    .notNull(),
  model: text("model").notNull(),
  year: text("year").notNull(),
  color: text("color").notNull(),
  brand: text("brand").notNull(),
  plate: text("plate").notNull(),
  vin: text("vin").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
