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
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onCancel}
          className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Cadastrar Novo Cliente
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Preencha as informações para registrar o cliente.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm font-semibold text-red-600 dark:text-red-400 rounded-xl">
          {error}
        </div>
      )}

      {/* Main Card with Tabs */}
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl mb-6">
                <TabsTrigger value="demographics" className="rounded-lg flex items-center justify-center gap-2 py-2">
                  <User className="h-4 w-4" />
                  <span>Dados</span>
                </TabsTrigger>
                <TabsTrigger value="address" className="rounded-lg flex items-center justify-center gap-2 py-2">
                  <MapPin className="h-4 w-4" />
                  <span>Endereço</span>
                </TabsTrigger>
                <TabsTrigger value="bike" className="rounded-lg flex items-center justify-center gap-2 py-2">
                  <Bike className="h-4 w-4" />
                  <span>Moto (Opcional)</span>
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Demographics */}
              <TabsContent value="demographics" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: João da Silva"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
                    />
                  </div>

                  {/* Nickname */}
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label htmlFor="nickname">Apelido</Label>
                    <Input
                      id="nickname"
                      placeholder="Ex: Joãozin"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
                    />
                  </div>

                  {/* Gender Select */}
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label htmlFor="gender">Sexo *</Label>
                    <Select onValueChange={(val) => setGender(val ?? "")} value={gender}>
                      <SelectTrigger className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Feminino">Feminino</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* CPF */}
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(formatCPF(e.target.value))}
                      maxLength={14}
                      className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl font-mono"
                    />
                  </div>

                  {/* Birth Date */}
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label htmlFor="birthDate">Data de Nascimento *</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label htmlFor="phone">Número de Contato *</Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      maxLength={15}
                      className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab("address")}
                    className="px-5 py-2.5 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 font-semibold rounded-xl text-sm transition-colors"
                  >
                    Avançar: Endereço
                  </button>
                </div>
              </TabsContent>

              {/* TAB 2: Address */}
              <TabsContent value="address" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {/* CEP */}
                  <div className="space-y-1.5 col-span-3 sm:col-span-1">
                    <Label htmlFor="cep">CEP *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cep"
                        placeholder="00000-000"
                        value={cep}
                        onChange={(e) => setCep(formatCEP(e.target.value))}
                        maxLength={9}
                        className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl font-mono flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleCepSearch}
                        disabled={isSearchingCep}
                        className="p-3 bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 transition-colors border border-zinc-200 dark:border-zinc-850"
                      >
                        <Search className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>

                  {/* Street / Auto Address */}
                  <div className="space-y-1.5 col-span-3 sm:col-span-2">
                    <Label htmlFor="street">Endereço/Rua/Bairro/Cidade *</Label>
                    <Input
                      id="street"
                      placeholder="Ex: Av. Paulista, 1000 - Bela Vista"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
                    />
                  </div>

                  {/* Number */}
                  <div className="space-y-1.5 col-span-3 sm:col-span-1">
                    <Label htmlFor="number">Número *</Label>
                    <Input
                      id="number"
                      placeholder="Ex: 123"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
                    />
                  </div>

                  {/* Complement */}
                  <div className="space-y-1.5 col-span-3 sm:col-span-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      placeholder="Ex: Apto 42 / Casa"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab("demographics")}
                    className="px-5 py-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-850"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("bike")}
                    className="px-5 py-2.5 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 font-semibold rounded-xl text-sm transition-colors"
                  >
                    Avançar: Moto
                  </button>
                </div>
              </TabsContent>

              {/* TAB 3: Optional Motorbike */}
              <TabsContent value="bike" className="space-y-4">
                <div className="flex items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    id="hasBike"
                    checked={hasBike}
                    onChange={(e) => setHasBike(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 accent-blue-500"
                  />
                  <Label htmlFor="hasBike" className="text-sm font-semibold select-none cursor-pointer">
                    Vincular uma moto agora
                  </Label>
                </div>

                {hasBike && (
                  <div className="grid grid-cols-2 gap-4 border border-zinc-100 dark:border-zinc-800 p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 animate-fade-in">
                    {/* Brand */}
                    <div className="space-y-1.5 col-span-2">
                      <Label htmlFor="bikeBrand">Marca</Label>
                      <Select onValueChange={(val) => { setBikeBrand(val ?? ""); setBikeVin(""); }} value={bikeBrand}>
                        <SelectTrigger className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl">
                          <SelectValue placeholder="Selecione a marca" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                          <SelectItem value="Honda">Honda</SelectItem>
                          <SelectItem value="Yamaha">Yamaha</SelectItem>
                          <SelectItem value="BMW">BMW</SelectItem>
                          <SelectItem value="Triumph">Triumph</SelectItem>
                          <SelectItem value="Kawasaki">Kawasaki</SelectItem>
                          <SelectItem value="Suzuki">Suzuki</SelectItem>
                          <SelectItem value="Harley-Davidson">Harley-Davidson</SelectItem>
                          <SelectItem value="Ducati">Ducati</SelectItem>
                          <SelectItem value="Outra">Outra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Model */}
                    <div className="space-y-1.5 col-span-2">
                      <Label htmlFor="bikeModel">Modelo</Label>
                      <Input
                        id="bikeModel"
                        placeholder="Ex: Hornet / R 1200 GS"
                        value={bikeModel}
                        onChange={(e) => setBikeModel(e.target.value)}
                        className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
                      />
                    </div>

                    {/* Year */}
                    <div className="space-y-1.5">
                      <Label htmlFor="bikeYear">Ano</Label>
                      <Input
                        id="bikeYear"
                        placeholder="Ex: 2021"
                        value={bikeYear}
                        onChange={(e) => setBikeYear(e.target.value)}
                        className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
                      />
                    </div>

                    {/* Color */}
                    <div className="space-y-1.5">
                      <Label htmlFor="bikeColor">Cor</Label>
                      <Input
                        id="bikeColor"
                        placeholder="Ex: Azul"
                        value={bikeColor}
                        onChange={(e) => setBikeColor(e.target.value)}
                        className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
                      />
                    </div>

                    {/* Plate */}
                    <div className="space-y-1.5 col-span-2">
                      <Label htmlFor="bikePlate">Placa</Label>
                      <Input
                        id="bikePlate"
                        placeholder="Ex: GHI9J87"
                        value={bikePlate}
                        onChange={(e) => setBikePlate(e.target.value)}
                        className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl uppercase"
                      />
                    </div>

                    {/* Chassis / VIN */}
                    <div className="space-y-1.5 col-span-2">
                      <Label htmlFor="bikeVin">
                        Chassis / VIN{" "}
                        {bikeBrand.toLowerCase() === "bmw" && "(Últimos 7 dígitos)"}
                        {bikeBrand.toLowerCase() === "triumph" && "(Últimos 6 números)"}
                      </Label>
                      <Input
                        id="bikeVin"
                        placeholder={
                          bikeBrand.toLowerCase() === "bmw"
                            ? "Ex: A123456"
                            : bikeBrand.toLowerCase() === "triumph"
                            ? "Ex: 123456"
                            : "Ex: 9BW..."
                        }
                        value={bikeVin}
                        onChange={(e) => setBikeVin(e.target.value)}
                        maxLength={bikeBrand.toLowerCase() === "bmw" ? 7 : bikeBrand.toLowerCase() === "triumph" ? 6 : undefined}
                        className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl font-mono uppercase"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab("address")}
                    className="px-5 py-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl text-sm transition-colors hover:bg-zinc-50"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold rounded-xl text-sm transition-all"
                  >
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
