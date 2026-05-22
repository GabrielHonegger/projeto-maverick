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
