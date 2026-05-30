"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Edit,
  Printer,
  Calendar,
  User,
  Wrench,
  FileText,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Camera,
  Coins,
  ShieldCheck,
  Hash,
  Clock,
  Package,
  Play,
  Pause,
  Fuel,
} from "lucide-react";
import { FaMotorcycle } from "react-icons/fa6";
import { ServiceOrderWithRelations, PaymentItem, LaborItem } from "@/types";
import MotorcycleDamageSelector from "./MotorcycleDamageSelector";
import { toggleLaborTimerAction } from "@/app/actions";
import { toast } from "@/components/ui/toast";

const FINANCIAL_ACCOUNTS = ["Caixa Interno da Oficina", "Conta Corrente Itaú", "Conta PJ Nubank"];

interface ServiceOrderDetailsProps {
  order: ServiceOrderWithRelations;
  onBack?: () => void;
  onEdit?: () => void;
  onCloseOS?: (
    id: string,
    status: "encerrado",
    readyDate?: string,
    exitDate?: string,
    finalPayments?: PaymentItem[]
  ) => Promise<void>;
  onUpdateOrder?: (order: ServiceOrderWithRelations) => void;
  previewMode?: boolean;
}

const isVideoUrl = (url: string) => {
  if (!url) return false;
  if (url.startsWith("data:video/")) return true;
  const cleanUrl = url.split("?")[0].split("#")[0];
  const extension = cleanUrl.split(".").pop()?.toLowerCase();
  return ["mp4", "mov", "avi", "webm", "mkv", "3gp", "ogg"].includes(extension || "");
};

export default function ServiceOrderDetails({
  order,
  onBack,
  onEdit,
  onCloseOS,
  onUpdateOrder,
  previewMode = false,
}: ServiceOrderDetailsProps) {
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [exitDate, setExitDate] = useState(new Date().toISOString().split("T")[0]);
  const [finalPaymentAmount, setFinalPaymentAmount] = useState("");
  const [finalPaymentMethod, setFinalPaymentMethod] = useState("PIX");
  const [finalPaymentAccount, setFinalPaymentAccount] = useState("Caixa Interno da Oficina");
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Live stopwatch ticking state
  const [ticker, setTicker] = useState(0);
  const [togglingTimerId, setTogglingTimerId] = useState<string | null>(null);

  let parsedProblems: {
    id: string;
    description: string;
    type: "eletrico" | "mecanico";
    photos?: { url: string; notes?: string }[];
  }[] = [];
  let isJsonProblems = false;

  try {
    if (order.maintenanceProblems && order.maintenanceProblems.startsWith("[")) {
      parsedProblems = JSON.parse(order.maintenanceProblems);
      isJsonProblems = true;
    }
  } catch (e) {
    console.error("Failed to parse problems in ServiceOrderDetails", e);
  }

  useEffect(() => {
    const hasActiveTimer = order.labor.some((item) => !!item.timerStartedAt);
    if (!hasActiveTimer) return;

    const interval = setInterval(() => {
      setTicker((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [order.labor]);

  const getLaborTrackedTime = (item: LaborItem) => {
    let totalSecs = item.trackedSeconds || 0;
    if (item.timerStartedAt) {
      const elapsed = Math.round((new Date().getTime() - new Date(item.timerStartedAt).getTime()) / 1000);
      totalSecs += Math.max(0, elapsed);
    }
    
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleToggleTimer = async (laborItemId: string) => {
    try {
      setTogglingTimerId(laborItemId);
      const res = await toggleLaborTimerAction(order.id, laborItemId);
      if ("error" in res) {
        toast.error("Erro ao acionar cronômetro: " + res.error);
        return;
      }
      onUpdateOrder?.(res.serviceOrder);
      toast.success(res.serviceOrder.labor.find(l => l.id === laborItemId)?.timerStartedAt ? "Cronômetro iniciado!" : "Cronômetro pausado!");
    } catch (e) {
      console.error(e);
      toast.error("Erro de comunicação ao acionar cronômetro.");
    } finally {
      setTogglingTimerId(null);
    }
  };

  const getDocumentTitle = () => {
    if (order.type === "orcamento") {
      return "Orçamento de Serviço";
    }
    if (order.status === "encerrado") {
      return "Ordem de Serviço Encerrada";
    }
    return "Ordem de Serviço Atualizada";
  };

  const getDocumentInitials = () => {
    return order.type === "orcamento" ? "OR" : "OS";
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateOnly = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "montagem_orcamento":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Aguardando aprovação
          </span>
        );
      case "aguardando_aprovacao":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Aguardando aprovação
          </span>
        );
      case "aprovado":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Serviço Aprovado / Em Execução
          </span>
        );
      case "recusado":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Orçamento Recusado
          </span>
        );
      case "encerrado":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
            <span className="h-2 w-2 rounded-full bg-zinc-500" />
            OS Encerrada / Moto Entregue
          </span>
        );
      default:
        return null;
    }
  };

  // Math
  const totalPaid = order.payments.reduce((acc, curr) => acc + curr.amount, 0);
  const balanceDue = Math.max(0, order.totalValue - totalPaid);

  // Pre-fill final payment amount to match balance due
  const handleOpenCloseModal = () => {
    setFinalPaymentAmount(balanceDue.toFixed(2));
    setShowCloseModal(true);
  };

  const handleConfirmCloseOS = async () => {
    try {
      setIsSubmittingClose(true);
      const updatedPayments = [...order.payments];
      const finalAmt = Number(finalPaymentAmount);

      if (!isNaN(finalAmt) && finalAmt > 0) {
        updatedPayments.push({
          id: Math.random().toString(),
          amount: finalAmt,
          date: exitDate,
          method: finalPaymentMethod,
          account: finalPaymentAccount,
        });
      }

      await onCloseOS?.(order.id, "encerrado", order.readyDate, exitDate, updatedPayments);
      setShowCloseModal(false);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao encerrar a Ordem de Serviço.");
    } finally {
      setIsSubmittingClose(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in print:bg-white print:p-0">
      {/* Top Header controls (Hidden on print) */}
      {previewMode ? (
        <div className="flex items-center justify-end gap-2.5 border-b border-zinc-100 pb-3.5 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-semibold text-xs transition-colors cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Imprimir O.S.
          </button>

          {order.status !== "encerrado" && onCloseOS && (
            <button
              onClick={handleOpenCloseModal}
              className="flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
            >
              <CheckCircle className="h-4 w-4" />
              Encerrar O.S / Entregar Moto
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-3.5 print:hidden">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            VOLTAR
          </button>

          <div className="flex gap-2.5">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Imprimir O.S.
            </button>

            {order.status !== "encerrado" && (
              <>
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 text-zinc-800 hover:bg-zinc-50 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Edit className="h-4 w-4" />
                    Editar O.S
                  </button>
                )}
                
                {onCloseOS && (
                  <button
                    onClick={handleOpenCloseModal}
                    className="flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Encerrar O.S / Entregar Moto
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Printable Area Wrapper */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-4 sm:p-5.5 shadow-sm space-y-5.5 print:border-none print:shadow-none print:p-0">
        {/* Print-Exclusive Header */}
        <div className="hidden print:flex items-stretch justify-between gap-6 border-b-2 border-zinc-950 pb-5.5 mb-6">
          <div className="flex gap-4">
            <img src="/logo.png" alt="Agus Moto Conceito" className="h-14 w-auto object-contain shrink-0" />
            <div className="space-y-0.5">
              <h2 className="text-sm font-extrabold text-zinc-950 uppercase tracking-tight">Agus Moto Conceito</h2>
              <p className="text-[10px] font-semibold text-zinc-650">CNPJ: 20.504.719/0001-77</p>
              <p className="text-[10px] font-semibold text-zinc-650">R. das Oiticicas, 37 - Parque Jabaquara, São Paulo - SP</p>
              <p className="text-[10px] font-semibold text-zinc-650">CEP: 04346-090 · Tel/WhatsApp: (11) 2691-8227</p>
            </div>
          </div>
          <div className="text-right flex flex-col justify-between items-end">
            <div>
              <h1 className="text-sm font-black text-zinc-950 uppercase tracking-tight">
                {order.type === "orcamento" ? "Orçamento de Serviço" : "Ordem de Serviço"}
              </h1>
              <p className="text-xs font-bold text-zinc-650 mt-1">
                Número: <span className="font-mono text-zinc-950 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded font-black">#{String(order.osNumber).padStart(4, "0")}</span>
              </p>
            </div>
            <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider mt-2.5">
              Status: <span className="text-zinc-950 font-black">{order.status === "montagem_orcamento" || order.status === "aguardando_aprovacao" ? "Aguardando Aprovação" : order.status === "aprovado" ? "Aprovado / Em Execução" : order.status === "recusado" ? "Recusado" : "Encerrada / Entregue"}</span>
            </div>
          </div>
        </div>

        {/* Receipt Header (Screen Only) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 pb-3.5 print:hidden">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-md">
              {getDocumentInitials()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-zinc-950 leading-none">
                  {getDocumentTitle()}
                </h1>
                <span className="text-zinc-500 font-bold text-xs bg-zinc-50 border border-zinc-150 px-2 py-0.5 rounded font-mono">
                  #{String(order.osNumber).padStart(4, "0")}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1 font-semibold uppercase tracking-wider">
                Agus Moto Conceito
              </p>
            </div>
          </div>
          <div>{getStatusBadge(order.status)}</div>
        </div>

        {/* Client & Bike Meta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-zinc-100 pb-6 print:grid-cols-2 print:gap-4 print:pb-4">
          {/* Client Details */}
          <div className="space-y-3 print:space-y-1.5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 print:text-zinc-500">
              <User className="h-4 w-4 text-zinc-400 print:h-3.5 print:w-3.5" />
              Cliente (Responsável)
            </h3>
            <div className="bg-zinc-50/50 rounded-xl border border-zinc-100 p-3 space-y-1.5 text-xs print:bg-transparent print:border-none print:p-0">
              <p className="font-bold text-zinc-800 text-sm">{order.client.name}</p>
              {order.client.nickname && (
                <p className="text-zinc-500 font-semibold">Apelido: {order.client.nickname}</p>
              )}
              <p className="text-zinc-600 font-medium">CPF: {order.client.cpf || "Não informado"}</p>
              <p className="text-zinc-650 font-medium">Telefone: {order.client.phone}</p>
              {order.client.address.street || order.client.address.number || order.client.address.cep ? (
                <p className="text-zinc-500 text-[11px] leading-relaxed pt-1.5 border-t border-zinc-200/50 print:pt-1 print:border-zinc-100">
                  Endereço: {order.client.address.street || "Sem rua"}
                  {order.client.address.number ? `, Nº ${order.client.address.number}` : ""}
                  {order.client.address.complement && ` - ${order.client.address.complement}`}
                  <br />
                  CEP: {order.client.address.cep || "Não informado"}
                </p>
              ) : (
                <p className="text-zinc-400 text-[11px] leading-relaxed pt-1.5 border-t border-zinc-200/50 italic print:pt-1 print:border-zinc-100">
                  Endereço não informado
                </p>
              )}
            </div>
          </div>

          {/* Bike Details */}
          <div className="space-y-3 print:space-y-1.5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 print:text-zinc-500">
              <FaMotorcycle className="h-4 w-4 text-zinc-400 print:h-3.5 print:w-3.5" />
              Motocicleta
            </h3>
            <div className="bg-zinc-50/50 rounded-xl border border-zinc-100 p-3 space-y-1.5 text-xs print:bg-transparent print:border-none print:p-0">
              <p className="font-bold text-zinc-800 text-sm">
                {order.motorbike.brand} {order.motorbike.model}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1 text-zinc-600 font-medium print:grid-cols-2">
                <p>Placa: <span className="font-bold text-zinc-950 uppercase">{order.motorbike.plate}</span></p>
                <p>Cor: <span>{order.motorbike.color}</span></p>
                <p>Ano: <span>{order.motorbike.year}</span></p>
                <p className="col-span-2 truncate">Chassi: <span className="font-mono text-[11px]">{order.motorbike.vin}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Complaints Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <FileText className="h-4 w-4 text-zinc-400" />
            Defeitos Relatados / Reclamação do Cliente
          </h3>
          <div className="bg-amber-50/20 border border-amber-100/50 rounded-xl p-3 text-xs font-semibold text-zinc-800 leading-relaxed italic print:bg-transparent print:border-none print:p-0 print:text-zinc-700">
            "{order.customerComplaints}"
          </div>
        </div>

        {/* Checklist & Inspection Details */}
        <div className="space-y-4 print:space-y-2">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 print:text-zinc-500">
            <Wrench className="h-4 w-4 text-zinc-400 print:h-3.5 print:w-3.5" />
            Vistoria de Entrada (Checklist)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs print:grid-cols-3 print:gap-2">
            <div className="bg-zinc-50/60 rounded-xl p-3 border border-zinc-100 flex items-center justify-between print:bg-transparent print:p-1.5 print:border-none">
              <span className="text-zinc-500 font-semibold">Odômetro:</span>
              <span className="font-bold text-zinc-800">{order.odometer}</span>
            </div>
            <div className="bg-zinc-50/60 rounded-xl p-3 border border-zinc-100 flex items-center justify-between print:bg-transparent print:p-1.5 print:border-none">
              <span className="text-zinc-500 font-semibold">Nível Combustível:</span>
              <span className="font-bold text-zinc-800 uppercase">{order.fuelLevel}</span>
            </div>
            <div className="bg-zinc-50/60 rounded-xl p-3 border border-zinc-100 flex items-center justify-between print:bg-transparent print:p-1.5 print:border-none">
              <span className="text-zinc-500 font-semibold">Pneus (D / T):</span>
              <span className="font-bold text-zinc-800 uppercase">
                {order.tiresCondition.front} / {order.tiresCondition.rear}
              </span>
            </div>
          </div>

          {/* Accessories Checklist display */}
          <div className="bg-zinc-50/40 rounded-xl border border-zinc-100 p-3 space-y-1.5 print:bg-transparent print:border-none print:p-0">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider print:text-zinc-500">Acessórios Entregues:</p>
            {order.accessories.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">Nenhum acessório entregue.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {order.accessories.map((acc) => (
                  <span
                    key={acc}
                    className="inline-flex items-center gap-1 bg-zinc-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md print:bg-zinc-100 print:text-zinc-900 print:border print:border-zinc-200"
                  >
                    ✓ {acc}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Damage Map Viewer */}
          <div className="bg-zinc-50/20 border border-zinc-100 rounded-xl p-3 print:bg-transparent print:border-none print:p-0">
            <MotorcycleDamageSelector damagePoints={order.damagePoints} onChange={() => {}} readOnly={true} />
          </div>

          {/* General Electrical & Mechanical Remarks */}
          {(order.electricalProblems || order.maintenanceProblems) && (
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Avarias e Problemas Identificados</h4>
              {isJsonProblems ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs print:grid-cols-2 print:gap-2">
                  {parsedProblems.map((prob) => (
                    <div key={prob.id} className="bg-zinc-50/60 rounded-xl border border-zinc-100 p-3 print:bg-transparent print:border-none print:p-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                          prob.type === "eletrico" 
                            ? "bg-amber-100 text-amber-800" 
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {prob.type === "eletrico" ? "⚡ Elétrico" : "🔧 Mecânico/Geral"}
                        </span>
                        <p className="font-bold text-zinc-800">{prob.description}</p>
                      </div>

                      {prob.photos && prob.photos.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1 print:hidden">
                          {prob.photos.map((ph, idx) => (
                             <button
                               key={idx}
                               type="button"
                               onClick={() => setActiveLightboxImage(ph.url)}
                               className="border border-zinc-150 rounded-lg overflow-hidden bg-white hover:shadow-xs transition-shadow cursor-zoom-in relative"
                             >
                               {isVideoUrl(ph.url) ? (
                                 <div className="relative w-16 h-16 bg-black flex items-center justify-center">
                                   <video 
                                     src={ph.url} 
                                     className="w-full h-full object-cover" 
                                     muted 
                                     playsInline 
                                     preload="metadata"
                                   />
                                   <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                     <Play className="h-5 w-5 text-white drop-shadow" fill="currentColor" />
                                   </div>
                                 </div>
                               ) : (
                                 <img src={ph.url} alt="Problema" className="w-16 h-16 object-cover" />
                               )}
                             </button>
                           ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs print:grid-cols-2 print:gap-2">
                  {order.electricalProblems && (
                    <div className="bg-zinc-50/60 rounded-xl border border-zinc-100 p-3 print:bg-transparent print:border-none print:p-0">
                      <p className="font-bold text-zinc-700 mb-1">Avarias Elétricas:</p>
                      <p className="text-zinc-650 leading-relaxed font-semibold">{order.electricalProblems}</p>
                    </div>
                  )}
                  {order.maintenanceProblems && (
                    <div className="bg-zinc-50/60 rounded-xl border border-zinc-100 p-3 print:bg-transparent print:border-none print:p-0">
                      <p className="font-bold text-zinc-700 mb-1">Avarias Mecânicas/Gerais:</p>
                      <p className="text-zinc-650 leading-relaxed font-semibold">{order.maintenanceProblems}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Media Attachments */}
          {order.inspectionPhotos.length > 0 && (
            <div className="space-y-2 print:hidden">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Camera className="h-3.5 w-3.5" />
                Anexos Visuais ({order.inspectionPhotos.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {order.inspectionPhotos.map((photo) => (
                  <button
                    key={photo.url}
                    type="button"
                    onClick={() => setActiveLightboxImage(photo.url)}
                    className="border border-zinc-150 rounded-xl overflow-hidden bg-zinc-50 group hover:shadow-sm transition-all text-left cursor-zoom-in w-full"
                  >
                    {photo.type === "video" || isVideoUrl(photo.url) ? (
                      <div className="relative w-full h-20 bg-black flex items-center justify-center">
                        <video 
                          src={photo.url} 
                          className="w-full h-full object-cover" 
                          muted 
                          playsInline 
                          preload="metadata"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Play className="h-6 w-6 text-white drop-shadow" fill="currentColor" />
                        </div>
                      </div>
                    ) : (
                      <img src={photo.url} alt={photo.notes || "Inspeção"} className="w-full h-20 object-cover" />
                    )}
                    <div className="p-2 text-[10px] font-bold text-zinc-700 truncate">
                      {photo.notes || "Sem notas"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Labor and Parts Ledger */}
        <div className="space-y-6">
          {/* Services */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-1">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-400" />
                Serviços Prestados
              </h3>
              {order.laborGeneralTechnician && (
                <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-50 border border-zinc-150 px-2 py-0.5 rounded-md">
                  Técnico Responsável Geral: <strong className="text-zinc-800 font-bold">{order.laborGeneralTechnician}</strong>
                </span>
              )}
            </div>
            {order.labor.filter((item) => !item.isOptional).length === 0 ? (
              <p className="text-xs text-zinc-400 italic">Nenhum serviço principal registrado.</p>
            ) : (
              <div className="border border-zinc-100 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="py-1.5 px-3">Descrição</th>
                      <th className="py-1.5 px-2">Técnico</th>
                      <th className="py-1.5 px-2 w-20 text-center">Horas</th>
                      <th className="py-1.5 px-2 w-36 text-center">Cronômetro</th>
                      <th className="py-1.5 px-2 w-28 text-right">R$ / Hora</th>
                      <th className="py-1.5 px-3 w-28 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.labor
                      .filter((item) => !item.isOptional)
                      .map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-zinc-100 hover:bg-zinc-50/50 text-zinc-700"
                        >
                          <td className="py-1.5 px-3 font-bold">
                            {item.name}
                          </td>
                          <td className="py-1.5 px-2 font-medium">{item.technician}</td>
                          <td className="py-1.5 px-2 text-center font-medium">{item.hours}h</td>
                          <td className="py-1.5 px-2 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded leading-none ${
                                item.timerStartedAt 
                                  ? "bg-emerald-500/10 text-emerald-600 animate-pulse border border-emerald-200" 
                                  : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                              }`}>
                                {getLaborTrackedTime(item)}
                              </span>
                              
                              {order.status !== "encerrado" && (
                                <button
                                  type="button"
                                  disabled={togglingTimerId === item.id}
                                  onClick={() => handleToggleTimer(item.id)}
                                  className={`p-1 rounded transition-colors cursor-pointer border leading-none ${
                                    item.timerStartedAt
                                      ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
                                      : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                                  } disabled:opacity-50 print:hidden`}
                                  title={item.timerStartedAt ? "Pausar Serviço" : "Iniciar Serviço"}
                                >
                                  {item.timerStartedAt ? (
                                    <Pause className="h-3 w-3 fill-current" />
                                  ) : (
                                    <Play className="h-3 w-3 fill-current" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-1.5 px-2 text-right font-medium">{formatCurrency(item.hourlyRate)}</td>
                          <td className="py-1.5 px-3 text-right font-bold">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {order.fuelRefuelingValue > 0 && (
              <div className="mt-3 bg-zinc-50/50 border border-zinc-150 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="text-xs">
                  <span className="font-bold text-zinc-800 flex items-center gap-1.5">
                    <Fuel className="h-4 w-4 text-zinc-500" />
                    Abastecimento de Combustível (Gasolina):
                  </span>{" "}
                  <span className="text-zinc-650 font-semibold mt-1 sm:mt-0">
                    {formatCurrency(order.fuelRefuelingValue)} ({order.fuelRefuelingLiters} Litros)
                  </span>
                </div>
                {order.fuelRefuelingReceiptPhoto && (
                  <div className="flex items-center gap-2 print:hidden">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Comprovante:</span>
                    <button
                      type="button"
                      onClick={() => setActiveLightboxImage(order.fuelRefuelingReceiptPhoto || null)}
                      className="border border-zinc-200 rounded-lg overflow-hidden bg-white hover:shadow-xs transition-shadow flex items-center gap-1.5 p-1 px-2 text-[10px] font-bold text-zinc-700 cursor-zoom-in"
                    >
                      <img src={order.fuelRefuelingReceiptPhoto} alt="Recibo de Gasolina" className="h-6 w-6 object-cover rounded" />
                      Visualizar
                    </button>
                  </div>
                )}
              </div>
            )}

            {order.labor.some((item) => item.isOptional) && (
              <div className="mt-3 space-y-2">
                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 print:text-zinc-500">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  Serviços Opcionais
                </h4>
                <div className="border border-zinc-100 rounded-xl overflow-hidden bg-white print:border-zinc-200">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider print:border-zinc-200 print:text-zinc-700">
                        <th className="py-1.5 px-3">Descrição</th>
                        <th className="py-1.5 px-2">Técnico</th>
                        <th className="py-1.5 px-2 w-20 text-center">Horas</th>
                        <th className="py-1.5 px-2 w-36 text-center">Cronômetro</th>
                        <th className="py-1.5 px-2 w-28 text-right">R$ / Hora</th>
                        <th className="py-1.5 px-3 w-28 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.labor
                        .filter((item) => item.isOptional)
                        .map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-zinc-100 hover:bg-zinc-50/50 text-amber-600 bg-amber-50/5 italic animate-fade-in print:text-zinc-650 print:border-zinc-200"
                          >
                            <td className="py-1.5 px-3 font-semibold">
                              {item.name} <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-1 rounded uppercase print:inline-block print:ml-1">Opcional</span>
                            </td>
                            <td className="py-1.5 px-2 font-medium">{item.technician}</td>
                            <td className="py-1.5 px-2 text-center font-medium">{item.hours}h</td>
                            <td className="py-1.5 px-2 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded leading-none ${
                                  item.timerStartedAt 
                                    ? "bg-emerald-500/10 text-emerald-600 animate-pulse border border-emerald-200" 
                                    : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                                }`}>
                                  {getLaborTrackedTime(item)}
                                </span>
                                
                                {order.status !== "encerrado" && (
                                  <button
                                    type="button"
                                    disabled={togglingTimerId === item.id}
                                    onClick={() => handleToggleTimer(item.id)}
                                    className={`p-1 rounded transition-colors cursor-pointer border leading-none ${
                                      item.timerStartedAt
                                        ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
                                        : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                                    } disabled:opacity-50 print:hidden`}
                                    title={item.timerStartedAt ? "Pausar Serviço" : "Iniciar Serviço"}
                                  >
                                    {item.timerStartedAt ? (
                                      <Pause className="h-3 w-3 fill-current" />
                                    ) : (
                                      <Play className="h-3 w-3 fill-current" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-1.5 px-2 text-right font-medium">{formatCurrency(item.hourlyRate)}</td>
                            <td className="py-1.5 px-3 text-right font-bold">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Parts */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-1">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Package className="h-4 w-4 text-zinc-400" />
                Peças / Insumos Aplicados
              </h3>
              {order.partsGeneralTechnician && (
                <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-50 border border-zinc-150 px-2 py-0.5 rounded-md">
                  Técnico Responsável Geral: <strong className="text-zinc-800 font-bold">{order.partsGeneralTechnician}</strong>
                </span>
              )}
            </div>
            {order.parts.filter((item) => !item.isOptional).length === 0 ? (
              <p className="text-xs text-zinc-400 italic">Nenhuma peça principal registrada.</p>
            ) : (
              <div className="border border-zinc-100 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="py-1.5 px-3">Descrição</th>
                      <th className="py-1.5 px-2 w-24">Código</th>
                      <th className="py-1.5 px-2">Técnico</th>
                      <th className="py-1.5 px-2 w-16 text-center">Qtd</th>
                      <th className="py-1.5 px-2 w-28 text-right">R$ Venda</th>
                      <th className="py-1.5 px-3 w-28 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.parts
                      .filter((item) => !item.isOptional)
                      .map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-zinc-100 hover:bg-zinc-50/50 text-zinc-700"
                        >
                          <td className="py-1.5 px-3">
                            <div className="font-bold">
                              {item.name}
                            </div>
                            {(item.brand || item.specifications || item.measurements) && (
                              <div className="text-[10px] text-zinc-400 font-semibold mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 leading-tight">
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
                          <td className="py-1.5 px-2 font-mono text-[10px] text-zinc-500">{item.code || "-"}</td>
                          <td className="py-1.5 px-2 font-medium">{item.technician}</td>
                          <td className="py-1.5 px-2 text-center font-medium">{item.quantity}</td>
                          <td className="py-1.5 px-2 text-right font-medium">{formatCurrency(item.salePrice)}</td>
                          <td className="py-1.5 px-3 text-right font-bold">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {order.parts.some((item) => item.isOptional) && (
              <div className="mt-3 space-y-2">
                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 print:text-zinc-500">
                  <Package className="h-3.5 w-3.5 text-zinc-400" />
                  Peças Opcionais
                </h4>
                <div className="border border-zinc-100 rounded-xl overflow-hidden bg-white print:border-zinc-200">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider print:border-zinc-200 print:text-zinc-700">
                        <th className="py-1.5 px-3">Descrição</th>
                        <th className="py-1.5 px-2 w-24">Código</th>
                        <th className="py-1.5 px-2">Técnico</th>
                        <th className="py-1.5 px-2 w-16 text-center">Qtd</th>
                        <th className="py-1.5 px-2 w-28 text-right">R$ Venda</th>
                        <th className="py-1.5 px-3 w-28 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.parts
                        .filter((item) => item.isOptional)
                        .map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-zinc-100 hover:bg-zinc-50/50 text-amber-600 bg-amber-50/5 italic animate-fade-in print:text-zinc-650 print:border-zinc-200"
                          >
                            <td className="py-1.5 px-3">
                              <div className="font-semibold">
                                {item.name} <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-1 rounded uppercase print:inline-block print:ml-1">Opcional</span>
                              </div>
                              {(item.brand || item.specifications || item.measurements) && (
                                <div className="text-[10px] text-zinc-400 font-semibold mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 leading-tight">
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
                            <td className="py-1.5 px-2 font-mono text-[10px] text-zinc-500">{item.code || "-"}</td>
                            <td className="py-1.5 px-2 font-medium">{item.technician}</td>
                            <td className="py-1.5 px-2 text-center font-medium">{item.quantity}</td>
                            <td className="py-1.5 px-2 text-right font-medium">{formatCurrency(item.salePrice)}</td>
                            <td className="py-1.5 px-3 text-right font-bold">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Technical Diagnosis Report */}
        {(order.technicalReport || order.internalNotes) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-zinc-100 pt-6 print:grid-cols-2 print:gap-4">
            {order.technicalReport && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider print:text-zinc-500">Laudo Técnico Oficial</h4>
                <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-xs font-semibold text-zinc-700 leading-relaxed whitespace-pre-line print:bg-transparent print:border-none print:p-0">
                  {order.technicalReport}
                </div>
              </div>
            )}
            {order.internalNotes && (
              <div className="space-y-2 print:hidden">
                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1 text-red-500">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Observações Internas (Privado)
                </h4>
                <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-xs font-semibold text-zinc-600 leading-relaxed whitespace-pre-line">
                  {order.internalNotes}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Financial Breakdown & Summary */}
        <div className="border-t border-zinc-100 pt-6 flex flex-col md:flex-row gap-6 justify-between items-start print:flex-row print:gap-4 print:pt-4">
          {/* Timeline Dates */}
          <div className="space-y-3 text-xs w-full md:max-w-xs font-medium text-zinc-500 print:max-w-xs">
            <div className="flex items-center justify-between">
              <span>Data de Entrada:</span>
              <span className="font-bold text-zinc-700">{formatDate(order.entryDate)}</span>
            </div>
            {order.readyDate && (
              <div className="flex items-center justify-between">
                <span>Previsão de Entrega:</span>
                <span className="font-bold text-zinc-700">{formatDateOnly(order.readyDate)}</span>
              </div>
            )}
            {order.status === "encerrado" && order.exitDate && (
              <div className="flex items-center justify-between bg-zinc-50 px-2 py-1.5 rounded-lg border border-zinc-100 font-bold text-zinc-700 print:bg-transparent print:border-none print:p-0">
                <span className="flex items-center gap-1 text-emerald-600 print:text-emerald-700">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  Entregue em:
                </span>
                <span>{formatDate(order.exitDate)}</span>
              </div>
            )}
          </div>

          {/* Prices calculation HUD */}
          <div className="bg-zinc-950 rounded-2xl p-4.5 text-white w-full md:max-w-md space-y-3.5 shadow-md relative overflow-hidden print:bg-white print:text-zinc-950 print:border print:border-zinc-200 print:shadow-none print:p-4 print:max-w-none print:w-96 print:ml-auto">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px)] bg-[size:100px] opacity-10 print:hidden" />

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-zinc-400 font-semibold print:text-zinc-700">
                <span>Total de Serviços</span>
                <span>
                  {order.labor
                    .reduce((acc, curr) => acc + (curr.isOptional ? 0 : curr.total), 0)
                    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>

              <div className="flex justify-between text-zinc-400 font-semibold">
                <span>Total de Peças</span>
                <span>
                  {order.parts
                    .reduce((acc, curr) => acc + (curr.isOptional ? 0 : curr.total), 0)
                    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>

              {order.towingFee > 0 && (
                <div className="flex justify-between text-zinc-400 font-semibold">
                  <span>Taxa de Guincho</span>
                  <span>{formatCurrency(order.towingFee)}</span>
                </div>
              )}

              {order.fuelRefuelingValue > 0 && (
                <div className="flex justify-between text-zinc-400 font-semibold">
                  <span>Abastecimento de Combustível</span>
                  <span>{formatCurrency(order.fuelRefuelingValue)}</span>
                </div>
              )}

              {order.otherCharges !== 0 && (
                <div className="flex justify-between text-zinc-400 font-semibold">
                  <span>Outros Adicionais/Créditos</span>
                  <span className={order.otherCharges < 0 ? "text-emerald-400" : ""}>
                    {formatCurrency(order.otherCharges)}
                  </span>
                </div>
              )}

              {order.discounts > 0 && (
                <div className="flex justify-between text-red-400 font-semibold">
                  <span>Desconto Aplicado</span>
                  <span>-{formatCurrency(order.discounts)}</span>
                </div>
              )}

              <div className="border-t border-zinc-900 pt-3 flex justify-between font-bold text-zinc-200">
                <span>Valor Total da O.S</span>
                <span>{formatCurrency(order.totalValue)}</span>
              </div>

              {/* Payments log sub-ledger */}
              {order.payments.length > 0 && (
                <>
                  <div className="border-t border-zinc-900 pt-2 flex justify-between text-[11px] text-zinc-400 font-semibold">
                    <span>Adiantamentos Pagos</span>
                    <span>{formatCurrency(totalPaid)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-amber-500">
                    <span>Saldo a Pagar</span>
                    <span>{formatCurrency(balanceDue)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Grand final summary */}
            <div className="border-t border-zinc-850 pt-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total a Quitar</span>
              <span className="text-xl font-extrabold text-white">
                {formatCurrency(balanceDue)}
              </span>
            </div>
          </div>
        </div>

        {/* Print-Exclusive Terms & Signatures */}
        <div className="hidden print:block border-t border-zinc-200 pt-6 mt-6 break-inside-avoid">
          <div className="text-[9px] text-zinc-500 leading-relaxed space-y-1 text-justify font-medium">
            <p>
              <strong>Termo de Responsabilidade e Autorização:</strong> Autorizo a realização dos serviços descritos neste documento, bem como a aplicação das peças listadas. Declaro estar ciente de que as peças opcionais não incluídas na execução final não constarão na garantia deste serviço. Os prazos de entrega informados são estimativas sujeitas a alterações dependendo da disponibilidade de peças de reposição e da complexidade dos serviços.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-12 mt-12 pt-4">
            <div className="text-center space-y-1">
              <div className="border-t border-zinc-400 mx-auto w-48 pt-1" />
              <p className="text-[9px] font-bold text-zinc-800">ASSINATURA DO CLIENTE</p>
              <p className="text-[8px] text-zinc-400">{order.client.name}</p>
            </div>
            <div className="text-center space-y-1">
              <div className="border-t border-zinc-400 mx-auto w-48 pt-1" />
              <p className="text-[9px] font-bold text-zinc-800">AGUS MOTO CONCEITO</p>
              <p className="text-[8px] text-zinc-400">Responsável Técnico</p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CLOSE/ENCERRAR O.S. (Confirm payments & delivery) */}
      {showCloseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-white rounded-2xl border border-zinc-150 p-6 max-w-md w-full shadow-2xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                Encerrar Ordem de Serviço
              </h3>
              <p className="text-xs text-zinc-400 mt-1 font-semibold">
                O.S. #{String(order.osNumber).padStart(4, "0")} · {order.client.name}
              </p>
            </div>

            {/* Financial ledger overview */}
            <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 space-y-2.5 text-xs text-zinc-700 font-medium">
              <div className="flex justify-between">
                <span>Valor Total da OS:</span>
                <span className="font-bold text-zinc-900">{formatCurrency(order.totalValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total já Pago:</span>
                <span className="font-bold text-emerald-600">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-2 text-sm text-zinc-900 font-extrabold">
                <span>Saldo Pendente:</span>
                <span className="text-amber-600">{formatCurrency(balanceDue)}</span>
              </div>
            </div>

            {/* Record Final payment */}
            {balanceDue > 0 && (
              <div className="space-y-3.5 border-t border-zinc-100 pt-4">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Registrar Pagamento Final</p>
                <div className="space-y-3">
                  {/* Amount */}
                  <div className="space-y-1">
                    <label htmlFor="modal-pay-amount" className="text-[10px] font-bold text-zinc-400 uppercase">Valor R$</label>
                    <input
                      id="modal-pay-amount"
                      type="number"
                      placeholder="0,00"
                      value={finalPaymentAmount}
                      onChange={(e) => setFinalPaymentAmount(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 font-bold focus:outline-none"
                    />
                  </div>

                  {/* Method */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label htmlFor="modal-pay-method" className="text-[10px] font-bold text-zinc-400 uppercase">Método</label>
                      <select
                        id="modal-pay-method"
                        value={finalPaymentMethod}
                        onChange={(e) => setFinalPaymentMethod(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-750 font-bold focus:outline-none"
                      >
                        {["PIX", "Cartão de Crédito", "Cartão de Débito", "Dinheiro", "Boleto"].map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Account */}
                    <div className="space-y-1">
                      <label htmlFor="modal-pay-account" className="text-[10px] font-bold text-zinc-400 uppercase">Conta</label>
                      <select
                        id="modal-pay-account"
                        value={finalPaymentAccount}
                        onChange={(e) => setFinalPaymentAccount(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-750 font-bold focus:outline-none"
                      >
                        {FINANCIAL_ACCOUNTS.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Exit/Delivery Date */}
            <div className="space-y-1.5">
              <label htmlFor="modal-exit-date" className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                Data de Saída / Entrega da Moto
              </label>
              <input
                id="modal-exit-date"
                type="date"
                value={exitDate}
                onChange={(e) => setExitDate(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 focus:outline-none"
              />
            </div>

            {/* Confirm buttons */}
            <div className="flex gap-2.5 border-t border-zinc-100 pt-4">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                disabled={isSubmittingClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-650 hover:bg-zinc-50 font-bold text-xs tracking-wider transition-colors cursor-pointer"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseOS}
                disabled={isSubmittingClose}
                className="flex-1 bg-zinc-950 hover:bg-zinc-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingClose ? (
                  <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                ) : (
                  <>✓ ENCERRAR E ENTREGAR</>
                )}
              </button>
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
    </div>
  );
}
