import React, { useState, useEffect } from "react";
import { ArrowLeft, Wrench, Plus, Trash2, Bike, HelpCircle } from "lucide-react";
import { FaMotorcycle } from "react-icons/fa6";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Service, SpecificBike } from "@/types";

interface ServiceFormProps {
  service?: Service;
  onSave: (
    service: Omit<Service, "id" | "createdAt" | "active"> & { id?: string }
  ) => void;
  onCancel: () => void;
}

export default function ServiceForm({ service, onSave, onCancel }: ServiceFormProps) {
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [estimatedTimeError, setEstimatedTimeError] = useState("");
  const [ccRangeError, setCcRangeError] = useState("");
  const [categoriesError, setCategoriesError] = useState("");

  const [name, setName] = useState(service?.name || "");
  const [price, setPrice] = useState(service ? service.price.toString() : "");

  const parseEstimatedTime = (timeStr: string) => {
    if (!timeStr) return { hours: "1 hora", minutes: "0 minutos" };
    const hMatch = timeStr.match(/(\d+)\s*h/i);
    const mMatch = timeStr.match(/(\d+)\s*m/i);
    const hVal = hMatch ? hMatch[1] : "0";
    const mVal = mMatch ? mMatch[1] : "0";
    return {
      hours: hVal === "1" ? "1 hora" : `${hVal} horas`,
      minutes: `${mVal} minutos`,
    };
  };

  const initialTime = parseEstimatedTime(service?.estimatedTime || "");
  const [hours, setHours] = useState(initialTime.hours);
  const [minutes, setMinutes] = useState(initialTime.minutes);

  // CC Range selection (radio button behavior - single value)
  const [ccRange, setCcRange] = useState<string>(service?.ccRanges?.[0] || "");
  // Categories selection
  const [categories, setCategories] = useState<string[]>(service?.categories || []);
  // Specific motorbikes list
  const [specificBikes, setSpecificBikes] = useState<SpecificBike[]>(service?.specificBikes || []);

  // Form states for adding specific bike
  const [newBrand, setNewBrand] = useState("");
  const [newCustomBrand, setNewCustomBrand] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newCc, setNewCc] = useState("");
  const [bikeFormError, setBikeFormError] = useState("");

  const ccOptions = ["125cc ATÉ 300cc", "301cc ATÉ 2500cc"];
  const categoryOptions = [
    "Street",
    "Scooter",
    "Esportivas",
    "Naked",
    "Custom",
    "Trail",
    "Big Trail",
    "Off-Road",
  ];


  const handleCcToggle = (cc: string) => {
    setCcRange((prev) => (prev === cc ? "" : cc));
    setCcRangeError("");
  };

  const handleCategoryToggle = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]
    );
    setCategoriesError("");
  };

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
    setPriceError("");
    setEstimatedTimeError("");
    setCcRangeError("");
    setCategoriesError("");

    let hasError = false;

    if (!name.trim()) {
      setNameError("Descrição do Serviço é obrigatória.");
      hasError = true;
    }

    const priceNum = parseFloat(price.replace(",", "."));
    if (!price.trim()) {
      setPriceError("Preço é obrigatório.");
      hasError = true;
    } else if (isNaN(priceNum) || priceNum < 0) {
      setPriceError("Preço deve ser um valor numérico válido.");
      hasError = true;
    }

    if (hours.startsWith("0") && minutes.startsWith("0")) {
      setEstimatedTimeError("Selecione um tempo estimado maior que 0 minutos.");
      hasError = true;
    }

    if (!ccRange) {
      setCcRangeError("Cilindrada é obrigatória.");
      hasError = true;
    }

    if (categories.length === 0) {
      setCategoriesError("Selecione pelo menos uma categoria.");
      hasError = true;
    }

    if (hasError) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const hNum = hours.split(" ")[0];
    const mNum = minutes.split(" ")[0];

    onSave({
      id: service?.id,
      name: name.trim().toUpperCase(),
      price: priceNum,
      estimatedTime: `${hNum}h ${mNum}min`,
      ccRanges: ccRange ? [ccRange] : [],
      categories,
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
            {service ? "Editar Serviço" : "Cadastrar Novo Serviço"}
          </h1>
          <p className="text-zinc-500 mt-0.5 text-sm hidden sm:block">
            {service
              ? "Atualize as informações do serviço."
              : "Preencha as informações para registrar o novo serviço da oficina."}
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
                <Wrench className="h-5 w-5 text-zinc-500" />
                <h3 className="font-semibold text-zinc-900 text-base">Dados Gerais</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="name" className={`text-xs font-semibold ${nameError ? "text-red-500" : "text-zinc-700"}`}>
                    Descrição do Serviço *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ex: Troca de Óleo / Revisão Geral"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setNameError("");
                    }}
                    aria-invalid={!!nameError}
                    className={`bg-zinc-50 rounded-xl h-10 text-sm ${
                      nameError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "border-zinc-200"
                    }`}
                  />
                  {nameError && <p className="text-xs text-red-500">{nameError}</p>}
                </div>

                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="price" className={`text-xs font-semibold ${priceError ? "text-red-500" : "text-zinc-700"}`}>
                    Preço (R$) *
                  </Label>
                  <Input
                    id="price"
                    placeholder="Ex: 150,00"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      setPriceError("");
                    }}
                    aria-invalid={!!priceError}
                    className={`bg-zinc-50 rounded-xl h-10 text-sm ${
                      priceError ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30" : "border-zinc-200"
                    }`}
                  />
                  {priceError && <p className="text-xs text-red-500">{priceError}</p>}
                </div>

                <div className="space-y-1.5 col-span-2">
                  <Label className={`text-xs font-semibold ${estimatedTimeError ? "text-red-500" : "text-zinc-700"}`}>
                    Tempo Estimado *
                  </Label>
                  <div className="flex gap-3 max-w-[280px]">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px] font-bold text-zinc-500">Horas</Label>
                      <Select onValueChange={(val) => { setHours(val || "0 horas"); setEstimatedTimeError(""); }} value={hours}>
                        <SelectTrigger className="bg-zinc-50 border-zinc-200 rounded-xl h-10 text-xs">
                          <SelectValue placeholder="Horas" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-zinc-100 rounded-xl shadow-lg">
                          {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((h) => {
                            const optionText = `${h} ${h === "1" ? "hora" : "horas"}`;
                            return <SelectItem key={h} value={optionText}>{optionText}</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px] font-bold text-zinc-500">Minutos</Label>
                      <Select onValueChange={(val) => { setMinutes(val || "0 minutos"); setEstimatedTimeError(""); }} value={minutes}>
                        <SelectTrigger className="bg-zinc-50 border-zinc-200 rounded-xl h-10 text-xs">
                          <SelectValue placeholder="Minutos" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-zinc-100 rounded-xl shadow-lg">
                          {["0", "15", "30", "45"].map((m) => {
                            const optionText = `${m} ${m === "1" ? "minuto" : "minutos"}`;
                            return <SelectItem key={m} value={optionText}>{optionText}</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
                    <span>Visualização:</span>
                    <span className="bg-zinc-950 text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded shadow-sm tracking-wider">
                      {hours.split(" ")[0]}h{minutes.split(" ")[0] !== "0" ? `${minutes.split(" ")[0]}m` : ""}
                    </span>
                  </div>

                  {estimatedTimeError && <p className="text-xs text-red-500 mt-1 font-semibold">{estimatedTimeError}</p>}
                </div>
              </div>
            </div>

            {/* Seção 2: Filtros de Moto (Displacement & Categories) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                <HelpCircle className="h-5 w-5 text-zinc-500" />
                <h3 className="font-semibold text-zinc-900 text-base">Filtros de Motocicletas</h3>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* CC Ranges */}
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label className={`text-xs font-semibold block pb-1 ${ccRangeError ? "text-red-500" : "text-zinc-700"}`}>
                    Cilindrada (CC) *
                  </Label>
                  <div className="space-y-2.5">
                    {ccOptions.map((cc) => {
                      const isChecked = ccRange === cc;
                      return (
                        <label key={cc} className="flex items-center gap-3 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="ccRange"
                            checked={isChecked}
                            onChange={() => handleCcToggle(cc)}
                            className="h-4 w-4 rounded-full border-zinc-300 accent-zinc-900 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-zinc-750">{cc}</span>
                        </label>
                      );
                    })}
                  </div>
                  {ccRangeError && <p className="text-xs text-red-500 mt-1 font-semibold">{ccRangeError}</p>}
                </div>

                {/* Categories */}
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label className={`text-xs font-semibold block pb-1 ${categoriesError ? "text-red-500" : "text-zinc-700"}`}>
                    Categorias de Motocicleta *
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {categoryOptions.map((cat) => {
                      const isChecked = categories.includes(cat);
                      return (
                        <label key={cat} className="flex items-center gap-2.5 cursor-pointer select-none py-0.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCategoryToggle(cat)}
                            className="h-4 w-4 rounded border-zinc-300 accent-zinc-900 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-zinc-750">{cat}</span>
                        </label>
                      );
                    })}
                  </div>
                  {categoriesError && <p className="text-xs text-red-500 mt-1 font-semibold">{categoriesError}</p>}
                </div>
              </div>
            </div>

            {/* Seção 3: Cadastro de Motos Específicas */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                <Bike className="h-5 w-5 text-zinc-500" />
                <h3 className="font-semibold text-zinc-900 text-base">Motos Específicas para o Serviço</h3>
              </div>

              {/* Form to add specific bike */}
              <div className="border border-zinc-300 p-4 rounded-2xl bg-zinc-50/50 space-y-3">
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                  Adicionar Moto Específica
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {/* Brand Input (Select) */}
                  <div className="space-y-1.5 col-span-3 sm:col-span-1">
                    <Label className="text-[10px] font-bold text-zinc-600">Marca</Label>
                    <Select onValueChange={(val) => { setNewBrand(val ?? ""); setBikeFormError(""); }} value={newBrand}>
                      <SelectTrigger className="bg-white border-zinc-200 rounded-xl h-9 text-xs">
                        <SelectValue placeholder="Selecione a marca" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-zinc-100 rounded-xl shadow-lg">
                        {["Honda","Yamaha","BMW","Triumph","Kawasaki","Suzuki","Harley-Davidson","Ducati","Husqvarna","Royal Enfield","CF Motos","Haojue","Bajaj","Outra"].map(
                          (b) => <SelectItem key={b} value={b}>{b}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Model Input */}
                  <div className="space-y-1.5 col-span-3 sm:col-span-1">
                    <Label className="text-[10px] font-bold text-zinc-600">Modelo</Label>
                    <Input
                      placeholder="Ex: Iron 883"
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      className="bg-white border-zinc-200 rounded-xl h-9 text-xs"
                    />
                  </div>

                  {/* CC Input */}
                  <div className="space-y-1.5 col-span-3 sm:col-span-1">
                    <Label className="text-[10px] font-bold text-zinc-600">Cilindrada (CC)</Label>
                    <Input
                      placeholder="Ex: 883cc"
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
                      placeholder="Digite a marca da moto"
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
                  ADICIONAR MOTO ESPECÍFICA
                </button>
              </div>

              {/* List of specific bikes */}
              {specificBikes.length > 0 ? (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  <Label className="text-xs font-semibold text-zinc-700">Motos Cadastradas no Serviço</Label>
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
                          title="Remover moto específica"
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
                  <p className="text-[11px] font-semibold text-zinc-400">
                    Nenhuma moto específica vinculada. Este serviço se aplicará a todas as motos que atendam aos filtros de CC e Categoria.
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
                  {service ? "Salvar Alterações" : "Salvar Serviço"}
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
