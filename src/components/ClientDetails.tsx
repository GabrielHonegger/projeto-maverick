import React, { useState } from "react";
import { ArrowLeft, User, Phone, Mail, Calendar, MapPin, Plus, Bike, FileText, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client, Motorbike } from "@/types";

interface ClientDetailsProps {
  client: Client;
  bikes: Motorbike[];
  onBack: () => void;
  onAddBike: (bike: Omit<Motorbike, "id" | "createdAt">) => void;
  onDeleteBike?: (bikeId: string) => void;
}

export default function ClientDetails({
  client,
  bikes,
  onBack,
  onAddBike,
  onDeleteBike,
}: ClientDetailsProps) {
  const [isAddBikeOpen, setIsAddBikeOpen] = useState(false);

  // Motorbike form state
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [brand, setBrand] = useState("");
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");
  const [error, setError] = useState("");

  const clientBikes = bikes.filter((b) => b.clientId === client.id);

  // Validation helper
  const handleAddBikeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!model || !year || !color || !brand || !plate || !vin) {
      setError("Por favor, preencha todos os campos da moto.");
      return;
    }

    const cleanVin = vin.replace(/\s+/g, "");

    // Specific Brand Validations
    if (brand.toLowerCase() === "bmw") {
      if (cleanVin.length !== 7) {
        setError("Chassis para BMW deve conter exatamente os 7 últimos dígitos do VIN.");
        return;
      }
    } else if (brand.toLowerCase() === "triumph") {
      if (cleanVin.length !== 6 || !/^\d+$/.test(cleanVin)) {
        setError("Chassis para Triumph deve conter exatamente os 6 últimos números do VIN.");
        return;
      }
    }

    onAddBike({
      clientId: client.id,
      model,
      year,
      color,
      brand,
      plate: plate.toUpperCase(),
      vin: cleanVin.toUpperCase(),
    });

    // Reset Form
    setModel("");
    setYear("");
    setColor("");
    setBrand("");
    setPlate("");
    setVin("");
    setIsAddBikeOpen(false);
  };

  // Helper for brand badge styling
  const getBrandBadge = (brandName: string) => {
    const b = brandName.toLowerCase();
    if (b === "bmw") return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
    if (b === "triumph") return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
    if (b === "honda") return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
    if (b === "yamaha") return "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300";
    return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button and Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Perfil do Cliente
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Detalhes de cadastro e motos associadas.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Demographics and Address */}
        <div className="md:col-span-1 space-y-6">
          {/* Card: Demographics */}
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl">
                  {client.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">{client.name}</CardTitle>
                  {client.nickname && (
                    <CardDescription className="text-zinc-500">
                      Apelido: {client.nickname}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 text-sm">
              <div className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                <FileText className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase font-semibold">CPF</p>
                  <p className="font-medium font-mono text-xs">{client.cpf}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                <Phone className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase font-semibold">Contato</p>
                  <p className="font-medium">{client.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                <Mail className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase font-semibold">E-mail</p>
                  <p className="font-medium">{client.email || "Não informado"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                <Calendar className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase font-semibold">Data de Nascimento</p>
                  <p className="font-medium">{new Date(client.birthDate).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                <User className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase font-semibold">Sexo</p>
                  <p className="font-medium">{client.gender}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Address */}
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MapPin className="h-4.5 w-4.5 text-zinc-400" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Logradouro</span>
                <span className="font-medium">{client.address.street}, Nº {client.address.number}</span>
              </div>
              {client.address.complement && (
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Complemento</span>
                  <span className="font-medium">{client.address.complement}</span>
                </div>
              )}
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">CEP</span>
                <span className="font-medium font-mono text-xs">{client.address.cep}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Motorbikes List */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bike className="h-5 w-5 text-blue-500" />
                  Motos Registradas ({clientBikes.length})
                </CardTitle>
                <CardDescription>Motos vinculadas a este cliente</CardDescription>
              </div>
              <button
                onClick={() => setIsAddBikeOpen(true)}
                className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors border border-zinc-800 dark:border-zinc-700"
              >
                <Plus className="h-4 w-4" />
                Vincular Moto
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              {clientBikes.length === 0 ? (
                <div className="py-16 text-center text-zinc-500">
                  <Bike className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                  <p className="font-semibold">Nenhuma moto vinculada</p>
                  <p className="text-xs text-zinc-400 mt-1">Este cliente ainda não possui motos associadas.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {clientBikes.map((bike) => (
                    <div
                      key={bike.id}
                      className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-xl relative group bg-zinc-50/30 dark:bg-zinc-900/10 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                              {bike.model}
                            </span>
                            <span className="text-xs text-zinc-500">({bike.year})</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getBrandBadge(bike.brand)}`}>
                              {bike.brand}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
                            <div>
                              <span className="text-zinc-400 uppercase font-medium text-[9px] block">Cor</span>
                              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{bike.color}</span>
                            </div>
                            <div>
                              <span className="text-zinc-400 uppercase font-medium text-[9px] block">Placa</span>
                              <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded">{bike.plate}</span>
                            </div>
                            <div className="col-span-2 mt-1">
                              <span className="text-zinc-400 uppercase font-medium text-[9px] block">Chassis / VIN</span>
                              <span className="font-mono text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 text-xs">
                                {bike.vin}
                              </span>
                              {bike.brand.toLowerCase() === "bmw" && (
                                <span className="text-[10px] text-blue-500 dark:text-blue-400 font-semibold ml-2">(7 últimos dígitos)</span>
                              )}
                              {bike.brand.toLowerCase() === "triumph" && (
                                <span className="text-[10px] text-amber-500 dark:text-amber-400 font-semibold ml-2">(6 últimos números)</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {onDeleteBike && (
                          <button
                            onClick={() => onDeleteBike(bike.id)}
                            className="text-zinc-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all opacity-0 group-hover:opacity-100 absolute top-4 right-4"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal: Vincular Moto */}
      <Dialog open={isAddBikeOpen} onOpenChange={setIsAddBikeOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular Nova Moto</DialogTitle>
            <DialogDescription>
              Adicione os detalhes da moto para associá-la a {client.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddBikeSubmit} className="space-y-4 pt-2">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-600 dark:text-red-400 rounded-xl">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Brand Select */}
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="brand">Marca</Label>
                <Select onValueChange={(val) => { setBrand(val ?? ""); setVin(""); }} value={brand}>
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
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  placeholder="Ex: R 1250 GS"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
                />
              </div>

              {/* Year */}
              <div className="space-y-1.5">
                <Label htmlFor="year">Ano</Label>
                <Input
                  id="year"
                  placeholder="Ex: 2023"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
                />
              </div>

              {/* Color */}
              <div className="space-y-1.5">
                <Label htmlFor="color">Cor</Label>
                <Input
                  id="color"
                  placeholder="Ex: Preta"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
                />
              </div>

              {/* Plate */}
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="plate">Placa</Label>
                <Input
                  id="plate"
                  placeholder="Ex: ABC1D23"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl uppercase"
                />
              </div>

              {/* VIN / Chassis */}
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="vin">
                  Chassis / VIN{" "}
                  {brand.toLowerCase() === "bmw" && "(Últimos 7 dígitos)"}
                  {brand.toLowerCase() === "triumph" && "(Últimos 6 números)"}
                </Label>
                <Input
                  id="vin"
                  placeholder={
                    brand.toLowerCase() === "bmw"
                      ? "Ex: Z123456"
                      : brand.toLowerCase() === "triumph"
                      ? "Ex: 123456"
                      : "Ex: 9BW1234567..."
                  }
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  maxLength={brand.toLowerCase() === "bmw" ? 7 : brand.toLowerCase() === "triumph" ? 6 : undefined}
                  className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl uppercase font-mono"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <button
                type="button"
                onClick={() => setIsAddBikeOpen(false)}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Adicionar Moto
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
