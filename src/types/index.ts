export interface Address {
  cep: string;
  street: string;
  number: string;
  complement?: string;
}

export interface Client {
  id: string;
  name: string;
  nickname?: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
  gender: string;
  address: Address;
  createdAt: string;
}

export interface Motorbike {
  id: string;
  clientId: string;
  model: string;
  year: string;
  color: string;
  brand: string;
  plate: string;
  vin: string;
  createdAt: string;
}

export interface LaborItem {
  id: string;
  name: string;
  technician: string;
  hours: number;
  hourlyRate: number;
  total: number;
  isOptional: boolean;
  isCustom: boolean;
}

export interface PartItem {
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
}

export interface PaymentItem {
  id: string;
  amount: number;
  date: string;
  method: string;
  account: string;
}

export interface DamagePoint {
  partId: string;
  partName: string;
  type: "riscado" | "quebrado";
  description?: string;
}

export interface InspectionPhoto {
  url: string;
  type: "foto" | "video";
  notes?: string;
}

export interface ServiceOrder {
  id: string;
  osNumber: number;
  clientId: string;
  motorbikeId: string;
  status: "montagem_orcamento" | "aguardando_aprovacao" | "aprovado" | "recusado" | "encerrado";
  type: "orcamento" | "os";
  odometer: string;
  fuelLevel: "vazio" | "1/4" | "1/2" | "3/4" | "cheio";
  tiresCondition: {
    front: "novo" | "bom" | "ruim";
    rear: "novo" | "bom" | "ruim";
  };
  accessories: string[];
  customAccessories: string[];
  damagePoints: DamagePoint[];
  inspectionPhotos: InspectionPhoto[];
  electricalProblems?: string;
  maintenanceProblems?: string;
  customerComplaints: string;
  technicalReport?: string;
  internalNotes?: string;
  labor: LaborItem[];
  parts: PartItem[];
  discounts: number;
  otherCharges: number;
  towingFee: number;
  totalValue: number;
  payments: PaymentItem[];
  entryDate: string;
  readyDate?: string;
  exitDate?: string;
  createdAt: string;
}

export interface ServiceOrderWithRelations extends ServiceOrder {
  client: Client;
  motorbike: Motorbike;
}


