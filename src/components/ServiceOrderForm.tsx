import React, { useState, useEffect } from "react";
import { toast } from "@/components/ui/toast";
import {
  User,
  Wrench,
  Package,
  FileText,
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  Camera,
  Coins,
  Search,
  Eye,
} from "lucide-react";
import {
  Client,
  Motorbike,
  ServiceOrder,
  LaborItem,
  PartItem,
  PaymentItem,
  DamagePoint,
  InspectionPhoto,
  ServiceOrderWithRelations,
} from "@/types";
import MotorcycleDamageSelector from "./MotorcycleDamageSelector";
import ServiceOrderDetails from "./ServiceOrderDetails";

interface ServiceOrderFormProps {
  initialData?: ServiceOrderWithRelations | null;
  clients: Client[];
  bikes: Motorbike[];
  onSave: (
    osData: Omit<ServiceOrder, "id" | "osNumber" | "createdAt" | "entryDate"> & { id?: string },
    keepEditing?: boolean
  ) => Promise<ServiceOrderWithRelations | undefined>;
  onCancel: () => void;
  onCloseOS?: (
    id: string,
    status: "encerrado",
    readyDate?: string,
    exitDate?: string,
    finalPayments?: PaymentItem[]
  ) => Promise<void>;
  onUpdateOrder?: (order: ServiceOrderWithRelations) => void;
}

const STANDARD_SERVICES = [
  { name: "Revisão Geral", hours: 4, rate: 120 },
  { name: "Troca de Óleo e Filtro", hours: 0.5, rate: 100 },
  { name: "Lavagem Detalhada", hours: 2, rate: 90 },
  { name: "Substituição de Relação", hours: 1.5, rate: 120 },
  { name: "Substituição de Pastilhas de Freio", hours: 1, rate: 100 },
  { name: "Regulagem de Válvulas", hours: 3, rate: 130 },
  { name: "Diagnóstico Eletrônico", hours: 1, rate: 150 },
];

const STANDARD_PARTS = [
  { name: "Óleo Motul 5100 15W50 (1L)", code: "MT-15W50", cost: 45, price: 75 },
  { name: "Filtro de Óleo", code: "FO-102", cost: 25, price: 48 },
  { name: "Pastilha de Freio Dianteira", code: "PF-BR-01", cost: 95, price: 175 },
  { name: "Pastilha de Freio Traseira", code: "PF-BR-02", cost: 85, price: 160 },
  { name: "Kit Relação (Coroa/Pinhão/Corrente)", code: "KIT-REL-DID", cost: 240, price: 430 },
  { name: "Vela de Ignição Iridium", code: "NGK-IRID", cost: 55, price: 95 },
  { name: "Filtro de Ar Esportivo", code: "FA-SP-99", cost: 110, price: 210 },
];

const TECHNICIANS = ["Carlos (Mecânico Chefe)", "Felipe (Auxiliar)", "Marcos (Especialista)", "Administrador"];
const PAYMENT_METHODS = ["PIX", "Cartão de Crédito", "Cartão de Débito", "Dinheiro", "Boleto"];
const FINANCIAL_ACCOUNTS = ["Caixa Interno da Oficina", "Conta Corrente Itaú", "Conta PJ Nubank"];

const ACCESSORY_TEMPLATES = [
  "Documento",
  "Chave de Ignição",
  "Manual",
  "Capacete",
  "Kit Ferramentas",
  "Antena",
  "Alarme",
  "Rede",
  "Flanela",
  "Elástico",
  "Baú",
];

export default function ServiceOrderForm({
  initialData,
  clients,
  bikes,
  onSave,
  onCancel,
  onCloseOS,
  onUpdateOrder,
}: ServiceOrderFormProps) {
  const steps = [
    ...(initialData ? [{ id: "preview" as const, label: "Visualização", icon: Eye }] : []),
    { id: "general" as const, label: "Cliente & Moto", icon: User },
    { id: "inspection" as const, label: "Checklist & Vistoria", icon: Wrench },
    { id: "labor_parts" as const, label: "Serviços & Peças", icon: Package },
    { id: "notes" as const, label: "Laudo & Defeitos", icon: FileText },
    { id: "financial" as const, label: "Valores & Financeiro", icon: DollarSign },
  ];

  const [activeStep, setActiveStep] = useState<"preview" | "general" | "inspection" | "labor_parts" | "notes" | "financial">(
    initialData ? "preview" : "general"
  );

  // Core identifiers
  const [orderId, setOrderId] = useState<string | undefined>(initialData?.id);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedBikeId, setSelectedBikeId] = useState("");
  const [completedStages, setCompletedStages] = useState<string[]>(initialData?.completedStages || []);
  const [status, setStatus] = useState<ServiceOrder["status"]>("montagem_orcamento");
  const [docType, setDocType] = useState<ServiceOrder["type"]>("orcamento");

  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const getSearchSuggestions = () => {
    const query = clientSearch.toLowerCase().trim();
    const suggestions: {
      client: Client;
      bike?: Motorbike;
      label: string;
      sublabel: string;
    }[] = [];

    clients.forEach((c) => {
      const clientBikes = bikes.filter((b) => b.clientId === c.id);
      
      const clientName = c.name.toLowerCase();
      const clientNickname = (c.nickname || "").toLowerCase();
      const clientPhone = c.phone.replace(/\D/g, "");
      const clientCpf = c.cpf.replace(/\D/g, "");

      const queryDigits = query.replace(/\D/g, "");
      const matchesClientBase = 
        clientName.includes(query) || 
        clientNickname.includes(query) || 
        (queryDigits && (clientPhone.includes(queryDigits) || clientCpf.includes(queryDigits)));

      if (clientBikes.length === 0) {
        if (!query || matchesClientBase) {
          suggestions.push({
            client: c,
            label: `${c.name} ${c.nickname ? `(${c.nickname})` : ""}`,
            sublabel: `Tel: ${c.phone} | Sem moto cadastrada`,
          });
        }
      } else {
        clientBikes.forEach((b) => {
          const bikeBrand = b.brand.toLowerCase();
          const bikeModel = b.model.toLowerCase();
          const bikePlate = b.plate.toLowerCase().replace("-", "");
          const bikeVin = b.vin.toLowerCase();
          const cleanQuery = query.replace("-", "");

          const matchesBike = 
            bikeBrand.includes(query) || 
            bikeModel.includes(query) || 
            (cleanQuery && bikePlate.includes(cleanQuery)) || 
            bikeVin.includes(query);

          if (!query || matchesClientBase || matchesBike) {
            suggestions.push({
              client: c,
              bike: b,
              label: `${c.name} ${c.nickname ? `(${c.nickname})` : ""}`,
              sublabel: `${b.brand} ${b.model} (${b.year}) · Placa: ${b.plate.toUpperCase()} · Tel: ${c.phone}`,
            });
          }
        });
      }
    });

    return suggestions.slice(0, 8);
  };

  const handleSelectSuggestion = (client: Client, bike?: Motorbike) => {
    setSelectedClientId(client.id);
    if (bike) {
      setSelectedBikeId(bike.id);
    } else {
      setSelectedBikeId("");
    }
    setShowClientDropdown(false);
    setClientSearch("");
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const selectedBike = bikes.find((b) => b.id === selectedBikeId);

  // Vistoria/Inspection
  const [odometer, setOdometer] = useState("");
  const [fuelLevel, setFuelLevel] = useState<ServiceOrder["fuelLevel"]>("1/2");
  const [tiresCondition, setTiresCondition] = useState<{
    front: "novo" | "bom" | "ruim";
    rear: "novo" | "bom" | "ruim";
  }>({ front: "bom", rear: "bom" });
  const [accessories, setAccessories] = useState<string[]>([]);
  const [customAccessories, setCustomAccessories] = useState<string[]>([]);
  const [newAccessory, setNewAccessory] = useState("");
  const [damagePoints, setDamagePoints] = useState<DamagePoint[]>([]);
  const [electricalProblems, setElectricalProblems] = useState("");
  const [maintenanceProblems, setMaintenanceProblems] = useState("");

  // Media upload simulation
  const [inspectionPhotos, setInspectionPhotos] = useState<InspectionPhoto[]>([]);
  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [photoNotesInput, setPhotoNotesInput] = useState("");
  const [photoType, setPhotoType] = useState<"foto" | "video">("foto");

  // Complaints / Tech notes
  const [customerComplaints, setCustomerComplaints] = useState("");
  const [technicalReport, setTechnicalReport] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Labor / Parts lists
  const [labor, setLabor] = useState<LaborItem[]>([]);
  const [parts, setParts] = useState<PartItem[]>([]);

  // Financial aggregates
  const [discounts, setDiscounts] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [towingFee, setTowingFee] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [payments, setPayments] = useState<PaymentItem[]>([]);

  // Payment Add states
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("PIX");
  const [payAccount, setPayAccount] = useState("Caixa Interno da Oficina");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);

  // Dates
  const [readyDate, setReadyDate] = useState("");

  useEffect(() => {
    if (initialData) {
      setOrderId(initialData.id);
      setSelectedClientId(initialData.clientId);
      setSelectedBikeId(initialData.motorbikeId);
      setCompletedStages(initialData.completedStages || []);
      setStatus(initialData.status);
      setDocType(initialData.type || "orcamento");
      setOdometer(initialData.odometer);
      setFuelLevel(initialData.fuelLevel);
      setTiresCondition(initialData.tiresCondition);
      setAccessories(initialData.accessories);
      setCustomAccessories(initialData.customAccessories || []);
      setDamagePoints(initialData.damagePoints || []);
      setElectricalProblems(initialData.electricalProblems || "");
      setMaintenanceProblems(initialData.maintenanceProblems || "");
      setInspectionPhotos(initialData.inspectionPhotos || []);
      setCustomerComplaints(initialData.customerComplaints);
      setTechnicalReport(initialData.technicalReport || "");
      setInternalNotes(initialData.internalNotes || "");
      setLabor(initialData.labor || []);
      setParts(initialData.parts || []);
      setDiscounts(initialData.discounts);
      setOtherCharges(initialData.otherCharges);
      setTowingFee(initialData.towingFee);
      setTotalValue(initialData.totalValue);
      setPayments(initialData.payments || []);
      if (initialData.readyDate) {
        setReadyDate(initialData.readyDate.split("T")[0]);
      }
    }
  }, [initialData]);

  // Dynamic filter for bikes
  const filteredBikes = bikes.filter((b) => b.clientId === selectedClientId);

  // Auto calculate total value in real time
  useEffect(() => {
    const activeLabor = labor.reduce((acc, curr) => acc + (curr.isOptional ? 0 : curr.total), 0);
    const activeParts = parts.reduce((acc, curr) => acc + (curr.isOptional ? 0 : curr.total), 0);
    const total = activeLabor + activeParts + towingFee + otherCharges - discounts;
    setTotalValue(Math.max(0, total));
  }, [labor, parts, towingFee, otherCharges, discounts]);

  // Helpers to add labor/parts
  const handleAddCustomLabor = () => {
    const newItem: LaborItem = {
      id: Math.random().toString(),
      name: "Novo Serviço",
      technician: TECHNICIANS[0],
      hours: 1,
      hourlyRate: 100,
      total: 100,
      isOptional: false,
      isCustom: true,
    };
    setLabor([...labor, newItem]);
  };

  const handleAddStandardLabor = (serviceName: string) => {
    const template = STANDARD_SERVICES.find((s) => s.name === serviceName);
    if (!template) return;
    const newItem: LaborItem = {
      id: Math.random().toString(),
      name: template.name,
      technician: TECHNICIANS[0],
      hours: template.hours,
      hourlyRate: template.rate,
      total: template.hours * template.rate,
      isOptional: false,
      isCustom: false,
    };
    setLabor([...labor, newItem]);
  };

  const handleUpdateLaborRow = (id: string, field: keyof LaborItem, value: any) => {
    const updated = labor.map((item) => {
      if (item.id === id) {
        const uItem = { ...item, [field]: value };
        if (field === "hours" || field === "hourlyRate") {
          uItem.total = Number(uItem.hours) * Number(uItem.hourlyRate);
        }
        return uItem;
      }
      return item;
    });
    setLabor(updated);
  };

  const handleRemoveLabor = (id: string) => {
    setLabor(labor.filter((item) => item.id !== id));
  };

  const handleAddCustomPart = () => {
    const newItem: PartItem = {
      id: Math.random().toString(),
      name: "Nova Peça",
      code: "",
      technician: TECHNICIANS[0],
      cost: 0,
      salePrice: 0,
      quantity: 1,
      total: 0,
      isOptional: false,
      isCustom: true,
      brand: "",
      specifications: "",
      measurements: "",
    };
    setParts([...parts, newItem]);
  };

  const handleAddStandardPart = (partName: string) => {
    const template = STANDARD_PARTS.find((p) => p.name === partName);
    if (!template) return;
    const newItem: PartItem = {
      id: Math.random().toString(),
      name: template.name,
      code: template.code,
      technician: TECHNICIANS[0],
      cost: template.cost,
      salePrice: template.price,
      quantity: 1,
      total: template.price,
      isOptional: false,
      isCustom: false,
      brand: "",
      specifications: "",
      measurements: "",
    };
    setParts([...parts, newItem]);
  };

  const handleUpdatePartRow = (id: string, field: keyof PartItem, value: any) => {
    const updated = parts.map((item) => {
      if (item.id === id) {
        const uItem = { ...item, [field]: value };
        if (field === "salePrice" || field === "quantity") {
          uItem.total = Number(uItem.salePrice) * Number(uItem.quantity);
        }
        return uItem;
      }
      return item;
    });
    setParts(updated);
  };

  const handleRemovePart = (id: string) => {
    setParts(parts.filter((item) => item.id !== id));
  };

  // Accessories Checklist
  const handleToggleAccessory = (acc: string) => {
    if (accessories.includes(acc)) {
      setAccessories(accessories.filter((a) => a !== acc));
    } else {
      setAccessories([...accessories, acc]);
    }
  };

  const handleAddCustomAccessory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccessory.trim()) return;
    setCustomAccessories([...customAccessories, newAccessory.trim()]);
    setAccessories([...accessories, newAccessory.trim()]);
    setNewAccessory("");
  };

  const handleRemoveCustomAccessory = (acc: string) => {
    setCustomAccessories(customAccessories.filter((a) => a !== acc));
    setAccessories(accessories.filter((a) => a !== acc));
  };

  // Payments Logic
  const handleAddPayment = () => {
    const amt = Number(payAmount);
    if (isNaN(amt) || amt <= 0) return;
    const newPay: PaymentItem = {
      id: Math.random().toString(),
      amount: amt,
      date: payDate,
      method: payMethod,
      account: payAccount,
    };
    setPayments([...payments, newPay]);
    setPayAmount("");
  };

  const handleRemovePayment = (id: string) => {
    setPayments(payments.filter((p) => p.id !== id));
  };

  const totalPaid = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const balanceDue = Math.max(0, totalValue - totalPaid);

  // Photo simulation
  const handleAddPhoto = () => {
    if (!photoUrlInput.trim()) return;
    setInspectionPhotos([
      ...inspectionPhotos,
      {
        url: photoUrlInput.trim(),
        type: photoType,
        notes: photoNotesInput.trim() || undefined,
      },
    ]);
    setPhotoUrlInput("");
    setPhotoNotesInput("");
  };

  const handleRemovePhoto = (url: string) => {
    setInspectionPhotos(inspectionPhotos.filter((p) => p.url !== url));
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProgress = async (shouldAdvance: boolean) => {
    if (!selectedClientId) {
      toast.error("Por favor, selecione um cliente.");
      setActiveStep("general");
      return;
    }
    if (!selectedBikeId) {
      toast.error("Por favor, selecione a moto.");
      setActiveStep("general");
      return;
    }

    try {
      setIsSaving(true);

      const finalType = (status === "aprovado" || status === "encerrado") ? "os" : docType;

      const updatedStages = completedStages.includes(activeStep)
        ? completedStages
        : [...completedStages, activeStep];
      
      setCompletedStages(updatedStages);

      const payload = {
        id: orderId,
        clientId: selectedClientId,
        motorbikeId: selectedBikeId,
        status,
        type: finalType,
        odometer,
        fuelLevel,
        tiresCondition,
        accessories,
        customAccessories,
        damagePoints,
        inspectionPhotos,
        electricalProblems: electricalProblems.trim() || undefined,
        maintenanceProblems: maintenanceProblems.trim() || undefined,
        customerComplaints: customerComplaints.trim(),
        technicalReport: technicalReport.trim() || undefined,
        internalNotes: internalNotes.trim() || undefined,
        labor,
        parts,
        discounts,
        otherCharges,
        towingFee,
        totalValue,
        payments,
        readyDate: readyDate || undefined,
        exitDate: initialData?.exitDate || undefined,
        completedStages: updatedStages,
      };

      const keepEditing = !(activeStep === "financial" && shouldAdvance);

      const saved = await onSave(payload, keepEditing);
      if (saved) {
        setOrderId(saved.id);
        if (keepEditing) {
          if (!shouldAdvance) {
            toast.success("Progresso salvo com sucesso!");
          } else {
            const stepKeys = steps.map((s) => s.id);
            const idx = stepKeys.indexOf(activeStep);
            if (idx < stepKeys.length - 1) {
              setActiveStep(stepKeys[idx + 1]);
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar o progresso.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveProgress(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 animate-fade-in">
      {/* Wizard Header Navigation */}
      <div className="bg-white rounded-xl border border-zinc-100 p-2 sm:p-2.5 shadow-sm">
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-1">
          {steps.map((step) => {
            const StepIcon = step.icon;
            const isActive = activeStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`flex-1 min-w-[120px] flex items-center justify-center md:justify-start gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-zinc-950 text-white font-bold"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                }`}
              >
                <StepIcon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 0: Preview / Visualização */}
      {activeStep === "preview" && initialData && (
        <div className="bg-white rounded-2xl border border-zinc-100 p-4 sm:p-4.5 shadow-sm space-y-4 animate-fade-in">
          <ServiceOrderDetails
            order={initialData}
            previewMode={true}
            onCloseOS={onCloseOS}
            onUpdateOrder={onUpdateOrder}
          />
        </div>
      )}

      {/* STEP 1: General Info */}
      {activeStep === "general" && (
        <div className="bg-white rounded-2xl border border-zinc-100 p-4 sm:p-4.5 shadow-sm space-y-4 animate-fade-in">
          <h2 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3 flex items-center gap-2">
            <User className="h-4.5 w-4.5 text-zinc-500" />
            Vincular Cliente e Motocicleta
          </h2>

          {/* Document Type Selector */}
          <div className="space-y-1.5 border-b border-zinc-100 pb-5">
            <span className="text-xs font-bold text-zinc-650 block">Tipo do Documento</span>
            <div className="flex gap-3 max-w-md">
              <button
                type="button"
                onClick={() => {
                  setDocType("orcamento");
                  setStatus("montagem_orcamento");
                }}
                className={`flex-1 flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                  docType === "orcamento"
                    ? "bg-zinc-950 border-zinc-950 text-white font-bold shadow-sm"
                    : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                <span className="text-xs">📄 Orçamento</span>
                <span className="text-[10px] text-current opacity-70 mt-1 font-medium">Inicial para aprovação do cliente</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDocType("os");
                  setStatus("aprovado");
                }}
                className={`flex-1 flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                  docType === "os"
                    ? "bg-zinc-950 border-zinc-950 text-white font-bold shadow-sm"
                    : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                <span className="text-xs">🛠 Ordem de Serviço</span>
                <span className="text-[10px] text-current opacity-70 mt-1 font-medium">Serviço ativo aprovado / em execução</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {selectedClientId ? (
            <div className="space-y-4">
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Client Summary */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Cliente Selecionado</span>
                    {selectedClient ? (
                      <>
                        <p className="text-xs font-bold text-zinc-800">
                          {selectedClient.name} {selectedClient.nickname && `(${selectedClient.nickname})`}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          Tel: {selectedClient.phone} {selectedClient.cpf ? `| CPF: ${selectedClient.cpf}` : ""}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs font-bold text-red-600">Erro: Cliente não encontrado</p>
                    )}
                  </div>
                  {/* Bike Summary */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Motocicleta Selecionada</span>
                    {selectedBike ? (
                      <>
                        <p className="text-xs font-bold text-zinc-800">
                          {selectedBike.brand} {selectedBike.model} ({selectedBike.year})
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          Placa: <span className="font-mono font-bold uppercase">{selectedBike.plate}</span> | Chassi: <span className="font-mono">{selectedBike.vin}</span>
                        </p>
                      </>
                    ) : (
                      <p className="text-xs font-bold text-amber-600">Nenhuma moto selecionada</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClientId("");
                    setSelectedBikeId("");
                    setClientSearch("");
                  }}
                  className="text-xs font-bold text-zinc-600 hover:text-zinc-900 bg-zinc-200/60 hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 animate-fade-in"
                >
                  Alterar Vínculo
                </button>
              </div>

              {selectedClientId && filteredBikes.length === 0 && (
                <div className="p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-100 flex items-start gap-2.5 text-xs">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Cliente sem motos registradas</p>
                    <p className="mt-0.5 text-amber-700/95 font-medium">
                      Antes de abrir a O.S, cadastre uma moto para este cliente na tela de Clientes.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5 relative">
              <label className="text-xs font-bold text-zinc-600">Procurar e Selecionar Cliente/Moto</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Pesquise por primeiro/último nome, apelido, telefone ou placa da moto..."
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setShowClientDropdown(true);
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
                />
              </div>

              {showClientDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowClientDropdown(false)} 
                  />
                  
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-20 divide-y divide-zinc-100">
                    {getSearchSuggestions().length === 0 ? (
                      <div className="p-3 text-xs text-zinc-400 text-center font-medium">
                        Nenhum cliente ou moto encontrado.
                      </div>
                    ) : (
                      getSearchSuggestions().map((s, idx) => (
                        <button
                          key={`${s.client.id}-${s.bike?.id || 'nobike'}-${idx}`}
                          type="button"
                          onClick={() => handleSelectSuggestion(s.client, s.bike)}
                          className="w-full text-left p-2.5 px-3.5 hover:bg-zinc-50 flex flex-col gap-0.5 transition-colors cursor-pointer"
                        >
                          <span className="text-xs font-bold text-zinc-800">{s.label}</span>
                          <span className="text-[10px] text-zinc-500 font-semibold">{s.sublabel}</span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    )}

      {/* STEP 2: Checklist & Inspection */}
      {activeStep === "inspection" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start animate-fade-in">
          {/* Left Column: General Inspection inputs, Accessories Checklist, and General Problems */}
          <div className="space-y-4">
            {/* Odometer, Fuel and Tires */}
            <div className="bg-white rounded-xl border border-zinc-100 p-3.5 shadow-sm space-y-3.5">
              <h2 className="text-xs font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-zinc-500" />
                Inspeção e Estado Geral
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Odometer */}
                <div className="space-y-1">
                  <label htmlFor="input-odometer" className="text-[10px] font-bold text-zinc-650">Kilometragem (Odômetro)</label>
                  <input
                    id="input-odometer"
                    type="text"
                    placeholder="Ex: 24.500 km"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-705 focus:outline-none focus:border-zinc-500 font-semibold"
                    required
                  />
                </div>

                {/* Fuel Level */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-650 block">Nível de Combustível (Tanque)</label>
                  <div className="grid grid-cols-5 gap-0.5 bg-zinc-50 border border-zinc-200 rounded-lg p-0.5">
                    {(["vazio", "1/4", "1/2", "3/4", "cheio"] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFuelLevel(level)}
                        className={`py-1.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                          fuelLevel === level
                            ? "bg-zinc-950 text-white shadow-xs"
                            : "text-zinc-500 hover:bg-zinc-100"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tires conditions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-650 block">Pneu Dianteiro</label>
                  <div className="grid grid-cols-3 gap-0.5 bg-zinc-50 border border-zinc-200 rounded-lg p-0.5">
                    {(["novo", "bom", "ruim"] as const).map((cond) => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => setTiresCondition({ ...tiresCondition, front: cond })}
                        className={`py-1.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                          tiresCondition.front === cond
                            ? cond === "ruim"
                              ? "bg-red-500 text-white"
                              : cond === "bom"
                              ? "bg-emerald-600 text-white"
                              : "bg-blue-500 text-white"
                            : "text-zinc-500 hover:bg-zinc-100"
                        }`}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-650 block">Pneu Traseiro</label>
                  <div className="grid grid-cols-3 gap-0.5 bg-zinc-50 border border-zinc-200 rounded-lg p-0.5">
                    {(["novo", "bom", "ruim"] as const).map((cond) => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => setTiresCondition({ ...tiresCondition, rear: cond })}
                        className={`py-1.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                          tiresCondition.rear === cond
                            ? cond === "ruim"
                              ? "bg-red-500 text-white"
                              : cond === "bom"
                              ? "bg-emerald-600 text-white"
                              : "bg-blue-500 text-white"
                            : "text-zinc-500 hover:bg-zinc-100"
                        }`}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Accessories Checklist */}
            <div className="bg-white rounded-xl border border-zinc-100 p-3.5 shadow-sm space-y-3">
              <h2 className="text-xs font-bold text-zinc-900 border-b border-zinc-100 pb-2">
                Acessórios e Equipamentos Entregues
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-1.5">
                {ACCESSORY_TEMPLATES.map((acc) => {
                  const checked = accessories.includes(acc);
                  return (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => handleToggleAccessory(acc)}
                      className={`flex items-center gap-1.5 p-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-all text-left cursor-pointer ${
                        checked
                          ? "bg-zinc-950 border-zinc-950 text-white"
                          : "bg-zinc-50 border-zinc-200 text-zinc-650 hover:bg-zinc-100"
                      }`}
                    >
                      <span
                        className={`h-3 w-3 rounded flex items-center justify-center border text-[8px] shrink-0 ${
                          checked ? "bg-white border-white text-zinc-955 font-bold" : "border-zinc-300"
                        }`}
                      >
                        {checked ? "✓" : ""}
                      </span>
                      <span className="truncate">{acc}</span>
                    </button>
                  );
                })}
                {customAccessories.map((acc) => (
                  <div
                    key={acc}
                    className="flex items-center justify-between p-1.5 px-2 rounded-lg border bg-zinc-955 border-zinc-955 text-white text-[11px] font-semibold group"
                  >
                    <span className="truncate">{acc}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomAccessory(acc)}
                      className="text-zinc-400 hover:text-red-400 p-0.5 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Form to add custom accessory */}
              <div className="flex items-center gap-1.5 max-w-xs pt-1">
                <input
                  type="text"
                  placeholder="Adicionar outro..."
                  value={newAccessory}
                  onChange={(e) => setNewAccessory(e.target.value)}
                  className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 font-semibold"
                />
                <button
                  type="button"
                  onClick={handleAddCustomAccessory}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* General Electrical & Maintenance Problems */}
            <div className="bg-white rounded-xl border border-zinc-100 p-3.5 shadow-sm space-y-3">
              <h2 className="text-xs font-bold text-zinc-900 border-b border-zinc-100 pb-2">
                Problemas Gerais Identificados
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label htmlFor="electrical-problems" className="text-[10px] font-bold text-zinc-650">Problemas de Elétrica (Se houver)</label>
                  <textarea
                    id="electrical-problems"
                    rows={2}
                    placeholder="Ex: Farol queimado, seta falhando..."
                    value={electricalProblems}
                    onChange={(e) => setElectricalProblems(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 focus:outline-none focus:border-zinc-500 font-semibold resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="maintenance-problems" className="text-[10px] font-bold text-zinc-650">Manutenção/Mecânica (Se houver)</label>
                  <textarea
                    id="maintenance-problems"
                    rows={2}
                    placeholder="Ex: Vazamento de óleo, folga na corrente..."
                    value={maintenanceProblems}
                    onChange={(e) => setMaintenanceProblems(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 focus:outline-none focus:border-zinc-500 font-semibold resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Motorcycle Diagram & Damage Selector, Media Attachments */}
          <div className="space-y-4">
            {/* Interactive Graphic */}
            <div className="bg-white rounded-xl border border-zinc-100 p-3.5 shadow-sm">
              <h2 className="text-xs font-bold text-zinc-900 border-b border-zinc-100 pb-2 mb-3">
                Mapa Visual de Avarias (Clique para marcar)
              </h2>
              <MotorcycleDamageSelector damagePoints={damagePoints} onChange={setDamagePoints} />
            </div>

            {/* Photos/Videos inspection */}
            <div className="bg-white rounded-xl border border-zinc-100 p-3.5 shadow-sm space-y-3">
              <h2 className="text-xs font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
                <Camera className="h-4 w-4 text-zinc-500" />
                Anexos da Vistoria
              </h2>

              {/* Simulating uploads */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 space-y-2">
                <p className="text-[10px] text-zinc-450 font-semibold leading-none">Simule o upload inserindo uma URL ou use o botão Demo:</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="URL do arquivo..."
                    value={photoUrlInput}
                    onChange={(e) => setPhotoUrlInput(e.target.value)}
                    className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-xs text-zinc-700 focus:outline-none focus:border-zinc-500 font-semibold"
                  />
                  <input
                    type="text"
                    placeholder="Legenda (ex: Risco lateral)..."
                    value={photoNotesInput}
                    onChange={(e) => setPhotoNotesInput(e.target.value)}
                    className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-xs text-zinc-700 focus:outline-none focus:border-zinc-500 font-semibold"
                  />
                  <select
                    value={photoType}
                    onChange={(e) => setPhotoType(e.target.value as any)}
                    className="bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs text-zinc-700 focus:outline-none focus:border-zinc-500 font-bold"
                  >
                    <option value="foto">📸 Foto</option>
                    <option value="video">🎥 Vídeo</option>
                  </select>
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setPhotoUrlInput("https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500")}
                    className="bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold px-2 py-1 rounded text-[9px] cursor-pointer transition-colors"
                  >
                    Imagem Demo
                  </button>
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="bg-zinc-950 hover:bg-zinc-800 text-white font-bold rounded-lg px-2.5 py-1 text-xs cursor-pointer transition-colors"
                  >
                    Adicionar Anexo
                  </button>
                </div>
              </div>

              {/* List of Attachments */}
              {inspectionPhotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {inspectionPhotos.map((photo) => (
                    <div key={photo.url} className="border border-zinc-150 rounded-lg overflow-hidden bg-zinc-50 relative group">
                      <img src={photo.url} alt={photo.notes || "Inspeção"} className="w-full h-16 object-cover" />
                      <div className="p-1.5 text-[9px] font-bold text-zinc-700 leading-tight">
                        <span className="uppercase text-zinc-400 font-semibold block">
                          {photo.type === "foto" ? "Foto" : "Vídeo"}
                        </span>
                        <span className="truncate block mt-0.5">{photo.notes || "Sem notas"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.url)}
                        className="absolute top-1 right-1 bg-red-650 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Labor & Parts */}
      {activeStep === "labor_parts" && (
        <div className="space-y-6">
          {/* Labor / Mão de Obra */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-4 sm:p-4.5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-zinc-500" />
                Mão de Obra / Serviços
              </h2>

              <div className="flex gap-2">
                {/* Add standard */}
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleAddStandardLabor(e.target.value);
                  }}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 font-semibold focus:outline-none"
                >
                  <option value="">+ Add Serviço Padrão...</option>
                  {STANDARD_SERVICES.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name} ({s.hours}h - R$ {s.rate}/h)
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddCustomLabor}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                >
                  + Add Avulso
                </button>
              </div>
            </div>

            {/* Labor table */}
            {labor.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">Nenhum serviço adicionado ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-zinc-150 text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5 pr-2">Serviço</th>
                      <th className="py-2.5 px-2">Técnico</th>
                      <th className="py-2.5 px-2 w-20 text-center">Horas</th>
                      <th className="py-2.5 px-2 w-28 text-right">R$ / Hora</th>
                      <th className="py-2.5 px-2 w-28 text-right">Total</th>
                      <th className="py-2.5 px-2 w-20 text-center">Opcional</th>
                      <th className="py-2.5 pl-2 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {labor.map((item) => (
                      <tr key={item.id} className="border-b border-zinc-100 hover:bg-zinc-50/50">
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateLaborRow(item.id, "name", e.target.value)}
                            className="bg-transparent font-semibold text-zinc-800 border-none outline-none focus:bg-white focus:ring-1 focus:ring-zinc-200 px-1 py-0.5 rounded w-full"
                          />
                          {item.trackedSeconds !== undefined && item.trackedSeconds > 0 && (
                            <span className="text-[10px] text-zinc-400 font-semibold mt-0.5 flex items-center gap-1 px-1">
                              <Clock className="h-3 w-3" />
                              Tempo real: {Math.floor(item.trackedSeconds / 3600)}h {Math.floor((item.trackedSeconds % 3600) / 60)}m {item.trackedSeconds % 60}s
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={item.technician}
                            onChange={(e) => handleUpdateLaborRow(item.id, "technician", e.target.value)}
                            className="bg-transparent font-medium text-zinc-700 border-none outline-none focus:bg-white focus:ring-1 focus:ring-zinc-200 px-1 py-0.5 rounded w-full"
                          >
                            {TECHNICIANS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            step="0.1"
                            value={item.hours}
                            onChange={(e) => handleUpdateLaborRow(item.id, "hours", Number(e.target.value))}
                            className="bg-transparent font-medium text-zinc-700 text-center border-none outline-none focus:bg-white focus:ring-1 focus:ring-zinc-200 px-1 py-0.5 rounded w-full"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={item.hourlyRate}
                            onChange={(e) => handleUpdateLaborRow(item.id, "hourlyRate", Number(e.target.value))}
                            className="bg-transparent font-medium text-zinc-700 text-right border-none outline-none focus:bg-white focus:ring-1 focus:ring-zinc-200 px-1 py-0.5 rounded w-full"
                          />
                        </td>
                        <td className="py-2 px-2 font-bold text-zinc-800 text-right">
                          {(item.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={item.isOptional}
                            onChange={(e) => handleUpdateLaborRow(item.id, "isOptional", e.target.checked)}
                            className="accent-zinc-900 h-4.5 w-4.5 cursor-pointer rounded"
                          />
                        </td>
                        <td className="py-2 pl-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLabor(item.id)}
                            className="text-zinc-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Parts / Peças */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-4 sm:p-4.5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Package className="h-4.5 w-4.5 text-zinc-500" />
                Peças / Insumos
              </h2>

              <div className="flex gap-2">
                {/* Add standard */}
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleAddStandardPart(e.target.value);
                  }}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 font-semibold focus:outline-none"
                >
                  <option value="">+ Add Peça Estoque...</option>
                  {STANDARD_PARTS.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} (R$ {p.price})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddCustomPart}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                >
                  + Add Avulsa
                </button>
              </div>
            </div>

            {/* Parts table */}
            {parts.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">Nenhuma peça adicionada ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-zinc-150 text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5 pr-2">Peça</th>
                      <th className="py-2.5 px-2 w-28">Código</th>
                      <th className="py-2.5 px-2">Técnico</th>
                      <th className="py-2.5 px-2 w-20 text-center">Qtd</th>
                      <th className="py-2.5 px-2 w-28 text-right">R$ Venda</th>
                      <th className="py-2.5 px-2 w-28 text-right">Total</th>
                      <th className="py-2.5 px-2 w-20 text-center">Opcional</th>
                      <th className="py-2.5 pl-2 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map((item) => (
                      <React.Fragment key={item.id}>
                        <tr className="border-b border-zinc-100 hover:bg-zinc-50/50">
                          <td className="py-2 pr-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleUpdatePartRow(item.id, "name", e.target.value)}
                              className="bg-transparent font-semibold text-zinc-800 border-none outline-none focus:bg-white focus:ring-1 focus:ring-zinc-200 px-1 py-0.5 rounded w-full"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              placeholder="Cod."
                              value={item.code || ""}
                              onChange={(e) => handleUpdatePartRow(item.id, "code", e.target.value)}
                              className="bg-transparent font-mono text-zinc-600 border-none outline-none focus:bg-white focus:ring-1 focus:ring-zinc-200 px-1 py-0.5 rounded w-full"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={item.technician}
                              onChange={(e) => handleUpdatePartRow(item.id, "technician", e.target.value)}
                              className="bg-transparent font-medium text-zinc-700 border-none outline-none focus:bg-white focus:ring-1 focus:ring-zinc-200 px-1 py-0.5 rounded w-full"
                            >
                              {TECHNICIANS.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdatePartRow(item.id, "quantity", Number(e.target.value))}
                              className="bg-transparent font-medium text-zinc-700 text-center border-none outline-none focus:bg-white focus:ring-1 focus:ring-zinc-200 px-1 py-0.5 rounded w-full"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              value={item.salePrice}
                              onChange={(e) => handleUpdatePartRow(item.id, "salePrice", Number(e.target.value))}
                              className="bg-transparent font-medium text-zinc-700 text-right border-none outline-none focus:bg-white focus:ring-1 focus:ring-zinc-200 px-1 py-0.5 rounded w-full"
                            />
                          </td>
                          <td className="py-2 px-2 font-bold text-zinc-800 text-right">
                            {(item.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={item.isOptional}
                              onChange={(e) => handleUpdatePartRow(item.id, "isOptional", e.target.checked)}
                              className="accent-zinc-900 h-4.5 w-4.5 cursor-pointer rounded"
                            />
                          </td>
                          <td className="py-2 pl-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePart(item.id)}
                              className="text-zinc-400 hover:text-red-500 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                        <tr className="border-b border-zinc-100 bg-zinc-50/15">
                          <td colSpan={8} className="py-1.5 px-3.5 pb-2.5">
                            <div className="flex gap-4 flex-wrap">
                              <div className="flex-1 min-w-[120px]">
                                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Marca</label>
                                <input
                                  type="text"
                                  placeholder="Ex: Mobensani, Honda"
                                  value={item.brand || ""}
                                  onChange={(e) => handleUpdatePartRow(item.id, "brand", e.target.value)}
                                  className="w-full bg-white border border-zinc-200 rounded px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700 focus:outline-none focus:border-zinc-400"
                                />
                              </div>
                              <div className="flex-[2] min-w-[200px]">
                                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Especificações Técnicas</label>
                                <input
                                  type="text"
                                  placeholder="Ex: Termoplástica, Semissintético"
                                  value={item.specifications || ""}
                                  onChange={(e) => handleUpdatePartRow(item.id, "specifications", e.target.value)}
                                  className="w-full bg-white border border-zinc-200 rounded px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700 focus:outline-none focus:border-zinc-400"
                                />
                              </div>
                              <div className="flex-1 min-w-[120px]">
                                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Medidas</label>
                                <input
                                  type="text"
                                  placeholder="Ex: 15x20mm, 1 Litro"
                                  value={item.measurements || ""}
                                  onChange={(e) => handleUpdatePartRow(item.id, "measurements", e.target.value)}
                                  className="w-full bg-white border border-zinc-200 rounded px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700 focus:outline-none focus:border-zinc-400"
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: Complaints & Tech notes */}
      {activeStep === "notes" && (
        <div className="bg-white rounded-2xl border border-zinc-100 p-4 sm:p-4.5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3 flex items-center gap-2">
            <FileText className="h-4.5 w-4.5 text-zinc-500" />
            Queixas do Cliente e Relatórios
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="customer-complaints" className="text-xs font-bold text-zinc-650 flex items-center gap-1">
                Defeitos Relatados / Reclamação do Cliente <span className="text-red-500">*</span>
              </label>
              <textarea
                id="customer-complaints"
                rows={4}
                placeholder="Descreva exatamente o que o cliente reclamou (ex: Barulho metálico na roda traseira ao frear, moto morrendo fria...)"
                value={customerComplaints}
                onChange={(e) => setCustomerComplaints(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:border-zinc-500 font-semibold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="technical-report" className="text-xs font-bold text-zinc-655">Laudo Técnico / Observações Mecânicas</label>
              <textarea
                id="technical-report"
                rows={3}
                placeholder="Insira o laudo oficial da inspeção técnica (ex: Pastilhas de freio traseiras completamente gastas, disco avariado...)"
                value={technicalReport}
                onChange={(e) => setTechnicalReport(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:border-zinc-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="internal-notes" className="text-xs font-bold text-zinc-655">Observações Internas (Não aparecem no comprovante do cliente)</label>
              <textarea
                id="internal-notes"
                rows={2}
                placeholder="Notas de controle interno (ex: cliente quer desconto na próxima revisão, cuidado extra com parafuso espanado...)"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:border-zinc-500 font-semibold"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Financials, Pricing & Status */}
      {activeStep === "financial" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left panel: pricing parameters & payments list */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pricing Parameters */}
            <div className="bg-white rounded-2xl border border-zinc-100 p-4 sm:p-4.5 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3 flex items-center gap-2">
                <Coins className="h-4.5 w-4.5 text-zinc-500" />
                Descontos, Adicionais e Guincho
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="input-discounts" className="text-xs font-bold text-zinc-600">Desconto (R$)</label>
                  <input
                    id="input-discounts"
                    type="number"
                    value={discounts || ""}
                    onChange={(e) => setDiscounts(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:border-zinc-500 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="input-towing" className="text-xs font-bold text-zinc-600">Valor do Guincho (R$)</label>
                  <input
                    id="input-towing"
                    type="number"
                    value={towingFee || ""}
                    onChange={(e) => setTowingFee(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:border-zinc-500 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="input-other" className="text-xs font-bold text-zinc-600">Outros Valores (Excedente/Créditos)</label>
                  <input
                    id="input-other"
                    type="number"
                    value={otherCharges || ""}
                    onChange={(e) => setOtherCharges(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:border-zinc-500 font-semibold"
                    placeholder="Negativos diminuem total"
                  />
                </div>
              </div>
            </div>

            {/* Payments Ledger */}
            <div className="bg-white rounded-2xl border border-zinc-100 p-4 sm:p-4.5 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3">
                Valores Pagos Durante a Execução (Adiantamentos)
              </h2>

              {/* Add payment row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-zinc-50 p-3 rounded-xl border border-zinc-150">
                <div className="space-y-1">
                  <label htmlFor="input-pay-amount" className="text-[10px] font-bold text-zinc-400 uppercase">Valor R$</label>
                  <input
                    id="input-pay-amount"
                    type="number"
                    placeholder="0,00"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="select-pay-method" className="text-[10px] font-bold text-zinc-400 uppercase">Método</label>
                  <select
                    id="select-pay-method"
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 focus:outline-none font-semibold"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="select-pay-account" className="text-[10px] font-bold text-zinc-400 uppercase">Conta</label>
                  <select
                    id="select-pay-account"
                    value={payAccount}
                    onChange={(e) => setPayAccount(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 focus:outline-none font-semibold"
                  >
                    {FINANCIAL_ACCOUNTS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="input-pay-date" className="text-[10px] font-bold text-zinc-400 uppercase">Data</label>
                  <div className="flex gap-1.5">
                    <input
                      id="input-pay-date"
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-700 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddPayment}
                      className="bg-zinc-950 hover:bg-zinc-800 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Payments list */}
              {payments.length === 0 ? (
                <p className="text-xs text-zinc-400 py-3 text-center">Nenhum pagamento registrado nesta O.S.</p>
              ) : (
                <div className="space-y-1.5">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-100 bg-zinc-50/50 text-xs text-zinc-700"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-zinc-900">
                          {p.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                        <span className="text-zinc-400 font-medium">|</span>
                        <span className="font-semibold">{p.method}</span>
                        <span className="text-zinc-400 font-medium">|</span>
                        <span className="text-zinc-500 font-medium">{p.account}</span>
                        <span className="text-zinc-400 font-medium">|</span>
                        <span className="text-zinc-400">{p.date.split("-").reverse().join("/")}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePayment(p.id)}
                        className="text-zinc-400 hover:text-red-500 p-0.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Financial Breakdown, Status Selector & Dates */}
          <div className="space-y-6">
            {/* Status & Dates */}
            <div className="bg-white rounded-2xl border border-zinc-100 p-4 sm:p-4.5 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3 flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-zinc-500" />
                Situação & Prazos
              </h2>

              {/* Status */}
              <div className="space-y-1.5">
                <label htmlFor="select-status" className="text-xs font-bold text-zinc-650">Situação Atual</label>
                <select
                  id="select-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-700 font-bold focus:outline-none focus:border-zinc-500"
                >
                  <option value="montagem_orcamento">🛠 Aguardando aprovação</option>
                  {status === "aguardando_aprovacao" && (
                    <option value="aguardando_aprovacao">🛠 Aguardando aprovação</option>
                  )}
                  <option value="aprovado">✅ Aprovada em Andamento</option>
                  <option value="encerrado">🏁 Finalizado</option>
                  <option value="recusado">❌ Recusadas</option>
                </select>
              </div>

              {/* Expect Ready Date */}
              <div className="space-y-1.5">
                <label htmlFor="input-ready-date" className="text-xs font-bold text-zinc-600">Previsão de Entrega (Pronto em)</label>
                <input
                  id="input-ready-date"
                  type="date"
                  value={readyDate}
                  onChange={(e) => setReadyDate(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            {/* Financial Breakdown card */}
            <div className="bg-zinc-950 rounded-2xl p-6 text-white space-y-5 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px)] bg-[size:100px] opacity-10" />
              
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest leading-none border-b border-zinc-800 pb-3.5">
                Resumo Orçamentário
              </h2>

              <div className="space-y-3.5 text-xs">
                {/* Standard sub */}
                <div className="flex justify-between text-zinc-400 font-semibold">
                  <span>Mão de Obra</span>
                  <span>
                    {labor
                      .reduce((acc, curr) => acc + (curr.isOptional ? 0 : curr.total), 0)
                      .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>

                <div className="flex justify-between text-zinc-400 font-semibold">
                  <span>Peças / Insumos</span>
                  <span>
                    {parts
                      .reduce((acc, curr) => acc + (curr.isOptional ? 0 : curr.total), 0)
                      .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>

                {towingFee > 0 && (
                  <div className="flex justify-between text-zinc-400 font-semibold">
                    <span>Valor do Guincho</span>
                    <span>{towingFee.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </div>
                )}

                {otherCharges !== 0 && (
                  <div className="flex justify-between text-zinc-400 font-semibold">
                    <span>Outros Adicionais/Créditos</span>
                    <span className={otherCharges < 0 ? "text-emerald-400" : ""}>
                      {otherCharges.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                )}

                {discounts > 0 && (
                  <div className="flex justify-between text-red-400 font-semibold">
                    <span>Desconto</span>
                    <span>-{discounts.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </div>
                )}

                {/* Subtotal of Opcionais */}
                {(labor.some((l) => l.isOptional) || parts.some((p) => p.isOptional)) && (
                  <div className="border-t border-zinc-900 pt-3 flex justify-between text-[11px] text-amber-400 font-bold">
                    <span>Serviços / Peças Opcionais</span>
                    <span>
                      {(
                        labor.reduce((acc, curr) => acc + (curr.isOptional ? curr.total : 0), 0) +
                        parts.reduce((acc, curr) => acc + (curr.isOptional ? curr.total : 0), 0)
                      ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                )}

                {/* Ledger balances */}
                {payments.length > 0 && (
                  <>
                    <div className="border-t border-zinc-900 pt-3 flex justify-between text-zinc-400 font-semibold">
                      <span>Total Pago (Adiantado)</span>
                      <span>{totalPaid.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                    </div>
                    <div className="flex justify-between text-amber-500 font-bold">
                      <span>Saldo Restante</span>
                      <span>{balanceDue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Total Value */}
              <div className="border-t border-zinc-800 pt-4 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Geral</span>
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-none">
                  {totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer controls */}
      <div className="flex items-center justify-between border-t border-zinc-250 pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-650 hover:bg-zinc-50 font-bold text-xs tracking-wider transition-colors cursor-pointer"
        >
          CANCELAR
        </button>

        <div className="flex flex-wrap gap-2.5">
          {/* VOLTAR */}
          {activeStep !== steps[0].id && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                const stepKeys = steps.map((s) => s.id);
                const idx = stepKeys.indexOf(activeStep);
                if (idx > 0) setActiveStep(stepKeys[idx - 1]);
              }}
              className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-800 hover:bg-zinc-50 font-bold text-xs tracking-wider transition-colors cursor-pointer disabled:opacity-50"
            >
              VOLTAR
            </button>
          )}

          {/* SALVAR */}
          {activeStep !== "preview" && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveProgress(false)}
              className="px-4 py-2 rounded-xl border border-zinc-950 text-zinc-950 hover:bg-zinc-50 font-bold text-xs tracking-wider transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSaving ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-500/20 border-t-zinc-800" />
              ) : null}
              SALVAR
            </button>
          )}

          {/* SALVAR E AVANÇAR */}
          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              if (activeStep === "preview") {
                setActiveStep("general");
              } else {
                handleSaveProgress(true);
              }
            }}
            className="bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs tracking-wider px-5 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
          >
            {isSaving ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            ) : null}
            {activeStep === "preview"
              ? "AVANÇAR PARA EDIÇÃO"
              : activeStep === "financial"
              ? "SALVAR E FINALIZAR"
              : "SALVAR E AVANÇAR"}
          </button>
        </div>
      </div>
    </form>
  );
}
