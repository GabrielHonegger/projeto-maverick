import React, { useState } from "react";
import { ArrowLeft, User, MapPin, Search } from "lucide-react";
import { FaMotorcycle } from "react-icons/fa6";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client, Motorbike } from "@/types";

interface ClientFormProps {
  client?: Client;
  onSave: (client: Omit<Client, "id" | "createdAt"> & { id?: string }, initialBike: Omit<Motorbike, "id" | "clientId" | "createdAt"> | null) => void;
  onCancel: () => void;
}

// CPF Verification helper
const isValidCPF = (cpf: string): boolean => {
  const cleanCpf = cpf.replace(/\D/g, "");
  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCpf.charAt(10))) return false;

  return true;
};

export default function ClientForm({ client, onSave, onCancel }: ClientFormProps) {
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [cpfError, setCpfError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [birthDateError, setBirthDateError] = useState("");
  const [cepError, setCepError] = useState("");

  // Demographics State
  const [name, setName] = useState(client?.name || "");
  const [nickname, setNickname] = useState(client?.nickname || "");
  const [cpf, setCpf] = useState(client?.cpf || "");
  const [birthDate, setBirthDate] = useState(client?.birthDate || "");
  const [phone, setPhone] = useState(client?.phone || "");
  const [email, setEmail] = useState(client?.email || "");
  const [gender, setGender] = useState(client?.gender || "");

  // Address State
  const [cep, setCep] = useState(client?.address?.cep || "");
  const [street, setStreet] = useState(client?.address?.street || "");
  const [number, setNumber] = useState(client?.address?.number || "");
  const [complement, setComplement] = useState(client?.address?.complement || "");
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Initial Motorbike State (Optional)
  const [hasBike, setHasBike] = useState(false);
  const [bikeModel, setBikeModel] = useState("");
  const [bikeYear, setBikeYear] = useState("");
  const [bikeColor, setBikeColor] = useState("");
  const [bikeBrand, setBikeBrand] = useState("");
  const [bikeCustomBrand, setBikeCustomBrand] = useState("");
  const [bikePlate, setBikePlate] = useState("");
  const [bikeVin, setBikeVin] = useState("");
  const [bikeChassi, setBikeChassi] = useState("");
  const [bikeBrandError, setBikeBrandError] = useState("");
  const [bikeModelError, setBikeModelError] = useState("");
  const [bikeYearError, setBikeYearError] = useState("");
  const [bikeChassiError, setBikeChassiError] = useState("");

  const getDerivedBikeVin = (brandName: string, chassiVal: string) => {
    const b = brandName.toLowerCase();
    const cleanChassi = chassiVal.replace(/\s+/g, "");
    if (b === "bmw") {
      return cleanChassi.slice(-7).toUpperCase();
    }
    if (b === "triumph") {
      return cleanChassi.slice(-6).toUpperCase();
    }
    return "";
  };

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
    setNameError("");
    setPhoneError("");
    setCpfError("");
    setEmailError("");
    setBirthDateError("");
    setCepError("");

    // Validate Demographics
    let hasError = false;
    if (!name.trim()) {
      setNameError("Nome Completo é obrigatório.");
      hasError = true;
    }
    
    const cleanPhone = phone.replace(/\D/g, "");
    if (!phone.trim()) {
      setPhoneError("Contato é obrigatório.");
      hasError = true;
    } else if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
      setPhoneError("Contato deve ter 10 ou 11 dígitos.");
      hasError = true;
    }

    if (cpf && !isValidCPF(cpf)) {
      setCpfError("CPF inválido.");
      hasError = true;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("E-mail inválido.");
      hasError = true;
    }

    const birthDateInput = e.currentTarget.querySelector("#birthDate") as HTMLInputElement;
    if (birthDateInput && (birthDateInput.validity.badInput || (!birthDateInput.validity.valid && birthDateInput.value === ""))) {
      setBirthDateError("Insira uma data de nascimento completa.");
      hasError = true;
    } else if (birthDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
        setBirthDateError("Insira uma data de nascimento completa.");
        hasError = true;
      } else {
        const parts = birthDate.split("-");
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        
        const selectedDate = new Date(year, month - 1, day);
        const today = new Date();
        
        if (year < 1900 || selectedDate > today || isNaN(selectedDate.getTime())) {
          if (year < 1900) {
            setBirthDateError("O ano de nascimento deve ser maior que 1900.");
          } else if (selectedDate > today) {
            setBirthDateError("A data de nascimento não pode ser no futuro.");
          } else {
            setBirthDateError("Data de nascimento inválida.");
          }
          hasError = true;
        }
      }
    }

    const cleanCep = cep.replace(/\D/g, "");
    if (cep && cleanCep.length !== 8) {
      setCepError("CEP deve conter 8 dígitos.");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    // Validate Motorbike if enabled
    let initialBike = null;
    if (hasBike) {
      setBikeBrandError("");
      setBikeModelError("");
      setBikeYearError("");
      setBikeChassiError("");

      let hasBikeError = false;
      const resolvedBrand = bikeBrand === "Outra" ? bikeCustomBrand : bikeBrand;

      if (!resolvedBrand.trim()) {
        setBikeBrandError("A marca da moto é obrigatória.");
        hasBikeError = true;
      }
      if (!bikeModel.trim()) {
        setBikeModelError("O modelo da moto é obrigatório.");
        hasBikeError = true;
      }
      if (!bikeYear.trim()) {
        setBikeYearError("O ano da moto é obrigatório.");
        hasBikeError = true;
      }

      const isBmwOrTriumph = resolvedBrand.toLowerCase() === "bmw" || resolvedBrand.toLowerCase() === "triumph";
      let cleanChassi = "";
      if (isBmwOrTriumph) {
        cleanChassi = bikeChassi.replace(/\s+/g, "");
        if (!cleanChassi) {
          setBikeChassiError("O chassi é obrigatório.");
          hasBikeError = true;
        } else if (cleanChassi.length !== 17) {
          setBikeChassiError("O chassi deve conter exatamente 17 caracteres.");
          hasBikeError = true;
        }
      }

      if (hasBikeError) {
        setError("Por favor, preencha os campos obrigatórios da moto corretamente.");
        return;
      }

      const derivedVin = isBmwOrTriumph ? getDerivedBikeVin(resolvedBrand, cleanChassi) : "";

      initialBike = {
        model: bikeModel,
        year: bikeYear,
        color: bikeColor || "",
        brand: resolvedBrand,
        plate: bikePlate.toUpperCase() || "",
        vin: derivedVin,
      };
    }

    onSave(
      {
        id: client?.id,
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
            {client ? "Editar Cliente" : "Cadastrar Novo Cliente"}
          </h1>
          <p className="text-zinc-500 mt-0.5 text-sm hidden sm:block">
            {client ? "Atualize as informações do cliente." : "Preencha as informações para registrar o cliente."}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 sm:p-4 bg-red-50 border border-red-100 text-sm font-semibold text-red-600 rounded-xl">
          {error}
        </div>
      )}

      {/* Main Card */}
      <Card className="bg-white border-zinc-100 shadow-sm overflow-hidden rounded-2xl">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            
            {/* Seção 1: Dados Pessoais */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                <User className="h-5 w-5 text-zinc-500" />
                <h3 className="font-semibold text-zinc-900 text-base">Dados Pessoais</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="name" className={`text-xs font-semibold ${nameError ? "text-red-500" : "text-zinc-700"}`}>Nome Completo *</Label>
                  <Input id="name" placeholder="Ex: João da Silva" value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setNameError("");
                    }}
                    aria-invalid={!!nameError}
                    className={`bg-zinc-50 rounded-xl h-10 text-sm ${nameError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "border-zinc-200"}`} />
                  {nameError && <p className="text-xs text-red-500">{nameError}</p>}
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label htmlFor="nickname" className="text-xs font-semibold text-zinc-700">Apelido</Label>
                  <Input id="nickname" placeholder="Ex: Joãozin" value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="bg-zinc-50 border-zinc-200 rounded-xl h-10 text-sm" />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label htmlFor="gender" className="text-xs font-semibold text-zinc-700">Sexo</Label>
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
                  <Label htmlFor="cpf" className={`text-xs font-semibold ${cpfError ? "text-red-500" : "text-zinc-700"}`}>CPF</Label>
                  <Input id="cpf" placeholder="000.000.000-00" value={cpf}
                    onChange={(e) => {
                      setCpf(formatCPF(e.target.value));
                      setCpfError("");
                    }} maxLength={14}
                    aria-invalid={!!cpfError}
                    className={`bg-zinc-50 rounded-xl h-10 text-sm font-mono ${cpfError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "border-zinc-200"}`} />
                  {cpfError && <p className="text-xs text-red-500">{cpfError}</p>}
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label htmlFor="birthDate" className={`text-xs font-semibold ${birthDateError ? "text-red-500" : "text-zinc-700"}`}>Data de Nascimento</Label>
                  <Input id="birthDate" type="date" value={birthDate}
                    onChange={(e) => {
                      setBirthDate(e.target.value);
                      setBirthDateError("");
                    }}
                    aria-invalid={!!birthDateError}
                    className={`bg-zinc-50 rounded-xl h-10 text-sm ${birthDateError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "border-zinc-200"}`} />
                  {birthDateError && <p className="text-xs text-red-500">{birthDateError}</p>}
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label htmlFor="phone" className={`text-xs font-semibold ${phoneError ? "text-red-500" : "text-zinc-700"}`}>Contato *</Label>
                  <Input id="phone" placeholder="(00) 00000-0000" value={phone}
                    onChange={(e) => {
                      setPhone(formatPhone(e.target.value));
                      setPhoneError("");
                    }} maxLength={15}
                    aria-invalid={!!phoneError}
                    className={`bg-zinc-50 rounded-xl h-10 text-sm ${phoneError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "border-zinc-200"}`} />
                  {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label htmlFor="email" className={`text-xs font-semibold ${emailError ? "text-red-500" : "text-zinc-700"}`}>E-mail</Label>
                  <Input id="email" type="email" placeholder="email@exemplo.com" value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                    }}
                    aria-invalid={!!emailError}
                    className={`bg-zinc-50 rounded-xl h-10 text-sm ${emailError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "border-zinc-200"}`} />
                  {emailError && <p className="text-xs text-red-500">{emailError}</p>}
                </div>
              </div>
            </div>

            {/* Seção 2: Endereço */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                <MapPin className="h-5 w-5 text-zinc-500" />
                <h3 className="font-semibold text-zinc-900 text-base">Endereço</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-1.5 col-span-3 sm:col-span-1">
                  <Label htmlFor="cep" className={`text-xs font-semibold ${cepError ? "text-red-500" : "text-zinc-700"}`}>CEP</Label>
                  <div className="flex gap-2">
                    <Input id="cep" placeholder="00000-000" value={cep}
                      onChange={(e) => {
                        setCep(formatCEP(e.target.value));
                        setCepError("");
                      }} maxLength={9}
                      aria-invalid={!!cepError}
                      className={`bg-zinc-50 rounded-xl h-10 text-sm font-mono flex-1 ${cepError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "border-zinc-200"}`} />
                    <button type="button" onClick={handleCepSearch} disabled={isSearchingCep}
                      className="h-10 w-10 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 rounded-xl text-zinc-600 transition-colors border border-zinc-200 shrink-0 cursor-pointer">
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                  {cepError && <p className="text-xs text-red-500">{cepError}</p>}
                </div>

                <div className="space-y-1.5 col-span-3 sm:col-span-2">
                  <Label htmlFor="street" className="text-xs font-semibold text-zinc-700">Endereço/Rua/Bairro/Cidade</Label>
                  <Input id="street" placeholder="Ex: Av. Paulista, 1000 - Bela Vista" value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="bg-zinc-50 border-zinc-200 rounded-xl h-10 text-sm" />
                </div>

                <div className="space-y-1.5 col-span-3 sm:col-span-1">
                  <Label htmlFor="number" className="text-xs font-semibold text-zinc-700">Número</Label>
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
            </div>

            {/* Seção 3: Motocicleta */}
            {!client && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                  <FaMotorcycle className="h-5 w-5 text-zinc-500" />
                  <h3 className="font-semibold text-zinc-900 text-base">Motocicleta (Opcional)</h3>
                </div>
                
                <div className="space-y-4">
                  <label htmlFor="hasBike" className="flex items-center gap-3 cursor-pointer select-none pb-1">
                    <input
                      type="checkbox"
                      id="hasBike"
                      checked={hasBike}
                      onChange={(e) => setHasBike(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 accent-zinc-900 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-zinc-700">Vincular uma moto agora</span>
                  </label>

                  {hasBike && (
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 border border-zinc-100 p-4 rounded-xl bg-zinc-50/50 animate-fade-in">
                      <div className="space-y-1.5 col-span-2">
                        <Label className={`text-xs font-semibold ${bikeBrandError ? "text-red-500" : "text-zinc-700"}`}>Marca *</Label>
                        <Select onValueChange={(val) => { setBikeBrand(val ?? ""); setBikeBrandError(""); setBikeChassiError(""); }} value={bikeBrand}>
                          <SelectTrigger className={`bg-white rounded-xl h-10 ${bikeBrandError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "border-zinc-200"}`}>
                            <SelectValue placeholder="Selecione a marca" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-zinc-100 rounded-xl shadow-lg">
                            {["Honda","Yamaha","BMW","Triumph","Kawasaki","Suzuki","Harley-Davidson","Ducati","Husqvarna","Royal Enfield","CF Motos","Haojue","Bajaj","Outra"].map(
                              (b) => <SelectItem key={b} value={b}>{b}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {bikeBrandError && <p className="text-xs text-red-500 font-semibold">{bikeBrandError}</p>}
                      </div>

                      {bikeBrand === "Outra" && (
                        <div className="space-y-1.5 col-span-2">
                          <Label className={`text-xs font-semibold ${bikeBrandError ? "text-red-500" : "text-zinc-700"}`}>Nome da Marca *</Label>
                          <Input 
                            placeholder="Digite a marca da moto" 
                            value={bikeCustomBrand} 
                            onChange={(e) => {
                              setBikeCustomBrand(e.target.value);
                              setBikeBrandError("");
                              setBikeChassiError("");
                            }}
                            className={`bg-white rounded-xl h-10 text-sm ${bikeBrandError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "border-zinc-200"}`}
                          />
                        </div>
                      )}

                      <div className="space-y-1.5 col-span-2">
                        <Label className={`text-xs font-semibold ${bikeModelError ? "text-red-500" : "text-zinc-700"}`}>Modelo/cc *</Label>
                        <Input placeholder="Ex: Hornet / R 1200 GS" value={bikeModel}
                          onChange={(e) => {
                            setBikeModel(e.target.value);
                            setBikeModelError("");
                          }}
                          className={`bg-white rounded-xl h-10 text-sm ${bikeModelError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "border-zinc-200"}`} />
                        {bikeModelError && <p className="text-xs text-red-500 font-semibold">{bikeModelError}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label className={`text-xs font-semibold ${bikeYearError ? "text-red-500" : "text-zinc-700"}`}>Ano *</Label>
                        <Input placeholder="Ex: 2021" value={bikeYear}
                          onChange={(e) => {
                            setBikeYear(e.target.value);
                            setBikeYearError("");
                          }}
                          className={`bg-white rounded-xl h-10 text-sm ${bikeYearError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "border-zinc-200"}`} />
                        {bikeYearError && <p className="text-xs text-red-500 font-semibold">{bikeYearError}</p>}
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

                      {((bikeBrand === "Outra" ? bikeCustomBrand : bikeBrand).toLowerCase() === "bmw" || (bikeBrand === "Outra" ? bikeCustomBrand : bikeBrand).toLowerCase() === "triumph") && (
                        <>
                          <div className="space-y-1.5 col-span-2">
                            <Label className={`text-xs font-semibold ${bikeChassiError ? "text-red-500" : "text-zinc-700"}`}>Chassi *</Label>
                            <Input
                              placeholder="Ex: 9BW12345678901234"
                              value={bikeChassi}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\s+/g, "").toUpperCase();
                                setBikeChassi(val);
                                setBikeChassiError("");
                              }}
                              maxLength={17}
                              className={`bg-white rounded-xl h-10 text-sm font-mono uppercase ${bikeChassiError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "border-zinc-200"}`}
                            />
                            {bikeChassiError && <p className="text-xs text-red-500 font-semibold">{bikeChassiError}</p>}
                          </div>

                          <div className="space-y-1.5 col-span-2">
                            <Label className="text-xs font-semibold text-zinc-500">VIN (Não editável)</Label>
                            <Input
                              value={getDerivedBikeVin(bikeBrand === "Outra" ? bikeCustomBrand : bikeBrand, bikeChassi)}
                              readOnly
                              disabled
                              className="bg-zinc-100 border-zinc-200 text-zinc-500 rounded-xl h-10 text-sm font-mono uppercase cursor-not-allowed select-none"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-3 pt-4 border-t border-zinc-100">
              <button type="button" onClick={onCancel}
                className="flex-1 sm:flex-none px-5 py-2.5 border border-zinc-200 bg-white text-zinc-700 font-semibold rounded-xl text-sm transition-colors hover:bg-zinc-50 cursor-pointer">
                Cancelar
              </button>
              <button type="submit"
                className="flex-1 sm:flex-none px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl text-sm transition-all shadow-sm cursor-pointer">
                Salvar Cadastro
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
