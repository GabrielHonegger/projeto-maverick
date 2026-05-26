import { pgTable, text, timestamp, uuid, jsonb, serial, numeric, boolean } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // matches auth.users.id
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").$type<'admin_geral' | 'aux_admin' | 'mecanico_chefe' | 'mecanico' | 'ajudante'>().default('ajudante').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

export const serviceOrders = pgTable("service_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  osNumber: serial("os_number").notNull().unique(),
  clientId: uuid("client_id")
    .references(() => clients.id, { onDelete: "restrict" })
    .notNull(),
  motorbikeId: uuid("motorbike_id")
    .references(() => motorbikes.id, { onDelete: "restrict" })
    .notNull(),
  status: text("status").notNull(), // 'montagem_orcamento', 'aguardando_aprovacao', 'aprovado', 'recusado', 'encerrado'
  type: text("type").default("orcamento").notNull(), // 'orcamento' | 'os'
  
  // Checklist / Vistoria
  odometer: text("odometer").notNull(),
  fuelLevel: text("fuel_level").notNull(), // 'vazio', '1/4', '1/2', '3/4', 'cheio'
  tiresCondition: jsonb("tires_condition").$type<{
    front: 'novo' | 'bom' | 'ruim';
    rear: 'novo' | 'bom' | 'ruim';
  }>().notNull(),
  accessories: jsonb("accessories").$type<string[]>().notNull(), // Checked accessories (Documento, Chave de ignição, etc.)
  customAccessories: jsonb("custom_accessories").$type<string[]>().default([]).notNull(), // Custom accessories added
  damagePoints: jsonb("damage_points").$type<{
    partId: string;
    partName: string;
    type: 'riscado' | 'quebrado';
    description?: string;
    x?: number;
    y?: number;
    perspective?: string;
  }[]>().default([]).notNull(),
  inspectionPhotos: jsonb("inspection_photos").$type<{
    url: string;
    type: 'foto' | 'video';
    notes?: string;
  }[]>().default([]).notNull(),
  electricalProblems: text("electrical_problems"),
  maintenanceProblems: text("maintenance_problems"),

  // Defeitos/Reclamação do Cliente
  customerComplaints: text("customer_complaints").notNull(),

  // Laudo Técnico e Obs Internas
  technicalReport: text("technical_report"),
  internalNotes: text("internal_notes"),

  // Mão de Obra (Labor)
  labor: jsonb("labor").$type<{
    id: string;
    name: string;
    technician: string;
    hours: number;
    hourlyRate: number;
    total: number;
    isOptional: boolean;
    isCustom: boolean;
    trackedSeconds?: number;
    timerStartedAt?: string | null;
  }[]>().default([]).notNull(),

  // Peças (Parts)
  parts: jsonb("parts").$type<{
    id: string;
    name: string;
    code?: string;
    technician: string;
    cost: number;
    salePrice: number;
    quantity: number;
    total: number;
    isOptional: boolean;
    isCustom: boolean;
    brand?: string;
    specifications?: string;
    measurements?: string;
  }[]>().default([]).notNull(),

  // Valores Financeiros
  discounts: numeric("discounts").default("0").notNull(),
  otherCharges: numeric("other_charges").default("0").notNull(),
  towingFee: numeric("towing_fee").default("0").notNull(),
  totalValue: numeric("total_value").default("0").notNull(),

  // Adiantamentos / Pagamentos parciais
  payments: jsonb("payments").$type<{
    id: string;
    amount: number;
    date: string;
    method: string;
    account: string;
  }[]>().default([]).notNull(),

  // Datas
  entryDate: timestamp("entry_date").defaultNow().notNull(),
  readyDate: timestamp("ready_date"),
  exitDate: timestamp("exit_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedStages: jsonb("completed_stages").$type<string[]>().default([]).notNull(),
});

export const technicians = pgTable("technicians", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  phone: text("phone"),
  email: text("email"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

