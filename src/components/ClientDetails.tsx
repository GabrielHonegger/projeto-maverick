import React, { useState } from "react";
import {
  ArrowLeft, User, Phone, Mail, Calendar, MapPin,
  Plus, FileText, Trash2, KeyRound, Pencil,
} from "lucide-react";
import { FaMotorcycle } from "react-icons/fa6";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client, Motorbike } from "@/types";
import Link from "next/link";

interface ClientDetailsProps {
  client: Client;
  bikes: Motorbike[];
  onBack: () => void;
  onAddBike: (bike: Omit<Motorbike, "id" | "createdAt">) => void;
  onDeleteBike?: (bikeId: string) => void;
  onEditClient: () => void;
  onEditBike?: (bikeId: string, bike: Omit<Motorbike, "id" | "clientId" | "createdAt">) => void;
}

export default function ClientDetails({
  client, bikes, onBack, onAddBike, onDeleteBike, onEditClient, onEditBike,
}: ClientDetailsProps) {
  const [isAddBikeOpen, setIsAddBikeOpen] = useState(false);
  const [editingBike, setEditingBike] = useState<Motorbike | null>(null);
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [brand, setBrand] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");
  const [chassi, setChassi] = useState("");
  const [error, setError] = useState("");
  const [brandError, setBrandError] = useState("");
  const [modelError, setModelError] = useState("");
  const [yearError, setYearError] = useState("");
  const [chassiError, setChassiError] = useState("");

  const clientBikes = bikes.filter((b) => b.clientId === client.id);

  const getDerivedVin = (brandName: string, chassiVal: string) => {
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

  const handleEditClick = (bike: Motorbike) => {
    setEditingBike(bike);
    const predefinedBrands = ["Honda", "Yamaha", "BMW", "Triumph", "Kawasaki", "Suzuki", "Harley-Davidson", "Ducati", "Husqvarna", "Royal Enfield", "CF Motos", "Haojue", "Bajaj"];
    if (predefinedBrands.includes(bike.brand)) {
      setBrand(bike.brand);
      setCustomBrand("");
    } else {
      setBrand("Outra");
      setCustomBrand(bike.brand);
    }
    setModel(bike.model);
    setYear(bike.year);
    setColor(bike.color);
    setPlate(bike.plate);
    setChassi(bike.vin);
    setError("");
    setBrandError("");
    setModelError("");
    setYearError("");
    setChassiError("");
    setIsAddBikeOpen(true);
  };

  const handleAddClick = () => {
    setEditingBike(null);
    setBrand("");
    setCustomBrand("");
    setModel("");
    setYear("");
    setColor("");
    setPlate("");
    setChassi("");
    setError("");
    setBrandError("");
    setModelError("");
    setYearError("");
    setChassiError("");
    setIsAddBikeOpen(true);
  };

  const handleAddBikeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBrandError("");
    setModelError("");
    setYearError("");
    setChassiError("");

    let hasValError = false;
    const resolvedBrand = brand === "Outra" ? customBrand : brand;

    if (!resolvedBrand.trim()) {
      setBrandError("A marca é obrigatória.");
      hasValError = true;
    }
    if (!model.trim()) {
      setModelError("O modelo é obrigatório.");
      hasValError = true;
    }
    if (!year.trim()) {
      setYearError("O ano é obrigatório.");
      hasValError = true;
    }

    const isBmwOrTriumph = resolvedBrand.toLowerCase() === "bmw" || resolvedBrand.toLowerCase() === "triumph";

    let cleanChassi = "";
    if (isBmwOrTriumph) {
      cleanChassi = chassi.replace(/\s+/g, "");
      if (!cleanChassi) {
        setChassiError("O chassi é obrigatório.");
        hasValError = true;
      } else if (cleanChassi.length !== 17) {
        setChassiError("O chassi deve conter exatamente 17 caracteres.");
        hasValError = true;
      }
    }

    if (hasValError) {
      return;
    }

    const derivedVin = isBmwOrTriumph ? getDerivedVin(resolvedBrand, cleanChassi) : "";

    if (editingBike) {
      if (onEditBike) {
        onEditBike(editingBike.id, {
          model,
          year,
          color: color || "",
          brand: resolvedBrand,
          plate: plate.toUpperCase() || "",
          vin: derivedVin,
        });
      }
    } else {
      onAddBike({
        clientId: client.id,
        model,
        year,
        color: color || "",
        brand: resolvedBrand,
        plate: plate.toUpperCase() || "",
        vin: derivedVin
      });
    }

    setModel(""); 
    setYear(""); 
    setColor(""); 
    setBrand(""); 
    setCustomBrand("");
    setPlate(""); 
    setChassi("");
    setVin("");
    setEditingBike(null);
    setIsAddBikeOpen(false);
  };

  const getBrandStyle = (brandName: string) => {
    const b = brandName.toLowerCase();
    if (b === "bmw") return { pill: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" };
    if (b === "triumph") return { pill: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" };
    if (b === "honda") return { pill: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500" };
    if (b === "yamaha") return { pill: "bg-sky-50 text-sky-700 border-sky-100", dot: "bg-sky-500" };
    return { pill: "bg-zinc-50 text-zinc-600 border-zinc-100", dot: "bg-zinc-400" };
  };

  const BRAND_LOGOS: Record<string, string> = {
    "bmw": "/marcas/bmw.png",
    "ducati": "/marcas/ducati.png",
    "harley-davidson": "/marcas/harley-davidson.png",
    "harley davidson": "/marcas/harley-davidson.png",
    "honda": "/marcas/honda.png",
    "husqvarna": "/marcas/husqvarna.png",
    "kmt": "/marcas/kmt.png",
    "ktm": "/marcas/kmt.png",
    "royal-enfield": "/marcas/royal-enfield.png",
    "royal enfield": "/marcas/royal-enfield.png",
    "suzuki": "/marcas/suzuki.png",
    "triumph": "/marcas/triumph.png",
    "yamaha": "/marcas/yamaha.png",
    "cf-motos": "/marcas/cf-motos.png",
    "cf motos": "/marcas/cf-motos.png",
    "kawasaki": "/marcas/kawasaki.png",
    "haojue": "/marcas/haojue.png",
    "bajaj": "/marcas/bajaj.png"
  };

  const renderBrandLogo = (brandName: string, className = "h-6") => {
    const normalized = brandName.toLowerCase().trim();
    const logoPath = BRAND_LOGOS[normalized];
    if (logoPath) {
      return (
        <img
          src={logoPath}
          alt={brandName}
          className={`${className} object-contain max-w-[80px] h-5 sm:h-6`}
        />
      );
    }
    const brandStyle = getBrandStyle(brandName);
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wide shrink-0 ${brandStyle.pill}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${brandStyle.dot}`} />
        {brandName}
      </span>
    );
  };

  const initials = client.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const infoFields = [
    { icon: FileText, label: "CPF", value: client.cpf || "Não informado", mono: !!client.cpf },
    { icon: Phone, label: "Contato", value: client.phone },
    { icon: Mail, label: "E-mail", value: client.email || "Não informado" },
    { icon: Calendar, label: "Nascimento", value: client.birthDate ? new Date(client.birthDate).toLocaleDateString("pt-BR") : "Não informado" },
    { icon: User, label: "Sexo", value: client.gender || "Não informado" },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in">
      {/* Back + Header */}
      <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/clientes"
            className="h-9 w-9 rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 flex items-center justify-center transition-all duration-150 shadow-sm shrink-0 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">Perfil do Cliente</h1>
            <p className="text-zinc-500 mt-0.5 text-sm hidden sm:block">Dados cadastrais e motos associadas.</p>
          </div>
        </div>
        <Link
          href={`/clientes/${client.id}/editar`}
          className="inline-flex items-center gap-1.5 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all duration-150 shadow-sm shrink-0 cursor-pointer"
        >
          Editar Cliente
        </Link>
      </div>

      {/* Main grid — stacks on mobile */}
      <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
        {/* Left column */}
        <div className="md:col-span-1 space-y-4">
          {/* Demographics card */}
          <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden">
            {/* Avatar header — centered on mobile, left-aligned on md+ */}
            <div className="bg-zinc-50 border-b border-zinc-100 p-5 flex flex-col items-center text-center md:flex-row md:text-left md:gap-4">
              <div className="h-16 w-16 md:h-12 md:w-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white font-bold text-2xl md:text-lg shrink-0 mb-3 md:mb-0">
                {initials}
              </div>
              <div className="min-w-0 w-full">
                <p className="font-bold text-zinc-900 text-base leading-tight truncate">{client.name}</p>
                {client.nickname && <p className="text-xs text-zinc-400 mt-0.5">{client.nickname}</p>}
              </div>
            </div>

            {/* Info fields — single col on mobile, 1-col on md */}
            <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
              {infoFields.map(({ icon: Icon, label, value, mono }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-3.5 w-3.5 text-zinc-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">{label}</p>
                    <p className={`text-sm font-medium text-zinc-800 mt-0.5 break-words ${mono ? "font-mono text-xs" : ""}`}>
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Address card */}
          <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-zinc-400" />
              <p className="text-sm font-bold text-zinc-900">Endereço</p>
            </div>
            <div className="space-y-3">
              {client.address.street || client.address.number ? (
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">Logradouro</p>
                  <p className="text-sm font-medium text-zinc-800 mt-0.5 break-words">
                    {client.address.street || "Sem logradouro"}
                    {client.address.number ? `, Nº ${client.address.number}` : ""}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">Logradouro</p>
                  <p className="text-sm font-medium text-zinc-450 mt-0.5 italic">Não informado</p>
                </div>
              )}
              {client.address.complement && (
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">Complemento</p>
                  <p className="text-sm font-medium text-zinc-800 mt-0.5">{client.address.complement}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">CEP</p>
                <p className="text-sm font-medium text-zinc-800 mt-0.5 font-mono text-xs">
                  {client.address.cep || "Não informado"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Bikes */}
        <div className="md:col-span-2">
          <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                  <FaMotorcycle className="h-4 w-4 text-zinc-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">Motos Registradas</p>
                  <p className="text-xs text-zinc-400">
                    {clientBikes.length} {clientBikes.length === 1 ? "veículo" : "veículos"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleAddClick}
                className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-3 sm:px-3.5 py-2 rounded-xl transition-all duration-150 shadow-sm shrink-0 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Vincular Moto</span>
                <span className="sm:hidden">Vincular</span>
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {clientBikes.length === 0 ? (
                <div className="py-12 sm:py-16 text-center">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                    <FaMotorcycle className="h-6 w-6 sm:h-7 sm:w-7 text-zinc-300" />
                  </div>
                  <p className="font-semibold text-zinc-700 text-sm">Nenhuma moto vinculada</p>
                  <p className="text-xs text-zinc-400 mt-1">Este cliente ainda não possui motos associadas.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clientBikes.map((bike) => {
                    return (
                      <div
                        key={bike.id}
                        className="border border-zinc-100 rounded-xl p-4 sm:p-5 relative group hover:border-zinc-200 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                          {onEditBike && (
                            <button
                              onClick={() => handleEditClick(bike)}
                              className="h-7 w-7 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                              title="Editar Moto"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {onDeleteBike && (
                            <button
                              onClick={() => onDeleteBike(bike.id)}
                              className="h-7 w-7 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir Moto"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Title row */}
                        <div className="flex items-center gap-2 mb-3 pr-8 sm:pr-0 flex-wrap">
                          <p className="font-bold text-zinc-900">{bike.model}</p>
                          <span className="text-zinc-400 text-sm">·</span>
                          <span className="text-sm text-zinc-500">{bike.year}</span>
                          {renderBrandLogo(bike.brand)}
                        </div>

                        {/* Details — 2 cols on mobile, 3 on sm+ */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <p className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider mb-0.5">Cor</p>
                            <p className="font-semibold text-zinc-700">{bike.color}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider mb-0.5">Placa</p>
                            <span className="font-mono font-bold text-zinc-700 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-lg tracking-widest">
                              {bike.plate}
                            </span>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <p className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider mb-0.5 flex items-center gap-1">
                              <KeyRound className="h-3 w-3" />
                              Chassis
                              {bike.brand.toLowerCase() === "bmw" && (
                                <span className="text-blue-500 normal-case font-normal">(7 díg.)</span>
                              )}
                              {bike.brand.toLowerCase() === "triumph" && (
                                <span className="text-amber-500 normal-case font-normal">(6 núm.)</span>
                              )}
                            </p>
                            <span className="font-mono text-zinc-700 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-lg">
                              {bike.vin}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add Bike */}
      <Dialog open={isAddBikeOpen} onOpenChange={setIsAddBikeOpen}>
        <DialogContent className="bg-white border-zinc-100 rounded-2xl max-w-md shadow-xl mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-900">
              {editingBike ? "Editar Informações da Moto" : "Vincular Nova Moto"}
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">
              {editingBike ? "Atualizar os dados da moto de " : "Associar moto a "}
              <span className="font-semibold text-zinc-600">{client.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddBikeSubmit} className="space-y-3 pt-1">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-xs font-semibold text-red-600 rounded-xl">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label className={`text-xs font-semibold ${brandError ? "text-red-500" : "text-zinc-700"}`}>Marca *</Label>
                <Select onValueChange={(val) => { setBrand(val ?? ""); setBrandError(""); setChassiError(""); }} value={brand}>
                  <SelectTrigger className={`bg-zinc-50 rounded-xl h-10 ${brandError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "border-zinc-200"}`}>
                    <SelectValue placeholder="Selecione a marca" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-zinc-100 rounded-xl shadow-lg">
                    {["Honda", "Yamaha", "BMW", "Triumph", "Kawasaki", "Suzuki", "Harley-Davidson", "Ducati", "Husqvarna", "Royal Enfield", "CF Motos", "Haojue", "Bajaj", "Outra"].map(
                      (b) => <SelectItem key={b} value={b}>{b}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {brandError && <p className="text-xs text-red-500 font-semibold">{brandError}</p>}
              </div>

              {brand === "Outra" && (
                <div className="space-y-1.5 col-span-2">
                  <Label className={`text-xs font-semibold ${brandError ? "text-red-500" : "text-zinc-700"}`}>Nome da Marca *</Label>
                  <Input 
                    placeholder="Digite a marca da moto" 
                    value={customBrand} 
                    onChange={(e) => {
                      setCustomBrand(e.target.value);
                      setBrandError("");
                      setChassiError("");
                    }}
                    className={`bg-zinc-50 rounded-xl h-10 text-sm ${brandError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "border-zinc-200"}`}
                  />
                </div>
              )}

              <div className="space-y-1.5 col-span-2">
                <Label className={`text-xs font-semibold ${modelError ? "text-red-500" : "text-zinc-700"}`}>Modelo/cc *</Label>
                <Input placeholder="Ex: R 1250 GS" value={model} 
                  onChange={(e) => {
                    setModel(e.target.value);
                    setModelError("");
                  }}
                  className={`bg-zinc-50 rounded-xl h-10 text-sm ${modelError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "border-zinc-200"}`} />
                {modelError && <p className="text-xs text-red-500 font-semibold">{modelError}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className={`text-xs font-semibold ${yearError ? "text-red-500" : "text-zinc-700"}`}>Ano *</Label>
                <Input placeholder="Ex: 2023" value={year} 
                  onChange={(e) => {
                    setYear(e.target.value);
                    setYearError("");
                  }}
                  className={`bg-zinc-50 rounded-xl h-10 text-sm ${yearError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "border-zinc-200"}`} />
                {yearError && <p className="text-xs text-red-500 font-semibold">{yearError}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-700">Cor</Label>
                <Input placeholder="Ex: Preta" value={color} onChange={(e) => setColor(e.target.value)}
                  className="bg-zinc-50 border-zinc-200 rounded-xl h-10 text-sm" />
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs font-semibold text-zinc-700">Placa</Label>
                <Input placeholder="Ex: ABC1D23" value={plate} onChange={(e) => setPlate(e.target.value)}
                  className="bg-zinc-50 border-zinc-200 rounded-xl h-10 text-sm uppercase font-mono tracking-widest" />
              </div>

              {((brand === "Outra" ? customBrand : brand).toLowerCase() === "bmw" || (brand === "Outra" ? customBrand : brand).toLowerCase() === "triumph") && (
                <>
                  <div className="space-y-1.5 col-span-2">
                    <Label className={`text-xs font-semibold ${chassiError ? "text-red-500" : "text-zinc-700"}`}>Chassi *</Label>
                    <Input
                      placeholder="Ex: 9BW12345678901234"
                      value={chassi}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\s+/g, "").toUpperCase();
                        setChassi(val);
                        setChassiError("");
                      }}
                      maxLength={17}
                      className={`bg-zinc-50 rounded-xl h-10 text-sm font-mono uppercase ${chassiError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "border-zinc-200"}`}
                    />
                    {chassiError && <p className="text-xs text-red-500 font-semibold">{chassiError}</p>}
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs font-semibold text-zinc-500">VIN (Não editável)</Label>
                    <Input
                      value={getDerivedVin(brand === "Outra" ? customBrand : brand, chassi)}
                      readOnly
                      disabled
                      className="bg-zinc-100 border-zinc-200 text-zinc-500 rounded-xl h-10 text-sm font-mono uppercase cursor-not-allowed select-none"
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="pt-2 flex-row gap-2">
              <button type="button" onClick={() => setIsAddBikeOpen(false)}
                className="flex-1 sm:flex-none px-4 py-2.5 border border-zinc-200 bg-white text-zinc-700 rounded-xl text-sm font-semibold hover:bg-zinc-50 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button type="submit"
                className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer">
                {editingBike ? "Salvar Alterações" : "Adicionar Moto"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
