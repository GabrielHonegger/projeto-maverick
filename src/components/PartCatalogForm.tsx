import React, { useState } from "react";
import { ArrowLeft, Package, Plus, Trash2, Bike, HelpCircle } from "lucide-react";
import { FaMotorcycle } from "react-icons/fa6";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PartCatalogItem, SpecificBike } from "@/types";

interface PartCatalogFormProps {
  part?: PartCatalogItem;
  onSave: (
    part: Omit<PartCatalogItem, "id" | "createdAt" | "active"> & { id?: string }
  ) => void;
  onCancel: () => void;
}

export default function PartCatalogForm({ part, onSave, onCancel }: PartCatalogFormProps) {
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [brandError, setBrandError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [modelError, setModelError] = useState("");

  const [name, setName] = useState(part?.name || "");
  const [brand, setBrand] = useState(part?.brand || "");
  const [code, setCode] = useState(part?.code || "");
  const [model, setModel] = useState(part?.model || "");
  const [technicalSpecifications, setTechnicalSpecifications] = useState(part?.technicalSpecifications || "");
  const [measurements, setMeasurements] = useState(part?.measurements || "");
  const [price, setPrice] = useState(part ? part.price.toString() : "");
  const [cost, setCost] = useState(part ? part.cost.toString() : "");

  // Specific motorbikes list
  const [specificBikes, setSpecificBikes] = useState<SpecificBike[]>(part?.specificBikes || []);

  // Form states for adding specific bike
  const [newBrand, setNewBrand] = useState("");
  const [newCustomBrand, setNewCustomBrand] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newCc, setNewCc] = useState("");
  const [bikeFormError, setBikeFormError] = useState("");

  const handleAddSpecificBike = (e: React.MouseEvent) => {
    e.preventDefault();
    setBikeFormError("");

    const resolvedBrand = newBrand === "Outra" ? newCustomBrand : newBrand;

    if (!resolvedBrand.trim()) {
      setBikeFormError("A marca da moto é obrigatória.");
      return;
    }
    if (!newModel.trim()) {
      setBikeFormError("O modelo da moto é obrigatório.");
      return;
    }
    if (!newCc.trim()) {
      setBikeFormError("A cilindrada (CC) é obrigatória.");
      return;
    }

    const newBike: SpecificBike = {
      brand: resolvedBrand.trim(),
      model: newModel.trim(),
      cc: newCc.trim(),
    };

    setSpecificBikes((prev) => [...prev, newBike]);
    setNewBrand("");
    setNewCustomBrand("");
    setNewModel("");
    setNewCc("");
  };

  const handleRemoveSpecificBike = (index: number) => {
    setSpecificBikes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNameError("");
    setBrandError("");
    setCodeError("");
    setModelError("");

    let hasError = false;

    if (!name.trim()) {
      setNameError("Descrição da Peça é obrigatória.");
      hasError = true;
    }
    if (!brand.trim()) {
      setBrandError("Marca é obrigatória.");
      hasError = true;
    }
    if (!code.trim()) {
      setCodeError("Código da peça é obrigatório.");
      hasError = true;
    }
    if (!model.trim()) {
      setModelError("Modelo da moto é obrigatório.");
      hasError = true;
    }

    const priceNum = parseFloat(price.replace(",", ".")) || 0;
    const costNum = parseFloat(cost.replace(",", ".")) || 0;

    if (hasError) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    onSave({
      id: part?.id,
      name: name.trim(),
      brand: brand.trim(),
      code: code.trim(),
      model: model.trim(),
      technicalSpecifications: technicalSpecifications.trim() || undefined,
      measurements: measurements.trim() || undefined,
      price: priceNum,
      cost: costNum,
      specificBikes,
    });
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onCancel}
          className="h-9 w-9 rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 flex items-center justify-center transition-all duration-150 shadow-sm shrink-0 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            {part ? "Editar Peça" : "Cadastrar Nova Peça"}
          </h1>
          <p className="text-zinc-500 mt-0.5 text-sm hidden sm:block">
            {part
              ? "Atualize as informações da peça do estoque."
              : "Preencha as informações para registrar uma nova peça no catálogo."}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 sm:p-4 bg-red-50 border border-red-100 text-sm font-semibold text-red-600 rounded-xl animate-fade-in">
          {error}
        </div>
      )}

      <Card className="bg-white border-zinc-100 shadow-sm overflow-hidden rounded-2xl">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            {/* Seção 1: Dados Gerais */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                <Package className="h-5 w-5 text-zinc-500" />
                <h3 className="font-semibold text-zinc-900 text-base">Dados Gerais da Peça</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Nome/Descrição */}
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="name" className={`text-xs font-semibold ${nameError ? "text-red-500" : "text-zinc-700"}`}>
                    Descrição da Peça *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ex: Pastilha de Freio Dianteira"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setNameError("");
                    }}
                    className={`bg-zinc-50 rounded-xl h-10 text-sm ${
                      nameError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "border-zinc-200"
                    }`}
                  />
                  {nameError && <p className="text-xs text-red-500">{nameError}</p>}
                </div>

                {/* Marca e Código */}
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label htmlFor="brand" className={`text-xs font-semibold ${brandError ? "text-red-500" : "text-zinc-700"}`}>
                    Marca da Peça *
                  </Label>
                  <Input
                    id="brand"
                    placeholder="Ex: Cobreq / Motul"
                    value={brand}
                    onChange={(e) => {
                      setBrand(e.target.value);
                      setBrandError("");
                    }}
                    className={`bg-zinc-50 rounded-xl h-10 text-sm ${
                      brandError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "border-zinc-200"
                    }`}
                  />
                  {brandError && <p className="text-xs text-red-500">{brandError}</p>}
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label htmlFor="code" className={`text-xs font-semibold ${codeError ? "text-red-500" : "text-zinc-700"}`}>
                    Código da Peça *
                  </Label>
                  <Input
                    id="code"
                    placeholder="Ex: CB-1020-F"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setCodeError("");
                    }}
                    className={`bg-zinc-50 rounded-xl h-10 text-sm font-mono ${
                      codeError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "border-zinc-200"
                    }`}
                  />
                  {codeError && <p className="text-xs text-red-500">{codeError}</p>}
                </div>

                {/* Modelo Moto */}
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="model" className={`text-xs font-semibold ${modelError ? "text-red-500" : "text-zinc-700"}`}>
                    Modelo da Moto (Principal) *
                  </Label>
                  <Input
                    id="model"
                    placeholder="Ex: Hornet CB 600 / CG 160 Titan"
                    value={model}
                    onChange={(e) => {
                      setModel(e.target.value);
                      setModelError("");
                    }}
                    className={`bg-zinc-50 rounded-xl h-10 text-sm ${
                      modelError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "border-zinc-200"
                    }`}
                  />
                  {modelError && <p className="text-xs text-red-500">{modelError}</p>}
                </div>

                {/* Specs e Medidas */}
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label htmlFor="technicalSpecifications" className="text-xs font-semibold text-zinc-700">
                    Especificações Técnicas
                  </Label>
                  <Input
                    id="technicalSpecifications"
                    placeholder="Ex: Sinterizada / Semissintético"
                    value={technicalSpecifications}
                    onChange={(e) => setTechnicalSpecifications(e.target.value)}
                    className="bg-zinc-50 rounded-xl h-10 border-zinc-200 text-sm"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label htmlFor="measurements" className="text-xs font-semibold text-zinc-700">
                    Medidas
                  </Label>
                  <Input
                    id="measurements"
                    placeholder="Ex: 10mmX5mmX2mm / 1 Litro"
                    value={measurements}
                    onChange={(e) => setMeasurements(e.target.value)}
                    className="bg-zinc-50 rounded-xl h-10 border-zinc-200 text-sm"
                  />
                </div>

                {/* Valores (Custo e Venda) */}
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label htmlFor="cost" className="text-xs font-semibold text-zinc-700">
                    Preço de Custo Sugerido (R$)
                  </Label>
                  <Input
                    id="cost"
                    placeholder="Ex: 45,00"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="bg-zinc-50 rounded-xl h-10 border-zinc-200 text-sm"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label htmlFor="price" className="text-xs font-semibold text-zinc-700">
                    Preço de Venda Sugerido (R$)
                  </Label>
                  <Input
                    id="price"
                    placeholder="Ex: 85,00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="bg-zinc-50 rounded-xl h-10 border-zinc-200 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Seção 2: Cadastro de Motos Específicas / Compatibilidades */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                <Bike className="h-5 w-5 text-zinc-500" />
                <h3 className="font-semibold text-zinc-900 text-base">Outras Motos Compatíveis (Opcional)</h3>
              </div>

              {/* Form to add compatibility */}
              <div className="border border-zinc-300 p-4 rounded-2xl bg-zinc-50/50 space-y-3">
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                  Adicionar Compatibilidade Específica
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {/* Brand */}
                  <div className="space-y-1.5 col-span-3 sm:col-span-1">
                    <Label className="text-[10px] font-bold text-zinc-600">Marca</Label>
                    <Select onValueChange={(val) => { setNewBrand(val ?? ""); setBikeFormError(""); }} value={newBrand}>
                      <SelectTrigger className="bg-white border-zinc-200 rounded-xl h-9 text-xs">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-zinc-100 rounded-xl shadow-lg">
                        {["Honda","Yamaha","BMW","Triumph","Kawasaki","Suzuki","Harley-Davidson","Ducati","Husqvarna","Royal Enfield","CF Motos","Haojue","Bajaj","Outra"].map(
                          (b) => <SelectItem key={b} value={b}>{b}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Model */}
                  <div className="space-y-1.5 col-span-3 sm:col-span-1">
                    <Label className="text-[10px] font-bold text-zinc-600">Modelo</Label>
                    <Input
                      placeholder="Ex: CB 300R"
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      className="bg-white border-zinc-200 rounded-xl h-9 text-xs"
                    />
                  </div>

                  {/* CC */}
                  <div className="space-y-1.5 col-span-3 sm:col-span-1">
                    <Label className="text-[10px] font-bold text-zinc-600">Cilindrada (CC)</Label>
                    <Input
                      placeholder="Ex: 300cc"
                      value={newCc}
                      onChange={(e) => setNewCc(e.target.value)}
                      className="bg-white border-zinc-200 rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                {newBrand === "Outra" && (
                  <div className="space-y-1.5 animate-fade-in">
                    <Label className="text-[10px] font-bold text-zinc-600">Nome da Marca Customizada *</Label>
                    <Input
                      placeholder="Ex: Dafra"
                      value={newCustomBrand}
                      onChange={(e) => setNewCustomBrand(e.target.value)}
                      className="bg-white border-zinc-200 rounded-xl h-9 text-xs"
                    />
                  </div>
                )}

                {bikeFormError && (
                  <p className="text-[11px] font-semibold text-red-500">{bikeFormError}</p>
                )}

                <button
                  type="button"
                  onClick={handleAddSpecificBike}
                  className="mt-2 inline-flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[11px] tracking-wide px-3.5 py-1.5 rounded-xl transition-all duration-150 shadow-sm cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  ADICIONAR COMPATIBILIDADE
                </button>
              </div>

              {/* List of specific bikes */}
              {specificBikes.length > 0 ? (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  <Label className="text-xs font-semibold text-zinc-700">Motos Compatíveis Cadastradas</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {specificBikes.map((bike, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2.5 border border-zinc-300 rounded-xl bg-white shadow-sm hover:border-zinc-200 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <Bike className="h-4 w-4 text-zinc-400 shrink-0" />
                          <div className="text-left">
                            <p className="text-xs font-bold text-zinc-800">
                              {bike.brand} - {bike.model}
                            </p>
                            <p className="text-[10px] font-semibold text-zinc-450">{bike.cc}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecificBike(index)}
                          className="p-1.5 text-zinc-400 hover:text-red-550 hover:bg-red-50/20 rounded-lg transition-colors cursor-pointer"
                          title="Remover"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-zinc-200 p-6 rounded-2xl text-center">
                  <FaMotorcycle className="h-6 w-6 text-zinc-300 mx-auto mb-1.5" />
                  <p className="text-[11px] font-semibold text-zinc-450">
                    Nenhuma moto compatível adicional registrada. Esta peça estará vinculada principalmente ao modelo principal informado.
                  </p>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-5 py-2.5 border border-zinc-200 bg-white text-zinc-700 font-semibold rounded-xl text-sm transition-colors hover:bg-zinc-50 cursor-pointer"
              >
                Cancelar
              </button>
              <div className="flex flex-1 gap-3 justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold rounded-xl text-sm transition-all shadow-sm cursor-pointer"
                >
                  {part ? "Salvar Alterações" : "Salvar Peça"}
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
