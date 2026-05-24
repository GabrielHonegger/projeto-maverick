"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { FaMotorcycle } from "react-icons/fa6";
import { ServiceOrderWithRelations, PaymentItem, LaborItem } from "@/types";
import MotorcycleDamageSelector from "./MotorcycleDamageSelector";
import { toggleLaborTimerAction } from "@/app/actions";
import { toast } from "@/components/ui/toast";

const FINANCIAL_ACCOUNTS = ["Caixa Interno da Oficina", "Conta Corrente Itaú", "Conta PJ Nubank"];

interface ServiceOrderDetailsProps {
  order: ServiceOrderWithRelations;
  onBack: () => void;
  onEdit: () => void;
  onCloseOS: (
    id: string,
    status: "encerrado",
    readyDate?: string,
    exitDate?: string,
    finalPayments?: PaymentItem[]
  ) => Promise<void>;
  onUpdateOrder: (order: ServiceOrderWithRelations) => void;
}

export default function ServiceOrderDetails({
  order,
  onBack,
  onEdit,
  onCloseOS,
  onUpdateOrder,
}: ServiceOrderDetailsProps) {
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [exitDate, setExitDate] = useState(new Date().toISOString().split("T")[0]);
  const [finalPaymentAmount, setFinalPaymentAmount] = useState("");
  const [finalPaymentMethod, setFinalPaymentMethod] = useState("PIX");
  const [finalPaymentAccount, setFinalPaymentAccount] = useState("Caixa Interno da Oficina");
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);

  // Live stopwatch ticking state
  const [ticker, setTicker] = useState(0);
  const [togglingTimerId, setTogglingTimerId] = useState<string | null>(null);

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
      onUpdateOrder(res.serviceOrder);
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
            Orçamento em Andamento
          </span>
        );
      case "aguardando_aprovacao":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            Aguardando Aprovação
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

      await onCloseOS(order.id, "encerrado", order.readyDate, exitDate, updatedPayments);
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
            Imprimir Recibo
          </button>

          {order.status !== "encerrado" && (
            <>
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 text-zinc-800 hover:bg-zinc-50 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Edit className="h-4 w-4" />
                Editar O.S
              </button>
              
              <button
                onClick={handleOpenCloseModal}
                className="flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
              >
                <CheckCircle className="h-4 w-4" />
                Encerrar O.S / Entregar Moto
              </button>
            </>
          )}
        </div>
      </div>

      {/* Printable Area Wrapper */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-4 sm:p-5.5 shadow-sm space-y-5.5 print:border-none print:shadow-none print:p-0">
        {/* Receipt Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 pb-3.5">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-zinc-100 pb-6">
          {/* Client Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <User className="h-4 w-4 text-zinc-400" />
              Cliente (Responsável)
            </h3>
            <div className="bg-zinc-50/50 rounded-xl border border-zinc-100 p-3 space-y-1.5 text-xs">
              <p className="font-bold text-zinc-800 text-sm">{order.client.name}</p>
              {order.client.nickname && (
                <p className="text-zinc-500 font-semibold">Apelido: {order.client.nickname}</p>
              )}
              <p className="text-zinc-600 font-medium">CPF: {order.client.cpf}</p>
              <p className="text-zinc-650 font-medium">Telefone: {order.client.phone}</p>
              <p className="text-zinc-500 text-[11px] leading-relaxed pt-1.5 border-t border-zinc-200/50">
                Endereço: {order.client.address.street}, Nº {order.client.address.number}
                {order.client.address.complement && ` - ${order.client.address.complement}`}
                <br />
                CEP: {order.client.address.cep}
              </p>
            </div>
          </div>

          {/* Bike Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <FaMotorcycle className="h-4 w-4 text-zinc-400" />
              Motocicleta
            </h3>
            <div className="bg-zinc-50/50 rounded-xl border border-zinc-100 p-3 space-y-1.5 text-xs">
              <p className="font-bold text-zinc-800 text-sm">
                {order.motorbike.brand} {order.motorbike.model}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1 text-zinc-600 font-medium">
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
          <div className="bg-amber-50/20 border border-amber-100/50 rounded-xl p-3 text-xs font-semibold text-zinc-800 leading-relaxed italic">
            "{order.customerComplaints}"
          </div>
        </div>

        {/* Checklist & Inspection Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Wrench className="h-4 w-4 text-zinc-400" />
            Vistoria de Entrada (Checklist)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-zinc-50/60 rounded-xl p-3 border border-zinc-100 flex items-center justify-between">
              <span className="text-zinc-500 font-semibold">Odômetro:</span>
              <span className="font-bold text-zinc-800">{order.odometer}</span>
            </div>
            <div className="bg-zinc-50/60 rounded-xl p-3 border border-zinc-100 flex items-center justify-between">
              <span className="text-zinc-500 font-semibold">Nível Combustível:</span>
              <span className="font-bold text-zinc-800 uppercase">{order.fuelLevel}</span>
            </div>
            <div className="bg-zinc-50/60 rounded-xl p-3 border border-zinc-100 flex items-center justify-between">
              <span className="text-zinc-500 font-semibold">Pneus (D / T):</span>
              <span className="font-bold text-zinc-800 uppercase">
                {order.tiresCondition.front} / {order.tiresCondition.rear}
              </span>
            </div>
          </div>

          {/* Accessories Checklist display */}
          <div className="bg-zinc-50/40 rounded-xl border border-zinc-100 p-3 space-y-1.5">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Acessórios Entregues:</p>
            {order.accessories.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">Nenhum acessório entregue.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {order.accessories.map((acc) => (
                  <span
                    key={acc}
                    className="inline-flex items-center gap-1 bg-zinc-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md"
                  >
                    ✓ {acc}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Damage Map Viewer */}
          <div className="bg-zinc-50/20 border border-zinc-100 rounded-xl p-3">
            <MotorcycleDamageSelector damagePoints={order.damagePoints} onChange={() => {}} readOnly={true} />
          </div>

          {/* General Electrical & Mechanical Remarks */}
          {(order.electricalProblems || order.maintenanceProblems) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {order.electricalProblems && (
                <div className="bg-zinc-50/60 rounded-xl border border-zinc-100 p-3">
                  <p className="font-bold text-zinc-700 mb-1">Avarias Elétricas:</p>
                  <p className="text-zinc-600 leading-relaxed font-semibold">{order.electricalProblems}</p>
                </div>
              )}
              {order.maintenanceProblems && (
                <div className="bg-zinc-50/60 rounded-xl border border-zinc-100 p-3">
                  <p className="font-bold text-zinc-700 mb-1">Avarias Mecânicas/Gerais:</p>
                  <p className="text-zinc-600 leading-relaxed font-semibold">{order.maintenanceProblems}</p>
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
                  <a
                    key={photo.url}
                    href={photo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-zinc-150 rounded-xl overflow-hidden bg-zinc-50 group hover:shadow-sm transition-all"
                  >
                    <img src={photo.url} alt={photo.notes || "Inspeção"} className="w-full h-20 object-cover" />
                    <div className="p-2 text-[10px] font-bold text-zinc-700 truncate">
                      {photo.notes || "Sem notas"}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Labor and Parts Ledger */}
        <div className="space-y-6">
          {/* Services */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-400" />
              Serviços Prestados
            </h3>
            {order.labor.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">Nenhum serviço registrado.</p>
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
                    {order.labor.map((item) => (
                      <tr
                        key={item.id}
                        className={`border-b border-zinc-100 hover:bg-zinc-50/50 ${
                          item.isOptional ? "text-amber-600 bg-amber-50/10 italic" : "text-zinc-700"
                        }`}
                      >
                        <td className="py-1.5 px-3 font-bold">
                          {item.name} {item.isOptional && " (Opcional)"}
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
          </div>

          {/* Parts */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Package className="h-4 w-4 text-zinc-400" />
              Peças / Insumos Aplicados
            </h3>
            {order.parts.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">Nenhuma peça registrada.</p>
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
                    {order.parts.map((item) => (
                      <tr
                        key={item.id}
                        className={`border-b border-zinc-100 hover:bg-zinc-50/50 ${
                          item.isOptional ? "text-amber-600 bg-amber-50/10 italic" : "text-zinc-700"
                        }`}
                      >
                        <td className="py-1.5 px-3">
                          <div className="font-bold">
                            {item.name} {item.isOptional && " (Opcional)"}
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
          </div>
        </div>

        {/* Technical Diagnosis Report */}
        {(order.technicalReport || order.internalNotes) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-zinc-100 pt-6">
            {order.technicalReport && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Laudo Técnico Oficial</h4>
                <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-xs font-semibold text-zinc-700 leading-relaxed whitespace-pre-line">
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
        <div className="border-t border-zinc-100 pt-6 flex flex-col md:flex-row gap-6 justify-between items-start">
          {/* Timeline Dates */}
          <div className="space-y-3 text-xs w-full md:max-w-xs font-medium text-zinc-500">
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
              <div className="flex items-center justify-between bg-zinc-50 px-2 py-1.5 rounded-lg border border-zinc-100 font-bold text-zinc-700">
                <span className="flex items-center gap-1 text-emerald-600">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  Entregue em:
                </span>
                <span>{formatDate(order.exitDate)}</span>
              </div>
            )}
          </div>

          {/* Prices calculation HUD */}
          <div className="bg-zinc-950 rounded-2xl p-4.5 text-white w-full md:max-w-md space-y-3.5 shadow-md relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px)] bg-[size:100px] opacity-10" />

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-zinc-400 font-semibold">
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
    </div>
  );
}
