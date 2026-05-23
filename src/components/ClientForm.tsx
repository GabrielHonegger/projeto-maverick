import React, { useState } from "react";
import { ArrowLeft, User, MapPin, Bike, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Client, Motorbike } from "@/types";

interface ClientFormProps {
  onSave: (client: Omit<Client, "id" | "createdAt">, initialBike: Omit<Motorbike, "id" | "clientId" | "createdAt"> | null) => void;
  onCancel: () => void;
}

export default function ClientForm({ onSave, onCancel }: ClientFormProps) {
  const [activeTab, setActiveTab] = useState("demographics");
  const [error, setError] = useState("");

  // Demographics State
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");

  // Address State
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Initial Motorbike State (Optional)
  const [hasBike, setHasBike] = useState(false);
  const [bikeModel, setBikeModel] = useState("");
  const [bikeYear, setBikeYear] = useState("");
  const [bikeColor, setBikeColor] = useState("");
  const [bikeBrand, setBikeBrand] = useState("");
  const [bikePlate, setBikePlate] = useState("");
  const [bikeVin, setBikeVin] = useState("");

  // Auto-formatting helpers
  const formatCPF = (value: string) => {
    const clean = value.replace(/\D/g, "");
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.substring(0, 3)}.${clean.substring(3)}`;
    if (clean.length <= 9) return `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6)}`;
    return `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6, 9)}-${clean.substring(9, 11)}`;
  };

  const formatPhone = (value: string) => {
    const clean = value.replace(/\D/g, "");
    if (clean.length <= 2) return clean;
    if (clean.length <= 6) return `(${clean.substring(0, 2)}) ${clean.substring(2)}`;
    if (clean.length <= 10) return `(${clean.substring(0, 2)}) ${clean.substring(2, 6)}-${clean.substring(6)}`;
    return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7, 11)}`;
  };

  const formatCEP = (value: string) => {
    const clean = value.replace(/\D/g, "");
    if (clean.length <= 5) return clean;
    return `${clean.substring(0, 5)}-${clean.substring(5, 8)}`;
  };

  // ZIP Code Search (ViaCEP API)
  const handleCepSearch = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      setError("Insira um CEP válido com 8 dígitos para buscar.");
      return;
    }

    setIsSearchingCep(true);
    setError("");

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setError("CEP não encontrado.");
      } else {
        setStreet(`${data.logradouro} - ${data.bairro}, ${data.localidade}/${data.uf}`);
      }
    } catch (err) {
      setError("Erro ao buscar o CEP. Digite o endereço manualmente.");
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate Demographics
    if (!name || !cpf || !birthDate || !phone || !gender) {
      setActiveTab("demographics");
      setError("Preencha todos os campos obrigatórios dos dados do cliente.");
      return;
    }

    // Validate Address
    if (!cep || !street || !number) {
      setActiveTab("address");
      setError("Preencha todos os campos obrigatórios do endereço.");
      return;
    }

    // Validate Motorbike if enabled
    let initialBike = null;
    if (hasBike) {
      if (!bikeModel || !bikeYear || !bikeColor || !bikeBrand || !bikePlate || !bikeVin) {
        setActiveTab("bike");
        setError("Preencha todos os campos da motocicleta ou desmarque 'Cadastrar Moto'.");
        return;
      }

      const cleanVin = bikeVin.replace(/\s+/g, "");

      // Brand validations
      if (bikeBrand.toLowerCase() === "bmw") {
        if (cleanVin.length !== 7) {
          setActiveTab("bike");
          setError("Chassis para BMW deve conter exatamente os 7 últimos dígitos do VIN.");
          return;
        }
      } else if (bikeBrand.toLowerCase() === "triumph") {
        if (cleanVin.length !== 6 || !/^\d+$/.test(cleanVin)) {
          setActiveTab("bike");
          setError("Chassis para Triumph deve conter exatamente os 6 últimos números do VIN.");
          return;
        }
      }

      initialBike = {
        model: bikeModel,
        year: bikeYear,
        color: bikeColor,
        brand: bikeBrand,
        plate: bikePlate.toUpperCase(),
        vin: cleanVin.toUpperCase(),
      };
    }

    onSave(
      {
        name,
        nickname: nickname || undefined,
        cpf,
        birthDate,
        phone,
        email,
        gender,
        address: {
          cep,
          street,
          number,
          complement: complement || undefined,
        },
      },
      initialBike
    );
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onCancel}
          className="h-9 w-9 rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 flex items-center justify-center transition-all duration-150 shadow-sm shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            Cadastrar Novo Cliente
          </h1>
          <p className="text-zinc-500 mt-0.5 text-sm hidden sm:block">Preencha as informações para registrar o cliente.</p>
        </div>
      </div>

      {error && (
        <div className="p-3 sm:p-4 bg-red-50 border border-red-100 text-sm font-semibold text-red-600 rounded-xl">
          {error}
        </div>
      )}

      {/* Main Card with Tabs */}
      <Card className="bg-white border-zinc-100 shadow-sm overflow-hidden rounded-2xl">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 bg-zinc-100 p-1 rounded-xl mb-5 sm:mb-6">
                <TabsTrigger value="demographics" className="rounded-lg flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Dados</span>
                </TabsTrigger>
                <TabsTrigger value="address" className="rounded-lg flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Endereço</span>
                </TabsTrigger>
                <TabsTrigger value="bike" className="rounded-lg flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm">
                  <Bike className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Moto (Opcional)</span>
                  <span className="sm:hidden">Moto</span>
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Demographics */}
              <TabsContent value="demographics" className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="name" className="text-xs font-semibold text-zinc-700">Nome Completo *</Label>
                    <Input id="name" placeholder="Ex: João da Silva" value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-zinc-50 border-zinc-200 rounded-xl h-10 text-sm" />
                  </div>

                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label htmlFor="nickname" className="text-xs font-semibold text-zinc-700">Apelido</Label>
                    <Input id="nickname" placeholder="Ex: Joãozin" value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="bg-zinc-50 border-zinc-200 rounded-xl h-10 text-sm" />
                  </div>

                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label htmlFor="gender" className="text-xs font-semibold text-zinc-700">Sexo *</Label>
                    <Select onValueChange={(val) => setGender(val ?? "")} value={gender}>
                      <SelectTrigger className="bg-zinc-50 border-zinc-200 rounded-xl h-10">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-zinc-100 rounded-xl shadow-lg">
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Feminino">Feminino</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label htmlFor="cpf" className="text-xs font-semibold text-zinc-700">CPF *</Label>
                    <Input id="cpf" placeholder="000.000.000-00" value={cpf}
                      onChange={(e) => setCpf(formatCPF(e.target.value))} maxLength={14}
                      className="bg-zinc-50 border-zinc-200 rounded-xl h-10 text-sm font-mono" />
                  </div>

                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label htmlFor="birthDate" className="text-xs font-semibold text-zinc-700">Data de Nascimento *</Label>
                    <Input id="birthDate" type="date" value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="bg-zinc-50 border-zinc-200 rounded-xl h-10 text-sm" />
                  </div>

                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label htmlFor="phone" className="text-xs font-semibold text-zinc-700">Contato *</Label>
                    <Input id="phone" placeholder="(00) 00000-0000" value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))} maxLength={15}
                      className="bg-zinc-50 border-zinc-200 rounded-xl h-10 text-sm" />
                  </div>

                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label htmlFor="email" className="text-xs font-semibold text-zinc-700">E-mail</Label>
                    <Input id="email" type="email" placeholder="email@exemplo.com" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-zinc-50 border-zinc-200 rounded-xl h-10 text-sm" />
                  </div>
                </div>

                <div className="flex justify-end pt-3 sm:pt-4">
                  <button type="button" onClick={() => setActiveTab("address")}
                    className="w-full sm:w-auto px-5 py-2.5 bg-zinc-900 text-white hover:bg-zinc-800 font-semibold rounded-xl text-sm transition-colors shadow-sm">
                    Avançar: Endereço
                  </button>
                </div>
              </TabsContent>

              {/* TAB 2: Address */}
              <TabsContent value="address" className="space-y-4">
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-1.5 col-span-3 sm:col-span-1">
                    <Label htmlFor="cep" className="text-xs font-semibold text-zinc-700">CEP *</Label>
                    <div className="flex gap-2">
                      <Input id="cep" placeholder="00000-000" value={cep}
                        onChange={(e) => setCep(formatCEP(e.target.value))} maxLength={9}
                        className="bg-zinc-50 border-zinc-200 rounded-xl h-10 text-sm font-mono flex-1" />
                      <button type="button" onClick={handleCepSearch} disabled={isSearchingCep}
                        className="h-10 w-10 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 rounded-xl text-zinc-600 transition-colors border border-zinc-200 shrink-0">
                        <Search className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 col-span-3 sm:col-span-2">
                    <Label htmlFor="street" className="text-xs font-semibold text-zinc-700">Endereço/Rua/Bairro/Cidade *</Label>
                    <Input id="street" placeholder="Ex: Av. Paulista, 1000 - Bela Vista" value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="bg-zinc-50 border-zinc-200 rounded-xl h-10 text-sm" />
                  </div>

                  <div className="space-y-1.5 col-span-3 sm:col-span-1">
                    <Label htmlFor="number" className="text-xs font-semibold text-zinc-700">Número *</Label>
                    <Input id="number" placeholder="Ex: 123" value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="bg-zinc-50 border-zinc-200 rounded-xl h-10 text-sm" />
                  </div>

                  <div className="space-y-1.5 col-span-3 sm:col-span-2">
                    <Label htmlFor="complement" className="text-xs font-semibold text-zinc-700">Complemento</Label>
                    <Input id="complement" placeholder="Ex: Apto 42 / Casa" value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      className="bg-zinc-50 border-zinc-200 rounded-xl h-10 text-sm" />
                  </div>
                </div>

                <div className="flex gap-2 pt-3 sm:pt-4">
                  <button type="button" onClick={() => setActiveTab("demographics")}
                    className="flex-1 sm:flex-none px-5 py-2.5 border border-zinc-200 bg-white text-zinc-700 font-semibold rounded-xl text-sm transition-colors hover:bg-zinc-50">
                    Voltar
                  </button>
                  <button type="button" onClick={() => setActiveTab("bike")}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-zinc-900 text-white hover:bg-zinc-800 font-semibold rounded-xl text-sm transition-colors shadow-sm">
                    Avançar: Moto
                  </button>
                </div>
              </TabsContent>

              {/* TAB 3: Optional Motorbike */}
              <TabsContent value="bike" className="space-y-4">
                <label htmlFor="hasBike" className="flex items-center gap-3 cursor-pointer select-none pb-1">
                  <input
                    type="checkbox"
                    id="hasBike"
                    checked={hasBike}
                    onChange={(e) => setHasBike(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
                  />
                  <span className="text-sm font-semibold text-zinc-700">Vincular uma moto agora</span>
                </label>

                {hasBike && (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 border border-zinc-100 p-4 rounded-xl bg-zinc-50/50 animate-fade-in">
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-xs font-semibold text-zinc-700">Marca</Label>
                      <Select onValueChange={(val) => { setBikeBrand(val ?? ""); setBikeVin(""); }} value={bikeBrand}>
                        <SelectTrigger className="bg-white border-zinc-200 rounded-xl h-10">
                          <SelectValue placeholder="Selecione a marca" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-zinc-100 rounded-xl shadow-lg">
                          {["Honda","Yamaha","BMW","Triumph","Kawasaki","Suzuki","Harley-Davidson","Ducati","Outra"].map(
                            (b) => <SelectItem key={b} value={b}>{b}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-xs font-semibold text-zinc-700">Modelo</Label>
                      <Input placeholder="Ex: Hornet / R 1200 GS" value={bikeModel}
                        onChange={(e) => setBikeModel(e.target.value)}
                        className="bg-white border-zinc-200 rounded-xl h-10 text-sm" />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-zinc-700">Ano</Label>
                      <Input placeholder="Ex: 2021" value={bikeYear}
                        onChange={(e) => setBikeYear(e.target.value)}
                        className="bg-white border-zinc-200 rounded-xl h-10 text-sm" />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-zinc-700">Cor</Label>
                      <Input placeholder="Ex: Azul" value={bikeColor}
                        onChange={(e) => setBikeColor(e.target.value)}
                        className="bg-white border-zinc-200 rounded-xl h-10 text-sm" />
                    </div>

                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-xs font-semibold text-zinc-700">Placa</Label>
                      <Input placeholder="Ex: GHI9J87" value={bikePlate}
                        onChange={(e) => setBikePlate(e.target.value)}
                        className="bg-white border-zinc-200 rounded-xl h-10 text-sm uppercase font-mono tracking-widest" />
                    </div>

                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-xs font-semibold text-zinc-700">
                        Chassis / VIN{" "}
                        {bikeBrand.toLowerCase() === "bmw" && <span className="text-blue-500 font-normal">(7 últimos dígitos)</span>}
                        {bikeBrand.toLowerCase() === "triumph" && <span className="text-amber-500 font-normal">(6 últimos números)</span>}
                      </Label>
                      <Input
                        placeholder={bikeBrand.toLowerCase() === "bmw" ? "Ex: A123456" : bikeBrand.toLowerCase() === "triumph" ? "Ex: 123456" : "Ex: 9BW..."}
                        value={bikeVin}
                        onChange={(e) => setBikeVin(e.target.value)}
                        maxLength={bikeBrand.toLowerCase() === "bmw" ? 7 : bikeBrand.toLowerCase() === "triumph" ? 6 : undefined}
                        className="bg-white border-zinc-200 rounded-xl h-10 text-sm font-mono uppercase" />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-3 sm:pt-4">
                  <button type="button" onClick={() => setActiveTab("address")}
                    className="flex-1 sm:flex-none px-5 py-2.5 border border-zinc-200 bg-white text-zinc-700 font-semibold rounded-xl text-sm transition-colors hover:bg-zinc-50">
                    Voltar
                  </button>
                  <button type="submit"
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl text-sm transition-all shadow-sm">
                    Salvar Cadastro
                  </button>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
