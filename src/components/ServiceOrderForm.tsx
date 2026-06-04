import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "@/components/ui/toast";
import { Switch } from "@/components/ui/switch";
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
  ArrowLeft,
  ArrowRight,
  Save,
  Fuel,
  Play,
  ArrowUp,
  ArrowDown,
  Pencil,
  Printer,
  CheckCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Technician,
  Service,
  PartCatalogItem,
} from "@/types";
import MotorcycleDamageSelector from "./MotorcycleDamageSelector";
import ServiceOrderDetails from "./ServiceOrderDetails";
import { savePartCatalogAction } from "@/app/actions";

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
  technicians: Technician[];
  initialClientId?: string;
  onDeleteOS?: (id: string) => void;
  services: Service[];
  partsCatalog?: PartCatalogItem[];
}

export interface ServiceOrderFormHandle {
  /** Persiste silenciosamente os dados atuais da etapa no banco de dados. */
  saveNow: () => Promise<void>;
}


const STANDARD_PARTS = [
  { name: "Óleo Motul 5100 15W50 (1L)", code: "MT-15W50", cost: 45, price: 75 },
  { name: "Filtro de Óleo", code: "FO-102", cost: 25, price: 48 },
  { name: "Pastilha de Freio Dianteira", code: "PF-BR-01", cost: 95, price: 175 },
  { name: "Pastilha de Freio Traseira", code: "PF-BR-02", cost: 85, price: 160 },
  { name: "Kit Relação (Coroa/Pinhão/Corrente)", code: "KIT-REL-DID", cost: 240, price: 430 },
  { name: "Vela de Ignição Iridium", code: "NGK-IRID", cost: 55, price: 95 },
  { name: "Filtro de Ar Esportivo", code: "FA-SP-99", cost: 110, price: 210 },
];

const PAYMENT_METHODS = ["PIX", "Cartão de Crédito", "Cartão de Débito", "Dinheiro"];
const FINANCIAL_ACCOUNTS = [
  "Contas de Banco",
  "Pix Itau Juridico",
  "Pix Pagbank Juridico",
  "Dinheiro",
  "Maquininha Rede",
  "Maquininha Get Net"
];

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

const isVideoUrl = (url: string) => {
  if (!url) return false;
  if (url.startsWith("data:video/")) return true;
  const cleanUrl = url.split("?")[0].split("#")[0];
  const extension = cleanUrl.split(".").pop()?.toLowerCase();
  return ["mp4", "mov", "avi", "webm", "mkv", "3gp", "ogg"].includes(extension || "");
};

const parseEstimatedTimeToHours = (estTime: string): number => {
  if (!estTime) return 1;
  const hMatch = estTime.match(/(\d+)\s*h/i);
  const mMatch = estTime.match(/(\d+)\s*m/i);
  const hVal = hMatch ? parseInt(hMatch[1], 10) : 0;
  const mVal = mMatch ? parseInt(mMatch[1], 10) : 0;
  const totalHours = hVal + mVal / 60;
  return totalHours > 0 ? totalHours : 1;
};

const ServiceOrderForm = forwardRef<ServiceOrderFormHandle, ServiceOrderFormProps>(function ServiceOrderForm({
  initialData,
  clients,
  bikes,
  technicians = [],
  onSave,
  onCancel,
  onCloseOS,
  onUpdateOrder,
  initialClientId,
  onDeleteOS,
  services = [],
  partsCatalog = [],
}, ref) {
  const getSelectableTechnicians = (currentTechName?: string) => {
    const activeList = technicians
      .filter((t) => t.active)
      .map((t) => `${t.name} (${t.role})`);
    
    if (currentTechName && !activeList.includes(currentTechName)) {
      return [currentTechName, ...activeList];
    }
    
    if (activeList.length === 0) {
      return ["Administrador", "Carlos (Mecânico Chefe)", "Felipe (Auxiliar)", "Marcos (Especialista)"];
    }
    
    return activeList;
  };

  const getDefaultTechnician = () => {
    const active = technicians.find((t) => t.active);
    if (active) {
      return `${active.name} (${active.role})`;
    }
    return "Administrador";
  };

  const serviceOrderDetailsRef = useRef<any>(null);

  const steps = [
    ...(initialData ? [{ id: "preview" as const, label: "Visualização", icon: Eye }] : []),
    { id: "general" as const, label: "Cliente & Moto", icon: User },
    { id: "inspection" as const, label: "Vistoria e Avaliação", icon: Wrench },
    { id: "labor_parts" as const, label: "Serviços & Peças", icon: Package },
    { id: "notes" as const, label: "Laudo & Defeitos", icon: FileText },
    { id: "financial" as const, label: "Valores & Financeiro", icon: DollarSign },
  ];

  const [activeStep, setActiveStep] = useState<"preview" | "general" | "inspection" | "labor_parts" | "notes" | "financial">(
    initialData ? "preview" : "general"
  );

  // Core identifiers
  const [orderId, setOrderId] = useState<string | undefined>(initialData?.id);
  const [selectedClientId, setSelectedClientId] = useState(initialData?.clientId || initialClientId || "");
  const [selectedBikeId, setSelectedBikeId] = useState(initialData?.motorbikeId || "");
  const [completedStages, setCompletedStages] = useState<string[]>(initialData?.completedStages || []);
  const [status, setStatus] = useState<ServiceOrder["status"]>("montagem_orcamento");
  const [docType, setDocType] = useState<ServiceOrder["type"]>("orcamento");
  
  // Edit labor item states
  const [isEditLaborModalOpen, setIsEditLaborModalOpen] = useState(false);
  const [editingLaborItem, setEditingLaborItem] = useState<LaborItem | null>(null);
  const [editingLaborName, setEditingLaborName] = useState("");
  const [editingLaborObservations, setEditingLaborObservations] = useState("");
  
  // Edit part item states
  const [isEditPartModalOpen, setIsEditPartModalOpen] = useState(false);
  const [editingPartItem, setEditingPartItem] = useState<PartItem | null>(null);
  const [editingPartName, setEditingPartName] = useState("");
  const [editingPartCode, setEditingPartCode] = useState("");
  const [editingPartTechnician, setEditingPartTechnician] = useState("");
  const [editingPartQuantity, setEditingPartQuantity] = useState(1);
  const [editingPartSalePrice, setEditingPartSalePrice] = useState("");
  const [editingPartBrand, setEditingPartBrand] = useState("");
  const [editingPartSpecifications, setEditingPartSpecifications] = useState("");
  const [editingPartMeasurements, setEditingPartMeasurements] = useState("");

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
  const [brakePadsCondition, setBrakePadsCondition] = useState<{
    front: "novo" | "bom" | "ruim";
    rear: "novo" | "bom" | "ruim";
  }>({ front: "bom", rear: "bom" });
  const [accessories, setAccessories] = useState<string[]>([]);
  const [customAccessories, setCustomAccessories] = useState<string[]>([]);
  const [newAccessory, setNewAccessory] = useState("");
  const [damagePoints, setDamagePoints] = useState<DamagePoint[]>([]);
  interface GeneralProblemItem {
    id: string;
    description: string;
    type: string;
    photos: { url: string; notes?: string }[];
  }
  const [generalProblems, setGeneralProblems] = useState<GeneralProblemItem[]>([]);
  const [newProblemDescription, setNewProblemDescription] = useState("");
  const [newProblemType, setNewProblemType] = useState<string>("mecanico");
  const [newProblemPhotos, setNewProblemPhotos] = useState<{ url: string; notes?: string }[]>([]);
  const [newProblemPhotoUrl, setNewProblemPhotoUrl] = useState("");
  const [newProblemPhotoNotes, setNewProblemPhotoNotes] = useState("");
  const [newProblemDescriptionError, setNewProblemDescriptionError] = useState("");

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
  const [laborGeneralTechnician, setLaborGeneralTechnician] = useState("");
  const [partsGeneralTechnician, setPartsGeneralTechnician] = useState("");
  const [fuelRefuelingValue, setFuelRefuelingValue] = useState(0);
  const [fuelRefuelingLiters, setFuelRefuelingLiters] = useState(0);
  const [fuelRefuelingReceiptPhoto, setFuelRefuelingReceiptPhoto] = useState("");

  // Financial aggregates
  const [discounts, setDiscounts] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [towingFee, setTowingFee] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  // Payment Add states
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("PIX");
  const [payAccount, setPayAccount] = useState("Contas de Banco");
  const [payInstallments, setPayInstallments] = useState("1x (à vista)");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payReceiptPhoto, setPayReceiptPhoto] = useState("");

  // Dates
  const [readyDate, setReadyDate] = useState("");

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (initialClientId && !selectedClientId) {
      setSelectedClientId(initialClientId);
    }
  }, [initialClientId, selectedClientId]);

  useEffect(() => {
    if (!initialData && selectedClientId && !selectedBikeId) {
      const clientBikes = bikes.filter((b) => b.clientId === selectedClientId);
      if (clientBikes.length > 0) {
        setSelectedBikeId(clientBikes[0].id);
      }
    }
  }, [selectedClientId, bikes, selectedBikeId, initialData]);

  useEffect(() => {
    if (activeLightboxImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeLightboxImage]);

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
      if (initialData.brakePadsCondition) {
        setBrakePadsCondition(initialData.brakePadsCondition);
      }
      setAccessories(initialData.accessories);
      setCustomAccessories(initialData.customAccessories || []);
      setDamagePoints(initialData.damagePoints || []);
      // Parse problems
      let parsedProblems: GeneralProblemItem[] = [];
      const legacyElec = initialData.electricalProblems || "";
      const legacyMaint = initialData.maintenanceProblems || "";
      try {
        if (legacyMaint && legacyMaint.startsWith("[")) {
          parsedProblems = JSON.parse(legacyMaint);
        } else {
          if (legacyElec) {
            parsedProblems.push({
              id: "legacy-elec",
              description: legacyElec,
              type: "eletrico",
              photos: []
            });
          }
          if (legacyMaint) {
            parsedProblems.push({
              id: "legacy-maint",
              description: legacyMaint,
              type: "mecanico",
              photos: []
            });
          }
        }
      } catch (e) {
        console.error("Failed to parse problems", e);
      }
      setGeneralProblems(parsedProblems);
      setInspectionPhotos(initialData.inspectionPhotos || []);
      setCustomerComplaints(initialData.customerComplaints);
      setTechnicalReport(initialData.technicalReport || "");
      setInternalNotes(initialData.internalNotes || "");
      setLabor(initialData.labor || []);
      setParts(initialData.parts || []);
      setLaborGeneralTechnician(initialData.laborGeneralTechnician || "");
      setPartsGeneralTechnician(initialData.partsGeneralTechnician || "");
      setFuelRefuelingValue(initialData.fuelRefuelingValue ?? 0);
      setFuelRefuelingLiters(initialData.fuelRefuelingLiters ?? 0);
      setFuelRefuelingReceiptPhoto(initialData.fuelRefuelingReceiptPhoto || "");
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
    const total = activeLabor + activeParts + towingFee + otherCharges + fuelRefuelingValue - discounts;
    setTotalValue(Math.max(0, total));
  }, [labor, parts, towingFee, otherCharges, fuelRefuelingValue, discounts]);

  // Helpers to add labor/parts
  const handleAddCustomLabor = (isOptional = false) => {
    const newItem: LaborItem = {
      id: Math.random().toString(),
      name: "NOVO SERVIÇO",
      technician: laborGeneralTechnician || getDefaultTechnician(),
      hours: 1,
      hourlyRate: 100,
      total: 100,
      isOptional,
      isCustom: true,
    };
    setLabor([...labor, newItem]);
  };

  const handleAddStandardLabor = (serviceIdOrName: string, isOptional = false) => {
    const template = services.find((s) => s.id === serviceIdOrName || s.name === serviceIdOrName);
    if (!template) return;

    const estHours = parseEstimatedTimeToHours(template.estimatedTime);
    const total = Number(template.price);
    const rate = Math.round((total / estHours) * 100) / 100;

    const newItem: LaborItem = {
      id: Math.random().toString(),
      name: template.name,
      technician: laborGeneralTechnician || getDefaultTechnician(),
      hours: estHours,
      hourlyRate: rate,
      total: total,
      isOptional,
      isCustom: false,
    };
    setLabor([...labor, newItem]);
  };

  const handleSaveLaborEdit = (id: string, newName: string, newObservations: string) => {
    const updated = labor.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          name: newName,
          observations: newObservations,
        };
      }
      return item;
    });
    setLabor(updated);
    setIsEditLaborModalOpen(false);
    setEditingLaborItem(null);
  };

  const handleSavePartEdit = (
    id: string,
    updates: {
      name: string;
      code: string;
      technician: string;
      quantity: number;
      salePrice: number;
      brand: string;
      specifications: string;
      measurements: string;
    }
  ) => {
    const updated = parts.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          ...updates,
          total: updates.quantity * updates.salePrice,
        };
      }
      return item;
    });
    setParts(updated);
    setIsEditPartModalOpen(false);
    setEditingPartItem(null);
  };

  const triggerSavePart = () => {
    if (editingPartItem) {
      const normalizedPrice = editingPartSalePrice.replace(",", ".");
      const parsedPrice = Number(normalizedPrice) || 0;
      handleSavePartEdit(editingPartItem.id, {
        name: editingPartName,
        code: editingPartCode,
        brand: editingPartBrand,
        specifications: editingPartSpecifications,
        measurements: editingPartMeasurements,
        technician: editingPartTechnician,
        quantity: Number(editingPartQuantity),
        salePrice: parsedPrice,
      });
    }
  };

  const handleUpdateGeneralLaborTechnician = (tech: string) => {
    setLaborGeneralTechnician(tech);
    if (tech) {
      const updated = labor.map((item) => ({ ...item, technician: tech }));
      setLabor(updated);
    }
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

  const handlePromoteToMainLabor = (id: string) => {
    setLabor(
      labor.map((item) => {
        if (item.id === id) {
          return { ...item, isOptional: false };
        }
        return item;
      })
    );
    toast.success("Serviço opcional movido para a lista principal!");
  };

  const handleDemoteToOptionalLabor = (id: string) => {
    setLabor(
      labor.map((item) => {
        if (item.id === id) {
          return { ...item, isOptional: true };
        }
        return item;
      })
    );
    toast.success("Serviço principal movido para a lista de opcionais!");
  };

  const handlePromoteToMainPart = (id: string) => {
    setParts(
      parts.map((item) => {
        if (item.id === id) {
          return { ...item, isOptional: false };
        }
        return item;
      })
    );
    toast.success("Peça opcional movida para a lista principal!");
  };

  const handleDemoteToOptionalPart = (id: string) => {
    setParts(
      parts.map((item) => {
        if (item.id === id) {
          return { ...item, isOptional: true };
        }
        return item;
      })
    );
    toast.success("Peça principal movida para a lista de opcionais!");
  };

  const handleAddCustomPart = (isOptional = false) => {
    const newItem: PartItem = {
      id: Math.random().toString(),
      name: "Nova Peça",
      code: "",
      technician: partsGeneralTechnician || getDefaultTechnician(),
      cost: 0,
      salePrice: 0,
      quantity: 1,
      total: 0,
      isOptional,
      isCustom: true,
      brand: "",
      specifications: "",
      measurements: "",
    };
    setParts([...parts, newItem]);
  };

  const handleAddStandardPart = (partCode: string, isOptional = false) => {
    const template = partsCatalog.find((p) => p.code === partCode);
    if (!template) return;
    const newItem: PartItem = {
      id: Math.random().toString(),
      name: template.name,
      code: template.code,
      technician: partsGeneralTechnician || getDefaultTechnician(),
      cost: template.cost,
      salePrice: template.price,
      quantity: 1,
      total: template.price,
      isOptional,
      isCustom: false,
      brand: template.brand,
      specifications: template.technicalSpecifications || "",
      measurements: template.measurements || "",
    };
    setParts([...parts, newItem]);
  };

  const [isRegisterPartModalOpen, setIsRegisterPartModalOpen] = useState(false);
  const [registerPartTarget, setRegisterPartTarget] = useState<PartItem | null>(null);

  const handleOpenRegisterPart = (item: PartItem) => {
    setRegisterPartTarget(item);
    setIsRegisterPartModalOpen(true);
  };

  const handleConfirmRegisterPart = async () => {
    if (!registerPartTarget) return;
    try {
      await savePartCatalogAction({
        name: registerPartTarget.name,
        brand: registerPartTarget.brand || "",
        code: registerPartTarget.code || `AVULSA-${Date.now()}`,
        model: "",
        technicalSpecifications: registerPartTarget.specifications || "",
        measurements: registerPartTarget.measurements || "",
        price: registerPartTarget.salePrice || 0,
        cost: registerPartTarget.cost || 0,
        specificBikes: [],
      });
      toast.success(`"${registerPartTarget.name}" cadastrada no catálogo!`);
      setIsRegisterPartModalOpen(false);
      setRegisterPartTarget(null);
    } catch (e) {
      toast.error("Não foi possível salvar no catálogo.");
    }
  };

  const handleUpdateGeneralPartsTechnician = (tech: string) => {
    setPartsGeneralTechnician(tech);
    if (tech) {
      const updated = parts.map((item) => ({ ...item, technician: tech }));
      setParts(updated);
    }
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
    const normalizedAmt = payAmount.replace(",", ".");
    const amt = Number(normalizedAmt);
    if (!payAmount.trim()) {
      toast.error("Por favor, digite o valor do pagamento.");
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      toast.error("Por favor, insira um valor válido maior que zero (ex: 150,50).");
      return;
    }
    const newPay: PaymentItem = {
      id: Math.random().toString(),
      amount: amt,
      date: payDate,
      method: payMethod,
      account: payAccount,
      receiptPhoto: payReceiptPhoto || undefined,
      installments: payMethod === "Cartão de Crédito" ? payInstallments : undefined,
    };
    setPayments([...payments, newPay]);
    setPayAmount("");
    setPayReceiptPhoto("");
    setPayInstallments("1x (à vista)");
    toast.success("Pagamento adicionado com sucesso!");
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
  const [isBackgroundSaving, setIsBackgroundSaving] = useState(false);

  const saveProgressSilently = async (stepToMarkCompleted?: string) => {
    if (!selectedClientId || !selectedBikeId || activeStep === "preview") return;

    const hasEmptyProblem = generalProblems.some((p) => !p.description.trim());
    if (hasEmptyProblem) {
      return;
    }

    try {
      setIsBackgroundSaving(true);
      const finalType = (status === "aprovado" || status === "encerrado") ? "os" : docType;

      let updatedStages = completedStages;
      if (stepToMarkCompleted && !completedStages.includes(stepToMarkCompleted)) {
        updatedStages = [...completedStages, stepToMarkCompleted];
        setCompletedStages(updatedStages);
      }

      const processedGeneralProblems = generalProblems.map((prob) => ({
        ...prob,
        description: prob.description.toUpperCase(),
        photos: prob.photos?.map((p) => ({
          ...p,
          notes: p.notes?.toUpperCase(),
        })),
      }));

      const processedInspectionPhotos = inspectionPhotos.map((photo) => ({
        ...photo,
        notes: photo.notes?.toUpperCase(),
      }));

      const processedLabor = labor.map((item) => ({
        ...item,
        name: item.name.toUpperCase(),
      }));

      const processedParts = parts.map((item) => ({
        ...item,
        name: item.name.toUpperCase(),
        code: item.code?.toUpperCase(),
        brand: item.brand?.toUpperCase(),
        specifications: item.specifications?.toUpperCase(),
        measurements: item.measurements?.toUpperCase(),
      }));

      const processedDamagePoints = damagePoints.map((point) => ({
        ...point,
        partName: point.partName.toUpperCase(),
      }));

      setGeneralProblems(processedGeneralProblems);
      setInspectionPhotos(processedInspectionPhotos);
      setLabor(processedLabor);
      setParts(processedParts);
      setDamagePoints(processedDamagePoints);

      const payload = {
        id: orderId,
        clientId: selectedClientId,
        motorbikeId: selectedBikeId,
        status,
        type: finalType,
        odometer,
        fuelLevel,
        tiresCondition,
        brakePadsCondition,
        accessories,
        customAccessories,
        damagePoints: processedDamagePoints,
        inspectionPhotos: processedInspectionPhotos,
        electricalProblems: processedGeneralProblems.filter((p) => p.type === "eletrico").map((p) => p.description).join(", ") || undefined,
        maintenanceProblems: JSON.stringify(processedGeneralProblems),
        customerComplaints: customerComplaints.trim(),
        technicalReport: technicalReport.trim() || undefined,
        internalNotes: internalNotes.trim() || undefined,
        labor: processedLabor,
        parts: processedParts,
        discounts,
        otherCharges,
        towingFee,
        totalValue,
        payments,
        readyDate: readyDate || undefined,
        exitDate: initialData?.exitDate || undefined,
        completedStages: updatedStages,
        laborGeneralTechnician: laborGeneralTechnician || undefined,
        partsGeneralTechnician: partsGeneralTechnician || undefined,
        fuelRefuelingValue,
        fuelRefuelingLiters,
        fuelRefuelingReceiptPhoto: fuelRefuelingReceiptPhoto || undefined,
      };

      const saved = await onSave(payload, true);
      if (saved) {
        setOrderId(saved.id);
      }
    } catch (e) {
      console.error("Erro no salvamento em segundo plano:", e);
      toast.error("Erro ao salvar progresso em segundo plano.");
    } finally {
      setIsBackgroundSaving(false);
    }
  };

  const handleSaveProgress = async (

    shouldAdvance: boolean,
    targetStep?: "preview" | "general" | "inspection" | "labor_parts" | "notes" | "financial"
  ) => {
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
    const hasEmptyProblem = generalProblems.some((p) => !p.description.trim());
    if (hasEmptyProblem) {
      toast.error("Por favor, preencha a descrição de todos os problemas identificados.");
      setActiveStep("inspection");
      return;
    }

    try {
      setIsSaving(true);

      const finalType = (status === "aprovado" || status === "encerrado") ? "os" : docType;

      const updatedStages = completedStages.includes(activeStep)
        ? completedStages
        : [...completedStages, activeStep];
      
      setCompletedStages(updatedStages);

      // Process payload inputs and uppercase relevant fields
      const processedGeneralProblems = generalProblems.map((prob) => ({
        ...prob,
        description: prob.description.toUpperCase(),
        photos: prob.photos?.map((p) => ({
          ...p,
          notes: p.notes?.toUpperCase(),
        })),
      }));

      const processedInspectionPhotos = inspectionPhotos.map((photo) => ({
        ...photo,
        notes: photo.notes?.toUpperCase(),
      }));

      const processedLabor = labor.map((item) => ({
        ...item,
        name: item.name.toUpperCase(),
      }));

      const processedParts = parts.map((item) => ({
        ...item,
        name: item.name.toUpperCase(),
        code: item.code?.toUpperCase(),
        brand: item.brand?.toUpperCase(),
        specifications: item.specifications?.toUpperCase(),
        measurements: item.measurements?.toUpperCase(),
      }));

      const processedDamagePoints = damagePoints.map((point) => ({
        ...point,
        partName: point.partName.toUpperCase(),
      }));

      // Update state to match converted data in the UI
      setGeneralProblems(processedGeneralProblems);
      setInspectionPhotos(processedInspectionPhotos);
      setLabor(processedLabor);
      setParts(processedParts);
      setDamagePoints(processedDamagePoints);

      const payload = {
        id: orderId,
        clientId: selectedClientId,
        motorbikeId: selectedBikeId,
        status,
        type: finalType,
        odometer,
        fuelLevel,
        tiresCondition,
        brakePadsCondition,
        accessories,
        customAccessories,
        damagePoints: processedDamagePoints,
        inspectionPhotos: processedInspectionPhotos,
        electricalProblems: processedGeneralProblems.filter((p) => p.type === "eletrico").map((p) => p.description).join(", ") || undefined,
        maintenanceProblems: JSON.stringify(processedGeneralProblems),
        customerComplaints: customerComplaints.trim(),
        technicalReport: technicalReport.trim() || undefined,
        internalNotes: internalNotes.trim() || undefined,
        labor: processedLabor,
        parts: processedParts,
        discounts,
        otherCharges,
        towingFee,
        totalValue,
        payments,
        readyDate: readyDate || undefined,
        exitDate: initialData?.exitDate || undefined,
        completedStages: updatedStages,
        laborGeneralTechnician: laborGeneralTechnician || undefined,
        partsGeneralTechnician: partsGeneralTechnician || undefined,
        fuelRefuelingValue,
        fuelRefuelingLiters,
        fuelRefuelingReceiptPhoto: fuelRefuelingReceiptPhoto || undefined,
      };

      const keepEditing = !(activeStep === "financial" && shouldAdvance && !targetStep);

      const saved = await onSave(payload, keepEditing);
      if (saved) {
        setOrderId(saved.id);
        if (keepEditing) {
          if (targetStep) {
            // Navigate to a specific requested step
            setActiveStep(targetStep);
          } else if (!shouldAdvance) {
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

  // Expose a saveNow() method so the parent can trigger a silent save before
  // navigating away via the sidebar (or any other external navigation).
  useImperativeHandle(ref, () => ({
    saveNow: async () => {
      // Only save if the form has enough data and we're not in preview-only mode
      if (!selectedClientId || !selectedBikeId || activeStep === "preview") return;
      try {
        setIsSaving(true);
        const finalType = (status === "aprovado" || status === "encerrado") ? "os" : docType;
        const updatedStages = completedStages.includes(activeStep)
          ? completedStages
          : [...completedStages, activeStep];

        // Process payload inputs and uppercase relevant fields
        const processedGeneralProblems = generalProblems.map((prob) => ({
          ...prob,
          description: prob.description.toUpperCase(),
          photos: prob.photos?.map((p) => ({
            ...p,
            notes: p.notes?.toUpperCase(),
          })),
        }));

        const processedInspectionPhotos = inspectionPhotos.map((photo) => ({
          ...photo,
          notes: photo.notes?.toUpperCase(),
        }));

        const processedLabor = labor.map((item) => ({
          ...item,
          name: item.name.toUpperCase(),
        }));

        const processedParts = parts.map((item) => ({
          ...item,
          name: item.name.toUpperCase(),
          code: item.code?.toUpperCase(),
          brand: item.brand?.toUpperCase(),
          specifications: item.specifications?.toUpperCase(),
          measurements: item.measurements?.toUpperCase(),
        }));

        const processedDamagePoints = damagePoints.map((point) => ({
          ...point,
          partName: point.partName.toUpperCase(),
        }));

        // Update state to match converted data in the UI
        setGeneralProblems(processedGeneralProblems);
        setInspectionPhotos(processedInspectionPhotos);
        setLabor(processedLabor);
        setParts(processedParts);
        setDamagePoints(processedDamagePoints);

        const payload = {
          id: orderId,
          clientId: selectedClientId,
          motorbikeId: selectedBikeId,
          status,
          type: finalType,
          odometer,
          fuelLevel,
          tiresCondition,
          brakePadsCondition,
          accessories,
          customAccessories,
          damagePoints: processedDamagePoints,
          inspectionPhotos: processedInspectionPhotos,
          electricalProblems: processedGeneralProblems.filter((p) => p.type === "eletrico").map((p) => p.description).join(", ") || undefined,
          maintenanceProblems: JSON.stringify(processedGeneralProblems),
          customerComplaints: customerComplaints.trim(),
          technicalReport: technicalReport.trim() || undefined,
          internalNotes: internalNotes.trim() || undefined,
          labor: processedLabor,
          parts: processedParts,
          discounts,
          otherCharges,
          towingFee,
          totalValue,
          payments,
          readyDate: readyDate || undefined,
          exitDate: initialData?.exitDate || undefined,
          completedStages: updatedStages,
          laborGeneralTechnician: laborGeneralTechnician || undefined,
          partsGeneralTechnician: partsGeneralTechnician || undefined,
          fuelRefuelingValue,
          fuelRefuelingLiters,
          fuelRefuelingReceiptPhoto: fuelRefuelingReceiptPhoto || undefined,
        };
        const saved = await onSave(payload, true);
        if (saved) setOrderId(saved.id);
      } catch (e) {
        console.error("saveNow error:", e);
      } finally {
        setIsSaving(false);
      }
    },
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4 animate-fade-in">
      {/* Wizard Header Navigation */}
      <div className="bg-white rounded-xl border border-zinc-300 p-2.5 sm:p-1.5 shadow-sm print:hidden">
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-1">
          <div className="flex flex-wrap flex-1 items-center gap-1">
            {steps.map((step) => {
              const StepIcon = step.icon;
              const isActive = activeStep === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    if (step.id === activeStep) return;
                    const currentStep = activeStep;
                    setActiveStep(step.id);
                    if (currentStep !== "preview" && selectedClientId && selectedBikeId) {
                      saveProgressSilently(currentStep);
                    }
                  }}
                  className={`flex-1 min-w-[100px] flex items-center justify-center md:justify-start gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
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
      </div>

      {/* Top Action Toolbar: Voltar | Status | Actions */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-3 bg-white rounded-xl border border-zinc-300 p-3 sm:p-2.5 shadow-sm print:hidden">

        {/* ROW 1 (mobile) / single row (desktop): Back button + Status selector */}
        <div className="flex items-center gap-2 sm:contents">
          {/* VOLTAR */}
          <button
            type="button"
            disabled={activeStep === steps[0].id}
            onClick={() => {
              const stepKeys = steps.map((s) => s.id);
              const idx = stepKeys.indexOf(activeStep);
              const prevStep = stepKeys[idx - 1] as typeof activeStep;
              const currentStep = activeStep;
              if (idx > 0) {
                setActiveStep(prevStep);
                if (currentStep !== "preview" && selectedClientId && selectedBikeId) {
                  saveProgressSilently(currentStep);
                }
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold text-xs tracking-wider transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed h-9"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Voltar</span>
          </button>

          {/* Status selector — only on preview step */}
          {activeStep === "preview" && (
            <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-bold text-zinc-755 h-9 flex-1 sm:flex-none">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider hidden sm:inline">Situação:</span>
              <select
                id="select-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="bg-transparent border-none text-xs font-bold text-zinc-700 focus:outline-none cursor-pointer w-full sm:w-auto"
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
          )}

          {/* Non-preview: desktop action buttons sit here on the right */}
          {activeStep !== "preview" && (
            <div className="hidden sm:flex items-center gap-2 sm:ml-auto">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveProgress(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 text-zinc-850 hover:bg-zinc-50 font-bold text-xs tracking-wider transition-colors cursor-pointer disabled:opacity-50 shadow-sm h-9"
              >
                {isSaving ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-400/30 border-t-zinc-700" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span>Salvar</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  if (activeStep === "financial") {
                    handleSaveProgress(true);
                  } else {
                    const stepKeys = steps.map((s) => s.id);
                    const idx = stepKeys.indexOf(activeStep);
                    const nextStep = stepKeys[idx + 1] as typeof activeStep;
                    const prevStep = activeStep;
                    setActiveStep(nextStep);
                    saveProgressSilently(prevStep);
                  }
                }}
                className="flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs tracking-wider px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-sm h-9"
              >
                {isSaving ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                ) : null}
                <span>{activeStep === "financial" ? "Finalizar" : "Avançar"}</span>
                {activeStep !== "financial" && <ArrowRight className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}

          {/* Preview: desktop action buttons */}
          {activeStep === "preview" && (
            <div className="hidden sm:flex items-center gap-2 sm:ml-auto">
              <button
                type="button"
                onClick={() => {
                  const originalTitle = document.title;
                  document.title = "";
                  if (typeof window !== "undefined" && (window as any).AndroidPrinter) {
                    (window as any).AndroidPrinter.print();
                  } else {
                    window.print();
                  }
                  document.title = originalTitle;
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold text-xs tracking-wider transition-colors cursor-pointer shadow-sm h-9 bg-white"
              >
                <Printer className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Imprimir O.S.</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStep("general")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold text-xs tracking-wider transition-colors cursor-pointer shadow-sm h-9 bg-white"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Editar O.S.</span>
              </button>

              {status !== "encerrado" && onCloseOS && (
                <button
                  type="button"
                  onClick={() => serviceOrderDetailsRef.current?.openCloseModal()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold text-xs transition-colors shadow-sm cursor-pointer h-9 bg-white"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Encerrar O.S</span>
                </button>
              )}

              {onDeleteOS && (
                <button
                  type="button"
                  onClick={() => serviceOrderDetailsRef.current?.openDeleteModal()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-600 hover:text-red-700 hover:bg-red-50/50 font-bold text-xs transition-colors cursor-pointer shadow-sm h-9"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Excluir O.S.</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ROW 2 (mobile only): Action buttons */}
        {activeStep !== "preview" && (
          <div className="flex sm:hidden items-center gap-2 w-full">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveProgress(false)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 text-zinc-850 hover:bg-zinc-50 font-bold text-xs tracking-wider transition-colors cursor-pointer disabled:opacity-50 shadow-sm h-9"
            >
              {isSaving ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-400/30 border-t-zinc-700" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>Salvar</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                if (activeStep === "financial") {
                  handleSaveProgress(true);
                } else {
                  const stepKeys = steps.map((s) => s.id);
                  const idx = stepKeys.indexOf(activeStep);
                  const nextStep = stepKeys[idx + 1] as typeof activeStep;
                  const prevStep = activeStep;
                  setActiveStep(nextStep);
                  saveProgressSilently(prevStep);
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs tracking-wider px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-sm h-9"
            >
              {isSaving ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : null}
              <span>{activeStep === "financial" ? "Finalizar" : "Avançar"}</span>
              {activeStep !== "financial" && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}

        {activeStep === "preview" && (
          <div className="flex sm:hidden items-center gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                const originalTitle = document.title;
                document.title = "";
                if (typeof window !== "undefined" && (window as any).AndroidPrinter) {
                  (window as any).AndroidPrinter.print();
                } else {
                  window.print();
                }
                document.title = originalTitle;
              }}
              className="flex-1 flex items-center justify-center px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold text-xs transition-colors cursor-pointer shadow-sm h-9 bg-white"
            >
              <Printer className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveStep("general")}
              className="flex-1 flex items-center justify-center px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold text-xs transition-colors cursor-pointer shadow-sm h-9 bg-white"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>

            {status !== "encerrado" && onCloseOS && (
              <button
                type="button"
                onClick={() => serviceOrderDetailsRef.current?.openCloseModal()}
                className="flex-1 flex items-center justify-center px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold text-xs transition-colors shadow-sm cursor-pointer h-9 bg-white"
              >
                <CheckCircle className="h-3.5 w-3.5" />
              </button>
            )}

            {onDeleteOS && (
              <button
                type="button"
                onClick={() => serviceOrderDetailsRef.current?.openDeleteModal()}
                className="flex-1 flex items-center justify-center px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-600 hover:text-red-700 hover:bg-red-50/50 font-bold text-xs transition-colors cursor-pointer shadow-sm h-9"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* STEP 0: Preview / Visualização */}
      {activeStep === "preview" && initialData && (
        <div className="animate-fade-in print:p-0">
          <ServiceOrderDetails
            ref={serviceOrderDetailsRef}
            order={initialData}
            previewMode={true}
            onCloseOS={onCloseOS}
            onUpdateOrder={onUpdateOrder}
            onDelete={onDeleteOS ? () => onDeleteOS(initialData.id) : undefined}
          />
        </div>
      )}

      {/* STEP 1: General Info */}
      {activeStep === "general" && (
        <div className="bg-white rounded-2xl border border-zinc-300 p-4 sm:p-4.5 shadow-sm space-y-4 animate-fade-in">
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
              <div className="py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
        <div className="space-y-4 animate-fade-in">
          {/* 1. Interactive Graphic (Full Width) */}
          <div className="bg-white rounded-xl border border-zinc-300 p-3.5 shadow-sm">
            <h2 className="text-xs font-bold text-zinc-900 border-b border-zinc-100 pb-2 mb-3">
              Mapa Visual de Avarias (Clique para marcar)
            </h2>
            <MotorcycleDamageSelector damagePoints={damagePoints} onChange={setDamagePoints} />
          </div>

          {/* 2. Grid of other 4 cards (2 in each row on desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Odometer, Fuel and Tires */}
            <div className="bg-white rounded-xl border border-zinc-300 p-3.5 shadow-sm space-y-3.5">
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

              {/* Brake Pads conditions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1.5 border-t border-zinc-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-650 block">Pastilha de Freio Dianteira</label>
                  <div className="grid grid-cols-3 gap-0.5 bg-zinc-50 border border-zinc-200 rounded-lg p-0.5">
                    {(["novo", "bom", "ruim"] as const).map((cond) => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => setBrakePadsCondition({ ...brakePadsCondition, front: cond })}
                        className={`py-1.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                          brakePadsCondition.front === cond
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
                  <label className="text-[10px] font-bold text-zinc-650 block">Pastilha de Freio Traseira</label>
                  <div className="grid grid-cols-3 gap-0.5 bg-zinc-50 border border-zinc-200 rounded-lg p-0.5">
                    {(["novo", "bom", "ruim"] as const).map((cond) => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => setBrakePadsCondition({ ...brakePadsCondition, rear: cond })}
                        className={`py-1.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                          brakePadsCondition.rear === cond
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
          </div>

          {/* Accessories Checklist */}
          <div className="bg-white rounded-xl border border-zinc-300 p-3.5 shadow-sm space-y-3">
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
                        : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    <span
                      className={`h-3 w-3 rounded flex items-center justify-center border text-[8px] shrink-0 ${
                        checked ? "bg-white border-white text-zinc-950 font-bold" : "border-zinc-300"
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
                  className="flex items-center justify-between p-1.5 px-2 rounded-lg border bg-zinc-950 border-zinc-950 text-white text-[11px] font-semibold group"
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
          <div className="bg-white rounded-xl border border-zinc-300 p-3.5 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-zinc-900 border-b border-zinc-100 pb-2">
              Problemas Gerais Identificados
            </h2>

            {generalProblems.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">Nenhum problema registrado ainda.</p>
            ) : (
              <div className="space-y-3">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-zinc-150 text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5 pr-2">Problema</th>
                      <th className="py-2.5 px-2 w-32">Tipo</th>
                      <th className="py-2.5 px-2">Fotos/Vídeos</th>
                      <th className="py-2.5 pl-2 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {generalProblems.map((prob) => (
                      <tr key={prob.id} className="border-b border-zinc-100 hover:bg-zinc-50/50">
                        <td className="py-2.5 pr-2">
                          <input
                            type="text"
                            value={prob.description}
                            onChange={(e) => {
                              const updated = generalProblems.map(p => p.id === prob.id ? { ...p, description: e.target.value } : p);
                              setGeneralProblems(updated);
                            }}
                            className={`bg-transparent font-semibold text-zinc-800 outline-none focus:bg-white focus:ring-1 focus:ring-zinc-200 px-1 py-0.5 rounded w-full ${
                              !prob.description.trim() 
                                ? "border border-red-500 focus:ring-red-500 bg-red-50/30" 
                                : "border-none"
                            }`}
                          />
                          {!prob.description.trim() && (
                            <p className="text-[9px] text-red-500 font-bold px-1 mt-0.5">Descrição obrigatória</p>
                          )}
                        </td>
                        <td className="py-2.5 px-2">
                          <select
                            value={prob.type}
                            onChange={(e) => {
                              const updated = generalProblems.map(p => p.id === prob.id ? { ...p, type: e.target.value } : p);
                              setGeneralProblems(updated);
                            }}
                            className="bg-transparent font-bold text-zinc-700 border-none outline-none focus:bg-white focus:ring-1 focus:ring-zinc-200 px-1 py-0.5 rounded w-full"
                          >
                            <option value="mecanico">🔧 Mecânico</option>
                            <option value="eletrico">⚡ Elétrico</option>
                            <option value="motor">⚙️ Motor</option>
                            <option value="suspensao_direcao">🏍️ Suspensão / Direção</option>
                            <option value="freios">🛑 Freios</option>
                            <option value="transmissao">⛓️ Transmissão</option>
                            <option value="alimentacao_injecao">⛽ Alimentação / Injeção</option>
                            <option value="estetica_carenagem">✨ Estética / Carenagem</option>
                            <option value="pneus_rodas">🛞 Pneus / Rodas</option>
                            <option value="outros">Outros</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="space-y-2">
                            {/* Thumbnails of attached files */}
                            {prob.photos && prob.photos.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {prob.photos.map((ph, idx) => (
                                  <div key={idx} className="relative shrink-0 border border-zinc-200 rounded-lg group">
                                    {isVideoUrl(ph.url) ? (
                                      <div className="relative w-16 h-16 cursor-zoom-in rounded-lg overflow-hidden bg-black flex items-center justify-center">
                                        <video 
                                          src={ph.url} 
                                          className="w-full h-full object-cover" 
                                          muted 
                                          playsInline 
                                          preload="metadata"
                                          onClick={() => setActiveLightboxImage(ph.url)}
                                        />
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                                          <Play className="h-6 w-6 text-white drop-shadow" fill="currentColor" />
                                        </div>
                                      </div>
                                    ) : (
                                      <img 
                                        src={ph.url} 
                                        alt="Problema" 
                                        onClick={() => setActiveLightboxImage(ph.url)}
                                        className="w-16 h-16 object-cover cursor-zoom-in rounded-lg" 
                                      />
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updatedPhotos = prob.photos.filter((_, photoIdx) => photoIdx !== idx);
                                        const updated = generalProblems.map(p => p.id === prob.id ? { ...p, photos: updatedPhotos } : p);
                                        setGeneralProblems(updated);
                                      }}
                                      className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[9px] font-bold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-sm z-10"
                                      title="Excluir foto"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Inline attachment input */}
                            <div className="flex items-center gap-1.5 max-w-xs">
                              <input
                                type="file"
                                accept="image/*,video/*"
                                id={`file-upload-${prob.id}`}
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      const url = reader.result as string;
                                      const updated = generalProblems.map(p => 
                                        p.id === prob.id 
                                          ? { ...p, photos: [...(p.photos || []), { url }] } 
                                          : p
                                      );
                                      setGeneralProblems(updated);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                              <label
                                htmlFor={`file-upload-${prob.id}`}
                                className="bg-zinc-950 hover:bg-zinc-800 text-white rounded px-2.5 py-1 text-[10px] font-bold transition-colors cursor-pointer shrink-0 flex items-center justify-center whitespace-nowrap"
                              >
                                📸 Anexar Foto/Vídeo
                              </label>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 pl-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setGeneralProblems(generalProblems.filter(p => p.id !== prob.id));
                            }}
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

            {/* Form to add a new problem to the list */}
            <div className="border-t border-zinc-100 pt-4 space-y-2 mt-3">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider leading-none">Registrar Novo Problema:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div className="space-y-1 md:col-span-2">
                  <input
                    type="text"
                    placeholder="Descrição do problema (ex: Farol queimado, vazamento de óleo)..."
                    value={newProblemDescription}
                    onChange={(e) => {
                      setNewProblemDescription(e.target.value);
                      if (e.target.value.trim()) {
                        setNewProblemDescriptionError("");
                      }
                    }}
                    className={`w-full bg-white rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 focus:outline-none font-semibold ${
                      newProblemDescriptionError 
                        ? "border border-red-500 focus:border-red-500 bg-red-50/30" 
                        : "border border-zinc-200 focus:border-zinc-500"
                    }`}
                  />
                  {newProblemDescriptionError && (
                    <p className="text-[10px] text-red-500 font-bold mt-0.5">{newProblemDescriptionError}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <select
                    value={newProblemType}
                    onChange={(e) => setNewProblemType(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1.5 text-xs text-zinc-700 focus:outline-none focus:border-zinc-500 font-bold"
                  >
                    <option value="mecanico">🔧 Mecânico</option>
                    <option value="eletrico">⚡ Elétrico</option>
                    <option value="motor">⚙️ Motor</option>
                    <option value="suspensao_direcao">🏍️ Suspensão / Direção</option>
                    <option value="freios">🛑 Freios</option>
                    <option value="transmissao">⛓️ Transmissão</option>
                    <option value="alimentacao_injecao">⛽ Alimentação / Injeção</option>
                    <option value="estetica_carenagem">✨ Estética / Carenagem</option>
                    <option value="pneus_rodas">🛞 Pneus / Rodas</option>
                    <option value="outros">📝 Outros</option>
                  </select>
                </div>
              </div>

              {/* Photos to attach to new problem */}
              <div className="space-y-2 pt-1">
                <p className="text-[9px] text-zinc-400 font-semibold leading-none">Anexar Fotos/Vídeos a este problema:</p>
                
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    id="new-problem-file-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewProblemPhotos([...newProblemPhotos, { url: reader.result as string }]);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label
                    htmlFor="new-problem-file-upload"
                    className="bg-zinc-950 hover:bg-zinc-800 text-white font-bold rounded px-3 py-1.5 text-[10px] transition-colors cursor-pointer flex items-center justify-center whitespace-nowrap"
                  >
                    📸 Selecionar e Anexar Arquivo
                  </label>
                </div>

                {newProblemPhotos.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {newProblemPhotos.map((ph, idx) => (
                      <div key={idx} className="relative border border-zinc-200 rounded-lg group shrink-0">
                        {isVideoUrl(ph.url) ? (
                          <div className="relative w-16 h-16 cursor-zoom-in rounded-lg overflow-hidden bg-black flex items-center justify-center">
                            <video 
                              src={ph.url} 
                              className="w-full h-full object-cover" 
                              muted 
                              playsInline 
                              preload="metadata"
                              onClick={() => setActiveLightboxImage(ph.url)}
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                              <Play className="h-6 w-6 text-white drop-shadow" fill="currentColor" />
                            </div>
                          </div>
                        ) : (
                          <img 
                            src={ph.url} 
                            alt="Pre-anexo" 
                            onClick={() => setActiveLightboxImage(ph.url)}
                            className="w-16 h-16 object-cover cursor-zoom-in rounded-lg" 
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => setNewProblemPhotos(newProblemPhotos.filter((_, i) => i !== idx))}
                          className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[9px] font-bold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-sm z-10"
                          title="Remover foto"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!newProblemDescription.trim()) {
                      setNewProblemDescriptionError("A descrição do problema é obrigatória.");
                      return;
                    }
                    const newProb = {
                      id: Math.random().toString(),
                      description: newProblemDescription.trim(),
                      type: newProblemType,
                      photos: newProblemPhotos
                    };
                    setGeneralProblems([...generalProblems, newProb]);
                    setNewProblemDescription("");
                    setNewProblemPhotos([]);
                    setNewProblemPhotoUrl("");
                    setNewProblemDescriptionError("");
                  }}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                >
                  + Adicionar Problema
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Labor & Parts */}
      {activeStep === "labor_parts" && (
        <div className="space-y-6">
          {/* Labor / Mão de Obra */}
          <div className="bg-white rounded-2xl border border-zinc-300 p-4 sm:p-4.5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-zinc-500" />
                Mão de Obra / Serviços
              </h2>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={laborGeneralTechnician}
                  onChange={(e) => handleUpdateGeneralLaborTechnician(e.target.value)}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 font-bold focus:outline-none w-full sm:w-auto"
                >
                  <option value="">Técnico Geral...</option>
                  {getSelectableTechnicians().map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2 w-full sm:w-auto">
                {/* Add standard */}
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleAddStandardLabor(e.target.value);
                  }}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 font-semibold focus:outline-none flex-1 min-w-0 sm:flex-initial sm:w-auto"
                >
                  <option value="">+ Adicionar Serviço Padrão...</option>
                  {services
                    .filter((s) => s.active)
                    .map((s) => {
                      const estHours = parseEstimatedTimeToHours(s.estimatedTime);
                      const rate = Math.round((Number(s.price) / estHours) * 100) / 100;
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name} ({estHours}h - R$ {rate}/h)
                        </option>
                      );
                    })}
                </select>
                <button
                  type="button"
                  onClick={() => handleAddCustomLabor(false)}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer flex-shrink-0"
                >
                  + Adicionar Avulso
                </button>
              </div>
            </div>
          </div>

            {/* Labor table */}
            {labor.filter((item) => !item.isOptional).length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">Nenhum serviço principal adicionado ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-zinc-150 text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5 pr-2">Serviço</th>
                      <th className="py-2.5 pl-2 pr-8 w-[312px]">Técnico</th>
                      <th className="py-2.5 px-2 w-16 text-center">Horas</th>
                      <th className="py-2.5 px-2 w-24 text-right">R$ / Hora</th>
                      <th className="py-2.5 px-2 w-24 text-right">Total</th>
                      <th className="py-2.5 px-2 w-16 text-center">Concluído</th>
                      <th className="py-2.5 pl-2 w-16 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {labor.filter((item) => !item.isOptional).map((item) => (
                      <tr key={item.id} className="border-b border-zinc-100 hover:bg-zinc-50/50">
                        <td className="py-2 pr-2">
                          <div className="flex items-center gap-1.5 px-1 py-0.5 group/edit">
                            <span className="font-semibold text-zinc-800 break-words max-w-[200px] sm:max-w-xs block">
                              {item.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLaborItem(item);
                                setEditingLaborName(item.name);
                                setEditingLaborObservations(item.observations || "");
                                setIsEditLaborModalOpen(true);
                              }}
                              className="text-zinc-400 hover:text-zinc-700 p-0.5 transition-colors cursor-pointer"
                              title="Editar serviço e observações"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {item.observations && (
                            <p className="text-[10px] text-zinc-500 font-medium px-1 mt-0.5 italic leading-tight">
                              Obs: {item.observations}
                            </p>
                          )}
                          {item.trackedSeconds !== undefined && item.trackedSeconds > 0 && (
                            <span className="text-[10px] text-zinc-400 font-semibold mt-0.5 flex items-center gap-1 px-1">
                              <Clock className="h-3 w-3" />
                              Tempo real: {Math.floor(item.trackedSeconds / 3600)}h {Math.floor((item.trackedSeconds % 3600) / 60)}m {item.trackedSeconds % 60}s
                            </span>
                          )}
                        </td>
                        <td className="py-2 pl-2 pr-8">
                          <select
                            value={item.technician}
                            onChange={(e) => handleUpdateLaborRow(item.id, "technician", e.target.value)}
                            className="bg-transparent font-medium text-zinc-700 border-none outline-none focus:bg-white focus:ring-1 focus:ring-zinc-200 px-1 py-0.5 rounded w-full"
                          >
                            {getSelectableTechnicians(item.technician).map((t) => (
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
                          <Switch
                            checked={item.isCompleted || false}
                            onCheckedChange={(checked) => handleUpdateLaborRow(item.id, "isCompleted", checked)}
                            title={item.isCompleted ? "Serviço concluído" : "Marcar como concluído"}
                          />
                        </td>
                        <td className="py-2 pl-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDemoteToOptionalLabor(item.id)}
                              className="text-zinc-400 hover:text-amber-600 p-1 rounded hover:bg-zinc-100 transition-colors cursor-pointer"
                              title="Mover para serviços opcionais"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveLabor(item.id)}
                              className="text-zinc-450 hover:text-red-500 p-1 rounded hover:bg-zinc-100 transition-colors cursor-pointer"
                              title="Remover serviço"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Abastecimento de Gasolina */}
          <div className="bg-white rounded-xl border border-zinc-300 p-2.5 sm:p-3 shadow-sm space-y-2">
            <h2 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5 border-b border-zinc-100 pb-1.5 uppercase tracking-wider">
              <Fuel className="h-4 w-4 text-zinc-500" />
              Abastecimento de Combustível (Gasolina)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-zinc-500 block">Valor do Abastecimento (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={fuelRefuelingValue || ""}
                  onChange={(e) => setFuelRefuelingValue(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-xs text-zinc-705 font-semibold focus:outline-none focus:border-zinc-500"
                  placeholder="Ex: 50.00"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-zinc-500 block">Quantidade (Litros)</label>
                <input
                  type="number"
                  step="0.01"
                  value={fuelRefuelingLiters || ""}
                  onChange={(e) => setFuelRefuelingLiters(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-xs text-zinc-705 font-semibold focus:outline-none focus:border-zinc-500"
                  placeholder="Ex: 8.5"
                />
              </div>

              <div className="space-y-0.5 sm:col-span-2">
                <label className="text-[10px] font-bold text-zinc-500 block">Comprovante (Foto)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="file"
                    id="fuel-receipt-upload"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFuelRefuelingReceiptPhoto(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="fuel-receipt-upload"
                    className="bg-zinc-950 hover:bg-zinc-800 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors shrink-0 cursor-pointer flex items-center justify-center whitespace-nowrap"
                  >
                    📸 Selecionar e Anexar Foto
                  </label>
                </div>
              </div>
            </div>

            {fuelRefuelingReceiptPhoto && (
              <div className="mt-1.5 relative border border-zinc-200 rounded-lg group shrink-0 w-16 h-16">
                <img 
                  src={fuelRefuelingReceiptPhoto} 
                  alt="Comprovante de Gasolina" 
                  onClick={() => setActiveLightboxImage(fuelRefuelingReceiptPhoto)}
                  className="w-16 h-16 object-cover cursor-zoom-in rounded-lg" 
                />
                <button
                  type="button"
                  onClick={() => setFuelRefuelingReceiptPhoto("")}
                  className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[9px] font-bold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-sm z-10"
                  title="Remover comprovante"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Serviços Opcionais */}
          <div className="bg-white rounded-2xl border border-zinc-300 p-4 sm:p-4.5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-zinc-500" />
                Serviços Opcionais
              </h2>

              <div className="flex gap-2 w-full sm:w-auto">
                {/* Add standard */}
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleAddStandardLabor(e.target.value, true);
                  }}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 font-semibold focus:outline-none flex-1 min-w-0 sm:flex-initial sm:w-auto"
                >
                  <option value="">+ Adicionar Serviço Opcional...</option>
                  {services
                    .filter((s) => s.active)
                    .map((s) => {
                      const estHours = parseEstimatedTimeToHours(s.estimatedTime);
                      const rate = Math.round((Number(s.price) / estHours) * 100) / 100;
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name} ({estHours}h - R$ {rate}/h)
                        </option>
                      );
                    })}
                </select>
                <button
                  type="button"
                  onClick={() => handleAddCustomLabor(true)}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer flex-shrink-0"
                >
                  + Adicionar Avulso
                </button>
              </div>
            </div>

            {/* Optional Labor table */}
            {labor.filter((item) => item.isOptional).length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">Nenhum serviço opcional adicionado ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-zinc-150 text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5 pr-2">Serviço</th>
                      <th className="py-2.5 pl-2 pr-8 w-[312px]">Técnico</th>
                      <th className="py-2.5 px-2 w-16 text-center">Horas</th>
                      <th className="py-2.5 px-2 w-24 text-right">R$ / Hora</th>
                      <th className="py-2.5 px-2 w-24 text-right">Total</th>
                      <th className="py-2.5 px-2 w-16 text-center">Concluído</th>
                      <th className="py-2.5 pl-2 w-16 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {labor.filter((item) => item.isOptional).map((item) => (
                      <tr key={item.id} className="border-b border-zinc-100 hover:bg-zinc-50/50 text-amber-600 bg-amber-50/5/5">
                        <td className="py-2 pr-2 font-semibold">
                          <div className="flex items-center gap-1.5 px-1 py-0.5 group/edit">
                            <span className="font-semibold text-zinc-800 break-words max-w-[200px] sm:max-w-xs block">
                              {item.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLaborItem(item);
                                setEditingLaborName(item.name);
                                setEditingLaborObservations(item.observations || "");
                                setIsEditLaborModalOpen(true);
                              }}
                              className="text-zinc-400 hover:text-zinc-700 p-0.5 transition-colors cursor-pointer"
                              title="Editar serviço e observações"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {item.observations && (
                            <p className="text-[10px] text-zinc-500 font-medium px-1 mt-0.5 italic leading-tight">
                              Obs: {item.observations}
                            </p>
                          )}
                          {item.trackedSeconds !== undefined && item.trackedSeconds > 0 && (
                            <span className="text-[10px] text-zinc-400 font-semibold mt-0.5 flex items-center gap-1 px-1">
                              <Clock className="h-3 w-3" />
                              Tempo real: {Math.floor(item.trackedSeconds / 3600)}h {Math.floor((item.trackedSeconds % 3600) / 60)}m {item.trackedSeconds % 60}s
                            </span>
                          )}
                        </td>
                        <td className="py-2 pl-2 pr-8 font-medium">
                          <select
                            value={item.technician}
                            onChange={(e) => handleUpdateLaborRow(item.id, "technician", e.target.value)}
                            className="bg-transparent font-medium border-none outline-none focus:bg-white focus:ring-1 focus:ring-zinc-200 px-1 py-0.5 rounded w-full"
                          >
                            {getSelectableTechnicians(item.technician).map((t) => (
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
                            className="bg-transparent font-medium text-center border-none outline-none focus:bg-white focus:ring-1 focus:ring-zinc-200 px-1 py-0.5 rounded w-full"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={item.hourlyRate}
                            onChange={(e) => handleUpdateLaborRow(item.id, "hourlyRate", Number(e.target.value))}
                            className="bg-transparent font-medium text-right border-none outline-none focus:bg-white focus:ring-1 focus:ring-zinc-200 px-1 py-0.5 rounded w-full"
                          />
                        </td>
                        <td className="py-2 px-2 font-bold text-right">
                          {(item.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <Switch
                            checked={item.isCompleted || false}
                            onCheckedChange={(checked) => handleUpdateLaborRow(item.id, "isCompleted", checked)}
                            title={item.isCompleted ? "Serviço concluído" : "Marcar como concluído"}
                          />
                        </td>
                        <td className="py-2 pl-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handlePromoteToMainLabor(item.id)}
                              className="text-zinc-400 hover:text-emerald-600 p-1 rounded hover:bg-zinc-100 transition-colors cursor-pointer"
                              title="Mover para serviços principais"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveLabor(item.id)}
                              className="text-zinc-450 hover:text-red-500 p-1 rounded hover:bg-zinc-100 transition-colors cursor-pointer"
                              title="Remover serviço"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Parts / Peças */}
          <div className="bg-white rounded-2xl border border-zinc-300 p-4 sm:p-4.5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Package className="h-4.5 w-4.5 text-zinc-500" />
                Peças / Insumos
              </h2>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={partsGeneralTechnician}
                  onChange={(e) => handleUpdateGeneralPartsTechnician(e.target.value)}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 font-bold focus:outline-none w-full sm:w-auto"
                >
                  <option value="">Técnico Geral...</option>
                  {getSelectableTechnicians().map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2 w-full sm:w-auto">
                {/* Add standard */}
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleAddStandardPart(e.target.value);
                  }}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 font-semibold focus:outline-none flex-1 min-w-0 sm:flex-initial sm:w-auto"
                >
                  <option value="">+ Adicionar do Catálogo...</option>
                  {partsCatalog.filter(p => p.active).map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name} {p.code ? `[${p.code}]` : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleAddCustomPart(false)}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer flex-shrink-0"
                >
                  + Adicionar Avulsa
                </button>
              </div>
            </div>
          </div>

            {/* Parts table */}
            {parts.filter((item) => !item.isOptional).length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">Nenhuma peça principal adicionada ainda.</p>
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
                      <th className="py-2.5 px-2 w-24 text-center">Chegou?</th>
                      <th className="py-2.5 pl-2 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.filter((item) => !item.isOptional).map((item) => (
                      <React.Fragment key={item.id}>
                        <tr className="border-b border-zinc-100 hover:bg-zinc-50/50">
                          <td className="py-2 pr-2">
                            <div className="flex items-center gap-1.5 px-1 py-0.5 group/edit">
                              <span className="font-semibold text-zinc-800 break-words max-w-[200px] sm:max-w-xs block">
                                {item.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPartItem(item);
                                  setEditingPartName(item.name);
                                  setEditingPartCode(item.code || "");
                                  setEditingPartTechnician(item.technician);
                                  setEditingPartQuantity(item.quantity);
                                  setEditingPartSalePrice(item.salePrice.toString().replace(".", ","));
                                  setEditingPartBrand(item.brand || "");
                                  setEditingPartSpecifications(item.specifications || "");
                                  setEditingPartMeasurements(item.measurements || "");
                                  setIsEditPartModalOpen(true);
                                }}
                                className="text-zinc-450 hover:text-zinc-700 p-0.5 transition-colors cursor-pointer"
                                title="Editar peça"
                              >
                                <Pencil className="h-3.5 w-3.5 text-zinc-450 hover:text-zinc-700" />
                              </button>
                            </div>
                            {(item.brand || item.specifications || item.measurements) && (
                              <div className="text-[10px] text-zinc-400 font-semibold px-1 mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 leading-tight">
                                {item.brand && (
                                  <span>Marca: <strong className="text-zinc-650 font-bold">{item.brand}</strong></span>
                                )}
                                {item.specifications && (
                                  <span>Specs: <strong className="text-zinc-650 font-bold">{item.specifications}</strong></span>
                                )}
                                {item.measurements && (
                                  <span>Medidas: <strong className="text-zinc-650 font-bold">{item.measurements}</strong></span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-2 font-mono text-zinc-650 font-medium">
                            {item.code || "-"}
                          </td>
                          <td className="py-2 px-2 font-medium text-zinc-700">
                            {item.technician}
                          </td>
                          <td className="py-2 px-2 font-medium text-zinc-700 text-center">
                            {item.quantity}
                          </td>
                          <td className="py-2 px-2 font-medium text-zinc-700 text-right">
                            {item.salePrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </td>
                          <td className="py-2 px-2 font-bold text-zinc-800 text-right">
                            {(item.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <Switch
                              checked={item.hasArrived || false}
                              onCheckedChange={(checked) => handleUpdatePartRow(item.id, "hasArrived", checked)}
                              title={item.hasArrived ? "Peça chegou" : "Marcar como entregue/chegou"}
                            />
                          </td>
                          <td className="py-2 pl-2 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {item.isCustom && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRegisterPart(item)}
                                  className="text-zinc-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                                  title="Cadastrar no catálogo de peças"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDemoteToOptionalPart(item.id)}
                                className="text-zinc-400 hover:text-amber-600 p-1 rounded hover:bg-zinc-100 transition-colors cursor-pointer"
                                title="Mover para peças opcionais"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemovePart(item.id)}
                                className="text-zinc-400 hover:text-red-500 p-1 rounded hover:bg-zinc-100 transition-colors cursor-pointer"
                                title="Remover peça"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
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

          {/* Peças Opcionais */}
          <div className="bg-white rounded-2xl border border-zinc-300 p-4 sm:p-4.5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Package className="h-4.5 w-4.5 text-zinc-500" />
                Peças Opcionais
              </h2>

              <div className="flex gap-2 w-full sm:w-auto">
                {/* Add standard */}
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleAddStandardPart(e.target.value, true);
                  }}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 font-semibold focus:outline-none flex-1 min-w-0 sm:flex-initial sm:w-auto"
                >
                  <option value="">+ Adicionar Opcional do Catálogo...</option>
                  {partsCatalog.filter(p => p.active).map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name} {p.code ? `[${p.code}]` : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleAddCustomPart(true)}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer flex-shrink-0"
                >
                  + Adicionar Avulsa
                </button>
              </div>
            </div>

            {/* Optional Parts table */}
            {parts.filter((item) => item.isOptional).length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">Nenhuma peça opcional adicionada ainda.</p>
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
                      <th className="py-2.5 px-2 w-24 text-center">Chegou?</th>
                      <th className="py-2.5 pl-2 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.filter((item) => item.isOptional).map((item) => (
                      <React.Fragment key={item.id}>
                        <tr className="border-b border-zinc-100 hover:bg-zinc-50/50 text-amber-600 italic bg-amber-50/5/5">
                          <td className="py-2 pr-2 font-semibold">
                            <div className="flex items-center gap-1.5 px-1 py-0.5 group/edit">
                              <span className="font-semibold break-words max-w-[200px] sm:max-w-xs block">
                                {item.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPartItem(item);
                                  setEditingPartName(item.name);
                                  setEditingPartCode(item.code || "");
                                  setEditingPartTechnician(item.technician);
                                  setEditingPartQuantity(item.quantity);
                                  setEditingPartSalePrice(item.salePrice.toString().replace(".", ","));
                                  setEditingPartBrand(item.brand || "");
                                  setEditingPartSpecifications(item.specifications || "");
                                  setEditingPartMeasurements(item.measurements || "");
                                  setIsEditPartModalOpen(true);
                                }}
                                className="text-zinc-455 hover:text-amber-700 p-0.5 transition-colors cursor-pointer"
                                title="Editar peça"
                              >
                                <Pencil className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-700" />
                              </button>
                            </div>
                            {(item.brand || item.specifications || item.measurements) && (
                              <div className="text-[10px] text-zinc-400 font-semibold px-1 mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 leading-tight not-italic">
                                {item.brand && (
                                  <span>Marca: <strong className="text-zinc-600 font-bold">{item.brand}</strong></span>
                                )}
                                {item.specifications && (
                                  <span>Specs: <strong className="text-zinc-600 font-bold">{item.specifications}</strong></span>
                                )}
                                {item.measurements && (
                                  <span>Medidas: <strong className="text-zinc-600 font-bold">{item.measurements}</strong></span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-2 font-mono text-zinc-650 font-medium">
                            {item.code || "-"}
                          </td>
                          <td className="py-2 px-2 font-medium text-zinc-700">
                            {item.technician}
                          </td>
                          <td className="py-2 px-2 font-medium text-zinc-700 text-center">
                            {item.quantity}
                          </td>
                          <td className="py-2 px-2 font-medium text-zinc-700 text-right">
                            {item.salePrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </td>
                          <td className="py-2 px-2 font-bold text-right">
                            {(item.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <Switch
                              checked={item.hasArrived || false}
                              onCheckedChange={(checked) => handleUpdatePartRow(item.id, "hasArrived", checked)}
                              title={item.hasArrived ? "Peça chegou" : "Marcar como entregue/chegou"}
                            />
                          </td>
                          <td className="py-2 pl-2 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handlePromoteToMainPart(item.id)}
                                className="text-zinc-400 hover:text-emerald-600 p-1 rounded hover:bg-zinc-100 transition-colors cursor-pointer"
                                title="Mover para peças principais"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemovePart(item.id)}
                                className="text-zinc-400 hover:text-red-500 p-1 rounded hover:bg-zinc-100 transition-colors cursor-pointer"
                                title="Remover peça"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
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
        <div className="bg-white rounded-2xl border border-zinc-300 p-4 sm:p-4.5 shadow-sm space-y-4">
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
            <div className="bg-white rounded-2xl border border-zinc-300 p-4 sm:p-4.5 shadow-sm space-y-3">
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
                  />
                </div>
              </div>
            </div>

            {/* Payments Ledger */}
            <div className="bg-white rounded-2xl border border-zinc-300 p-4 sm:p-4.5 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3">
                Valores Pagos Durante a Execução (Adiantamentos)
              </h2>

              {/* Add payment container */}
              <div className="border-t border-zinc-100 pt-4 space-y-4">
                {/* Inputs Row */}
                <div className={`grid grid-cols-1 ${payMethod === "Cartão de Crédito" ? "sm:grid-cols-5" : "sm:grid-cols-4"} gap-3`}>
                  <div className="space-y-1">
                    <label htmlFor="input-pay-amount" className="text-[10px] font-bold text-zinc-400 uppercase">Valor R$</label>
                    <input
                      id="input-pay-amount"
                      type="text"
                      placeholder="0,00"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-705 focus:outline-none focus:border-zinc-500 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="select-pay-method" className="text-[10px] font-bold text-zinc-400 uppercase">Método</label>
                    <select
                      id="select-pay-method"
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-705 focus:outline-none font-semibold"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  {payMethod === "Cartão de Crédito" && (
                    <div className="space-y-1">
                      <label htmlFor="select-pay-installments" className="text-[10px] font-bold text-zinc-400 uppercase">Parcelas</label>
                      <select
                        id="select-pay-installments"
                        value={payInstallments}
                        onChange={(e) => setPayInstallments(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-705 focus:outline-none font-semibold"
                      >
                        <option value="1x (à vista)">1x (à vista)</option>
                        {Array.from({ length: 11 }, (_, i) => i + 2).map((num) => (
                          <option key={num} value={`${num}x`}>
                            {num}x
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label htmlFor="select-pay-account" className="text-[10px] font-bold text-zinc-400 uppercase">Conta</label>
                    <select
                      id="select-pay-account"
                      value={payAccount}
                      onChange={(e) => setPayAccount(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-705 focus:outline-none font-semibold"
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
                    <input
                      id="input-pay-date"
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-705 focus:outline-none focus:border-zinc-500 font-semibold"
                    />
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  {/* Comprovante input and label */}
                  <div className="w-full sm:flex-1 relative">
                    <input
                      type="file"
                      id="pay-receipt-upload"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPayReceiptPhoto(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="pay-receipt-upload"
                      className={`w-full flex items-center justify-center gap-2 border rounded-xl py-2 px-4 text-xs font-bold transition-all cursor-pointer select-none shadow-sm ${
                        payReceiptPhoto 
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100/70"
                          : "bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50"
                      }`}
                      title={payReceiptPhoto ? "Comprovante anexado! Clique para trocar." : "Anexar comprovante de pagamento"}
                    >
                      {payReceiptPhoto ? "📸 Comprovante Anexado" : "📸 Anexar Comprovante"}
                    </label>
                  </div>

                  {/* Add button */}
                  <button
                    type="button"
                    onClick={handleAddPayment}
                    className="w-full sm:w-auto bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold px-6 py-2 rounded-xl text-xs transition-colors cursor-pointer shadow-sm tracking-wide"
                  >
                    Adicionar Pagamento
                  </button>
                </div>
              </div>

              {/* Payment preview attachment */}
              {payReceiptPhoto && (
                <div className="flex items-center gap-2.5 text-xs bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-xl animate-fade-in">
                  <div className="relative w-12 h-12 border border-zinc-200 rounded-lg group shrink-0">
                    <img 
                      src={payReceiptPhoto} 
                      alt="Prévia do Comprovante" 
                      onClick={() => setActiveLightboxImage(payReceiptPhoto)}
                      className="w-12 h-12 object-cover cursor-zoom-in rounded-lg" 
                    />
                    <button
                      type="button"
                      onClick={() => setPayReceiptPhoto("")}
                      className="absolute -top-1.5 -right-1.5 bg-red-650 hover:bg-red-500 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[9px] font-extrabold cursor-pointer shadow-sm z-10"
                      title="Remover comprovante"
                    >
                      ✕
                    </button>
                  </div>
                  <span className="text-[10px] text-emerald-800 font-bold leading-normal">
                    Prévia do Comprovante Anexado (Clique para ampliar ou no 'X' para remover antes de adicionar a O.S)
                  </span>
                </div>
              )}

              {/* Payments list */}
              {payments.length === 0 ? (
                <p className="text-xs text-zinc-400 py-3 text-center">Nenhum pagamento registrado nesta O.S.</p>
              ) : (
                <div className="space-y-1.5">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-300 bg-zinc-50/50 text-xs text-zinc-700"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-zinc-900">
                          {p.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                        <span className="text-zinc-400 font-medium">|</span>
                        <span className="font-semibold">
                          {p.method}
                          {p.method === "Cartão de Crédito" && p.installments && ` (${p.installments})`}
                        </span>
                        <span className="text-zinc-400 font-medium">|</span>
                        <span className="text-zinc-500 font-medium">{p.account}</span>
                        <span className="text-zinc-400 font-medium">|</span>
                        <span className="text-zinc-400">{p.date.split("-").reverse().join("/")}</span>

                        {p.receiptPhoto && (
                          <>
                            <span className="text-zinc-400 font-medium">|</span>
                            <div className="relative group shrink-0 h-6 w-10">
                              <img
                                src={p.receiptPhoto}
                                alt="Comprovante"
                                onClick={() => setActiveLightboxImage(p.receiptPhoto || null)}
                                className="h-6 w-10 object-cover cursor-zoom-in rounded border border-zinc-200 hover:scale-105 transition-all shadow-sm"
                                title="Ver comprovante de pagamento"
                              />
                            </div>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePayment(p.id)}
                        className="text-zinc-450 hover:text-red-500 p-1 rounded hover:bg-zinc-100 transition-colors cursor-pointer"
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

                {fuelRefuelingValue > 0 && (
                  <div className="flex justify-between text-zinc-400 font-semibold">
                    <span>Abastecimento de Combustível</span>
                    <span>{fuelRefuelingValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
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

      {isMounted && activeLightboxImage && createPortal(
        <div 
          className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {isVideoUrl(activeLightboxImage) ? (
              <video 
                src={activeLightboxImage} 
                className="max-w-full max-h-[85vh] object-contain" 
                controls
                autoPlay
                playsInline
              />
            ) : (
              <img 
                src={activeLightboxImage} 
                alt="Visualização" 
                className="max-w-full max-h-[85vh] object-contain"
              />
            )}
            <button
              onClick={() => setActiveLightboxImage(null)}
              className="absolute top-3.5 right-3.5 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2.5 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Editar Nome e Observações do Serviço */}
      <Dialog open={isEditLaborModalOpen} onOpenChange={setIsEditLaborModalOpen}>
        <DialogContent className="bg-white border-zinc-100 rounded-2xl max-w-sm shadow-xl mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-900">
              Editar Serviço
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-450 mt-1">
              Modifique a descrição do serviço ou adicione observações específicas para este item nesta OS.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Campo Descrição */}
            <div className="space-y-1.5">
              <label htmlFor="edit-labor-name" className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                Descrição do Serviço *
              </label>
              <input
                id="edit-labor-name"
                type="text"
                value={editingLaborName}
                onChange={(e) => setEditingLaborName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    document.getElementById("edit-labor-obs")?.focus();
                  }
                }}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-700 focus:outline-none focus:border-zinc-500"
                placeholder="Ex: Troca de pastilhas traseiras"
              />
            </div>

            {/* Campo Observações */}
            <div className="space-y-1.5">
              <label htmlFor="edit-labor-obs" className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                Observações
              </label>
              <textarea
                id="edit-labor-obs"
                rows={4}
                value={editingLaborObservations}
                onChange={(e) => setEditingLaborObservations(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    document.getElementById("btn-save-edit-labor")?.focus();
                  }
                }}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 focus:outline-none focus:border-zinc-500 resize-none"
                placeholder="Adicione observações sobre o estado das peças, reparos adicionais, etc..."
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsEditLaborModalOpen(false);
                setEditingLaborItem(null);
              }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-650 hover:bg-zinc-50 font-bold text-xs tracking-wider transition-colors cursor-pointer"
            >
              CANCELAR
            </button>
            <button
              id="btn-save-edit-labor"
              type="button"
              onClick={() => {
                if (editingLaborItem) {
                  handleSaveLaborEdit(editingLaborItem.id, editingLaborName, editingLaborObservations);
                }
              }}
              className="flex-1 bg-zinc-950 hover:bg-zinc-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              SALVAR
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Todos os Campos da Peça / Insumo */}
      <Dialog open={isEditPartModalOpen} onOpenChange={setIsEditPartModalOpen}>
        <DialogContent className="bg-white border-zinc-100 rounded-2xl max-w-lg shadow-xl mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-900">
              Editar Peça / Insumo
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-450 mt-1">
              Modifique as informações detalhadas desta peça para esta OS.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            {/* Nome da Peça */}
            <div className="space-y-1.5">
              <label htmlFor="edit-part-name" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Descrição da Peça *
              </label>
              <input
                id="edit-part-name"
                type="text"
                value={editingPartName}
                onChange={(e) => setEditingPartName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    document.getElementById("edit-part-code")?.focus();
                  }
                }}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 focus:outline-none focus:border-zinc-500"
                placeholder="Ex: Óleo Motul 5100 15W50 (1L)"
              />
            </div>

            {/* Código e Marca */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="edit-part-code" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Código
                </label>
                <input
                  id="edit-part-code"
                  type="text"
                  value={editingPartCode}
                  onChange={(e) => setEditingPartCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      document.getElementById("edit-part-brand")?.focus();
                    }
                  }}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 focus:outline-none focus:border-zinc-500 font-mono"
                  placeholder="Ex: MT-15W50"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="edit-part-brand" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Marca
                </label>
                <input
                  id="edit-part-brand"
                  type="text"
                  value={editingPartBrand}
                  onChange={(e) => setEditingPartBrand(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      document.getElementById("edit-part-specifications")?.focus();
                    }
                  }}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 focus:outline-none focus:border-zinc-500"
                  placeholder="Ex: Motul"
                />
              </div>
            </div>

            {/* Especificações Técnicas e Medidas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="edit-part-specifications" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Especificações Técnicas
                </label>
                <input
                  id="edit-part-specifications"
                  type="text"
                  value={editingPartSpecifications}
                  onChange={(e) => setEditingPartSpecifications(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      document.getElementById("edit-part-measurements")?.focus();
                    }
                  }}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 focus:outline-none focus:border-zinc-500"
                  placeholder="Ex: Semissintético"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="edit-part-measurements" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Medidas
                </label>
                <input
                  id="edit-part-measurements"
                  type="text"
                  value={editingPartMeasurements}
                  onChange={(e) => setEditingPartMeasurements(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      document.getElementById("edit-part-technician")?.focus();
                    }
                  }}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 focus:outline-none focus:border-zinc-500"
                  placeholder="Ex: 20cmX30cm"
                />
              </div>
            </div>

            {/* Técnico Responsável */}
            <div className="space-y-1.5">
              <label htmlFor="edit-part-technician" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Técnico Responsável
              </label>
              <select
                id="edit-part-technician"
                value={editingPartTechnician}
                onChange={(e) => setEditingPartTechnician(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    document.getElementById("edit-part-quantity")?.focus();
                  }
                }}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 focus:outline-none focus:border-zinc-500"
              >
                {getSelectableTechnicians(editingPartTechnician).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantidade e Valor de Venda */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="edit-part-quantity" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Quantidade
                </label>
                <input
                  id="edit-part-quantity"
                  type="number"
                  value={editingPartQuantity}
                  onChange={(e) => setEditingPartQuantity(Number(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      document.getElementById("edit-part-sale-price")?.focus();
                    }
                  }}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 focus:outline-none focus:border-zinc-500"
                  min={1}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="edit-part-sale-price" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Preço de Venda (R$)
                </label>
                <input
                  id="edit-part-sale-price"
                  type="text"
                  placeholder="0,00"
                  value={editingPartSalePrice}
                  onChange={(e) => setEditingPartSalePrice(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      document.getElementById("btn-save-edit-part")?.focus();
                    }
                  }}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsEditPartModalOpen(false);
                setEditingPartItem(null);
              }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-650 hover:bg-zinc-50 font-bold text-xs tracking-wider transition-colors cursor-pointer"
            >
              CANCELAR
            </button>
            <button
              id="btn-save-edit-part"
              type="button"
              onClick={() => {
                if (editingPartItem) {
                  const normalizedPrice = editingPartSalePrice.replace(",", ".");
                  const parsedPrice = Number(normalizedPrice) || 0;
                  handleSavePartEdit(editingPartItem.id, {
                    name: editingPartName,
                    code: editingPartCode,
                    brand: editingPartBrand,
                    specifications: editingPartSpecifications,
                    measurements: editingPartMeasurements,
                    technician: editingPartTechnician,
                    quantity: Number(editingPartQuantity),
                    salePrice: parsedPrice,
                  });
                }
              }}
              className="flex-1 bg-zinc-950 hover:bg-zinc-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              SALVAR
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Cadastrar Peça no Catálogo */}
      <Dialog open={isRegisterPartModalOpen} onOpenChange={setIsRegisterPartModalOpen}>
        <DialogContent className="bg-white border-zinc-100 rounded-2xl max-w-md shadow-xl mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-900">Cadastrar no Catálogo</DialogTitle>
            <DialogDescription className="text-xs text-zinc-450 mt-1">
              Deseja cadastrar esta peça avulsa no catálogo de peças para uso futuro?
            </DialogDescription>
          </DialogHeader>
          {registerPartTarget && (
            <div className="py-3 space-y-2 text-xs">
              <div className="bg-zinc-50 rounded-xl border border-zinc-300 p-3 space-y-1">
                <p className="text-zinc-800 font-bold">{registerPartTarget.name}</p>
                {registerPartTarget.code && <p className="text-zinc-500 font-mono">Cód: {registerPartTarget.code}</p>}
                {registerPartTarget.brand && <p className="text-zinc-500">Marca: {registerPartTarget.brand}</p>}
              </div>
              <p className="text-zinc-400 text-[10px]">A peça será adicionada ao catálogo e poderá ser reutilizada em futuras Ordens de Serviço.</p>
            </div>
          )}
          <DialogFooter className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsRegisterPartModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-650 hover:bg-zinc-50 font-bold text-xs tracking-wider transition-colors cursor-pointer"
            >
              CANCELAR
            </button>
            <button
              type="button"
              onClick={handleConfirmRegisterPart}
              className="flex-1 bg-zinc-950 hover:bg-zinc-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              CADASTRAR
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
});

export default ServiceOrderForm;
